## Enforcer-7 — Unidade de supressão pesada. Lenta, alta HP, dano elevado. Prioriza tanques.
class_name Bruiser
extends BaseEnemy


func _ready() -> void:
	enemy_name = "Enforcer-7"
	max_hp = GameConfig.BRUISER_HP
	move_speed = GameConfig.BRUISER_SPEED
	attack_damage = GameConfig.BRUISER_DAMAGE
	attack_interval = GameConfig.BRUISER_ATTACK_INTERVAL
	attack_range = GameConfig.BRUISER_ATTACK_RANGE
	color = Color(0.50, 0.05, 0.55)  # Roxo sintético (unidade pesada)
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
