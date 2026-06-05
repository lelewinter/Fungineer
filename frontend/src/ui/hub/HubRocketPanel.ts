// ============================================================================
// HubRocketPanel — o painel "esquema do casulo biológico" (o foguete-semente).
//
// O que faz: desenha, de forma estilizada e animada, o foguete que o jogador
// está construindo peça por peça. As partes já construídas aparecem coloridas;
// a próxima fica num tom intermediário; as futuras ficam cinzas. Há detalhes
// vivos: uma "solda" pulsante na fronteira do que foi construído, e raízes/chama
// na base quando o foguete já está avançado. À direita/esquerda, anotações
// (rótulos) nomeiam cada peça com ✓ (feita), ▸ (próxima) ou em branco (futura).
//
// Onde encaixa: aberto pelo atalho do foguete no hub, mostra o progresso rumo
// ao objetivo final do jogo. (Equivale ao antigo HubRocketPanel.gd.)
// ============================================================================
import { Container, Graphics, Text } from 'pixi.js';
import { Modal } from '../Modal';
import { PixiButton } from '../PixiButton';
import { Color, type RGBA } from '../../core/Color';
import { Signal } from '../../core/Signal';
import { HubState, ROCKET_RECIPE } from '../../state/HubState';

// Medidas fixas da área de desenho do foguete (o "canvas"), em pixels.
const CANVAS_H = 320;   // altura da área de desenho
const TOP_Y = 30;       // margem superior interna
const BODY_W = 40;      // largura do corpo do foguete
const PADDING = 16;     // respiro interno do painel

// Paleta usada no desenho do foguete (cores em formato RGBA 0..1).
const PURPLE = Color.rgb(0.72, 0.45, 0.85);  // peças construídas (bulbo/anotações)
const CYAN = Color.rgb(0.30, 0.78, 0.72);    // peças construídas (corpo) / próxima
const GRAY: RGBA = { r: 0.35, g: 0.32, b: 0.28, a: 1 }; // peças ainda não construídas

/** Medidas derivadas da geometria do foguete, calculadas uma vez e
 *  compartilhadas entre o desenho (drawPod) e os rótulos (annotations). Assim a
 *  posição das anotações sempre bate com o desenho. */
interface PodGeometry {
  innerW: number;   // largura interna útil
  cx: number;       // centro horizontal do foguete
  bottomY: number;  // base da área de desenho
}

/** Bio-pod schematic panel. Mirrors HubRocketPanel.gd. */
export class HubRocketPanel extends Modal {
  /** Emitted when the player taps LANÇAR on a completed rocket. */
  readonly launchRequested = new Signal<[]>();
  private canvasContainer = new Container();
  private g = new Graphics();
  private elapsedMs = 0;          // tempo desde a abertura (alimenta as pulsações)
  private animationFrame = 0;     // id do loop de animação, para poder cancelá-lo

  constructor() {
    super(360, 480);
    this.drawPanelBg(Color.hex(PURPLE));
    this.buildContent();
    void this.animateOpen();
    this.startAnimation();
  }

  /** Ao fechar, primeiro paramos o loop de animação para não desenhar num
   *  painel já removido. */
  override async requestClose(): Promise<void> {
    cancelAnimationFrame(this.animationFrame);
    await super.requestClose();
  }

  /** Geometria compartilhada do foguete. Centraliza as contas que antes eram
   *  repetidas no desenho e nos rótulos. */
  private geometry(): PodGeometry {
    const innerW = this.panelW - PADDING * 2;
    return { innerW, cx: innerW * 0.5, bottomY: CANVAS_H - 30 };
  }

  /** Liga o loop de animação. A cada quadro atualiza o tempo e redesenha o
   *  foguete, dando vida às pulsações (solda, chama). */
  private startAnimation(): void {
    const start = performance.now();
    const tick = (): void => {
      this.elapsedMs = performance.now() - start;
      this.drawPod();
      this.animationFrame = requestAnimationFrame(tick);
    };
    this.animationFrame = requestAnimationFrame(tick);
  }

  /** Monta a parte estática do painel: cabeçalho, subtítulo, a área do desenho
   *  (canvas), o texto de status e o botão de fechar. O desenho em si é animado
   *  separadamente em drawPod. */
  private buildContent(): void {
    const halfH = this.panelH / 2;
    const padding = PADDING;
    const innerW = this.panelW - padding * 2;

    let cy = -halfH + padding; // cursor vertical: vai descendo a cada bloco

    const header = new Text({
      text: '◈ CASULO BIOLÓGICO · ESQUEMA',
      style: { fontFamily: '"Space Grotesk", system-ui, sans-serif', fontSize: 15, fontWeight: '700', fill: Color.hex(Color.rgb(0.88, 0.94, 0.82)), align: 'center', letterSpacing: 1 },
    });
    header.anchor.set(0.5, 0);
    header.x = 0;
    header.y = cy;
    this.panel.addChild(header);
    cy += 18;

    const subtitle = new Text({
      text: 'Dr. Myco: "Foguete? Não. Semente."',
      style: { fontFamily: '"Space Grotesk", system-ui, sans-serif', fontSize: 9, fill: Color.hex(Color.rgb(0.72, 0.45, 0.85)), align: 'center' },
    });
    subtitle.anchor.set(0.5, 0);
    subtitle.x = 0;
    subtitle.y = cy;
    this.panel.addChild(subtitle);
    cy += 16;

    // Área de desenho (canvas): um container deslocado para a esquerda do
    // centro, dentro do qual o foguete e os rótulos são desenhados.
    this.canvasContainer.x = -innerW / 2;
    this.canvasContainer.y = cy;
    this.canvasContainer.addChild(this.g);
    this.panel.addChild(this.canvasContainer);
    cy += CANVAS_H + 8;

    // Status — texto e cor por estágio (art spec §4.3).
    const built = HubState.rocket_pieces_built;
    const total = ROCKET_RECIPE.length;
    const complete = HubState.isRocketComplete();
    const STAGE: Array<[string, RGBA]> = [
      ['0 / 8 · em espera de materiais', Color.rgb(0.35, 0.31, 0.25)],
      ['1 / 8 · fundação fixada', Color.rgb(0.91, 0.58, 0.23)],
      ['2 / 8 · motor germinando', Color.rgb(0.91, 0.58, 0.23)],
      ['3 / 8 · circuitos acordando', Color.rgb(0.30, 0.79, 0.77)],
      ['4 / 8 · revestimento tecido', Color.rgb(0.30, 0.79, 0.77)],
      ['5 / 8 · rede neural ativa', Color.rgb(0.56, 0.83, 0.31)],
      ['6 / 8 · sistema vital respirando', Color.rgb(0.56, 0.83, 0.31)],
      ['7 / 8 · blindagem crescida', Color.rgb(0.72, 0.48, 0.86)],
    ];
    const stage: [string, RGBA] = complete
      ? ['✓ Casulo germinado — pronto pra plantar no céu', Color.rgb(0.96, 0.64, 0.29)]
      : (STAGE[built] ?? [`${built} / ${total} peças`, Color.rgb(0.30, 0.78, 0.72)]);
    const status = new Text({
      text: stage[0],
      style: { fontFamily: '"Space Grotesk", system-ui, sans-serif', fontSize: 10, fill: Color.hex(stage[1]), align: 'center' },
    });
    status.anchor.set(0.5, 0);
    status.x = 0;
    status.y = cy;
    this.panel.addChild(status);

    // Launch button — only when every piece is built.
    if (complete) {
      const launch = new PixiButton({
        label: '🚀 LANÇAR',
        width: 150,
        height: 34,
        fill: 0x4a2f12,
        hoverFill: 0x6b431a,
        onClick: () => {
          // openModal() on the host scene closes this panel for us.
          this.launchRequested.emit();
        },
      });
      launch.x = -75;
      launch.y = halfH - padding - 70;
      this.panel.addChild(launch);
    }

    // Close button
    const close = new PixiButton({
      label: 'Fechar',
      width: 100,
      height: 28,
      onClick: () => void this.requestClose(),
    });
    close.x = -50;
    close.y = halfH - padding - 28;
    this.panel.addChild(close);
  }

  /** Desenha o foguete inteiro a cada quadro. A aparência depende de quantas
   *  peças já foram construídas (`built`): partes construídas ganham cor viva,
   *  a próxima fica num tom de transição, e as futuras ficam cinzas. */
  private drawPod(): void {
    this.g.clear();
    const purple = PURPLE;
    const cyan = CYAN;
    const earth = Color.rgb(0.55, 0.35, 0.20);   // marrom-terra (motores/aletas)
    const amber = Color.rgb(0.91, 0.58, 0.23);   // âmbar (solda e chama)
    const gray = GRAY;

    const built = HubState.rocket_pieces_built;
    const recipe = ROCKET_RECIPE;
    const { cx, bottomY } = this.geometry();
    const topY = TOP_Y;
    const podH = bottomY - topY;        // altura total do corpo do foguete
    const bodyW = BODY_W;

    // Bulbo de esporo (nose cone)
    const bulbColor = this.pieceColor(0, built, purple, gray);
    this.g.poly([
      cx, topY,
      cx + bodyW * 0.5, topY + podH * 0.15,
      cx, topY + podH * 0.22,
      cx - bodyW * 0.5, topY + podH * 0.15,
    ]).fill(Color.hex(bulbColor));
    const stroke: RGBA = { r: purple.r * 0.8, g: purple.g * 0.8, b: purple.b * 0.8, a: 1 };
    this.g.poly([
      cx, topY,
      cx + bodyW * 0.5, topY + podH * 0.15,
      cx, topY + podH * 0.22,
      cx - bodyW * 0.5, topY + podH * 0.15,
    ]).stroke({ color: Color.hex(stroke), width: 1.5 });

    // Corpo do foguete: três seções empilhadas. `buildY` é a "linha de
    // construção" — abaixo dela está pronto, acima ainda falta — usada para a
    // solda animada mais adiante.
    const bodyTopY = topY + podH * 0.22;
    const bodyBotY = topY + podH * 0.82;
    const sectionH = (bodyBotY - bodyTopY) / 3;
    const totalBodyH = bodyBotY - bodyTopY;
    const buildY = bodyTopY + totalBodyH * (1 - built / Math.max(1, recipe.length));
    for (let i = 0; i < 3; i++) {
      const sy = bodyTopY + i * sectionH;
      const segColor = this.pieceColor(i + 1, built, cyan, gray);
      this.g.rect(cx - bodyW * 0.5, sy, bodyW, sectionH).fill(Color.hex(segColor));
      this.g.rect(cx - bodyW * 0.5, sy, bodyW, sectionH).stroke({ color: Color.hex(Color.rgb(0.15, 0.20, 0.18)), width: 1 });
      // Plating stripes — horizontal panel lines on the built portion
      if (i + 1 <= built) {
        for (let s = 1; s < 4; s++) {
          const ly = sy + (sectionH * s) / 4;
          this.g.moveTo(cx - bodyW * 0.4, ly).lineTo(cx + bodyW * 0.4, ly)
            .stroke({ color: Color.hex(cyan), width: 0.8, alpha: 0.55 });
        }
      }
      // Porthole
      if (i + 1 < built) {
        this.g.circle(cx, sy + sectionH * 0.5, 3).fill(Color.hex(Color.rgb(0.85, 0.92, 0.78)));
      }
    }
    // Linha de solda: uma costura âmbar pulsante exatamente na fronteira entre
    // o que já foi construído e o que falta. O `sin` do tempo gera o brilho que
    // vai e volta (dashPulse).
    if (built > 0 && built < recipe.length) {
      // Estágio 7 (última peça faltando): a solda pulsa o dobro de rápido e mais forte.
      const urgent = built === recipe.length - 1;
      const dashPulse = 0.4 + 0.6 * Math.abs(Math.sin(this.elapsedMs * (urgent ? 0.012 : 0.006)));
      const weldW = urgent ? 2 : 1.2;
      const weldA = urgent ? 1.0 : 0.85;
      this.g.moveTo(cx - bodyW * 0.6, buildY).lineTo(cx + bodyW * 0.6, buildY)
        .stroke({ color: Color.hex(amber), width: weldW, alpha: weldA * dashPulse });
      this.g.circle(cx - bodyW * 0.3, buildY, 1.6).fill({ color: Color.hex(amber), alpha: dashPulse });
      this.g.circle(cx + bodyW * 0.3, buildY, 1.4).fill({ color: Color.hex(amber), alpha: 1 - dashPulse });
    }

    // Engine fins
    const engineColor = this.pieceColor(4, built, earth, gray);
    this.g.poly([
      cx - bodyW * 0.5, bodyBotY,
      cx - bodyW * 0.9, bottomY - 5,
      cx - bodyW * 0.5, bodyBotY + podH * 0.08,
    ]).fill(Color.hex(engineColor));
    this.g.poly([
      cx + bodyW * 0.5, bodyBotY,
      cx + bodyW * 0.9, bottomY - 5,
      cx + bodyW * 0.5, bodyBotY + podH * 0.08,
    ]).fill(Color.hex(engineColor));

    // Raízes/chama na base: só aparecem quando o foguete já está bem avançado
    // (5+ peças). Cada "raiz" pisca com intensidade própria graças ao `sin`.
    if (built >= 5) {
      // Raízes alternam âmbar/verde-esporo (biologia + circuito integrando).
      // No estágio 8 ficam mais longas e o movimento mais lento e orgânico.
      const complete = built >= recipe.length;
      const spore = Color.rgb(0.56, 0.83, 0.31);
      const rootLen = complete ? 16 : 10;
      const rootSpeed = complete ? 0.002 : 0.003;
      for (let j = 0; j < 5; j++) {
        const fx = cx + (j - 2) * 6;
        const fyBase = bottomY - 5;
        const pulse = Math.abs(Math.sin(this.elapsedMs * rootSpeed + j)) * 0.5 + 0.5;
        const base = j % 2 === 0 ? amber : spore;
        const a: RGBA = { r: base.r * pulse, g: base.g * pulse, b: base.b * pulse, a: 1 };
        this.g.moveTo(fx, fyBase).lineTo(fx + Math.sin(j) * 2, fyBase + rootLen)
          .stroke({ color: Color.hex(a), width: 2 });
      }
    }

    // Estágio 8 — o casulo germinado RESPIRA: halo de bioluminescência pulsante
    // ao redor do contorno (não pisca). A linha de solda some (já tratada acima).
    if (built >= recipe.length) {
      const breathe = 0.1 + 0.1 * Math.sin(this.elapsedMs * 0.003);
      this.g.roundRect(cx - bodyW * 0.75, topY - 4, bodyW * 1.5, podH + 16, 10)
        .stroke({ color: Color.hex(Color.rgb(0.78, 0.94, 0.48)), width: 3, alpha: breathe });
    }

    // Anotações: para cada peça, desenha uma linha de chamada saindo do corpo
    // do foguete até um ponto à esquerda ou à direita, com uma bolinha na ponta.
    // Os rótulos de texto são desenhados à parte (refreshAnnotationLabels).
    for (let i = 0; i < recipe.length; i++) {
      const { annotationY, isRight, annotationX, lineColor } = this.annotationLayout(i, built);
      const podAttachX = isRight ? cx + bodyW * 0.5 : cx - bodyW * 0.5; // onde a linha encosta no foguete
      this.g.moveTo(podAttachX, annotationY).lineTo(annotationX, annotationY)
        .stroke({ color: Color.hex(lineColor), width: 1, alpha: 0.6 });
      this.g.circle(annotationX, annotationY, 3).fill(Color.hex(lineColor));
    }

    // Annotations text — Pixi Text doesn't support multi-position drawing in a single Graphics call,
    // so we manage labels separately.
    // (O PixiJS não desenha texto em várias posições num só comando de Graphics,
    //  então os rótulos são objetos Text gerenciados separadamente.)
    this.refreshAnnotationLabels();
  }

  private annotationLabels: Text[] = [];

  /** Calcula a posição e a cor da anotação da peça `i`. Centralizado aqui para
   *  que o desenho das linhas (drawPod) e os rótulos de texto fiquem sempre
   *  alinhados. Peças alternam entre lado esquerdo e direito. */
  private annotationLayout(i: number, built: number): {
    annotationY: number; isRight: boolean; annotationX: number; lineColor: RGBA;
  } {
    const { innerW, bottomY } = this.geometry();
    const isBuilt = i < built;
    const isNext = i === built;
    const annotationY = TOP_Y + 20 + i * ((bottomY - TOP_Y - 40) / ROCKET_RECIPE.length);
    const isRight = i % 2 === 1; // peças ímpares vão para a direita, pares para a esquerda
    const annotationX = isRight ? innerW * 0.85 : innerW * 0.15;
    const lineColor = isBuilt ? PURPLE : (isNext ? CYAN : GRAY);
    return { annotationY, isRight, annotationX, lineColor };
  }

  /** Mantém os rótulos de texto das anotações em sincronia com o estado: cria
   *  ou remove rótulos conforme o tamanho da receita e atualiza texto, cor e
   *  posição de cada um. O prefixo indica o estado: ✓ feito, ▸ próximo. */
  private refreshAnnotationLabels(): void {
    const built = HubState.rocket_pieces_built;
    const recipe = ROCKET_RECIPE;

    // Garante um rótulo para cada peça da receita (cria os que faltam,
    // descarta os que sobram caso a receita encolha).
    while (this.annotationLabels.length < recipe.length) {
      const t = new Text({ text: '', style: { fontFamily: '"Space Grotesk", system-ui, sans-serif', fontSize: 9 } });
      this.annotationLabels.push(t);
      this.canvasContainer.addChild(t);
    }
    while (this.annotationLabels.length > recipe.length) {
      const t = this.annotationLabels.pop();
      if (t) t.destroy();
    }

    for (let i = 0; i < recipe.length; i++) {
      const t = this.annotationLabels[i]!;
      const isBuilt = i < built;
      const isNext = i === built;
      const prefix = isBuilt ? '✓ ' : (isNext ? '▸ ' : '  ');
      t.text = prefix + recipe[i]!.name;
      const { annotationY, isRight, annotationX, lineColor } = this.annotationLayout(i, built);
      t.style = {
        fontFamily: '"Space Grotesk", system-ui, sans-serif',
        fontSize: 9,
        fill: Color.hex(lineColor),
        wordWrap: true,
        wordWrapWidth: 70,
      };
      // O ponto de ancoragem muda conforme o lado, para o texto "crescer" para
      // fora do foguete (à direita encosta pela esquerda do texto, e vice-versa).
      t.anchor.set(isRight ? 0 : 1, 0.5);
      t.x = isRight ? annotationX + 6 : annotationX - 6;
      t.y = annotationY;
    }
  }

  /** Decide a cor de uma peça conforme o progresso: cor "ativa" se já
   *  construída; um tom de transição (40% rumo ao cinza) se for a próxima; e a
   *  cor "inativa" (cinza) se ainda estiver no futuro. */
  private pieceColor(pieceIndex: number, built: number, active: RGBA, inactive: RGBA): RGBA {
    if (pieceIndex < built) return active;
    if (pieceIndex === built) {
      const t = 0.4;
      return {
        r: active.r + (inactive.r - active.r) * t,
        g: active.g + (inactive.g - active.g) * t,
        b: active.b + (inactive.b - active.b) * t,
        a: 1,
      };
    }
    return inactive;
  }
}
