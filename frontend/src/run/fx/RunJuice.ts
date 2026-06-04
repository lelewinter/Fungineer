import type { Container } from 'pixi.js';
import { GameConfig } from '../../state/GameConfig';
import { audioManager } from '../../core/AudioManager';
import { FXSystem, type BurstOpts } from './FXSystem';
import { ScreenFX } from './ScreenFX';

const VW = GameConfig.VIEWPORT_WIDTH;
const VH = GameConfig.VIEWPORT_HEIGHT;

export interface RunJuiceOpts {
  /** Zone accent colour — tints ambient spores, bursts and flashes. */
  accent: number;
  /** Ambient drifting-spore count (atmosphere). 0 disables. */
  ambient?: number;
  /** Container translated by screen shake. Pass the scene's game-content
   *  layer (NOT the root, so the FX overlay / HUD stay rock-steady). */
  shakeTarget?: Container | null;
}

/**
 * RunJuice — drop-in game-feel kit for the lightweight zone scenes.
 *
 * Bundles the particle system, the full-screen ScreenFX (flash / edge
 * pressure / shockwave), a local trauma screen-shake and haptics + SFX behind
 * a tiny API. High-level combos (`pop`, `hurt`, `victoryFx`, `defeatFx`) make
 * wiring a zone a one-liner per beat.
 *
 * Usage:
 *   this.juice = new RunJuice(this.root, { accent, shakeTarget: this.content });
 *   // in update(): this.juice.update(dt)
 *   // on pickup:   this.juice.pop(x, y)
 *   // on damage:   this.juice.hurt(x, y)
 *   // on win/lose: this.juice.victoryFx() / this.juice.defeatFx()
 *   // in exit():   this.juice.destroy()
 */
export class RunJuice {
  readonly screenFx = new ScreenFX();
  private fx: FXSystem;
  private accent: number;
  private shakeTarget: Container | null;
  private baseX = 0;
  private baseY = 0;
  private trauma = 0;
  private reduced = false;

  constructor(root: Container, opts: RunJuiceOpts) {
    this.accent = opts.accent;
    this.shakeTarget = opts.shakeTarget ?? null;
    if (this.shakeTarget) {
      this.baseX = this.shakeTarget.x;
      this.baseY = this.shakeTarget.y;
    }
    root.sortableChildren = true;
    this.fx = new FXSystem(root, { w: VW, h: VH }, {
      ambient: opts.ambient ?? 34,
      cap: 240,
      ambientColor: opts.accent,
      zIndex: 40,
    });
    root.addChild(this.screenFx);
    if (typeof window !== 'undefined' && window.matchMedia) {
      this.reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
  }

  update(dt: number): void {
    this.fx.update(dt);
    this.screenFx.update(dt);
    this.applyShake(dt);
  }

  // ── Primitives ───────────────────────────────────────────────────────────
  burst(x: number, y: number, opts: BurstOpts = {}): void {
    this.fx.burst(x, y, { color: this.accent, ...opts });
  }

  flash(color: number = this.accent, alpha = 0.18, life = 0.18): void {
    this.screenFx.flash(color, alpha, life);
  }

  edges(color = 0xff2f3d, amount = 0.4): void {
    this.screenFx.edges(color, amount);
  }

  shockwave(color: number = this.accent, life = 0.5): void {
    this.screenFx.shockwave(color, life);
  }

  shake(amount: number, vibrateMs = 0): void {
    if (!this.reduced) this.trauma = Math.min(1, this.trauma + amount);
    if (vibrateMs > 0) this.vibrate(vibrateMs);
  }

  vibrate(ms: number): void {
    if (this.reduced) return;
    if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
    try { navigator.vibrate(Math.min(200, Math.max(5, Math.round(ms)))); } catch { /* ignore */ }
  }

  // ── High-level combos ─────────────────────────────────────────────────────
  /** Satisfying pickup / objective tick. */
  pop(x: number, y: number, color: number = this.accent): void {
    this.burst(x, y, { count: 14, color, speed: 170, life: 0.5, size: 2.6 });
    this.flash(color, 0.10, 0.14);
    this.shake(0.16, 12);
    audioManager.playSfx('res://assets/audio/sfx/ui/Confirm_03.wav', 0.45);
  }

  /** Player took damage / near miss. */
  hurt(x: number, y: number): void {
    this.edges(0xff2f3d, 0.5);
    this.flash(0xff2f3d, 0.22, 0.18);
    this.burst(x, y, { count: 14, color: 0xff5a60, speed: 180, life: 0.4, size: 2.4 });
    this.shake(0.4, 45);
    audioManager.playSfx('res://assets/audio/sfx/game/hit_01.wav', 0.6);
  }

  /** Light hop / step — the signature beat of the movement-only zones. */
  jump(x: number, y: number, color: number = this.accent): void {
    this.burst(x, y, { count: 6, color, speed: 90, life: 0.3, size: 2 });
    audioManager.playSfx('res://assets/audio/sfx/game/jump.wav', 0.4);
  }

  /** A heavy/alarming beat (alarm, chase start, hazard). */
  alarm(color = 0xff7a3c): void {
    this.edges(color, 0.6);
    this.flash(color, 0.2, 0.22);
    this.shockwave(color, 0.55);
    this.shake(0.45, 60);
    audioManager.playSfx('res://assets/audio/sfx/game/alarm.wav', 0.55);
  }

  victoryFx(): void {
    this.flash(this.accent, 0.26, 0.34);
    this.shockwave(this.accent, 0.6);
    this.burst(VW / 2, VH / 2, { count: 40, color: this.accent, speed: 240, life: 0.8, size: 3 });
    this.shake(0.3, 50);
    audioManager.playSfx('res://assets/audio/sfx/ui/Complete_01.wav', 0.8);
  }

  defeatFx(): void {
    this.edges(0xff2f3d, 1);
    this.flash(0xff2f3d, 0.32, 0.34);
    this.shake(0.55, 120);
    // index 02 → heavier, lower-pitched impact than a mid-run hit.
    audioManager.playSfx('res://assets/audio/sfx/game/hit_02.wav', 0.8);
  }

  destroy(): void {
    this.fx.destroy();
    this.screenFx.destroy();
  }

  private applyShake(dt: number): void {
    if (!this.shakeTarget) return;
    if (this.trauma <= 0) {
      this.shakeTarget.x = this.baseX;
      this.shakeTarget.y = this.baseY;
      return;
    }
    const t2 = this.trauma * this.trauma;
    const max = 14;
    this.shakeTarget.x = this.baseX + (Math.random() * 2 - 1) * max * t2;
    this.shakeTarget.y = this.baseY + (Math.random() * 2 - 1) * max * t2;
    this.trauma = Math.max(0, this.trauma - 1.6 * dt);
  }
}
