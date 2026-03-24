## RescueScreen — Event UI shown after a wave is cleared.
## Pauses the game and offers 2 characters to rescue. Player picks one to join the party.
class_name RescueScreen
extends CanvasLayer

signal character_chosen(character_class)
signal skipped()

var _vbox: VBoxContainer

const _PANEL_W := 360
const _PANEL_H := 320


func _ready() -> void:
	visible = false
	_build_ui()


func _build_ui() -> void:
	var theme := load("res://assets/art/ui/theme.tres") as Theme

	var root := Control.new()
	root.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	root.theme = theme
	add_child(root)

	# Full-screen dim
	var dim := ColorRect.new()
	dim.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	dim.color = Color(0.0, 0.0, 0.0, 0.70)
	root.add_child(dim)

	# Main panel
	var panel := Panel.new()
	panel.size = Vector2(_PANEL_W, _PANEL_H)
	panel.position = Vector2(
		GameConfig.VIEWPORT_WIDTH * 0.5 - _PANEL_W * 0.5,
		GameConfig.VIEWPORT_HEIGHT * 0.5 - _PANEL_H * 0.5
	)
	_apply_panel_style(panel)
	root.add_child(panel)

	# Amber accent bar
	var accent := ColorRect.new()
	accent.size = Vector2(_PANEL_W, 3)
	accent.color = Color(0.90, 0.64, 0.08, 1.0)
	panel.add_child(accent)

	var header := VBoxContainer.new()
	header.position = Vector2(20, 16)
	header.size = Vector2(_PANEL_W - 40, 52)
	header.add_theme_constant_override("separation", 4)
	panel.add_child(header)

	var title := Label.new()
	title.text = "SOBREVIVENTE ENCONTRADO"
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title.add_theme_font_size_override("font_size", 16)
	title.add_theme_color_override("font_color", Color(0.96, 0.76, 0.14, 1.0))
	header.add_child(title)

	var subtitle := Label.new()
	subtitle.text = "Escolha quem resgatar:"
	subtitle.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	subtitle.add_theme_font_size_override("font_size", 12)
	subtitle.add_theme_color_override("font_color", Color(0.55, 0.46, 0.68, 1.0))
	header.add_child(subtitle)

	var sep := HSeparator.new()
	sep.position = Vector2(20, 72)
	sep.size = Vector2(_PANEL_W - 40, 8)
	panel.add_child(sep)

	_vbox = VBoxContainer.new()
	_vbox.position = Vector2(20, 84)
	_vbox.size = Vector2(_PANEL_W - 40, _PANEL_H - 104)
	_vbox.add_theme_constant_override("separation", 10)
	panel.add_child(_vbox)


func _apply_panel_style(panel: Panel) -> void:
	var style := StyleBoxFlat.new()
	style.bg_color = Color(0.06, 0.04, 0.06, 0.97)
	style.border_width_left = 1
	style.border_width_top = 1
	style.border_width_right = 1
	style.border_width_bottom = 1
	style.border_color = Color(0.54, 0.40, 0.08, 0.85)
	style.corner_radius_top_left = 8
	style.corner_radius_top_right = 8
	style.corner_radius_bottom_right = 8
	style.corner_radius_bottom_left = 8
	panel.add_theme_stylebox_override("panel", style)


func show_rescue(options: Array) -> void:
	if options.is_empty():
		skipped.emit()
		return

	for child in _vbox.get_children():
		if child is Button:
			child.queue_free()

	for char_def in options:
		var btn := Button.new()
		btn.text = "%s\n%s" % [char_def["name"], char_def["desc"]]
		btn.custom_minimum_size = Vector2(_PANEL_W - 40, 60)
		var cls = char_def["class"]
		btn.pressed.connect(func():
			character_chosen.emit(cls)
			visible = false
		)
		_vbox.add_child(btn)

	visible = true
	GameState.pause_for_event()
