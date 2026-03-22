## DragController — Converts touch/mouse input into party movement.
## Works on both desktop (mouse) and mobile (touch/drag).
class_name DragController
extends Node

## Reference to the Party node (Node2D that contains all characters).
@export var party_node: Node2D

var _is_dragging: bool = false
var _move_target: Vector2 = Vector2.ZERO
var _drag_active: bool = false

# Siege Mode stillness tracking
var _stillness_timer: float = 0.0
var _last_position: Vector2 = Vector2.ZERO
const MOVE_THRESHOLD: float = 3.0  # px — below this = "still"


func _ready() -> void:
	# _move_target synced to party position on first frame
	pass


func _input(event: InputEvent) -> void:
	if GameState.current_state != GameState.RunState.PLAYING and \
			GameState.current_state != GameState.RunState.BOSS_FIGHT:
		return

	# Desktop: mouse drag — use relative delta to avoid coordinate mismatch
	if event is InputEventMouseButton:
		var mb := event as InputEventMouseButton
		if mb.button_index == MOUSE_BUTTON_LEFT:
			_drag_active = mb.pressed
			if mb.pressed and party_node:
				_move_target = party_node.global_position

	if event is InputEventMouseMotion and _drag_active:
		_move_target += (event as InputEventMouseMotion).relative

	# Mobile: touch drag — relative delta, consistent with any camera zoom/stretch
	if event is InputEventScreenTouch:
		var touch := event as InputEventScreenTouch
		_drag_active = touch.pressed
		if touch.pressed and party_node:
			_move_target = party_node.global_position

	if event is InputEventScreenDrag:
		_move_target += (event as InputEventScreenDrag).relative
		_drag_active = true


func _process(delta: float) -> void:
	if party_node == null:
		return

	# Keep target synced when not dragging (handles first frame and run start)
	if not _drag_active:
		_move_target = party_node.global_position

	if GameState.current_state != GameState.RunState.PLAYING and \
			GameState.current_state != GameState.RunState.BOSS_FIGHT:
		return

	# Clamp target and move party — direct follow, no lerp needed with delta input
	_move_target = _clamp_to_arena(_move_target)
	party_node.global_position = party_node.global_position.lerp(
		_move_target,
		GameConfig.DRAG_LERP_FACTOR * delta
	)

	# Track stillness for Siege Mode
	var moved := party_node.global_position.distance_to(_last_position)
	_last_position = party_node.global_position

	if moved < MOVE_THRESHOLD * delta * 60.0:
		_stillness_timer += delta
		if _stillness_timer >= GameConfig.SIEGE_MODE_STILLNESS_TIME:
			GameState.siege_mode_active = true
	else:
		_stillness_timer = 0.0
		GameState.siege_mode_active = false


func _clamp_to_arena(pos: Vector2) -> Vector2:
	return Vector2(
		clamp(pos.x, 40.0, GameConfig.ARENA_WIDTH - 40.0),
		clamp(pos.y, 40.0, GameConfig.ARENA_HEIGHT - 40.0)
	)
