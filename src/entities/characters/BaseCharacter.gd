## BaseCharacter — Abstract base for all playable characters.
## Handles HP, auto-attack targeting, death. Subclasses configure stats.
class_name BaseCharacter
extends CharacterBody2D

# ── Stats (set by subclass) ──────────────────────────────────────────────────
@export var character_name: String = "Unknown"
@export var max_hp: float = 100.0
@export var attack_damage: float = 10.0
@export var attack_range: float = 80.0
@export var attack_speed: float = 1.0  # attacks per second
@export var color: Color = Color.WHITE

# ── Runtime ──────────────────────────────────────────────────────────────────
var current_hp: float = 0.0
var is_dead: bool = false
var attack_timer: float = 0.0
var current_target: Node2D = null

# ── Sprite path (set by subclass to load SVG art) ────────────────────────
## Path to the SVG sprite, relative to res://
## Leave empty to fall back to the coloured ColorRect placeholder.
@export var sprite_path: String = ""

# ── Nodes (created in _ready if not in scene) ─────────────────────────────
var _range_area: Area2D
var _visual: Node          # Sprite2D when SVG loaded, ColorRect as fallback
var _hp_bar_bg: ColorRect
var _hp_bar_fill: ColorRect
var _enemies_in_range: Array = []

signal died(character)
signal hp_changed(character, new_hp: float, max_hp: float)
signal attacked(target, damage: float)


func _ready() -> void:
	current_hp = max_hp
	collision_layer = 2  # Layer 2 — detected by enemies (mask = 2)
	collision_mask = 4   # Layer 3 — detect enemies (layer = 4)
	_build_visuals()
	_build_range_area()


func _build_visuals() -> void:
	# Try to load SVG sprite — fall back to ColorRect placeholder if not found
	if sprite_path != "":
		var tex := load(sprite_path) as Texture2D
		if tex:
			var sprite := Sprite2D.new()
			sprite.texture = tex
			# Scale so the sprite occupies roughly the same footprint as the old 28×28 rect
			var tex_size := tex.get_size()
			var scale_factor: float = 28.0 / max(tex_size.x, tex_size.y)
			sprite.scale = Vector2(scale_factor, scale_factor)
			sprite.position = Vector2.ZERO
			_visual = sprite
			add_child(_visual)
		else:
			push_warning("BaseCharacter: could not load sprite '%s', using placeholder." % sprite_path)
			_build_placeholder_rect()
	else:
		_build_placeholder_rect()

	# HP bar background
	_hp_bar_bg = ColorRect.new()
	_hp_bar_bg.color = Color(0.2, 0.2, 0.2)
	_hp_bar_bg.size = Vector2(30, 4)
	_hp_bar_bg.position = Vector2(-15, -22)
	add_child(_hp_bar_bg)

	# HP bar fill
	_hp_bar_fill = ColorRect.new()
	_hp_bar_fill.color = Color(0.2, 0.9, 0.3)
	_hp_bar_fill.size = Vector2(30, 4)
	_hp_bar_fill.position = Vector2(-15, -22)
	add_child(_hp_bar_fill)

	# Collision shape
	var col := CollisionShape2D.new()
	var shape := CircleShape2D.new()
	shape.radius = 14.0
	col.shape = shape
	add_child(col)


func _build_placeholder_rect() -> void:
	_visual = ColorRect.new()
	(_visual as ColorRect).color = color
	(_visual as ColorRect).size = Vector2(28, 28)
	_visual.position = Vector2(-14, -14)
	add_child(_visual)


func _build_range_area() -> void:
	_range_area = Area2D.new()
	_range_area.collision_layer = 0
	_range_area.collision_mask = 4  # layer 3 = enemies
	var col := CollisionShape2D.new()
	var shape := CircleShape2D.new()
	shape.radius = attack_range
	col.shape = shape
	_range_area.add_child(col)
	add_child(_range_area)
	_range_area.body_entered.connect(_on_enemy_entered)
	_range_area.body_exited.connect(_on_enemy_exited)


func _physics_process(delta: float) -> void:
	if is_dead:
		return
	_tick_attack(delta)
	_update_hp_bar()


func _tick_attack(delta: float) -> void:
	attack_timer += delta
	var effective_speed := attack_speed * GameState.power_attack_speed_multiplier
	if attack_timer >= (1.0 / effective_speed):
		attack_timer = 0.0
		_try_attack()


func _try_attack() -> void:
	# Clean dead targets
	var alive: Array = []
	for e in _enemies_in_range:
		if is_instance_valid(e) and not e.is_dead:
			alive.append(e)
	_enemies_in_range = alive

	if _enemies_in_range.is_empty():
		current_target = null
		return

	# Pick nearest
	var nearest = null
	var nearest_dist := INF
	for e in _enemies_in_range:
		var d: float = global_position.distance_to(e.global_position)
		if d < nearest_dist:
			nearest_dist = d
			nearest = e
	current_target = nearest

	if current_target:
		var effective_damage := attack_damage * GameState.power_damage_multiplier
		current_target.call("take_damage", effective_damage, self)
		attacked.emit(current_target, effective_damage)


## Virtual — override in subclasses to reduce incoming damage.
func apply_damage_reduction(amount: float) -> float:
	return amount


func take_damage(amount: float, _source: Node = null) -> void:
	if is_dead:
		return
	var effective := amount * GameState.power_damage_taken_multiplier
	effective = apply_damage_reduction(effective)
	# Reflective Shell
	if GameState.active_power and GameState.active_power.has_method("on_damage_received"):
		GameState.active_power.on_damage_received(effective, _source)
	current_hp = max(0.0, current_hp - effective)
	hp_changed.emit(self, current_hp, max_hp)
	GameState.damage_dealt.emit(self, effective, global_position)
	if current_hp <= 0.0:
		_die()


func heal(amount: float) -> void:
	if is_dead:
		return
	current_hp = min(max_hp, current_hp + amount)
	hp_changed.emit(self, current_hp, max_hp)


func _die() -> void:
	print("[BaseCharacter] %s died" % character_name)
	is_dead = true
	visible = false
	died.emit(self)
	GameState.register_character_death(self)


func _update_hp_bar() -> void:
	if _hp_bar_fill:
		_hp_bar_fill.size.x = 30.0 * (current_hp / max_hp)


func _on_enemy_entered(body: Node2D) -> void:
	if body.has_method("take_damage") and not body in _enemies_in_range:
		_enemies_in_range.append(body)


func _on_enemy_exited(body: Node2D) -> void:
	_enemies_in_range.erase(body)
