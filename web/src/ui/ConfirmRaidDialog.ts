import { Text } from 'pixi.js';
import { Modal } from './Modal';
import { PixiButton } from './PixiButton';
import { Color } from '../core/Color';
import { Signal } from '../core/Signal';

/** Modal confirmation before starting a raid. Mirrors ConfirmRaidDialog.gd. */
export class ConfirmRaidDialog extends Modal {
  readonly confirmed = new Signal<[]>();
  readonly cancelled = new Signal<[]>();

  constructor(zoneName: string, zoneDescription: string) {
    super(320, 220);
    this.drawPanelBg(Color.hex(Color.rgb(0.85, 0.55, 0.30)));
    this.buildContent(zoneName, zoneDescription);
    void this.animateOpen();
  }

  private buildContent(zoneName: string, zoneDescription: string): void {
    const halfH = this.panelH / 2;
    const padding = 16;

    const title = new Text({
      text: zoneName,
      style: {
        fontFamily: 'system-ui, sans-serif',
        fontSize: 18,
        fontWeight: '900',
        fill: Color.hex(Color.rgb(1.0, 0.9, 0.5)),
        letterSpacing: 2,
      },
    });
    title.anchor.set(0.5, 0);
    title.x = 0;
    title.y = -halfH + padding;
    this.panel.addChild(title);

    const desc = new Text({
      text: zoneDescription,
      style: {
        fontFamily: 'system-ui, sans-serif',
        fontSize: 11,
        fill: Color.hex(Color.rgb(0.85, 0.85, 0.85)),
        wordWrap: true,
        wordWrapWidth: this.panelW - padding * 2,
        align: 'center',
      },
    });
    desc.anchor.set(0.5, 0);
    desc.x = 0;
    desc.y = -halfH + padding + 32;
    this.panel.addChild(desc);

    const confirmBtn = new PixiButton({
      label: '► CONFIRMAR RAID',
      width: 220,
      height: 32,
      onClick: () => {
        this.confirmed.emit();
        void this.requestClose();
      },
    });
    confirmBtn.x = -110;
    confirmBtn.y = halfH - padding - 70;
    this.panel.addChild(confirmBtn);

    const cancelBtn = new PixiButton({
      label: 'Cancelar',
      width: 220,
      height: 28,
      fill: 0x1a1a1a,
      hoverFill: 0x252525,
      onClick: () => {
        this.cancelled.emit();
        void this.requestClose();
      },
    });
    cancelBtn.x = -110;
    cancelBtn.y = halfH - padding - 32;
    this.panel.addChild(cancelBtn);
  }
}
