import { Container, Graphics } from 'pixi.js';
import { Color } from '../core/Color';
import { GameConfig } from '../state/GameConfig';
import { GameState, RunState } from '../state/GameState';
import { HubState } from '../state/HubState';
import { Signal } from '../core/Signal';
import type { Party } from './Party';
import type { Vec2 } from '../core/types';
import { audioManager } from '../core/AudioManager';
import { juice } from '../core/Juice';

/** Pickable resource in the arena. Stand still ≥1.5s within radius to collect. */
export class ResourceItem {
  readonly collected = new Signal<[string]>();

  resource_type = 'scrap';
  position: Vec2 = { x: 0, y: 0 };

  readonly node = new Container();
  private body = new Graphics();
  private progress = new Graphics();

  private party: Party;
  private collectionTimer = 0;
  private lastPartyX = 0;
  private lastPartyY = 0;
  private done = false;

  constructor(party: Party, resourceType: string) {
    this.party = party;
    this.resource_type = resourceType;
    this.lastPartyX = party.anchor.x;
    this.lastPartyY = party.anchor.y;
    this.node.addChild(this.body);
    this.node.addChild(this.progress);
    this.drawBody();
  }

  update(dt: number): boolean {
    if (this.done) return false;
    const s = GameState.current_state;
    if (s !== RunState.PLAYING && s !== RunState.BOSS_FIGHT) return true;

    const dx = this.party.anchor.x - this.position.x;
    const dy = this.party.anchor.y - this.position.y;
    const dist = Math.hypot(dx, dy);
    const inRange = dist <= GameConfig.RESOURCE_COLLECTION_RADIUS;

    const moved = Math.hypot(this.party.anchor.x - this.lastPartyX, this.party.anchor.y - this.lastPartyY);
    this.lastPartyX = this.party.anchor.x;
    this.lastPartyY = this.party.anchor.y;
    const still = moved < 3 * dt * 60;

    const backpackFull = GameState.backpack.length >= HubState.getBackpackCapacity();

    if (inRange && still && !backpackFull) {
      this.collectionTimer += dt;
      if (this.collectionTimer >= GameConfig.RESOURCE_COLLECTION_TIME) {
        if (GameState.addToBackpack(this.resource_type)) {
          this.collected.emit(this.resource_type);
          audioManager.playSfx('res://assets/audio/sfx/ui/Complete_01.wav', 0.45);
          juice.shake(0.08, 18);
          this.done = true;
          return false;
        } else {
          this.collectionTimer = 0;
        }
      }
    } else {
      this.collectionTimer = 0;
    }

    this.node.x = this.position.x;
    this.node.y = this.position.y;
    this.drawProgress(inRange);
    return true;
  }

  private drawBody(): void {
    const r = GameConfig.RESOURCE_ITEM_RADIUS;
    this.body.clear()
      .circle(0, 0, r).fill(Color.hex(Color.rgb(0.9, 0.7, 0.15)))
      .circle(0, 0, r).stroke({ color: 0xffffff, alpha: 0.45, width: 1.5 });
  }

  private drawProgress(inRange: boolean): void {
    this.progress.clear();
    if (!inRange || this.collectionTimer <= 0) return;
    const r = GameConfig.RESOURCE_ITEM_RADIUS + 5;
    const t = this.collectionTimer / GameConfig.RESOURCE_COLLECTION_TIME;
    const startAngle = -Math.PI * 0.5;
    const endAngle = startAngle + Math.PI * 2 * t;
    this.progress.arc(0, 0, r, startAngle, endAngle, false)
      .stroke({ color: Color.hex(Color.rgb(1.0, 0.95, 0.4)), width: 3 });
  }
}
