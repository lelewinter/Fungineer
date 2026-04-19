class_name HubRocket
extends Node2D

var pieces_built: int = 0
var room_y_offset: Dictionary = {}
var total_height: float = 0.0

func _ready() -> void:
	pieces_built = HubState.rocket_pieces_built
	HubState.rocket_piece_built.connect(_on_piece_built)

	# Calcular altura total
	for room in HubData.ROOMS:
		room_y_offset[room["id"]] = total_height
		total_height += room["h"]


func _on_piece_built(_index: int, _name: String) -> void:
	pieces_built = HubState.rocket_pieces_built
	queue_redraw()


func _draw() -> void:
	_draw_rocket()


func _draw_rocket() -> void:
	var center_x = get_viewport_rect().size.x * 0.5

	# Foguete ocupa andares 2-5 aproximadamente
	# Para simplicidade, renderizar no centro da tela
	var rocket_start_y = 80.0  # Depois do primeiro andar
	var rocket_height = 240.0

	# Cor dinâmica baseada em progresso
	var state_color = _get_state_color()
	var hull_color = state_color * 0.7  # versão mais escura para o casco

	# Base estrutural (círculo + retângulos)
	draw_circle(Vector2(center_x, rocket_start_y), 8, state_color)

	# Casco (cilindro)
	draw_line(Vector2(center_x - 10, rocket_start_y + 20), Vector2(center_x - 10, rocket_start_y + rocket_height - 20), hull_color, 3)
	draw_line(Vector2(center_x + 10, rocket_start_y + 20), Vector2(center_x + 10, rocket_start_y + rocket_height - 20), hull_color, 3)

	# Andaime
	if pieces_built < 3:
		draw_line(Vector2(center_x + 15, rocket_start_y + 40), Vector2(center_x + 15, rocket_start_y + 180), Color(0.8, 0.7, 0.5), 2)

	# Motor (base)
	if pieces_built >= 1:
		draw_circle(Vector2(center_x, rocket_start_y + rocket_height - 10), 8, Color(1, 0.6, 0.2))

	# Rebites
	for i in range(6):
		var y_pos = rocket_start_y + 40 + i * 30
		draw_circle(Vector2(center_x - 12, y_pos), 1, Color(0.8, 0.8, 0.8))
		draw_circle(Vector2(center_x + 12, y_pos), 1, Color(0.8, 0.8, 0.8))

	# Portholes (verde neon pulsando)
	if pieces_built >= 2:
		var green = Color(0.0, 1.0, 0.533)
		var pulse = abs(sin(Engine.get_physics_frames() * 0.01)) * 0.5 + 0.5
		draw_circle(Vector2(center_x, rocket_start_y + 60), 3, green * pulse)
		draw_circle(Vector2(center_x, rocket_start_y + 120), 3, green * pulse)

	# Progresso (label)
	var progress_text = "Peças: %d/8" % pieces_built
	draw_string(ThemeDB.fallback_font, Vector2(center_x - 20, rocket_start_y - 10), progress_text, HORIZONTAL_ALIGNMENT_LEFT, -1, 9, Color(0.96, 0.89, 0.78))


func _get_state_color() -> Color:
	match pieces_built:
		0, 1, 2:  # Building — Amber (warm)
			return Color(0.91, 0.58, 0.23)
		3, 4, 5:  # Mid-progress — Blue (cool)
			return Color(0.0, 1.0, 0.68)
		6, 7:  # Nearly complete — Green (success)
			return Color(0.31, 0.722, 0.447)
		8:  # Complete — Golden
			return Color(1.0, 0.85, 0.2)
		_:
			return Color(0.5, 0.5, 0.5)
