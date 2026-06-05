/**
 * AudioManager.ts — o "regente" de todo o som do jogo.
 *
 * E o ponto central por onde o jogo pede sons: musica de fundo e efeitos (SFX).
 * Ele cuida de:
 *   - tocar/parar musica com transicoes suaves (fade);
 *   - tocar efeitos sonoros (podendo varios ao mesmo tempo);
 *   - controlar os volumes de musica e de efeitos separadamente;
 *   - "desbloquear" o audio no primeiro toque/clique do usuario (os navegadores
 *     proibem som automatico antes de uma interacao).
 *
 * Truque importante: a pasta de audios do projeto vem VAZIA. Quando um arquivo
 * de som nao existe (da erro 404), em vez de ficar mudo, o jogo cai para os
 * sintetizadores que GERAM o som por codigo (SfxSynth para efeitos, MusicSynth
 * para musica). Se um dia arquivos reais forem adicionados, eles tem prioridade.
 *
 * Exporta uma unica instancia pronta: `audioManager`.
 */

import { assets } from './AssetLoader';
import { sfxSynth } from './SfxSynth';
import { musicSynth } from './MusicSynth';

/** Opcoes ao tocar uma musica. */
interface MusicOpts {
  /** Repetir em loop ao terminar (padrao: true). */
  loop?: boolean;
  /** Volume base da faixa, 0..1 (padrao: 1). */
  volume?: number;
  /** Duracao do fade de entrada/saida, em ms. */
  fadeMs?: number;
}

/** Um "canal" de musica: o elemento de audio HTML em uso e seus controles. */
interface Channel {
  el: HTMLAudioElement;
  baseVolume: number;
  // Identificador do frame de animacao do fade em andamento (para poder cancelar).
  fadeRaf: number | null;
}

class AudioManager {
  // Canal de musica atualmente tocando (arquivo real). null = nenhum.
  private music: Channel | null = null;
  // Musica pedida ANTES do desbloqueio; sera tocada assim que o usuario interagir.
  private pendingMusic: { path: string; opts: MusicOpts } | null = null;
  private sfxVolume = 1.0;
  private musicVolume = 0.6;
  // Cache de elementos de audio por caminho (para clonar e tocar efeitos rapido).
  private cache = new Map<string, HTMLAudioElement>();
  /** Caminhos de SFX cujo arquivo falhou ao carregar — vao para o synth procedural. */
  private missingSfx = new Set<string>();
  /** Caminhos de musica que deram 404 — vao para o MusicSynth generativo. */
  private missingMusic = new Set<string>();
  // O MusicSynth (musica gerada por codigo) esta tocando agora?
  private synthMusicActive = false;
  /** Ultima faixa pedida; protege contra fallbacks atrasados de faixas antigas. */
  private lastMusicPath: string | null = null;
  // O audio ja foi liberado por um gesto do usuario?
  private unlocked = false;

  /**
   * Prepara o desbloqueio do audio: no PRIMEIRO toque/clique/tecla do usuario,
   * libera o som (politica de autoplay dos navegadores) e toca qualquer musica
   * que estava esperando. So precisa ser chamado uma vez.
   */
  unlockOnFirstGesture(): void {
    if (this.unlocked) return;
    const unlock = (): void => {
      this.unlocked = true;
      sfxSynth.resume();
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
      // Havia musica esperando o desbloqueio? Toca agora. Senao, retoma a que
      // ja estava no canal (caso tenha sido pausada pelo navegador).
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

  /** Ajusta o volume geral da musica (0..1) e aplica no canal/synth em uso. */
  setMusicVolume(v: number): void {
    this.musicVolume = Math.max(0, Math.min(1, v));
    if (this.music) this.music.el.volume = this.music.baseVolume * this.musicVolume;
    musicSynth.setUserVolume(this.musicVolume);
  }

  /** Ajusta o volume geral dos efeitos sonoros (0..1). */
  setSfxVolume(v: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, v));
  }

  /**
   * Toca uma musica de fundo. Se o audio ainda nao foi desbloqueado, guarda o
   * pedido para tocar depois. Se o arquivo nao existir, cai para o MusicSynth.
   */
  async playMusic(path: string, opts: MusicOpts = {}): Promise<void> {
    if (!this.unlocked) {
      this.pendingMusic = { path, opts };
      return;
    }
    this.lastMusicPath = path;

    // Faixa que ja sabemos estar ausente -> musica generativa direto.
    if (this.missingMusic.has(path)) {
      this.startSynthMusic(path, opts);
      return;
    }

    const next = new Audio(assets.toUrl(path));
    next.loop = opts.loop ?? true;
    const baseVolume = opts.volume ?? 1.0;
    next.volume = 0;
    // Se o arquivo der erro, marca como ausente e cai para o synth — mas so se
    // esta ainda for a faixa mais recente pedida (evita fallback atrasado).
    next.addEventListener('error', () => {
      this.missingMusic.add(path);
      if (this.lastMusicPath === path) this.startSynthMusic(path, opts);
    }, { once: true });

    // Abaixa/pausa a musica anterior (com fade, se houver) antes de trocar.
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
      // Ja passamos do desbloqueio, entao uma rejeicao aqui significa arquivo
      // ausente (404), nao bloqueio de autoplay -> cai para musica generativa.
      this.missingMusic.add(path);
      if (this.lastMusicPath === path) this.startSynthMusic(path, opts);
      return;
    }
    // Um arquivo real esta tocando -> aposenta qualquer fallback generativo.
    if (this.synthMusicActive) {
      musicSynth.stop(opts.fadeMs ?? 0);
      this.synthMusicActive = false;
    }
    this.music = newChannel;
    // Sobe o volume da nova faixa com fade de entrada.
    this.fade(newChannel, 0, baseVolume * this.musicVolume, opts.fadeMs ?? 0);
  }

  /**
   * Encaminha uma faixa ausente para o MusicSynth (musica gerada por codigo),
   * silenciando qualquer elemento de audio HTML que tenha comecado (mudo).
   */
  private startSynthMusic(path: string, opts: MusicOpts): void {
    if (this.music) {
      this.music.el.pause();
      this.music = null;
    }
    this.synthMusicActive = true;
    musicSynth.setUserVolume(this.musicVolume);
    musicSynth.play(path, { volume: opts.volume ?? 1.0, fadeMs: opts.fadeMs ?? 0 });
  }

  /** Para a musica atual (arquivo ou synth), opcionalmente com fade de saida. */
  stopMusic(fadeMs: number = 0): void {
    this.pendingMusic = null;
    this.lastMusicPath = null;
    if (this.synthMusicActive) {
      musicSynth.stop(fadeMs);
      this.synthMusicActive = false;
    }
    if (!this.music) return;
    const ch = this.music;
    if (fadeMs > 0) {
      this.fade(ch, ch.el.volume, 0, fadeMs, () => ch.el.pause());
    } else {
      ch.el.pause();
    }
    this.music = null;
  }

  /**
   * Toca um efeito sonoro. Permite sobreposicao (varios ao mesmo tempo) clonando
   * um elemento de audio "modelo" guardado em cache. Se o arquivo nao existir,
   * cai para o SfxSynth (efeito gerado por codigo).
   */
  async playSfx(path: string, volume: number = 1.0): Promise<void> {
    const gain = Math.max(0, Math.min(1, volume * this.sfxVolume));
    if (gain <= 0) return;

    // Asset ja conhecido como ausente -> direto para o synth procedural.
    if (this.missingSfx.has(path)) {
      sfxSynth.play(path, gain);
      return;
    }

    let template = this.cache.get(path);
    if (!template) {
      template = new Audio(assets.toUrl(path));
      this.cache.set(path, template);
      // Uma falha de rede dispara o evento 'error' de forma assincrona; anotamos
      // para que as proximas chamadas pulem o elemento e sintetizem o som.
      template.addEventListener('error', () => { this.missingSfx.add(path); }, { once: true });
    }
    if (template.error) {
      this.missingSfx.add(path);
      sfxSynth.play(path, gain);
      return;
    }

    // Clona o modelo para poder tocar varias instancias sobrepostas.
    const clone = template.cloneNode(true) as HTMLAudioElement;
    clone.volume = gain;
    try {
      await clone.play();
    } catch {
      // Rejeitado ANTES do primeiro gesto -> restricao de autoplay, ignora.
      // Rejeitado DEPOIS -> o arquivo nao existe (404); cai para o synth e anota
      // o caminho para nao ficar tentando a rede de novo.
      if (this.unlocked) {
        this.missingSfx.add(path);
        sfxSynth.play(path, gain);
      }
    }
  }

  /**
   * Faz a transicao suave (fade) do volume de um canal, de `from` para `to` ao
   * longo de `ms` milissegundos, animando frame a frame. Com ms <= 0, aplica o
   * volume final na hora. `onDone` roda ao terminar (ex.: pausar o audio).
   */
  private fade(ch: Channel, from: number, to: number, ms: number, onDone?: () => void): void {
    // Cancela um fade anterior em andamento neste canal, para nao brigarem.
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

/** Instancia unica e global do gerenciador de audio. */
export const audioManager = new AudioManager();
