## WorldMapScene — Bunker cross-section (Fallout Shelter style).
## Three floors, three rooms each, laid out via VBoxContainer / HBoxContainer.
## Root: Control. Floors: VBoxContainer. Rooms per floor: HBoxContainer.
## Tap an unlocked zone room to raid.
extends Control

const _ZONE_ROOM_SCENE := preload("res://src/scenes/ZoneRoom.tscn")
const _CONFIRM_DIALOG_SCENE := preload("res://src/scenes/ConfirmRaidDialog.tscn")

const VW: float = 480.0
const VH: float = 854.0
const SURFACE_Y: float = 72.0
const STOCK_H: float = 104.0

## Floor layout — VBoxContainer index 0 = Andar 3 (topo), 2 = Andar 1 (base).
## Each cell is a zone_id (0-7) or -1 for the rocket bay (no zone).
## Andar 3 (topo):  Hordas(0), Sacrificio(7), Extracao(3)
## Andar 2:          Campo(4),  Foguete(-1),   Stealth(1)
## Andar 1 (base):  Infeccao(5), Labirinto(6), Circuito(2)
const FLOOR_LAYOUT: Array = [
	[0, 7, 3],
	[4, -1, 1],
	[5, 6, 2],
]


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

## _room_panels[floor_idx][col_idx] → Control node used for layout and input.
var _room_panels: Array = []

## Name of the zone whose RAID button was last pressed.
var _pending_zone: String = ""
var _confirm_dialog: ConfirmRaidDialog = null


func _ready() -> void:
	set_anchors_preset(Control.PRESET_FULL_RECT)
	mouse_filter = Control.MOUSE_FILTER_STOP  # catch background taps to close panel

	_build_room_layout()
	_build_detail_panel()
	_load_zone_bg_images()

	_music = AudioStreamPlayer.new()
	_music.stream = load("res://assets/audio/music/menu.wav")
	_music.volume_db = -8.0
	add_child(_music)
	_music.finished.connect(_music.play)
	_music.play()

	_sfx = AudioStreamPlayer.new()
	add_child(_sfx)


## Builds the VBoxContainer → 3 HBoxContainers → 3 room panels structure.
func _build_room_layout() -> void:
	var floors_h := VH - SURFACE_Y - STOCK_H

	var scroll := ScrollContainer.new()
	scroll.position = Vector2(0.0, SURFACE_Y)
	scroll.size = Vector2(VW, floors_h)
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	scroll.vertical_scroll_mode = ScrollContainer.SCROLL_MODE_AUTO
	add_child(scroll)

	var vbox := VBoxContainer.new()
	vbox.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	## Minimum height exceeds 390×844 floors area (668 px) to force visible scroll.
	vbox.custom_minimum_size = Vector2(0.0, 840.0)
	vbox.add_theme_constant_override("separation", 0)
	scroll.add_child(vbox)

	_room_panels = []
	for floor_idx: int in FLOOR_LAYOUT.size():
		var hbox := HBoxContainer.new()
		hbox.size_flags_vertical = Control.SIZE_EXPAND_FILL
		hbox.add_theme_constant_override("separation", 0)
		vbox.add_child(hbox)

		var floor_panels: Array = []
		for col_idx: int in FLOOR_LAYOUT[floor_idx].size():
			var zone_id: int = FLOOR_LAYOUT[floor_idx][col_idx]
			var panel := Control.new()
			panel.size_flags_horizontal = Control.SIZE_EXPAND_FILL
			panel.mouse_filter = Control.MOUSE_FILTER_STOP
			# Capture loop vars for the closure
			var fi := floor_idx
			var ci := col_idx
			var zi := zone_id
			panel.gui_input.connect(func(ev: InputEvent) -> void:
				_on_room_input(ev, fi, ci, zi)
			)

			var zone_room := _ZONE_ROOM_SCENE.instantiate() as ZoneRoom
			zone_room.set_anchors_preset(Control.PRESET_FULL_RECT)
			zone_room.mouse_filter = Control.MOUSE_FILTER_PASS
			var _zd: Dictionary = Zones.ZONES[zone_id] if zone_id >= 0 else Zones.ROCKET_BAY
			zone_room.accent_color = _zd["accent_color"]
			zone_room.zone_name = _zd["zone_name"]
			zone_room.room_subtitle = _zd["room_subtitle"]
			zone_room.raid_requested.connect(_on_zone_raid_requested)
			panel.add_child(zone_room)

			hbox.add_child(panel)
			floor_panels.append(panel)

		_room_panels.append(floor_panels)


func _load_zone_bg_images() -> void:
	var bg_map: Dictionary = {
		0: "res://assets/art/zones/zone_hordas.png",
		1: "res://assets/art/zones/zone_stealth.png",
		2: "res://assets/art/zones/zone_circuito.png",
		3: "res://assets/art/zones/zone_extracao.png",
		4: "res://assets/art/zones/zone_campo.png",
		5: "res://assets/art/zones/zone_infeccao.png",
		6: "res://assets/art/zones/zone_labirinto.png",
		7: "res://assets/art/zones/zone_sacrificio.png",
	}
	for floor_idx: int in _room_panels.size():
		for col_idx: int in _room_panels[floor_idx].size():
			var zone_id: int = FLOOR_LAYOUT[floor_idx][col_idx]
			if zone_id < 0:
				continue
			var path: String = bg_map.get(zone_id, "")
			if path.is_empty() or not ResourceLoader.exists(path):
				continue
			var panel: Control = _room_panels[floor_idx][col_idx]
			var tex: Texture2D = load(path)
			var bg := TextureRect.new()
			bg.texture = tex
			bg.expand_mode = TextureRect.EXPAND_FIT_WIDTH_PROPORTIONAL
			bg.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
			bg.set_anchors_preset(Control.PRESET_FULL_RECT)
			bg.z_index = -1
			panel.add_child(bg)


func _process(delta: float) -> void:
	_pulse += delta
	queue_redraw()


func _gui_input(event: InputEvent) -> void:
	# Tap on root background (outside room panels) — close detail panel
	var tapped := false
	if event is InputEventMouseButton:
		var mb := event as InputEventMouseButton
		if mb.button_index == MOUSE_BUTTON_LEFT and mb.pressed:
			tapped = true
	if event is InputEventScreenTouch:
		var touch := event as InputEventScreenTouch
		if touch.pressed:
			tapped = true
	if tapped:
		_detail_layer.visible = false


func _draw() -> void:
	# Sky
	draw_rect(Rect2(0.0, 0.0, VW, SURFACE_Y), Color(0.04, 0.045, 0.08))
	_draw_city_silhouette()

	var dp := 0.5 + 0.5 * sin(_pulse * 2.2)
	draw_string(ThemeDB.fallback_font, Vector2(VW * 0.5 - 90.0, 22.0),
		"⬤  ZONA IA CONTROLADA — ACESSO PROIBIDO  ⬤",
		HORIZONTAL_ALIGNMENT_LEFT, -1, 9, Color(0.20, 0.60, 0.95, 0.65 * dp))
	draw_string(ThemeDB.fallback_font, Vector2(VW * 0.5 - 60.0, 44.0),
		"SUPERFÍCIE — ZONA DE PERIGO",
		HORIZONTAL_ALIGNMENT_LEFT, -1, 10, Color(0.85, 0.3, 0.2, 0.45 * dp))
	_draw_ai_drones()

	# Surface line and earth fill
	draw_line(Vector2(0.0, SURFACE_Y), Vector2(VW, SURFACE_Y), Color(0.3, 0.22, 0.1), 2.5)
	draw_rect(Rect2(0.0, SURFACE_Y, VW, VH - SURFACE_Y), Color(0.075, 0.068, 0.062))

	# Draw all 9 rooms using their container-determined positions
	for floor_idx: int in _room_panels.size():
		for col_idx: int in _room_panels[floor_idx].size():
			_draw_room_panel(floor_idx, col_idx)

	_draw_elevator()

	var stock_top := VH - STOCK_H
	draw_line(Vector2(0.0, stock_top), Vector2(VW, stock_top), Color(0.055, 0.05, 0.048), 2.0)
	_draw_stock_panel(stock_top)


func _draw_room_panel(floor_idx: int, col_idx: int) -> void:
	var panel: Control = _room_panels[floor_idx][col_idx]
	if panel.size.x == 0.0 or panel.size.y == 0.0:
		return

	# get_global_rect() gives screen coords; root is at (0,0) so these are root-local too
	var outer := panel.get_global_rect()
	const WALL_T := 6.0
	var inner := outer.grow(-WALL_T)

	var zone_id: int = FLOOR_LAYOUT[floor_idx][col_idx]
	var zone_col := Color.TRANSPARENT
	var zone_unlocked := false
	var zone_name := ""

	if zone_id >= 0:
		var zd: Dictionary = Zones.ZONES[zone_id]
		zone_col = zd["accent_color"] as Color
		zone_unlocked = HubState.zones_unlocked[zone_id]
		zone_name = zd["zone_name"]

	# Outer wall fill
	draw_rect(outer, Color(0.088, 0.08, 0.075))

	# Room interior
	var base_c := Color(0.115, 0.105, 0.125)
	if zone_col != Color.TRANSPARENT and zone_unlocked:
		base_c = base_c.lerp(zone_col, 0.10)
	elif zone_col != Color.TRANSPARENT and not zone_unlocked:
		base_c = Color(0.08, 0.078, 0.082)
	draw_rect(inner, base_c)

	# Glowing border for unlocked zone rooms
	if zone_col != Color.TRANSPARENT and zone_unlocked:
		var gp := 0.5 + 0.5 * sin(_pulse * 3.2)
		var gc := Color(zone_col.r, zone_col.g, zone_col.b, 0.45 * gp)
		draw_line(inner.position, inner.position + Vector2(inner.size.x, 0.0), gc, 1.5)
		draw_line(inner.position, inner.position + Vector2(0.0, inner.size.y), gc, 1.5)
		draw_line(inner.position + Vector2(inner.size.x, 0.0), inner.position + inner.size, gc, 1.5)
		draw_line(inner.position + Vector2(0.0, inner.size.y), inner.position + inner.size, gc, 1.5)

	# Room labels
	if zone_id >= 0:
		var name_c := Color(0.55, 0.5, 0.58)
		if zone_unlocked:
			name_c = zone_col.lerp(Color.WHITE, 0.3)
		draw_string(ThemeDB.fallback_font,
			inner.position + Vector2(6.0, 20.0),
			zone_name,
			HORIZONTAL_ALIGNMENT_LEFT, -1, 13, name_c)
		if zone_unlocked:
			var zp := 0.7 + 0.3 * sin(_pulse * 3.0)
			draw_string(ThemeDB.fallback_font,
				inner.position + Vector2(6.0, 38.0),
				"TOCAR PARA RAIDAR",
				HORIZONTAL_ALIGNMENT_LEFT, -1, 9,
				Color(zone_col.r, zone_col.g, zone_col.b, 0.55 * zp))
		else:
			draw_string(ThemeDB.fallback_font,
				inner.position + Vector2(6.0, 38.0),
				"BLOQUEADO",
				HORIZONTAL_ALIGNMENT_LEFT, -1, 10, Color(0.4, 0.38, 0.42))
	else:
		# Rocket bay (no zone)
		draw_string(ThemeDB.fallback_font,
			inner.position + Vector2(6.0, 20.0),
			Zones.ROCKET_BAY["zone_name"],
			HORIZONTAL_ALIGNMENT_LEFT, -1, 10, Color(0.7, 0.55, 0.3))
		_draw_rocket_indicator(inner)


func _draw_rocket_indicator(room: Rect2) -> void:
	var pieces := HubState.rocket_pieces_built
	var total := HubState.ROCKET_RECIPE.size()
	var bar_w := room.size.x - 24.0
	var bar_y := room.position.y + room.size.y - 22.0
	draw_rect(Rect2(room.position.x + 12.0, bar_y, bar_w, 8.0), Color(0.12, 0.12, 0.15))
	if pieces > 0:
		var fill := bar_w * float(pieces) / float(total)
		draw_rect(Rect2(room.position.x + 12.0, bar_y, fill, 8.0), Color(0.8, 0.5, 0.15))
	draw_string(ThemeDB.fallback_font,
		Vector2(room.position.x + 12.0, bar_y - 4.0),
		"Foguete: %d / %d pecas" % [pieces, total],
		HORIZONTAL_ALIGNMENT_LEFT, -1, 10, Color(0.6, 0.5, 0.3))


func _draw_elevator() -> void:
	var sx := 0.0
	var sy := SURFACE_Y + 2.0
	var sw := 8.0
	var sh := VH - SURFACE_Y - STOCK_H - 4.0
	draw_rect(Rect2(sx, sy, sw, sh), Color(0.1, 0.09, 0.085))
	draw_rect(Rect2(sx + 2.0, sy + 2.0, sw - 4.0, sh - 4.0), Color(0.085, 0.078, 0.075))
	var cabin_y := sy + sh * 0.45
	draw_rect(Rect2(sx + 1.0, cabin_y, sw - 2.0, 18.0), Color(0.22, 0.2, 0.18))
	draw_rect(Rect2(sx + 2.0, cabin_y + 2.0, sw - 4.0, 14.0), Color(0.28, 0.26, 0.24))


func _draw_ai_drones() -> void:
	var drone_positions: Array = [
		Vector2(60.0, 30.0), Vector2(190.0, 18.0), Vector2(310.0, 28.0), Vector2(430.0, 16.0),
	]
	for i: int in drone_positions.size():
		var base_pos: Vector2 = drone_positions[i]
		var bob := sin(_pulse * 2.5 + float(i) * 1.3) * 3.0
		var pos := base_pos + Vector2(0.0, bob)
		var scan_alpha := 0.30 + 0.20 * sin(_pulse * 3.0 + float(i))
		var pts := PackedVector2Array([
			pos + Vector2(0.0, -6.0), pos + Vector2(5.0, 0.0),
			pos + Vector2(0.0, 4.0),  pos + Vector2(-5.0, 0.0),
		])
		draw_colored_polygon(pts, Color(0.20, 0.60, 0.95, 0.70))
		draw_circle(pos, 1.8, Color(0.90, 0.95, 1.00, 0.90))
		draw_line(pos + Vector2(0.0, 4.0), pos + Vector2(0.0, 18.0),
			Color(0.20, 0.60, 0.95, scan_alpha), 1.5)


func _draw_city_silhouette() -> void:
	var buildings: Array = [
		Rect2(0.0,   10.0, 45.0, 52.0), Rect2(52.0,  22.0, 36.0, 40.0), Rect2(94.0,  6.0, 32.0, 56.0),
		Rect2(132.0, 24.0, 44.0, 38.0), Rect2(182.0, 12.0, 26.0, 50.0), Rect2(214.0, 20.0, 55.0, 42.0),
		Rect2(276.0, 5.0,  38.0, 57.0), Rect2(320.0, 18.0, 48.0, 44.0), Rect2(374.0, 14.0, 30.0, 48.0),
		Rect2(410.0, 24.0, 62.0, 38.0),
	]
	var bc := Color(0.055, 0.065, 0.10)
	for b: Rect2 in buildings:
		draw_rect(b, bc)
	var wc_ia := Color(0.20, 0.55, 0.90, 0.40)
	var wc_warm := Color(0.65, 0.6, 0.28, 0.25)
	for b: Rect2 in buildings:
		if b.size.x > 38.0:
			draw_rect(Rect2(b.position + Vector2(6.0, 8.0), Vector2(5.0, 4.0)), wc_ia)
			draw_rect(Rect2(b.position + Vector2(6.0, 20.0), Vector2(5.0, 4.0)), wc_ia)
			if b.size.x > 50.0:
				draw_rect(Rect2(b.position + Vector2(22.0, 8.0), Vector2(5.0, 4.0)), wc_warm)
	var ant_x := 214.0 + 27.0
	draw_line(Vector2(ant_x, 20.0), Vector2(ant_x, 4.0), Color(0.20, 0.60, 0.95, 0.70), 1.5)
	var blink := 0.5 + 0.5 * sin(_pulse * 4.0)
	draw_circle(Vector2(ant_x, 4.0), 2.5, Color(0.90, 0.10, 0.10, blink))


# ── Stock panel ──────────────────────────────────────────────────────────────────

func _draw_stock_panel(top_y: float) -> void:
	draw_rect(Rect2(0.0, top_y, VW, VH - top_y), Color(0.05, 0.045, 0.042))

	draw_string(ThemeDB.fallback_font, Vector2(VW - 10.0, top_y + 14.0),
		"▼  BASE DE RESISTÊNCIA",
		HORIZONTAL_ALIGNMENT_RIGHT, -1, 10, Color(0.75, 0.55, 0.25, 0.75))

	var rescued := HubState.rescued_characters.size() + 1
	draw_string(ThemeDB.fallback_font, Vector2(VW - 10.0, top_y + 26.0),
		"Sobreviventes: %d / 10" % rescued,
		HORIZONTAL_ALIGNMENT_RIGHT, -1, 9, Color(0.55, 0.70, 0.55, 0.80))

	var piece_idx := HubState.rocket_pieces_built
	var next_name: String = "FOGUETE COMPLETO!" if piece_idx >= HubState.ROCKET_RECIPE.size() \
		else HubState.ROCKET_RECIPE[piece_idx]["name"] as String
	draw_string(ThemeDB.fallback_font, Vector2(10.0, top_y + 16.0),
		"Proxima peca: %s" % next_name,
		HORIZONTAL_ALIGNMENT_LEFT, -1, 11, Color(0.80, 0.65, 0.25))

	var labels: Array = [
		["scrap",                  "Sucata"],
		["ai_components",          "Comp. IA"],
		["fragmentos_estruturais", "Frag. Estru."],
		["combustivel_volatil",    "Combustivel"],
		["nucleo_logico",          "Nucleo Log."],
		["sinais_controle",        "Sinais Ctrl."],
		["biomassa_adaptativa",    "Biomassa"],
	]
	var col_w := VW * 0.5
	for i: int in labels.size():
		var key: String = labels[i][0]
		var lbl: String = labels[i][1]
		var amount: int = HubState.stock.get(key, 0)
		var col_x := 10.0 if i % 2 == 0 else col_w + 10.0
		var row_y := top_y + 30.0 + (i / 2) * 18.0
		var needed := 0
		if piece_idx < HubState.ROCKET_RECIPE.size():
			needed = HubState.ROCKET_RECIPE[piece_idx].get(key, 0)
		var txt_col := Color(0.45, 0.85, 0.45) if needed > 0 else Color(0.55, 0.52, 0.50)
		draw_string(ThemeDB.fallback_font, Vector2(col_x, row_y),
			"%s: %d%s" % [lbl, amount, ("/%d" % needed) if needed > 0 else ""],
			HORIZONTAL_ALIGNMENT_LEFT, -1, 10, txt_col)


# ── Room input ───────────────────────────────────────────────────────────────────

## Called when any ZoneRoom's RAID button is pressed; shows confirmation dialog.
func _on_zone_raid_requested(zname: String) -> void:
	_pending_zone = zname
	var zone_data := _find_zone_by_name(zname)
	if zone_data.is_empty():
		return
	_confirm_dialog = _CONFIRM_DIALOG_SCENE.instantiate() as ConfirmRaidDialog
	_confirm_dialog.setup(zone_data["zone_name"], zone_data["subtitle"])
	_confirm_dialog.confirmed.connect(_on_raid_confirmed)
	_confirm_dialog.cancelled.connect(_on_raid_cancelled)
	add_child(_confirm_dialog)


func _on_raid_confirmed() -> void:
	var zone_data := _find_zone_by_name(_pending_zone)
	if zone_data.is_empty() or zone_data["scene_path"].is_empty():
		return
	get_tree().change_scene_to_file(zone_data["scene_path"])


func _on_raid_cancelled() -> void:
	if is_instance_valid(_confirm_dialog):
		_confirm_dialog.queue_free()
		_confirm_dialog = null
	_pending_zone = ""


func _find_zone_by_name(zname: String) -> Dictionary:
	for zd: Dictionary in Zones.ZONES:
		if zd["zone_name"] == zname:
			return zd
	return {}


func _on_room_input(event: InputEvent, _floor_idx: int, _col_idx: int, zone_id: int) -> void:
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
	if zone_id < 0:
		return  # Rocket bay — no zone to raid
	if not HubState.zones_unlocked[zone_id]:
		return
	_show_detail(zone_id, Zones.ZONES[zone_id])


# ── Detail panel ─────────────────────────────────────────────────────────────────

func _build_detail_panel() -> void:
	_detail_layer = CanvasLayer.new()
	_detail_layer.layer = 20
	_detail_layer.visible = false
	add_child(_detail_layer)

	var panel := ColorRect.new()
	panel.color = Color(0.07, 0.06, 0.05, 0.97)
	panel.size = Vector2(340.0, 240.0)
	panel.position = Vector2(VW * 0.5 - 170.0, VH * 0.5 - 120.0)
	panel.mouse_filter = Control.MOUSE_FILTER_STOP
	_detail_layer.add_child(panel)

	var vbox := VBoxContainer.new()
	vbox.position = Vector2(VW * 0.5 - 154.0, VH * 0.5 - 104.0)
	vbox.size = Vector2(308.0, 220.0)
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
	_zone_dialogue_lbl.custom_minimum_size = Vector2(308.0, 56.0)
	vbox.add_child(_zone_dialogue_lbl)

	_raid_btn = Button.new()
	_raid_btn.text = "RAIDAR"
	_raid_btn.custom_minimum_size = Vector2(0.0, 36.0)
	_raid_btn.pressed.connect(_start_raid)
	vbox.add_child(_raid_btn)

	var cancel := Button.new()
	cancel.text = "Cancelar"
	cancel.pressed.connect(_on_cancel_pressed)
	vbox.add_child(cancel)


func _show_detail(zone_id: int, zone: Dictionary) -> void:
	_sfx.stream = load("res://assets/audio/sfx/ui/Click_01.wav")
	_sfx.play()
	_selected_zone = zone
	_zone_name_lbl.text = zone["zone_name"]
	_zone_res_lbl.text = "Recurso: " + zone["resource"]
	var stage: int = HubState.zone_deterioration[zone_id] \
		if zone_id < HubState.zone_deterioration.size() else 0
	var stage_texts := ["Estagio: Estavel", "Estagio: Deteriorando (+25% inimigos)", "Estagio: Critico (+50% inimigos)"]
	_zone_stage_lbl.text = stage_texts[stage]
	_zone_dialogue_lbl.text = ZONE_DIALOGUE.get(zone_id, "")
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
	get_tree().change_scene_to_file(_selected_zone["scene_path"])
