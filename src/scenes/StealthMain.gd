## StealthMain — Root scene for the Stealth Zone run.
## Solo infiltration: one agent, no squad, no combat.
##
## Detection:
##   - PatrolDrone enters CHASE  → triggers alarm
##   - SecurityCamera bar fills  → triggers alarm (not instant death)
##   - PatrolDrone physically contacts agent → game over
##
## Alarm:
##   - Red flashing overlay + "ALARME" label
##   - Stage 1 (first 15s): 2 response drones block alleys, all drones 1.5× faster
##   - Stage 2 (after 15s): 2 more drones, all drones 2× faster, more barriers
##   - EXIT becomes accessible even during chase when alarm is active
##
## Escalation (time-based, independent):
##   - Every 20s: 1 new patrol drone spawns (cap 8 total)
extends Node2D

const ESCALATION_INTERVAL: float = 20.0
const DRONE_CAP: int = 8
const ALARM_STAGE2_DELAY: float = 8.0    # was 15 — less time to escape
const EXPOSURE_KILL_TIME: float  = 3.0   # seconds of continuous detection before death

var _world: Node2D
var _agent: StealthAgent
var _camera: Camera2D
var _shadow_rects: Array = []  # Array[Rect2]
var _drones: Array = []        # Array[PatrolDrone]
var _sec_cameras: Array = []   # Array[SecurityCamera]
var _hud: StealthHUD
var _game_over_screen: GameOverScreen
var _victory_screen: VictoryScreen

# EXIT state
var _exit_pos: Vector2
var _exit_triggered: bool = false
var _exit_marker: _ExitMarker

# Chase tracking
var _any_chasing: bool = false
var _exposure_timer: float = 0.0   # seconds agent has been continuously detected

# Escalation
var _escalation_timer: float = 0.0

# Alarm
var _alarm_active: bool = false
var _alarm_stage: int = 0
var _alarm_phase_timer: float = 0.0
var _alarm_pulse: float = 0.0
var _alarm_layer: CanvasLayer
var _alarm_overlay: ColorRect
var _alarm_title_lbl: Label
var _alarm_countdown_lbl: Label


func _ready() -> void:
	_define_shadow_rects()
	_build_world()
	_build_agent()
	_build_enemies()
	_build_resources()
	_build_exit()
	_build_ui()
	_build_alarm_ui()
	_connect_signals()
	GameState.start_run()


# ── Map layout ─────────────────────────────────────────────────────────────────

func _define_shadow_rects() -> void:
	_shadow_rects = [
		Rect2(0,    0,    220,  1200),  # Left alley
		Rect2(1380, 0,    220,  1200),  # Right alley
		Rect2(280,  860,  1040, 340),   # Entry cover (south safe zone)
		Rect2(220,  380,  280,  240),   # Mid-left pocket
		Rect2(1100, 380,  280,  240),   # Mid-right pocket
		Rect2(220,  80,   260,  280),   # Top-left alcove
		Rect2(1120, 80,   260,  280),   # Top-right alcove
	]


func _build_world() -> void:
	_world = Node2D.new()
	_world.name = "World"
	add_child(_world)

	var floor_rect := ColorRect.new()
	floor_rect.color = Color(0.06, 0.07, 0.10)
	floor_rect.size = Vector2(GameConfig.ARENA_WIDTH, GameConfig.ARENA_HEIGHT)
	_world.add_child(floor_rect)

	for r in _shadow_rects:
		var shadow := ColorRect.new()
		shadow.color = Color(0.03, 0.035, 0.055)
		shadow.position = (r as Rect2).position
		shadow.size = (r as Rect2).size
		_world.add_child(shadow)

	_world.add_child(_GridDrawer.new())

	var border_color := Color(0.2, 0.25, 0.4)
	var thickness := 3.0
	for b in [
		[Vector2(0, 0), Vector2(GameConfig.ARENA_WIDTH, thickness)],
		[Vector2(0, GameConfig.ARENA_HEIGHT - thickness), Vector2(GameConfig.ARENA_WIDTH, thickness)],
		[Vector2(0, 0), Vector2(thickness, GameConfig.ARENA_HEIGHT)],
		[Vector2(GameConfig.ARENA_WIDTH - thickness, 0), Vector2(thickness, GameConfig.ARENA_HEIGHT)],
	]:
		var border := ColorRect.new()
		border.color = border_color
		border.position = b[0]
		border.size = b[1]
		_world.add_child(border)


func _build_agent() -> void:
	_agent = StealthAgent.new()
	_agent.name = "StealthAgent"
	_agent.position = Vector2(GameConfig.ARENA_WIDTH * 0.5, GameConfig.ARENA_HEIGHT - 140.0)
	_agent.setup(_shadow_rects)
	_world.add_child(_agent)

	_camera = Camera2D.new()
	_camera.name = "Camera"
	_camera.limit_left = 0
	_camera.limit_top = 0
	_camera.limit_right = int(GameConfig.ARENA_WIDTH)
	_camera.limit_bottom = int(GameConfig.ARENA_HEIGHT)
	_camera.position_smoothing_enabled = true
	_camera.position_smoothing_speed = 8.0
	_agent.add_child(_camera)


func _build_enemies() -> void:
	var drone_defs: Array = [
		[Vector2(450, 720), Vector2(1150, 720)],
		[Vector2(450, 285), Vector2(720, 285)],
		[Vector2(880, 285), Vector2(1150, 285)],
	]
	for d in drone_defs:
		_spawn_drone_at(d[0], d[1])

	var cam_defs: Array = [
		[Vector2(650, 590),  0.0,   1.0],
		[Vector2(950, 590),  180.0, -1.0],
		[Vector2(800, 340),  90.0,  1.0],
	]
	for c in cam_defs:
		var sec_cam := SecurityCamera.new()
		sec_cam.position = c[0]
		sec_cam.setup(_agent, _shadow_rects, c[1], c[2])
		sec_cam.detected.connect(_on_alarm_triggered)
		_world.add_child(sec_cam)
		_sec_cameras.append(sec_cam)


func _build_resources() -> void:
	var positions: Array[Vector2] = [
		Vector2(580, 650), Vector2(1020, 650),
		Vector2(680, 435), Vector2(920, 435),
		Vector2(800, 530), Vector2(800, 220),
	]
	for pos in positions:
		var item := ResourceItem.new()
		item.position = pos
		item.setup(_agent, "ai_components")
		_world.add_child(item)


func _build_exit() -> void:
	_exit_pos = Vector2(GameConfig.ARENA_WIDTH * 0.5, 100.0)
	_exit_marker = _ExitMarker.new()
	_exit_marker.position = _exit_pos
	_world.add_child(_exit_marker)


func _build_ui() -> void:
	_hud = StealthHUD.new()
	_hud.name = "StealthHUD"
	add_child(_hud)

	_game_over_screen = GameOverScreen.new()
	_game_over_screen.name = "GameOverScreen"
	add_child(_game_over_screen)

	_victory_screen = VictoryScreen.new()
	_victory_screen.name = "VictoryScreen"
	add_child(_victory_screen)


func _build_alarm_ui() -> void:
	_alarm_layer = CanvasLayer.new()
	_alarm_layer.layer = 5
	_alarm_layer.visible = false
	add_child(_alarm_layer)

	_alarm_overlay = ColorRect.new()
	_alarm_overlay.size = Vector2(GameConfig.VIEWPORT_WIDTH, GameConfig.VIEWPORT_HEIGHT)
	_alarm_overlay.color = Color(1.0, 0.0, 0.0, 0.08)
	_alarm_overlay.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_alarm_layer.add_child(_alarm_overlay)

	_alarm_title_lbl = Label.new()
	_alarm_title_lbl.text = "!! ALARME !!"
	_alarm_title_lbl.position = Vector2(GameConfig.VIEWPORT_WIDTH * 0.5 - 90, 48)
	_alarm_title_lbl.size = Vector2(180, 36)
	_alarm_title_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_alarm_title_lbl.add_theme_font_size_override("font_size", 24)
	_alarm_title_lbl.modulate = Color(1.0, 0.12, 0.12)
	_alarm_layer.add_child(_alarm_title_lbl)

	_alarm_countdown_lbl = Label.new()
	_alarm_countdown_lbl.text = ""
	_alarm_countdown_lbl.position = Vector2(GameConfig.VIEWPORT_WIDTH * 0.5 - 90, 82)
	_alarm_countdown_lbl.size = Vector2(180, 28)
	_alarm_countdown_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_alarm_countdown_lbl.add_theme_font_size_override("font_size", 15)
	_alarm_countdown_lbl.modulate = Color(1.0, 0.65, 0.15)
	_alarm_layer.add_child(_alarm_countdown_lbl)


func _connect_signals() -> void:
	GameState.run_ended.connect(_on_run_ended)
	_game_over_screen.hub_requested.connect(_go_to_hub)
	_game_over_screen.quit_requested.connect(func(): get_tree().quit())
	_victory_screen.hub_requested.connect(_go_to_hub)
	_victory_screen.quit_requested.connect(func(): get_tree().quit())


# ── Per-frame logic ─────────────────────────────────────────────────────────────

func _process(delta: float) -> void:
	if GameState.current_state != GameState.RunState.PLAYING:
		return

	_update_chase_state(delta)
	_update_alarm(delta)
	_update_escalation(delta)
	_check_exit()


func _update_chase_state(delta: float) -> void:
	_any_chasing = false
	for drone in _drones:
		if (drone as PatrolDrone).is_chasing():
			_any_chasing = true
			break
	_hud.show_chase(_any_chasing and not _alarm_active)

	# Exposure punishment: staying in vision kills the agent
	if _any_chasing:
		_exposure_timer += delta
		if _exposure_timer >= EXPOSURE_KILL_TIME:
			_on_agent_caught()   # abatido pela equipe de resposta
			return
	else:
		_exposure_timer = maxf(0.0, _exposure_timer - delta * 2.0)  # recovers when hidden


func _update_alarm(delta: float) -> void:
	if not _alarm_active:
		return

	_alarm_phase_timer += delta
	_alarm_pulse += delta

	# Flashing overlay
	var flash_speed := 5.0 if _alarm_stage == 1 else 9.0
	_alarm_overlay.color = Color(1.0, 0.0, 0.0, 0.06 + 0.05 * sin(_alarm_pulse * flash_speed))

	# Show exposure warning if being chased (takes priority over stage countdown)
	if _any_chasing and _exposure_timer > 0.0:
		var exposed_remaining: float = EXPOSURE_KILL_TIME - _exposure_timer
		_alarm_countdown_lbl.text = "DETECTADO! ESCONDA-SE! %.1fs" % exposed_remaining
		_alarm_countdown_lbl.modulate = Color(1.0, 0.2, 0.2)
	elif _alarm_stage == 1:
		var remaining: float = max(0.0, ALARM_STAGE2_DELAY - _alarm_phase_timer)
		_alarm_countdown_lbl.text = "CORRA PARA O EXIT!  %.0fs" % remaining
		_alarm_countdown_lbl.modulate = Color(1.0, 0.65, 0.15)
		if remaining <= 0.0:
			_escalate_to_stage2()

	# Pulse the alarm label
	var label_alpha := 0.7 + 0.3 * sin(_alarm_pulse * flash_speed)
	_alarm_title_lbl.modulate = Color(1.0, 0.12, 0.12, label_alpha)

	# Update exit marker
	_exit_marker.alarmed = true


func _update_escalation(delta: float) -> void:
	if _drones.size() >= DRONE_CAP:
		return
	_escalation_timer += delta
	if _escalation_timer >= ESCALATION_INTERVAL:
		_escalation_timer = 0.0
		_spawn_escalation_drone()


func _check_exit() -> void:
	if _exit_triggered:
		return
	# EXIT opens when not chasing OR when alarm is active (player must escape)
	var exit_accessible := not _any_chasing or _alarm_active
	if exit_accessible:
		if _agent.global_position.distance_to(_exit_pos) <= GameConfig.EXTRACTION_RADIUS:
			_exit_triggered = true
			GameState.end_run(true)
	_exit_marker.blocked = not exit_accessible
	if not _alarm_active:
		_exit_marker.alarmed = false


# ── Alarm system ───────────────────────────────────────────────────────────────

func _on_alarm_triggered() -> void:
	if _alarm_active:
		return
	_alarm_active = true
	_alarm_stage = 1
	_alarm_phase_timer = 0.0
	_alarm_layer.visible = true

	# Stage 1: response drones block alleys + speed up existing drones
	_spawn_drone_at(Vector2(110, 420), Vector2(110, 760), 1.8)
	_spawn_drone_at(Vector2(1490, 420), Vector2(1490, 760), 1.8)
	_set_drone_speed_mult(1.5)

	# Visual barriers on alley entrances
	_spawn_barrier(Rect2(0, 380, 220, 30))
	_spawn_barrier(Rect2(1380, 380, 220, 30))


func _escalate_to_stage2() -> void:
	_alarm_stage = 2
	_alarm_countdown_lbl.text = "ALARME MAXIMO!"

	# Stage 2: seal upper alleys + max speed
	_spawn_drone_at(Vector2(110, 80), Vector2(110, 420), 2.0)
	_spawn_drone_at(Vector2(1490, 80), Vector2(1490, 420), 2.0)
	_set_drone_speed_mult(2.0)

	# More barriers
	_spawn_barrier(Rect2(0, 80, 220, 300))
	_spawn_barrier(Rect2(1380, 80, 220, 300))
	_spawn_barrier(Rect2(280, 860, 1040, 30))


func _spawn_drone_at(a: Vector2, b: Vector2, spd_mult: float = 1.0) -> void:
	if _drones.size() >= DRONE_CAP:
		return
	var drone := PatrolDrone.new()
	drone.setup(a, b, _agent, _shadow_rects)
	drone.speed_multiplier = spd_mult
	drone.agent_caught.connect(_on_agent_caught)
	drone.entered_chase.connect(_on_alarm_triggered)
	_world.add_child(drone)
	_drones.append(drone)


func _spawn_escalation_drone() -> void:
	var routes: Array = [
		[Vector2(450, 450), Vector2(1150, 450)],
		[Vector2(500, 560), Vector2(1100, 560)],
		[Vector2(400, 380), Vector2(800, 380)],
		[Vector2(800, 380), Vector2(1200, 380)],
	]
	var cfg: Array = routes[randi() % routes.size()]
	var spd := 1.5 if _alarm_active else 1.0
	_spawn_drone_at(cfg[0], cfg[1], spd)


func _spawn_barrier(rect: Rect2) -> void:
	var bar := ColorRect.new()
	bar.color = Color(0.85, 0.1, 0.1, 0.40)
	bar.position = rect.position
	bar.size = rect.size
	bar.z_index = 3
	_world.add_child(bar)


func _set_drone_speed_mult(mult: float) -> void:
	for drone in _drones:
		(drone as PatrolDrone).speed_multiplier = mult


# ── Handlers ───────────────────────────────────────────────────────────────────

func _on_agent_caught() -> void:
	if GameState.current_state == GameState.RunState.PLAYING:
		GameState.end_run(false)


func _on_run_ended(victory: bool, fragments: int) -> void:
	if victory:
		HubState.deposit_backpack(GameState.backpack)
		_victory_screen.show_screen(GameState.run_time, fragments)
	else:
		_game_over_screen.show_screen(GameState.run_time)


func _go_to_hub() -> void:
	get_tree().change_scene_to_file("res://src/scenes/WorldMapScene.tscn")


# ══════════════════════════════════════════════════════════════════════════════
# Inner drawing classes
# ══════════════════════════════════════════════════════════════════════════════

class _GridDrawer extends Node2D:
	func _draw() -> void:
		var c := Color(0.085, 0.095, 0.13)
		for x in range(0, int(GameConfig.ARENA_WIDTH) + 1, 80):
			draw_line(Vector2(x, 0), Vector2(x, GameConfig.ARENA_HEIGHT), c, 1.0)
		for y in range(0, int(GameConfig.ARENA_HEIGHT) + 1, 80):
			draw_line(Vector2(0, y), Vector2(GameConfig.ARENA_WIDTH, y), c, 1.0)


class _ExitMarker extends Node2D:
	var blocked: bool = false
	var alarmed: bool = false
	var _pulse: float = 0.0

	func _process(delta: float) -> void:
		_pulse += delta
		queue_redraw()

	func _draw() -> void:
		var r := GameConfig.EXTRACTION_RADIUS
		var pulse_speed := 6.0 if alarmed else 3.0
		var p := 0.6 + 0.4 * sin(_pulse * pulse_speed)
		var col: Color
		if alarmed:
			col = Color(1.0, 0.85, 0.1)   # Urgent yellow — run!
		elif blocked:
			col = Color(0.9, 0.22, 0.22)  # Red — blocked by chase
		else:
			col = Color(0.2, 1.0, 0.6)    # Green — safe
		draw_circle(Vector2.ZERO, r, Color(col.r, col.g, col.b, 0.10 * p))
		draw_arc(Vector2.ZERO, r, 0.0, TAU, 48, Color(col.r, col.g, col.b, 0.85 * p), 2.5)
		draw_arc(Vector2.ZERO, r * 0.6, 0.0, TAU, 32, Color(col.r, col.g, col.b, 0.35 * p), 1.5)
		var label := "FUJA!" if alarmed else ("BLOQUEADO" if blocked else "EXIT")
		draw_string(ThemeDB.fallback_font, Vector2(-26, 6), label,
			HORIZONTAL_ALIGNMENT_LEFT, -1, 12, Color(col.r, col.g, col.b, 0.95 * p))
