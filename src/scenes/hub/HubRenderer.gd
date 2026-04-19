class_name HubRenderer
extends Node2D

var rooms: Array[Dictionary] = []
var variant: Dictionary = {}
var cell_width: float = 0
var room_y_offset: Dictionary = {}
var input_areas: Dictionary = {}

signal room_clicked(room_id: String)

func _ready() -> void:
	rooms = HubData.ROOMS.duplicate()
	_calculate_cell_sizes()
	_build_room_hitboxes()


func _calculate_cell_sizes() -> void:
	# Viewport é geralmente 384×672 (Android frame)
	# 6 colunas, então cell_width = 64
	var viewport_size = get_viewport_rect().size
	cell_width = viewport_size.x / 6.0

	# Calcula offsets Y de cada sala
	var y = 0.0
	for i in range(rooms.size()):
		var room_id = rooms[i]["id"]
		room_y_offset[room_id] = y
		y += rooms[i]["h"]


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

		# Conectar input
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

	match room["type"]:
		"surface":
			_draw_surface(x, y, w, h)
		"surface-exit":
			_draw_surface_exit(x, y, w, h, room)
		"tech":
			_draw_room_tech(x, y, w, h, room)
		"storage":
			_draw_room_storage(x, y, w, h)
		"medical":
			_draw_room_medical(x, y, w, h)
		"lab":
			_draw_room_lab(x, y, w, h)
		"common":
			_draw_room_common(x, y, w, h)
		"kitchen":
			_draw_room_kitchen(x, y, w, h)
		"workshop":
			_draw_room_workshop(x, y, w, h)
		"archive":
			_draw_room_archive(x, y, w, h)
		"server":
			_draw_room_server(x, y, w, h, room)
		"office":
			_draw_room_office(x, y, w, h)
		"bedroom":
			_draw_room_bedroom(x, y, w, h)
		"transit":
			_draw_room_transit(x, y, w, h)
		"tunnel-warm":
			_draw_tunnel_warm(x, y, w, h)
		"tunnel-cool":
			_draw_tunnel_cool(x, y, w, h)
		_:
			draw_rect(Rect2(x, y, w, h), Color(0.3, 0.3, 0.3))

	# Bordas
	draw_line(Vector2(x, y), Vector2(x + w, y), Color(0.2, 0.2, 0.2), 1.0)
	draw_line(Vector2(x, y + h), Vector2(x + w, y + h), Color(0.2, 0.2, 0.2), 1.0)
	draw_line(Vector2(x, y), Vector2(x, y + h), Color(0.2, 0.2, 0.2), 1.0)
	draw_line(Vector2(x + w, y), Vector2(x + w, y + h), Color(0.2, 0.2, 0.2), 1.0)


func _draw_surface(x: float, y: float, w: float, h: float) -> void:
	# Gradiente rochoso
	var col_top = Color(0.06, 0.05, 0.03)
	var col_bot = Color(0.15, 0.10, 0.06)

	draw_set_transform(Vector2(x, y), 0, Vector2(1, 1))

	# Gradient simples (rects empilhados)
	for i in range(int(h)):
		var alpha = float(i) / float(h)
		var col = col_top.lerp(col_bot, alpha)
		draw_line(Vector2(0, i), Vector2(w, i), col)


func _draw_surface_exit(x: float, y: float, w: float, h: float, room: Dictionary) -> void:
	draw_set_transform(Vector2(x, y), 0, Vector2(1, 1))

	# Céu poluído (gradiente laranja→vermelho)
	var col_sky = Color(0.3, 0.15, 0.08)
	var col_haze = Color(0.5, 0.2, 0.1)

	for i in range(int(h * 0.6)):
		var alpha = float(i) / float(h * 0.6)
		var col = col_sky.lerp(col_haze, alpha)
		draw_line(Vector2(0, i), Vector2(w, i), col)

	# Ruínas (silhuetas)
	draw_colored_polygon(PackedVector2Array([
		Vector2(w * 0.1, h * 0.5), Vector2(w * 0.25, h * 0.2),
		Vector2(w * 0.35, h * 0.5)
	]), Color(0.05, 0.05, 0.05))

	draw_colored_polygon(PackedVector2Array([
		Vector2(w * 0.65, h * 0.5), Vector2(w * 0.78, h * 0.15),
		Vector2(w * 0.9, h * 0.5)
	]), Color(0.08, 0.08, 0.08))

	# Zona badge
	if room.has("zone_id"):
		var zone = HubState.get_zone_by_id(room["zone_id"])
		var badge_color = zone.get("color", Color.WHITE)
		draw_circle(Vector2(w * 0.5, h * 0.1), 6, badge_color)
		draw_circle(Vector2(w * 0.5, h * 0.1), 5, badge_color * 0.3)


func _draw_room_tech(x: float, y: float, w: float, h: float, room: Dictionary) -> void:
	draw_set_transform(Vector2(x, y), 0, Vector2(1, 1))
	draw_rect(Rect2(0, 0, w, h), Color(0.08, 0.08, 0.12))

	# Monitores vermelhos piscando
	var red = Color(0.82, 0.29, 0.25)
	for i in range(3):
		var mx = 10 + i * 20
		draw_rect(Rect2(mx, h - 20, 16, 12), Color(0.05, 0.05, 0.08))
		if (Engine.get_physics_frames() / 15) % 2 == 0:
			draw_rect(Rect2(mx + 1, h - 19, 14, 10), red)

	_draw_zone_badge_if_needed(room, w, h)


func _draw_room_storage(x: float, y: float, w: float, h: float) -> void:
	draw_set_transform(Vector2(x, y), 0, Vector2(1, 1))
	draw_rect(Rect2(0, 0, w, h), Color(0.12, 0.10, 0.08))

	# Prateleiras
	draw_line(Vector2(4, h - 12), Vector2(w - 4, h - 12), Color(0.4, 0.4, 0.4), 1)
	draw_line(Vector2(4, h - 22), Vector2(w - 4, h - 22), Color(0.4, 0.4, 0.4), 1)

	# Itens nas prateleiras (pequenos rects)
	for i in range(8):
		draw_rect(Rect2(6 + i * 8, h - 10, 6, 6), Color(0.6, 0.5, 0.3))


func _draw_room_medical(x: float, y: float, w: float, h: float) -> void:
	draw_set_transform(Vector2(x, y), 0, Vector2(1, 1))
	draw_rect(Rect2(0, 0, w, h), Color(0.1, 0.15, 0.12))

	# Camas
	draw_rect(Rect2(6, h - 16, w * 0.4 - 8, 12), Color(0.8, 0.95, 0.85))
	draw_rect(Rect2(w * 0.5 + 4, h - 16, w * 0.4 - 8, 12), Color(0.8, 0.95, 0.85))

	# Cruz verde
	var green = Color(0.0, 1.0, 0.533)
	draw_line(Vector2(w - 8, h - 8), Vector2(w - 2, h - 8), green, 1)
	draw_line(Vector2(w - 5, h - 11), Vector2(w - 5, h - 5), green, 1)


func _draw_room_lab(x: float, y: float, w: float, h: float) -> void:
	draw_set_transform(Vector2(x, y), 0, Vector2(1, 1))
	draw_rect(Rect2(0, 0, w, h), Color(0.15, 0.12, 0.18))

	# Bancada
	draw_rect(Rect2(4, h - 8, w - 8, 6), Color(0.3, 0.25, 0.3))

	# Béqueres coloridos
	var colors = [Color(0.31, 0.722, 0.447), Color(0.722, 0.353, 0.851), Color(1, 0.7, 0.2)]
	for i in range(3):
		draw_circle(Vector2(10 + i * 20, h - 14), 4, colors[i % colors.size()])


func _draw_room_common(x: float, y: float, w: float, h: float) -> void:
	draw_set_transform(Vector2(x, y), 0, Vector2(1, 1))
	draw_rect(Rect2(0, 0, w, h), Color(0.1, 0.09, 0.07))

	# Mesa
	draw_rect(Rect2(w * 0.15, h - 12, w * 0.7, 8), Color(0.55, 0.42, 0.24))

	# Luminária (círculo âmbar)
	var amber = Color(0.91, 0.58, 0.23)
	draw_circle(Vector2(w * 0.5, h - 20), 6, amber)
	draw_circle(Vector2(w * 0.5, h - 20), 5, amber * 0.4)


func _draw_room_kitchen(x: float, y: float, w: float, h: float) -> void:
	draw_set_transform(Vector2(x, y), 0, Vector2(1, 1))
	draw_rect(Rect2(0, 0, w, h), Color(0.12, 0.10, 0.08))

	# Fogão
	draw_rect(Rect2(10, h - 12, 20, 8), Color(0.2, 0.2, 0.2))
	draw_circle(Vector2(14, h - 10), 2, Color(1, 0.4, 0.1))  # queimador
	draw_circle(Vector2(24, h - 10), 2, Color(1, 0.4, 0.1))


func _draw_room_workshop(x: float, y: float, w: float, h: float) -> void:
	draw_set_transform(Vector2(x, y), 0, Vector2(1, 1))
	draw_rect(Rect2(0, 0, w, h), Color(0.15, 0.12, 0.08))

	# Bancada
	draw_rect(Rect2(4, h - 8, w - 8, 6), Color(0.3, 0.3, 0.3))

	# Ferramentas (pequenas linhas)
	for i in range(5):
		draw_line(Vector2(8 + i * 12, h - 12), Vector2(8 + i * 12, h - 6), Color(0.5, 0.5, 0.5), 1)


func _draw_room_archive(x: float, y: float, w: float, h: float) -> void:
	draw_set_transform(Vector2(x, y), 0, Vector2(1, 1))
	draw_rect(Rect2(0, 0, w, h), Color(0.1, 0.10, 0.12))

	# Prateleiras com livros
	for r in range(2):
		for c in range(6):
			draw_rect(Rect2(6 + c * 10, h - 10 - r * 10, 8, 8),
				Color([0.55, 0.24, 0.22, 0.24, 0.353, 0.36][c % 6]))


func _draw_room_server(x: float, y: float, w: float, h: float, room: Dictionary) -> void:
	draw_set_transform(Vector2(x, y), 0, Vector2(1, 1))
	draw_rect(Rect2(0, 0, w, h), Color(0.05, 0.05, 0.08))

	var green = Color(0.0, 1.0, 0.533)

	# Server racks
	for i in range(3):
		draw_rect(Rect2(8 + i * 18, h - 26, 14, 24), Color(0.08, 0.08, 0.1))
		draw_rect(Rect2(8 + i * 18, h - 26, 14, 24), green, false, 1)

		# Lights
		for j in range(4):
			draw_circle(Vector2(10 + i * 18, h - 24 + j * 6), 1.5, green)

	_draw_zone_badge_if_needed(room, w, h)


func _draw_room_office(x: float, y: float, w: float, h: float) -> void:
	draw_set_transform(Vector2(x, y), 0, Vector2(1, 1))
	draw_rect(Rect2(0, 0, w, h), Color(0.12, 0.12, 0.10))

	# Desk
	draw_rect(Rect2(6, h - 10, w - 12, 6), Color(0.25, 0.2, 0.15))

	# Monitor
	draw_rect(Rect2(12, h - 16, 18, 10), Color(0.05, 0.08, 0.15))
	draw_rect(Rect2(12, h - 16, 18, 10), Color(0.3, 0.5, 0.8), false, 1)


func _draw_room_bedroom(x: float, y: float, w: float, h: float) -> void:
	draw_set_transform(Vector2(x, y), 0, Vector2(1, 1))
	draw_rect(Rect2(0, 0, w, h), Color(0.12, 0.08, 0.10))

	# Cama rosa
	draw_rect(Rect2(6, h - 14, w - 12, 10), Color(0.84, 0.39, 0.55))


func _draw_room_transit(x: float, y: float, w: float, h: float) -> void:
	draw_set_transform(Vector2(x, y), 0, Vector2(1, 1))
	draw_rect(Rect2(0, 0, w, h), Color(0.10, 0.09, 0.08))

	# Porta
	draw_rect(Rect2(w * 0.35, h * 0.2, w * 0.3, h * 0.6), Color(0.2, 0.2, 0.2))
	draw_circle(Vector2(w * 0.6, h * 0.5), 2, Color(0.8, 0.8, 0.8))


func _draw_tunnel_warm(x: float, y: float, w: float, h: float) -> void:
	draw_set_transform(Vector2(x, y), 0, Vector2(1, 1))
	draw_rect(Rect2(0, 0, w, h), Color(0.15, 0.08, 0.04))

	# Rails e gradiente
	draw_line(Vector2(0, h * 0.7), Vector2(w, h * 0.7), Color(0.4, 0.3, 0.2), 2)


func _draw_tunnel_cool(x: float, y: float, w: float, h: float) -> void:
	draw_set_transform(Vector2(x, y), 0, Vector2(1, 1))
	draw_rect(Rect2(0, 0, w, h), Color(0.05, 0.10, 0.12))

	# Rails em neon
	var green = Color(0.0, 1.0, 0.533)
	draw_line(Vector2(0, h * 0.7), Vector2(w, h * 0.7), green, 2)


func _draw_grid_lines() -> void:
	# Linhas verticais de divisão de colunas
	for col in range(7):
		var x = cell_width * col
		var total_h = 0.0
		for room in rooms:
			total_h += room["h"]
		draw_line(Vector2(x, 0), Vector2(x, total_h), Color(0.15, 0.15, 0.15), 1)


func _draw_zone_badge_if_needed(room: Dictionary, w: float, h: float) -> void:
	if room.has("zone_id"):
		var zone = HubState.get_zone_by_id(room["zone_id"])
		var badge_color = zone.get("color", Color.WHITE)
		draw_circle(Vector2(w - 8, 6), 5, badge_color)
		draw_circle(Vector2(w - 8, 6), 4, badge_color * 0.4)
