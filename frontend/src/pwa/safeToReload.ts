/**
 * safeToReload — gate that decides whether it's OK to swap the SW now.
 *
 * The rule: never reload while the player is in an active run. Runs are
 * the in-game scenes under `scenes/runs/*` — losing them mid-fight is the
 * worst possible UX. Hub/WorldMap/Boot are safe (no in-flight game state).
 *
 * Implementation: we ask the SceneManager which Scene is current and compare
 * its class name against a small allowlist of "lobby-ish" scenes. We keep
 * the allowlist here (not on each scene) so the PWA module stays the single
 * source of truth and doesn't couple every scene to PWA logic.
 */

import { sceneManager } from '../core/SceneManager';

// Scenes where reloading is safe. Match by constructor name so we don't have
// to import every scene class (would create a circular dep with main.ts).
const SAFE_SCENES: ReadonlySet<string> = new Set([
  'BootScene',
  'HubScene',
  'WorldMapScene',
  'ZoneRoom',
]);

export function isSafeToReload(): boolean {
  const current = sceneManager.getCurrent();
  if (!current) return true; // no scene yet = boot in progress, safe
  return SAFE_SCENES.has(current.constructor.name);
}

/** Subscribe to scene changes — fires whenever the current scene swaps.
 *  Returns an unsubscribe function. We poll because SceneManager doesn't
 *  emit a signal today; cheap (200ms) and not on the hot path. */
export function onSceneChange(cb: (safe: boolean) => void): () => void {
  let last = sceneManager.getCurrent()?.constructor.name ?? null;
  const timer = window.setInterval(() => {
    const now = sceneManager.getCurrent()?.constructor.name ?? null;
    if (now !== last) {
      last = now;
      cb(isSafeToReload());
    }
  }, 200);
  return () => window.clearInterval(timer);
}
