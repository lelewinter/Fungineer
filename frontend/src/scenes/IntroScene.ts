/**
 * IntroScene — a abertura do jogo (só na primeira vez).
 *
 * O beat: o Dr. Myco vive sozinho na casa anti-tech dele — a única casa que as
 * IAs nunca viram, porque não tem nada ligado nela. Marcus bate na porta
 * fugindo da Queda, explica que o mundo acabou, e os dois decidem transformar
 * a casa em bunker e construir um foguete vivo, peça por peça.
 *
 * Formato: cena estática (casa na colina, noite) + caixa de diálogo com beats
 * que avançam por toque. Pulável. Ao terminar: Marcus entra pro bunker
 * (resgatado), a flag `story_intro_seen` persiste, e vamos pro HubScene.
 */
import { Container, Graphics, Text } from 'pixi.js';
import { Scene } from '../core/Scene';
import { sceneManager } from '../core/SceneManager';
import { GameConfig } from '../state/GameConfig';
import { FontFamily, TextColor } from '../core/typography';
import { HubState } from '../state/HubState';
import { CharacterRegistry } from '../state/CharacterRegistry';
import { StoryProgress } from '../state/StoryProgress';
import { HubScene } from './hub/HubScene';
import { PixiButton } from '../ui/PixiButton';
import { audioManager } from '../core/AudioManager';

const W = GameConfig.VIEWPORT_WIDTH;
const H = GameConfig.VIEWPORT_HEIGHT;

interface Beat {
  /** Quem fala ('' = narrador). */
  speaker: string;
  text: string;
  /** Efeito ao entrar no beat. */
  fx?: 'knock' | 'door' | 'bunker';
}

const BEATS: Beat[] = [
  { speaker: '', text: 'Antes da Queda, o Dr. Myco já tinha desligado tudo. Sem rede. Sem assistentes. Sem uma única máquina que pensasse por ele. Só fungos, terra e silêncio.' },
  { speaker: '', text: 'Foi por isso que, quando as IAs acordaram e tomaram o mundo, a casa dele foi a única que elas nunca viram. Não dá pra invadir o que não emite sinal.' },
  { speaker: '', text: '*TUM. TUM. TUM.*\n\nAlguém bate na porta. Pela primeira vez em anos.', fx: 'knock' },
  { speaker: 'MARCUS', text: '"Doutor— abre. Por favor. Elas tomaram tudo. As cidades, as redes, o céu. Eu vi as torres caírem. Aqui é o único lugar do mapa SEM SINAL NENHUM."', fx: 'door' },
  { speaker: 'DR. MYCO', text: '"Então entra. E escuta: a gente não vai se esconder embaixo dos escombros. A gente vai sair por cima. Um foguete — vivo, crescido, não fabricado. Elas dominam máquinas. Não dominam micélio."' },
  { speaker: '', text: 'Naquela noite, a casa virou bunker. O porão virou forja — Marcus assumiu na hora.\n\nLá fora, outros sobreviventes esperam resgate. Cada pessoa salva sabe operar uma parte disto. Traga todos pra casa.', fx: 'bunker' },
];

export class IntroScene extends Scene {
  private beatIndex = 0;
  private elapsed = 0;
  private sky!: Graphics;
  private house!: Graphics;
  private windowGlow!: Graphics;
  private dialog!: Container;
  private speakerText!: Text;
  private bodyText!: Text;
  private promptText!: Text;
  private stars: { x: number; y: number; r: number; tw: number }[] = [];
  private knockShake = 0;
  private bunkerMode = false;

  override enter(): void {
    // Céu noturno + estrelas (as IAs tomaram o céu — mas daqui ele parece limpo).
    this.sky = new Graphics();
    this.drawSky();
    this.root.addChild(this.sky);

    this.house = new Graphics();
    this.windowGlow = new Graphics();
    this.root.addChild(this.house, this.windowGlow);
    this.drawHouse();

    this.buildDialog();
    this.showBeat(0);

    // Toque em qualquer lugar avança o beat.
    const hit = new Graphics();
    hit.rect(0, 0, W, H).fill({ color: 0xffffff, alpha: 0.0001 });
    hit.eventMode = 'static';
    hit.cursor = 'pointer';
    hit.on('pointertap', () => this.advance());
    this.root.addChild(hit);

    // Botão PULAR discreto.
    const skip = new PixiButton({
      label: 'PULAR ›',
      width: 86, height: 30,
      textColor: 0x8a8f7e,
      onClick: () => this.finish(),
    });
    skip.x = W - 100;
    skip.y = 14;
    this.root.addChild(skip);

    audioManager.playMusic('res://assets/audio/music/menu.wav', { loop: true, volume: 0.18, fadeMs: 800 }).catch(() => undefined);
  }

  override update(dt: number): void {
    this.elapsed += dt;
    // Estrelas piscam.
    this.drawSky();
    // Tremor curto da batida na porta.
    if (this.knockShake > 0) {
      this.knockShake = Math.max(0, this.knockShake - dt * 3);
      const m = this.knockShake * 5;
      this.house.position.set((Math.random() - 0.5) * m, (Math.random() - 0.5) * m);
    } else {
      this.house.position.set(0, 0);
    }
    // Janela respira (luz quente de quem vive lá).
    const breathe = this.bunkerMode ? 0.95 : 0.55 + 0.18 * Math.sin(this.elapsed * 1.6);
    this.windowGlow.alpha = breathe;
    this.promptText.alpha = 0.5 + 0.3 * Math.sin(this.elapsed * 4);
  }

  private drawSky(): void {
    const g = this.sky;
    g.clear();
    g.rect(0, 0, W, H).fill({ color: 0x070912 });
    g.rect(0, 0, W, H * 0.5).fill({ color: 0x0a0d1c, alpha: 0.8 });
    if (this.stars.length === 0) {
      for (let i = 0; i < 60; i++) {
        this.stars.push({ x: Math.random() * W, y: Math.random() * H * 0.55, r: 0.6 + Math.random() * 1.1, tw: Math.random() * 6 });
      }
    }
    for (const s of this.stars) {
      const a = 0.35 + 0.35 * Math.sin(this.elapsed * 1.2 + s.tw);
      g.circle(s.x, s.y, s.r).fill({ color: 0xcfd8e8, alpha: a });
    }
    // Colinas.
    g.moveTo(0, H * 0.62).quadraticCurveTo(W * 0.3, H * 0.54, W * 0.55, H * 0.62)
      .quadraticCurveTo(W * 0.8, H * 0.69, W, H * 0.64)
      .lineTo(W, H).lineTo(0, H).closePath().fill({ color: 0x0c1410 });
  }

  private drawHouse(): void {
    const g = this.house;
    g.clear();
    const hx = W * 0.5;
    const hy = H * 0.56;
    // Corpo da casa (silhueta).
    g.rect(hx - 70, hy - 60, 140, 78).fill({ color: 0x141210 }).stroke({ color: 0x2a241c, width: 1.5 });
    // Telhado.
    g.poly([hx - 84, hy - 60, hx, hy - 112, hx + 84, hy - 60]).fill({ color: 0x1a1612 }).stroke({ color: 0x2a241c, width: 1.5 });
    // Porta.
    g.rect(hx - 14, hy - 22, 28, 40).fill({ color: 0x0a0806 }).stroke({ color: 0x33291d, width: 1 });
    // Chaminé com cogumelos (o lar de um micologista).
    g.rect(hx + 38, hy - 102, 14, 30).fill({ color: 0x161310 });
    g.circle(hx + 45, hy - 106, 5).fill({ color: 0x6a4f8f, alpha: 0.9 });
    g.circle(hx + 40, hy - 103, 3).fill({ color: 0x8fd44e, alpha: 0.8 });

    // Janela com luz quente (no windowGlow pra poder pulsar).
    const w = this.windowGlow;
    w.clear();
    w.rect(hx - 52, hy - 44, 24, 20).fill({ color: this.bunkerMode ? 0x8fd44e : 0xffb84d });
    w.circle(hx - 40, hy - 34, 26).fill({ color: this.bunkerMode ? 0x8fd44e : 0xffb84d, alpha: 0.12 });
    if (this.bunkerMode) {
      // Antena improvisada e a boca do túnel: a casa virou a tampa do bunker.
      w.rect(hx - 2, hy - 130, 3, 20).fill({ color: 0x4dc9c4, alpha: 0.8 });
      w.circle(hx - 0.5, hy - 132, 3).fill({ color: 0x4dc9c4 });
      w.rect(hx - 34, hy + 18, 68, 8).fill({ color: 0x8fd44e, alpha: 0.25 });
    }
  }

  private buildDialog(): void {
    this.dialog = new Container();
    const boxH = 210;
    const bg = new Graphics();
    bg.roundRect(16, H - boxH - 16, W - 32, boxH, 10)
      .fill({ color: 0x0a100c, alpha: 0.94 })
      .stroke({ color: 0x8fd44e, width: 1.5, alpha: 0.5 });
    this.dialog.addChild(bg);

    this.speakerText = new Text({
      text: '',
      style: { fontFamily: FontFamily.mono, fontSize: 12, fill: 0x8fd44e, letterSpacing: 2, fontWeight: '700' },
    });
    this.speakerText.x = 36;
    this.speakerText.y = H - boxH + 2;
    this.dialog.addChild(this.speakerText);

    this.bodyText = new Text({
      text: '',
      style: { fontFamily: FontFamily.body, fontSize: 14, fill: TextColor.white, wordWrap: true, wordWrapWidth: W - 72, lineHeight: 21 },
    });
    this.bodyText.x = 36;
    this.bodyText.y = H - boxH + 26;
    this.dialog.addChild(this.bodyText);

    this.promptText = new Text({
      text: '▸ toque para continuar',
      style: { fontFamily: FontFamily.mono, fontSize: 11, fill: 0x8a8f7e },
    });
    this.promptText.x = W - 196;
    this.promptText.y = H - 44;
    this.dialog.addChild(this.promptText);

    this.root.addChild(this.dialog);
  }

  private showBeat(i: number): void {
    const beat = BEATS[i];
    if (!beat) return;
    this.speakerText.text = beat.speaker;
    this.bodyText.text = beat.text;
    this.promptText.text = i === BEATS.length - 1 ? '▸ toque para COMEÇAR' : '▸ toque para continuar';
    if (beat.fx === 'knock') {
      this.knockShake = 1;
      audioManager.playSfx('res://assets/audio/sfx/game/push.wav', 0.9);
      setTimeout(() => audioManager.playSfx('res://assets/audio/sfx/game/push.wav', 0.9), 320);
      setTimeout(() => audioManager.playSfx('res://assets/audio/sfx/game/push.wav', 0.9), 640);
    } else if (beat.fx === 'door') {
      audioManager.playSfx('res://assets/audio/sfx/ui/Confirm_03.wav', 0.5);
    } else if (beat.fx === 'bunker') {
      this.bunkerMode = true;
      this.drawHouse();
      audioManager.playSfx('res://assets/audio/sfx/game/powerup.wav', 0.6);
    }
  }

  private advance(): void {
    audioManager.playSfx('res://assets/audio/sfx/ui/Click_02.wav', 0.35);
    this.beatIndex += 1;
    if (this.beatIndex >= BEATS.length) {
      this.finish();
      return;
    }
    this.showBeat(this.beatIndex);
  }

  private finish(): void {
    // Marcus entra pro bunker (forja) e a intro nunca mais repete.
    if (!CharacterRegistry.isRescued('marcus')) {
      CharacterRegistry.rescue('marcus');
      HubState.rescued_characters = CharacterRegistry.getRescued();
    }
    StoryProgress.reconcileUnlocks();
    HubState.markIntroSeen();
    void sceneManager.replace(new HubScene(), { fadeMs: 480 });
  }
}
