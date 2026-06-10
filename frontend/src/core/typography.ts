/**
 * typography.ts — o "guia de estilo" de textos do jogo.
 *
 * Para o jogo ter aparencia consistente, todos os textos devem usar as MESMAS
 * fontes, tamanhos, pesos e cores definidos aqui, em vez de cada tela inventar os
 * seus. Pense neste arquivo como a paleta oficial de tipografia: mudou aqui,
 * muda em todo lugar.
 *
 * Termos: "font family" = familia de fonte (qual desenho de letra); "weight" =
 * peso/espessura da letra (fina, normal, negrito); "px" = pixels.
 */

/** Familias de fonte oficiais. Cada uma tem um papel especifico. */
export const FontFamily = {
  /**
   * "Major Mono Display" — decorativa; APENAS PARA O LOGO. E dificil de ler em
   * tamanhos pequenos, entao nunca use em texto que precisa ser lido (use a
   * `body` em negrito no lugar).
   */
  display: '"Major Mono Display", "Courier New", monospace',
  /** "Rubik" — texto corrido, rotulos, interface e titulos. */
  body: '"Rubik", system-ui, -apple-system, sans-serif',
  /** "IBM Plex Mono" — leituras do HUD, cronometros, dados estilo terminal. */
  mono: '"IBM Plex Mono", "JetBrains Mono", ui-monospace, monospace',
} as const;

/**
 * Escala de tamanhos (em px logicos). O mundo do jogo e desenhado a 480px de
 * largura e depois escalado para o aparelho, entao prefira os tamanhos maiores
 * de cada faixa para manter a legibilidade.
 */
export const FontSize = {
  micro: 12,   // o menor permitido — so para legendas minusculas
  small: 13,
  label: 14,   // botoes, rotulos de salas, info secundaria do HUD
  body: 15,    // briefings, paragrafos
  hud: 16,     // leituras principais do HUD
  h2: 20,      // cabecalhos de painel
  h1: 28,      // titulos de tela
} as const;

/** Pesos (espessuras) de fonte disponiveis. */
export const FontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  black: '900',
} as const;

/**
 * Cores de texto reutilizaveis ("tokens"), calibradas para bom contraste sobre
 * o fundo escuro da interface. Cada valor e um numero hexadecimal de cor.
 */
export const TextColor = {
  ink: 0xf2f7ec,            // texto principal sobre fundo escuro
  muted: 0xccd5c2,          // secundario — legivel, sem parecer apagado
  faint: 0xa3b09e,          // terciario
  accent: 0xcf8ff0,         // roxo "esporo" — mais brilhante
  bio: 0x77e8d8,            // turquesa "micelio" — mais brilhante
  amber: 0xf6b25e,
  red: 0xe87070,
  white: 0xffffff,
  black: 0x000000,
} as const;
