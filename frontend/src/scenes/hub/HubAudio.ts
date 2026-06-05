import { audioManager } from '../../core/AudioManager';

/**
 * HubAudio — o "DJ" do hub.
 *
 * Centraliza todo o som do hub: a musica ambiente de fundo e os efeitos (SFX)
 * de clique, abrir/fechar painel, selecionar personagem e progredir o foguete.
 * O HubScene chama estes metodos nos momentos certos, em vez de espalhar
 * chamadas de audio por todo lado.
 *
 * Tudo passa pelo audioManager, que e quem realmente toca os arquivos.
 */
export class HubAudio {
  // Evita iniciar a musica duas vezes.
  private musicStarted = false;

  /** Inicia a trilha ambiente do hub. */
  start(): void {
    this.playAmbientMusic();
  }

  /** Para a musica com um fade-out de 400ms. */
  stop(): void {
    audioManager.stopMusic(400);
    this.musicStarted = false;
  }

  private playAmbientMusic(): void {
    if (this.musicStarted) return;
    this.musicStarted = true;
    // Usamos menu.wav como substituto porque uma trilha dedicada do hub
    // (hub-theme.ogg) nunca chegou a ser feita.
    audioManager.playMusic('res://assets/audio/music/menu.wav', {
      loop: true,
      volume: 0.25,
      fadeMs: 800,
    }).catch(() => undefined);
  }

  playClickSfx(): void {
    audioManager.playSfx('res://assets/audio/sfx/ui/Click_01.wav', 0.5);
  }

  playOpenPanelSfx(): void {
    audioManager.playSfx('res://assets/audio/sfx/ui/Confirm_03.wav', 0.5);
  }

  playClosePanelSfx(): void {
    audioManager.playSfx('res://assets/audio/sfx/ui/Click_02.wav', 0.4);
  }

  playNpcSelectSfx(): void {
    audioManager.playSfx('res://assets/audio/sfx/ui/Confirm_05.wav', 0.4);
  }

  playRocketProgressSfx(): void {
    audioManager.playSfx('res://assets/audio/sfx/ui/Complete_01.wav', 0.6);
  }
}
