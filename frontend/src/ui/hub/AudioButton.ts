// ============================================================================
// AudioButton — o ícone redondo de alto-falante no hub.
//
// O que faz: desenha um botãozinho redondo com o desenho de uma caixa de som.
// Se o som estiver ligado, mostra ondas sonoras; se estiver mudo, mostra um
// risco vermelho por cima. Ao ser clicado, emite o sinal `clicked` — a cena do
// hub usa isso para abrir a janela de configurações de áudio.
//
// Onde encaixa: fica num canto do hub (a base do jogo).
// ============================================================================
import { Container, FederatedPointerEvent, Graphics, Rectangle } from 'pixi.js';
import { Signal } from '../../core/Signal';
import { TextColor } from '../../core/typography';
import { audioSettings } from '../../state/AudioSettings';

const R = 16; // raio do disco (em pixels)

/** Small round speaker button for the hub. Reflects the mute state and emits
 *  `clicked` (the HubScene opens the audio settings modal on tap). */
export class AudioButton extends Container {
  readonly clicked = new Signal<[]>();

  private g = new Graphics();
  private hovering = false;
  // Função para desconectar do sinal de mudança de áudio ao destruir o botão.
  private changedDispose: (() => void) | null;

  constructor() {
    super();
    this.addChild(this.g);

    this.eventMode = 'static';
    this.cursor = 'pointer';
    this.hitArea = new Rectangle(-R - 2, -R - 2, (R + 2) * 2, (R + 2) * 2);

    this.on('pointertap', (e: FederatedPointerEvent) => { e.stopPropagation(); this.clicked.emit(); });
    this.on('pointerover', () => { this.hovering = true; this.draw(); });
    this.on('pointerout', () => { this.hovering = false; this.draw(); });

    // Redesenha sempre que o estado de áudio mudar (ex.: ficou mudo em outro
    // lugar), para o ícone sempre mostrar a situação atual.
    this.changedDispose = audioSettings.changed.connect(() => this.draw());
    this.draw();
  }

  /** Desenha o ícone conforme o estado: ondas sonoras quando há som, ou um
   *  risco vermelho quando está mudo. */
  private draw(): void {
    const muted = audioSettings.muted;
    const accent = TextColor.accent;
    const g = this.g;
    g.clear();

    // Disc background.
    g.circle(0, 0, R).fill({ color: 0x14110a, alpha: 0.92 });
    g.circle(0, 0, R).stroke({ color: accent, width: 1.5, alpha: this.hovering ? 1 : 0.55 });

    const iconColor = muted ? TextColor.faint : accent;

    // Speaker body + cone.
    g.rect(-7, -3.5, 4, 7).fill({ color: iconColor });
    g.moveTo(-3, -3.5).lineTo(2, -7).lineTo(2, 7).lineTo(-3, 3.5).lineTo(-3, -3.5).fill({ color: iconColor });

    if (muted) {
      // Red slash for the muted state.
      g.moveTo(-6, -7).lineTo(8, 7).stroke({ color: TextColor.red, width: 2 });
    } else {
      // Sound waves.
      g.arc(2, 0, 6, -Math.PI / 3, Math.PI / 3).stroke({ color: iconColor, width: 1.5 });
      g.arc(2, 0, 9.5, -Math.PI / 3, Math.PI / 3).stroke({ color: iconColor, width: 1.5, alpha: 0.7 });
    }
  }

  override destroy(options?: Parameters<Container['destroy']>[0]): void {
    this.changedDispose?.();
    this.changedDispose = null;
    super.destroy(options);
  }
}
