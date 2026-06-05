// ============================================================================
// HubTopBar — a barra superior do hub (a base).
//
// O que mostra, da esquerda para a direita e de cima para baixo:
//  - título "BASE DE RESISTÊNCIA" e uma linha de sessão (qual run, slots);
//  - dois "chips" de recursos à direita (sucata e componentes de IA);
//  - logo abaixo, uma faixa clicável (readout) mostrando o progresso do foguete
//    e qual é a próxima peça a construir, com seu custo.
//
// É "reativa": quando os recursos ou o progresso do foguete mudam (via sinais
// do HubState), ela se atualiza sozinha. Clicar na faixa de baixo emite
// `rocketReadoutClicked` (a cena do hub abre o painel do foguete).
// ============================================================================
import { Container, FederatedPointerEvent, Graphics, Text } from 'pixi.js';
import { Signal } from '../../core/Signal';
import { FontFamily, TextColor } from '../../core/typography';
import { GameConfig } from '../../state/GameConfig';
import { HubState, ROCKET_RECIPE } from '../../state/HubState';

/** TopBar + RocketReadout overlay. Mirrors Hub.html's TopBar/RocketReadout
 *  composition: title + session line on the left, two resource chips on the
 *  right, then a clickable strip below showing rocket progress + next piece. */
export class HubTopBar extends Container {
  readonly rocketReadoutClicked = new Signal<[]>();

  static readonly TOP_BAR_H = 48;
  static readonly READOUT_H = 32;
  static readonly TOTAL_H = HubTopBar.TOP_BAR_H + HubTopBar.READOUT_H;

  private bg = new Graphics();
  private title = new Text();
  private subtitle = new Text();
  private scrapChip!: ResourceChip;
  private aiChip!: ResourceChip;
  private readoutBg = new Graphics();
  private readoutCount = new Text();
  private readoutLabel = new Text();
  private readoutName = new Text();
  private readoutCost = new Text();
  private readout = new Container();

  // Lista de funções para "desconectar" dos sinais do HubState ao destruir a
  // barra. Sem isso, ela continuaria reagindo a mudanças mesmo já removida.
  private disposers: Array<() => void> = [];

  constructor() {
    super();

    const W = GameConfig.VIEWPORT_WIDTH;
    const topH = HubTopBar.TOP_BAR_H;
    const readoutH = HubTopBar.READOUT_H;

    // ── Top bar background + divider
    this.bg
      .rect(0, 0, W, topH).fill({ color: 0x14110a, alpha: 0.92 })
      .rect(0, topH - 1, W, 1).fill({ color: 0x2a2418, alpha: 1 });
    this.addChild(this.bg);

    // ── Title "BASE DE RESISTÊNCIA"
    this.title = new Text({
      text: 'BASE DE RESISTÊNCIA',
      style: {
        fontFamily: FontFamily.body,
        fontSize: 12,
        fill: TextColor.ink,
        fontWeight: '600',
        letterSpacing: 2,
      },
    });
    this.title.x = 12;
    this.title.y = 8;
    this.addChild(this.title);

    // ── Subtitle "SUBSOLO · SESSÃO 04 · 0/3 SLOTS"
    this.subtitle = new Text({
      text: this.subtitleText(),
      style: {
        fontFamily: FontFamily.mono,
        fontSize: 9,
        fill: TextColor.muted,
        letterSpacing: 1,
      },
    });
    this.subtitle.x = 12;
    this.subtitle.y = 26;
    this.addChild(this.subtitle);

    // ── Resource chips on the right
    this.scrapChip = new ResourceChip('◇', TextColor.muted, HubState.stock.scrap);
    this.aiChip = new ResourceChip('◆', TextColor.bio, HubState.stock.ai_components);
    this.aiChip.x = W - this.aiChip.width - 10;
    this.aiChip.y = (topH - 22) / 2;
    this.scrapChip.x = this.aiChip.x - this.scrapChip.width - 6;
    this.scrapChip.y = this.aiChip.y;
    this.addChild(this.scrapChip);
    this.addChild(this.aiChip);

    // ── Readout strip
    this.readout.y = topH;
    this.readoutBg
      .rect(0, 0, W, readoutH).fill({ color: 0x1d1a10, alpha: 0.92 })
      .rect(0, readoutH - 1, W, 1).fill({ color: 0x2a2418, alpha: 1 });
    this.readout.addChild(this.readoutBg);

    this.readoutCount = new Text({
      text: `[${HubState.rocket_pieces_built}/8]`,
      style: {
        fontFamily: FontFamily.mono,
        fontSize: 11,
        fill: TextColor.amber,
        fontWeight: '600',
      },
    });
    this.readoutCount.x = 12;
    this.readoutCount.y = (readoutH - 16) / 2;
    this.readout.addChild(this.readoutCount);

    this.readoutLabel = new Text({
      text: 'próxima peça',
      style: {
        fontFamily: FontFamily.body,
        fontSize: 9,
        fill: TextColor.muted,
        letterSpacing: 0.5,
      },
    });
    this.readoutLabel.x = 56;
    this.readoutLabel.y = 4;
    this.readout.addChild(this.readoutLabel);

    this.readoutName = new Text({
      text: this.nextPieceName(),
      style: {
        fontFamily: FontFamily.body,
        fontSize: 12,
        fill: TextColor.ink,
        fontWeight: '500',
      },
    });
    this.readoutName.x = 56;
    this.readoutName.y = 14;
    this.readout.addChild(this.readoutName);

    this.readoutCost = new Text({
      text: this.nextPieceCostText(),
      style: {
        fontFamily: FontFamily.mono,
        fontSize: 10,
        fill: TextColor.muted,
      },
    });
    this.readoutCost.anchor.set(1, 0.5);
    this.readoutCost.x = W - 12;
    this.readoutCost.y = readoutH / 2;
    this.readout.addChild(this.readoutCost);

    this.readout.eventMode = 'static';
    this.readout.cursor = 'pointer';
    this.readout.on('pointertap', (e: FederatedPointerEvent) => {
      e.stopPropagation();
      this.rocketReadoutClicked.emit();
    });

    this.addChild(this.readout);

    // ── Atualizações reativas: quando o estoque ou o progresso do foguete
    //    mudarem, refazemos os textos e a posição dos chips.
    this.disposers.push(HubState.stockChanged.connect(() => this.refresh()));
    this.disposers.push(HubState.rocketPieceBuilt.connect(() => this.refresh()));
  }

  /** Remove a barra com segurança: primeiro desconecta dos sinais, depois
   *  destrói os elementos visuais. */
  destroyBar(): void {
    for (const d of this.disposers) d();
    this.disposers = [];
    this.destroy({ children: true });
  }

  /** Reescreve todos os textos que dependem do estado atual e reposiciona os
   *  chips de recurso (a largura pode mudar quando o número de dígitos muda). */
  private refresh(): void {
    this.subtitle.text = this.subtitleText();
    this.scrapChip.setCount(HubState.stock.scrap);
    this.aiChip.setCount(HubState.stock.ai_components);
    this.readoutCount.text = `[${HubState.rocket_pieces_built}/8]`;
    this.readoutName.text = this.nextPieceName();
    this.readoutCost.text = this.nextPieceCostText();

    // Reflow chip positions in case digit count changed width.
    const W = GameConfig.VIEWPORT_WIDTH;
    this.aiChip.x = W - this.aiChip.width - 10;
    this.scrapChip.x = this.aiChip.x - this.scrapChip.width - 6;
  }

  /** Monta a linha de subtítulo, ex.: "SUBSOLO · SESSÃO 04 · 0/3 SLOTS". */
  private subtitleText(): string {
    const cap = HubState.getBackpackCapacity();
    return `SUBSOLO · SESSÃO ${String(HubState.total_runs + 1).padStart(2, '0')} · 0/${cap} SLOTS`;
  }

  /** Nome da próxima peça do foguete a construir (ou "Foguete completo"). */
  private nextPieceName(): string {
    if (HubState.rocket_pieces_built >= ROCKET_RECIPE.length) return 'Foguete completo';
    return ROCKET_RECIPE[HubState.rocket_pieces_built]!.name;
  }

  /** Monta o texto de custo da próxima peça, juntando só os recursos que ela
   *  realmente exige (ex.: "◇ 12 · ◆ 3"). */
  private nextPieceCostText(): string {
    if (HubState.rocket_pieces_built >= ROCKET_RECIPE.length) return '';
    const r = ROCKET_RECIPE[HubState.rocket_pieces_built]!;
    const parts: string[] = [];
    if (r.scrap) parts.push(`◇ ${r.scrap}`);
    if (r.ai_components) parts.push(`◆ ${r.ai_components}`);
    if (r.combustivel_volatil) parts.push(`⛽ ${r.combustivel_volatil}`);
    if (r.nucleo_logico) parts.push(`☉ ${r.nucleo_logico}`);
    if (r.fragmentos_estruturais) parts.push(`▣ ${r.fragmentos_estruturais}`);
    if (r.sinais_controle) parts.push(`)) ${r.sinais_controle}`);
    if (r.biomassa_adaptativa) parts.push(`♣ ${r.biomassa_adaptativa}`);
    return parts.join(' · ');
  }
}

/** ResourceChip — o "chip" compacto de recurso, no formato "◇ 12": um símbolo
 *  colorido (ícone do recurso) seguido da quantidade. Fica no lado direito da
 *  barra de cima. */
class ResourceChip extends Container {
  private icon: Text;
  private count: Text;

  constructor(symbol: string, color: number, initial: number) {
    super();
    this.icon = new Text({
      text: symbol,
      style: { fontFamily: FontFamily.mono, fontSize: 12, fill: color, fontWeight: '600' },
    });
    this.icon.x = 0;
    this.icon.y = 4;
    this.count = new Text({
      text: String(initial),
      style: { fontFamily: FontFamily.mono, fontSize: 11, fill: TextColor.ink, fontWeight: '500' },
    });
    this.count.x = 14;
    this.count.y = 5;
    this.addChild(this.icon);
    this.addChild(this.count);
  }

  setCount(n: number): void {
    this.count.text = String(n);
  }
}
