import { Container, FederatedPointerEvent, Graphics, Rectangle } from 'pixi.js';
import { Signal } from '../../core/Signal';
import { TextColor } from '../../core/typography';
import { audioSettings } from '../../state/AudioSettings';

const R = 16;

/** Small round speaker button for the hub. Reflects the mute state and emits
 *  `clicked` (the HubScene opens the audio settings modal on tap). */
export class AudioButton extends Container {
  readonly clicked = new Signal<[]>();

  private g = new Graphics();
  private hovering = false;
  private changedDispose: (() => void) | null;

  constructor() {
    super();
    this.addChild(this.g);

    this.eventMode = 'static';
    this.cursor = 'pointer';
    this.hitArea = new Rectangle(-R - 2, -R - 2, (R + 2) * 2, (R + 2) * 2);

    this.on('pointertap', (e: FederatedPointerEvent) => { e.stopPropagation(); this.clicked.emit(); });
    this.on('pointerover', () => { this.hovering = true; this.draw(); });
    this.on('pointerout', () => { this.hovering = false; this.draw(); });

    this.changedDispose = audioSettings.changed.connect(() => this.draw());
    this.draw();
  }

  private draw(): void {
    const muted = audioSettings.muted;
    const accent = TextColor.accent;
    const g = this.g;
    g.clear();

    // Disc background.
    g.circle(0, 0, R).fill({ color: 0x14110a, alpha: 0.92 });
    g.circle(0, 0, R).stroke({ color: accent, width: 1.5, alpha: this.hovering ? 1 : 0.55 });

    const iconColor = muted ? TextColor.faint : accent;

    // Speaker body + cone.
    g.rect(-7, -3.5, 4, 7).fill({ color: iconColor });
    g.moveTo(-3, -3.5).lineTo(2, -7).lineTo(2, 7).lineTo(-3, 3.5).lineTo(-3, -3.5).fill({ color: iconColor });

    if (muted) {
      // Red slash for the muted state.
      g.moveTo(-6, -7).lineTo(8, 7).stroke({ color: TextColor.red, width: 2 });
    } else {
      // Sound waves.
      g.arc(2, 0, 6, -Math.PI / 3, Math.PI / 3).stroke({ color: iconColor, width: 1.5 });
      g.arc(2, 0, 9.5, -Math.PI / 3, Math.PI / 3).stroke({ color: iconColor, width: 1.5, alpha: 0.7 });
    }
  }

  override destroy(options?: Parameters<Container['destroy']>[0]): void {
    this.changedDispose?.();
    this.changedDispose = null;
    super.destroy(options);
  }
}
