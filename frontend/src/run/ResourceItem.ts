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

/** Pickable resource in the arena. Channel-time pickup: the player must
 *  stand within the collection radius for CHANNEL_S seconds. The pickup
 *  shows a filling ring while charging; leaving the radius resets it.
 *
 *  This is the *risky* part of the loop — while you're channeling on a
 *  drop, enemies catch up. Tradeoff: stop and grab, or keep moving. */
export class ResourceItem {
  readonly collected = new Signal<[string]>();

  resource_type = 'scrap';
  position: Vec2 = { x: 0, y: 0 };

  readonly node = new Container();
  private body = new Graphics();
  private ring = new Graphics();
  private party: Party;
  private done = false;
  private spawnT = 0;
  private channelT = 0;

  private drawBodyAccumMs = 0;
  private static readonly DRAW_BODY_INTERVAL_MS = 1000 / 30;

  private lastChannelT = -1;
  private lastInRange = false;
  private lastBackpackFull = false;

  private static readonly CHANNEL_S = 0.6;

  constructor(party: Party, resourceType: string) {
    this.party = party;
    this.resource_type = resourceType;
    this.node.addChild(this.body);
    this.node.addChild(this.ring);
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
    const inRange = dist <= GameConfig.RESOURCE_COLLECTION_RADIUS;
    const backpackFull = GameState.backpack.length >= HubState.getBackpackCapacity();

    if (inRange && !backpackFull) {
      this.channelT += dt;
      if (this.channelT >= ResourceItem.CHANNEL_S) {
        if (GameState.addToBackpack(this.resource_type)) {
          this.collected.emit(this.resource_type);
          Juice.shake(0.06, 8);
          this.done = true;
          return false;
        }
      }
    } else {
      // Leaving the radius unwinds the channel quickly — not instantly so a
      // brief drift-by doesn't waste the work entirely.
      this.channelT = Math.max(0, this.channelT - dt * 2.2);
    }

    this.node.x = this.position.x;
    this.node.y = this.position.y;
    this.drawBodyAccumMs += dt * 1000;
    if (this.drawBodyAccumMs >= ResourceItem.DRAW_BODY_INTERVAL_MS) {
      this.drawBodyAccumMs = 0;
      this.drawBody(backpackFull);
    }
    if (
      Math.abs(this.channelT - this.lastChannelT) > 0.01 ||
      inRange !== this.lastInRange ||
      backpackFull !== this.lastBackpackFull
    ) {
      this.lastChannelT = this.channelT;
      this.lastInRange = inRange;
      this.lastBackpackFull = backpackFull;
      this.drawRing(inRange, backpackFull);
    }
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

  private drawRing(inRange: boolean, backpackFull: boolean): void {
    this.ring.clear();
    if (this.channelT <= 0 || backpackFull) return;
    const vis = RESOURCE_VISUALS[this.resource_type] ?? RESOURCE_VISUALS.scrap!;
    const r = GameConfig.RESOURCE_ITEM_RADIUS + 6;
    const t = Math.min(1, this.channelT / ResourceItem.CHANNEL_S);
    const startAngle = -Math.PI * 0.5;
    const endAngle = startAngle + Math.PI * 2 * t;
    this.ring.arc(0, 0, r, startAngle, endAngle, false)
      .stroke({ color: vis.glow, width: 3, alpha: inRange ? 0.95 : 0.5 });
  }
}
