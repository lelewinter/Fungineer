class_name HubScene
extends Node2D

var hub_renderer: HubRenderer
var hub_room_display: HubRoomDisplay
var npc_manager: HubNPCManager
var rocket_display: HubRocket
var hub_audio: HubAudio

var background: ColorRect
var selected_npc: String = ""
var zoomed_room: String = ""

func _ready() -> void:
	# Background
	background = ColorRect.new()
	background.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	_update_background_color()
	add_child(background)

	# Renderer (salas e grid)
	hub_renderer = HubRenderer.new()
	add_child(hub_renderer)
	hub_renderer.room_clicked.connect(_on_room_clicked)

	# Room display (novo sistema com Control nodes)
	hub_room_display = HubRoomDisplay.new()
	hub_room_display.anchors_and_offsets_preset = Control.PRESET_FULL_RECT
	add_child(hub_room_display)

	# NPC Manager (NPCs e animações)
	npc_manager = HubNPCManager.new()
	add_child(npc_manager)

	# Rocket Display
	rocket_display = HubRocket.new()
	add_child(rocket_display)

	# Audio system
	hub_audio = HubAudio.new()
	add_child(hub_audio)

	# Variant selector UI
	_build_variant_selector()

	# Conectar signals globais
	HubState.hub_room_selected.connect(_on_hub_room_selected)
	HubState.hub_zoom_opened.connect(_on_hub_zoom_opened)
	HubState.hub_variant_changed.connect(_on_variant_changed)
	HubState.rocket_piece_built.connect(_on_rocket_piece_built)


func _on_room_clicked(room_id: String) -> void:
	hub_audio.play_click_sfx()

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
	hub_audio.play_open_panel_sfx()
	zoomed_room = room_id

	# Criar painel de zoom
	var zoom_panel = HubZoomPanel.new()
	zoom_panel.room_id = room_id
	zoom_panel.zone_id = zone_id
	add_child(zoom_panel)
	zoom_panel.closed.connect(_close_zoom_view)

	HubState.hub_zoom_opened.emit(room_id, zone_id)


func _show_npc_popover(npc_id: String) -> void:
	hub_audio.play_npc_select_sfx()
	selected_npc = npc_id

	# Criar card de NPC
	var card = HubCharacterCard.new()
	card.npc_id = npc_id
	card.npc_data = HubState.get_npc_by_id(npc_id)
	add_child(card)
	card.closed.connect(_close_npc_popover)

	HubState.hub_npc_selected.emit(npc_id)


func _close_zoom_view() -> void:
	hub_audio.play_close_panel_sfx()
	zoomed_room = ""
	HubState.hub_zoom_closed.emit()


func _close_npc_popover() -> void:
	hub_audio.play_close_panel_sfx()
	selected_npc = ""


func _on_input(event: InputEvent) -> void:
	if event is InputEventKey and event.pressed:
		match event.keycode:
			KEY_ESCAPE:
				if zoomed_room != "":
					_close_zoom_view()
				elif selected_npc != "":
					_close_npc_popover()


func _build_variant_selector() -> void:
	var layer = CanvasLayer.new()
	layer.layer = 5
	add_child(layer)

	var hbox = HBoxContainer.new()
	hbox.set_anchors_and_offsets_preset(Control.PRESET_TOP_LEFT)
	hbox.position = Vector2(12, 12)
	hbox.add_theme_constant_override("separation", 8)
	layer.add_child(hbox)

	for variant_key in HubState.VARIANTS.keys():
		var btn = Button.new()
		btn.text = variant_key.to_upper()
		btn.custom_minimum_size = Vector2(80, 24)
		btn.pressed.connect(func(): HubState.set_hub_variant(variant_key))
		hbox.add_child(btn)


func _update_background_color() -> void:
	var variant_data = HubState.get_variant_data()
	background.color = variant_data.get("bg", Color(0.08, 0.07, 0.06))


func _on_variant_changed(_variant_key: String) -> void:
	_update_background_color()


func _on_rocket_piece_built(_index: int, _name: String) -> void:
	hub_audio.play_rocket_progress_sfx()
