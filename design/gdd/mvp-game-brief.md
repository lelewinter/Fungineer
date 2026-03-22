# Orbit Rescue — MVP Game Brief

**Version**: 1.0
**Date**: 2026-03-21
**Status**: Approved

---

## Overview

Orbit Rescue is a mobile-first 2D arcade game with runs lasting 90–150 seconds. The player controls a squad of technological creatures by dragging the leader across the arena. Combat is automatic; decisions happen through positioning and transformative power activation. Each run starts with 1 character and allows rescuing up to 3 more along the way. Runs end at a boss fight, and success rewards Tech Fragments for meta-progression.

---

## Player Fantasy

You are the commander of a small squad of technological creatures fighting inside hostile arenas. You feel in control through positioning, but your squad fights for itself. Activating a power should feel like flipping a switch that changes the rules of the fight — not just making numbers bigger.

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

- **Primary**: Mobile (Android/iOS). Portrait vs landscape: TBD in prototype — test both.
- **Secondary**: Desktop (keyboard/mouse) for development and testing.
- Godot 4.6 export targets both with the same codebase.

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
- **Role**: Tank / anchor
- **HP**: High (200)
- **Attack**: Short range, moderate damage, slow rate
- **Passive**: Takes 20% less damage
- **Fantasy**: Immovable wall; draws aggro and holds the line

### Striker
- **Role**: DPS
- **HP**: Medium (120)
- **Attack**: Short/medium range, high damage, fast rate
- **Passive**: None (pure damage)
- **Fantasy**: Glass cannon that rewards good positioning

### Artificer
- **Role**: AoE / wave clearer
- **HP**: Medium (100)
- **Attack**: Slow homing projectile, low single-target damage, explodes on impact (medium AoE)
- **Passive**: Explosions deal +50% damage to clusters of 3+
- **Fantasy**: Methodical area denial; punishes enemy clumping

### Medic
- **Role**: Sustain
- **HP**: Low (80)
- **Attack**: Weak direct shot (targets nearest enemy)
- **Passive**: Every 5s, heals the lowest-HP ally for 15 HP
- **Fantasy**: Fragile but essential; losing the Medic shifts run feel immediately

---

## Enemies (MVP)

### Runner
- **HP**: Low (30)
- **Speed**: Fast (200 px/s)
- **Attack**: Melee, low damage (5/hit)
- **Behavior**: Charges directly at nearest party member
- **Design note**: High quantity; teaches positional awareness early

### Bruiser
- **HP**: High (150)
- **Speed**: Slow (60 px/s)
- **Attack**: Melee, high damage (25/hit), slow swing
- **Behavior**: Locks onto Guardian or highest-HP target
- **Design note**: Forces the player to kite or tank; rewards Siege Mode use

### Spitter
- **HP**: Medium (60)
- **Speed**: Very slow (40 px/s)
- **Attack**: Ranged projectile (120px range), medium damage (12/hit)
- **Behavior**: Maintains distance; repositions if player enters range
- **Design note**: Forces repositioning — primary pressure on drag control

---

## Boss: Sentinel Core

**HP**: 600
**Arena phase**: Appears at 90s mark (or after all waves cleared)

### Phase 1 (100%–60% HP)
- **Dash**: Charges in a straight line across arena every 8s
- **Add spawn**: Spawns 3 Runners every 15s
- **Vulnerable**: 2s window immediately after dash (stopped, facing wall)

### Phase 2 (60%–0% HP)
- Dash cooldown drops to 5s
- Spawns Runners + 1 Bruiser every 12s
- Adds a slow homing orb projectile between dashes

**Win condition**: Sentinel Core reaches 0 HP
**Design note**: Boss must change the feel of the run — player should shift from "kill everything" to "dodge and punish"

---

## Rescue System

- **Trigger**: After Wave 1 and Wave 2 (2 events per run in MVP)
- **Offer**: 2 random characters from the remaining pool (not already in party)
- **Pick**: Player taps one character to add to party
- **Skip**: If party is full (4/4), no rescue event appears
- **Edge case**: If all 3 non-starting characters are already in party, no event

---

## Transformative Powers (MVP — all 6 defined, offer 3 per run)

### Siege Mode
- **Trigger**: Automatic — activates after 1.5s without movement
- **Effect**: All damage ×3.0
- **Trade-off**: Moving cancels Siege Mode instantly; damage returns to 1.0×
- **Design intent**: Rewards stillness; makes positioning life-or-death

### Split Orbit
- **Trigger**: Active toggle (tap power icon)
- **Duration**: Until toggled off
- **Effect**: Party spreads into wide formation covering 2× area
- **Trade-off**: Individual characters take 30% more damage (spread = vulnerable)
- **Design intent**: AoE coverage vs survival trade-off; good against Runners, dangerous vs Bruisers

### Overclock
- **Trigger**: Active toggle
- **Duration**: 10s, then 15s cooldown
- **Effect**: Attack speed ×2.5
- **Trade-off**: Party loses 5 HP/s while active
- **Design intent**: Burn-phase power; high-risk burst window for boss phases

### Magnet Pulse
- **Trigger**: Active (tap)
- **Duration**: Passive until toggled off
- **Effect**: Pickups auto-collect within 200px radius; light enemies (Runner) pulled toward party
- **Trade-off**: Elite enemies (Bruiser, Spitter) deal 20% more damage while active
- **Design intent**: Greed power — more pickups, more pressure

### Reflective Shell
- **Trigger**: Passive (always on after picked)
- **Effect**: 25% of incoming damage reflected to attacker
- **Trade-off**: Party base attack drops by 35%
- **Design intent**: Counter-aggressive power; great with Guardian tank, terrible for DPS runs

### Ghost Drive
- **Trigger**: Active (tap)
- **Duration**: 3s, then 20s cooldown
- **Effect**: Party becomes intangible — passes through enemies and projectiles
- **Trade-off**: Cannot capture the tech objective while active; cooldown is long
- **Design intent**: Emergency escape hatch; also tactical for repositioning through enemy clusters

---

## Tech Objective (Optional)

- **Location**: Fixed point in arena (center or edge — TBD in prototype)
- **Mechanic**: Party must stay within 80px radius for 5 continuous seconds
- **Reward**: +50% Tech Fragments on run completion
- **Penalty**: None — fully optional
- **Design intent**: Secondary objective that creates positioning tension mid-run

---

## Meta Progression

Single currency: **Tech Fragments**

| Unlock | Cost |
|---|---|
| Unlock Artificer | 50 fragments |
| Unlock Medic | 80 fragments |
| Armor Tier 1 (all chars +10% HP) | 100 fragments |
| Capture Efficiency (objective timer −1s) | 75 fragments |

*Note: Guardian and Striker are unlocked from run 1.*

---

## MVP Success Criteria

1. New player understands the game without tutorial text in under 15 seconds
2. A full run (waves + boss) completes between 90 and 150 seconds
3. At least 3 different power combinations produce meaningfully different play experiences
4. Party of 4 characters remains readable on a 375px wide screen
5. Boss encounter noticeably changes the pacing and feel of the run
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
