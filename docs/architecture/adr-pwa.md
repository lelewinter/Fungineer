# ADR: PWA + Service Worker for Web Game

**Status**: Accepted
**Date**: 2026-05-11
**Decision-makers**: Tech lead

## Context

Fungineer is a PixiJS-based realtime web game deployed on Cloudflare Pages. We
need it to:

- Be installable on Android/iOS as a "PWA" (home-screen, fullscreen, no chrome).
- Start instantly on revisits (offline-capable shell).
- Auto-update reliably without ever "freezing" a player mid-fight.
- Survive aggressive CDN/browser caches without users getting stranded on old
  builds (a classic PWA failure mode).

## Decision

Use **`vite-plugin-pwa` in `injectManifest` mode**. We hand-write the service
worker (`frontend/src/pwa/sw.ts`) and Vite injects the precache manifest with
content hashes at build time. The runtime registration uses **`workbox-window`**
for lifecycle event normalisation across browsers.

### Update flow

1. New SW installs in the background -> `waiting` state.
2. `registerSW.ts` shows a DOM banner ("Nova versão disponível").
3. **Crucially**, the "Atualizar" button is gated by `safeToReload()` — only
   enabled when the current Pixi scene is in the lobby allowlist (`HubScene`,
   `WorldMapScene`, `BootScene`, `ZoneRoom`). Mid-run, the banner shows
   "Atualização preparada — será aplicada quando voltar ao hub".
4. On click, we postMessage `SKIP_WAITING` to the SW.
5. SW calls `self.skipWaiting()` -> page receives `controllerchange` -> we
   reload exactly once (guarded by a `refreshing` flag).
6. `clients.claim()` in `activate` ensures any other open tabs also pick up
   the new SW immediately.

### Cache strategy

| Resource | Strategy | Rationale |
|---|---|---|
| App shell (JS/CSS/HTML/icons) | Precache (Workbox `__WB_MANIFEST`) | Content-hashed by Vite -> automatic invalidation, instant offline boot |
| `/assets/art/**` images | StaleWhileRevalidate | Sprite atlases are large, rarely change; instant load + background refresh |
| `/assets/audio/**` | CacheFirst + LRU expiration (40 entries) | WAVs are huge; never re-download once cached, but cap quota |
| Google Fonts CSS / files | SWR / CacheFirst | Standard pattern, kept under fonts-specific cache buckets |
| `/api/**` | NetworkOnly | Save state must never be stale |

Outdated precaches are wiped via `cleanupOutdatedCaches()` on activate.

### Cache-busting end-to-end

- Vite hashes JS/CSS in filenames: `assets/index-abc123.js`.
- The precache manifest in the SW lists every file with its hash as the
  `revision`. A new deploy ships a new SW (different `__WB_MANIFEST` payload).
- The browser byte-compares the SW file against the previous one on every
  navigation. Different bytes -> install new SW -> our update flow kicks in.
- Cloudflare Pages cache rules (`public/_headers`):
  - `/assets/*` -> `max-age=31536000, immutable` (one year, never revalidate)
  - `/sw.js`, `/manifest.webmanifest`, `/`, `/index.html` -> `no-store`

## Consequences

### Good

- Zero-config cache invalidation: a deploy is enough, no manual cache version bumps.
- Update banner respects gameplay — no white screen mid-combat.
- Works offline after first load (modulo audio if not yet warmed up).
- Compatible with Chrome Android, iOS Safari 16+, all desktop modern browsers.

### Trade-offs

- iOS Safari throttles `registration.update()` calls — users in very long PWA
  sessions may take longer to see updates. We mitigate with a 30-min interval
  poll AND a `visibilitychange` probe (when tab regains focus).
- Icons are SVG-only. iOS 15 and earlier will fall back to the favicon
  (low-res). If we need iOS 15 support we'll rasterise 180x180 + 192/512 PNGs.
- The "scene change" reactor uses 200ms polling instead of a signal because
  `SceneManager` doesn't currently emit one. Cheap (~0.05ms work) but would
  be cleaner as a signal. Tracked as future cleanup.

## Alternatives considered

- **Pure hand-rolled SW**: would need our own Vite plugin to scan `dist/`
  and emit a hashed manifest. Reinventing Workbox. Rejected.
- **`generateSW` strategy** (Workbox builds SW for us, no `sw.ts`): hides
  too much. Rejected because we want the SW code visible and reviewable
  in the repo.
- **Auto-skipWaiting without user prompt**: user-hostile. Mid-game forced
  reloads are a worst-case UX. Rejected.

## Files

- `frontend/vite.config.ts` — plugin config + manifest.
- `frontend/src/pwa/sw.ts` — service worker source.
- `frontend/src/pwa/registerSW.ts` — registration + update orchestration.
- `frontend/src/pwa/UpdateBanner.ts` — DOM banner UI.
- `frontend/src/pwa/safeToReload.ts` — scene-aware reload gate.
- `frontend/public/pwa/icon.svg`, `icon-maskable.svg` — icon source.
- `frontend/public/_headers` — Cloudflare Pages cache rules.
- `frontend/index.html` — manifest link + iOS meta tags.

## Operational notes

- **Deploy fixes a stuck user automatically**: even if a build is broken in a
  way that keeps the SW from registering, the no-store HTML always pulls the
  latest `index.html`, which points to fresh hashed JS. Worst case: PWA loses
  offline support until the next good deploy; the game itself still loads.
- **Force-clear during dev**: `chrome://serviceworker-internals` or DevTools
  Application -> Storage -> Clear site data.
- **Verifying a release**: open DevTools Application -> Service Workers,
  check the active SW's URL matches the hash in the latest `dist/sw.js`.
