import { Container, Graphics, Text } from 'pixi.js';
import { Modal } from '../Modal';
import { PixiButton } from '../PixiButton';
import { Signal } from '../../core/Signal';
import { Color } from '../../core/Color';
import { FontFamily, TextColor } from '../../core/typography';
import { GameState } from '../../state/GameState';
import { GameConfig } from '../../state/GameConfig';
import type { PowerResource } from '../../run/power/PowerManager';

const formatTime = (sec: number): string => {
  const s = Math.floor(sec);
  return `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
};

// ── Game Over ────────────────────────────────────────────────────────────────
export class GameOverScreen extends Modal {
  readonly hubRequested = new Signal<[]>();
  readonly retryRequested = new Signal<[]>();

  constructor(runTime: number) {
    super(360, 280);
    this.drawPanelBg(Color.hex(Color.rgb(0.92, 0.15, 0.22)));

    const halfH = this.panelH / 2;
    const padding = 18;

    const title = new Text({
      text: 'game over',
      style: { fontFamily: FontFamily.display, fontSize: 32, fill: Color.hex(Color.rgb(0.92, 0.15, 0.22)), letterSpacing: 6 },
    });
    title.anchor.set(0.5, 0);
    title.x = 0;
    title.y = -halfH + padding;
    this.panel.addChild(title);

    const sub = new Text({
      text: `Sobreviveu ${formatTime(runTime)}`,
      style: { fontFamily: FontFamily.body, fontSize: 13, fill: TextColor.muted, letterSpacing: 1 },
    });
    sub.anchor.set(0.5, 0);
    sub.x = 0;
    sub.y = -halfH + padding + 48;
    this.panel.addChild(sub);

    const hubBtn = new PixiButton({
      label: 'Voltar à base',
      width: this.panelW - padding * 2 - 4,
      height: 32,
      onClick: () => { this.hubRequested.emit(); void this.requestClose(); },
    });
    hubBtn.x = -hubBtn.width / 2;
    hubBtn.y = halfH - padding - 70;
    this.panel.addChild(hubBtn);

    const retryBtn = new PixiButton({
      label: 'Tentar de novo',
      width: this.panelW - padding * 2 - 4,
      height: 32,
      fill: 0x1a1a1a,
      hoverFill: 0x2a2a2a,
      onClick: () => { this.retryRequested.emit(); void this.requestClose(); },
    });
    retryBtn.x = -retryBtn.width / 2;
    retryBtn.y = halfH - padding - 32;
    this.panel.addChild(retryBtn);

    void this.animateOpen();
  }
}

// ── Victory ──────────────────────────────────────────────────────────────────
export class VictoryScreen extends Modal {
  readonly hubRequested = new Signal<[]>();

  constructor(runTime: number, fragments: number) {
    super(380, 310);
    this.drawPanelBg(0xeaaa1a);

    const halfH = this.panelH / 2;
    const padding = 18;

    const title = new Text({
      text: 'vitória',
      style: { fontFamily: FontFamily.display, fontSize: 38, fill: 0xfada16, letterSpacing: 8 },
    });
    title.anchor.set(0.5, 0);
    title.x = 0;
    title.y = -halfH + padding;
    this.panel.addChild(title);

    const frag = new Text({
      text: `+ ${fragments} fragmentos de tecnologia`,
      style: { fontFamily: FontFamily.body, fontSize: 16, fill: Color.hex(Color.rgb(0.35, 0.88, 1.0)), fontWeight: '600' },
    });
    frag.anchor.set(0.5, 0);
    frag.x = 0;
    frag.y = -halfH + padding + 64;
    this.panel.addChild(frag);

    const time = new Text({
      text: `tempo: ${formatTime(runTime)}`,
      style: { fontFamily: FontFamily.mono, fontSize: 11, fill: TextColor.muted, letterSpacing: 1 },
    });
    time.anchor.set(0.5, 0);
    time.x = 0;
    time.y = -halfH + padding + 92;
    this.panel.addChild(time);

    const hubBtn = new PixiButton({
      label: 'Voltar à base',
      width: this.panelW - padding * 2 - 4,
      height: 36,
      onClick: () => { this.hubRequested.emit(); void this.requestClose(); },
    });
    hubBtn.x = -hubBtn.width / 2;
    hubBtn.y = halfH - padding - 36;
    this.panel.addChild(hubBtn);

    void this.animateOpen();
  }
}

// ── Rescue ────────────────────────────────────────────────────────────────────
export interface RescueOption {
  name: string;
  desc: string;
  factoryId: string;
}

export class RescueScreen extends Modal {
  readonly characterChosen = new Signal<[string]>();
  readonly skipped = new Signal<[]>();

  constructor(options: RescueOption[]) {
    super(340, 320);
    this.drawPanelBg(0xe6a319);

    const halfH = this.panelH / 2;
    const padding = 16;

    const title = new Text({
      text: 'sobrevivente encontrado',
      style: { fontFamily: FontFamily.display, fontSize: 16, fill: 0xf6c624, letterSpacing: 3 },
    });
    title.anchor.set(0.5, 0);
    title.x = 0;
    title.y = -halfH + padding;
    this.panel.addChild(title);

    const sub = new Text({
      text: 'escolha quem resgatar:',
      style: { fontFamily: FontFamily.body, fontSize: 11, fill: TextColor.muted, letterSpacing: 1 },
    });
    sub.anchor.set(0.5, 0);
    sub.x = 0;
    sub.y = -halfH + padding + 24;
    this.panel.addChild(sub);

    let y = -halfH + padding + 60;
    for (const opt of options) {
      const btn = new PixiButton({
        label: `${opt.name}\n${opt.desc}`,
        width: this.panelW - padding * 2 - 4,
        height: 60,
        fontSize: 11,
        onClick: () => { this.characterChosen.emit(opt.factoryId); void this.requestClose(); },
      });
      btn.x = -btn.width / 2;
      btn.y = y;
      this.panel.addChild(btn);
      y += 66;
    }

    const skipBtn = new PixiButton({
      label: 'Pular',
      width: this.panelW - padding * 2 - 4,
      height: 26,
      fill: 0x141414,
      hoverFill: 0x1f1f1f,
      onClick: () => { this.skipped.emit(); void this.requestClose(); },
    });
    skipBtn.x = -skipBtn.width / 2;
    skipBtn.y = halfH - padding - 26;
    this.panel.addChild(skipBtn);

    GameState.pauseForEvent();
    void this.animateOpen();
  }

  override async requestClose(): Promise<void> {
    GameState.resumeFromEvent();
    await super.requestClose();
  }
}

// ── Power offer ──────────────────────────────────────────────────────────────
export class PowerOfferScreen extends Modal {
  readonly powerChosen = new Signal<[PowerResource]>();

  constructor(options: PowerResource[]) {
    super(380, 360);
    this.drawPanelBg(0x8f3aef);

    const halfH = this.panelH / 2;
    const padding = 18;

    const title = new Text({
      text: 'escolha um poder',
      style: { fontFamily: FontFamily.display, fontSize: 20, fill: 0xc280ff, letterSpacing: 5 },
    });
    title.anchor.set(0.5, 0);
    title.x = 0;
    title.y = -halfH + padding;
    this.panel.addChild(title);

    const sub = new Text({
      text: 'uma escolha define a sua run',
      style: { fontFamily: FontFamily.body, fontSize: 11, fill: Color.hex(Color.rgb(0.48, 0.38, 0.62)), letterSpacing: 1 },
    });
    sub.anchor.set(0.5, 0);
    sub.x = 0;
    sub.y = -halfH + padding + 30;
    this.panel.addChild(sub);

    let y = -halfH + padding + 60;
    for (const p of options) {
      const card = this.makePowerCard(p);
      card.x = -(this.panelW - padding * 2) / 2;
      card.y = y;
      card.eventMode = 'static';
      card.cursor = 'pointer';
      card.on('pointertap', () => { this.powerChosen.emit(p); void this.requestClose(); });
      this.panel.addChild(card);
      y += 76;
    }

    GameState.pauseForEvent();
    void this.animateOpen();
    void GameConfig;
  }

  override async requestClose(): Promise<void> {
    GameState.resumeFromEvent();
    await super.requestClose();
  }

  private makePowerCard(p: PowerResource): Container {
    const c = new Container();
    const cardW = this.panelW - 36;
    const cardH = 66;
    const bg = new Graphics()
      .roundRect(0, 0, cardW, cardH, 5)
      .fill({ color: 0x1a1029, alpha: 0.92 })
      .stroke({ color: p.icon_color, width: 1.5 });
    c.addChild(bg);

    const name = new Text({
      text: p.power_name,
      style: { fontFamily: FontFamily.body, fontSize: 14, fill: 0xeacfff, fontWeight: '700' },
    });
    name.x = 14;
    name.y = 10;
    c.addChild(name);

    const desc = new Text({
      text: p.description,
      style: { fontFamily: FontFamily.body, fontSize: 10, fill: TextColor.muted, wordWrap: true, wordWrapWidth: cardW - 28 },
    });
    desc.x = 14;
    desc.y = 30;
    c.addChild(desc);

    const swatch = new Graphics()
      .circle(cardW - 16, 16, 5)
      .fill({ color: p.icon_color })
      .circle(cardW - 16, 16, 9)
      .stroke({ color: p.icon_color, width: 1, alpha: 0.5 });
    c.addChild(swatch);
    return c;
  }
}
