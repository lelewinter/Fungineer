## Núcleo Sentinela Δ-9 — Boss. Padrão de avanço, invocações, janela de vulnerabilidade. Duas fases.
class_name SentinelCore
extends BaseEnemy

enum Phase { ONE, TWO }

var phase: Phase = Phase.ONE
var is_dashing: bool = false
var is_vulnerable: bool = false
var dash_timer: float = 0.0
var add_timer: float = 0.0
var orb_timer: float = 0.0
var vulnerable_timer: float = 0.0

var _dash_direction: Vector2 = Vector2.RIGHT
var _dash_speed_override: float = 0.0

signal phase_changed(new_phase)
signal became_vulnerable()
signal became_invulnerable()


func _ready() -> void:
	enemy_name = "Núcleo Sentinela Δ-9"
	max_hp = GameConfig.SENTINEL_HP
	move_speed = 0.0  # Boss doesn't walk — it dashes
	attack_damage = 0.0  # Damage is dealt by dash collision and adds
	color = Color(0.9, 0.9, 0.1)  # Yellow-gold
	is_elite = true
	super._ready()
	# Make boss visually larger
	_visual.size = Vector2(48, 48)
	_visual.position = Vector2(-24, -24)
	_hp_bar_bg.size = Vector2(80, 6)
	_hp_bar_bg.position = Vector2(-40, -32)
	_hp_bar_fill.size = Vector2(80, 6)
	_hp_bar_fill.position = Vector2(-40, -32)
	_hp_bar_fill.color = Color(0.9, 0.8, 0.1)
	# Boss is immune to damage when not vulnerable
	collision_layer = 8  # layer 4 = boss


func _physics_process(delta: float) -> void:
	if is_dead:
		return
	_check_phase_transition()
	_tick_dash(delta)
	_tick_adds(delta)
	if phase == Phase.TWO:
		_tick_orb(delta)
	if is_vulnerable:
		_tick_vulnerability(delta)
	_update_hp_bar()


func _check_phase_transition() -> void:
	if phase == Phase.ONE and (current_hp / max_hp) <= GameConfig.SENTINEL_PHASE2_THRESHOLD:
		phase = Phase.TWO
		phase_changed.emit(Phase.TWO)
		# Flash visual
		_visual.color = Color(1.0, 0.4, 0.0)  # Orange


func _tick_dash(delta: float) -> void:
	if is_dashing:
		global_position += _dash_direction * GameConfig.SENTINEL_DASH_SPEED * delta
		# Check arena bounds — bounce off walls triggers vulnerability
		var hit_wall := false
		if global_position.x <= 40 or global_position.x >= GameConfig.ARENA_WIDTH - 40:
			hit_wall = true
		if global_position.y <= 40 or global_position.y >= GameConfig.ARENA_HEIGHT - 40:
			hit_wall = true
		if hit_wall:
			_end_dash()
		else:
			# Damage party on contact during dash
			for member in GameState.party:
				if not is_instance_valid(member) or member.is_dead:
					continue
				if global_position.distance_to(member.global_position) < 40.0:
					member.take_damage(30.0, self)
		return

	var interval := GameConfig.SENTINEL_DASH_INTERVAL_P1 if phase == Phase.ONE else GameConfig.SENTINEL_DASH_INTERVAL_P2
	dash_timer += delta
	if dash_timer >= interval:
		dash_timer = 0.0
		_start_dash()


func _start_dash() -> void:
	if current_target == null:
		return
	is_dashing = true
	is_vulnerable = false
	_dash_direction = (current_target.global_position - global_position).normalized()
	became_invulnerable.emit()


func _end_dash() -> void:
	is_dashing = false
	velocity = Vector2.ZERO
	is_vulnerable = true
	vulnerable_timer = 0.0
	became_vulnerable.emit()


func _tick_vulnerability(delta: float) -> void:
	vulnerable_timer += delta
	if vulnerable_timer >= GameConfig.SENTINEL_VULNERABLE_WINDOW:
		is_vulnerable = false
		became_invulnerable.emit()


func _tick_adds(delta: float) -> void:
	var interval := GameConfig.SENTINEL_ADD_INTERVAL_P1 if phase == Phase.ONE else GameConfig.SENTINEL_ADD_INTERVAL_P2
	add_timer += delta
	if add_timer >= interval:
		add_timer = 0.0
		_spawn_adds()


func _spawn_adds() -> void:
	# Use parent container (Enemies node) directly
	var container := get_parent()
	var count := GameConfig.SENTINEL_ADD_COUNT_P1
	for i in count:
		var runner := Runner.new()
		var angle := randf() * TAU
		runner.global_position = global_position + Vector2(cos(angle), sin(angle)) * 80.0
		container.add_child(runner)

	if phase == Phase.TWO:
		var bruiser := Bruiser.new()
		bruiser.global_position = global_position + Vector2(randf_range(-100, 100), randf_range(-100, 100))
		container.add_child(bruiser)


func _tick_orb(delta: float) -> void:
	orb_timer += delta
	if orb_timer >= GameConfig.SENTINEL_ORB_INTERVAL:
		orb_timer = 0.0
		_fire_homing_orb()


func _fire_homing_orb() -> void:
	if GameState.party.is_empty():
		return
	var target: Node2D = null
	for m in GameState.party:
		if not m.is_dead:
			target = m
			break
	if target == null:
		return
	var orb := SentinelOrb.new()
	orb.target = target
	orb.global_position = global_position
	get_parent().add_child(orb)  # Add to Enemies container alongside boss


## Override: only take damage when vulnerable.
func take_damage(amount: float, source: Node = null) -> void:
	if not is_vulnerable:
		return
	super.take_damage(amount, source)


func _die() -> void:
	is_dead = true
	remove_from_group("enemies")
	GameState.boss_defeated = true
	died.emit(self)
	GameState.end_run(true)
	queue_free()
