# Rocket Tuning — Verified Numbers
**Project:** Fungineer | **Date:** 2026-06-05 | **Status:** Draft for Review

---

## 1. Resource Cost Table — Full Rocket (8 pieces)

| Resource               | Total Cost | Pieces That Consume It                                  | Primary Zone Source(s)                        | Payout Mechanism                                      |
|------------------------|------------|---------------------------------------------------------|-----------------------------------------------|-------------------------------------------------------|
| scrap                  | 7          | Base(3), Revestimento(2), Ignição(2)                    | Cordilheira, Sacrifício (backpack cap=3)       | Cordilheira: banked×2; Sacrifício: deposit backpack   |
| combustivel_volatil    | 5          | Motor(3), Sistema Vital(2)                              | Extração                                      | banked; FUEL_GOAL=8, victory ≥4                       |
| nucleo_logico          | 3          | Processador(2), Ignição(1)                              | Circuito                                      | collected; meta GOAL=14                               |
| fragmentos_estruturais | 6          | Revestimento(3), Blindagem(3)                           | Labirinto (≤4 caixas), Catedral               | Labirinto: banked; Catedral: ceil(reward/4)           |
| ai_components          | 7          | Rede Neural(4), Blindagem(3)                            | Stealth, Torres, Sacrifício (backpack cap=3)  | Stealth: banked; Torres: reward; Sacrifício: deposit  |
| sinais_controle        | 50         | Rede Neural(20), Ignição(30)                            | Campo ONLY                                    | floor(signalsAcc) — single source, no alternatives   |
| biomassa_adaptativa    | 10         | Sistema Vital(6), Ignição(4)                            | Hordas (large/variable), Infecção             | Hordas: large payout; Infecção: ceil(banked/4)        |

---

## 2. Runs-to-Launch Estimate per Resource

### Methodology
- "Runs-to-launch" = ceil(total_cost / expected_payout_per_relevant_zone_run)
- A "run" is defined as one full zone completion contributing to that resource
- Multiple zones can be played per run; estimate assumes ~2–3 zone visits per full run

### Per-Resource Analysis

#### scrap — Cost: 7
- Cordilheira payout: banked×2. Assuming banked ~6–8 shards/run → ~12–16 per Cordilheira visit.
- Trivial: **1 Cordilheira run** covers full cost with surplus.
- Runs-to-launch: **~1**

#### combustivel_volatil — Cost: 5
- Extração payout: banked, FUEL_GOAL=8, victory threshold ≥4.
- A successful Extração run yields ≥4, typically 4–8.
- Runs-to-launch: **~1–2**
- Trivial category.

#### nucleo_logico — Cost: 3
- Circuito payout: collected, meta GOAL=14. A single run collecting 14 yields 14 units deposited.
- Cost 3 is covered immediately in **1 Circuito run**.
- Runs-to-launch: **~1**
- Trivial category.

#### fragmentos_estruturais — Cost: 6
- Labirinto: banked, capped at 4 boxes per run → max 4/run.
- Catedral: ceil(reward/4), supplementary and small.
- Runs-to-launch: **~2** (two Labirinto completions at cap).
- Manageable.

#### ai_components — Cost: 7
- Stealth: banked (variable, assume 4–6/run). Torres: reward (similar range).
- Two sources make this flexible.
- Runs-to-launch: **~2** across Stealth + Torres.
- Manageable.

#### biomassa_adaptativa — Cost: 10
- Hordas: large/variable payout — assume 6–10/run on a strong run, 3–5 on weak.
- Infecção: ceil(banked/4) — e.g., banked=12 → yields 3. Supplementary only.
- Runs-to-launch: **~2–3** (Hordas is the primary; Infecção adds small amounts).
- Moderate pressure, acceptable.

#### sinais_controle — Cost: 50 *** CRITICAL BOTTLENECK ***
- Single source: Campo, payout = floor(signalsAcc).
- signalsAcc accumulation rate unknown precisely, but cost=50 is extreme relative to all other resources.
- Assuming Campo yields 8–12 signals/run (reasonable for a zone with accumulation mechanic):
  - At 10/run: **5 runs of Campo alone** just for sinais_controle.
  - At 6/run (weak run): **9 runs of Campo alone**.
- No second source exists. No alternative path.
- Runs-to-launch (sinais only): **~5–9 Campo runs**
- **This is the dominant bottleneck by a factor of 3–5x over every other resource.**

### Summary Table

| Resource               | Cost | Runs-to-Source | Bottleneck Severity |
|------------------------|------|----------------|---------------------|
| scrap                  | 7    | ~1             | Trivial             |
| combustivel_volatil    | 5    | ~1–2           | Trivial             |
| nucleo_logico          | 3    | ~1             | Trivial             |
| fragmentos_estruturais | 6    | ~2             | Manageable          |
| ai_components          | 7    | ~2             | Manageable          |
| biomassa_adaptativa    | 10   | ~2–3           | Moderate            |
| sinais_controle        | 50   | ~5–9           | **CRITICAL**        |

**Dominant bottleneck: sinais_controle at cost=50 from a single zone (Campo).**
If a player pursues the rocket optimally in all other resources, they still must run Campo 5–9 times, turning the final stretch into a repetitive single-zone grind.

---

## 3. Tuning Proposals

### Design Target
- Total runs to launch: **6–10 runs**, with meaningful visits to **4–6 different zones**.
- sinais_controle must stop being a hard-grind wall.
- biomassa_adaptativa should remain the soft pressure point (moderate tension).

### Option A — Reduce sinais_controle Cost in Pieces (Least Invasive)

Reduce the cost embedded in Rede Neural and Ignição:

| Piece        | Current sinais | Proposed sinais | Delta |
|--------------|----------------|-----------------|-------|
| Rede Neural  | 20             | 12              | −8    |
| Ignição      | 30             | 18              | −12   |
| **Total**    | **50**         | **30**          | **−20** |

- At 30 cost and 10/run Campo payout: **3 Campo runs**.
- Combined with other zones: total rocket runs ~6–8. Target achieved.
- Risk: Campo may feel less essential if reduced too far. 30 still requires 3 focused Campo runs.

### Option B — Add a Second Source for sinais_controle

Introduce sinais_controle as a secondary drop in an existing zone without breaking its primary economy:

| Zone          | Current Primary Drop      | Proposed Secondary Drop          | Rate              |
|---------------|--------------------------|-----------------------------------|-------------------|
| Torres        | ai_components (reward)   | sinais_controle (secondary)       | floor(reward/3)   |
| Circuito      | nucleo_logico (collected)| sinais_controle (partial)         | floor(collected/5)|

- Torres secondary: if reward=9 → +3 sinais. Over 2 Torres runs: +6 sinais.
- Circuito secondary: if collected=14 (GOAL) → +2 sinais. Over 2 Circuito runs: +4 sinais.
- Combined secondary contribution: ~10 sinais across natural zone play.
- Campo still required for bulk; cost stays at 50 but ~10 comes "for free."
- Net Campo runs needed: ceil((50−10)/10) = **4 Campo runs**. Moderate improvement.

### Option C — Combined Approach (RECOMMENDED)

Apply both A and B at moderate settings:

**Cost reduction:**
- Rede Neural: 20 → 15 sinais
- Ignição: 30 → 22 sinais
- New total: **37 sinais_controle**

**Second source:**
- Torres: floor(reward/3) sinais as secondary drop
- Torres is already visited for ai_components (cost=7, 2 runs needed) → sinais come naturally

**Campo payout increase (optional, if signalsAcc rate is tunable):**
- Raise floor(signalsAcc) effective rate by increasing accumulation tick from X to X×1.3
- Effectively: 10/run → 13/run (30% increase)

**Result under Option C:**
- Natural Torres play (2 runs, reward ~9/run): +6 sinais
- Campo at 13/run: ceil((37−6)/13) = ceil(31/13) = **3 Campo runs**
- Total Campo visits: 3, total Torres: 2 (already needed for ai_components)
- Total meaningful zone variety: Campo×3, Torres×2, Hordas×2, Labirinto×2, Extração×1, Cordilheira×1 = **~6 zone types, ~11 zone runs across ~7–8 full runs**
- **Hits the 6–10 run target with forced zone variety.**

### Option D — Raise Campo Payout Only (High Risk)

- Keep cost=50, raise Campo payout to ~17/run (floor(signalsAcc) at higher rate).
- Runs: ceil(50/17) = 3 Campo runs.
- Problem: incentivizes pure Campo spam; no zone variety. Not recommended.

---

## 4. GameConfig / JSON — Tunable Parameters

The following values should be externalized as configuration constants. Option C values shown as proposed defaults with original values noted.

```json
{
  "rocket_recipe": {
    "pieces": {
      "Base":           { "scrap": 3 },
      "Motor":          { "combustivel_volatil": 3 },
      "Processador":    { "nucleo_logico": 2 },
      "Revestimento":   { "fragmentos_estruturais": 3, "scrap": 2 },
      "Rede_Neural":    { "ai_components": 4, "sinais_controle": 15 },
      "Sistema_Vital":  { "biomassa_adaptativa": 6, "combustivel_volatil": 2 },
      "Blindagem":      { "fragmentos_estruturais": 3, "ai_components": 3 },
      "Ignicao":        { "scrap": 2, "nucleo_logico": 1, "sinais_controle": 22, "biomassa_adaptativa": 4 }
    },
    "totals_proposed": {
      "scrap": 7,
      "combustivel_volatil": 5,
      "nucleo_logico": 3,
      "fragmentos_estruturais": 6,
      "ai_components": 7,
      "sinais_controle": 37,
      "biomassa_adaptativa": 10
    },
    "totals_original": {
      "sinais_controle": 50
    }
  },
  "zone_payouts": {
    "Campo": {
      "resource": "sinais_controle",
      "formula": "floor(signalsAcc)",
      "signalsAcc_tick_multiplier": 1.3,
      "note": "Original multiplier: 1.0. Increase accumulation rate by 30%."
    },
    "Torres": {
      "primary": { "resource": "ai_components", "formula": "reward" },
      "secondary": {
        "resource": "sinais_controle",
        "formula": "floor(reward / 3)",
        "note": "NEW: secondary sinais drop. e.g. reward=9 → +3 sinais."
      }
    },
    "Hordas":    { "resource": "biomassa_adaptativa", "formula": "variable_large" },
    "Infeccao":  { "resource": "biomassa_adaptativa", "formula": "ceil(banked / 4)" },
    "Stealth":   { "resource": "ai_components",       "formula": "banked" },
    "Circuito":  { "resource": "nucleo_logico",        "formula": "collected", "GOAL": 14 },
    "Extracao":  { "resource": "combustivel_volatil",  "formula": "banked", "FUEL_GOAL": 8, "victory_min": 4 },
    "Labirinto": { "resource": "fragmentos_estruturais","formula": "banked", "box_cap": 4 },
    "Catedral":  { "resource": "fragmentos_estruturais","formula": "ceil(reward / 4)" },
    "Cordilheira":{ "resource": "scrap",               "formula": "banked * 2" },
    "Sacrificio": { "resources": ["scrap", "ai_components"], "formula": "depositBackpack", "backpack_cap": 3 }
  },
  "tuning_flags": {
    "sinais_cost_reduction_enabled": true,
    "torres_secondary_sinais_enabled": true,
    "campo_tick_boost_enabled": true
  }
}
```

### Tuning Parameter Safe Ranges

| Parameter                         | Original | Proposed | Min  | Max  | Impact if Max'd                          |
|-----------------------------------|----------|----------|------|------|------------------------------------------|
| sinais_controle total cost        | 50       | 37       | 25   | 50   | <25: Campo trivial; >50: grind wall      |
| Rede_Neural sinais cost           | 20       | 15       | 8    | 20   | <8: piece too cheap                      |
| Ignicao sinais cost               | 30       | 22       | 15   | 30   | <15: Ignição loses identity as hard piece|
| campo_tick_multiplier             | 1.0      | 1.3      | 1.0  | 2.0  | >2.0: Campo trivializes in 1–2 runs      |
| torres_secondary formula divisor  | n/a      | 3        | 2    | 6    | divisor=2: sinais flood; divisor=6: negligible|
| biomassa_adaptativa total cost    | 10       | 10       | 6    | 14   | <6: Hordas trivial; >14: second bottleneck|

---

## 5. Feedback Loop Analysis

### Positive Loop (Risk: Snowball)
- Player clears Hordas → gains biomassa → unlocks Sistema Vital early → rocket progress visible → motivation to continue.
- **Intentional.** Early rocket piece completion is a reward signal, not a balance problem.

### Negative Loop (Risk: Grind Wall) — CRITICAL
- sinais_controle=50 from Campo only → player must return to same zone repeatedly → diminishing engagement → dropout before launch.
- **Unintentional.** Option C corrects this by distributing sinais across Torres (natural visit) and reducing total cost.

### Neutral Loop (Fine as-is)
- Labirinto capped at 4 boxes/run → player cannot rush fragmentos. Forces 2 visits minimum.
- This is acceptable tension; fragmentos_estruturais is not a bottleneck (cost=6, 2 capped runs = exactly enough).

---

## 6. Executive Summary

**Problem:** sinais_controle costs 50 units from a single source (Campo), requiring 5–9 Campo runs while all other resources resolve in 1–3 runs each. This creates a severe grind wall and eliminates zone variety in the late game.

**Recommendation (Option C):**
1. Reduce sinais_controle recipe cost: 50 → 37 (Rede Neural 20→15, Ignição 30→22).
2. Add sinais_controle as secondary drop in Torres: floor(reward/3).
3. Raise Campo accumulation tick by 30% (multiplier 1.0 → 1.3).

**Projected outcome:** 3 Campo runs + 2 Torres runs (already needed for ai_components) + natural visits to Hordas, Labirinto, Extração = **~7–8 total full runs**, visiting **5–6 distinct zone types**. Hits the 6–10 run target with organic zone variety.

**GameConfig impact:** 3 JSON parameters change (sinais costs in 2 pieces, 1 new secondary drop rule in Torres, 1 tick multiplier in Campo). All changes are hot-configurable if externalized as shown in Section 4.
