## ExtractionMain — Corrida de Extração (Zone 3) — Lane Runner.
## 7 lanes preenchendo a tela. Mundo rola direita→esquerda automaticamente.
## Jogador toca metade superior/inferior para subir/descer 1 lane.
## 5 tipos de obstáculo-debuff: fumaça, lentidão, faísca, EMP, teia.
## Timer 60s, coleta instantânea de canisters, +T bônus de tempo.
extends Node2D

# ── Lane layout ────────────────────────────────────────────────────────────────
const _LANE_COUNT: int  = GameConfig.EXTRACTION_LANE_COUNT   # 7
const _LANE_H: float    = GameConfig.EXTRACTION_LANE_H       # 122.0
const _PLAYER_X: float  = 100.0
const _LANE_START: int  = 3   # middle lane

# ── Scroll ─────────────────────────────────────────────────────────────────────
const _SCROLL_START: float = GameConfig.EXTRACTION_SCROLL_START
const _SCROLL_END: float   = GameConfig.EXTRACTION_SCROLL_END

# ── Lane transition ────────────────────────────────────────────────────────────
const _SWITCH_DUR: float = GameConfig.EXTRACTION_LANE_SWITCH_DUR

# ── Obstacle / spawn ───────────────────────────────────────────────────────────
const _SPAWN_X: float      = 540.0   # how far right of viewport obstacles spawn
const _OBS_W_MIN: float    = 70.0
const _OBS_W_MAX: float    = 130.0
const _SPAWN_IVRL_S: float = GameConfig.EXTRACTION_SPAWN_IVRL_START
const _SPAWN_IVRL_E: float = GameConfig.EXTRACTION_SPAWN_IVRL_END

# ── Pickup ─────────────────────────────────────────────────────────────────────
const _PICK_RADIUS: float = 24.0

# ── Debuff durations ───────────────────────────────────────────────────────────
const _DUR_SMOKE: float  = GameConfig.EXTRACTION_DEBUFF_SMOKE
const _DUR_SLOW: float   = GameConfig.EXTRACTION_DEBUFF_SLOW
const _DUR_EMP: float    = GameConfig.EXTRACTION_DEBUFF_EMP
const _DUR_WIRE: float   = GameConfig.EXTRACTION_DEBUFF_WIRE
const _SPARK_TICK: float = GameConfig.EXTRACTION_SPARK_TICK
const _SPARK_DMG: float  = GameConfig.EXTRACTION_SPARK_DMG

# ── Debuff types ───────────────────────────────────────────────────────────────
# Shared with _Obstacle inner class via int constants (enum casting unreliable
# across inner class boundaries in GDScript 4).
const OBS_SMOKE: int = 0
const OBS_SLOW: int  = 1
const OBS_SPARK: int = 2
const OBS_EMP: int   = 3
const OBS_WIRE: int  = 4
const OBS_COUNT: int = 5

# ── Nodes ──────────────────────────────────────────────────────────────────────
var _world: Node2D
var _party: Party
var _camera: Camera2D
var _smoke_overlay: ColorRect   # right-side vision block during SMOKE debuff

# ── Collections ────────────────────────────────────────────────────────────────
var _obstacles: Array = []   # Array[_Obstacle]
var _canisters: Array = []   # Array[_Canister]

# ── Player / lane state ────────────────────────────────────────────────────────
var _lane: int    = _LANE_START   # current settled lane
var _lane_t: int  = _LANE_START   # target lane
var _lerp: float  = 1.0           # 0→1 transition progress
var _player_y: float              # current lerped Y

# ── Debuff state ───────────────────────────────────────────────────────────────
var _debuff: int       = -1   # -1 = none, else OBS_* constant
var _debuff_timer: float = 0.0
var _spark_lane: int   = -1
var _spark_acc: float  = 0.0

# ── Run state ──────────────────────────────────────────────────────────────────
var _run_timer: float       = GameConfig.EXTRACTION_RUN_TIMER
var _backpack: Array[String] = []
var _run_ended: bool         = false
var _pulse: float            = 0.0

# ── Spawn state ────────────────────────────────────────────────────────────────
var _spawn_acc: float = 0.0

# ── HUD refs ───────────────────────────────────────────────────────────────────
var _timer_lbl: Label
var _slots_lbl: Label
var _debuff_lbl: Label
var _overlay_panel: ColorRect
var _overlay_lbl: Label


# ══ Inner class: Obstacle ══════════════════════════════════════════════════════

class _Obstacle extends Node2D:
	## Scrolling obstacle that applies a debuff on contact.
	var obs_type: int  = 0      # OBS_* constant from outer class
	var lane: int      = 0
	var obs_w: float   = 80.0
	var hit: bool      = false  # debuff already applied

	func setup(l: int, w: float, t: int, start_x: float) -> void:
		lane   = l
		obs_w  = w
		obs_type = t
		position = Vector2(start_x, l * 122.0)

	func tick(delta: float, spd: float) -> void:
		position.x -= spd * delta

	func _draw() -> void:
		var col: Color = _color()
		# Main block (slight vertical inset for lane separator visibility)
		draw_rect(Rect2(0.0, 3.0, obs_w, 116.0), col)
		# Dark left edge (warning stripe)
		draw_rect(Rect2(0.0, 3.0, 6.0, 116.0), Color(0.0, 0.0, 0.0, 0.4))
		# Label
		draw_string(ThemeDB.fallback_font,
			Vector2(10.0, 67.0), _label(),
			HORIZONTAL_ALIGNMENT_LEFT, -1, 11, Color(1.0, 1.0, 1.0, 0.9))

	func _color() -> Color:
		match obs_type:
			0: return Color(0.22, 0.22, 0.25, 0.90)   # SMOKE  — charcoal
			1: return Color(0.10, 0.30, 0.90, 0.82)   # SLOW   — deep blue
			2: return Color(1.00, 0.72, 0.04, 0.90)   # SPARK  — amber
			3: return Color(0.68, 0.12, 0.92, 0.86)   # EMP    — violet
			4: return Color(0.88, 0.10, 0.10, 0.84)   # WIRE   — red
		return Color.WHITE

	func _label() -> String:
		match obs_type:
			0: return "FUMAÇA"
			1: return "LENTO"
			2: return "FAÍSCA"
			3: return "EMP"
			4: return "TEIA"
		return "?"


# ══ Inner class: Canister ══════════════════════════════════════════════════════

class _Canister extends Node2D:
	## Fuel canister that scrolls left; collected on proximity.
	var is_bonus: bool = false
	var collected: bool = false

	func setup(pos: Vector2, bonus: bool) -> void:
		position = pos
		is_bonus = bonus

	func tick(delta: float, spd: float) -> void:
		if not collected:
			position.x -= spd * delta

	func _draw() -> void:
		if collected:
			return
		if is_bonus:
			draw_circle(Vector2.ZERO, 11.0, Color(0.2, 0.85, 0.95, 0.9))
			draw_string(ThemeDB.fallback_font, Vector2(-6, 5), "+T",
				HORIZONTAL_ALIGNMENT_LEFT, -1, 10, Color.WHITE)
		else:
			draw_circle(Vector2.ZERO, 11.0, Color(0.95, 0.65, 0.1, 0.9))
			draw_circle(Vector2.ZERO, 5.0,  Color(1.0, 0.85, 0.3, 0.8))


# ══ Lifecycle ══════════════════════════════════════════════════════════════════

func _ready() -> void:
	_player_y = _lane_center(_LANE_START)
	_build_world()
	_build_squad()
	_build_hud()
	GameState.start_run()
	GameState.run_ended.connect(_on_run_ended)


func _process(delta: float) -> void:
	if _run_ended:
		return
	if GameState.current_state != GameState.RunState.PLAYING:
		return

	_pulse += delta
	_run_timer -= delta

	var t_ratio: float = clampf(1.0 - _run_timer / GameConfig.EXTRACTION_RUN_TIMER, 0.0, 1.0)
	var scroll_spd: float = lerpf(_SCROLL_START, _SCROLL_END, t_ratio)

	# ── Lane transition lerp ──────────────────────────────────────────────────
	if _lerp < 1.0:
		var eff_dur: float = _SWITCH_DUR * (3.0 if _debuff == OBS_SLOW else 1.0)
		_lerp = minf(_lerp + delta / eff_dur, 1.0)
		_player_y = lerpf(_lane_center(_lane), _lane_center(_lane_t), _lerp)
		if _lerp >= 1.0:
			_lane = _lane_t

	# Keep party at player position
	_party.position = Vector2(_PLAYER_X, _player_y)

	# ── Debuff countdown ──────────────────────────────────────────────────────
	if _debuff >= 0:
		_debuff_timer -= delta
		# SPARK: auto-clear when player leaves the sparking lane
		if _debuff == OBS_SPARK and _lane == _lane_t and _lane != _spark_lane:
			_clear_debuff()
		elif _debuff_timer <= 0.0:
			_clear_debuff()

	# ── Spark damage tick ─────────────────────────────────────────────────────
	if _debuff == OBS_SPARK and _lane == _spark_lane:
		_spark_acc += delta
		if _spark_acc >= _SPARK_TICK:
			_spark_acc = 0.0
			_deal_spark_damage()

	# ── Smoke overlay pulse ───────────────────────────────────────────────────
	if _debuff == OBS_SMOKE:
		_smoke_overlay.modulate.a = 0.85 + 0.12 * sin(_pulse * 5.0)

	# ── Obstacles: move, collide, cull ────────────────────────────────────────
	for obs: _Obstacle in _obstacles.duplicate():
		obs.tick(delta, scroll_spd)
		obs.queue_redraw()
		if not obs.hit and _check_obs_hit(obs):
			obs.hit = true
			_apply_debuff(obs.obs_type)
		if obs.position.x + obs.obs_w < -20.0:
			obs.queue_free()
			_obstacles.erase(obs)

	# ── Canisters: move, collect, cull ────────────────────────────────────────
	for can: _Canister in _canisters.duplicate():
		can.tick(delta, scroll_spd)
		can.queue_redraw()
		if not can.collected and _check_can_pickup(can):
			_collect_canister(can)
		if can.position.x < -20.0:
			can.queue_free()
			_canisters.erase(can)

	# ── Spawn wave ────────────────────────────────────────────────────────────
	var spawn_ivrl: float = lerpf(_SPAWN_IVRL_S, _SPAWN_IVRL_E, t_ratio)
	_spawn_acc += delta
	if _spawn_acc >= spawn_ivrl:
		_spawn_acc = 0.0
		_spawn_wave()
		_maybe_spawn_canister()

	# ── Timer end ─────────────────────────────────────────────────────────────
	if _run_timer <= 0.0:
		_run_timer = 0.0
		_end_run(true)
		return

	# ── All dead check ────────────────────────────────────────────────────────
	# is_dead is a PROPERTY; .get() reads it correctly (call() returns null).
	var all_dead := true
	for ch in GameState.party:
		if ch is Node and not (ch as Node).get("is_dead"):
			all_dead = false
			break
	if GameState.party.is_empty():
		all_dead = false
	if all_dead:
		_end_run(false)
		return

	_refresh_hud()


func _unhandled_input(event: InputEvent) -> void:
	if _run_ended:
		return
	if GameState.current_state != GameState.RunState.PLAYING:
		return

	var pressed := false
	var press_y := 0.0

	if event is InputEventScreenTouch and (event as InputEventScreenTouch).pressed:
		pressed = true
		press_y = (event as InputEventScreenTouch).position.y
	elif event is InputEventMouseButton:
		var mb := event as InputEventMouseButton
		if mb.pressed and mb.button_index == MOUSE_BUTTON_LEFT:
			pressed = true
			press_y = mb.position.y

	if not pressed:
		return

	# WIRE: input locked
	if _debuff == OBS_WIRE:
		return

	var vp_mid: float = GameConfig.VIEWPORT_HEIGHT * 0.5
	var go_up: bool   = press_y < vp_mid

	# EMP: inverts up/down
	if _debuff == OBS_EMP:
		go_up = not go_up

	_try_switch_lane(-1 if go_up else 1)


# ══ Build helpers ══════════════════════════════════════════════════════════════

func _build_world() -> void:
	_world = Node2D.new()
	_world.name = "World"
	add_child(_world)

	# Background
	var bg := ColorRect.new()
	bg.color = Color(0.05, 0.05, 0.07)
	bg.size  = Vector2(GameConfig.VIEWPORT_WIDTH, GameConfig.VIEWPORT_HEIGHT)
	_world.add_child(bg)

	# Lane strips (alternating shades for readability)
	var stripe_colors: Array[Color] = [
		Color(0.09, 0.10, 0.13), Color(0.11, 0.12, 0.15),
		Color(0.09, 0.10, 0.13), Color(0.12, 0.13, 0.16),
		Color(0.09, 0.10, 0.13), Color(0.11, 0.12, 0.15),
		Color(0.09, 0.10, 0.13),
	]
	for i in _LANE_COUNT:
		var strip := ColorRect.new()
		strip.color    = stripe_colors[i]
		strip.position = Vector2(0.0, i * _LANE_H)
		strip.size     = Vector2(GameConfig.VIEWPORT_WIDTH, _LANE_H - 1.5)
		_world.add_child(strip)

	# Lane separators
	for i in _LANE_COUNT - 1:
		var sep := ColorRect.new()
		sep.color    = Color(0.18, 0.18, 0.22, 0.35)
		sep.position = Vector2(0.0, (i + 1) * _LANE_H - 1.5)
		sep.size     = Vector2(GameConfig.VIEWPORT_WIDTH, 3.0)
		_world.add_child(sep)

	# Camera (static — world fills viewport, only Y of party changes)
	_camera = Camera2D.new()
	_camera.name = "Camera"
	_camera.position = Vector2(
		GameConfig.VIEWPORT_WIDTH  * 0.5,
		GameConfig.VIEWPORT_HEIGHT * 0.5)
	add_child(_camera)


func _build_squad() -> void:
	_party = Party.new()
	_party.name = "Party"
	_party.position = Vector2(_PLAYER_X, _player_y)
	_world.add_child(_party)

	var guardian := Guardian.new()
	_party.add_character(guardian)

	if "Striker" in HubState.rescued_characters \
			and GameState.party.size() < GameConfig.MAX_PARTY_SIZE:
		_party.add_character(Striker.new())
	if "Artificer" in HubState.rescued_characters \
			and GameState.party.size() < GameConfig.MAX_PARTY_SIZE:
		_party.add_character(Artificer.new())
	if "Medic" in HubState.rescued_characters \
			and GameState.party.size() < GameConfig.MAX_PARTY_SIZE:
		_party.add_character(Medic.new())


func _build_hud() -> void:
	var layer := CanvasLayer.new()
	layer.layer = 10
	add_child(layer)

	# Timer
	_timer_lbl = Label.new()
	_timer_lbl.add_theme_font_size_override("font_size", 32)
	_timer_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_timer_lbl.position = Vector2(GameConfig.VIEWPORT_WIDTH * 0.5 - 60.0, 12.0)
	_timer_lbl.size     = Vector2(120.0, 44.0)
	layer.add_child(_timer_lbl)

	# Backpack slots
	_slots_lbl = Label.new()
	_slots_lbl.add_theme_font_size_override("font_size", 14)
	_slots_lbl.position = Vector2(GameConfig.VIEWPORT_WIDTH - 130.0, 14.0)
	_slots_lbl.size     = Vector2(120.0, 30.0)
	layer.add_child(_slots_lbl)

	# Active debuff label
	_debuff_lbl = Label.new()
	_debuff_lbl.add_theme_font_size_override("font_size", 12)
	_debuff_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_debuff_lbl.position = Vector2(GameConfig.VIEWPORT_WIDTH * 0.5 - 100.0, 58.0)
	_debuff_lbl.size     = Vector2(200.0, 24.0)
	_debuff_lbl.visible  = false
	layer.add_child(_debuff_lbl)

	# Smoke overlay (right 65% of screen — obscures incoming obstacles)
	_smoke_overlay = ColorRect.new()
	_smoke_overlay.color         = Color(0.05, 0.05, 0.06, 0.0)
	_smoke_overlay.position      = Vector2(GameConfig.VIEWPORT_WIDTH * 0.35, 0.0)
	_smoke_overlay.size          = Vector2(GameConfig.VIEWPORT_WIDTH * 0.65,
										   GameConfig.VIEWPORT_HEIGHT)
	_smoke_overlay.mouse_filter  = Control.MOUSE_FILTER_IGNORE
	_smoke_overlay.z_index       = 9
	layer.add_child(_smoke_overlay)

	# End-run overlay
	_overlay_panel = ColorRect.new()
	_overlay_panel.color = Color(0.0, 0.0, 0.0, 0.85)
	_overlay_panel.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	_overlay_panel.visible = false
	layer.add_child(_overlay_panel)

	_overlay_lbl = Label.new()
	_overlay_lbl.add_theme_font_size_override("font_size", 28)
	_overlay_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_overlay_lbl.vertical_alignment   = VERTICAL_ALIGNMENT_CENTER
	_overlay_lbl.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	_overlay_panel.add_child(_overlay_lbl)


# ══ Spawn helpers ══════════════════════════════════════════════════════════════

func _spawn_wave() -> void:
	var sx: float = GameConfig.VIEWPORT_WIDTH + _SPAWN_X
	var pattern: int = randi_range(0, 5)
	match pattern:
		0:  # Single lane
			_spawn_obs(randi_range(0, _LANE_COUNT - 1), sx)
		1:  # Two adjacent lanes
			var base: int = randi_range(0, _LANE_COUNT - 2)
			_spawn_obs(base,     sx)
			_spawn_obs(base + 1, sx + randf_range(15.0, 50.0))
		2:  # Three lanes, staggered
			var first: int = randi_range(0, _LANE_COUNT - 1)
			_spawn_obs(first, sx)
			_spawn_obs(wrapi(first + 2, 0, _LANE_COUNT), sx + 80.0)
			_spawn_obs(wrapi(first + 4, 0, _LANE_COUNT), sx + 160.0)
		3:  # Wall with gap (4 blocked, 3 free corridor)
			var gap_start: int = randi_range(0, _LANE_COUNT - 3)
			for i in _LANE_COUNT:
				if i < gap_start or i >= gap_start + 3:
					_spawn_obs(i, sx + randf_range(0.0, 25.0))
		4:  # Two separated pairs (forces two quick moves)
			var l1: int = randi_range(0, _LANE_COUNT - 2)
			var l2: int = randi_range(0, _LANE_COUNT - 2)
			_spawn_obs(l1,     sx)
			_spawn_obs(l1 + 1, sx)
			_spawn_obs(l2,     sx + 220.0)
			_spawn_obs(l2 + 1, sx + 220.0)
		5:  # Dense wall with single-lane escape
			var safe: int = randi_range(0, _LANE_COUNT - 1)
			for i in _LANE_COUNT:
				if i != safe:
					_spawn_obs(i, sx + randf_range(0.0, 20.0))


func _spawn_obs(lane_idx: int, x: float) -> void:
	var obs     := _Obstacle.new()
	var obs_type := randi_range(0, OBS_COUNT - 1)
	var obs_w   := randf_range(_OBS_W_MIN, _OBS_W_MAX)
	obs.setup(lane_idx, obs_w, obs_type, x)
	_world.add_child(obs)
	_obstacles.append(obs)


func _maybe_spawn_canister() -> void:
	if randf() > 0.65:
		return
	var lane_idx: int = randi_range(0, _LANE_COUNT - 1)
	var is_bonus: bool = randf() < 0.12
	var cx: float = GameConfig.VIEWPORT_WIDTH + _SPAWN_X + randf_range(60.0, 200.0)
	var cy: float = _lane_center(lane_idx)
	var can := _Canister.new()
	can.setup(Vector2(cx, cy), is_bonus)
	_world.add_child(can)
	_canisters.append(can)


# ══ Lane helpers ═══════════════════════════════════════════════════════════════

func _lane_center(l: int) -> float:
	return l * _LANE_H + _LANE_H * 0.5


func _try_switch_lane(dir: int) -> void:
	# Snap current transition before starting a new one
	if _lerp < 1.0:
		_lane    = _lane_t
		_lerp    = 1.0
		_player_y = _lane_center(_lane)

	var new_t: int = clamp(_lane + dir, 0, _LANE_COUNT - 1)
	if new_t == _lane:
		return
	_lane_t = new_t
	_lerp   = 0.0


# ══ Collision helpers ══════════════════════════════════════════════════════════

func _check_obs_hit(obs: _Obstacle) -> bool:
	# X overlap: player occupies [PLAYER_X-18, PLAYER_X+18]
	if obs.position.x > _PLAYER_X + 18.0:
		return false
	if obs.position.x + obs.obs_w < _PLAYER_X - 18.0:
		return false
	# Lane match — use settled _lane so mid-transition dodges work
	return obs.lane == _lane


func _check_can_pickup(can: _Canister) -> bool:
	return Vector2(_PLAYER_X, _player_y).distance_to(can.position) <= _PICK_RADIUS


# ══ Debuff system ══════════════════════════════════════════════════════════════

func _apply_debuff(obs_type: int) -> void:
	# Don't stack — ignore if same type already active
	if _debuff == obs_type:
		return
	_debuff = obs_type
	match obs_type:
		OBS_SMOKE:
			_debuff_timer = _DUR_SMOKE
			_smoke_overlay.modulate.a = 1.0
			_smoke_overlay.color      = Color(0.05, 0.05, 0.06, 0.88)
		OBS_SLOW:
			_debuff_timer = _DUR_SLOW
		OBS_SPARK:
			_debuff_timer = 60.0   # stays until player leaves the lane
			_spark_lane   = _lane
			_spark_acc    = 0.0
		OBS_EMP:
			_debuff_timer = _DUR_EMP
		OBS_WIRE:
			_debuff_timer = _DUR_WIRE
	_update_debuff_hud()


func _clear_debuff() -> void:
	if _debuff == OBS_SMOKE:
		_smoke_overlay.color    = Color(0.05, 0.05, 0.06, 0.0)
		_smoke_overlay.modulate = Color.WHITE
	_debuff       = -1
	_debuff_timer = 0.0
	_spark_lane   = -1
	_debuff_lbl.visible = false


func _deal_spark_damage() -> void:
	for ch in GameState.party:
		if ch is Node and not (ch as Node).get("is_dead"):
			if (ch as Node).has_method("take_damage"):
				(ch as Node).call("take_damage", _SPARK_DMG)
			break


func _update_debuff_hud() -> void:
	var names: Dictionary = {
		OBS_SMOKE: "FUMAÇA — visão obstruída",
		OBS_SLOW:  "LENTO — troca de lane lenta",
		OBS_SPARK: "FAÍSCA — dano por segundo",
		OBS_EMP:   "EMP — controles invertidos",
		OBS_WIRE:  "TEIA — lane travada",
	}
	if _debuff in names:
		_debuff_lbl.text    = names[_debuff]
		_debuff_lbl.visible = true


# ══ Canister collection ════════════════════════════════════════════════════════

func _collect_canister(can: _Canister) -> void:
	can.collected = true
	can.visible   = false
	if can.is_bonus:
		_run_timer += GameConfig.EXTRACTION_BONUS_TIME
	else:
		var cap: int = HubState.get_backpack_capacity()
		if _backpack.size() < cap:
			_backpack.append("combustivel_volatil")


# ══ Run end ════════════════════════════════════════════════════════════════════

func _end_run(victory: bool) -> void:
	if _run_ended:
		return
	_run_ended = true

	if victory:
		HubState.deposit_backpack(_backpack)
		HubState.on_run_ended(true)
		GameState.end_run(true)
		_overlay_lbl.text = "EXTRAÇÃO COMPLETA!\n%d combustível coletado\n\nVoltando à base..." \
			% _backpack.size()
	else:
		HubState.deposit_backpack([])
		HubState.on_run_ended(false)
		GameState.end_run(false)
		_overlay_lbl.text = "FALHOU\nSquad eliminado\n\nVoltando à base..."

	_overlay_panel.visible = true
	await get_tree().create_timer(2.5).timeout
	get_tree().change_scene_to_file("res://src/scenes/WorldMapScene.tscn")


func _on_run_ended(_victory: bool) -> void:
	pass   # handled directly in _end_run


# ══ HUD refresh ════════════════════════════════════════════════════════════════

func _refresh_hud() -> void:
	var t: float   = _run_timer
	var secs: int  = int(t)
	var frac: int  = int((t - float(secs)) * 10.0)
	_timer_lbl.text = "%d.%d" % [secs, frac]

	if t <= 10.0:
		_timer_lbl.modulate = Color(1.0, 0.2, 0.2)
	elif t <= 20.0:
		_timer_lbl.modulate = Color(1.0, 0.7, 0.1)
	else:
		_timer_lbl.modulate = Color(0.9, 0.95, 1.0)

	var cap: int = HubState.get_backpack_capacity()
	_slots_lbl.text = "Comb: %d/%d" % [_backpack.size(), cap]

	# Debuff countdown suffix
	if _debuff >= 0 and _debuff_timer < 55.0:
		_debuff_lbl.text = _debuff_lbl.text.split(" —")[0] \
			+ " — %.1fs" % maxf(_debuff_timer, 0.0)
