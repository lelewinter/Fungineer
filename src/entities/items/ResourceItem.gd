## ResourceItem — A collectible resource in the arena.
## Stand still within RESOURCE_COLLECTION_RADIUS for RESOURCE_COLLECTION_TIME to collect.
## A circle progress indicator draws around the item while the party is still and in range.
class_name ResourceItem
extends Node2D

var resource_type: String = "scrap"

var _party: Node2D = null
var _collection_timer: float = 0.0
var _last_party_pos: Vector2 = Vector2.ZERO
var _party_is_still: bool = false
var _in_range: bool = false

signal collected(resource_type: String)


func setup(party_node: Node2D, type: String) -> void:
	_party = party_node
	resource_type = type
	if party_node:
		_last_party_pos = party_node.global_position


func _process(delta: float) -> void:
	if _party == null:
		return
	if GameState.current_state != GameState.RunState.PLAYING and \
			GameState.current_state != GameState.RunState.BOSS_FIGHT:
		return

	var dist: float = global_position.distance_to(_party.global_position)
	_in_range = dist <= GameConfig.RESOURCE_COLLECTION_RADIUS

	var party_moved: float = _party.global_position.distance_to(_last_party_pos)
	_last_party_pos = _party.global_position
	_party_is_still = party_moved < 3.0 * delta * 60.0

	var was_progressing: bool = _collection_timer > 0.0

	var backpack_full: bool = GameState.backpack.size() >= HubState.get_backpack_capacity()

	if _in_range and _party_is_still and not backpack_full:
		_collection_timer += delta
		if _collection_timer >= GameConfig.RESOURCE_COLLECTION_TIME:
			_do_collect()
			return
	else:
		_collection_timer = 0.0

	if _collection_timer > 0.0 or was_progressing:
		queue_redraw()


func _do_collect() -> void:
	if GameState.add_to_backpack(resource_type):
		collected.emit(resource_type)
		queue_free()
	else:
		# Backpack full — silently cancel, reset timer
		_collection_timer = 0.0
		queue_redraw()


func _draw() -> void:
	var r: float = GameConfig.RESOURCE_ITEM_RADIUS

	# Item body
	draw_circle(Vector2.ZERO, r, Color(0.9, 0.7, 0.15))

	# Outer ring
	draw_arc(Vector2.ZERO, r, 0.0, TAU, 32, Color(1.0, 1.0, 1.0, 0.4), 1.5)

	# Collection progress arc — clockwise from top
	if _in_range and _collection_timer > 0.0:
		var progress: float = _collection_timer / GameConfig.RESOURCE_COLLECTION_TIME
		var end_angle: float = -PI * 0.5 + TAU * progress
		draw_arc(
			Vector2.ZERO,
			r + 5.0,
			-PI * 0.5,
			end_angle,
			32,
			Color(1.0, 0.95, 0.4),
			3.0,
		)
