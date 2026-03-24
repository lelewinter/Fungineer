## VictoryScreen — Shown when the boss is defeated.
class_name VictoryScreen
extends CanvasLayer

signal hub_requested()
signal quit_requested()

var _time_label: Label
var _frag_label: Label

const _PANEL_W := 400
const _PANEL_H := 330


func _ready() -> void:
	visible = false
	var theme := load("res://assets/art/ui/theme.tres") as Theme

	var root := Control.new()
	root.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	root.theme = theme
	add_child(root)

	# Full-screen dim (lighter than game over — victory feels different)
	var dim := ColorRect.new()
	dim.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	dim.color = Color(0.0, 0.02, 0.0, 0.65)
	root.add_child(dim)

	# Main panel
	var panel := Panel.new()
	panel.size = Vector2(_PANEL_W, _PANEL_H)
	panel.position = Vector2(
		GameConfig.VIEWPORT_WIDTH * 0.5 - _PANEL_W * 0.5,
		GameConfig.VIEWPORT_HEIGHT * 0.5 - _PANEL_H * 0.5
	)
	_apply_panel_style(panel, Color(0.07, 0.06, 0.03, 0.97), Color(0.68, 0.50, 0.05, 0.9))
	root.add_child(panel)

	# Gold accent bar at top
	var accent := ColorRect.new()
	accent.size = Vector2(_PANEL_W, 3)
	accent.color = Color(0.92, 0.68, 0.0, 1.0)
	panel.add_child(accent)

	var vbox := VBoxContainer.new()
	vbox.position = Vector2(24, 18)
	vbox.size = Vector2(_PANEL_W - 48, _PANEL_H - 36)
	vbox.add_theme_constant_override("separation", 10)
	panel.add_child(vbox)

	var title := Label.new()
	title.text = "VITÓRIA!"
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title.add_theme_font_size_override("font_size", 44)
	title.add_theme_color_override("font_color", Color(0.98, 0.84, 0.08, 1.0))
	vbox.add_child(title)

	var sep := HSeparator.new()
	vbox.add_child(sep)

	_frag_label = Label.new()
	_frag_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_frag_label.add_theme_font_size_override("font_size", 20)
	_frag_label.add_theme_color_override("font_color", Color(0.35, 0.88, 1.0, 1.0))
	vbox.add_child(_frag_label)

	_time_label = Label.new()
	_time_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_time_label.add_theme_font_size_override("font_size", 14)
	_time_label.add_theme_color_override("font_color", Color(0.62, 0.58, 0.78, 1.0))
	vbox.add_child(_time_label)

	var spacer := Control.new()
	spacer.custom_minimum_size = Vector2(0, 8)
	vbox.add_child(spacer)

	var hub_btn := Button.new()
	hub_btn.text = "Voltar à Base"
	hub_btn.pressed.connect(func(): hub_requested.emit())
	vbox.add_child(hub_btn)

	var quit_btn := Button.new()
	quit_btn.text = "Sair"
	quit_btn.pressed.connect(func(): quit_requested.emit())
	vbox.add_child(quit_btn)


func _apply_panel_style(panel: Panel, bg: Color, border: Color) -> void:
	var style := StyleBoxFlat.new()
	style.bg_color = bg
	style.border_width_left = 1
	style.border_width_top = 1
	style.border_width_right = 1
	style.border_width_bottom = 1
	style.border_color = border
	style.corner_radius_top_left = 7
	style.corner_radius_top_right = 7
	style.corner_radius_bottom_right = 7
	style.corner_radius_bottom_left = 7
	panel.add_theme_stylebox_override("panel", style)


func show_screen(run_time: float, fragments: int) -> void:
	visible = true
	var t := int(run_time)
	_time_label.text = "Tempo de run: %02d:%02d" % [t / 60, t % 60]
	_frag_label.text = "+ %d Fragmentos de Tecnologia" % fragments
