/**
 * registerSW — wires the service worker into the running game.
 *
 *  1. Registers /sw.js on first load (production only).
 *  2. Polls for updates (interval + on tab focus) so long-lived sessions never
 *     get stranded on an old version.
 *  3. AUTO-APPLY: when a new SW is `waiting`, we immediately activate it and
 *     reload — from ANY screen. The player always runs the newest version and
 *     never gets stuck on an "update prepared" prompt. A brief "Aplicando
 *     atualização…" flash is shown right before the one-time reload.
 *
 *  Why auto-apply (no manual gate)?
 *   - During active development the freshest build is what we want everywhere;
 *     a queued/gated banner kept users stranded on stale caches.
 *   - The `controllerchange` + `refreshing` guard guarantees exactly one reload
 *     (no reload loop).
 */

import { Workbox, type WorkboxLifecycleWaitingEvent } from 'workbox-window';
import { UpdateBanner } from './UpdateBanner';

// 30 minutes between active update polls. Cheap and prevents users in long
// sessions from being stranded on an old build.
const UPDATE_CHECK_INTERVAL_MS = 30 * 60 * 1000;

export function registerSW(): void {
  // Bail out cleanly where SW is unsupported (older Safari, some webviews) and
  // during local dev. import.meta.env.PROD is true only in `vite build` output.
  if (!('serviceWorker' in navigator)) {
    console.info('[PWA] Service Worker unsupported — skipping registration.');
    return;
  }
  if (!import.meta.env.PROD) {
    console.info('[PWA] Dev mode — SW registration disabled.');
    return;
  }

  const wb = new Workbox('./sw.js', { scope: './' });

  // The banner is only ever used for the brief "applying…" feedback now.
  const banner = new UpdateBanner({
    onAccept: () => applyUpdate(),
    onDismiss: () => { /* nothing to dismiss — updates auto-apply */ },
  });
  banner.mount();

  let applying = false;

  /** Activate the waiting SW and reload exactly once. */
  function applyUpdate(): void {
    if (applying) return;
    applying = true;
    banner.showApplying();

    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });

    wb.messageSkipWaiting();
  }

  // `waiting` fires whenever a new SW has installed and is ready to take over
  // (same-tab discovery or `event.isExternal` from another tab). Either way we
  // apply it immediately, from whatever screen the player is on.
  function handleWaiting(_event: WorkboxLifecycleWaitingEvent): void {
    applyUpdate();
  }

  wb.addEventListener('waiting', handleWaiting);

  wb.addEventListener('activated', (event) => {
    if (!event.isUpdate) console.info('[PWA] Service Worker activated (first install).');
  });

  // Periodic probe for long-running sessions (PWA window left open).
  window.setInterval(() => {
    void wb.update().catch(() => { /* offline / transient — try again later */ });
  }, UPDATE_CHECK_INTERVAL_MS);

  // Check whenever the tab regains focus — common after backgrounding a PWA.
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      void wb.update().catch(() => { /* ignore */ });
    }
  });

  wb.register({ immediate: true })
    .then((reg) => {
      if (reg) {
        console.info('[PWA] Service Worker registered.');
        // Force an immediate freshness check so a pending update applies right
        // away instead of waiting for the next interval/focus.
        void wb.update().catch(() => { /* ignore */ });
      }
    })
    .catch((err) => {
      console.warn('[PWA] Service Worker registration failed:', err);
    });
}
