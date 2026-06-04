import { Container, Graphics } from 'pixi.js';
import { GameState, RunState } from '../state/GameState';
import { juice } from '../core/Juice';
import type { Party } from './Party';
import type { Vec2 } from '../core/types';

/** Small XP orb left behind by killed enemies. Auto-magnets to the party
 *  on overlap — no channel time, no bag cost. Each gem adds 1 XP to the
 *  run's level meter. Visually distinct from ResourceItems: bright green
 *  with a teal halo. */
export class ExperienceGem {
  position: Vec2 = { x: 0, y: 0 };
  readonly node = new Container();
  private g = new Graphics();
  private party: Party;
  private done = false;
  private spawnT = Math.random();
  private value: number;

  private drawAccumMs = 0;
  private static readonly DRAW_INTERVAL_MS = 1000 / 30;
  private static readonly MAGNET_R = 90;
  private static readonly PICKUP_R = 18;

  constructor(party: Party, value = 1) {
    this.party = party;
    this.value = value;
    this.node.addChild(this.g);
    this.draw();
  }

  update(dt: number): boolean {
    if (this.done) return false;
    const s = GameState.current_state;
    if (s !== RunState.PLAYING && s !== RunState.BOSS_FIGHT) return true;

    this.spawnT += dt;

    const dx = this.party.anchor.x - this.position.x;
    const dy = this.party.anchor.y - this.position.y;
    const dist = Math.hypot(dx, dy);

    // Magnet pull inside MAGNET_R; the closer, the faster. No channel time
    // because XP gems are the constant-flow part of the loop — VS feel.
    if (dist < ExperienceGem.MAGNET_R && dist > 0.5) {
      const pullSpeed = 320 + (1 - dist / ExperienceGem.MAGNET_R) * 560;
      const step = Math.min(dist, pullSpeed * dt);
      this.position.x += (dx / dist) * step;
      this.position.y += (dy / dist) * step;
    }

    if (dist <= ExperienceGem.PICKUP_R) {
      GameState.addXp(this.value);
      juice.shake(0.03, 4);
      this.done = true;
      return false;
    }

    this.node.x = this.position.x;
    this.node.y = this.position.y;
    this.drawAccumMs += dt * 1000;
    if (this.drawAccumMs >= ExperienceGem.DRAW_INTERVAL_MS) {
      this.drawAccumMs = 0;
      this.draw();
    }
    return true;
  }

  private draw(): void {
    const pulse = 0.85 + 0.15 * Math.sin(this.spawnT * 5);
    const r = 4;
    this.g.clear()
      .circle(0, 0, r * 2.4).fill({ color: 0x9aff6a, alpha: 0.10 * pulse })
      .circle(0, 0, r * 1.6).fill({ color: 0x9aff6a, alpha: 0.22 * pulse })
      .circle(0, 0, r).fill({ color: 0x6dffba, alpha: 1 })
      .circle(0, 0, r).stroke({ color: 0xddffd8, width: 1, alpha: 0.95 });
  }
}
