## StealthHUD — Minimal HUD for the Stealth Zone.
## Shows backpack slots and chase warning.
class_name StealthHUD
extends CanvasLayer

var _backpack_slot_nodes: Array[TextureRect] = []
var _chase_label: Label
var _chase_panel: Panel

var _tex_slot_empty: Texture2D
var _tex_slot_filled: Texture2D


func _ready() -> void:
	_tex_slot_empty = load("res://assets/art/ui/icons/backpack_slot_empty.svg")
	_tex_slot_filled = load("res://assets/art/ui/icons/backpack_slot_filled.svg")
	var theme := load("res://assets/art/ui/theme.tres") as Theme

	var root := Control.new()
	root.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	root.theme = theme
	add_child(root)

	_build_backpack_ui(root)
	_build_chase_ui(root)
	GameState.backpack_changed.connect(_on_backpack_changed)


func _build_backpack_ui(root: Control) -> void:
	var capacity := HubState.get_backpack_capacity()
	var slot_size := 28.0
	var gap := 5.0
	var total_w := capacity * (slot_size + gap) - gap
	var start_x := GameConfig.VIEWPORT_WIDTH - total_w - 12.0
	var slot_y := GameConfig.VIEWPORT_HEIGHT - slot_size - 12.0

	var bp_panel := Panel.new()
	bp_panel.position = Vector2(start_x - 9, slot_y - 9)
	bp_panel.size = Vector2(total_w + 18, slot_size + 18)
	root.add_child(bp_panel)

	for i in capacity:
		var slot := TextureRect.new()
		slot.texture = _tex_slot_empty
		slot.size = Vector2(slot_size, slot_size)
		slot.position = Vector2(start_x + i * (slot_size + gap), slot_y)
		slot.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
		root.add_child(slot)
		_backpack_slot_nodes.append(slot)


func _build_chase_ui(root: Control) -> void:
	_chase_panel = Panel.new()
	_chase_panel.size = Vector2(224, 38)
	_chase_panel.position = Vector2(GameConfig.VIEWPORT_WIDTH * 0.5 - 112, 8)
	_apply_chase_panel_style()
	root.add_child(_chase_panel)

	_chase_label = Label.new()
	_chase_label.text = "!  DETECTADO  !"
	_chase_label.position = Vector2(GameConfig.VIEWPORT_WIDTH * 0.5 - 104, 14)
	_chase_label.size = Vector2(208, 26)
	_chase_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_chase_label.add_theme_font_size_override("font_size", 18)
	_chase_label.add_theme_color_override("font_color", Color(1.0, 0.15, 0.15, 1.0))
	root.add_child(_chase_label)

	_chase_panel.visible = false
	_chase_label.visible = false


func _apply_chase_panel_style() -> void:
	var style := StyleBoxFlat.new()
	style.bg_color = Color(0.38, 0.02, 0.04, 0.92)
	style.border_width_left = 2
	style.border_width_top = 2
	style.border_width_right = 2
	style.border_width_bottom = 2
	style.border_color = Color(0.92, 0.10, 0.10, 1.0)
	style.corner_radius_top_left = 4
	style.corner_radius_top_right = 4
	style.corner_radius_bottom_right = 4
	style.corner_radius_bottom_left = 4
	_chase_panel.add_theme_stylebox_override("panel", style)


func show_chase(active: bool) -> void:
	_chase_panel.visible = active
	_chase_label.visible = active


func _on_backpack_changed(contents: Array) -> void:
	for i in _backpack_slot_nodes.size():
		_backpack_slot_nodes[i].texture = _tex_slot_filled if i < contents.size() \
			else _tex_slot_empty
