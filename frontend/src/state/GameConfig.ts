/**
 * GameConfig — O "painel de ajustes" central do jogo.
 * ---------------------------------------------------
 * Em linguagem simples: este arquivo guarda TODOS os numeros que decidem como
 * o jogo se comporta — quanta vida cada personagem tem, quanto dano causa, quao
 * rapido os inimigos andam, quantos inimigos aparecem em cada onda (wave), etc.
 *
 * A ideia e ter um unico lugar para "afinar" (balancear) o jogo. Se voce quer
 * deixar um chefe mais facil, muda o numero AQUI — nunca espalhado pelo codigo.
 * Os outros arquivos do jogo apenas LEEM estes valores; eles nao os inventam.
 *
 * `as const` no final trava estes valores como somente-leitura: ninguem
 * consegue altera-los enquanto o jogo roda, evitando bugs acidentais.
 *
 * Observacao tecnica: espelha os mesmos valores de `src/autoload/GameConfig.gd`
 * (a versao original em Godot). Edite os valores aqui; nunca cole numeros soltos
 * ("magic numbers") diretamente na logica do jogo. */
export const GameConfig = {
  // ── Viewport / UI ──────────────────────────────────────────────
  VIEWPORT_WIDTH: 480,
  VIEWPORT_HEIGHT: 854,

  // ── Arena ──────────────────────────────────────────────────────
  ARENA_WIDTH: 3200,
  ARENA_HEIGHT: 2400,

  // ── Party ──────────────────────────────────────────────────────
  MAX_PARTY_SIZE: 4,
  PARTY_FORMATION_SPACING: 60,
  DRAG_LERP_FACTOR: 8,
  DRAG_DEAD_ZONE: 5,
  FORMATION_OFFSETS: [
    { x: 0, y: 0 },
    { x: -60, y: 30 },
    { x: 60, y: 30 },
    { x: 0, y: 60 },
  ],

  // ── Characters — HP ────────────────────────────────────────────
  GUARDIAN_HP: 200,
  STRIKER_HP: 120,
  ARTIFICER_HP: 100,
  MEDIC_HP: 80,

  // ── Characters — Combat ────────────────────────────────────────
  GUARDIAN_DAMAGE: 18,
  GUARDIAN_ATTACK_RANGE: 80,
  GUARDIAN_ATTACK_SPEED: 1.2,
  GUARDIAN_DAMAGE_REDUCTION: 0.2,

  STRIKER_DAMAGE: 12,
  STRIKER_ATTACK_RANGE: 100,
  STRIKER_ATTACK_SPEED: 2.5,

  ARTIFICER_DAMAGE: 8,
  ARTIFICER_ATTACK_RANGE: 140,
  ARTIFICER_ATTACK_SPEED: 0.6,
  ARTIFICER_EXPLOSION_RADIUS: 60,
  ARTIFICER_CLUSTER_BONUS: 0.5,

  MEDIC_DAMAGE: 4,
  MEDIC_ATTACK_RANGE: 90,
  MEDIC_ATTACK_SPEED: 1.0,
  MEDIC_HEAL_INTERVAL: 5.0,
  MEDIC_HEAL_AMOUNT: 15,

  // ── Enemies ────────────────────────────────────────────────────
  RUNNER_HP: 30,
  RUNNER_SPEED: 130,
  RUNNER_DAMAGE: 5,
  RUNNER_ATTACK_INTERVAL: 0.8,
  RUNNER_ATTACK_RANGE: 30,

  BRUISER_HP: 150,
  BRUISER_SPEED: 60,
  BRUISER_DAMAGE: 25,
  BRUISER_ATTACK_INTERVAL: 1.5,
  BRUISER_ATTACK_RANGE: 50,

  SPITTER_HP: 60,
  SPITTER_SPEED: 40,
  SPITTER_DAMAGE: 12,
  SPITTER_ATTACK_INTERVAL: 1.8,
  SPITTER_RANGE: 150,
  SPITTER_PREFERRED_DISTANCE: 120,
  SPITTER_PROJECTILE_SPEED: 220,

  // ── Boss: Sentinel Core ────────────────────────────────────────
  SENTINEL_HP: 600,
  SENTINEL_DASH_INTERVAL_P1: 8,
  SENTINEL_DASH_INTERVAL_P2: 5,
  SENTINEL_DASH_SPEED: 600,
  SENTINEL_VULNERABLE_WINDOW: 2,
  SENTINEL_PHASE2_THRESHOLD: 0.6,
  SENTINEL_ADD_INTERVAL_P1: 15,
  SENTINEL_ADD_INTERVAL_P2: 12,
  SENTINEL_ADD_COUNT_P1: 3,
  SENTINEL_ORB_INTERVAL: 4,
  SENTINEL_ORB_SPEED: 90,
  SENTINEL_ORB_DAMAGE: 8,

  // ── Waves ──────────────────────────────────────────────────────
  // Difficulty curve is tuned against party growth: Wave 1 is fought with
  // 2 characters (~51 DPS), Wave 2 with 3 (a rescue is offered on Wave 1
  // clear, ~60 DPS), and the Boss with 3 + a Power. Each horde steps up in
  // total HP and introduces one new threat concept.
  //
  //   Wave 1 — swarm warmup + a single tank to learn focus-fire (510 HP).
  //   Wave 2 — ranged pressure (Spitters) + elites; punishes standing still (840 HP).
  //   Boss   — designed 2-phase encounter (see SentinelCore).
  //
  // Counts are scaled by the zone deterioration multiplier (1.0/1.25/1.5×),
  // so at max deterioration Wave 1 regains a 2nd Bruiser, etc.
  WAVE_1_DELAY: 2,
  WAVE_1_RUNNER_COUNT: 12,
  WAVE_1_BRUISER_COUNT: 1,
  WAVE_2_DELAY: 28,
  WAVE_2_RUNNER_COUNT: 10,
  WAVE_2_BRUISER_COUNT: 2,
  WAVE_2_SPITTER_COUNT: 4,
  BOSS_SPAWN_TIME: 90,

  // ── Powers ─────────────────────────────────────────────────────
  SIEGE_MODE_STILLNESS_TIME: 1.5,
  SIEGE_MODE_DAMAGE_MULTIPLIER: 3,
  SIEGE_MODE_DAMAGE_PENALTY: 0.5,

  SPLIT_ORBIT_SPREAD_MULT: 2,
  SPLIT_ORBIT_DAMAGE_TAKEN_MULT: 1.3,

  OVERCLOCK_DURATION: 10,
  OVERCLOCK_COOLDOWN: 15,
  OVERCLOCK_ATTACK_MULT: 2.5,
  OVERCLOCK_HP_DRAIN: 5,

  MAGNET_PULSE_RADIUS: 200,
  MAGNET_PULSE_ELITE_DAMAGE_MULT: 1.2,

  REFLECTIVE_SHELL_REFLECT_PCT: 0.25,
  REFLECTIVE_SHELL_ATTACK_PENALTY: 0.65,

  GHOST_DRIVE_DURATION: 3,
  GHOST_DRIVE_COOLDOWN: 20,

  // ── Extraction ─────────────────────────────────────────────────
  EXTRACTION_RADIUS: 60,

  // ── Deterioration ──────────────────────────────────────────────
  DETERIORATION_STAGE1_RUNS: 6,
  DETERIORATION_STAGE2_RUNS: 14,

  // ── Meta / Rewards ─────────────────────────────────────────────
  TECH_FRAGMENTS_BASE_REWARD: 20,
  TECH_FRAGMENTS_OBJECTIVE_BONUS: 0.5,
  TECH_FRAGMENTS_BOSS_BONUS: 10,

  // ── Backpack ───────────────────────────────────────────────────
  BACKPACK_CAPACITY: 3,
  RESOURCE_COLLECTION_TIME: 1.5,
  RESOURCE_COLLECTION_RADIUS: 35,
  RESOURCE_SPAWN_COUNT: 4,
  RESOURCE_ITEM_RADIUS: 14,

  // ── Stealth Zone ───────────────────────────────────────────────
  HACK_PUZZLE_TIME: 20,
  HACK_TERMINAL_RADIUS: 48,
  STEALTH_AGENT_SPEED_MAX: 200,
  STEALTH_SOUND_RADIUS_MIN: 20,
  STEALTH_SOUND_RADIUS_MAX: 180,
  STEALTH_DETECTION_TIME: 1.5,
  STEALTH_CHASE_LOSE_TIME: 2.0,
  STEALTH_PATROL_SPEED: 80,
  STEALTH_CHASE_SPEED: 220,
  STEALTH_VISION_LENGTH: 180,
  STEALTH_VISION_HALF_ANGLE: 35,
  STEALTH_CAMERA_LENGTH: 150,
  STEALTH_CAMERA_HALF_ANGLE: 30,
  STEALTH_CAMERA_ROTATION_SPEED: 40,
  STEALTH_CONTACT_RADIUS: 18,
  STEALTH_EXTRACTION_PULSE_RADIUS: 150,
  STEALTH_GUARDIAN_VISION_LENGTH: 240,
  STEALTH_GUARDIAN_HALF_ANGLE: 22,

  // ── Circuit Zone ───────────────────────────────────────────────
  CIRCUIT_RUN_TIMER: 90,
  CIRCUIT_PLATE_ACTIVATE_TIME: 0.8,
  CIRCUIT_SENTINEL_SPEED: 120,
  CIRCUIT_SENTINEL_CHARGE_SPEED: 200,
  CIRCUIT_SENTINEL_HP: 60,
  CIRCUIT_SENTINEL_CONTACT_RADIUS: 20,
  CIRCUIT_PLAYER_HP: 3,
  CIRCUIT_PLATE_RADIUS: 30,

  // ── Extraction Zone (Boulder Dash) ─────────────────────────────
  // The lane-runner design was scrapped; ExtractionScene is a dig/push-rocks
  // zone. Only the run timer survives — the old lane/scroll/debuff/spark keys
  // were dead (0 references, verified) and have been removed.
  EXTRACTION_RUN_TIMER: 60,

  // ── Field Control Zone ─────────────────────────────────────────
  FIELD_RUN_TIMER: 90,
  FIELD_CAPTURE_RADIUS: 80,
  FIELD_CAPTURE_TIME: 3,
  FIELD_SIGNAL_RATE: 0.5,
  FIELD_RECAPTURE_SPEED: 0.8,

  // ── Infection Zone ─────────────────────────────────────────────
  INFECTION_RUN_TIMER: 120,
  INFECTION_PLAYER_HP: 3,
  INFECTION_SPREAD_INTERVAL: 5,
  INFECTION_SPREAD_INTERVAL_OVL1: 8,
  INFECTION_SPREAD_INTERVAL_OVL2: 12,
  INFECTION_OVERLOAD_THRESHOLD_1: 15,
  INFECTION_OVERLOAD_THRESHOLD_2: 20,
  INFECTION_BIOMASS_RATE_STABLE: 0.10,
  INFECTION_BIOMASS_RATE_UNSTABLE: 0.05,
  INFECTION_BIOMASS_RATE_AMPLIFIER: 0.30,
  INFECTION_CURE_TIME_STABLE: 3.0,
  INFECTION_CURE_TIME_UNSTABLE: 1.5,
  INFECTION_CURE_TIME_AMPLIFIER: 1.0,
  INFECTION_CURE_TIME_ANCHOR: 8.0,
  INFECTION_REINFORCE_TIME: 0.5,
  INFECTION_PCT_AMPLIFIERS: 0.15,
  INFECTION_PCT_ANCHORS: 0.15,

  // ── Maze Zone ──────────────────────────────────────────────────
  MAZE_WARNING_CLOSE_TIME: 3,
  MAZE_WARNING_OPEN_TIME: 2,
  MAZE_WALL_OPEN_MIN: 3,
  MAZE_WALL_OPEN_MAX: 8,
  MAZE_WALL_CLOSED_MIN: 5,
  MAZE_WALL_CLOSED_MAX: 12,
  MAZE_PLAYER_HP: 3,
  MAZE_SENTINEL_SPEED: 100,

  // ── Sacrifice Zone ─────────────────────────────────────────────
  SACRIFICE_RUN_TIMER: 90,
  SACRIFICE_TERMINAL_CHANNEL_TIME: 2,
  SACRIFICE_DRONE_SPEED: 60,
  SACRIFICE_DRONE_ESCALATE_INTERVAL: 30,
  SACRIFICE_DRONE_CAP: 5,
  SACRIFICE_CATALYST_DISCOUNT: 0.30,

  // ── Surface & remaining zone run timers ────────────────────────
  // Centralised here so the scenes stop hardcoding `const TIMER = N`.
  // Source of truth for run length lives in GameConfig (project rule:
  // no magic gameplay numbers in scene code).
  STEALTH_RUN_TIMER: 50,
  CORDILHEIRA_RUN_TIMER: 75,
  TORRES_RUN_TIMER: 80,
  CATEDRAL_RUN_TIMER: 90,
  LABIRINTO_RUN_TIMER: 90,

  // ── Collect Feel (juice.pop) ───────────────────────────────────
  // Intensidades do momento de coleta — a recompensa mais frequente do jogo.
  // Centralizado aqui para o designer tunar o "feel" sem mexer no RunJuice.
  COLLECT_BURST_COUNT: 14,
  COLLECT_BURST_SPEED: 170,
  COLLECT_BURST_LIFE: 0.5,
  COLLECT_BURST_SIZE: 2.6,
  COLLECT_FLASH_ALPHA: 0.10,
  COLLECT_SHAKE_TRAUMA: 0.16,
  COLLECT_SHAKE_VIBRATE_MS: 12,
  COLLECT_SFX_VOLUME: 0.45,

  // ── Debug ──────────────────────────────────────────────────────
  DEBUG_SHOW_RANGES: true,
} as const;
