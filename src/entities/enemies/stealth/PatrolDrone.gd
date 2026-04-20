## PatrolDrone — Stealth zone ground patrol.
## Walks A↔B route. Vision cone detects agent (shadow = immune).
## States: PATROL → ALERTED (bar fills) → CHASE → PATROL (lose sight 2s).
## Emits agent_caught when close enough during chase.
class_name PatrolDrone
extends Node2D

enum State { PATROL, ALERTED, CHASE, INVESTIGATE }

var waypoint_a: Vector2 = Vector2.ZERO
var waypoint_b: Vector2 = Vector2.ZERO
var _agent: Node2D = null
var _shadow_rects: Array = []
var _state: State = State.PATROL
var _alert_bar: float = 0.0
var _look_dir: Vector2 = Vector2.RIGHT
var _patrol_target: Vector2 = Vector2.ZERO
var _chase_lose_timer: float = 0.0
var _investigate_target: Vector2 = Vector2.ZERO
var _investigate_timer: float = 0.0
var speed_multiplier: float = 1.0

signal agent_caught()
signal entered_chase()


func setup(a: Vector2, b: Vector2, agent: Node2D, shadow_rects: Array) -> void:
	waypoint_a = a
	waypoint_b = b
	_agent = agent
	_shadow_rects = shadow_rects
	_patrol_target = b
	global_position = a


func is_chasing() -> bool:
	return _state == State.CHASE


## Sends the drone to investigate a sound origin. Ignored if already chasing.
func trigger_investigate(origin: Vector2) -> void:
	if _state == State.CHASE:
		return
	_state = State.INVESTIGATE
	_investigate_target = origin
	_investigate_timer = 0.0


## Immediately starts chasing the agent (used by extraction pulse).
func force_chase() -> void:
	if _state == State.CHASE:
		return
	_state = State.CHASE
	_chase_lose_timer = 0.0
	entered_chase.emit()


func _process(delta: float) -> void:
	if _agent == null or GameState.current_state != GameState.RunState.PLAYING:
		return
	match _state:
		State.PATROL:
			_do_patrol(delta)
			_check_detection(delta)
		State.ALERTED:
			_check_detection(delta)
		State.CHASE:
			_do_chase(delta)
		State.INVESTIGATE:
			_do_investigate(delta)
			_check_detection(delta)
	queue_redraw()


func _do_patrol(delta: float) -> void:
	var dir := _patrol_target - global_position
	if dir.length() < 8.0:
		_patrol_target = waypoint_a if _patrol_target == waypoint_b else waypoint_b
		return
	_look_dir = dir.normalized()
	global_position += _look_dir * GameConfig.STEALTH_PATROL_SPEED * speed_multiplier * delta


func _check_detection(delta: float) -> void:
	var in_cone := _is_in_vision_cone(_agent.global_position)
	var in_shadow := _agent_is_in_shadow()
	var can_see := in_cone and not in_shadow

	if can_see:
		var dist := global_position.distance_to(_agent.global_position)
		var dist_mod := 1.0 if dist < GameConfig.STEALTH_VISION_LENGTH * 0.6 else 0.6
		_alert_bar = min(1.0, _alert_bar + delta / GameConfig.STEALTH_DETECTION_TIME * dist_mod)
		if _alert_bar >= 1.0:
			_state = State.CHASE
			_chase_lose_timer = 0.0
			entered_chase.emit()
	else:
		_alert_bar = max(0.0, _alert_bar - delta * 0.5)
		if _alert_bar <= 0.0 and _state == State.ALERTED:
			_state = State.PATROL

	if _alert_bar > 0.0 and _state == State.PATROL:
		_state = State.ALERTED


func _do_chase(delta: float) -> void:
	var dir := (_agent.global_position - global_position).normalized()
	_look_dir = dir
	global_position += dir * GameConfig.STEALTH_CHASE_SPEED * speed_multiplier * delta

	if global_position.distance_to(_agent.global_position) <= GameConfig.STEALTH_CONTACT_RADIUS:
		agent_caught.emit()
		return

	if _is_in_vision_cone(_agent.global_position) and not _agent_is_in_shadow():
		_chase_lose_timer = 0.0
	else:
		_chase_lose_timer += delta
		if _chase_lose_timer >= GameConfig.STEALTH_CHASE_LOSE_TIME:
			_state = State.PATROL
			_alert_bar = 0.0


func _do_investigate(delta: float) -> void:
	var dir := _investigate_target - global_position
	if dir.length() < 12.0:
		# Arrived — search in place for 4s, then resume patrol
		_investigate_timer += delta
		if _investigate_timer >= 4.0:
			_state = State.PATROL
			_investigate_timer = 0.0
	else:
		_look_dir = dir.normalized()
		global_position += _look_dir * GameConfig.STEALTH_PATROL_SPEED * speed_multiplier * delta


func _is_in_vision_cone(target: Vector2) -> bool:
	var to_target := target - global_position
	if to_target.length() > GameConfig.STEALTH_VISION_LENGTH:
		return false
	var angle := rad_to_deg(_look_dir.angle_to(to_target.normalized()))
	return abs(angle) <= GameConfig.STEALTH_VISION_HALF_ANGLE


func _agent_is_in_shadow() -> bool:
	for r in _shadow_rects:
		if (r as Rect2).has_point(_agent.global_position):
			return true
	return false


func _draw() -> void:
	var state_color := Color(0.65, 0.65, 0.7)
	match _state:
		State.ALERTED:     state_color = Color(1.0, 0.82, 0.1)
		State.CHASE:       state_color = Color(1.0, 0.2, 0.2)
		State.INVESTIGATE: state_color = Color(0.9, 0.55, 0.1)

	# Vision cone (filled)
	var half_rad := deg_to_rad(GameConfig.STEALTH_VISION_HALF_ANGLE)
	var look_angle := _look_dir.angle()
	var points := PackedVector2Array()
	points.append(Vector2.ZERO)
	var steps := 12
	for i in steps + 1:
		var a := (look_angle - half_rad) + (half_rad * 2.0) * (float(i) / steps)
		points.append(Vector2(cos(a), sin(a)) * GameConfig.STEALTH_VISION_LENGTH)
	var cone_alpha := 0.13 + (_alert_bar * 0.12)
	draw_colored_polygon(points, Color(state_color.r, state_color.g, state_color.b, cone_alpha))
	var edge_c := Color(state_color.r, state_color.g, state_color.b, 0.35)
	draw_line(Vector2.ZERO, points[1], edge_c, 1.0)
	draw_line(Vector2.ZERO, points[points.size() - 1], edge_c, 1.0)

	# Body
	draw_circle(Vector2.ZERO, 13.0, state_color)

	# Alert bar above drone
	if _alert_bar > 0.0:
		var bar_w := 30.0
		draw_rect(Rect2(Vector2(-bar_w * 0.5, -26.0), Vector2(bar_w, 5.0)), Color(0.15, 0.15, 0.15))
		var fill_c := Color(1.0, 0.78, 0.0) if _alert_bar < 1.0 else Color(1.0, 0.15, 0.15)
		draw_rect(Rect2(Vector2(-bar_w * 0.5, -26.0), Vector2(bar_w * _alert_bar, 5.0)), fill_c)
