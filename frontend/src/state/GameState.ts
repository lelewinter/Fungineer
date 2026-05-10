import { Signal } from '../core/Signal';
import { GameConfig } from './GameConfig';
import { HubState } from './HubState';
import type { Vec2 } from '../core/types';

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
    this.setState(RunState.PLAYING);
  }

  /** Called from a Scene's update() when state is PLAYING/BOSS_FIGHT. */
  tick(dt: number): void {
    if (this.current_state === RunState.PLAYING || this.current_state === RunState.BOSS_FIGHT) {
      this.run_time += dt;
    }
  }

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

  registerCharacterDeath(character: RunActor): void {
    this.party = this.party.filter((c) => c !== character);
    this.characterDied.emit(character);
    if (this.party.length === 0) this.endRun(false);
  }

  private setState(state: RunStateValue): void {
    this.current_state = state;
    this.stateChanged.emit(state);
  }
}

export const GameState = new GameStateClass();
