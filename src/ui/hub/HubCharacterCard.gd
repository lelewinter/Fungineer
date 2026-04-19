class_name HubCharacterCard
extends CanvasLayer

var npc_id: String = ""
var npc_data: Dictionary = {}

signal closed

func _ready() -> void:
	layer = 10
	_build_ui()


func _build_ui() -> void:
	if npc_data.is_empty():
		return

	var panel = PanelContainer.new()
	panel.set_anchors_and_offsets_preset(Control.PRESET_CENTER)
	panel.custom_minimum_size = Vector2(280, 160)
	add_child(panel)

	var vbox = VBoxContainer.new()
	vbox.add_theme_constant_override("separation", 8)
	panel.add_child(vbox)

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

	# Mission (placeholder)
	var mission_label = Label.new()
	mission_label.text = "Missão disponível"
	mission_label.add_theme_font_size_override("font_size", 10)
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
	closed.emit()
	queue_free()


func _input(event: InputEvent) -> void:
	if event is InputEventKey and event.pressed and event.keycode == KEY_ESCAPE:
		closed.emit()
		queue_free()
		get_tree().root.set_input_as_handled()
