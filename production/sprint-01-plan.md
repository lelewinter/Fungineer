# Sprint 01 — Orbit Rescue Prototype

**Period**: 2026-03-21 →  2026-03-28
**Goal**: Playable run loop — drag, auto-combat, 2 chars, 3 enemies, 1 power, 1 boss, HUD
**Status**: In Progress

---

## Sprint Goal

Validate 3 core questions:
1. Is drag-based movement fun and readable?
2. Is auto-combat with a 2-char party legible on a small screen?
3. Does at least 1 transformative power change how you play?

If all 3 pass playtest, proceed to Sprint 2 (expand content). If any fail, fix before adding content.

---

## Deliverables

| # | Task | Owner | Acceptance Criteria | Status |
|---|---|---|---|---|
| 1 | `GameConfig.gd` autoload | Prototyper | All numeric values sourced from config, no magic numbers in code | [ ] |
| 2 | Drag movement system | Gameplay Programmer | Party leader follows pointer with lerp; formation holds relative offset | [ ] |
| 3 | Party system (2 chars) | Gameplay Programmer | Guardian + Striker in party; each has own HP; death removes from party | [ ] |
| 4 | Auto-combat | Gameplay Programmer | Characters attack nearest enemy in range; cooldown per character | [ ] |
| 5 | Enemy: Runner | AI Programmer | Spawns from edge; charges nearest party member; dies at 0 HP | [ ] |
| 6 | Enemy: Bruiser | AI Programmer | Slow pursuit; high damage; tanks hits | [ ] |
| 7 | Enemy: Spitter | AI Programmer | Maintains range; fires projectile; repositions if party too close | [ ] |
| 8 | Wave spawner | Gameplay Programmer | 2 waves on timer; configurable enemy counts from GameConfig | [ ] |
| 9 | Power: Siege Mode | Systems Designer / Programmer | Activates on stillness; damage multiplier; cancels on move | [ ] |
| 10 | Boss: Sentinel Core | AI Programmer | Dash pattern; add spawns; 2s vulnerability window; phase 2 at 60% HP | [ ] |
| 11 | HUD | UI Programmer | HP bars per character; run timer; power cooldown indicator; wave counter | [ ] |
| 12 | Game Over / Win state | Gameplay Programmer | All chars dead → Game Over screen; Boss dead → Victory + fragment count | [ ] |
| 13 | Debug overlay | Tools Programmer | Toggle with F1: show HP values, enemy states, FPS, drag target | [ ] |
| 14 | Playtest pass | QA Lead | Run 5 test sessions; log durations; flag legibility issues | [ ] |

---

## Out of Scope (Sprint 1)

- Rescue events (Sprint 2)
- More than 1 power (Sprint 2)
- Meta progression screen (Sprint 2)
- Tech Fragments collection (Sprint 2)
- Sound / music (Sprint 3)
- Art assets (Sprint 3)
- More characters or enemies (Sprint 2+)

---

## Tech Architecture Decisions

- All game entities inherit from `BaseCharacter` or `BaseEnemy`
- Combat is logical (no physics collisions for damage); use `Area2D` for range checks
- Powers are data-driven: `PowerResource` (.tres) with callbacks
- Scenes: one `.tscn` per entity, one per UI element, one `Main.tscn` as root

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Drag feel is wrong | Medium | High | Tune lerp factor and smoothing early; test on device by day 3 |
| Auto-combat is visually noisy | Medium | High | Start with simple range circles; add VFX only after logic is clear |
| Boss is too hard or too easy | High | Medium | Expose all boss values in GameConfig; tune after first playtest |
| Scope creep | High | Medium | Any new system requires explicit approval before starting |
| Godot 4.6 API surprise | Low | Medium | Check docs/engine-reference before every new API call |

---

## Definition of Done

Sprint 1 is done when:
- [ ] All 13 tasks above are complete
- [ ] A single run can be completed from start screen to win/lose screen
- [ ] Run duration is 90–150s in at least 3 consecutive test sessions
- [ ] No crash bugs in the win/lose flow
- [ ] Playtest report exists at `production/playtest-report-sprint-01.md`
