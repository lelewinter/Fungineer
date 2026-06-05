/*
 * Characters — o "catálogo" dos heróis jogáveis.
 *
 * Cada classe herda de BaseCharacter e define o estilo de combate:
 *   - Guardian: tanque que reduz o dano recebido pela party.
 *   - Striker: dispara uma rajada de balas (uma por inimigo no alcance).
 *   - Medic: cura periodicamente o aliado com menos vida proporcional.
 *   - Artificer: lança um projétil lento teleguiado que explode em área.
 * No fim há o CHARACTER_FACTORIES, que mapeia um id de texto ("guardian") para
 * a função que cria o herói — usado quando o jogador resgata um personagem.
 */
import { BaseCharacter, type CharacterStats } from './BaseCharacter';
import type { BaseEnemy } from './BaseEnemy';
import type { RunWorld } from './RunWorld';
import { Color } from '../core/Color';
import { GameConfig } from '../state/GameConfig';
import { GameState } from '../state/GameState';
import { StrikerBullet, ArtificerProjectile } from './Projectiles';

// ── Guardian ─────────────────────────────────────────────────────────────
/** Tanque: blinda a party reduzindo uma porcentagem fixa do dano recebido. */
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

// ── Striker — rajada de balas ─────────────────────────────────────────────
/** Atirador: a cada ataque dispara uma bala para CADA inimigo dentro do
 *  alcance, todas ao mesmo tempo. */
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

  protected override tryAttack(world: RunWorld): void {
    const effDamage = this.attack_damage * GameState.power_damage_multiplier;
    const range = this.attack_range;
    let fired = 0;
    for (const e of world.enemies) {
      if (e.is_dead) continue;
      const dx = e.position.x - this.position.x;
      const dy = e.position.y - this.position.y;
      // Comparar distâncias ao quadrado evita a raiz quadrada (mais barato).
      const d2 = dx * dx + dy * dy;
      if (d2 <= range * range) {
        // Aqui sim normalizamos a direção (precisamos do vetor unitário p/ a bala).
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

// ── Medic — curandeiro ────────────────────────────────────────────────────
/** Curandeiro: a cada intervalo configurado, cura o aliado vivo com a menor
 *  fração de vida (o que está em pior estado proporcionalmente). */
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

  /** Encontra o aliado vivo com a menor fração vida/vida-máxima e o cura. */
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

// ── Artificer — projétil explosivo em área ────────────────────────────────
/** Lança um projétil lento e teleguiado que explode causando dano em área
 *  (AoE) ao redor do ponto de impacto. */
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

  // O Artificer já cria o projétil em tryAttack(); por isso o onAttack padrão
  // (dano corpo-a-corpo) fica vazio aqui, para não causar dano duplicado.
  protected override onAttack(_target: BaseEnemy, _dmg: number, _world: RunWorld): void {}
}

/** Registro de fábricas: associa um id de texto à função que cria o herói.
 *  Usado pelas ofertas de resgate (o jogo recebe "guardian" e cria um Guardian). */
export const CHARACTER_FACTORIES: Record<string, () => BaseCharacter> = {
  guardian: () => new Guardian(),
  striker: () => new Striker(),
  medic: () => new Medic(),
  artificer: () => new Artificer(),
};
