class_name HubCharacterCard
extends CanvasLayer

var npc_id: String = ""
var npc_data: Dictionary = {}
var panel_node: PanelContainer

signal closed

func _ready() -> void:
	layer = 10
	_build_ui()
	_animate_open()


func _build_ui() -> void:
	if npc_data.is_empty():
		return

	panel_node = PanelContainer.new()
	panel_node.set_anchors_and_offsets_preset(Control.PRESET_CENTER)
	panel_node.custom_minimum_size = Vector2(300, 200)
	panel_node.modulate = Color(1, 1, 1, 0)
	panel_node.scale = Vector2(0.9, 0.9)
	add_child(panel_node)

	var vbox = VBoxContainer.new()
	vbox.add_theme_constant_override("separation", 8)
	panel_node.add_child(vbox)

	# Header (nome + trust)
	var header = HBoxContainer.new()
	vbox.add_child(header)

	var name_label = Label.new()
	name_label.text = npc_data.get("nome", "Unknown")
	name_label.add_theme_font_size_override("font_size", 14)
	header.add_child(name_label)

	var spacer = Control.new()
	spacer.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	header.add_child(spacer)

	var trust_label = Label.new()
	trust_label.text = "🤝 %d%%" % npc_data.get("trust", 0)
	trust_label.add_theme_font_size_override("font_size", 12)
	header.add_child(trust_label)

	# Hint (profissão)
	var hint_label = Label.new()
	hint_label.text = npc_data.get("hint", "")
	hint_label.add_theme_font_size_override("font_size", 10)
	hint_label.add_theme_color_override("font_color", Color(0.8, 0.8, 0.8))
	vbox.add_child(hint_label)

	# Separator
	var sep = HSeparator.new()
	vbox.add_child(sep)

	# Dialog info
	var dialog_data = HubData.DIALOGS.get(npc_id, {})

	# Briefing
	var briefing_label = Label.new()
	briefing_label.text = dialog_data.get("briefing", "")
	briefing_label.autowrap_mode = TextServer.AUTOWRAP_WORD
	briefing_label.add_theme_font_size_override("font_size", 9)
	briefing_label.add_theme_color_override("font_color", Color(0.85, 0.85, 0.85))
	vbox.add_child(briefing_label)

	# Mission
	var mission_label = Label.new()
	mission_label.text = "→ " + dialog_data.get("mission", "Nenhuma missão")
	mission_label.add_theme_font_size_override("font_size", 9)
	mission_label.add_theme_color_override("font_color", Color(0.91, 0.58, 0.23))
	vbox.add_child(mission_label)

	# Spacer
	var spacer2 = Control.new()
	spacer2.size_flags_vertical = Control.SIZE_EXPAND_FILL
	vbox.add_child(spacer2)

	# Close button
	var close_btn = Button.new()
	close_btn.text = "Fechar"
	close_btn.pressed.connect(_on_close_pressed)
	vbox.add_child(close_btn)


func _on_close_pressed() -> void:
	_animate_close()


func _input(event: InputEvent) -> void:
	if event is InputEventKey and event.pressed and event.keycode == KEY_ESCAPE:
		_animate_close()
		get_tree().root.set_input_as_handled()


func _animate_open() -> void:
	var tween = create_tween()
	tween.set_trans(Tween.TRANS_CUBIC)
	tween.set_ease(Tween.EASE_OUT)

	tween.tween_property(panel_node, "modulate:a", 1.0, 0.25)
	tween.parallel().tween_property(panel_node, "scale", Vector2(1.0, 1.0), 0.25)


func _animate_close() -> void:
	var tween = create_tween()
	tween.set_trans(Tween.TRANS_CUBIC)
	tween.set_ease(Tween.EASE_IN)

	tween.tween_property(panel_node, "modulate:a", 0.0, 0.15)
	tween.parallel().tween_property(panel_node, "scale", Vector2(0.9, 0.9), 0.15)

	tween.tween_callback(func():
		closed.emit()
		queue_free()
	)
