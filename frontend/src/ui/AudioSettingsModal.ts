import { Container, FederatedPointerEvent, Graphics, Rectangle, Text } from 'pixi.js';
import { Modal } from './Modal';
import { PixiButton } from './PixiButton';
import { FontFamily, TextColor } from '../core/typography';
import { audioManager } from '../core/AudioManager';
import { audioSettings } from '../state/AudioSettings';

const ACCENT = TextColor.accent; // spore purple

/** Audio settings: music + sfx volume sliders and a master mute toggle.
 *  Changes apply live and persist via AudioSettings. */
export class AudioSettingsModal extends Modal {
  private musicSlider!: Slider;
  private sfxSlider!: Slider;
  private muteBtn!: PixiButton;
  private changedDispose: (() => void) | null = null;

  constructor() {
    super(320, 236);
    this.drawPanelBg(ACCENT);
    this.build();
    this.changedDispose = audioSettings.changed.connect(() => this.sync());
    this.sync();
    void this.animateOpen();
  }

  private build(): void {
    const halfW = this.panelW / 2;
    const halfH = this.panelH / 2;
    const left = -halfW + 18;

    const title = new Text({
      text: 'ÁUDIO',
      style: { fontFamily: FontFamily.display, fontSize: 20, fill: ACCENT, letterSpacing: 6 },
    });
    title.anchor.set(0.5, 0);
    title.y = -halfH + 16;
    this.panel.addChild(title);

    this.musicSlider = this.buildRow('MÚSICA', -46, audioSettings.music, (v) => audioSettings.setMusic(v));
    this.sfxSlider = this.buildRow('EFEITOS', -10, audioSettings.sfx, (v) => {
      audioSettings.setSfx(v);
      // Audible reference so the player hears the level they're dialing in.
      audioManager.playSfx('res://assets/audio/sfx/ui/Click_03.wav', 0.6);
    });

    this.muteBtn = new PixiButton({
      label: 'SILENCIAR',
      width: this.panelW - 36,
      height: 30,
      fill: 0x3a2030,
      hoverFill: 0x4d2840,
      onClick: () => audioSettings.toggleMuted(),
    });
    this.muteBtn.x = left;
    this.muteBtn.y = 24;
    this.panel.addChild(this.muteBtn);

    const closeBtn = new PixiButton({
      label: 'FECHAR',
      width: this.panelW - 36,
      height: 28,
      onClick: () => { void this.requestClose(); },
    });
    closeBtn.x = left;
    closeBtn.y = halfH - 18 - 28;
    this.panel.addChild(closeBtn);
  }

  private buildRow(label: string, y: number, initial: number, onChange: (v: number) => void): Slider {
    const halfW = this.panelW / 2;
    const txt = new Text({
      text: label,
      style: { fontFamily: FontFamily.mono, fontSize: 11, fill: TextColor.muted, letterSpacing: 1 },
    });
    txt.anchor.set(0, 0.5);
    txt.x = -halfW + 18;
    txt.y = y;
    this.panel.addChild(txt);

    const slider = new Slider(150, ACCENT, initial, onChange);
    slider.x = -halfW + 84;
    slider.y = y;
    this.panel.addChild(slider);
    return slider;
  }

  /** Reflect the current prefs (also called when mute toggles). */
  private sync(): void {
    const muted = audioSettings.muted;
    this.musicSlider.set(audioSettings.music);
    this.sfxSlider.set(audioSettings.sfx);
    this.musicSlider.setEnabled(!muted);
    this.sfxSlider.setEnabled(!muted);
    this.muteBtn.setLabel(muted ? 'ATIVAR SOM' : 'SILENCIAR');
  }

  override destroy(options?: Parameters<Container['destroy']>[0]): void {
    this.changedDispose?.();
    this.changedDispose = null;
    super.destroy(options);
  }
}

/** Minimal horizontal slider (track + fill + draggable knob + % readout). */
class Slider extends Container {
  private trackG = new Graphics();
  private fillG = new Graphics();
  private knob = new Graphics();
  private pct = new Text();
  private value: number;
  private dragging = false;
  private enabled = true;

  constructor(
    private readonly tw: number,
    private readonly accent: number,
    initial: number,
    private readonly onChange: (v: number) => void,
  ) {
    super();
    this.value = Math.max(0, Math.min(1, initial));

    this.pct = new Text({
      text: '',
      style: { fontFamily: FontFamily.mono, fontSize: 10, fill: TextColor.muted },
    });
    this.pct.anchor.set(0, 0.5);
    this.pct.x = tw + 12;

    this.addChild(this.trackG, this.fillG, this.knob, this.pct);

    this.eventMode = 'static';
    this.cursor = 'pointer';
    this.hitArea = new Rectangle(-10, -14, tw + 20, 28);

    this.on('pointerdown', (e: FederatedPointerEvent) => {
      if (!this.enabled) return;
      this.dragging = true;
      this.setFromEvent(e);
    });
    this.on('globalpointermove', (e: FederatedPointerEvent) => {
      if (this.dragging) this.setFromEvent(e);
    });
    this.on('pointerup', () => { this.dragging = false; });
    this.on('pointerupoutside', () => { this.dragging = false; });

    this.draw();
  }

  /** Set value without firing onChange (external sync). */
  set(v: number): void {
    this.value = Math.max(0, Math.min(1, v));
    this.draw();
  }

  setEnabled(on: boolean): void {
    this.enabled = on;
    this.alpha = on ? 1 : 0.4;
    this.draw();
  }

  private setFromEvent(e: FederatedPointerEvent): void {
    const lx = e.getLocalPosition(this).x;
    const v = Math.max(0, Math.min(1, lx / this.tw));
    this.value = v;
    this.draw();
    this.onChange(v);
  }

  private draw(): void {
    const knobX = this.value * this.tw;

    this.trackG.clear();
    this.trackG.roundRect(0, -3, this.tw, 6, 3).fill({ color: 0x223026, alpha: 0.95 });

    this.fillG.clear();
    this.fillG.roundRect(0, -3, knobX, 6, 3).fill({ color: this.accent, alpha: this.enabled ? 0.9 : 0.5 });

    this.knob.clear();
    this.knob.circle(knobX, 0, 8).fill({ color: 0xeef5e6 });
    this.knob.circle(knobX, 0, 8).stroke({ color: this.accent, width: 1.5, alpha: 0.9 });

    this.pct.text = `${Math.round(this.value * 100)}%`;
  }
}
