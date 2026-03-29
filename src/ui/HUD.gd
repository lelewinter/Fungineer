## HUD — In-run overlay. HP bars per character, timer, wave indicator, power status.
class_name HUD
extends CanvasLayer

var _timer_label: Label
var _wave_label: Label
var _power_label: Label
var _hp_container: VBoxContainer
var _hp_bars: Dictionary = {}  # character -> ProgressBar
var _debug_overlay: Panel
var _debug_visible: bool = false
var _siege_indicator: Label
var _backpack_slot_nodes: Array[TextureRect] = []

var _tex_slot_empty: Texture2D
var _tex_slot_filled: Texture2D


func _ready() -> void:
	_tex_slot_empty = load("res://assets/art/ui/icons/backpack_slot_empty.svg")
	_tex_slot_filled = load("res://assets/art/ui/icons/backpack_slot_filled.svg")
	_build_ui()
	GameState.character_died.connect(_on_character_died)
	GameState.wave_started.connect(_on_wave_started)
	GameState.boss_spawned.connect(_on_boss_spawned)
	GameState.state_changed.connect(_on_state_changed)
	GameState.backpack_changed.connect(_on_backpack_changed)


func _build_ui() -> void:
	var theme := load("res://assets/art/ui/theme.tres") as Theme

	var root := Control.new()
	root.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	root.theme = theme
	add_child(root)

	# ── Timer panel (top center) ─────────────────────────────────────────────────
	var timer_panel := Panel.new()
	timer_panel.position = Vector2(GameConfig.VIEWPORT_WIDTH * 0.5 - 46, 6)
	timer_panel.size = Vector2(92, 28)
	root.add_child(timer_panel)

	_timer_label = Label.new()
	_timer_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_timer_label.position = Vector2(GameConfig.VIEWPORT_WIDTH * 0.5 - 40, 9)
	_timer_label.size = Vector2(80, 22)
	_timer_label.add_theme_font_size_override("font_size", 17)
	root.add_child(_timer_label)

	# ── Wave panel (top left) ────────────────────────────────────────────────────
	var wave_panel := Panel.new()
	wave_panel.position = Vector2(6, 6)
	wave_panel.size = Vector2(148, 28)
	root.add_child(wave_panel)

	_wave_label = Label.new()
	_wave_label.text = "Onda 1..."
	_wave_label.position = Vector2(14, 9)
	_wave_label.size = Vector2(134, 22)
	_wave_label.add_theme_font_size_override("font_size", 12)
	root.add_child(_wave_label)

	# ── Power status (top right) ─────────────────────────────────────────────────
	_power_label = Label.new()
	_power_label.text = ""
	_power_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	_power_label.position = Vector2(GameConfig.VIEWPORT_WIDTH - 212, 9)
	_power_label.size = Vector2(200, 22)
	_power_label.add_theme_font_size_override("font_size", 12)
	_power_label.add_theme_color_override("font_color", Color(0.72, 0.52, 1.0, 1.0))
	root.add_child(_power_label)

	# ── Siege mode indicator (center bottom) ────────────────────────────────────
	_siege_indicator = Label.new()
	_siege_indicator.text = "⚡ SIEGE MODE"
	_siege_indicator.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_siege_indicator.position = Vector2(GameConfig.VIEWPORT_WIDTH * 0.5 - 82, GameConfig.VIEWPORT_HEIGHT - 50)
	_siege_indicator.size = Vector2(164, 30)
	_siege_indicator.add_theme_font_size_override("font_size", 16)
	_siege_indicator.add_theme_color_override("font_color", Color(1.0, 0.88, 0.1, 1.0))
	_siege_indicator.modulate = Color(1.0, 1.0, 1.0, 0.0)  # hidden initially
	root.add_child(_siege_indicator)

	# ── HP panel (bottom left) ───────────────────────────────────────────────────
	var hp_panel := Panel.new()
	hp_panel.position = Vector2(6, GameConfig.VIEWPORT_HEIGHT - 132)
	hp_panel.size = Vector2(174, 124)
	root.add_child(hp_panel)

	_hp_container = VBoxContainer.new()
	_hp_container.position = Vector2(14, GameConfig.VIEWPORT_HEIGHT - 124)
	_hp_container.size = Vector2(158, 112)
	root.add_child(_hp_container)

	# ── Backpack panel (bottom right) ────────────────────────────────────────────
	var slot_size: float = 30.0
	var slot_gap: float = 5.0
	var slots_total_w := GameConfig.BACKPACK_CAPACITY * slot_size + (GameConfig.BACKPACK_CAPACITY - 1) * slot_gap
	var slots_x := GameConfig.VIEWPORT_WIDTH - slots_total_w - 10.0
	var slots_y := GameConfig.VIEWPORT_HEIGHT - slot_size - 10.0

	var bp_panel := Panel.new()
	bp_panel.position = Vector2(slots_x - 9, slots_y - 9)
	bp_panel.size = Vector2(slots_total_w + 18, slot_size + 18)
	root.add_child(bp_panel)

	for i in GameConfig.BACKPACK_CAPACITY:
		var slot := TextureRect.new()
		slot.texture = _tex_slot_empty
		slot.size = Vector2(slot_size, slot_size)
		slot.position = Vector2(slots_x + i * (slot_size + slot_gap), slots_y)
		slot.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
		root.add_child(slot)
		_backpack_slot_nodes.append(slot)

	# ── Debug overlay ────────────────────────────────────────────────────────────
	_debug_overlay = Panel.new()
	_debug_overlay.position = Vector2(GameConfig.VIEWPORT_WIDTH - 180, 50)
	_debug_overlay.size = Vector2(170, 200)
	_debug_overlay.visible = true
	_debug_visible = true
	root.add_child(_debug_overlay)
	var debug_label := Label.new()
	debug_label.name = "DebugLabel"
	debug_label.position = Vector2(5, 5)
	debug_label.size = Vector2(160, 190)
	debug_label.autowrap_mode = TextServer.AUTOWRAP_WORD
	debug_label.add_theme_font_size_override("font_size", 11)
	_debug_overlay.add_child(debug_label)


func register_character(character: BaseCharacter) -> void:
	var row := HBoxContainer.new()
	row.add_theme_constant_override("separation", 6)
	_hp_container.add_child(row)

	var name_label := Label.new()
	name_label.text = character.character_name.substr(0, 3).to_upper()
	name_label.custom_minimum_size = Vector2(38, 20)
	name_label.add_theme_font_size_override("font_size", 11)
	name_label.add_theme_color_override("font_color", character.color)
	row.add_child(name_label)

	var bar := ProgressBar.new()
	bar.max_value = character.max_hp
	bar.value = character.current_hp
	bar.custom_minimum_size = Vector2(106, 18)
	bar.show_percentage = false
	row.add_child(bar)

	_hp_bars[character] = bar
	character.hp_changed.connect(_on_hp_changed)


func _on_hp_changed(character, new_hp: float, _max_hp_val: float) -> void:
	if character in _hp_bars:
		_hp_bars[character].value = new_hp


func _on_character_died(character) -> void:
	if character in _hp_bars:
		var bar: ProgressBar = _hp_bars[character]
		(bar.get_parent() as CanvasItem).modulate = Color(0.32, 0.28, 0.40)
		_hp_bars.erase(character)


func _on_wave_started(wave_index: int) -> void:
	_wave_label.text = "Onda %d" % wave_index
	_wave_label.add_theme_color_override("font_color", Color(0.86, 0.80, 0.96, 1.0))
	_wave_label.add_theme_font_size_override("font_size", 12)


func _on_boss_spawned() -> void:
	_wave_label.text = "⚠  BOSS"
	_wave_label.add_theme_color_override("font_color", Color(1.0, 0.22, 0.28, 1.0))
	_wave_label.add_theme_font_size_override("font_size", 15)


func _on_state_changed(_new_state) -> void:
	pass


func _on_backpack_changed(contents: Array) -> void:
	for i in _backpack_slot_nodes.size():
		_backpack_slot_nodes[i].texture = _tex_slot_filled if i < contents.size() else _tex_slot_empty


func set_power_display(power) -> void:
	if power == null:
		_power_label.text = ""
	else:
		_power_label.text = power.power_name


func _process(_delta: float) -> void:
	# Timer
	if GameState.current_state == GameState.RunState.PLAYING or \
			GameState.current_state == GameState.RunState.BOSS_FIGHT:
		var t := int(GameState.run_time)
		_timer_label.text = "%02d:%02d" % [t / 60, t % 60]

	# Siege mode indicator
	if GameState.active_power and GameState.active_power.power_name == "Siege Mode":
		_siege_indicator.modulate.a = 1.0 if GameState.siege_mode_active else 0.0

	# Power label with cooldown
	if GameState.active_power:
		var p: PowerResource = GameState.active_power
		if p.cooldown_remaining > 0:
			_power_label.text = "%s [%.1fs]" % [p.power_name, p.cooldown_remaining]
		elif p.is_active:
			_power_label.text = "%s [ON]" % p.power_name
		else:
			_power_label.text = p.power_name

	# Debug overlay (F1)
	if Input.is_action_just_pressed("toggle_debug"):
		_debug_visible = not _debug_visible
		_debug_overlay.visible = _debug_visible

	if _debug_visible:
		_update_debug()


func _update_debug() -> void:
	var label := _debug_overlay.get_node("DebugLabel") as Label
	var lines: PackedStringArray = []
	lines.append("FPS: %d" % Engine.get_frames_per_second())
	lines.append("Time: %.1fs" % GameState.run_time)
	lines.append("Party: %d" % GameState.party.size())
	lines.append("Enemies: %d" % get_tree().get_nodes_in_group("enemies").size())
	lines.append("Siege: %s" % str(GameState.siege_mode_active))
	lines.append("DmgMult: %.1f" % GameState.power_damage_multiplier)
	lines.append("Backpack: %d/%d" % [GameState.backpack.size(), GameConfig.BACKPACK_CAPACITY])
	label.text = "\n".join(lines)
