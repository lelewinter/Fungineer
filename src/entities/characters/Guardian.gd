## Guardian — High HP tank. 20% passive damage reduction.
class_name Guardian
extends BaseCharacter


func _ready() -> void:
	character_name = "Guardian"
	max_hp = GameConfig.GUARDIAN_HP
	attack_damage = GameConfig.GUARDIAN_DAMAGE
	attack_range = GameConfig.GUARDIAN_ATTACK_RANGE
	attack_speed = GameConfig.GUARDIAN_ATTACK_SPEED
	color = Color(0.2, 0.4, 1.0)  # Blue
	sprite_path = "res://src/assets/characters/guardian.svg"
	super._ready()


## Apply Guardian's passive 20% damage reduction.
func apply_damage_reduction(amount: float) -> float:
	return amount * (1.0 - GameConfig.GUARDIAN_DAMAGE_REDUCTION)
