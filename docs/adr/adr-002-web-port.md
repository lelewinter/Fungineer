---
tags: [fungineer, arquitetura, adr, decisao, stack]
date: 2026-05-11
tipo: adr
---

# ADR-002: Port to PixiJS + FastAPI (Web/Mobile-PWA)

**Date**: 2026-05-11
**Status**: Accepted
**Deciders**: Tech lead, Producer
**Supersedes**: [ADR-001](./adr-001-engine-choice.md)

---

## Context

ADR-001 chose Godot 4.6 + GDScript for the MVP. Several months in, the project
hit friction points that changed the calculus:

- **Distribution latency.** Every gameplay tweak required an Android export +
  manual sideload to test on real devices. The feedback loop dwarfed the actual
  iteration time on a game whose entire pillar is "ship and playtest small
  changes weekly."
- **Mobile install friction.** Onboarding a playtester meant talking them
  through "Unknown Sources" + APK install. Drop-off was high.
- **Asset pipeline overhead.** Godot's import sidecars (`.import`, `.tres`)
  added noise to PRs that often had nothing to do with the change.
- **Distribution audience.** The game is short-session, mobile-first, and
  visually 2D-simple — exactly the profile that a PWA serves natively without
  store overhead.
- **Save model.** The save schema is opaque JSON; no need for engine-coupled
  persistence. A thin HTTP service is a better fit than wiring Godot to a
  remote backend.

Given the design constraints (only-input-is-move, single-screen runs, 90–150s
sessions, sprite-based 2D), Godot's strengths (3D, complex physics, native
exports) were largely unused. The cost of those unused capabilities was real:
slower iteration, heavier toolchain.

---

## Decision

Port the runtime to a web stack and ship as an installable PWA. The new stack:

| Layer | Technology | Deploy target |
|---|---|---|
| **Frontend** | PixiJS v8 + Vite + TypeScript | Cloudflare Pages |
| **Backend** | FastAPI + SQLite (Python 3.11+) | Railway |
| **Persistence** | Local: `localStorage`; Remote: SQLite via FastAPI | — |
| **PWA** | `vite-plugin-pwa` (injectManifest) + `workbox-window` | — |

- Frontend lives in `frontend/`.
- Backend lives in `backend/`.
- The original Godot project (previously under `src/`) was removed from the
  repo after the port — its history is preserved in git, not on disk.

See companion docs:
- `docs/architecture/adr-pwa.md` — PWA + service worker decisions.
- `docs/technical-architecture.md` — current architecture overview.

---

## Rationale

| Criterion | Godot 4.6 (was) | PixiJS + FastAPI (now) |
|---|---|---|
| Iteration loop (web) | Manual export | Hot reload, `npm run dev` |
| Iteration loop (mobile) | APK sideload | PWA — refresh the tab |
| Install friction | "Unknown Sources" | "Add to Home Screen" |
| Asset pipeline | `.import`/`.tres` sidecars | Static files under `public/` |
| Save schema coupling | Engine-coupled | Opaque JSON, server-agnostic |
| 2D rendering | First-class | First-class (PixiJS v8 WebGPU) |
| Bundle/start time | APK / WASM | Hashed JS, instant boot |
| LLM tooling coverage | Post-cutoff Godot 4.6 was a known risk | TS/Python stacks well-covered |
| Hosting cost | n/a (sideloaded) | Free tier (Pages + Railway hobby) |

PixiJS v8 covers everything the Godot version actually used: sprite batching,
filters (CRT), scene-graph compositing, drag input, ticker-driven update
loops. The "only-input-is-move" constraint maps cleanly to pointer + touch
events without any framework-specific abstractions.

---

## Consequences

### Positive

- **Playtest cycle minutes-not-hours.** A push to `main` is a Cloudflare Pages
  deploy in under a minute; players refresh and get the new build.
- **Zero install for new playtesters.** A URL is the onboarding flow.
- **Stack matches the team's strengths.** TypeScript + Python are well-served
  by current tooling.
- **PR signal-to-noise improved.** No more `.import` churn.
- **Free, scalable hosting.** Cloudflare Pages + Railway hobby tier handle
  expected playtest traffic with margin.

### Negative / Trade-offs

- **WAV asset cost.** Cloudflare Pages caps individual files at 25 MB. The
  six zone WAVs (~10–25 MB each) approach or exceed that. **Mitigation**: convert
  zone music to OGG/MP3 before production deploy; LRU-cap audio cache to 40
  entries in the service worker.
- **iOS Safari quirks.** PWA throttling, no proper push, icon limitations on
  iOS ≤15. Documented in `adr-pwa.md`.
- **Lost Godot affordances.** Built-in physics, animation editor, scene
  inspector. We don't currently need them; if we do, we revisit.
- **Two deploy targets to operate.** Cloudflare Pages (frontend) and Railway
  (backend) instead of one platform store. **Mitigation**: backend is optional;
  frontend works standalone with `localStorage` when `VITE_API_URL` is empty.
- **48-agent template was tuned for Godot.** Many specialist agents
  (`godot-*`, Unity, Unreal) are now irrelevant. We keep them but stop using
  them; CLAUDE.md and `task-writer` are updated to reflect the new stack.

---

## Migration

- `frontend/` is the live runtime (was `web/` pre-port — `web/` removed).
- `backend/` is the new persistence layer; frontend falls back to
  `localStorage` if `VITE_API_URL` is empty.
- `src/` (Godot tree), `project.godot`, `export_presets.cfg`, and
  `docs/engine-reference/godot/` were removed from the repo. The history is
  preserved in git for archaeological reference.
- Godot-only CI workflows (`deploy.yml` GitHub Pages export, `android-build.yml`
  APK export) were removed and replaced by `frontend-ci.yml` + `backend-ci.yml`.

---

## Review

Revisit if:
- We need native platform integration the web platform can't provide
  (e.g. controller haptics, OS-level overlays).
- We hit a performance ceiling PixiJS + WebGL/WebGPU can't clear.
- We decide to publish on store fronts that require a native binary.
