## CharacterDot — Interactive icon representing a character in the hub.
## Clicking emits character_pressed so HubScene can show the character card.
class_name CharacterDot
extends Node2D

signal character_pressed(char_id: String)

const RADIUS: float = 10.0
const HIT_RADIUS: float = 14.0  # Slightly larger for touch friendliness

var dot_color: Color = Color.WHITE
var character_id: String = ""


func _ready() -> void:
	set_process_input(true)


func _draw() -> void:
	draw_circle(Vector2.ZERO, RADIUS, dot_color)
	draw_arc(Vector2.ZERO, RADIUS, 0.0, TAU, 24, dot_color.lightened(0.3), 1.5)


func _input(event: InputEvent) -> void:
	if character_id.is_empty():
		return
	if event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
		if global_position.distance_to(get_global_mouse_position()) <= HIT_RADIUS:
			get_viewport().set_input_as_handled()
			character_pressed.emit(character_id)
