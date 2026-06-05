/**
 * GameState — O "placar ao vivo" de uma partida (run) em andamento.
 * ----------------------------------------------------------------
 * Em linguagem simples: enquanto o HubState guarda o progresso permanente da
 * base, o GameState cuida do que esta acontecendo AGORA numa missao: em que
 * fase do jogo estamos (jogando, pausado, luta de chefe, vitoria, derrota),
 * quanto tempo passou, quem esta vivo no grupo, quanta experiencia (XP) o
 * jogador acumulou, e os efeitos de "powers" ativos.
 *
 * Ele tambem dispara "avisos" (signals) quando coisas importantes acontecem
 * (subiu de nivel, alguem morreu, a run acabou) para que a UI e outros sistemas
 * possam reagir sem ficar checando o tempo todo.
 *
 * E um singleton: existe UMA instancia (`GameState`), exportada no fim.
 */

import { Signal } from '../core/Signal';
import { GameConfig } from './GameConfig';
import { HubState } from './HubState';
import type { Vec2 } from '../core/types';

// Os estados possiveis de uma run, como as "luzes" de um semaforo de partida.
export const RunState = {
  IDLE: 'IDLE',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  BOSS_FIGHT: 'BOSS_FIGHT',
  GAME_OVER: 'GAME_OVER',
  VICTORY: 'VICTORY',
} as const;

export type RunStateValue = (typeof RunState)[keyof typeof RunState];

/** A character or enemy participating in a run. Loose interface — the run
 *  systems implement BaseCharacter / BaseEnemy which both satisfy this shape. */
export interface RunActor {
  position: Vec2;
  is_dead: boolean;
}

class GameStateClass {
  current_state: RunStateValue = RunState.IDLE;
  run_time = 0;
  party: RunActor[] = [];
  tech_fragments_earned = 0;
  objective_captured = false;
  boss_defeated = false;
  backpack: string[] = [];

  // XP / level — VS-style. xp_current fills until xp_to_next, then level up
  // emits and resets the counter. Threshold grows linearly per level.
  level = 1;
  xp_current = 0;
  xp_to_next = 5;
  private static readonly XP_BASE = 5;
  private static readonly XP_STEP = 3;

  // Power state
  active_power: unknown = null;
  power_damage_multiplier = 1;
  power_attack_speed_multiplier = 1;
  power_damage_taken_multiplier = 1;
  siege_mode_active = false;

  // Signals
  readonly stateChanged = new Signal<[newState: RunStateValue]>();
  readonly characterDied = new Signal<[character: RunActor]>();
  readonly runEnded = new Signal<[victory: boolean, fragments: number]>();
  readonly fragmentCollected = new Signal<[amount: number]>();
  readonly waveStarted = new Signal<[waveIndex: number]>();
  readonly bossSpawned = new Signal<[]>();
  readonly damageDealt = new Signal<[target: RunActor, amount: number, position: Vec2]>();
  readonly backpackChanged = new Signal<[contents: string[]]>();
  readonly xpChanged = new Signal<[current: number, toNext: number, level: number]>();
  readonly leveledUp = new Signal<[level: number]>();

  // Zera tudo e comeca uma nova partida do estado "jogando".
  startRun(): void {
    this.run_time = 0;
    this.tech_fragments_earned = 0;
    this.objective_captured = false;
    this.boss_defeated = false;
    this.power_damage_multiplier = 1;
    this.power_attack_speed_multiplier = 1;
    this.power_damage_taken_multiplier = 1;
    this.siege_mode_active = false;
    this.backpack = [];
    this.backpackChanged.emit(this.backpack);
    this.level = 1;
    this.xp_current = 0;
    this.xp_to_next = GameStateClass.XP_BASE;
    this.xpChanged.emit(0, this.xp_to_next, 1);
    this.setState(RunState.PLAYING);
  }

  // Adiciona experiencia. Usa "while" (e nao "if") porque um unico ganho grande
  // pode subir varios niveis de uma vez; o excedente sobra para o proximo nivel.
  addXp(amount: number): void {
    this.xp_current += amount;
    while (this.xp_current >= this.xp_to_next) {
      this.xp_current -= this.xp_to_next;
      this.level += 1;
      this.xp_to_next = GameStateClass.XP_BASE + GameStateClass.XP_STEP * (this.level - 1);
      this.leveledUp.emit(this.level);
    }
    this.xpChanged.emit(this.xp_current, this.xp_to_next, this.level);
  }

  /** Called from a Scene's update() when state is PLAYING/BOSS_FIGHT. */
  tick(dt: number): void {
    if (this.current_state === RunState.PLAYING || this.current_state === RunState.BOSS_FIGHT) {
      this.run_time += dt;
    }
  }

  // Tenta guardar um recurso na mochila. Devolve false se a mochila estiver
  // cheia (a capacidade vem do HubState, que ja soma bonus de personagens).
  addToBackpack(resourceType: string): boolean {
    const capacity = HubState.getBackpackCapacity();
    if (this.backpack.length >= capacity) return false;
    this.backpack.push(resourceType);
    this.backpackChanged.emit(this.backpack);
    return true;
  }

  pauseForEvent(): void {
    if (this.current_state === RunState.PLAYING || this.current_state === RunState.BOSS_FIGHT) {
      this.setState(RunState.PAUSED);
    }
  }

  resumeFromEvent(): void {
    if (this.current_state === RunState.PAUSED) {
      this.setState(RunState.PLAYING);
    }
  }

  // Encerra a partida e calcula a recompensa final em fragmentos de tecnologia.
  // Vitoria com objetivo cumprido rende um bonus percentual; derrotar o chefe
  // rende um bonus fixo. Em seguida avisa o HubState e dispara o sinal de fim.
  endRun(victory: boolean): void {
    let finalFragments = this.tech_fragments_earned;
    if (victory && this.objective_captured) {
      finalFragments = Math.floor(finalFragments * (1 + GameConfig.TECH_FRAGMENTS_OBJECTIVE_BONUS));
    }
    if (victory && this.boss_defeated) {
      finalFragments += GameConfig.TECH_FRAGMENTS_BOSS_BONUS;
    }
    HubState.onRunEnded(victory);
    this.setState(victory ? RunState.VICTORY : RunState.GAME_OVER);
    this.runEnded.emit(victory, finalFragments);
  }

  // Registra a morte de um membro do grupo. Se o grupo inteiro morreu, a run
  // termina em derrota.
  registerCharacterDeath(character: RunActor): void {
    this.party = this.party.filter((c) => c !== character);
    this.characterDied.emit(character);
    if (this.party.length === 0) this.endRun(false);
  }

  // Unico ponto que troca o estado e avisa todo mundo (evita esquecer o emit).
  private setState(state: RunStateValue): void {
    this.current_state = state;
    this.stateChanged.emit(state);
  }
}

export const GameState = new GameStateClass();
