# QA Review: Corrida de Extração (Extraction Run Zone)

**Reviewer**: QA Agent
**Date**: 2026-03-22
**Design Doc Version**: 1.0 (Draft)
**Implementation Status**: INCOMPLETE

---

## Executive Summary

The Extraction Run zone implementation is **PARTIALLY COMPLETE** with significant missing features and critical bugs. The core loop is functional (timer, canister pickup, run ending) but lacks essential mechanics: the danger wall chasing mechanic is incomplete, drones don't exist, and several edge cases are unhandled.

**Status**: NOT READY FOR PLAYTESTING

---

## CRITICAL BUGS (Game-Breaking)

### C1: ExtractionDrone Class Does Not Exist
- **File**: `src/scenes/ExtractionMain.gd:309-313`
- **Issue**: Code references `ExtractionDrone.new()` which is never defined anywhere in the codebase
- **Impact**: Calling `_build_drones()` will crash with "script not found" error on line 309
- **Reproduction**:
  1. Run the Extraction scene
  2. Game crashes during `_ready()` at line 94
- **Expected**: Drones spawn and patrol routes
- **Actual**: Game crashes before scene finishes loading
- **Severity**: S1 — Game unplayable

### C2: Party/GameState.party Initialization Mismatch
- **File**: `src/scenes/ExtractionMain.gd:220-238`
- **Issue**: `_build_squad()` creates a local `_party` variable and adds characters via `_party.add_character()`, but code in `_check_squad_pickup()` (line 390) reads from `GameState.party` to check pickup distance
- **Impact**: Characters are added to local `_party` node but NOT to `GameState.party`, so pickup detection will fail
- **Reproduction**:
  1. Run the Extraction scene
  2. Try to pick up a canister by moving over it
  3. No pickup occurs because `GameState.party` is empty
- **Expected**: Any squad member touching a canister triggers instant pickup
- **Actual**: No pickup registered; canister remains on field
- **Root Cause**: `Party.add_character()` (line 17 in `Party.gd`) adds to `GameState.party`, but it's called during `_ready()` before `GameState.start_run()`. Check if `GameState.party` is cleared by `start_run()` (line 59 in `GameState.gd`) AFTER characters are added.
- **Severity**: S1 — Core mechanic broken

### C3: All-Dead Check Uses Wrong Logic
- **File**: `src/scenes/ExtractionMain.gd:148-157`
- **Issue**: Code attempts to check `is_dead` property via both direct access (line 150) and function call (line 153), then returns `false` (win) if array is empty (line 157)
- **Code**:
  ```gdscript
  var all_dead := true
  for ch in GameState.party:
    if ch is Node and not (ch as Node).get("is_dead"):  # checks if NOT dead → win
      all_dead = false
      break
    if ch is Node and not (ch as Node).call("is_dead"):  # same check again?
      all_dead = false
      break
  if GameState.party.size() == 0:
    all_dead = false  # BACKWARDS: empty party = alive? Should be true
  ```
- **Impact**:
  - If squad is empty (size 0), `all_dead = false` → run continues indefinitely
  - If squad has 1+ characters, checks `is_dead` twice with same logic
  - Fail state may never trigger
- **Expected**: `all_dead = true` when all characters are dead
- **Actual**: `all_dead = false` when party is empty (contradictory)
- **Severity**: S1 — Fail state broken

---

## MAJOR BUGS (Mechanic Broken)

### M1: Danger Wall Does Not Kill Party
- **File**: `src/scenes/ExtractionMain.gd:112-125`
- **Issue**: Danger wall scrolls left to right and camera avoids it (line 119), but player contact with wall only ends run (`_end_run(false)`) if `x < _scroll_x - 10`.
- **Problem**: The wall should be a pressing threat that damages/kills characters, but it only detects if party is BEHIND the wall by 10px. The wall visually suggests it's chasing, but mechanically it's harmless.
- **Design Spec**: Section 3.1 mentions "timer is the natural stopping point" but Section 3.5 discusses "tension not is 'morrer é fácil'" — the wall implies ongoing danger
- **Impact**: No pressure from left side; player can move at own pace
- **Expected**: Contact with danger wall = fail state OR wall mechanics mentioned in design
- **Actual**: Wall exists but doesn't interact meaningfully with party
- **Note**: Design doc doesn't explicitly require the wall to be lethal, but it suggests pressure from behind. This may be intentional but feels incomplete.
- **Severity**: S2 — Feature incomplete (wall has no hazard)

### M2: Bonus Canisters (+T) Not Distinguishable in Gameplay
- **File**: Design vs Implementation
- **Issue**: Design doc (Section 3.3) requires "+T" bonus canisters to have "ícone distinto" (distinct icon). Implementation renders them with cyan color and "+T" text (line 80-82 in `ExtractionMain.gd`), but text rendering may be unreadable at in-game size.
- **Problem**: Players must visually distinguish bonus canisters from regular ones to plan routes. Text-based icon is weak.
- **Impact**: Players won't recognize bonus canisters on first run, reducing strategic value
- **Expected**: Clear, visually distinct bonus canister marking
- **Actual**: Small cyan circle with 10pt white "+T" text (hard to read at game resolution/distance)
- **Severity**: S2 — UX/clarity issue

### M3: Moving Canisters Have Hardcoded Initial Positions
- **File**: `src/scenes/ExtractionMain.gd:256-274`
- **Issue**: All canister positions are hardcoded into `_build_canisters()`. There is no procedural generation or variance between runs.
- **Problem**: Design doc (Section 3.1) states "Layout do Mapa tem estrutura de **diamante**" and Section 7 mentions "Gerador de Mapas" as a dependency with "parâmetros de densidade de canisters por rota devem ser configuráveis"
- **Impact**: Every run has identical canister layout; no replayability variance
- **Expected**: Layout varies by seed or config; density configurable
- **Actual**: Static hardcoded positions
- **Severity**: S2 — Feature incomplete (no procedural generation)

### M4: No Danger Wall Speed Ramping on Difficulty
- **File**: `src/scenes/ExtractionMain.gd:112-114`
- **Issue**: Wall speed increases linearly from 70 to 160 px/s over 60 seconds. However, if player collects bonus time (+10s canisters, max 3 × 10 = 30s extra), timer can reach 90s, but wall speed formula never adjusts for extended duration.
- **Code**:
  ```gdscript
  var t_ratio := clampf(1.0 - _run_timer / GameConfig.EXTRACTION_RUN_TIMER, 0.0, 1.0)
  ```
- **Problem**: Uses hardcoded `EXTRACTION_RUN_TIMER` (60s) as denominator. If timer extends to 90s, ratio hits 1.0 at 60s and wall speed plateaus at 160 px/s for remaining 30s.
- **Impact**: With bonus time, wall becomes easier (less pressure after 60s mark)
- **Expected**: Wall speed adapts to actual remaining time
- **Actual**: Wall speed plateaus if timer extended
- **Severity**: S2 — Balance issue

---

## MISSING FEATURES (Not Implemented)

### NI1: ExtractionDrone Class (CRITICAL DEPENDENCY)
- **Referenced in**: Design Section 3.5, Tuning Knobs, Acceptance Criteria
- **Status**: Not implemented
- **Required Mechanics**:
  - Patrol along predefined routes (line 301-305)
  - Fire projectiles at party (Design 3.5: "projétil lento 70 px/s")
  - HP: `GameConfig.EXTRACTION_DRONE_HP` (50, defined in GameConfig)
  - Attack range: 150px (Design 3.5)
  - Can be destroyed by squad combat
- **Impact**: No enemy encounters in medium/dangerous routes
- **Acceptance Criteria**: "O layout sempre tem pelo menos 3 rotas distintas entre entrada e saída" (partially met — routes exist but no drones) and "Inimigos desafiam rota" (not met)
- **Urgency**: BLOCKER for design validation

### NI2: Sentinela de Alta Segurança (High Security Sentinel)
- **Referenced in**: Design Section 3.5 "Nas rotas perigosas: **Sentinela de Alta Segurança**"
- **Status**: Not implemented
- **Mechanic**: "inimigo que bloqueia passagens por 5s antes de se mover (força o jogador a calcular janelas de passagem)"
- **Impact**: Dangerous route lacks timing puzzle element
- **Severity**: S2 — Design feature missing

### NI3: Dynamic Canister Movement
- **File**: `src/scenes/ExtractionMain.gd:284-288`
- **Issue**: Canisters are spawned with moving flag set (line 62-66), but position bouncing logic exists (line 72-74). However, moving canisters are still hardcoded to specific positions in `_build_canisters()`.
- **Problem**: Design requires "70% dos canisters são **dinâmicos**" with "trajetória linear com rebote nas paredes (velocidade: 60–90 px/s)". Implementation spawns 6 moving canisters total (3 medium, 3 dangerous) = ~26% of 23 total canisters, not 70%.
- **Expected**: ~16 of 23 canisters are dynamic with randomized start positions
- **Actual**: 6 fixed-position moving canisters
- **Severity**: S2 — Mechanic doesn't match spec

### NI4: Dynamic Canister Speed Variance
- **File**: `src/scenes/ExtractionMain.gd:286`
- **Issue**: All moving canisters use same speed: `GameConfig.EXTRACTION_CANISTER_SPEED` (70 px/s)
- **Expected**: Speeds should vary 60–90 px/s (Design 3.3)
- **Actual**: All 70 px/s (no variance)
- **Severity**: S3 — Minor balance issue

### NI5: Squad Coverage Area Detection
- **File**: `src/scenes/ExtractionMain.gd:389-397`
- **Issue**: `_check_squad_pickup()` checks distance from each squad member and party node to canister, but does not consider formation-based coverage. Design requires squad flanks extend collection radius.
- **Expected**: With squad of 4, raio de cobertura lateral ~80px beyond leader (Design 3.3)
- **Actual**: Pickup radius fixed at 22px for leader only; formation positions (30-60px offset) don't expand radius
- **Severity**: S2 — Squad mechanic incomplete

### NI6: Mochila Full Feedback
- **File**: `src/scenes/ExtractionMain.gd:403-408`
- **Issue**: When backpack is full, canister is silently skipped. Design Section 3.4 states "Mochila cheia: personagens simplesmente passam pelos canisters sem coletá-los (nenhum feedback intrusivo)", which is implemented correctly, but there is no visual or audio feedback that a pickup was *attempted* and *rejected*.
- **Expected**: No intrusive feedback (silent pass) — CURRENT BEHAVIOR ✓
- **Actual**: Silent pass (correct) but no way for player to know they tried and failed
- **Note**: This may be intentional per design, but playtesting should verify players understand full backpack blocks collection
- **Severity**: S3 — UX clarity (edge case)

### NI7: HUD Alert at 10 Seconds
- **File**: `src/scenes/ExtractionMain.gd:437-449`
- **Issue**: Timer changes color at 10s (red) and 20s (orange), but Design Section 3.3 states "Ao atingir 10 segundos: alerta visual intensificado (pisca, muda de cor)"
- **Expected**: Timer should FLASH/PULSE at 10s, not just change color
- **Actual**: Only color change, no pulsing
- **Severity**: S3 — Polish issue

### NI8: Procedural Map Generation
- **File**: `src/scenes/ExtractionMain.gd:246-275`
- **Issue**: All map layout is hardcoded
- **Expected**: Procedural generation with configurable density per route (Design 6: Dependencies)
- **Actual**: Static layout every run
- **Severity**: S2 — Replayability feature missing

### NI9: Configuration-Driven Canister Counts
- **File**: `src/scenes/ExtractionMain.gd:251-274`
- **Issue**: Canister counts hardcoded per route (Safe: 4, Medium: 6, Dangerous: 8)
- **Expected**: Design Section 7 (Tuning Knobs) lists `combustivel_rota_segura`, `combustivel_rota_intermediaria`, `combustivel_rota_perigosa` as configurable ranges
- **Actual**: Values fixed in code
- **Severity**: S2 — Balance values not tunable

---

## CODE QUALITY ISSUES

### CQ1: Exit Detection Uses Hardcoded Coordinate
- **File**: `src/scenes/ExtractionMain.gd:143`
- **Code**: `if _party.global_position.x >= _EXIT_X - _EXIT_RADIUS:`
- **Issue**: Exit trigger uses `_EXIT_X` constant (line 16), but `_EXIT_RADIUS` is also defined (line 17). Detection should check `>= _EXIT_X` (on the line) but currently checks `>= _EXIT_X - _EXIT_RADIUS` (off by radius).
- **Expected**: Party center reaches EXIT line → run ends
- **Actual**: Party center reaches 45px BEFORE exit line (allowing early exit)
- **Impact**: Playable but allows earlier exits than intended
- **Severity**: S3 — Minor behavioral difference

### CQ2: Timer Display Precision
- **File**: `src/scenes/ExtractionMain.gd:440-442`
- **Code**:
  ```gdscript
  var secs := int(t)
  var frac := int((t - float(secs)) * 10.0)
  _timer_lbl.text = "%d.%d" % [secs, frac]
  ```
- **Issue**: Displays one decimal place (e.g., "5.4s") but timer increments every frame. On 60 FPS, display updates 60x/second, making readability worse than intended.
- **Expected**: Display should be stabilized (only update when it changes)
- **Actual**: Flickers rapidly
- **Severity**: S3 — Polish issue

### CQ3: `_ExitDrawer.route_y` Array Type Annotation Missing
- **File**: `src/scenes/ExtractionMain.gd:463-467`
- **Code**: `var route_y: Array = []` (no element type)
- **Issue**: Should be `var route_y: Array[float] = []` or at minimum include a comment
- **Severity**: S4 — Minor style issue

### CQ4: Redundant Death Check Logic
- **File**: `src/scenes/ExtractionMain.gd:148-157`
- **Issue**: Checks `is_dead` twice per character (lines 150 and 153) with identical logic
- **Expected**: Single check or clear explanation for dual check
- **Actual**: Redundant code
- **Severity**: S4 — Code smell

### CQ5: Missing Null Check on `_party`
- **File**: `src/scenes/ExtractionMain.gd:119, 143, 225, 395`
- **Issue**: Multiple references to `_party.global_position` without null-checks after `_ready()`. If `_build_squad()` fails, code crashes
- **Expected**: Defensive null checks
- **Actual**: Assumes `_party` always exists
- **Severity**: S3 — Crash risk in edge cases

### CQ6: HUD Update Always Called Even After Run Ends
- **File**: `src/scenes/ExtractionMain.gd:102-162`
- **Issue**: `_refresh_hud()` called every frame in `_process()` (line 162), even after `_run_ended = true` (line 414) in `_end_run()`. The outer `if _run_ended: return` (line 103-104) prevents this, but it's redundant to call HUD update if overlay is about to be shown.
- **Severity**: S4 — Minor inefficiency

### CQ7: `_build_hud()` Hardcodes Positions
- **File**: `src/scenes/ExtractionMain.gd:348-379`
- **Issue**: Timer label positioned at `(VIEWPORT_WIDTH * 0.5 - 60, 12)` (line 356). Position is fragile if viewport size changes.
- **Expected**: Use anchors/offsets or config constants
- **Actual**: Magic numbers
- **Severity**: S3 — Maintainability issue

---

## EDGE CASES NOT HANDLED

### EC1: Party Dies During 0.5-1.0s End-Run Wait
- **File**: `src/scenes/ExtractionMain.gd:429-430`
- **Issue**: After `_end_run(true/false)` is called, code waits 2.5 seconds before changing scene. If party dies during this wait, no failover occurs.
- **Expected**: If characters die after run end, state should not change
- **Actual**: Characters can die during end screen, causing inconsistent state
- **Severity**: S2 — State machine issue

### EC2: Run Timer Slightly Overshoots
- **File**: `src/scenes/ExtractionMain.gd:137-140`
- **Issue**: Timer is decremented BEFORE checking `<= 0`, so final frame might have timer at -0.016 (one frame overshoot)
- **Expected**: Timer stops exactly at 0
- **Actual**: Timer undershoots by up to one frame
- **Impact**: Negligible (< 16ms)
- **Severity**: S4 — Minor precision issue

### EC3: Canister Collection on Frame 0
- **File**: `src/scenes/ExtractionMain.gd:127-134`
- **Issue**: Canisters are checked for pickup BEFORE `_build_squad()` has positioned party (party starts at `(100, 600)` but pickup check runs immediately). If a canister is within 22px of entry, it's instantly collected before player sees it.
- **Expected**: Canisters should not be in immediate pickup range
- **Actual**: Layout ensures this doesn't happen (safest canister is at 280px), but it's fragile
- **Severity**: S3 — Layout dependency

### EC4: No Validation of Route Boundaries
- **File**: `src/scenes/ExtractionMain.gd:9-14`
- **Issue**: Route constants define 3 routes with Y positions and heights, but no runtime validation ensures canisters/drones are within bounds. If canisters spawned outside route bounds, player can't reach them.
- **Expected**: Runtime bounds checking or procedural generator enforces bounds
- **Actual**: Hardcoded positions assumed valid
- **Severity**: S3 — Robustness issue

---

## DESIGN VS. IMPLEMENTATION MISMATCHES

### DM1: Squad Formation Coverage Not Implemented
- **Design Spec**: Section 3.3 defines coverage radii based on squad size (Squad of 4 = ~90px lateral). Formation offsets defined in `GameConfig.FORMATION_OFFSETS` (±60px, not matching 20px-per-member definition)
- **Implementation**: `_check_squad_pickup()` only checks individual member distance, ignores formation structure
- **Impact**: Squad size bonus is not realized
- **Severity**: S2

### DM2: Danger Wall Described but Mechanics Unclear
- **Design Spec**: Section 3.1 does NOT explicitly mention auto-scroll or danger wall. Only Section 3.5 says "tension is roteamento" not difficulty. Yet implementation includes danger wall and auto-scroll.
- **Analysis**: This appears to be a design addition (not in spec), added as a mechanic pressure. It's present but incomplete.
- **Severity**: S2 (design ambiguity)

### DM3: Timer Extension by Bonus Canisters Not Validated
- **Design Spec**: Section 3.3 says bonus time canisters add +10s, max 3 per run = 90s total possible
- **Implementation**: Timer is extended by `GameConfig.EXTRACTION_BONUS_TIME` (10.0), no validation that only 2-3 exist
- **Impact**: If all 3 bonus canisters are collected, timer extends correctly. But hardcoded canister positions only have 2 bonus canisters (medium route has 1, dangerous has 1 = 2 total, not 3)
- **Expected**: 2-3 bonus canisters per run
- **Actual**: Hardcoded to exactly 2
- **Severity**: S2 — Design spec not met

---

## ACCEPTANCE CRITERIA PASS/FAIL

### Functional Criteria (from Design Section 8)

| Criteria | Status | Notes |
|----------|--------|-------|
| Contato de qualquer membro do squad com qualquer canister resulta em coleta imediata | **FAIL** | GameState.party mismatch (C2) prevents pickup |
| O timer conta regressivamente e a run encerra automaticamente ao atingir 0 | **PASS** | Line 137-140 working |
| Recursos coletados até o timer zero são mantidos na mochila | **PASS** | Line 417 deposits backpack |
| Todos os personagens mortos = fail state; mochila perde todos os recursos | **FAIL** | All-dead check broken (C3); also logic inverted |
| Chegada voluntária ao EXIT encerra a run | **PASS** (with caveat) | Line 143-145 working but trigger offset wrong (CQ1) |
| Canister de tempo adiciona +10s | **PASS** | Line 404 working |
| Mochila cheia faz personagens passarem sobre canisters | **PASS** | Line 407 checks capacity |
| O layout sempre tem pelo menos 3 rotas distintas | **PASS** | Routes exist (Safe, Medium, Dangerous) |
| Canisters dinâmicos rebotem nas paredes | **PASS** | Line 72-74 rebate logic |

### Experiential Criteria (Playtest)

| Criteria | Status | Notes |
|----------|--------|-------|
| Novo jogador entende "tocar = coletar" | **UNKNOWN** | Requires playtesting; pickup broken so untestable (C2) |
| Após 2 runs, começar a planejar rota | **UNKNOWN** | Fixed layout no variance |
| Múltiplas rotas percebidas como escolha | **UNKNOWN** | Requires playtest and functional drones/sentinels |
| Mochila cheia gera desejo de upgrade | **UNKNOWN** | Requires functional pickup and test |
| Timer em 10s cria urgência | **UNCERTAIN** | Color changes but no pulsing (NI7) |
| Run complete entre 45–75s | **PASS** | 60s base + variable bonus time |

---

## SUMMARY BY SEVERITY

### S1 (Critical) — 3 bugs
- C1: ExtractionDrone missing
- C2: GameState.party mismatch breaks pickup
- C3: All-dead check broken

### S2 (Major) — 10+ issues
- M1: Danger wall harmless
- M2: Bonus canister icon weak
- M3: No procedural generation
- M4: Wall speed doesn't adapt to extended timer
- NI2: No Sentinel
- NI3: Dynamic canister % wrong
- NI5: Squad coverage not implemented
- NI8: No procedural gen
- NI9: Values not tunable
- DM3: Bonus canisters count wrong (2, not 3)

### S3 (Minor) — 8+ issues
- CQ1: Exit detection offset
- CQ5: Null check risks
- CQ7: Hardcoded HUD positions
- EC1: State machine edge case
- EC3: Layout dependency
- EC4: No bounds validation
- NI4: Canister speed no variance
- NI6: Full mochila no feedback
- NI7: Timer pulse missing

### S4 (Polish) — 3 issues
- CQ3: Type annotation
- CQ4: Redundant logic
- CQ6: Inefficiency

---

## TESTING BLOCKERS

1. **Cannot test core mechanic**: Pickup is broken (C2). Fix before any gameplay testing.
2. **Cannot test enemy encounters**: Drones don't exist (C1, NI1). Implement before testing dangerous route.
3. **Cannot validate all-dead fail state**: Logic inverted (C3). Fix before testing death scenarios.
4. **Cannot validate layout variance**: Hardcoded positions (M3, NI8). Implement procedural gen or test with config.

---

## RECOMMENDED FIX PRIORITY

### Phase 1: Unblock Gameplay (CRITICAL)
1. Create `ExtractionDrone` class (C1) — required for scene to load
2. Fix `GameState.party` initialization (C2) — required for pickup
3. Fix all-dead check (C3) — required for fail state

### Phase 2: Implement Missing Features (MAJOR)
4. Implement Sentinela (NI2)
5. Fix dynamic canister % and speed variance (NI3, NI4)
6. Implement squad coverage detection (NI5)
7. Add procedural map generation (NI8, M3)
8. Move canister counts to config (NI9, M3)
9. Add danger wall hazard or fix mechanic clarity (M1)

### Phase 3: Polish & Balance (MINOR)
10. Fix bonus canister icon (M2)
11. Add timer pulse at 10s (NI7)
12. Fix HUD hardcoded positions (CQ7)
13. Fix exit detection offset (CQ1)
14. Add timer display stabilization (CQ2)

---

## FILES INVOLVED

- **Primary**: `/c/Users/leeew/OneDrive/Documentos/Jogos/orbs/.claude/worktrees/pensive-ride/src/scenes/ExtractionMain.gd`
- **Scene**: `src/scenes/ExtractionMain.tscn` (minimal, just references script)
- **Dependencies**:
  - `src/autoload/GameConfig.gd` (constants OK)
  - `src/autoload/GameState.gd` (state tracking, has issues)
  - `src/autoload/HubState.gd` (backpack system OK)
  - `src/systems/Party.gd` (squad management OK)
  - `src/systems/drag/DragController.gd` (input OK)
- **Missing**: `src/scenes/ExtractionDrone.gd` (MUST CREATE)

---

## CONCLUSION

The Extraction Run zone is a **SKELETON IMPLEMENTATION** with working timer and basic canister collection, but missing critical features and broken core mechanics. The three C1 bugs (missing drone class, party initialization, death check) must be fixed before the zone is testable. Once those are fixed, the S2 features (procedural generation, enemies, squad mechanics) should be prioritized to match the design spec.

**Recommendation**: Do NOT attempt playtesting until C1-C3 are resolved. Code is not production-ready.

