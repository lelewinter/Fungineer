## Artificer — Slow AoE projectile, explodes on impact. Bonus damage to clusters.
class_name Artificer
extends BaseCharacter


func _ready() -> void:
	character_name = "Artificer"
	max_hp = GameConfig.ARTIFICER_HP
	attack_damage = GameConfig.ARTIFICER_DAMAGE
	attack_range = GameConfig.ARTIFICER_ATTACK_RANGE
	attack_speed = GameConfig.ARTIFICER_ATTACK_SPEED
	color = Color(0.7, 0.2, 0.9)  # Purple
	sprite_path = "res://src/assets/characters/artificer.svg"
	super._ready()


## Override attack to fire a slow projectile instead of instant hit.
func _try_attack() -> void:
	var alive: Array = []
	for e in _enemies_in_range:
		if is_instance_valid(e) and not e.is_dead:
			alive.append(e)
	_enemies_in_range = alive

	if _enemies_in_range.is_empty():
		current_target = null
		return

	var nearest = null
	var nearest_dist := INF
	for e in _enemies_in_range:
		var d: float = global_position.distance_to(e.global_position)
		if d < nearest_dist:
			nearest_dist = d
			nearest = e
	current_target = nearest

	if current_target:
		_fire_projectile(current_target)


func _fire_projectile(target: Node2D) -> void:
	var proj := ArtificerProjectile.new()
	proj.damage = attack_damage * GameState.power_damage_multiplier
	proj.target = target
	proj.global_position = global_position
	get_tree().current_scene.add_child(proj)
