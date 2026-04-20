## ItemSpawner — Spawns resource items into the arena at run start.
## Call spawn_resources() after the arena is built and the party node is ready.
class_name ItemSpawner
extends Node

var _items_container: Node2D
var _party: Node2D


func setup(items_container: Node2D, party: Node2D) -> void:
	_items_container = items_container
	_party = party


func spawn_resources(resource_type: String = "scrap") -> void:
	for i in GameConfig.RESOURCE_SPAWN_COUNT:
		_spawn_one(resource_type)


func _spawn_one(resource_type: String) -> void:
	var item := ResourceItem.new()
	item.setup(_party, resource_type)
	item.position = _random_position()
	_items_container.add_child(item)


func _random_position() -> Vector2:
	var margin: float = 80.0
	return Vector2(
		randf_range(margin, GameConfig.ARENA_WIDTH - margin),
		randf_range(margin, GameConfig.ARENA_HEIGHT - margin),
	)


func clear_items() -> void:
	for child in _items_container.get_children():
		child.queue_free()
