## Party — Manages the player's squad. Positions characters in formation.
## Moves as a unit. Characters are children of this node.
class_name Party
extends Node2D

var _characters: Array = []  # Array of BaseCharacter


func _ready() -> void:
	GameState.character_died.connect(_on_character_died)


func add_character(character: BaseCharacter) -> void:
	if _characters.size() >= GameConfig.MAX_PARTY_SIZE:
		return
	_characters.append(character)
	GameState.party.append(character)
	add_child(character)
	character.died.connect(_on_character_died_node)
	_update_formation()


func _update_formation() -> void:
	var mult := 1.0
	if GameState.active_power and GameState.active_power.power_name == "Split Orbit" and GameState.active_power.is_active:
		mult = GameConfig.SPLIT_ORBIT_SPREAD_MULT

	for i in _characters.size():
		if i < GameConfig.FORMATION_OFFSETS.size():
			_characters[i].position = GameConfig.FORMATION_OFFSETS[i] * mult


func _physics_process(_delta: float) -> void:
	_update_formation()


func reset() -> void:
	_characters.clear()


func _on_character_died_node(character) -> void:
	_characters.erase(character)


func _on_character_died(_character) -> void:
	var alive: Array = []
	for c in _characters:
		if is_instance_valid(c) and not c.is_dead:
			alive.append(c)
	_characters = alive
