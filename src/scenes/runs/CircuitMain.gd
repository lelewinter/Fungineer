## CircuitMain — Root scene for the Circuito Quebrado zone (Zone 2).
## Implements GDD: Solo puzzle zone — 3 chambers, colored pressure plates,
## target sequence activation, CircuitSentinel enemies, 90 s run timer.
##
## Flow:
##   Player navigates 3 chambers sequentially.
##   Each chamber has a target color sequence; standing still on a plate for
##   CIRCUIT_PLATE_ACTIVATE_TIME seconds activates it when the color matches
##   the current sequence step.
##   Wrong plate → partial reset (formula from GDD).
##   All 3 chambers complete → Núcleo Lógico spawns at chamber 3 center.
##   Player collects Núcleo (RESOURCE_COLLECTION_TIME) → reaches EXIT → victory.
##   HP = CIRCUIT_PLAYER_HP (3). CircuitSentinels deal 1 HP on contact.
##   Timer = CIRCUIT_RUN_TIMER (90 s). Expiry → fail.
extends Node2D

# ── Plate color palette ─────────────────────────────────────────────────────
const _PLATE_COLORS: Array = [
	Color(0.9, 0.2, 0.2),    # 0 = red
	Color(0.9, 0.8, 0.1),    # 1 = yellow
	Color(0.25, 0.5, 0.95),  # 2 = blue
]

# ── Chamber layout constants ─────────────────────────────────────────────────
const _CHAMBER_W: float = 500.0
const _CHAMBER_H: float = 300.0
const _CORRIDOR_W: float = 100.0
const _CORRIDOR_H: float = 60.0

# Chamber top-left origins (centered horizontally in 1600px arena)
const _CHAMBER_X: float = (GameConfig.ARENA_WIDTH - _CHAMBER_W) * 0.5   # 550
const _CHAMBER_1_Y: float = 60.0
const _CHAMBER_2_Y: float = _CHAMBER_1_Y + _CHAMBER_H + _CORRIDOR_H     # 420
const _CHAMBER_3_Y: float = _CHAMBER_2_Y + _CHAMBER_H + _CORRIDOR_H     # 780

# Chamber centers
const _C1_CENTER: Vector2 = Vector2(GameConfig.ARENA_WIDTH * 0.5, _CHAMBER_1_Y + _CHAMBER_H * 0.5)
const _C2_CENTER: Vector2 = Vector2(GameConfig.ARENA_WIDTH * 0.5, _CHAMBER_2_Y + _CHAMBER_H * 0.5)
const _C3_CENTER: Vector2 = Vector2(GameConfig.ARENA_WIDTH * 0.5, _CHAMBER_3_Y + _CHAMBER_H * 0.5)

# Door collision strips (horizontal bars closing corridor passages)
const _DOOR_1_RECT: Rect2 = Rect2(
	GameConfig.ARENA_WIDTH * 0.5 - _CORRIDOR_W * 0.5,
	_CHAMBER_1_Y + _CHAMBER_H,
	_CORRIDOR_W, 16.0)
const _DOOR_2_RECT: Rect2 = Rect2(
	GameConfig.ARENA_WIDTH * 0.5 - _CORRIDOR_W * 0.5,
	_CHAMBER_2_Y + _CHAMBER_H,
	_CORRIDOR_W, 16.0)

# Exit position
const _EXIT_POS: Vector2 = Vector2(GameConfig.ARENA_WIDTH * 0.5,
	_CHAMBER_3_Y + _CHAMBER_H + 80.0)
const _EXIT_RADIUS: float = 40.0

# Nucleo collection radius / time
const _NUCLEO_RADIUS: float = GameConfig.RESOURCE_COLLECTION_RADIUS
const _NUCLEO_COLLECT_TIME: float = GameConfig.RESOURCE_COLLECTION_TIME

# ── Inner class: pressure plate ─────────────────────────────────────────────

class _Plate:
	## World position of the plate center.
	var pos: Vector2
	## Color index into _PLATE_COLORS: 0=red, 1=yellow, 2=blue.
	var color_idx: int
	## True when this plate has been successfully activated this run.
	var activated: bool = false

	func _init(p: Vector2, c: int) -> void:
		pos = p
		color_idx = c


# ── State variables ─────────────────────────────────────────────────────────

var _world: Node2D
var _agent: _CircuitAgent
var _camera: Camera2D

# Per-chamber plate arrays and sequences
var _chamber_plates: Array = []   # Array[Array[_Plate]]  — 3 elements
var _chamber_seqs: Array = []     # Array[Array[int]]     — target color sequences
var _chamber_steps: Array = []    # Array[int]            — current step per chamber
var _chamber_done: Array = []     # Array[bool]

# Doors
var _door_1_open: bool = false
var _door_2_open: bool = false
var _door_drawer: _DoorDrawer

# Sentinels
var _sentinels: Array = []        # Array[CircuitSentinel]

# Plate activation tracking (only one plate can be activating at a time)
var _activating_plate_idx: int = -1   # index within _all_plates
var _activating_chamber: int = -1
var _activate_timer: float = 0.0
var _all_plates: Array = []           # flat Array[_Plate] for indexed lookup

# Run timer
var _run_timer: float = GameConfig.CIRCUIT_RUN_TIMER

# Nucleo
var _nucleo_spawned: bool = false
var _nucleo_pos: Vector2 = Vector2.ZERO
var _nucleo_collecting: bool = false
var _nucleo_collect_timer: float = 0.0
var _nucleo_collected: bool = false
var _nucleo_drawer: _NucleoDrawer

# Exit
var _exit_triggered: bool = false
var _exit_drawer: _ExitDrawer

# Fail / victory overlay
var _overlay_active: bool = false
var _overlay_timer: float = 0.0
var _overlay_victory: bool = false
const _OVERLAY_DELAY: float = 2.5

# HUD
var _hud: _CircuitHUD

# World draw node (holds chamber/corridor geometry)
var _world_drawer: _WorldDrawer

# Pulse time for animated elements
var _pulse: float = 0.0

# Plate mutation — every _MUTATION_INTERVAL seconds a non-activated plate changes color
var _mutation_timer: float = 0.0
const _MUTATION_INTERVAL: float = 8.0

# Per-chamber fast-bonus timers — completing a chamber in < _FAST_BONUS_TIME earns +ai_components
var _chamber_fast_timers: Array[float] = [0.0, 0.0, 0.0]
const _FAST_BONUS_TIME: float = 22.0


# ══════════════════════════════════════════════════════════════════════════════
# Lifecycle
# ══════════════════════════════════════════════════════════════════════════════

func _ready() -> void:
	_build_world()
	_build_agent()
	_build_chambers()
	_build_exit()
	_build_hud()
	GameState.start_run()


func _process(delta: float) -> void:
	if _overlay_active:
		_overlay_timer += delta
		if _overlay_timer >= _OVERLAY_DELAY:
			get_tree().change_scene_to_file("res://src/scenes/hub/HubScene.tscn")
		return

	if GameState.current_state != GameState.RunState.PLAYING:
		return

	_pulse += delta

	# Timer countdown
	_run_timer -= delta
	if _run_timer <= 0.0:
		_run_timer = 0.0
		_trigger_fail()
		return

	# Agent movement and invincibility
	_agent.update_movement(delta)

	# Plate activation
	_update_plate_activation(delta)

	# Plate mutations — change colors under time pressure
	_update_mutations(delta)

	# Fast bonus — tick only the active chamber's elapsed time
	var _ac: int = _current_chamber_index()
	if _ac < 3:
		_chamber_fast_timers[_ac] += delta

	# Sentinel updates
	_update_sentinels()

	# Door collisions
	_apply_door_collisions()

	# Nucleo logic
	if _nucleo_spawned and not _nucleo_collected:
		_update_nucleo(delta)

	# Exit check
	if _nucleo_collected and not _exit_triggered:
		_check_exit()

	# Redraw dynamic nodes
	queue_redraw()
	if _door_drawer:
		_door_drawer.queue_redraw()
	if _nucleo_drawer:
		_nucleo_drawer.queue_redraw()
	if _exit_drawer:
		_exit_drawer.queue_redraw()
	_hud.refresh(_run_timer, _agent.hp,
		_current_chamber_index(), _chamber_seqs, _chamber_steps,
		_nucleo_collecting, _nucleo_collect_timer,
		_pulse, _chamber_fast_timers, _FAST_BONUS_TIME)


# ══════════════════════════════════════════════════════════════════════════════
# Build helpers
# ══════════════════════════════════════════════════════════════════════════════

func _build_world() -> void:
	_world = Node2D.new()
	_world.name = "World"
	add_child(_world)

	# Dark floor
	var floor_rect := ColorRect.new()
	floor_rect.color = Color(0.05, 0.06, 0.09)
	floor_rect.size = Vector2(GameConfig.ARENA_WIDTH, GameConfig.ARENA_HEIGHT)
	_world.add_child(floor_rect)

	# Grid
	_world.add_child(_GridDrawer.new())

	# Chamber + corridor geometry (drawn via custom draw node for crisp outlines)
	_world_drawer = _WorldDrawer.new()
	_world_drawer.owner_scene = self
	_world.add_child(_world_drawer)

	# Borders
	var border_color := Color(0.15, 0.22, 0.38)
	var thickness := 3.0
	for b: Array in [
		[Vector2(0, 0), Vector2(GameConfig.ARENA_WIDTH, thickness)],
		[Vector2(0, GameConfig.ARENA_HEIGHT - thickness), Vector2(GameConfig.ARENA_WIDTH, thickness)],
		[Vector2(0, 0), Vector2(thickness, GameConfig.ARENA_HEIGHT)],
		[Vector2(GameConfig.ARENA_WIDTH - thickness, 0), Vector2(thickness, GameConfig.ARENA_HEIGHT)],
	]:
		var border := ColorRect.new()
		border.color = border_color
		border.position = b[0] as Vector2
		border.size = b[1] as Vector2
		_world.add_child(border)

	# Door drawer (renders on top of world geometry)
	_door_drawer = _DoorDrawer.new()
	_door_drawer.owner_scene = self
	_world.add_child(_door_drawer)


func _build_agent() -> void:
	_agent = _CircuitAgent.new()
	_agent.name = "CircuitAgent"
	_agent.position = Vector2(GameConfig.ARENA_WIDTH * 0.5,
		_CHAMBER_1_Y + _CHAMBER_H * 0.75)
	_agent.on_hit.connect(_on_agent_hit)
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


func _build_chambers() -> void:
	# ── Chamber definitions ──────────────────────────────────────────────────
	# Each entry: [plate_positions: Array[Vector2], sequence: Array[int], sentinel_count: int]
	# Sequences use color indices: 0=red, 1=yellow, 2=blue
	# Chamber 1: 3-step, 4 plates, 0 sentinels (tutorial)
	# Chamber 2: 4-step, 5 plates, 1 sentinel
	# Chamber 3: 5-step, 6 plates, 2 sentinels

	var defs: Array = [
		{
			"center": _C1_CENTER,
			"plates": _plates_for_chamber(0),
			"sequence": [2, 0, 1],            # blue, red, yellow
			"sentinel_routes": [],
		},
		{
			"center": _C2_CENTER,
			"plates": _plates_for_chamber(1),
			"sequence": [0, 2, 1, 0],         # red, blue, yellow, red
			"sentinel_routes": [
				[_C2_CENTER + Vector2(-160.0, -60.0), _C2_CENTER + Vector2(160.0, -60.0)],
			],
		},
		{
			"center": _C3_CENTER,
			"plates": _plates_for_chamber(2),
			"sequence": [2, 1, 0, 2, 1],      # blue, yellow, red, blue, yellow
			"sentinel_routes": [
				[_C3_CENTER + Vector2(-150.0, -80.0), _C3_CENTER + Vector2(150.0, -80.0)],
				[_C3_CENTER + Vector2(-150.0, 60.0),  _C3_CENTER + Vector2(150.0, 60.0)],
			],
		},
	]

	for chamber_idx in defs.size():
		var def: Dictionary = defs[chamber_idx]
		var plates: Array = []
		for pd: Array in def["plates"]:
			var plate := _Plate.new(pd[0] as Vector2, pd[1] as int)
			plates.append(plate)
			_all_plates.append(plate)
		_chamber_plates.append(plates)
		_chamber_seqs.append(def["sequence"] as Array)
		_chamber_steps.append(0)
		_chamber_done.append(false)

		# Sentinels
		for route: Array in def["sentinel_routes"]:
			var sentinel := CircuitSentinel.new()
			sentinel.setup(route[0] as Vector2, route[1] as Vector2, _agent)
			sentinel.hit_player.connect(_on_sentinel_hit)
			_world.add_child(sentinel)
			_sentinels.append(sentinel)

	# Plate draw node (renders all plates)
	var plate_drawer := _PlateDrawer.new()
	plate_drawer.owner_scene = self
	_world.add_child(plate_drawer)


func _build_exit() -> void:
	_exit_drawer = _ExitDrawer.new()
	_exit_drawer.owner_scene = self
	_exit_drawer.position = _EXIT_POS
	_world.add_child(_exit_drawer)

	# Nucleo draw node (hidden until spawned)
	_nucleo_drawer = _NucleoDrawer.new()
	_nucleo_drawer.owner_scene = self
	_nucleo_drawer.visible = false
	_world.add_child(_nucleo_drawer)


func _build_hud() -> void:
	_hud = _CircuitHUD.new()
	_hud.name = "CircuitHUD"
	add_child(_hud)


# ── Plate layout helper ──────────────────────────────────────────────────────

## Returns an Array of [Vector2, color_idx] pairs for a given chamber index.
## Plates are spread across the chamber in a readable grid pattern.
func _plates_for_chamber(chamber_idx: int) -> Array:
	var center: Vector2
	var count: int
	match chamber_idx:
		0: center = _C1_CENTER; count = 4
		1: center = _C2_CENTER; count = 5
		_: center = _C3_CENTER; count = 6

	# Distribute plates evenly in two rows
	var positions: Array[Vector2] = []
	var half: int = count / 2
	var row_y_offsets: Array = [-60.0, 60.0]
	var per_row: Array = [half, count - half]
	for row in 2:
		var n: int = per_row[row]
		var row_y: float = center.y + row_y_offsets[row]
		for col in n:
			var t: float = (float(col) + 0.5) / float(n)
			var x: float = center.x - _CHAMBER_W * 0.38 + t * _CHAMBER_W * 0.76
			positions.append(Vector2(x, row_y))

	# Assign colors — cycle through colors deterministically so each sequence
	# color actually has matching plates
	var result: Array = []
	for i in positions.size():
		result.append([positions[i], i % 3])
	return result


# ══════════════════════════════════════════════════════════════════════════════
# Plate activation logic
# ══════════════════════════════════════════════════════════════════════════════

func _update_plate_activation(delta: float) -> void:
	# Find active chamber (first incomplete one)
	var active_chamber: int = _current_chamber_index()
	if active_chamber >= 3:
		return  # All done

	var plates: Array = _chamber_plates[active_chamber]
	var seq: Array = _chamber_seqs[active_chamber]
	var step: int = _chamber_steps[active_chamber]

	# Find which plate (if any) the agent is standing on
	var standing_idx: int = -1
	var standing_plate_global_idx: int = -1
	var offset: int = _plate_offset(active_chamber)

	for i in plates.size():
		var plate: _Plate = plates[i]
		if plate.activated:
			continue
		var dist: float = _agent.global_position.distance_to(plate.pos)
		if dist <= GameConfig.CIRCUIT_PLATE_RADIUS:
			standing_idx = i
			standing_plate_global_idx = offset + i
			break

	# Check if agent is moving (velocity threshold)
	var agent_still: bool = _agent.get_speed() < 8.0

	if standing_idx == -1 or not agent_still:
		# Not on a valid plate or moving — cancel activation
		_activating_plate_idx = -1
		_activating_chamber = -1
		_activate_timer = 0.0
		return

	if _activating_plate_idx != standing_plate_global_idx:
		# Stepped onto a new plate — reset timer
		_activating_plate_idx = standing_plate_global_idx
		_activating_chamber = active_chamber
		_activate_timer = 0.0

	_activate_timer += delta

	if _activate_timer >= GameConfig.CIRCUIT_PLATE_ACTIVATE_TIME:
		_activate_timer = 0.0
		var plate: _Plate = plates[standing_idx]
		if plate.color_idx == seq[step]:
			# Correct plate
			plate.activated = true
			_chamber_steps[active_chamber] = step + 1
			_activating_plate_idx = -1
			_activating_chamber = -1
			_check_chamber_complete(active_chamber)
		else:
			# Wrong plate — partial reset
			_apply_partial_reset(active_chamber)
			_activating_plate_idx = -1
			_activating_chamber = -1


## Partial reset formula from GDD (P = 1-indexed passo being attempted; step = P-1 in 0-indexed):
##   P=1,2 (step 0,1)  → reset to step 0 (redo everything)
##   P=3,4 (step 2,3)  → new_step = 1 (keep 1 plate, redo from 2nd)
##   P=5+  (step 4+)   → new_step = step - 2 (keeps all but last 2 plates)
## GDD example: P=5 → "volta ao passo 2, refaz passos 3,4,5" → new_step=2 ✓
## Wrong plate also costs 1 HP — making guesses genuinely risky.
func _apply_partial_reset(chamber_idx: int) -> void:
	var step: int = _chamber_steps[chamber_idx]
	var new_step: int
	if step <= 1:
		new_step = 0
	elif step <= 3:
		new_step = 1
	else:
		new_step = max(0, step - 2)
	_chamber_steps[chamber_idx] = new_step

	# Un-activate plates beyond the new step
	var plates: Array = _chamber_plates[chamber_idx]
	var reset_count: int = 0
	for plate: _Plate in plates:
		if plate.activated:
			if reset_count < new_step:
				reset_count += 1
			else:
				plate.activated = false

	# Wrong plate = HP cost (the key tradeoff: rush and guess vs. play it safe)
	_agent.take_hit()


func _check_chamber_complete(chamber_idx: int) -> void:
	var step: int = _chamber_steps[chamber_idx]
	var seq_len: int = (_chamber_seqs[chamber_idx] as Array).size()
	if step >= seq_len:
		_chamber_done[chamber_idx] = true
		# Speed bonus: complete within _FAST_BONUS_TIME → deposit ai_components immediately
		if _chamber_fast_timers[chamber_idx] <= _FAST_BONUS_TIME:
			GameState.add_to_backpack("ai_components")
		# Reset mutation timer so the next chamber starts fresh
		_mutation_timer = 0.0
		# Open corresponding door
		match chamber_idx:
			0: _door_1_open = true
			1: _door_2_open = true
			2: _spawn_nucleo()


func _spawn_nucleo() -> void:
	if _nucleo_spawned:
		return
	_nucleo_spawned = true
	_nucleo_pos = _C3_CENTER
	_nucleo_drawer.position = _nucleo_pos
	_nucleo_drawer.visible = true


# ── Plate mutation ───────────────────────────────────────────────────────────

func _update_mutations(delta: float) -> void:
	var active_chamber: int = _current_chamber_index()
	if active_chamber >= 3:
		return
	_mutation_timer += delta
	if _mutation_timer < _MUTATION_INTERVAL:
		return
	_mutation_timer = 0.0

	# Pick a random non-activated plate in the active chamber
	var plates: Array = _chamber_plates[active_chamber]
	var candidates: Array = []
	for i in plates.size():
		var plate: _Plate = plates[i]
		if not plate.activated:
			candidates.append(i)
	if candidates.is_empty():
		return

	var chosen_local: int = candidates[randi() % candidates.size()]
	var chosen_plate: _Plate = plates[chosen_local]
	# Change to a different color (cycle +1 or +2, always different)
	chosen_plate.color_idx = (chosen_plate.color_idx + 1 + randi() % 2) % 3

	# If this plate was being activated, cancel the activation
	var global_idx: int = _plate_offset(active_chamber) + chosen_local
	if _activating_plate_idx == global_idx:
		_activating_plate_idx = -1
		_activating_chamber = -1
		_activate_timer = 0.0


# ── Plate global index offset ────────────────────────────────────────────────

func _plate_offset(chamber_idx: int) -> int:
	var total: int = 0
	for i in chamber_idx:
		total += (_chamber_plates[i] as Array).size()
	return total


# ── Current active chamber index ─────────────────────────────────────────────

func _current_chamber_index() -> int:
	for i in 3:
		if not _chamber_done[i]:
			return i
	return 3


# ══════════════════════════════════════════════════════════════════════════════
# Sentinel updates
# ══════════════════════════════════════════════════════════════════════════════

func _update_sentinels() -> void:
	pass  # Sentinels use _process() internally; nothing extra needed here.


# ══════════════════════════════════════════════════════════════════════════════
# Door collision
# ══════════════════════════════════════════════════════════════════════════════

func _apply_door_collisions() -> void:
	if not _door_1_open:
		_clamp_agent_to_door(_DOOR_1_RECT, 1)
	if not _door_2_open:
		_clamp_agent_to_door(_DOOR_2_RECT, 2)


## Prevents the agent from crossing a closed door rect.
## chamber_below: the chamber index below the door (1-indexed: 1 = ch2 side, 2 = ch3 side).
func _clamp_agent_to_door(door: Rect2, chamber_below: int) -> void:
	var agent_pos: Vector2 = _agent.global_position
	var agent_r: float = 14.0  # agent body radius

	# Door top edge — agent coming from above (chamber N)
	var door_top: float = door.position.y
	# Door bottom edge — agent coming from below (chamber N+1)
	var door_bottom: float = door.position.y + door.size.y

	# Horizontal corridor bounds
	var door_left: float = door.position.x
	var door_right: float = door.position.x + door.size.x

	# Only apply clamping if agent is horizontally within the corridor
	if agent_pos.x < door_left - agent_r or agent_pos.x > door_right + agent_r:
		return

	# Push agent back if crossing door from above
	if agent_pos.y + agent_r > door_top and agent_pos.y < door_top:
		_agent.global_position.y = door_top - agent_r

	# Push agent back if crossing door from below
	if agent_pos.y - agent_r < door_bottom and agent_pos.y > door_bottom:
		_agent.global_position.y = door_bottom + agent_r


# ══════════════════════════════════════════════════════════════════════════════
# Nucleo and exit
# ══════════════════════════════════════════════════════════════════════════════

func _update_nucleo(delta: float) -> void:
	var dist: float = _agent.global_position.distance_to(_nucleo_pos)
	var agent_still: bool = _agent.get_speed() < 8.0
	var backpack_full: bool = GameState.backpack.size() >= HubState.get_backpack_capacity()

	if dist <= _NUCLEO_RADIUS and agent_still and not backpack_full:
		_nucleo_collecting = true
		_nucleo_collect_timer += delta
		if _nucleo_collect_timer >= _NUCLEO_COLLECT_TIME:
			_nucleo_collected = true
			_nucleo_collecting = false
			_nucleo_drawer.visible = false
			GameState.add_to_backpack("nucleo_logico")
	else:
		_nucleo_collecting = false
		_nucleo_collect_timer = 0.0


func _check_exit() -> void:
	if _exit_triggered:
		return
	var dist: float = _agent.global_position.distance_to(_EXIT_POS)
	if dist <= _EXIT_RADIUS:
		_exit_triggered = true
		_trigger_victory()


# ══════════════════════════════════════════════════════════════════════════════
# Fail / Victory
# ══════════════════════════════════════════════════════════════════════════════

func _trigger_fail() -> void:
	if _overlay_active:
		return
	_overlay_active = true
	_overlay_victory = false
	_overlay_timer = 0.0
	GameState.end_run(false)
	_show_overlay(false)


func _trigger_victory() -> void:
	if _overlay_active:
		return
	_overlay_active = true
	_overlay_victory = true
	_overlay_timer = 0.0
	HubState.deposit_backpack(GameState.backpack)
	GameState.end_run(true)
	_show_overlay(true)


func _show_overlay(victory: bool) -> void:
	var layer := CanvasLayer.new()
	layer.layer = 10
	add_child(layer)

	var bg := ColorRect.new()
	bg.size = Vector2(GameConfig.VIEWPORT_WIDTH, GameConfig.VIEWPORT_HEIGHT)
	bg.color = Color(0.0, 0.0, 0.0, 0.72)
	bg.mouse_filter = Control.MOUSE_FILTER_IGNORE
	layer.add_child(bg)

	var lbl := Label.new()
	lbl.text = "VITÓRIA!\nvoltando..." if victory else "FALHOU\nvoltando..."
	lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	lbl.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	lbl.size = Vector2(GameConfig.VIEWPORT_WIDTH, GameConfig.VIEWPORT_HEIGHT)
	lbl.add_theme_font_size_override("font_size", 32)
	lbl.modulate = Color(0.3, 1.0, 0.55) if victory else Color(1.0, 0.25, 0.25)
	layer.add_child(lbl)


# ══════════════════════════════════════════════════════════════════════════════
# Signal handlers
# ══════════════════════════════════════════════════════════════════════════════

func _on_agent_hit() -> void:
	if _agent.hp <= 0:
		_trigger_fail()


func _on_sentinel_hit() -> void:
	_agent.take_hit()


# ══════════════════════════════════════════════════════════════════════════════
# Inner class: CircuitAgent
# ══════════════════════════════════════════════════════════════════════════════

## Solo player for the Circuit zone.
## Drag input identical to StealthAgent pattern.
## HP = CIRCUIT_PLAYER_HP. 1 s invincibility after each hit.
class _CircuitAgent extends Node2D:
	var hp: int = GameConfig.CIRCUIT_PLAYER_HP
	var _move_target: Vector2 = Vector2.ZERO
	var _drag_active: bool = false
	var _velocity: Vector2 = Vector2.ZERO
	var _invincible_timer: float = 0.0

	const _INVINCIBILITY_DURATION: float = 1.0
	const _BODY_RADIUS: float = 14.0

	signal on_hit()

	func _ready() -> void:
		_move_target = global_position

	func _input(event: InputEvent) -> void:
		if GameState.current_state != GameState.RunState.PLAYING:
			return
		if event is InputEventMouseButton:
			var mb := event as InputEventMouseButton
			if mb.button_index == MOUSE_BUTTON_LEFT:
				_drag_active = mb.pressed
				if mb.pressed:
					_move_target = global_position
		if event is InputEventMouseMotion and _drag_active:
			_move_target += (event as InputEventMouseMotion).relative
		if event is InputEventScreenTouch:
			var touch := event as InputEventScreenTouch
			_drag_active = touch.pressed
			if touch.pressed:
				_move_target = global_position
		if event is InputEventScreenDrag:
			_move_target += (event as InputEventScreenDrag).relative
			_drag_active = true

	## Called by CircuitMain._process() — keeps movement frame-rate independent.
	func update_movement(delta: float) -> void:
		if _invincible_timer > 0.0:
			_invincible_timer -= delta

		if not _drag_active:
			_move_target = global_position
		_move_target = _move_target.clamp(
			Vector2(30.0, 30.0),
			Vector2(GameConfig.ARENA_WIDTH - 30.0, GameConfig.ARENA_HEIGHT - 30.0)
		)
		var prev_pos: Vector2 = global_position
		global_position = global_position.lerp(_move_target, GameConfig.DRAG_LERP_FACTOR * delta)
		_velocity = (global_position - prev_pos) / delta if delta > 0.0 else Vector2.ZERO
		queue_redraw()

	## Returns the agent's current movement speed in px/s.
	func get_speed() -> float:
		return _velocity.length()

	## Apply 1 HP of damage. No-ops during invincibility window.
	func take_hit() -> void:
		if _invincible_timer > 0.0:
			return
		hp = max(0, hp - 1)
		_invincible_timer = _INVINCIBILITY_DURATION
		on_hit.emit()
		queue_redraw()

	func _draw() -> void:
		var invincible: bool = _invincible_timer > 0.0
		var body_color: Color
		if invincible:
			# Pulsing red tint during invincibility
			var pulse: float = sin(_invincible_timer * 18.0)
			body_color = Color(1.0, 0.3 + 0.3 * pulse, 0.3 + 0.3 * pulse)
		else:
			body_color = Color(0.92, 0.92, 0.96)
		draw_circle(Vector2.ZERO, _BODY_RADIUS, body_color)
		# Direction nub
		if _velocity.length() > 5.0:
			draw_line(Vector2.ZERO, _velocity.normalized() * (_BODY_RADIUS + 5.0),
				Color(1.0, 1.0, 1.0, 0.6), 2.0)


# ══════════════════════════════════════════════════════════════════════════════
# Inner class: HUD
# ══════════════════════════════════════════════════════════════════════════════

## On-screen display: sequence strips, timer, HP pips.
## Drawn via a CanvasLayer + custom Node2D so it stays fixed on screen.
class _CircuitHUD extends CanvasLayer:
	var _draw_node: _HUDDrawer

	# Data updated each frame by refresh()
	var _run_timer: float = GameConfig.CIRCUIT_RUN_TIMER
	var _hp: int = GameConfig.CIRCUIT_PLAYER_HP
	var _active_chamber: int = 0
	var _chamber_seqs: Array = []
	var _chamber_steps: Array = []
	var _collecting: bool = false
	var _collect_timer: float = 0.0
	var _pulse: float = 0.0
	var _fast_timers: Array = []
	var _fast_bonus_time: float = 22.0

	func _ready() -> void:
		layer = 4
		_draw_node = _HUDDrawer.new()
		_draw_node.hud = self
		add_child(_draw_node)

	## Called every frame from CircuitMain._process().
	func refresh(run_timer: float, hp: int, active_chamber: int,
			chamber_seqs: Array, chamber_steps: Array,
			collecting: bool, collect_timer: float, pulse: float,
			fast_timers: Array, fast_bonus_time: float) -> void:
		_run_timer = run_timer
		_hp = hp
		_active_chamber = active_chamber
		_chamber_seqs = chamber_seqs
		_chamber_steps = chamber_steps
		_collecting = collecting
		_collect_timer = collect_timer
		_pulse = pulse
		_fast_timers = fast_timers
		_fast_bonus_time = fast_bonus_time
		_draw_node.queue_redraw()

	## Inner draw node for the HUD (must be Node2D inside CanvasLayer).
	class _HUDDrawer extends Node2D:
		var hud: Node  # typed as _CircuitHUD at runtime

		func _draw() -> void:
			if hud == null:
				return
			_draw_hp()
			_draw_timer()
			_draw_sequence()
			_draw_fast_bonus()
			if hud._collecting:
				_draw_collect_progress()

		func _draw_hp() -> void:
			var pip_r: float = 10.0
			var spacing: float = 28.0
			var origin: Vector2 = Vector2(18.0, 18.0)
			for i in GameConfig.CIRCUIT_PLAYER_HP:
				var pip_pos: Vector2 = origin + Vector2(i * spacing, 0.0)
				var filled: bool = i < hud._hp
				var col: Color = Color(0.95, 0.25, 0.25) if filled else Color(0.25, 0.25, 0.3)
				draw_circle(pip_pos, pip_r, col)
				draw_arc(pip_pos, pip_r, 0.0, TAU, 24, Color(1.0, 1.0, 1.0, 0.4), 1.5)

		func _draw_timer() -> void:
			var t: float = hud._run_timer
			var secs: int = int(t)
			var text: String = "%.0fs" % secs
			var urgent: bool = t < 20.0
			var blink: float = 1.0 if not urgent else (0.6 + 0.4 * sin(hud._pulse * 8.0))
			var col: Color = Color(1.0, 0.3, 0.2, blink) if urgent else Color(0.9, 0.9, 0.9, 0.92)
			var pos: Vector2 = Vector2(GameConfig.VIEWPORT_WIDTH - 70.0, 16.0)
			draw_string(ThemeDB.fallback_font, pos, text, HORIZONTAL_ALIGNMENT_LEFT, -1, 22, col)

		func _draw_sequence() -> void:
			if hud._chamber_seqs.is_empty():
				return
			var active: int = hud._active_chamber
			if active >= hud._chamber_seqs.size():
				# All chambers done — show completion text
				draw_string(ThemeDB.fallback_font,
					Vector2(GameConfig.VIEWPORT_WIDTH * 0.5 - 60.0, GameConfig.VIEWPORT_HEIGHT - 40.0),
					"SEQUÊNCIA COMPLETA!", HORIZONTAL_ALIGNMENT_LEFT, -1, 14,
					Color(0.3, 1.0, 0.55))
				return

			var seq: Array = hud._chamber_seqs[active]
			var step: int = hud._chamber_steps[active]

			# Colors matching _PLATE_COLORS
			var plate_colors: Array = [
				Color(0.9, 0.2, 0.2),
				Color(0.9, 0.8, 0.1),
				Color(0.25, 0.5, 0.95),
			]

			var sq_size: float = 28.0
			var gap: float = 6.0
			var total_w: float = seq.size() * (sq_size + gap) - gap
			var origin_x: float = (GameConfig.VIEWPORT_WIDTH - total_w) * 0.5
			var origin_y: float = GameConfig.VIEWPORT_HEIGHT - 60.0

			# Chamber label
			draw_string(ThemeDB.fallback_font,
				Vector2(origin_x, origin_y - 20.0),
				"Câmara %d" % (active + 1),
				HORIZONTAL_ALIGNMENT_LEFT, -1, 12, Color(0.7, 0.7, 0.75))

			for i in seq.size():
				var col: Color = plate_colors[seq[i] as int]
				var x: float = origin_x + i * (sq_size + gap)
				var rect := Rect2(x, origin_y, sq_size, sq_size)
				var is_done: bool = i < step
				var is_current: bool = i == step
				var is_next: bool = i == step + 1
				var is_hidden: bool = i > step + 1

				if is_hidden:
					# Future steps are hidden — only show a gray "?" block
					draw_rect(rect, Color(0.18, 0.18, 0.22, 0.55))
					draw_rect(rect, Color(0.4, 0.4, 0.5, 0.5), false, 1.0)
					draw_string(ThemeDB.fallback_font,
						rect.position + Vector2(sq_size * 0.25, sq_size * 0.72),
						"?", HORIZONTAL_ALIGNMENT_LEFT, -1, 14, Color(0.5, 0.5, 0.6, 0.7))
					continue

				# Background
				var bg_alpha: float
				if is_done:
					bg_alpha = 0.55
				elif is_current:
					bg_alpha = 0.35
				elif is_next:
					bg_alpha = 0.12  # Faint hint of next step's color
				else:
					bg_alpha = 0.25
				draw_rect(rect, Color(col.r, col.g, col.b, bg_alpha))

				# Border
				if is_done:
					draw_rect(rect, Color(col.r, col.g, col.b, 0.9), false, 2.0)
				elif is_current:
					var p: float = 0.6 + 0.4 * sin(hud._pulse * 5.0)
					draw_rect(rect, Color(1.0, 1.0, 1.0, p), false, 2.5)
				elif is_next:
					# Faint hint — player can see the next color but it's subtle
					draw_rect(rect, Color(col.r, col.g, col.b, 0.3), false, 1.0)
					draw_string(ThemeDB.fallback_font,
						rect.position + Vector2(sq_size * 0.25, sq_size * 0.72),
						"?", HORIZONTAL_ALIGNMENT_LEFT, -1, 11, Color(col.r, col.g, col.b, 0.5))
				else:
					draw_rect(rect, Color(col.r, col.g, col.b, 0.45), false, 1.0)

		func _draw_fast_bonus() -> void:
			var active: int = hud._active_chamber
			if active >= 3 or hud._fast_timers.is_empty():
				return
			var elapsed: float = hud._fast_timers[active]
			var remaining: float = hud._fast_bonus_time - elapsed
			var pos: Vector2 = Vector2(14.0, 60.0)
			if remaining <= 0.0:
				draw_string(ThemeDB.fallback_font, pos,
					"BONUS PERDIDO",
					HORIZONTAL_ALIGNMENT_LEFT, -1, 11, Color(0.45, 0.45, 0.5, 0.65))
				return
			var urgent: bool = remaining < 8.0
			var blink: float = 1.0 if not urgent else (0.6 + 0.4 * sin(hud._pulse * 8.0))
			var col: Color = Color(0.95, 0.75, 0.1, blink) if not urgent else Color(1.0, 0.35, 0.1, blink)
			draw_string(ThemeDB.fallback_font, pos,
				"BONUS %.0fs → +componente" % remaining,
				HORIZONTAL_ALIGNMENT_LEFT, -1, 12, col)


		func _draw_collect_progress() -> void:
			var t: float = hud._collect_timer / GameConfig.RESOURCE_COLLECTION_TIME
			var bar_w: float = 120.0
			var bar_h: float = 10.0
			var pos: Vector2 = Vector2((GameConfig.VIEWPORT_WIDTH - bar_w) * 0.5,
				GameConfig.VIEWPORT_HEIGHT * 0.5 + 40.0)
			draw_rect(Rect2(pos, Vector2(bar_w, bar_h)), Color(0.15, 0.15, 0.18))
			draw_rect(Rect2(pos, Vector2(bar_w * t, bar_h)), Color(0.3, 0.9, 0.55))
			draw_string(ThemeDB.fallback_font,
				pos + Vector2(0.0, -14.0), "Coletando Núcleo...",
				HORIZONTAL_ALIGNMENT_LEFT, -1, 12, Color(0.8, 0.8, 0.85))


# ══════════════════════════════════════════════════════════════════════════════
# Inner drawing classes
# ══════════════════════════════════════════════════════════════════════════════

class _GridDrawer extends Node2D:
	func _draw() -> void:
		var c := Color(0.07, 0.08, 0.11)
		for x in range(0, int(GameConfig.ARENA_WIDTH) + 1, 80):
			draw_line(Vector2(x, 0), Vector2(x, GameConfig.ARENA_HEIGHT), c, 1.0)
		for y in range(0, int(GameConfig.ARENA_HEIGHT) + 1, 80):
			draw_line(Vector2(0, y), Vector2(GameConfig.ARENA_WIDTH, y), c, 1.0)


class _WorldDrawer extends Node2D:
	var owner_scene: Node2D = null

	func _draw() -> void:
		if owner_scene == null:
			return
		var s = owner_scene
		var chamber_fill := Color(0.09, 0.11, 0.17)
		var chamber_border := Color(0.25, 0.35, 0.6)
		var corridor_fill := Color(0.07, 0.09, 0.14)

		# Chamber rects
		var chambers: Array = [
			Rect2(s._CHAMBER_X, s._CHAMBER_1_Y, s._CHAMBER_W, s._CHAMBER_H),
			Rect2(s._CHAMBER_X, s._CHAMBER_2_Y, s._CHAMBER_W, s._CHAMBER_H),
			Rect2(s._CHAMBER_X, s._CHAMBER_3_Y, s._CHAMBER_W, s._CHAMBER_H),
		]
		for r: Rect2 in chambers:
			draw_rect(r, chamber_fill)
			draw_rect(r, chamber_border, false, 2.0)

		# Corridors
		var corridor_x: float = GameConfig.ARENA_WIDTH * 0.5 - s._CORRIDOR_W * 0.5
		var c1_bottom: float = s._CHAMBER_1_Y + s._CHAMBER_H
		var c2_bottom: float = s._CHAMBER_2_Y + s._CHAMBER_H
		draw_rect(Rect2(corridor_x, c1_bottom, s._CORRIDOR_W, s._CORRIDOR_H), corridor_fill)
		draw_rect(Rect2(corridor_x, c2_bottom, s._CORRIDOR_W, s._CORRIDOR_H), corridor_fill)

		# Corridor side walls
		var wall_col := Color(0.25, 0.35, 0.6, 0.5)
		draw_line(Vector2(corridor_x, c1_bottom),
			Vector2(corridor_x, c1_bottom + s._CORRIDOR_H), wall_col, 2.0)
		draw_line(Vector2(corridor_x + s._CORRIDOR_W, c1_bottom),
			Vector2(corridor_x + s._CORRIDOR_W, c1_bottom + s._CORRIDOR_H), wall_col, 2.0)
		draw_line(Vector2(corridor_x, c2_bottom),
			Vector2(corridor_x, c2_bottom + s._CORRIDOR_H), wall_col, 2.0)
		draw_line(Vector2(corridor_x + s._CORRIDOR_W, c2_bottom),
			Vector2(corridor_x + s._CORRIDOR_W, c2_bottom + s._CORRIDOR_H), wall_col, 2.0)

		# Chamber number labels
		var label_positions: Array = [
			s._C1_CENTER + Vector2(-20.0, -s._CHAMBER_H * 0.45),
			s._C2_CENTER + Vector2(-20.0, -s._CHAMBER_H * 0.45),
			s._C3_CENTER + Vector2(-20.0, -s._CHAMBER_H * 0.45),
		]
		for i in 3:
			draw_string(ThemeDB.fallback_font, label_positions[i],
				"Câmara %d" % (i + 1),
				HORIZONTAL_ALIGNMENT_LEFT, -1, 13,
				Color(0.45, 0.55, 0.75, 0.7))


class _DoorDrawer extends Node2D:
	var owner_scene: Node2D = null

	func _draw() -> void:
		if owner_scene == null:
			return
		var s = owner_scene
		_draw_door(s._DOOR_1_RECT, s._door_1_open)
		_draw_door(s._DOOR_2_RECT, s._door_2_open)

	func _draw_door(rect: Rect2, is_open: bool) -> void:
		if is_open:
			# Draw a faint open-door indicator
			draw_rect(rect, Color(0.2, 0.8, 0.4, 0.18))
			draw_rect(rect, Color(0.2, 0.8, 0.4, 0.4), false, 1.5)
		else:
			# Solid door blocking the corridor
			draw_rect(rect, Color(0.7, 0.2, 0.15, 0.85))
			draw_rect(rect, Color(1.0, 0.35, 0.25), false, 2.0)
			draw_string(ThemeDB.fallback_font,
				rect.position + Vector2(4.0, rect.size.y * 0.5 + 5.0),
				"FECHADO", HORIZONTAL_ALIGNMENT_LEFT, -1, 10,
				Color(1.0, 0.8, 0.8, 0.9))


class _PlateDrawer extends Node2D:
	var owner_scene: Node2D = null

	func _draw() -> void:
		if owner_scene == null:
			return
		var s = owner_scene
		var plate_colors: Array = s._PLATE_COLORS
		var r: float = GameConfig.CIRCUIT_PLATE_RADIUS

		for chamber_idx in 3:
			var plates: Array = s._chamber_plates[chamber_idx]
			for i in plates.size():
				var plate = plates[i]
				var col: Color = plate_colors[plate.color_idx]
				var is_activating: bool = (
					s._activating_chamber == chamber_idx and
					s._activating_plate_idx == s._plate_offset(chamber_idx) + i
				)
				var progress: float = s._activate_timer / GameConfig.CIRCUIT_PLATE_ACTIVATE_TIME if is_activating else 0.0

				if plate.activated:
					# Full bright fill
					draw_circle(plate.pos, r, Color(col.r, col.g, col.b, 0.9))
					draw_arc(plate.pos, r, 0.0, TAU, 32,
						Color(1.0, 1.0, 1.0, 0.7), 2.5)
				elif is_activating:
					# Bright + progress arc
					draw_circle(plate.pos, r, Color(col.r, col.g, col.b, 0.45))
					draw_arc(plate.pos, r, -PI * 0.5,
						-PI * 0.5 + TAU * progress,
						32, Color(1.0, 1.0, 1.0, 0.9), 3.0)
				else:
					# Neutral dim
					draw_circle(plate.pos, r, Color(col.r * 0.4, col.g * 0.4, col.b * 0.4, 0.7))
					draw_arc(plate.pos, r, 0.0, TAU, 32,
						Color(col.r, col.g, col.b, 0.5), 1.5)


class _NucleoDrawer extends Node2D:
	var owner_scene: Node2D = null
	var _pulse: float = 0.0

	func _process(delta: float) -> void:
		_pulse += delta
		queue_redraw()

	func _draw() -> void:
		if owner_scene == null:
			return
		var p: float = 0.65 + 0.35 * sin(_pulse * 4.0)
		var col := Color(0.3, 1.0, 0.55)
		draw_circle(Vector2.ZERO, 18.0 * p, Color(col.r, col.g, col.b, 0.2))
		draw_circle(Vector2.ZERO, 12.0, Color(col.r, col.g, col.b, 0.9))
		draw_arc(Vector2.ZERO, 18.0, 0.0, TAU, 32,
			Color(col.r, col.g, col.b, 0.6 * p), 2.0)
		draw_string(ThemeDB.fallback_font,
			Vector2(-24.0, 28.0), "NÚCLEO",
			HORIZONTAL_ALIGNMENT_LEFT, -1, 11,
			Color(col.r, col.g, col.b, 0.85))

		# Show collection radius ring when player is near (handled by scene via visible)
		var s = owner_scene
		if s != null and s._nucleo_collecting:
			var t: float = s._nucleo_collect_timer / GameConfig.RESOURCE_COLLECTION_TIME
			draw_arc(Vector2.ZERO, GameConfig.RESOURCE_COLLECTION_RADIUS,
				-PI * 0.5, -PI * 0.5 + TAU * t,
				48, Color(0.3, 1.0, 0.55, 0.8), 3.0)


class _ExitDrawer extends Node2D:
	var owner_scene: Node2D = null
	var _pulse: float = 0.0

	func _process(delta: float) -> void:
		_pulse += delta
		queue_redraw()

	func _draw() -> void:
		if owner_scene == null:
			return
		var s = owner_scene
		var accessible: bool = s._nucleo_collected
		var p: float = 0.6 + 0.4 * sin(_pulse * (4.0 if accessible else 2.0))
		var col: Color = Color(0.2, 1.0, 0.6) if accessible else Color(0.5, 0.5, 0.6)
		var r: float = s._EXIT_RADIUS

		draw_circle(Vector2.ZERO, r, Color(col.r, col.g, col.b, 0.08 * p))
		draw_arc(Vector2.ZERO, r, 0.0, TAU, 48, Color(col.r, col.g, col.b, 0.85 * p), 2.5)
		draw_arc(Vector2.ZERO, r * 0.6, 0.0, TAU, 32,
			Color(col.r, col.g, col.b, 0.35 * p), 1.5)
		var label: String = "EXIT" if accessible else "COLETE NÚCLEO"
		draw_string(ThemeDB.fallback_font, Vector2(-26.0, 6.0), label,
			HORIZONTAL_ALIGNMENT_LEFT, -1, 12,
			Color(col.r, col.g, col.b, 0.95 * p))
