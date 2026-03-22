## ExtractionDrone — Patrol enemy for the Corrida de Extração zone.
## Walks A↔B route and fires slow projectiles at the squad leader when in range.
## Uses collision_layer=4 (enemy layer) so BaseCharacter auto-attacks it.
## Emits died() when HP reaches zero.
class_name ExtractionDrone
extends Node2D

var waypoint_a: Vector2 = Vector2.ZERO
var waypoint_b: Vector2 = Vector2.ZERO
var _patrol_target: Vector2 = Vector2.ZERO
var _hp: float = GameConfig.EXTRACTION_DRONE_HP
var _squad_leader: Node2D = null
var _fire_timer: float = 0.0
var _firing: bool = false
var _firing_flash: float = 0.0

signal died()

## Inner class: slow projectile
class _Projectile extends Node2D:
	var _velocity: Vector2 = Vector2.ZERO
	var _damage: float = 8.0
	var _squad_leader: Node2D = null
	var _lifetime: float = 3.0

	func setup(start: Vector2, target: Vector2, leader: Node2D) -> void:
		global_position = start
		_squad_leader = leader
		var dir := (target - start).normalized()
		_velocity = dir * GameConfig.EXTRACTION_DRONE_PROJECTILE_SPEED

	func _process(delta: float) -> void:
		_lifetime -= delta
		if _lifetime <= 0.0:
			queue_free()
			return
		global_position += _velocity * delta
		queue_redraw()
		# Hit check
		if _squad_leader and global_position.distance_to(_squad_leader.global_position) < 20.0:
			if _squad_leader.has_method("take_damage"):
				_squad_leader.take_damage(_damage)
			queue_free()

	func _draw() -> void:
		draw_circle(Vector2.ZERO, 5.0, Color(1.0, 0.4, 0.1, 0.9))


## Initialise patrol route and squad leader reference.
func setup(a: Vector2, b: Vector2, leader: Node2D) -> void:
	waypoint_a = a
	waypoint_b = b
	_squad_leader = leader
	_patrol_target = b
	global_position = a


## Called by ExtractionMain when BaseCharacter attacks this drone.
func take_damage(amount: float) -> void:
	_hp -= amount
	if _hp <= 0.0:
		died.emit()
		queue_free()


func _process(delta: float) -> void:
	if GameState.current_state != GameState.RunState.PLAYING:
		return

	_fire_timer -= delta
	_firing_flash = max(0.0, _firing_flash - delta * 4.0)

	# Patrol
	var dir := _patrol_target - global_position
	if dir.length() < 8.0:
		_patrol_target = waypoint_a if _patrol_target.is_equal_approx(waypoint_b) else waypoint_b
	else:
		global_position += dir.normalized() * GameConfig.EXTRACTION_DRONE_SPEED * delta

	# Fire at squad leader if in range
	if _squad_leader and _fire_timer <= 0.0:
		var dist := global_position.distance_to(_squad_leader.global_position)
		if dist <= GameConfig.EXTRACTION_DRONE_RANGE:
			_fire_timer = GameConfig.EXTRACTION_DRONE_FIRE_INTERVAL
			_firing_flash = 1.0
			_firing = true
			var proj := _Projectile.new()
			proj.setup(global_position, _squad_leader.global_position, _squad_leader)
			get_parent().add_child(proj)
		else:
			_firing = false

	queue_redraw()


func _draw() -> void:
	# Diamond body
	var t := _firing_flash
	var body_c := Color(0.3 + t * 0.6, 0.3 - t * 0.2, 0.35, 1.0)
	var half: float = 13.0
	var pts := PackedVector2Array([
		Vector2(0, -half), Vector2(half, 0),
		Vector2(0, half), Vector2(-half, 0),
	])
	draw_colored_polygon(pts, body_c)
	draw_polyline(PackedVector2Array([pts[0], pts[1], pts[2], pts[3], pts[0]]),
		Color(1.0, 1.0, 1.0, 0.35), 1.5)
	# Range ring (dim)
	draw_arc(Vector2.ZERO, GameConfig.EXTRACTION_DRONE_RANGE, 0.0, TAU, 32,
		Color(1.0, 0.4, 0.1, 0.12), 1.0)
