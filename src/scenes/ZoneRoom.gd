## ZoneRoom — Reusable zone room component for WorldMapScene.
## PanelContainer root with accent-colored background, NPC placeholder,
## and a RAID button anchored to the right side.
## Accent color and zone name are set via exported properties.
class_name ZoneRoom
extends PanelContainer

@export var accent_color: Color = Color(0.5, 0.5, 0.5):
	set(value):
		accent_color = value
		_update_visuals()

@export var zone_name: String = ""

## Emitted when the RAID button is pressed.
signal raid_pressed(zone_name: String)

@onready var _bg: ColorRect = $ColorRect
@onready var _raid_btn: Button = $HBoxContainer/RaidButton


func _ready() -> void:
	_raid_btn.pressed.connect(_on_raid_pressed)
	_update_visuals()


func _update_visuals() -> void:
	if not is_node_ready():
		return
	_bg.color = Color(accent_color.r, accent_color.g, accent_color.b, 0.30)


func _on_raid_pressed() -> void:
	raid_pressed.emit(zone_name)
