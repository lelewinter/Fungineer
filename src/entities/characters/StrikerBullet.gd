## StrikerBullet — Fast straight-line projectile fired by Striker.
## One bullet per enemy in range, shot simultaneously (radial burst).
class_name StrikerBullet
extends Node2D

var damage: float = 0.0
var direction: Vector2 = Vector2.RIGHT

const SPEED: float = 350.0

var _lifetime: float = 0.4  # ~140px at 350px/s — matches attack_range 100 with margin
var _visual: ColorRect


func _ready() -> void:
	_visual = ColorRect.new()
	_visual.color = Color(0.0, 0.9, 0.9, 0.9)  # Cyan, matches Striker color
	_visual.size = Vector2(8, 8)
	_visual.position = Vector2(-4, -4)
	add_child(_visual)


func _process(delta: float) -> void:
	_lifetime -= delta
	if _lifetime <= 0.0:
		queue_free()
		return

	global_position += direction * SPEED * delta

	for enemy in get_tree().get_nodes_in_group("enemies"):
		if not is_instance_valid(enemy) or enemy.is_dead:
			continue
		if global_position.distance_to(enemy.global_position) < 18.0:
			enemy.take_damage(damage, null)
			queue_free()
			return
