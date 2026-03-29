## ZoneRoom — Reusable zone room component for WorldMapScene.
## PanelContainer root with accent-colored background, zone name and room
## subtitle labels at the top, NPC placeholder, and a RAID button on the right.
## Accent color, zone name, and room subtitle are set via exported properties.
class_name ZoneRoom
extends PanelContainer

@export var accent_color: Color = Color(0.5, 0.5, 0.5):
	set(value):
		accent_color = value
		_update_visuals()

@export var zone_name: String = "":
	set(value):
		zone_name = value
		_update_labels()

@export var room_subtitle: String = "":
	set(value):
		room_subtitle = value
		_update_labels()

## Emitted when the RAID button is pressed.
signal raid_requested(zone_name: String)

@onready var _bg: ColorRect = $ColorRect
@onready var _zone_name_label: Label = $VBoxContainer/ZoneNameLabel
@onready var _room_subtitle_label: Label = $VBoxContainer/RoomSubtitleLabel
@onready var _raid_btn: Button = $VBoxContainer/HBoxContainer/RaidButton


func _ready() -> void:
	_raid_btn.pressed.connect(_on_raid_pressed)
	_update_visuals()
	_update_labels()


func _update_visuals() -> void:
	if not is_node_ready():
		return
	_bg.color = Color(accent_color.r, accent_color.g, accent_color.b, 0.30)

	var style := StyleBoxFlat.new()
	style.bg_color = Color(0.051, 0.051, 0.051)  # #0D0D0D
	style.border_color = accent_color
	style.set_border_width_all(2)
	add_theme_stylebox_override("panel", style)


func _update_labels() -> void:
	if not is_node_ready():
		return
	_zone_name_label.text = zone_name
	_room_subtitle_label.text = room_subtitle


func _on_raid_pressed() -> void:
	raid_requested.emit(zone_name)
