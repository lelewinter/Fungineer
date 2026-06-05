/**
 * Color.ts — utilitarios de cor.
 *
 * Existem varias formas de representar uma cor no computador. Aqui guardamos as
 * cores num formato simples (r, g, b, a) onde cada canal vai de 0 a 1 — o mesmo
 * estilo usado na engine Godot. Estas funcoes convertem esse formato para os
 * dois formatos que o resto do jogo precisa:
 *   - hex(): um numero unico (ex.: 0xff00aa) que o PixiJS entende.
 *   - css(): um texto "rgba(...)" para quando precisamos estilizar via CSS/Canvas.
 *
 * r=vermelho (red), g=verde (green), b=azul (blue), a=opacidade (alpha).
 */

/** Uma cor com canais de 0 a 1. `a` (alpha) e a opacidade: 1 = opaco, 0 = transparente. */
export interface RGBA {
  r: number;
  g: number;
  b: number;
  a: number;
}

export const Color = {
  /** Cria uma cor a partir dos canais. `a` (opacidade) e opcional e vale 1 por padrao. */
  rgb(r: number, g: number, b: number, a: number = 1): RGBA {
    return { r, g, b, a };
  },

  /**
   * Converte a cor para um unico numero hexadecimal (o formato do PixiJS).
   * Cada canal (0..1) vira um valor 0..255, e depois sao "empacotados" em um
   * so numero usando deslocamento de bits: vermelho nos bits altos, depois
   * verde, depois azul. O alpha NAO entra aqui (o Pixi trata opacidade a parte).
   */
  hex(c: RGBA): number {
    const rr = Math.max(0, Math.min(255, Math.round(c.r * 255)));
    const gg = Math.max(0, Math.min(255, Math.round(c.g * 255)));
    const bb = Math.max(0, Math.min(255, Math.round(c.b * 255)));
    return (rr << 16) | (gg << 8) | bb;
  },

  /** Converte para a string CSS "rgba(r, g, b, a)" (usada em estilizacao web). */
  css(c: RGBA): string {
    return `rgba(${Math.round(c.r * 255)}, ${Math.round(c.g * 255)}, ${Math.round(c.b * 255)}, ${c.a})`;
  },

  // Cores prontas mais usadas, para evitar redigitar os canais toda hora.
  WHITE: { r: 1, g: 1, b: 1, a: 1 } as RGBA,
  BLACK: { r: 0, g: 0, b: 0, a: 1 } as RGBA,
  RED: { r: 1, g: 0, b: 0, a: 1 } as RGBA,
  GREEN: { r: 0, g: 1, b: 0, a: 1 } as RGBA,
  BLUE: { r: 0, g: 0, b: 1, a: 1 } as RGBA,
};
