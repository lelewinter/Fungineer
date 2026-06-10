// ============================================================================
// ConfirmRaidDialog — a janela "tem certeza?" antes de começar uma raid.
//
// O que faz: mostra o nome e a descrição da zona e dois botões: confirmar ou
// cancelar. Quem abriu a janela ouve os sinais `confirmed` / `cancelled` para
// saber a decisão do jogador.
//
// Onde encaixa: aparece quando o jogador pede para iniciar uma incursão (raid).
// (Equivale ao antigo ConfirmRaidDialog.gd da versão em Godot.)
// ============================================================================
import { Text } from 'pixi.js';
import { Modal } from './Modal';
import { PixiButton } from './PixiButton';
import { Color } from '../core/Color';
import { Signal } from '../core/Signal';

/** Modal confirmation before starting a raid. Mirrors ConfirmRaidDialog.gd. */
export class ConfirmRaidDialog extends Modal {
  readonly confirmed = new Signal<[]>();   // jogador clicou em confirmar
  readonly cancelled = new Signal<[]>();   // jogador clicou em cancelar

  constructor(zoneName: string, zoneDescription: string) {
    super(320, 220);
    // Cor de destaque âmbar/laranja, combinando com o clima de "perigo/ação".
    this.drawPanelBg(Color.hex(Color.rgb(0.85, 0.55, 0.30)));
    this.buildContent(zoneName, zoneDescription);
    void this.animateOpen();
  }

  /** Monta o conteúdo: título (nome da zona), descrição e os dois botões. */
  private buildContent(zoneName: string, zoneDescription: string): void {
    const halfH = this.panelH / 2;
    const padding = 16;

    const title = new Text({
      text: zoneName,
      style: {
        fontFamily: '"Major Mono Display", "Courier New", monospace',
        fontSize: 22,
        fill: Color.hex(Color.rgb(1.0, 0.9, 0.5)),
        letterSpacing: 4,
      },
    });
    title.anchor.set(0.5, 0);
    title.x = 0;
    title.y = -halfH + padding;
    this.panel.addChild(title);

    const desc = new Text({
      text: zoneDescription,
      style: {
        fontFamily: '"Rubik", system-ui, sans-serif',
        fontSize: 11,
        fill: Color.hex(Color.rgb(0.85, 0.85, 0.85)),
        wordWrap: true,
        wordWrapWidth: this.panelW - padding * 2,
        align: 'center',
      },
    });
    desc.anchor.set(0.5, 0);
    desc.x = 0;
    desc.y = -halfH + padding + 32;
    this.panel.addChild(desc);

    // Botão principal (confirmar): avisa via sinal e fecha a janela.
    const confirmBtn = new PixiButton({
      label: '► CONFIRMAR RAID',
      width: 220,
      height: 32,
      onClick: () => {
        this.confirmed.emit();
        void this.requestClose();
      },
    });
    confirmBtn.x = -110;
    confirmBtn.y = halfH - padding - 70;
    this.panel.addChild(confirmBtn);

    // Botão secundário (cancelar): cor neutra/escura para não competir com o
    // botão principal.
    const cancelBtn = new PixiButton({
      label: 'Cancelar',
      width: 220,
      height: 28,
      fill: 0x1a1a1a,
      hoverFill: 0x252525,
      onClick: () => {
        this.cancelled.emit();
        void this.requestClose();
      },
    });
    cancelBtn.x = -110;
    cancelBtn.y = halfH - padding - 32;
    this.panel.addChild(cancelBtn);
  }
}
