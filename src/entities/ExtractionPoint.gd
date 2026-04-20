## ExtractionPoint — The EXIT zone. Party entering triggers run victory.
## Drawn as a pulsing ring. Only active during PLAYING state (not during boss fight).
class_name ExtractionPoint
extends Node2D

var _party: Node2D = null
var _triggered: bool = false
var _pulse_timer: float = 0.0


func setup(party_node: Node2D) -> void:
	_party = party_node


func reset() -> void:
	_triggered = false


func _process(delta: float) -> void:
	if _triggered or _party == null:
		return
	if GameState.current_state != GameState.RunState.PLAYING:
		return

	_pulse_timer += delta
	queue_redraw()

	var dist: float = global_position.distance_to(_party.global_position)
	if dist <= GameConfig.EXTRACTION_RADIUS:
		_triggered = true
		GameState.end_run(true)


func _draw() -> void:
	var r: float = GameConfig.EXTRACTION_RADIUS
	var pulse: float = 0.6 + 0.4 * sin(_pulse_timer * 3.0)

	# Fill
	draw_circle(Vector2.ZERO, r, Color(0.1, 0.8, 0.5, 0.12 * pulse))

	# Outer ring
	draw_arc(Vector2.ZERO, r, 0.0, TAU, 48, Color(0.2, 1.0, 0.6, 0.8 * pulse), 2.5)

	# Inner ring
	draw_arc(Vector2.ZERO, r * 0.6, 0.0, TAU, 32, Color(0.2, 1.0, 0.6, 0.4 * pulse), 1.5)

	# EXIT label drawn manually
	draw_string(
		ThemeDB.fallback_font,
		Vector2(-14, 6),
		"EXIT",
		HORIZONTAL_ALIGNMENT_LEFT,
		-1,
		13,
		Color(0.3, 1.0, 0.6, 0.9 * pulse),
	)
