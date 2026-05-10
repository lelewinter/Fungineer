import { Container, Graphics } from 'pixi.js';
import type { Vec2 } from '../core/types';
import { Color, type RGBA } from '../core/Color';
import { Signal } from '../core/Signal';
import type { BaseCharacter } from './BaseCharacter';
import type { RunWorld } from './RunWorld';

export interface EnemyStats {
  name: string;
  max_hp: number;
  move_speed: number;
  attack_damage: number;
  attack_interval: number;
  attack_range: number;
  color: RGBA;
  is_elite?: boolean;
}

export class BaseEnemy {
  enemy_name: string;
  max_hp: number;
  move_speed: number;
  attack_damage: number;
  attack_interval: number;
  attack_range: number;
  color: RGBA;
  is_elite: boolean;

  position: Vec2 = { x: 0, y: 0 };
  current_hp = 0;
  is_dead = false;
  protected attack_timer = 0;
  protected current_target: BaseCharacter | null = null;

  readonly node = new Container();
  protected visual = new Graphics();
  protected hpBarBg = new Graphics();
  protected hpBarFill = new Graphics();
  protected world: RunWorld | null = null;

  readonly died = new Signal<[BaseEnemy]>();

  constructor(stats: EnemyStats) {
    this.enemy_name = stats.name;
    this.max_hp = stats.max_hp;
    this.move_speed = stats.move_speed;
    this.attack_damage = stats.attack_damage;
    this.attack_interval = stats.attack_interval;
    this.attack_range = stats.attack_range;
    this.color = stats.color;
    this.is_elite = stats.is_elite ?? false;
    this.current_hp = this.max_hp;

    this.node.addChild(this.visual);
    this.node.addChild(this.hpBarBg);
    this.node.addChild(this.hpBarFill);
    this.buildVisual();
    this.updateHpBar();
  }

  protected buildVisual(): void {
    this.visual.clear();
    this.visual
      .roundRect(-12, -12, 24, 24, 3)
      .fill(Color.hex(this.color))
      .stroke({ color: 0x000000, alpha: 0.5, width: 1 });
  }

  setWorld(world: RunWorld): void {
    this.world = world;
  }

  update(dt: number, world: RunWorld): void {
    if (this.is_dead) return;
    this.findTarget(world);
    this.move(dt);
    this.tickAttack(dt);
    this.node.x = this.position.x;
    this.node.y = this.position.y;
    this.updateHpBar();
  }

  protected findTarget(world: RunWorld): void {
    this.current_target = world.nearestCharacterTo(this.position);
  }

  protected move(dt: number): void {
    if (!this.current_target) return;
    const dx = this.current_target.position.x - this.position.x;
    const dy = this.current_target.position.y - this.position.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 0.001) return;
    const inv = this.move_speed / dist;
    this.position.x += dx * inv * dt;
    this.position.y += dy * inv * dt;
  }

  protected tickAttack(dt: number): void {
    if (!this.current_target) return;
    const dx = this.current_target.position.x - this.position.x;
    const dy = this.current_target.position.y - this.position.y;
    if (Math.hypot(dx, dy) > this.attack_range) return;
    this.attack_timer += dt;
    if (this.attack_timer >= this.attack_interval) {
      this.attack_timer = 0;
      this.attack(this.current_target);
    }
  }

  protected attack(target: BaseCharacter): void {
    target.takeDamage(this.attack_damage, this);
  }

  /** Source-side `take_damage` for ReflectiveShell reflection. */
  take_damage(amount: number, _source: unknown): void {
    this.takeDamage(amount);
  }

  takeDamage(amount: number, _source: BaseCharacter | null = null): void {
    if (this.is_dead) return;
    this.current_hp = Math.max(0, this.current_hp - amount);
    if (this.current_hp <= 0) this.die();
  }

  protected die(): void {
    this.is_dead = true;
    this.died.emit(this);
    if (this.world) this.world.removeEnemy(this);
    this.node.parent?.removeChild(this.node);
    this.node.destroy({ children: true });
  }

  protected updateHpBar(): void {
    const w = 26;
    const h = 3;
    const x = -w / 2;
    const y = -18;
    this.hpBarBg.clear()
      .rect(x, y, w, h)
      .fill({ color: 0x222222, alpha: 0.85 });
    const ratio = this.max_hp > 0 ? this.current_hp / this.max_hp : 0;
    this.hpBarFill.clear()
      .rect(x, y, w * ratio, h)
      .fill({ color: 0xe64d4d });
  }
}
