## WorldMapScene — Bunker cross-section (Fallout Shelter style).
## The base is shown as underground rooms across 3 floors.
## Rooms with zone access have visible passages — click to raid.
extends Node2D

const VW: float = 480.0
const VH: float = 854.0
const SURFACE_Y: float = 72.0   # sky / ground boundary
const FLOOR_H: float = 250.0    # height of each floor strip
const WALL_T: float = 8.0       # wall thickness around rooms

# 3 equal columns — 8px margin on edges, 8px gaps between
const COL_X: Array = [8.0,  165.0, 322.0]
const COL_W: Array = [149.0, 149.0, 149.0]

# Room names [floor][col]
const ROOM_NAMES: Array = [
	["Entrada",  "Sala Comum",      "Gerador"],
	["Oficina",  "Baia do Foguete", "Comunicacoes"],
	["Deposito", "Enfermaria",      "Pesquisa"],
]

# Zone definitions — room_floor and room_col point to which room is the access point
const ZONES: Array = [
	{
		"id": 0, "name": "HORDAS", "subtitle": "Zona de combate",
		"resource": "Sucata Metalica",
		"scene": "res://src/scenes/Main.tscn",
		"color": Color(0.9, 0.3, 0.25),
		"room_floor": 0, "room_col": 0,
		"passage": "up",
	},
	{
		"id": 1, "name": "STEALTH", "subtitle": "Zona de infiltracao",
		"resource": "Comp. de IA",
		"scene": "res://src/scenes/StealthMain.tscn",
		"color": Color(0.25, 0.6, 0.9),
		"room_floor": 1, "room_col": 2,
		"passage": "right",
	},
	{
		"id": 2, "name": "CIRCUITO", "subtitle": "Zona de puzzle",
		"resource": "Nucleo Logico",
		"scene": "res://src/scenes/CircuitMain.tscn",
		"color": Color(0.4, 0.9, 0.5),
		"room_floor": 2, "room_col": 2,
		"passage": "down",
	},
	{
		"id": 3, "name": "EXTRACAO", "subtitle": "Zona de velocidade",
		"resource": "Combustivel Volatil",
		"scene": "res://src/scenes/ExtractionMain.tscn",
		"color": Color(0.95, 0.75, 0.1),
		"room_floor": 0, "room_col": 2,
		"passage": "up",
	},
	{
		"id": 4, "name": "CAMPO", "subtitle": "Zona de controle",
		"resource": "Sinais de Controle",
		"scene": "res://src/scenes/FieldControlMain.tscn",
		"color": Color(0.7, 0.3, 0.9),
		"room_floor": 1, "room_col": 0,
		"passage": "left",
	},
	{
		"id": 5, "name": "INFECCAO", "subtitle": "Zona de propagacao",
		"resource": "Biomassa Adapt.",
		"scene": "res://src/scenes/InfectionMain.tscn",
		"color": Color(0.3, 0.8, 0.4),
		"room_floor": 2, "room_col": 0,
		"passage": "down",
	},
	{
		"id": 6, "name": "LABIRINTO", "subtitle": "Zona de navegacao",
		"resource": "Frag. Estruturais",
		"scene": "res://src/scenes/MazeMain.tscn",
		"color": Color(0.8, 0.5, 0.2),
		"room_floor": 2, "room_col": 1,
		"passage": "down",
	},
	{
		"id": 7, "name": "SACRIFICIO", "subtitle": "Zona de decisao",
		"resource": "Sucata + Comp. IA",
		"scene": "res://src/scenes/SacrificeMain.tscn",
		"color": Color(0.9, 0.2, 0.55),
		"room_floor": 0, "room_col": 1,
		"passage": "up",
	},
]

# Diálogos do Dr. Valério antes de cada zona
const ZONE_DIALOGUE: Dictionary = {
	0: "\"Patrulha de IA no Setor 7. Têm sucata lá... valem o risco? Bom, claro que valem!\"\n— Dr. Valério",
	1: "\"Instalação de processamento de IA. Alta segurança. Mas os componentes lá dentro são imprescindíveis.\"\n— Dr. Valério",
	2: "\"Câmaras de circuito integrado. Placas lógicas intactas! Basta não pisar nos alarmes. Fácil.\"\n— Dr. Valério",
	3: "\"Depósito de combustível. Sessenta segundos antes de colapsar. Cronômetro sorrindo para mim.\"\n— Dr. Valério",
	4: "\"Zona de transmissão. A IA controla o território por sinais. Temos que perturbá-los. Gentilmente.\"\n— Dr. Valério",
	5: "\"Laboratório bioprogramável. A IA criou isso para controlar organismos. Nós vamos reapropriá-lo.\"\n— Dr. Valério",
	6: "\"Complexo subterrâneo abandonado. Drones de patrulha ainda operacionais. Os corredores são um labirinto.\"\n— Dr. Valério",
	7: "\"Centro de detenção da IA. Recursos e sobreviventes? Cada segundo lá dentro tem um preço.\"\n— Dr. Valério",
}

var _detail_layer: CanvasLayer
var _zone_name_lbl: Label
var _zone_res_lbl: Label
var _zone_stage_lbl: Label
var _zone_dialogue_lbl: Label
var _raid_btn: Button
var _selected_zone: Dictionary = {}
var _pulse: float = 0.0
var _music: AudioStreamPlayer
var _sfx: AudioStreamPlayer


func _ready() -> void:
	_build_detail_panel()

	_music = AudioStreamPlayer.new()
	_music.stream = load("res://assets/audio/music/menu.wav")
	_music.volume_db = -8.0
	add_child(_music)
	_music.finished.connect(_music.play)
	_music.play()

	_sfx = AudioStreamPlayer.new()
	add_child(_sfx)


func _process(delta: float) -> void:
	_pulse += delta
	queue_redraw()


# ── Input ──────────────────────────────────────────────────────────────────────

func _unhandled_input(event: InputEvent) -> void:
	var tapped := false

	if event is InputEventMouseButton:
		var mb := event as InputEventMouseButton
		if mb.button_index == MOUSE_BUTTON_LEFT and mb.pressed:
			tapped = true
	if event is InputEventScreenTouch:
		var touch := event as InputEventScreenTouch
		if touch.pressed:
			tapped = true

	if not tapped:
		return

	var tap_pos := get_local_mouse_position()

	# Check zone access rooms
	for zone in ZONES:
		if not HubState.zones_unlocked[zone["id"]]:
			continue
		if _room_inner_rect(zone["room_floor"], zone["room_col"]).has_point(tap_pos):
			_show_detail(zone)
			return

	# Tap outside panel closes it
	_detail_layer.visible = false


# ── Drawing ────────────────────────────────────────────────────────────────────

func _draw() -> void:
	# Sky
	draw_rect(Rect2(0, 0, VW, SURFACE_Y), Color(0.04, 0.045, 0.08))
	_draw_city_silhouette()

	# Label de controle da IA
	var dp := 0.5 + 0.5 * sin(_pulse * 2.2)
	draw_string(ThemeDB.fallback_font, Vector2(VW * 0.5 - 90, 22),
		"⬤  ZONA IA CONTROLADA — ACESSO PROIBIDO  ⬤",
		HORIZONTAL_ALIGNMENT_LEFT, -1, 9, Color(0.20, 0.60, 0.95, 0.65 * dp))
	draw_string(ThemeDB.fallback_font, Vector2(VW * 0.5 - 60, 44),
		"SUPERFÍCIE — ZONA DE PERIGO",
		HORIZONTAL_ALIGNMENT_LEFT, -1, 10, Color(0.85, 0.3, 0.2, 0.45 * dp))
	_draw_ai_drones()

	# Surface line
	draw_line(Vector2(0, SURFACE_Y), Vector2(VW, SURFACE_Y), Color(0.3, 0.22, 0.1), 2.5)

	# Earth fill
	draw_rect(Rect2(0, SURFACE_Y, VW, VH - SURFACE_Y), Color(0.075, 0.068, 0.062))

	# Floor separators (subtle horizontal lines)
	for f in 3:
		var fy := SURFACE_Y + f * FLOOR_H
		draw_line(Vector2(0, fy), Vector2(VW, fy), Color(0.055, 0.05, 0.048), 2.0)

	# All rooms
	for floor in 3:
		for col in 3:
			_draw_room(floor, col)

	# Elevator shaft (left edge)
	_draw_elevator()

	# Zone passages (drawn on top of rooms)
	for zone in ZONES:
		_draw_passage(zone)

	# Bottom padding line
	var bottom_y := SURFACE_Y + FLOOR_H * 3
	draw_line(Vector2(0, bottom_y), Vector2(VW, bottom_y), Color(0.055, 0.05, 0.048), 2.0)

	_draw_stock_panel(bottom_y)


func _draw_ai_drones() -> void:
	## Drones de patrulha da IA pairando sobre a superfície.
	var drone_positions: Array = [
		Vector2(60.0, 30.0), Vector2(190.0, 18.0), Vector2(310.0, 28.0), Vector2(430.0, 16.0),
	]
	for i in drone_positions.size():
		var base_pos: Vector2 = drone_positions[i]
		var bob := sin(_pulse * 2.5 + float(i) * 1.3) * 3.0
		var pos := base_pos + Vector2(0.0, bob)
		var scan_alpha := 0.30 + 0.20 * sin(_pulse * 3.0 + float(i))
		# Corpo do drone
		var pts := PackedVector2Array([
			pos + Vector2(0, -6), pos + Vector2(5, 0),
			pos + Vector2(0, 4),  pos + Vector2(-5, 0),
		])
		draw_colored_polygon(pts, Color(0.20, 0.60, 0.95, 0.70))
		# Sensor
		draw_circle(pos, 1.8, Color(0.90, 0.95, 1.00, 0.90))
		# Feixe de escaneamento descendente
		draw_line(pos + Vector2(0, 4), pos + Vector2(0, 18),
			Color(0.20, 0.60, 0.95, scan_alpha), 1.5)


func _draw_city_silhouette() -> void:
	var buildings: Array = [
		Rect2(0,   10, 45, 52), Rect2(52,  22, 36, 40), Rect2(94,  6,  32, 56),
		Rect2(132, 24, 44, 38), Rect2(182, 12, 26, 50), Rect2(214, 20, 55, 42),
		Rect2(276, 5,  38, 57), Rect2(320, 18, 48, 44), Rect2(374, 14, 30, 48),
		Rect2(410, 24, 62, 38),
	]
	var bc := Color(0.055, 0.065, 0.10)
	for b in buildings:
		draw_rect(b as Rect2, bc)
	# Janelas da IA (azul frio — estruturas controladas)
	var wc_ia := Color(0.20, 0.55, 0.90, 0.40)
	var wc_warm := Color(0.65, 0.6, 0.28, 0.25)  # janelas humanas apagadas (ocupação antiga)
	for b in buildings:
		var br := b as Rect2
		if br.size.x > 38:
			draw_rect(Rect2(br.position + Vector2(6, 8), Vector2(5, 4)), wc_ia)
			draw_rect(Rect2(br.position + Vector2(6, 20), Vector2(5, 4)), wc_ia)
			if br.size.x > 50:
				draw_rect(Rect2(br.position + Vector2(22, 8), Vector2(5, 4)), wc_warm)
	# Antena IA no maior prédio (Rect2(214,20,55,42))
	var ant_x := 214.0 + 27.0
	draw_line(Vector2(ant_x, 20.0), Vector2(ant_x, 4.0), Color(0.20, 0.60, 0.95, 0.70), 1.5)
	var blink := 0.5 + 0.5 * sin(_pulse * 4.0)
	draw_circle(Vector2(ant_x, 4.0), 2.5, Color(0.90, 0.10, 0.10, blink))


func _draw_room(floor: int, col: int) -> void:
	var outer := _room_rect(floor, col)
	var inner := _room_inner_rect(floor, col)

	# Find zone for this room (if any)
	var zone_col := Color.TRANSPARENT
	var zone_unlocked := false
	var zone_name := ""
	for z in ZONES:
		if z["room_floor"] == floor and z["room_col"] == col:
			zone_col = z["color"] as Color
			zone_unlocked = HubState.zones_unlocked[z["id"]]
			zone_name = z["name"]
			break

	# Wall fill
	draw_rect(outer, Color(0.088, 0.08, 0.075))

	# Room interior
	var base_c := Color(0.115, 0.105, 0.125)
	if zone_col != Color.TRANSPARENT and zone_unlocked:
		base_c = base_c.lerp(zone_col, 0.10)
	elif zone_col != Color.TRANSPARENT and not zone_unlocked:
		base_c = Color(0.08, 0.078, 0.082)
	draw_rect(inner, base_c)

	# Glowing border for unlocked zone access rooms
	if zone_col != Color.TRANSPARENT and zone_unlocked:
		var gp := 0.5 + 0.5 * sin(_pulse * 3.2)
		var gc := Color(zone_col.r, zone_col.g, zone_col.b, 0.45 * gp)
		draw_line(inner.position, inner.position + Vector2(inner.size.x, 0), gc, 1.5)
		draw_line(inner.position, inner.position + Vector2(0, inner.size.y), gc, 1.5)
		draw_line(inner.position + Vector2(inner.size.x, 0), inner.position + inner.size, gc, 1.5)
		draw_line(inner.position + Vector2(0, inner.size.y), inner.position + inner.size, gc, 1.5)

	# Room name
	var name_c := Color(0.55, 0.5, 0.58)
	if zone_col != Color.TRANSPARENT and zone_unlocked:
		name_c = zone_col.lerp(Color.WHITE, 0.3)
	draw_string(ThemeDB.fallback_font,
		inner.position + Vector2(8, 16),
		ROOM_NAMES[floor][col],
		HORIZONTAL_ALIGNMENT_LEFT, -1, 11, name_c)

	# Zone label inside the room
	if zone_col != Color.TRANSPARENT:
		if zone_unlocked:
			var zp := 0.7 + 0.3 * sin(_pulse * 3.0)
			draw_string(ThemeDB.fallback_font,
				inner.position + Vector2(8, 34),
				"[ " + zone_name + " ]",
				HORIZONTAL_ALIGNMENT_LEFT, -1, 13,
				Color(zone_col.r, zone_col.g, zone_col.b, zp))
			draw_string(ThemeDB.fallback_font,
				inner.position + Vector2(8, 52),
				"TOCAR PARA RAIDAR",
				HORIZONTAL_ALIGNMENT_LEFT, -1, 10,
				Color(zone_col.r, zone_col.g, zone_col.b, 0.55))
		else:
			draw_string(ThemeDB.fallback_font,
				inner.position + Vector2(8, 34),
				"BLOQUEADO",
				HORIZONTAL_ALIGNMENT_LEFT, -1, 12, Color(0.4, 0.38, 0.42))

	# Rocket progress in Baia do Foguete
	if floor == 1 and col == 1:
		_draw_rocket_indicator(inner)


func _draw_rocket_indicator(room: Rect2) -> void:
	var pieces := HubState.rocket_pieces_built
	var total := HubState.ROCKET_RECIPE.size()
	var bar_w := room.size.x - 24.0
	var bar_y := room.position.y + room.size.y - 22.0
	draw_rect(Rect2(room.position.x + 12, bar_y, bar_w, 8), Color(0.12, 0.12, 0.15))
	if pieces > 0:
		var fill := bar_w * float(pieces) / float(total)
		draw_rect(Rect2(room.position.x + 12, bar_y, fill, 8), Color(0.8, 0.5, 0.15))
	draw_string(ThemeDB.fallback_font,
		Vector2(room.position.x + 12, bar_y - 4),
		"Foguete: %d / %d pecas" % [pieces, total],
		HORIZONTAL_ALIGNMENT_LEFT, -1, 10, Color(0.6, 0.5, 0.3))


func _draw_passage(zone: Dictionary) -> void:
	if not HubState.zones_unlocked[zone["id"]]:
		return
	var floor: int = zone["room_floor"]
	var col: int = zone["room_col"]
	var inner := _room_inner_rect(floor, col)
	var outer := _room_rect(floor, col)
	var color: Color = zone["color"]
	var p := 0.55 + 0.45 * sin(_pulse * 4.5)

	match zone["passage"]:
		"up":
			# Opening in ceiling — passage to surface
			var cx := inner.position.x + inner.size.x * 0.5
			# Clear gap in the ceiling wall
			draw_rect(Rect2(cx - 18, outer.position.y, 36, WALL_T + 1),
				Color(0.088, 0.08, 0.075))  # earth color (erase wall)
			draw_rect(Rect2(cx - 18, outer.position.y, 36, WALL_T + 1),
				Color(0.115, 0.105, 0.125))  # room interior color (continue room upward)
			# Shaft line from room ceiling to surface
			draw_line(Vector2(cx, outer.position.y), Vector2(cx, SURFACE_Y),
				Color(color.r, color.g, color.b, 0.55 * p), 3.0)
			# Arrow at surface
			draw_circle(Vector2(cx, SURFACE_Y), 8.0,
				Color(color.r, color.g, color.b, 0.2 * p))
			draw_line(Vector2(cx, SURFACE_Y + 2), Vector2(cx - 7, SURFACE_Y + 12),
				Color(color.r, color.g, color.b, 0.8 * p), 2.0)
			draw_line(Vector2(cx, SURFACE_Y + 2), Vector2(cx + 7, SURFACE_Y + 12),
				Color(color.r, color.g, color.b, 0.8 * p), 2.0)

		"right":
			# Opening in right wall — passage to outside city
			var cy := inner.position.y + inner.size.y * 0.5
			var right_x := outer.position.x + outer.size.x
			# Clear gap in right wall
			draw_rect(Rect2(inner.position.x + inner.size.x, cy - 18, WALL_T + 1, 36),
				Color(0.115, 0.105, 0.125))
			# Cable/signal line to right edge
			draw_line(Vector2(right_x, cy), Vector2(VW, cy),
				Color(color.r, color.g, color.b, 0.55 * p), 2.5)
			# Arrowhead at screen edge
			draw_circle(Vector2(VW - 6, cy), 7.0,
				Color(color.r, color.g, color.b, 0.2 * p))
			draw_line(Vector2(VW - 8, cy), Vector2(VW - 18, cy - 7),
				Color(color.r, color.g, color.b, 0.8 * p), 2.0)
			draw_line(Vector2(VW - 8, cy), Vector2(VW - 18, cy + 7),
				Color(color.r, color.g, color.b, 0.8 * p), 2.0)

		"left":
			# Opening in left wall — passage through elevator shaft
			var cy := inner.position.y + inner.size.y * 0.5
			# Clear gap in left wall
			draw_rect(Rect2(outer.position.x, cy - 14, WALL_T + 1, 28),
				Color(0.115, 0.105, 0.125))
			# Line to left edge
			draw_line(Vector2(outer.position.x, cy), Vector2(0, cy),
				Color(color.r, color.g, color.b, 0.55 * p), 2.5)
			# Arrowhead at left edge
			draw_circle(Vector2(6, cy), 7.0,
				Color(color.r, color.g, color.b, 0.2 * p))
			draw_line(Vector2(8, cy), Vector2(18, cy - 7),
				Color(color.r, color.g, color.b, 0.8 * p), 2.0)
			draw_line(Vector2(8, cy), Vector2(18, cy + 7),
				Color(color.r, color.g, color.b, 0.8 * p), 2.0)

		"down":
			# Opening in floor — tunnel to deep underground
			var cx := inner.position.x + inner.size.x * 0.5
			var bottom_y := outer.position.y + outer.size.y
			var screen_bottom := VH
			# Clear gap in floor wall
			draw_rect(Rect2(cx - 14, inner.position.y + inner.size.y, 28, WALL_T + 1),
				Color(0.115, 0.105, 0.125))
			# Shaft line to screen bottom
			draw_line(Vector2(cx, bottom_y), Vector2(cx, screen_bottom),
				Color(color.r, color.g, color.b, 0.55 * p), 3.0)
			# Arrow pointing down at screen bottom
			draw_circle(Vector2(cx, screen_bottom - 8), 7.0,
				Color(color.r, color.g, color.b, 0.2 * p))
			draw_line(Vector2(cx, screen_bottom - 10), Vector2(cx - 7, screen_bottom - 20),
				Color(color.r, color.g, color.b, 0.8 * p), 2.0)
			draw_line(Vector2(cx, screen_bottom - 10), Vector2(cx + 7, screen_bottom - 20),
				Color(color.r, color.g, color.b, 0.8 * p), 2.0)


func _draw_elevator() -> void:
	# Left-side elevator shaft connecting all floors
	var sx := 0.0
	var sy := SURFACE_Y + 2.0
	var sw := 8.0
	var sh := FLOOR_H * 3 - 4.0
	draw_rect(Rect2(sx, sy, sw, sh), Color(0.1, 0.09, 0.085))
	# Shaft interior
	draw_rect(Rect2(sx + 2, sy + 2, sw - 4, sh - 4), Color(0.085, 0.078, 0.075))
	# Elevator cabin (small box in mid position)
	var cabin_y := sy + sh * 0.45
	draw_rect(Rect2(sx + 1, cabin_y, sw - 2, 18), Color(0.22, 0.2, 0.18))
	draw_rect(Rect2(sx + 2, cabin_y + 2, sw - 4, 14), Color(0.28, 0.26, 0.24))


# ── Stock panel ─────────────────────────────────────────────────────────────────

func _draw_stock_panel(top_y: float) -> void:
	var panel_h := VH - top_y
	draw_rect(Rect2(0, top_y, VW, panel_h), Color(0.05, 0.045, 0.042))

	# Label de identidade da base
	draw_string(ThemeDB.fallback_font, Vector2(VW - 10.0, top_y + 14.0),
		"▼  BASE DE RESISTÊNCIA",
		HORIZONTAL_ALIGNMENT_RIGHT, -1, 10, Color(0.75, 0.55, 0.25, 0.75))

	# Sobreviventes resgatados
	var rescued := HubState.rescued_characters.size() + 1  # +1 = Dr. Valério sempre presente
	draw_string(ThemeDB.fallback_font, Vector2(VW - 10.0, top_y + 26.0),
		"Sobreviventes: %d / 10" % rescued,
		HORIZONTAL_ALIGNMENT_RIGHT, -1, 9, Color(0.55, 0.70, 0.55, 0.80))

	# Next piece label
	var piece_idx := HubState.rocket_pieces_built
	var next_name: String = "FOGUETE COMPLETO!" if piece_idx >= HubState.ROCKET_RECIPE.size() \
		else HubState.ROCKET_RECIPE[piece_idx]["name"] as String
	draw_string(ThemeDB.fallback_font, Vector2(10, top_y + 16),
		"Proxima peca: %s" % next_name,
		HORIZONTAL_ALIGNMENT_LEFT, -1, 11, Color(0.80, 0.65, 0.25))

	# Resource rows — two columns
	var labels: Array = [
		["scrap",                   "Sucata"],
		["ai_components",           "Comp. IA"],
		["fragmentos_estruturais",  "Frag. Estru."],
		["combustivel_volatil",     "Combustivel"],
		["nucleo_logico",           "Nucleo Log."],
		["sinais_controle",         "Sinais Ctrl."],
		["biomassa_adaptativa",     "Biomassa"],
	]
	var col_w := VW * 0.5
	for i in labels.size():
		var key: String  = labels[i][0]
		var lbl: String  = labels[i][1]
		var amount: int  = HubState.stock.get(key, 0)
		var col_x := 10.0 if i % 2 == 0 else col_w + 10.0
		var row_y := top_y + 30.0 + (i / 2) * 18.0
		# Highlight resources needed for next piece
		var needed := 0
		if piece_idx < HubState.ROCKET_RECIPE.size():
			needed = HubState.ROCKET_RECIPE[piece_idx].get(key, 0)
		var txt_col := Color(0.45, 0.85, 0.45) if needed > 0 else Color(0.55, 0.52, 0.50)
		draw_string(ThemeDB.fallback_font, Vector2(col_x, row_y),
			"%s: %d%s" % [lbl, amount, ("/%d" % needed) if needed > 0 else ""],
			HORIZONTAL_ALIGNMENT_LEFT, -1, 10, txt_col)


# ── Room geometry ───────────────────────────────────────────────────────────────

func _room_rect(floor: int, col: int) -> Rect2:
	return Rect2(COL_X[col], SURFACE_Y + floor * FLOOR_H, COL_W[col], FLOOR_H)


func _room_inner_rect(floor: int, col: int) -> Rect2:
	return _room_rect(floor, col).grow(-WALL_T)


# ── UI ─────────────────────────────────────────────────────────────────────────

func _build_detail_panel() -> void:
	_detail_layer = CanvasLayer.new()
	_detail_layer.layer = 20
	_detail_layer.visible = false
	add_child(_detail_layer)

	var panel := ColorRect.new()
	panel.color = Color(0.07, 0.06, 0.05, 0.97)
	panel.size = Vector2(340, 240)
	panel.position = Vector2(VW * 0.5 - 170, VH * 0.5 - 120)
	_detail_layer.add_child(panel)

	var vbox := VBoxContainer.new()
	vbox.position = Vector2(VW * 0.5 - 154, VH * 0.5 - 104)
	vbox.size = Vector2(308, 220)
	vbox.add_theme_constant_override("separation", 6)
	_detail_layer.add_child(vbox)

	_zone_name_lbl = Label.new()
	_zone_name_lbl.add_theme_font_size_override("font_size", 20)
	_zone_name_lbl.modulate = Color(1.0, 0.9, 0.5)
	vbox.add_child(_zone_name_lbl)

	_zone_res_lbl = Label.new()
	_zone_res_lbl.add_theme_font_size_override("font_size", 12)
	_zone_res_lbl.modulate = Color(0.6, 0.85, 0.6)
	vbox.add_child(_zone_res_lbl)

	_zone_stage_lbl = Label.new()
	_zone_stage_lbl.add_theme_font_size_override("font_size", 11)
	_zone_stage_lbl.modulate = Color(0.75, 0.6, 0.5)
	vbox.add_child(_zone_stage_lbl)

	_zone_dialogue_lbl = Label.new()
	_zone_dialogue_lbl.add_theme_font_size_override("font_size", 11)
	_zone_dialogue_lbl.modulate = Color(0.75, 0.80, 0.65)
	_zone_dialogue_lbl.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_zone_dialogue_lbl.custom_minimum_size = Vector2(308, 56)
	vbox.add_child(_zone_dialogue_lbl)

	_raid_btn = Button.new()
	_raid_btn.text = "RAIDAR"
	_raid_btn.custom_minimum_size = Vector2(0, 36)
	_raid_btn.pressed.connect(_start_raid)
	vbox.add_child(_raid_btn)

	var cancel := Button.new()
	cancel.text = "Cancelar"
	cancel.pressed.connect(_on_cancel_pressed)
	vbox.add_child(cancel)


func _show_detail(zone: Dictionary) -> void:
	_sfx.stream = load("res://assets/audio/sfx/ui/Click_01.wav")
	_sfx.play()
	_selected_zone = zone
	_zone_name_lbl.text = zone["name"]
	_zone_res_lbl.text = "Recurso: " + zone["resource"]
	var stage: int = HubState.zone_deterioration[zone["id"]] \
		if zone["id"] < HubState.zone_deterioration.size() else 0
	var stage_texts := ["Estagio: Estavel", "Estagio: Deteriorando (+25% inimigos)", "Estagio: Critico (+50% inimigos)"]
	_zone_stage_lbl.text = stage_texts[stage]
	_zone_dialogue_lbl.text = ZONE_DIALOGUE.get(zone["id"], "")
	_detail_layer.visible = true


func _on_cancel_pressed() -> void:
	_sfx.stream = load("res://assets/audio/sfx/ui/Click_02.wav")
	_sfx.play()
	_detail_layer.visible = false


func _start_raid() -> void:
	_sfx.stream = load("res://assets/audio/sfx/ui/Confirm_01.wav")
	_sfx.play()
	if _selected_zone.is_empty():
		return
	_detail_layer.visible = false
	get_tree().change_scene_to_file(_selected_zone["scene"])
