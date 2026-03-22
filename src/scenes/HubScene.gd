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


func _ready() -> void:
	_build_background()
	_build_stock_panel()
	_build_rocket()
	_build_progress_bar()
	_build_character_area()
	_build_world_map_button()

	HubState.stock_changed.connect(_refresh_stock)
	HubState.rocket_piece_built.connect(_on_piece_built)

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

	var colors := [
		Color(0.3, 0.7, 1.0),   # Doctor (always present)
		Color(0.4, 0.9, 0.4),
		Color(1.0, 0.6, 0.2),
		Color(0.9, 0.3, 0.3),
		Color(0.8, 0.4, 0.9),
	]
	var count := 1 + HubState.rescued_characters.size()
	count = min(count, colors.size())
	for i in count:
		var dot := CharacterDot.new()
		dot.dot_color = colors[i]
		dot.position = Vector2(i * 32, 0)
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

	const RESOURCE_NAMES: Dictionary = {
		"scrap": "Sucata",
		"ai_components": "Comp. IA",
		"nucleo_logico": "Nucleo Log.",
		"combustivel_volatil": "Combustivel",
		"sinais_controle": "Sinais Ctrl.",
		"biomassa_adaptativa": "Biomassa",
		"fragmentos_estruturais": "Frag. Estru.",
	}

	# Progress = limiting resource ratio across all required resources
	var progress := 1.0
	var cost_parts: Array[String] = []
	for key in cost:
		if key == "name":
			continue
		var needed: int = cost[key]
		var have: int = stock.get(key, 0)
		progress = min(progress, float(have) / needed)
		var label: String = RESOURCE_NAMES.get(key, key)
		cost_parts.append("%d/%d %s" % [min(have, needed), needed, label])
	progress = clamp(progress, 0.0, 1.0)

	_bar_fill.size.x = 200.0 * progress
	_piece_label.text = piece_name
	_bar_label.text = "  ".join(cost_parts)


func _on_piece_built(_index: int, _name: String) -> void:
	_refresh_rocket()
	_refresh_characters()


# ── Navigation ────────────────────────────────────────────────────────────────

func _go_to_world_map() -> void:
	get_tree().change_scene_to_file("res://src/scenes/WorldMapScene.tscn")
