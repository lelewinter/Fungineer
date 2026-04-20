## Main — Root scene. Builds and wires up all game systems at runtime.
## Uses programmatic scene construction to avoid .tscn complexity in prototype.
extends Node2D

# ── Nodes ─────────────────────────────────────────────────────────────────────
var _world: Node2D
var _arena: ColorRect
var _extraction_point: ExtractionPoint
var _party: Party
var _enemies: Node2D
var _items: Node2D
var _camera: Camera2D
var _drag_controller: DragController
var _wave_spawner: WaveSpawner
var _item_spawner: ItemSpawner
var _power_manager: PowerManager
var _hud: HUD
var _game_over_screen: GameOverScreen
var _victory_screen: VictoryScreen
var _rescue_screen: RescueScreen
var _power_offer_screen: PowerOfferScreen
var _music: AudioStreamPlayer


func _ready() -> void:
	_build_world()
	_build_systems()
	_build_ui()
	_connect_signals()
	_start_run()
	_setup_music()


# ── Scene Construction ─────────────────────────────────────────────────────────

func _build_world() -> void:
	_world = Node2D.new()
	_world.name = "World"
	add_child(_world)

	# Arena background
	_arena = ColorRect.new()
	_arena.name = "Arena"
	_arena.color = Color(0.08, 0.08, 0.12)
	_arena.size = Vector2(GameConfig.ARENA_WIDTH, GameConfig.ARENA_HEIGHT)
	_world.add_child(_arena)

	# Arena border
	_draw_arena_border()

	# Extraction point (EXIT zone — entering triggers run victory)
	_extraction_point = ExtractionPoint.new()
	_extraction_point.name = "ExtractionPoint"
	_extraction_point.position = Vector2(GameConfig.ARENA_WIDTH * 0.5, GameConfig.ARENA_HEIGHT * 0.15)
	_world.add_child(_extraction_point)

	# Party container
	_party = Party.new()
	_party.name = "Party"
	_party.position = Vector2(GameConfig.ARENA_WIDTH * 0.5, GameConfig.ARENA_HEIGHT * 0.7)
	_world.add_child(_party)

	# Camera — follows party, bounded to arena
	_camera = Camera2D.new()
	_camera.name = "Camera"
	_camera.limit_left = 0
	_camera.limit_top = 0
	_camera.limit_right = int(GameConfig.ARENA_WIDTH)
	_camera.limit_bottom = int(GameConfig.ARENA_HEIGHT)
	_camera.position_smoothing_enabled = true
	_camera.position_smoothing_speed = 12.0
	_party.add_child(_camera)

	# Enemies container
	_enemies = Node2D.new()
	_enemies.name = "Enemies"
	_world.add_child(_enemies)

	# Items container
	_items = Node2D.new()
	_items.name = "Items"
	_world.add_child(_items)


func _draw_arena_border() -> void:
	# Simple border using 4 ColorRect strips
	var border_color := Color(0.3, 0.3, 0.5)
	var thickness := 3.0
	var borders := [
		[Vector2(0, 0), Vector2(GameConfig.ARENA_WIDTH, thickness)],
		[Vector2(0, GameConfig.ARENA_HEIGHT - thickness), Vector2(GameConfig.ARENA_WIDTH, thickness)],
		[Vector2(0, 0), Vector2(thickness, GameConfig.ARENA_HEIGHT)],
		[Vector2(GameConfig.ARENA_WIDTH - thickness, 0), Vector2(thickness, GameConfig.ARENA_HEIGHT)],
	]
	for b in borders:
		var r := ColorRect.new()
		r.color = border_color
		r.position = b[0]
		r.size = b[1]
		_world.add_child(r)



func _build_systems() -> void:
	# Drag controller
	_drag_controller = DragController.new()
	_drag_controller.name = "DragController"
	_drag_controller.party_node = _party
	add_child(_drag_controller)

	# Wave spawner
	_wave_spawner = WaveSpawner.new()
	_wave_spawner.name = "WaveSpawner"
	_wave_spawner.enemies_container = _enemies
	add_child(_wave_spawner)

	# Power manager
	_power_manager = PowerManager.new()
	_power_manager.name = "PowerManager"
	add_child(_power_manager)

	# Wire extraction point to party
	_extraction_point.setup(_party)

	# Item spawner
	_item_spawner = ItemSpawner.new()
	_item_spawner.name = "ItemSpawner"
	_item_spawner.setup(_items, _party)
	add_child(_item_spawner)


func _build_ui() -> void:
	_hud = HUD.new()
	_hud.name = "HUD"
	add_child(_hud)

	_game_over_screen = GameOverScreen.new()
	_game_over_screen.name = "GameOverScreen"
	add_child(_game_over_screen)

	_victory_screen = VictoryScreen.new()
	_victory_screen.name = "VictoryScreen"
	add_child(_victory_screen)

	_rescue_screen = RescueScreen.new()
	_rescue_screen.name = "RescueScreen"
	add_child(_rescue_screen)

	_power_offer_screen = PowerOfferScreen.new()
	_power_offer_screen.name = "PowerOfferScreen"
	add_child(_power_offer_screen)


func _connect_signals() -> void:
	GameState.run_ended.connect(_on_run_ended)
	_game_over_screen.hub_requested.connect(_go_to_hub)
	_game_over_screen.quit_requested.connect(func(): get_tree().quit())
	_victory_screen.hub_requested.connect(_go_to_hub)
	_victory_screen.quit_requested.connect(func(): get_tree().quit())
	_wave_spawner.wave_cleared.connect(_on_wave_cleared)
	_rescue_screen.character_chosen.connect(_on_character_chosen)
	_rescue_screen.skipped.connect(GameState.resume_from_event)
	_power_offer_screen.power_chosen.connect(_on_power_chosen)


# ── Run Lifecycle ──────────────────────────────────────────────────────────────

func _start_run() -> void:
	GameState.party.clear()

	# Add starting characters: Guardian + Striker (Sprint 1)
	var guardian := Guardian.new()
	_party.add_character(guardian)
	_hud.register_character(guardian)

	var striker := Striker.new()
	_party.add_character(striker)
	_hud.register_character(striker)

	# Start game state, spawn items, start waves
	GameState.start_run()
	_item_spawner.spawn_resources("scrap")
	_wave_spawner.start()


func _on_wave_cleared(wave_index: int) -> void:
	match wave_index:
		1:
			# Skip rescue if party is already full
			if GameState.party.size() >= GameConfig.MAX_PARTY_SIZE:
				return
			# Offer a rescued character: pick 2 random from available pool
			var pool: Array = []
			if not "Artificer" in HubState.rescued_characters:
				pool.append({"name": "Artificera", "desc": "Explosões em área. Bônus em grupos.", "class": Artificer})
			if not "Medic" in HubState.rescued_characters:
				pool.append({"name": "Médica", "desc": "Cura passiva e suporte à party.", "class": Medic})
			pool.shuffle()
			_rescue_screen.show_rescue(pool.slice(0, 2))
		2:
			# Offer 3 random powers from the full pool
			var power_pool: Array[PowerResource] = [
				SiegeMode.new(),
				SplitOrbit.new(),
				Overclock.new(),
				MagnetPulse.new(),
				ReflectiveShell.new(),
				GhostDrive.new(),
			]
			power_pool.shuffle()
			_power_offer_screen.show_offer(power_pool.slice(0, 3))


func _on_character_chosen(char_class: Variant) -> void:
	var character: BaseCharacter = (char_class as GDScript).new()
	_party.add_character(character)
	_hud.register_character(character)
	var scr := character.get_script() as Script
	var class_name_str: String = scr.get_global_name() if scr else ""
	if class_name_str not in HubState.rescued_characters:
		HubState.rescued_characters.append(class_name_str)
	GameState.resume_from_event()


func _on_power_chosen(power: PowerResource) -> void:
	_power_manager.set_power(power)
	_hud.set_power_display(power)
	GameState.resume_from_event()


func _on_run_ended(victory: bool, fragments: int) -> void:
	if victory:
		HubState.deposit_backpack(GameState.backpack)
		_victory_screen.show_screen(GameState.run_time, fragments)
	else:
		_game_over_screen.show_screen(GameState.run_time)


func _setup_music() -> void:
	_music = AudioStreamPlayer.new()
	_music.stream = load("res://assets/audio/music/battle.wav")
	_music.volume_db = -10.0
	add_child(_music)
	_music.finished.connect(_music.play)
	_music.play()


func _go_to_hub() -> void:
	get_tree().change_scene_to_file("res://src/scenes/WorldMapScene.tscn")


func _restart_run() -> void:
	# Clear enemies and items
	for child in _enemies.get_children():
		child.queue_free()
	_item_spawner.clear_items()
	_extraction_point.reset()

	# Clear characters from party node
	_party.reset()
	for child in _party.get_children():
		child.queue_free()

	# Hide screens
	_game_over_screen.visible = false
	_victory_screen.visible = false

	# Restart after one frame to allow cleanup
	await get_tree().process_frame
	_start_run()


# ── Input ──────────────────────────────────────────────────────────────────────

func _input(event: InputEvent) -> void:
	# Power activation: tap power icon area or press Space on desktop
	if event is InputEventKey:
		var key := event as InputEventKey
		if key.pressed and key.keycode == KEY_SPACE:
			_power_manager.toggle()

	# Debug overlay toggle handled in HUD via InputMap action "toggle_debug"
