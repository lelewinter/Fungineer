import { Text } from 'pixi.js';
import { FontFamily } from '../../core/typography';
import { audioManager } from '../../core/AudioManager';
import type { RunWorld } from '../RunWorld';
import type { Vec2 } from '../../core/types';

interface FloatNum {
  text: Text;
  velocityY: number;
  ttl: number;
  elapsed: number;
}

const POOL: FloatNum[] = [];
const MAX_LIVE = 60;

/** Spawn a short-lived floating damage number in world-space.
 *  Color: 0xff8080 for incoming (party hit), 0xffe899 for outgoing (enemy hit),
 *  0xff4d4d for crits/big hits. */
export function spawnDamageNumber(
  world: RunWorld,
  pos: Vec2,
  value: number,
  color: number = 0xffffff,
): void {
  if (POOL.length >= MAX_LIVE) {
    const overflow = POOL.shift();
    if (overflow) {
      overflow.text.parent?.removeChild(overflow.text);
      overflow.text.destroy();
    }
  }
  const rounded = Math.max(1, Math.round(value));
  const text = new Text({
    text: String(rounded),
    style: {
      fontFamily: FontFamily.mono,
      fontSize: rounded >= 30 ? 14 : 11,
      fill: color,
      fontWeight: '700',
      stroke: { color: 0x000000, width: 2 },
    },
  });
  text.anchor.set(0.5, 1);
  text.x = pos.x + (Math.random() * 14 - 7);
  text.y = pos.y - 14;
  world.fxLayer.addChild(text);
  POOL.push({ text, velocityY: -36 - Math.random() * 20, ttl: 0.7, elapsed: 0 });
}

/** Per-frame tick — call once from the run scene update. */
export function updateDamageNumbers(dt: number): void {
  for (let i = POOL.length - 1; i >= 0; i--) {
    const n = POOL[i]!;
    n.elapsed += dt;
    if (n.elapsed >= n.ttl) {
      n.text.parent?.removeChild(n.text);
      n.text.destroy();
      POOL.splice(i, 1);
      continue;
    }
    const t = n.elapsed / n.ttl;
    n.text.y += n.velocityY * dt;
    n.text.alpha = 1 - t * t;
    n.text.scale.set(1 + t * 0.15);
  }
}

/** Audio bank for combat events. */
export const CombatSfx = {
  hit: (volume: number = 0.4): void => {
    audioManager.playSfx('res://assets/audio/sfx/ui/Confirm_06.wav', volume);
  },
  bossHit: (volume: number = 0.55): void => {
    audioManager.playSfx('res://assets/audio/sfx/ui/Confirm_04.wav', volume);
  },
  death: (volume: number = 0.5): void => {
    audioManager.playSfx('res://assets/audio/sfx/ui/Complete_02.wav', volume);
  },
  partyHit: (volume: number = 0.45): void => {
    audioManager.playSfx('res://assets/audio/sfx/ui/Click_01.wav', volume);
  },
  waveStart: (): void => {
    audioManager.playSfx('res://assets/audio/sfx/ui/Confirm_07.wav', 0.6);
  },
  bossSpawn: (): void => {
    audioManager.playSfx('res://assets/audio/sfx/ui/Complete_01.wav', 0.8);
  },
};
