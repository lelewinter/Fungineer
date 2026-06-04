import { Container, Graphics } from 'pixi.js';

interface Particle {
  g: Graphics;
  x: number; y: number;
  vx: number; vy: number;
  life: number; maxLife: number;
  size: number;
  drift: number;
  ambient: boolean;
  active: boolean;
}

export interface BurstOpts {
  count?: number;
  color?: number;
  speed?: number;
  life?: number;
  size?: number;
  spread?: number; // direction in radians for directional bursts; omit = radial
  gravity?: number;
}

/** Reusable particle system for a run/zone. Owns a layer of pooled Graphics
 *  particles. Two roles:
 *    - ambient(): a steady field of drifting bioluminescent spores (atmosphere)
 *    - burst(): a one-shot pop of particles (hit, death, pickup, explosion)
 *
 *  Built generic so every zone reuses it. Cheap: pooled, capped, no textures. */
export class FXSystem {
  private layer = new Container();
  private pool: Particle[] = [];
  private bounds: { w: number; h: number };
  private ambientCount: number;
  private ambientColor: number;

  constructor(parent: Container, bounds: { w: number; h: number }, opts: { ambient?: number; cap?: number; ambientColor?: number; zIndex?: number } = {}) {
    this.bounds = bounds;
    this.ambientCount = opts.ambient ?? 0;
    this.ambientColor = opts.ambientColor ?? 0x6bffb0;
    if (opts.zIndex !== undefined) this.layer.zIndex = opts.zIndex;
    parent.addChild(this.layer);
    const cap = opts.cap ?? 320;
    for (let i = 0; i < cap; i++) {
      const g = new Graphics();
      g.visible = false;
      this.layer.addChild(g);
      this.pool.push({ g, x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 1, size: 2, drift: 0, ambient: false, active: false });
    }
    for (let i = 0; i < this.ambientCount; i++) this.spawnAmbient(true);
  }

  private take(): Particle | null {
    for (const p of this.pool) if (!p.active) return p;
    return null;
  }

  private paint(p: Particle, color: number, alpha: number): void {
    p.g.clear();
    p.g.circle(0, 0, p.size).fill({ color, alpha });
    // soft halo
    p.g.circle(0, 0, p.size * 2.2).fill({ color, alpha: alpha * 0.25 });
  }

  private spawnAmbient(initial = false): void {
    const p = this.take();
    if (!p) return;
    p.ambient = true;
    p.active = true;
    p.g.visible = true;
    p.x = Math.random() * this.bounds.w;
    p.y = initial ? Math.random() * this.bounds.h : this.bounds.h + 10;
    p.vx = (Math.random() - 0.5) * 8;
    p.vy = -6 - Math.random() * 12;
    p.drift = Math.random() * Math.PI * 2;
    p.size = 1 + Math.random() * 2.2;
    p.maxLife = 6 + Math.random() * 6;
    p.life = initial ? Math.random() * p.maxLife : 0;
    this.paint(p, this.ambientColor, 0.5);
  }

  /** One-shot particle pop at a world position. */
  burst(x: number, y: number, opts: BurstOpts = {}): void {
    const count = opts.count ?? 10;
    const color = opts.color ?? 0xffd070;
    const speed = opts.speed ?? 120;
    const life = opts.life ?? 0.5;
    const size = opts.size ?? 2.5;
    for (let i = 0; i < count; i++) {
      const p = this.take();
      if (!p) return;
      const ang = opts.spread !== undefined
        ? opts.spread + (Math.random() - 0.5) * 1.0
        : Math.random() * Math.PI * 2;
      const sp = speed * (0.4 + Math.random() * 0.6);
      p.ambient = false;
      p.active = true;
      p.g.visible = true;
      p.x = x; p.y = y;
      p.vx = Math.cos(ang) * sp;
      p.vy = Math.sin(ang) * sp;
      p.drift = opts.gravity ?? 0;
      p.size = size * (0.6 + Math.random() * 0.8);
      p.maxLife = life * (0.7 + Math.random() * 0.6);
      p.life = 0;
      this.paint(p, color, 1);
    }
  }

  update(dt: number): void {
    for (const p of this.pool) {
      if (!p.active) continue;
      p.life += dt;
      if (p.ambient) {
        p.drift += dt * 1.5;
        p.x += (p.vx + Math.sin(p.drift) * 6) * dt;
        p.y += p.vy * dt;
        const flick = 0.35 + 0.25 * Math.sin(p.drift * 3);
        p.g.alpha = flick;
        if (p.life >= p.maxLife || p.y < -20) {
          p.active = false; p.g.visible = false;
          this.spawnAmbient(false);
          continue;
        }
      } else {
        p.vy += (p.drift || 0) * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= 0.92; p.vy *= 0.92;
        const t = p.life / p.maxLife;
        p.g.alpha = Math.max(0, 1 - t);
        if (p.life >= p.maxLife) { p.active = false; p.g.visible = false; continue; }
      }
      p.g.x = p.x; p.g.y = p.y;
    }
  }

  destroy(): void {
    this.layer.destroy({ children: true });
    this.pool = [];
  }
}
