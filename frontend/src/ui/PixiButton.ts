import { Container, FederatedPointerEvent, Graphics, Text } from 'pixi.js';
import { audioManager } from '../core/AudioManager';
import { FontFamily, TextColor } from '../core/typography';

interface ButtonOpts {
  label: string;
  width: number;
  height: number;
  onClick: () => void;
  fill?: number;
  hoverFill?: number;
  textColor?: number;
  fontSize?: number;
  /** false → skips the click click sound (useful for variant selectors that double-trigger). */
  silent?: boolean;
}

export class PixiButton extends Container {
  private bg = new Graphics();
  private glow = new Graphics();
  private textNode: Text;
  private opts: Required<Omit<ButtonOpts, 'silent'>> & { silent: boolean };
  private hovering = false;

  constructor(opts: ButtonOpts) {
    super();
    this.opts = {
      fill: 0x1a2118,
      hoverFill: 0x263220,
      textColor: TextColor.ink,
      fontSize: 12,
      silent: false,
      ...opts,
    };

    this.textNode = new Text({
      text: this.opts.label,
      style: {
        fontFamily: FontFamily.body,
        fontSize: this.opts.fontSize,
        fill: this.opts.textColor,
        fontWeight: '600',
        letterSpacing: 1,
      },
    });
    this.textNode.anchor.set(0.5);
    this.textNode.x = this.opts.width / 2;
    this.textNode.y = this.opts.height / 2;

    this.glow.alpha = 0;
    this.addChild(this.glow);
    this.addChild(this.bg);
    this.addChild(this.textNode);

    this.eventMode = 'static';
    this.cursor = 'pointer';
    this.on('pointerover', () => { this.hovering = true; this.draw(); });
    this.on('pointerout', () => { this.hovering = false; this.draw(); });
    this.on('pointerdown', () => { this.bg.alpha = 0.85; });
    this.on('pointerup', () => { this.bg.alpha = 1; });
    this.on('pointerupoutside', () => { this.bg.alpha = 1; });
    this.on('pointertap', (e: FederatedPointerEvent) => {
      e.stopPropagation();
      if (!this.opts.silent) audioManager.playSfx('res://assets/audio/sfx/ui/Click_03.wav', 0.4);
      this.opts.onClick();
    });
    this.draw();
  }

  setLabel(text: string): void {
    this.textNode.text = text;
  }

  private draw(): void {
    const w = this.opts.width;
    const h = this.opts.height;
    const fill = this.hovering ? this.opts.hoverFill : this.opts.fill;
    const borderColor = this.hovering ? this.opts.textColor : 0x4a584b;

    this.bg.clear();
    // Inner subtle highlight (top)
    this.bg.roundRect(0, 0, w, h, 4)
      .fill({ color: fill })
      .roundRect(1, 1, w - 2, h * 0.45, 3)
      .fill({ color: 0xffffff, alpha: 0.04 })
      .roundRect(0, 0, w, h, 4)
      .stroke({ color: borderColor, width: 1, alpha: this.hovering ? 1 : 0.6 });

    this.glow.clear();
    if (this.hovering) {
      // Outer glow ring
      this.glow.roundRect(-3, -3, w + 6, h + 6, 6)
        .fill({ color: this.opts.textColor, alpha: 0.18 })
        .roundRect(-1.5, -1.5, w + 3, h + 3, 5)
        .fill({ color: this.opts.textColor, alpha: 0.08 });
      this.glow.alpha = 1;
    } else {
      this.glow.alpha = 0;
    }
  }
}
