## SacrificeMain — Zona de Sacrifício.
## Strategic decision zone: 5 resource chambers around a central hub.
## Each chamber shows its cost BEFORE entry (timer penalty | enemy spawn | slot block | chain).
## Cost activates on first entry. Squad auto-fights enemies. 90 s run timer. EXIT in hub.
extends Node2D

# ─────────────────────── Cost type constants ──────────────────────────────────
const COST_NONE  := 0
const COST_TIMER := 1
const COST_ENEMY := 2
const COST_SLOT  := 3
const COST_CHAIN := 4

# ─────────────────────── Other constants ──────────────────────────────────────
const _SQUAD_DPS: float       = 15.0   # HP/s per squad member vs enemies
const _ENEMY_HP_EACH: float   = 30.0   # HP per spawned enemy
const _ENEMY_DPS: float       = 3.0    # damage/s per enemy on squad
const _SQUAD_HP_PER: float    = 80.0   # squad HP per squad member
const _COLLECT_TIME: float    = 1.5
const _COLLECT_DIST: float    = 26.0
const _PICKUP_R: float        = 8.0
const _PLAYER_SPEED: float    = 200.0
const _PLAYER_R: float        = 14.0
const _CHAMBER_RADIUS: float  = 170.0  # px from hub center to chamber center
const _CHAMBER_W: float       = 130.0
const _CHAMBER_H: float       = 100.0
const _N_CHAMBERS: int        = 5
const _CORRIDOR_W: float      = 38.0

const _HUB_CENTER: Vector2 = Vector2(240.0, 427.0)
const _HUB_RECT: Rect2     = Rect2(155.0, 352.0, 170.0, 150.0)
const _EXIT_RECT: Rect2    = Rect2(190.0, 462.0, 100.0, 40.0)

# ─────────────────────── Inner: Chamber (data + labels) ────────────────────────
class _Chamber:
	var rect: Rect2
	var center: Vector2
	var scrap: int = 0
	var ai: int = 0
	var cost: int = 0       # one of outer COST_* constants
	var cost_timer_s: int = 0
	var cost_enemy_n: int = 0
	var chain_to: int = -1  # index of the chamber this chains to
	var entered: bool = false
	var enemy_hp: float = 0.0
	var pickups: Array = []         # [{pos, type, collected, collecting, timer}]
	var collecting_idx: int = -1
	var seal_timer: float = -1.0   # -1 = not started; counts up once entered
	var sealed: bool = false

	func setup_rect(r: Rect2) -> void:
		rect = r
		center = r.get_center()

	func cost_color() -> Color:
		if cost == 0: return Color(0.30, 0.90, 0.30)
		if cost == 1: return Color(0.90, 0.80, 0.20)
		if cost == 2: return Color(0.90, 0.20, 0.20)
		if cost == 3: return Color(0.60, 0.20, 0.90)
		if cost == 4: return Color(0.90, 0.50, 0.10)
		return Color.WHITE

	func cost_label() -> String:
		if cost == 0: return "SEM CUSTO"
		if cost == 1: return "-%ds" % cost_timer_s
		if cost == 2: return "x%d Inimigos" % cost_enemy_n
		if cost == 3: return "-1 Slot"
		if cost == 4: return "CADEIA"
		return "?"

	func resource_label() -> String:
		var parts: Array[String] = []
		if scrap > 0:
			parts.append("Sucata x%d" % scrap)
		if ai > 0:
			parts.append("C.IA  x%d" % ai)
		if parts.is_empty():
			return "Vazio"
		return "\n".join(parts)

	func enemy_count() -> int:
		return ceili(enemy_hp / 30.0)

	func enemies_alive() -> bool:
		return cost == 2 and entered and enemy_hp > 0.0

	func build_pickups() -> void:
		pickups.clear()
		var total := scrap + ai
		if total == 0:
			return
		var pad := 18.0
		var area := Rect2(rect.position + Vector2(pad, pad),
			rect.size - Vector2(pad * 2.0, pad * 2.0))
		var cols := maxi(1, ceili(sqrt(float(total))))
		var rows := ceili(float(total) / float(cols))
		var sx := area.size.x / float(cols)
		var sy := area.size.y / float(rows)
		var idx := 0
		for r in rows:
			for c in cols:
				if idx >= total:
					break
				pickups.append({
					"pos": area.position + Vector2(sx * (c + 0.5), sy * (r + 0.5)),
					"type": "scrap" if idx < scrap else "ai_components",
					"collected": false, "collecting": false, "timer": 0.0,
				})
				idx += 1

# ─────────────────────── Inner: HUD ───────────────────────────────────────────
class _SacHUD:
	var _layer: CanvasLayer
	var _timer_lbl: Label
	var _bag_lbl: Label
	var _hp_lbl: Label

	func setup(parent: Node) -> void:
		_layer = CanvasLayer.new()
		_layer.layer = 20
		parent.add_child(_layer)

		var bg := ColorRect.new()
		bg.color = Color(0.0, 0.0, 0.0, 0.55)
		bg.size = Vector2(480.0, 48.0)
		_layer.add_child(bg)

		_timer_lbl = Label.new()
		_timer_lbl.position = Vector2(10.0, 10.0)
		_timer_lbl.add_theme_font_size_override("font_size", 18)
		_timer_lbl.modulate = Color(1.0, 0.90, 0.30)
		_layer.add_child(_timer_lbl)

		_bag_lbl = Label.new()
		_bag_lbl.position = Vector2(170.0, 10.0)
		_bag_lbl.add_theme_font_size_override("font_size", 18)
		_bag_lbl.modulate = Color(0.90, 0.70, 0.95)
		_layer.add_child(_bag_lbl)

		_hp_lbl = Label.new()
		_hp_lbl.position = Vector2(340.0, 10.0)
		_hp_lbl.add_theme_font_size_override("font_size", 18)
		_hp_lbl.modulate = Color(1.0, 0.40, 0.40)
		_layer.add_child(_hp_lbl)

	func refresh(timer: float, bag: int, cap: int, hp: float, invaders: int) -> void:
		_timer_lbl.text = "Timer: %ds" % ceili(timer)
		_bag_lbl.text = "Bag: %d/%d" % [bag, cap]
		var inv_str: String = "  ⚠ x%d" % invaders if invaders > 0 else ""
		_hp_lbl.text = "Vida: %d%s" % [ceili(hp), inv_str]

# ─────────────────────── Scene state ──────────────────────────────────────────
var _chambers: Array = []
var _backpack: Array[String] = []
var _bag_cap: int = 3
var _run_timer: float = 0.0
var _squad_size: int = 1
var _squad_hp: float = 0.0
var _squad_max_hp: float = 0.0
var _player_pos: Vector2 = Vector2.ZERO
var _drag_target: Vector2 = Vector2.ZERO
var _dragging: bool = false
var _current_chamber_idx: int = -1   # -1 = in hub
var _run_ended: bool = false
var _victory: bool = false
var _damage_flash: float = 0.0
var _hud = null  # _SacHUD

const _SEAL_TIME: float         = 8.0    # seconds before chamber seals after entry
const _HUB_SPAWN_INTERVAL: float= 12.0   # seconds between hub enemy waves
const _HUB_ENEMY_HP: float      = 22.0   # HP per hub invader
const _HUB_ENEMY_SPEED: float   = 110.0  # px/s chasing the player
const _HUB_ENEMY_DPS: float     = 8.0    # damage/s per nearby invader
const _HUB_ENEMY_DAMAGE_DIST: float = 48.0  # px — proximity to deal damage
const _BONUS_INTERVAL: float    = 12.0   # seconds between bonus chamber rotations
const _BONUS_COLLECT_TIME: float = 0.35  # pickup time when bonus is active

var _hub_enemies: Array = []     # Array of {pos: Vector2, hp: float}
var _hub_spawn_timer: float = 20.0
var _bonus_idx: int = -1
var _bonus_timer: float = 8.0    # first bonus at 8s
var _pulse: float = 0.0

# ─────────────────────── _ready ───────────────────────────────────────────────
func _ready() -> void:
	GameState.start_run()
	_bag_cap = HubState.get_backpack_capacity()
	_run_timer = GameConfig.SACRIFICE_RUN_TIMER

	# Squad composition (guardian + rescued)
	_squad_size = 1 + HubState.rescued_characters.size()
	_squad_max_hp = _squad_size * _SQUAD_HP_PER
	_squad_hp = _squad_max_hp

	_build_layout()
	_player_pos = _HUB_CENTER

	var hud := _SacHUD.new()
	hud.setup(self)
	_hud = hud
	hud.refresh(_run_timer, 0, _bag_cap, _squad_hp, 0)
	queue_redraw()

# ─────────────────────── Layout builder ───────────────────────────────────────
func _build_layout() -> void:
	# Compute chamber positions (star layout, starting at top)
	var positions: Array[Rect2] = []
	for i in _N_CHAMBERS:
		var angle := -PI * 0.5 + float(i) * TAU / float(_N_CHAMBERS)
		var cx := _HUB_CENTER.x + _CHAMBER_RADIUS * cos(angle)
		var cy := _HUB_CENTER.y + _CHAMBER_RADIUS * sin(angle)
		positions.append(Rect2(
			cx - _CHAMBER_W * 0.5, cy - _CHAMBER_H * 0.5, _CHAMBER_W, _CHAMBER_H
		))

	# Fixed templates: guaranteed 1 of each cost type
	var templates: Array = [
		{"scrap": 4, "ai": 0, "cost": COST_NONE,  "timer_s": 0,  "enemy_n": 0},
		{"scrap": 0, "ai": 6, "cost": COST_TIMER, "timer_s": 15, "enemy_n": 0},
		{"scrap": 8, "ai": 0, "cost": COST_ENEMY, "timer_s": 0,  "enemy_n": 3},
		{"scrap": 0, "ai": 5, "cost": COST_SLOT,  "timer_s": 0,  "enemy_n": 0},
		{"scrap": 5, "ai": 3, "cost": COST_CHAIN, "timer_s": 0,  "enemy_n": 0},
	]
	templates.shuffle()

	_chambers.clear()
	for i in _N_CHAMBERS:
		var t: Dictionary = templates[i]
		var ch := _Chamber.new()
		ch.setup_rect(positions[i])
		ch.scrap = t["scrap"]
		ch.ai = t["ai"]
		ch.cost = t["cost"]
		ch.cost_timer_s = t["timer_s"]
		ch.cost_enemy_n = t["enemy_n"]
		ch.build_pickups()
		_chambers.append(ch)

	# Link the CHAIN chamber → the TIMER chamber
	var timer_idx := 0
	for i in _chambers.size():
		if _chambers[i].cost == COST_TIMER:
			timer_idx = i
			break
	for i in _chambers.size():
		if _chambers[i].cost == COST_CHAIN:
			_chambers[i].chain_to = timer_idx

# ─────────────────────── _process ─────────────────────────────────────────────
func _process(delta: float) -> void:
	if _run_ended:
		return
	if GameState.current_state != GameState.RunState.PLAYING:
		return

	_pulse += delta

	_damage_flash = maxf(0.0, _damage_flash - delta * 3.0)

	# Count down run timer
	_run_timer -= delta
	if _run_timer <= 0.0:
		_run_timer = 0.0
		_end_run(true)  # timer zero = resources kept, not fail state
		return

	# Determine current location
	_current_chamber_idx = -1
	for i in _chambers.size():
		if _chambers[i].rect.has_point(_player_pos):
			_current_chamber_idx = i
			break

	# Update seal timers — chambers close 15s after entry
	for ch in _chambers:
		if ch.entered and not ch.sealed and ch.seal_timer >= 0.0:
			ch.seal_timer += delta
			if ch.seal_timer >= _SEAL_TIME:
				ch.sealed = true
				ch.collecting_idx = -1
				# Sealing releases 2 invaders from the chamber entrance
				for k in 2:
					var ang: float = _pulse + k * PI
					var spawn: Vector2 = ch.center + Vector2(cos(ang), sin(ang)) * 30.0
					_hub_enemies.append({"pos": spawn, "hp": _HUB_ENEMY_HP})

	# Bonus chamber rotation
	_bonus_timer -= delta
	if _bonus_timer <= 0.0:
		_bonus_timer = _BONUS_INTERVAL
		_rotate_bonus()

	# Hub enemy wave spawning
	_hub_spawn_timer -= delta
	if _hub_spawn_timer <= 0.0:
		_hub_spawn_timer = _HUB_SPAWN_INTERVAL
		_spawn_hub_enemies()

	# Invader movement + combat — enemies chase the player anywhere on the map
	var total_dps := 0.0
	var to_remove_hub: Array[int] = []
	for i in _hub_enemies.size():
		var e: Dictionary = _hub_enemies[i]
		# Chase player
		var to_player: Vector2 = _player_pos - e["pos"]
		if to_player.length() > 6.0:
			e["pos"] += to_player.normalized() * _HUB_ENEMY_SPEED * delta
		# Deal damage when close
		var dist: float = e["pos"].distance_to(_player_pos)
		if dist < _HUB_ENEMY_DAMAGE_DIST:
			total_dps += _HUB_ENEMY_DPS
			# Squad fights back — each member does DPS against this enemy
			var squad_dps_share: float = float(_squad_size) * _SQUAD_DPS / float(_hub_enemies.size())
			e["hp"] -= squad_dps_share * delta
		if e["hp"] <= 0.0:
			to_remove_hub.append(i)
	for i in range(to_remove_hub.size() - 1, -1, -1):
		_hub_enemies.remove_at(to_remove_hub[i])
	if total_dps > 0.0:
		_squad_hp -= total_dps * delta
		_damage_flash = maxf(_damage_flash, 0.55)
		if _squad_hp <= 0.0:
			_squad_hp = 0.0
			_end_run(false)
			return

	# Activate chamber cost on first entry
	if _current_chamber_idx >= 0:
		var ch = _chambers[_current_chamber_idx]
		if not ch.entered:
			ch.entered = true
			ch.seal_timer = 0.0   # ← add this
			_activate_cost(ch, _current_chamber_idx)

	# Auto-combat with enemies in current chamber
	if _current_chamber_idx >= 0:
		var ch = _chambers[_current_chamber_idx]
		if ch.enemies_alive():
			var squad_dps := float(_squad_size) * _SQUAD_DPS
			ch.enemy_hp = maxf(0.0, ch.enemy_hp - squad_dps * delta)
			var dmg := float(ch.enemy_count()) * _ENEMY_DPS * delta
			_squad_hp -= dmg
			_damage_flash = maxf(_damage_flash, 0.4)
			if _squad_hp <= 0.0:
				_squad_hp = 0.0
				_end_run(false)
				return

	# Resource collection (only while inside a chamber, enemies defeated or no enemy cost)
	if _current_chamber_idx >= 0:
		var ch = _chambers[_current_chamber_idx]
		if not ch.enemies_alive():
			_update_collection(ch, _current_chamber_idx, delta)

	_hud.refresh(_run_timer, _backpack.size(), _bag_cap, _squad_hp, _hub_enemies.size())

	# Exit check
	if _EXIT_RECT.has_point(_player_pos):
		_end_run(true)

	queue_redraw()


func _activate_cost(ch, ch_idx: int) -> void:
	match ch.cost:
		COST_TIMER:
			_run_timer = maxf(0.0, _run_timer - float(ch.cost_timer_s))
		COST_ENEMY:
			ch.enemy_hp = float(ch.cost_enemy_n) * _ENEMY_HP_EACH
		COST_SLOT:
			_bag_cap = maxi(0, _bag_cap - 1)
			# Drop items from backpack if over new cap
			while _backpack.size() > _bag_cap:
				_backpack.pop_back()
		COST_CHAIN:
			# Activate the cost of the linked chamber
			if ch.chain_to >= 0 and ch.chain_to < _chambers.size():
				var target = _chambers[ch.chain_to]
				if not target.entered:
					target.entered = true
					_activate_cost(target, ch.chain_to)  # 1 level only


func _update_collection(ch, ch_idx: int, delta: float) -> void:
	if ch.sealed:
		return
	var collect_time: float = _BONUS_COLLECT_TIME if ch_idx == _bonus_idx else _COLLECT_TIME
	if ch.collecting_idx >= 0:
		var p: Dictionary = ch.pickups[ch.collecting_idx]
		if not ch.rect.has_point(_player_pos) or _player_pos.distance_to(p["pos"]) > _COLLECT_DIST + 8.0:
			p["collecting"] = false
			p["timer"] = 0.0
			ch.collecting_idx = -1
		else:
			p["timer"] += delta
			if p["timer"] >= collect_time:
				if _backpack.size() < _bag_cap:
					_backpack.append(p["type"])
				p["collected"] = true
				p["collecting"] = false
				ch.collecting_idx = -1
				_hud.refresh(_run_timer, _backpack.size(), _bag_cap, _squad_hp, _hub_enemies.size())
	else:
		if _backpack.size() < _bag_cap:
			for i in ch.pickups.size():
				var p: Dictionary = ch.pickups[i]
				if p["collected"] or p["collecting"]:
					continue
				if _player_pos.distance_to(p["pos"]) < _COLLECT_DIST:
					p["collecting"] = true
					p["timer"] = 0.0
					ch.collecting_idx = i
					break


func _end_run(victory: bool) -> void:
	if _run_ended:
		return
	_run_ended = true
	_victory = victory
	if victory:
		HubState.deposit_backpack(_backpack)
	HubState.on_run_ended(victory)
	GameState.end_run(victory)
	queue_redraw()
	await get_tree().create_timer(2.5).timeout
	get_tree().change_scene_to_file("res://src/scenes/WorldMapScene.tscn")

# ─────────────────────── Input ────────────────────────────────────────────────
func _unhandled_input(event: InputEvent) -> void:
	if _run_ended:
		return
	if event is InputEventMouseButton:
		var mb := event as InputEventMouseButton
		if mb.button_index == MOUSE_BUTTON_LEFT:
			if mb.pressed:
				_drag_target = event.position
				_dragging = true
			else:
				_dragging = false
	elif event is InputEventMouseMotion and _dragging:
		_drag_target = event.position
	elif event is InputEventScreenTouch:
		if event.pressed:
			_drag_target = event.position
			_dragging = true
		else:
			_dragging = false
	elif event is InputEventScreenDrag:
		_drag_target = event.position


func _physics_process(delta: float) -> void:
	if not _dragging or _run_ended:
		return
	if GameState.current_state != GameState.RunState.PLAYING:
		return
	var dir := _drag_target - _player_pos
	if dir.length() < 4.0:
		return
	_player_pos += dir.normalized() * _PLAYER_SPEED * delta
	# Clamp to screen bounds
	_player_pos.x = clampf(_player_pos.x, 0.0, 480.0)
	_player_pos.y = clampf(_player_pos.y, 48.0, 854.0)
	queue_redraw()

# ─────────────────────── New dynamic mechanics ────────────────────────────────
func _rotate_bonus() -> void:
	var candidates: Array[int] = []
	for i in _chambers.size():
		var ch = _chambers[i]
		if ch.sealed:
			continue
		for p: Dictionary in ch.pickups:
			if not p["collected"]:
				candidates.append(i)
				break
	if candidates.is_empty():
		_bonus_idx = -1
		return
	_bonus_idx = candidates[randi() % candidates.size()]


func _spawn_hub_enemies() -> void:
	var count := mini(2, 4 - _hub_enemies.size())
	for i in count:
		var angle := TAU * float(i) / float(count) + _pulse
		var spawn_pos := _HUB_CENTER + Vector2(cos(angle), sin(angle)) * (_CHAMBER_RADIUS * 0.55)
		_hub_enemies.append({"pos": spawn_pos, "hp": _HUB_ENEMY_HP})

# ─────────────────────── Drawing ──────────────────────────────────────────────
func _draw() -> void:
	_draw_bg()
	_draw_corridors()
	_draw_hub()
	_draw_hub_enemies()
	_draw_chambers()
	_draw_player()
	if _run_ended:
		_draw_end_overlay()


func _draw_bg() -> void:
	draw_rect(Rect2(Vector2.ZERO, Vector2(480.0, 854.0)), Color(0.04, 0.02, 0.03))


func _draw_corridors() -> void:
	for ch in _chambers:
		draw_line(_HUB_CENTER, ch.center,
			Color(0.07, 0.05, 0.09), _CORRIDOR_W)


func _draw_hub() -> void:
	draw_rect(_HUB_RECT, Color(0.09, 0.07, 0.13))
	draw_rect(_HUB_RECT, Color(0.45, 0.25, 0.40, 0.80), false, 1.5)
	# EXIT box
	draw_rect(_EXIT_RECT, Color(0.10, 0.35, 0.12))
	draw_rect(_EXIT_RECT, Color(0.25, 0.90, 0.30, 0.90), false, 2.0)
	draw_string(ThemeDB.fallback_font, _EXIT_RECT.get_center() + Vector2(0.0, 6.0),
		"EXIT", HORIZONTAL_ALIGNMENT_CENTER, -1, 14, Color(0.30, 1.00, 0.30))
	draw_string(ThemeDB.fallback_font, _HUB_CENTER + Vector2(0.0, -55.0),
		"HUB", HORIZONTAL_ALIGNMENT_CENTER, -1, 11, Color(0.70, 0.60, 0.80, 0.70))


func _draw_hub_enemies() -> void:
	for e: Dictionary in _hub_enemies:
		var ep: Vector2 = e["pos"]
		var p := 0.55 + 0.45 * sin(_pulse * 7.0)
		draw_circle(ep, 9.0, Color(0.95, 0.18, 0.12, p))
		draw_arc(ep, 11.0, 0.0, TAU, 8, Color(1.0, 0.35, 0.20, 0.65 * p), 1.5)
	# Draw each invader's chase line toward player for readability
	if _hub_enemies.size() > 0:
		var wp := 0.6 + 0.4 * sin(_pulse * 8.0)
		for e: Dictionary in _hub_enemies:
			var ep: Vector2 = e["pos"]
			if ep.distance_to(_player_pos) < _HUB_ENEMY_DAMAGE_DIST:
				draw_circle(ep, 13.0, Color(1.0, 0.18, 0.08, 0.35 * wp))
		draw_string(ThemeDB.fallback_font, Vector2(240.0, 80.0),
			"INVASORES x%d" % _hub_enemies.size(), HORIZONTAL_ALIGNMENT_CENTER, -1, 13,
			Color(1.0, 0.25, 0.25, wp))


func _draw_chambers() -> void:
	for i in _chambers.size():
		var ch = _chambers[i]
		var is_current := (i == _current_chamber_idx)
		# Floor
		var floor_c := Color(0.12, 0.08, 0.10) if not is_current else Color(0.15, 0.10, 0.14)
		draw_rect(ch.rect, floor_c)

		# Bonus chamber golden glow
		if i == _bonus_idx and not ch.sealed:
			var bp := 0.55 + 0.45 * sin(_pulse * 4.5)
			draw_rect(ch.rect, Color(1.0, 0.85, 0.10, 0.18 * bp))
			draw_rect(ch.rect, Color(1.0, 0.85, 0.10, 0.80 * bp), false, 3.0)
			draw_string(ThemeDB.fallback_font,
				ch.center + Vector2(0.0, -42.0),
				"RAPIDO!", HORIZONTAL_ALIGNMENT_CENTER, -1, 10,
				Color(1.0, 0.90, 0.10, bp))

		# Border (cost color)
		var cost_c: Color = ch.cost_color()
		draw_rect(ch.rect, Color(cost_c.r, cost_c.g, cost_c.b, 0.80), false, 2.0)

		# Seal timer arc — red ring draining as time runs out
		if ch.entered and not ch.sealed and ch.seal_timer >= 0.0:
			var seal_ratio: float = ch.seal_timer / _SEAL_TIME
			var urgent := seal_ratio > 0.65
			var sp := 1.0 if not urgent else (0.5 + 0.5 * sin(_pulse * 8.0))
			draw_arc(ch.center, _CHAMBER_W * 0.5 + 9.0,
				-PI * 0.5, -PI * 0.5 + TAU * (1.0 - seal_ratio),
				40, Color(1.0, 0.30, 0.08, 0.85 * sp), 4.5)
			draw_string(ThemeDB.fallback_font,
				ch.center + Vector2(0.0, -42.0),
				"%.0fs" % (_SEAL_TIME - ch.seal_timer),
				HORIZONTAL_ALIGNMENT_CENTER, -1, 11,
				Color(1.0, 0.45, 0.10, sp))
		elif ch.sealed:
			draw_rect(ch.rect, Color(0.0, 0.0, 0.0, 0.55))
			draw_string(ThemeDB.fallback_font,
				ch.center + Vector2(0.0, 6.0),
				"SELADA", HORIZONTAL_ALIGNMENT_CENTER, -1, 13,
				Color(0.55, 0.22, 0.22, 0.90))

		# Chamber resources label (top)
		var res_text: String = ch.resource_label()
		draw_string(ThemeDB.fallback_font,
			ch.center + Vector2(0.0, -28.0),
			res_text, HORIZONTAL_ALIGNMENT_CENTER, -1, 10, Color(0.95, 0.90, 0.80, 0.90))

		# Cost label (bottom, cost color)
		var cost_text: String = ch.cost_label()
		draw_string(ThemeDB.fallback_font,
			ch.center + Vector2(0.0, 35.0),
			cost_text, HORIZONTAL_ALIGNMENT_CENTER, -1, 11,
			Color(cost_c.r, cost_c.g, cost_c.b, 0.95))

		# Chain indicator (arrow to target)
		if ch.cost == COST_CHAIN and ch.chain_to >= 0:
			var target = _chambers[ch.chain_to]
			var dir: Vector2 = (target.center - ch.center).normalized() * 0.4
			draw_line(ch.center, ch.center + dir * 30.0,
				Color(0.90, 0.50, 0.10, 0.50), 2.0)

		# Entered indicator (dim overlay)
		if ch.entered:
			draw_rect(ch.rect, Color(0.0, 0.0, 0.0, 0.30))

		# Enemy indicators
		if ch.enemies_alive():
			var n: int = ch.enemy_count()
			for e in n:
				var ex: float = ch.rect.position.x + 20.0 + e * 22.0
				var ey: float = ch.center.y
				draw_circle(Vector2(ex, ey), 8.0, Color(0.90, 0.20, 0.20, 0.85))

		# Pickup spots
		for p: Dictionary in ch.pickups:
			if p["collected"]:
				continue
			var pcol: Color = Color(0.75, 0.55, 0.20) if p["type"] == "scrap" else Color(0.40, 0.65, 1.00)
			var alpha: float = 0.5 if p["collecting"] else 1.0
			draw_circle(p["pos"], _PICKUP_R, Color(pcol.r, pcol.g, pcol.b, alpha))
			if p["collecting"]:
				var prog := clampf(p["timer"] / _COLLECT_TIME, 0.0, 1.0)
				draw_arc(p["pos"], _PICKUP_R + 5.0,
					-PI * 0.5, -PI * 0.5 + TAU * prog,
					24, Color(1.0, 1.0, 0.5, 0.90), 2.5)


func _draw_player() -> void:
	var c: Color
	if _damage_flash > 0.5:
		c = Color(1.0, 0.25, 0.25)
	else:
		c = Color(0.40, 0.70, 1.00)
	draw_circle(_player_pos, _PLAYER_R, c)
	draw_arc(_player_pos, _PLAYER_R + 2.0, 0.0, TAU, 12,
		Color(c.r, c.g, c.b, 0.45), 1.5)
	# Squad dots (smaller, trailing)
	for i in mini(_squad_size - 1, 3):
		var offset := Vector2(cos(float(i) * TAU / 3.0 + 0.5), sin(float(i) * TAU / 3.0 + 0.5)) * 20.0
		draw_circle(_player_pos + offset, 7.0, Color(0.50, 0.80, 1.00, 0.65))


func _draw_end_overlay() -> void:
	draw_rect(Rect2(Vector2.ZERO, Vector2(480.0, 854.0)), Color(0.0, 0.0, 0.0, 0.70))
	var msg := "VITÓRIA!" if _victory else "FALHOU"
	var col := Color(0.30, 1.00, 0.30) if _victory else Color(1.00, 0.30, 0.30)
	draw_string(ThemeDB.fallback_font, Vector2(240.0, 390.0), msg,
		HORIZONTAL_ALIGNMENT_CENTER, -1, 36, col)
	if _victory:
		var tot := _backpack.size()
		draw_string(ThemeDB.fallback_font, Vector2(240.0, 440.0),
			"Recursos: %d" % tot,
			HORIZONTAL_ALIGNMENT_CENTER, -1, 22, Color(0.95, 0.75, 0.30))
