import { PowerResource } from './PowerManager';
import type { BaseCharacter } from '../BaseCharacter';
import type { RunWorld } from '../RunWorld';
import { GameState } from '../../state/GameState';
import { GameConfig } from '../../state/GameConfig';

// ── Siege Mode ───────────────────────────────────────────────────────────────
/** Passive. Stillness ≥ 1.5s → damage ×3. Moving → ×0.5. */
export class SiegeMode extends PowerResource {
  private wasActive = false;
  private graceTimer = 2.0;

  constructor() {
    super();
    this.power_name = 'Siege Mode';
    this.description = 'Pare 1.5s: dano ×3. Em movimento: dano ×0.5.';
    this.icon_color = 0xe6a319;
  }

  override process(dt: number): void {
    if (this.graceTimer > 0) {
      this.graceTimer -= dt;
      return;
    }
    const lvl = this.levelMult();
    const active = GameState.siege_mode_active;
    if (active && !this.wasActive) {
      GameState.power_damage_multiplier = GameConfig.SIEGE_MODE_DAMAGE_MULTIPLIER * lvl;
      this.wasActive = true;
    } else if (!active && this.wasActive) {
      GameState.power_damage_multiplier = GameConfig.SIEGE_MODE_DAMAGE_PENALTY;
      this.wasActive = false;
    } else if (!active) {
      GameState.power_damage_multiplier = GameConfig.SIEGE_MODE_DAMAGE_PENALTY;
    }
  }
}

// ── Split Orbit ──────────────────────────────────────────────────────────────
/** Toggle. Party spread ×2. Damage taken +30%. */
export class SplitOrbit extends PowerResource {
  constructor() {
    super();
    this.power_name = 'Split Orbit';
    this.description = 'Formação ×2 de largura. Dano recebido +30%.';
    this.icon_color = 0x4db1ff;
  }

  override onActivate(): void {
    this.is_active = true;
    GameState.power_damage_taken_multiplier = GameConfig.SPLIT_ORBIT_DAMAGE_TAKEN_MULT;
  }

  override onDeactivate(): void {
    this.is_active = false;
    GameState.power_damage_taken_multiplier = 1;
  }
}

// ── Overclock ────────────────────────────────────────────────────────────────
/** Active 10s. Attack speed ×2.5. Party loses 5 HP/s while active. */
export class Overclock extends PowerResource {
  private durationLeft = 0;

  constructor() {
    super();
    this.power_name = 'Overclock';
    this.description = 'Vel. ataque ×2.5 por 10s. Party perde 5 HP/s.';
    this.cooldown = GameConfig.OVERCLOCK_COOLDOWN;
    this.duration = GameConfig.OVERCLOCK_DURATION;
    this.icon_color = 0xff4d00;
  }

  override onActivate(_party: BaseCharacter[], _world: RunWorld): void {
    this.is_active = true;
    this.durationLeft = this.duration * this.levelMult();
    GameState.power_attack_speed_multiplier = GameConfig.OVERCLOCK_ATTACK_MULT * this.levelMult();
  }

  override onDeactivate(_party: BaseCharacter[], _world: RunWorld): void {
    this.is_active = false;
    this.cooldown_remaining = this.cooldown;
    GameState.power_attack_speed_multiplier = 1;
  }

  override process(dt: number, party: BaseCharacter[], world: RunWorld): void {
    if (this.cooldown_remaining > 0) {
      this.cooldown_remaining = Math.max(0, this.cooldown_remaining - dt);
    }
    if (!this.is_active) return;
    this.durationLeft -= dt;
    for (const m of party) {
      if (!m.is_dead) m.current_hp = Math.max(1, m.current_hp - GameConfig.OVERCLOCK_HP_DRAIN * dt);
    }
    if (this.durationLeft <= 0) this.onDeactivate(party, world);
  }
}

// ── Magnet Pulse ─────────────────────────────────────────────────────────────
/** Toggle. Pulls Runners. Elites deal +20% damage. */
export class MagnetPulse extends PowerResource {
  constructor() {
    super();
    this.power_name = 'Magnet Pulse';
    this.description = 'Puxa Runners. Elites causam +20% de dano enquanto ativo.';
    this.icon_color = 0x66ccff;
    this.hasMagnetPull = true;
  }

  override onActivate(): void {
    this.is_active = true;
    GameState.power_damage_taken_multiplier = GameConfig.MAGNET_PULSE_ELITE_DAMAGE_MULT;
  }

  override onDeactivate(): void {
    this.is_active = false;
    GameState.power_damage_taken_multiplier = 1;
  }
}

// ── Reflective Shell ─────────────────────────────────────────────────────────
/** Passive. Reflect 25% damage. Attack ×0.65. */
export class ReflectiveShell extends PowerResource {
  constructor() {
    super();
    this.power_name = 'Reflective Shell';
    this.description = 'Reflete 25% do dano recebido. Ataque ×0.65.';
    this.icon_color = 0xccccd9;
  }

  override onActivate(): void {
    this.is_active = true;
    GameState.power_damage_multiplier = GameConfig.REFLECTIVE_SHELL_ATTACK_PENALTY;
  }

  override onDeactivate(): void {
    this.is_active = false;
    GameState.power_damage_multiplier = 1;
  }

  override onDamageReceived(amount: number, source: { take_damage?: (amount: number, src: unknown) => void } | null): void {
    if (!this.is_active || !source?.take_damage) return;
    const reflect = amount * GameConfig.REFLECTIVE_SHELL_REFLECT_PCT;
    source.take_damage(reflect, null);
  }
}

// ── Ghost Drive ──────────────────────────────────────────────────────────────
/** Active 3s. Party intangible. Cannot capture. */
export class GhostDrive extends PowerResource {
  private durationLeft = 0;

  constructor() {
    super();
    this.power_name = 'Ghost Drive';
    this.description = 'Party intangível por 3s.';
    this.cooldown = GameConfig.GHOST_DRIVE_COOLDOWN;
    this.duration = GameConfig.GHOST_DRIVE_DURATION;
    this.icon_color = 0xb3b3ff;
  }

  override onActivate(party: BaseCharacter[], _world: RunWorld): void {
    this.is_active = true;
    this.durationLeft = this.duration;
    for (const m of party) m.setIntangible(true);
  }

  override onDeactivate(party: BaseCharacter[], _world: RunWorld): void {
    this.is_active = false;
    this.cooldown_remaining = this.cooldown;
    for (const m of party) m.setIntangible(false);
  }

  override process(dt: number, party: BaseCharacter[], world: RunWorld): void {
    if (this.cooldown_remaining > 0) {
      this.cooldown_remaining = Math.max(0, this.cooldown_remaining - dt);
    }
    if (!this.is_active) return;
    this.durationLeft -= dt;
    if (this.durationLeft <= 0) this.onDeactivate(party, world);
  }
}
