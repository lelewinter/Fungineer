/*
 * WaveSpawner — o "gerador de ondas" de inimigos.
 *
 * O que faz: faz os inimigos surgirem (spawn) em ondas que ficam cada vez mais
 * frequentes e fortes ao longo da partida — começa num gotejar e vira um
 * enxame, até o chefe aparecer como clímax. Cada onda aumenta a quantidade, a
 * composição (tipos de inimigo) e os atributos individuais. Um multiplicador de
 * "deterioração da zona" (HubState) torna tudo mais difícil entre runs.
 */
import { Signal } from '../core/Signal';
import { GameConfig } from '../state/GameConfig';
import { GameState, RunState } from '../state/GameState';
import { HubState } from '../state/HubState';
import type { BaseEnemy } from './BaseEnemy';
import type { RunWorld } from './RunWorld';

/** Função que cria um inimigo novo (cada tipo tem a sua). */
export type EnemyFactory = () => BaseEnemy;

/** Conjunto de fábricas, uma por tipo de inimigo que o spawner pode usar. */
export interface WaveFactories {
  runner: EnemyFactory;
  bruiser: EnemyFactory;
  spitter: EnemyFactory;
  sentinel: EnemyFactory;
}

// ── Ajustes de escalada de dificuldade (em segundos, salvo indicado) ─────────
const FIRST_SPAWN_DELAY = 2.5;   // a primeira onda chega rápido
const BASE_INTERVAL = 5.0;        // intervalo entre ondas no começo
const MIN_INTERVAL = 1.5;         // piso do intervalo — pressão no fim de jogo
const INTERVAL_STEP = 0.28;       // o intervalo encurta a cada onda
const ALIVE_CAP = 72;             // teto de inimigos vivos (performance + justiça)

/** Gera ondas de inimigos que escalam em frequência e força até a chegada do
 *  chefe. Veja o bloco no topo do arquivo para a visão geral. */
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

  /** (Re)inicia o ciclo de ondas do zero. */
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

  /** Roda todo frame: conta o tempo e decide quando soltar a próxima onda ou o
   *  chefe. Pausa/encerra conforme o estado do jogo. */
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

    // Passado o tempo de sobrevivência, o chefe entra como clímax (só uma vez).
    if (this.runTimer >= GameConfig.BOSS_SPAWN_TIME) {
      this.bossDone = true;
      this.spawnBoss();
      return;
    }

    // Conta regressiva até a próxima onda; ao zerar, dispara e reagenda.
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.wave += 1;
      this.spawnWave(this.wave);
      this.spawnTimer = Math.max(MIN_INTERVAL, BASE_INTERVAL - this.wave * INTERVAL_STEP);
      this.waveSpawned.emit(this.wave);
      this.waveCleared.emit(this.wave); // dispara as ofertas de resgate/poder por nº de onda
      GameState.waveStarted.emit(this.wave);
    }
  }

  /** Conta quantos inimigos ainda estão vivos (para respeitar o teto). */
  private aliveCount(): number {
    let n = 0;
    for (const e of this.world.enemies) if (!e.is_dead) n++;
    return n;
  }

  /** Monta a composição de uma onda. A quantidade cresce com o nº da onda; os
   *  tipos mais fortes só aparecem a partir de certas ondas. O multiplicador de
   *  deterioração da zona (det) aumenta as contagens. */
  private spawnWave(w: number): void {
    const det = HubState.getSpawnMultiplier(this.zoneId);
    const runners = Math.round((3 + Math.floor(w * 1.2)) * det);
    const bruisers = w >= 3 ? Math.round((1 + Math.floor(w / 4)) * det) : 0;   // Bruisers a partir da onda 3
    const spitters = w >= 5 ? Math.round((1 + Math.floor((w - 4) / 3)) * det) : 0; // Spitters a partir da onda 5

    for (let i = 0; i < runners; i++) this.spawnOne(this.factories.runner(), w, i);
    for (let i = 0; i < bruisers; i++) this.spawnOne(this.factories.bruiser(), w);
    for (let i = 0; i < spitters; i++) this.spawnOne(this.factories.spitter(), w);
  }

  /** Coloca um inimigo na arena: respeita o teto de vivos, escala atributos,
   *  possivelmente o promove a elite e o posiciona numa borda aleatória. */
  private spawnOne(enemy: BaseEnemy, w: number, idx = -1): void {
    if (this.aliveCount() >= ALIVE_CAP) return;
    this.scaleEnemy(enemy, w);
    // Da onda 6 em diante, a cada 5 runners 1 vira elite — alvo mais durão e
    // mais recompensador.
    if (idx >= 0 && w >= 6 && idx % 5 === 4) this.makeElite(enemy);
    enemy.position = this.randomEdgePosition();
    enemy.setWorld(this.world);
    this.world.addEnemy(enemy);
  }

  /** Aumenta vida, dano e velocidade do inimigo conforme o número da onda, para
   *  a sobrevivência ficar realmente mais difícil com o tempo. */
  private scaleEnemy(e: BaseEnemy, w: number): void {
    const hpMult = 1 + 0.08 * (w - 1);
    const dmgMult = 1 + 0.05 * (w - 1);
    const spdMult = Math.min(1.5, 1 + 0.03 * (w - 1));
    e.max_hp = Math.round(e.max_hp * hpMult);
    e.current_hp = e.max_hp;
    e.attack_damage = e.attack_damage * dmgMult;
    e.move_speed = e.move_speed * spdMult;
  }

  /** Promove um inimigo a elite: bem mais vida e mais dano. */
  private makeElite(e: BaseEnemy): void {
    e.is_elite = true;
    e.max_hp = Math.round(e.max_hp * 2.2);
    e.current_hp = e.max_hp;
    e.attack_damage = e.attack_damage * 1.4;
  }

  /** Cria o chefe no topo da arena e coloca o jogo no estado de luta de chefe. */
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

  /** Sorteia uma posição numa das 4 bordas da arena (topo, base, esquerda,
   *  direita), de onde os inimigos entram. */
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
