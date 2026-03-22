## StealthAgent — Solo infiltrator for the Stealth Zone.
## Drag input moves the agent. Speed determines sound radius.
## is_in_shadow() checks against an array of shadow Rect2s set by StealthMain.
class_name StealthAgent
extends Node2D

var _move_target: Vector2 = Vector2.ZERO
var _drag_active: bool = false
var _velocity: Vector2 = Vector2.ZERO
var _shadow_rects: Array = []  # Array[Rect2] — populated by StealthMain
var _sprite: Sprite2D = null


func setup(shadow_rects: Array) -> void:
	_shadow_rects = shadow_rects
	_move_target = global_position
	_load_sprite()


func _load_sprite() -> void:
	var tex := load("res://src/assets/characters/doctor.svg") as Texture2D
	if tex:
		_sprite = Sprite2D.new()
		_sprite.texture = tex
		var s: float = 28.0 / max(tex.get_size().x, tex.get_size().y)
		_sprite.scale = Vector2(s, s)
		add_child(_sprite)
	else:
		push_warning("StealthAgent: doctor.svg não encontrado, usando placeholder.")


func _input(event: InputEvent) -> void:
	if GameState.current_state != GameState.RunState.PLAYING:
		return
	if event is InputEventMouseButton:
		var mb := event as InputEventMouseButton
		if mb.button_index == MOUSE_BUTTON_LEFT:
			_drag_active = mb.pressed
			if mb.pressed:
				_move_target = global_position
	if event is InputEventMouseMotion and _drag_active:
		_move_target += (event as InputEventMouseMotion).relative
	if event is InputEventScreenTouch:
		var touch := event as InputEventScreenTouch
		_drag_active = touch.pressed
		if touch.pressed:
			_move_target = global_position
	if event is InputEventScreenDrag:
		_move_target += (event as InputEventScreenDrag).relative
		_drag_active = true


func _process(delta: float) -> void:
	if GameState.current_state != GameState.RunState.PLAYING:
		return
	if not _drag_active:
		_move_target = global_position
	_move_target = _move_target.clamp(
		Vector2(30.0, 30.0),
		Vector2(GameConfig.ARENA_WIDTH - 30.0, GameConfig.ARENA_HEIGHT - 30.0)
	)
	var prev_pos := global_position
	global_position = global_position.lerp(_move_target, GameConfig.DRAG_LERP_FACTOR * delta)
	_velocity = (global_position - prev_pos) / delta if delta > 0.0 else Vector2.ZERO
	queue_redraw()


func get_speed() -> float:
	return _velocity.length()


func get_sound_radius() -> float:
	var t: float = clamp(get_speed() / GameConfig.STEALTH_AGENT_SPEED_MAX, 0.0, 1.0)
	return lerpf(GameConfig.STEALTH_SOUND_RADIUS_MIN, GameConfig.STEALTH_SOUND_RADIUS_MAX, t)


func is_in_shadow() -> bool:
	for r in _shadow_rects:
		if (r as Rect2).has_point(global_position):
			return true
	return false


func _draw() -> void:
	var in_s := is_in_shadow()

	# Sound radius ring — only when moving
	var sr := get_sound_radius()
	if sr > GameConfig.STEALTH_SOUND_RADIUS_MIN + 2.0:
		var alpha: float = clamp((sr - GameConfig.STEALTH_SOUND_RADIUS_MIN) / 60.0, 0.0, 0.45)
		draw_arc(Vector2.ZERO, sr, 0.0, TAU, 48, Color(1.0, 0.85, 0.2, alpha), 2.0)

	# Fallback: draw coloured circle only when sprite failed to load
	if _sprite == null:
		var body_color := Color(0.25, 0.65, 1.0) if not in_s else Color(0.1, 0.35, 0.65)
		draw_circle(Vector2.ZERO, 12.0, body_color)

	# Shadow tint: modulate sprite when hidden, or draw outline when in fallback
	if in_s:
		if _sprite != null:
			_sprite.modulate = Color(0.4, 0.6, 1.0, 0.75)  # azul-escuro translucido na sombra
		else:
			draw_arc(Vector2.ZERO, 15.0, 0.0, TAU, 24, Color(0.3, 0.55, 1.0, 0.55), 2.0)
	else:
		if _sprite != null:
			_sprite.modulate = Color.WHITE  # cores normais fora da sombra
