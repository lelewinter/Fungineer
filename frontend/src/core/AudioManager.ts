import { assets } from './AssetLoader';
import { sfxSynth } from './SfxSynth';

interface Channel {
  el: HTMLAudioElement;
  baseVolume: number;
  fadeRaf: number | null;
}

class AudioManager {
  private music: Channel | null = null;
  private pendingMusic: { path: string; opts: { loop?: boolean; volume?: number; fadeMs?: number } } | null = null;
  private sfxVolume = 1.0;
  private musicVolume = 0.6;
  private cache = new Map<string, HTMLAudioElement>();
  /** SFX paths whose file failed to load — routed to the procedural synth. */
  private missingSfx = new Set<string>();
  private unlocked = false;

  unlockOnFirstGesture(): void {
    if (this.unlocked) return;
    const unlock = (): void => {
      this.unlocked = true;
      sfxSynth.resume();
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
      if (this.pendingMusic) {
        const { path, opts } = this.pendingMusic;
        this.pendingMusic = null;
        void this.playMusic(path, opts);
      } else if (this.music && this.music.el.paused) {
        this.music.el.play().catch(() => undefined);
      }
    };
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
  }

  setMusicVolume(v: number): void {
    this.musicVolume = Math.max(0, Math.min(1, v));
    if (this.music) this.music.el.volume = this.music.baseVolume * this.musicVolume;
  }

  setSfxVolume(v: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, v));
  }

  async playMusic(path: string, opts: { loop?: boolean; volume?: number; fadeMs?: number } = {}): Promise<void> {
    if (!this.unlocked) {
      this.pendingMusic = { path, opts };
      return;
    }

    const url = assets.toUrl(path);
    const next = new Audio(url);
    next.loop = opts.loop ?? true;
    const baseVolume = opts.volume ?? 1.0;
    next.volume = 0;

    if (opts.fadeMs && this.music) {
      this.fade(this.music, this.music.el.volume, 0, opts.fadeMs, () => {
        this.music?.el.pause();
      });
    } else if (this.music) {
      this.music.el.pause();
    }

    const newChannel: Channel = { el: next, baseVolume, fadeRaf: null };
    try {
      await next.play();
    } catch {
      // Autoplay blocked — will resume on first user gesture (see unlockOnFirstGesture).
    }
    this.music = newChannel;
    this.fade(newChannel, 0, baseVolume * this.musicVolume, opts.fadeMs ?? 0);
  }

  stopMusic(fadeMs: number = 0): void {
    this.pendingMusic = null;
    if (!this.music) return;
    const ch = this.music;
    if (fadeMs > 0) {
      this.fade(ch, ch.el.volume, 0, fadeMs, () => ch.el.pause());
    } else {
      ch.el.pause();
    }
    this.music = null;
  }

  async playSfx(path: string, volume: number = 1.0): Promise<void> {
    const gain = Math.max(0, Math.min(1, volume * this.sfxVolume));
    if (gain <= 0) return;

    // Asset already known to be missing → straight to the procedural synth.
    if (this.missingSfx.has(path)) {
      sfxSynth.play(path, gain);
      return;
    }

    let template = this.cache.get(path);
    if (!template) {
      template = new Audio(assets.toUrl(path));
      this.cache.set(path, template);
      // A failed network load fires 'error' asynchronously; remember it so
      // subsequent calls skip the element entirely and synthesize instead.
      template.addEventListener('error', () => { this.missingSfx.add(path); }, { once: true });
    }
    if (template.error) {
      this.missingSfx.add(path);
      sfxSynth.play(path, gain);
      return;
    }

    const clone = template.cloneNode(true) as HTMLAudioElement;
    clone.volume = gain;
    try {
      await clone.play();
    } catch {
      // Rejected before the first gesture → autoplay restriction, ignore.
      // Rejected afterwards → the file is absent (404); fall back to the synth
      // and remember the path so we don't keep retrying the network.
      if (this.unlocked) {
        this.missingSfx.add(path);
        sfxSynth.play(path, gain);
      }
    }
  }

  private fade(ch: Channel, from: number, to: number, ms: number, onDone?: () => void): void {
    if (ch.fadeRaf !== null) cancelAnimationFrame(ch.fadeRaf);
    if (ms <= 0) {
      ch.el.volume = to;
      onDone?.();
      return;
    }
    const start = performance.now();
    const step = (): void => {
      const t = Math.min(1, (performance.now() - start) / ms);
      ch.el.volume = from + (to - from) * t;
      if (t < 1) {
        ch.fadeRaf = requestAnimationFrame(step);
      } else {
        ch.fadeRaf = null;
        onDone?.();
      }
    };
    ch.fadeRaf = requestAnimationFrame(step);
  }
}

export const audioManager = new AudioManager();
