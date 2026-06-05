/*
 * ItemSpawner — espalha itens de recurso coletáveis pela arena.
 *
 * O que faz: cria vários ResourceItem em posições aleatórias, atualiza todos a
 * cada frame e remove os que já foram coletados (limpando seus gráficos).
 */
import { GameConfig } from '../state/GameConfig';
import type { RunWorld } from './RunWorld';
import type { Party } from './Party';
import { ResourceItem } from './ResourceItem';

/** Gera e gerencia os itens de recurso espalhados pela arena. */
export class ItemSpawner {
  private items: ResourceItem[] = [];
  private world: RunWorld;
  private party: Party;

  constructor(world: RunWorld, party: Party) {
    this.world = world;
    this.party = party;
  }

  /** Cria a leva inicial de recursos em posições aleatórias. */
  spawnResources(resourceType: string = 'scrap'): void {
    for (let i = 0; i < GameConfig.RESOURCE_SPAWN_COUNT; i++) {
      const item = new ResourceItem(this.party, resourceType);
      item.position = this.randomPosition();
      this.world.addItem(item);
      this.items.push(item);
    }
  }

  /** Atualiza todos os itens; descarta os que foram coletados (update → false). */
  update(dt: number): void {
    const next: ResourceItem[] = [];
    for (const it of this.items) {
      if (it.update(dt)) next.push(it);
      else this.dispose(it);
    }
    this.items = next;
  }

  /** Remove todos os itens de uma vez (ao encerrar/reiniciar a run). */
  clear(): void {
    for (const it of this.items) this.dispose(it);
    this.items = [];
  }

  /** Tira um item do mundo e libera seus gráficos da memória do Pixi. */
  private dispose(it: ResourceItem): void {
    this.world.removeItem(it);
    it.node.parent?.removeChild(it.node);
    it.node.destroy({ children: true });
  }

  /** Sorteia uma posição dentro da arena, longe das bordas (margem de 80px). */
  private randomPosition(): { x: number; y: number } {
    const margin = 80;
    return {
      x: margin + Math.random() * (GameConfig.ARENA_WIDTH - margin * 2),
      y: margin + Math.random() * (GameConfig.ARENA_HEIGHT - margin * 2),
    };
  }
}
