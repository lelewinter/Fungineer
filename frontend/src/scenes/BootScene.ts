import { Container, Graphics, Text } from 'pixi.js';
import { Scene } from '../core/Scene';
import { Color } from '../core/Color';
import { GameConfig } from '../state/GameConfig';
import { HubState } from '../state/HubState';

/** Placeholder boot scene used by the scaffold. Phase 2 replaces this with HubScene. */
export class BootScene extends Scene {
  private title!: Text;
  private subtitle!: Text;
  private elapsed = 0;

  override async enter(): Promise<void> {
    const W = GameConfig.VIEWPORT_WIDTH;
    const H = GameConfig.VIEWPORT_HEIGHT;
    const variant = HubState.getVariantData();

    const bg = new Graphics();
    bg.rect(0, 0, W, H).fill(Color.hex(variant.bg));
    this.root.addChild(bg);

    const grid = new Graphics();
    const step = 32;
    for (let x = 0; x <= W; x += step) grid.moveTo(x, 0).lineTo(x, H);
    for (let y = 0; y <= H; y += step) grid.moveTo(0, y).lineTo(W, y);
    grid.stroke({ color: Color.hex(variant.grid), width: 1, alpha: 0.5 });
    this.root.addChild(grid);

    const stack = new Container();
    stack.x = W / 2;
    stack.y = H / 2;
    this.root.addChild(stack);

    this.title = new Text({
      text: 'FUNGINEER',
      style: {
        fontFamily: '"Space Grotesk", system-ui, sans-serif',
        fontSize: 36,
        fontWeight: '900',
        fill: Color.hex(variant.accent),
        align: 'center',
        letterSpacing: 4,
      },
    });
    this.title.anchor.set(0.5);
    this.title.y = -40;
    stack.addChild(this.title);

    this.subtitle = new Text({
      text: 'Phase 1 — scaffold ok\nPixiJS port booting…',
      style: {
        fontFamily: '"Space Grotesk", system-ui, sans-serif',
        fontSize: 16,
        fill: Color.hex(variant.ink),
        align: 'center',
      },
    });
    this.subtitle.anchor.set(0.5);
    this.subtitle.y = 10;
    stack.addChild(this.subtitle);

    const footer = new Text({
      text: `${W} × ${H} • PixiJS v8`,
      style: {
        fontFamily: '"IBM Plex Mono", ui-monospace, monospace',
        fontSize: 11,
        fill: Color.hex(variant.cool_light),
        align: 'center',
      },
    });
    footer.anchor.set(0.5, 1);
    footer.x = W / 2;
    footer.y = H - 24;
    this.root.addChild(footer);
  }

  override update(dt: number): void {
    this.elapsed += dt;
    const pulse = 0.85 + 0.15 * Math.sin(this.elapsed * 2.4);
    if (this.title) this.title.alpha = pulse;
  }
}
