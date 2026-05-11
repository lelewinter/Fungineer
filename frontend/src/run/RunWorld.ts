import { Container } from 'pixi.js';
import type { BaseCharacter } from './BaseCharacter';
import type { BaseEnemy } from './BaseEnemy';
import type { ResourceItem } from './ResourceItem';
import type { Projectile } from './Projectiles';
import type { Party } from './Party';
import type { Vec2 } from '../core/types';
import { GameConfig } from '../state/GameConfig';

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

  /** Resolve enemy↔enemy and enemy↔party-anchor overlaps so enemies are
   *  solid bodies instead of phantoms the player walks through.
   *
   *  Algorithm: two passes of pairwise separation. For each overlap the
   *  pair is pushed apart half the penetration along the connecting axis.
   *  The party anchor uses a fixed radius (PARTY_ANCHOR_RADIUS) and is
   *  treated as immovable while in motion — the enemy gets shoved aside,
   *  the player keeps walking. Cheap O(N²) but N is typically <100. */
  private static readonly PARTY_ANCHOR_RADIUS = 22;
  resolveCollisions(party: Party): void {
    const arenaMinX = 0;
    const arenaMaxX = GameConfig.ARENA_WIDTH;
    const arenaMinY = 0;
    const arenaMaxY = GameConfig.ARENA_HEIGHT;

    // Enemy ↔ enemy stacking pass.
    for (let i = 0; i < this.enemies.length; i++) {
      const a = this.enemies[i]!;
      if (a.is_dead) continue;
      for (let j = i + 1; j < this.enemies.length; j++) {
        const b = this.enemies[j]!;
        if (b.is_dead) continue;
        const dx = b.position.x - a.position.x;
        const dy = b.position.y - a.position.y;
        const minDist = a.solid_radius + b.solid_radius;
        const distSq = dx * dx + dy * dy;
        if (distSq >= minDist * minDist || distSq < 1e-6) continue;
        const dist = Math.sqrt(distSq);
        const overlap = (minDist - dist) * 0.5;
        const nx = dx / dist;
        const ny = dy / dist;
        // Elites get pushed less so big bosses don't get bullied by minions.
        const aPush = b.is_elite && !a.is_elite ? overlap * 1.7 : overlap;
        const bPush = a.is_elite && !b.is_elite ? overlap * 1.7 : overlap;
        a.position.x -= nx * aPush;
        a.position.y -= ny * aPush;
        b.position.x += nx * bPush;
        b.position.y += ny * bPush;
      }
    }

    // Enemy ↔ party anchor pass. The anchor itself can't be repositioned
    // (DragController owns it and would overwrite our nudge next frame) so
    // we always push the *enemy* out.
    const pr = RunWorld.PARTY_ANCHOR_RADIUS;
    for (const e of this.enemies) {
      if (e.is_dead) continue;
      const dx = e.position.x - party.anchor.x;
      const dy = e.position.y - party.anchor.y;
      const minDist = pr + e.solid_radius;
      const distSq = dx * dx + dy * dy;
      if (distSq >= minDist * minDist) continue;
      let nx: number;
      let ny: number;
      let push: number;
      if (distSq < 1e-6) {
        // Perfectly overlapping — pick an arbitrary axis so we don't divide
        // by zero. Tiny random tilt keeps stuck enemies from snapping.
        nx = 1;
        ny = 0;
        push = minDist;
      } else {
        const dist = Math.sqrt(distSq);
        nx = dx / dist;
        ny = dy / dist;
        push = minDist - dist;
      }
      e.position.x += nx * push;
      e.position.y += ny * push;
    }

    // Clamp every enemy back inside the arena after the shoves so they
    // can't get pushed through a wall.
    for (const e of this.enemies) {
      if (e.is_dead) continue;
      const r = e.solid_radius;
      e.position.x = Math.max(arenaMinX + r, Math.min(arenaMaxX - r, e.position.x));
      e.position.y = Math.max(arenaMinY + r, Math.min(arenaMaxY - r, e.position.y));
    }
  }
}
