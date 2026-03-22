## CircuitSentinel — Patrol enemy for the Circuito Quebrado zone.
## Implements the A-B patrol / line-of-sight charge pattern from GDD Zone 2.
##
## States:
##   PATROL — walks between waypoint_a and waypoint_b at CIRCUIT_SENTINEL_SPEED.
##   CHARGE  — charges in a straight line toward player at CIRCUIT_SENTINEL_CHARGE_SPEED.
##             If player leaves 300 px range during charge, returns to PATROL.
##
## Contact: radius CIRCUIT_SENTINEL_CONTACT_RADIUS → emits hit_player (1 s internal cooldown).
## Drawn programmatically via _draw() — no external texture required.
class_name CircuitSentinel
extends Node2D

enum _State { PATROL, CHARGE }

## Patrol endpoint A (world position). Set by CircuitMain before adding to tree.
var waypoint_a: Vector2 = Vector2.ZERO
## Patrol endpoint B (world position). Set by CircuitMain before adding to tree.
var waypoint_b: Vector2 = Vector2.ZERO

## Reference to the CircuitAgent node. Set via setup().
var _agent: Node2D = null

var _state: _State = _State.PATROL
var _patrol_target: Vector2 = Vector2.ZERO
var _charge_dir: Vector2 = Vector2.ZERO
var _hit_cooldown: float = 0.0

## Distance threshold at which CHARGE is abandoned and PATROL resumes (px).
const _CHARGE_ABANDON_RANGE: float = 300.0
## Line-of-sight detection range that triggers CHARGE (px).
const _SIGHT_RANGE: float = 200.0

## Emitted once per contact with cooldown; CircuitMain listens to call take_hit().
signal hit_player()


## Initialise the sentinel with patrol route and agent reference.
## Must be called before the node is added to the scene tree.
func setup(a: Vector2, b: Vector2, agent: Node2D) -> void:
	waypoint_a = a
	waypoint_b = b
	_agent = agent
	_patrol_target = b
	global_position = a


func _process(delta: float) -> void:
	if _agent == null or GameState.current_state != GameState.RunState.PLAYING:
		return

	_hit_cooldown = max(0.0, _hit_cooldown - delta)

	match _state:
		_State.PATROL:
			_do_patrol(delta)
			_check_sight()
		_State.CHARGE:
			_do_charge(delta)
			_check_abandon()

	_check_contact()
	queue_redraw()


# ── State behaviours ────────────────────────────────────────────────────────

func _do_patrol(delta: float) -> void:
	var to_target: Vector2 = _patrol_target - global_position
	if to_target.length() < 8.0:
		_patrol_target = waypoint_a if _patrol_target.is_equal_approx(waypoint_b) else waypoint_b
		return
	global_position += to_target.normalized() * GameConfig.CIRCUIT_SENTINEL_SPEED * delta


func _check_sight() -> void:
	if _agent == null:
		return
	var dist: float = global_position.distance_to(_agent.global_position)
	if dist <= _SIGHT_RANGE:
		# Line-of-sight is axis-aligned check per spec (straight line charge)
		_charge_dir = (_agent.global_position - global_position).normalized()
		_state = _State.CHARGE


func _do_charge(delta: float) -> void:
	global_position += _charge_dir * GameConfig.CIRCUIT_SENTINEL_CHARGE_SPEED * delta


func _check_abandon() -> void:
	if _agent == null:
		return
	var dist: float = global_position.distance_to(_agent.global_position)
	if dist > _CHARGE_ABANDON_RANGE:
		_state = _State.PATROL


# ── Contact damage ──────────────────────────────────────────────────────────

func _check_contact() -> void:
	if _agent == null or _hit_cooldown > 0.0:
		return
	var dist: float = global_position.distance_to(_agent.global_position)
	if dist <= GameConfig.CIRCUIT_SENTINEL_CONTACT_RADIUS:
		_hit_cooldown = 1.0
		hit_player.emit()


# ── Visual ──────────────────────────────────────────────────────────────────

func _draw() -> void:
	const BODY_RADIUS: float = 12.0
	var body_color: Color = Color(0.55, 0.55, 0.6) if _state == _State.PATROL else Color(0.95, 0.2, 0.15)

	# Body circle
	draw_circle(Vector2.ZERO, BODY_RADIUS, body_color)

	# Direction indicator — small forward nub
	var forward: Vector2 = Vector2.ZERO
	if _state == _State.PATROL:
		var to_target: Vector2 = _patrol_target - global_position
		if to_target.length() > 1.0:
			forward = to_target.normalized()
	else:
		forward = _charge_dir

	if forward.length() > 0.5:
		draw_line(Vector2.ZERO, forward * (BODY_RADIUS + 6.0), Color(1.0, 1.0, 1.0, 0.8), 2.0)

	# Contact radius ring (debug aid — dim)
	draw_arc(Vector2.ZERO, GameConfig.CIRCUIT_SENTINEL_CONTACT_RADIUS,
		0.0, TAU, 24, Color(body_color.r, body_color.g, body_color.b, 0.25), 1.0)
