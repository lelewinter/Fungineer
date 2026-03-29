## ConfirmRaidDialog — Modal confirmation dialog for starting a raid.
## Call setup() to populate zone data, then show the node.
## Emits confirmed when the player proceeds, cancelled when they back out.
class_name ConfirmRaidDialog
extends CanvasLayer

signal confirmed
signal cancelled

@onready var _zone_name_label: Label = $PanelContainer/VBoxContainer/ZoneNameLabel
@onready var _description_label: Label = $PanelContainer/VBoxContainer/DescriptionLabel


## Populates the dialog with zone data before showing it.
func setup(zone_name: String, zone_description: String) -> void:
	_zone_name_label.text = zone_name
	_description_label.text = zone_description


func _on_confirm_pressed() -> void:
	confirmed.emit()


func _on_cancel_pressed() -> void:
	cancelled.emit()
