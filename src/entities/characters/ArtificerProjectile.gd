## ArtificerProjectile — Slow homing orb that explodes on impact.
class_name ArtificerProjectile
extends Node2D

const SPEED: float = 90.0

var damage: float = 8.0
var target = null

var _visual: ColorRect
var _lifetime: float = 5.0  # auto-destroy if no hit


func _ready() -> void:
	_visual = ColorRect.new()
	_visual.color = Color(0.7, 0.2, 0.9, 0.9)
	_visual.size = Vector2(12, 12)
	_visual.position = Vector2(-6, -6)
	add_child(_visual)


func _process(delta: float) -> void:
	_lifetime -= delta
	if _lifetime <= 0.0:
		queue_free()
		return

	if not is_instance_valid(target) or target.is_dead:
		queue_free()
		return

	var dir: Vector2 = (target.global_position - global_position).normalized()
	global_position += dir * SPEED * delta

	if global_position.distance_to(target.global_position) < 20.0:
		_explode()


func _explode() -> void:
	# Damage all enemies in radius
	var explosion_radius := GameConfig.ARTIFICER_EXPLOSION_RADIUS
	var enemies_hit := 0
	var all_enemies: Array = []

	for body in get_tree().get_nodes_in_group("enemies"):
		if not is_instance_valid(body) or body.is_dead:
			continue
		if global_position.distance_to(body.global_position) <= explosion_radius:
			all_enemies.append(body)
			enemies_hit += 1

	var cluster_bonus := 1.0
	if enemies_hit >= 3:
		cluster_bonus = 1.0 + GameConfig.ARTIFICER_CLUSTER_BONUS

	for enemy in all_enemies:
		enemy.take_damage(damage * cluster_bonus, null)

	# Visual flash (simple — replace with particles later)
	var flash := ColorRect.new()
	flash.color = Color(0.9, 0.5, 1.0, 0.6)
	flash.size = Vector2(explosion_radius * 2, explosion_radius * 2)
	flash.position = global_position - Vector2(explosion_radius, explosion_radius)
	get_tree().current_scene.add_child(flash)
	var tween := get_tree().create_tween()
	tween.tween_property(flash, "modulate:a", 0.0, 0.3)
	tween.tween_callback(flash.queue_free)

	queue_free()
