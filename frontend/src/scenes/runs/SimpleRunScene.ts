import { Container, Graphics, Text } from 'pixi.js';
import { Scene } from '../../core/Scene';
import { sceneManager } from '../../core/SceneManager';
import { audioManager } from '../../core/AudioManager';
import { Color } from '../../core/Color';
import { FontFamily, TextColor } from '../../core/typography';
import { GameConfig } from '../../state/GameConfig';
import { HubState, type ResourceKey } from '../../state/HubState';
import { HubScene } from '../hub/HubScene';
import type { ZoneData } from '../../state/Zones';
import type { Vec2 } from '../../core/types';
import { PixiButton } from '../../ui/PixiButton';

const VW = GameConfig.VIEWPORT_WIDTH;
const VH = GameConfig.VIEWPORT_HEIGHT;

const PLAYER_R = 14;
const PLAYER_SPEED = 220;
const PICKUP_R = 12;
const COLLECT_DIST = 26;
const RUN_TIMER = 60;
const PLAYER_HP = 100;

interface Pickup { pos: Vec2; collected: boolean }
interface Hazard { pos: Vec2; r: number; dps: number }

/** Generic playable run shared by stealth/circuito/extracao/infeccao —
 *  the four zones whose Godot-era originals haven't been ported yet.
 *
 *  Loop: drag player around top-down map, collect pickups (counted in the
 *  bag), reach the EXIT zone to bank them. Timer or 0 HP ends the run. */
export class SimpleRunScene extends Scene {
  private zone: ZoneData;
  private resourceKey: ResourceKey;
  private hazardCount: number;
  private rewardPerPickup: number;

  private bg = new Graphics();
  private hazardG = new Graphics();
  private pickupG = new Graphics();
  private playerG = new Graphics();
  private exitG = new Graphics();
  private endOverlay = new Container();
  private hudBg = new Graphics();
  private timerLabel!: Text;
  private bagLabel!: Text;
  private hpLabel!: Text;
  private exitLabel!: Text;
  private titleLabel!: Text;

  private pickups: Pickup[] = [];
  private hazards: Hazard[] = [];
  private playerPos: Vec2 = { x: VW / 2, y: VH * 0.55 };
  private dragTarget: Vec2 = { x: VW / 2, y: VH * 0.55 };
  private dragging = false;
  private bag = 0;
  private hp = PLAYER_HP;
  private timeLeft = RUN_TIMER;
  private runEnded = false;
  private elapsed = 0;
  private exitRect = { x: VW / 2 - 60, y: VH - 200, w: 120, h: 56 };

  constructor(zone: ZoneData, opts: { resourceKey: ResourceKey; hazardCount?: number; rewardPerPickup?: number } ) {
    super();
    this.zone = zone;
    this.resourceKey = opts.resourceKey;
    this.hazardCount = opts.hazardCount ?? 3;
    this.rewardPerPickup = opts.rewardPerPickup ?? 1;
  }

  override async enter(): Promise<void> {
    const accent = Color.hex(this.zone.accent_color);

    // Background — deep dark with a faint accent vignette top.
    this.bg.rect(0, 0, VW, VH).fill({ color: 0x05080a });
    for (let i = 0; i < 14; i++) {
      const t = i / 14;
      this.bg.rect(0, t * 80, VW, 6).fill({ color: accent, alpha: 0.04 * (1 - t) });
    }
    // Floor grid
    for (let x = 0; x < VW; x += 32) this.bg.rect(x, 0, 1, VH).fill({ color: accent, alpha: 0.06 });
    for (let y = 0; y < VH; y += 32) this.bg.rect(0, y, VW, 1).fill({ color: accent, alpha: 0.06 });
    this.root.addChild(this.bg);

    // Spawn hazards (slow obstacle blobs the player should avoid).
    for (let i = 0; i < this.hazardCount; i++) {
      this.hazards.push({
        pos: { x: 60 + Math.random() * (VW - 120), y: 120 + Math.random() * (VH - 360) },
        r: 28,
        dps: 18,
      });
    }
    this.root.addChild(this.hazardG);

    // Spawn pickups
    const pickupCount = 6;
    for (let i = 0; i < pickupCount; i++) {
      this.pickups.push({
        pos: { x: 40 + Math.random() * (VW - 80), y: 110 + Math.random() * (VH - 360) },
        collected: false,
      });
    }
    this.root.addChild(this.pickupG);

    // Exit zone
    this.exitG.rect(this.exitRect.x, this.exitRect.y, this.exitRect.w, this.exitRect.h)
      .fill({ color: accent, alpha: 0.18 })
      .stroke({ color: accent, width: 2, alpha: 0.9 });
    this.root.addChild(this.exitG);
    this.exitLabel = new Text({
      text: 'EXIT — banca os recursos',
      style: { fontFamily: FontFamily.mono, fontSize: 10, fill: accent, letterSpacing: 1 },
    });
    this.exitLabel.anchor.set(0.5);
    this.exitLabel.x = this.exitRect.x + this.exitRect.w / 2;
    this.exitLabel.y = this.exitRect.y + this.exitRect.h / 2;
    this.root.addChild(this.exitLabel);

    this.root.addChild(this.playerG);

    // HUD
    this.hudBg.rect(0, 0, VW, 38).fill({ color: 0x0a0d0e, alpha: 0.85 })
      .rect(0, 38, VW, 1).fill({ color: accent, alpha: 0.6 });
    this.root.addChild(this.hudBg);

    this.titleLabel = new Text({
      text: this.zone.zone_name,
      style: { fontFamily: FontFamily.body, fontSize: 12, fill: accent, fontWeight: '700', letterSpacing: 2 },
    });
    this.titleLabel.x = 12;
    this.titleLabel.y = 13;
    this.root.addChild(this.titleLabel);

    this.timerLabel = new Text({
      text: '',
      style: { fontFamily: FontFamily.mono, fontSize: 11, fill: TextColor.ink, fontWeight: '600' },
    });
    this.timerLabel.anchor.set(1, 0);
    this.timerLabel.x = VW - 12;
    this.timerLabel.y = 6;
    this.root.addChild(this.timerLabel);

    this.bagLabel = new Text({
      text: '',
      style: { fontFamily: FontFamily.mono, fontSize: 11, fill: accent, fontWeight: '600' },
    });
    this.bagLabel.anchor.set(1, 0);
    this.bagLabel.x = VW - 12;
    this.bagLabel.y = 22;
    this.root.addChild(this.bagLabel);

    this.hpLabel = new Text({
      text: '',
      style: { fontFamily: FontFamily.mono, fontSize: 10, fill: TextColor.muted },
    });
    this.hpLabel.x = VW * 0.42;
    this.hpLabel.y = 14;
    this.root.addChild(this.hpLabel);

    this.refreshHud();

    // Drag input on the canvas — sceneManager wires events through pixi stage.
    const canvas = this.app.pixi.canvas;
    const onDown = (e: PointerEvent): void => { this.dragging = true; this.updateDragFromEvent(e); };
    const onMove = (e: PointerEvent): void => { if (this.dragging) this.updateDragFromEvent(e); };
    const onUp = (): void => { this.dragging = false; };
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onUp);
    this.cleanupHandlers = (): void => {
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onUp);
    };

    if (this.zone.music) {
      audioManager.playMusic(this.zone.music, { loop: true, volume: 0.3, fadeMs: 500 }).catch(() => undefined);
    }
  }

  override exit(): void {
    audioManager.stopMusic(300);
    this.cleanupHandlers?.();
  }

  private cleanupHandlers: (() => void) | null = null;

  private updateDragFromEvent(e: PointerEvent): void {
    const rect = this.app.pixi.canvas.getBoundingClientRect();
    const scale = this.app.world.scale.x || 1;
    this.dragTarget = {
      x: (e.clientX - rect.left - this.app.world.x) / scale,
      y: (e.clientY - rect.top - this.app.world.y) / scale,
    };
  }

  override update(dt: number): void {
    if (this.runEnded) return;
    this.elapsed += dt;

    // Timer
    this.timeLeft = Math.max(0, this.timeLeft - dt);
    if (this.timeLeft <= 0) {
      this.endRun(this.bag > 0);
      return;
    }

    // Player movement — lerp toward dragTarget, clamped to canvas.
    const dx = this.dragTarget.x - this.playerPos.x;
    const dy = this.dragTarget.y - this.playerPos.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 1) {
      const step = Math.min(dist, PLAYER_SPEED * dt);
      this.playerPos.x += (dx / dist) * step;
      this.playerPos.y += (dy / dist) * step;
    }
    this.playerPos.x = Math.max(PLAYER_R, Math.min(VW - PLAYER_R, this.playerPos.x));
    this.playerPos.y = Math.max(50 + PLAYER_R, Math.min(VH - PLAYER_R, this.playerPos.y));

    // Hazard damage
    for (const h of this.hazards) {
      const d = Math.hypot(h.pos.x - this.playerPos.x, h.pos.y - this.playerPos.y);
      if (d < h.r + PLAYER_R) {
        this.hp = Math.max(0, this.hp - h.dps * dt);
        if (this.hp <= 0) {
          this.endRun(false);
          return;
        }
      }
    }

    // Pickup collection
    for (const p of this.pickups) {
      if (p.collected) continue;
      const d = Math.hypot(p.pos.x - this.playerPos.x, p.pos.y - this.playerPos.y);
      if (d < COLLECT_DIST) {
        p.collected = true;
        this.bag += 1;
      }
    }

    // Exit if standing in the exit rect
    const inExit = this.playerPos.x >= this.exitRect.x && this.playerPos.x <= this.exitRect.x + this.exitRect.w
      && this.playerPos.y >= this.exitRect.y && this.playerPos.y <= this.exitRect.y + this.exitRect.h;
    if (inExit && this.bag > 0) {
      this.endRun(true);
      return;
    }

    this.draw();
    this.refreshHud();
  }

  private draw(): void {
    const accent = Color.hex(this.zone.accent_color);

    // Hazards — pulsing red blobs.
    this.hazardG.clear();
    const hp = 0.5 + 0.5 * Math.sin(this.elapsed * 2.5);
    for (const h of this.hazards) {
      this.hazardG.circle(h.pos.x, h.pos.y, h.r + 4).fill({ color: 0xc24d4d, alpha: 0.10 * hp });
      this.hazardG.circle(h.pos.x, h.pos.y, h.r).fill({ color: 0xc24d4d, alpha: 0.22 });
      this.hazardG.circle(h.pos.x, h.pos.y, h.r).stroke({ color: 0xc24d4d, width: 1.5, alpha: 0.8 });
    }

    // Pickups
    this.pickupG.clear();
    const pp = 0.5 + 0.5 * Math.sin(this.elapsed * 3);
    for (const p of this.pickups) {
      if (p.collected) continue;
      this.pickupG.circle(p.pos.x, p.pos.y, PICKUP_R + 3).fill({ color: accent, alpha: 0.12 * pp });
      this.pickupG.circle(p.pos.x, p.pos.y, PICKUP_R).fill({ color: accent, alpha: 0.5 });
      this.pickupG.circle(p.pos.x, p.pos.y, PICKUP_R - 4).fill({ color: 0xffffff, alpha: 0.7 });
    }

    // Player — glowing circle with directional indicator.
    this.playerG.clear();
    this.playerG.circle(this.playerPos.x, this.playerPos.y, PLAYER_R + 3).fill({ color: accent, alpha: 0.20 });
    this.playerG.circle(this.playerPos.x, this.playerPos.y, PLAYER_R).fill({ color: accent, alpha: 1 });
    this.playerG.circle(this.playerPos.x, this.playerPos.y, PLAYER_R - 4).fill({ color: 0xffffff, alpha: 0.85 });
  }

  private refreshHud(): void {
    this.timerLabel.text = `${Math.ceil(this.timeLeft)}s`;
    this.bagLabel.text = `bag ${this.bag}`;
    const pct = Math.round(this.hp);
    this.hpLabel.text = `vida ${pct}/${PLAYER_HP}`;
  }

  private endRun(victory: boolean): void {
    if (this.runEnded) return;
    this.runEnded = true;

    if (victory && this.bag > 0) {
      HubState.depositFlow(this.resourceKey, this.bag * this.rewardPerPickup);
    }
    HubState.onRunEnded(victory);

    const accent = Color.hex(this.zone.accent_color);
    const cardW = 280;
    const cardH = 160;
    const cx = VW / 2;
    const cy = VH / 2;
    const overlay = new Graphics();
    overlay.rect(0, 0, VW, VH).fill({ color: 0x000000, alpha: 0.7 });
    this.endOverlay.addChild(overlay);
    const card = new Graphics();
    card
      .roundRect(cx - cardW / 2, cy - cardH / 2, cardW, cardH, 8)
      .fill({ color: 0x0a0d0e, alpha: 0.96 })
      .stroke({ color: accent, width: 1.5, alpha: 0.9 });
    this.endOverlay.addChild(card);

    const title = new Text({
      text: victory ? 'MISSÃO CUMPRIDA' : 'RUN PERDIDA',
      style: { fontFamily: FontFamily.body, fontSize: 16, fill: victory ? accent : TextColor.red, fontWeight: '700', letterSpacing: 2 },
    });
    title.anchor.set(0.5);
    title.x = cx; title.y = cy - 50;
    this.endOverlay.addChild(title);

    const detail = new Text({
      text: victory && this.bag > 0
        ? `+${this.bag * this.rewardPerPickup} ${this.zone.resource}`
        : 'Você não voltou com nada.',
      style: { fontFamily: FontFamily.mono, fontSize: 11, fill: TextColor.ink },
    });
    detail.anchor.set(0.5);
    detail.x = cx; detail.y = cy - 24;
    this.endOverlay.addChild(detail);

    const back = new PixiButton({
      label: '← Voltar ao bunker',
      width: 200, height: 36,
      textColor: Color.hex(this.zone.accent_color),
      onClick: () => { void sceneManager.replace(new HubScene()); },
    });
    back.x = cx - 100;
    back.y = cy + 14;
    this.endOverlay.addChild(back);

    this.root.addChild(this.endOverlay);
  }
}
