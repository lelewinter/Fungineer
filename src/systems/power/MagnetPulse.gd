## MagnetPulse — Toggle. Pulls light enemies + pickups. Elites deal +20% damage.
## NOTE: Actual enemy pulling is executed by PowerManager (a Node) since Resources
## cannot call get_tree(). This resource only manages state flags.
class_name MagnetPulse
extends PowerResource


func _init() -> void:
	power_name = "Magnet Pulse"
	description = "Pulls Runners toward party. Elites deal +20% damage while active."
	cooldown = 0.0
	duration = 0.0  # Toggle
	icon_color = Color(0.4, 0.8, 1.0)


func on_activate(_party: Array) -> void:
	is_active = true
	GameState.power_damage_taken_multiplier = GameConfig.MAGNET_PULSE_ELITE_DAMAGE_MULT


func on_deactivate(_party: Array) -> void:
	is_active = false
	GameState.power_damage_taken_multiplier = 1.0


func process(_delta: float, _party: Array) -> void:
	pass  # Pulling logic executed by PowerManager._process_magnet_pull()
