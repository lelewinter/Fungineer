import { Container, Graphics, Text } from 'pixi.js';
import { Modal } from '../Modal';
import { PixiButton } from '../PixiButton';
import { Color, type RGBA } from '../../core/Color';
import { HubState, ROCKET_RECIPE } from '../../state/HubState';

/** Bio-pod schematic panel. Mirrors HubRocketPanel.gd. */
export class HubRocketPanel extends Modal {
  private canvasContainer = new Container();
  private g = new Graphics();
  private elapsedMs = 0;
  private animationFrame = 0;

  constructor() {
    super(360, 480);
    this.drawPanelBg(Color.hex(Color.rgb(0.72, 0.45, 0.85)));
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
      this.elapsedMs = performance.now() - start;
      this.drawPod();
      this.animationFrame = requestAnimationFrame(tick);
    };
    this.animationFrame = requestAnimationFrame(tick);
  }

  private buildContent(): void {
    const halfH = this.panelH / 2;
    const padding = 16;
    const innerW = this.panelW - padding * 2;

    let cy = -halfH + padding;

    const header = new Text({
      text: '◈ CASULO BIOLÓGICO · ESQUEMA',
      style: { fontFamily: '"Space Grotesk", system-ui, sans-serif', fontSize: 15, fontWeight: '700', fill: Color.hex(Color.rgb(0.88, 0.94, 0.82)), align: 'center', letterSpacing: 1 },
    });
    header.anchor.set(0.5, 0);
    header.x = 0;
    header.y = cy;
    this.panel.addChild(header);
    cy += 18;

    const subtitle = new Text({
      text: 'Dr. Paulo: "Foguete? Não. Semente."',
      style: { fontFamily: '"Space Grotesk", system-ui, sans-serif', fontSize: 9, fill: Color.hex(Color.rgb(0.72, 0.45, 0.85)), align: 'center' },
    });
    subtitle.anchor.set(0.5, 0);
    subtitle.x = 0;
    subtitle.y = cy;
    this.panel.addChild(subtitle);
    cy += 16;

    // Canvas area
    const canvasH = 320;
    this.canvasContainer.x = -innerW / 2;
    this.canvasContainer.y = cy;
    this.canvasContainer.addChild(this.g);
    this.panel.addChild(this.canvasContainer);
    cy += canvasH + 8;

    // Status
    const built = HubState.rocket_pieces_built;
    const total = ROCKET_RECIPE.length;
    const pct = Math.floor((built / total) * 100);
    const status = new Text({
      text: `${built} / ${total} peças · ${pct}% germinado`,
      style: { fontFamily: '"Space Grotesk", system-ui, sans-serif', fontSize: 10, fill: Color.hex(Color.rgb(0.30, 0.78, 0.72)), align: 'center' },
    });
    status.anchor.set(0.5, 0);
    status.x = 0;
    status.y = cy;
    this.panel.addChild(status);

    // Close button
    const close = new PixiButton({
      label: 'Fechar',
      width: 100,
      height: 28,
      onClick: () => void this.requestClose(),
    });
    close.x = -50;
    close.y = halfH - padding - 28;
    this.panel.addChild(close);
  }

  private drawPod(): void {
    this.g.clear();
    const purple = Color.rgb(0.72, 0.45, 0.85);
    const cyan = Color.rgb(0.30, 0.78, 0.72);
    const earth = Color.rgb(0.55, 0.35, 0.20);
    const amber = Color.rgb(0.91, 0.58, 0.23);
    const gray: RGBA = { r: 0.35, g: 0.32, b: 0.28, a: 1 };

    const built = HubState.rocket_pieces_built;
    const recipe = ROCKET_RECIPE;
    const innerW = this.panelW - 32;
    const cx = innerW * 0.5;
    const canvasH = 320;
    const topY = 30;
    const bottomY = canvasH - 30;
    const podH = bottomY - topY;
    const bodyW = 40;

    // Bulbo de esporo (nose cone)
    const bulbColor = this.pieceColor(0, built, purple, gray);
    this.g.poly([
      cx, topY,
      cx + bodyW * 0.5, topY + podH * 0.15,
      cx, topY + podH * 0.22,
      cx - bodyW * 0.5, topY + podH * 0.15,
    ]).fill(Color.hex(bulbColor));
    const stroke: RGBA = { r: purple.r * 0.8, g: purple.g * 0.8, b: purple.b * 0.8, a: 1 };
    this.g.poly([
      cx, topY,
      cx + bodyW * 0.5, topY + podH * 0.15,
      cx, topY + podH * 0.22,
      cx - bodyW * 0.5, topY + podH * 0.15,
    ]).stroke({ color: Color.hex(stroke), width: 1.5 });

    // Body sections
    const bodyTopY = topY + podH * 0.22;
    const bodyBotY = topY + podH * 0.82;
    const sectionH = (bodyBotY - bodyTopY) / 3;
    const totalBodyH = bodyBotY - bodyTopY;
    const buildY = bodyTopY + totalBodyH * (1 - built / Math.max(1, recipe.length));
    for (let i = 0; i < 3; i++) {
      const sy = bodyTopY + i * sectionH;
      const segColor = this.pieceColor(i + 1, built, cyan, gray);
      this.g.rect(cx - bodyW * 0.5, sy, bodyW, sectionH).fill(Color.hex(segColor));
      this.g.rect(cx - bodyW * 0.5, sy, bodyW, sectionH).stroke({ color: Color.hex(Color.rgb(0.15, 0.20, 0.18)), width: 1 });
      // Plating stripes — horizontal panel lines on the built portion
      if (i + 1 <= built) {
        for (let s = 1; s < 4; s++) {
          const ly = sy + (sectionH * s) / 4;
          this.g.moveTo(cx - bodyW * 0.4, ly).lineTo(cx + bodyW * 0.4, ly)
            .stroke({ color: Color.hex(cyan), width: 0.8, alpha: 0.55 });
        }
      }
      // Porthole
      if (i + 1 < built) {
        this.g.circle(cx, sy + sectionH * 0.5, 3).fill(Color.hex(Color.rgb(0.85, 0.92, 0.78)));
      }
    }
    // Welding line — animated dashed seam between built and unbuilt
    if (built > 0 && built < recipe.length) {
      const dashPulse = 0.4 + 0.6 * Math.abs(Math.sin(this.elapsedMs * 0.006));
      this.g.moveTo(cx - bodyW * 0.6, buildY).lineTo(cx + bodyW * 0.6, buildY)
        .stroke({ color: Color.hex(amber), width: 1.2, alpha: 0.85 * dashPulse });
      this.g.circle(cx - bodyW * 0.3, buildY, 1.6).fill({ color: Color.hex(amber), alpha: dashPulse });
      this.g.circle(cx + bodyW * 0.3, buildY, 1.4).fill({ color: Color.hex(amber), alpha: 1 - dashPulse });
    }

    // Engine fins
    const engineColor = this.pieceColor(4, built, earth, gray);
    this.g.poly([
      cx - bodyW * 0.5, bodyBotY,
      cx - bodyW * 0.9, bottomY - 5,
      cx - bodyW * 0.5, bodyBotY + podH * 0.08,
    ]).fill(Color.hex(engineColor));
    this.g.poly([
      cx + bodyW * 0.5, bodyBotY,
      cx + bodyW * 0.9, bottomY - 5,
      cx + bodyW * 0.5, bodyBotY + podH * 0.08,
    ]).fill(Color.hex(engineColor));

    // Roots/flame
    if (built >= 5) {
      for (let j = 0; j < 5; j++) {
        const fx = cx + (j - 2) * 6;
        const fyBase = bottomY - 5;
        const pulse = Math.abs(Math.sin(this.elapsedMs * 0.003 + j)) * 0.5 + 0.5;
        const a: RGBA = { r: amber.r * pulse, g: amber.g * pulse, b: amber.b * pulse, a: 1 };
        this.g.moveTo(fx, fyBase).lineTo(fx + Math.sin(j) * 2, fyBase + 10)
          .stroke({ color: Color.hex(a), width: 2 });
      }
    }

    // Annotations
    for (let i = 0; i < recipe.length; i++) {
      const isBuilt = i < built;
      const isNext = i === built;
      const annotationY = topY + 20 + i * ((bottomY - topY - 40) / recipe.length);
      const isRight = i % 2 === 1;
      const annotationX = isRight ? innerW * 0.85 : innerW * 0.15;
      const podAttachX = isRight ? cx + bodyW * 0.5 : cx - bodyW * 0.5;
      const lineColor = isBuilt ? purple : (isNext ? cyan : gray);
      this.g.moveTo(podAttachX, annotationY).lineTo(annotationX, annotationY)
        .stroke({ color: Color.hex(lineColor), width: 1, alpha: 0.6 });
      this.g.circle(annotationX, annotationY, 3).fill(Color.hex(lineColor));
    }

    // Annotations text — Pixi Text doesn't support multi-position drawing in a single Graphics call,
    // so we manage labels separately.
    this.refreshAnnotationLabels();
  }

  private annotationLabels: Text[] = [];

  private refreshAnnotationLabels(): void {
    const built = HubState.rocket_pieces_built;
    const recipe = ROCKET_RECIPE;
    const innerW = this.panelW - 32;
    const cx = innerW * 0.5;
    const canvasH = 320;
    const topY = 30;
    const bottomY = canvasH - 30;
    const bodyW = 40;
    const purple = Color.rgb(0.72, 0.45, 0.85);
    const cyan = Color.rgb(0.30, 0.78, 0.72);
    const gray: RGBA = { r: 0.35, g: 0.32, b: 0.28, a: 1 };

    while (this.annotationLabels.length < recipe.length) {
      const t = new Text({ text: '', style: { fontFamily: '"Space Grotesk", system-ui, sans-serif', fontSize: 9 } });
      this.annotationLabels.push(t);
      this.canvasContainer.addChild(t);
    }
    while (this.annotationLabels.length > recipe.length) {
      const t = this.annotationLabels.pop();
      if (t) t.destroy();
    }

    for (let i = 0; i < recipe.length; i++) {
      const t = this.annotationLabels[i]!;
      const isBuilt = i < built;
      const isNext = i === built;
      const prefix = isBuilt ? '✓ ' : (isNext ? '▸ ' : '  ');
      t.text = prefix + recipe[i]!.name;
      const annotationY = topY + 20 + i * ((bottomY - topY - 40) / recipe.length);
      const isRight = i % 2 === 1;
      const annotationX = isRight ? innerW * 0.85 : innerW * 0.15;
      const lineColor = isBuilt ? purple : (isNext ? cyan : gray);
      t.style = {
        fontFamily: '"Space Grotesk", system-ui, sans-serif',
        fontSize: 9,
        fill: Color.hex(lineColor),
        wordWrap: true,
        wordWrapWidth: 70,
      };
      t.anchor.set(isRight ? 0 : 1, 0.5);
      t.x = isRight ? annotationX + 6 : annotationX - 6;
      t.y = annotationY;
      // Suppress unused var lint
      void cx; void bodyW;
    }
  }

  private pieceColor(pieceIndex: number, built: number, active: RGBA, inactive: RGBA): RGBA {
    if (pieceIndex < built) return active;
    if (pieceIndex === built) {
      const t = 0.4;
      return {
        r: active.r + (inactive.r - active.r) * t,
        g: active.g + (inactive.g - active.g) * t,
        b: active.b + (inactive.b - active.b) * t,
        a: 1,
      };
    }
    return inactive;
  }
}
