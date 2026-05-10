import { Container, FederatedPointerEvent, Graphics, Text } from 'pixi.js';

interface ButtonOpts {
  label: string;
  width: number;
  height: number;
  onClick: () => void;
  fill?: number;
  hoverFill?: number;
  textColor?: number;
  fontSize?: number;
}

export class PixiButton extends Container {
  private bg = new Graphics();
  private textNode: Text;
  private opts: Required<ButtonOpts>;

  constructor(opts: ButtonOpts) {
    super();
    this.opts = {
      fill: 0x222823,
      hoverFill: 0x303a31,
      textColor: 0xe6f0d9,
      fontSize: 12,
      ...opts,
    };
    this.textNode = new Text({
      text: this.opts.label,
      style: {
        fontFamily: 'system-ui, sans-serif',
        fontSize: this.opts.fontSize,
        fill: this.opts.textColor,
        fontWeight: '600',
      },
    });
    this.textNode.anchor.set(0.5);
    this.textNode.x = this.opts.width / 2;
    this.textNode.y = this.opts.height / 2;
    this.addChild(this.bg);
    this.addChild(this.textNode);
    this.eventMode = 'static';
    this.cursor = 'pointer';
    this.on('pointerover', () => this.draw(this.opts.hoverFill));
    this.on('pointerout', () => this.draw(this.opts.fill));
    this.on('pointertap', (e: FederatedPointerEvent) => {
      e.stopPropagation();
      this.opts.onClick();
    });
    this.draw(this.opts.fill);
  }

  setLabel(text: string): void {
    this.textNode.text = text;
  }

  private draw(fill: number): void {
    this.bg.clear();
    this.bg.roundRect(0, 0, this.opts.width, this.opts.height, 4)
      .fill({ color: fill })
      .stroke({ color: 0x4a584b, width: 1 });
  }
}
