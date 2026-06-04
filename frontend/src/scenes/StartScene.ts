import { Graphics, Text, TilingSprite, type Texture } from 'pixi.js';
import { Scene } from '../core/Scene';
import { sceneManager } from '../core/SceneManager';
import { audioManager } from '../core/AudioManager';
import { assets } from '../core/AssetLoader';
import { Color } from '../core/Color';
import { GameConfig } from '../state/GameConfig';
import { FontFamily, TextColor } from '../core/typography';
import { PixiButton } from '../ui/PixiButton';
import { HubScene } from './hub/HubScene';

const W = GameConfig.VIEWPORT_WIDTH;
const H = GameConfig.VIEWPORT_HEIGHT;

interface Spore {
  node: Graphics;
  x: number;
  y: number;
  speed: number;
  drift: number;
  size: number;
}

export class StartScene extends Scene {
  private spores: Spore[] = [];
  private title!: Text;
  private prompt!: Text;
  private elapsed = 0;
  private keyHandler!: (e: KeyboardEvent) => void;

  override async enter(): Promise<void> {
    const bg = new Graphics();
    bg.rect(0, 0, W, H).fill({ color: 0x07090a });
    this.root.addChild(bg);

    const tex = await assets.texture('res://assets/art/textures/mycelium_tile.png');
    if (tex) this.addTextureBackground(tex);
    this.addAtmosphere();
    this.addTitleBlock();
    this.addStartButton();

    audioManager.playMusic('res://assets/audio/music/menu.wav', { loop: true, volume: 0.28, fadeMs: 500 }).catch(() => undefined);

    this.keyHandler = (e: KeyboardEvent): void => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.startGame();
      }
    };
    window.addEventListener('keydown', this.keyHandler);
  }

  override update(dt: number): void {
    this.elapsed += dt;
    this.title.y = 154 + Math.sin(this.elapsed * 1.5) * 3;
    this.prompt.alpha = 0.55 + Math.sin(this.elapsed * 4) * 0.25;

    for (const spore of this.spores) {
      spore.drift += dt;
      spore.y -= spore.speed * dt;
      spore.x += Math.sin(spore.drift) * 10 * dt;
      if (spore.y < -20) {
        spore.y = H + 20;
        spore.x = Math.random() * W;
      }
      spore.node.x = spore.x;
      spore.node.y = spore.y;
      spore.node.alpha = 0.32 + Math.sin(spore.drift * 2) * 0.14;
    }
  }

  override async exit(): Promise<void> {
    window.removeEventListener('keydown', this.keyHandler);
    audioManager.stopMusic(250);
  }

  private addTextureBackground(tex: Texture): void {
    const tile = new TilingSprite({ texture: tex, width: W, height: H });
    tile.tileScale.set(1.7);
    tile.alpha = 0.25;
    this.root.addChild(tile);

    const haze = new Graphics();
    haze
      .rect(0, 0, W, H).fill({ color: 0x06120d, alpha: 0.6 })
      .rect(0, H * 0.58, W, H * 0.42).fill({ color: 0x180b0c, alpha: 0.45 });
    this.root.addChild(haze);
  }

  private addAtmosphere(): void {
    const grid = new Graphics();
    for (let y = 96; y < H; y += 34) {
      grid.moveTo(0, y).lineTo(W, y);
    }
    for (let x = 20; x < W; x += 42) {
      grid.moveTo(x, 0).lineTo(x - 90, H);
    }
    grid.stroke({ color: 0x4dc7b9, width: 1, alpha: 0.08 });
    this.root.addChild(grid);

    const horizon = new Graphics();
    horizon
      .rect(0, H - 168, W, 2).fill({ color: 0x4dc7b9, alpha: 0.32 })
      .rect(0, H - 166, W, 1).fill({ color: 0xffffff, alpha: 0.18 });
    this.root.addChild(horizon);

    for (let i = 0; i < 44; i++) {
      const node = new Graphics();
      const size = 1 + Math.random() * 2.6;
      node.circle(0, 0, size).fill({ color: 0x6dffba, alpha: 0.9 });
      node.circle(0, 0, size * 3).fill({ color: 0x6dffba, alpha: 0.12 });
      this.root.addChild(node);
      this.spores.push({
        node,
        x: Math.random() * W,
        y: Math.random() * H,
        speed: 8 + Math.random() * 22,
        drift: Math.random() * Math.PI * 2,
        size,
      });
    }

    const silhouette = new Graphics();
    silhouette
      .rect(0, H - 94, W, 94).fill({ color: 0x030505, alpha: 0.92 })
      .rect(52, H - 164, 38, 72).fill({ color: 0x030505, alpha: 0.92 })
      .rect(114, H - 130, 52, 36).fill({ color: 0x030505, alpha: 0.92 })
      .rect(310, H - 184, 44, 90).fill({ color: 0x030505, alpha: 0.92 })
      .rect(374, H - 142, 70, 48).fill({ color: 0x030505, alpha: 0.92 });
    this.root.addChild(silhouette);
  }

  private addTitleBlock(): void {
    const eyebrow = new Text({
      text: 'PROTOCOLO DE SOBREVIVENCIA',
      style: {
        fontFamily: FontFamily.mono,
        fontSize: 10,
        fill: TextColor.bio,
        fontWeight: '700',
        letterSpacing: 2,
      },
    });
    eyebrow.anchor.set(0.5);
    eyebrow.x = W / 2;
    eyebrow.y = 112;
    this.root.addChild(eyebrow);

    this.title = new Text({
      text: 'FUNGINEER',
      style: {
        fontFamily: FontFamily.display,
        fontSize: 44,
        fill: 0xe6f0d9,
        fontWeight: '900',
        align: 'center',
        stroke: { color: 0x102819, width: 4 },
      },
    });
    this.title.anchor.set(0.5);
    this.title.x = W / 2;
    this.title.y = 154;
    this.root.addChild(this.title);

    const subtitle = new Text({
      text: 'Construa. Resgate. Aguente a colonia.',
      style: {
        fontFamily: FontFamily.body,
        fontSize: 14,
        fill: TextColor.muted,
        fontWeight: '600',
      },
    });
    subtitle.anchor.set(0.5);
    subtitle.x = W / 2;
    subtitle.y = 202;
    this.root.addChild(subtitle);
  }

  private addStartButton(): void {
    const btn = new PixiButton({
      label: 'COMEÇAR JOGO',
      width: 250,
      height: 48,
      fill: 0x173322,
      hoverFill: 0x214a31,
      textColor: 0x6dffba,
      fontSize: 15,
      onClick: () => this.startGame(),
    });
    btn.x = W / 2 - 125;
    btn.y = H - 214;
    this.root.addChild(btn);

    this.prompt = new Text({
      text: 'ENTER / TOQUE PARA INICIAR',
      style: {
        fontFamily: FontFamily.mono,
        fontSize: 10,
        fill: Color.hex(Color.rgb(0.74, 0.82, 0.68)),
        fontWeight: '600',
      },
    });
    this.prompt.anchor.set(0.5);
    this.prompt.x = W / 2;
    this.prompt.y = H - 148;
    this.root.addChild(this.prompt);
  }

  private startGame(): void {
    audioManager.playSfx('res://assets/audio/sfx/ui/Confirm_03.wav', 0.7);
    void sceneManager.replace(new HubScene(), { fadeMs: 320 });
  }
}
