## Overclock — Active toggle (10s). Attack speed ×2.5. HP drain 5/s.
class_name Overclock
extends PowerResource

var _duration_remaining: float = 0.0


func _init() -> void:
	power_name = "Overclock"
	description = "Attack speed ×2.5 for 10s. Party loses 5 HP/s while active."
	cooldown = GameConfig.OVERCLOCK_COOLDOWN
	duration = GameConfig.OVERCLOCK_DURATION
	icon_color = Color(1.0, 0.3, 0.0)


func on_activate(party: Array) -> void:
	is_active = true
	_duration_remaining = duration
	GameState.power_attack_speed_multiplier = GameConfig.OVERCLOCK_ATTACK_MULT


func on_deactivate(party: Array) -> void:
	is_active = false
	cooldown_remaining = cooldown
	GameState.power_attack_speed_multiplier = 1.0


func process(delta: float, party: Array) -> void:
	if cooldown_remaining > 0.0:
		cooldown_remaining = max(0.0, cooldown_remaining - delta)

	if not is_active:
		return

	_duration_remaining -= delta

	# HP drain
	for member in party:
		if is_instance_valid(member) and not member.is_dead:
			member.current_hp = max(1.0, member.current_hp - GameConfig.OVERCLOCK_HP_DRAIN * delta)

	if _duration_remaining <= 0.0:
		on_deactivate(party)
