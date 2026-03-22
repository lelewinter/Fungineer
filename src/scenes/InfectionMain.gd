## InfectionMain — Laboratório Bioprogramável (v2 — Sistema de Trade-offs).
## O Doutor descobriu biomassa que subverte sistemas de IA. Quatro trade-offs entrelaçados:
##   A) Instabilidade: nós propagados automaticamente são instáveis (frágeis, bio baixa).
##      Jogador os estabiliza (0.5s parado) = subversão consolidada.
##   B) Tensão de biomassa: instável 0.05/s; estável 0.10/s; nó viral estável 0.30/s.
##      Expansão rápida reduz renda de biomassa.
##   C) Sobrecarga da rede: >15 subvertidos → propagação 8s; >20 → 12s.
##   D) Especialização: Nós Virais (ouro, alto bio, frágeis),
##      Âncoras (azul, bio baixa, resistentes a agentes de restauração — 8s de cura).
extends Node2D

# ─────────────────────── Constants ────────────────────────────────────────────
const _PLAYER_SPEED: float    = 200.0
const _PLAYER_R: float        = 14.0
const _INFECT_RANGE: float    = 28.0
const _NODE_R: float          = 14.0
const _INFECT_TIME: float     = 1.0
const _REINFORCE_TIME: float  = GameConfig.INFECTION_REINFORCE_TIME
const _VICTORY_THRESHOLD: float = 0.80
const _VICTORY_BONUS: float   = 1.25

# Propagation (overload tiers)
const _PROPAGATE_BASE: float  = GameConfig.INFECTION_SPREAD_INTERVAL
const _PROPAGATE_OVL1: float  = GameConfig.INFECTION_SPREAD_INTERVAL_OVL1
const _PROPAGATE_OVL2: float  = GameConfig.INFECTION_SPREAD_INTERVAL_OVL2
const _OVERLOAD_T1: int       = GameConfig.INFECTION_OVERLOAD_THRESHOLD_1
const _OVERLOAD_T2: int       = GameConfig.INFECTION_OVERLOAD_THRESHOLD_2

# Biomassa rates
const _BIO_STABLE: float      = GameConfig.INFECTION_BIOMASS_RATE_STABLE
const _BIO_UNSTABLE: float    = GameConfig.INFECTION_BIOMASS_RATE_UNSTABLE
const _BIO_AMPLIFIER: float   = GameConfig.INFECTION_BIOMASS_RATE_AMPLIFIER

# Cure times
const _CURE_STABLE: float     = GameConfig.INFECTION_CURE_TIME_STABLE
const _CURE_UNSTABLE: float   = GameConfig.INFECTION_CURE_TIME_UNSTABLE
const _CURE_AMPLIFIER: float  = GameConfig.INFECTION_CURE_TIME_AMPLIFIER
const _CURE_ANCHOR: float     = GameConfig.INFECTION_CURE_TIME_ANCHOR

# Node states
const NODE_NEUTRAL  := 0
const NODE_INFECTED := 1

# Tipos de nó
const NODE_STANDARD  := 0
const NODE_AMPLIFIER := 1  # Nó Viral — alto bio, muito frágil
const NODE_ANCHOR    := 2  # Âncora — bio baixa, resistente a agentes de restauração

# ─────────────────────── Inner: Agente de Restauração da IA ──────────────────
class _Healer:
	const SPEED: float     = 70.0
	const HIT_RANGE: float = 22.0

	var pos: Vector2
	var target_node: int = -1
	var curing: bool = false
	var cure_timer: float = 0.0
	var _hit_cooldown: float = 0.0

	func setup(start: Vector2) -> void:
		pos = start
		target_node = -1

	func find_target(node_positions: Array, node_states: Array) -> void:
		## Find the nearest infected node as target.
		var best_dist := INF
		var best := -1
		for i in node_states.size():
			if node_states[i] == 1:
				var d: float = pos.distance_to(node_positions[i] as Vector2)
				if d < best_dist:
					best_dist = d
					best = i
		target_node = best
		curing = false
		cure_timer = 0.0

	func update(delta: float, node_positions: Array, node_states: Array,
			player_pos: Vector2) -> bool:
		## Moves toward target; returns true if hit player.
		_hit_cooldown = maxf(0.0, _hit_cooldown - delta)

		if target_node < 0 or target_node >= node_states.size() \
				or node_states[target_node] != 1:
			if curing:
				curing = false
				cure_timer = 0.0
			find_target(node_positions, node_states)

		if target_node >= 0:
			var tgt_pos: Vector2 = node_positions[target_node]
			if curing:
				cure_timer += delta
			else:
				var dist := pos.distance_to(tgt_pos)
				if dist > 14.0:
					pos += (tgt_pos - pos).normalized() * SPEED * delta
				else:
					curing = true
					cure_timer = 0.0

		if pos.distance_to(player_pos) < HIT_RANGE and _hit_cooldown <= 0.0:
			_hit_cooldown = 1.5
			return true
		return false

# ─────────────────────── Inner: HUD ───────────────────────────────────────────
class _InfectHUD:
	var _layer: CanvasLayer
	var _timer_lbl: Label
	var _bio_lbl: Label
	var _hp_lbl: Label
	var _pct_lbl: Label
	var _status_lbl: Label

	func setup(parent: Node) -> void:
		_layer = CanvasLayer.new()
		_layer.layer = 20
		parent.add_child(_layer)

		var bg := ColorRect.new()
		bg.color = Color(0.0, 0.0, 0.0, 0.55)
		bg.size = Vector2(480.0, 48.0)
		_layer.add_child(bg)

		_timer_lbl = Label.new()
		_timer_lbl.position = Vector2(8.0, 10.0)
		_timer_lbl.add_theme_font_size_override("font_size", 17)
		_timer_lbl.modulate = Color(1.0, 0.90, 0.30)
		_layer.add_child(_timer_lbl)

		_bio_lbl = Label.new()
		_bio_lbl.position = Vector2(100.0, 10.0)
		_bio_lbl.add_theme_font_size_override("font_size", 17)
		_bio_lbl.modulate = Color(0.35, 0.90, 0.40)
		_layer.add_child(_bio_lbl)

		_pct_lbl = Label.new()
		_pct_lbl.position = Vector2(220.0, 10.0)
		_pct_lbl.add_theme_font_size_override("font_size", 17)
		_pct_lbl.modulate = Color(0.60, 1.00, 0.60)
		_layer.add_child(_pct_lbl)

		_status_lbl = Label.new()
		_status_lbl.position = Vector2(310.0, 10.0)
		_status_lbl.add_theme_font_size_override("font_size", 15)
		_status_lbl.modulate = Color(1.0, 0.65, 0.20)
		_layer.add_child(_status_lbl)

		_hp_lbl = Label.new()
		_hp_lbl.position = Vector2(430.0, 10.0)
		_hp_lbl.add_theme_font_size_override("font_size", 17)
		_hp_lbl.modulate = Color(1.0, 0.40, 0.40)
		_layer.add_child(_hp_lbl)

	func refresh(timer: float, bio: float, pct: float, hp: int,
			infected_count: int) -> void:
		_timer_lbl.text = "%ds" % ceili(timer)
		_bio_lbl.text = "Bio:%d" % int(bio)
		_pct_lbl.text = "Subv:%d%%" % int(pct * 100.0)
		_hp_lbl.text = "PV:%d" % hp
		# Aviso de sobrecarga da rede
		if infected_count >= GameConfig.INFECTION_OVERLOAD_THRESHOLD_2:
			_status_lbl.text = "SOBRECARGA!"
			_status_lbl.modulate = Color(1.0, 0.25, 0.20)
		elif infected_count >= GameConfig.INFECTION_OVERLOAD_THRESHOLD_1:
			_status_lbl.text = "SATURADA"
			_status_lbl.modulate = Color(1.0, 0.65, 0.20)
		else:
			_status_lbl.text = ""

# ─────────────────────── Scene state ──────────────────────────────────────────
var _node_positions: Array[Vector2] = []
var _node_states: Array[int] = []
var _node_types: Array[int] = []          # NODE_STANDARD / AMPLIFIER / ANCHOR
var _node_stable: Array[bool] = []        # true = manually infected or reinforced
var _node_propagate_timers: Array[float] = []   # -1 = not started
var _edges: Array = []
var _healers: Array = []

var _biomass_acc: float = 0.0
var _run_timer: float = GameConfig.INFECTION_RUN_TIMER
var _player_hp: int = GameConfig.INFECTION_PLAYER_HP
var _player_pos: Vector2 = Vector2.ZERO
var _drag_target: Vector2 = Vector2.ZERO
var _dragging: bool = false

var _infecting_node: int = -1
var _infect_progress: float = 0.0
var _reinforcing_node: int = -1
var _reinforce_progress: float = 0.0

var _run_ended: bool = false
var _victory: bool = false
var _early_victory: bool = false
var _damage_flash: float = 0.0

var _healer_spawn_timer: float = 12.0
var _healer_count_target: int = 1
var _hud = null  # _InfectHUD

var _glow_time: float = 0.0  # drives amplifier glow pulse

# ─────────────────────── _ready ───────────────────────────────────────────────
func _ready() -> void:
	GameState.start_run()
	_run_timer = GameConfig.INFECTION_RUN_TIMER
	_build_graph()
	_player_pos = Vector2(240.0, 400.0)
	_drag_target = _player_pos

	var hud := _InfectHUD.new()
	hud.setup(self)
	_hud = hud
	hud.refresh(_run_timer, 0.0, 0.0, _player_hp, 0)
	queue_redraw()

# ─────────────────────── Graph builder ────────────────────────────────────────
func _build_graph() -> void:
	const COLS: int   = 5
	const ROWS: int   = 5
	const BASE_X: float = 50.0
	const STEP_X: float = 95.0
	const BASE_Y: float = 120.0
	const STEP_Y: float = 140.0
	const JITTER: float = 18.0

	_node_positions.clear()
	_node_states.clear()
	_node_types.clear()
	_node_stable.clear()
	_node_propagate_timers.clear()
	_edges.clear()

	for row in ROWS:
		for col in COLS:
			var bx := BASE_X + col * STEP_X
			var by := BASE_Y + row * STEP_Y
			_node_positions.append(Vector2(
				bx + randf_range(-JITTER, JITTER),
				by + randf_range(-JITTER, JITTER)
			))
			_node_states.append(NODE_NEUTRAL)
			_node_stable.append(false)
			_node_propagate_timers.append(-1.0)

	# Assign types: shuffle indices and distribute amplifiers + anchors
	var n := _node_positions.size()
	var n_amp := int(round(n * GameConfig.INFECTION_PCT_AMPLIFIERS))
	var n_anc := int(round(n * GameConfig.INFECTION_PCT_ANCHORS))
	var indices := range(n)
	indices.shuffle()
	for i in n:
		_node_types.append(NODE_STANDARD)
	for i in n_amp:
		_node_types[indices[i]] = NODE_AMPLIFIER
	for i in n_anc:
		_node_types[indices[n_amp + i]] = NODE_ANCHOR

	# Grid edges
	for row in ROWS:
		for col in COLS:
			var id := row * COLS + col
			if col < COLS - 1:
				_edges.append([id, id + 1])
			if row < ROWS - 1:
				_edges.append([id, id + COLS])

# ─────────────────────── Helpers ──────────────────────────────────────────────
func _infected_count() -> int:
	var count := 0
	for s in _node_states:
		if s == NODE_INFECTED:
			count += 1
	return count


func _infection_pct() -> float:
	if _node_positions.is_empty():
		return 0.0
	return float(_infected_count()) / float(_node_positions.size())


func _get_neighbors(node_idx: int) -> Array[int]:
	var result: Array[int] = []
	for e in _edges:
		if e[0] == node_idx:
			result.append(e[1])
		elif e[1] == node_idx:
			result.append(e[0])
	return result


func _get_propagate_time() -> float:
	## Returns current auto-propagation interval based on network overload.
	var n := _infected_count()
	if n >= _OVERLOAD_T2:
		return _PROPAGATE_OVL2
	if n >= _OVERLOAD_T1:
		return _PROPAGATE_OVL1
	return _PROPAGATE_BASE


func _get_cure_time(node_idx: int) -> float:
	## Returns heal duration for a given node based on type and stability.
	match _node_types[node_idx]:
		NODE_AMPLIFIER:
			return _CURE_AMPLIFIER   # always fragile regardless of stability
		NODE_ANCHOR:
			return _CURE_ANCHOR      # always resistant
		_:  # NODE_STANDARD
			return _CURE_STABLE if _node_stable[node_idx] else _CURE_UNSTABLE


func _get_biomass_rate(node_idx: int) -> float:
	## Returns biomassa/s for an infected node.
	if not _node_stable[node_idx]:
		return _BIO_UNSTABLE  # unstable penalty for all types
	match _node_types[node_idx]:
		NODE_AMPLIFIER:
			return _BIO_AMPLIFIER
		_:
			return _BIO_STABLE


func _infect_node(idx: int, from_propagation: bool) -> void:
	if idx < 0 or idx >= _node_states.size():
		return
	if _node_states[idx] == NODE_INFECTED:
		return
	_node_states[idx] = NODE_INFECTED
	# Amplifiers are always fragile; anchors and standards start stable only if manual
	_node_stable[idx] = (not from_propagation) and (_node_types[idx] != NODE_AMPLIFIER)
	_node_propagate_timers[idx] = _get_propagate_time()

# ─────────────────────── _process ─────────────────────────────────────────────
func _process(delta: float) -> void:
	if _run_ended:
		return
	if GameState.current_state != GameState.RunState.PLAYING:
		return

	_damage_flash = maxf(0.0, _damage_flash - delta * 3.0)
	_glow_time += delta
	_run_timer -= delta

	if _run_timer <= 0.0:
		_run_timer = 0.0
		_end_run(true, false)
		return

	# Healer spawning
	_healer_spawn_timer -= delta
	var elapsed := GameConfig.INFECTION_RUN_TIMER - _run_timer
	if elapsed >= 80.0:
		_healer_count_target = randi_range(3, 4)
	elif elapsed >= 40.0:
		_healer_count_target = randi_range(2, 3)
	else:
		_healer_count_target = randi_range(1, 2)
	if _healer_spawn_timer <= 0.0 and _healers.size() < _healer_count_target:
		_spawn_healer()
		_healer_spawn_timer = 12.0

	# Update healers
	for healer in _healers:
		if healer.update(delta, _node_positions, _node_states, _player_pos):
			_take_damage(1)
			if _run_ended:
				return
		# Healer completed curing — uses per-node cure time
		if healer.curing and healer.target_node >= 0:
			var cure_needed := _get_cure_time(healer.target_node)
			if healer.cure_timer >= cure_needed:
				var node_idx: int = healer.target_node
				if node_idx < _node_states.size() \
						and _node_states[node_idx] == NODE_INFECTED:
					_node_states[node_idx] = NODE_NEUTRAL
					_node_stable[node_idx] = false
					_node_propagate_timers[node_idx] = -1.0
				healer.curing = false
				healer.cure_timer = 0.0
				healer.target_node = -1
				healer.find_target(_node_positions, _node_states)

	# Player manual infection (only on neutral nodes)
	_infecting_node = -1
	for i in _node_positions.size():
		if _node_states[i] != NODE_NEUTRAL:
			continue
		if _player_pos.distance_to(_node_positions[i]) < _INFECT_RANGE:
			_infecting_node = i
			break

	if _infecting_node >= 0:
		_infect_progress += delta
		if _infect_progress >= _INFECT_TIME:
			_infect_node(_infecting_node, false)  # manual = stable
			_infect_progress = 0.0
	else:
		_infect_progress = 0.0

	# Player reinforcement (on unstable infected nodes)
	_reinforcing_node = -1
	if _infecting_node < 0:  # only reinforce when not actively infecting
		for i in _node_positions.size():
			if _node_states[i] != NODE_INFECTED:
				continue
			if _node_stable[i] or _node_types[i] == NODE_AMPLIFIER:
				continue  # already stable or amplifiers can't be stabilised
			if _player_pos.distance_to(_node_positions[i]) < _INFECT_RANGE:
				_reinforcing_node = i
				break

	if _reinforcing_node >= 0:
		_reinforce_progress += delta
		if _reinforce_progress >= _REINFORCE_TIME:
			_node_stable[_reinforcing_node] = true
			_reinforce_progress = 0.0
	else:
		_reinforce_progress = 0.0

	# Auto-propagation (uses dynamic interval per overload tier)
	var prop_time := _get_propagate_time()
	for i in _node_positions.size():
		if _node_states[i] != NODE_INFECTED:
			continue
		if _node_propagate_timers[i] < 0.0:
			continue
		_node_propagate_timers[i] -= delta
		if _node_propagate_timers[i] <= 0.0:
			_node_propagate_timers[i] = -1.0
			for nb in _get_neighbors(i):
				if _node_states[nb] == NODE_NEUTRAL:
					_infect_node(nb, true)  # propagation = unstable

	# Recalculate propagation timers when tier changes (clamp existing timers)
	# This prevents timers set at base-tier from being out of sync with new tier
	for i in _node_positions.size():
		if _node_states[i] == NODE_INFECTED and _node_propagate_timers[i] > prop_time:
			_node_propagate_timers[i] = prop_time

	# Biomassa accumulation — rate varies by node type and stability
	for i in _node_positions.size():
		if _node_states[i] == NODE_INFECTED:
			_biomass_acc += _get_biomass_rate(i) * delta

	# Early victory
	if _infection_pct() >= _VICTORY_THRESHOLD:
		_end_run(true, true)
		return

	_hud.refresh(_run_timer, _biomass_acc, _infection_pct(), _player_hp,
		_infected_count())
	queue_redraw()


func _spawn_healer() -> void:
	var edge := randi() % 4
	var hp: Vector2
	match edge:
		0: hp = Vector2(randf_range(20.0, 460.0), 55.0)
		1: hp = Vector2(460.0, randf_range(55.0, 840.0))
		2: hp = Vector2(randf_range(20.0, 460.0), 840.0)
		_: hp = Vector2(20.0, randf_range(55.0, 840.0))
	var h := _Healer.new()
	h.setup(hp)
	h.find_target(_node_positions, _node_states)
	_healers.append(h)


func _take_damage(amount: int) -> void:
	if _player_hp <= 0 or _run_ended:
		return
	_player_hp -= amount
	_damage_flash = 1.0
	_hud.refresh(_run_timer, _biomass_acc, _infection_pct(), _player_hp,
		_infected_count())
	if _player_hp <= 0:
		_end_run(false, false)


func _end_run(victory: bool, early: bool) -> void:
	if _run_ended:
		return
	_run_ended = true
	_victory = victory
	_early_victory = early
	if victory:
		var amount := _biomass_acc
		if early:
			amount *= _VICTORY_BONUS
		HubState.deposit_flow("biomassa_adaptativa", int(amount))
	HubState.on_run_ended(victory)
	GameState.end_run(victory)
	queue_redraw()
	await get_tree().create_timer(2.5).timeout
	get_tree().change_scene_to_file("res://src/scenes/WorldMapScene.tscn")

# ─────────────────────── Input ────────────────────────────────────────────────
func _unhandled_input(event: InputEvent) -> void:
	if _run_ended:
		return
	if event is InputEventMouseButton:
		var mb := event as InputEventMouseButton
		if mb.button_index == MOUSE_BUTTON_LEFT:
			if mb.pressed:
				_drag_target = event.position
				_dragging = true
			else:
				_dragging = false
	elif event is InputEventMouseMotion and _dragging:
		_drag_target = event.position
	elif event is InputEventScreenTouch:
		if event.pressed:
			_drag_target = event.position
			_dragging = true
		else:
			_dragging = false
	elif event is InputEventScreenDrag:
		_drag_target = event.position


func _physics_process(delta: float) -> void:
	if not _dragging or _run_ended:
		return
	if GameState.current_state != GameState.RunState.PLAYING:
		return
	var dir := _drag_target - _player_pos
	if dir.length() < 4.0:
		return
	_player_pos += dir.normalized() * _PLAYER_SPEED * delta
	_player_pos.x = clampf(_player_pos.x, 0.0, 480.0)
	_player_pos.y = clampf(_player_pos.y, 48.0, 854.0)
	queue_redraw()

# ─────────────────────── Drawing ──────────────────────────────────────────────
func _draw() -> void:
	draw_rect(Rect2(Vector2.ZERO, Vector2(480.0, 854.0)), Color(0.02, 0.04, 0.03))
	_draw_edges()
	_draw_nodes()
	_draw_healers()
	_draw_player()
	if _run_ended:
		_draw_end_overlay()


func _draw_edges() -> void:
	for e in _edges:
		var a: Vector2 = _node_positions[e[0]]
		var b: Vector2 = _node_positions[e[1]]
		var a_inf: bool = _node_states[e[0]] == NODE_INFECTED
		var b_inf: bool = _node_states[e[1]] == NODE_INFECTED
		var edge_col: Color
		if a_inf and b_inf:
			edge_col = Color(0.25, 0.75, 0.30, 0.70)
		elif a_inf or b_inf:
			edge_col = Color(0.20, 0.55, 0.25, 0.55)
		else:
			edge_col = Color(0.25, 0.30, 0.25, 0.40)
		draw_line(a, b, edge_col, 2.0)


func _draw_nodes() -> void:
	for i in _node_positions.size():
		var pos: Vector2 = _node_positions[i]
		var state: int   = _node_states[i]
		var ntype: int   = _node_types[i]
		var stable: bool = _node_stable[i]
		var is_infecting: bool   = (i == _infecting_node)
		var is_reinforcing: bool = (i == _reinforcing_node)

		# Healer cure progress for this node
		var cure_prog := 0.0
		var cure_time_needed := _get_cure_time(i)
		for healer in _healers:
			if healer.curing and healer.target_node == i:
				cure_prog = clampf(healer.cure_timer / cure_time_needed, 0.0, 1.0)
				break

		# Base body colour by type and state
		var body_col: Color
		if state == NODE_INFECTED:
			if cure_prog > 0.0:
				body_col = Color(0.20 + cure_prog * 0.25, 0.70 - cure_prog * 0.40,
					0.25 + cure_prog * 0.10, 0.85)
			elif ntype == NODE_AMPLIFIER:
				# Gold — bright and obviously valuable
				body_col = Color(0.90, 0.75, 0.10, 0.95) if stable \
					else Color(0.75, 0.55, 0.10, 0.80)
			elif ntype == NODE_ANCHOR:
				# Blue — solid and resistant
				body_col = Color(0.15, 0.40, 0.90, 0.95)
			elif stable:
				body_col = Color(0.20, 0.80, 0.28, 0.90)
			else:
				# Unstable: dimmer green, visually distinct
				body_col = Color(0.18, 0.55, 0.22, 0.75)
		elif is_infecting:
			# Neutral being infected: type hint tint
			if ntype == NODE_AMPLIFIER:
				body_col = Color(0.70, 0.55, 0.10, 0.80)
			elif ntype == NODE_ANCHOR:
				body_col = Color(0.10, 0.30, 0.70, 0.80)
			else:
				body_col = Color(0.20, 0.65, 0.25, 0.80)
		else:
			# Neutral idle: subtle type hint
			if ntype == NODE_AMPLIFIER:
				body_col = Color(0.38, 0.33, 0.12, 0.75)
			elif ntype == NODE_ANCHOR:
				body_col = Color(0.15, 0.20, 0.40, 0.75)
			else:
				body_col = Color(0.30, 0.35, 0.30, 0.75)

		# Amplifier radial glow — concentric circles with pulsing alpha/radius
		if ntype == NODE_AMPLIFIER:
			var pulse := (sin(_glow_time * 2.8) * 0.5 + 0.5)  # 0..1
			var glow_extra := pulse * 6.0                       # 0..6 px extra radius
			var glow_base_a := 0.18 if state == NODE_INFECTED else 0.09
			var glow_col_r := 1.00
			var glow_col_g := 0.82 if state == NODE_INFECTED else 0.60
			# 4 glow layers: outermost to innermost
			draw_circle(pos, _NODE_R + 14.0 + glow_extra,
				Color(glow_col_r, glow_col_g, 0.05, glow_base_a * 0.30))
			draw_circle(pos, _NODE_R + 10.0 + glow_extra * 0.7,
				Color(glow_col_r, glow_col_g, 0.05, glow_base_a * 0.55))
			draw_circle(pos, _NODE_R + 6.0 + glow_extra * 0.4,
				Color(glow_col_r, glow_col_g, 0.05, glow_base_a * 0.80))
			draw_circle(pos, _NODE_R + 2.5,
				Color(glow_col_r, glow_col_g, 0.10, glow_base_a * 1.00))

		draw_circle(pos, _NODE_R, body_col)
		draw_arc(pos, _NODE_R + 1.5, 0.0, TAU, 12,
			Color(body_col.r, body_col.g, body_col.b, 0.50), 1.5)

		# Unstable indicator: dashed outer ring (drawn as short arcs)
		if state == NODE_INFECTED and not stable and ntype != NODE_ANCHOR:
			draw_arc(pos, _NODE_R + 4.0, 0.0, TAU * 0.5, 8,
				Color(1.0, 0.80, 0.20, 0.50), 1.5)

		# Manual infection progress ring
		if is_infecting and _infect_progress > 0.0:
			var p := clampf(_infect_progress / _INFECT_TIME, 0.0, 1.0)
			draw_arc(pos, _NODE_R + 5.0, -PI * 0.5, -PI * 0.5 + TAU * p,
				24, Color(0.40, 1.00, 0.45, 0.95), 3.0)

		# Reinforcement progress ring (cyan)
		if is_reinforcing and _reinforce_progress > 0.0:
			var p := clampf(_reinforce_progress / _REINFORCE_TIME, 0.0, 1.0)
			draw_arc(pos, _NODE_R + 5.0, -PI * 0.5, -PI * 0.5 + TAU * p,
				16, Color(0.30, 0.90, 1.00, 0.95), 3.0)

		# Propagation countdown ring
		if state == NODE_INFECTED:
			var pt: float = _node_propagate_timers[i]
			if pt > 0.0:
				var ratio := clampf(pt / _get_propagate_time(), 0.0, 1.0)
				draw_arc(pos, _NODE_R + 8.0, -PI * 0.5, -PI * 0.5 + TAU * ratio,
					20, Color(0.25, 1.00, 0.30, 0.45), 2.0)

		# Healing progress arc (red)
		if cure_prog > 0.0:
			draw_arc(pos, _NODE_R + 11.0, -PI * 0.5, -PI * 0.5 + TAU * cure_prog,
				20, Color(0.90, 0.30, 0.20, 0.80), 2.5)


func _draw_healers() -> void:
	## Agentes de Restauração da IA — losangos azul-gelo, frios e metálicos.
	for healer in _healers:
		var s := 9.0
		var pts := PackedVector2Array([
			healer.pos + Vector2(0, -s),
			healer.pos + Vector2(s, 0),
			healer.pos + Vector2(0, s),
			healer.pos + Vector2(-s, 0),
		])
		draw_colored_polygon(pts, Color(0.15, 0.55, 0.90, 0.88))
		draw_polyline(PackedVector2Array([pts[0], pts[1], pts[2], pts[3], pts[0]]),
			Color(0.60, 0.85, 1.00, 0.70), 1.5)
		# Núcleo sensor central
		draw_circle(healer.pos, 2.5, Color(0.90, 0.95, 1.00, 0.90))


func _draw_player() -> void:
	## Sobrevivente: âmbar quente — contraste visual com os nós frios da IA.
	var c: Color = Color(1.0, 0.25, 0.25) if _damage_flash > 0.5 \
		else Color(0.95, 0.65, 0.20)
	draw_circle(_player_pos, _PLAYER_R, c)
	draw_arc(_player_pos, _PLAYER_R + 2.0, 0.0, TAU, 12,
		Color(c.r, c.g, c.b, 0.40), 1.5)


func _draw_end_overlay() -> void:
	draw_rect(Rect2(Vector2.ZERO, Vector2(480.0, 854.0)), Color(0.0, 0.0, 0.0, 0.70))
	var msg: String
	var col: Color
	if not _victory:
		msg = "RESISTÊNCIA ELIMINADA"
		col = Color(1.00, 0.30, 0.30)
	elif _early_victory:
		msg = "REDE SUBVERTIDA!"
		col = Color(0.40, 1.00, 0.45)
	else:
		msg = "OPERAÇÃO CONCLUÍDA"
		col = Color(0.30, 0.90, 0.35)
	draw_string(ThemeDB.fallback_font, Vector2(240.0, 380.0), msg,
		HORIZONTAL_ALIGNMENT_CENTER, -1, 28, col)
	if _victory:
		var amount := _biomass_acc * (_VICTORY_BONUS if _early_victory else 1.0)
		draw_string(ThemeDB.fallback_font, Vector2(240.0, 430.0),
			"Biomassa: %d" % int(amount),
			HORIZONTAL_ALIGNMENT_CENTER, -1, 22, Color(0.40, 1.00, 0.45))
		if _early_victory:
			draw_string(ThemeDB.fallback_font, Vector2(240.0, 465.0),
				"(bônus +25%!)",
				HORIZONTAL_ALIGNMENT_CENTER, -1, 16, Color(0.90, 1.00, 0.50))
