## Canhão Orbital — Torre de ataque à distância. Mantém distância preferida e dispara projéteis.
class_name Spitter
extends BaseEnemy

var _projectile_timer: float = 0.0


func _ready() -> void:
	enemy_name = "Canhão Orbital"
	max_hp = GameConfig.SPITTER_HP
	move_speed = GameConfig.SPITTER_SPEED
	attack_damage = GameConfig.SPITTER_DAMAGE
	attack_interval = GameConfig.SPITTER_ATTACK_INTERVAL
	attack_range = GameConfig.SPITTER_RANGE
	color = Color(0.95, 0.80, 0.05)  # Amarelo-alvo (laser de precisão)
	is_elite = true
	super._ready()


## Override movement: maintain preferred distance from party.
func _move(delta: float) -> void:
	if current_target == null:
		return
	var dist := global_position.distance_to(current_target.global_position)
	var dir := (current_target.global_position - global_position).normalized()

	if dist < GameConfig.SPITTER_PREFERRED_DISTANCE * 0.8:
		# Too close — back away
		velocity = -dir * move_speed
	elif dist > GameConfig.SPITTER_PREFERRED_DISTANCE * 1.3:
		# Too far — approach
		velocity = dir * (move_speed * 0.5)
	else:
		velocity = Vector2.ZERO

	move_and_slide()


## Override attack: fire a slow projectile.
func _attack(target: Node2D) -> void:
	_fire_projectile(target)


func _fire_projectile(target: Node2D) -> void:
	var proj := SpitterProjectile.new()
	proj.damage = attack_damage
	proj.direction = (target.global_position - global_position).normalized()
	proj.global_position = global_position
	get_tree().current_scene.add_child(proj)
