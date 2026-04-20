## SiegeMode — Passive. Stillness = 3× damage. Moving = 0.5× damage.
## Activation is automatic via DragController stillness tracking in GameState.
class_name SiegeMode
extends PowerResource

var _was_active: bool = false
var _grace_timer: float = 2.0  # Delay before penalty applies — avoids 0.5x on frame 1


func _init() -> void:
	power_name = "Siege Mode"
	description = "Stand still for 1.5s: damage ×3. Moving: damage ×0.5."
	cooldown = 0.0
	duration = 0.0  # Passive — controlled by GameState.siege_mode_active
	icon_color = Color(0.9, 0.6, 0.1)


## Called every frame by PowerManager.
func process(delta: float, _party: Array) -> void:
	if _grace_timer > 0.0:
		_grace_timer -= delta
		return
	var currently_active := GameState.siege_mode_active

	if currently_active and not _was_active:
		# Just activated
		GameState.power_damage_multiplier = GameConfig.SIEGE_MODE_DAMAGE_MULTIPLIER
		_was_active = true
	elif not currently_active and _was_active:
		# Just deactivated
		GameState.power_damage_multiplier = GameConfig.SIEGE_MODE_DAMAGE_PENALTY
		_was_active = false
	elif not currently_active:
		# Moving — keep penalty
		GameState.power_damage_multiplier = GameConfig.SIEGE_MODE_DAMAGE_PENALTY
