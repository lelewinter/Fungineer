import { Graphics } from 'pixi.js';
import { Scene } from '../../core/Scene';
import { audioManager } from '../../core/AudioManager';
import { Color } from '../../core/Color';
import { GameConfig } from '../../state/GameConfig';
import { HubState } from '../../state/HubState';
import { ZONES } from '../../state/Zones';
import type { Vec2 } from '../../core/types';
import { buildHud, buildEndOverlay, bindDrag, type RunHud, type DragInput } from './RunFrame';

const VW = GameConfig.VIEWPORT_WIDTH;
const VH = GameConfig.VIEWPORT_HEIGHT;
const ZONE = ZONES[2]!;

const HEAD_R = 9;
const BASE_SPEED = 170;
const SPEED_PER_NODE = 9;
const TRAIL_SEG_DIST = 14;
const NODE_R = 9;
const COLLECT_DIST = 22;
const TIMER = 60;
const TRAIL_GRACE_SEGS = 5; // ignore first N tail segments for self-collision
const GOAL = 14;

/** CIRCUITO — Snake / Tron Light-Cycles. Head follows your finger, trail
 *  extends every node collected, higher speed each time. Touching your own
 *  trail = circuit short, run lost. */
export class CircuitoScene extends Scene {
  private bg = new Graphics();
  private trailG = new Graphics();
  private nodeG = new Graphics();
  private headG = new Graphics();
  private hud!: RunHud;
  private drag!: DragInput;

  private head: Vec2 = { x: VW / 2, y: VH / 2 };
  private trail: Vec2[] = [];
  private trailTarget = 6;
  private nodes: Vec2[] = [];
  private collected = 0;
  private timeLeft = TIMER;
  private elapsed = 0;
  private ended = false;
  private boundaryRect = { x: 6, y: 50, w: VW - 12, h: VH - 60 };

  override async enter(): Promise<void> {
    const accent = Color.hex(ZONE.accent_color);
    this.bg.rect(0, 0, VW, VH).fill({ color: 0x02080a });
    // Circuit board traces
    for (let i = 0; i < 30; i++) {
      const y = 40 + Math.random() * (VH - 100);
      this.bg.rect(0, y, VW, 1).fill({ color: accent, alpha: 0.06 });
    }
    for (let i = 0; i < 16; i++) {
      const x = Math.random() * VW;
      this.bg.rect(x, 40, 1, VH - 60).fill({ color: accent, alpha: 0.06 });
    }
    // Boundary frame
    this.bg.rect(this.boundaryRect.x, this.boundaryRect.y, this.boundaryRect.w, this.boundaryRect.h)
      .stroke({ color: accent, width: 2, alpha: 0.6 });
    this.root.addChild(this.bg);

    this.root.addChild(this.trailG);
    this.root.addChild(this.nodeG);
    this.root.addChild(this.headG);

    this.spawnNodes(4);

    this.drag = bindDrag(this.app.pixi.canvas, this.app.world, this.head);

    this.hud = buildHud(ZONE);
    this.root.addChild(this.hud.container);
    this.hud.setStatus('roteamento');

    if (ZONE.music) {
      audioManager.playMusic(ZONE.music, { loop: true, volume: 0.3, fadeMs: 400 }).catch(() => undefined);
    }
  }

  override exit(): void {
    audioManager.stopMusic(300);
    this.drag.cleanup();
  }

  override update(dt: number): void {
    if (this.ended) return;
    const d = Math.min(dt, 1 / 30);
    this.elapsed += d;
    this.timeLeft -= d;
    if (this.timeLeft <= 0) { this.end(this.collected >= GOAL / 2); return; }

    const speed = BASE_SPEED + this.collected * SPEED_PER_NODE;
    const dx = this.drag.pos.x - this.head.x;
    const dy = this.drag.pos.y - this.head.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 0.5) {
      const step = Math.min(dist, speed * d);
      this.head.x += (dx / dist) * step;
      this.head.y += (dy / dist) * step;
    }

    // Clamp to circuit board.
    const b = this.boundaryRect;
    if (this.head.x < b.x + HEAD_R || this.head.x > b.x + b.w - HEAD_R ||
        this.head.y < b.y + HEAD_R || this.head.y > b.y + b.h - HEAD_R) {
      this.end(false); // ran off the board
      return;
    }

    // Drop trail breadcrumbs at fixed distance intervals.
    const last = this.trail[this.trail.length - 1];
    if (!last || Math.hypot(this.head.x - last.x, this.head.y - last.y) > TRAIL_SEG_DIST) {
      this.trail.push({ x: this.head.x, y: this.head.y });
      while (this.trail.length > this.trailTarget) this.trail.shift();
    }

    // Self-collision (skip newest segments — the ones right behind the head).
    for (let i = 0; i < this.trail.length - TRAIL_GRACE_SEGS; i++) {
      const seg = this.trail[i]!;
      if (Math.hypot(seg.x - this.head.x, seg.y - this.head.y) < HEAD_R + 4) {
        this.end(false);
        return;
      }
    }

    // Node collection.
    for (let i = this.nodes.length - 1; i >= 0; i--) {
      const n = this.nodes[i]!;
      if (Math.hypot(n.x - this.head.x, n.y - this.head.y) < COLLECT_DIST) {
        this.nodes.splice(i, 1);
        this.collected += 1;
        this.trailTarget += 4;
        if (this.collected >= GOAL) { this.end(true); return; }
        // spawn replacement
        this.spawnNodes(1);
      }
    }

    this.draw();
    this.hud.setTimer(this.timeLeft);
    this.hud.setScore(`nós ${this.collected}/${GOAL}`);
    this.hud.setHealth(1 - this.collected / GOAL);
  }

  private spawnNodes(n: number): void {
    const b = this.boundaryRect;
    for (let i = 0; i < n; i++) {
      let tries = 20;
      while (tries-- > 0) {
        const x = b.x + 24 + Math.random() * (b.w - 48);
        const y = b.y + 24 + Math.random() * (b.h - 48);
        if (Math.hypot(x - this.head.x, y - this.head.y) > 40) {
          this.nodes.push({ x, y });
          break;
        }
      }
    }
  }

  private draw(): void {
    const accent = Color.hex(ZONE.accent_color);
    this.trailG.clear();
    for (let i = 0; i < this.trail.length; i++) {
      const seg = this.trail[i]!;
      const t = i / Math.max(1, this.trail.length - 1);
      this.trailG.circle(seg.x, seg.y, 5 + t * 2).fill({ color: accent, alpha: 0.4 + 0.4 * t });
    }

    this.nodeG.clear();
    const pulse = 0.5 + 0.5 * Math.sin(this.elapsed * 3);
    for (const n of this.nodes) {
      this.nodeG.circle(n.x, n.y, NODE_R + 3).fill({ color: 0xffffff, alpha: 0.08 * pulse });
      this.nodeG.rect(n.x - NODE_R, n.y - NODE_R, NODE_R * 2, NODE_R * 2).fill({ color: accent, alpha: 0.85 });
      this.nodeG.rect(n.x - 3, n.y - 3, 6, 6).fill({ color: 0xffffff });
    }

    this.headG.clear();
    this.headG.circle(this.head.x, this.head.y, HEAD_R + 4).fill({ color: accent, alpha: 0.25 });
    this.headG.circle(this.head.x, this.head.y, HEAD_R).fill({ color: 0xffffff });
    this.headG.circle(this.head.x, this.head.y, HEAD_R - 3).fill({ color: accent });
  }

  private end(victory: boolean): void {
    if (this.ended) return;
    this.ended = true;
    if (victory && this.collected > 0) {
      HubState.depositFlow('nucleo_logico', this.collected);
    }
    HubState.onRunEnded(victory);
    this.root.addChild(buildEndOverlay({
      zone: ZONE,
      victory,
      rewardLabel: `+${this.collected} Núcleo Lógico`,
      failLabel: 'Circuito em curto.',
    }));
  }
}
