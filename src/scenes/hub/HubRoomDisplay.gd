class_name HubRoomDisplay
extends Control

var rooms: Array[Dictionary] = []
var cell_width: float = 0
var room_y_offset: Dictionary = {}

func _ready() -> void:
	rooms = HubData.ROOMS.duplicate()
	_calculate_cell_sizes()
	_build_room_display()


func _calculate_cell_sizes() -> void:
	var viewport_size = get_viewport_rect().size
	cell_width = viewport_size.x / 6.0

	var y = 0.0
	for room in rooms:
		room_y_offset[room["id"]] = y
		y += room["h"]


func _build_room_display() -> void:
	for room in rooms:
		var x = cell_width * room["col"]
		var y = room_y_offset.get(room["id"], 0.0)
		var w = cell_width * room["w"]
		var h = room["h"]

		# Container pra sala
		var room_container = Control.new()
		room_container.custom_minimum_size = Vector2(w, h)
		room_container.position = Vector2(x, y)
		room_container.size = Vector2(w, h)
		add_child(room_container)

		# Background colorido
		var bg = ColorRect.new()
		bg.color = _get_room_base_color(room)
		bg.size = Vector2(w, h)
		room_container.add_child(bg)

		# Ícone/símbolo grande no meio (visível)
		var icon = _create_room_icon(room, w, h)
		room_container.add_child(icon)

		# Label com nome da sala
		if room.has("label"):
			var label = Label.new()
			label.text = room["label"]
			label.add_theme_font_size_override("font_size", 10)
			label.position = Vector2(4, 4)
			label.custom_minimum_size = Vector2(w - 8, 0)
			label.clip_text = true
			room_container.add_child(label)

		# Detectar clique
		var area = Area2D.new()
		var col_rect = CollisionShape2D.new()
		var shape = RectangleShape2D.new()
		shape.size = Vector2(w, h)
		col_rect.shape = shape
		area.add_child(col_rect)
		area.position = Vector2(x, y)
		area.input_event.connect(func(event: InputEvent):
			if event is InputEventMouseButton and event.pressed:
				pass  # TODO: room clicked
		)
		add_child(area)


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


func _create_room_icon(room: Dictionary, w: float, h: float) -> Control:
	var icon = Control.new()
	icon.size = Vector2(w, h)
	var center_x = w * 0.5
	var center_y = h * 0.5
	var icon_size = min(w, h) * 0.25

	# Desenhar ícone específico por tipo de sala
	match room["type"]:
		"tech":
			for i in range(2):
				var rect = ColorRect.new()
				rect.color = Color(1, 0, 0)
				rect.size = Vector2(icon_size * 0.8, icon_size * 0.6)
				rect.position = Vector2(center_x - icon_size + i * icon_size, center_y - icon_size * 0.3)
				icon.add_child(rect)
		"storage":
			var rect = ColorRect.new()
			rect.color = Color(0.8, 0.7, 0.2)
			rect.size = Vector2(icon_size * 2, icon_size * 1.5)
			rect.position = Vector2(center_x - icon_size, center_y - icon_size * 0.75)
			icon.add_child(rect)
		"medical":
			var label = Label.new()
			label.text = "+"
			label.add_theme_font_size_override("font_size", int(icon_size * 2))
			label.position = Vector2(center_x - icon_size * 0.5, center_y - icon_size)
			label.modulate = Color(0, 1, 0.5)
			icon.add_child(label)
		_:
			var rect = ColorRect.new()
			rect.color = Color(0.5, 0.5, 0.5)
			rect.size = Vector2(icon_size, icon_size)
			rect.position = Vector2(center_x - icon_size * 0.5, center_y - icon_size * 0.5)
			icon.add_child(rect)

	return icon
