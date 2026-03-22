## ReflectiveShell — Passive. Reflects 25% of damage back. Attack −35%.
class_name ReflectiveShell
extends PowerResource


func _init() -> void:
	power_name = "Reflective Shell"
	description = "Reflects 25% of damage taken back to attacker. Attack ×0.65."
	cooldown = 0.0
	duration = 0.0  # Always active once picked
	icon_color = Color(0.8, 0.8, 0.9)


func on_activate(party: Array) -> void:
	is_active = true
	GameState.power_damage_multiplier = GameConfig.REFLECTIVE_SHELL_ATTACK_PENALTY


func on_deactivate(party: Array) -> void:
	is_active = false
	GameState.power_damage_multiplier = 1.0


## Called by BaseCharacter.take_damage when this power is active.
func on_damage_received(amount: float, source: Node) -> void:
	if not is_active or source == null:
		return
	var reflect := amount * GameConfig.REFLECTIVE_SHELL_REFLECT_PCT
	if source.has_method("take_damage"):
		source.call("take_damage", reflect, null)
