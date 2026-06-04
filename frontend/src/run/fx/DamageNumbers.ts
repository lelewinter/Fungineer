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
  active: boolean;
}

const MAX_LIVE = 60;
const LIVE: FloatNum[] = [];

// Pre-allocate all Text objects — two style variants: normal (11px) and crit (14px).
// Color is applied via .tint (GPU-side, no texture re-render) so both pools use fill=white.
const FREE_NORMAL: FloatNum[] = [];
const FREE_CRIT: FloatNum[] = [];

function makeEntry(fontSize: number): FloatNum {
  const text = new Text({
    text: '',
    style: {
      fontFamily: FontFamily.mono,
      fontSize,
      fill: 0xffffff,
      fontWeight: '700',
      stroke: { color: 0x000000, width: 2 },
    },
  });
  text.anchor.set(0.5, 1);
  return { text, velocityY: 0, ttl: 0, elapsed: 0, active: false };
}

// Pre-warm pools
for (let i = 0; i < MAX_LIVE; i++) {
  FREE_NORMAL.push(makeEntry(11));
  FREE_CRIT.push(makeEntry(14));
}

function acquire(isCrit: boolean): FloatNum | null {
  const pool = isCrit ? FREE_CRIT : FREE_NORMAL;
  return pool.pop() ?? null;
}

function release(entry: FloatNum, isCrit: boolean): void {
  entry.active = false;
  entry.text.parent?.removeChild(entry.text);
  const pool = isCrit ? FREE_CRIT : FREE_NORMAL;
  pool.push(entry);
}

/** Spawn a short-lived floating damage number in world-space.
 *  Color: 0xff8080 for incoming (party hit), 0xffe899 for outgoing (enemy hit),
 *  0xff4d4d for crits/big hits. */
export function spawnDamageNumber(
  world: RunWorld,
  pos: Vec2,
  value: number,
  color: number = 0xffffff,
): void {
  const rounded = Math.max(1, Math.round(value));
  const isCrit = rounded >= 30;
  const entry = acquire(isCrit);
  if (!entry) return; // pool exhausted — drop silently
  entry.text.text = String(rounded);
  entry.text.tint = color;
  entry.text.x = pos.x + (Math.random() * 14 - 7);
  entry.text.y = pos.y - 14;
  entry.text.alpha = 1;
  entry.text.scale.set(1);
  entry.velocityY = -36 - Math.random() * 20;
  entry.ttl = 0.7;
  entry.elapsed = 0;
  entry.active = true;
  world.fxLayer.addChild(entry.text);
  LIVE.push(entry);
}

/** Per-frame tick — call once from the run scene update. */
export function updateDamageNumbers(dt: number): void {
  for (let i = LIVE.length - 1; i >= 0; i--) {
    const n = LIVE[i]!;
    n.elapsed += dt;
    const isCrit = n.text.style.fontSize === 14;
    if (n.elapsed >= n.ttl) {
      LIVE.splice(i, 1);
      release(n, isCrit);
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
