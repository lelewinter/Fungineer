/**
 * MusicSynth.ts — musica de fundo gerada por codigo, em loop infinito (Web Audio).
 *
 * Companheiro do SfxSynth: como a pasta de musicas vem vazia, todo pedido de
 * musica (playMusic) da erro 404. O AudioManager entao cai para este modulo, que
 * COMPOE musica na hora, sem fim e sem emendas audiveis, a partir de um "clima"
 * (mood) deduzido do nome do arquivo (menu / battle / field / dungeon / night).
 *
 * Cada clima e um pequeno arranjo generativo, com tres "instrumentos":
 *   - PAD: acordes longos e suaves ao fundo (a "cama" harmonica).
 *   - BASS (baixo): notas graves marcando o ritmo.
 *   - MELODIA: uma linha que "passeia" pelas notas da escala, puxando para as
 *     notas do acorde para soar agradavel.
 *
 * Tudo isso sobre uma progressao de acordes fixa, tocado por um "scheduler de
 * look-ahead": em vez de tocar cada nota no exato instante (impreciso no
 * navegador), agendamos com pequena antecedencia no relogio preciso do Web Audio.
 *
 * Arquivos de musica reais, quando existirem, tem prioridade — o synth so roda
 * como fallback. Fades e o controle de volume da musica sao respeitados.
 *
 * Glossario musical: BPM = batidas por minuto (andamento); escala = conjunto de
 * notas permitidas; grau = posicao de uma nota dentro da escala; MIDI = forma
 * numerica padrao de nomear notas (69 = La 440Hz).
 */

import { getAudioContext, resumeAudioContext } from './audioContext';

type Mood = 'menu' | 'battle' | 'field' | 'dungeon' | 'night' | 'ambient';

/** Configuracao de um "clima" musical (a receita do arranjo). */
interface MoodCfg {
  /** Andamento em batidas por minuto. */
  bpm: number;
  /** Nota raiz (tonica) do tom, em numero MIDI. */
  root: number;
  /** A escala, como deslocamentos em semitons a partir da raiz. */
  scale: number[];
  /** Grau do acorde (posicao na escala) em cada um dos 4 compassos do loop. */
  prog: number[];
  /** Probabilidade de surgir uma nota de melodia a cada 1/16 de compasso. */
  density: number;
  melodyWave: OscillatorType;
  bassWave: OscillatorType;
  padWave: OscillatorType;
  /** Ajuste geral de volume do clima. */
  trim: number;
}

// As receitas de cada clima. Mexer nestes numeros muda o "humor" da musica.
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

// Estrutura do loop: 16 passos (1/16) por compasso, 4 compassos no total.
const STEPS_PER_BAR = 16;
const BARS = 4;
const TOTAL_STEPS = STEPS_PER_BAR * BARS;
// Cada quanto o scheduler "acorda" para agendar notas, em ms.
const LOOKAHEAD_MS = 25;
// Quanto a frente, em segundos, agendamos notas no relogio do Web Audio.
const SCHEDULE_AHEAD = 0.12;

class MusicSynth {
  /** Volume = (volume da musica) x (volume da faixa), aplicado a mistura toda. */
  private volGain: GainNode | null = null;
  /** Envelope de fade (0..1), animado ao iniciar/parar. */
  private fadeGain: GainNode | null = null;
  // O temporizador que dispara o scheduler repetidamente.
  private timer: ReturnType<typeof setInterval> | null = null;

  private mood: Mood = 'ambient';
  private cfg: MoodCfg = MOODS.ambient;
  private currentPath: string | null = null;
  private playing = false;

  // Estado do scheduler: passo atual no loop, proximo instante a agendar, etc.
  private step = 0;
  private nextTime = 0;
  private melodyIdx = 0;
  private userVolume = 1;
  private trackVolume = 1;

  /** Retoma o contexto de audio apos um gesto do usuario (politica de autoplay). */
  resume(): void {
    resumeAudioContext();
  }

  /**
   * Inicia (ou mantem) a musica generativa para `path`. Se a mesma faixa ja
   * estiver tocando, apenas reaplica o volume e nao reinicia (idempotente).
   */
  play(path: string, opts: { volume?: number; fadeMs?: number } = {}): void {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') void ctx.resume();

    this.trackVolume = opts.volume ?? 1;
    if (this.playing && this.currentPath === path) {
      this.applyVolume();
      return;
    }

    // Para o que estiver tocando e prepara o novo clima.
    this.stop(0);
    this.currentPath = path;
    this.mood = moodFromPath(path);
    this.cfg = MOODS[this.mood];

    // Cadeia de audio: cada nota -> fadeGain (controla fade) -> volGain (controla
    // volume) -> saida do alto-falante.
    this.volGain = ctx.createGain();
    this.fadeGain = ctx.createGain();
    this.applyVolume();
    this.fadeGain.gain.value = 0.0001;
    this.fadeGain.connect(this.volGain).connect(ctx.destination);

    // Fade de entrada (se pedido): sobe o volume suavemente do silencio ate o cheio.
    const fade = opts.fadeMs ?? 0;
    if (fade > 0) {
      this.fadeGain.gain.setValueAtTime(0.0001, ctx.currentTime);
      this.fadeGain.gain.exponentialRampToValueAtTime(1, ctx.currentTime + fade / 1000);
    } else {
      this.fadeGain.gain.value = 1;
    }

    this.step = 0;
    // Comeca a melodia num ponto aleatorio da escala, para variar entre execucoes.
    this.melodyIdx = (Math.random() * this.cfg.scale.length) | 0;
    this.nextTime = ctx.currentTime + 0.06;
    this.playing = true;
    this.timer = setInterval(() => this.schedule(), LOOKAHEAD_MS);
  }

  /** Para a musica, opcionalmente com fade de saida em `fadeMs` milissegundos. */
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
      // Fade de saida: desce o volume suavemente e desconecta os nos depois.
      const t = ctx.currentTime;
      fadeGain.gain.cancelScheduledValues(t);
      fadeGain.gain.setValueAtTime(Math.max(0.0001, fadeGain.gain.value), t);
      fadeGain.gain.exponentialRampToValueAtTime(0.0001, t + fadeMs / 1000);
      const vol = this.volGain;
      const old = fadeGain;
      window.setTimeout(() => {
        try { old.disconnect(); vol?.disconnect(); } catch { /* ja foi removido */ }
      }, fadeMs + 80);
    } else {
      try { fadeGain?.disconnect(); this.volGain?.disconnect(); } catch { /* ja foi removido */ }
    }
    this.fadeGain = null;
    this.volGain = null;
  }

  /** Define o volume "do usuario" (slider de musica) e reaplica na mistura. */
  setUserVolume(v: number): void {
    this.userVolume = Math.max(0, Math.min(1, v));
    this.applyVolume();
  }

  /** Recalcula e aplica o volume final da mistura (clima x usuario x faixa). */
  private applyVolume(): void {
    if (this.volGain) this.volGain.gain.value = 0.5 * this.cfg.trim * this.userVolume * this.trackVolume;
  }

  // ── Scheduler (agenda as notas com pequena antecedencia) ─────────────────────

  /** Duracao de um 1/16 (semicolcheia), em segundos: (60/bpm)/4 = 15/bpm. */
  private sixteenthDur(): number {
    return 15 / this.cfg.bpm;
  }

  /**
   * Roda periodicamente: agenda todas as notas que caem dentro da pequena janela
   * de antecipacao (SCHEDULE_AHEAD), avancando o passo e o relogio do loop.
   */
  private schedule(): void {
    const ctx = getAudioContext();
    if (!ctx || !this.playing) return;
    const stepDur = this.sixteenthDur();
    while (this.nextTime < ctx.currentTime + SCHEDULE_AHEAD) {
      this.scheduleStep(this.step, this.nextTime);
      // Avanca para o proximo passo, voltando ao inicio ao fim do loop.
      this.step = (this.step + 1) % TOTAL_STEPS;
      this.nextTime += stepDur;
    }
  }

  /** Decide e agenda o que toca em um passo (1/16) especifico do loop. */
  private scheduleStep(step: number, time: number): void {
    const cfg = this.cfg;
    const sixteenth = this.sixteenthDur();
    const bar = Math.floor(step / STEPS_PER_BAR);
    const beat = step % STEPS_PER_BAR;
    // Qual grau de acorde rege este compasso (segundo a progressao do clima).
    const chordDeg = cfg.prog[bar % cfg.prog.length]!;

    // PAD — acorde sustentado pelo compasso inteiro, grave e suave.
    if (beat === 0) {
      const barDur = sixteenth * STEPS_PER_BAR;
      // Toca tres notas do acorde (raiz, terca e quinta = graus 0, 2 e 4).
      for (const d of [0, 2, 4]) {
        this.note(this.degToMidi(chordDeg + d, 0), time, barDur * 0.98, 0.07, cfg.padWave, 0.18);
      }
    }

    // BASS — raiz do acorde no inicio do compasso e na metade dele.
    if (beat === 0 || beat === 8) {
      this.note(this.degToMidi(chordDeg, -1), time, sixteenth * 6, 0.22, cfg.bassWave, 0.012);
    }
    // No clima "battle", o baixo pulsa em colcheias para dar impulso.
    if (this.mood === 'battle' && beat % 2 === 0) {
      this.note(this.degToMidi(chordDeg, -1), time, sixteenth * 1.4, 0.12, cfg.bassWave, 0.004);
    }

    // MELODIA — uma linha que passeia, puxada para as notas do acorde.
    if (Math.random() < cfg.density) {
      const wander = (Math.random() * 3 | 0) - 1; // -1, 0 ou 1 (sobe, fica, desce)
      this.melodyIdx = clampIdx(this.melodyIdx + wander, cfg.scale.length);
      // De vez em quando, fixa numa nota do acorde para soar mais consonante.
      const deg = beat % 4 === 0 ? chordDeg + (Math.random() < 0.5 ? 0 : 2) : this.melodyIdx;
      this.note(this.degToMidi(deg, 1), time, sixteenth * 1.6, 0.1, cfg.melodyWave, 0.006);
    }
  }

  /**
   * Converte um grau da escala (com deslocamento de oitava) para nota MIDI, no
   * tom deste clima. Lida com graus que "passam" do fim da escala, subindo de oitava.
   */
  private degToMidi(deg: number, octave: number): number {
    const len = this.cfg.scale.length;
    const idx = ((deg % len) + len) % len;
    const oct = Math.floor(deg / len) + octave;
    return this.cfg.root + this.cfg.scale[idx]! + oct * 12;
  }

  /**
   * Toca uma unica nota da musica: cria um oscilador, aplica um envelope de
   * volume (ataque + decaimento) e o liga a cadeia de fade/volume.
   */
  private note(
    midi: number, time: number, dur: number, gain: number, wave: OscillatorType, attack: number,
  ): void {
    const ctx = getAudioContext();
    const out = this.fadeGain;
    if (!ctx || !out) return;
    const osc = ctx.createOscillator();
    osc.type = wave;
    // Converte o numero MIDI para frequencia em Hz (formula padrao, base La440).
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

  /** Cancela o temporizador do scheduler, se estiver ativo. */
  private clearTimer(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}

/** Deduz o clima musical a partir de palavras-chave no caminho da faixa. */
function moodFromPath(path: string): Mood {
  const p = path.toLowerCase();
  if (p.includes('battle')) return 'battle';
  if (p.includes('menu')) return 'menu';
  if (p.includes('field')) return 'field';
  if (p.includes('dungeon')) return 'dungeon';
  if (p.includes('night')) return 'night';
  return 'ambient';
}

/** Limita um indice ao intervalo valido de uma escala [0, len-1]. */
function clampIdx(i: number, len: number): number {
  if (i < 0) return 0;
  if (i > len - 1) return len - 1;
  return i;
}

/** Instancia unica e compartilhada do sintetizador de musica. */
export const musicSynth = new MusicSynth();
