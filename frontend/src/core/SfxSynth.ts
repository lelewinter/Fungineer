/**
 * SfxSynth.ts — gerador de EFEITOS sonoros por codigo (Web Audio API).
 *
 * A pasta de audios do projeto vem vazia, entao todo pedido de efeito sonoro
 * (playSfx) acaba dando erro 404. Em vez de o jogo ficar mudo, o AudioManager
 * cai para este sintetizador: ele cria sons curtos NA HORA, a partir de simples
 * osciladores (ondas matematicas: triangular, quadrada, etc.) e rajadas de
 * ruido. Assim, todo o "design de som" e audivel sem nenhum arquivo de audio.
 *
 * Como ele escolhe o som? A partir do NOME do arquivo pedido. O nome indica a
 * "familia" do efeito (Click_, Confirm_, Complete_ e os semanticos do jogo: hit,
 * alarm, jump, push, munch, powerup, pickup), e o numero no final (ex.: _04) vira
 * uma pequena variacao, para cliques repetidos nao soarem identicos.
 *
 * Se um dia arquivos de audio reais forem adicionados, eles tem prioridade — este
 * synth so e acionado quando um arquivo realmente falha ao carregar.
 *
 * Conceitos de audio usados aqui:
 *   - oscilador: gera uma onda sonora (a "voz" pura de uma nota).
 *   - envelope (gain ao longo do tempo): controla como o som sobe e some, para
 *     nao haver "clique" de corte seco. Tem ataque (subida) e decaimento (queda).
 *   - filtro bandpass: deixa passar so uma faixa de frequencias do ruido.
 */

import { getAudioContext, resumeAudioContext } from './audioContext';

type OscType = OscillatorType;

/** Parametros de uma nota gerada por `tone()`. */
interface ToneOpts {
  /** Formato da onda (timbre): triangle, sine, square, sawtooth. */
  type?: OscType;
  /** Desliza o tom ate esta frequencia ao longo da nota (Hz). */
  slideTo?: number;
  /** Duracao da nota, em segundos. */
  dur?: number;
  /** Tempo de ataque (subida linear do volume), em segundos. */
  attack?: number;
  /** Volume de pico (antes do master), 0..1. */
  gain?: number;
  /** Atraso para comecar, contado a partir de "agora", em segundos. */
  at?: number;
}

/** Descricao de um efeito: familia de timbre + indice de variacao (base 1). */
interface SfxSpec {
  family: string;
  index: number;
}

class SfxSynth {
  // No de volume mestre por onde passa todo efeito (criado sob demanda).
  private master: GainNode | null = null;
  // Buffer de ruido branco reutilizavel (gerado uma vez) para impactos/atritos.
  private noise: AudioBuffer | null = null;
  // Alterna entre dois tons no efeito "munch" (o "wakka" do Pac-Man).
  private munchToggle = false;

  /** Retoma o contexto de audio apos um gesto do usuario (politica de autoplay). */
  resume(): void {
    resumeAudioContext();
  }

  /**
   * Toca um efeito sintetizado para o caminho dado, com volume `gain` (0..1).
   * Decide qual "voz" usar a partir da familia extraida do nome do arquivo.
   */
  play(path: string, gain: number): void {
    if (gain <= 0) return;
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
      case 'push': return this.voicePush(g);
      case 'munch': return this.voiceMunch(g);
      case 'powerup': return this.voicePowerup(g);
      case 'pickup': return this.voicePickup(spec, g);
      case 'launch': return this.voiceLaunch(g);
      case 'click':
      default:
        return this.voiceClick(spec, g);
    }
  }

  // ── Vozes (cada uma "desenha" um efeito sonoro especifico) ───────────────────

  /** Tique de interface seco. O indice de variacao desloca um pouco o tom. */
  private voiceClick(spec: SfxSpec, gain: number): void {
    const base = 520 + (spec.index - 1) * 36;
    this.tone(base, { type: 'triangle', slideTo: base * 0.82, dur: 0.06, attack: 0.002, gain: 0.5 * gain });
  }

  /** Chilrear de dois passos subindo — pickups / abrir painel / confirmacoes. */
  private voiceConfirm(spec: SfxSpec, gain: number): void {
    const root = 540 + (spec.index - 1) * 18;
    this.tone(root, { type: 'triangle', dur: 0.08, attack: 0.002, gain: 0.42 * gain });
    this.tone(root * 1.5, { type: 'triangle', dur: 0.1, attack: 0.002, gain: 0.42 * gain, at: 0.055 });
  }

  /** Arpejo de tres notas subindo — vitoria / objetivo concluido. */
  private voiceComplete(_spec: SfxSpec, gain: number): void {
    const notes = [523.25, 659.25, 783.99]; // C5 E5 G5
    notes.forEach((f, i) => {
      this.tone(f, { type: 'triangle', dur: 0.16, attack: 0.003, gain: 0.4 * gain, at: i * 0.07 });
    });
  }

  /**
   * Impacto percussivo — dano / derrota. Uma rajada de ruido sobre um "baque"
   * grave. Com index > 1 (derrota) fica mais grave e ressoa um pouco mais.
   */
  private voiceHit(spec: SfxSpec, gain: number): void {
    const heavy = spec.index > 1;
    this.burstNoise({ dur: heavy ? 0.16 : 0.11, freq: heavy ? 520 : 900, q: 1.1, gain: 0.5 * gain });
    const f0 = heavy ? 150 : 200;
    this.tone(f0, { type: 'sine', slideTo: f0 * 0.55, dur: heavy ? 0.2 : 0.13, attack: 0.001, gain: 0.6 * gain });
  }

  /** Bip de aviso de dois tons — perigos / inicio de perseguicao. */
  private voiceAlarm(gain: number): void {
    this.tone(760, { type: 'square', dur: 0.1, attack: 0.002, gain: 0.28 * gain });
    this.tone(560, { type: 'square', dur: 0.12, attack: 0.002, gain: 0.28 * gain, at: 0.13 });
  }

  /** "Boing" leve subindo — pulos nas zonas so de movimento. */
  private voiceJump(gain: number): void {
    this.tone(300, { type: 'sine', slideTo: 640, dur: 0.12, attack: 0.001, gain: 0.4 * gain });
  }

  /** Blip agudo curtinho — coletas pequenas/incidentais. */
  private voicePickup(spec: SfxSpec, gain: number): void {
    this.tone(820 + (spec.index - 1) * 60, { type: 'triangle', dur: 0.06, attack: 0.001, gain: 0.4 * gain });
  }

  /** Deslize de bloco pesado — empurrar caixa (estilo Sokoban). Atrito + baque. */
  private voicePush(gain: number): void {
    this.burstNoise({ dur: 0.14, freq: 240, q: 0.8, gain: 0.32 * gain });
    this.tone(120, { type: 'sine', slideTo: 90, dur: 0.16, attack: 0.004, gain: 0.5 * gain });
  }

  /** "Wakka" do Pac-Man — alterna dois tons a cada pastilha comida. */
  private voiceMunch(gain: number): void {
    this.munchToggle = !this.munchToggle;
    const f = this.munchToggle ? 440 : 300;
    this.tone(f, { type: 'square', slideTo: f * 0.7, dur: 0.05, attack: 0.001, gain: 0.22 * gain });
  }

  /** Arpejo brilhante de quatro notas subindo — power pellet / coleta importante. */
  private voicePowerup(gain: number): void {
    const notes = [440, 554.37, 659.25, 880]; // A4 C#5 E5 A5
    notes.forEach((f, i) => {
      this.tone(f, { type: 'triangle', dur: 0.09, attack: 0.002, gain: 0.34 * gain, at: i * 0.05 });
    });
  }

  /**
   * Decolagem do bio-foguete (~5s) — o som do climax do loop. Acompanha as
   * fases do RocketLaunchOverlay: contagem (3 pulsos graves), ignicao (rajada),
   * subida (rumble de ruido em loop com filtro abrindo e fechando = doppler) e
   * o "bloom" final (acorde quente de germinacao na batida de pausa).
   */
  private voiceLaunch(gain: number): void {
    const ctx = this.ensureContext();
    const master = this.master;
    if (!ctx || !master) return;
    const buf = this.ensureNoise(ctx);
    if (!buf) return;
    const t0 = ctx.currentTime;

    // Fase 0 — contagem: tres pulsos graves (casam com os aneis do overlay).
    for (let i = 0; i < 3; i++) {
      this.tone(110, { type: 'sine', slideTo: 80, dur: 0.18, attack: 0.004, gain: 0.5 * gain, at: i * 0.25 });
    }

    // Fase 1+2 — rumble continuo: ruido em loop por um lowpass que abre na
    // ignicao (0.8s) e fecha conforme o foguete se afasta (ate ~4.2s).
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(140, t0 + 0.78);
    lp.frequency.exponentialRampToValueAtTime(900, t0 + 1.6);
    lp.frequency.exponentialRampToValueAtTime(200, t0 + 4.2);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, t0 + 0.78);
    env.gain.exponentialRampToValueAtTime(0.8 * gain, t0 + 1.5);
    env.gain.setValueAtTime(0.8 * gain, t0 + 2.4);
    env.gain.exponentialRampToValueAtTime(0.0001, t0 + 4.3);
    src.connect(lp).connect(env).connect(master);
    src.start(t0 + 0.78);
    src.stop(t0 + 4.4);
    src.onended = (): void => {
      src.disconnect();
      lp.disconnect();
      env.disconnect();
    };

    // Sub-grave da ignicao: o "empurrao" que desliza enquanto o foguete sobe.
    this.tone(55, { type: 'sawtooth', slideTo: 36, dur: 2.8, attack: 0.4, gain: 0.45 * gain, at: 0.8 });
    // Assobio fino da subida (vapor / esporos cortando o ar).
    this.tone(1700, { type: 'sine', slideTo: 480, dur: 2.2, attack: 0.5, gain: 0.1 * gain, at: 1.6 });

    // Fase 3 — bloom: acorde quente (C maior) na pausa antes do painel.
    const chord = [261.63, 329.63, 392.0, 523.25]; // C4 E4 G4 C5
    chord.forEach((f, i) => {
      this.tone(f, { type: 'triangle', dur: 1.2, attack: 0.06, gain: 0.18 * gain, at: 4.4 + i * 0.06 });
    });
  }

  // ── Primitivos (os "tijolos" que as vozes acima combinam) ────────────────────

  /**
   * Toca uma nota: cria um oscilador e o passa por um envelope de volume que
   * sobe (ataque) e cai suavemente (decaimento), evitando estalos de corte seco.
   */
  private tone(freq: number, opts: ToneOpts): void {
    const ctx = getAudioContext();
    const master = this.master;
    if (!ctx || !master) return;
    const dur = opts.dur ?? 0.1;
    const peak = opts.gain ?? 0.4;
    const attack = opts.attack ?? 0.003;
    const t0 = ctx.currentTime + (opts.at ?? 0);

    const osc = ctx.createOscillator();
    osc.type = opts.type ?? 'triangle';
    osc.frequency.setValueAtTime(freq, t0);
    // Deslizamento de tom opcional (efeito de "subida/descida" da nota).
    if (opts.slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(1, opts.slideTo), t0 + dur);

    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, t0);
    env.gain.linearRampToValueAtTime(peak, t0 + attack);
    env.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

    osc.connect(env).connect(master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
    // Limpa os nos de audio quando a nota termina, para nao vazar memoria.
    osc.onended = (): void => {
      osc.disconnect();
      env.disconnect();
    };
  }

  /**
   * Toca uma rajada curta de ruido passada por um filtro bandpass (deixa so uma
   * faixa de frequencia). E a base de impactos e atritos.
   */
  private burstNoise(opts: { dur: number; freq: number; q: number; gain: number }): void {
    const ctx = getAudioContext();
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
    // Q controla a "estreiteza" da faixa: maior = som mais focado/ressonante.
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

  /** Garante que o contexto e o no de volume mestre existem (cria na 1a vez). */
  private ensureContext(): AudioContext | null {
    const ctx = getAudioContext();
    if (!ctx) return null;
    if (!this.master) {
      this.master = ctx.createGain();
      this.master.gain.value = 0.9;
      this.master.connect(ctx.destination);
    }
    return ctx;
  }

  /** Gera (uma unica vez) um pequeno buffer de ruido branco, reutilizado depois. */
  private ensureNoise(ctx: AudioContext): AudioBuffer | null {
    if (this.noise) return this.noise;
    const len = Math.floor(ctx.sampleRate * 0.3);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    // Ruido branco = amostras aleatorias entre -1 e 1.
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    this.noise = buf;
    return buf;
  }
}

/**
 * Extrai a familia de timbre + indice de variacao a partir do caminho do efeito:
 *   ".../ui/Click_04.wav" -> { family: 'click', index: 4 }
 *   ".../game/hit.wav"    -> { family: 'hit',   index: 1 }
 */
function parseSpec(path: string): SfxSpec {
  const file = path.split('/').pop() ?? path;
  const stem = file.replace(/\.[a-z0-9]+$/i, '').toLowerCase();
  const parts = stem.split('_');
  let index = 1;
  // Se a ultima parte for um numero, ela e o indice de variacao (e sai do nome).
  if (parts.length > 1) {
    const n = Number.parseInt(parts[parts.length - 1]!, 10);
    if (Number.isFinite(n) && n > 0) {
      index = n;
      parts.pop();
    }
  }
  return { family: parts.join('_') || 'click', index };
}

/** Instancia unica e compartilhada do sintetizador de efeitos. */
export const sfxSynth = new SfxSynth();
