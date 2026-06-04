import { Text } from 'pixi.js';
import { Modal } from '../Modal';
import { PixiButton } from '../PixiButton';
import { Color } from '../../core/Color';
import { Signal } from '../../core/Signal';
import { HubState } from '../../state/HubState';

/** Zone briefing zoom panel. Mirrors HubZoomPanel.gd. */
export class HubZoomPanel extends Modal {
  readonly startRunRequested = new Signal<[zoneId: string]>();

  private roomId: string;
  private zoneId: string;

  constructor(roomId: string, zoneId: string) {
    super(320, 360);
    this.roomId = roomId;
    this.zoneId = zoneId;
    this.drawPanelBg(Color.hex(Color.rgb(0.30, 0.78, 0.72)));
    this.buildContent();
    void this.animateOpen();
    void this.roomId; // referenced for telemetry / future
  }

  private buildContent(): void {
    const halfW = this.panelW / 2;
    const halfH = this.panelH / 2;
    const padding = 16;

    const zone = HubState.getZoneById(this.zoneId);
    const zoneName = zone?.name ?? this.zoneId;

    // Header
    const header = new Text({
      text: `[${zoneName}]`,
      style: { fontFamily: '"Space Grotesk", system-ui, sans-serif', fontSize: 16, fill: 0xffffff, fontWeight: '700', letterSpacing: 0.5 },
    });
    header.x = -halfW + padding;
    header.y = -halfH + padding;
    this.panel.addChild(header);

    // Briefing
    const briefing = new Text({
      text: zone?.briefing ?? 'Zona desconhecida',
      style: {
        fontFamily: '"Space Grotesk", system-ui, sans-serif',
        fontSize: 11,
        fill: Color.hex(Color.rgb(0.86, 0.90, 0.82)),
        lineHeight: 16,
        wordWrap: true,
        wordWrapWidth: this.panelW - padding * 2,
      },
    });
    briefing.x = -halfW + padding;
    briefing.y = -halfH + padding + 34;
    this.panel.addChild(briefing);

    // Start button
    const startBtn = new PixiButton({
      label: '► Iniciar',
      width: this.panelW - padding * 2,
      height: 40,
      textColor: 0x9dffce,
      fontSize: 15,
      onClick: () => {
        this.startRunRequested.emit(this.zoneId);
        void this.requestClose();
      },
    });
    startBtn.x = -(this.panelW - padding * 2) / 2;
    startBtn.y = halfH - padding - 40;
    this.panel.addChild(startBtn);
  }
}
