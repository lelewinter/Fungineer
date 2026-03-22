## ExtractionMain — Corrida de Extração zone (Zone 3).
## Squad speedrun: 60 s timer, instant canister pickup, 3 route diamond layout.
## Resources: Combustível Volátil (backpack items).
## Bonus "+T" canisters add EXTRACTION_BONUS_TIME — never occupy backpack slots.
## Run ends: timer=0 (success, keep resources) | all dead (fail) | voluntary EXIT.
extends Node2D

# ── Map geometry ──────────────────────────────────────────────────────────────
const _ROUTE_Y: Array[float] = [240.0, 600.0, 960.0]   # Safe / Medium / Dangerous
const _ROUTE_H: Array[float] = [80.0,  80.0,  60.0]
const _ROUTE_X_START: float = 60.0
const _ROUTE_X_END: float   = GameConfig.ARENA_WIDTH - 60.0
const _JUNCTION_X: Array   = [450.0, 1100.0]
const _JUNCTION_W: float    = 80.0   # vertical corridor width
const _ENTRY_X: float       = 100.0
const _EXIT_X: float        = GameConfig.ARENA_WIDTH - 100.0
const _EXIT_RADIUS: float   = 45.0

# ── Canister geometry ─────────────────────────────────────────────────────────
const _PICK_RADIUS: float   = 22.0   # pickup distance

# ── Nodes ─────────────────────────────────────────────────────────────────────
var _world: Node2D
var _party: Party
var _camera: Camera2D
var _drag_controller: DragController
var _drones: Array = []       # Array[ExtractionDrone]
var _canisters: Array = []    # Array[_Canister]

# ── Run state ─────────────────────────────────────────────────────────────────
var _run_timer: float = GameConfig.EXTRACTION_RUN_TIMER
var _backpack: Array[String] = []
var _run_ended: bool = false
var _pulse: float = 0.0

# ── Auto-scroll (danger wall) ──────────────────────────────────────────────────
const _SCROLL_SPEED_START: float = 70.0   # px/s at run start
const _SCROLL_SPEED_END: float   = 160.0  # px/s at timer zero
var _scroll_x: float = -200.0             # starts off-screen left
var _danger_wall: ColorRect               # visual danger wall node

# ── HUD refs ──────────────────────────────────────────────────────────────────
var _timer_lbl: Label
var _slots_lbl: Label
var _overlay_lbl: Label
var _overlay_panel: ColorRect


# ── Inner class: canister ─────────────────────────────────────────────────────

class _Canister extends Node2D:
	var is_bonus: bool = false      # +T canister
	var is_moving: bool = false
	var _vel: Vector2 = Vector2.ZERO
	var _bounds_x: Array = [0.0, 0.0]   # [min_x, max_x] bounce bounds
	var collected: bool = false

	func setup_static(pos: Vector2, bonus: bool) -> void:
		global_position = pos
		is_bonus = bonus

	func setup_moving(pos: Vector2, vel: Vector2, min_x: float, max_x: float) -> void:
		global_position = pos
		is_moving = true
		_vel = vel
		_bounds_x = [min_x, max_x]

	func tick(delta: float) -> void:
		if not is_moving or collected:
			return
		global_position.x += _vel.x * delta
		if global_position.x <= _bounds_x[0] or global_position.x >= _bounds_x[1]:
			_vel.x = -_vel.x
			global_position.x = clampf(global_position.x, _bounds_x[0], _bounds_x[1])

	func _draw() -> void:
		if collected:
			return
		if is_bonus:
			draw_circle(Vector2.ZERO, 11.0, Color(0.2, 0.85, 0.95, 0.9))
			draw_string(ThemeDB.fallback_font, Vector2(-5, 5), "+T",
				HORIZONTAL_ALIGNMENT_LEFT, -1, 10, Color.WHITE)
		else:
			draw_circle(Vector2.ZERO, 11.0, Color(0.95, 0.65, 0.1, 0.9))
			draw_circle(Vector2.ZERO, 5.0, Color(1.0, 0.85, 0.3, 0.8))


# ── Lifecycle ──────────────────────────────────────────────────────────────────

func _ready() -> void:
	_build_world()
	_build_squad()
	_build_canisters()
	_build_drones()
	_build_exit()
	_build_danger_wall()
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

	# Advance danger wall
	var t_ratio := clampf(1.0 - _run_timer / GameConfig.EXTRACTION_RUN_TIMER, 0.0, 1.0)
	var scroll_speed := lerpf(_SCROLL_SPEED_START, _SCROLL_SPEED_END, t_ratio)
	_scroll_x += scroll_speed * delta
	_danger_wall.position.x = _scroll_x - _danger_wall.size.x

	# Camera: follow party but never scroll left of the danger wall
	var vp_half := GameConfig.VIEWPORT_WIDTH * 0.5
	var cam_x := maxf(_party.global_position.x, _scroll_x + vp_half)
	_camera.global_position = Vector2(cam_x, _party.global_position.y)

	# Kill: party caught by wall
	if _party.global_position.x < _scroll_x - 10.0:
		_end_run(false)
		return

	# Canister ticks + pickup
	for can: _Canister in _canisters:
		can.tick(delta)
		can.queue_redraw()
		if can.collected:
			continue
		if _check_squad_pickup(can):
			_collect_canister(can)

	# Timer end
	if _run_timer <= 0.0:
		_run_timer = 0.0
		_end_run(true)
		return

	# Check voluntary EXIT
	if _party.global_position.x >= _EXIT_X - _EXIT_RADIUS:
		_end_run(true)
		return

	# Check all dead
	var all_dead := true
	for ch in GameState.party:
		if ch is Node and not (ch as Node).get("is_dead"):
			all_dead = false
			break
		if ch is Node and not (ch as Node).call("is_dead"):
			all_dead = false
			break
	if GameState.party.size() == 0:
		all_dead = false  # no characters = guardian default, can't be dead
	if all_dead:
		_end_run(false)
		return

	_refresh_hud()


# ── Build helpers ──────────────────────────────────────────────────────────────

func _build_world() -> void:
	_world = Node2D.new()
	_world.name = "World"
	add_child(_world)

	# Dark background
	var bg := ColorRect.new()
	bg.color = Color(0.05, 0.05, 0.07)
	bg.size = Vector2(GameConfig.ARENA_WIDTH, GameConfig.ARENA_HEIGHT)
	_world.add_child(bg)

	# Routes (colored floor strips)
	var route_colors: Array = [
		Color(0.12, 0.14, 0.18),  # Safe (dim blue-gray)
		Color(0.12, 0.15, 0.13),  # Medium (dim green-gray)
		Color(0.18, 0.11, 0.11),  # Dangerous (dim red-gray)
	]
	for i in 3:
		var route := ColorRect.new()
		route.color = route_colors[i]
		route.position = Vector2(_ROUTE_X_START, _ROUTE_Y[i])
		route.size = Vector2(_ROUTE_X_END - _ROUTE_X_START, _ROUTE_H[i])
		_world.add_child(route)

	# Junction corridors (vertical connectors)
	for jx: float in _JUNCTION_X:
		var junc := ColorRect.new()
		junc.color = Color(0.1, 0.12, 0.14)
		junc.position = Vector2(jx, _ROUTE_Y[0] + _ROUTE_H[0])
		junc.size = Vector2(_JUNCTION_W, _ROUTE_Y[2] - _ROUTE_Y[0])
		_world.add_child(junc)

	# Route labels
	var route_names := ["ROTA SEGURA", "ROTA MEDIA", "ROTA PERIGOSA"]
	for i in 3:
		var lbl := Label.new()
		lbl.text = route_names[i]
		lbl.add_theme_font_size_override("font_size", 11)
		lbl.modulate = Color(0.5, 0.5, 0.55, 0.6)
		lbl.position = Vector2(_ROUTE_X_START + 8.0, _ROUTE_Y[i] + 4.0)
		_world.add_child(lbl)

	# Camera
	_camera = Camera2D.new()
	_camera.name = "Camera"
	_camera.limit_left = 0
	_camera.limit_top = 0
	_camera.limit_right = int(GameConfig.ARENA_WIDTH)
	_camera.limit_bottom = int(GameConfig.ARENA_HEIGHT)
	_camera.position_smoothing_enabled = true
	_camera.position_smoothing_speed = 10.0
	add_child(_camera)


func _build_squad() -> void:
	_party = Party.new()
	_party.name = "Party"
	# Start at entry point on medium route
	_party.position = Vector2(_ENTRY_X, _ROUTE_Y[1] + _ROUTE_H[1] * 0.5)
	_world.add_child(_party)

	# Always Guardian as leader
	var guardian := Guardian.new()
	_party.add_character(guardian)

	# Add rescued characters if available (up to MAX_PARTY_SIZE)
	if "Striker" in HubState.rescued_characters and GameState.party.size() < GameConfig.MAX_PARTY_SIZE:
		_party.add_character(Striker.new())
	if "Artificer" in HubState.rescued_characters and GameState.party.size() < GameConfig.MAX_PARTY_SIZE:
		_party.add_character(Artificer.new())
	if "Medic" in HubState.rescued_characters and GameState.party.size() < GameConfig.MAX_PARTY_SIZE:
		_party.add_character(Medic.new())

	_drag_controller = DragController.new()
	_drag_controller.name = "DragController"
	_drag_controller.party_node = _party
	add_child(_drag_controller)


func _build_canisters() -> void:
	var canisters_node := Node2D.new()
	canisters_node.name = "Canisters"
	_world.add_child(canisters_node)

	# Safe route: 4 static canisters
	var safe_y: float = (_ROUTE_Y[0] as float) + (_ROUTE_H[0] as float) * 0.5
	for x: float in [280.0, 480.0, 700.0, 900.0]:
		_spawn_canister(canisters_node, Vector2(x, safe_y), false, false)

	# Medium route: 3 static + 3 moving, 2 bonus
	var mid_y: float = (_ROUTE_Y[1] as float) + (_ROUTE_H[1] as float) * 0.5
	_spawn_canister(canisters_node, Vector2(300.0, mid_y), false, false)
	_spawn_canister(canisters_node, Vector2(600.0, mid_y), false, true)   # bonus +T
	_spawn_canister(canisters_node, Vector2(900.0, mid_y), false, false)
	_spawn_moving_canister(canisters_node, Vector2(400.0, mid_y), 380.0, 540.0)
	_spawn_moving_canister(canisters_node, Vector2(750.0, mid_y), 700.0, 870.0)
	_spawn_moving_canister(canisters_node, Vector2(1050.0, mid_y), 980.0, 1150.0)

	# Dangerous route: 5 static + 3 moving, 1 bonus
	var danger_y: float = (_ROUTE_Y[2] as float) + (_ROUTE_H[2] as float) * 0.5
	_spawn_canister(canisters_node, Vector2(300.0, danger_y), false, false)
	_spawn_canister(canisters_node, Vector2(420.0, danger_y), false, false)
	_spawn_canister(canisters_node, Vector2(660.0, danger_y), false, true)   # bonus +T
	_spawn_canister(canisters_node, Vector2(900.0, danger_y), false, false)
	_spawn_canister(canisters_node, Vector2(1140.0, danger_y), false, false)
	_spawn_moving_canister(canisters_node, Vector2(540.0, danger_y), 500.0, 620.0)
	_spawn_moving_canister(canisters_node, Vector2(780.0, danger_y), 730.0, 860.0)
	_spawn_moving_canister(canisters_node, Vector2(1020.0, danger_y), 960.0, 1100.0)


func _spawn_canister(parent: Node, pos: Vector2, _moving: bool, bonus: bool) -> void:
	var can := _Canister.new()
	can.setup_static(pos, bonus)
	parent.add_child(can)
	_canisters.append(can)


func _spawn_moving_canister(parent: Node, pos: Vector2, min_x: float, max_x: float) -> void:
	var can := _Canister.new()
	can.setup_moving(pos, Vector2(GameConfig.EXTRACTION_CANISTER_SPEED, 0.0), min_x, max_x)
	parent.add_child(can)
	_canisters.append(can)


func _build_drones() -> void:
	var drones_node := Node2D.new()
	drones_node.name = "Drones"
	_world.add_child(drones_node)

	var leader := _get_leader()
	var mid_y: float = (_ROUTE_Y[1] as float) + (_ROUTE_H[1] as float) * 0.5
	var danger_y: float = (_ROUTE_Y[2] as float) + (_ROUTE_H[2] as float) * 0.5

	# Medium route: 1 drone
	_spawn_drone(drones_node, Vector2(650.0, mid_y), Vector2(550.0, mid_y), leader)

	# Dangerous route: 2 drones
	_spawn_drone(drones_node, Vector2(500.0, danger_y), Vector2(420.0, danger_y), leader)
	_spawn_drone(drones_node, Vector2(900.0, danger_y), Vector2(820.0, danger_y), leader)


func _spawn_drone(parent: Node, a: Vector2, b: Vector2, leader: Node2D) -> void:
	var drone := ExtractionDrone.new()
	drone.setup(a, b, leader)
	drone.died.connect(func(): _drones.erase(drone))
	parent.add_child(drone)
	_drones.append(drone)


func _build_exit() -> void:
	var exit_node := Node2D.new()
	exit_node.name = "Exit"
	# Exit spans all routes vertically, centered mid-route
	exit_node.position = Vector2(_EXIT_X, _ROUTE_Y[1] + _ROUTE_H[1] * 0.5)
	_world.add_child(exit_node)

	var drawer := _ExitDrawer.new()
	drawer.route_y = _ROUTE_Y
	drawer.route_h = _ROUTE_H
	drawer.exit_x = _EXIT_X
	drawer.radius = _EXIT_RADIUS
	_world.add_child(drawer)


func _build_danger_wall() -> void:
	# A tall red gradient wall that scrolls from left to right
	_danger_wall = ColorRect.new()
	_danger_wall.color = Color(0.85, 0.08, 0.08, 0.55)
	_danger_wall.size = Vector2(80.0, GameConfig.ARENA_HEIGHT)
	_danger_wall.position = Vector2(_scroll_x - 80.0, 0.0)
	_danger_wall.z_index = 5
	_world.add_child(_danger_wall)

	# Thin bright edge on the right side of the wall
	var edge := ColorRect.new()
	edge.color = Color(1.0, 0.15, 0.15, 0.90)
	edge.size = Vector2(4.0, GameConfig.ARENA_HEIGHT)
	edge.position = Vector2(76.0, 0.0)   # right edge of the wall rect
	_danger_wall.add_child(edge)


func _build_hud() -> void:
	var layer := CanvasLayer.new()
	layer.layer = 10
	add_child(layer)

	_timer_lbl = Label.new()
	_timer_lbl.add_theme_font_size_override("font_size", 32)
	_timer_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_timer_lbl.position = Vector2(GameConfig.VIEWPORT_WIDTH * 0.5 - 60, 12)
	_timer_lbl.size = Vector2(120, 44)
	layer.add_child(_timer_lbl)

	_slots_lbl = Label.new()
	_slots_lbl.add_theme_font_size_override("font_size", 14)
	_slots_lbl.position = Vector2(GameConfig.VIEWPORT_WIDTH - 130, 14)
	_slots_lbl.size = Vector2(120, 30)
	layer.add_child(_slots_lbl)

	# End-run overlay
	_overlay_panel = ColorRect.new()
	_overlay_panel.color = Color(0.0, 0.0, 0.0, 0.85)
	_overlay_panel.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	_overlay_panel.visible = false
	layer.add_child(_overlay_panel)

	_overlay_lbl = Label.new()
	_overlay_lbl.add_theme_font_size_override("font_size", 28)
	_overlay_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_overlay_lbl.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	_overlay_lbl.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	_overlay_panel.add_child(_overlay_lbl)


# ── Gameplay helpers ───────────────────────────────────────────────────────────

func _get_leader() -> Node2D:
	if _party.get_child_count() > 0:
		return _party.get_child(0) as Node2D
	return _party


func _check_squad_pickup(can: _Canister) -> bool:
	for member in GameState.party:
		if member is Node2D:
			if (member as Node2D).global_position.distance_to(can.global_position) <= _PICK_RADIUS:
				return true
	# Also check party node itself (leader position)
	if _party.global_position.distance_to(can.global_position) <= _PICK_RADIUS:
		return true
	return false


func _collect_canister(can: _Canister) -> void:
	can.collected = true
	can.visible = false
	if can.is_bonus:
		_run_timer += GameConfig.EXTRACTION_BONUS_TIME
	else:
		var cap := HubState.get_backpack_capacity()
		if _backpack.size() < cap:
			_backpack.append("combustivel_volatil")


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
	pass  # handled in _end_run directly


func _refresh_hud() -> void:
	# Timer color: red below 10s
	var t := _run_timer
	var secs := int(t)
	var frac := int((t - float(secs)) * 10.0)
	_timer_lbl.text = "%d.%d" % [secs, frac]
	if t <= 10.0:
		_timer_lbl.modulate = Color(1.0, 0.2, 0.2)
	elif t <= 20.0:
		_timer_lbl.modulate = Color(1.0, 0.7, 0.1)
	else:
		_timer_lbl.modulate = Color(0.9, 0.95, 1.0)

	var cap := HubState.get_backpack_capacity()
	_slots_lbl.text = "Comb: %d/%d" % [_backpack.size(), cap]

	# Danger wall proximity warning
	var dist := _party.global_position.x - _scroll_x
	if dist < 200.0:
		var warn_alpha := clampf(1.0 - dist / 200.0, 0.0, 1.0)
		_timer_lbl.modulate = Color(1.0, 0.1 + 0.1 * sin(_pulse * 10.0), 0.1, warn_alpha).lerp(
			_timer_lbl.modulate, 1.0 - warn_alpha)


# ── Exit drawer ────────────────────────────────────────────────────────────────

class _ExitDrawer extends Node2D:
	var route_y: Array = []
	var route_h: Array = []
	var exit_x: float = 0.0
	var radius: float = 45.0

	func _draw() -> void:
		# Vertical bar spanning all routes
		var top_y: float = route_y[0] + route_h[0] * 0.3
		var bot_y: float = route_y[2] + route_h[2] * 0.7
		draw_line(Vector2(exit_x, top_y), Vector2(exit_x, bot_y),
			Color(0.2, 0.9, 0.3, 0.7), 4.0)
		draw_circle(Vector2(exit_x, route_y[1] + route_h[1] * 0.5), radius,
			Color(0.2, 0.9, 0.3, 0.18))
		draw_string(ThemeDB.fallback_font,
			Vector2(exit_x - 18, route_y[1] + route_h[1] * 0.5 + 6),
			"EXIT", HORIZONTAL_ALIGNMENT_LEFT, -1, 14, Color(0.3, 1.0, 0.4, 0.9))
