class_name HubScene
extends Node2D

var hub_renderer: HubRenderer
var npc_manager: HubNPCManager
var rocket_display: HubRocket

var background: ColorRect
var selected_npc: String = ""
var zoomed_room: String = ""

func _ready() -> void:
	# Background
	background = ColorRect.new()
	background.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	background.color = Color(0.08, 0.07, 0.06)
	add_child(background)

	# Renderer (salas e grid)
	hub_renderer = HubRenderer.new()
	add_child(hub_renderer)
	hub_renderer.room_clicked.connect(_on_room_clicked)

	# NPC Manager (NPCs e animações)
	npc_manager = HubNPCManager.new()
	add_child(npc_manager)

	# Rocket Display
	rocket_display = HubRocket.new()
	add_child(rocket_display)

	# Conectar signals globais
	HubState.hub_room_selected.connect(_on_hub_room_selected)
	HubState.hub_zoom_opened.connect(_on_hub_zoom_opened)


func _on_room_clicked(room_id: String) -> void:
	var room = HubState.get_room_by_id(room_id)
	var zone_id = HubState.ROOM_TO_ZONE.get(room_id) if "ROOM_TO_ZONE" in HubState else HubData.ROOM_TO_ZONE.get(room_id)

	if zone_id:
		# É uma zona — abrir zoom (placeholder por enquanto)
		_open_zoom_view(room_id, zone_id)
	elif room.get("npcs", []).size() > 0:
		# Tem NPC — mostrar popover (placeholder)
		selected_npc = room["npcs"][0]
		_show_npc_popover(selected_npc)

	HubState.hub_room_selected.emit(room_id)


func _on_hub_room_selected(_room_id: String) -> void:
	pass


func _on_hub_zoom_opened(_room_id: String, _zone_id: String) -> void:
	pass


func _open_zoom_view(room_id: String, zone_id: String) -> void:
	zoomed_room = room_id
	# TODO: Implementar painel de zoom
	print("Zoom aberto para zona: %s" % zone_id)
	HubState.hub_zoom_opened.emit(room_id, zone_id)


func _show_npc_popover(npc_id: String) -> void:
	# TODO: Implementar popover de NPC
	selected_npc = npc_id
	print("NPC selecionado: %s" % npc_id)
	HubState.hub_npc_selected.emit(npc_id)


func _close_zoom_view() -> void:
	zoomed_room = ""
	HubState.hub_zoom_closed.emit()


func _close_npc_popover() -> void:
	selected_npc = ""


func _on_input(event: InputEvent) -> void:
	if event is InputEventKey and event.pressed:
		match event.keycode:
			KEY_ESCAPE:
				if zoomed_room != "":
					_close_zoom_view()
				elif selected_npc != "":
					_close_npc_popover()
