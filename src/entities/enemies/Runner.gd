## Rastreador MK-I — Unidade de patrulha leve. Rápida e frágil. Persegue alvos diretamente.
class_name Runner
extends BaseEnemy


func _ready() -> void:
	enemy_name = "Rastreador MK-I"
	max_hp = GameConfig.RUNNER_HP
	move_speed = GameConfig.RUNNER_SPEED
	attack_damage = GameConfig.RUNNER_DAMAGE
	attack_interval = GameConfig.RUNNER_ATTACK_INTERVAL
	attack_range = GameConfig.RUNNER_ATTACK_RANGE
	color = Color(0.95, 0.12, 0.28)  # Crimson IA
	is_elite = false
	super._ready()
