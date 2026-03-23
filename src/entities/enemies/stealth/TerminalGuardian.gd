## TerminalGuardian — Static sentinel drone guarding a HackTerminal.
## Does not move or rotate. Fixed cone always faces the terminal it guards.
## Alert bar fills when agent enters cone outside shadow → triggers alarm.
## Visual: orange-amber diamond to distinguish from PatrolDrone (circle) and
## SecurityCamera (square/rotating).
class_name TerminalGuardian
extends Node2D

var _agent: Node2D = null
var _shadow_rects: Array = []
var _look_angle: float = 0.0  # radians — fixed at setup, never changes
var _alert_bar: float = 0.0
var _pulse: float = 0.0

signal detected()  ## Triggers alarm in StealthMain


## look_angle_deg: angle from this node's position toward the terminal (degrees).
## Compute in caller as rad_to_deg((terminal_pos - guardian_pos).angle()).
func setup(agent: Node2D, shadow_rects: Array, look_angle_deg: float) -> void:
	_agent = agent
	_shadow_rects = shadow_rects
	_look_angle = deg_to_rad(look_angle_deg)


func _process(delta: float) -> void:
	if _agent == null or GameState.current_state != GameState.RunState.PLAYING:
		return
	_pulse += delta
	_check_detection(delta)
	queue_redraw()


func _check_detection(delta: float) -> void:
	var look_dir := Vector2(cos(_look_angle), sin(_look_angle))
	var to_agent := _agent.global_position - global_position
	var in_cone: bool = to_agent.length() <= GameConfig.STEALTH_GUARDIAN_VISION_LENGTH and \
		abs(rad_to_deg(look_dir.angle_to(to_agent.normalized()))) <= GameConfig.STEALTH_GUARDIAN_HALF_ANGLE
	var in_shadow := _agent_is_in_shadow()

	if in_cone and not in_shadow:
		_alert_bar = min(1.0, _alert_bar + delta / GameConfig.STEALTH_DETECTION_TIME)
		if _alert_bar >= 1.0:
			detected.emit()
	else:
		_alert_bar = max(0.0, _alert_bar - delta * 0.5)


func _agent_is_in_shadow() -> bool:
	for r in _shadow_rects:
		if (r as Rect2).has_point(_agent.global_position):
			return true
	return false


func _draw() -> void:
	var t := _alert_bar
	var guard_color := Color(0.95 - t * 0.1, 0.55 - t * 0.45, 0.05)

	# Vision cone (filled)
	var half_rad := deg_to_rad(GameConfig.STEALTH_GUARDIAN_HALF_ANGLE)
	var points := PackedVector2Array()
	points.append(Vector2.ZERO)
	for i in 13:
		var a := (_look_angle - half_rad) + (half_rad * 2.0) * (float(i) / 12.0)
		points.append(Vector2(cos(a), sin(a)) * GameConfig.STEALTH_GUARDIAN_VISION_LENGTH)
	draw_colored_polygon(points, Color(guard_color.r, guard_color.g, guard_color.b, 0.15 + t * 0.12))
	draw_line(Vector2.ZERO, points[1],
		Color(guard_color.r, guard_color.g, guard_color.b, 0.5), 1.5)
	draw_line(Vector2.ZERO, points[points.size() - 1],
		Color(guard_color.r, guard_color.g, guard_color.b, 0.5), 1.5)

	# Diamond body
	var size := 11.0
	var diamond := PackedVector2Array([
		Vector2(0.0, -size), Vector2(size, 0.0), Vector2(0.0, size), Vector2(-size, 0.0),
	])
	draw_colored_polygon(diamond, guard_color)
	draw_polyline(
		PackedVector2Array([diamond[0], diamond[1], diamond[2], diamond[3], diamond[0]]),
		Color(1.0, 1.0, 0.8, 0.6), 1.5)

	# Center eye dot — communicates "watching"
	var eye_alpha := 0.7 + 0.3 * sin(_pulse * 3.5)
	draw_circle(Vector2.ZERO, 4.0, Color(1.0, 1.0, 0.9, eye_alpha))

	# Alert bar
	if _alert_bar > 0.0:
		var bar_w := 26.0
		draw_rect(Rect2(Vector2(-bar_w * 0.5, -24.0), Vector2(bar_w, 4.0)),
			Color(0.15, 0.15, 0.15))
		var fill_c := Color(1.0, 0.6, 0.0) if _alert_bar < 1.0 else Color(1.0, 0.15, 0.15)
		draw_rect(Rect2(Vector2(-bar_w * 0.5, -24.0), Vector2(bar_w * _alert_bar, 4.0)), fill_c)
