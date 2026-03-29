## GhostDrive — Active (3s). Party becomes intangible. Cannot capture objective.
class_name GhostDrive
extends PowerResource

var _duration_remaining: float = 0.0
var _original_collision_layers: Array = []


func _init() -> void:
	power_name = "Ghost Drive"
	description = "Party intangible for 3s. Passes through enemies. Cannot capture."
	cooldown = GameConfig.GHOST_DRIVE_COOLDOWN
	duration = GameConfig.GHOST_DRIVE_DURATION
	icon_color = Color(0.7, 0.7, 1.0, 0.6)


func on_activate(party: Array) -> void:
	is_active = true
	_duration_remaining = duration
	_original_collision_layers.clear()
	# Disable party collision with enemies
	for member in party:
		if is_instance_valid(member):
			_original_collision_layers.append(member.collision_layer)
			member.collision_layer = 0  # No collision layer — pass-through
			member.modulate = Color(0.7, 0.7, 1.0, 0.5)


func on_deactivate(party: Array) -> void:
	is_active = false
	cooldown_remaining = cooldown
	# Restore collision
	for i in party.size():
		if i < _original_collision_layers.size() and is_instance_valid(party[i]):
			party[i].collision_layer = _original_collision_layers[i]
			party[i].modulate = Color.WHITE


func process(delta: float, party: Array) -> void:
	if cooldown_remaining > 0.0:
		cooldown_remaining = max(0.0, cooldown_remaining - delta)

	if not is_active:
		return

	_duration_remaining -= delta
	if _duration_remaining <= 0.0:
		on_deactivate(party)
