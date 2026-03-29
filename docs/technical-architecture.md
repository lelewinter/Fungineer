---
tags: [fungineer, documentacao, tecnico]
date: 2026-03-21
tipo: documentacao
---

# Technical Architecture — Orbit Rescue MVP

**Version**: 1.0
**Date**: 2026-03-21
**Engine**: Godot 4.6 / GDScript

---

## Architecture Principles

1. **Data-driven config**: Every tunable value lives in `GameConfig.gd`. No magic numbers in logic scripts.
2. **Scene-per-entity**: Each character, enemy, and UI element is its own `.tscn` scene, instantiated at runtime.
3. **Signal-based communication**: Systems communicate via Godot signals. No direct cross-system method calls except through well-defined interfaces.
4. **No physics for combat**: Damage and range use `Area2D` overlap detection. Jolt physics is disabled for game entities (only used if needed for future destructibles).
5. **Autoload singletons**: Only 2 autoloads — `GameConfig` (constants) and `GameState` (runtime state machine). Everything else is scene-local.

---

## Project Structure

```
src/
├── autoload/
│   ├── GameConfig.gd          # All numeric constants (HP, damage, timers, speeds)
│   └── GameState.gd           # Run state machine (playing, paused, game_over, victory)
├── entities/
│   ├── characters/
│   │   ├── BaseCharacter.gd   # Abstract base: HP, attack, death signal
│   │   ├── Guardian.tscn/.gd
│   │   ├── Striker.tscn/.gd
│   │   ├── Artificer.tscn/.gd
│   │   └── Medic.tscn/.gd
│   └── enemies/
│       ├── BaseEnemy.gd       # Abstract base: HP, target, attack, death signal
│       ├── Runner.tscn/.gd
│       ├── Bruiser.tscn/.gd
│       ├── Spitter.tscn/.gd
│       └── SentinelCore.tscn/.gd
├── systems/
│   ├── drag/
│   │   └── DragController.gd  # Converts touch/mouse input → party movement target
│   ├── combat/
│   │   └── CombatSystem.gd    # Auto-attack logic; queries area2d; fires damage signals
│   ├── wave/
│   │   └── WaveSpawner.gd     # Timer-driven wave definitions; spawns enemies at edges
│   └── power/
│       ├── PowerManager.gd    # Holds active power; handles activation/deactivation
│       └── SiegeMode.gd       # Siege Mode implementation
├── data/
│   └── powers/                # PowerResource .tres files (one per power)
└── ui/
    ├── HUD.tscn/.gd           # Main HUD: HP bars, timer, power indicator
    ├── GameOverScreen.tscn/.gd
    └── VictoryScreen.tscn/.gd
```

---

## Scene Graph (Main.tscn)

```
Main (Node2D)
├── World (Node2D)
│   ├── Arena (Node2D)        # Static arena geometry
│   ├── TechObjective (Area2D) # Optional capture zone
│   ├── Party (Node2D)        # Holds character instances; moves as unit
│   │   ├── [Guardian]
│   │   └── [Striker]
│   └── Enemies (Node2D)      # Dynamic enemy pool
├── Systems (Node)
│   ├── DragController
│   ├── WaveSpawner
│   └── PowerManager
└── UI (CanvasLayer)
    └── HUD
```

---

## Autoloads

### GameConfig.gd

```gdscript
# All values exposed as constants. Edit here to tune the game.
const ARENA_WIDTH: float = 800.0
const ARENA_HEIGHT: float = 600.0

# Party
const MAX_PARTY_SIZE: int = 4
const PARTY_FORMATION_SPACING: float = 60.0
const DRAG_LERP_FACTOR: float = 8.0

# Characters (HP)
const GUARDIAN_HP: float = 200.0
const STRIKER_HP: float = 120.0
const ARTIFICER_HP: float = 100.0
const MEDIC_HP: float = 80.0

# Characters (Combat)
const GUARDIAN_DAMAGE: float = 18.0
const GUARDIAN_ATTACK_RANGE: float = 80.0
const GUARDIAN_ATTACK_SPEED: float = 1.2  # attacks per second
const STRIKER_DAMAGE: float = 12.0
const STRIKER_ATTACK_RANGE: float = 100.0
const STRIKER_ATTACK_SPEED: float = 2.5
# ... (all characters)

# Enemies
const RUNNER_HP: float = 30.0
const RUNNER_SPEED: float = 200.0
const RUNNER_DAMAGE: float = 5.0
const BRUISER_HP: float = 150.0
const BRUISER_SPEED: float = 60.0
const BRUISER_DAMAGE: float = 25.0
const SPITTER_HP: float = 60.0
const SPITTER_SPEED: float = 40.0
const SPITTER_DAMAGE: float = 12.0
const SPITTER_RANGE: float = 120.0

# Boss
const SENTINEL_HP: float = 600.0
const SENTINEL_DASH_INTERVAL: float = 8.0
const SENTINEL_VULNERABLE_WINDOW: float = 2.0
const SENTINEL_PHASE2_THRESHOLD: float = 0.6  # 60% HP

# Waves
const WAVE_1_DELAY: float = 5.0
const WAVE_2_DELAY: float = 40.0
const BOSS_SPAWN_TIME: float = 90.0

# Powers
const SIEGE_MODE_STILLNESS_TIME: float = 1.5
const SIEGE_MODE_DAMAGE_MULTIPLIER: float = 3.0
const OVERCLOCK_DURATION: float = 10.0
const OVERCLOCK_COOLDOWN: float = 15.0
const OVERCLOCK_ATTACK_MULTIPLIER: float = 2.5
const OVERCLOCK_HP_DRAIN: float = 5.0  # per second

# Meta
const TECH_FRAGMENTS_BASE_REWARD: int = 20
const TECH_FRAGMENTS_OBJECTIVE_BONUS: float = 0.5
const CAPTURE_ZONE_RADIUS: float = 80.0
const CAPTURE_TIME_REQUIRED: float = 5.0
```

### GameState.gd

```gdscript
# Runtime state only — no config values here
enum RunState { IDLE, PLAYING, PAUSED, GAME_OVER, VICTORY }

var current_state: RunState = RunState.IDLE
var run_time: float = 0.0
var party: Array[BaseCharacter] = []
var tech_fragments_earned: int = 0

signal state_changed(new_state: RunState)
signal character_died(character: BaseCharacter)
signal run_ended(victory: bool, fragments: int)
```

---

## Key Systems

### Drag Controller

- Listens for `InputEventMouseButton` (desktop) and `InputEventScreenDrag` (mobile)
- On drag: sets `Party.move_target` to world position
- Party node lerps toward `move_target` each frame at `GameConfig.DRAG_LERP_FACTOR`
- Formation: each character maintains a fixed offset from Party center

```gdscript
# Formation offsets for up to 4 characters
const FORMATION_OFFSETS = [
    Vector2(0, 0),        # Leader (slot 0)
    Vector2(-60, 20),     # Slot 1
    Vector2(60, 20),      # Slot 2
    Vector2(0, 50),       # Slot 3
]
```

### Auto-Combat

- Each character has an `Area2D` (attack range circle)
- On `body_entered`/`body_exited`, character tracks valid targets
- On attack timer tick: picks nearest valid target, calls `target.take_damage(damage)`
- Damage signal bubbles up to HUD for visual feedback
- No physics — Area2D overlap is purely logical

### Wave Spawner

- Reads wave definitions from `GameConfig`
- Uses `Timer` nodes; on timeout, instantiates enemy scenes at random edge positions
- Wave sequence: Wave 1 → Rescue Event → Wave 2 → Power Offer → Boss
- On boss death: emits `run_ended(true, fragments)`

### Power Manager

- Holds reference to active `PowerResource`
- `PowerResource` is a `Resource` with virtual methods: `on_activate()`, `on_deactivate()`, `_process(delta)`
- Powers modify character stats via `GameState.party` reference
- Siege Mode is the only power in Sprint 1; others stubbed for Sprint 2

---

## Data Resources

### PowerResource (.tres)

```gdscript
class_name PowerResource extends Resource

@export var power_name: String
@export var description: String
@export var cooldown: float = 0.0
@export var duration: float = 0.0  # 0 = passive/toggle

func on_activate(party: Array) -> void:
    pass  # override in each power script

func on_deactivate(party: Array) -> void:
    pass

func process(delta: float, party: Array) -> void:
    pass
```

---

## Rendering Notes

- **Renderer**: Mobile (Forward+ for desktop testing)
- **Resolution**: 800×600 base; let Godot stretch to device
- **Art style MVP**: Geometric primitives (circles, rectangles) with color-coded teams. No sprites until Sprint 2.
- Enemy colors: Runner = red, Bruiser = dark red, Spitter = orange
- Party colors: Guardian = blue, Striker = cyan, Artificer = purple, Medic = green
- Damage numbers: floating text, 0.5s fade-out

---

## Performance Budget (MVP)

| Metric | Target | Hard Limit |
|---|---|---|
| FPS (mobile) | 60 | 30 |
| Enemies on screen | 20 | 40 |
| Draw calls | < 30 | 60 |
| Memory | < 150 MB | 300 MB |

Enemy pooling: pre-instantiate 20 Runner, 10 Bruiser, 10 Spitter at scene load. Reuse via `visible = false` / `visible = true`.

---

## Testing

- **Framework**: GUT (Godot Unit Testing)
- **Required for Sprint 1**: Tests for GameConfig constant completeness, CombatSystem damage calculation, WaveSpawner timer sequence
- Run with: `godot --headless -s addons/gut/gut_cmdln.gd`

---

## Known Gaps / Post-MVP

- Rescue event system (Sprint 2)
- Meta progression screen + fragment persistence (Sprint 2)
- Sound design (Sprint 3)
- Sprite art (Sprint 3)
- iOS export setup (post-MVP)
- Accessibility (portrait/landscape, font scaling) — TBD after prototype
