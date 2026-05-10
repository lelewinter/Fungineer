import type { BaseCharacter } from '../BaseCharacter';
import type { RunWorld } from '../RunWorld';
import { GameState } from '../../state/GameState';
import { GameConfig } from '../../state/GameConfig';
import { Signal } from '../../core/Signal';

/** Base class for all transformative powers. Subclasses override the virtuals. */
export class PowerResource {
  power_name = 'Power';
  description = '';
  cooldown = 0.0;
  duration = 0.0;
  icon_color = 0xffffff;
  is_active = false;
  cooldown_remaining = 0.0;
  duration_remaining = 0.0;

  /** Called when the player activates this power. */
  onActivate(_party: BaseCharacter[], _world: RunWorld): void {}

  /** Called when the power deactivates (duration end or toggle off). */
  onDeactivate(_party: BaseCharacter[], _world: RunWorld): void {}

  /** Per-frame tick while active or cooling down. */
  process(_dt: number, _party: BaseCharacter[], _world: RunWorld): void {}

  /** Called when the party takes damage (Reflective Shell hook). */
  onDamageReceived(_amount: number, _source: { take_damage?: (amount: number, src: unknown) => void } | null): void {}

  canActivate(): boolean {
    return this.cooldown_remaining <= 0 && !this.is_active;
  }
}

/** Holds the active power. Routes activation and process ticks. */
export class PowerManager {
  readonly powerActivated = new Signal<[PowerResource]>();
  readonly powerDeactivated = new Signal<[PowerResource]>();

  active_power: PowerResource | null = null;
  private world: RunWorld;

  constructor(world: RunWorld) {
    this.world = world;
  }

  setPower(power: PowerResource): void {
    if (this.active_power) this.deactivateCurrent();
    this.active_power = power;
    GameState.active_power = power;
    GameState.power_damage_multiplier = 1;
    GameState.power_attack_speed_multiplier = 1;
    GameState.power_damage_taken_multiplier = 1;
  }

  activate(): void {
    if (!this.active_power || !this.active_power.canActivate()) return;
    this.active_power.onActivate(this.world.characters, this.world);
    this.powerActivated.emit(this.active_power);
  }

  toggle(): void {
    if (!this.active_power) return;
    if (this.active_power.is_active) this.deactivateCurrent();
    else this.activate();
  }

  private deactivateCurrent(): void {
    if (!this.active_power) return;
    this.active_power.onDeactivate(this.world.characters, this.world);
    this.powerDeactivated.emit(this.active_power);
  }

  update(dt: number): void {
    const p = this.active_power;
    if (!p) return;
    const s = GameState.current_state;
    if (s !== 'PLAYING' && s !== 'BOSS_FIGHT') return;
    p.process(dt, this.world.characters, this.world);

    // MagnetPulse pull executed here (it needs world access).
    if (p instanceof MagnetPulse && p.is_active) this.processMagnetPull(dt);
  }

  private processMagnetPull(dt: number): void {
    const centroid = this.world.partyCentroid();
    for (const enemy of this.world.enemies) {
      if (enemy.is_dead || enemy.is_elite) continue;
      const dx = centroid.x - enemy.position.x;
      const dy = centroid.y - enemy.position.y;
      const dist = Math.hypot(dx, dy);
      if (dist <= GameConfig.MAGNET_PULSE_RADIUS && dist > 0.001) {
        const inv = 1 / dist;
        enemy.position.x += dx * inv * 60 * dt;
        enemy.position.y += dy * inv * 60 * dt;
      }
    }
  }
}

/** Forward declaration to break circular import. */
import { MagnetPulse } from './Powers';
