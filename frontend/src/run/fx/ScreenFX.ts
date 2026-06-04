import { Container, Graphics } from 'pixi.js';
import { GameConfig } from '../../state/GameConfig';

interface Flash {
  color: number;
  alpha: number;
  life: number;
  maxLife: number;
}

interface Shockwave {
  color: number;
  life: number;
  maxLife: number;
}

/** Full-screen combat feedback: color flashes, edge pressure and shockwaves. */
export class ScreenFX extends Container {
  private flashLayer = new Graphics();
  private edgeLayer = new Graphics();
  private waveLayer = new Graphics();
  private flashes: Flash[] = [];
  private shockwaves: Shockwave[] = [];
  private edgeTrauma = 0;
  private edgeColor = 0xff2f3d;

  constructor() {
    super();
    this.zIndex = 120;
    this.eventMode = 'none';
    this.addChild(this.edgeLayer, this.waveLayer, this.flashLayer);
  }

  flash(color: number, alpha = 0.22, life = 0.18): void {
    this.flashes.push({ color, alpha, life, maxLife: life });
  }

  edges(color: number = 0xff2f3d, amount = 0.45): void {
    this.edgeColor = color;
    this.edgeTrauma = Math.min(1, this.edgeTrauma + amount);
  }

  shockwave(color: number = 0xffffff, life = 0.42): void {
    this.shockwaves.push({ color, life, maxLife: life });
  }

  update(dt: number): void {
    this.updateFlashes(dt);
    this.updateEdges(dt);
    this.updateShockwaves(dt);
  }

  private updateFlashes(dt: number): void {
    this.flashLayer.clear();
    for (let i = this.flashes.length - 1; i >= 0; i--) {
      const f = this.flashes[i]!;
      f.life -= dt;
      if (f.life <= 0) {
        this.flashes.splice(i, 1);
        continue;
      }
      const t = f.life / f.maxLife;
      this.flashLayer.rect(0, 0, GameConfig.VIEWPORT_WIDTH, GameConfig.VIEWPORT_HEIGHT)
        .fill({ color: f.color, alpha: f.alpha * t * t });
    }
  }

  private updateEdges(dt: number): void {
    this.edgeLayer.clear();
    if (this.edgeTrauma <= 0.001) {
      this.edgeTrauma = 0;
      return;
    }
    const w = GameConfig.VIEWPORT_WIDTH;
    const h = GameConfig.VIEWPORT_HEIGHT;
    const a = this.edgeTrauma * this.edgeTrauma * 0.45;
    const thick = 18 + this.edgeTrauma * 28;
    this.edgeLayer
      .rect(0, 0, w, thick).fill({ color: this.edgeColor, alpha: a })
      .rect(0, h - thick, w, thick).fill({ color: this.edgeColor, alpha: a })
      .rect(0, 0, thick, h).fill({ color: this.edgeColor, alpha: a })
      .rect(w - thick, 0, thick, h).fill({ color: this.edgeColor, alpha: a });
    this.edgeTrauma = Math.max(0, this.edgeTrauma - dt * 1.6);
  }

  private updateShockwaves(dt: number): void {
    this.waveLayer.clear();
    const cx = GameConfig.VIEWPORT_WIDTH / 2;
    const cy = GameConfig.VIEWPORT_HEIGHT / 2;
    const maxR = Math.max(GameConfig.VIEWPORT_WIDTH, GameConfig.VIEWPORT_HEIGHT) * 0.55;
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const s = this.shockwaves[i]!;
      s.life -= dt;
      if (s.life <= 0) {
        this.shockwaves.splice(i, 1);
        continue;
      }
      const t = 1 - s.life / s.maxLife;
      this.waveLayer.circle(cx, cy, 24 + maxR * t)
        .stroke({ color: s.color, alpha: 0.35 * (1 - t), width: 6 * (1 - t) + 1 });
    }
  }
}
