## HubState — Persistent progression between runs.
## Tracks resource stock, rocket build progress, and rescued characters.
## Persists across scene changes (autoload singleton).
extends Node

# Resource stock
var stock: Dictionary = {
	"scrap": 0,
	"ai_components": 0,
	"nucleo_logico": 0,
	"combustivel_volatil": 0,
	"sinais_controle": 0,
	"biomassa_adaptativa": 0,
	"fragmentos_estruturais": 0,
}

# Rocket recipe — 8 pieces built in order.
# Each piece requires resources from specific zones so ALL zones matter.
const ROCKET_RECIPE: Array = [
	# Piece 1 — single resource, fast first win (Hordas)
	{"name": "Base Estrutural",    "scrap": 3},
	# Piece 2 — single resource (Extração)
	{"name": "Motor Principal",    "combustivel_volatil": 3},
	# Piece 3 — single resource (Circuito)
	{"name": "Processador",        "nucleo_logico": 2},
	# Piece 4 — two zones: Labirinto + Hordas
	{"name": "Revestimento",       "fragmentos_estruturais": 3, "scrap": 2},
	# Piece 5 — two zones: Stealth/Sacrifício + Campo
	{"name": "Rede Neural",        "ai_components": 4, "sinais_controle": 20},
	# Piece 6 — two zones: Infecção + Extração
	{"name": "Sistema Vital",      "biomassa_adaptativa": 6, "combustivel_volatil": 2},
	# Piece 7 — two zones: Labirinto + Stealth/Sacrifício
	{"name": "Blindagem Externa",  "fragmentos_estruturais": 3, "ai_components": 3},
	# Piece 8 — four zones: forces player to have visited everything
	{"name": "Ignição Final",      "scrap": 2, "nucleo_logico": 1, "sinais_controle": 30, "biomassa_adaptativa": 4},
]

# Roster de sobreviventes disponíveis para resgate
const SURVIVOR_ROSTER: Array = [
	{"name": "Capitã Runa",  "role": "Guardiã",           "color": Color(0.40, 0.90, 0.40)},
	{"name": "Brix",         "role": "Artilheiro",         "color": Color(1.00, 0.60, 0.20)},
	{"name": "Zara",         "role": "Artificeira",        "color": Color(0.90, 0.30, 0.30)},
	{"name": "Luz",          "role": "Médica",             "color": Color(0.80, 0.40, 0.90)},
	{"name": "Ex-Exec",      "role": "Estrategista",       "color": Color(0.60, 0.55, 0.45)},
	{"name": "Fio",          "role": "Hacker",             "color": Color(0.20, 0.90, 0.70)},
	{"name": "Ferro-Velho",  "role": "Engenheiro",         "color": Color(0.70, 0.65, 0.30)},
	{"name": "Mira",         "role": "Elite",              "color": Color(0.90, 0.70, 0.20)},
	{"name": "Nulo",         "role": "Agente Stealth",     "color": Color(0.55, 0.55, 0.65)},
]

var rocket_pieces_built: int = 0
## rescued_characters now mirrors CharacterRegistry — kept for backwards compat.
## Prefer CharacterRegistry.get_rescued() for new code.
var rescued_characters: Array[String] = []

# Which zones are available (index = zone id)
# 0=Hordas, 1=Stealth, 2=Circuito, 3=Extração, 4=Campo, 5=Infecção, 6=Labirinto, 7=Sacrifício
var zones_unlocked: Array[bool] = [true, true, true, true, true, true, true, true]  # all unlocked for testing

# Deterioration — per zone, 0=stable 1=deteriorating 2=critical (3=closed, post-MVP)
var zone_deterioration: Array[int] = [0, 0, 0, 0, 0, 0, 0, 0]
var total_runs: int = 0

## Lore fragments found during runs. Keyed by fragment id (see LoreFragments.gd).
var lore_found: Array[String] = []

signal stock_changed(stock: Dictionary)
signal rocket_piece_built(piece_index: int, piece_name: String)
signal deterioration_changed(zone_id: int, stage: int)

# Hub-specific signals
signal hub_room_selected(room_id: String)
signal hub_npc_selected(npc_id: String)
signal hub_zoom_opened(room_id: String, zone_id: String)
signal hub_zoom_closed()
signal hub_rocket_opened()
signal hub_rocket_closed()

# Hub state
var hub_variant: String = "fungus"  # fungus (default), warm, balanced, blueprint
var hub_density: String = "balanced"  # minimal, balanced, informative
var hub_ui_visible: bool = true

# Unlock system — Dia 1 apenas saida_hordas + lab (câmara de esporos)
var room_unlocked: Dictionary = {
	"saida_hordas": true,
	"lab": true,
}

# Ordem de desbloqueio por peça de foguete construída (14 locked → 8 peças)
# Peças 1-2: 1 sala; peças 3-8: 2 salas. Total = 14.
const UNLOCK_ORDER: Array[String] = [
	"cozinha",        # piece 1
	"enfermaria",     # piece 2
	"server",         # piece 3 (a)
	"tunel_stealth",  # piece 3 (b)
	"arquivo",        # piece 4 (a)
	"sala_comum",     # piece 4 (b)
	"workshop",       # piece 5 (a)
	"vigia",          # piece 5 (b)
	"tunel_hordas",   # piece 6 (a)
	"armamentos",     # piece 6 (b)
	"gestao",         # piece 7 (a)
	"quarto_lena",    # piece 7 (b)
	"corredor",       # piece 8 (a)
	"surface",        # piece 8 (b) — escape visível
]

signal room_unlocked_signal(room_id: String)


func is_room_unlocked(room_id: String) -> bool:
	return room_unlocked.get(room_id, false)


func unlock_room(room_id: String) -> void:
	if room_unlocked.get(room_id, false):
		return
	room_unlocked[room_id] = true
	room_unlocked_signal.emit(room_id)


func _unlock_rooms_for_pieces_built() -> void:
	# Peças 1-2: 1 sala; peças 3+: +2 salas por peça.
	var count := 0
	if rocket_pieces_built >= 1: count = 1
	if rocket_pieces_built >= 2: count = 2
	if rocket_pieces_built >= 3: count = 4
	if rocket_pieces_built >= 4: count = 6
	if rocket_pieces_built >= 5: count = 8
	if rocket_pieces_built >= 6: count = 10
	if rocket_pieces_built >= 7: count = 12
	if rocket_pieces_built >= 8: count = 14
	for i in range(min(count, UNLOCK_ORDER.size())):
		unlock_room(UNLOCK_ORDER[i])


# Hub variant color palettes
const VARIANTS: Dictionary = {
	"fungus": {
		"name": "Fungus Pântano",
		"bg": Color(0.08, 0.09, 0.06),
		"grid": Color(0.18, 0.14, 0.12),
		"ink": Color(0.85, 0.92, 0.78),
		"warm_light": Color(0.72, 0.45, 0.85),   # esporo roxo
		"cool_light": Color(0.30, 0.78, 0.72),   # turquesa bio
		"red_light": Color(0.78, 0.35, 0.45),
		"accent": Color(0.72, 0.45, 0.85),
	},
	"warm": {
		"name": "Warm Gambiarra",
		"bg": Color(0.09, 0.06, 0.04),
		"grid": Color(0.15, 0.15, 0.15),
		"ink": Color(0.96, 0.89, 0.78),
		"warm_light": Color(0.91, 0.58, 0.23),
		"cool_light": Color(0.0, 1.0, 0.68),
		"red_light": Color(0.82, 0.29, 0.25),
		"accent": Color(0.91, 0.58, 0.23),
	},
	"balanced": {
		"name": "Balanced",
		"bg": Color(0.08, 0.07, 0.06),
		"grid": Color(0.15, 0.15, 0.15),
		"ink": Color(0.96, 0.89, 0.78),
		"warm_light": Color(0.91, 0.58, 0.23),
		"cool_light": Color(0.0, 1.0, 0.68),
		"red_light": Color(0.82, 0.29, 0.25),
		"accent": Color(0.91, 0.58, 0.23),
	},
	"blueprint": {
		"name": "Blueprint Cold",
		"bg": Color(0.05, 0.08, 0.12),
		"grid": Color(0.15, 0.18, 0.22),
		"ink": Color(0.6, 0.8, 1.0),
		"warm_light": Color(0.0, 1.0, 0.68),
		"cool_light": Color(0.0, 1.0, 0.68),
		"red_light": Color(0.0, 1.0, 0.68),
		"accent": Color(0.0, 1.0, 0.68),
	}
}

signal hub_variant_changed(variant: String)


func set_hub_variant(variant_key: String) -> void:
	if variant_key in VARIANTS:
		hub_variant = variant_key
		hub_variant_changed.emit(variant_key)


func get_variant_data() -> Dictionary:
	return VARIANTS.get(hub_variant, VARIANTS["balanced"])


func deposit_flow(key: String, amount: int) -> void:
	## Deposit a flow resource directly by integer amount (no backpack slot limit).
	## Used by zones like Controle de Campo and Infecção that accumulate resources passively.
	if key in stock:
		stock[key] += amount
	stock_changed.emit(stock)
	_try_build_next_piece()


func deposit_backpack(backpack: Array[String]) -> void:
	for item in backpack:
		if item in stock:
			stock[item] += 1
	stock_changed.emit(stock)
	_try_build_next_piece()


func _try_build_next_piece() -> void:
	while rocket_pieces_built < ROCKET_RECIPE.size():
		var recipe: Dictionary = ROCKET_RECIPE[rocket_pieces_built]
		if _can_afford(recipe):
			_spend(recipe)
			var piece_name: String = recipe["name"]
			rocket_pieces_built += 1
			rocket_piece_built.emit(rocket_pieces_built - 1, piece_name)
			_check_zone_unlocks()
			_unlock_rooms_for_pieces_built()
		else:
			break


func _check_zone_unlocks() -> void:
	# Each zone unlocks after building a rocket piece
	var thresholds: Array[int] = [0, 1, 2, 3, 4, 5, 6, 7]
	for i in zones_unlocked.size():
		if rocket_pieces_built >= thresholds[i]:
			zones_unlocked[i] = true


func _can_afford(recipe: Dictionary) -> bool:
	for key in recipe:
		if key == "name":
			continue
		if stock.get(key, 0) < recipe[key]:
			return false
	return true


func _spend(recipe: Dictionary) -> void:
	for key in recipe:
		if key == "name":
			continue
		stock[key] -= recipe[key]


func next_piece_cost() -> Dictionary:
	if rocket_pieces_built >= ROCKET_RECIPE.size():
		return {}
	return ROCKET_RECIPE[rocket_pieces_built]


func is_rocket_complete() -> bool:
	return rocket_pieces_built >= ROCKET_RECIPE.size()


func get_backpack_capacity() -> int:
	return GameConfig.BACKPACK_CAPACITY + CharacterRegistry.get_backpack_bonus()


func mark_lore_found(fragment_id: String) -> void:
	if fragment_id not in lore_found:
		lore_found.append(fragment_id)


func is_lore_found(fragment_id: String) -> bool:
	return fragment_id in lore_found


func get_spawn_multiplier(zone_id: int) -> float:
	var stage: int = zone_deterioration[zone_id] if zone_id < zone_deterioration.size() else 0
	match stage:
		1: return 1.25
		2: return 1.50
		_: return 1.0


func on_run_ended(_victory: bool) -> void:
	total_runs += 1
	_update_deterioration()


func _update_deterioration() -> void:
	for i in zone_deterioration.size():
		var old_stage: int = zone_deterioration[i]
		var new_stage: int = _stage_for_runs(total_runs)
		new_stage = min(new_stage, 2)  # Stage 3 is post-MVP
		if new_stage != old_stage:
			zone_deterioration[i] = new_stage
			deterioration_changed.emit(i, new_stage)


func _stage_for_runs(runs: int) -> int:
	if runs >= GameConfig.DETERIORATION_STAGE2_RUNS:
		return 2
	if runs >= GameConfig.DETERIORATION_STAGE1_RUNS:
		return 1
	return 0


# Hub helpers
func get_room_by_id(room_id: String) -> Dictionary:
	return HubData.get_room(room_id)


func get_npc_by_id(npc_id: String) -> Dictionary:
	return HubData.get_npc(npc_id)


func get_zone_by_id(zone_id: String) -> Dictionary:
	return HubData.get_zone(zone_id)


func get_npcs_in_room(room_id: String) -> Array:
	return HubData.get_npcs_in_room(room_id)
