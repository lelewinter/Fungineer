import { Container, Graphics } from 'pixi.js';
import { Color } from '../core/Color';
import { GameConfig } from '../state/GameConfig';
import type { BaseEnemy } from './BaseEnemy';
import type { RunWorld } from './RunWorld';
import type { Vec2 } from '../core/types';

/** Projectile contract used by RunWorld.projectiles. */
export interface Projectile {
  readonly node: Container;
  position: Vec2;
  update(dt: number, world: RunWorld): boolean;
}

// ── Striker bullet — straight-line, expires on first hit ─────────────────
export class StrikerBullet implements Projectile {
  static readonly SPEED = 350;
  readonly node = new Container();
  position: Vec2 = { x: 0, y: 0 };
  private dir: Vec2;
  private damage: number;
  private lifetime = 0.4;
  private g = new Graphics();

  constructor(origin: Vec2, dir: Vec2, damage: number) {
    this.position = { ...origin };
    this.dir = dir;
    this.damage = damage;
    this.g
      .rect(-4, -4, 8, 8)
      .fill({ color: Color.hex(Color.rgb(0.0, 0.9, 0.9)), alpha: 0.9 });
    this.node.addChild(this.g);
    this.node.x = origin.x;
    this.node.y = origin.y;
  }

  update(dt: number, world: RunWorld): boolean {
    this.lifetime -= dt;
    if (this.lifetime <= 0) return false;

    this.position.x += this.dir.x * StrikerBullet.SPEED * dt;
    this.position.y += this.dir.y * StrikerBullet.SPEED * dt;
    this.node.x = this.position.x;
    this.node.y = this.position.y;

    for (const e of world.enemies) {
      if (e.is_dead) continue;
      const dx = e.position.x - this.position.x;
      const dy = e.position.y - this.position.y;
      if (dx * dx + dy * dy < 18 * 18) {
        e.takeDamage(this.damage, null);
        return false;
      }
    }
    return true;
  }
}

// ── Artificer projectile — slow homing, AoE on impact ─────────────────────
export class ArtificerProjectile implements Projectile {
  static readonly SPEED = 90;
  readonly node = new Container();
  position: Vec2 = { x: 0, y: 0 };
  private target: BaseEnemy;
  private damage: number;
  private lifetime = 5.0;
  private g = new Graphics();

  constructor(origin: Vec2, target: BaseEnemy, damage: number) {
    this.position = { ...origin };
    this.target = target;
    this.damage = damage;
    this.g
      .circle(0, 0, 7)
      .fill({ color: Color.hex(Color.rgb(0.7, 0.2, 0.9)), alpha: 0.9 })
      .circle(0, 0, 5)
      .fill({ color: 0xffffff, alpha: 0.4 });
    this.node.addChild(this.g);
    this.node.x = origin.x;
    this.node.y = origin.y;
  }

  update(dt: number, world: RunWorld): boolean {
    this.lifetime -= dt;
    if (this.lifetime <= 0) return false;
    if (this.target.is_dead) return false;

    const dx = this.target.position.x - this.position.x;
    const dy = this.target.position.y - this.position.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 20) {
      this.explode(world);
      return false;
    }
    if (dist > 0.001) {
      const inv = 1 / dist;
      this.position.x += dx * inv * ArtificerProjectile.SPEED * dt;
      this.position.y += dy * inv * ArtificerProjectile.SPEED * dt;
      this.node.x = this.position.x;
      this.node.y = this.position.y;
    }
    return true;
  }

  private explode(world: RunWorld): void {
    const r = GameConfig.ARTIFICER_EXPLOSION_RADIUS;
    const hit: BaseEnemy[] = [];
    for (const e of world.enemies) {
      if (e.is_dead) continue;
      const dx = e.position.x - this.position.x;
      const dy = e.position.y - this.position.y;
      if (dx * dx + dy * dy <= r * r) hit.push(e);
    }
    const cluster = hit.length >= 3 ? 1 + GameConfig.ARTIFICER_CLUSTER_BONUS : 1;
    for (const e of hit) e.takeDamage(this.damage * cluster, null);

    // Flash visual handled by fx layer
    const flash = new Graphics()
      .circle(this.position.x, this.position.y, r)
      .fill({ color: Color.hex(Color.rgb(0.9, 0.5, 1.0)), alpha: 0.6 });
    world.fxLayer.addChild(flash);
    const start = performance.now();
    const tick = (): void => {
      const t = Math.min(1, (performance.now() - start) / 300);
      flash.alpha = 0.6 * (1 - t);
      if (t < 1) {
        requestAnimationFrame(tick);
      } else {
        flash.parent?.removeChild(flash);
        flash.destroy();
      }
    };
    requestAnimationFrame(tick);
  }
}
