import { Container, Graphics, Text } from 'pixi.js';
import { Color } from '../core/Color';
import { GameConfig } from '../state/GameConfig';
import { GameState, RunState } from '../state/GameState';
import { FontFamily } from '../core/typography';
import type { Party } from './Party';
import type { Vec2 } from '../core/types';

/** Exit zone. Party entering triggers run victory. */
export class ExtractionPoint {
  readonly node = new Container();
  position: Vec2 = { x: 0, y: 0 };

  private party: Party;
  private triggered = false;
  private pulseTimer = 0;
  private g = new Graphics();
  private label: Text;

  constructor(party: Party) {
    this.party = party;
    this.node.addChild(this.g);
    this.label = new Text({
      text: 'EXIT',
      style: { fontFamily: FontFamily.mono, fontSize: 12, fill: 0x33ff99, fontWeight: '600', letterSpacing: 2 },
    });
    this.label.anchor.set(0.5);
    this.node.addChild(this.label);
  }

  reset(): void {
    this.triggered = false;
  }

  update(dt: number): void {
    if (this.triggered) return;
    if (GameState.current_state !== RunState.PLAYING) return;

    this.pulseTimer += dt;
    this.draw();
    this.node.x = this.position.x;
    this.node.y = this.position.y;

    const dist = Math.hypot(this.party.anchor.x - this.position.x, this.party.anchor.y - this.position.y);
    if (dist <= GameConfig.EXTRACTION_RADIUS) {
      this.triggered = true;
      GameState.endRun(true);
    }
  }

  private draw(): void {
    const r = GameConfig.EXTRACTION_RADIUS;
    const pulse = 0.6 + 0.4 * Math.sin(this.pulseTimer * 3);
    this.g.clear()
      .circle(0, 0, r)
      .fill({ color: Color.hex(Color.rgb(0.1, 0.8, 0.5)), alpha: 0.12 * pulse })
      .circle(0, 0, r)
      .stroke({ color: Color.hex(Color.rgb(0.2, 1.0, 0.6)), width: 2.5, alpha: 0.8 * pulse })
      .circle(0, 0, r * 0.6)
      .stroke({ color: Color.hex(Color.rgb(0.2, 1.0, 0.6)), width: 1.5, alpha: 0.4 * pulse });
    this.label.alpha = 0.9 * pulse;
  }
}
