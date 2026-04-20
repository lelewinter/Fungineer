## PowerOfferScreen — Shown after Wave 2 is cleared.
## Pauses game, offers 3 random powers. Player picks one.
class_name PowerOfferScreen
extends CanvasLayer

signal power_chosen(power)

const _PANEL_W := 400
const _PANEL_H := 350

var _powers_container: VBoxContainer


func _ready() -> void:
	visible = false
	_build_frame()


func _build_frame() -> void:
	var theme := load("res://assets/art/ui/theme.tres") as Theme

	var root := Control.new()
	root.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	root.theme = theme
	add_child(root)

	# Full-screen dim
	var dim := ColorRect.new()
	dim.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	dim.color = Color(0.0, 0.0, 0.04, 0.84)
	root.add_child(dim)

	# Main panel
	var panel := Panel.new()
	panel.size = Vector2(_PANEL_W, _PANEL_H)
	panel.position = Vector2(
		GameConfig.VIEWPORT_WIDTH * 0.5 - _PANEL_W * 0.5,
		GameConfig.VIEWPORT_HEIGHT * 0.5 - _PANEL_H * 0.5
	)
	_apply_power_panel_style(panel)
	root.add_child(panel)

	# Purple accent bar at top
	var accent := ColorRect.new()
	accent.size = Vector2(_PANEL_W, 3)
	accent.color = Color(0.56, 0.22, 0.92, 1.0)
	panel.add_child(accent)

	var title := Label.new()
	title.text = "ESCOLHA UM PODER"
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title.position = Vector2(0, 16)
	title.size = Vector2(_PANEL_W, 28)
	title.add_theme_font_size_override("font_size", 19)
	title.add_theme_color_override("font_color", Color(0.76, 0.50, 1.0, 1.0))
	panel.add_child(title)

	var subtitle := Label.new()
	subtitle.text = "Uma escolha define a sua run"
	subtitle.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	subtitle.position = Vector2(0, 46)
	subtitle.size = Vector2(_PANEL_W, 18)
	subtitle.add_theme_font_size_override("font_size", 11)
	subtitle.add_theme_color_override("font_color", Color(0.48, 0.38, 0.62, 1.0))
	panel.add_child(subtitle)

	var sep := HSeparator.new()
	sep.position = Vector2(20, 68)
	sep.size = Vector2(_PANEL_W - 40, 8)
	panel.add_child(sep)

	_powers_container = VBoxContainer.new()
	_powers_container.position = Vector2(20, 80)
	_powers_container.size = Vector2(_PANEL_W - 40, _PANEL_H - 100)
	_powers_container.add_theme_constant_override("separation", 10)
	panel.add_child(_powers_container)


func _apply_power_panel_style(panel: Panel) -> void:
	var style := StyleBoxFlat.new()
	style.bg_color = Color(0.06, 0.04, 0.11, 0.97)
	style.border_width_left = 1
	style.border_width_top = 1
	style.border_width_right = 1
	style.border_width_bottom = 1
	style.border_color = Color(0.44, 0.20, 0.74, 0.8)
	style.corner_radius_top_left = 8
	style.corner_radius_top_right = 8
	style.corner_radius_bottom_right = 8
	style.corner_radius_bottom_left = 8
	panel.add_theme_stylebox_override("panel", style)


func _make_card_style_normal() -> StyleBoxFlat:
	var s := StyleBoxFlat.new()
	s.bg_color = Color(0.10, 0.07, 0.19, 0.95)
	s.border_width_left = 1
	s.border_width_top = 1
	s.border_width_right = 1
	s.border_width_bottom = 2
	s.border_color = Color(0.46, 0.24, 0.74, 0.72)
	s.corner_radius_top_left = 5
	s.corner_radius_top_right = 5
	s.corner_radius_bottom_right = 5
	s.corner_radius_bottom_left = 5
	s.content_margin_left = 16.0
	s.content_margin_right = 16.0
	s.content_margin_top = 13.0
	s.content_margin_bottom = 13.0
	return s


func _make_card_style_hover() -> StyleBoxFlat:
	var s := StyleBoxFlat.new()
	s.bg_color = Color(0.18, 0.11, 0.32, 0.98)
	s.border_width_left = 1
	s.border_width_top = 1
	s.border_width_right = 1
	s.border_width_bottom = 2
	s.border_color = Color(0.74, 0.44, 1.0, 1.0)
	s.corner_radius_top_left = 5
	s.corner_radius_top_right = 5
	s.corner_radius_bottom_right = 5
	s.corner_radius_bottom_left = 5
	s.content_margin_left = 16.0
	s.content_margin_right = 16.0
	s.content_margin_top = 13.0
	s.content_margin_bottom = 13.0
	s.shadow_color = Color(0.56, 0.24, 1.0, 0.38)
	s.shadow_size = 6
	return s


func show_offer(power_options: Array) -> void:
	for child in _powers_container.get_children():
		child.queue_free()

	for p in power_options:
		var btn := Button.new()
		btn.text = p.power_name
		btn.custom_minimum_size = Vector2(_PANEL_W - 40, 66)
		btn.add_theme_stylebox_override("normal", _make_card_style_normal())
		btn.add_theme_stylebox_override("hover", _make_card_style_hover())
		btn.add_theme_stylebox_override("focus", _make_card_style_hover())
		btn.add_theme_stylebox_override("pressed", _make_card_style_hover())
		btn.add_theme_font_size_override("font_size", 15)
		btn.add_theme_color_override("font_color", Color(0.88, 0.78, 1.0, 1.0))
		btn.add_theme_color_override("font_hover_color", Color(1.0, 0.94, 1.0, 1.0))
		var power_ref = p
		btn.pressed.connect(func():
			power_chosen.emit(power_ref)
			visible = false
		)
		_powers_container.add_child(btn)

	visible = true
	GameState.pause_for_event()
