## HubScene — Base de resistência. Tela principal entre runs.
## Mostra o foguete, estoque de recursos, personagens resgatados e acesso ao mapa.
extends Node2D

const W: float = 800.0
const H: float = 600.0

# Diálogos do Dr. Valério ao completar cada peça do foguete
const PIECE_DIALOGUES: Array = [
	"\"BASE ESTRUTURAL instalada! O foguete tem uma fundação! Ele vai para o espaço, não vai explodir!\"\n— Dr. Valério",
	"\"MOTOR PRINCIPAL acoplado! Sessenta por cento de chance de sobreviver à decolagem. Progresso!\"\n— Dr. Valério",
	"\"PROCESSADOR funcionando! Agora podemos calcular a trajetória. Ou pelo menos tentaremos.\"\n— Dr. Valério",
	"\"REVESTIMENTO aplicado! Proteção térmica garantida! Vamos sobreviver à reentrada atmosférica!\"\n— Dr. Valério",
	"\"REDE NEURAL operacional! A IA vai odiar que usamos a tecnologia dela contra ela.\"\n— Dr. Valério",
	"\"SISTEMA VITAL ativo! Oxigênio, pressão, temperatura. Vamos respirar lá em cima!\"\n— Dr. Valério",
	"\"BLINDAGEM EXTERNA instalada! Último obstáculo entre nós e o vácuo gelado do espaço.\"\n— Dr. Valério",
	"\"IGNIÇÃO FINAL conectada! O foguete está COMPLETO! Vamos ESCAPAR!\"\n— Dr. Valério",
]

# Nomes dos sobreviventes presentes (índice 0 = Dr. Valério, sempre presente)
const SURVIVOR_NAMES: Array = [
	"Dr. Valério",
	"Capitã Runa",
	"Brix",
	"Zara",
	"Luz",
]

var _bar_fill: ColorRect
var _bar_label: Label
var _stock_label: Label
var _piece_label: Label
var _character_container: Node2D
var _rocket_node: Node2D
var _notification_panel: ColorRect
var _notification_label: Label
var _notification_timer: float = 0.0


func _ready() -> void:
	_build_background()
	_build_stock_panel()
	_build_rocket()
	_build_progress_bar()
	_build_character_area()
	_build_world_map_button()

	HubState.stock_changed.connect(_refresh_stock)
	HubState.rocket_piece_built.connect(_on_piece_built)

	_build_notification_overlay()
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


# ── Notification overlay (rocket milestones) ──────────────────────────────────

func _build_notification_overlay() -> void:
	var layer := CanvasLayer.new()
	layer.layer = 30
	add_child(layer)

	_notification_panel = ColorRect.new()
	_notification_panel.color = Color(0.06, 0.10, 0.06, 0.93)
	_notification_panel.size = Vector2(W - 80, 80)
	_notification_panel.position = Vector2(40, H * 0.5 - 40)
	_notification_panel.visible = false
	layer.add_child(_notification_panel)

	_notification_label = Label.new()
	_notification_label.position = Vector2(48, H * 0.5 - 32)
	_notification_label.size = Vector2(W - 96, 64)
	_notification_label.add_theme_font_size_override("font_size", 13)
	_notification_label.modulate = Color(0.55, 1.00, 0.60)
	_notification_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_notification_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	layer.add_child(_notification_label)


func _process(delta: float) -> void:
	if _notification_timer > 0.0:
		_notification_timer -= delta
		var alpha := clampf(_notification_timer / 1.0, 0.0, 1.0)
		_notification_panel.modulate.a = alpha
		_notification_label.modulate.a = alpha
		if _notification_timer <= 0.0:
			_notification_panel.visible = false


# ── Character icons (bottom-left) ─────────────────────────────────────────────

func _build_character_area() -> void:
	var label := Label.new()
	label.text = "EQUIPE"
	label.position = Vector2(12, H - 100)
	label.add_theme_font_size_override("font_size", 10)
	label.modulate = Color(0.5, 0.5, 0.5)
	add_child(label)

	_character_container = Node2D.new()
	_character_container.name = "Characters"
	_character_container.position = Vector2(16, H - 80)
	add_child(_character_container)


func _refresh_characters() -> void:
	for child in _character_container.get_children():
		child.queue_free()

	var survivor_colors := [
		Color(0.3, 0.7, 1.0),   # Dr. Valério (sempre presente)
		Color(0.4, 0.9, 0.4),   # Capitã Runa
		Color(1.0, 0.6, 0.2),   # Brix
		Color(0.9, 0.3, 0.3),   # Zara
		Color(0.8, 0.4, 0.9),   # Luz
	]
	var count := 1 + HubState.rescued_characters.size()
	count = min(count, survivor_colors.size())
	for i in count:
		var dot := CharacterDot.new()
		dot.dot_color = survivor_colors[i]
		dot.position = Vector2(i * 36, 0)
		_character_container.add_child(dot)

		# Nome do sobrevivente abaixo do ponto
		var name_lbl := Label.new()
		name_lbl.text = SURVIVOR_NAMES[i] if i < SURVIVOR_NAMES.size() else "?"
		name_lbl.position = Vector2(i * 36 - 10, 18)
		name_lbl.add_theme_font_size_override("font_size", 8)
		name_lbl.modulate = Color(survivor_colors[i].r, survivor_colors[i].g,
			survivor_colors[i].b, 0.75)
		_character_container.add_child(name_lbl)


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


func _on_piece_built(index: int, _name: String) -> void:
	_refresh_rocket()
	_refresh_characters()
	_show_piece_dialogue(index)


func _show_piece_dialogue(index: int) -> void:
	if index < 0 or index >= PIECE_DIALOGUES.size():
		return
	_notification_label.text = PIECE_DIALOGUES[index]
	_notification_panel.modulate.a = 1.0
	_notification_label.modulate.a = 1.0
	_notification_panel.visible = true
	_notification_timer = 5.0


# ── Navigation ────────────────────────────────────────────────────────────────

func _go_to_world_map() -> void:
	get_tree().change_scene_to_file("res://src/scenes/WorldMapScene.tscn")
