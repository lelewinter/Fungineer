## PowerOfferScreen — Shown after Wave 2 is cleared.
## Pauses game, offers 3 random powers. Player picks one.
class_name PowerOfferScreen
extends CanvasLayer

signal power_chosen(power)


func _ready() -> void:
	visible = false
	_build_frame()


func _build_frame() -> void:
	var panel := ColorRect.new()
	panel.color = Color(0.06, 0.05, 0.08, 0.96)
	panel.size = Vector2(360, 300)
	panel.position = Vector2(GameConfig.VIEWPORT_WIDTH * 0.5 - 180, GameConfig.VIEWPORT_HEIGHT * 0.5 - 150)
	add_child(panel)

	var title := Label.new()
	title.text = "ESCOLHA UM PODER"
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title.position = Vector2(GameConfig.VIEWPORT_WIDTH * 0.5 - 160, GameConfig.VIEWPORT_HEIGHT * 0.5 - 138)
	title.size = Vector2(320, 24)
	title.add_theme_font_size_override("font_size", 16)
	title.modulate = Color(0.7, 0.5, 1.0)
	add_child(title)


func show_offer(power_options: Array) -> void:
	# Remove old buttons
	for child in get_children():
		if child is Button:
			child.queue_free()

	var start_y: float = GameConfig.VIEWPORT_HEIGHT * 0.5 - 108.0
	for i in power_options.size():
		var p = power_options[i]
		var btn := Button.new()
		btn.text = "%s\n%s" % [p.power_name, p.description if "description" in p else ""]
		btn.size = Vector2(320, 56)
		btn.position = Vector2(GameConfig.VIEWPORT_WIDTH * 0.5 - 160, start_y + i * 66.0)
		var power_ref = p
		btn.pressed.connect(func():
			power_chosen.emit(power_ref)
			visible = false
		)
		add_child(btn)

	visible = true
	GameState.pause_for_event()
