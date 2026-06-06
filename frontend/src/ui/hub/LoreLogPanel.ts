import { Container, FederatedPointerEvent, Text } from 'pixi.js';
import { Modal } from '../Modal';
import { PixiButton } from '../PixiButton';
import { Color } from '../../core/Color';
import { FontFamily } from '../../core/typography';
import { HubState } from '../../state/HubState';
import { LoreFragments, type LoreFragment } from '../../data/LoreFragments';

const INK = Color.hex(Color.rgb(0.85, 0.92, 0.78));
const FAINT = Color.hex(Color.rgb(0.40, 0.42, 0.38));
const ACCENT = Color.hex(Color.rgb(0.30, 0.78, 0.72));
const AMBER = Color.hex(Color.rgb(0.91, 0.58, 0.23));

/**
 * O ARQUIVO — terminal de lore do hub. Lista os fragmentos do mundo: os
 * descobertos (tocáveis pra ler o texto completo) e os ainda ocultos. A
 * descoberta acontece ao vencer runs (ver RunScene.endRun → HubState).
 */
export class LoreLogPanel extends Modal {
  private listView = new Container();
  private readView = new Container();

  constructor() {
    super(360, 520);
    this.drawPanelBg(ACCENT);
    this.panel.addChild(this.listView, this.readView);
    this.buildList();
    void this.animateOpen();
  }

  private clearViews(): void {
    this.listView.removeChildren();
    this.readView.removeChildren();
    this.listView.visible = true;
    this.readView.visible = false;
  }

  /** Monta a lista de fragmentos (descobertos = título tocável; ocultos = 🔒). */
  private buildList(): void {
    this.clearViews();
    const halfH = this.panelH / 2;
    const halfW = this.panelW / 2;
    const pad = 18;
    const all = LoreFragments.getAll();
    const found = all.filter((f) => HubState.isLoreFound(f.id)).length;

    const header = new Text({
      text: '◈ ARQUIVO',
      style: { fontFamily: FontFamily.display, fontSize: 18, fontWeight: '700', fill: ACCENT, letterSpacing: 2 },
    });
    header.anchor.set(0.5, 0);
    header.y = -halfH + pad;
    this.listView.addChild(header);

    const count = new Text({
      text: `${found} / ${all.length} fragmentos recuperados`,
      style: { fontFamily: FontFamily.mono, fontSize: 11, fill: found > 0 ? AMBER : FAINT },
    });
    count.anchor.set(0.5, 0);
    count.y = -halfH + pad + 24;
    this.listView.addChild(count);

    let y = -halfH + pad + 52;
    for (const f of all) {
      const got = HubState.isLoreFound(f.id);
      const row = new Text({
        text: got ? `▸ ${f.title}` : '🔒 — fragmento não recuperado',
        style: {
          fontFamily: FontFamily.body, fontSize: 11,
          fill: got ? INK : FAINT, fontStyle: got ? 'normal' : 'italic',
          wordWrap: true, wordWrapWidth: this.panelW - pad * 2,
        },
      });
      row.anchor.set(0, 0);
      row.x = -halfW + pad;
      row.y = y;
      if (got) {
        row.eventMode = 'static';
        row.cursor = 'pointer';
        row.on('pointertap', (e: FederatedPointerEvent) => { e.stopPropagation(); this.showReading(f); });
      }
      this.listView.addChild(row);
      y += 26;
    }

    const close = new PixiButton({
      label: 'Fechar', width: 100, height: 28,
      onClick: () => void this.requestClose(),
    });
    close.x = -50;
    close.y = halfH - pad - 28;
    this.listView.addChild(close);
  }

  /** Mostra o texto completo de um fragmento descoberto, com botão Voltar. */
  private showReading(f: LoreFragment): void {
    this.listView.visible = false;
    this.readView.visible = true;
    this.readView.removeChildren();
    const halfH = this.panelH / 2;
    const halfW = this.panelW / 2;
    const pad = 18;

    const title = new Text({
      text: f.title,
      style: { fontFamily: FontFamily.display, fontSize: 15, fontWeight: '700', fill: AMBER, align: 'center', wordWrap: true, wordWrapWidth: this.panelW - pad * 2 },
    });
    title.anchor.set(0.5, 0);
    title.y = -halfH + pad;
    this.readView.addChild(title);

    const body = new Text({
      text: f.text,
      style: { fontFamily: FontFamily.mono, fontSize: 11, fill: INK, lineHeight: 17, wordWrap: true, wordWrapWidth: this.panelW - pad * 2 },
    });
    body.anchor.set(0, 0);
    body.x = -halfW + pad;
    body.y = -halfH + pad + 56;
    this.readView.addChild(body);

    const back = new PixiButton({
      label: '‹ Voltar', width: 110, height: 28,
      onClick: () => this.buildList(),
    });
    back.x = -55;
    back.y = halfH - pad - 28;
    this.readView.addChild(back);
  }
}
