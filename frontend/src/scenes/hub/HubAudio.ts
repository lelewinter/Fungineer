import { audioManager } from '../../core/AudioManager';

/** Hub audio orchestrator. Mirrors src/scenes/hub/HubAudio.gd.
 *  The original Godot version had placeholders for SFX paths that don't exist yet —
 *  we preserve that behaviour but route through the real audioManager. */
export class HubAudio {
  private musicStarted = false;

  start(): void {
    this.playAmbientMusic();
  }

  stop(): void {
    audioManager.stopMusic(400);
    this.musicStarted = false;
  }

  private playAmbientMusic(): void {
    if (this.musicStarted) return;
    this.musicStarted = true;
    // Original code commented out the music load. We use menu.wav as a stand-in
    // since a dedicated hub-theme.ogg never landed.
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
