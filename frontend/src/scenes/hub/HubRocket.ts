import { Container, Graphics, Text } from 'pixi.js';
import { Color, type RGBA } from '../../core/Color';
import { GameConfig } from '../../state/GameConfig';
import { HubState, ROCKET_RECIPE } from '../../state/HubState';

/** Compact bio-pod progress badge. Maps src/scenes/hub/HubRocket.gd. */
export class HubRocket extends Container {
  private bg = new Graphics();
  private textNode: Text;
  private piecesBuilt = 0;
  private disposers: Array<() => void> = [];

  constructor() {
    super();
    this.zIndex = 5;
    this.piecesBuilt = HubState.rocket_pieces_built;

    this.textNode = new Text({
      text: '',
      style: {
        fontFamily: '"IBM Plex Mono", ui-monospace, monospace',
        fontSize: 10,
        fill: 0xffffff,
        fontWeight: '600',
        letterSpacing: 1.5,
      },
    });
    this.textNode.anchor.set(0, 0.5);

    this.addChild(this.bg);
    this.addChild(this.textNode);

    this.disposers.push(
      HubState.rocketPieceBuilt.connect(() => {
        this.piecesBuilt = HubState.rocket_pieces_built;
        this.redraw();
      }),
    );
    this.redraw();
  }

  destroyHub(): void {
    for (const d of this.disposers) d();
    this.disposers = [];
    this.destroy({ children: true });
  }

  private redraw(): void {
    const W = GameConfig.VIEWPORT_WIDTH;
    const centerX = W * 0.5;
    const hudY = 24;
    const total = ROCKET_RECIPE.length;
    const text = `CASULO · ${this.piecesBuilt}/${total}`;
    const stateColor = this.getStateColor();
    this.textNode.text = text;
    this.textNode.style.fill = Color.hex(stateColor);

    const padding = 8;
    const boxW = this.textNode.width + padding * 2;
    const boxH = this.textNode.height + 6;
    const bx = centerX - boxW * 0.5;
    const by = hudY - boxH * 0.5;

    this.bg.clear();
    this.bg.rect(bx, by, boxW, boxH).fill({ color: Color.hex(Color.rgb(0.06, 0.07, 0.05)), alpha: 0.9 });
    this.bg.rect(bx, by, boxW, boxH).stroke({ color: Color.hex(stateColor), width: 1 });

    this.textNode.x = bx + padding;
    this.textNode.y = hudY;
  }

  private getStateColor(): RGBA {
    switch (this.piecesBuilt) {
      case 0:
      case 1:
      case 2: return Color.rgb(0.72, 0.45, 0.85);
      case 3:
      case 4:
      case 5: return Color.rgb(0.30, 0.78, 0.72);
      case 6:
      case 7: return Color.rgb(0.40, 0.85, 0.55);
      case 8: return Color.rgb(1.0, 0.85, 0.4);
      default: return Color.rgb(0.5, 0.5, 0.5);
    }
  }
}
