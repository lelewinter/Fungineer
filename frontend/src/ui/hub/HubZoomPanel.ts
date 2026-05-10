import { Container, FederatedPointerEvent, Graphics, Text } from 'pixi.js';
import { Modal } from '../Modal';
import { PixiButton } from '../PixiButton';
import { Color } from '../../core/Color';
import { Signal } from '../../core/Signal';
import { HubState } from '../../state/HubState';

/** Zone briefing zoom panel with tabs. Mirrors HubZoomPanel.gd. */
export class HubZoomPanel extends Modal {
  readonly startRunRequested = new Signal<[zoneId: string]>();

  private roomId: string;
  private zoneId: string;
  private tabs: Array<{ title: string; container: Container }> = [];
  private tabHeader = new Container();
  private tabBody = new Container();
  private activeTab = 0;

  constructor(roomId: string, zoneId: string) {
    super(320, 420);
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
    const padding = 14;

    const zone = HubState.getZoneById(this.zoneId);
    const zoneName = zone?.name ?? this.zoneId;

    // Header
    const header = new Text({
      text: `[${zoneName}]`,
      style: { fontFamily: '"Space Grotesk", system-ui, sans-serif', fontSize: 14, fill: 0xffffff, fontWeight: '700' },
    });
    header.x = -halfW + padding;
    header.y = -halfH + padding;
    this.panel.addChild(header);

    // Tab body container
    this.tabBody.x = -halfW + padding;
    this.tabBody.y = -halfH + padding + 36;
    this.panel.addChild(this.tabBody);

    // Tab content
    const briefingText = zone?.briefing ?? 'Zona desconhecida';
    this.addTab('BRIEFING', this.makeTextBlock(briefingText));
    this.addTab('NPC', this.makeTextBlock('Contate o NPC da zona para missões'));
    this.addTab('HISTÓRICO', this.makeTextBlock('Nenhuma execução anterior'));
    this.addTab('ITENS', this.makeTextBlock('Itens especiais da zona'));

    // Tab header
    this.tabHeader.x = -halfW + padding;
    this.tabHeader.y = -halfH + padding + 22;
    this.panel.addChild(this.tabHeader);
    this.rebuildTabHeader();
    this.showTab(0);

    // Start button
    const startBtn = new PixiButton({
      label: '► Iniciar',
      width: 220,
      height: 32,
      onClick: () => {
        this.startRunRequested.emit(this.zoneId);
        void this.requestClose();
      },
    });
    startBtn.x = -110;
    startBtn.y = halfH - padding - 32;
    this.panel.addChild(startBtn);
  }

  private addTab(title: string, container: Container): void {
    container.visible = false;
    this.tabBody.addChild(container);
    this.tabs.push({ title, container });
  }

  private rebuildTabHeader(): void {
    this.tabHeader.removeChildren();
    let x = 0;
    for (let i = 0; i < this.tabs.length; i++) {
      const tab = this.tabs[i]!;
      const isActive = i === this.activeTab;
      const tabW = 70;
      const tabH = 22;
      const tabContainer = new Container();
      const bg = new Graphics()
        .roundRect(0, 0, tabW, tabH, 3)
        .fill(isActive ? 0x1f2a23 : 0x14181a)
        .stroke({ color: 0x4a584b, width: 1 });
      tabContainer.addChild(bg);
      const label = new Text({
        text: tab.title,
        style: {
          fontFamily: '"Space Grotesk", system-ui, sans-serif',
          fontSize: 9,
          fill: isActive ? 0xe6f0d9 : 0x8e9a92,
          fontWeight: '600',
        },
      });
      label.anchor.set(0.5);
      label.x = tabW / 2;
      label.y = tabH / 2;
      tabContainer.addChild(label);
      tabContainer.x = x;
      tabContainer.eventMode = 'static';
      tabContainer.cursor = 'pointer';
      tabContainer.on('pointertap', (e: FederatedPointerEvent) => {
        e.stopPropagation();
        this.showTab(i);
      });
      this.tabHeader.addChild(tabContainer);
      x += tabW + 4;
    }
  }

  private showTab(index: number): void {
    this.activeTab = index;
    for (let i = 0; i < this.tabs.length; i++) {
      this.tabs[i]!.container.visible = i === index;
    }
    this.rebuildTabHeader();
  }

  private makeTextBlock(text: string): Container {
    const c = new Container();
    const t = new Text({
      text,
      style: {
        fontFamily: '"Space Grotesk", system-ui, sans-serif',
        fontSize: 10,
        fill: Color.hex(Color.rgb(0.85, 0.85, 0.85)),
        wordWrap: true,
        wordWrapWidth: this.panelW - 28,
      },
    });
    c.addChild(t);
    return c;
  }
}
