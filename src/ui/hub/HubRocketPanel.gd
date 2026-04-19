class_name HubRocketPanel
extends CanvasLayer

var pieces: Array[Dictionary] = [
	{"id": "base", "name": "Base Estrutural", "state": "built"},
	{"id": "motor", "name": "Motor Principal", "state": "in_progress"},
	{"id": "processor", "name": "Processador", "state": "blocked"},
	{"id": "revestimento", "name": "Revestimento", "state": "locked"},
	{"id": "rede_neural", "name": "Rede Neural", "state": "locked"},
	{"id": "sistema_vital", "name": "Sistema Vital", "state": "locked"},
	{"id": "blindagem", "name": "Blindagem", "state": "locked"},
]

signal closed

func _ready() -> void:
	layer = 20
	_build_ui()


func _build_ui() -> void:
	var bg = ColorRect.new()
	bg.color = Color(0, 0, 0, 0.6)
	bg.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(bg)

	bg.gui_input.connect(func(e: InputEvent):
		if e is InputEventMouseButton and e.pressed:
			closed.emit()
			queue_free()
	)

	var panel = PanelContainer.new()
	panel.set_anchors_and_offsets_preset(Control.PRESET_CENTER)
	panel.custom_minimum_size = Vector2(360, 420)
	add_child(panel)

	var vbox = VBoxContainer.new()
	panel.add_child(vbox)

	# Header
	var header = Label.new()
	header.text = "◆ FOGUETE · BLUEPRINT"
	header.add_theme_font_size_override("font_size", 14)
	header.alignment = HORIZONTAL_ALIGNMENT_CENTER
	vbox.add_child(header)

	# Canvas para desenhar foguete
	var rocket_canvas = Control.new()
	rocket_canvas.custom_minimum_size = Vector2(340, 280)
	rocket_canvas.draw.connect(_on_rocket_draw)
	vbox.add_child(rocket_canvas)

	# Status
	var status_label = Label.new()
	status_label.text = "Peças construídas: %d/7" % HubState.rocket_pieces_built
	status_label.alignment = HORIZONTAL_ALIGNMENT_CENTER
	status_label.add_theme_font_size_override("font_size", 10)
	vbox.add_child(status_label)

	# Close button
	var close_btn = Button.new()
	close_btn.text = "Fechar"
	close_btn.pressed.connect(_on_close_pressed)
	vbox.add_child(close_btn)


func _on_rocket_draw() -> void:
	# TODO: Implementar desenho do foguete e peças em anéis
	pass


func _on_close_pressed() -> void:
	closed.emit()
	queue_free()


func _input(event: InputEvent) -> void:
	if event is InputEventKey and event.pressed and event.keycode == KEY_ESCAPE:
		closed.emit()
		queue_free()
		get_tree().root.set_input_as_handled()
