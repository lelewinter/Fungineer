// ============================================================================
// Modal — a base de todas as "janelas" (pop-ups) do jogo.
//
// O que é um modal: uma janela que aparece por cima do jogo e "trava" a
// atenção do jogador nela — para fechar, ele precisa clicar fora ou num botão.
// Exemplos no jogo: confirmar uma raid, configurar áudio, ver o foguete.
//
// O que esta classe entrega de graça para quem herda dela:
//  - um fundo escurecido e levemente borrado (backdrop) atrás da janela;
//  - a janela aparece com uma animação suave (fade + cresce) e some do mesmo
//    jeito;
//  - uma borda luminosa que "anda" ao redor da janela, dando vida;
//  - clicar no fundo escuro fecha a janela.
//
// Como usar: outras classes ESTENDEM (extends) este Modal, preenchem o
// `panel` com seu conteúdo, e usam `closed` para saber quando foi fechado.
// Por isso ela é `abstract`: sozinha não faz sentido, sempre é a base de outra.
// ============================================================================
import { BlurFilter, Container, FederatedPointerEvent, Graphics } from 'pixi.js';
import { Signal } from '../core/Signal';
import { Easing, tween } from '../core/tween';
import { GameConfig } from '../state/GameConfig';

/** Centered modal panel with backdrop blur, animated traveling border,
 *  fade/scale open & close. Subclasses populate `panel` and emit `closed`. */
export abstract class Modal extends Container {
  /** Sinal (Signal) emitido quando a janela termina de fechar. Quem abriu o
   *  modal pode "ouvir" esse sinal para reagir (ex.: liberar o jogo). */
  readonly closed = new Signal<[]>();

  protected backdrop: Graphics;        // fundo escuro atrás da janela
  protected panelBg: Graphics;         // o fundo (caixa) da janela em si
  protected animatedBorder: Graphics;  // a borda luminosa que "anda"
  protected panel: Container;          // onde as subclasses colocam o conteúdo
  protected panelW: number;            // largura da janela
  protected panelH: number;            // altura da janela
  protected backdropAlpha = 0.72;      // quão escuro fica o fundo (0=transparente, 1=opaco)
  protected borderColor = 0xb573d8;    // cor da borda luminosa
  private borderTime = 0;              // contador de tempo da animação da borda
  // Identificador do loop de animação da borda. Guardamos para poder pará-lo.
  private borderTicker: number | null = null;

  constructor(panelW: number, panelH: number) {
    super();
    this.panelW = panelW;
    this.panelH = panelH;
    this.zIndex = 100;          // garante que o modal fique acima do resto da cena
    this.eventMode = 'static';  // habilita captura de cliques/toques

    // Tamanho da tela visível (viewport). O modal cobre a tela inteira.
    const W = GameConfig.VIEWPORT_WIDTH;
    const H = GameConfig.VIEWPORT_HEIGHT;
    this.backdrop = new Graphics().rect(0, 0, W, H).fill({ color: 0x040806, alpha: 1 });
    this.backdrop.alpha = 0;
    this.backdrop.eventMode = 'static';
    this.backdrop.cursor = 'pointer';
    // Mild blur on the backdrop softens the world peeking through.
    this.backdrop.filters = [new BlurFilter({ strength: 2, quality: 2 })];
    // Clicar no fundo escuro fecha a janela.
    this.backdrop.on('pointertap', (_e: FederatedPointerEvent) => this.requestClose());
    this.addChild(this.backdrop);

    // O painel (a caixa da janela) fica centralizado na tela. Começa invisível
    // (alpha 0) e um pouco menor (escala 0.85); a animação de abertura o revela.
    this.panel = new Container();
    this.panel.x = W / 2;
    this.panel.y = H / 2;
    this.panel.alpha = 0;
    this.panel.scale.set(0.85);
    this.panel.eventMode = 'static';
    // Clicar DENTRO do painel não deve fechar a janela: paramos o evento aqui
    // para que ele não chegue ao backdrop (que fecharia).
    this.panel.on('pointertap', (e: FederatedPointerEvent) => e.stopPropagation());
    this.addChild(this.panel);

    this.panelBg = new Graphics();
    this.panel.addChild(this.panelBg);

    this.animatedBorder = new Graphics();
    this.panel.addChild(this.animatedBorder);
  }

  /** Anima a abertura da janela: escurece o fundo e faz o painel surgir
   *  crescendo de 0.85 para 1.0. As subclasses chamam isto depois de montar o
   *  conteúdo. Os dois efeitos rodam juntos (Promise.all). */
  protected async animateOpen(): Promise<void> {
    this.startBorderAnimation();
    await Promise.all([
      tween({
        durationMs: 320,
        ease: Easing.easeOutCubic,
        onUpdate: (t) => { if (this.destroyed) return; this.backdrop.alpha = t * this.backdropAlpha; },
      }),
      tween({
        durationMs: 320,
        ease: Easing.easeOutCubic,
        onUpdate: (t) => { if (this.destroyed) return; this.panel.alpha = t; this.panel.scale.set(0.85 + 0.15 * t); },
      }),
    ]);
  }

  /** Anima o fechamento: o inverso da abertura — o fundo clareia e o painel
   *  some encolhendo. Mais rápido que abrir, para parecer responsivo. */
  protected async animateClose(): Promise<void> {
    this.stopBorderAnimation();
    await Promise.all([
      tween({
        durationMs: 200,
        ease: Easing.easeInCubic,
        onUpdate: (t) => { if (this.destroyed) return; this.backdrop.alpha = (1 - t) * this.backdropAlpha; },
      }),
      tween({
        durationMs: 200,
        ease: Easing.easeInCubic,
        onUpdate: (t) => { if (this.destroyed) return; this.panel.alpha = 1 - t; this.panel.scale.set(1 - 0.15 * t); },
      }),
    ]);
  }

  /** Fecha a janela: roda a animação de fechamento, avisa quem estava ouvindo
   *  (`closed`) e remove a janela da tela. As checagens `destroyed` evitam mexer
   *  numa janela que já foi removida (ex.: fechada duas vezes em sequência). */
  async requestClose(): Promise<void> {
    if (this.destroyed) return;
    await this.animateClose();
    if (this.destroyed) return;
    this.closed.emit();
    this.destroy({ children: true });
  }

  /** Limpeza ao remover a janela: para a animação da borda para não continuar
   *  rodando sozinha em segundo plano. */
  override destroy(options?: Parameters<Container['destroy']>[0]): void {
    this.stopBorderAnimation();
    super.destroy(options);
  }

  /** Desenha o fundo (a caixa) da janela com a cor de destaque escolhida.
   *  As subclasses chamam isto passando sua cor temática. É feito em camadas:
   *  uma placa escura externa, um preenchimento interno e uma borda fina. */
  protected drawPanelBg(stroke: number = 0xb573d8): void {
    this.borderColor = stroke;
    const hw = this.panelW / 2;
    const hh = this.panelH / 2;

    this.panelBg.clear();
    // Outer dark plate
    this.panelBg
      .roundRect(-hw, -hh, this.panelW, this.panelH, 8)
      .fill({ color: 0x0a100c, alpha: 0.98 });
    // Inner inset
    this.panelBg
      .roundRect(-hw + 2, -hh + 2, this.panelW - 4, this.panelH - 4, 7)
      .fill({ color: 0x121a14, alpha: 0.85 });
    // Top accent strip
    this.panelBg
      .rect(-hw + 8, -hh + 6, this.panelW - 16, 1)
      .fill({ color: stroke, alpha: 0.35 });
    // Hairline static border
    this.panelBg
      .roundRect(-hw, -hh, this.panelW, this.panelH, 8)
      .stroke({ color: stroke, width: 1.5, alpha: 0.55 });
  }

  /** Liga o loop de animação da borda luminosa. A cada quadro (frame) avança o
   *  tempo e redesenha a borda, criando o efeito de luz que corre pela moldura.
   *  `requestAnimationFrame` agenda a próxima execução junto com o navegador. */
  private startBorderAnimation(): void {
    const tick = (): void => {
      // Se a janela já foi removida, encerra o loop em vez de desenhar no vazio.
      if (this.destroyed || this.animatedBorder.destroyed) { this.borderTicker = null; return; }
      this.borderTime += 0.012;
      this.drawTravelingBorder();
      this.borderTicker = requestAnimationFrame(tick);
    };
    this.borderTicker = requestAnimationFrame(tick);
  }

  /** Desliga o loop de animação da borda. */
  private stopBorderAnimation(): void {
    if (this.borderTicker !== null) cancelAnimationFrame(this.borderTicker);
    this.borderTicker = null;
  }

  /** Desenha a borda luminosa num dado instante. A ideia: imagine percorrer o
   *  contorno da janela como uma pista; desenhamos dois trechos curtos de luz
   *  nessa pista — um forte e outro mais fraco no lado oposto — que se movem com
   *  o tempo, dando a impressão de luz correndo pela moldura. */
  private drawTravelingBorder(): void {
    const hw = this.panelW / 2;
    const hh = this.panelH / 2;
    const perimeter = 2 * (this.panelW + this.panelH); // comprimento total do contorno
    const segLen = 60;                                  // tamanho de cada trecho de luz
    // Posição atual da luz ao longo do contorno. O `% perimeter` faz ela "dar a
    // volta" e recomeçar quando passa do fim.
    const t = (this.borderTime * 200) % perimeter;

    this.animatedBorder.clear();

    // Desenha um trecho de luz a partir de uma distância no contorno, ligando
    // pontos consecutivos com pequenas linhas.
    const drawSegment = (startDist: number, length: number, alpha: number): void => {
      const points = this.borderPoints(hw, hh, startDist, length);
      for (let i = 0; i < points.length - 1; i++) {
        const a = points[i]!;
        const b = points[i + 1]!;
        this.animatedBorder.moveTo(a.x, a.y).lineTo(b.x, b.y)
          .stroke({ color: this.borderColor, width: 1.5, alpha });
      }
    };

    drawSegment(t, segLen, 1.0);                     // trecho principal, bem visível
    drawSegment(t + perimeter * 0.5, segLen, 0.55);  // trecho secundário, no lado oposto
  }

  /** Gera os pontos de um trecho do contorno, amostrando posições a cada poucos
   *  pixels. Cada posição vira coordenada (x, y) via `distanceToPoint`. */
  private borderPoints(hw: number, hh: number, startDist: number, length: number): Array<{ x: number; y: number }> {
    const perimeter = 2 * (this.panelW + this.panelH);
    const points: Array<{ x: number; y: number }> = [];
    const samples = Math.ceil(length / 4) + 1;
    for (let i = 0; i <= samples; i++) {
      let d = (startDist + (length * i) / samples) % perimeter;
      points.push(this.distanceToPoint(d, hw, hh));
    }
    return points;
  }

  /** Converte uma "distância percorrida no contorno" (d) na coordenada (x, y)
   *  correspondente. Tratamos o retângulo como quatro lados em sequência: topo,
   *  direita, base e esquerda; subtraímos o comprimento de cada lado até achar
   *  em qual deles a distância cai. */
  private distanceToPoint(d: number, hw: number, hh: number): { x: number; y: number } {
    const w = this.panelW;
    const h = this.panelH;
    if (d < w) return { x: -hw + d, y: -hh };   // lado de cima (da esquerda p/ direita)
    d -= w;
    if (d < h) return { x: hw, y: -hh + d };    // lado direito (de cima p/ baixo)
    d -= h;
    if (d < w) return { x: hw - d, y: hh };     // lado de baixo (da direita p/ esquerda)
    d -= w;
    return { x: -hw, y: hh - d };               // lado esquerdo (de baixo p/ cima)
  }
}
