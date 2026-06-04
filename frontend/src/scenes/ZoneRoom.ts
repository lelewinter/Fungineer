import { Container, FederatedPointerEvent, Graphics, Text } from 'pixi.js';
import { Color, type RGBA } from '../core/Color';
import { Signal } from '../core/Signal';
import { PixiButton } from '../ui/PixiButton';

/** Reusable zone room widget for WorldMapScene. Mirrors src/scenes/ZoneRoom.gd. */
export class ZoneRoom extends Container {
  readonly raidRequested = new Signal<[zoneName: string]>();

  private bg = new Graphics();
  private nameLabel: Text;
  private subtitleLabel: Text;
  private raidBtn: PixiButton;
  private boundsW = 0;
  private boundsH = 0;
  private accent: RGBA;
  private locked = false;

  constructor(opts: {
    width: number;
    height: number;
    accentColor: RGBA;
    zoneName: string;
    roomSubtitle: string;
    locked?: boolean;
    onRaid?: () => void;
  }) {
    super();
    this.boundsW = opts.width;
    this.boundsH = opts.height;
    this.accent = opts.accentColor;
    this.locked = opts.locked ?? false;
    this.addChild(this.bg);

    this.nameLabel = new Text({
      text: opts.zoneName,
      style: {
        fontFamily: '"Space Grotesk", system-ui, sans-serif',
        fontSize: 14,
        fill: Color.hex(Color.rgb(0.95, 0.95, 0.95)),
        fontWeight: '700',
      },
    });
    this.nameLabel.x = 8;
    this.nameLabel.y = 8;
    this.addChild(this.nameLabel);

    this.subtitleLabel = new Text({
      text: opts.roomSubtitle,
      style: {
        fontFamily: '"Space Grotesk", system-ui, sans-serif',
        fontSize: 10,
        fill: Color.hex(Color.rgb(0.75, 0.75, 0.75)),
      },
    });
    this.subtitleLabel.x = 8;
    this.subtitleLabel.y = 26;
    this.addChild(this.subtitleLabel);

    this.raidBtn = new PixiButton({
      label: 'RAIDAR',
      width: 70,
      height: 22,
      fontSize: 9,
      onClick: () => {
        if (this.locked) return;
        opts.onRaid?.();
        this.raidRequested.emit(opts.zoneName);
      },
    });
    this.raidBtn.x = opts.width - 78;
    this.raidBtn.y = opts.height - 30;
    this.addChild(this.raidBtn);

    this.eventMode = 'static';
    this.cursor = this.locked ? 'not-allowed' : 'pointer';
    this.on('pointertap', (e: FederatedPointerEvent) => {
      // Bubble through to PixiButton inside; only trigger raid if button itself wasn't hit.
      if (e.target === this.raidBtn || (e.target as Container).parent === this.raidBtn) return;
    });

    this.draw();
    if (this.locked) this.raidBtn.alpha = 0.4;
  }

  setLocked(locked: boolean): void {
    this.locked = locked;
    this.raidBtn.alpha = locked ? 0.4 : 1.0;
    this.draw();
  }

  private draw(): void {
    this.bg.clear();
    const tinted: RGBA = {
      r: this.accent.r * 0.30,
      g: this.accent.g * 0.30,
      b: this.accent.b * 0.30,
      a: 1,
    };
    this.bg
      .rect(0, 0, this.boundsW, this.boundsH)
      .fill(Color.hex(Color.rgb(0.051, 0.051, 0.051)))
      .rect(2, 2, this.boundsW - 4, 36)
      .fill({ color: Color.hex(tinted), alpha: this.locked ? 0.15 : 0.6 })
      .rect(0, 0, this.boundsW, this.boundsH)
      .stroke({ color: Color.hex(this.accent), width: 2, alpha: this.locked ? 0.4 : 1 });
  }
}
