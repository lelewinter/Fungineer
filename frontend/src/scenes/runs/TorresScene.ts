import { Graphics } from 'pixi.js';
import { Scene } from '../../core/Scene';
import { audioManager } from '../../core/AudioManager';
import { Color } from '../../core/Color';
import { GameConfig } from '../../state/GameConfig';
import { HubState } from '../../state/HubState';
import { ZONES } from '../../state/Zones';
import { RunJuice } from '../../run/fx/RunJuice';
import { buildHud, buildEndOverlay, type RunHud } from './RunFrame';

const VW = GameConfig.VIEWPORT_WIDTH;
const VH = GameConfig.VIEWPORT_HEIGHT;
const ZONE = ZONES[9]!;

const FOOT = 70;
const STORY_H = 70;
const STORY_COUNT = 8;
const PLAYER_W = 14;
const PLAYER_H = 18;
const MOVE_SPEED = 130;
const CLIMB_SPEED = 90;
const BARREL_FALL = 60;
const BARREL_ROLL = 70;
const TIMER = 80;

interface Barrel { x: number; y: number; dir: 1 | -1; falling: boolean; landed: boolean }
interface Ladder { x: number; storyTop: number }
interface Floor { y: number; xStart: number; xEnd: number; slope: number }

/** TORRES — Donkey Kong. Vertical tower with girder-floors and ladders.
 *  Drag left/right to walk; drag-up over a ladder to climb. Avoid the
 *  rolling barrels that spawn from the top. Reach the rooftop. */
export class TorresScene extends Scene {
  private bg = new Graphics();
  private floorsG = new Graphics();
  private laddersG = new Graphics();
  private barrelsG = new Graphics();
  private playerG = new Graphics();
  private hud!: RunHud;
  private juice!: RunJuice;

  private floors: Floor[] = [];
  private ladders: Ladder[] = [];
  private barrels: Barrel[] = [];

  private px = VW / 2;
  private py = 0; // story-relative; 0 = ground (bottom)
  private storyIdx = 0;
  private climbing = false;
  private barrelTimer = 2;
  private elapsed = 0;
  private timeLeft = TIMER;
  private ended = false;
  private cameraY = 0;
  private targetCameraY = 0;
  private dragging = false;
  private dragPos = { x: 0, y: 0 };
  private cleanup: (() => void) | null = null;

  override async enter(): Promise<void> {
    this.bg.rect(0, 0, VW, VH).fill({ color: 0x05070b });
    // Skyscraper silhouette behind.
    for (let i = 0; i < 8; i++) {
      const x = (i * 67) % VW;
      const w = 30 + ((i * 13) % 50);
      const h = 200 + ((i * 91) % 300);
      this.bg.rect(x, VH - h, w, h).fill({ color: 0x0a1018, alpha: 0.5 });
    }
    this.root.addChild(this.bg);

    this.buildTower();
    this.root.addChild(this.floorsG);
    this.root.addChild(this.laddersG);
    this.root.addChild(this.barrelsG);
    this.root.addChild(this.playerG);

    this.juice = new RunJuice(this.root, { accent: Color.hex(ZONE.accent_color), ambient: 22, shakeTarget: null });

    this.hud = buildHud(ZONE);
    this.root.addChild(this.hud.container);
    this.hud.setStatus('escalada');

    this.bindPointer();
    this.drawStatic();

    if (ZONE.music) {
      audioManager.playMusic(ZONE.music, { loop: true, volume: 0.3, fadeMs: 400 }).catch(() => undefined);
    }
  }

  override exit(): void {
    audioManager.stopMusic(300);
    this.cleanup?.();
    this.juice.destroy();
  }

  /** Player position in screen space (the game layers scroll by -cameraY). */
  private screenPlayer(): { x: number; y: number } {
    return { x: this.px, y: this.worldPlayerY() - this.cameraY - PLAYER_H / 2 };
  }

  override update(dt: number): void {
    const d = Math.min(dt, 1 / 30);
    this.juice.update(d);
    if (this.ended) return;
    this.elapsed += d;
    this.timeLeft -= d;
    if (this.timeLeft <= 0) { this.end(this.storyIdx >= STORY_COUNT - 2); return; }

    this.tickPlayer(d);
    this.tickBarrels(d);

    // Reach top.
    if (this.storyIdx >= STORY_COUNT - 1) { this.end(true); return; }

    // Camera follows player upward.
    this.targetCameraY = Math.max(0, this.worldPlayerY() - VH * 0.6);
    this.cameraY += (this.targetCameraY - this.cameraY) * Math.min(1, 6 * d);
    this.floorsG.y = -this.cameraY;
    this.laddersG.y = -this.cameraY;
    this.barrelsG.y = -this.cameraY;
    this.playerG.y = -this.cameraY;

    this.drawDynamic();
    this.hud.setTimer(this.timeLeft);
    this.hud.setScore(`andar ${this.storyIdx + 1}/${STORY_COUNT}`);
    this.hud.setHealth(this.storyIdx / (STORY_COUNT - 1));
  }

  private worldPlayerY(): number {
    return (VH - FOOT) - (this.storyIdx * STORY_H) - this.py;
  }

  private buildTower(): void {
    // Each story: a floor with a slope and one ladder up.
    for (let i = 0; i < STORY_COUNT; i++) {
      const slope = i === STORY_COUNT - 1 ? 0 : (i % 2 === 0 ? 1 : -1);
      const y = (VH - FOOT) - i * STORY_H;
      this.floors.push({ y, xStart: 16, xEnd: VW - 16, slope });
      if (i < STORY_COUNT - 1) {
        const lx = i % 2 === 0 ? VW - 50 : 38;
        this.ladders.push({ x: lx, storyTop: i });
      }
    }
  }

  private floorYAt(story: number, x: number): number {
    const f = this.floors[story];
    if (!f) return VH;
    const t = (x - f.xStart) / (f.xEnd - f.xStart);
    return f.y - f.slope * 8 * (t - 0.5) * 2;
  }

  private tickPlayer(dt: number): void {
    if (this.climbing) {
      // Vertical movement.
      if (this.dragging) {
        const dy = this.dragPos.y - this.worldPlayerY();
        if (Math.abs(dy) > 6) {
          this.py += (dy < 0 ? 1 : -1) * CLIMB_SPEED * dt;
        }
      }
      if (this.py >= STORY_H - 4) {
        this.py = 0;
        this.storyIdx += 1;
        this.climbing = false;
        const sp = this.screenPlayer();
        this.juice.pop(sp.x, sp.y);
      } else if (this.py <= 0) {
        this.py = 0;
        this.climbing = false;
      }
    } else {
      // Horizontal movement.
      if (this.dragging) {
        const dx = this.dragPos.x - this.px;
        if (Math.abs(dx) > 4) {
          this.px += (dx > 0 ? 1 : -1) * MOVE_SPEED * dt;
          this.px = Math.max(20, Math.min(VW - 20, this.px));
        }
        // Climb ladder if drag-direction is largely vertical and near a ladder.
        const ladder = this.ladders[this.storyIdx];
        if (ladder && Math.abs(this.px - ladder.x) < 16) {
          const dy = this.dragPos.y - this.worldPlayerY();
          if (dy < -12) {
            this.climbing = true;
            this.px = ladder.x;
          }
        }
      }
    }
  }

  private tickBarrels(dt: number): void {
    this.barrelTimer -= dt;
    if (this.barrelTimer <= 0) {
      const topY = this.floors[STORY_COUNT - 1]!.y - 18;
      this.barrels.push({ x: VW / 2, y: topY, dir: Math.random() < 0.5 ? -1 : 1, falling: false, landed: false });
      this.barrelTimer = 2.5 + Math.random() * 1.5;
    }

    const alive: Barrel[] = [];
    for (const b of this.barrels) {
      // Determine which story it's on.
      let onStory = -1;
      for (let i = 0; i < STORY_COUNT; i++) {
        const fy = this.floorYAt(i, b.x);
        if (Math.abs(b.y - (fy - 6)) < 10) { onStory = i; break; }
      }
      if (onStory >= 0 && !b.falling) {
        const fy = this.floorYAt(onStory, b.x);
        b.y = fy - 6;
        b.x += b.dir * BARREL_ROLL * dt;
        // Reached edge → fall.
        if (b.x < 24 || b.x > VW - 24) {
          b.falling = true;
        }
      } else {
        b.y += BARREL_FALL * dt;
        // Landed on a lower story?
        for (let i = 0; i < STORY_COUNT; i++) {
          const fy = this.floorYAt(i, b.x);
          if (Math.abs(b.y - (fy - 6)) < 4 && b.x >= 24 && b.x <= VW - 24) {
            b.y = fy - 6;
            b.falling = false;
            b.dir = b.dir === 1 ? -1 : 1;
            break;
          }
        }
      }
      // Off screen → drop.
      if (b.y > VH + 100) continue;
      // Player hit?
      const pY = this.worldPlayerY();
      if (!this.climbing && Math.abs(b.x - this.px) < 12 && Math.abs(b.y - (pY - PLAYER_H / 2)) < 14) {
        const sp = this.screenPlayer();
        this.juice.hurt(sp.x, sp.y);
        this.end(false);
        return;
      }
      alive.push(b);
    }
    this.barrels = alive;
  }

  private bindPointer(): void {
    const canvas = this.app.pixi.canvas;
    const toLocal = (e: PointerEvent): { x: number; y: number } => {
      const rect = canvas.getBoundingClientRect();
      const scale = this.app.world.scale.x || 1;
      return {
        x: (e.clientX - rect.left - this.app.world.x) / scale,
        y: (e.clientY - rect.top - this.app.world.y) / scale + this.cameraY,
      };
    };
    const onDown = (e: PointerEvent): void => { this.dragging = true; this.dragPos = toLocal(e); };
    const onMove = (e: PointerEvent): void => { if (this.dragging) this.dragPos = toLocal(e); };
    const onUp = (): void => { this.dragging = false; };
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onUp);
    this.cleanup = (): void => {
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onUp);
    };
  }

  private drawStatic(): void {
    const accent = Color.hex(ZONE.accent_color);
    this.floorsG.clear();
    for (let i = 0; i < this.floors.length; i++) {
      const f = this.floors[i]!;
      const xs = f.xStart;
      const xe = f.xEnd;
      const ys = f.y;
      const ye = f.y - f.slope * 8;
      this.floorsG.moveTo(xs, ys).lineTo(xe, ye).stroke({ color: 0x8a5a2a, width: 6, alpha: 0.95 });
      this.floorsG.moveTo(xs, ys + 2).lineTo(xe, ye + 2).stroke({ color: 0x4a2a10, width: 2, alpha: 0.7 });
      if (i === STORY_COUNT - 1) {
        // Rooftop glow.
        this.floorsG.rect(xs, ys - 8, xe - xs, 4).fill({ color: accent, alpha: 0.6 });
      }
    }
    this.laddersG.clear();
    for (const l of this.ladders) {
      const top = this.floorYAt(l.storyTop, l.x);
      const bot = this.floorYAt(l.storyTop + 1, l.x);
      this.laddersG.rect(l.x - 8, bot, 2, top - bot + 4).fill({ color: 0xb09060, alpha: 0.9 });
      this.laddersG.rect(l.x + 6, bot, 2, top - bot + 4).fill({ color: 0xb09060, alpha: 0.9 });
      for (let yy = top + 4; yy < bot; yy += 8) {
        this.laddersG.rect(l.x - 8, yy, 14, 2).fill({ color: 0xb09060, alpha: 0.8 });
      }
    }
  }

  private drawDynamic(): void {
    const accent = Color.hex(ZONE.accent_color);
    this.barrelsG.clear();
    for (const b of this.barrels) {
      this.barrelsG.circle(b.x, b.y, 9).fill({ color: 0xc24d4d, alpha: 0.95 });
      this.barrelsG.circle(b.x, b.y, 9).stroke({ color: 0x000000, width: 1, alpha: 0.4 });
      this.barrelsG.rect(b.x - 8, b.y - 1, 16, 2).fill({ color: 0x000000, alpha: 0.4 });
    }
    this.playerG.clear();
    const py = this.worldPlayerY();
    this.playerG.rect(this.px - PLAYER_W / 2, py - PLAYER_H, PLAYER_W, PLAYER_H)
      .fill({ color: accent, alpha: 0.95 });
    this.playerG.circle(this.px, py - PLAYER_H - 4, 5).fill({ color: accent });
    this.playerG.rect(this.px - 4, py - PLAYER_H + 2, 8, 4).fill({ color: 0xffffff, alpha: 0.7 });
  }

  private end(victory: boolean): void {
    if (this.ended) return;
    this.ended = true;
    if (victory) this.juice.victoryFx(); else this.juice.defeatFx();
    const reward = this.storyIdx;
    if (victory && reward > 0) {
      HubState.depositFlow('ai_components', reward);
    }
    HubState.onRunEnded(victory);
    this.root.addChild(buildEndOverlay({
      zone: ZONE,
      victory,
      rewardLabel: `+${reward} Comp. de IA`,
      failLabel: 'Barril te derrubou.',
    }));
  }
}
