## Bruiser — Slow, high HP, high damage. Targets Guardian or highest-HP member.
class_name Bruiser
extends BaseEnemy


func _ready() -> void:
	enemy_name = "Bruiser"
	max_hp = GameConfig.BRUISER_HP
	move_speed = GameConfig.BRUISER_SPEED
	attack_damage = GameConfig.BRUISER_DAMAGE
	attack_interval = GameConfig.BRUISER_ATTACK_INTERVAL
	attack_range = GameConfig.BRUISER_ATTACK_RANGE
	color = Color(0.6, 0.1, 0.1)  # Dark red
	is_elite = true
	super._ready()


## Override target selection: prefer Guardian, else highest HP.
func _find_target() -> void:
	var best: Node2D = null
	var best_hp := -1.0
	for member in GameState.party:
		if not is_instance_valid(member) or member.is_dead:
			continue
		# Prefer Guardian
		if member is Guardian:
			best = member
			break
		# Else pick highest HP
		if member.current_hp > best_hp:
			best_hp = member.current_hp
			best = member
	current_target = best
