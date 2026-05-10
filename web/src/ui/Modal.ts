import { Container, FederatedPointerEvent, Graphics } from 'pixi.js';
import { Signal } from '../core/Signal';
import { Easing, tween } from '../core/tween';
import { GameConfig } from '../state/GameConfig';

/** Centered modal panel with fade/scale open & close animations.
 *  Subclasses populate `panel` with content and emit `closed` when done. */
export abstract class Modal extends Container {
  readonly closed = new Signal<[]>();

  protected backdrop: Graphics;
  protected panel: Container;
  protected panelW: number;
  protected panelH: number;
  protected backdropAlpha = 0.6;

  constructor(panelW: number, panelH: number) {
    super();
    this.panelW = panelW;
    this.panelH = panelH;
    this.zIndex = 100;
    this.eventMode = 'static';

    const W = GameConfig.VIEWPORT_WIDTH;
    const H = GameConfig.VIEWPORT_HEIGHT;
    this.backdrop = new Graphics().rect(0, 0, W, H).fill({ color: 0x000000, alpha: 1 });
    this.backdrop.alpha = 0;
    this.backdrop.eventMode = 'static';
    this.backdrop.cursor = 'pointer';
    this.backdrop.on('pointertap', (_e: FederatedPointerEvent) => this.requestClose());
    this.addChild(this.backdrop);

    this.panel = new Container();
    this.panel.x = W / 2;
    this.panel.y = H / 2;
    this.panel.alpha = 0;
    this.panel.scale.set(0.85);
    this.panel.eventMode = 'static';
    this.panel.on('pointertap', (e: FederatedPointerEvent) => e.stopPropagation());
    this.addChild(this.panel);
  }

  /** Subclasses call this once content is built. */
  protected async animateOpen(): Promise<void> {
    await Promise.all([
      tween({
        durationMs: 280,
        ease: Easing.easeOutCubic,
        onUpdate: (t) => { this.backdrop.alpha = t * this.backdropAlpha; },
      }),
      tween({
        durationMs: 280,
        ease: Easing.easeOutCubic,
        onUpdate: (t) => { this.panel.alpha = t; this.panel.scale.set(0.85 + 0.15 * t); },
      }),
    ]);
  }

  protected async animateClose(): Promise<void> {
    await Promise.all([
      tween({
        durationMs: 180,
        ease: Easing.easeInCubic,
        onUpdate: (t) => { this.backdrop.alpha = (1 - t) * this.backdropAlpha; },
      }),
      tween({
        durationMs: 180,
        ease: Easing.easeInCubic,
        onUpdate: (t) => { this.panel.alpha = 1 - t; this.panel.scale.set(1 - 0.15 * t); },
      }),
    ]);
  }

  /** Public API — called by ESC handler or close button. */
  async requestClose(): Promise<void> {
    await this.animateClose();
    this.closed.emit();
    this.destroy({ children: true });
  }

  protected drawPanelBg(stroke: number = 0xb573d8): void {
    const bg = new Graphics();
    bg.roundRect(-this.panelW / 2, -this.panelH / 2, this.panelW, this.panelH, 6)
      .fill({ color: 0x141a11, alpha: 0.96 })
      .stroke({ color: stroke, width: 2 });
    this.panel.addChildAt(bg, 0);
  }
}
