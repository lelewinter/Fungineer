import { Text } from 'pixi.js';
import { Modal } from '../Modal';
import { PixiButton } from '../PixiButton';
import { Color } from '../../core/Color';
import { HubData, type HubNpc } from '../../state/HubData';

/** NPC popover with name, role, briefing, and mission. Mirrors HubCharacterCard.gd. */
export class HubCharacterCard extends Modal {
  private npc: HubNpc;

  constructor(npc: HubNpc) {
    super(300, 220);
    this.npc = npc;
    this.drawPanelBg(Color.hex(Color.rgb(0.65, 0.56, 0.78)));
    this.buildContent();
    void this.animateOpen();
  }

  private buildContent(): void {
    const halfW = this.panelW / 2;
    const halfH = this.panelH / 2;
    const padding = 14;
    const left = -halfW + padding;
    const right = halfW - padding;
    let y = -halfH + padding;

    // Header — name + trust
    const name = new Text({
      text: this.npc.nome,
      style: { fontFamily: '"Space Grotesk", system-ui, sans-serif', fontSize: 14, fill: 0xffffff, fontWeight: '700' },
    });
    name.x = left;
    name.y = y;
    this.panel.addChild(name);

    const trust = new Text({
      text: `🤝 ${this.npc.trust}%`,
      style: { fontFamily: '"Space Grotesk", system-ui, sans-serif', fontSize: 12, fill: Color.hex(Color.rgb(0.85, 0.92, 0.78)) },
    });
    trust.anchor.set(1, 0);
    trust.x = right;
    trust.y = y;
    this.panel.addChild(trust);

    y += 22;

    // Hint (role)
    const hint = new Text({
      text: this.npc.hint,
      style: { fontFamily: '"Space Grotesk", system-ui, sans-serif', fontSize: 10, fill: 0xcccccc },
    });
    hint.x = left;
    hint.y = y;
    this.panel.addChild(hint);
    y += 18;

    // Separator
    y += 4;

    // Dialog data
    const dialog = HubData.getDialog(this.npc.id);
    if (dialog) {
      const briefing = new Text({
        text: dialog.briefing,
        style: {
          fontFamily: '"Space Grotesk", system-ui, sans-serif',
          fontSize: 10,
          fill: Color.hex(Color.rgb(0.85, 0.85, 0.85)),
          wordWrap: true,
          wordWrapWidth: this.panelW - padding * 2,
        },
      });
      briefing.x = left;
      briefing.y = y;
      this.panel.addChild(briefing);
      y += briefing.height + 8;

      const mission = new Text({
        text: `→ ${dialog.mission}`,
        style: {
          fontFamily: '"Space Grotesk", system-ui, sans-serif',
          fontSize: 10,
          fill: Color.hex(Color.rgb(0.91, 0.58, 0.23)),
          wordWrap: true,
          wordWrapWidth: this.panelW - padding * 2,
        },
      });
      mission.x = left;
      mission.y = y;
      this.panel.addChild(mission);
    }

    // Close button
    const closeBtn = new PixiButton({
      label: 'Fechar',
      width: 100,
      height: 26,
      onClick: () => void this.requestClose(),
    });
    closeBtn.x = -50;
    closeBtn.y = halfH - padding - 26;
    this.panel.addChild(closeBtn);
  }
}
