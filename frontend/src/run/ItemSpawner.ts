import { GameConfig } from '../state/GameConfig';
import type { RunWorld } from './RunWorld';
import type { Party } from './Party';
import type { Vec2 } from '../core/types';
import { ResourceItem } from './ResourceItem';

/** Weighted loot tables per enemy archetype. Smaller / common enemies favour
 *  the bulk-grind resources; bigger / elite enemies have a higher chance to
 *  drop the rarer types and a guaranteed drop on death. */
type EnemyKind = 'runner' | 'bruiser' | 'spitter' | 'sentinel';
const DROP_TABLE: Record<EnemyKind, Array<[string, number]>> = {
  runner:   [['scrap', 60], ['ai_components', 20], ['biomassa_adaptativa', 10], ['sinais_controle', 10]],
  bruiser:  [['scrap', 30], ['ai_components', 25], ['fragmentos_estruturais', 25], ['combustivel_volatil', 20]],
  spitter:  [['ai_components', 35], ['nucleo_logico', 30], ['sinais_controle', 20], ['biomassa_adaptativa', 15]],
  sentinel: [['nucleo_logico', 30], ['fragmentos_estruturais', 25], ['combustivel_volatil', 25], ['ai_components', 20]],
};

const DROP_CHANCE: Record<EnemyKind, number> = {
  runner: 0.45,
  bruiser: 0.85,
  spitter: 0.7,
  sentinel: 1.0, // every elite shed always drops
};

const ELITE_DROP_COUNT: Record<EnemyKind, number> = {
  runner: 1,
  bruiser: 2,
  spitter: 1,
  sentinel: 6,
};

export class ItemSpawner {
  private items: ResourceItem[] = [];
  private world: RunWorld;
  private party: Party;

  constructor(world: RunWorld, party: Party) {
    this.world = world;
    this.party = party;
  }

  /** Seed the arena with a handful of resources so the player has something
   *  to chase before the first kill drops something. */
  spawnResources(_resourceType: string = 'scrap'): void {
    const types: string[] = ['scrap', 'ai_components', 'nucleo_logico', 'combustivel_volatil', 'sinais_controle'];
    for (let i = 0; i < GameConfig.RESOURCE_SPAWN_COUNT * 2; i++) {
      const t = types[i % types.length]!;
      this.spawnAt(this.randomPosition(), t);
    }
  }

  /** Drop loot at a position when an enemy dies. Picks 0..n items from the
   *  archetype's weighted table. */
  dropFromEnemyKill(kind: EnemyKind, position: Vec2): void {
    if (Math.random() > DROP_CHANCE[kind]) return;
    const table = DROP_TABLE[kind];
    const count = ELITE_DROP_COUNT[kind];
    for (let i = 0; i < count; i++) {
      const type = pickWeighted(table);
      const jitter = 22;
      this.spawnAt(
        {
          x: position.x + (Math.random() - 0.5) * jitter * 2,
          y: position.y + (Math.random() - 0.5) * jitter * 2,
        },
        type,
      );
    }
  }

  private spawnAt(position: Vec2, resourceType: string): void {
    const item = new ResourceItem(this.party, resourceType);
    item.position = position;
    this.world.addItem(item);
    this.items.push(item);
  }

  update(dt: number): void {
    const next: ResourceItem[] = [];
    for (const it of this.items) {
      if (it.update(dt)) {
        next.push(it);
      } else {
        this.world.removeItem(it);
        it.node.parent?.removeChild(it.node);
        it.node.destroy({ children: true });
      }
    }
    this.items = next;
  }

  clear(): void {
    for (const it of this.items) {
      this.world.removeItem(it);
      it.node.parent?.removeChild(it.node);
      it.node.destroy({ children: true });
    }
    this.items = [];
  }

  private randomPosition(): { x: number; y: number } {
    const margin = 80;
    return {
      x: margin + Math.random() * (GameConfig.ARENA_WIDTH - margin * 2),
      y: margin + Math.random() * (GameConfig.ARENA_HEIGHT - margin * 2),
    };
  }
}

function pickWeighted(table: Array<[string, number]>): string {
  const total = table.reduce((s, [, w]) => s + w, 0);
  let r = Math.random() * total;
  for (const [t, w] of table) {
    r -= w;
    if (r <= 0) return t;
  }
  return table[0]![0];
}
