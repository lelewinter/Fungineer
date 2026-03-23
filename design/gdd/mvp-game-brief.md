# Orbit Rescue — MVP Game Brief

**Version**: 1.0
**Date**: 2026-03-21
**Status**: Approved

---

## Overview

Mobile-first 2D arcade game. Runs last 90–150 seconds. Player drags the squad leader to reposition; combat is automatic. Each run starts with 1 character; up to 3 more can be rescued. Runs end at a boss fight; success rewards Tech Fragments for meta-progression.

---

## Player Fantasy

Commander of technological creatures fighting in hostile arenas. Control through positioning; squad fights for itself. Activating a power should feel like changing the rules of the fight, not just increasing numbers.

---

## Core Loop

```
Enter arena (1 character)
  → Drag to reposition squad
  → Auto-combat fires continuously
  → Wave 1: Runners + Bruisers
  → Rescue event: pick 1 of 2 new characters
  → Wave 2: Spitters + Bruisers
  → Power offer: pick 1 of 3 transformative powers
  → Boss: Sentinel Core
  → Win/Lose → collect Tech Fragments → meta screen
```

---

## Platform

- **Primary**: Mobile (Android/iOS). Portrait vs landscape: TBD in prototype.
- **Secondary**: Desktop for development and testing.
- Godot 4.6 exports both from the same codebase.

---

## Session Target

- **Minimum**: 90 seconds per run
- **Maximum**: 150 seconds per run
- If runs exceed 150s in testing, cut wave count or tighten boss timer.

---

## Hard Constraints

| Constraint | Value |
|---|---|
| Max party size | 4 characters |
| HP model | Individual per character |
| Run fail condition | All characters dead |
| Power design rule | Must change *how* you play, not just *how much* damage |
| MVP scope | No new systems without explicit approval |

---

## Characters (MVP)

### Guardian
- **Role**: Tank / anchor | **HP**: 200
- **Attack**: Short range, moderate damage, slow rate
- **Passive**: Takes 20% less damage

### Striker
- **Role**: DPS | **HP**: 120
- **Attack**: Short/medium range, high damage, fast rate
- **Passive**: None (pure damage)

### Artificer
- **Role**: AoE / wave clearer | **HP**: 100
- **Attack**: Slow homing projectile, explodes on impact (medium AoE)
- **Passive**: Explosions deal +50% damage to clusters of 3+

### Medic
- **Role**: Sustain | **HP**: 80
- **Attack**: Weak direct shot (nearest enemy)
- **Passive**: Every 5s, heals lowest-HP ally for 15 HP

---

## Enemies (MVP)

### Runner
- **HP**: 30 | **Speed**: 200 px/s | **Attack**: Melee, 5/hit
- **Behavior**: Charges directly at nearest party member
- *High quantity; teaches positional awareness early*

### Bruiser
- **HP**: 150 | **Speed**: 60 px/s | **Attack**: Melee, 25/hit, slow swing
- **Behavior**: Locks onto Guardian or highest-HP target
- *Forces kiting or tanking; rewards Siege Mode use*

### Spitter
- **HP**: 60 | **Speed**: 40 px/s | **Attack**: Ranged 120px, 12/hit
- **Behavior**: Maintains distance; repositions if player enters range
- *Primary pressure on drag control*

---

## Boss: Sentinel Core

**HP**: 600 | **Appears**: 90s mark or after all waves cleared

### Phase 1 (100%–60% HP)
- Dash across arena every 8s; 2s vulnerable window after dash
- Spawns 3 Runners every 15s

### Phase 2 (60%–0% HP)
- Dash cooldown drops to 5s
- Spawns Runners + 1 Bruiser every 12s
- Adds slow homing orb projectile between dashes

**Win condition**: Sentinel Core reaches 0 HP
*Boss must shift player from "kill everything" to "dodge and punish"*

---

## Rescue System

- **Trigger**: After Wave 1 and Wave 2 (2 events per run)
- **Offer**: 2 random characters from remaining pool (not in party)
- **Pick**: Player taps one to add; skip if party already at 4/4
- **Edge case**: No event if all 3 non-starting characters are already in party

---

## Transformative Powers (MVP — all 6 defined, offer 3 per run)

### Siege Mode
- **Trigger**: Automatic after 1.5s without movement
- **Effect**: All damage ×3.0; moving cancels instantly

### Split Orbit
- **Trigger**: Active toggle
- **Effect**: Party spreads to 2× area coverage; characters take 30% more damage

### Overclock
- **Trigger**: Active toggle | **Duration**: 10s, 15s cooldown
- **Effect**: Attack speed ×2.5; party loses 5 HP/s while active

### Magnet Pulse
- **Trigger**: Active toggle (passive until off)
- **Effect**: Pickups auto-collect within 200px; Runners pulled toward party; Bruisers/Spitters deal 20% more damage

### Reflective Shell
- **Trigger**: Passive (always on after picked)
- **Effect**: 25% of incoming damage reflected; party base attack −35%

### Ghost Drive
- **Trigger**: Active | **Duration**: 3s, 20s cooldown
- **Effect**: Party intangible (passes through enemies/projectiles); cannot capture tech objective while active

---

## Tech Objective (Optional)

- **Location**: Fixed point in arena (center or edge — TBD in prototype)
- **Mechanic**: Stay within 80px radius for 5 continuous seconds
- **Reward**: +50% Tech Fragments on run completion; no penalty for skipping

---

## Meta Progression

Single currency: **Tech Fragments**

| Unlock | Cost |
|---|---|
| Unlock Artificer | 50 fragments |
| Unlock Medic | 80 fragments |
| Armor Tier 1 (all chars +10% HP) | 100 fragments |
| Capture Efficiency (objective timer −1s) | 75 fragments |

*Guardian and Striker unlocked from run 1.*

---

## MVP Success Criteria

1. New player understands the game without tutorial text in under 15 seconds
2. Full run (waves + boss) completes between 90 and 150 seconds
3. At least 3 different power combinations produce meaningfully different play experiences
4. Party of 4 characters remains readable on a 375px wide screen
5. Boss encounter noticeably changes run pacing and feel
6. Player makes at least 2 meaningful decisions per run (rescue + power pick)

---

## Out of Scope for MVP

- Multiple maps
- More than 1 meta currency
- Deep armor trees
- Story / narrative
- Multiplayer
- More than 1 boss
- Sound design (placeholder OK)
- Achievements / daily missions
