import { Container, Graphics } from 'pixi.js';
import { GameConfig } from '../state/GameConfig';
import { GameState, RunState } from '../state/GameState';
import { HubState } from '../state/HubState';
import { Signal } from '../core/Signal';
import { Juice } from './fx/Juice';
import type { Party } from './Party';
import type { Vec2 } from '../core/types';

const RESOURCE_VISUALS: Record<string, { core: number; glow: number; sigil?: string }> = {
  scrap:                  { core: 0xb8b3a6, glow: 0xe8e0cc, sigil: '◇' },
  ai_components:          { core: 0x4dc7b9, glow: 0x9eece4, sigil: '◆' },
  nucleo_logico:          { core: 0x6e9bff, glow: 0xc4d6ff, sigil: '☉' },
  combustivel_volatil:    { core: 0xff7a3a, glow: 0xffd0a6, sigil: '⛁' },
  sinais_controle:        { core: 0xa1ffaa, glow: 0xddffd8, sigil: '⌇' },
  biomassa_adaptativa:    { core: 0xb573d8, glow: 0xe2c2ff, sigil: '♣' },
  fragmentos_estruturais: { core: 0xe8c061, glow: 0xfff0c8, sigil: '▣' },
};

/** Pickable resource in the arena.
 *
 *  Vampire-Survivors-style: auto-collect on overlap. The party doesn't have
 *  to stop — touching the pickup with the collection radius drops it
 *  straight into the backpack. If the backpack is full, the item stays on
 *  the ground and visibly dims so the player knows to extract first. */
export class ResourceItem {
  readonly collected = new Signal<[string]>();

  resource_type = 'scrap';
  position: Vec2 = { x: 0, y: 0 };

  readonly node = new Container();
  private body = new Graphics();
  private party: Party;
  private done = false;
  private spawnT = 0;

  constructor(party: Party, resourceType: string) {
    this.party = party;
    this.resource_type = resourceType;
    this.node.addChild(this.body);
    this.drawBody();
  }

  update(dt: number): boolean {
    if (this.done) return false;
    const s = GameState.current_state;
    if (s !== RunState.PLAYING && s !== RunState.BOSS_FIGHT) return true;

    this.spawnT += dt;

    const dx = this.party.anchor.x - this.position.x;
    const dy = this.party.anchor.y - this.position.y;
    const dist = Math.hypot(dx, dy);

    const backpackFull = GameState.backpack.length >= HubState.getBackpackCapacity();

    // Magnet-pull inside the collection radius — pickup floats toward party
    // so the auto-collect feels chunky/responsive even at sprint speeds.
    const magnetR = GameConfig.RESOURCE_COLLECTION_RADIUS * 1.8;
    if (!backpackFull && dist < magnetR && dist > 0.5) {
      const pullSpeed = 220 + (1 - dist / magnetR) * 380;
      const step = Math.min(dist, pullSpeed * dt);
      this.position.x += (dx / dist) * step;
      this.position.y += (dy / dist) * step;
    }

    if (!backpackFull && dist <= GameConfig.RESOURCE_COLLECTION_RADIUS) {
      if (GameState.addToBackpack(this.resource_type)) {
        this.collected.emit(this.resource_type);
        Juice.shake(0.06, 8);
        this.done = true;
        return false;
      }
    }

    this.node.x = this.position.x;
    this.node.y = this.position.y;
    this.drawBody(backpackFull);
    return true;
  }

  private drawBody(backpackFull = false): void {
    const r = GameConfig.RESOURCE_ITEM_RADIUS;
    const vis = RESOURCE_VISUALS[this.resource_type] ?? RESOURCE_VISUALS.scrap!;
    const alpha = backpackFull ? 0.35 : 1.0;
    const pulse = 0.85 + 0.15 * Math.sin(this.spawnT * 4 + this.position.x * 0.01);

    this.body.clear()
      .circle(0, 0, r * 1.8).fill({ color: vis.glow, alpha: 0.10 * alpha * pulse })
      .circle(0, 0, r * 1.3).fill({ color: vis.glow, alpha: 0.18 * alpha * pulse })
      .circle(0, 0, r).fill({ color: vis.core, alpha })
      .circle(0, 0, r).stroke({ color: vis.glow, width: 1.5, alpha: 0.85 * alpha });
  }
}
