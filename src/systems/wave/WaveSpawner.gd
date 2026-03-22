## WaveSpawner — Timer-driven enemy wave system.
## Reads wave definitions from GameConfig. Spawns enemies at arena edges.
## Emits wave_cleared(index) when all enemies from that wave are dead.
class_name WaveSpawner
extends Node

@export var enemies_container: Node2D
@export var zone_id: int = 0

var _run_timer: float = 0.0
var _wave1_done: bool = false
var _wave2_done: bool = false
var _boss_done: bool = false
var _wave1_cleared: bool = false
var _wave2_cleared: bool = false

var _wave1_alive: int = 0
var _wave2_alive: int = 0

signal wave_spawned(wave_index: int)
signal wave_cleared(wave_index: int)
signal boss_spawned()
signal all_waves_clear()


func _ready() -> void:
	set_process(false)


func start() -> void:
	_run_timer = 0.0
	_wave1_done = false
	_wave2_done = false
	_boss_done = false
	_wave1_cleared = false
	_wave2_cleared = false
	_wave1_alive = 0
	_wave2_alive = 0
	set_process(true)


func _process(delta: float) -> void:
	if GameState.current_state == GameState.RunState.GAME_OVER or \
			GameState.current_state == GameState.RunState.VICTORY:
		set_process(false)
		return
	if GameState.current_state == GameState.RunState.PAUSED:
		return

	_run_timer += delta

	if not _wave1_done and _run_timer >= GameConfig.WAVE_1_DELAY:
		_wave1_done = true
		_spawn_wave_1()

	if not _wave2_done and _run_timer >= GameConfig.WAVE_2_DELAY:
		_wave2_done = true
		_spawn_wave_2()

	if not _boss_done and _run_timer >= GameConfig.BOSS_SPAWN_TIME:
		_boss_done = true
		_spawn_boss()


func _spawn_wave_1() -> void:
	print("[WaveSpawner] spawning wave 1")
	var mult: float = HubState.get_spawn_multiplier(zone_id)
	var runners: int = roundi(GameConfig.WAVE_1_RUNNER_COUNT * mult)
	var bruisers: int = roundi(GameConfig.WAVE_1_BRUISER_COUNT * mult)
	for i in runners:
		_spawn_wave_enemy(Runner.new(), 1)
	for i in bruisers:
		_spawn_wave_enemy(Bruiser.new(), 1)
	wave_spawned.emit(1)
	GameState.wave_started.emit(1)


func _spawn_wave_2() -> void:
	var mult: float = HubState.get_spawn_multiplier(zone_id)
	var runners: int = roundi(GameConfig.WAVE_2_RUNNER_COUNT * mult)
	var bruisers: int = roundi(GameConfig.WAVE_2_BRUISER_COUNT * mult)
	var spitters: int = roundi(GameConfig.WAVE_2_SPITTER_COUNT * mult)
	for i in runners:
		_spawn_wave_enemy(Runner.new(), 2)
	for i in bruisers:
		_spawn_wave_enemy(Bruiser.new(), 2)
	for i in spitters:
		_spawn_wave_enemy(Spitter.new(), 2)
	wave_spawned.emit(2)
	GameState.wave_started.emit(2)


func _spawn_boss() -> void:
	var boss := SentinelCore.new()
	boss.global_position = Vector2(GameConfig.ARENA_WIDTH * 0.5, 80.0)
	if enemies_container:
		enemies_container.add_child(boss)
	boss_spawned.emit()
	GameState.boss_spawned.emit()
	GameState.current_state = GameState.RunState.BOSS_FIGHT
	GameState.state_changed.emit(GameState.RunState.BOSS_FIGHT)


func _spawn_wave_enemy(enemy: BaseEnemy, wave: int) -> void:
	enemy.global_position = _random_edge_position()
	if enemies_container:
		enemies_container.add_child(enemy)
	if wave == 1:
		_wave1_alive += 1
		enemy.died.connect(_on_wave1_enemy_died)
	elif wave == 2:
		_wave2_alive += 1
		enemy.died.connect(_on_wave2_enemy_died)


func _on_wave1_enemy_died(_enemy) -> void:
	_wave1_alive -= 1
	if _wave1_alive <= 0 and not _wave1_cleared:
		_wave1_cleared = true
		wave_cleared.emit(1)


func _on_wave2_enemy_died(_enemy) -> void:
	_wave2_alive -= 1
	if _wave2_alive <= 0 and not _wave2_cleared:
		_wave2_cleared = true
		wave_cleared.emit(2)
		# Spawn boss immediately if timer hasn't triggered yet
		if not _boss_done:
			_boss_done = true
			_spawn_boss()


func _random_edge_position() -> Vector2:
	var edge := randi() % 4
	match edge:
		0:  # Top
			return Vector2(randf_range(40, GameConfig.ARENA_WIDTH - 40), 20.0)
		1:  # Bottom
			return Vector2(randf_range(40, GameConfig.ARENA_WIDTH - 40), GameConfig.ARENA_HEIGHT - 20.0)
		2:  # Left
			return Vector2(20.0, randf_range(40, GameConfig.ARENA_HEIGHT - 40))
		_:  # Right
			return Vector2(GameConfig.ARENA_WIDTH - 20.0, randf_range(40, GameConfig.ARENA_HEIGHT - 40))
