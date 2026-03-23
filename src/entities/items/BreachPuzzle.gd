## BreachPuzzle — Cyberpunk-style breach protocol minigame (CanvasLayer).
## A 6×6 grid of hex codes. Player selects codes alternating row→col→row→...
## Must match the 3-code target sequence before the 20-second timer expires.
##
## Usage:
##   var puzzle := BreachPuzzle.new()
##   add_child(puzzle)
##   puzzle.puzzle_completed.connect(_on_hacked)
##   puzzle.puzzle_failed.connect(_on_failed)
##   puzzle.open()
class_name BreachPuzzle
extends CanvasLayer

signal puzzle_completed
signal puzzle_failed

const GRID_SIZE: int = 6
const CODES: Array[String] = ["1C", "7A", "BD", "E9", "FF", "55"]
const TARGET_LENGTH: int = 3
const CELL_SIZE: float = 52.0
const CELL_GAP: float = 6.0

## Panel layout — fits inside 480×854 viewport
const PANEL_W: float = 440.0
const PANEL_H: float = 530.0
const PANEL_X: float = 20.0
const PANEL_Y: float = 162.0
## Grid offset from panel top-left corner
const GRID_LEFT: float = 49.0
const GRID_TOP: float = 90.0

var _time_remaining: float = 0.0
var _grid: Array = []               # Array[Array[String]], 6×6
var _target: Array[String] = []     # 3 codes to match
var _buffer: Array[String] = []     # player's selections so far
var _selected_cells: Array[Vector2i] = []

## Selection alternates: constrained to a row, then a column, then a row...
var _constraint_is_row: bool = true
var _constraint_index: int = 0

var _done: bool = false
var _success: bool = false
var _panel: _PuzzlePanel


func open() -> void:
	layer = 10
	_time_remaining = GameConfig.HACK_PUZZLE_TIME
	_done = false
	_success = false
	_grid = _generate_grid()
	_target = _generate_target_from_grid()
	_buffer = []
	_selected_cells = []
	_constraint_is_row = true
	_constraint_index = 0

	_panel = _PuzzlePanel.new()
	_panel.breach = self
	_panel.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	_panel.mouse_filter = Control.MOUSE_FILTER_STOP
	add_child(_panel)
	visible = true


func close() -> void:
	visible = false
	if _panel and is_instance_valid(_panel):
		_panel.queue_free()
		_panel = null


func _process(delta: float) -> void:
	if not visible or _done:
		return
	_time_remaining = maxf(0.0, _time_remaining - delta)
	if _panel and is_instance_valid(_panel):
		_panel.queue_redraw()
	if _time_remaining <= 0.0:
		_finish(false)


# ── Grid generation ────────────────────────────────────────────────────────────

func _generate_grid() -> Array:
	var g: Array = []
	for _r: int in GRID_SIZE:
		var row: Array[String] = []
		for _c: int in GRID_SIZE:
			row.append(CODES[randi() % CODES.size()])
		g.append(row)
	return g


func _generate_target_from_grid() -> Array[String]:
	## Traces a valid alternating path so the puzzle is always solvable.
	## Path: any cell in row 0 → any cell in that column → any cell in that row.
	var col0: int = randi() % GRID_SIZE
	var row1: int = randi() % GRID_SIZE
	var col2: int = randi() % GRID_SIZE
	var t: Array[String] = []
	t.append((_grid[0] as Array[String])[col0])
	t.append((_grid[row1] as Array[String])[col0])
	t.append((_grid[row1] as Array[String])[col2])
	return t


# ── Selection logic ────────────────────────────────────────────────────────────

func select_cell(row: int, col: int) -> void:
	if _done:
		return
	## Validate against current constraint
	if _constraint_is_row and row != _constraint_index:
		return
	if not _constraint_is_row and col != _constraint_index:
		return
	## Disallow re-selecting a cell
	for sc: Vector2i in _selected_cells:
		if sc.x == row and sc.y == col:
			return

	_selected_cells.append(Vector2i(row, col))
	_buffer.append((_grid[row] as Array[String])[col])

	## Toggle constraint for next move
	_constraint_is_row = not _constraint_is_row
	_constraint_index = col if not _constraint_is_row else row

	## Check sliding window for target match
	if _buffer.size() >= TARGET_LENGTH:
		var tail: Array = _buffer.slice(_buffer.size() - TARGET_LENGTH)
		if tail == _target:
			_finish(true)
			return

	## Too many moves without a match
	if _buffer.size() >= GRID_SIZE * 2:
		_finish(false)


func _finish(success: bool) -> void:
	if _done:
		return
	_done = true
	_success = success
	if _panel and is_instance_valid(_panel):
		_panel.queue_redraw()
	## Brief pause so the player sees the result before the panel closes
	var timer := get_tree().create_timer(1.2)
	timer.timeout.connect(func() -> void:
		close()
		if _success:
			puzzle_completed.emit()
		else:
			puzzle_failed.emit()
	)


# ══════════════════════════════════════════════════════════════════════════════
# Inner Control — handles all drawing and input for the puzzle panel
# ══════════════════════════════════════════════════════════════════════════════

class _PuzzlePanel extends Control:
	var breach: BreachPuzzle = null

	## ── Drawing ───────────────────────────────────────────────────────────────

	func _draw() -> void:
		if breach == null:
			return
		var font := ThemeDB.fallback_font
		var pw: float = BreachPuzzle.PANEL_W
		var ph: float = BreachPuzzle.PANEL_H
		var px: float = BreachPuzzle.PANEL_X
		var py: float = BreachPuzzle.PANEL_Y

		## Dim the background
		draw_rect(Rect2(0.0, 0.0, 480.0, 854.0), Color(0.0, 0.0, 0.0, 0.80))

		## Panel background
		draw_rect(Rect2(px, py, pw, ph), Color(0.035, 0.05, 0.07))
		var border_col: Color
		if breach._done:
			border_col = Color(0.2, 1.0, 0.4) if breach._success else Color(1.0, 0.2, 0.2)
		else:
			border_col = Color(0.45, 0.9, 0.15)
		draw_rect(Rect2(px, py, pw, ph), border_col, false, 2.0)

		## Timer header
		var ratio: float = breach._time_remaining / GameConfig.HACK_PUZZLE_TIME
		var tcol := Color(ratio * 0.5 + 0.5, ratio * 0.9, 0.1)
		_draw_header(font, px, py, pw, ratio, tcol)

		## "CODE MATRIX" title bar
		draw_rect(Rect2(px, py + 50.0, pw, 32.0), Color(0.06, 0.13, 0.04))
		draw_rect(Rect2(px, py + 50.0, pw, 32.0), Color(0.3, 0.6, 0.1), false, 1.0)
		draw_string(font, Vector2(px + 14.0, py + 71.0), "CODE MATRIX",
			HORIZONTAL_ALIGNMENT_LEFT, -1, 14, Color(0.55, 1.0, 0.25))

		## Grid
		var gox: float = px + BreachPuzzle.GRID_LEFT
		var goy: float = py + BreachPuzzle.GRID_TOP
		_draw_grid(font, gox, goy)

		## Buffer slots
		var buf_y: float = goy + BreachPuzzle.GRID_SIZE * (BreachPuzzle.CELL_SIZE + BreachPuzzle.CELL_GAP) + 10.0
		_draw_buffer(font, px, buf_y, pw)

		## Target sequence
		_draw_target(font, px, buf_y + 52.0, pw)

		## Result overlay
		if breach._done:
			var msg: String = "ACESSO CONCEDIDO" if breach._success else "FALHA NO BREACH"
			var mc: Color = Color(0.15, 1.0, 0.4) if breach._success else Color(1.0, 0.2, 0.2)
			draw_rect(Rect2(px + 40.0, py + ph * 0.5 - 24.0, pw - 80.0, 40.0),
				Color(0.02, 0.04, 0.02))
			draw_rect(Rect2(px + 40.0, py + ph * 0.5 - 24.0, pw - 80.0, 40.0),
				mc, false, 1.5)
			draw_string(font, Vector2(px + pw * 0.5 - 84.0, py + ph * 0.5 + 4.0),
				msg, HORIZONTAL_ALIGNMENT_LEFT, -1, 20, mc)


	func _draw_header(font: Font, px: float, py: float, pw: float,
			_ratio: float, tcol: Color) -> void:
		draw_string(font, Vector2(px + 12.0, py + 26.0), "BREACH TIME REMAINING",
			HORIZONTAL_ALIGNMENT_LEFT, -1, 12, Color(0.75, 0.88, 0.55))
		## Timer box (right side)
		var bw: float = 80.0
		var bx: float = px + pw - bw - 10.0
		draw_rect(Rect2(bx, py + 8.0, bw, 28.0), Color(0.05, 0.08, 0.03))
		draw_rect(Rect2(bx, py + 8.0, bw, 28.0), tcol, false, 1.5)
		var ts: String = "%.2f" % maxf(0.0, breach._time_remaining)
		draw_string(font, Vector2(bx + 8.0, py + 28.0), ts,
			HORIZONTAL_ALIGNMENT_LEFT, -1, 16, tcol)


	func _draw_grid(font: Font, ox: float, oy: float) -> void:
		var gs: int = BreachPuzzle.GRID_SIZE
		var cs: float = BreachPuzzle.CELL_SIZE
		var cg: float = BreachPuzzle.CELL_GAP
		var ci: bool = breach._constraint_is_row
		var cx_idx: int = breach._constraint_index

		for r: int in gs:
			for c: int in gs:
				var cell_x: float = ox + c * (cs + cg)
				var cell_y: float = oy + r * (cs + cg)
				var cell_rect := Rect2(cell_x, cell_y, cs, cs)

				## Check if selected
				var is_selected: bool = false
				for sc: Vector2i in breach._selected_cells:
					if sc.x == r and sc.y == c:
						is_selected = true
						break

				## Check if in constrained row/col (highlighted)
				var is_constrained: bool = not breach._done and (
					(ci and r == cx_idx) or (not ci and c == cx_idx))

				## Background
				var bg: Color
				if is_selected:
					bg = Color(0.10, 0.10, 0.09)
				elif is_constrained:
					bg = Color(0.06, 0.14, 0.04)
				else:
					bg = Color(0.04, 0.06, 0.09)
				draw_rect(cell_rect, bg)

				## Border
				var border: Color
				if is_selected:
					border = Color(0.25, 0.25, 0.22, 0.7)
				elif is_constrained:
					border = Color(0.5, 1.0, 0.2, 0.9)
				else:
					border = Color(0.15, 0.22, 0.18, 0.55)
				draw_rect(cell_rect, border, false, 1.5)

				## Code text
				var code: String = (breach._grid[r] as Array[String])[c]
				var txt_col: Color
				if is_selected:
					txt_col = Color(0.3, 0.32, 0.28)
				elif is_constrained:
					txt_col = Color(0.75, 1.0, 0.35)
				else:
					txt_col = Color(0.38, 0.88, 0.28)
				draw_string(font, Vector2(cell_x + cs * 0.5 - 11.0, cell_y + cs * 0.5 + 6.0),
					code, HORIZONTAL_ALIGNMENT_LEFT, -1, 16, txt_col)


	func _draw_buffer(font: Font, px: float, by: float, pw: float) -> void:
		draw_string(font, Vector2(px + 12.0, by + 14.0), "BUFFER",
			HORIZONTAL_ALIGNMENT_LEFT, -1, 11, Color(0.45, 0.58, 0.35))
		var slot_w: float = 52.0
		var slot_gap: float = 8.0
		var num_slots: int = BreachPuzzle.TARGET_LENGTH + 2
		var total_w: float = num_slots * slot_w + (num_slots - 1) * slot_gap
		var sx0: float = px + (pw - total_w) * 0.5
		for i: int in num_slots:
			var sx: float = sx0 + i * (slot_w + slot_gap)
			draw_rect(Rect2(sx, by + 18.0, slot_w, 28.0), Color(0.04, 0.07, 0.04))
			draw_rect(Rect2(sx, by + 18.0, slot_w, 28.0), Color(0.28, 0.48, 0.18), false, 1.0)
			if i < breach._buffer.size():
				draw_string(font, Vector2(sx + slot_w * 0.5 - 11.0, by + 37.0),
					breach._buffer[i], HORIZONTAL_ALIGNMENT_LEFT, -1, 14,
					Color(0.6, 1.0, 0.3))


	func _draw_target(font: Font, px: float, ty: float, pw: float) -> void:
		draw_string(font, Vector2(px + 12.0, ty + 14.0), "SEQUÊNCIA ALVO:",
			HORIZONTAL_ALIGNMENT_LEFT, -1, 11, Color(0.45, 0.58, 0.35))
		var tlen: int = breach._target.size()
		var item_w: float = 52.0
		var arrow_w: float = 16.0
		var gap: float = 6.0
		var total_w: float = tlen * item_w + (tlen - 1) * (arrow_w + gap * 2.0)
		var tx0: float = px + (pw - total_w) * 0.5
		for i: int in tlen:
			var code: String = breach._target[i]
			var tx: float = tx0 + i * (item_w + arrow_w + gap * 2.0)
			draw_rect(Rect2(tx, ty + 18.0, item_w, 26.0), Color(0.06, 0.10, 0.04))
			draw_rect(Rect2(tx, ty + 18.0, item_w, 26.0), Color(0.38, 0.68, 0.18), false, 1.0)
			draw_string(font, Vector2(tx + item_w * 0.5 - 11.0, ty + 36.0),
				code, HORIZONTAL_ALIGNMENT_LEFT, -1, 14, Color(0.7, 1.0, 0.38))
			if i < tlen - 1:
				draw_string(font, Vector2(tx + item_w + gap, ty + 36.0),
					"→", HORIZONTAL_ALIGNMENT_LEFT, -1, 13, Color(0.4, 0.62, 0.28))


	## ── Input ─────────────────────────────────────────────────────────────────

	func _gui_input(event: InputEvent) -> void:
		if breach == null or breach._done:
			return
		var press_pos: Vector2 = Vector2.ZERO
		var got_press: bool = false

		if event is InputEventMouseButton:
			var mb := event as InputEventMouseButton
			if mb.pressed and mb.button_index == MOUSE_BUTTON_LEFT:
				press_pos = mb.position
				got_press = true
		elif event is InputEventScreenTouch:
			var touch := event as InputEventScreenTouch
			if touch.pressed:
				press_pos = touch.position
				got_press = true

		if not got_press:
			return

		## Hit-test each grid cell
		var ox: float = BreachPuzzle.PANEL_X + BreachPuzzle.GRID_LEFT
		var oy: float = BreachPuzzle.PANEL_Y + BreachPuzzle.GRID_TOP
		var cs: float = BreachPuzzle.CELL_SIZE
		var cg: float = BreachPuzzle.CELL_GAP
		for r: int in BreachPuzzle.GRID_SIZE:
			for c: int in BreachPuzzle.GRID_SIZE:
				var cell_rect := Rect2(ox + c * (cs + cg), oy + r * (cs + cg), cs, cs)
				if cell_rect.has_point(press_pos):
					breach.select_cell(r, c)
					queue_redraw()
					return
