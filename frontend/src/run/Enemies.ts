/*
 * Enemies — o "catálogo" de inimigos concretos da arena.
 *
 * Cada classe aqui herda de BaseEnemy e ajusta números (vida, dano, velocidade)
 * e, às vezes, comportamentos especiais:
 *   - Runner: o básico, corre reto até a party.
 *   - Bruiser: tanque que prioriza o Guardian (ou o aliado com mais vida).
 *   - Spitter: atira de longe e tenta manter distância (kiting).
 *   - SentinelCore: o chefe, com duas fases, investida (dash), invocação de
 *     reforços, orbe teleguiado e janelas de vulnerabilidade.
 *
 * Como se encaixa: o WaveSpawner instancia esses inimigos a cada onda e o
 * RunWorld os simula. Os números vêm sempre do GameConfig (balanceamento).
 */
import { Color } from '../core/Color';
import { Signal } from '../core/Signal';
import { GameConfig } from '../state/GameConfig';
import { GameState } from '../state/GameState';
import { BaseEnemy, type EnemyStats } from './BaseEnemy';
import type { BaseCharacter } from './BaseCharacter';
import type { RunWorld } from './RunWorld';
import { Guardian } from './Characters';
import { SpitterProjectile, SentinelOrb } from './Projectiles';

// ── Runner — Rastreador MK-I ─────────────────────────────────────────────────
/** Inimigo básico: simplesmente corre em linha reta até o aliado mais próximo. */
export class Runner extends BaseEnemy {
  constructor() {
    const stats: EnemyStats = {
      name: 'Rastreador MK-I',
      max_hp: GameConfig.RUNNER_HP,
      move_speed: GameConfig.RUNNER_SPEED,
      attack_damage: GameConfig.RUNNER_DAMAGE,
      attack_interval: GameConfig.RUNNER_ATTACK_INTERVAL,
      attack_range: GameConfig.RUNNER_ATTACK_RANGE,
      color: Color.rgb(0.95, 0.12, 0.28),
      is_elite: false,
    };
    super(stats);
  }
}

// ── Bruiser — Enforcer-7 ─────────────────────────────────────────────────────
/** Tanque elite que mira preferencialmente no Guardian; sem Guardian vivo,
 *  vai atrás do aliado com mais vida (o mais "durão"). */
export class Bruiser extends BaseEnemy {
  constructor() {
    const stats: EnemyStats = {
      name: 'Enforcer-7',
      max_hp: GameConfig.BRUISER_HP,
      move_speed: GameConfig.BRUISER_SPEED,
      attack_damage: GameConfig.BRUISER_DAMAGE,
      attack_interval: GameConfig.BRUISER_ATTACK_INTERVAL,
      attack_range: GameConfig.BRUISER_ATTACK_RANGE,
      color: Color.rgb(0.50, 0.05, 0.55),
      is_elite: true,
    };
    super(stats);
  }

  protected override findTarget(world: RunWorld): void {
    let best: BaseCharacter | null = null;
    let bestHp = -1;
    for (const m of world.characters) {
      if (m.is_dead) continue;
      // Guardian tem prioridade máxima: achou um vivo, para a busca.
      if (m instanceof Guardian) { best = m; break; }
      if (m.current_hp > bestHp) {
        bestHp = m.current_hp;
        best = m;
      }
    }
    this.current_target = best;
  }
}

// ── Spitter — Canhão Orbital ─────────────────────────────────────────────────
/** Atirador elite: mantém uma distância preferida do alvo (recua se chega perto
 *  demais, avança devagar se está longe demais) e dispara projéteis. */
export class Spitter extends BaseEnemy {
  constructor() {
    const stats: EnemyStats = {
      name: 'Canhão Orbital',
      max_hp: GameConfig.SPITTER_HP,
      move_speed: GameConfig.SPITTER_SPEED,
      attack_damage: GameConfig.SPITTER_DAMAGE,
      attack_interval: GameConfig.SPITTER_ATTACK_INTERVAL,
      attack_range: GameConfig.SPITTER_RANGE,
      color: Color.rgb(0.95, 0.80, 0.05),
      is_elite: true,
    };
    super(stats);
  }

  protected override move(dt: number): void {
    const t = this.current_target;
    if (!t) return;
    const dx = t.position.x - this.position.x;
    const dy = t.position.y - this.position.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 0.001) return;
    const inv = 1 / dist;
    const pref = GameConfig.SPITTER_PREFERRED_DISTANCE;
    // sign = +1 avança em direção ao alvo, -1 recua. Dentro de uma "zona morta"
    // ao redor da distância preferida ele fica parado (speed = 0).
    let speed = 0;
    let sign = 1;
    if (dist < pref * 0.8) { speed = this.move_speed; sign = -1; }        // perto demais: recua na velocidade cheia
    else if (dist > pref * 1.3) { speed = this.move_speed * 0.5; sign = 1; } // longe demais: aproxima devagar
    this.position.x += dx * inv * speed * sign * dt;
    this.position.y += dy * inv * speed * sign * dt;
  }

  protected override attack(target: BaseCharacter): void {
    const dx = target.position.x - this.position.x;
    const dy = target.position.y - this.position.y;
    const dist = Math.hypot(dx, dy) || 1;
    const dir = { x: dx / dist, y: dy / dist };
    if (this.world) {
      this.world.addProjectile(new SpitterProjectile({ ...this.position }, dir, this.attack_damage));
    }
  }
}

// ── Sentinel Core (chefe) ────────────────────────────────────────────────────
/**
 * O chefe da run. Ideia central: ele só pode ser ferido quando está
 * VULNERÁVEL. Ele alterna entre investidas (dash) — durante as quais é
 * invulnerável — e janelas curtas de vulnerabilidade logo após bater na parede.
 * Tem duas fases: ao perder vida suficiente, fica mais agressivo (fase 2 com
 * orbe teleguiado e reforços mais fortes).
 */
export class SentinelCore extends BaseEnemy {
  // Sinais que a HUD/cena escutam para reagir a mudanças de fase e janelas.
  readonly phaseChanged = new Signal<[number]>();
  readonly becameVulnerable = new Signal<[]>();
  readonly becameInvulnerable = new Signal<[]>();

  phase: 1 | 2 = 1;
  isDashing = false;
  isVulnerable = false;
  // Cada timer conta o tempo até a próxima ação (dash, reforços, orbe) ou o
  // tempo restante da janela de vulnerabilidade.
  private dashTimer = 0;
  private addTimer = 0;
  private orbTimer = 0;
  private vulnTimer = 0;
  private dashDir = { x: 1, y: 0 };

  constructor() {
    const stats: EnemyStats = {
      name: 'Núcleo Sentinela Δ-9',
      max_hp: GameConfig.SENTINEL_HP,
      move_speed: 0,
      attack_damage: 0,
      attack_interval: 1,
      attack_range: 0,
      color: Color.rgb(0.9, 0.9, 0.1),
      is_elite: true,
    };
    super(stats);
  }

  protected override buildVisual(): void {
    this.visual.clear();
    this.visual
      .rect(-24, -24, 48, 48)
      .fill(Color.hex(this.color))
      .rect(-24, -24, 48, 48)
      .stroke({ color: 0xffffff, alpha: 0.7, width: 2 });
  }

  protected override updateHpBar(): void {
    const w = 80;
    const h = 6;
    const x = -w / 2;
    const y = -32;
    this.hpBarBg.clear()
      .rect(x, y, w, h)
      .fill({ color: 0x111111, alpha: 0.85 });
    const ratio = this.current_hp / this.max_hp;
    this.hpBarFill.clear()
      .rect(x, y, w * ratio, h)
      .fill({ color: 0xe6c819 });
  }

  /** O chefe tem um update próprio (não usa o de BaseEnemy): coordena fases,
   *  dash, reforços, orbe e o fechamento da janela de vulnerabilidade. */
  override update(dt: number, world: RunWorld): void {
    if (this.is_dead) return;
    this.findTarget(world);
    this.checkPhaseTransition();
    this.tickDash(dt);
    this.tickAdds(dt, world);
    if (this.phase === 2) this.tickOrb(dt, world);
    // Fecha a janela de vulnerabilidade quando o tempo dela acaba.
    if (this.isVulnerable) {
      this.vulnTimer += dt;
      if (this.vulnTimer >= GameConfig.SENTINEL_VULNERABLE_WINDOW) {
        this.isVulnerable = false;
        this.becameInvulnerable.emit();
      }
    }
    this.node.x = this.position.x;
    this.node.y = this.position.y;
    this.updateHpBar();
  }

  /** Passa para a fase 2 quando a vida cai abaixo do limiar configurado. */
  private checkPhaseTransition(): void {
    if (this.phase === 1 && this.current_hp / this.max_hp <= GameConfig.SENTINEL_PHASE2_THRESHOLD) {
      this.phase = 2;
      this.color = Color.rgb(1.0, 0.4, 0.0);
      this.buildVisual();
      this.phaseChanged.emit(2);
    }
  }

  /** Lógica da investida (dash). Se já está investindo, desliza em linha reta
   *  até bater numa parede (aí abre a janela de vulnerabilidade). Senão, conta
   *  o intervalo até começar a próxima investida. */
  private tickDash(dt: number): void {
    if (this.isDashing) {
      this.position.x += this.dashDir.x * GameConfig.SENTINEL_DASH_SPEED * dt;
      this.position.y += this.dashDir.y * GameConfig.SENTINEL_DASH_SPEED * dt;
      // Considera "bateu na parede" ao chegar perto de qualquer borda da arena.
      let hitWall = false;
      if (this.position.x <= 40 || this.position.x >= GameConfig.ARENA_WIDTH - 40) hitWall = true;
      if (this.position.y <= 40 || this.position.y >= GameConfig.ARENA_HEIGHT - 40) hitWall = true;
      if (hitWall) {
        this.endDash();
      } else {
        // Atropelar: quem encostar no chefe durante a investida toma dano.
        const t = this.current_target;
        if (t && !t.is_dead) {
          const dx = t.position.x - this.position.x;
          const dy = t.position.y - this.position.y;
          if (Math.hypot(dx, dy) < 40) t.takeDamage(30, this);
        }
      }
      return;
    }

    const interval = this.phase === 1 ? GameConfig.SENTINEL_DASH_INTERVAL_P1 : GameConfig.SENTINEL_DASH_INTERVAL_P2;
    this.dashTimer += dt;
    if (this.dashTimer >= interval) {
      this.dashTimer = 0;
      this.startDash();
    }
  }

  /** Começa uma investida na direção do alvo atual; vira invulnerável. */
  private startDash(): void {
    const t = this.current_target;
    if (!t) return;
    this.isDashing = true;
    this.isVulnerable = false;
    const dx = t.position.x - this.position.x;
    const dy = t.position.y - this.position.y;
    const len = Math.hypot(dx, dy) || 1;
    this.dashDir = { x: dx / len, y: dy / len };
    this.becameInvulnerable.emit();
  }

  /** Fim da investida (bateu na parede): abre a janela de vulnerabilidade —
   *  o único momento em que o chefe pode tomar dano. */
  private endDash(): void {
    this.isDashing = false;
    this.isVulnerable = true;
    this.vulnTimer = 0;
    this.becameVulnerable.emit();
  }

  /** Conta o tempo até invocar a próxima leva de reforços (adds). */
  private tickAdds(dt: number, world: RunWorld): void {
    const interval = this.phase === 1 ? GameConfig.SENTINEL_ADD_INTERVAL_P1 : GameConfig.SENTINEL_ADD_INTERVAL_P2;
    this.addTimer += dt;
    if (this.addTimer >= interval) {
      this.addTimer = 0;
      this.spawnAdds(world);
    }
  }

  /** Invoca reforços: alguns Runners ao redor do chefe e, na fase 2, também um
   *  Bruiser. Os Runners nascem em círculo (ângulo aleatório, raio 80). */
  private spawnAdds(world: RunWorld): void {
    const count = GameConfig.SENTINEL_ADD_COUNT_P1;
    for (let i = 0; i < count; i++) {
      const runner = new Runner();
      const angle = Math.random() * Math.PI * 2;
      runner.position = {
        x: this.position.x + Math.cos(angle) * 80,
        y: this.position.y + Math.sin(angle) * 80,
      };
      runner.setWorld(world);
      world.addEnemy(runner);
    }
    if (this.phase === 2) {
      const bruiser = new Bruiser();
      bruiser.position = {
        x: this.position.x + (Math.random() * 200 - 100),
        y: this.position.y + (Math.random() * 200 - 100),
      };
      bruiser.setWorld(world);
      world.addEnemy(bruiser);
    }
  }

  /** (Fase 2) Conta o tempo até disparar o próximo orbe teleguiado. */
  private tickOrb(dt: number, world: RunWorld): void {
    this.orbTimer += dt;
    if (this.orbTimer >= GameConfig.SENTINEL_ORB_INTERVAL) {
      this.orbTimer = 0;
      this.fireOrb(world);
    }
  }

  /** Dispara um orbe que persegue o primeiro personagem vivo encontrado. */
  private fireOrb(world: RunWorld): void {
    let target: BaseCharacter | null = null;
    for (const m of world.characters) {
      if (!m.is_dead) { target = m; break; }
    }
    if (!target) return;
    world.addProjectile(new SentinelOrb({ ...this.position }, target, world));
  }

  /** Só sofre dano quando está vulnerável; fora disso, ignora golpes. */
  override takeDamage(amount: number, source: BaseCharacter | null = null): void {
    if (!this.isVulnerable) return;
    super.takeDamage(amount, source);
  }

  /** Morte do chefe = vitória da run. */
  protected override die(): void {
    this.is_dead = true;
    GameState.boss_defeated = true;
    this.died.emit(this);
    GameState.endRun(true);
    if (this.world) this.world.removeEnemy(this);
    this.node.parent?.removeChild(this.node);
    this.node.destroy({ children: true });
  }
}
