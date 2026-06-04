/**
 * MusicSynth — procedural, looping background music (Web Audio API).
 *
 * Companion to SfxSynth: the music assets folder ships empty, so every
 * `playMusic(...)` path 404s. AudioManager falls back here, which generates an
 * endless, seamless track from a "mood" inferred from the path (menu / battle /
 * field / dungeon / night). Each mood is a small generative arrangement —
 * sustained pad chords, a bassline and a wandering melody over a fixed chord
 * progression — driven by a Web Audio look-ahead scheduler.
 *
 * Real audio files, when present, take precedence; the synth only runs as a
 * fallback. Fades and the music-volume slider are honoured.
 */

import { getAudioContext, resumeAudioContext } from './audioContext';

type Mood = 'menu' | 'battle' | 'field' | 'dungeon' | 'night' | 'ambient';

interface MoodCfg {
  bpm: number;
  /** MIDI root note of the key. */
  root: number;
  /** Scale as semitone offsets from the root. */
  scale: number[];
  /** Chord root, as a scale degree, for each of the 4 bars in the loop. */
  prog: number[];
  /** Per-16th-step probability of a melody note. */
  density: number;
  melodyWave: OscillatorType;
  bassWave: OscillatorType;
  padWave: OscillatorType;
  /** Overall mood gain trim. */
  trim: number;
}

const MOODS: Record<Mood, MoodCfg> = {
  menu: {
    bpm: 82, root: 57, scale: [0, 2, 3, 5, 7, 8, 10], prog: [0, 5, 3, 4],
    density: 0.22, melodyWave: 'triangle', bassWave: 'sine', padWave: 'triangle', trim: 1,
  },
  battle: {
    bpm: 130, root: 45, scale: [0, 2, 3, 5, 7, 8, 11], prog: [0, 0, 5, 6],
    density: 0.5, melodyWave: 'sawtooth', bassWave: 'square', padWave: 'sawtooth', trim: 0.8,
  },
  field: {
    bpm: 104, root: 52, scale: [0, 2, 4, 5, 7, 9, 11], prog: [0, 4, 5, 3],
    density: 0.34, melodyWave: 'triangle', bassWave: 'triangle', padWave: 'triangle', trim: 0.95,
  },
  dungeon: {
    bpm: 72, root: 48, scale: [0, 1, 3, 5, 7, 8, 10], prog: [0, 1, 0, 4],
    density: 0.18, melodyWave: 'sine', bassWave: 'sine', padWave: 'sine', trim: 0.9,
  },
  night: {
    bpm: 64, root: 50, scale: [0, 3, 5, 7, 10], prog: [0, 3, 4, 2],
    density: 0.16, melodyWave: 'sine', bassWave: 'sine', padWave: 'triangle', trim: 0.9,
  },
  ambient: {
    bpm: 70, root: 50, scale: [0, 2, 5, 7, 9], prog: [0, 4, 2, 3],
    density: 0.18, melodyWave: 'triangle', bassWave: 'sine', padWave: 'triangle', trim: 0.9,
  },
};

const STEPS_PER_BAR = 16;
const BARS = 4;
const TOTAL_STEPS = STEPS_PER_BAR * BARS;
const LOOKAHEAD_MS = 25;
const SCHEDULE_AHEAD = 0.12; // seconds

class MusicSynth {
  /** music-volume × per-track volume, applied to the whole mix. */
  private volGain: GainNode | null = null;
  /** 0..1 fade envelope, ramped on play/stop. */
  private fadeGain: GainNode | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;

  private mood: Mood = 'ambient';
  private cfg: MoodCfg = MOODS.ambient;
  private currentPath: string | null = null;
  private playing = false;

  private step = 0;
  private nextTime = 0;
  private melodyIdx = 0;
  private userVolume = 1;
  private trackVolume = 1;

  resume(): void {
    resumeAudioContext();
  }

  /** Start (or keep) the generative track for `path`. Idempotent for a path
   *  already playing. */
  play(path: string, opts: { volume?: number; fadeMs?: number } = {}): void {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') void ctx.resume();

    this.trackVolume = opts.volume ?? 1;
    if (this.playing && this.currentPath === path) {
      this.applyVolume();
      return;
    }

    this.stop(0);
    this.currentPath = path;
    this.mood = moodFromPath(path);
    this.cfg = MOODS[this.mood];

    this.volGain = ctx.createGain();
    this.fadeGain = ctx.createGain();
    this.applyVolume();
    this.fadeGain.gain.value = 0.0001;
    this.fadeGain.connect(this.volGain).connect(ctx.destination);

    const fade = opts.fadeMs ?? 0;
    if (fade > 0) {
      this.fadeGain.gain.setValueAtTime(0.0001, ctx.currentTime);
      this.fadeGain.gain.exponentialRampToValueAtTime(1, ctx.currentTime + fade / 1000);
    } else {
      this.fadeGain.gain.value = 1;
    }

    this.step = 0;
    this.melodyIdx = (Math.random() * this.cfg.scale.length) | 0;
    this.nextTime = ctx.currentTime + 0.06;
    this.playing = true;
    this.timer = setInterval(() => this.schedule(), LOOKAHEAD_MS);
  }

  stop(fadeMs: number = 0): void {
    if (!this.playing) {
      this.clearTimer();
      return;
    }
    const ctx = getAudioContext();
    const fadeGain = this.fadeGain;
    this.playing = false;
    this.currentPath = null;
    this.clearTimer();
    if (ctx && fadeGain && fadeMs > 0) {
      const t = ctx.currentTime;
      fadeGain.gain.cancelScheduledValues(t);
      fadeGain.gain.setValueAtTime(Math.max(0.0001, fadeGain.gain.value), t);
      fadeGain.gain.exponentialRampToValueAtTime(0.0001, t + fadeMs / 1000);
      const vol = this.volGain;
      const old = fadeGain;
      window.setTimeout(() => {
        try { old.disconnect(); vol?.disconnect(); } catch { /* already gone */ }
      }, fadeMs + 80);
    } else {
      try { fadeGain?.disconnect(); this.volGain?.disconnect(); } catch { /* already gone */ }
    }
    this.fadeGain = null;
    this.volGain = null;
  }

  setUserVolume(v: number): void {
    this.userVolume = Math.max(0, Math.min(1, v));
    this.applyVolume();
  }

  private applyVolume(): void {
    if (this.volGain) this.volGain.gain.value = 0.5 * this.cfg.trim * this.userVolume * this.trackVolume;
  }

  // ── Scheduler ──────────────────────────────────────────────────────────────

  private schedule(): void {
    const ctx = getAudioContext();
    if (!ctx || !this.playing) return;
    const stepDur = 15 / this.cfg.bpm; // 16th note = (60/bpm)/4
    while (this.nextTime < ctx.currentTime + SCHEDULE_AHEAD) {
      this.scheduleStep(this.step, this.nextTime);
      this.step = (this.step + 1) % TOTAL_STEPS;
      this.nextTime += stepDur;
    }
  }

  private scheduleStep(step: number, time: number): void {
    const cfg = this.cfg;
    const bar = Math.floor(step / STEPS_PER_BAR);
    const beat = step % STEPS_PER_BAR;
    const chordDeg = cfg.prog[bar % cfg.prog.length]!;

    // Pad chord — sustained across the whole bar, low and soft.
    if (beat === 0) {
      const barDur = (15 / cfg.bpm) * STEPS_PER_BAR;
      for (const d of [0, 2, 4]) {
        this.note(this.degToMidi(chordDeg + d, 0), time, barDur * 0.98, 0.07, cfg.padWave, 0.18);
      }
    }

    // Bass — root on the downbeat and the half-bar.
    if (beat === 0 || beat === 8) {
      this.note(this.degToMidi(chordDeg, -1), time, (15 / cfg.bpm) * 6, 0.22, cfg.bassWave, 0.012);
    }
    // Battle drives an eighth-note bass pulse for momentum.
    if (this.mood === 'battle' && beat % 2 === 0) {
      this.note(this.degToMidi(chordDeg, -1), time, (15 / cfg.bpm) * 1.4, 0.12, cfg.bassWave, 0.004);
    }

    // Melody — a wandering line biased toward chord tones.
    if (Math.random() < cfg.density) {
      const wander = (Math.random() * 3 | 0) - 1; // -1,0,1
      this.melodyIdx = clampIdx(this.melodyIdx + wander, cfg.scale.length);
      // Nudge onto a chord tone occasionally for consonance.
      const deg = beat % 4 === 0 ? chordDeg + (Math.random() < 0.5 ? 0 : 2) : this.melodyIdx;
      this.note(this.degToMidi(deg, 1), time, (15 / cfg.bpm) * 1.6, 0.1, cfg.melodyWave, 0.006);
    }
  }

  /** Scale degree (with octave shift) → MIDI note in this mood's key. */
  private degToMidi(deg: number, octave: number): number {
    const len = this.cfg.scale.length;
    const idx = ((deg % len) + len) % len;
    const oct = Math.floor(deg / len) + octave;
    return this.cfg.root + this.cfg.scale[idx]! + oct * 12;
  }

  private note(
    midi: number, time: number, dur: number, gain: number, wave: OscillatorType, attack: number,
  ): void {
    const ctx = getAudioContext();
    const out = this.fadeGain;
    if (!ctx || !out) return;
    const osc = ctx.createOscillator();
    osc.type = wave;
    osc.frequency.value = 440 * Math.pow(2, (midi - 69) / 12);

    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, time);
    env.gain.linearRampToValueAtTime(gain, time + attack);
    env.gain.exponentialRampToValueAtTime(0.0001, time + dur);

    osc.connect(env).connect(out);
    osc.start(time);
    osc.stop(time + dur + 0.03);
    osc.onended = (): void => { osc.disconnect(); env.disconnect(); };
  }

  private clearTimer(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}

function moodFromPath(path: string): Mood {
  const p = path.toLowerCase();
  if (p.includes('battle')) return 'battle';
  if (p.includes('menu')) return 'menu';
  if (p.includes('field')) return 'field';
  if (p.includes('dungeon')) return 'dungeon';
  if (p.includes('night')) return 'night';
  return 'ambient';
}

function clampIdx(i: number, len: number): number {
  if (i < 0) return 0;
  if (i > len - 1) return len - 1;
  return i;
}

export const musicSynth = new MusicSynth();
