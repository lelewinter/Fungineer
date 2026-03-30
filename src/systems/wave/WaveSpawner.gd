## WaveSpawner — Continuous enemy spawning system (Vampire Survivors style).
## Spawns enemies in escalating bursts. Emits events for rescue/power milestones.
## Enemies drop XpGems on death.
class_name WaveSpawner
extends Node

@export var enemies_container: Node2D
@export var items_container: Node2D
@export var party_node: Node2D
@export var zone_id: int = 0

var _run_timer: float = 0.0
var _spawn_timer: float = 0.0
var _alive_count: int = 0
var _boss_done: bool = false
var _rescue_done: bool = false
var _power_done: bool = false

signal wave_cleared(wave_index: int)
signal boss_spawned()


func _ready() -> void:
	set_process(false)


func start() -> void:
	_run_timer = 0.0
	_spawn_timer = 0.0
	_alive_count = 0
	_boss_done = false
	_rescue_done = false
	_power_done = false
	set_process(true)


func _process(delta: float) -> void:
	if GameState.current_state == GameState.RunState.GAME_OVER or \
			GameState.current_state == GameState.RunState.VICTORY:
		set_process(false)
		return
	if GameState.current_state == GameState.RunState.PAUSED:
		return

	_run_timer += delta

	# Milestone events (rescue at 30s, power at 60s)
	if not _rescue_done and _run_timer >= GameConfig.HORDE_RESCUE_TIME:
		_rescue_done = true
		wave_cleared.emit(1)

	if not _power_done and _run_timer >= GameConfig.HORDE_POWER_TIME:
		_power_done = true
		wave_cleared.emit(2)

	# Boss spawn
	if not _boss_done and _run_timer >= GameConfig.HORDE_BOSS_TIME:
		_boss_done = true
		_spawn_boss()

	# Continuous spawning
	if _run_timer < GameConfig.HORDE_INITIAL_DELAY:
		return

	_spawn_timer += delta
	var current_interval: float = _get_spawn_interval()
	if _spawn_timer >= current_interval:
		_spawn_timer -= current_interval
		_spawn_burst()


func _get_spawn_interval() -> float:
	var t: float = clampf(_run_timer / GameConfig.HORDE_ESCALATION_DURATION, 0.0, 1.0)
	return lerpf(GameConfig.HORDE_SPAWN_INTERVAL_START, GameConfig.HORDE_SPAWN_INTERVAL_MIN, t)


func _get_burst_size() -> int:
	var t: float = clampf(_run_timer / GameConfig.HORDE_ESCALATION_DURATION, 0.0, 1.0)
	return int(lerpf(GameConfig.HORDE_BURST_SIZE_START, GameConfig.HORDE_BURST_SIZE_MAX, t))


func _spawn_burst() -> void:
	if _alive_count >= GameConfig.HORDE_MAX_ENEMIES:
		return

	var mult: float = HubState.get_spawn_multiplier(zone_id)
	var count: int = roundi(_get_burst_size() * mult)
	var can_bruiser: bool = _run_timer >= GameConfig.HORDE_BRUISER_START_TIME
	var can_spitter: bool = _run_timer >= GameConfig.HORDE_SPITTER_START_TIME

	for i in count:
		if _alive_count >= GameConfig.HORDE_MAX_ENEMIES:
			break

		var enemy: BaseEnemy
		var roll: float = randf()
		if can_spitter and roll < GameConfig.HORDE_SPITTER_CHANCE:
			enemy = Spitter.new()
		elif can_bruiser and roll < (GameConfig.HORDE_SPITTER_CHANCE + GameConfig.HORDE_BRUISER_CHANCE):
			enemy = Bruiser.new()
		else:
			enemy = Runner.new()

		_spawn_enemy(enemy)


func _spawn_boss() -> void:
	var boss := SentinelCore.new()
	boss.global_position = Vector2(GameConfig.ARENA_WIDTH * 0.5, 80.0)
	if enemies_container:
		enemies_container.add_child(boss)
	boss.died.connect(_on_enemy_died.bind(true))
	_alive_count += 1
	boss_spawned.emit()
	GameState.boss_spawned.emit()
	GameState.current_state = GameState.RunState.BOSS_FIGHT
	GameState.state_changed.emit(GameState.RunState.BOSS_FIGHT)


func _spawn_enemy(enemy: BaseEnemy) -> void:
	enemy.global_position = _random_edge_position()
	if enemies_container:
		enemies_container.add_child(enemy)
	enemy.died.connect(_on_enemy_died.bind(enemy.is_elite))
	_alive_count += 1


func _on_enemy_died(is_elite: bool) -> void:
	_alive_count = max(0, _alive_count - 1)
	# Spawn XP gem at the dying enemy's position
	# We get the sender from the signal (BaseEnemy emits died(self))
	# But since we used bind(), we need to handle it differently
	# The gem spawning is handled via BaseEnemy._die() override instead


func _random_edge_position() -> Vector2:
	# Spawn around the party in a ring, not just arena edges
	# This creates the VS feeling of being surrounded
	if party_node and is_instance_valid(party_node):
		var angle: float = randf() * TAU
		var dist: float = randf_range(400.0, 700.0)
		var pos: Vector2 = party_node.global_position + Vector2.from_angle(angle) * dist
		# Clamp to arena bounds
		pos.x = clampf(pos.x, 20.0, GameConfig.ARENA_WIDTH - 20.0)
		pos.y = clampf(pos.y, 20.0, GameConfig.ARENA_HEIGHT - 20.0)
		return pos
	# Fallback: edge spawning
	var edge := randi() % 4
	match edge:
		0:
			return Vector2(randf_range(40, GameConfig.ARENA_WIDTH - 40), 20.0)
		1:
			return Vector2(randf_range(40, GameConfig.ARENA_WIDTH - 40), GameConfig.ARENA_HEIGHT - 20.0)
		2:
			return Vector2(20.0, randf_range(40, GameConfig.ARENA_HEIGHT - 40))
		_:
			return Vector2(GameConfig.ARENA_WIDTH - 20.0, randf_range(40, GameConfig.ARENA_HEIGHT - 40))
