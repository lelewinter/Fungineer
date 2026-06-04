import { Container, Graphics, Text } from 'pixi.js';
import { Scene } from '../../core/Scene';
import { audioManager } from '../../core/AudioManager';
import { Color } from '../../core/Color';
import { FontFamily, TextColor } from '../../core/typography';
import { GameConfig } from '../../state/GameConfig';
import { HubState } from '../../state/HubState';
import { ZONES } from '../../state/Zones';
import { RunJuice } from '../../run/fx/RunJuice';
import { buildHud, buildEndOverlay, type RunHud } from './RunFrame';

const VW = GameConfig.VIEWPORT_WIDTH;
const VH = GameConfig.VIEWPORT_HEIGHT;
const ZONE = ZONES[8]!;

const TOP = 60;
const FOOT = 80;
const ROW_H = 60;
const ROW_COUNT = Math.floor((VH - TOP - FOOT) / ROW_H);
const HOP = 0.18; // seconds per hop animation
const TIMER = 75;

interface Hazard { x: number; w: number }
interface Lane { y: number; dir: 1 | -1; speed: number; hazards: Hazard[]; kind: 'road' | 'safe' | 'goal' }

/** CORDILHEIRA — Frogger. The favela silenciosa has no AI but is full of
 *  hostile gangs/civilians moving along corridor lanes. Drag up to hop a
 *  row; sideways to slide. Reach the rooftop. */
export class CordilheiraScene extends Scene {
  private content = new Container();
  private bg = new Graphics();
  private lanesG = new Graphics();
  private hazardsG = new Graphics();
  private playerG = new Graphics();
  private hud!: RunHud;
  private statusLabel!: Text;
  private juice!: RunJuice;

  private lanes: Lane[] = [];
  private px = VW / 2;
  private rowIdx = ROW_COUNT - 1;
  private hopAnim = 0;
  private fromY = 0;
  private toY = 0;
  private banked = 0;
  private elapsed = 0;
  private timeLeft = TIMER;
  private ended = false;
  private pointerStart = { x: 0, y: 0 };
  private dragging = false;
  private cleanup: (() => void) | null = null;

  override async enter(): Promise<void> {
    this.bg.rect(0, 0, VW, VH).fill({ color: 0x07070a });
    this.content.addChild(this.bg);
    this.root.addChild(this.content);

    // Build alternating road / safe rows.
    for (let i = 0; i < ROW_COUNT; i++) {
      const y = TOP + i * ROW_H;
      let kind: 'road' | 'safe' | 'goal' = i % 2 === 0 ? 'road' : 'safe';
      if (i === 0) kind = 'goal';
      const dir = (i % 2 === 0 ? 1 : -1) as 1 | -1;
      const speed = 40 + (ROW_COUNT - i) * 8;
      const hazards: Hazard[] = [];
      if (kind === 'road') {
        let x = -Math.random() * 60;
        while (x < VW + 60) {
          const w = 30 + Math.random() * 40;
          hazards.push({ x, w });
          x += w + 50 + Math.random() * 60;
        }
      }
      this.lanes.push({ y, dir, speed, hazards, kind });
    }

    this.fromY = this.toY = TOP + this.rowIdx * ROW_H + ROW_H / 2;

    this.content.addChild(this.lanesG, this.hazardsG, this.playerG);
    this.drawLanes();

    this.juice = new RunJuice(this.root, { accent: Color.hex(ZONE.accent_color), shakeTarget: this.content, ambient: 26 });

    this.hud = buildHud(ZONE);
    this.root.addChild(this.hud.container);
    this.hud.setStatus('travessia urbana');

    this.statusLabel = new Text({
      text: 'arraste para pular',
      style: { fontFamily: FontFamily.mono, fontSize: 10, fill: TextColor.muted, letterSpacing: 1 },
    });
    this.statusLabel.anchor.set(0.5);
    this.statusLabel.x = VW / 2;
    this.statusLabel.y = VH - 50;
    this.root.addChild(this.statusLabel);

    // Doors still standing — Elena's house, and Viktor's three down. Never labeled.
    const doorStyle = { fontFamily: FontFamily.mono, fontSize: 8, fill: 0x55504a };
    for (const [num, ry] of [['412', 0.4], ['419', 0.72]] as Array<[string, number]>) {
      const d = new Text({ text: num, style: doorStyle });
      d.anchor.set(1, 0.5);
      d.x = VW - 8;
      d.y = TOP + (VH - TOP - FOOT) * ry;
      this.content.addChild(d);
    }

    this.bindPointer();

    if (ZONE.music) {
      audioManager.playMusic(ZONE.music, { loop: true, volume: 0.3, fadeMs: 400 }).catch(() => undefined);
    }
  }

  override exit(): void {
    audioManager.stopMusic(300);
    this.cleanup?.();
    this.juice.destroy();
  }

  override update(dt: number): void {
    const d = Math.min(dt, 1 / 30);
    this.juice.update(d);
    if (this.ended) return;
    this.elapsed += d;
    this.timeLeft -= d;
    if (this.timeLeft <= 0) { this.end(false); return; }

    // Animate hazards.
    for (const lane of this.lanes) {
      for (const h of lane.hazards) {
        h.x += lane.dir * lane.speed * d;
        if (lane.dir > 0 && h.x > VW + 80) h.x = -h.w - 30;
        if (lane.dir < 0 && h.x < -h.w - 30) h.x = VW + 30;
      }
    }

    // Animate hop.
    if (this.hopAnim < 1) {
      this.hopAnim = Math.min(1, this.hopAnim + d / HOP);
    }

    // Collide with hazards on current row.
    const currentLane = this.lanes[this.rowIdx];
    if (currentLane && currentLane.kind === 'road' && this.hopAnim >= 1) {
      const py = currentLane.y + ROW_H / 2;
      for (const h of currentLane.hazards) {
        if (this.px + 12 > h.x && this.px - 12 < h.x + h.w && Math.abs(py - this.playerY()) < 16) {
          this.juice.hurt(this.px, this.playerY());
          this.end(false);
          return;
        }
      }
    }

    // Reach the goal row.
    if (this.rowIdx === 0 && this.hopAnim >= 1) {
      this.juice.pop(this.px, this.playerY());
      this.banked += 1;
      this.rowIdx = ROW_COUNT - 1;
      this.fromY = TOP + this.rowIdx * ROW_H + ROW_H / 2;
      this.toY = this.fromY;
      this.hopAnim = 1;
      if (this.banked >= 3) { this.end(true); return; }
    }

    this.draw();
    this.hud.setTimer(this.timeLeft);
    this.hud.setScore(`travessias ${this.banked}/3`);
    this.hud.setHealth(this.banked / 3);
  }

  private playerY(): number {
    return this.fromY + (this.toY - this.fromY) * this.hopAnim;
  }

  private bindPointer(): void {
    const canvas = this.app.pixi.canvas;
    const toLocal = (e: PointerEvent): { x: number; y: number } => {
      const rect = canvas.getBoundingClientRect();
      const scale = this.app.world.scale.x || 1;
      return {
        x: (e.clientX - rect.left - this.app.world.x) / scale,
        y: (e.clientY - rect.top - this.app.world.y) / scale,
      };
    };
    const onDown = (e: PointerEvent): void => { this.dragging = true; this.pointerStart = toLocal(e); };
    const onMove = (e: PointerEvent): void => {
      if (!this.dragging) return;
      const p = toLocal(e);
      const dx = p.x - this.pointerStart.x;
      const dy = p.y - this.pointerStart.y;
      if (Math.hypot(dx, dy) > 18 && this.hopAnim >= 1) {
        if (Math.abs(dy) > Math.abs(dx)) {
          const nextRow = Math.max(0, Math.min(ROW_COUNT - 1, this.rowIdx + (dy < 0 ? -1 : 1)));
          this.fromY = this.playerY();
          this.toY = TOP + nextRow * ROW_H + ROW_H / 2;
          this.rowIdx = nextRow;
          this.hopAnim = 0;
        } else {
          this.px = Math.max(16, Math.min(VW - 16, this.px + (dx > 0 ? 36 : -36)));
        }
        this.pointerStart = p;
      }
    };
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

  private drawLanes(): void {
    this.lanesG.clear();
    for (const lane of this.lanes) {
      let bgColor = 0x0c1216;
      if (lane.kind === 'road') bgColor = 0x14181f;
      if (lane.kind === 'goal') bgColor = 0x243410; // rooftop — open sky, lighter
      this.lanesG.rect(0, lane.y, VW, ROW_H).fill({ color: bgColor });
      this.lanesG.rect(0, lane.y, VW, 1).fill({ color: 0xffffff, alpha: 0.08 });
      if (lane.kind === 'road') {
        // Dashed centerline.
        for (let x = 0; x < VW; x += 24) {
          this.lanesG.rect(x, lane.y + ROW_H / 2 - 1, 12, 2).fill({ color: 0xffffff, alpha: 0.15 });
        }
      } else if (lane.kind === 'safe') {
        // A laundry line still strung across the alley — no one came back for it.
        const ly = lane.y + 14;
        this.lanesG.moveTo(16, ly).lineTo(VW - 16, ly).stroke({ color: 0x3a3a42, width: 1, alpha: 0.4 });
        const cloth = [0x6a7a8a, 0x8a6a5a, 0x5a6a6a, 0x7a7050];
        for (let cx = 36, k = 0; cx < VW - 30; cx += 48, k++) {
          this.lanesG.rect(cx, ly, 9, 13).fill({ color: cloth[k % cloth.length]!, alpha: 0.3 });
        }
      }
    }
  }

  private draw(): void {
    const accent = Color.hex(ZONE.accent_color);
    this.hazardsG.clear();
    for (const lane of this.lanes) {
      for (const h of lane.hazards) {
        this.hazardsG.rect(h.x, lane.y + ROW_H * 0.28, h.w, ROW_H * 0.44)
          .fill({ color: 0xc24d4d, alpha: 0.9 })
          .stroke({ color: 0xffffff, width: 1, alpha: 0.4 });
      }
    }
    this.playerG.clear();
    const py = this.playerY();
    const hop = 1 - Math.abs(this.hopAnim * 2 - 1);
    const r = 12;
    this.playerG.circle(this.px, py - hop * 8, r + 3).fill({ color: accent, alpha: 0.22 });
    this.playerG.circle(this.px, py - hop * 8, r).fill({ color: accent });
    this.playerG.circle(this.px, py - hop * 8, r - 4).fill({ color: 0xffffff });
  }

  private end(victory: boolean): void {
    if (this.ended) return;
    this.ended = true;
    if (victory) this.juice.victoryFx(); else this.juice.defeatFx();
    if (victory && this.banked > 0) {
      // No "memorias_coletivas" key — bank as scrap thematically.
      HubState.depositFlow('scrap', this.banked * 2);
    }
    HubState.onRunEnded(victory);
    this.root.addChild(buildEndOverlay({
      zone: ZONE,
      victory,
      rewardLabel: `+${this.banked * 2} Memórias Coletivas — travessias concluídas`,
      failLabel: 'Bloqueado pela ronda. Recue.',
    }));
  }
}
