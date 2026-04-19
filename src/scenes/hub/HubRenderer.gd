class_name HubRenderer
extends Node2D

var rooms: Array[Dictionary] = []
var cell_width: float = 0
var room_y_offset: Dictionary = {}
var input_areas: Dictionary = {}
var variant_colors: Dictionary = {}

signal room_clicked(room_id: String)

func _ready() -> void:
	rooms = HubData.ROOMS.duplicate()
	_calculate_cell_sizes()
	_build_room_hitboxes()
	_apply_variant()
	HubState.hub_variant_changed.connect(_on_variant_changed)


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

		area.input_event.connect(func(event: InputEvent):
			if event is InputEventMouseButton and event.pressed:
				room_clicked.emit(room["id"])
		)

		add_child(area)
		input_areas[room["id"]] = area


func _draw() -> void:
	if rooms.is_empty():
		return

	for room in rooms:
		_draw_room(room)

	_draw_grid_lines()


func _draw_room(room: Dictionary) -> void:
	var x = cell_width * room["col"]
	var y = room_y_offset.get(room["id"], 0.0)
	var w = cell_width * room["w"]
	var h = room["h"]

	# Fundo base
	draw_rect(Rect2(x, y, w, h), _get_room_base_color(room))

	# Interior
	draw_set_transform(Vector2(x, y), 0, Vector2(1, 1))
	_draw_room_interior(room, w, h)
	draw_set_transform(Vector2.ZERO, 0, Vector2(1, 1))

	# Iluminação
	_apply_room_lighting(room, x, y, w, h)

	# Zona badge
	_draw_zone_badge_if_needed(room, x, y, w, h)

	# Bordas
	draw_rect(Rect2(x, y, w, h), Color.TRANSPARENT, true, 1.0, Color(0.15, 0.15, 0.15))


func _get_room_base_color(room: Dictionary) -> Color:
	match room["type"]:
		"surface": return Color(0.08, 0.06, 0.03)
		"surface-exit": return Color(0.2, 0.1, 0.05)
		"tech": return Color(0.08, 0.08, 0.12)
		"storage": return Color(0.12, 0.10, 0.08)
		"medical": return Color(0.1, 0.15, 0.12)
		"lab": return Color(0.15, 0.12, 0.18)
		"common": return Color(0.1, 0.09, 0.07)
		"kitchen": return Color(0.12, 0.10, 0.08)
		"workshop": return Color(0.15, 0.12, 0.08)
		"archive": return Color(0.1, 0.10, 0.12)
		"server": return Color(0.05, 0.05, 0.08)
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
		"lab":
			_draw_beakers(w, h)
		"common":
			_draw_table(w, h)
		"kitchen":
			_draw_stove(w, h)
		"workshop":
			_draw_workbench(w, h)
		"archive":
			_draw_books(w, h)
		"server":
			_draw_racks(w, h)
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
	for i in range(3):
		var mx = 10 + i * 20
		draw_rect(Rect2(mx, h - 20, 16, 12), Color(0.05, 0.05, 0.08))
		if (Engine.get_physics_frames() / 15) % 2 == 0:
			draw_rect(Rect2(mx + 1, h - 19, 14, 10), red)


func _draw_shelves(w: float, h: float) -> void:
	# Prateleiras
	draw_line(Vector2(4, h - 12), Vector2(w - 4, h - 12), Color(0.4, 0.4, 0.4), 1)
	draw_line(Vector2(4, h - 22), Vector2(w - 4, h - 22), Color(0.4, 0.4, 0.4), 1)
	draw_line(Vector2(4, h - 32), Vector2(w - 4, h - 32), Color(0.4, 0.4, 0.4), 1)

	# Items
	for i in range(8):
		draw_rect(Rect2(6 + i * 8, h - 10, 6, 6), Color(0.6, 0.5, 0.3))
		draw_rect(Rect2(6 + i * 8, h - 20, 6, 6), Color(0.8, 0.7, 0.2))


func _draw_beds(w: float, h: float) -> void:
	draw_rect(Rect2(6, h - 16, w * 0.4 - 8, 12), Color(0.8, 0.95, 0.85))
	draw_rect(Rect2(w * 0.5 + 4, h - 16, w * 0.4 - 8, 12), Color(0.8, 0.95, 0.85))

	# Cruz verde
	var green = Color(0.0, 1.0, 0.533)
	draw_line(Vector2(w - 8, h - 8), Vector2(w - 2, h - 8), green, 1)
	draw_line(Vector2(w - 5, h - 11), Vector2(w - 5, h - 5), green, 1)


func _draw_beakers(w: float, h: float) -> void:
	draw_rect(Rect2(4, h - 8, w - 8, 6), Color(0.3, 0.25, 0.3))

	var colors = [Color(0.31, 0.722, 0.447), Color(0.722, 0.353, 0.851), Color(1, 0.7, 0.2)]
	for i in range(3):
		draw_circle(Vector2(10 + i * 20, h - 14), 4, colors[i])


func _draw_table(w: float, h: float) -> void:
	draw_rect(Rect2(w * 0.15, h - 12, w * 0.7, 8), Color(0.55, 0.42, 0.24))
	var amber = Color(0.91, 0.58, 0.23)
	draw_circle(Vector2(w * 0.5, h - 20), 6, amber)


func _draw_stove(w: float, h: float) -> void:
	draw_rect(Rect2(10, h - 12, 20, 8), Color(0.2, 0.2, 0.2))
	draw_circle(Vector2(14, h - 10), 2, Color(1, 0.4, 0.1))
	draw_circle(Vector2(24, h - 10), 2, Color(1, 0.4, 0.1))


func _draw_workbench(w: float, h: float) -> void:
	draw_rect(Rect2(4, h - 8, w - 8, 6), Color(0.3, 0.3, 0.3))
	for i in range(5):
		draw_line(Vector2(8 + i * 12, h - 12), Vector2(8 + i * 12, h - 6), Color(0.5, 0.5, 0.5), 1)

	# Faísca animada
	if (Engine.get_physics_frames() / 8) % 3 == 0:
		draw_circle(Vector2(w - 8, h - 8), 2, Color(1, 0.6, 0.2))


func _draw_books(w: float, h: float) -> void:
	for r in range(2):
		for c in range(6):
			var colors = [0.55, 0.24, 0.22, 0.24, 0.353, 0.36]
			draw_rect(Rect2(6 + c * 10, h - 10 - r * 10, 8, 8),
				Color(colors[c % 6], colors[c % 6], colors[c % 6]))


func _draw_racks(w: float, h: float) -> void:
	var green = Color(0.0, 1.0, 0.533)
	for i in range(3):
		draw_rect(Rect2(8 + i * 18, h - 26, 14, 24), Color.TRANSPARENT, true, 1.0, green)

		for j in range(4):
			draw_circle(Vector2(10 + i * 18, h - 24 + j * 6), 1.5, green)


func _draw_desk(w: float, h: float) -> void:
	draw_rect(Rect2(6, h - 10, w - 12, 6), Color(0.25, 0.2, 0.15))
	draw_rect(Rect2(12, h - 16, 18, 10), Color(0.05, 0.08, 0.15), true, 1.0, Color(0.3, 0.5, 0.8))


func _draw_bed(w: float, h: float) -> void:
	draw_rect(Rect2(6, h - 14, w - 12, 10), Color(0.84, 0.39, 0.55))


func _draw_door(w: float, h: float) -> void:
	draw_rect(Rect2(w * 0.35, h * 0.2, w * 0.3, h * 0.6), Color(0.2, 0.2, 0.2))
	draw_circle(Vector2(w * 0.6, h * 0.5), 2, Color(0.8, 0.8, 0.8))


func _draw_rails(w: float, h: float, rail_color: Color) -> void:
	draw_line(Vector2(0, h * 0.7), Vector2(w, h * 0.7), rail_color, 2)
	for i in range(6):
		draw_line(Vector2(4 + i * 12, h * 0.65), Vector2(4 + i * 12, h * 0.75), rail_color, 1)


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


func _on_variant_changed(variant_key: String) -> void:
	_apply_variant()
