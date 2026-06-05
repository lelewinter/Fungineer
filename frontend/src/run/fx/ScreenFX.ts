/*
 * ScreenFX — efeitos de combate que ocupam a tela inteira.
 *
 * Três tipos, cada um numa camada própria:
 *   - flash: um "clarão" colorido que cobre a tela e some rápido.
 *   - edges: "pressão nas bordas" — um brilho que pulsa nas beiradas (usado para
 *     comunicar perigo/dano).
 *   - shockwave: um anel que se expande do centro para fora.
 *
 * Cada efeito guarda life/maxLife (tempo restante / total) para animar e sumir.
 */
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

/** Feedback de tela cheia: clarões, pressão nas bordas e ondas de choque. */
export class ScreenFX extends Container {
  private flashLayer = new Graphics();
  private edgeLayer = new Graphics();
  private waveLayer = new Graphics();
  private flashes: Flash[] = [];
  private shockwaves: Shockwave[] = [];
  private edgeTrauma = 0; // intensidade atual da pressão nas bordas (0 a 1)
  private edgeColor = 0xff2f3d;

  constructor() {
    super();
    this.zIndex = 120;          // bem na frente de tudo
    this.eventMode = 'none';    // não intercepta cliques/toques
    this.addChild(this.edgeLayer, this.waveLayer, this.flashLayer);
  }

  /** Agenda um clarão de tela. */
  flash(color: number, alpha = 0.22, life = 0.18): void {
    this.flashes.push({ color, alpha, life, maxLife: life });
  }

  /** Acrescenta pressão nas bordas (acumula, limitado a 1). */
  edges(color: number = 0xff2f3d, amount = 0.45): void {
    this.edgeColor = color;
    this.edgeTrauma = Math.min(1, this.edgeTrauma + amount);
  }

  /** Agenda uma onda de choque a partir do centro. */
  shockwave(color: number = 0xffffff, life = 0.42): void {
    this.shockwaves.push({ color, life, maxLife: life });
  }

  /** Roda todo frame: atualiza os três tipos de efeito. */
  update(dt: number): void {
    this.updateFlashes(dt);
    this.updateEdges(dt);
    this.updateShockwaves(dt);
  }

  /** Redesenha os clarões ativos, removendo os que já acabaram. */
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
      // t*t faz o clarão sumir acelerando no fim (some "de repente").
      this.flashLayer.rect(0, 0, GameConfig.VIEWPORT_WIDTH, GameConfig.VIEWPORT_HEIGHT)
        .fill({ color: f.color, alpha: f.alpha * t * t });
    }
  }

  /** Redesenha as 4 faixas de pressão nas bordas e deixa a intensidade decair. */
  private updateEdges(dt: number): void {
    this.edgeLayer.clear();
    if (this.edgeTrauma <= 0.001) {
      this.edgeTrauma = 0;
      return;
    }
    const w = GameConfig.VIEWPORT_WIDTH;
    const h = GameConfig.VIEWPORT_HEIGHT;
    const a = this.edgeTrauma * this.edgeTrauma * 0.45; // opacidade (curva quadrática)
    const thick = 18 + this.edgeTrauma * 28;            // espessura cresce com a intensidade
    this.edgeLayer
      .rect(0, 0, w, thick).fill({ color: this.edgeColor, alpha: a })
      .rect(0, h - thick, w, thick).fill({ color: this.edgeColor, alpha: a })
      .rect(0, 0, thick, h).fill({ color: this.edgeColor, alpha: a })
      .rect(w - thick, 0, thick, h).fill({ color: this.edgeColor, alpha: a });
    this.edgeTrauma = Math.max(0, this.edgeTrauma - dt * 1.6);
  }

  /** Redesenha as ondas de choque: anéis que crescem do centro e desbotam. */
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
      const t = 1 - s.life / s.maxLife; // 0→1 conforme a onda expande
      // O anel aumenta de raio; a opacidade e a espessura diminuem com o tempo.
      this.waveLayer.circle(cx, cy, 24 + maxR * t)
        .stroke({ color: s.color, alpha: 0.35 * (1 - t), width: 6 * (1 - t) + 1 });
    }
  }
}
