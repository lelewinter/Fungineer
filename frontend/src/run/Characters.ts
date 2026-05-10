import { BaseCharacter, type CharacterStats } from './BaseCharacter';
import type { BaseEnemy } from './BaseEnemy';
import type { RunWorld } from './RunWorld';
import { Color } from '../core/Color';
import { GameConfig } from '../state/GameConfig';
import { GameState } from '../state/GameState';
import { StrikerBullet, ArtificerProjectile } from './Projectiles';

// ── Guardian ─────────────────────────────────────────────────────────────
export class Guardian extends BaseCharacter {
  constructor() {
    const stats: CharacterStats = {
      name: 'Guardian',
      max_hp: GameConfig.GUARDIAN_HP,
      attack_damage: GameConfig.GUARDIAN_DAMAGE,
      attack_range: GameConfig.GUARDIAN_ATTACK_RANGE,
      attack_speed: GameConfig.GUARDIAN_ATTACK_SPEED,
      color: Color.rgb(0.2, 0.4, 1.0),
    };
    super(stats);
  }

  protected override applyDamageReduction(amount: number): number {
    return amount * (1 - GameConfig.GUARDIAN_DAMAGE_REDUCTION);
  }
}

// ── Striker — radial-burst bullet attack ─────────────────────────────────
export class Striker extends BaseCharacter {
  constructor() {
    const stats: CharacterStats = {
      name: 'Striker',
      max_hp: GameConfig.STRIKER_HP,
      attack_damage: GameConfig.STRIKER_DAMAGE,
      attack_range: GameConfig.STRIKER_ATTACK_RANGE,
      attack_speed: GameConfig.STRIKER_ATTACK_SPEED,
      color: Color.rgb(0.0, 0.9, 0.9),
    };
    super(stats);
  }

  /** Override: fire one bullet per enemy in range simultaneously. */
  protected override tryAttack(world: RunWorld): void {
    const effDamage = this.attack_damage * GameState.power_damage_multiplier;
    const range = this.attack_range;
    let fired = 0;
    for (const e of world.enemies) {
      if (e.is_dead) continue;
      const dx = e.position.x - this.position.x;
      const dy = e.position.y - this.position.y;
      const d2 = dx * dx + dy * dy;
      if (d2 <= range * range) {
        const inv = 1 / Math.sqrt(d2 || 1);
        const dir = { x: dx * inv, y: dy * inv };
        world.addProjectile(new StrikerBullet({ ...this.position }, dir, effDamage));
        this.attacked.emit(e, effDamage);
        fired++;
      }
    }
    if (fired === 0) this.current_target = null;
  }
}

// ── Medic — heals lowest-HP ally every 5s ────────────────────────────────
export class Medic extends BaseCharacter {
  private healTimer = 0;

  constructor() {
    const stats: CharacterStats = {
      name: 'Medic',
      max_hp: GameConfig.MEDIC_HP,
      attack_damage: GameConfig.MEDIC_DAMAGE,
      attack_range: GameConfig.MEDIC_ATTACK_RANGE,
      attack_speed: GameConfig.MEDIC_ATTACK_SPEED,
      color: Color.rgb(0.2, 0.9, 0.3),
    };
    super(stats);
  }

  protected override onTick(dt: number, world: RunWorld): void {
    this.healTimer += dt;
    if (this.healTimer >= GameConfig.MEDIC_HEAL_INTERVAL) {
      this.healTimer = 0;
      this.healLowest(world);
    }
  }

  private healLowest(world: RunWorld): void {
    let lowest: BaseCharacter | null = null;
    let lowestRatio = 1.0;
    for (const m of world.characters) {
      if (m.is_dead) continue;
      const ratio = m.current_hp / m.max_hp;
      if (ratio < lowestRatio) {
        lowestRatio = ratio;
        lowest = m;
      }
    }
    lowest?.heal(GameConfig.MEDIC_HEAL_AMOUNT);
  }
}

// ── Artificer — slow homing AoE projectile ───────────────────────────────
export class Artificer extends BaseCharacter {
  constructor() {
    const stats: CharacterStats = {
      name: 'Artificer',
      max_hp: GameConfig.ARTIFICER_HP,
      attack_damage: GameConfig.ARTIFICER_DAMAGE,
      attack_range: GameConfig.ARTIFICER_ATTACK_RANGE,
      attack_speed: GameConfig.ARTIFICER_ATTACK_SPEED,
      color: Color.rgb(0.7, 0.2, 0.9),
    };
    super(stats);
  }

  protected override tryAttack(world: RunWorld): void {
    const target = world.nearestEnemyWithin(this.position, this.attack_range);
    this.current_target = target;
    if (!target) return;
    const damage = this.attack_damage * GameState.power_damage_multiplier;
    world.addProjectile(new ArtificerProjectile({ ...this.position }, target, damage));
  }

  // Suppress unused-import warning for ArtificerProjectile across full surface.
  protected override onAttack(_target: BaseEnemy, _dmg: number, _world: RunWorld): void {}
}

/** Factory registry — used by rescue offerings (string id → ctor). */
export const CHARACTER_FACTORIES: Record<string, () => BaseCharacter> = {
  guardian: () => new Guardian(),
  striker: () => new Striker(),
  medic: () => new Medic(),
  artificer: () => new Artificer(),
};
