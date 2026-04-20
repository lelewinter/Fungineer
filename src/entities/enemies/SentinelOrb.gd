## SentinelOrb — Slow homing projectile fired by Sentinel Core in Phase 2.
class_name SentinelOrb
extends Node2D

var target = null
var _lifetime: float = 6.0
var _visual: ColorRect


func _ready() -> void:
	_visual = ColorRect.new()
	_visual.color = Color(0.9, 0.9, 0.1, 0.9)
	_visual.size = Vector2(14, 14)
	_visual.position = Vector2(-7, -7)
	add_child(_visual)


func _process(delta: float) -> void:
	_lifetime -= delta
	if _lifetime <= 0.0:
		queue_free()
		return

	if not is_instance_valid(target) or target.is_dead:
		# Retarget
		for m in GameState.party:
			if not m.is_dead:
				target = m
				break
		if target == null or target.is_dead:
			queue_free()
			return

	var dir: Vector2 = (target.global_position - global_position).normalized()
	global_position += dir * GameConfig.SENTINEL_ORB_SPEED * delta

	if global_position.distance_to(target.global_position) < 20.0:
		target.call("take_damage", GameConfig.SENTINEL_ORB_DAMAGE, null)
		queue_free()
