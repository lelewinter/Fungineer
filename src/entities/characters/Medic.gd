## Medic — Weak attack. Heals lowest-HP ally every 5 seconds.
class_name Medic
extends BaseCharacter

var _heal_timer: float = 0.0


func _ready() -> void:
	character_name = "Medic"
	max_hp = GameConfig.MEDIC_HP
	attack_damage = GameConfig.MEDIC_DAMAGE
	attack_range = GameConfig.MEDIC_ATTACK_RANGE
	attack_speed = GameConfig.MEDIC_ATTACK_SPEED
	color = Color(0.2, 0.9, 0.3)  # Green
	sprite_path = "res://src/assets/characters/medic.svg"
	super._ready()


func _physics_process(delta: float) -> void:
	super._physics_process(delta)
	if is_dead:
		return
	_heal_timer += delta
	if _heal_timer >= GameConfig.MEDIC_HEAL_INTERVAL:
		_heal_timer = 0.0
		_heal_lowest_ally()


func _heal_lowest_ally() -> void:
	var lowest: BaseCharacter = null
	var lowest_ratio := 1.0
	for member in GameState.party:
		if not is_instance_valid(member) or member.is_dead:
			continue
		var ratio: float = member.current_hp / member.max_hp
		if ratio < lowest_ratio:
			lowest_ratio = ratio
			lowest = member
	if lowest:
		lowest.heal(GameConfig.MEDIC_HEAL_AMOUNT)
