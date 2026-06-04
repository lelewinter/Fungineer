import { Signal } from '../core/Signal';
import { audioManager } from '../core/AudioManager';

/**
 * Audio preferences — music / sfx volume + a master mute, persisted to
 * localStorage independently of the game save (so they survive even with no
 * backend / before a save exists) and pushed into the AudioManager.
 *
 * Effective volume = muted ? 0 : level. The chosen levels are remembered while
 * muted so unmuting restores them.
 */

const KEY = 'fungineer.audio.v1';

interface Prefs {
  music: number;
  sfx: number;
  muted: boolean;
}

const DEFAULTS: Prefs = { music: 0.6, sfx: 1.0, muted: false };

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

class AudioSettings {
  /** Emitted whenever a preference changes — lets UI widgets resync. */
  readonly changed = new Signal<[]>();

  private prefs: Prefs = { ...DEFAULTS };
  private loaded = false;

  /** Load persisted prefs and push them into the AudioManager. Call once at boot. */
  init(): void {
    this.load();
    this.apply();
  }

  get music(): number { return this.prefs.music; }
  get sfx(): number { return this.prefs.sfx; }
  get muted(): boolean { return this.prefs.muted; }

  setMusic(v: number): void {
    this.prefs.music = clamp01(v);
    this.commit();
  }

  setSfx(v: number): void {
    this.prefs.sfx = clamp01(v);
    this.commit();
  }

  setMuted(b: boolean): void {
    this.prefs.muted = b;
    this.commit();
  }

  toggleMuted(): void {
    this.setMuted(!this.prefs.muted);
  }

  private commit(): void {
    this.persist();
    this.apply();
    this.changed.emit();
  }

  private apply(): void {
    audioManager.setMusicVolume(this.prefs.muted ? 0 : this.prefs.music);
    audioManager.setSfxVolume(this.prefs.muted ? 0 : this.prefs.sfx);
  }

  private load(): void {
    if (this.loaded) return;
    this.loaded = true;
    try {
      const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(KEY) : null;
      if (!raw) return;
      const p = JSON.parse(raw) as Partial<Prefs>;
      if (typeof p.music === 'number') this.prefs.music = clamp01(p.music);
      if (typeof p.sfx === 'number') this.prefs.sfx = clamp01(p.sfx);
      if (typeof p.muted === 'boolean') this.prefs.muted = p.muted;
    } catch {
      // Corrupt / unavailable storage — fall back to defaults.
    }
  }

  private persist(): void {
    try {
      if (typeof localStorage !== 'undefined') localStorage.setItem(KEY, JSON.stringify(this.prefs));
    } catch {
      // Quota / private-mode — non-fatal, prefs just won't persist.
    }
  }
}

export const audioSettings = new AudioSettings();
