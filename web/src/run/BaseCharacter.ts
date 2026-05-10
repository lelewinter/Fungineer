import { Container, Graphics } from 'pixi.js';
import type { Vec2 } from '../core/types';
import { Color, type RGBA } from '../core/Color';
import { Signal } from '../core/Signal';
import { GameState } from '../state/GameState';
import type { BaseEnemy } from './BaseEnemy';
import type { RunWorld } from './RunWorld';

export interface CharacterStats {
  name: string;
  max_hp: number;
  attack_damage: number;
  attack_range: number;
  attack_speed: number;
  color: RGBA;
}

/** Base class for all playable characters. Subclasses override stats and
 *  optional combat hooks (apply_damage_reduction, attack visual etc.). */
export class BaseCharacter {
  // Stats
  character_name: string;
  max_hp: number;
  attack_damage: number;
  attack_range: number;
  attack_speed: number;
  color: RGBA;

  // Runtime
  position: Vec2 = { x: 0, y: 0 };
  current_hp = 0;
  is_dead = false;
  protected attack_timer = 0;
  current_target: BaseEnemy | null = null;
  private intangible = false;

  // Display
  readonly node = new Container();
  protected visual = new Graphics();
  protected hpBarBg = new Graphics();
  protected hpBarFill = new Graphics();

  // Signals
  readonly died = new Signal<[BaseCharacter]>();
  readonly hpChanged = new Signal<[BaseCharacter, number, number]>();
  readonly attacked = new Signal<[BaseEnemy, number]>();

  constructor(stats: CharacterStats) {
    this.character_name = stats.name;
    this.max_hp = stats.max_hp;
    this.attack_damage = stats.attack_damage;
    this.attack_range = stats.attack_range;
    this.attack_speed = stats.attack_speed;
    this.color = stats.color;
    this.current_hp = this.max_hp;

    this.node.addChild(this.visual);
    this.node.addChild(this.hpBarBg);
    this.node.addChild(this.hpBarFill);
    this.buildVisual();
    this.updateHpBar();
  }

  /** Override to draw a custom body. Default is a 28×28 colored square. */
  protected buildVisual(): void {
    this.visual.clear();
    this.visual
      .roundRect(-14, -14, 28, 28, 4)
      .fill(Color.hex(this.color))
      .roundRect(-14, -14, 28, 28, 4)
      .stroke({ color: 0x000000, alpha: 0.5, width: 1 });
  }

  /** Override in subclasses (Guardian) to reduce incoming damage. */
  protected applyDamageReduction(amount: number): number {
    return amount;
  }

  /** Override for character-specific attack visuals (Striker projectile, Artificer projectile). */
  protected onAttack(target: BaseEnemy, damage: number, world: RunWorld): void {
    target.takeDamage(damage, this);
    this.attacked.emit(target, damage);
    void world;
  }

  /** Optional per-frame custom hook for subclasses (Medic heal aura). */
  protected onTick(_dt: number, _world: RunWorld): void {}

  update(dt: number, world: RunWorld): void {
    if (this.is_dead) return;
    this.attack_timer += dt;
    const effSpeed = this.attack_speed * GameState.power_attack_speed_multiplier;
    if (effSpeed > 0 && this.attack_timer >= 1 / effSpeed) {
      this.attack_timer = 0;
      this.tryAttack(world);
    }
    this.onTick(dt, world);
    this.node.x = this.position.x;
    this.node.y = this.position.y;
    this.updateHpBar();
  }

  protected tryAttack(world: RunWorld): void {
    const target = world.nearestEnemyWithin(this.position, this.attack_range);
    this.current_target = target;
    if (!target) return;
    const effDamage = this.attack_damage * GameState.power_damage_multiplier;
    this.onAttack(target, effDamage, world);
  }

  takeDamage(amount: number, source: { take_damage?: (amount: number, src: unknown) => void } | null = null): void {
    if (this.is_dead || this.intangible) return;
    let effective = amount * GameState.power_damage_taken_multiplier;
    effective = this.applyDamageReduction(effective);
    const ap = GameState.active_power as { onDamageReceived?: (a: number, s: unknown) => void } | null;
    ap?.onDamageReceived?.(effective, source);
    this.current_hp = Math.max(0, this.current_hp - effective);
    this.hpChanged.emit(this, this.current_hp, this.max_hp);
    GameState.damageDealt.emit(this as unknown as never, effective, { ...this.position });
    if (this.current_hp <= 0) this.die();
  }

  heal(amount: number): void {
    if (this.is_dead) return;
    this.current_hp = Math.min(this.max_hp, this.current_hp + amount);
    this.hpChanged.emit(this, this.current_hp, this.max_hp);
  }

  setIntangible(v: boolean): void {
    this.intangible = v;
    this.node.alpha = v ? 0.5 : 1.0;
  }

  protected die(): void {
    this.is_dead = true;
    this.node.visible = false;
    this.died.emit(this);
    GameState.registerCharacterDeath(this as unknown as never);
  }

  protected updateHpBar(): void {
    const w = 30;
    const h = 4;
    const x = -w / 2;
    const y = -22;
    this.hpBarBg.clear()
      .rect(x, y, w, h)
      .fill({ color: 0x333333, alpha: 0.85 });
    const ratio = this.max_hp > 0 ? this.current_hp / this.max_hp : 0;
    const fillCol = ratio > 0.4 ? 0x33e64d : ratio > 0.2 ? 0xe6c233 : 0xe64d33;
    this.hpBarFill.clear()
      .rect(x, y, w * ratio, h)
      .fill({ color: fillCol });
  }
}

/** Helper to register signal-compatible callbacks. Pixi-side classes use the
 *  base game-state signals which expect a node-like target; we cast for now and
 *  refine when GameState ports beyond Phase 1. */
GameState.characterDied.connect(() => undefined);
