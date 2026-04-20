## PowerManager — Holds the active power. Routes activation and process ticks.
class_name PowerManager
extends Node

var active_power = null  # PowerResource

signal power_activated(power)
signal power_deactivated(power)


func set_power(power: PowerResource) -> void:
	if active_power != null:
		_deactivate_current()
	active_power = power
	GameState.active_power = power
	# Reset multipliers
	GameState.power_damage_multiplier = 1.0
	GameState.power_attack_speed_multiplier = 1.0
	GameState.power_damage_taken_multiplier = 1.0


func activate() -> void:
	if active_power == null:
		return
	if not active_power.can_activate():
		return
	active_power.on_activate(GameState.party)
	power_activated.emit(active_power)


func toggle() -> void:
	if active_power == null:
		return
	if active_power.is_active:
		_deactivate_current()
	else:
		activate()


func _deactivate_current() -> void:
	if active_power == null:
		return
	active_power.on_deactivate(GameState.party)
	power_deactivated.emit(active_power)


func _process(delta: float) -> void:
	if active_power == null:
		return
	if GameState.current_state != GameState.RunState.PLAYING and \
			GameState.current_state != GameState.RunState.BOSS_FIGHT:
		return
	active_power.process(delta, GameState.party)
	# MagnetPulse pull: executed here because Resources can't call get_tree()
	if active_power is MagnetPulse and active_power.is_active:
		_process_magnet_pull(delta)


func _process_magnet_pull(delta: float) -> void:
	var centroid := _get_party_centroid()
	for enemy in get_tree().get_nodes_in_group("enemies"):
		if not is_instance_valid(enemy) or enemy.is_dead or enemy.is_elite:
			continue
		if enemy.global_position.distance_to(centroid) <= GameConfig.MAGNET_PULSE_RADIUS:
			var dir: Vector2 = (centroid - enemy.global_position).normalized()
			enemy.global_position += dir * 60.0 * delta


func _get_party_centroid() -> Vector2:
	if GameState.party.is_empty():
		return Vector2.ZERO
	var sum := Vector2.ZERO
	var count := 0
	for m in GameState.party:
		if is_instance_valid(m) and not m.is_dead:
			sum += m.global_position
			count += 1
	return sum / max(count, 1)
