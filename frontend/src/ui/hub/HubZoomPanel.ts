// ============================================================================
// HubZoomPanel — a janela de "briefing" de uma zona antes de entrar.
//
// O que faz: ao tocar numa sala do hub, abre esta janela com o nome da zona,
// um texto explicando o que esperar (briefing) e um botão grande "INICIAR".
// Ao clicar em iniciar, emite `startRunRequested` com o id da zona — a cena do
// hub usa isso para começar a partida naquela zona.
//
// Onde encaixa: ponte entre o hub (base) e o início de uma run.
// (Equivale ao antigo HubZoomPanel.gd da versão em Godot.)
// ============================================================================
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
    super(330, 400);
    this.roomId = roomId;
    this.zoneId = zoneId;
    // Cor de destaque turquesa (mycelium).
    this.drawPanelBg(Color.hex(Color.rgb(0.30, 0.78, 0.72)));
    this.buildContent();
    void this.animateOpen();
    void this.roomId; // referenced for telemetry / future
  }

  /** Monta o conteúdo: cabeçalho com o nome da zona, texto de briefing e o
   *  botão de iniciar. Os dados da zona vêm do HubState pelo zoneId. */
  private buildContent(): void {
    const halfW = this.panelW / 2;
    const halfH = this.panelH / 2;
    const padding = 16;

    const zone = HubState.getZoneById(this.zoneId);
    const zoneName = zone?.name ?? this.zoneId;

    // Header
    const header = new Text({
      text: zoneName,
      style: { fontFamily: '"Rubik", system-ui, sans-serif', fontSize: 19, fill: 0xffffff, fontWeight: '700', letterSpacing: 0.5 },
    });
    header.x = -halfW + padding;
    header.y = -halfH + padding;
    this.panel.addChild(header);

    // Briefing
    const briefing = new Text({
      text: zone?.briefing ?? 'Zona desconhecida',
      style: {
        fontFamily: '"Rubik", system-ui, sans-serif',
        fontSize: 14,
        fill: Color.hex(Color.rgb(0.90, 0.94, 0.85)),
        lineHeight: 20,
        wordWrap: true,
        wordWrapWidth: this.panelW - padding * 2,
      },
    });
    briefing.x = -halfW + padding;
    briefing.y = -halfH + padding + 40;
    this.panel.addChild(briefing);

    // Start button
    const startBtn = new PixiButton({
      label: '► INICIAR',
      width: this.panelW - padding * 2,
      height: 48,
      textColor: 0x9dffce,
      fontSize: 18,
      onClick: () => {
        this.startRunRequested.emit(this.zoneId);
        void this.requestClose();
      },
    });
    startBtn.x = -(this.panelW - padding * 2) / 2;
    startBtn.y = halfH - padding - 48;
    this.panel.addChild(startBtn);
  }
}
