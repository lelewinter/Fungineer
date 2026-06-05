/**
 * Service Worker (sw.ts) — O "assistente de bastidores" do jogo.
 * -------------------------------------------------------------
 * Em linguagem simples: um service worker e um pequeno programa que o navegador
 * roda em segundo plano, separado da pagina. Ele fica entre o jogo e a internet
 * e decide o que servir da memoria (cache) e o que buscar na rede. Gracas a ele,
 * o Fungineer abre rapido em visitas seguintes e ate funciona offline (sem
 * internet) depois de carregado uma vez.
 *
 * O que este arquivo faz, em resumo:
 *   - Guarda os arquivos essenciais do jogo (o "app shell") no cache.
 *   - Guarda imagens e audios conforme vao sendo usados (com limites de espaco).
 *   - NUNCA guarda respostas da API (/api/) — o save precisa ser sempre o atual.
 *   - Faz a troca segura para uma versao nova quando a pagina pedir.
 *
 * Termos tecnicos preservados em ingles (service worker, cache, precache,
 * runtime cache, skipWaiting, clients.claim) por serem termos padrao da area.
 *
 * ------------------------------------------------------------------
 * Production-ready SW for a realtime PixiJS game. Goals:
 *
 *  1. Precache the app shell (JS/CSS/HTML/icons) with content-hashed names
 *     so cache invalidation is automatic — Vite already hashes built JS/CSS,
 *     and vite-plugin-pwa injects the precache manifest via __WB_MANIFEST.
 *
 *  2. Runtime cache for art (stale-while-revalidate) and audio (cache-first
 *     with LRU expiration) so the game starts instantly on revisits and
 *     plays offline once warmed up.
 *
 *  3. Never cache API responses — saves must always reflect the latest state.
 *
 *  4. Safe update swap: the new SW installs in the background, lives in the
 *     `waiting` state, and only takes control when the client (the page)
 *     explicitly sends a `SKIP_WAITING` message — which we trigger from the
 *     in-game banner ONLY when the user is in a safe scene (lobby/menu),
 *     never mid-gameplay.
 *
 *  5. `clients.claim()` on activate makes the new SW control all open tabs
 *     after the swap — preventing two versions from coexisting.
 *
 *  6. Outdated precaches are cleaned up on activation by Workbox.
 *
 * Compatibility: Chrome Android 90+, iOS Safari 16+ (PWA install support),
 * desktop Chrome/Edge/Firefox/Safari. We avoid iOS-incompatible features
 * (no Background Sync, no Periodic Sync — fire-and-forget messaging only).
 */

/// <reference lib="webworker" />

import { precacheAndRoute, cleanupOutdatedCaches, createHandlerBoundToURL } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { CacheFirst, StaleWhileRevalidate, NetworkOnly } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

declare const self: ServiceWorkerGlobalScope;

// ─── Version stamp ──────────────────────────────────────────────────────────
// Useful for `chrome://serviceworker-internals` and our debug logs. The real
// "version" is implicit in the __WB_MANIFEST hashes; this is just a human tag.
// vite-plugin-pwa replaces import.meta.env values at build time.
const SW_BUILD_ID =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (self as any).__SW_BUILD_ID ||
  new Date().toISOString().slice(0, 19); // fallback: build timestamp

console.info('[SW] booting', SW_BUILD_ID);

// ─── Precache (app shell) ───────────────────────────────────────────────────
// `self.__WB_MANIFEST` is replaced at build time with the list of files Vite
// emitted (each with a `revision` hash). `precacheAndRoute` handles install,
// activate-time cleanup of stale entries, and serving from cache.
precacheAndRoute(self.__WB_MANIFEST);

// Drop precaches from previous SW versions (different cache prefix or
// removed entries). Critical to avoid disk bloat and stale-asset bugs.
cleanupOutdatedCaches();

// ─── SPA navigation fallback ────────────────────────────────────────────────
// Any navigation request (e.g. `/`, deep link refresh) is served from the
// precached `index.html`. This is what makes the game work offline after the
// first load. Excludes asset URLs and API URLs so they hit their own handlers.
const indexHandler = createHandlerBoundToURL('index.html');
registerRoute(
  new NavigationRoute(indexHandler, {
    denylist: [
      /^\/api\//,
      /^\/assets\//,
      /\.[a-z0-9]+$/i, // anything that looks like a file with an extension
    ],
  }),
);

// ─── Runtime cache: ART (images) ────────────────────────────────────────────
// StaleWhileRevalidate gives an instant response from cache and refreshes in
// the background. Perfect for sprites/atlases that change rarely between
// deploys but are too numerous for precache.
registerRoute(
  ({ url, request }) =>
    request.destination === 'image' &&
    (url.pathname.includes('/assets/art/') || url.pathname.includes('/assets/vfx/')),
  new StaleWhileRevalidate({
    cacheName: 'fungineer-art-v1',
    plugins: [
      // Only cache successful responses. Opaque (CORS-blocked) and 4xx/5xx
      // never enter the cache, preventing "broken sprite" stickiness.
      new CacheableResponsePlugin({ statuses: [200] }),
      new ExpirationPlugin({
        maxEntries: 400,
        maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
        purgeOnQuotaError: true, // auto-evict if browser hits storage cap
      }),
    ],
  }),
);

// ─── Runtime cache: AUDIO ───────────────────────────────────────────────────
// Audio is huge (WAVs ~100MB total). Use CacheFirst so we never re-download
// once cached, but cap entries hard so we don't blow the quota.
registerRoute(
  ({ url, request }) =>
    (request.destination === 'audio' || /\.(wav|ogg|mp3|m4a)$/i.test(url.pathname)) &&
    url.pathname.includes('/assets/audio/'),
  new CacheFirst({
    cacheName: 'fungineer-audio-v1',
    plugins: [
      new CacheableResponsePlugin({ statuses: [200] }),
      new ExpirationPlugin({
        maxEntries: 40,
        maxAgeSeconds: 60 * 60 * 24 * 60, // 60 days
        purgeOnQuotaError: true,
      }),
    ],
  }),
);

// ─── Fonts (Google Fonts CDN) ───────────────────────────────────────────────
// Stylesheets revalidate; static font files (woff2) cache long-term.
registerRoute(
  ({ url }) => url.origin === 'https://fonts.googleapis.com',
  new StaleWhileRevalidate({ cacheName: 'fungineer-google-fonts-css-v1' }),
);
registerRoute(
  ({ url }) => url.origin === 'https://fonts.gstatic.com',
  new CacheFirst({
    cacheName: 'fungineer-google-fonts-files-v1',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }), // 0 = opaque (CORS)
      new ExpirationPlugin({
        maxEntries: 16,
        maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
        purgeOnQuotaError: true,
      }),
    ],
  }),
);

// ─── API: never cache ───────────────────────────────────────────────────────
// Save state, leaderboards, etc. Always go to the network. If offline, fail
// fast — the app's SaveService falls back to localStorage on error.
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkOnly(),
);

// ─── Lifecycle ──────────────────────────────────────────────────────────────
// install: the new SW lands in `waiting` state. We do NOT skipWaiting() here —
// that would auto-swap mid-gameplay and break the running session. The page
// asks us to skip via postMessage when it's safe.
self.addEventListener('install', () => {
  console.info('[SW] install', SW_BUILD_ID);
});

// activate: we became the active SW. Claim all open clients (tabs) so the
// new version controls them immediately — without this they'd keep talking
// to the old SW until next reload.
self.addEventListener('activate', (event) => {
  console.info('[SW] activate', SW_BUILD_ID);
  event.waitUntil(self.clients.claim());
});

// Messages from the page:
//  - SKIP_WAITING: user accepted the "new version" prompt -> swap now
//  - GET_VERSION:  page asks what version is in control (debug / UI)
self.addEventListener('message', (event) => {
  const data = event.data as { type?: string } | null;
  if (!data || typeof data !== 'object') return;

  if (data.type === 'SKIP_WAITING') {
    console.info('[SW] SKIP_WAITING received, activating new SW');
    void self.skipWaiting();
    return;
  }

  if (data.type === 'GET_VERSION' && event.source) {
    (event.source as Client).postMessage({ type: 'VERSION', buildId: SW_BUILD_ID });
  }
});
