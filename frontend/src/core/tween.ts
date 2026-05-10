/** Tiny tween helper. Returns a Promise that resolves when the tween finishes. */

export type EaseFn = (t: number) => number;

export const Easing = {
  linear: (t: number) => t,
  easeOutCubic: (t: number) => 1 - Math.pow(1 - t, 3),
  easeInCubic: (t: number) => t * t * t,
  easeInOutCubic: (t: number) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
};

export interface TweenOpts {
  durationMs: number;
  ease?: EaseFn;
  onUpdate: (t: number) => void;
  signal?: AbortSignal;
}

export function tween({ durationMs, ease = Easing.easeOutCubic, onUpdate, signal }: TweenOpts): Promise<void> {
  return new Promise<void>((resolve) => {
    const start = performance.now();
    let raf = 0;

    const step = (): void => {
      if (signal?.aborted) {
        resolve();
        return;
      }
      const elapsed = performance.now() - start;
      const progress = Math.min(1, elapsed / durationMs);
      onUpdate(ease(progress));
      if (progress >= 1) {
        resolve();
      } else {
        raf = requestAnimationFrame(step);
      }
    };
    raf = requestAnimationFrame(step);

    if (signal) {
      signal.addEventListener('abort', () => {
        cancelAnimationFrame(raf);
        resolve();
      });
    }
  });
}
