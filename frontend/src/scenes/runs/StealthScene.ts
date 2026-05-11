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
const ZONE = ZONES[1]!;

const START_R = 8;
const MAX_BASE_SPEED = 240;
const MIN_SPEED = 80;
const TIMER = 50;
const GOAL_MASS = 32;

interface Blob { pos: Vec2; vel: Vec2; r: number; predator: boolean }

/** STEALTH — Agar.io. You are a quiet packet drifting through an AI hive.
 *  Eat smaller AI shards to grow Comp. de IA; bigger drones drift around
 *  and devour anything smaller than them — including you. Higher mass =
 *  slower, so growth is also exposure. */
export class StealthScene extends Scene {
  private bg = new Graphics();
  private blobsG = new Graphics();
  private playerG = new Graphics();
  private hud!: RunHud;
  private drag!: DragInput;

  private playerPos: Vec2 = { x: VW / 2, y: VH / 2 };
  private playerR = START_R;
  private blobs: Blob[] = [];
  private timeLeft = TIMER;
  private elapsed = 0;
  private banked = 0;
  private ended = false;

  override async enter(): Promise<void> {
    const accent = Color.hex(ZONE.accent_color);
    this.bg.rect(0, 0, VW, VH).fill({ color: 0x040806 });
    for (let i = 0; i < 60; i++) {
      const x = Math.random() * VW;
      const y = 40 + Math.random() * (VH - 60);
      this.bg.circle(x, y, 1).fill({ color: accent, alpha: 0.08 + Math.random() * 0.1 });
    }
    this.root.addChild(this.bg);

    // Seed: lots of small prey, a few medium, a couple big predators.
    for (let i = 0; i < 24; i++) this.spawnBlob(3 + Math.random() * 3, false);
    for (let i = 0; i < 6; i++)  this.spawnBlob(7 + Math.random() * 3, false);
    for (let i = 0; i < 4; i++)  this.spawnBlob(14 + Math.random() * 5, true);

    this.root.addChild(this.blobsG);
    this.root.addChild(this.playerG);

    this.hud = buildHud(ZONE);
    this.root.addChild(this.hud.container);
    this.hud.setStatus('camuflagem');

    this.drag = bindDrag(this.app.pixi.canvas, this.app.world, this.playerPos);

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
    if (this.timeLeft <= 0) { this.end(this.playerR >= GOAL_MASS); return; }

    // Speed shrinks with mass — Agar.io's signature drawback.
    const speed = Math.max(MIN_SPEED, MAX_BASE_SPEED - (this.playerR - START_R) * 7);
    const dx = this.drag.pos.x - this.playerPos.x;
    const dy = this.drag.pos.y - this.playerPos.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 0.5) {
      const step = Math.min(dist, speed * d);
      this.playerPos.x += (dx / dist) * step;
      this.playerPos.y += (dy / dist) * step;
    }
    this.playerPos.x = Math.max(this.playerR, Math.min(VW - this.playerR, this.playerPos.x));
    this.playerPos.y = Math.max(50 + this.playerR, Math.min(VH - this.playerR, this.playerPos.y));

    // Drift NPC blobs.
    for (const b of this.blobs) {
      b.pos.x += b.vel.x * d;
      b.pos.y += b.vel.y * d;
      if (b.pos.x < b.r || b.pos.x > VW - b.r) b.vel.x *= -1;
      if (b.pos.y < 50 + b.r || b.pos.y > VH - b.r) b.vel.y *= -1;
    }

    // Eat / be eaten.
    for (let i = this.blobs.length - 1; i >= 0; i--) {
      const b = this.blobs[i]!;
      const dd = Math.hypot(b.pos.x - this.playerPos.x, b.pos.y - this.playerPos.y);
      if (dd < this.playerR + b.r * 0.6) {
        if (this.playerR > b.r + 1) {
          // Player eats blob → grow by area (sqrt of summed area).
          const a = this.playerR * this.playerR + b.r * b.r * 0.6;
          this.playerR = Math.sqrt(a);
          this.banked += Math.max(1, Math.floor(b.r / 3));
          this.blobs.splice(i, 1);
          // Replenish a small prey so the map doesn't go quiet.
          if (Math.random() < 0.5) this.spawnBlob(3 + Math.random() * 3, false);
        } else if (b.r > this.playerR + 1) {
          // Predator eats player.
          this.end(false);
          return;
        }
      }
    }

    if (this.playerR >= GOAL_MASS) { this.end(true); return; }

    this.draw();
    this.hud.setTimer(this.timeLeft);
    this.hud.setScore(`massa ${Math.floor(this.playerR)}/${GOAL_MASS}`);
    this.hud.setHealth(this.playerR / GOAL_MASS);
  }

  private spawnBlob(r: number, predator: boolean): void {
    const x = 40 + Math.random() * (VW - 80);
    const y = 80 + Math.random() * (VH - 140);
    if (Math.hypot(x - this.playerPos.x, y - this.playerPos.y) < 80) return;
    const sp = predator ? 35 + Math.random() * 25 : 20 + Math.random() * 30;
    const ang = Math.random() * Math.PI * 2;
    this.blobs.push({
      pos: { x, y },
      vel: { x: Math.cos(ang) * sp, y: Math.sin(ang) * sp },
      r,
      predator,
    });
  }

  private draw(): void {
    const accent = Color.hex(ZONE.accent_color);
    this.blobsG.clear();
    for (const b of this.blobs) {
      const color = b.predator ? 0xc24d4d : (b.r > this.playerR ? 0xc24d4d : accent);
      this.blobsG.circle(b.pos.x, b.pos.y, b.r + 2).fill({ color, alpha: 0.15 });
      this.blobsG.circle(b.pos.x, b.pos.y, b.r).fill({ color, alpha: 0.7 });
      this.blobsG.circle(b.pos.x, b.pos.y, Math.max(0, b.r - 3)).fill({ color: 0xffffff, alpha: 0.35 });
    }

    this.playerG.clear();
    this.playerG.circle(this.playerPos.x, this.playerPos.y, this.playerR + 4).fill({ color: accent, alpha: 0.18 });
    this.playerG.circle(this.playerPos.x, this.playerPos.y, this.playerR).fill({ color: accent, alpha: 0.95 });
    this.playerG.circle(this.playerPos.x, this.playerPos.y, Math.max(0, this.playerR - 4)).fill({ color: 0xffffff, alpha: 0.7 });
  }

  private end(victory: boolean): void {
    if (this.ended) return;
    this.ended = true;
    if (victory && this.banked > 0) {
      HubState.depositFlow('ai_components', this.banked);
    }
    HubState.onRunEnded(victory);
    this.root.addChild(buildEndOverlay({
      zone: ZONE,
      victory,
      rewardLabel: `+${this.banked} Comp. de IA`,
      failLabel: 'Detectado pelo enxame.',
    }));
  }
}
