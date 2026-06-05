import { Signal } from '../core/Signal';
import { audioManager } from '../core/AudioManager';

/**
 * AudioSettings — As preferencias de som do jogador.
 * --------------------------------------------------
 * Em linguagem simples: guarda o volume da musica, o volume dos efeitos
 * sonoros (sfx) e se o som esta mudo. Essas escolhas ficam salvas no proprio
 * navegador (localStorage), de forma separada do save do jogo — assim elas
 * continuam valendo mesmo sem servidor (backend) e antes de existir qualquer
 * save. Quando algo muda, avisamos o AudioManager para aplicar de verdade.
 *
 * Detalhe importante: o volume que realmente toca e "0 se estiver mudo, senao
 * o nivel escolhido". Mesmo no mudo, lembramos os niveis escolhidos — assim,
 * ao tirar do mudo, o som volta exatamente como estava.
 */

// Chave usada no localStorage. O "v1" permite trocar o formato no futuro
// sem quebrar saves antigos (e so checar a versao).
const KEY = 'fungineer.audio.v1';

// Estrutura das preferencias: dois volumes (0 a 1) e um liga/desliga do mudo.
interface Prefs {
  music: number;
  sfx: number;
  muted: boolean;
}

// Valores iniciais para quem nunca mexeu nas opcoes.
const DEFAULTS: Prefs = { music: 0.6, sfx: 1.0, muted: false };

// Garante que o volume nunca passe de 0..1 (clamp = "prender dentro do limite").
function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

class AudioSettings {
  /** Disparado sempre que uma preferencia muda — deixa a UI se atualizar. */
  readonly changed = new Signal<[]>();

  private prefs: Prefs = { ...DEFAULTS };
  private loaded = false;

  /** Carrega as preferencias salvas e as aplica no AudioManager.
   *  Chamar uma unica vez quando o jogo inicia (boot). */
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

  // Passo unico apos qualquer mudanca: salvar, aplicar no som e avisar a UI.
  private commit(): void {
    this.persist();
    this.apply();
    this.changed.emit();
  }

  // Empurra os volumes para o AudioManager (onde o som realmente acontece).
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
