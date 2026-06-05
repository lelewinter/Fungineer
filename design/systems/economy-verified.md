# Economy Audit — Verified Data
**Date:** 2026-06-05
**Status:** Structural audit; no fine-tuning applied.
**Scope:** Resource faucet/sink mapping, single-source risks, degenerate strategies, structural recommendations.
**Note on prior findings:** The "broken loop" concern from round 1 (resources disappearing) is confirmed FALSE. `depositFlow` uses valid keys throughout; all resources reach the rocket correctly.

---

## 1. Faucet → Sink Table

| Resource | Rocket Cost | Sources (Zones) | Source Count |
|---|---|---|---|
| scrap | 7 | Cordilheira (banked x2), Sacrificio (backpack cap 3) | 2 |
| combustivel_volatil | 5 | Extracao (banked, goal 8) | **1** |
| nucleo_logico | 3 | Circuito (collected, goal 14) | **1** |
| fragmentos_estruturais | 6 | Labirinto (banked ≤4), Catedral (ceil(reward/4)) | 2 |
| ai_components | 7 | Stealth (banked), Torres (reward), Sacrificio (backpack cap 3) | 3 |
| sinais_controle | **50** | CAMPO (floor(signalsAcc)) — UNIQUE | **1** |
| biomassa_adaptativa | 10 | Hordas (large payout), Infeccao (ceil(banked/4), small) | 2 |

**Sink:** All resources flow into rocket construction. No secondary sinks (crafting, trading, upgrades) documented at this time.

---

## 2. Single-Source Risk Assessment

Three resources have only one zone as their acquisition source. This creates forced grind corridors: a player who needs more of that resource has exactly one place to go.

### sinais_controle — CRITICAL RISK
- **Cost:** 50 (highest of all resources, ~2.5x the next highest)
- **Source:** Campo only, via `floor(signalsAcc)`
- **Problem:** The combination of highest cost and exclusive single source makes this the hardest bottleneck in the game. A player short on sinais_controle must replay Campo repeatedly with no alternative path. This breaks zone variety — late-game players will route-lock into Campo runs regardless of other zone states.
- **Acquisition mechanic note:** `floor(signalsAcc)` means partial progress is silently discarded each run. A run that ends at signalsAcc = 7.9 yields only 7, punishing early exits and incentivizing full-length Campo runs specifically (compounding the grind incentive).

### combustivel_volatil — MODERATE RISK
- **Cost:** 5 (moderate)
- **Source:** Extracao only (banked, goal 8)
- **Problem:** Goal-gated acquisition (must reach meta 8 within the zone) means a player who exits Extracao early walks away with zero fuel. This is a soft single-source with a hidden threshold gate. Low cost limits total grind pressure, but the threshold mechanic creates frustrating near-miss runs.

### nucleo_logico — LOW-MODERATE RISK
- **Cost:** 3 (lowest cost)
- **Source:** Circuito only (collected, goal 14)
- **Problem:** Goal 14 is the highest threshold of the two goal-gated resources. However, cost is low enough that players do not need many runs. Risk escalates if rocket cost is raised in future tuning.

---

## 3. Degenerate Strategy: Campo Farming

### The Strategy
Repeat Campo runs indefinitely, banking sinais_controle each time. Because sinais_controle costs 50 and has no alternative source, players who optimize for rocket completion will naturally identify Campo as the mandatory farm zone. Once identified, the optimal play is to maximize Campo run frequency, ignoring other zones until sinais_controle is capped.

### Why Global Deterioration Does Not Deter This

`HubState.getSpawnMultiplier` escalates spawn density (1.0 -> 1.25 -> 1.5) based on `total_runs`, not per-zone run count.

This has two consequences for the degenerate strategy:

1. **No targeted cost.** Farming Campo 10 times does not make Campo harder. It makes every zone harder equally. The player pays a distributed tax, not a Campo-specific tax.
2. **Relative advantage preserved.** Because all zones become harder at the same rate, the relative value of farming Campo vs. playing other zones does not change. A player who needs sinais_controle still has no reason to play any zone other than Campo. Deterioration adds friction but does not redirect behavior.

A per-zone deterioration model would change the calculus: farming Campo would make Campo specifically more expensive, eventually making it cheaper (in effort terms) to play other zones — which is the behavioral pressure needed to maintain zone variety.

---

## 4. Structural Recommendations

These are structural interventions, not tuning adjustments. They address root causes rather than cost numbers.

### R1: Add a Second Source for sinais_controle (Priority: High)

The single-source bottleneck on the highest-cost resource is the most urgent structural issue. Two viable approaches:

**Option A — Secondary zone drop.** A high-difficulty zone (e.g., Catedral or Torres) yields a small sinais_controle reward on completion. This maintains Campo as the primary source while giving players an alternative path and making late-game routing decisions meaningful.

**Option B — Conversion mechanic.** Allow players to convert excess of another resource (e.g., ai_components, which has 3 sources) into sinais_controle at a penalty rate (e.g., 3:1). This creates a soft second source without adding a new zone reward, and also provides a sink for resource overflows.

Either option breaks the mandatory Campo loop and restores zone variety as a real player choice.

### R2: Switch Deterioration to Per-Zone Tracking (Priority: High)

Replace `total_runs` with a per-zone run counter in `HubState.getSpawnMultiplier`. Each zone tracks its own deterioration independently.

**Effect:** Repeatedly farming one zone makes that zone progressively harder while leaving others at baseline. This naturally pushes players toward zone rotation — not because rotation is rewarded, but because staying in one zone becomes costly. This is a friction-based deterrent rather than a reward-based incentive, which is more robust against optimization pressure.

**Design note:** Deterioration could decay slowly over time (or when other zones are played) to prevent a player from permanently locking themselves out of a zone through early over-farming.

### R3: Address floor(signalsAcc) Truncation (Priority: Medium)

The floor truncation on Campo's payout discards partial progress and incentivizes full-run completion in a punishing way. Consider one of:
- Carry fractional accumulation across runs (signalsAcc persists between runs, not just within)
- Use round() instead of floor() to eliminate directional bias
- Grant a partial payout on early exit equal to floor(signalsAcc) with the remainder carried forward

This does not solve the single-source problem but reduces the "wasted run" frustration that compounds Campo farming fatigue.

### R4: Monitor combustivel_volatil Threshold Gate (Priority: Low)

The goal-8 threshold in Extracao creates zero-payout early exits. If player data shows high Extracao abandonment rates, consider a partial payout below the threshold (e.g., 1 unit for reaching goal 4, 3 for goal 6, 5 for goal 8). This is a quality-of-life fix rather than a structural one.

---

## Summary of Structural Issues by Severity

| Issue | Severity | Recommendation |
|---|---|---|
| sinais_controle: single source + highest cost | Critical | R1: add second source |
| Global deterioration does not deter zone farming | High | R2: per-zone deterioration |
| floor(signalsAcc) punishes partial Campo runs | Medium | R3: carry accumulation or use round() |
| combustivel_volatil threshold gate | Low | R4: partial payout below goal |

---

*Confirmed: depositFlow key validation is intact. No resources are lost in transit. Prior "broken loop" report was a false positive.*
