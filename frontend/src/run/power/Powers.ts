/*
 * Powers — o "catálogo" de poderes que o jogador pode equipar.
 *
 * Cada poder herda de PowerResource e mexe em multiplicadores globais do
 * GameState para mudar o jogo. Há dois estilos:
 *   - Passivo: efeito automático (Siege Mode, Reflective Shell).
 *   - Alternável/Ativo: ligado pelo jogador, alguns com duração e recarga
 *     (Split Orbit, Overclock, Magnet Pulse, Ghost Drive).
 * Todo poder tem um lado bom e um custo (trade-off), para gerar decisão.
 */
import { PowerResource } from './PowerManager';
import type { BaseCharacter } from '../BaseCharacter';
import type { RunWorld } from '../RunWorld';
import { GameState } from '../../state/GameState';
import { GameConfig } from '../../state/GameConfig';

// ── Siege Mode ───────────────────────────────────────────────────────────────
/** Passivo. Parado ≥1,5s → dano ×3. Em movimento → dano ×0,5. */
export class SiegeMode extends PowerResource {
  private wasActive = false;
  /** Carência inicial: ignora o efeito nos primeiros 2s da run. */
  private graceTimer = 2.0;

  constructor() {
    super();
    this.power_name = 'Siege Mode';
    this.description = 'Pare 1.5s: dano ×3. Em movimento: dano ×0.5.';
    this.icon_color = 0xe6a319;
  }

  override process(dt: number): void {
    // Durante a carência, não faz nada (deixa a run "engrenar").
    if (this.graceTimer > 0) {
      this.graceTimer -= dt;
      return;
    }
    // "siege_mode_active" é ligado pelo DragController quando a party fica parada.
    // Parada → bônus de dano; movendo → penalidade. O wasActive evita reescrever
    // o multiplicador toda hora à toa, só nas transições (e mantém na penalidade
    // enquanto estiver em movimento).
    const active = GameState.siege_mode_active;
    if (active && !this.wasActive) {
      GameState.power_damage_multiplier = GameConfig.SIEGE_MODE_DAMAGE_MULTIPLIER;
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
/** Alternável. Espalha a formação (×2 de largura), mas dano recebido +30%. */
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
/** Ativo por 10s. Velocidade de ataque ×2,5, mas a party perde 5 HP/s enquanto
 *  ativo. Depois entra em recarga. */
export class Overclock extends PowerResource {
  private durationLeft = 0; // duração restante do efeito ativo

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
    this.durationLeft = this.duration;
    GameState.power_attack_speed_multiplier = GameConfig.OVERCLOCK_ATTACK_MULT;
  }

  override onDeactivate(_party: BaseCharacter[], _world: RunWorld): void {
    this.is_active = false;
    this.cooldown_remaining = this.cooldown;
    GameState.power_attack_speed_multiplier = 1;
  }

  override process(dt: number, party: BaseCharacter[], world: RunWorld): void {
    // Conta a recarga mesmo quando não está ativo.
    if (this.cooldown_remaining > 0) {
      this.cooldown_remaining = Math.max(0, this.cooldown_remaining - dt);
    }
    if (!this.is_active) return;
    this.durationLeft -= dt;
    // Dreno de vida: tira HP por segundo, mas nunca mata (mínimo 1).
    for (const m of party) {
      if (!m.is_dead) m.current_hp = Math.max(1, m.current_hp - GameConfig.OVERCLOCK_HP_DRAIN * dt);
    }
    if (this.durationLeft <= 0) this.onDeactivate(party, world); // acabou a duração
  }
}

// ── Magnet Pulse ─────────────────────────────────────────────────────────────
/** Alternável. Puxa os Runners para perto da party; em troca, os Elites causam
 *  +20% de dano enquanto ativo. (O "puxão" é feito pelo PowerManager.) */
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
/** Passivo. Devolve 25% do dano recebido ao atacante; em troca, o ataque da
 *  party cai para ×0,65. */
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
    // Só reflete se estiver ativo e a fonte do dano souber receber dano de volta.
    if (!this.is_active || !source?.take_damage) return;
    const reflect = amount * GameConfig.REFLECTIVE_SHELL_REFLECT_PCT;
    source.take_damage(reflect, null);
  }
}

// ── Ghost Drive ──────────────────────────────────────────────────────────────
/** Ativo por 3s. Deixa a party intangível (atravessa/não toma dano). */
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
    if (this.durationLeft <= 0) this.onDeactivate(party, world); // fim da intangibilidade
  }
}
