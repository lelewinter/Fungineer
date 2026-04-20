## PowerResource — Base class for all transformative powers.
## Extend this class to implement each power. Override the virtual methods.
class_name PowerResource
extends Resource

@export var power_name: String = "Power"
@export var description: String = ""
@export var cooldown: float = 0.0
@export var duration: float = 0.0  # 0 = passive or toggle (no auto-deactivate)
@export var icon_color: Color = Color.WHITE

var is_active: bool = false
var cooldown_remaining: float = 0.0
var duration_remaining: float = 0.0


## Called when the player activates this power.
func on_activate(party: Array) -> void:
	pass


## Called when the power deactivates (duration end or toggle off).
func on_deactivate(party: Array) -> void:
	pass


## Called every frame while the power is active or cooling down.
func process(delta: float, party: Array) -> void:
	pass


## Called when the party takes damage. Used by Reflective Shell.
func on_damage_received(amount: float, source: Node) -> void:
	pass


func can_activate() -> bool:
	return cooldown_remaining <= 0.0 and not is_active
