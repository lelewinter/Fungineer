class_name HubRocket
extends Node2D

# HUD compacto de progresso do casulo biológico.
# O casulo detalhado fica em HubRocketPanel (ao clicar para abrir).

var pieces_built: int = 0


func _ready() -> void:
	pieces_built = HubState.rocket_pieces_built
	HubState.rocket_piece_built.connect(_on_piece_built)
	z_index = 5


func _on_piece_built(_index: int, _name: String) -> void:
	pieces_built = HubState.rocket_pieces_built
	queue_redraw()


func _draw() -> void:
	var viewport_w: float = get_viewport_rect().size.x
	var center_x: float = viewport_w * 0.5
	var hud_y: float = 24.0

	var total: int = HubState.ROCKET_RECIPE.size()
	var progress_text: String = "CASULO · %d/%d" % [pieces_built, total]
	var state_color: Color = _get_state_color()

	var font: Font = ThemeDB.fallback_font
	var font_size: int = 10
	var text_size: Vector2 = font.get_string_size(progress_text, HORIZONTAL_ALIGNMENT_CENTER, -1, font_size)
	var box_w: float = text_size.x + 16
	var box_h: float = text_size.y + 6
	var bx: float = center_x - box_w * 0.5
	var by: float = hud_y - box_h * 0.5

	# Fundo
	draw_rect(Rect2(bx, by, box_w, box_h), Color(0.06, 0.07, 0.05, 0.9))
	draw_rect(Rect2(bx, by, box_w, box_h), state_color, false, 1.0)

	draw_string(
		font,
		Vector2(bx + 8, hud_y + text_size.y * 0.3),
		progress_text,
		HORIZONTAL_ALIGNMENT_LEFT,
		-1,
		font_size,
		state_color
	)


func _get_state_color() -> Color:
	# Paleta bio: esporo roxo → turquesa bio → verde micélio → pronto dourado
	match pieces_built:
		0, 1, 2: return Color(0.72, 0.45, 0.85)
		3, 4, 5: return Color(0.30, 0.78, 0.72)
		6, 7:    return Color(0.40, 0.85, 0.55)
		8:       return Color(1.0, 0.85, 0.4)
		_:       return Color(0.5, 0.5, 0.5)
