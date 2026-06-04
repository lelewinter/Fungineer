/**
 * Shared Web Audio context.
 *
 * Browsers throttle / warn on multiple AudioContexts, so the procedural sound
 * (SfxSynth) and music (MusicSynth) engines share this single lazily-created
 * context. It is created on first use and resumed on the first user gesture
 * (autoplay policy) via AudioManager.unlockOnFirstGesture → resumeAudioContext.
 */

let ctx: AudioContext | null = null;
let failed = false;

export function getAudioContext(): AudioContext | null {
  if (ctx) return ctx;
  if (failed || typeof window === 'undefined') return null;
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) {
    failed = true;
    return null;
  }
  try {
    ctx = new Ctor();
    return ctx;
  } catch {
    failed = true;
    return null;
  }
}

export function resumeAudioContext(): void {
  if (ctx && ctx.state === 'suspended') void ctx.resume();
}
