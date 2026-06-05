/*
 * Party — o esquadrão do jogador.
 *
 * O que faz: guarda os personagens recrutados e os posiciona em formação ao
 * redor de um ponto-âncora (o "anchor"). Quem move o anchor pela arena é o
 * DragController; a Party só cuida de manter cada herói no seu lugar relativo.
 */
import type { BaseCharacter } from './BaseCharacter';
import type { RunWorld } from './RunWorld';
import { GameConfig } from '../state/GameConfig';
import { GameState } from '../state/GameState';
import type { Vec2 } from '../core/types';

/** Gerencia o esquadrão do jogador e o mantém em formação ao redor do anchor. */
export class Party {
  /** Ponto-âncora em coordenadas do mundo — quem escreve aqui é o DragController. */
  anchor: Vec2 = { x: 0, y: 0 };
  private members: BaseCharacter[] = [];

  /** Tenta recrutar um personagem. Retorna false se a party já está cheia. */
  add(character: BaseCharacter, world: RunWorld): boolean {
    if (this.members.length >= GameConfig.MAX_PARTY_SIZE) return false;
    this.members.push(character);
    GameState.party.push(character as unknown as never);
    character.world = world;
    world.addCharacter(character);
    // Quando o personagem morre, ele se remove sozinho da lista de membros.
    character.died.connect((c) => {
      this.members = this.members.filter((x) => x !== c);
    });
    this.updateFormation();
    return true;
  }

  reset(): void {
    this.members = [];
  }

  /** Quantidade de membros ainda vivos. */
  size(): number {
    return this.members.filter((m) => !m.is_dead).length;
  }

  /** Cópia da lista de membros (cópia para quem chama não mexer na lista interna). */
  rawMembers(): BaseCharacter[] {
    return this.members.slice();
  }

  update(): void {
    this.updateFormation();
  }

  /** Reposiciona cada membro em torno do anchor usando offsets fixos de formação.
   *  O poder "Split Orbit", quando ativo, espalha a formação multiplicando os
   *  offsets. */
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
