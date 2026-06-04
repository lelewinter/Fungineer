/**
 * registerSW — wires the service worker into the running game.
 *
 *  1. Registers /sw.js on first load (production only).
 *  2. Polls for updates every UPDATE_CHECK_INTERVAL_MS so long-lived sessions
 *     don't get stuck on an old version — important for users who never
 *     close the tab (game in a PWA window).
 *  3. When `waiting` SW appears (a new version installed but not active):
 *       - if we're in a safe scene -> show the prompt banner immediately
 *       - else -> show the "queued" banner and wait for a safe scene
 *  4. On user accept, sends SKIP_WAITING, waits for `controllerchange`,
 *     then reloads exactly once (no infinite reload loop).
 *
 *  Why workbox-window?
 *   - It abstracts the lifecycle (installing/waiting/activated) into one
 *     event API. Hand-rolling the same is ~80 lines of fragile spec code.
 *   - Battle-tested across Chrome/Safari/Firefox edge cases.
 *
 *  iOS Safari notes:
 *   - registration.update() works but is throttled aggressively.
 *   - `controllerchange` fires correctly after skipWaiting() on iOS 16+.
 *   - PWA installed from home screen = fresh SW scope per install — same flow.
 */

import { Workbox, type WorkboxLifecycleWaitingEvent } from 'workbox-window';
import { UpdateBanner } from './UpdateBanner';
import { isSafeToReload, onSceneChange } from './safeToReload';

// 30 minutes between active update polls. Cheap (one HEAD-ish to /sw.js)
// and prevents users in long sessions from being stranded on an old build.
const UPDATE_CHECK_INTERVAL_MS = 30 * 60 * 1000;

// localStorage key for "user dismissed this version" — keyed by SW build id
// so a dismiss doesn't suppress the *next* build's prompt.
const DISMISS_KEY = 'fungineer.pwa.dismissedBuild';

export function registerSW(): void {
  // Bail out cleanly in environments without SW support (older Safari, some
  // in-app webviews) and during local dev unless vite-plugin-pwa devOptions
  // are on. import.meta.env.PROD is true only in `vite build` output.
  if (!('serviceWorker' in navigator)) {
    console.info('[PWA] Service Worker unsupported — skipping registration.');
    return;
  }
  if (!import.meta.env.PROD) {
    console.info('[PWA] Dev mode — SW registration disabled.');
    return;
  }

  // SW URL must be served from the root of our scope (./). vite-plugin-pwa
  // emits `sw.js` at the dist root and `manifest.webmanifest` next to it.
  const wb = new Workbox('./sw.js', { scope: './' });

  const banner = new UpdateBanner({
    onAccept: () => acceptUpdate(),
    onDismiss: () => dismissUpdate(),
  });
  banner.mount();

  // Track the "current" waiting SW (so we can postMessage to it later).
  // We keep it module-scoped because the Workbox event payload is local.
  let pendingBuildId: string | null = null;
  let dismissedThisSession = false;

  // ── Update flow ─────────────────────────────────────────────────────────
  function handleWaiting(_event: WorkboxLifecycleWaitingEvent): void {
    pendingBuildId = String(Date.now()); // opaque tag — real version is the SW itself
    const dismissedFor = localStorage.getItem(DISMISS_KEY);

    // If the user already dismissed THIS specific waiting build, respect it
    // until the next deploy. The SW build id rotates each deploy so the
    // suppression is naturally scoped to one version.
    if (dismissedFor && dismissedFor === pendingBuildId && dismissedThisSession) {
      console.info('[PWA] Update available but dismissed for this build.');
      return;
    }

    presentUpdate();
  }

  function presentUpdate(): void {
    if (isSafeToReload()) banner.showPrompt();
    else banner.showQueued();
  }

  function acceptUpdate(): void {
    // Defence-in-depth: don't apply if scene flipped to gameplay between
    // banner render and click. Re-check at the last possible moment.
    if (!isSafeToReload()) {
      banner.showQueued();
      return;
    }
    banner.showApplying();

    // Listen ONCE for controller swap, then reload. The `refreshing` flag
    // guards against double-reload from rapid lifecycle events.
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });

    wb.messageSkipWaiting();
  }

  function dismissUpdate(): void {
    dismissedThisSession = true;
    if (pendingBuildId) localStorage.setItem(DISMISS_KEY, pendingBuildId);
    banner.hide();
  }

  // ── Workbox events ──────────────────────────────────────────────────────
  // `waiting` fires whenever a new SW has installed and is waiting to take
  // control — covers both same-tab discovery and the "another tab already
  // installed a new SW" case (`event.isExternal === true`). Either way the
  // user should be prompted.
  wb.addEventListener('waiting', handleWaiting);

  // Activated for the first time (no previous SW). Useful for analytics /
  // confirming the PWA went live; no UI needed.
  wb.addEventListener('activated', (event) => {
    if (!event.isUpdate) console.info('[PWA] Service Worker activated (first install).');
  });

  // ── Scene-change reactor ────────────────────────────────────────────────
  // If the player leaves gameplay while an update is queued, upgrade the
  // banner from "queued" -> "prompt" so they can accept it immediately.
  onSceneChange((safe) => {
    if (!pendingBuildId) return;
    if (safe) banner.showPrompt();
    else banner.showQueued();
  });

  // ── Periodic update probe ───────────────────────────────────────────────
  // For long-running sessions (PWA window left open). Throttled by the
  // browser already — extra calls are cheap.
  window.setInterval(() => {
    void wb.update().catch(() => { /* offline / transient — try again later */ });
  }, UPDATE_CHECK_INTERVAL_MS);

  // Also check when the tab regains focus — common after the user backgrounds
  // a PWA for a while on mobile. Catches updates between sessions.
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      void wb.update().catch(() => { /* ignore */ });
    }
  });

  // ── Go ──────────────────────────────────────────────────────────────────
  wb.register({ immediate: true })
    .then((reg) => {
      if (reg) console.info('[PWA] Service Worker registered.');
    })
    .catch((err) => {
      // Registration failure is non-fatal — game still runs without the SW.
      console.warn('[PWA] Service Worker registration failed:', err);
    });
}
