## GameState — Runtime state machine for a single run.
## No config values here. Pure runtime tracking.
extends Node

enum RunState {
	IDLE,
	PLAYING,
	PAUSED,
	BOSS_FIGHT,
	GAME_OVER,
	VICTORY,
}

var current_state: RunState = RunState.IDLE
var run_time: float = 0.0
var party: Array = []  # Array[BaseCharacter] — typed at runtime
var tech_fragments_earned: int = 0
var objective_captured: bool = false
var boss_defeated: bool = false

# Backpack — cleared at run start, lost on death
var backpack: Array[String] = []

# Power state
var active_power = null  # PowerResource or null
var power_damage_multiplier: float = 1.0
var power_attack_speed_multiplier: float = 1.0
var power_damage_taken_multiplier: float = 1.0
var siege_mode_active: bool = false

signal state_changed(new_state: RunState)
signal character_died(character: Node)
signal run_ended(victory: bool, fragments: int)
signal fragment_collected(amount: int)
signal wave_started(wave_index: int)
signal boss_spawned()
signal damage_dealt(target: Node, amount: float, position: Vector2)
signal backpack_changed(contents: Array)


func _ready() -> void:
	set_process(false)


func _process(delta: float) -> void:
	if current_state == RunState.PLAYING or current_state == RunState.BOSS_FIGHT:
		run_time += delta


func start_run() -> void:
	run_time = 0.0
	tech_fragments_earned = 0
	objective_captured = false
	boss_defeated = false
	power_damage_multiplier = 1.0
	power_attack_speed_multiplier = 1.0
	power_damage_taken_multiplier = 1.0
	siege_mode_active = false
	backpack.clear()
	backpack_changed.emit(backpack)
	_set_state(RunState.PLAYING)
	set_process(true)


func add_to_backpack(resource_type: String) -> bool:
	var capacity: int = HubState.get_backpack_capacity()
	if backpack.size() >= capacity:
		return false
	backpack.append(resource_type)
	backpack_changed.emit(backpack)
	return true


func pause_for_event() -> void:
	if current_state == RunState.PLAYING or current_state == RunState.BOSS_FIGHT:
		_set_state(RunState.PAUSED)


func resume_from_event() -> void:
	if current_state == RunState.PAUSED:
		_set_state(RunState.PLAYING)


func end_run(victory: bool) -> void:
	var final_fragments := tech_fragments_earned
	if victory and objective_captured:
		final_fragments = int(final_fragments * (1.0 + GameConfig.TECH_FRAGMENTS_OBJECTIVE_BONUS))
	if victory and boss_defeated:
		final_fragments += GameConfig.TECH_FRAGMENTS_BOSS_BONUS
	HubState.on_run_ended(victory)
	_set_state(RunState.VICTORY if victory else RunState.GAME_OVER)
	set_process(false)
	run_ended.emit(victory, final_fragments)


func register_character_death(character: Node) -> void:
	party.erase(character)
	character_died.emit(character)
	if party.is_empty():
		end_run(false)


func _set_state(new_state: RunState) -> void:
	current_state = new_state
	state_changed.emit(new_state)
