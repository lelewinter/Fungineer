## MazeMain — Labirinto Dinâmico zone.
## Solo navigation: collect Fragmentos Estruturais through a 3×5 grid maze.
## Dynamic walls cycle open↔closed on per-wall timers; closing walls push + damage the player.
## Player has 3 HP. Sentinels emerge (30% chance) when a wall opens. Reach EXIT to win.
extends Node2D

# ─────────────────────── Layout constants ─────────────────────────────────────
const _ROOM_W: float = 120.0
const _ROOM_H: float = 100.0
const _GAP: float = 30.0
const _COL_STEP: float = _ROOM_W + _GAP   # 150
const _ROW_STEP: float = _ROOM_H + _GAP   # 130
const _COLS: int = 3
const _ROWS: int = 5
const _MARGIN_X: float = 30.0   # (480 - 3*120 - 2*30) / 2
const _MARGIN_Y: float = 117.0  # (854 - 5*100 - 4*30) / 2

const _ENTRY_COL: int = 1
const _ENTRY_ROW: int = 0
const _EXIT_COL: int = 1
const _EXIT_ROW: int = 4

const _PLAYER_SPEED: float = 200.0
const _PLAYER_RADIUS: float = 14.0
const _COLLECT_DIST: float = 24.0
const _COLLECT_TIME: float = 1.5
const _FRAG_RADIUS: float = 9.0

# ─── Pac-Man palette ──────────────────────────────────────────────────────────
const _C_BG: Color           = Color(0.00, 0.00, 0.00)          # arcade black
const _C_FLOOR: Color        = Color(0.01, 0.01, 0.06)          # dark corridor
const _C_ENTRY: Color        = Color(0.01, 0.03, 0.12)          # entry tint
const _C_EXIT: Color         = Color(0.01, 0.08, 0.03)          # exit tint
const _C_BORDER: Color       = Color(0.12, 0.28, 0.98)          # classic Pac-Man blue
const _C_WALL_CLOSED: Color  = Color(0.08, 0.18, 0.75)          # solid blue wall
const _C_WALL_CLOSING: Color = Color(0.90, 0.10, 0.05)          # danger red
const _C_WALL_OPEN: Color    = Color(0.00, 0.00, 0.00, 0.00)    # invisible (open corridor)
const _C_WALL_OPENING: Color = Color(0.15, 0.80, 0.30)          # safe green
const _C_PACMAN: Color       = Color(1.00, 0.90, 0.00)          # Pac-Man yellow
const _C_PELLET: Color       = Color(1.00, 0.95, 0.85)          # pellet white
const _C_GHOST_BLINKY: Color = Color(1.00, 0.10, 0.10)          # red
const _C_GHOST_PINKY: Color  = Color(1.00, 0.60, 0.85)          # pink
const _C_GHOST_INKY: Color   = Color(0.20, 0.90, 0.95)          # cyan
const _C_GHOST_CLYDE: Color  = Color(1.00, 0.60, 0.10)          # orange

# ─────────────────────── Inner: DynWall ────────────────────────────────────────
class _DynWall:
	enum State { OPEN, CLOSING, CLOSED, OPENING }

	var rect: Rect2
	var state: State = State.CLOSED
	var phase_dur: float = 0.0   # total duration of current phase (public for drawing)

	var _timer: float = 0.0
	var _open_dur: float = 0.0
	var _closed_dur: float = 0.0
	var _pushed: bool = false    # one-shot push flag per close cycle

	func setup(r: Rect2, seed_val: float) -> void:
		rect = r
		_open_dur = randf_range(GameConfig.MAZE_WALL_OPEN_MIN, GameConfig.MAZE_WALL_OPEN_MAX)
		_closed_dur = randf_range(GameConfig.MAZE_WALL_CLOSED_MIN, GameConfig.MAZE_WALL_CLOSED_MAX)
		# Stagger initial phase so walls don't all sync
		var p := fmod(absf(seed_val), 1.0)
		if p < 0.5:
			state = State.CLOSED
			_timer = _closed_dur * p * 2.0
			phase_dur = _closed_dur
		else:
			state = State.OPEN
			_timer = _open_dur * (p - 0.5) * 2.0
			phase_dur = _open_dur

	func update(delta: float) -> bool:
		## Returns true when state transitions.
		_timer += delta
		match state:
			State.OPEN:
				_pushed = false
				if _timer >= phase_dur - GameConfig.MAZE_WARNING_CLOSE_TIME:
					_transition(State.CLOSING, GameConfig.MAZE_WARNING_CLOSE_TIME)
					return true
			State.CLOSING:
				if _timer >= phase_dur:
					_closed_dur = randf_range(GameConfig.MAZE_WALL_CLOSED_MIN, GameConfig.MAZE_WALL_CLOSED_MAX)
					_transition(State.CLOSED, _closed_dur)
					return true
			State.CLOSED:
				if _timer >= phase_dur - GameConfig.MAZE_WARNING_OPEN_TIME:
					_transition(State.OPENING, GameConfig.MAZE_WARNING_OPEN_TIME)
					return true
			State.OPENING:
				if _timer >= phase_dur:
					_open_dur = randf_range(GameConfig.MAZE_WALL_OPEN_MIN, GameConfig.MAZE_WALL_OPEN_MAX)
					_transition(State.OPEN, _open_dur)
					return true
		return false

	func _transition(s: State, dur: float) -> void:
		state = s
		_timer = 0.0
		phase_dur = dur

	func is_passable() -> bool:
		return state == State.OPEN or state == State.CLOSING or state == State.OPENING

	func is_blocking() -> bool:
		return state == State.CLOSED   # CLOSING = warning period; passage still open (GDD 3.2)

	func get_progress() -> float:
		if phase_dur <= 0.0:
			return 0.0
		return clampf(_timer / phase_dur, 0.0, 1.0)

	func get_remaining() -> float:
		return maxf(0.0, phase_dur - _timer)

	func check_push(player_pos: Vector2) -> bool:
		## Returns true exactly once when the player should be pushed out (1 s before closing).
		if state == State.CLOSING and not _pushed and get_remaining() < 1.0:
			if rect.grow(4.0).has_point(player_pos):
				_pushed = true
				return true
		return false

# ─────────────────────── Inner: Fragment ──────────────────────────────────────
class _Fragment:
	var pos: Vector2
	var collected: bool = false
	var collecting: bool = false
	var collect_timer: float = 0.0

	func setup(p: Vector2) -> void:
		pos = p

# ─────────────────────── Inner: Sentinel ──────────────────────────────────────
class _Sentinel:
	var pos: Vector2
	var alive: bool = true
	var _hit_cooldown: float = 0.0
	var _wander_dir: Vector2 = Vector2.RIGHT
	var _wander_timer: float = 0.0

	func setup(start: Vector2) -> void:
		pos = start
		_wander_dir = Vector2(randf_range(-1.0, 1.0), randf_range(-1.0, 1.0)).normalized()
		_wander_timer = randf_range(1.0, 3.0)

	func update(delta: float, player_pos: Vector2, walls: Array) -> bool:
		## Returns true if the sentinel hit the player this frame.
		if not alive:
			return false
		_hit_cooldown = maxf(0.0, _hit_cooldown - delta)

		var to_player := player_pos - pos
		var dist := to_player.length()
		var move_dir: Vector2
		if dist < 220.0:
			move_dir = to_player.normalized()
		else:
			_wander_timer -= delta
			if _wander_timer <= 0.0:
				_wander_timer = randf_range(1.5, 4.0)
				_wander_dir = Vector2(randf_range(-1.0, 1.0), randf_range(-1.0, 1.0)).normalized()
			move_dir = _wander_dir

		var new_pos := pos + move_dir * GameConfig.MAZE_SENTINEL_SPEED * delta
		var blocked := false
		for wall in walls:
			if wall.is_blocking() and wall.rect.grow(-1.0).has_point(new_pos):
				blocked = true
				break
		if not blocked:
			pos = new_pos
		else:
			_wander_dir = Vector2(randf_range(-1.0, 1.0), randf_range(-1.0, 1.0)).normalized()

		if dist < 20.0 and _hit_cooldown <= 0.0:
			_hit_cooldown = 1.5
			return true
		return false

# ─────────────────────── Inner: HUD ───────────────────────────────────────────
class _MazeHUD:
	var _layer: CanvasLayer
	var _hp_lbl: Label
	var _bag_lbl: Label

	func setup(parent: Node) -> void:
		_layer = CanvasLayer.new()
		_layer.layer = 20
		parent.add_child(_layer)

		var bg := ColorRect.new()
		bg.color = Color(0.0, 0.0, 0.0, 0.90)
		bg.size = Vector2(480.0, 48.0)
		_layer.add_child(bg)

		_hp_lbl = Label.new()
		_hp_lbl.position = Vector2(10.0, 10.0)
		_hp_lbl.add_theme_font_size_override("font_size", 18)
		_hp_lbl.modulate = Color(1.00, 0.90, 0.00)   # Pac-Man yellow
		_layer.add_child(_hp_lbl)

		_bag_lbl = Label.new()
		_bag_lbl.position = Vector2(245.0, 10.0)
		_bag_lbl.add_theme_font_size_override("font_size", 18)
		_bag_lbl.modulate = Color(1.00, 0.95, 0.85)  # pellet white
		_layer.add_child(_bag_lbl)

	func refresh(hp: int, bag: int, cap: int) -> void:
		_hp_lbl.text = "LIVES  %d / %d" % [hp, GameConfig.MAZE_PLAYER_HP]
		_bag_lbl.text = "PELLETS  %d / %d" % [bag, cap]

# ─────────────────────── Scene state ──────────────────────────────────────────
var _player_pos: Vector2 = Vector2.ZERO
var _player_hp: int = GameConfig.MAZE_PLAYER_HP
var _drag_target: Vector2 = Vector2.ZERO
var _dragging: bool = false

var _backpack: Array[String] = []
var _bag_cap: int = 3

var _walls: Array = []        # Array[_DynWall]
var _static_gaps: Array = []  # Array[Rect2] — center col vertical passages (always open)
var _fragments: Array = []    # Array[_Fragment]
var _sentinels: Array = []    # Array[_Sentinel]
var _room_rects: Array = []   # Array[Rect2]

var _collecting_idx: int = -1
var _exit_rect: Rect2 = Rect2()
var _run_ended: bool = false
var _victory: bool = false
var _damage_flash: float = 0.0
var _hud = null  # _MazeHUD

# ─── Pac-Man animation state ──────────────────────────────────────────────────
var _player_dir: Vector2 = Vector2.RIGHT   # mouth direction
var _mouth_anim: float = 0.0               # 0.0=closed 1.0=open
var _ghost_anim: float = 0.0              # ghost bob timer

# ─────────────────────── Helpers ──────────────────────────────────────────────
func _room_rect(col: int, row: int) -> Rect2:
	return Rect2(
		_MARGIN_X + col * _COL_STEP,
		_MARGIN_Y + row * _ROW_STEP,
		_ROOM_W, _ROOM_H
	)

func _room_center(col: int, row: int) -> Vector2:
	var r := _room_rect(col, row)
	return r.position + r.size * 0.5

func _is_walkable(pt: Vector2) -> bool:
	for r: Rect2 in _room_rects:
		if r.grow(-1.0).has_point(pt):
			return true
	for g: Rect2 in _static_gaps:
		if g.has_point(pt):
			return true
	for wall in _walls:
		if wall.is_passable() and wall.rect.has_point(pt):
			return true
	return false

# ─────────────────────── _ready ───────────────────────────────────────────────
func _ready() -> void:
	GameState.start_run()
	_bag_cap = HubState.get_backpack_capacity()
	_build_layout()
	_player_pos = _room_center(_ENTRY_COL, _ENTRY_ROW)
	_exit_rect = _room_rect(_EXIT_COL, _EXIT_ROW)

	var hud := _MazeHUD.new()
	hud.setup(self)
	_hud = hud
	hud.refresh(_player_hp, 0, _bag_cap)
	queue_redraw()

# ─────────────────────── Layout builder ───────────────────────────────────────
func _build_layout() -> void:
	for row in _ROWS:
		for col in _COLS:
			_room_rects.append(_room_rect(col, row))

	# Center column (col 1) vertical gaps — STATIC OPEN (guaranteed path Entry→Exit)
	for row in range(_ROWS - 1):
		_static_gaps.append(Rect2(
			_MARGIN_X + 1 * _COL_STEP,
			_MARGIN_Y + row * _ROW_STEP + _ROOM_H,
			_ROOM_W, _GAP
		))

	# Horizontal connections (all dynamic)
	for row in _ROWS:
		for col in [0, 1]:   # col → col+1
			var rx: float = _MARGIN_X + col * _COL_STEP + _ROOM_W
			var ry: float = _MARGIN_Y + row * _ROW_STEP
			var w := _DynWall.new()
			w.setup(Rect2(rx, ry, _GAP, _ROOM_H),
				float(row * 10 + col) * 1.37 + 0.5)
			_walls.append(w)

	# Col 0 and col 2 vertical connections (all dynamic)
	for row in range(_ROWS - 1):
		for col in [0, 2]:
			var rx: float = _MARGIN_X + col * _COL_STEP
			var ry: float = _MARGIN_Y + row * _ROW_STEP + _ROOM_H
			var w := _DynWall.new()
			w.setup(Rect2(rx, ry, _ROOM_W, _GAP),
				float(row * 10 + col) * 0.91 + 2.3)
			_walls.append(w)

	# Fragment placement (8 total)
	# 1 on the guaranteed center path
	_add_frag(_room_center(1, 2))
	# 7 in side rooms behind dynamic walls
	_add_frag(_room_center(2, 0))
	_add_frag(_room_center(0, 1) + Vector2(15.0, 0.0))
	_add_frag(_room_center(0, 1) - Vector2(15.0, 0.0))
	_add_frag(_room_center(2, 2))
	_add_frag(_room_center(0, 3) + Vector2(15.0, 0.0))
	_add_frag(_room_center(0, 3) - Vector2(15.0, 0.0))
	_add_frag(_room_center(2, 4))

func _add_frag(pos: Vector2) -> void:
	var f := _Fragment.new()
	f.setup(pos)
	_fragments.append(f)

# ─────────────────────── _process ─────────────────────────────────────────────
func _process(delta: float) -> void:
	if _run_ended:
		return
	if GameState.current_state != GameState.RunState.PLAYING:
		return

	_damage_flash = maxf(0.0, _damage_flash - delta * 3.0)
	_mouth_anim = (sin(Time.get_ticks_msec() * 0.008) + 1.0) * 0.5
	_ghost_anim += delta

	# Update walls
	for wall in _walls:
		var changed: bool = wall.update(delta)
		if changed and wall.state == _DynWall.State.OPEN:
			# 30% chance to spawn a sentinel from newly opened passage
			if randf() < 0.30 and _sentinels.size() < 5:
				var s := _Sentinel.new()
				s.setup(wall.rect.get_center())
				_sentinels.append(s)
		# One-shot push + damage when wall closes on player
		if wall.check_push(_player_pos):
			_take_damage(1)
			_push_from_wall(wall)

	# Fragment collection
	if _collecting_idx >= 0:
		var f = _fragments[_collecting_idx]
		if _player_pos.distance_to(f.pos) > _COLLECT_DIST + 8.0:
			# Player walked away — cancel
			f.collecting = false
			f.collect_timer = 0.0
			_collecting_idx = -1
		else:
			f.collect_timer += delta
			if f.collect_timer >= _COLLECT_TIME:
				if _backpack.size() < _bag_cap:
					_backpack.append("fragmentos_estruturais")
				f.collected = true
				f.collecting = false
				_collecting_idx = -1
				_hud.refresh(_player_hp, _backpack.size(), _bag_cap)
	else:
		if _backpack.size() < _bag_cap:
			for i in _fragments.size():
				var f = _fragments[i]
				if f.collected or f.collecting:
					continue
				if _player_pos.distance_to(f.pos) < _COLLECT_DIST:
					f.collecting = true
					f.collect_timer = 0.0
					_collecting_idx = i
					break

	# Sentinels
	var to_remove: Array[int] = []
	for i in _sentinels.size():
		var s = _sentinels[i]
		if s.update(delta, _player_pos, _walls):
			_take_damage(1)
		if not s.alive:
			to_remove.append(i)
	for i in range(to_remove.size() - 1, -1, -1):
		_sentinels.remove_at(to_remove[i])

	# Exit check (shrink slightly so player must be clearly inside)
	if _exit_rect.grow(-10.0).has_point(_player_pos):
		_end_run(true)

	queue_redraw()


func _push_from_wall(wall) -> void:
	var center: Vector2 = wall.rect.get_center()
	var dir: Vector2 = _player_pos - center
	if dir.length() < 0.1:
		dir = Vector2(0.0, -1.0)
	_player_pos += dir.normalized() * 40.0
	# Clamp to maze bounds so the push never sends the player off-screen
	_player_pos = _player_pos.clamp(
		Vector2(_MARGIN_X + _PLAYER_RADIUS, _MARGIN_Y + _PLAYER_RADIUS),
		Vector2(_MARGIN_X + _COLS * _COL_STEP - _PLAYER_RADIUS,
				_MARGIN_Y + _ROWS * _ROW_STEP - _PLAYER_RADIUS))


func _take_damage(amount: int) -> void:
	if _player_hp <= 0 or _run_ended:
		return
	_player_hp -= amount
	_damage_flash = 1.0
	_hud.refresh(_player_hp, _backpack.size(), _bag_cap)
	if _player_hp <= 0:
		_end_run(false)


func _end_run(victory: bool) -> void:
	if _run_ended:
		return
	_run_ended = true
	_victory = victory
	if victory:
		HubState.deposit_backpack(_backpack)
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
	_player_dir = dir.normalized()  # track for Pac-Man mouth
	var new_pos := _player_pos + dir.normalized() * _PLAYER_SPEED * delta
	# Block through closed walls
	var blocked := false
	for wall in _walls:
		if wall.is_blocking() and wall.rect.grow(-2.0).has_point(new_pos):
			blocked = true
			break
	# Block outside walkable area
	if not blocked and not _is_walkable(new_pos):
		blocked = true
	if not blocked:
		_player_pos = new_pos
		queue_redraw()

# ─────────────────────── Drawing ──────────────────────────────────────────────
func _draw() -> void:
	_draw_bg()
	_draw_static_gaps()
	_draw_rooms()
	_draw_walls()
	_draw_fragments()
	_draw_sentinels()
	_draw_player()
	if _run_ended:
		_draw_end_overlay()


func _draw_bg() -> void:
	draw_rect(Rect2(Vector2.ZERO, Vector2(480.0, 854.0)), _C_BG)  # pure black


func _draw_static_gaps() -> void:
	for g: Rect2 in _static_gaps:
		draw_rect(g, _C_FLOOR)  # dark corridor, no border = open passage


func _draw_rooms() -> void:
	for i in _room_rects.size():
		var r: Rect2 = _room_rects[i]
		var col_r: int = i % _COLS
		var row_r: int = i / _COLS
		var is_exit := col_r == _EXIT_COL and row_r == _EXIT_ROW
		var is_entry := col_r == _ENTRY_COL and row_r == _ENTRY_ROW
		var floor_c: Color
		if is_exit:
			floor_c = _C_EXIT
		elif is_entry:
			floor_c = _C_ENTRY
		else:
			floor_c = _C_FLOOR
		draw_rect(r, floor_c)
		# Thick bright-blue border — classic Pac-Man maze wall feel
		draw_rect(r, _C_BORDER, false, 3.0)
		draw_rect(r, Color(_C_BORDER.r, _C_BORDER.g, _C_BORDER.b, 0.35), false, 6.0)

	# Arcade-style labels
	var ec := _room_center(_ENTRY_COL, _ENTRY_ROW)
	draw_string(ThemeDB.fallback_font, ec + Vector2(0.0, -30.0), "READY!",
		HORIZONTAL_ALIGNMENT_CENTER, -1, 11, Color(0.12, 0.28, 0.98, 0.90))
	var xc := _room_center(_EXIT_COL, _EXIT_ROW)
	draw_string(ThemeDB.fallback_font, xc + Vector2(0.0, 8.0), "EXIT",
		HORIZONTAL_ALIGNMENT_CENTER, -1, 14, Color(0.30, 1.00, 0.30, 0.90))


func _draw_walls() -> void:
	for wall in _walls:
		var r: Rect2 = wall.rect
		var remaining: float = wall.get_remaining()
		var progress: float = wall.get_progress()
		match wall.state:
			_DynWall.State.OPEN:
				# Invisible — open corridor space, no fill needed
				pass
			_DynWall.State.CLOSING:
				# Blue wall fading in with red danger pulse
				var fade := progress
				draw_rect(r, Color(_C_WALL_CLOSED.r, _C_WALL_CLOSED.g, _C_WALL_CLOSED.b, fade))
				var pulse := 0.5 + 0.5 * sin(Time.get_ticks_msec() * 0.010)
				draw_rect(r, Color(1.0, 0.10, 0.05, 0.85 * pulse), false, 3.0)
				_draw_timer_arc(r, remaining, wall.phase_dur, Color(1.00, 0.15, 0.05, 0.95))
			_DynWall.State.CLOSED:
				# Solid Pac-Man blue wall with bright border
				draw_rect(r, _C_WALL_CLOSED)
				draw_rect(r, _C_BORDER, false, 2.5)
				draw_rect(r, Color(_C_BORDER.r, _C_BORDER.g, _C_BORDER.b, 0.30), false, 5.0)
			_DynWall.State.OPENING:
				# Blue wall fading out with green safe indicator
				var fade := 1.0 - progress
				draw_rect(r, Color(_C_WALL_CLOSED.r, _C_WALL_CLOSED.g, _C_WALL_CLOSED.b, fade))
				draw_rect(r, Color(0.20, 0.95, 0.35, 0.85), false, 2.5)
				_draw_timer_arc(r, remaining, wall.phase_dur, Color(0.20, 1.00, 0.35, 0.95))


func _draw_timer_arc(r: Rect2, remaining: float, total: float, col: Color) -> void:
	if total <= 0.0:
		return
	var cx := r.position.x + r.size.x * 0.5
	var cy := r.position.y + r.size.y * 0.5
	var ratio := clampf(remaining / total, 0.0, 1.0)
	var radius := clampf(minf(r.size.x, r.size.y) * 0.35 + 2.0, 5.0, 12.0)
	draw_arc(Vector2(cx, cy), radius, -PI * 0.5, -PI * 0.5 + TAU * ratio, 16, col, 2.0)


func _draw_fragments() -> void:
	for i in _fragments.size():
		var f = _fragments[i]
		if f.collected:
			continue
		var is_power := (i == 0)  # index 0 = center guaranteed fragment = power pellet
		if is_power:
			# Power pellet: large, pulsing white
			var pulse := 0.7 + 0.3 * sin(Time.get_ticks_msec() * 0.006)
			var pr := _FRAG_RADIUS * 1.8 * pulse
			draw_circle(f.pos, pr, _C_PELLET)
			if f.collecting:
				var p := clampf(f.collect_timer / _COLLECT_TIME, 0.0, 1.0)
				draw_arc(f.pos, pr + 6.0, -PI * 0.5, -PI * 0.5 + TAU * p,
					32, _C_PACMAN, 3.0)
		else:
			# Regular pellet: small white dot
			var alpha := 0.35 if f.collecting else 1.0
			draw_circle(f.pos, _FRAG_RADIUS * 0.52, Color(_C_PELLET.r, _C_PELLET.g, _C_PELLET.b, alpha))
			if f.collecting:
				var p := clampf(f.collect_timer / _COLLECT_TIME, 0.0, 1.0)
				draw_arc(f.pos, _FRAG_RADIUS + 5.0, -PI * 0.5, -PI * 0.5 + TAU * p,
					32, Color(1.0, 1.0, 0.5, 0.95), 2.5)


func _draw_sentinels() -> void:
	var ghost_palette := [_C_GHOST_BLINKY, _C_GHOST_PINKY, _C_GHOST_INKY, _C_GHOST_CLYDE]
	for i in _sentinels.size():
		var s = _sentinels[i]
		if not s.alive:
			continue
		_draw_ghost(s.pos, 11.0, ghost_palette[i % ghost_palette.size()])


func _draw_ghost(pos: Vector2, radius: float, color: Color) -> void:
	var r := radius
	var bob := sin(_ghost_anim * 3.5) * 1.5
	var cx := pos.x
	var cy := pos.y + bob
	var dome_cy := cy - r * 0.3

	# Ghost body polygon: top dome arc + right side + scalloped bottom + left side auto-closes
	var pts := PackedVector2Array()
	# Top semicircle: from left (PI) over the top (1.5*PI) to right (2*PI)
	for i in 13:
		var a := PI + float(i) / 12.0 * PI
		pts.append(Vector2(cx + cos(a) * r, dome_cy + sin(a) * r))
	# Right side down
	var bottom_y := cy + r * 0.9
	pts.append(Vector2(cx + r, bottom_y))
	# Scalloped bottom: 3 bumps right→left
	var bump_w := r * 2.0 / 3.0
	var bump_h := r * 0.35
	for b in 3:
		var bx_mid := cx + r - bump_w * (float(b) + 0.5)
		var bx_left := cx + r - bump_w * float(b + 1)
		pts.append(Vector2(bx_mid, bottom_y + bump_h))
		pts.append(Vector2(bx_left, bottom_y))
	# Left side auto-closes back to first arc point
	draw_colored_polygon(pts, color)

	# White eyes with blue pupils
	var eye_y := dome_cy - r * 0.05
	for ex in [cx - r * 0.32, cx + r * 0.32]:
		draw_circle(Vector2(ex, eye_y), r * 0.22, Color(1.0, 1.0, 1.0))
		draw_circle(Vector2(ex + r * 0.07, eye_y), r * 0.12, Color(0.10, 0.10, 0.85))


func _draw_player() -> void:
	if _damage_flash > 0.5:
		# Flash white when hit
		draw_circle(_player_pos, _PLAYER_RADIUS, Color(1.0, 1.0, 1.0))
		return

	var facing := _player_dir.angle()
	var mouth_half := _mouth_anim * (PI / 5.5)  # max ~33 degrees half-opening

	# Pac-Man body polygon: center + arc from lower-jaw to upper-jaw (the long way around)
	var pts := PackedVector2Array()
	pts.append(_player_pos)
	var start_a := facing + mouth_half
	var end_a := facing + TAU - mouth_half
	var steps := 20
	for i in range(steps + 1):
		var a := start_a + (end_a - start_a) * float(i) / float(steps)
		pts.append(_player_pos + Vector2(cos(a), sin(a)) * _PLAYER_RADIUS)
	draw_colored_polygon(pts, _C_PACMAN)

	# Eye (offset up-perpendicular from facing direction)
	var eye_angle := facing - PI * 0.30
	var eye_pos := _player_pos + Vector2(cos(eye_angle), sin(eye_angle)) * _PLAYER_RADIUS * 0.45
	draw_circle(eye_pos, _PLAYER_RADIUS * 0.12, Color(0.0, 0.0, 0.0))


func _draw_end_overlay() -> void:
	draw_rect(Rect2(Vector2.ZERO, Vector2(480.0, 854.0)), Color(0.0, 0.0, 0.0, 0.82))
	if _victory:
		draw_string(ThemeDB.fallback_font, Vector2(240.0, 375.0), "STAGE  CLEAR!",
			HORIZONTAL_ALIGNMENT_CENTER, -1, 32, _C_PACMAN)
		draw_string(ThemeDB.fallback_font, Vector2(240.0, 425.0),
			"PELLETS  %d" % _backpack.size(),
			HORIZONTAL_ALIGNMENT_CENTER, -1, 22, _C_PELLET)
	else:
		draw_string(ThemeDB.fallback_font, Vector2(240.0, 390.0), "GAME  OVER",
			HORIZONTAL_ALIGNMENT_CENTER, -1, 36, Color(1.00, 0.10, 0.10))
