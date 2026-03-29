## Striker — Fast DPS, medium HP. Fires bullets radially at all enemies in range.
class_name Striker
extends BaseCharacter


func _ready() -> void:
	character_name = "Striker"
	max_hp = GameConfig.STRIKER_HP
	attack_damage = GameConfig.STRIKER_DAMAGE
	attack_range = GameConfig.STRIKER_ATTACK_RANGE
	attack_speed = GameConfig.STRIKER_ATTACK_SPEED
	color = Color(0.0, 0.9, 0.9)  # Cyan
	sprite_path = "res://src/assets/characters/striker.svg"
	super._ready()


## Override: fire one bullet per enemy in range simultaneously (radial burst).
func _try_attack() -> void:
	var alive: Array = []
	for e in _enemies_in_range:
		if is_instance_valid(e) and not e.is_dead:
			alive.append(e)
	_enemies_in_range = alive

	if _enemies_in_range.is_empty():
		current_target = null
		return

	var effective_damage := attack_damage * GameState.power_damage_multiplier
	for enemy in _enemies_in_range:
		var dir: Vector2 = (enemy.global_position - global_position).normalized()
		var bullet := StrikerBullet.new()
		bullet.damage = effective_damage
		bullet.direction = dir
		bullet.global_position = global_position
		get_tree().current_scene.add_child(bullet)
		attacked.emit(enemy, effective_damage)
