import { Container, FederatedPointerEvent, Graphics } from 'pixi.js';
import { Signal } from '../core/Signal';
import { Easing, tween } from '../core/tween';
import { GameConfig } from '../state/GameConfig';

/** Centered modal panel with backdrop blur, animated traveling border,
 *  fade/scale open & close. Subclasses populate `panel` and emit `closed`. */
export abstract class Modal extends Container {
  readonly closed = new Signal<[]>();

  protected backdrop: Graphics;
  protected panelBg: Graphics;
  protected animatedBorder: Graphics;
  protected panel: Container;
  protected panelW: number;
  protected panelH: number;
  protected backdropAlpha = 0.72;
  protected borderColor = 0xb573d8;
  private borderTime = 0;
  private borderTicker: number | null = null;

  constructor(panelW: number, panelH: number) {
    super();
    this.panelW = panelW;
    this.panelH = panelH;
    this.zIndex = 100;
    this.eventMode = 'static';

    const W = GameConfig.VIEWPORT_WIDTH;
    const H = GameConfig.VIEWPORT_HEIGHT;
    this.backdrop = new Graphics().rect(0, 0, W, H).fill({ color: 0x040806, alpha: 1 });
    this.backdrop.alpha = 0;
    this.backdrop.eventMode = 'static';
    this.backdrop.cursor = 'pointer';
    // The old BlurFilter on the backdrop trashed WebGL 1 rendering on some
    // Android browsers — a flat tint at 0.7 alpha reads just as "modal" and
    // never breaks the underlying world layer.
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

    this.panelBg = new Graphics();
    this.panel.addChild(this.panelBg);

    this.animatedBorder = new Graphics();
    this.panel.addChild(this.animatedBorder);
  }

  /** Subclasses call this once content is built. */
  protected async animateOpen(): Promise<void> {
    this.startBorderAnimation();
    await Promise.all([
      tween({
        durationMs: 320,
        ease: Easing.easeOutCubic,
        onUpdate: (t) => {
          if (this.destroyed || this.backdrop.destroyed) return;
          this.backdrop.alpha = t * this.backdropAlpha;
        },
      }),
      tween({
        durationMs: 320,
        ease: Easing.easeOutCubic,
        onUpdate: (t) => {
          if (this.destroyed || this.panel.destroyed) return;
          this.panel.alpha = t;
          this.panel.scale.set(0.85 + 0.15 * t);
        },
      }),
    ]);
  }

  protected async animateClose(): Promise<void> {
    this.stopBorderAnimation();
    await Promise.all([
      tween({
        durationMs: 200,
        ease: Easing.easeInCubic,
        onUpdate: (t) => {
          if (this.destroyed || this.backdrop.destroyed) return;
          this.backdrop.alpha = (1 - t) * this.backdropAlpha;
        },
      }),
      tween({
        durationMs: 200,
        ease: Easing.easeInCubic,
        onUpdate: (t) => {
          if (this.destroyed || this.panel.destroyed) return;
          this.panel.alpha = 1 - t;
          this.panel.scale.set(1 - 0.15 * t);
        },
      }),
    ]);
  }

  async requestClose(): Promise<void> {
    await this.animateClose();
    this.closed.emit();
    this.destroy({ children: true });
  }

  /** Subclasses call to set their accent border color and draw the gradient bg. */
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

  private startBorderAnimation(): void {
    const tick = (): void => {
      this.borderTime += 0.012;
      this.drawTravelingBorder();
      this.borderTicker = requestAnimationFrame(tick);
    };
    this.borderTicker = requestAnimationFrame(tick);
  }

  private stopBorderAnimation(): void {
    if (this.borderTicker !== null) cancelAnimationFrame(this.borderTicker);
    this.borderTicker = null;
  }

  private drawTravelingBorder(): void {
    const hw = this.panelW / 2;
    const hh = this.panelH / 2;
    const perimeter = 2 * (this.panelW + this.panelH);
    const segLen = 60;
    const t = (this.borderTime * 200) % perimeter;

    this.animatedBorder.clear();

    const drawSegment = (startDist: number, length: number, alpha: number): void => {
      const points = this.borderPoints(hw, hh, startDist, length);
      for (let i = 0; i < points.length - 1; i++) {
        const a = points[i]!;
        const b = points[i + 1]!;
        this.animatedBorder.moveTo(a.x, a.y).lineTo(b.x, b.y)
          .stroke({ color: this.borderColor, width: 1.5, alpha });
      }
    };

    drawSegment(t, segLen, 1.0);
    drawSegment(t + perimeter * 0.5, segLen, 0.55);
  }

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

  private distanceToPoint(d: number, hw: number, hh: number): { x: number; y: number } {
    const w = this.panelW;
    const h = this.panelH;
    if (d < w) return { x: -hw + d, y: -hh };
    d -= w;
    if (d < h) return { x: hw, y: -hh + d };
    d -= h;
    if (d < w) return { x: hw - d, y: hh };
    d -= w;
    return { x: -hw, y: hh - d };
  }
}
