import { Graphics } from 'pixi.js';
import { Color, type RGBA } from '../../core/Color';

/**
 * HubDrawKit — "kit de desenho" compartilhado do hub.
 *
 * O hub (a visão do bunker em corte) e desenhado inteiro com formas vetoriais
 * dentro de um unico objeto Graphics do PixiJS. Varios arquivos precisam
 * desenhar nesse mesmo Graphics e tambem saber "ha quanto tempo o hub esta na
 * tela" para animar (luzes piscando, esporos flutuando).
 *
 * Em vez de cada arquivo carregar essas duas coisas separadas, juntamos elas
 * neste pequeno contexto (DrawCtx). Pense nele como uma "prancheta" + um
 * "cronometro" que passamos para quem precisa desenhar.
 *
 * Aqui tambem mora o utilitario drawGradientRect, usado em varios lugares para
 * pintar um retangulo que muda de cor de cima para baixo (degrade/gradient).
 */

/** Contexto de desenho passado aos helpers de interior/foguete. */
export interface DrawCtx {
  /** O alvo de desenho (a "prancheta" vetorial onde tudo e pintado). */
  readonly g: Graphics;
  /** Tempo decorrido em milissegundos — base das animacoes baseadas em tempo. */
  readonly elapsedMs: number;
  /** Contador de "quadros" decorridos — usado por animacoes mais antigas que
   *  pulsam contando frames em vez de tempo real. */
  readonly elapsedFrames: number;
}

/**
 * Pinta um retangulo com degrade vertical (cor topo -> cor base).
 *
 * O Graphics do Pixi nao tem preenchimento em gradient nativo simples aqui,
 * entao simulamos: desenhamos uma pilha de linhas horizontais de 1px de altura,
 * cada uma com a cor interpolada entre o topo e a base. Quanto mais alto o
 * retangulo, mais linhas — por isso isto so e usado em areas pequenas.
 */
export function drawGradientRect(
  g: Graphics,
  x: number,
  y: number,
  w: number,
  h: number,
  top: RGBA,
  bot: RGBA,
): void {
  const steps = Math.ceil(h);
  for (let i = 0; i < steps; i++) {
    const t = i / steps;
    const c: RGBA = {
      r: top.r + (bot.r - top.r) * t,
      g: top.g + (bot.g - top.g) * t,
      b: top.b + (bot.b - top.b) * t,
      a: 1,
    };
    g.moveTo(x, y + i).lineTo(x + w, y + i).stroke({ color: Color.hex(c), width: 1 });
  }
}
