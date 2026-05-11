import type { Container } from 'pixi.js';

/** Centralised "juice" hooks — screen shake + haptic vibration.
 *
 *  Bind a camera Container once per scene, then call `shake(amount, ms)`
 *  from anywhere when something punchy happens. The shake additively writes
 *  to the camera's `pivot`, which the renderer then folds into the existing
 *  camera transform without disturbing scene-level positioning.
 *
 *  Vibration is a thin wrapper around `navigator.vibrate` that no-ops on
 *  desktop and respects the user's reduced-motion preference. */
class JuiceClass {
  private camera: Container | null = null;
  private baseX = 0;
  private baseY = 0;
  private trauma = 0;
  private decayPerSec = 1.4;
  private maxOffset = 18;
  private prefersReducedMotion = false;

  constructor() {
    if (typeof window !== 'undefined' && window.matchMedia) {
      this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
  }

  /** Hook the camera that will receive the shake offset. Pass null in
   *  `unbind()` (or scene.exit) to release the reference. */
  bind(camera: Container | null): void {
    this.camera = camera;
    this.trauma = 0;
    if (camera) {
      this.baseX = camera.pivot.x;
      this.baseY = camera.pivot.y;
    }
  }

  /** Stack a hit. `amount` 0–1 (clamped to 1). Larger = more violent.
   *  Multiple calls in the same frame stack so big combos punch harder. */
  shake(amount: number, vibrateMs = 0): void {
    if (this.prefersReducedMotion) {
      // Still vibrate softly so the player gets some feedback, but skip the
      // visual shake completely.
      if (vibrateMs > 0) this.vibrate(Math.min(20, vibrateMs));
      return;
    }
    this.trauma = Math.min(1, this.trauma + amount);
    if (vibrateMs > 0) this.vibrate(vibrateMs);
  }

  /** Fire a haptic pulse. Browsers without the API or without permission
   *  silently no-op. Times longer than 200 ms are clamped to keep us off the
   *  "pleeease stop" UX list. */
  vibrate(ms: number): void {
    if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
    if (this.prefersReducedMotion) return;
    try {
      navigator.vibrate(Math.min(200, Math.max(5, Math.round(ms))));
    } catch {
      /* iOS Safari throws on some versions; ignore. */
    }
  }

  /** Per-frame update — decays trauma exponentially and writes the shake
   *  offset back onto the bound camera. */
  update(dt: number): void {
    if (!this.camera) return;
    if (this.trauma <= 0) {
      this.camera.pivot.x = this.baseX;
      this.camera.pivot.y = this.baseY;
      return;
    }
    // trauma² gives the classic GDC "screen shake" curve — most movement
    // happens at high trauma and tapers off naturally as it decays.
    const t2 = this.trauma * this.trauma;
    const ox = (Math.random() * 2 - 1) * this.maxOffset * t2;
    const oy = (Math.random() * 2 - 1) * this.maxOffset * t2;
    // pivot is subtracted from the container's transform, so we negate to
    // push the camera *away* from the shake axis, producing the visual jolt.
    this.camera.pivot.x = this.baseX - ox;
    this.camera.pivot.y = this.baseY - oy;
    this.trauma = Math.max(0, this.trauma - this.decayPerSec * dt);
  }
}

export const Juice = new JuiceClass();
