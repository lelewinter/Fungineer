## CharacterDot — Simple icon representing a rescued character in the hub.
class_name CharacterDot
extends Node2D

var dot_color: Color = Color.WHITE


func _draw() -> void:
	draw_circle(Vector2.ZERO, 10.0, dot_color)
	draw_arc(Vector2.ZERO, 10.0, 0.0, TAU, 24, dot_color.lightened(0.3), 1.5)
