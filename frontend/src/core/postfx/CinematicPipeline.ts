/**
 * CinematicPipeline.ts — a "câmera de cinema" do jogo inteiro.
 *
 * É o pós-processamento de tela cheia, montado com os filtros do ecossistema
 * PixiJS (pixi-filters). Empilha, NESTA ordem (cada filtro processa a saída do
 * anterior):
 *
 *   1) GRADE  — color grade: escurece a base, sobe contraste/saturação e puxa as
 *               cores para o clima bio-punk das referências (sombras frias
 *               esverdeadas, luzes quentes/âmbar). É o que dá a "paleta" do jogo.
 *   2) BLOOM  — só as áreas brilhantes (neon, esporos, lanternas) sangram luz,
 *               como bioluminescência no escuro. É o maior salto de "vida".
 *   3) CRT    — o filtro retrô que já existia (scanlines, curvatura, vinheta),
 *               agora mais sutil porque o bloom já carrega o brilho.
 *
 * Vive no `stage` do App (tela cheia, sem escala), então TODAS as cenas — hub,
 * hordas, stealth, etc. — herdam o mesmo clima de graça.
 *
 * Tudo aqui é tunável em tempo real (ver os setters), para calibrar o visual /
 * baixar o custo em aparelhos fracos sem tocar no resto do código.
 */

import type { Filter } from 'pixi.js';
import { AdjustmentFilter, AdvancedBloomFilter } from 'pixi-filters';
import { CRTFilter } from '../filters/CRTFilter';

export interface CinematicOptions {
  /** Largura lógica da viewport (px) — usada pelo CRT. */
  viewportW: number;
  /** Altura lógica da viewport (px) — usada pelo CRT. */
  viewportH: number;
  /** Força do CRT (0..1). Padrão 0.12 (sutil, pois o bloom já dá brilho). */
  crtIntensity?: number;
}

export class CinematicPipeline {
  /** Color grade (paleta bio-punk: base fria, luzes quentes, mais contraste). */
  readonly grade: AdjustmentFilter;
  /** Bloom avançado: as áreas brilhantes sangram luz (bioluminescência). */
  readonly bloom: AdvancedBloomFilter;
  /** Filtro CRT retrô já existente (scanlines / curvatura / vinheta). */
  readonly crt: CRTFilter;
  /** A lista pronta para jogar em `stage.filters` (na ordem certa). */
  readonly filters: Filter[];

  constructor(opts: CinematicOptions) {
    // ── 1) COLOR GRADE ──────────────────────────────────────────────────────
    // O AdjustmentFilter aplica multiplicadores por canal + contraste/saturação.
    // Calibrado para o clima das referências: escuro, encorpado e quente.
    this.grade = new AdjustmentFilter({
      gamma: 1.08,        // aprofunda as sombras (escuro mais "rico")
      contrast: 1.2,      // separa luz e sombra — mais dramático
      saturation: 1.32,   // cores vivas (os esporos/cogumelos saltam)
      brightness: 0.95,   // base um pouco mais escura, atmosférica
      red: 1.06,          // leve calor: realça âmbar/laranja
      green: 1.0,
      blue: 0.93,         // tira azul das luzes -> tom de lanterna/fungo
      alpha: 1,
    });

    // ── 2) BLOOM ────────────────────────────────────────────────────────────
    // Só o que passa do `threshold` brilha; o resto fica intacto. É isso que
    // transforma traços de cor sólida em "luz viva" no escuro.
    this.bloom = new AdvancedBloomFilter({
      threshold: 0.62,    // mais alto: só luzes BEM brilhantes acendem — o texto
                          // da UI (off-white) não "borra" no glow, fica nítido.
      bloomScale: 1.2,    // intensidade do halo de luz
      brightness: 1.0,
      blur: 8,            // raio do sangramento de luz
      quality: 4,         // passes do blur (4 = bom equilíbrio custo/visual)
    });

    // ── 3) CRT (retrô) ──────────────────────────────────────────────────────
    this.crt = new CRTFilter({
      viewportW: opts.viewportW,
      viewportH: opts.viewportH,
      intensity: opts.crtIntensity ?? 0.12,
    });

    this.filters = [this.grade, this.bloom, this.crt];
  }

  /** Chamar uma vez por frame (anima a barra de brilho do CRT). */
  tick(): void {
    this.crt.tick();
  }

  /** Liga/desliga o bloom (ex.: modo de baixo custo em aparelho fraco). */
  setBloomEnabled(on: boolean): void {
    this.bloom.enabled = on;
  }

  /** Ajusta a intensidade do bloom em tempo real (0 = sem halo). */
  setBloomScale(scale: number): void {
    this.bloom.bloomScale = scale;
  }

  /** Ajusta a força do CRT em tempo real (0..1). */
  setCrtIntensity(v: number): void {
    this.crt.setIntensity(v);
  }
}
