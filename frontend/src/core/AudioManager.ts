import { assets } from './AssetLoader';

interface Channel {
  el: HTMLAudioElement;
  baseVolume: number;
  fadeRaf: number | null;
}

class AudioManager {
  private music: Channel | null = null;
  private sfxVolume = 1.0;
  private musicVolume = 0.6;
  private cache = new Map<string, HTMLAudioElement>();
  private unlocked = false;

  unlockOnFirstGesture(): void {
    if (this.unlocked) return;
    const unlock = (): void => {
      this.unlocked = true;
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
      if (this.music && this.music.el.paused) this.music.el.play().catch(() => undefined);
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
    let template = this.cache.get(path);
    if (!template) {
      template = new Audio(assets.toUrl(path));
      this.cache.set(path, template);
    }
    const clone = template.cloneNode(true) as HTMLAudioElement;
    clone.volume = Math.max(0, Math.min(1, volume * this.sfxVolume));
    try {
      await clone.play();
    } catch {
      // ignore — usually autoplay restriction before first gesture
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
