class_name HubRocketPanel
extends CanvasLayer

var panel_node: PanelContainer
var rocket_canvas: Control

signal closed


func _ready() -> void:
	layer = 20
	_build_ui()
	_animate_open()


func _build_ui() -> void:
	var bg := ColorRect.new()
	bg.color = Color(0, 0, 0, 0.0)
	bg.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(bg)

	bg.gui_input.connect(func(e: InputEvent):
		if e is InputEventMouseButton and e.pressed:
			_animate_close()
	)

	panel_node = PanelContainer.new()
	panel_node.set_anchors_and_offsets_preset(Control.PRESET_CENTER)
	panel_node.custom_minimum_size = Vector2(360, 480)
	panel_node.modulate = Color(1, 1, 1, 0)
	panel_node.scale = Vector2(0.85, 0.85)

	var sb := StyleBoxFlat.new()
	sb.bg_color = Color(0.08, 0.10, 0.07, 0.96)
	sb.border_color = Color(0.72, 0.45, 0.85, 0.8)
	sb.border_width_left = 2
	sb.border_width_right = 2
	sb.border_width_top = 2
	sb.border_width_bottom = 2
	sb.corner_radius_top_left = 6
	sb.corner_radius_top_right = 6
	sb.corner_radius_bottom_left = 6
	sb.corner_radius_bottom_right = 6
	sb.content_margin_left = 16
	sb.content_margin_right = 16
	sb.content_margin_top = 16
	sb.content_margin_bottom = 16
	panel_node.add_theme_stylebox_override("panel", sb)

	add_child(panel_node)

	var vbox := VBoxContainer.new()
	vbox.add_theme_constant_override("separation", 8)
	panel_node.add_child(vbox)

	# Header
	var header := Label.new()
	header.text = "◈ CASULO BIOLÓGICO · ESQUEMA"
	header.add_theme_font_size_override("font_size", 13)
	header.add_theme_color_override("font_color", Color(0.85, 0.92, 0.78))
	header.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	vbox.add_child(header)

	var subtitle := Label.new()
	subtitle.text = "Dr. Paulo: \"Foguete? Não. Semente.\""
	subtitle.add_theme_font_size_override("font_size", 9)
	subtitle.add_theme_color_override("font_color", Color(0.72, 0.45, 0.85))
	subtitle.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	vbox.add_child(subtitle)

	# Canvas bio pod
	rocket_canvas = Control.new()
	rocket_canvas.custom_minimum_size = Vector2(328, 320)
	rocket_canvas.draw.connect(_on_rocket_draw)
	vbox.add_child(rocket_canvas)

	# Progress
	var built: int = HubState.rocket_pieces_built
	var total: int = HubState.ROCKET_RECIPE.size()
	var pct: int = int(float(built) / float(total) * 100.0)

	var status_label := Label.new()
	status_label.text = "%d / %d peças · %d%% germinado" % [built, total, pct]
	status_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	status_label.add_theme_font_size_override("font_size", 10)
	status_label.add_theme_color_override("font_color", Color(0.30, 0.78, 0.72))
	vbox.add_child(status_label)

	# Close button
	var close_btn := Button.new()
	close_btn.text = "Fechar"
	close_btn.custom_minimum_size = Vector2(100, 28)
	close_btn.pressed.connect(_on_close_pressed)
	var close_box := HBoxContainer.new()
	close_box.alignment = BoxContainer.ALIGNMENT_CENTER
	close_box.add_child(close_btn)
	vbox.add_child(close_box)


func _on_rocket_draw() -> void:
	if rocket_canvas == null:
		return
	var size: Vector2 = rocket_canvas.size
	var cx: float = size.x * 0.5
	var recipe: Array = HubState.ROCKET_RECIPE
	var built: int = HubState.rocket_pieces_built

	var purple := Color(0.72, 0.45, 0.85)
	var cyan := Color(0.30, 0.78, 0.72)
	var earth := Color(0.55, 0.35, 0.20)
	var amber := Color(0.91, 0.58, 0.23)
	var gray := Color(0.35, 0.32, 0.28, 0.6)

	# --- Desenhar silhueta do casulo ---
	var top_y: float = 30.0
	var bottom_y: float = size.y - 30.0
	var pod_h: float = bottom_y - top_y
	var body_w: float = 40.0

	# Bulbo de esporo (nose cone)
	var bulb_top := Vector2(cx, top_y)
	var bulb_left := Vector2(cx - body_w * 0.5, top_y + pod_h * 0.15)
	var bulb_right := Vector2(cx + body_w * 0.5, top_y + pod_h * 0.15)
	rocket_canvas.draw_colored_polygon(PackedVector2Array([
		bulb_top, bulb_right, Vector2(cx, top_y + pod_h * 0.22), bulb_left
	]), _piece_color(0, built, purple, gray))
	rocket_canvas.draw_polyline(PackedVector2Array([
		bulb_top, bulb_right, Vector2(cx, top_y + pod_h * 0.22), bulb_left, bulb_top
	]), purple * 0.8, 1.5)

	# Tubo de micélio (body) — 3 seções
	var body_top_y: float = top_y + pod_h * 0.22
	var body_bot_y: float = top_y + pod_h * 0.82
	var section_h: float = (body_bot_y - body_top_y) / 3.0
	for i in range(3):
		var sy := body_top_y + i * section_h
		var seg_color := _piece_color(i + 1, built, cyan, gray)
		rocket_canvas.draw_rect(
			Rect2(cx - body_w * 0.5, sy, body_w, section_h),
			seg_color
		)
		rocket_canvas.draw_rect(
			Rect2(cx - body_w * 0.5, sy, body_w, section_h),
			Color(0.15, 0.20, 0.18), false, 1.0
		)
		# Portholes (olhos de cogumelo)
		if _is_piece_built(i + 1, built):
			rocket_canvas.draw_circle(Vector2(cx, sy + section_h * 0.5), 3, Color(0.85, 0.92, 0.78))

	# Engine — raízes flamejantes (aletas laterais)
	var fin_left_pts := PackedVector2Array([
		Vector2(cx - body_w * 0.5, body_bot_y),
		Vector2(cx - body_w * 0.9, bottom_y - 5),
		Vector2(cx - body_w * 0.5, body_bot_y + pod_h * 0.08)
	])
	var fin_right_pts := PackedVector2Array([
		Vector2(cx + body_w * 0.5, body_bot_y),
		Vector2(cx + body_w * 0.9, bottom_y - 5),
		Vector2(cx + body_w * 0.5, body_bot_y + pod_h * 0.08)
	])
	var engine_color := _piece_color(4, built, earth, gray)
	rocket_canvas.draw_colored_polygon(fin_left_pts, engine_color)
	rocket_canvas.draw_colored_polygon(fin_right_pts, engine_color)

	# Raízes/chama (engine base)
	if built >= 5:
		for j in range(5):
			var fx := cx + (j - 2) * 6.0
			var fy_base := bottom_y - 5
			var pulse: float = abs(sin((Time.get_ticks_msec() * 0.003) + j)) * 0.5 + 0.5
			rocket_canvas.draw_line(
				Vector2(fx, fy_base),
				Vector2(fx + sin(j) * 2, fy_base + 10),
				amber * pulse, 2.0
			)

	# --- Anotações de peças (laterais, alternando esquerda/direita) ---
	var font: Font = ThemeDB.fallback_font
	var font_size := 9
	for i in range(recipe.size()):
		var piece: Dictionary = recipe[i]
		var piece_name: String = piece.get("name", "?")
		var is_built: bool = i < built
		var is_next: bool = i == built

		# Posição na coluna lateral
		var annotation_y: float = top_y + 20.0 + i * ((bottom_y - top_y - 40.0) / float(recipe.size()))
		var is_right_side: bool = i % 2 == 1
		var annotation_x: float = (size.x * 0.85) if is_right_side else (size.x * 0.15)
		var pod_attach_x: float = (cx + body_w * 0.5) if is_right_side else (cx - body_w * 0.5)
		var pod_attach_y: float = annotation_y

		# Linha conectora
		var line_color: Color = purple if is_built else (cyan if is_next else gray)
		rocket_canvas.draw_line(
			Vector2(pod_attach_x, pod_attach_y),
			Vector2(annotation_x, annotation_y),
			line_color * 0.6, 1.0
		)

		# Nodo (dot)
		rocket_canvas.draw_circle(Vector2(annotation_x, annotation_y), 3, line_color)

		# Label
		var label_align: int = HORIZONTAL_ALIGNMENT_LEFT if is_right_side else HORIZONTAL_ALIGNMENT_RIGHT
		var prefix: String = "✓ " if is_built else ("▸ " if is_next else "  ")
		var label_x: float = annotation_x + 6 if is_right_side else annotation_x - 6 - 70.0
		rocket_canvas.draw_string(
			font,
			Vector2(label_x, annotation_y + 3),
			prefix + piece_name,
			label_align,
			70.0,
			font_size,
			line_color
		)


func _piece_color(piece_index: int, built: int, active: Color, inactive: Color) -> Color:
	if piece_index < built:
		return active
	if piece_index == built:
		return active.lerp(inactive, 0.4)
	return inactive


func _is_piece_built(piece_index: int, built: int) -> bool:
	return piece_index < built


func _on_close_pressed() -> void:
	_animate_close()


func _input(event: InputEvent) -> void:
	if event is InputEventKey and event.pressed and event.keycode == KEY_ESCAPE:
		_animate_close()
		get_tree().root.set_input_as_handled()


func _animate_open() -> void:
	var tween := create_tween()
	tween.set_trans(Tween.TRANS_CUBIC)
	tween.set_ease(Tween.EASE_OUT)

	var bg: ColorRect = get_child(0)
	tween.parallel().tween_property(bg, "color:a", 0.6, 0.3)
	tween.parallel().tween_property(panel_node, "modulate:a", 1.0, 0.3)
	tween.parallel().tween_property(panel_node, "scale", Vector2(1.0, 1.0), 0.3)


func _animate_close() -> void:
	var tween := create_tween()
	tween.set_trans(Tween.TRANS_CUBIC)
	tween.set_ease(Tween.EASE_IN)

	var bg: ColorRect = get_child(0)
	tween.parallel().tween_property(bg, "color:a", 0.0, 0.2)
	tween.parallel().tween_property(panel_node, "modulate:a", 0.0, 0.2)
	tween.parallel().tween_property(panel_node, "scale", Vector2(0.85, 0.85), 0.2)

	tween.tween_callback(func():
		closed.emit()
		queue_free()
	)
