## SecurityCamera — Fixed rotating vision cone in the Stealth Zone.
## Does not chase — full alert bar triggers alarm (instant game over).
## Shadow = agent invisible to camera.
class_name SecurityCamera
extends Node2D

var _agent: Node2D = null
var _shadow_rects: Array = []
var _rotation_angle: float = 0.0  # radians
var _rotation_dir: float = 1.0    # 1 = clockwise, -1 = counter-clockwise
var _alert_bar: float = 0.0

signal detected()  # Triggers alarm — does NOT cause instant game over


func setup(agent: Node2D, shadow_rects: Array, start_angle_deg: float, rotation_dir: float) -> void:
	_agent = agent
	_shadow_rects = shadow_rects
	_rotation_angle = deg_to_rad(start_angle_deg)
	_rotation_dir = rotation_dir


func _process(delta: float) -> void:
	if _agent == null or GameState.current_state != GameState.RunState.PLAYING:
		return

	_rotation_angle += deg_to_rad(GameConfig.STEALTH_CAMERA_ROTATION_SPEED) * _rotation_dir * delta

	var look_dir := Vector2(cos(_rotation_angle), sin(_rotation_angle))
	var to_agent := _agent.global_position - global_position
	var in_cone: bool = to_agent.length() <= GameConfig.STEALTH_CAMERA_LENGTH and \
		abs(rad_to_deg(look_dir.angle_to(to_agent.normalized()))) <= GameConfig.STEALTH_CAMERA_HALF_ANGLE
	var in_shadow := _agent_is_in_shadow()

	if in_cone and not in_shadow:
		_alert_bar = min(1.0, _alert_bar + delta / GameConfig.STEALTH_DETECTION_TIME)
		if _alert_bar >= 1.0:
			detected.emit()
	else:
		_alert_bar = max(0.0, _alert_bar - delta * 0.5)

	queue_redraw()


func _agent_is_in_shadow() -> bool:
	for r in _shadow_rects:
		if (r as Rect2).has_point(_agent.global_position):
			return true
	return false


func _draw() -> void:
	var look_dir := Vector2(cos(_rotation_angle), sin(_rotation_angle))
	var t := _alert_bar
	var alert_color := Color(0.25 + t * 0.75, 0.8 - t * 0.6, 1.0 - t * 0.9)

	# Cone (filled)
	var half_rad := deg_to_rad(GameConfig.STEALTH_CAMERA_HALF_ANGLE)
	var start_a := _rotation_angle - half_rad
	var end_a := _rotation_angle + half_rad
	var points := PackedVector2Array()
	points.append(Vector2.ZERO)
	var steps := 10
	for i in steps + 1:
		var a := start_a + (end_a - start_a) * (float(i) / steps)
		points.append(Vector2(cos(a), sin(a)) * GameConfig.STEALTH_CAMERA_LENGTH)
	var cone_alpha := 0.14 + t * 0.18
	draw_colored_polygon(points, Color(alert_color.r, alert_color.g, alert_color.b, cone_alpha))
	var edge_c := Color(alert_color.r, alert_color.g, alert_color.b, 0.4)
	draw_line(Vector2.ZERO, points[1], edge_c, 1.0)
	draw_line(Vector2.ZERO, points[points.size() - 1], edge_c, 1.0)

	# Camera housing
	draw_rect(Rect2(Vector2(-7, -7), Vector2(14, 14)), Color(0.35, 0.35, 0.45))
	draw_circle(Vector2.ZERO, 5.0, alert_color)

	# Alert bar
	if _alert_bar > 0.0:
		var bar_w := 24.0
		draw_rect(Rect2(Vector2(-bar_w * 0.5, -20.0), Vector2(bar_w, 4.0)), Color(0.15, 0.15, 0.15))
		draw_rect(Rect2(Vector2(-bar_w * 0.5, -20.0), Vector2(bar_w * _alert_bar, 4.0)), alert_color)
