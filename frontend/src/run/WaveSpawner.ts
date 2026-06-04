import { Signal } from '../core/Signal';
import { GameConfig } from '../state/GameConfig';
import { GameState, RunState } from '../state/GameState';
import { HubState } from '../state/HubState';
import type { BaseEnemy } from './BaseEnemy';
import type { RunWorld } from './RunWorld';

export type EnemyFactory = () => BaseEnemy;

export interface WaveFactories {
  runner: EnemyFactory;
  bruiser: EnemyFactory;
  spitter: EnemyFactory;
  sentinel: EnemyFactory;
}

// ── Escalation tuning ──────────────────────────────────────────────────────
const FIRST_SPAWN_DELAY = 2.5;   // first wave lands quickly
const BASE_INTERVAL = 5.0;        // seconds between waves, early
const MIN_INTERVAL = 1.5;         // floor — late-game pressure
const INTERVAL_STEP = 0.28;       // interval shrinks each wave
const ALIVE_CAP = 72;             // never overwhelm (perf + fairness)

/**
 * Escalating survival spawner. Instead of two fixed waves, enemies keep
 * coming on a shortening interval; counts, composition and per-enemy stats
 * all ramp with the wave number, so the run builds from a trickle to a swarm
 * before the boss arrives as the climax. The zone's deterioration multiplier
 * (HubState) scales counts on top of that — long-term cross-run difficulty.
 */
export class WaveSpawner {
  readonly waveSpawned = new Signal<[number]>();
  readonly waveCleared = new Signal<[number]>();
  readonly bossSpawned = new Signal<[]>();
  readonly allWavesClear = new Signal<[]>();

  private running = false;
  private runTimer = 0;
  private spawnTimer = FIRST_SPAWN_DELAY;
  private wave = 0;
  private bossDone = false;
  private zoneId = 0;
  private factories: WaveFactories;
  private world: RunWorld;

  constructor(world: RunWorld, factories: WaveFactories, zoneId = 0) {
    this.world = world;
    this.factories = factories;
    this.zoneId = zoneId;
  }

  start(): void {
    this.running = true;
    this.runTimer = 0;
    this.spawnTimer = FIRST_SPAWN_DELAY;
    this.wave = 0;
    this.bossDone = false;
  }

  stop(): void {
    this.running = false;
  }

  update(dt: number): void {
    if (!this.running) return;
    const s = GameState.current_state;
    if (s === RunState.GAME_OVER || s === RunState.VICTORY) {
      this.running = false;
      return;
    }
    if (s === RunState.PAUSED) return;

    this.runTimer += dt;
    if (this.bossDone) return;

    // Boss arrives as the climax once the survival window elapses.
    if (this.runTimer >= GameConfig.BOSS_SPAWN_TIME) {
      this.bossDone = true;
      this.spawnBoss();
      return;
    }

    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.wave += 1;
      this.spawnWave(this.wave);
      this.spawnTimer = Math.max(MIN_INTERVAL, BASE_INTERVAL - this.wave * INTERVAL_STEP);
      this.waveSpawned.emit(this.wave);
      this.waveCleared.emit(this.wave); // drives rescue/power offers by wave #
      GameState.waveStarted.emit(this.wave);
    }
  }

  private aliveCount(): number {
    let n = 0;
    for (const e of this.world.enemies) if (!e.is_dead) n++;
    return n;
  }

  private spawnWave(w: number): void {
    const det = HubState.getSpawnMultiplier(this.zoneId);
    const runners = Math.round((3 + Math.floor(w * 1.2)) * det);
    const bruisers = w >= 3 ? Math.round((1 + Math.floor(w / 4)) * det) : 0;
    const spitters = w >= 5 ? Math.round((1 + Math.floor((w - 4) / 3)) * det) : 0;

    for (let i = 0; i < runners; i++) this.spawnOne(this.factories.runner(), w, i);
    for (let i = 0; i < bruisers; i++) this.spawnOne(this.factories.bruiser(), w);
    for (let i = 0; i < spitters; i++) this.spawnOne(this.factories.spitter(), w);
  }

  private spawnOne(enemy: BaseEnemy, w: number, idx = -1): void {
    if (this.aliveCount() >= ALIVE_CAP) return;
    this.scaleEnemy(enemy, w);
    // From wave 6 on, every 5th runner is an elite — a tougher, juicier target.
    if (idx >= 0 && w >= 6 && idx % 5 === 4) this.makeElite(enemy);
    enemy.position = this.randomEdgePosition();
    enemy.setWorld(this.world);
    this.world.addEnemy(enemy);
  }

  /** Ramp per-enemy stats with the wave so survival gets genuinely harder. */
  private scaleEnemy(e: BaseEnemy, w: number): void {
    const hpMult = 1 + 0.08 * (w - 1);
    const dmgMult = 1 + 0.05 * (w - 1);
    const spdMult = Math.min(1.5, 1 + 0.03 * (w - 1));
    e.max_hp = Math.round(e.max_hp * hpMult);
    e.current_hp = e.max_hp;
    e.attack_damage = e.attack_damage * dmgMult;
    e.move_speed = e.move_speed * spdMult;
  }

  private makeElite(e: BaseEnemy): void {
    e.is_elite = true;
    e.max_hp = Math.round(e.max_hp * 2.2);
    e.current_hp = e.max_hp;
    e.attack_damage = e.attack_damage * 1.4;
  }

  private spawnBoss(): void {
    const boss = this.factories.sentinel();
    boss.position = { x: GameConfig.ARENA_WIDTH * 0.5, y: 80 };
    boss.setWorld(this.world);
    this.world.addEnemy(boss);
    this.bossSpawned.emit();
    GameState.bossSpawned.emit();
    GameState.current_state = RunState.BOSS_FIGHT;
    GameState.stateChanged.emit(RunState.BOSS_FIGHT);
  }

  private randomEdgePosition(): { x: number; y: number } {
    const edge = Math.floor(Math.random() * 4);
    const W = GameConfig.ARENA_WIDTH;
    const H = GameConfig.ARENA_HEIGHT;
    const rand = (a: number, b: number): number => a + Math.random() * (b - a);
    switch (edge) {
      case 0: return { x: rand(40, W - 40), y: 20 };
      case 1: return { x: rand(40, W - 40), y: H - 20 };
      case 2: return { x: 20, y: rand(40, H - 40) };
      default: return { x: W - 20, y: rand(40, H - 40) };
    }
  }
}
