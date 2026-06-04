/** Global game-feel singleton: trauma-based camera shake.
 *
 *  Usage:
 *    juice.addTrauma(0.6)            // on a hit / explosion / boss spawn
 *    const o = juice.update(dt)      // once per frame in the scene
 *    cameraLayer.x += o.x; cameraLayer.y += o.y; cameraLayer.rotation = o.rot
 *
 *  Trauma decays linearly; shake scales with trauma² so small hits barely
 *  nudge and big ones kick hard. Shared by every zone so feel is consistent.
 */
class Juice {
  private trauma = 0;
  private time = 0;
  private prefersReducedMotion = false;

  /** Max pixel offset and rotation at full trauma. Tunable per feel. */
  maxOffset = 18;
  maxRot = 0.05;
  decayPerSec = 1.4;

  constructor() {
    if (typeof window !== 'undefined' && window.matchMedia) {
      this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
  }

  /** Add trauma (0..1). Clamped. Bigger = stronger shake. */
  addTrauma(amount: number, vibrateMs: number | number[] = 0): void {
    if (this.prefersReducedMotion) {
      if (this.hasVibration(vibrateMs)) this.vibrate(Array.isArray(vibrateMs) ? vibrateMs.map((ms) => Math.min(20, ms)) : Math.min(20, vibrateMs));
      return;
    }
    this.trauma = Math.min(1, this.trauma + amount);
    if (this.hasVibration(vibrateMs)) this.vibrate(vibrateMs);
  }

  /** Compatibility alias for run-side callers. */
  shake(amount: number, vibrateMs: number | number[] = 0): void {
    this.addTrauma(amount, vibrateMs);
  }

  vibrate(ms: number | number[]): void {
    if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
    if (this.prefersReducedMotion) return;
    const clamp = (value: number): number => Math.min(200, Math.max(5, Math.round(value)));
    try {
      if (Array.isArray(ms)) navigator.vibrate(ms.map(clamp));
      else navigator.vibrate(clamp(ms));
    } catch {
      // Some mobile browsers expose the API but reject calls until a gesture.
    }
  }

  private hasVibration(ms: number | number[]): boolean {
    return Array.isArray(ms) ? ms.some((value) => value > 0) : ms > 0;
  }

  get active(): boolean {
    return this.trauma > 0.001;
  }

  /** Advance and return the current shake offset to apply to a camera layer. */
  update(dt: number): { x: number; y: number; rot: number } {
    this.time += dt;
    if (this.trauma <= 0) return { x: 0, y: 0, rot: 0 };
    const shake = this.trauma * this.trauma;
    // Cheap pseudo-noise: layered sines at incommensurate freqs per axis.
    const t = this.time * 40;
    const nx = Math.sin(t * 1.3) * Math.sin(t * 0.7 + 1.1);
    const ny = Math.sin(t * 1.7 + 2.3) * Math.sin(t * 0.9);
    const nr = Math.sin(t * 1.1 + 0.5);
    this.trauma = Math.max(0, this.trauma - this.decayPerSec * dt);
    return {
      x: nx * shake * this.maxOffset,
      y: ny * shake * this.maxOffset,
      rot: nr * shake * this.maxRot,
    };
  }

  reset(): void {
    this.trauma = 0;
  }
}

export const juice = new Juice();
