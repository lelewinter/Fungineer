import { Container } from 'pixi.js';
import type { BaseCharacter } from './BaseCharacter';
import type { BaseEnemy } from './BaseEnemy';
import type { ResourceItem } from './ResourceItem';
import type { Projectile } from './Projectiles';
import type { Vec2 } from '../core/types';

/** Container for all entities in a run. Owns the world transforms (arena coords)
 *  and provides spatial queries. The Pixi container `root` is what the run scene
 *  scrolls to implement the Godot Camera2D follow. */
export class RunWorld {
  readonly root = new Container();
  readonly bgLayer = new Container();
  readonly itemsLayer = new Container();
  readonly extractionLayer = new Container();
  readonly enemiesLayer = new Container();
  readonly partyLayer = new Container();
  readonly fxLayer = new Container();

  characters: BaseCharacter[] = [];
  enemies: BaseEnemy[] = [];
  items: ResourceItem[] = [];
  projectiles: Projectile[] = [];

  constructor() {
    this.root.addChild(this.bgLayer);
    this.root.addChild(this.extractionLayer);
    this.root.addChild(this.itemsLayer);
    this.root.addChild(this.enemiesLayer);
    this.root.addChild(this.partyLayer);
    this.root.addChild(this.fxLayer);
  }

  addCharacter(c: BaseCharacter): void {
    this.characters.push(c);
    this.partyLayer.addChild(c.node);
  }

  removeCharacter(c: BaseCharacter): void {
    this.characters = this.characters.filter((x) => x !== c);
  }

  addEnemy(e: BaseEnemy): void {
    this.enemies.push(e);
    this.enemiesLayer.addChild(e.node);
  }

  removeEnemy(e: BaseEnemy): void {
    this.enemies = this.enemies.filter((x) => x !== e);
  }

  addItem(it: ResourceItem): void {
    this.items.push(it);
    this.itemsLayer.addChild(it.node);
  }

  removeItem(it: ResourceItem): void {
    this.items = this.items.filter((x) => x !== it);
  }

  addProjectile(p: Projectile): void {
    this.projectiles.push(p);
    this.fxLayer.addChild(p.node);
  }

  removeProjectile(p: Projectile): void {
    this.projectiles = this.projectiles.filter((x) => x !== p);
  }

  updateProjectiles(dt: number): void {
    const next: Projectile[] = [];
    for (const p of this.projectiles) {
      if (p.update(dt, this)) {
        next.push(p);
      } else {
        p.node.parent?.removeChild(p.node);
        p.node.destroy({ children: true });
      }
    }
    this.projectiles = next;
  }

  // ── Spatial queries ────────────────────────────────────────────────────
  nearestEnemyWithin(p: Vec2, radius: number): BaseEnemy | null {
    let best: BaseEnemy | null = null;
    let bestDist = radius * radius;
    for (const e of this.enemies) {
      if (e.is_dead) continue;
      const dx = e.position.x - p.x;
      const dy = e.position.y - p.y;
      const d2 = dx * dx + dy * dy;
      if (d2 <= bestDist) {
        bestDist = d2;
        best = e;
      }
    }
    return best;
  }

  nearestCharacterTo(p: Vec2): BaseCharacter | null {
    let best: BaseCharacter | null = null;
    let bestDist = Infinity;
    for (const c of this.characters) {
      if (c.is_dead) continue;
      const dx = c.position.x - p.x;
      const dy = c.position.y - p.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < bestDist) {
        bestDist = d2;
        best = c;
      }
    }
    return best;
  }

  partyCentroid(): Vec2 {
    let sx = 0, sy = 0, n = 0;
    for (const c of this.characters) {
      if (c.is_dead) continue;
      sx += c.position.x;
      sy += c.position.y;
      n++;
    }
    if (n === 0) return { x: 0, y: 0 };
    return { x: sx / n, y: sy / n };
  }
}
