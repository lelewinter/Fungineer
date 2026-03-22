## StealthHUD — Minimal HUD for the Stealth Zone.
## Shows backpack slots and chase warning.
class_name StealthHUD
extends CanvasLayer

var _backpack_slots: Array[ColorRect] = []
var _chase_label: Label


func _ready() -> void:
	_build_backpack_ui()
	_build_chase_ui()
	GameState.backpack_changed.connect(_on_backpack_changed)


func _build_backpack_ui() -> void:
	var capacity := HubState.get_backpack_capacity()
	var slot_size := 22.0
	var gap := 6.0
	var total_w := capacity * (slot_size + gap) - gap
	var start_x := GameConfig.VIEWPORT_WIDTH - total_w - 12.0
	for i in capacity:
		var slot := ColorRect.new()
		slot.size = Vector2(slot_size, slot_size)
		slot.position = Vector2(start_x + i * (slot_size + gap), GameConfig.VIEWPORT_HEIGHT - 36.0)
		slot.color = Color(0.12, 0.12, 0.18)
		add_child(slot)
		_backpack_slots.append(slot)


func _build_chase_ui() -> void:
	_chase_label = Label.new()
	_chase_label.text = "!  DETECTADO  !"
	_chase_label.position = Vector2(GameConfig.VIEWPORT_WIDTH * 0.5 - 90, 14)
	_chase_label.size = Vector2(180, 32)
	_chase_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_chase_label.add_theme_font_size_override("font_size", 17)
	_chase_label.modulate = Color(1.0, 0.12, 0.12)
	_chase_label.visible = false
	add_child(_chase_label)


func show_chase(active: bool) -> void:
	_chase_label.visible = active


func _on_backpack_changed(contents: Array) -> void:
	for i in _backpack_slots.size():
		_backpack_slots[i].color = Color(0.2, 0.75, 0.45) if i < contents.size() \
			else Color(0.12, 0.12, 0.18)
