## GameConfig — Central configuration for all numeric values.
## Edit here to tune the game. Never hardcode these values in logic scripts.
extends Node

# ── Viewport / UI (fixed — used by HUD and overlay positioning) ─────────────
const VIEWPORT_WIDTH: float = 480.0
const VIEWPORT_HEIGHT: float = 854.0

# ── Arena (game world — larger than viewport, requires Camera2D) ─────────────
const ARENA_WIDTH: float = 3200.0
const ARENA_HEIGHT: float = 2400.0

# ── Party ───────────────────────────────────────────────────────────────────
const MAX_PARTY_SIZE: int = 4
const PARTY_FORMATION_SPACING: float = 60.0
const DRAG_LERP_FACTOR: float = 8.0
const DRAG_DEAD_ZONE: float = 5.0  # pixels — ignore tiny movements

## Formation offsets per slot index (slot 0 = leader)
## Note: typed array constants not supported in GDScript — use plain Array
const FORMATION_OFFSETS: Array = [
	Vector2(0.0, 0.0),
	Vector2(-60.0, 30.0),
	Vector2(60.0, 30.0),
	Vector2(0.0, 60.0),
]

# ── Characters — HP ─────────────────────────────────────────────────────────
const GUARDIAN_HP: float = 200.0
const STRIKER_HP: float = 120.0
const ARTIFICER_HP: float = 100.0
const MEDIC_HP: float = 80.0

# ── Characters — Combat ──────────────────────────────────────────────────────
const GUARDIAN_DAMAGE: float = 18.0
const GUARDIAN_ATTACK_RANGE: float = 80.0
const GUARDIAN_ATTACK_SPEED: float = 1.2  # attacks/second
const GUARDIAN_DAMAGE_REDUCTION: float = 0.2  # 20% less damage taken

const STRIKER_DAMAGE: float = 12.0
const STRIKER_ATTACK_RANGE: float = 100.0
const STRIKER_ATTACK_SPEED: float = 2.5

const ARTIFICER_DAMAGE: float = 8.0
const ARTIFICER_ATTACK_RANGE: float = 140.0
const ARTIFICER_ATTACK_SPEED: float = 0.6
const ARTIFICER_EXPLOSION_RADIUS: float = 60.0
const ARTIFICER_CLUSTER_BONUS: float = 0.5  # +50% damage to clusters of 3+

const MEDIC_DAMAGE: float = 4.0
const MEDIC_ATTACK_RANGE: float = 90.0
const MEDIC_ATTACK_SPEED: float = 1.0
const MEDIC_HEAL_INTERVAL: float = 5.0
const MEDIC_HEAL_AMOUNT: float = 15.0

# ── Enemies ──────────────────────────────────────────────────────────────────
const RUNNER_HP: float = 30.0
const RUNNER_SPEED: float = 130.0
const RUNNER_DAMAGE: float = 5.0
const RUNNER_ATTACK_INTERVAL: float = 0.8
const RUNNER_ATTACK_RANGE: float = 30.0

const BRUISER_HP: float = 150.0
const BRUISER_SPEED: float = 60.0
const BRUISER_DAMAGE: float = 25.0
const BRUISER_ATTACK_INTERVAL: float = 1.5
const BRUISER_ATTACK_RANGE: float = 50.0

const SPITTER_HP: float = 60.0
const SPITTER_SPEED: float = 40.0
const SPITTER_DAMAGE: float = 12.0
const SPITTER_ATTACK_INTERVAL: float = 1.8
const SPITTER_RANGE: float = 150.0
const SPITTER_PREFERRED_DISTANCE: float = 120.0
const SPITTER_PROJECTILE_SPEED: float = 220.0

# ── Boss: Sentinel Core ──────────────────────────────────────────────────────
const SENTINEL_HP: float = 600.0
const SENTINEL_DASH_INTERVAL_P1: float = 8.0
const SENTINEL_DASH_INTERVAL_P2: float = 5.0
const SENTINEL_DASH_SPEED: float = 600.0
const SENTINEL_VULNERABLE_WINDOW: float = 2.0
const SENTINEL_PHASE2_THRESHOLD: float = 0.6  # switches at 60% HP
const SENTINEL_ADD_INTERVAL_P1: float = 15.0
const SENTINEL_ADD_INTERVAL_P2: float = 12.0
const SENTINEL_ADD_COUNT_P1: int = 3  # Runners only
const SENTINEL_ORB_INTERVAL: float = 4.0  # Phase 2 only
const SENTINEL_ORB_SPEED: float = 90.0
const SENTINEL_ORB_DAMAGE: float = 8.0

# ── Waves ────────────────────────────────────────────────────────────────────
const WAVE_1_DELAY: float = 3.0   # seconds after run start
const WAVE_1_RUNNER_COUNT: int = 10
const WAVE_1_BRUISER_COUNT: int = 2
const WAVE_2_DELAY: float = 25.0  # seconds after run start
const WAVE_2_RUNNER_COUNT: int = 8
const WAVE_2_BRUISER_COUNT: int = 3
const WAVE_2_SPITTER_COUNT: int = 3
const BOSS_SPAWN_TIME: float = 90.0  # seconds after run start

# ── Powers ────────────────────────────────────────────────────────────────────
const SIEGE_MODE_STILLNESS_TIME: float = 1.5
const SIEGE_MODE_DAMAGE_MULTIPLIER: float = 3.0
const SIEGE_MODE_DAMAGE_PENALTY: float = 0.5  # while moving

const SPLIT_ORBIT_SPREAD_MULT: float = 2.0
const SPLIT_ORBIT_DAMAGE_TAKEN_MULT: float = 1.3

const OVERCLOCK_DURATION: float = 10.0
const OVERCLOCK_COOLDOWN: float = 15.0
const OVERCLOCK_ATTACK_MULT: float = 2.5
const OVERCLOCK_HP_DRAIN: float = 5.0  # HP per second

const MAGNET_PULSE_RADIUS: float = 200.0
const MAGNET_PULSE_ELITE_DAMAGE_MULT: float = 1.2

const REFLECTIVE_SHELL_REFLECT_PCT: float = 0.25
const REFLECTIVE_SHELL_ATTACK_PENALTY: float = 0.65  # attack × 0.65

const GHOST_DRIVE_DURATION: float = 3.0
const GHOST_DRIVE_COOLDOWN: float = 20.0

# ── Extraction Point ──────────────────────────────────────────────────────────
const EXTRACTION_RADIUS: float = 60.0

# ── Deterioration ─────────────────────────────────────────────────────────────
const DETERIORATION_STAGE1_RUNS: int = 6   # runs until stage 1 (+25% enemies)
const DETERIORATION_STAGE2_RUNS: int = 14  # runs until stage 2 (+50% enemies)

# ── Meta / Rewards ────────────────────────────────────────────────────────────
const TECH_FRAGMENTS_BASE_REWARD: int = 20
const TECH_FRAGMENTS_OBJECTIVE_BONUS: float = 0.5
const TECH_FRAGMENTS_BOSS_BONUS: int = 10

# ── Backpack / Resources ──────────────────────────────────────────────────────
const BACKPACK_CAPACITY: int = 3
const RESOURCE_COLLECTION_TIME: float = 1.5
const RESOURCE_COLLECTION_RADIUS: float = 35.0
const RESOURCE_SPAWN_COUNT: int = 4
const RESOURCE_ITEM_RADIUS: float = 14.0

# ── Stealth Zone ─────────────────────────────────────────────────────────────
const STEALTH_AGENT_SPEED_MAX: float = 200.0
const STEALTH_SOUND_RADIUS_MIN: float = 20.0
const STEALTH_SOUND_RADIUS_MAX: float = 180.0
const STEALTH_DETECTION_TIME: float = 1.5    # seconds to fill alert bar
const STEALTH_CHASE_LOSE_TIME: float = 2.0   # seconds out of sight → back to patrol
const STEALTH_PATROL_SPEED: float = 80.0
const STEALTH_CHASE_SPEED: float = 220.0
const STEALTH_VISION_LENGTH: float = 180.0
const STEALTH_VISION_HALF_ANGLE: float = 35.0  # degrees each side of look direction
const STEALTH_CAMERA_LENGTH: float = 150.0
const STEALTH_CAMERA_HALF_ANGLE: float = 30.0  # degrees each side
const STEALTH_CAMERA_ROTATION_SPEED: float = 40.0  # degrees per second
const STEALTH_CONTACT_RADIUS: float = 18.0   # distance for drone to catch agent

# ── Circuit Zone (Circuito Quebrado) ──────────────────────────────────────────
const CIRCUIT_RUN_TIMER: float = 90.0
const CIRCUIT_PLATE_ACTIVATE_TIME: float = 0.8   # seconds standing on plate to activate
const CIRCUIT_SENTINEL_SPEED: float = 120.0       # px/s patrol speed
const CIRCUIT_SENTINEL_CHARGE_SPEED: float = 200.0  # px/s charge speed
const CIRCUIT_SENTINEL_HP: float = 60.0
const CIRCUIT_SENTINEL_CONTACT_RADIUS: float = 20.0
const CIRCUIT_PLAYER_HP: int = 3
const CIRCUIT_PLATE_RADIUS: float = 30.0

# ── Extraction Zone (Corrida de Extração) ─────────────────────────────────────
const EXTRACTION_RUN_TIMER: float = 60.0
const EXTRACTION_BONUS_TIME: float = 10.0         # seconds added by bonus canister
const EXTRACTION_CANISTER_SPEED: float = 70.0     # px/s for moving canisters
const EXTRACTION_DRONE_SPEED: float = 50.0
const EXTRACTION_DRONE_RANGE: float = 150.0
const EXTRACTION_DRONE_PROJECTILE_SPEED: float = 100.0
const EXTRACTION_DRONE_FIRE_INTERVAL: float = 2.0
const EXTRACTION_DRONE_HP: float = 50.0

# ── Field Control Zone (Controle de Campo) ────────────────────────────────────
const FIELD_RUN_TIMER: float = 90.0
const FIELD_CAPTURE_RADIUS: float = 80.0
const FIELD_CAPTURE_TIME: float = 3.0             # seconds to capture a zone
const FIELD_SIGNAL_RATE: float = 0.5              # sinais_controle per second per captured zone
const FIELD_RECAPTURE_SPEED: float = 0.8          # enemy capture speed multiplier

# ── Infection Zone (Zona de Infecção) ─────────────────────────────────────────
const INFECTION_RUN_TIMER: float = 90.0
const INFECTION_PLAYER_HP: int = 3
const INFECTION_SPREAD_INTERVAL: float = 3.0      # seconds between automatic spreads

# ── Maze Zone (Labirinto Dinâmico) ────────────────────────────────────────────
const MAZE_WARNING_CLOSE_TIME: float = 3.0        # red blink before wall closes
const MAZE_WARNING_OPEN_TIME: float = 2.0         # green glow before wall opens
const MAZE_WALL_OPEN_MIN: float = 3.0
const MAZE_WALL_OPEN_MAX: float = 8.0
const MAZE_WALL_CLOSED_MIN: float = 5.0
const MAZE_WALL_CLOSED_MAX: float = 12.0
const MAZE_PLAYER_HP: int = 3
const MAZE_SENTINEL_SPEED: float = 100.0

# ── Sacrifice Zone (Zona de Sacrifício) ───────────────────────────────────────
const SACRIFICE_RUN_TIMER: float = 90.0
const SACRIFICE_TERMINAL_CHANNEL_TIME: float = 2.0
const SACRIFICE_DRONE_SPEED: float = 60.0
const SACRIFICE_DRONE_ESCALATE_INTERVAL: float = 30.0
const SACRIFICE_DRONE_CAP: int = 5
const SACRIFICE_CATALYST_DISCOUNT: float = 0.30   # 30% cost reduction per catalyst

# ── Debug ─────────────────────────────────────────────────────────────────────
const DEBUG_OVERLAY_KEY: int = KEY_F1
const DEBUG_SHOW_RANGES: bool = true  # toggle in debug overlay
