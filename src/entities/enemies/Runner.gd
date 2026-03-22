## Runner — Fast, fragile. Charges directly at nearest party member.
class_name Runner
extends BaseEnemy


func _ready() -> void:
	enemy_name = "Runner"
	max_hp = GameConfig.RUNNER_HP
	move_speed = GameConfig.RUNNER_SPEED
	attack_damage = GameConfig.RUNNER_DAMAGE
	attack_interval = GameConfig.RUNNER_ATTACK_INTERVAL
	attack_range = GameConfig.RUNNER_ATTACK_RANGE
	color = Color(1.0, 0.2, 0.2)  # Bright red
	is_elite = false
	super._ready()
