## SpitterProjectile — Straight-line slow projectile fired by Spitter.
class_name SpitterProjectile
extends Node2D

var damage: float = 12.0
var direction: Vector2 = Vector2.RIGHT
var _lifetime: float = 3.0
var _visual: ColorRect


func _ready() -> void:
	_visual = ColorRect.new()
	_visual.color = Color(1.0, 0.5, 0.1, 0.85)
	_visual.size = Vector2(10, 10)
	_visual.position = Vector2(-5, -5)
	add_child(_visual)


func _process(delta: float) -> void:
	_lifetime -= delta
	if _lifetime <= 0.0:
		queue_free()
		return

	global_position += direction * GameConfig.SPITTER_PROJECTILE_SPEED * delta

	# Check hit against party members
	for member in GameState.party:
		if not is_instance_valid(member) or member.is_dead:
			continue
		if global_position.distance_to(member.global_position) < 20.0:
			member.take_damage(damage, null)
			queue_free()
			return
