class_name HubNPCManager
extends Node2D

var npc_states: Dictionary = {}  # { npc_id: { pos, bob_phase, room_id, wander_timer } }
var room_y_offset: Dictionary = {}
var cell_width: float = 0
var wander_interval: float = 15.0  # seconds between room changes

signal npc_clicked(npc_id: String)

func _ready() -> void:
	_initialize_npc_positions()
	_calculate_dimensions()


func _calculate_dimensions() -> void:
	var viewport_size = get_viewport_rect().size
	cell_width = viewport_size.x / 6.0

	var y = 0.0
	for room in HubData.ROOMS:
		room_y_offset[room["id"]] = y
		y += room["h"]


func _initialize_npc_positions() -> void:
	for room in HubData.ROOMS:
		for npc_id in room.get("npcs", []):
			if npc_id not in npc_states:
				npc_states[npc_id] = {
					"room": room["id"],
					"pos": Vector2(
						cell_width * room["col"] + randf_range(10, cell_width * room["w"] - 10),
						room_y_offset.get(room["id"], 0.0) + randf_range(20, room["h"] - 20)
					),
					"bob_phase": randf(),
					"moving": false,
					"target_room": null,
					"wander_timer": randf_range(5.0, wander_interval)
				}


func _physics_process(delta: float) -> void:
	_update_npc_wandering(delta)
	queue_redraw()


func _update_npc_wandering(delta: float) -> void:
	for npc_id in npc_states:
		var state = npc_states[npc_id]
		state["wander_timer"] -= delta

		if state["wander_timer"] <= 0:
			state["wander_timer"] = randf_range(wander_interval * 0.8, wander_interval * 1.2)
			_try_wander_npc(npc_id, state)


func _try_wander_npc(npc_id: String, state: Dictionary) -> void:
	if randf() > 0.6:  # 40% chance per cycle
		var current_room_id = state["room"]
		var rooms_with_npcs = []

		for room in HubData.ROOMS:
			if room.get("type") not in ["surface", "surface-exit"]:
				rooms_with_npcs.append(room)

		if rooms_with_npcs.size() > 1:
			var new_room = rooms_with_npcs[randi() % rooms_with_npcs.size()]
			if new_room["id"] != current_room_id:
				state["room"] = new_room["id"]
				state["pos"] = Vector2(
					cell_width * new_room["col"] + randf_range(10, cell_width * new_room["w"] - 10),
					room_y_offset.get(new_room["id"], 0.0) + randf_range(20, new_room["h"] - 20)
				)


func _draw() -> void:
	for npc_id in npc_states:
		var npc_state = npc_states[npc_id]
		var npc_data = HubState.get_npc_by_id(npc_id)

		# Bobbing animation
		npc_state["bob_phase"] += get_physics_process_delta_time() / 0.6
		var bob_offset = sin(npc_state["bob_phase"] * TAU) * 1.5

		var draw_pos = npc_state["pos"] + Vector2(0, bob_offset)

		# Corpo (círculo maior)
		draw_circle(draw_pos, 3, npc_data["color"])

		# Cabeça com destaque
		draw_circle(draw_pos - Vector2(0, 5), 2, npc_data["accent"])


func set_room_y_offset(offset_dict: Dictionary) -> void:
	room_y_offset = offset_dict


func set_cell_width(w: float) -> void:
	cell_width = w
