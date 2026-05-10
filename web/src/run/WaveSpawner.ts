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

/** Timer-driven wave system. Reads counts from GameConfig, applies the zone's
 *  deterioration multiplier from HubState. */
export class WaveSpawner {
  readonly waveSpawned = new Signal<[number]>();
  readonly waveCleared = new Signal<[number]>();
  readonly bossSpawned = new Signal<[]>();
  readonly allWavesClear = new Signal<[]>();

  private running = false;
  private runTimer = 0;
  private wave1Done = false;
  private wave2Done = false;
  private bossDone = false;
  private wave1Cleared = false;
  private wave2Cleared = false;
  private wave1Alive = 0;
  private wave2Alive = 0;
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
    this.wave1Done = false;
    this.wave2Done = false;
    this.bossDone = false;
    this.wave1Cleared = false;
    this.wave2Cleared = false;
    this.wave1Alive = 0;
    this.wave2Alive = 0;
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

    if (!this.wave1Done && this.runTimer >= GameConfig.WAVE_1_DELAY) {
      this.wave1Done = true;
      this.spawnWave1();
    }
    if (!this.wave2Done && this.runTimer >= GameConfig.WAVE_2_DELAY) {
      this.wave2Done = true;
      this.spawnWave2();
    }
    if (!this.bossDone && this.runTimer >= GameConfig.BOSS_SPAWN_TIME) {
      this.bossDone = true;
      this.spawnBoss();
    }
  }

  private spawnWave1(): void {
    const mult = HubState.getSpawnMultiplier(this.zoneId);
    const runners = Math.round(GameConfig.WAVE_1_RUNNER_COUNT * mult);
    const bruisers = Math.round(GameConfig.WAVE_1_BRUISER_COUNT * mult);
    for (let i = 0; i < runners; i++) this.spawnWaveEnemy(this.factories.runner(), 1);
    for (let i = 0; i < bruisers; i++) this.spawnWaveEnemy(this.factories.bruiser(), 1);
    this.waveSpawned.emit(1);
    GameState.waveStarted.emit(1);
  }

  private spawnWave2(): void {
    const mult = HubState.getSpawnMultiplier(this.zoneId);
    const runners = Math.round(GameConfig.WAVE_2_RUNNER_COUNT * mult);
    const bruisers = Math.round(GameConfig.WAVE_2_BRUISER_COUNT * mult);
    const spitters = Math.round(GameConfig.WAVE_2_SPITTER_COUNT * mult);
    for (let i = 0; i < runners; i++) this.spawnWaveEnemy(this.factories.runner(), 2);
    for (let i = 0; i < bruisers; i++) this.spawnWaveEnemy(this.factories.bruiser(), 2);
    for (let i = 0; i < spitters; i++) this.spawnWaveEnemy(this.factories.spitter(), 2);
    this.waveSpawned.emit(2);
    GameState.waveStarted.emit(2);
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

  private spawnWaveEnemy(enemy: BaseEnemy, wave: number): void {
    enemy.position = this.randomEdgePosition();
    enemy.setWorld(this.world);
    this.world.addEnemy(enemy);
    if (wave === 1) {
      this.wave1Alive += 1;
      enemy.died.connect(() => this.onWave1EnemyDied());
    } else if (wave === 2) {
      this.wave2Alive += 1;
      enemy.died.connect(() => this.onWave2EnemyDied());
    }
  }

  private onWave1EnemyDied(): void {
    this.wave1Alive -= 1;
    if (this.wave1Alive <= 0 && !this.wave1Cleared) {
      this.wave1Cleared = true;
      this.waveCleared.emit(1);
    }
  }

  private onWave2EnemyDied(): void {
    this.wave2Alive -= 1;
    if (this.wave2Alive <= 0 && !this.wave2Cleared) {
      this.wave2Cleared = true;
      this.waveCleared.emit(2);
      if (!this.bossDone) {
        this.bossDone = true;
        this.spawnBoss();
      }
    }
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
