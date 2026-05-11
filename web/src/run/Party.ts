import type { BaseCharacter } from './BaseCharacter';
import type { RunWorld } from './RunWorld';
import { GameConfig } from '../state/GameConfig';
import { GameState } from '../state/GameState';
import type { Vec2 } from '../core/types';

/** Manages the player's squad. Positions characters in formation around an
 *  anchor that the DragController moves around the arena. */
export class Party {
  /** World-space anchor — DragController writes this. */
  anchor: Vec2 = { x: 0, y: 0 };
  private members: BaseCharacter[] = [];

  add(character: BaseCharacter, world: RunWorld): boolean {
    if (this.members.length >= GameConfig.MAX_PARTY_SIZE) return false;
    this.members.push(character);
    GameState.party.push(character as unknown as never);
    world.addCharacter(character);
    character.died.connect((c) => {
      this.members = this.members.filter((x) => x !== c);
    });
    this.updateFormation();
    return true;
  }

  reset(): void {
    this.members = [];
  }

  size(): number {
    return this.members.filter((m) => !m.is_dead).length;
  }

  rawMembers(): BaseCharacter[] {
    return this.members.slice();
  }

  update(): void {
    this.updateFormation();
  }

  private updateFormation(): void {
    let mult = 1;
    const power = GameState.active_power as { power_name?: string; is_active?: boolean } | null;
    if (power && power.power_name === 'Split Orbit' && power.is_active) {
      mult = GameConfig.SPLIT_ORBIT_SPREAD_MULT;
    }
    for (let i = 0; i < this.members.length; i++) {
      const offset = GameConfig.FORMATION_OFFSETS[i] ?? GameConfig.FORMATION_OFFSETS[0]!;
      this.members[i]!.position.x = this.anchor.x + offset.x * mult;
      this.members[i]!.position.y = this.anchor.y + offset.y * mult;
    }
  }
}
