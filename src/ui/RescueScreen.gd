## RescueScreen — Event UI shown after a wave is cleared.
## Pauses the game and offers 2 characters to rescue. Player picks one to join the party.
class_name RescueScreen
extends CanvasLayer

signal character_chosen(character_class)
signal skipped()

var _vbox: VBoxContainer


func _ready() -> void:
	visible = false
	_build_ui()


func _build_ui() -> void:
	var panel := ColorRect.new()
	panel.color = Color(0.06, 0.05, 0.04, 0.96)
	panel.size = Vector2(320, 260)
	panel.position = Vector2(GameConfig.VIEWPORT_WIDTH * 0.5 - 160, GameConfig.VIEWPORT_HEIGHT * 0.5 - 130)
	add_child(panel)

	_vbox = VBoxContainer.new()
	_vbox.position = Vector2(GameConfig.VIEWPORT_WIDTH * 0.5 - 140, GameConfig.VIEWPORT_HEIGHT * 0.5 - 110)
	_vbox.size = Vector2(280, 220)
	add_child(_vbox)

	var title := Label.new()
	title.text = "SOBREVIVENTE ENCONTRADO"
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title.add_theme_font_size_override("font_size", 14)
	title.modulate = Color(0.9, 0.8, 0.3)
	_vbox.add_child(title)

	var subtitle := Label.new()
	subtitle.text = "Escolha quem resgatar:"
	subtitle.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	subtitle.add_theme_font_size_override("font_size", 11)
	subtitle.modulate = Color(0.6, 0.6, 0.6)
	_vbox.add_child(subtitle)


func show_rescue(options: Array) -> void:
	if options.is_empty():
		skipped.emit()
		return

	# Clear old option buttons
	for child in _vbox.get_children():
		if child is Button:
			child.queue_free()

	for char_def in options:
		var btn := Button.new()
		btn.text = "%s\n%s" % [char_def["name"], char_def["desc"]]
		btn.custom_minimum_size = Vector2(260, 52)
		var cls = char_def["class"]
		btn.pressed.connect(func():
			character_chosen.emit(cls)
			visible = false
		)
		_vbox.add_child(btn)

	visible = true
	GameState.pause_for_event()
