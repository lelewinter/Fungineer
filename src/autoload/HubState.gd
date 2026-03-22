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
