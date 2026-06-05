// ============================================================================
// AudioSettingsModal — a janela de configurações de áudio.
//
// O que faz: mostra dois controles deslizantes (sliders) para volume de música
// e de efeitos sonoros, mais um botão de silenciar/ativar tudo. As mudanças
// valem na hora e ficam salvas (via AudioSettings), então o jogador não perde
// suas preferências.
//
// Onde encaixa: aberta pelo botão de áudio do hub (a base do jogo).
// ============================================================================
import { Container, FederatedPointerEvent, Graphics, Rectangle, Text } from 'pixi.js';
import { Modal } from './Modal';
import { PixiButton } from './PixiButton';
import { FontFamily, TextColor } from '../core/typography';
import { audioManager } from '../core/AudioManager';
import { audioSettings } from '../state/AudioSettings';

const ACCENT = TextColor.accent; // roxo esporo — cor de destaque desta janela

/** Audio settings: music + sfx volume sliders and a master mute toggle.
 *  Changes apply live and persist via AudioSettings. */
export class AudioSettingsModal extends Modal {
  private musicSlider!: Slider;
  private sfxSlider!: Slider;
  private muteBtn!: PixiButton;
  // Função para "desconectar" do sinal de mudança quando a janela fechar,
  // evitando vazamento de memória e reações a uma janela já destruída.
  private changedDispose: (() => void) | null = null;

  constructor() {
    super(320, 236);
    this.drawPanelBg(ACCENT);
    this.build();
    // Sempre que as preferências de áudio mudarem (até por fora desta janela),
    // atualizamos os controles para refletir o estado atual.
    this.changedDispose = audioSettings.changed.connect(() => this.sync());
    this.sync();
    void this.animateOpen();
  }

  /** Monta o conteúdo da janela: título, as duas linhas de slider, e os botões
   *  de silenciar e fechar. */
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

  /** Cria uma linha "rótulo + slider" (ex.: "MÚSICA" seguido da barra de
   *  volume). Devolve o Slider criado para a janela poder atualizá-lo depois. */
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

  /** Sincroniza os controles com as preferências atuais. Quando tudo está
   *  silenciado, os sliders ficam desabilitados (esmaecidos) e o botão troca
   *  para "ATIVAR SOM". */
  private sync(): void {
    const muted = audioSettings.muted;
    this.musicSlider.set(audioSettings.music);
    this.sfxSlider.set(audioSettings.sfx);
    this.musicSlider.setEnabled(!muted);
    this.sfxSlider.setEnabled(!muted);
    this.muteBtn.setLabel(muted ? 'ATIVAR SOM' : 'SILENCIAR');
  }

  /** Ao fechar, desconecta do sinal de mudança. */
  override destroy(options?: Parameters<Container['destroy']>[0]): void {
    this.changedDispose?.();
    this.changedDispose = null;
    super.destroy(options);
  }
}

/** Slider — uma barra de volume horizontal simples.
 *  É composta por: a trilha (track) de fundo, a parte preenchida (fill) que
 *  mostra o nível atual, uma bolinha arrastável (knob) e um texto com a
 *  porcentagem. Arrastar a bolinha ou clicar na trilha muda o valor. */
class Slider extends Container {
  private trackG = new Graphics();   // trilha de fundo
  private fillG = new Graphics();    // parte cheia (à esquerda da bolinha)
  private knob = new Graphics();     // bolinha arrastável
  private pct = new Text();          // texto "75%"
  private value: number;             // valor atual, de 0 a 1
  private dragging = false;          // o jogador está arrastando a bolinha?
  private enabled = true;            // o slider responde a interação?

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
    // Hit area um pouco maior que a trilha, para ser fácil de acertar no toque.
    this.hitArea = new Rectangle(-10, -14, tw + 20, 28);

    // Clicar começa a arrastar e já move para o ponto clicado.
    this.on('pointerdown', (e: FederatedPointerEvent) => {
      if (!this.enabled) return;
      this.dragging = true;
      this.setFromEvent(e);
    });
    // `globalpointermove` segue o ponteiro mesmo se ele sair de cima do slider,
    // para o arraste não "engasgar" quando o jogador move rápido.
    this.on('globalpointermove', (e: FederatedPointerEvent) => {
      if (this.dragging) this.setFromEvent(e);
    });
    this.on('pointerup', () => { this.dragging = false; });
    this.on('pointerupoutside', () => { this.dragging = false; });

    this.draw();
  }

  /** Define o valor SEM disparar onChange. Usado quando a janela quer apenas
   *  refletir o estado salvo, sem reagir como se o jogador tivesse mexido. */
  set(v: number): void {
    this.value = Math.max(0, Math.min(1, v));
    this.draw();
  }

  /** Liga/desliga a interação. Desligado fica esmaecido (alpha 0.4). */
  setEnabled(on: boolean): void {
    this.enabled = on;
    this.alpha = on ? 1 : 0.4;
    this.draw();
  }

  /** Calcula o novo valor a partir da posição do clique/arraste. Converte a
   *  coordenada X local em uma fração de 0 a 1 e avisa via onChange. */
  private setFromEvent(e: FederatedPointerEvent): void {
    const lx = e.getLocalPosition(this).x;
    const v = Math.max(0, Math.min(1, lx / this.tw));
    this.value = v;
    this.draw();
    this.onChange(v);
  }

  /** Redesenha trilha, preenchimento, bolinha e o texto de porcentagem. */
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
