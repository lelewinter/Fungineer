import { GameConfig } from '../state/GameConfig';
import type { RunWorld } from './RunWorld';
import type { Party } from './Party';
import { ResourceItem } from './ResourceItem';

export class ItemSpawner {
  private items: ResourceItem[] = [];
  private world: RunWorld;
  private party: Party;

  constructor(world: RunWorld, party: Party) {
    this.world = world;
    this.party = party;
  }

  spawnResources(resourceType: string = 'scrap'): void {
    for (let i = 0; i < GameConfig.RESOURCE_SPAWN_COUNT; i++) {
      const item = new ResourceItem(this.party, resourceType);
      item.position = this.randomPosition();
      this.world.addItem(item);
      this.items.push(item);
    }
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
