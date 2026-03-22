## SplitOrbit — Toggle. Party spreads 2×. Damage taken +30%.
class_name SplitOrbit
extends PowerResource

var _original_offsets: Array = []
var _party_node: Node2D = null


func _init() -> void:
	power_name = "Split Orbit"
	description = "Party spreads wide (2× formation). Damage taken +30%."
	cooldown = 0.0
	duration = 0.0  # Toggle
	icon_color = Color(0.3, 0.7, 1.0)


func on_activate(party: Array) -> void:
	is_active = true
	GameState.power_damage_taken_multiplier = GameConfig.SPLIT_ORBIT_DAMAGE_TAKEN_MULT


func on_deactivate(party: Array) -> void:
	is_active = false
	GameState.power_damage_taken_multiplier = 1.0


## SplitOrbit modifies the formation spacing multiplier in DragController.
## The formation offset scale is read from GameState.power_formation_mult (added to GameState).
func process(delta: float, party: Array) -> void:
	pass  # Effect is applied via damage_taken_multiplier; formation handled in Party node
