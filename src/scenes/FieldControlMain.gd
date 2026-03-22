## FieldControlMain — Controle de Campo zone.
## Territorial domination: capture 6 zones by standing inside them.
## Captured zones generate Sinais de Controle passively (flow resource, no backpack).
## Recapturer enemies contest zones. Run ends at 90 s timer. No EXIT.
extends Node2D

# ─────────────────────── Constants ────────────────────────────────────────────
const _PLAYER_SPEED: float  = 200.0
const _PLAYER_R: float      = 14.0
const _RECAPTURER_SPEED: float = 90.0
const _RECAPTURER_HP: float    = 70.0
const _SQUAD_DPS: float        = 25.0   # HP/s per squad member vs Recapturer
const _RECAPTURER_DPS: float   = 8.0    # HP/s per Recapturer in zone on squad
const _SQUAD_HP_PER: float     = 100.0

# Zone capture rates (100% in N seconds)
const _SMALL_CAPTURE_RATE: float  = 0.20   # 5s to capture
const _MEDIUM_CAPTURE_RATE: float = 0.10   # 10s
const _CENTRAL_CAPTURE_RATE: float = 0.05  # 20s
const _DECAY_MULTIPLIER: float = 0.50      # fall speed = 0.5× rise speed
const _CONTEST_DECAY: float   = 0.50      # bar decays this rate while contested (GDD: 0.5× rise speed)
const _KILL_REWARD: float     = 8.0       # instant sinais per recapturer kill

# ─────────────────────── Zone states ──────────────────────────────────────────
const STATE_NEUTRAL   := 0
const STATE_CAPTURING := 1
const STATE_CAPTURED  := 2
const STATE_CONTESTED := 3
const STATE_LOSING    := 4

# ─────────────────────── Inner: CaptureZone ───────────────────────────────────
class _CaptureZone:
	var center: Vector2
	var radius: float
	var capture_rate: float   # bar %/s when capturing
	var signal_rate: float    # sinais_controle/s when captured
	var bar: float = 0.0      # 0.0 = neutral, 1.0 = fully captured
	var state: int = 0        # STATE_* constants

	func setup(c: Vector2, r: float, cr: float, sr: float) -> void:
		center = c
		radius = r
		capture_rate = cr
		signal_rate = sr

# ─────────────────────── Inner: Recapturer ────────────────────────────────────
class _Recapturer:
	var pos: Vector2
	var hp: float = 70.0
	var alive: bool = true
	var target_zone_idx: int = -1
	var _idle_timer: float = 0.0

	func setup(start: Vector2) -> void:
		pos = start
		hp = 70.0
		alive = true

	func find_target(zones: Array) -> void:
		## Target captured zones first, then zones being captured (bar > 0).
		## This creates early pressure before player has captured anything.
		var best_score := -1.0
		var best_idx := -1
		for i in zones.size():
			var z = zones[i]
			if z.bar <= 0.0:
				continue
			# Captured = high priority; partial = priority by bar amount
			var score: float = z.signal_rate * (2.0 if z.state == 2 else 1.0) + z.bar
			if score > best_score:
				best_score = score
				best_idx = i
		target_zone_idx = best_idx

	func update(delta: float, zones: Array) -> void:
		if not alive:
			return
		if target_zone_idx < 0 or target_zone_idx >= zones.size():
			find_target(zones)
		if target_zone_idx < 0:
			# No captured zone to target — idle drift toward center
			_idle_timer -= delta
			if _idle_timer <= 0.0:
				_idle_timer = 2.0
			return
		var target_center: Vector2 = zones[target_zone_idx].center
		var dist := pos.distance_to(target_center)
		if dist > 4.0:
			pos += (target_center - pos).normalized() * 90.0 * delta
		else:
			# Arrived — keep finding targets
			find_target(zones)

# ─────────────────────── Inner: HUD ───────────────────────────────────────────
class _FieldHUD:
	var _layer: CanvasLayer
	var _timer_lbl: Label
	var _signal_lbl: Label
	var _hp_lbl: Label

	func setup(parent: Node) -> void:
		_layer = CanvasLayer.new()
		_layer.layer = 20
		parent.add_child(_layer)

		var bg := ColorRect.new()
		bg.color = Color(0.0, 0.0, 0.0, 0.55)
		bg.size = Vector2(480.0, 48.0)
		_layer.add_child(bg)

		_timer_lbl = Label.new()
		_timer_lbl.position = Vector2(10.0, 10.0)
		_timer_lbl.add_theme_font_size_override("font_size", 18)
		_timer_lbl.modulate = Color(1.0, 0.90, 0.30)
		_layer.add_child(_timer_lbl)

		_signal_lbl = Label.new()
		_signal_lbl.position = Vector2(170.0, 10.0)
		_signal_lbl.add_theme_font_size_override("font_size", 18)
		_signal_lbl.modulate = Color(0.50, 0.75, 1.00)
		_layer.add_child(_signal_lbl)

		_hp_lbl = Label.new()
		_hp_lbl.position = Vector2(340.0, 10.0)
		_hp_lbl.add_theme_font_size_override("font_size", 18)
		_hp_lbl.modulate = Color(1.0, 0.40, 0.40)
		_layer.add_child(_hp_lbl)

	func refresh(timer: float, signals: float, hp: float, zones_held: int, multiplier: float) -> void:
		_timer_lbl.text = "Timer: %ds" % ceili(timer)
		var mul_str := " (x%.1f)" % multiplier if multiplier > 1.0 else ""
		_signal_lbl.text = "Sinais: %d  [%d/6]%s" % [int(signals), zones_held, mul_str]
		_hp_lbl.text = "Vida: %d" % ceili(hp)

# ─────────────────────── Scene state ──────────────────────────────────────────
var _zones: Array = []         # Array[_CaptureZone]
var _recapturers: Array = []   # Array[_Recapturer]
var _signals_acc: float = 0.0
var _run_timer: float = 0.0
var _squad_size: int = 1
var _squad_hp: float = 0.0
var _squad_max_hp: float = 0.0
var _player_pos: Vector2 = Vector2.ZERO
var _drag_target: Vector2 = Vector2.ZERO
var _dragging: bool = false
var _spawn_timer: float = 5.0   # first enemy arrives quickly
var _run_ended: bool = false
var _victory: bool = false
var _damage_flash: float = 0.0
var _pulse: float = 0.0
var _hud = null  # _FieldHUD

# Spawn points (corners of playfield below HUD)
const _SPAWN_POINTS: Array = [
	Vector2(20.0,  70.0),
	Vector2(460.0, 70.0),
	Vector2(20.0,  834.0),
	Vector2(460.0, 834.0),
]

# ─────────────────────── _ready ───────────────────────────────────────────────
func _ready() -> void:
	GameState.start_run()
	_run_timer = GameConfig.FIELD_RUN_TIMER
	_squad_size = 1 + HubState.rescued_characters.size()
	_squad_max_hp = float(_squad_size) * _SQUAD_HP_PER
	_squad_hp = _squad_max_hp

	_build_zones()
	_player_pos = Vector2(240.0, 500.0)  # Start below center zone

	var hud := _FieldHUD.new()
	hud.setup(self)
	_hud = hud
	hud.refresh(_run_timer, 0.0, _squad_hp, 0, 1.0)
	queue_redraw()

# ─────────────────────── Layout ───────────────────────────────────────────────
func _build_zones() -> void:
	_zones.clear()
	var defs: Array = [
		# [center, radius, capture_rate, signal_rate]
		[Vector2(240.0, 430.0), 90.0, _CENTRAL_CAPTURE_RATE, 2.5],  # central
		[Vector2(110.0, 220.0), 65.0, _MEDIUM_CAPTURE_RATE,  1.0],  # medium 1
		[Vector2(370.0, 220.0), 65.0, _MEDIUM_CAPTURE_RATE,  1.0],  # medium 2
		[Vector2(60.0,  620.0), 40.0, _SMALL_CAPTURE_RATE,   0.5],  # small 1
		[Vector2(240.0, 740.0), 40.0, _SMALL_CAPTURE_RATE,   0.5],  # small 2
		[Vector2(420.0, 620.0), 40.0, _SMALL_CAPTURE_RATE,   0.5],  # small 3
	]
	for d in defs:
		var z := _CaptureZone.new()
		z.setup(d[0], d[1], d[2], d[3])
		_zones.append(z)

# ─────────────────────── _process ─────────────────────────────────────────────
func _process(delta: float) -> void:
	if _run_ended:
		return
	if GameState.current_state != GameState.RunState.PLAYING:
		return

	_pulse += delta
	_damage_flash = maxf(0.0, _damage_flash - delta * 3.0)
	_run_timer -= delta
	if _run_timer <= 0.0:
		_run_timer = 0.0
		_end_run(true)
		return

	# Spawn recapturers
	_spawn_timer -= delta
	if _spawn_timer <= 0.0:
		_spawn_recapturer()
		var elapsed := GameConfig.FIELD_RUN_TIMER - _run_timer
		if elapsed >= 60.0:
			_spawn_timer = 8.0
		elif elapsed >= 30.0:
			_spawn_timer = 10.0
		else:
			_spawn_timer = 15.0

	# Update recapturers
	var to_remove: Array[int] = []
	for i in _recapturers.size():
		var rec = _recapturers[i]
		rec.update(delta, _zones)
		if not rec.alive:
			_signals_acc += _KILL_REWARD   # kill reward
			to_remove.append(i)
	for i in range(to_remove.size() - 1, -1, -1):
		_recapturers.remove_at(to_remove[i])

	# Update zone states + generate signals + combat
	var total_recapturer_dps := 0.0
	var zones_captured := 0
	for zone_idx in _zones.size():
		var z = _zones[zone_idx]
		var player_in: bool = _player_pos.distance_to(z.center) < z.radius + _squad_coverage()
		var recapturers_in: int = _count_recapturers_in_zone(z)
		var is_recapturer_here := recapturers_in > 0

		# Determine zone state
		if player_in and not is_recapturer_here:
			if z.bar < 1.0:
				z.state = STATE_CAPTURING
				z.bar = minf(1.0, z.bar + z.capture_rate * delta)
			else:
				z.state = STATE_CAPTURED
		elif player_in and is_recapturer_here:
			z.state = STATE_CONTESTED
			# Bar slowly decays even when contested (player must win the fight)
			z.bar = maxf(0.0, z.bar - z.capture_rate * _CONTEST_DECAY * delta)
			# Combat: squad damages all recapturers in this zone
			var squad_dps := float(_squad_size) * _SQUAD_DPS
			for rec in _recapturers:
				if rec.alive and rec.pos.distance_to(z.center) < z.radius:
					rec.hp -= squad_dps / float(recapturers_in) * delta
					if rec.hp <= 0.0:
						rec.alive = false
			# Recapturers damage squad
			total_recapturer_dps += float(recapturers_in) * _RECAPTURER_DPS
		elif not player_in and is_recapturer_here:
			z.state = STATE_LOSING
			z.bar = maxf(0.0, z.bar - z.capture_rate * _DECAY_MULTIPLIER * delta)
			if z.bar <= 0.0:
				z.state = STATE_NEUTRAL
		else:
			if z.bar >= 1.0:
				z.state = STATE_CAPTURED
			elif z.bar > 0.0:
				z.state = STATE_NEUTRAL
			else:
				z.state = STATE_NEUTRAL

		if z.bar >= 1.0:
			zones_captured += 1

	# Second pass: generate signals using final zones_captured count
	var mul := _dominance_multiplier(zones_captured)
	for z in _zones:
		if z.state == STATE_CAPTURED or (z.bar >= 1.0 and z.state != STATE_LOSING):
			_signals_acc += z.signal_rate * mul * delta

	# Apply recapturer damage to squad
	if total_recapturer_dps > 0.0:
		_squad_hp -= total_recapturer_dps * delta
		_damage_flash = maxf(_damage_flash, 0.4)
		if _squad_hp <= 0.0:
			_squad_hp = 0.0
			_end_run(false)
			return

	_hud.refresh(_run_timer, _signals_acc, _squad_hp, zones_captured,
		_dominance_multiplier(zones_captured))
	queue_redraw()


func _dominance_multiplier(zones_held: int) -> float:
	if zones_held >= 6: return 3.0
	if zones_held >= 4: return 2.0
	if zones_held >= 3: return 1.5
	return 1.0


func _squad_coverage() -> float:
	return float(_squad_size - 1) * 10.0   # +10px per extra squad member


func _count_recapturers_in_zone(zone) -> int:
	var count := 0
	for rec in _recapturers:
		if rec.alive and rec.pos.distance_to(zone.center) < zone.radius:
			count += 1
	return count


func _spawn_recapturer() -> void:
	if _recapturers.size() >= 12:   # raised from 6; GDD has no cap, 12 is a safety net
		return
	var spawn_pt: Vector2 = _SPAWN_POINTS[randi() % _SPAWN_POINTS.size()]
	var rec := _Recapturer.new()
	rec.setup(spawn_pt)
	# Assign initial target
	rec.find_target(_zones)
	_recapturers.append(rec)


func _end_run(victory: bool) -> void:
	if _run_ended:
		return
	_run_ended = true
	_victory = victory
	if victory:
		HubState.deposit_flow("sinais_controle", int(_signals_acc))
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
	draw_rect(Rect2(Vector2.ZERO, Vector2(480.0, 854.0)), Color(0.03, 0.03, 0.06))
	_draw_zones()
	_draw_recapturers()
	_draw_player()
	_draw_dominance_indicator()
	if _run_ended:
		_draw_end_overlay()


func _draw_dominance_indicator() -> void:
	var held := 0
	for z in _zones:
		if z.bar >= 1.0:
			held += 1
	if held < 3:
		return
	var mul := _dominance_multiplier(held)
	var p := 0.7 + 0.3 * sin(_pulse * 3.0)
	var col := Color(0.30, 1.00, 0.50, p)
	if held >= 6:
		col = Color(1.00, 0.85, 0.10, p)
	draw_string(ThemeDB.fallback_font, Vector2(240.0, 68.0),
		"DOMINÂNCIA x%.1f" % mul,
		HORIZONTAL_ALIGNMENT_CENTER, -1, 14, col)


func _draw_zones() -> void:
	for z in _zones:
		var state_col: Color
		var ring_w := 3.0
		match z.state:
			STATE_NEUTRAL:   state_col = Color(0.35, 0.35, 0.40, 0.50)
			STATE_CAPTURING: state_col = Color(0.25, 0.45, 0.90, 0.65)
			STATE_CAPTURED:  state_col = Color(0.20, 0.50, 0.95, 0.80)
			STATE_CONTESTED:
				# Pulsing warning — purple urgent flash
				var p := 0.5 + 0.5 * sin(_pulse * 8.0)
				state_col = Color(0.85, 0.15 + 0.15 * p, 0.90, 0.60 + 0.30 * p)
				ring_w = 4.0 + 2.0 * p
			STATE_LOSING:
				# Pulsing red danger
				var p := 0.5 + 0.5 * sin(_pulse * 6.0)
				state_col = Color(1.00, 0.10 + 0.15 * p, 0.10, 0.60 + 0.30 * p)
				ring_w = 4.0 + 2.0 * p
			_:               state_col = Color(0.35, 0.35, 0.40, 0.50)

		# Zone fill
		draw_circle(z.center, z.radius, Color(state_col.r, state_col.g, state_col.b, 0.12))
		# Zone ring
		draw_arc(z.center, z.radius, 0.0, TAU, 48, state_col, ring_w)
		# Capture bar arc
		if z.bar > 0.0:
			var bar_col := Color(0.35, 0.75, 1.00, 0.85) if z.bar < 1.0 else Color(0.40, 0.90, 0.40, 0.90)
			draw_arc(z.center, z.radius + 6.0, -PI * 0.5, -PI * 0.5 + TAU * z.bar,
				48, bar_col, 5.0)
		# Signal rate label
		var rate_str := "%.1f/s" % z.signal_rate
		draw_string(ThemeDB.fallback_font, z.center + Vector2(0.0, 6.0),
			rate_str, HORIZONTAL_ALIGNMENT_CENTER, -1, 11,
			Color(state_col.r, state_col.g, state_col.b, 0.90))
		# "DEFENDENDO!" warning when losing
		if z.state == STATE_LOSING or z.state == STATE_CONTESTED:
			var warn := "DEFENDENDO!" if z.state == STATE_LOSING else "CONTEST.!"
			draw_string(ThemeDB.fallback_font, z.center + Vector2(0.0, -z.radius - 8.0),
				warn, HORIZONTAL_ALIGNMENT_CENTER, -1, 10, Color(1.0, 0.3, 0.3, 0.95))


func _draw_recapturers() -> void:
	for rec in _recapturers:
		if not rec.alive:
			continue
		draw_circle(rec.pos, 10.0, Color(0.90, 0.25, 0.15))
		draw_arc(rec.pos, 11.0, 0.0, TAU, 8, Color(1.0, 0.35, 0.20, 0.70), 2.0)
		# HP bar above
		var hp_ratio: float = rec.hp / _RECAPTURER_HP
		draw_rect(Rect2(rec.pos.x - 12.0, rec.pos.y - 18.0, 24.0, 4.0),
			Color(0.25, 0.25, 0.25))
		draw_rect(Rect2(rec.pos.x - 12.0, rec.pos.y - 18.0, 24.0 * hp_ratio, 4.0),
			Color(0.90, 0.25, 0.15))


func _draw_player() -> void:
	var c: Color = Color(1.0, 0.25, 0.25) if _damage_flash > 0.5 else Color(0.40, 0.75, 1.00)
	draw_circle(_player_pos, _PLAYER_R, c)
	draw_arc(_player_pos, _PLAYER_R + 2.0, 0.0, TAU, 12,
		Color(c.r, c.g, c.b, 0.45), 1.5)
	# Trailing squad members
	for i in mini(_squad_size - 1, 3):
		var ang := float(i) * TAU / 3.0 + 0.8
		var off := Vector2(cos(ang), sin(ang)) * 22.0
		draw_circle(_player_pos + off, 7.0, Color(0.50, 0.85, 1.00, 0.65))


func _draw_end_overlay() -> void:
	draw_rect(Rect2(Vector2.ZERO, Vector2(480.0, 854.0)), Color(0.0, 0.0, 0.0, 0.70))
	var msg := "RUN COMPLETA!" if _victory else "FALHOU"
	var col := Color(0.30, 1.00, 0.30) if _victory else Color(1.00, 0.30, 0.30)
	draw_string(ThemeDB.fallback_font, Vector2(240.0, 390.0), msg,
		HORIZONTAL_ALIGNMENT_CENTER, -1, 30, col)
	if _victory:
		draw_string(ThemeDB.fallback_font, Vector2(240.0, 440.0),
			"Sinais: %d" % int(_signals_acc),
			HORIZONTAL_ALIGNMENT_CENTER, -1, 22, Color(0.50, 0.80, 1.00))
