/**
 * SfxSynth — procedural sound-effect generator (Web Audio API).
 *
 * The project ships its `public/assets/audio` folder empty (see
 * `public/assets/README.md`), so every `playSfx(...)` path currently 404s.
 * Rather than run the game silent, AudioManager falls back to this synth: it
 * maps the well-known SFX filenames to short, procedurally-generated tones so
 * the *whole* sound design is audible with zero binary assets.
 *
 * Voices are derived from the filename family (`Click_/Confirm_/Complete_` plus
 * the semantic `game/` set: hit, alarm, jump, pickup) and the numeric suffix is
 * used as a small variation index so repeated clicks don't sound identical.
 *
 * If real audio files are dropped in later they take precedence — the synth is
 * only ever reached when a file genuinely fails to load.
 */

type OscType = OscillatorType;

interface ToneOpts {
  type?: OscType;
  /** Slide the pitch to this frequency across the note (Hz). */
  slideTo?: number;
  /** Note length, seconds. */
  dur?: number;
  /** Linear attack ramp, seconds. */
  attack?: number;
  /** Peak gain (pre master), 0..1. */
  gain?: number;
  /** Start offset from "now", seconds. */
  at?: number;
}

/** Parsed SFX descriptor: timbre family + 1-based variation index. */
interface SfxSpec {
  family: string;
  index: number;
}

class SfxSynth {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private supported: boolean;

  constructor() {
    this.supported =
      typeof window !== 'undefined' &&
      (typeof window.AudioContext !== 'undefined' ||
        typeof (window as unknown as { webkitAudioContext?: unknown }).webkitAudioContext !== 'undefined');
  }

  /** Resume the context after a user gesture (autoplay policy). Safe to call
   *  repeatedly; no-op until the context exists. */
  resume(): void {
    if (this.ctx && this.ctx.state === 'suspended') void this.ctx.resume();
  }

  /** Play a synthesised effect for the given resource path at `gain` (0..1). */
  play(path: string, gain: number): void {
    if (!this.supported || gain <= 0) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') void ctx.resume();

    const spec = parseSpec(path);
    const g = Math.max(0, Math.min(1, gain));
    switch (spec.family) {
      case 'confirm': return this.voiceConfirm(spec, g);
      case 'complete': return this.voiceComplete(spec, g);
      case 'hit': return this.voiceHit(spec, g);
      case 'alarm': return this.voiceAlarm(g);
      case 'jump': return this.voiceJump(g);
      case 'pickup': return this.voicePickup(spec, g);
      case 'click':
      default:
        return this.voiceClick(spec, g);
    }
  }

  // ── Voices ─────────────────────────────────────────────────────────────────

  /** Crisp UI tick. Pitch nudged by the variation index so repeats differ. */
  private voiceClick(spec: SfxSpec, gain: number): void {
    const base = 520 + (spec.index - 1) * 36;
    this.tone(base, { type: 'triangle', slideTo: base * 0.82, dur: 0.06, attack: 0.002, gain: 0.5 * gain });
  }

  /** Bright two-step rising chirp — pickups / panel-open / confirmations. */
  private voiceConfirm(spec: SfxSpec, gain: number): void {
    const root = 540 + (spec.index - 1) * 18;
    this.tone(root, { type: 'triangle', dur: 0.08, attack: 0.002, gain: 0.42 * gain });
    this.tone(root * 1.5, { type: 'triangle', dur: 0.1, attack: 0.002, gain: 0.42 * gain, at: 0.055 });
  }

  /** Three-note ascending arpeggio — victory / objective complete. */
  private voiceComplete(_spec: SfxSpec, gain: number): void {
    const notes = [523.25, 659.25, 783.99]; // C5 E5 G5
    notes.forEach((f, i) => {
      this.tone(f, { type: 'triangle', dur: 0.16, attack: 0.003, gain: 0.4 * gain, at: i * 0.07 });
    });
  }

  /** Percussive impact — damage / defeat. A noise burst over a low body thump.
   *  index > 1 (defeat) drops lower and rings a touch longer. */
  private voiceHit(spec: SfxSpec, gain: number): void {
    const heavy = spec.index > 1;
    this.burstNoise({ dur: heavy ? 0.16 : 0.11, freq: heavy ? 520 : 900, q: 1.1, gain: 0.5 * gain });
    const f0 = heavy ? 150 : 200;
    this.tone(f0, { type: 'sine', slideTo: f0 * 0.55, dur: heavy ? 0.2 : 0.13, attack: 0.001, gain: 0.6 * gain });
  }

  /** Two-tone warning beep — hazards / chase start. */
  private voiceAlarm(gain: number): void {
    this.tone(760, { type: 'square', dur: 0.1, attack: 0.002, gain: 0.28 * gain });
    this.tone(560, { type: 'square', dur: 0.12, attack: 0.002, gain: 0.28 * gain, at: 0.13 });
  }

  /** Light upward "boing" — hops / jumps in the movement-only zones. */
  private voiceJump(gain: number): void {
    this.tone(300, { type: 'sine', slideTo: 640, dur: 0.12, attack: 0.001, gain: 0.4 * gain });
  }

  /** Tiny high blip — incidental pickups. */
  private voicePickup(spec: SfxSpec, gain: number): void {
    this.tone(820 + (spec.index - 1) * 60, { type: 'triangle', dur: 0.06, attack: 0.001, gain: 0.4 * gain });
  }

  // ── Primitives ───────────────────────────────────────────────────────────

  private tone(freq: number, opts: ToneOpts): void {
    const ctx = this.ctx;
    const master = this.master;
    if (!ctx || !master) return;
    const dur = opts.dur ?? 0.1;
    const peak = opts.gain ?? 0.4;
    const attack = opts.attack ?? 0.003;
    const t0 = ctx.currentTime + (opts.at ?? 0);

    const osc = ctx.createOscillator();
    osc.type = opts.type ?? 'triangle';
    osc.frequency.setValueAtTime(freq, t0);
    if (opts.slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(1, opts.slideTo), t0 + dur);

    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, t0);
    env.gain.linearRampToValueAtTime(peak, t0 + attack);
    env.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

    osc.connect(env).connect(master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
    osc.onended = (): void => {
      osc.disconnect();
      env.disconnect();
    };
  }

  private burstNoise(opts: { dur: number; freq: number; q: number; gain: number }): void {
    const ctx = this.ctx;
    const master = this.master;
    if (!ctx || !master) return;
    const buf = this.ensureNoise(ctx);
    if (!buf) return;
    const t0 = ctx.currentTime;

    const src = ctx.createBufferSource();
    src.buffer = buf;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(opts.freq, t0);
    filter.Q.setValueAtTime(opts.q, t0);

    const env = ctx.createGain();
    env.gain.setValueAtTime(opts.gain, t0);
    env.gain.exponentialRampToValueAtTime(0.0001, t0 + opts.dur);

    src.connect(filter).connect(env).connect(master);
    src.start(t0);
    src.stop(t0 + opts.dur + 0.02);
    src.onended = (): void => {
      src.disconnect();
      filter.disconnect();
      env.disconnect();
    };
  }

  private ensureContext(): AudioContext | null {
    if (this.ctx) return this.ctx;
    if (!this.supported) return null;
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    try {
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.9;
      this.master.connect(this.ctx.destination);
      return this.ctx;
    } catch {
      this.supported = false;
      return null;
    }
  }

  private ensureNoise(ctx: AudioContext): AudioBuffer | null {
    if (this.noise) return this.noise;
    const len = Math.floor(ctx.sampleRate * 0.3);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    this.noise = buf;
    return buf;
  }
}

/** Derive a timbre family + variation index from a SFX resource path.
 *  `…/ui/Click_04.wav` → { family: 'click', index: 4 }
 *  `…/game/hit.wav`    → { family: 'hit',   index: 1 } */
function parseSpec(path: string): SfxSpec {
  const file = path.split('/').pop() ?? path;
  const stem = file.replace(/\.[a-z0-9]+$/i, '').toLowerCase();
  const parts = stem.split('_');
  let index = 1;
  if (parts.length > 1) {
    const n = Number.parseInt(parts[parts.length - 1]!, 10);
    if (Number.isFinite(n) && n > 0) {
      index = n;
      parts.pop();
    }
  }
  return { family: parts.join('_') || 'click', index };
}

export const sfxSynth = new SfxSynth();
