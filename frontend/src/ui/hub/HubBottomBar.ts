// ============================================================================
// HubBottomBar — a barra inferior do hub (a base).
//
// O que faz: desenha a faixa de baixo da tela do hub, contendo:
//  - uma dica em texto ("toque numa sala com luz piscando");
//  - a legenda das zonas (chips coloridos), que quebra em duas linhas se não
//    couber;
//  - um botão de atalho "Foguete" no canto direito, que emite `rocketClicked`.
//
// Onde encaixa: faz parte do HUD do hub, junto com a HubTopBar.
// ============================================================================
import { Container, FederatedPointerEvent, Graphics, Text } from 'pixi.js';
import { Color } from '../../core/Color';
import { Signal } from '../../core/Signal';
import { FontFamily, TextColor } from '../../core/typography';
import { GameConfig } from '../../state/GameConfig';
import { HubData } from '../../state/HubData';

/** BottomBar overlay. Mirrors Hub.html's BottomBar: hint line, zone legend
 *  chips wrapped below it, and a "Foguete" CTA button on the right. */
export class HubBottomBar extends Container {
  readonly rocketClicked = new Signal<[]>();   // jogador clicou no atalho "Foguete"

  static readonly H = 64;   // altura da barra (em pixels)

  private bg = new Graphics();
  private hint = new Text();
  private fogueteBtn = new Container();
  private fogueteBg = new Graphics();
  private fogueteHovering = false;

  constructor() {
    super();
    const W = GameConfig.VIEWPORT_WIDTH;
    const H = HubBottomBar.H;

    this.bg
      .rect(0, 0, W, H).fill({ color: 0x14110a, alpha: 0.92 })
      .rect(0, 0, W, 1).fill({ color: 0x2a2418, alpha: 1 });
    this.addChild(this.bg);

    this.hint = new Text({
      text: '▸ TOQUE NUMA SALA COM LUZ PISCANDO',
      style: {
        fontFamily: FontFamily.mono,
        fontSize: 8,
        fill: TextColor.muted,
        letterSpacing: 1.5,
      },
    });
    this.hint.x = 12;
    this.hint.y = 8;
    this.addChild(this.hint);

    // Legenda das zonas: uma fileira de chips coloridos. Vamos posicionando da
    // esquerda para a direita (cx avança). Se um chip não couber antes da área
    // reservada à direita (reservedRight, onde fica o botão Foguete), passamos
    // para a segunda linha (row = 1).
    let cx = 12;
    const cy = 26;
    let row = 0;
    const rowH = 14;
    const reservedRight = 110;
    for (const zone of HubData.ZONES) {
      const chip = this.makeZoneChip(zone.name.replace('Zona ', ''), Color.hex(zone.color));
      if (cx + chip.width > W - reservedRight && row === 0) {
        row = 1;
        cx = 12; // recomeça a linha de baixo a partir da margem esquerda
      }
      chip.x = cx;
      chip.y = cy + row * rowH;
      cx += chip.width + 8; // avança para o próximo chip (8px de espaço entre eles)
      this.addChild(chip);
    }

    // Botão de atalho "Foguete" no canto direito (CTA = call to action).
    this.buildFogueteBtn();
    this.fogueteBtn.x = W - 96;
    this.fogueteBtn.y = (H - 26) / 2;
    this.addChild(this.fogueteBtn);
  }

  destroyBar(): void {
    this.destroy({ children: true });
  }

  /** Cria um "chip" da legenda: um quadradinho colorido + o nome da zona. */
  private makeZoneChip(name: string, color: number): Container {
    const c = new Container();
    const sw = new Graphics().rect(0, 0, 6, 6).fill({ color });
    sw.y = 3;
    c.addChild(sw);
    const t = new Text({
      text: name,
      style: { fontFamily: FontFamily.mono, fontSize: 8, fill: TextColor.muted, letterSpacing: 0.5 },
    });
    t.x = 10;
    t.y = 0;
    c.addChild(t);
    return c;
  }

  /** Monta o botão "Foguete": um retângulo âmbar com brilho no hover e o
   *  rótulo. Ao clicar, emite `rocketClicked`. */
  private buildFogueteBtn(): void {
    const w = 84;
    const h = 26;
    // Função local que (re)desenha o fundo. Chamada de novo no hover para mudar
    // a intensidade do preenchimento.
    const drawBg = (): void => {
      const amber = TextColor.amber;
      this.fogueteBg.clear();
      this.fogueteBg
        .roundRect(0, 0, w, h, 3)
        .fill({ color: amber, alpha: this.fogueteHovering ? 0.22 : 0.12 })
        .roundRect(0, 0, w, h, 3)
        .stroke({ color: amber, width: 1, alpha: 1 });
    };
    drawBg();
    this.fogueteBtn.addChild(this.fogueteBg);

    const label = new Text({
      text: '◈ FOGUETE',
      style: {
        fontFamily: FontFamily.body,
        fontSize: 10,
        fill: TextColor.amber,
        fontWeight: '600',
        letterSpacing: 1,
      },
    });
    label.anchor.set(0.5);
    label.x = w / 2;
    label.y = h / 2;
    this.fogueteBtn.addChild(label);

    this.fogueteBtn.eventMode = 'static';
    this.fogueteBtn.cursor = 'pointer';
    this.fogueteBtn.on('pointerover', () => { this.fogueteHovering = true; drawBg(); });
    this.fogueteBtn.on('pointerout', () => { this.fogueteHovering = false; drawBg(); });
    this.fogueteBtn.on('pointertap', (e: FederatedPointerEvent) => {
      e.stopPropagation();
      this.rocketClicked.emit();
    });
  }
}
