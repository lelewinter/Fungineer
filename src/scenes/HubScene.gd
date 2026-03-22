## HubScene — Base de resistência. Tela principal entre runs.
## Mostra o foguete, estoque de recursos, personagens resgatados e acesso ao mapa.
extends Node2D

const W: float = 800.0
const H: float = 600.0

var _bar_fill: ColorRect
var _bar_label: Label
var _stock_label: Label
var _piece_label: Label
var _character_container: Node2D
var _rocket_node: Node2D
var _char_card: CanvasLayer  # character info card overlay


func _ready() -> void:
	_build_background()
	_build_stock_panel()
	_build_rocket()
	_build_progress_bar()
	_build_character_area()
	_build_world_map_button()
	_build_character_card()

	HubState.stock_changed.connect(_refresh_stock)
	HubState.rocket_piece_built.connect(_on_piece_built)
	CharacterRegistry.trust_changed.connect(_on_trust_changed)
	CharacterRegistry.character_rescued.connect(_on_character_rescued)

	_refresh_stock(HubState.stock)
	_refresh_rocket()
	_refresh_characters()


# ── Background ────────────────────────────────────────────────────────────────

func _build_background() -> void:
	var bg := ColorRect.new()
	bg.color = Color(0.06, 0.04, 0.03)
	bg.size = Vector2(W, H)
	add_child(bg)

	# Warm ambient light gradient (simulated with a semi-transparent rect)
	var glow := ColorRect.new()
	glow.color = Color(0.6, 0.35, 0.1, 0.06)
	glow.size = Vector2(W, H)
	add_child(glow)


# ── Stock panel (top-left) ────────────────────────────────────────────────────

func _build_stock_panel() -> void:
	var panel := ColorRect.new()
	panel.color = Color(0.1, 0.08, 0.06)
	panel.size = Vector2(180, 60)
	panel.position = Vector2(12, 12)
	add_child(panel)

	var title := Label.new()
	title.text = "ESTOQUE"
	title.position = Vector2(12, 14)
	title.add_theme_font_size_override("font_size", 11)
	title.modulate = Color(0.6, 0.6, 0.6)
	add_child(title)

	_stock_label = Label.new()
	_stock_label.position = Vector2(12, 30)
	_stock_label.size = Vector2(176, 40)
	_stock_label.add_theme_font_size_override("font_size", 13)
	_stock_label.modulate = Color(0.95, 0.85, 0.5)
	add_child(_stock_label)


# ── Rocket (center) ───────────────────────────────────────────────────────────

func _build_rocket() -> void:
	_rocket_node = Node2D.new()
	_rocket_node.name = "Rocket"
	_rocket_node.position = Vector2(W * 0.5, H * 0.38)
	add_child(_rocket_node)


func _refresh_rocket() -> void:
	for child in _rocket_node.get_children():
		child.queue_free()

	var pieces := HubState.rocket_pieces_built
	var drawer := RocketDrawer.new()
	drawer.pieces_built = pieces
	_rocket_node.add_child(drawer)


# ── Progress bar (below rocket) ───────────────────────────────────────────────

func _build_progress_bar() -> void:
	_piece_label = Label.new()
	_piece_label.position = Vector2(W * 0.5 - 100, H * 0.66)
	_piece_label.size = Vector2(200, 18)
	_piece_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_piece_label.add_theme_font_size_override("font_size", 11)
	_piece_label.modulate = Color(0.7, 0.7, 0.7)
	add_child(_piece_label)

	var bar_bg := ColorRect.new()
	bar_bg.color = Color(0.12, 0.1, 0.08)
	bar_bg.size = Vector2(200, 14)
	bar_bg.position = Vector2(W * 0.5 - 100, H * 0.685)
	add_child(bar_bg)

	_bar_fill = ColorRect.new()
	_bar_fill.color = Color(0.9, 0.65, 0.15)
	_bar_fill.size = Vector2(0, 14)
	_bar_fill.position = bar_bg.position
	add_child(_bar_fill)

	_bar_label = Label.new()
	_bar_label.position = Vector2(W * 0.5 - 100, H * 0.704)
	_bar_label.size = Vector2(200, 16)
	_bar_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_bar_label.add_theme_font_size_override("font_size", 10)
	_bar_label.modulate = Color(0.55, 0.55, 0.55)
	add_child(_bar_label)

	_refresh_progress()


# ── Character icons (bottom-left) ─────────────────────────────────────────────

func _build_character_area() -> void:
	var label := Label.new()
	label.text = "EQUIPE"
	label.position = Vector2(12, H - 88)
	label.add_theme_font_size_override("font_size", 10)
	label.modulate = Color(0.5, 0.5, 0.5)
	add_child(label)

	_character_container = Node2D.new()
	_character_container.name = "Characters"
	_character_container.position = Vector2(16, H - 68)
	add_child(_character_container)


func _refresh_characters() -> void:
	for child in _character_container.get_children():
		child.queue_free()

	# Doctor is always present (player character, no trust system)
	var doctor_dot := CharacterDot.new()
	doctor_dot.dot_color = Color(0.3, 0.7, 1.0)
	doctor_dot.character_id = "doctor"
	doctor_dot.position = Vector2(0, 0)
	_character_container.add_child(doctor_dot)

	# Rescued characters from CharacterRegistry
	var rescued := CharacterRegistry.get_rescued()
	for i in rescued.size():
		var char_id: String = rescued[i]
		var dot := CharacterDot.new()
		dot.dot_color = CharacterRegistry.get_color(char_id)
		dot.character_id = char_id
		dot.position = Vector2((i + 1) * 32, 0)
		dot.character_pressed.connect(_show_character_card)
		_character_container.add_child(dot)


# ── World map button (bottom center) ─────────────────────────────────────────

func _build_world_map_button() -> void:
	var btn := Button.new()
	btn.text = "MAPA MUNDIAL"
	btn.size = Vector2(180, 44)
	btn.position = Vector2(W * 0.5 - 90, H - 64)
	btn.pressed.connect(_go_to_world_map)
	add_child(btn)


# ── Refresh helpers ───────────────────────────────────────────────────────────

func _refresh_stock(s: Dictionary) -> void:
	_stock_label.text = "Sucata: %d\nComp. IA: %d" % [s.get("scrap", 0), s.get("ai_components", 0)]
	_refresh_progress()


func _refresh_progress() -> void:
	if HubState.is_rocket_complete():
		_piece_label.text = "FOGUETE COMPLETO!"
		_bar_fill.size.x = 200.0
		_bar_label.text = ""
		return

	var cost: Dictionary = HubState.next_piece_cost()
	var stock := HubState.stock
	var piece_name: String = cost.get("name", "")

	# Progress = how close we are to affording next piece
	# Use the limiting resource as the progress indicator
	var scrap_needed: int = cost.get("scrap", 0)
	var ia_needed: int = cost.get("ai_components", 0)
	var progress := 1.0

	if scrap_needed > 0:
		progress = min(progress, float(stock.get("scrap", 0)) / scrap_needed)
	if ia_needed > 0:
		progress = min(progress, float(stock.get("ai_components", 0)) / ia_needed)
	progress = clamp(progress, 0.0, 1.0)

	_bar_fill.size.x = 200.0 * progress

	var cost_parts: Array[String] = []
	if scrap_needed > 0:
		cost_parts.append("%d/%d Sucata" % [min(stock.get("scrap", 0), scrap_needed), scrap_needed])
	if ia_needed > 0:
		cost_parts.append("%d/%d IA" % [min(stock.get("ai_components", 0), ia_needed), ia_needed])

	_piece_label.text = piece_name
	_bar_label.text = "  ".join(cost_parts)


func _on_piece_built(_index: int, _name: String) -> void:
	_refresh_rocket()
	_refresh_characters()


func _on_trust_changed(_char_id: String, _new_trust: int) -> void:
	pass  # Could refresh a visible card if open; deferred for later


func _on_character_rescued(_char_id: String) -> void:
	_refresh_characters()


# ── Character card (overlay) ──────────────────────────────────────────────────

func _build_character_card() -> void:
	_char_card = CanvasLayer.new()
	_char_card.layer = 10
	add_child(_char_card)

	# Dimmed backdrop — clicking it closes the card
	var backdrop := ColorRect.new()
	backdrop.name = "Backdrop"
	backdrop.color = Color(0.0, 0.0, 0.0, 0.55)
	backdrop.size = Vector2(W, H)
	backdrop.mouse_filter = Control.MOUSE_FILTER_STOP
	_char_card.add_child(backdrop)

	var panel := ColorRect.new()
	panel.name = "Panel"
	panel.color = Color(0.08, 0.06, 0.05)
	panel.size = Vector2(280, 160)
	panel.position = Vector2(W * 0.5 - 140, H * 0.5 - 80)
	_char_card.add_child(panel)

	var border := ColorRect.new()
	border.name = "Border"
	border.color = Color(0.4, 0.3, 0.15)
	border.size = Vector2(280, 1)
	border.position = panel.position + Vector2(0, 36)
	_char_card.add_child(border)

	var name_label := Label.new()
	name_label.name = "NameLabel"
	name_label.position = panel.position + Vector2(12, 8)
	name_label.size = Vector2(256, 24)
	name_label.add_theme_font_size_override("font_size", 16)
	name_label.modulate = Color(0.95, 0.85, 0.5)
	_char_card.add_child(name_label)

	var role_label := Label.new()
	role_label.name = "RoleLabel"
	role_label.position = panel.position + Vector2(12, 44)
	role_label.size = Vector2(256, 18)
	role_label.add_theme_font_size_override("font_size", 10)
	role_label.modulate = Color(0.6, 0.6, 0.6)
	_char_card.add_child(role_label)

	var trust_label := Label.new()
	trust_label.name = "TrustLabel"
	trust_label.position = panel.position + Vector2(12, 62)
	trust_label.size = Vector2(256, 16)
	trust_label.add_theme_font_size_override("font_size", 10)
	trust_label.modulate = Color(0.5, 0.8, 0.5)
	_char_card.add_child(trust_label)

	var dialogue_label := Label.new()
	dialogue_label.name = "DialogueLabel"
	dialogue_label.position = panel.position + Vector2(12, 84)
	dialogue_label.size = Vector2(256, 64)
	dialogue_label.add_theme_font_size_override("font_size", 12)
	dialogue_label.modulate = Color(0.88, 0.82, 0.72)
	dialogue_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_char_card.add_child(dialogue_label)

	_char_card.visible = false
	backdrop.gui_input.connect(_on_card_backdrop_input)


func _show_character_card(char_id: String) -> void:
	if char_id == "doctor":
		return
	var name_label: Label = _char_card.get_node("NameLabel")
	var role_label: Label = _char_card.get_node("RoleLabel")
	var trust_label: Label = _char_card.get_node("TrustLabel")
	var dialogue_label: Label = _char_card.get_node("DialogueLabel")

	name_label.text = CharacterRegistry.get_display_name(char_id)
	role_label.text = CharacterRegistry.get_role(char_id)
	var trust_val: int = CharacterRegistry.get_trust(char_id)
	trust_label.text = "Confiança: %d%%  —  %s" % [trust_val, CharacterRegistry.get_trust_label(char_id)]
	dialogue_label.text = '"%s"' % CharacterRegistry.get_dialogue(char_id)

	_char_card.visible = true


func _on_card_backdrop_input(event: InputEvent) -> void:
	if event is InputEventMouseButton and event.pressed:
		_char_card.visible = false


# ── Navigation ────────────────────────────────────────────────────────────────

func _go_to_world_map() -> void:
	get_tree().change_scene_to_file("res://src/scenes/WorldMapScene.tscn")
