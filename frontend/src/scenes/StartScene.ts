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

/**
 * StartScene — a tela inicial do jogo (menu principal).
 *
 * E a primeira coisa que o jogador ve: o titulo FUNGINEER sobre um cenario
 * atmosferico (textura de micelio, esporos subindo, silhuetas de ruinas) e um
 * botao "COMECAR JOGO" que leva ao hub (HubScene).
 *
 * Tudo que e fixo (fundo, titulo, botao) e montado uma vez em enter(); o que se
 * mexe (esporos flutuando, titulo balancando, texto piscando) e animado em
 * update(). Apertar Enter/Espaco tambem inicia o jogo.
 */

const W = GameConfig.VIEWPORT_WIDTH;
const H = GameConfig.VIEWPORT_HEIGHT;

/** Um esporo flutuante do fundo: seu ponto grafico mais o estado do movimento. */
interface Spore {
  node: Graphics;
  x: number;
  y: number;
  speed: number;  // velocidade de subida
  drift: number;  // fase usada para o vai-e-vem horizontal
  size: number;
}

export class StartScene extends Scene {
  private spores: Spore[] = [];
  private title!: Text;
  private prompt!: Text;
  private elapsed = 0;
  // Guardamos a referencia do handler de teclado para poder remove-lo no exit()
  // (senao ele continuaria escutando teclas depois da cena sair).
  private keyHandler!: (e: KeyboardEvent) => void;

  /** Monta o cenario, o titulo, o botao e a musica; liga o atalho de teclado. */
  override async enter(): Promise<void> {
    const bg = new Graphics();
    bg.rect(0, 0, W, H).fill({ color: 0x07090a });
    this.root.addChild(bg);

    // A textura de micelio pode falhar ao carregar; nesse caso seguimos sem ela.
    const tex = await assets.texture('res://assets/art/textures/mycelium_tile.png');
    if (tex) this.addTextureBackground(tex);
    this.addAtmosphere();
    this.addTitleBlock();
    this.addStartButton();

    // Musica do menu em loop, com fade-in suave. O .catch evita que uma falha
    // de audio (ex.: navegador bloqueando som) quebre a cena.
    audioManager.playMusic('res://assets/audio/music/menu.wav', { loop: true, volume: 0.28, fadeMs: 500 }).catch(() => undefined);

    // Enter ou Espaco tambem comecam o jogo (alem do clique no botao).
    this.keyHandler = (e: KeyboardEvent): void => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.startGame();
      }
    };
    window.addEventListener('keydown', this.keyHandler);
  }

  /** A cada quadro: balanca o titulo, pisca o texto e move os esporos. */
  override update(dt: number): void {
    this.elapsed += dt;
    // Titulo flutua suavemente para cima e para baixo; o prompt pisca (alpha).
    this.title.y = 156 + Math.sin(this.elapsed * 1.5) * 3;
    this.prompt.alpha = 0.55 + Math.sin(this.elapsed * 4) * 0.25;

    for (const spore of this.spores) {
      spore.drift += dt;
      spore.y -= spore.speed * dt;               // sobe
      spore.x += Math.sin(spore.drift) * 10 * dt; // deriva (drift) para os lados
      // Ao sair pelo topo, reaparece embaixo numa coluna aleatoria (recycle).
      if (spore.y < -20) {
        spore.y = H + 20;
        spore.x = Math.random() * W;
      }
      spore.node.x = spore.x;
      spore.node.y = spore.y;
      spore.node.alpha = 0.32 + Math.sin(spore.drift * 2) * 0.14;
    }
  }

  /** Ao sair da cena: remove o atalho de teclado e corta a musica com fade. */
  override async exit(): Promise<void> {
    window.removeEventListener('keydown', this.keyHandler);
    audioManager.stopMusic(250);
  }

  /** Cobre a tela com a textura de micelio (tiling) e uma neblina escura. */
  private addTextureBackground(tex: Texture): void {
    // TilingSprite repete a mesma textura para preencher toda a area.
    const tile = new TilingSprite({ texture: tex, width: W, height: H });
    tile.tileScale.set(1.7);
    tile.alpha = 0.25;
    this.root.addChild(tile);

    const haze = new Graphics();
    haze
      .rect(0, 0, W, H).fill({ color: 0x06120d, alpha: 0.45 })
      .rect(0, H * 0.58, W, H * 0.42).fill({ color: 0x180b0c, alpha: 0.38 });
    this.root.addChild(haze);
  }

  /** Adiciona a "atmosfera": grade em perspectiva, linha do horizonte, esporos
   *  flutuantes e silhuetas escuras de ruinas ao fundo. */
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

    // Cria 44 esporos com tamanho/velocidade/fase aleatorios. Cada um e um
    // ponto brilhante com um halo translucido em volta.
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

  /** Desenha o bloco do titulo: painel escuro de fundo, "olho" (eyebrow),
   *  o titulo FUNGINEER e o subtitulo. */
  private addTitleBlock(): void {
    // Painel escuro atras do titulo para ele se destacar sobre a arte agitada.
    const panel = new Graphics();
    const px = 28;
    const py = 88;
    const pw = W - px * 2;
    const ph = 142;
    panel
      .roundRect(px, py, pw, ph, 12)
      .fill({ color: 0x04100b, alpha: 0.62 })
      .roundRect(px, py, pw, ph, 12)
      .stroke({ color: 0x4dc7b9, width: 1, alpha: 0.28 })
      // thin accent line at the top edge
      .rect(px + 16, py + 0.5, pw - 32, 1).fill({ color: 0x6fe3d4, alpha: 0.35 });
    this.root.addChild(panel);

    const eyebrow = new Text({
      text: 'PROTOCOLO DE SOBREVIVENCIA',
      style: {
        fontFamily: FontFamily.mono,
        fontSize: 11,
        fill: TextColor.bio,
        fontWeight: '700',
        letterSpacing: 2,
        dropShadow: { color: 0x000000, alpha: 0.7, blur: 2, distance: 1, angle: Math.PI / 2 },
      },
    });
    eyebrow.anchor.set(0.5);
    eyebrow.x = W / 2;
    eyebrow.y = 114;
    this.root.addChild(eyebrow);

    this.title = new Text({
      text: 'FUNGINEER',
      style: {
        fontFamily: FontFamily.display,
        fontSize: 46,
        fill: 0xf2f8ea,
        fontWeight: '900',
        align: 'center',
        stroke: { color: 0x0a1f14, width: 5 },
        dropShadow: { color: 0x000000, alpha: 0.55, blur: 5, distance: 2, angle: Math.PI / 2 },
      },
    });
    this.title.anchor.set(0.5);
    this.title.x = W / 2;
    this.title.y = 156;
    this.root.addChild(this.title);

    const subtitle = new Text({
      text: 'Construa. Resgate. Aguente a colonia.',
      style: {
        fontFamily: FontFamily.body,
        fontSize: 14,
        fill: TextColor.ink,
        fontWeight: '600',
        dropShadow: { color: 0x000000, alpha: 0.7, blur: 2, distance: 1, angle: Math.PI / 2 },
      },
    });
    subtitle.anchor.set(0.5);
    subtitle.x = W / 2;
    subtitle.y = 204;
    this.root.addChild(subtitle);
  }

  /** Cria o botao "COMECAR JOGO", o prompt piscante e o carimbo de build. */
  private addStartButton(): void {
    const bw = 272;
    const bh = 58;
    const btn = new PixiButton({
      label: 'COMEÇAR JOGO',
      width: bw,
      height: bh,
      fill: 0x1f4a30,
      hoverFill: 0x2c6a43,
      textColor: 0x9dffce,
      fontSize: 17,
      onClick: () => this.startGame(),
    });
    btn.x = W / 2 - bw / 2;
    btn.y = H - 220;
    this.root.addChild(btn);

    this.prompt = new Text({
      text: 'ENTER / TOQUE PARA INICIAR',
      style: {
        fontFamily: FontFamily.mono,
        fontSize: 11,
        fill: Color.hex(Color.rgb(0.82, 0.9, 0.76)),
        fontWeight: '600',
        letterSpacing: 1,
        dropShadow: { color: 0x000000, alpha: 0.7, blur: 2, distance: 1, angle: Math.PI / 2 },
      },
    });
    this.prompt.anchor.set(0.5);
    this.prompt.x = W / 2;
    this.prompt.y = H - 150;
    this.root.addChild(this.prompt);

    // Carimbo do build — minusculo e discreto. Serve para conferir num relance
    // qual versao esta no ar apos um deploy (SHA do commit + data, injetados
    // pelo Vite na hora de compilar).
    const build = new Text({
      text: `build ${__BUILD_ID__}`,
      style: { fontFamily: FontFamily.mono, fontSize: 9, fill: TextColor.faint, letterSpacing: 0.5 },
    });
    build.anchor.set(1, 1);
    build.alpha = 0.5;
    build.x = W - 8;
    build.y = H - 6;
    this.root.addChild(build);
  }

  /** Toca o som de confirmacao e troca para o hub com uma transicao de fade. */
  private startGame(): void {
    audioManager.playSfx('res://assets/audio/sfx/ui/Confirm_03.wav', 0.7);
    void sceneManager.replace(new HubScene(), { fadeMs: 320 });
  }
}
