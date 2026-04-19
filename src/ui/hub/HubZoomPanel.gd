class_name HubZoomPanel
extends CanvasLayer

var room_id: String = ""
var zone_id: String = ""
var zoom_style: String = "cinematic"

signal closed

func _ready() -> void:
	layer = 20
	_build_ui()


func _build_ui() -> void:
	# Background com vignette
	var bg = ColorRect.new()
	bg.color = Color(0, 0, 0, 0.6)
	bg.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(bg)

	# Clique fora para fechar
	bg.gui_input.connect(func(e: InputEvent):
		if e is InputEventMouseButton and e.pressed:
			closed.emit()
			queue_free()
	)

	# Painel principal
	var panel = PanelContainer.new()
	panel.set_anchors_and_offsets_preset(Control.PRESET_CENTER)
	panel.custom_minimum_size = Vector2(320, 420)
	add_child(panel)

	var vbox = VBoxContainer.new()
	vbox.add_theme_constant_override("separation", 0)
	panel.add_child(vbox)

	# Header
	var header = MarginContainer.new()
	header.add_theme_constant_override("margin_left", 12)
	header.add_theme_constant_override("margin_right", 12)
	header.add_theme_constant_override("margin_top", 12)
	header.add_theme_constant_override("margin_bottom", 8)
	vbox.add_child(header)

	var zone = HubState.get_zone_by_id(zone_id)
	var header_label = Label.new()
	header_label.text = "[%s]" % zone.get("name", zone_id)
	header_label.add_theme_font_size_override("font_size", 14)
	header.add_child(header_label)

	# TabContainer
	var tabs = TabContainer.new()
	tabs.custom_minimum_size = Vector2(300, 350)
	vbox.add_child(tabs)

	# Tab 1: Briefing
	var briefing_label = Label.new()
	briefing_label.text = zone.get("briefing", "Zona desconhecida")
	briefing_label.autowrap_mode = TextServer.AUTOWRAP_WORD
	tabs.add_child(briefing_label)
	tabs.set_tab_title(0, "BRIEFING")

	# Tab 2: NPC
	var npc_vbox = VBoxContainer.new()
	var npc_info = Label.new()
	npc_info.text = "Contate o NPC da zona para missões"
	npc_vbox.add_child(npc_info)
	tabs.add_child(npc_vbox)
	tabs.set_tab_title(1, "NPC")

	# Tab 3: Histórico
	var history_label = Label.new()
	history_label.text = "Nenhuma execução anterior"
	tabs.add_child(history_label)
	tabs.set_tab_title(2, "HISTÓRICO")

	# Tab 4: Itens
	var items_label = Label.new()
	items_label.text = "Itens especiais da zona"
	tabs.add_child(items_label)
	tabs.set_tab_title(3, "ITENS")

	# Portal visual (placeholder)
	var portal_area = Control.new()
	portal_area.custom_minimum_size = Vector2(300, 60)
	vbox.add_child(portal_area)

	# Desenhar portal
	var portal_node = Node2D.new()
	portal_node.position = Vector2(150, 30)
	portal_area.add_child(portal_node)

	# Botão para iniciar (placeholder)
	var start_btn = Button.new()
	start_btn.text = "► Iniciar"
	start_btn.custom_minimum_size = Vector2(300, 30)
	start_btn.pressed.connect(_on_start_pressed)
	vbox.add_child(start_btn)


func _on_start_pressed() -> void:
	# TODO: Iniciar run
	print("Iniciando zona: %s" % zone_id)
	closed.emit()
	queue_free()


func _input(event: InputEvent) -> void:
	if event is InputEventKey and event.pressed:
		match event.keycode:
			KEY_ESCAPE:
				closed.emit()
				queue_free()
				get_tree().root.set_input_as_handled()
