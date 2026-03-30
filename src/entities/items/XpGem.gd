## XpGem — Dropped by enemies on death. Magnetically pulled toward the party.
## Adds scrap to backpack on collection. Visual: glowing colored circle.
class_name XpGem
extends Node2D

var value: int = 1
var _party: Node2D = null
var _lifetime: float = 0.0
var _being_pulled: bool = false
var _gem_color: Color = Color(0.3, 0.6, 1.0)

# Brief scatter animation on spawn
var _scatter_velocity: Vector2 = Vector2.ZERO
var _scatter_time: float = 0.0
const SCATTER_DURATION: float = 0.25


func setup(party_node: Node2D, gem_value: int = 1) -> void:
	_party = party_node
	value = gem_value
	# Color by value tier
	if value >= GameConfig.GEM_BOSS_VALUE:
		_gem_color = Color(1.0, 0.85, 0.0)  # gold
	elif value >= GameConfig.GEM_ELITE_VALUE:
		_gem_color = Color(0.6, 0.2, 1.0)  # purple
	else:
		_gem_color = Color(0.3, 0.6, 1.0)  # blue
	# Random scatter direction on spawn
	var angle := randf() * TAU
	_scatter_velocity = Vector2.from_angle(angle) * randf_range(80.0, 180.0)


func _process(delta: float) -> void:
	if _party == null or not is_instance_valid(_party):
		queue_free()
		return

	_lifetime += delta
	if _lifetime > GameConfig.GEM_LIFETIME:
		queue_free()
		return

	# Scatter phase (brief outward burst on spawn)
	if _scatter_time < SCATTER_DURATION:
		_scatter_time += delta
		var t: float = _scatter_time / SCATTER_DURATION
		position += _scatter_velocity * (1.0 - t) * delta
		queue_redraw()
		return

	var dist: float = global_position.distance_to(_party.global_position)

	if dist < GameConfig.GEM_MAGNET_RADIUS or _being_pulled:
		_being_pulled = true
		var dir: Vector2 = (_party.global_position - global_position).normalized()
		position += dir * GameConfig.GEM_MAGNET_SPEED * delta

	# Collect when close enough
	if dist < 30.0:
		_collect()
		return

	queue_redraw()


func _collect() -> void:
	GameState.add_to_backpack("scrap")
	queue_free()


func _draw() -> void:
	var radius: float = 5.0 if value < GameConfig.GEM_ELITE_VALUE else 7.0
	if value >= GameConfig.GEM_BOSS_VALUE:
		radius = 10.0

	# Pulsing glow
	var pulse: float = 0.7 + 0.3 * sin(_lifetime * 6.0)
	var glow_color := _gem_color
	glow_color.a = 0.3 * pulse
	draw_circle(Vector2.ZERO, radius + 4.0, glow_color)

	# Core
	draw_circle(Vector2.ZERO, radius, _gem_color * pulse)

	# Bright center
	draw_circle(Vector2.ZERO, radius * 0.4, Color(1.0, 1.0, 1.0, 0.8 * pulse))
