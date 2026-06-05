import { Text } from 'pixi.js';
import { Modal } from '../Modal';
import { PixiButton } from '../PixiButton';
import { Color } from '../../core/Color';
import { FontFamily } from '../../core/typography';
import { HubState, ROCKET_RECIPE } from '../../state/HubState';

/**
 * Victory screen shown when the player launches the completed bio-rocket.
 * Summarises the run and offers a fresh cycle. Emits `newCycle` so the host
 * scene can refresh after the state reset.
 */
export class RocketLaunchOverlay extends Modal {
  private elapsedMs = 0;
  private animationFrame = 0;
  private flame = new Text({ text: '', style: { fontFamily: FontFamily.display, fontSize: 40 } });

  constructor() {
    super(340, 420);
    const accent = Color.hex(Color.rgb(0.91, 0.58, 0.23));
    this.backdropAlpha = 0.9;
    this.drawPanelBg(accent);
    this.buildContent();
    void this.animateOpen();
    this.startAnimation();
  }

  override async requestClose(): Promise<void> {
    cancelAnimationFrame(this.animationFrame);
    await super.requestClose();
  }

  private startAnimation(): void {
    const start = performance.now();
    const tick = (): void => {
      if (this.destroyed) return;
      this.elapsedMs = performance.now() - start;
      // Gentle bob + flicker on the rocket glyph to sell the ascent.
      const rise = Math.min(1, this.elapsedMs / 1200);
      this.flame.y = -this.panelH / 2 + 96 - rise * 14 - Math.sin(this.elapsedMs * 0.008) * 3;
      this.flame.alpha = 0.7 + 0.3 * Math.abs(Math.sin(this.elapsedMs * 0.006));
      this.animationFrame = requestAnimationFrame(tick);
    };
    this.animationFrame = requestAnimationFrame(tick);
  }

  private buildContent(): void {
    const halfH = this.panelH / 2;
    const padding = 18;
    const ink = Color.hex(Color.rgb(0.96, 0.89, 0.78));
    const amber = Color.hex(Color.rgb(0.91, 0.58, 0.23));
    const cyan = Color.hex(Color.rgb(0.30, 0.78, 0.72));

    this.flame.text = '🚀';
    this.flame.anchor.set(0.5, 0.5);
    this.flame.x = 0;
    this.flame.y = -halfH + 96;
    this.panel.addChild(this.flame);

    const title = new Text({
      text: 'DECOLAGEM',
      style: { fontFamily: FontFamily.display, fontSize: 26, fontWeight: '700', fill: amber, align: 'center', letterSpacing: 3 },
    });
    title.anchor.set(0.5, 0);
    title.y = -halfH + 132;
    this.panel.addChild(title);

    const flavor = new Text({
      text: 'Dr. Paulo: "Eu disse que a semente voaria."',
      style: { fontFamily: FontFamily.body, fontSize: 11, fill: cyan, align: 'center', fontStyle: 'italic', wordWrap: true, wordWrapWidth: this.panelW - padding * 2 },
    });
    flavor.anchor.set(0.5, 0);
    flavor.y = -halfH + 168;
    this.panel.addChild(flavor);

    const survivors = HubState.rescued_characters.length;
    const summary = new Text({
      text: [
        `Peças germinadas    ${ROCKET_RECIPE.length} / ${ROCKET_RECIPE.length}`,
        `Raides realizadas    ${HubState.total_runs}`,
        `Sobreviventes a bordo ${survivors}`,
      ].join('\n'),
      style: { fontFamily: FontFamily.mono, fontSize: 13, fill: ink, align: 'center', lineHeight: 22 },
    });
    summary.anchor.set(0.5, 0);
    summary.y = -halfH + 212;
    this.panel.addChild(summary);

    const newCycle = new PixiButton({
      label: 'Novo Ciclo',
      width: 160,
      height: 40,
      fill: 0x4a2f12,
      hoverFill: 0x6b431a,
      onClick: () => {
        HubState.resetForNewCycle();
        void this.requestClose();
      },
    });
    newCycle.x = -80;
    newCycle.y = halfH - padding - 40;
    this.panel.addChild(newCycle);
  }
}
