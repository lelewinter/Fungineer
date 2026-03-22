# ADR-001: Engine Choice — Godot 4.6

**Date**: 2026-03-21
**Status**: Accepted
**Deciders**: Technical Director, Producer

---

## Context

Orbit Rescue is a 2D mobile-first game with short sessions (90–150s), drag-based input, automatic combat, and a party system of up to 4 characters. The MVP must be prototypeable quickly on a single developer setup, testable on desktop, and exportable to Android/iOS without significant platform-specific work.

Candidate engines evaluated: Godot 4.6, Unity 6, custom HTML5/Phaser.

---

## Decision

**Use Godot 4.6 with GDScript as the primary language.**

---

## Rationale

| Criterion | Godot 4.6 | Unity 6 | Phaser (web) |
|---|---|---|---|
| 2D-native pipeline | ✅ First-class | ⚠️ 3D-first overhead | ✅ Web-native |
| Mobile export | ✅ Android + iOS templates | ✅ Excellent | ⚠️ WebView wrapper |
| Touch input (drag) | ✅ InputEventScreenDrag | ✅ | ✅ |
| Prototype speed | ✅ Fast scene-node model | ⚠️ Slower boilerplate | ✅ Fast |
| Desktop test parity | ✅ Same build | ✅ | ⚠️ Browser-only |
| License cost | ✅ Free, open-source | ⚠️ Revenue threshold | ✅ Open-source |
| Physics needed | N/A (combat is logical) | N/A | N/A |
| LLM tooling support | ✅ Template already configured | ✅ | ⚠️ Less coverage |

Godot 4.6 wins on 2D-native workflow, cost, and the fact that this template already has Godot specialists configured.

**GDScript** is chosen over C# for MVP:
- Faster iteration for solo/small team
- No compilation step
- GDExtension available for any future performance-critical hotspots

---

## Consequences

**Positive**:
- No license fees or revenue-share thresholds
- Fast scene-based prototyping
- Same codebase exports to Android, iOS, desktop, and web
- Mobile renderer (`Mobile`) available for lower-end device testing

**Negative**:
- Godot 4.4–4.6 has post-training-cutoff changes — must verify API against `docs/engine-reference/godot/VERSION.md`
- GDScript performance ceiling is lower than C++ (acceptable for this game's scale)
- Smaller asset store ecosystem than Unity

**Mitigations**:
- Engine reference docs are version-pinned at 4.6
- Performance budget not yet critical at MVP scale; pool enemies if needed
- All assets for MVP are placeholder primitives (no asset store dependency)

---

## Alternatives Rejected

**Unity 6**: Stronger ecosystem but heavier setup, licensing concerns at commercial scale, and overkill for a 2D arcade game.

**Phaser/HTML5**: Fastest web iteration but desktop parity is worse, mobile export requires native wrapper, and long-term mobile performance is less predictable.

---

## Review Date

Revisit at v1.0 launch if performance targets (see `technical-preferences.md`) cannot be met with GDScript alone.
