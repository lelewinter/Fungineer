import { Container, Graphics, Sprite, Text } from 'pixi.js';
import { Scene } from '../../core/Scene';
import { Color, type RGBA } from '../../core/Color';
import { GameConfig } from '../../state/GameConfig';
import { sceneManager } from '../../core/SceneManager';
import { audioManager } from '../../core/AudioManager';
import { assets } from '../../core/AssetLoader';
import { HubScene } from '../hub/HubScene';
import { PixiButton } from '../../ui/PixiButton';
import { FontFamily, TextColor } from '../../core/typography';
import { type ZoneData } from '../../state/Zones';

/** Pre-production teaser. The real run lives in Phase 7. */
export class StubRunScene extends Scene {
  private zone: ZoneData;
  private elapsed = 0;
  private bg = new Graphics();
  private heroLayer = new Container();
  private particleLayer = new Graphics();
  private squad = new Container();
  private badge = new Container();
  private comingSoonLabel!: Text;

  constructor(zone: ZoneData) {
    super();
    this.zone = zone;
  }

  override async enter(): Promise<void> {
    const W = GameConfig.VIEWPORT_WIDTH;
    const H = GameConfig.VIEWPORT_HEIGHT;
    const accent = this.zone.accent_color;
    const accentHex = Color.hex(accent);

    // Deep base
    this.bg.rect(0, 0, W, H).fill(Color.hex(Color.rgb(0.03, 0.035, 0.04)));
    this.root.addChild(this.bg);

    this.root.addChild(this.heroLayer);
    this.root.addChild(this.particleLayer);

    // Zone hero art with accent gradient overlay
    if (this.zone.art) {
      const tex = await assets.texture(this.zone.art);
      if (tex) {
        const sprite = new Sprite(tex);
        sprite.anchor.set(0.5);
        sprite.x = W / 2;
        sprite.y = H * 0.36;
        const targetW = W * 0.92;
        sprite.width = targetW;
        sprite.height = (tex.height * targetW) / tex.width;
        sprite.alpha = 0.55;
        this.heroLayer.addChild(sprite);

        // Frame + glow around art
        const frame = new Graphics();
        const frameW = sprite.width + 12;
        const frameH = sprite.height + 12;
        frame
          .roundRect(W / 2 - frameW / 2, sprite.y - frameH / 2, frameW, frameH, 6)
          .stroke({ color: accentHex, width: 1.5, alpha: 0.7 });
        this.heroLayer.addChild(frame);

        // Top vignette
        const grad = new Graphics();
        const layers = 18;
        for (let i = 0; i < layers; i++) {
          const t = i / layers;
          const alpha = (1 - t) * 0.45;
          grad
            .rect(0, sprite.y - sprite.height / 2 - 6 + (sprite.height + 12) * t, W, (sprite.height + 12) / layers + 1)
            .fill({ color: 0x000000, alpha });
        }
        this.heroLayer.addChild(grad);
      }
    }

    // Banner header
    const headerStrip = new Graphics();
    const stripY = H * 0.07;
    headerStrip
      .rect(0, stripY, W, 1).fill({ color: accentHex, alpha: 0.4 })
      .rect(0, stripY + 50, W, 1).fill({ color: accentHex, alpha: 0.4 });
    this.root.addChild(headerStrip);

    const eyebrow = new Text({
      text: `▸ DEPLOY · ${this.zone.subtitle.toUpperCase()}`,
      style: {
        fontFamily: FontFamily.mono,
        fontSize: 9,
        fill: accentHex,
        letterSpacing: 2,
      },
    });
    eyebrow.anchor.set(0.5, 0);
    eyebrow.x = W / 2;
    eyebrow.y = stripY + 6;
    this.root.addChild(eyebrow);

    const title = new Text({
      text: this.zone.zone_name.toLowerCase(),
      style: {
        fontFamily: FontFamily.display,
        fontSize: 30,
        fill: accentHex,
        letterSpacing: 6,
      },
    });
    title.anchor.set(0.5, 0);
    title.x = W / 2;
    title.y = stripY + 18;
    this.root.addChild(title);

    // Resource card
    const cardY = H * 0.66;
    const cardW = W * 0.78;
    const cardH = 96;
    const card = new Graphics();
    card
      .roundRect(W / 2 - cardW / 2, cardY, cardW, cardH, 6)
      .fill({ color: 0x0a100c, alpha: 0.9 })
      .stroke({ color: accentHex, width: 1, alpha: 0.5 });
    this.root.addChild(card);

    const cardLabel = new Text({
      text: 'recurso alvo',
      style: { fontFamily: FontFamily.mono, fontSize: 9, fill: TextColor.faint, letterSpacing: 2 },
    });
    cardLabel.x = W / 2 - cardW / 2 + 14;
    cardLabel.y = cardY + 12;
    this.root.addChild(cardLabel);

    const resName = new Text({
      text: this.zone.resource || '—',
      style: { fontFamily: FontFamily.body, fontSize: 18, fill: TextColor.ink, fontWeight: '600' },
    });
    resName.x = W / 2 - cardW / 2 + 14;
    resName.y = cardY + 28;
    this.root.addChild(resName);

    const stateLabel = new Text({
      text: 'status do deploy',
      style: { fontFamily: FontFamily.mono, fontSize: 9, fill: TextColor.faint, letterSpacing: 2 },
    });
    stateLabel.x = W / 2 - cardW / 2 + 14;
    stateLabel.y = cardY + 58;
    this.root.addChild(stateLabel);

    const stateText = new Text({
      text: 'cultivando — em breve',
      style: { fontFamily: FontFamily.body, fontSize: 13, fill: accentHex, fontWeight: '600' },
    });
    stateText.x = W / 2 - cardW / 2 + 14;
    stateText.y = cardY + 72;
    this.root.addChild(stateText);

    // Badge "in cultivation"
    this.badge.x = W - 24;
    this.badge.y = cardY + 8;
    const badgeBg = new Graphics();
    badgeBg
      .roundRect(-70, 0, 56, 18, 9)
      .fill({ color: accentHex, alpha: 0.16 })
      .stroke({ color: accentHex, width: 1, alpha: 0.7 });
    this.badge.addChild(badgeBg);
    const badgeText = new Text({
      text: 'in cult.',
      style: { fontFamily: FontFamily.mono, fontSize: 8, fill: accentHex, letterSpacing: 1 },
    });
    badgeText.anchor.set(0.5);
    badgeText.x = -42;
    badgeText.y = 9;
    this.badge.addChild(badgeText);
    this.root.addChild(this.badge);

    // Squad silhouettes (3 bouncing dots representing the would-be party)
    this.squad.x = W / 2;
    this.squad.y = H * 0.83;
    this.root.addChild(this.squad);
    this.buildSquad(accent);

    // Coming-soon mono label
    this.comingSoonLabel = new Text({
      text: 'preparando o micélio...',
      style: { fontFamily: FontFamily.mono, fontSize: 10, fill: TextColor.muted, letterSpacing: 2 },
    });
    this.comingSoonLabel.anchor.set(0.5);
    this.comingSoonLabel.x = W / 2;
    this.comingSoonLabel.y = H - 110;
    this.root.addChild(this.comingSoonLabel);

    // Back button
    const back = new PixiButton({
      label: '← Voltar ao bunker',
      width: 220,
      height: 38,
      textColor: accentHex,
      onClick: () => {
        void sceneManager.replace(new HubScene());
      },
    });
    back.x = (W - 220) / 2;
    back.y = H - 64;
    this.root.addChild(back);

    // Music
    if (this.zone.music) {
      audioManager.playMusic(this.zone.music, { loop: true, volume: 0.35, fadeMs: 600 }).catch(() => undefined);
    }
  }

  override async exit(): Promise<void> {
    audioManager.stopMusic(300);
  }

  override update(dt: number): void {
    this.elapsed += dt;
    const accent = this.zone.accent_color;
    const accentHex = Color.hex(accent);

    // Particle drift
    this.particleLayer.clear();
    const W = GameConfig.VIEWPORT_WIDTH;
    const H = GameConfig.VIEWPORT_HEIGHT;
    const t = this.elapsed;
    for (let i = 0; i < 36; i++) {
      const baseX = ((i * 89.7) % W);
      const baseY = ((i * 41.3) % H);
      let py = (baseY - t * 14 * (1 + (i % 3) * 0.2)) % H;
      if (py < 0) py += H;
      const px = baseX + Math.sin(t * 0.6 + i) * 12;
      const a = 0.18 + 0.18 * Math.sin(t * 1.8 + i);
      this.particleLayer.circle(px, py, 1.2 + (i % 3) * 0.4)
        .fill({ color: accentHex, alpha: a });
    }

    // Squad bobbing
    const dots = this.squad.children as Container[];
    for (let i = 0; i < dots.length; i++) {
      const dot = dots[i]!;
      const phase = t * 4 + i * 0.9;
      dot.y = Math.sin(phase) * 4 - 4;
      dot.scale.set(1 + Math.sin(phase * 0.5) * 0.06);
    }

    // Pulse badge
    this.badge.alpha = 0.85 + 0.15 * Math.sin(t * 3);

    // Coming-soon dot animation
    const dotsCount = Math.floor(t * 2) % 4;
    this.comingSoonLabel.text = 'preparando o micélio' + '.'.repeat(dotsCount);
  }

  private buildSquad(accent: RGBA): void {
    const positions = [-40, 0, 40];
    for (let i = 0; i < positions.length; i++) {
      const c = new Container();
      c.x = positions[i]!;
      const body = new Graphics();
      // Round body
      body.circle(0, 0, 7).fill(Color.hex(accent));
      body.circle(0, -4, 4).fill({ color: 0xffffff, alpha: 0.85 });
      // Shadow
      const shadow = new Graphics();
      shadow.ellipse(0, 12, 8, 2).fill({ color: 0x000000, alpha: 0.4 });
      c.addChild(shadow);
      c.addChild(body);
      this.squad.addChild(c);
    }
  }
}
