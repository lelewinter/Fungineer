## HackTerminal — Interactive terminal in the Stealth Zone.
## When the agent enters HACK_TERMINAL_RADIUS, a progress ring appears.
## After a brief approach delay, the BreachPuzzle opens.
## On puzzle success: resource added to backpack, terminal removed.
## On puzzle failure: terminal stays — player can try again.
class_name HackTerminal
extends Node2D

signal hacked(resource_type: String)

## Seconds the agent must stay in range before the puzzle opens.
const APPROACH_TIME: float = 0.35

var resource_type: String = "ai_components"
var _agent: Node2D = null
var _in_range: bool = false
var _approach_timer: float = 0.0
var _puzzle_open: bool = false
var _pulse: float = 0.0


func setup(agent_node: Node2D, type: String) -> void:
	_agent = agent_node
	resource_type = type


func _process(delta: float) -> void:
	if GameState.current_state != GameState.RunState.PLAYING:
		return
	if _agent == null or _puzzle_open:
		return

	_pulse += delta

	var dist: float = global_position.distance_to(_agent.global_position)
	_in_range = dist <= GameConfig.HACK_TERMINAL_RADIUS

	var backpack_full: bool = GameState.backpack.size() >= HubState.get_backpack_capacity()

	if _in_range and not backpack_full:
		_approach_timer += delta
		if _approach_timer >= APPROACH_TIME:
			_open_puzzle()
	else:
		_approach_timer = 0.0

	queue_redraw()


func _open_puzzle() -> void:
	_puzzle_open = true
	_approach_timer = 0.0

	if _agent.has_method("set_input_locked"):
		_agent.set_input_locked(true)

	var puzzle := BreachPuzzle.new()
	## CanvasLayer as child of Node2D renders at screen space in Godot 4
	add_child(puzzle)
	puzzle.puzzle_completed.connect(_on_puzzle_completed)
	puzzle.puzzle_failed.connect(_on_puzzle_failed)
	puzzle.open()


func _on_puzzle_completed() -> void:
	_puzzle_open = false
	if _agent and _agent.has_method("set_input_locked"):
		_agent.set_input_locked(false)
	if GameState.add_to_backpack(resource_type):
		hacked.emit(resource_type)
	queue_free()


func _on_puzzle_failed() -> void:
	_puzzle_open = false
	if _agent and _agent.has_method("set_input_locked"):
		_agent.set_input_locked(false)
	## Terminal stays — player can walk back and try again
	_in_range = false
	_approach_timer = 0.0
	queue_redraw()


func _draw() -> void:
	var r: float = GameConfig.HACK_TERMINAL_RADIUS
	var p: float = 0.7 + 0.3 * sin(_pulse * 2.5)

	## ─ Terminal body ─
	draw_rect(Rect2(-15.0, -22.0, 30.0, 34.0), Color(0.07, 0.11, 0.17))
	draw_rect(Rect2(-15.0, -22.0, 30.0, 34.0), Color(0.28, 0.55, 0.38), false, 1.5)

	## Screen area
	draw_rect(Rect2(-11.0, -18.0, 22.0, 20.0), Color(0.05, 0.22, 0.12, 0.6 * p))

	## "T" glyph on screen
	draw_string(ThemeDB.fallback_font, Vector2(-5.0, -3.0), "T",
		HORIZONTAL_ALIGNMENT_LEFT, -1, 13, Color(0.4, 1.0, 0.55, p))

	## Stand / base
	draw_rect(Rect2(-7.0, 12.0, 14.0, 5.0), Color(0.12, 0.18, 0.28))

	if not _in_range or _puzzle_open:
		return

	## ─ Approach ring + prompt ─
	var backpack_full: bool = GameState.backpack.size() >= HubState.get_backpack_capacity()
	if backpack_full:
		draw_arc(Vector2.ZERO, r, 0.0, TAU, 32, Color(0.8, 0.3, 0.1, 0.5), 2.0)
		draw_string(ThemeDB.fallback_font, Vector2(-28.0, -32.0), "MOCHILA CHEIA",
			HORIZONTAL_ALIGNMENT_LEFT, -1, 10, Color(0.9, 0.4, 0.15))
	else:
		## Outer dim ring
		draw_arc(Vector2.ZERO, r, 0.0, TAU, 32, Color(0.35, 0.6, 0.25, 0.3), 1.5)
		## Progress arc — fills over APPROACH_TIME
		var progress: float = _approach_timer / APPROACH_TIME
		if progress > 0.0:
			draw_arc(Vector2.ZERO, r, -PI * 0.5,
				-PI * 0.5 + TAU * progress, 32, Color(0.45, 1.0, 0.3, 0.9), 3.0)
		## "HACKEAR" label
		draw_string(ThemeDB.fallback_font, Vector2(-24.0, -34.0), "HACKEAR",
			HORIZONTAL_ALIGNMENT_LEFT, -1, 11, Color(0.55, 1.0, 0.4))
