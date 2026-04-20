class_name HubRenderer
extends Node2D

var rooms: Array = []
var cell_width: float = 0
var room_y_offset: Dictionary = {}
var input_areas: Dictionary = {}
var variant_colors: Dictionary = {}

signal room_clicked(room_id: String)

func _ready() -> void:
	position = Vector2.ZERO
	scale = Vector2.ONE
	z_index = 0

	rooms = HubData.ROOMS.duplicate()
	_calculate_cell_sizes()
	_build_room_hitboxes()
	_apply_variant()
	HubState.hub_variant_changed.connect(_on_variant_changed)


func _process(_delta: float) -> void:
	queue_redraw()


func _calculate_cell_sizes() -> void:
	var viewport_size = get_viewport_rect().size
	cell_width = viewport_size.x / 6.0

	var y = 0.0
	for room in rooms:
		room_y_offset[room["id"]] = y
		y += room["h"]


func _build_room_hitboxes() -> void:
	for room in rooms:
		var area = Area2D.new()
		area.name = "RoomArea_" + room["id"]

		var col_rect = CollisionShape2D.new()
		var shape = RectangleShape2D.new()
		shape.size = Vector2(cell_width * room["w"], room["h"])
		col_rect.shape = shape
		area.add_child(col_rect)

		var y_pos = room_y_offset.get(room["id"], 0.0)
		area.position = Vector2(cell_width * room["col"], y_pos)

		var rid: String = room["id"]
		area.input_event.connect(func(event: InputEvent):
			if event is InputEventMouseButton and event.pressed:
				if HubState.is_room_unlocked(rid):
					room_clicked.emit(rid)
		)

		add_child(area)
		input_areas[room["id"]] = area


func _draw() -> void:
	if rooms.is_empty():
		return

	for room in rooms:
		_draw_room(room)

	_draw_grid_lines()
	_draw_ambient_spores()


func _draw_ambient_spores() -> void:
	# Esporos globais flutuando lentamente (ambient life).
	# Só visíveis sobre salas unlocked; em salas locked seriam absorvidos pela terra.
	var viewport_size: Vector2 = get_viewport_rect().size
	var t: float = Time.get_ticks_msec() * 0.0006
	var spore_count: int = 18
	for i in range(spore_count):
		var base_x: float = fmod(float(i) * 97.3, viewport_size.x)
		var base_y: float = fmod(float(i) * 53.1, viewport_size.y)
		# Deriva vertical ascendente lenta + oscilação horizontal
		var y: float = fmod(base_y - t * 12.0 * (1.0 + float(i % 3) * 0.3), viewport_size.y)
		var x: float = base_x + sin(t + float(i)) * 8.0

		# Só desenha se a sala naquele ponto está unlocked
		if not _is_point_in_unlocked_room(Vector2(x, y)):
			continue

		var alpha: float = 0.25 + 0.15 * sin(t * 2.0 + float(i))
		var color: Color = Color(0.72, 0.45, 0.85, alpha) if i % 2 == 0 else Color(0.30, 0.78, 0.72, alpha)
		draw_circle(Vector2(x, y), 1.2, color)


func _is_point_in_unlocked_room(point: Vector2) -> bool:
	for room in rooms:
		var rx: float = cell_width * room["col"]
		var ry: float = room_y_offset.get(room["id"], 0.0)
		var rw: float = cell_width * room["w"]
		var rh: float = room["h"]
		if point.x >= rx and point.x <= rx + rw and point.y >= ry and point.y <= ry + rh:
			return HubState.is_room_unlocked(room["id"])
	return false


func _draw_room(room: Dictionary) -> void:
	var x = cell_width * room["col"]
	var y = room_y_offset.get(room["id"], 0.0)
	var w = cell_width * room["w"]
	var h = room["h"]

	# Sala bloqueada → terra/rocha com silhueta-fantasma
	if not HubState.is_room_unlocked(room["id"]):
		_draw_locked_room(room, x, y, w, h)
		return

	# Fundo base
	draw_rect(Rect2(x, y, w, h), _get_room_base_color(room))

	# Interior
	draw_set_transform(Vector2(x, y), 0, Vector2(1, 1))
	_draw_room_interior(room, w, h)
	draw_set_transform(Vector2.ZERO, 0, Vector2(1, 1))

	# Iluminação per-room (overlay)
	_apply_room_lighting(room, x, y, w, h)

	# Zona badge
	_draw_zone_badge_if_needed(room, x, y, w, h)

	# Bordas
	draw_rect(Rect2(x, y, w, h), Color(0.15, 0.15, 0.15), false, 1.0)


func _draw_locked_room(room: Dictionary, x: float, y: float, w: float, h: float) -> void:
	# Terra/rocha base (gradient marrom escuro)
	_draw_gradient(x, y, w, h, Color(0.10, 0.08, 0.05), Color(0.16, 0.12, 0.08))

	# Textura granular (pontos aleatórios estáveis por sala)
	var seed_base: int = hash(room["id"])
	var rng = RandomNumberGenerator.new()
	rng.seed = seed_base
	for _i in range(22):
		var px := x + rng.randf() * w
		var py := y + rng.randf() * h
		var shade := Color(0.25, 0.18, 0.12, 0.5)
		draw_circle(Vector2(px, py), 1.5, shade)

	# Veios de rocha (linhas diagonais sutis)
	for i in range(3):
		var vy := y + h * (0.2 + i * 0.3)
		draw_line(Vector2(x + 6, vy), Vector2(x + w - 6, vy + 4), Color(0.22, 0.16, 0.10, 0.6), 1.0)

	# Silhueta central — forma simplificada (retângulo com ? interno)
	var silhouette_label: String = room.get("silhouette", "?")
	var cx := x + w * 0.5
	var cy := y + h * 0.5

	# Bloco cinza da silhueta
	var box_w: float = min(w * 0.55, 80.0)
	var box_h: float = min(h * 0.45, 50.0)
	var box_rect := Rect2(cx - box_w * 0.5, cy - box_h * 0.5, box_w, box_h)
	draw_rect(box_rect, Color(0.28, 0.25, 0.22, 0.35))
	draw_rect(box_rect, Color(0.45, 0.40, 0.35, 0.5), false, 1.0)

	# "?" grande no centro
	var font: Font = ThemeDB.fallback_font
	var font_size := 14
	var q_size := font.get_string_size("?", HORIZONTAL_ALIGNMENT_CENTER, -1, font_size)
	draw_string(font, Vector2(cx - q_size.x * 0.5, cy + q_size.y * 0.3),
		"?", HORIZONTAL_ALIGNMENT_CENTER, -1, font_size, Color(0.60, 0.54, 0.46, 0.8))

	# Rótulo discreto abaixo (silhouette hint)
	if silhouette_label != "?":
		var lbl_size := font.get_string_size(silhouette_label, HORIZONTAL_ALIGNMENT_CENTER, -1, 8)
		draw_string(font, Vector2(cx - lbl_size.x * 0.5, cy + box_h * 0.5 + 12),
			silhouette_label, HORIZONTAL_ALIGNMENT_CENTER, -1, 8, Color(0.55, 0.48, 0.40, 0.6))

	# Bordas
	draw_rect(Rect2(x, y, w, h), Color(0.10, 0.08, 0.05), false, 1.0)


func _get_room_base_color(room: Dictionary) -> Color:
	match room["type"]:
		"surface": return Color(0.08, 0.06, 0.03)
		"surface-exit": return Color(0.2, 0.1, 0.05)
		"tech": return Color(0.08, 0.08, 0.12)
		"storage": return Color(0.12, 0.10, 0.08)
		"medical", "mycelium-lab": return Color(0.08, 0.14, 0.11)
		"lab", "spore-chamber": return Color(0.12, 0.09, 0.16)
		"common": return Color(0.1, 0.09, 0.07)
		"kitchen", "fungus-kitchen": return Color(0.13, 0.10, 0.07)
		"workshop", "hyphae-forge": return Color(0.14, 0.11, 0.07)
		"archive": return Color(0.1, 0.10, 0.12)
		"server", "neural-mushroom": return Color(0.06, 0.08, 0.06)
		"office": return Color(0.12, 0.12, 0.10)
		"bedroom": return Color(0.12, 0.08, 0.10)
		"transit": return Color(0.10, 0.09, 0.08)
		"tunnel-warm": return Color(0.15, 0.08, 0.04)
		"tunnel-cool": return Color(0.05, 0.10, 0.12)
		_: return Color(0.08, 0.08, 0.08)


func _draw_room_interior(room: Dictionary, w: float, h: float) -> void:
	match room["type"]:
		"surface":
			_draw_gradient(0, 0, w, h, Color(0.06, 0.05, 0.03), Color(0.15, 0.10, 0.06))
		"surface-exit":
			_draw_surface_exit(w, h, room)
		"tech":
			_draw_monitors(w, h)
		"storage":
			_draw_shelves(w, h)
		"medical":
			_draw_beds(w, h)
		"mycelium-lab":
			_draw_mycelium(w, h)
		"lab":
			_draw_beakers(w, h)
		"spore-chamber":
			_draw_spore_chamber(w, h)
		"common":
			_draw_table(w, h)
		"kitchen":
			_draw_stove(w, h)
		"fungus-kitchen":
			_draw_fungus_kitchen(w, h)
		"workshop":
			_draw_workbench(w, h)
		"hyphae-forge":
			_draw_hyphae_forge(w, h)
		"archive":
			_draw_books(w, h)
		"server":
			_draw_racks(w, h)
		"neural-mushroom":
			_draw_neural_mushroom(w, h)
		"office":
			_draw_desk(w, h)
		"bedroom":
			_draw_bed(w, h)
		"transit":
			_draw_door(w, h)
		"tunnel-warm":
			_draw_rails(w, h, Color(0.91, 0.58, 0.23))
		"tunnel-cool":
			_draw_rails(w, h, Color(0.0, 1.0, 0.533))


func _apply_room_lighting(room: Dictionary, x: float, y: float, w: float, h: float) -> void:
	var light_color = _get_light_color(room.get("light", "dim"))
	draw_rect(Rect2(x, y, w, h), light_color * 0.2)


func _get_light_color(light_type: String) -> Color:
	match light_type:
		"red": return Color(0.82, 0.29, 0.25)
		"cool": return Color(0.0, 1.0, 0.533)
		"clinical": return Color(0.8, 0.85, 0.85)
		"hospital": return Color(0.565, 0.878, 0.722)
		"amber": return Color(0.91, 0.58, 0.23)
		"amber-hot": return Color(0.91, 0.58, 0.23)
		"warm": return Color(0.91, 0.58, 0.23)
		"neon-green": return Color(0.0, 1.0, 0.533)
		"office": return Color(0.56, 0.66, 0.78)
		"pink-dim": return Color(0.85, 0.53, 0.62)
		_: return Color(0.5, 0.5, 0.5)


# Interior drawers
func _draw_gradient(x: float, y: float, w: float, h: float, col_top: Color, col_bot: Color) -> void:
	for i in range(int(h)):
		var alpha = float(i) / float(h)
		var col = col_top.lerp(col_bot, alpha)
		draw_line(Vector2(x, y + i), Vector2(x + w, y + i), col)


func _draw_surface_exit(w: float, h: float, room: Dictionary) -> void:
	# Céu
	_draw_gradient(0, 0, w, h * 0.6, Color(0.3, 0.15, 0.08), Color(0.5, 0.2, 0.1))

	# Ruínas
	draw_colored_polygon(PackedVector2Array([
		Vector2(w * 0.1, h * 0.5), Vector2(w * 0.25, h * 0.2), Vector2(w * 0.35, h * 0.5)
	]), Color(0.05, 0.05, 0.05))

	# Enxame (silhuetas piscando)
	if (Engine.get_physics_frames() / 10) % 2 == 0:
		for i in range(5):
			draw_circle(Vector2(10 + i * 12, h * 0.45), 1, Color(0.2, 0.1, 0.05))


func _draw_monitors(w: float, h: float) -> void:
	var red = Color(0.82, 0.29, 0.25)
	var monitor_w = w * 0.25
	var monitor_h = h * 0.35
	var start_x = w * 0.12
	var start_y = h * 0.25

	for i in range(3):
		var mx = start_x + i * (monitor_w + 4)
		draw_rect(Rect2(mx, start_y, monitor_w, monitor_h), Color(0.1, 0.1, 0.15))
		draw_rect(Rect2(mx, start_y, monitor_w, monitor_h), Color(0.6, 0.6, 0.7), false, 2.0)
		if (Engine.get_physics_frames() / 15) % 2 == 0:
			draw_rect(Rect2(mx + 3, start_y + 3, monitor_w - 6, monitor_h - 6), red)


func _draw_shelves(w: float, h: float) -> void:
	var shelf_y = h * 0.3
	var shelf_spacing = h * 0.15

	for shelf in range(3):
		var sy = shelf_y + shelf * shelf_spacing
		draw_line(Vector2(8, sy), Vector2(w - 8, sy), Color(0.7, 0.6, 0.5), 3.0)

		for item in range(6):
			var item_w = (w - 16) / 6.0
			var ix = 8 + item * item_w + item_w * 0.2
			var item_color = Color(0.85, 0.75, 0.55) if shelf % 2 == 0 else Color(1.0, 0.9, 0.4)
			draw_rect(Rect2(ix, sy - 8, item_w * 0.6, 10), item_color)


func _draw_beds(w: float, h: float) -> void:
	var bed_h = h * 0.25
	var bed_y = h * 0.35

	draw_rect(Rect2(8, bed_y, w * 0.35, bed_h), Color(0.8, 0.95, 0.85))
	draw_rect(Rect2(w * 0.57, bed_y, w * 0.35, bed_h), Color(0.8, 0.95, 0.85))

	var green = Color(0.0, 1.0, 0.533)
	draw_circle(Vector2(w - 12, bed_y + bed_h * 0.5), 6, green)


func _draw_beakers(w: float, h: float) -> void:
	var beaker_y = h * 0.4
	var beaker_size = h * 0.2

	var colors = [Color(0.31, 0.722, 0.447), Color(0.722, 0.353, 0.851), Color(1, 0.7, 0.2)]
	var spacing = w * 0.25

	for i in range(3):
		var bx = w * 0.15 + i * spacing
		draw_rect(Rect2(bx - beaker_size * 0.5, beaker_y, beaker_size, beaker_size * 1.2), colors[i], false, 2.0)
		draw_circle(Vector2(bx, beaker_y + beaker_size * 0.6), beaker_size * 0.3, colors[i])


func _draw_table(w: float, h: float) -> void:
	var table_y = h * 0.4
	var table_h = h * 0.2
	draw_rect(Rect2(w * 0.1, table_y, w * 0.8, table_h), Color(0.55, 0.42, 0.24))

	var amber = Color(0.91, 0.58, 0.23)
	for i in range(4):
		var cx = w * 0.2 + i * w * 0.2
		draw_circle(Vector2(cx, table_y + table_h * 0.5), 6, amber)


func _draw_stove(w: float, h: float) -> void:
	var stove_w = w * 0.35
	var stove_h = h * 0.3
	var stove_y = h * 0.3
	var stove_x = w * 0.325 - stove_w * 0.5

	draw_rect(Rect2(stove_x, stove_y, stove_w, stove_h), Color(0.25, 0.25, 0.25))

	for i in range(2):
		for j in range(2):
			draw_circle(Vector2(stove_x + 8 + i * 15, stove_y + 8 + j * 15), 5, Color(1, 0.5, 0.2))


func _draw_workbench(w: float, h: float) -> void:
	var bench_y = h * 0.35
	var bench_h = h * 0.25
	draw_rect(Rect2(8, bench_y, w - 16, bench_h), Color(0.35, 0.35, 0.35))

	for i in range(4):
		var vx = 20 + i * (w - 40) * 0.25
		draw_line(Vector2(vx, bench_y + 4), Vector2(vx, bench_y + bench_h - 4), Color(0.7, 0.7, 0.7), 2.0)

	if (Engine.get_physics_frames() / 8) % 3 == 0:
		draw_circle(Vector2(w - 12, bench_y + bench_h * 0.5), 4, Color(1, 0.7, 0.3))


func _draw_books(w: float, h: float) -> void:
	var shelf_y = h * 0.3
	var shelf_spacing = h * 0.15
	var book_w = (w - 16) / 6.0

	for r in range(3):
		var sy = shelf_y + r * shelf_spacing
		for c in range(6):
			var colors = [Color(1.0, 0.4, 0.2), Color(0.8, 0.2, 0.2), Color(0.6, 0.3, 0.15), Color(0.7, 0.5, 0.3), Color(0.5, 0.7, 0.4), Color(0.4, 0.6, 0.5)]
			draw_rect(Rect2(8 + c * book_w, sy, book_w - 2, 12), colors[c % 6])


func _draw_racks(w: float, h: float) -> void:
	var green = Color(0.0, 1.0, 0.533)
	var rack_y = h * 0.2
	var rack_w = w * 0.22
	var rack_h = h * 0.45

	for i in range(3):
		var rx = w * 0.1 + i * (rack_w + 6)
		draw_rect(Rect2(rx, rack_y, rack_w, rack_h), green, false, 2.0)

		for j in range(5):
			draw_circle(Vector2(rx + rack_w * 0.5, rack_y + 6 + j * (rack_h - 12) * 0.25), 2, green)


func _draw_desk(w: float, h: float) -> void:
	var desk_y = h * 0.35
	var desk_w = w * 0.6
	var desk_h = h * 0.2
	var desk_x = w * 0.2

	draw_rect(Rect2(desk_x, desk_y, desk_w, desk_h), Color(0.25, 0.2, 0.15))
	draw_rect(Rect2(desk_x + 8, desk_y - 12, desk_w - 16, 10), Color(0.05, 0.08, 0.15))
	draw_rect(Rect2(desk_x + 8, desk_y - 12, desk_w - 16, 10), Color(0.3, 0.5, 0.8), false, 2.0)


func _draw_bed(w: float, h: float) -> void:
	var bed_y = h * 0.35
	var bed_w = w * 0.6
	var bed_h = h * 0.25
	var bed_x = w * 0.2

	draw_rect(Rect2(bed_x, bed_y, bed_w, bed_h), Color(0.84, 0.39, 0.55))
	draw_line(Vector2(bed_x + 2, bed_y + 2), Vector2(bed_x + bed_w - 2, bed_y + 2), Color(1, 0.95, 0.9), 2.0)


func _draw_door(w: float, h: float) -> void:
	draw_rect(Rect2(w * 0.3, h * 0.15, w * 0.4, h * 0.65), Color(0.15, 0.15, 0.15))
	draw_rect(Rect2(w * 0.3, h * 0.15, w * 0.4, h * 0.65), Color(0.3, 0.3, 0.3), false, 3.0)
	draw_circle(Vector2(w * 0.65, h * 0.48), 4, Color(0.8, 0.8, 0.8))


func _draw_rails(w: float, h: float, rail_color: Color) -> void:
	var rail_y = h * 0.5
	draw_line(Vector2(0, rail_y), Vector2(w, rail_y), rail_color, 4.0)

	for i in range(8):
		var cx = (w / 8.0) * (i + 0.5)
		draw_line(Vector2(cx, rail_y - 12), Vector2(cx, rail_y + 12), rail_color, 2.0)


func _draw_zone_badge_if_needed(room: Dictionary, x: float, y: float, w: float, h: float) -> void:
	if room.has("zone_id"):
		var zone = HubState.get_zone_by_id(room["zone_id"])
		var color = zone.get("color", Color.WHITE)
		var pulse = abs(sin(Engine.get_physics_frames() * 0.02)) * 0.3 + 0.7
		draw_circle(Vector2(x + w - 8, y + 8), 5, color * pulse)
		draw_circle(Vector2(x + w - 8, y + 8), 4, color * 0.3)


func _draw_grid_lines() -> void:
	for col in range(7):
		var x = cell_width * col
		var total_h = 0.0
		for room in rooms:
			total_h += room["h"]
		draw_line(Vector2(x, 0), Vector2(x, total_h), variant_colors.get("grid", Color(0.15, 0.15, 0.15)), 1)


func _apply_variant() -> void:
	variant_colors = HubState.get_variant_data()
	queue_redraw()


func _on_variant_changed(_variant_key: String) -> void:
	_apply_variant()


# ---- Interiores bio/fungus ----

func _draw_spore_chamber(w: float, h: float) -> void:
	# Câmara de esporos — Dia 1. Cúpulas de cogumelos pulsantes + esporos flutuando.
	var purple := Color(0.72, 0.45, 0.85)
	var glow := Color(0.85, 0.60, 1.0)
	var pulse: float = abs(sin(Engine.get_physics_frames() * 0.04)) * 0.3 + 0.7

	# 3 cúpulas (cogumelos)
	for i in range(3):
		var cx := w * (0.22 + i * 0.29)
		var cy := h * 0.62
		# haste
		draw_rect(Rect2(cx - 2, cy, 4, 14), Color(0.85, 0.78, 0.62))
		# chapéu (semi-círculo via arco)
		draw_circle(Vector2(cx, cy), 8, purple * pulse)
		draw_circle(Vector2(cx, cy - 2), 6, glow * pulse * 0.6)

	# Esporos flutuando (partículas estáticas animadas)
	for i in range(6):
		var sx := w * (0.15 + i * 0.12)
		var sy_base := h * 0.3
		var sy_off := sin((Engine.get_physics_frames() * 0.03) + i) * 6.0
		draw_circle(Vector2(sx, sy_base + sy_off), 1.5, purple * 0.8)


func _draw_mycelium(w: float, h: float) -> void:
	# Micélio crescendo — rede de hifas turquesa + cogumelos menores
	var cyan := Color(0.30, 0.78, 0.72)

	# Rede de hifas (linhas orgânicas)
	for i in range(5):
		var x1 := w * (0.1 + i * 0.18)
		var x2 := x1 + randf_range(-8, 8) if false else x1 + sin(i) * 8.0
		draw_line(Vector2(x1, h * 0.25), Vector2(x2, h * 0.75), cyan * 0.6, 1.5)

	# Pequenos cogumelos
	for i in range(4):
		var cx := w * (0.15 + i * 0.22)
		var cy := h * 0.75
		draw_rect(Rect2(cx - 1, cy - 6, 2, 6), Color(0.85, 0.82, 0.72))
		draw_circle(Vector2(cx, cy - 6), 4, cyan)


func _draw_fungus_kitchen(w: float, h: float) -> void:
	# Bancada com ingredientes fúngicos + panela fervendo
	draw_rect(Rect2(w * 0.15, h * 0.55, w * 0.7, h * 0.12), Color(0.35, 0.28, 0.20))

	# Panela ao centro
	var pot_cx := w * 0.5
	var pot_cy := h * 0.48
	draw_rect(Rect2(pot_cx - 12, pot_cy - 6, 24, 14), Color(0.15, 0.15, 0.15))

	# Vapor (pulsando)
	var pulse: float = abs(sin(Engine.get_physics_frames() * 0.05)) * 0.4 + 0.4
	for i in range(3):
		var vx := pot_cx - 6 + i * 6
		draw_circle(Vector2(vx, pot_cy - 10), 2, Color(0.72, 0.85, 0.72, pulse))

	# Cogumelos na bancada
	for i in range(3):
		var mx := w * (0.22 + i * 0.22)
		draw_rect(Rect2(mx - 1, h * 0.52, 2, 6), Color(0.82, 0.72, 0.55))
		draw_circle(Vector2(mx, h * 0.52), 3, Color(0.78, 0.45, 0.35))


func _draw_hyphae_forge(w: float, h: float) -> void:
	# Forja biológica — raízes entrelaçadas crescendo de uma base quente
	var amber := Color(0.91, 0.58, 0.23)
	var pulse: float = abs(sin(Engine.get_physics_frames() * 0.03)) * 0.5 + 0.5

	# Base (brasas)
	draw_rect(Rect2(w * 0.2, h * 0.65, w * 0.6, h * 0.1), Color(0.25, 0.12, 0.06))
	for i in range(5):
		var ex := w * (0.25 + i * 0.12)
		draw_circle(Vector2(ex, h * 0.70), 3, amber * pulse)

	# Raízes crescendo (linhas verticais irregulares)
	for i in range(4):
		var rx := w * (0.25 + i * 0.17)
		var points := PackedVector2Array([
			Vector2(rx, h * 0.65),
			Vector2(rx + 3, h * 0.5),
			Vector2(rx - 2, h * 0.35),
			Vector2(rx + 1, h * 0.22)
		])
		for p in range(points.size() - 1):
			draw_line(points[p], points[p + 1], Color(0.55, 0.35, 0.18), 2.0)


func _draw_neural_mushroom(w: float, h: float) -> void:
	# Rede neural micótica — cogumelos conectados por filamentos pulsando
	var green := Color(0.30, 0.78, 0.60)
	var pulse: float = abs(sin(Engine.get_physics_frames() * 0.04)) * 0.5 + 0.5

	# Nodos (cogumelos-cérebro)
	var nodes: Array[Vector2] = [
		Vector2(w * 0.2, h * 0.3),
		Vector2(w * 0.5, h * 0.4),
		Vector2(w * 0.8, h * 0.3),
		Vector2(w * 0.3, h * 0.65),
		Vector2(w * 0.7, h * 0.65),
	]

	# Conexões (filamentos)
	for i in range(nodes.size()):
		for j in range(i + 1, nodes.size()):
			if nodes[i].distance_to(nodes[j]) < w * 0.5:
				draw_line(nodes[i], nodes[j], green * pulse * 0.4, 1.0)

	# Nodos
	for n in nodes:
		draw_circle(n, 5, green * pulse)
		draw_circle(n, 3, Color(0.6, 0.95, 0.8))
