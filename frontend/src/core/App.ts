/**
 * App.ts — a fundacao tecnica do jogo (o "motor de tela").
 *
 * Esta classe embrulha o PixiJS (a biblioteca que desenha graficos 2D acelerados
 * pela placa de video) e cuida das tarefas de baixo nivel que todas as telas
 * dependem:
 *   - cria o renderer (o "pintor" que desenha na tela);
 *   - mantem dois containers: `stage` (tudo, alinhado a tela) e `world` (o mundo
 *     do jogo, que e escalado para caber no aparelho);
 *   - aplica o filtro CRT (efeito de TV antiga) por cima de tudo;
 *   - ajusta o tamanho do canvas quando a janela/aparelho muda (resize/fit),
 *     com cuidados especiais para celulares (a barra de URL que aparece e some).
 *
 * O jogo e desenhado num tamanho "logico" fixo (definido em GameConfig) e depois
 * escalado para o aparelho real — assim a interface fica consistente em qualquer
 * tela. Termos: "viewport" = area visivel; "DPR" = densidade de pixels do
 * aparelho; "ticker" = relogio que dispara cada frame.
 */

import { Application, Container } from 'pixi.js';
import { GameConfig } from '../state/GameConfig';
import { CRTFilter } from './filters/CRTFilter';

export class App {
  /** A aplicacao PixiJS (renderer, ticker, canvas...). */
  readonly pixi: Application;
  /** Container raiz que cobre a tela inteira, sem escala (onde mora o filtro CRT). */
  readonly stage: Container;
  /** Container do mundo do jogo — este sim e escalado para caber no aparelho. */
  readonly world: Container;
  /** O filtro de efeito CRT (TV antiga) aplicado a imagem final. */
  readonly crt: CRTFilter;

  // O elemento HTML que hospeda o canvas do jogo.
  private readonly host: HTMLElement;
  // Ultimo tamanho aplicado, para evitar refazer o resize sem necessidade.
  private lastW = -1;
  private lastH = -1;

  // Construtor privado: use App.create(...) para obter uma instancia pronta.
  private constructor(pixi: Application, host: HTMLElement) {
    this.pixi = pixi;
    this.host = host;
    this.stage = pixi.stage;
    this.world = new Container();
    this.world.label = 'WorldRoot';
    this.stage.addChild(this.world);

    this.crt = new CRTFilter({
      viewportW: GameConfig.VIEWPORT_WIDTH,
      viewportH: GameConfig.VIEWPORT_HEIGHT,
      intensity: 0.16,
    });
    // O CRT e um pos-processamento de tela cheia, entao ele vive no `stage` — que
    // esta sempre alinhado a tela e sem escala. Aplica-lo ao `world` (que e
    // escalado de forma nao-uniforme) fazia o Pixi calcular errado a regiao do
    // filtro e cortar a borda direita, deixando uma faixa morta sem preencher.
    this.stage.filters = [this.crt];
    this.stage.filterArea = this.pixi.screen;
    this.pixi.ticker.add(() => this.crt.tick());

    // Gerenciamos o tamanho do renderer manualmente em vez de usar o `resizeTo`
    // do Pixi: no celular a area visivel muda com a barra de URL do navegador
    // (via `visualViewport`), que nem sempre dispara o `window.resize`. Ouvimos
    // todos os sinais relevantes — e re-checamos algumas vezes apos o load —
    // para o canvas sempre preencher a area realmente visivel.
    const onResize = (): void => this.resize();
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    window.visualViewport?.addEventListener('resize', onResize);
    window.visualViewport?.addEventListener('scroll', onResize);

    this.resize();
    // Pega o momento em que o navegador movel "assenta" sua barra / as fontes
    // terminam de carregar, re-checando o tamanho em alguns instantes.
    requestAnimationFrame(onResize);
    for (const delay of [100, 300, 600, 1000]) {
      window.setTimeout(onResize, delay);
    }
  }

  /**
   * Cria e inicializa o app (e assincrono porque o PixiJS precisa inicializar o
   * renderer). Use sempre este metodo em vez do construtor.
   */
  static async create(host: HTMLElement): Promise<App> {
    const pixi = new Application();
    await pixi.init({
      background: '#0a0a14',
      antialias: false,
      width: host.clientWidth || window.innerWidth,
      height: host.clientHeight || window.innerHeight,
      // O CRT roda em tela cheia a cada frame; renderizar no DPR 3x de um celular
      // fritaria a GPU. 1.5x continua nitido (as scanlines do CRT mascaram a
      // leve suavizacao) e corta ~44% do trabalho de pintura vs 2x — esquenta menos.
      resolution: Math.min(window.devicePixelRatio || 1, 1.5),
      autoDensity: true,
      preference: 'webgl',
    });
    // Limita a 60fps. Em celulares de 90/120Hz, sem limite o ticker renderizaria
    // 1.5-2x mais frames (e rodaria o shader CRT + update da cena outras tantas
    // vezes), esquentando o aparelho sem ganho visual para este estilo de arte.
    pixi.ticker.maxFPS = 60;
    host.appendChild(pixi.canvas);
    pixi.canvas.style.width = '100%';
    pixi.canvas.style.height = '100%';
    return new App(pixi, host);
  }

  /** Redimensiona o renderer para a area realmente visivel e re-encaixa o mundo. */
  private resize(): void {
    const vv = window.visualViewport;
    // O canvas preenche o #app (que tem tamanho 100dvw x 100dvh), entao medir a
    // propria caixa de layout do host mantem o buffer do renderer exatamente do
    // tamanho do que aparece — sem esticar/letterbox por descasamento de tamanho.
    // So caimos para visualViewport (depois window) se o host nao tiver layout.
    const w = Math.round(this.host.clientWidth || vv?.width || window.innerWidth);
    const h = Math.round(this.host.clientHeight || vv?.height || window.innerHeight);
    if (w <= 0 || h <= 0) return;
    // Se o tamanho nao mudou, nao ha o que refazer.
    if (w === this.lastW && h === this.lastH) return;
    this.lastW = w;
    this.lastH = h;

    this.pixi.renderer.resize(w, h);
    // O `autoDensity` reescreve o tamanho CSS do canvas em pixels explicitos a
    // cada resize; forcamos de volta para "100%" para o canvas sempre cobrir a
    // area visivel, qualquer que seja a dimensao interna do renderer.
    this.pixi.canvas.style.width = '100%';
    this.pixi.canvas.style.height = '100%';
    this.fit();
  }

  /**
   * Encaixa o mundo do jogo na tela. Em paisagem (largura > altura), mantem a
   * proporcao e centraliza (pode sobrar barra nas laterais). Em retrato (telas de
   * celular em pe), estica para preencher tudo e eliminar a area morta.
   */
  fit(): void {
    const w = this.pixi.screen.width;
    const h = this.pixi.screen.height;
    const scaleX = w / GameConfig.VIEWPORT_WIDTH;
    const scaleY = h / GameConfig.VIEWPORT_HEIGHT;
    if (h >= w) {
      // Retrato: estica nos dois eixos para preencher a tela inteira.
      this.world.scale.set(scaleX, scaleY);
      this.world.x = 0;
      this.world.y = 0;
      return;
    }

    // Paisagem: usa a menor escala (mantem proporcao) e centraliza o resultado.
    const scale = Math.min(scaleX, scaleY);
    this.world.scale.set(scale);
    this.world.x = (w - GameConfig.VIEWPORT_WIDTH * scale) / 2;
    this.world.y = (h - GameConfig.VIEWPORT_HEIGHT * scale) / 2;
  }
}
