import { Container, FederatedPointerEvent, Graphics, Rectangle, Text } from 'pixi.js';
import { audioManager } from '../core/AudioManager';
import { FontFamily, TextColor } from '../core/typography';
import { tween, Easing } from '../core/tween';

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
  /** Everything visual lives on `face` so we can scale it around its centre
   *  for a tactile press without disturbing the button's anchor position. */
  private face = new Container();
  private shadow = new Graphics();
  private glow = new Graphics();
  private bg = new Graphics();
  private textNode: Text;
  private opts: Required<Omit<ButtonOpts, 'silent'>> & { silent: boolean };
  private hovering = false;
  private pressAbort: AbortController | null = null;

  constructor(opts: ButtonOpts) {
    super();
    this.opts = {
      fill: 0x213a29,
      hoverFill: 0x2e5038,
      textColor: TextColor.ink,
      fontSize: 15,
      silent: false,
      ...opts,
    };

    const w = this.opts.width;
    const h = this.opts.height;

    this.textNode = new Text({
      text: this.opts.label,
      style: {
        fontFamily: FontFamily.body,
        fontSize: this.opts.fontSize,
        fill: this.opts.textColor,
        fontWeight: '700',
        letterSpacing: 0.4,
        // Drop shadow keeps the label legible over busy/low-contrast art.
        dropShadow: {
          color: 0x000000,
          alpha: 0.6,
          blur: 2,
          distance: 1,
          angle: Math.PI / 2,
        },
      },
    });
    this.textNode.anchor.set(0.5);
    this.textNode.x = w / 2;
    this.textNode.y = h / 2;

    this.glow.alpha = 0;
    this.face.addChild(this.shadow, this.glow, this.bg, this.textNode);
    // Centre pivot so press-scaling grows/shrinks from the middle.
    this.face.pivot.set(w / 2, h / 2);
    this.face.position.set(w / 2, h / 2);
    this.addChild(this.face);

    this.eventMode = 'static';
    this.cursor = 'pointer';
    // Stable hit area independent of the glow/shadow bounds and press scaling.
    this.hitArea = new Rectangle(0, 0, w, h);

    this.on('pointerover', () => { this.hovering = true; this.draw(); this.scaleTo(1.0); });
    this.on('pointerout', () => { this.hovering = false; this.draw(); this.scaleTo(1.0); });
    this.on('pointerdown', () => { this.scaleTo(0.93, 60); });
    this.on('pointerup', () => { this.scaleTo(1.0, 150, Easing.easeOutCubic); });
    this.on('pointerupoutside', () => { this.scaleTo(1.0, 150); });
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

  /** Animate the face scale (tactile press feedback). */
  private scaleTo(target: number, durationMs = 110, ease = Easing.easeOutCubic): void {
    this.pressAbort?.abort();
    const ac = new AbortController();
    this.pressAbort = ac;
    const from = this.face.scale.x;
    void tween({
      durationMs,
      ease,
      signal: ac.signal,
      onUpdate: (t) => {
        // A button that closes its own panel on click is destroyed mid-press
        // tween; bail out before touching the freed Pixi node.
        if (this.destroyed || this.face.destroyed) return;
        const s = from + (target - from) * t;
        this.face.scale.set(s);
      },
    });
  }

  override destroy(options?: Parameters<Container['destroy']>[0]): void {
    this.pressAbort?.abort();
    super.destroy(options);
  }

  private draw(): void {
    const w = this.opts.width;
    const h = this.opts.height;
    const r = Math.min(10, h * 0.28);
    const fill = this.hovering ? this.opts.hoverFill : this.opts.fill;
    const accent = this.opts.textColor;
    const borderColor = this.hovering ? accent : 0x86998a;

    // Drop shadow beneath the button — gives it physical lift.
    this.shadow.clear();
    this.shadow.roundRect(0, 3, w, h, r)
      .fill({ color: 0x000000, alpha: 0.45 });

    this.bg.clear();
    this.bg
      // Base.
      .roundRect(0, 0, w, h, r)
      .fill({ color: fill })
      // Top sheen.
      .roundRect(1.5, 1.5, w - 3, h * 0.5, r - 1)
      .fill({ color: 0xffffff, alpha: this.hovering ? 0.10 : 0.06 })
      // Bottom grounding shade.
      .roundRect(1.5, h * 0.6, w - 3, h * 0.4 - 1.5, r - 1)
      .fill({ color: 0x000000, alpha: 0.16 })
      // Border.
      .roundRect(0, 0, w, h, r)
      .stroke({ color: borderColor, width: this.hovering ? 2 : 1.5, alpha: this.hovering ? 1 : 0.9 });

    this.glow.clear();
    if (this.hovering) {
      // Outer glow halo.
      this.glow.roundRect(-4, -4, w + 8, h + 8, r + 3)
        .fill({ color: accent, alpha: 0.22 })
        .roundRect(-2, -2, w + 4, h + 4, r + 1)
        .fill({ color: accent, alpha: 0.12 });
      this.glow.alpha = 1;
    } else {
      this.glow.alpha = 0;
    }
  }
}
