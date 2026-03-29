## BaseEnemy — Abstract base for all enemies.
## Subclasses configure stats and AI behavior.
class_name BaseEnemy
extends CharacterBody2D

# ── Stats (set by subclass) ──────────────────────────────────────────────────
@export var enemy_name: String = "Enemy"
@export var max_hp: float = 50.0
@export var move_speed: float = 100.0
@export var attack_damage: float = 10.0
@export var attack_interval: float = 1.0
@export var attack_range: float = 40.0
@export var color: Color = Color.RED
@export var is_elite: bool = false  # Bruisers and Spitters are elite-tier

# ── Runtime ──────────────────────────────────────────────────────────────────
var current_hp: float = 0.0
var is_dead: bool = false
var attack_timer: float = 0.0
var current_target: Node2D = null  # Always the party node (centroid)

var _visual: ColorRect
var _hp_bar_bg: ColorRect
var _hp_bar_fill: ColorRect

signal died(enemy)


func _ready() -> void:
	current_hp = max_hp
	add_to_group("enemies")
	_build_visuals()
	collision_layer = 4   # layer 3 — enemies
	collision_mask = 2    # layer 2 — party/characters


func _build_visuals() -> void:
	_visual = ColorRect.new()
	_visual.color = color
	_visual.size = Vector2(24, 24)
	_visual.position = Vector2(-12, -12)
	add_child(_visual)

	_hp_bar_bg = ColorRect.new()
	_hp_bar_bg.color = Color(0.2, 0.2, 0.2)
	_hp_bar_bg.size = Vector2(26, 3)
	_hp_bar_bg.position = Vector2(-13, -18)
	add_child(_hp_bar_bg)

	_hp_bar_fill = ColorRect.new()
	_hp_bar_fill.color = Color(0.9, 0.2, 0.2)
	_hp_bar_fill.size = Vector2(26, 3)
	_hp_bar_fill.position = Vector2(-13, -18)
	add_child(_hp_bar_fill)

	var col := CollisionShape2D.new()
	var shape := CircleShape2D.new()
	shape.radius = 12.0
	col.shape = shape
	add_child(col)


func _physics_process(delta: float) -> void:
	if is_dead:
		return
	_find_target()
	_move(delta)
	_tick_attack(delta)
	_update_hp_bar()


func _find_target() -> void:
	# Target nearest living party member
	var nearest: Node2D = null
	var nearest_dist := INF
	for member in GameState.party:
		if not is_instance_valid(member) or member.is_dead:
			continue
		var d: float = global_position.distance_to(member.global_position)
		if d < nearest_dist:
			nearest_dist = d
			nearest = member
	current_target = nearest


func _move(delta: float) -> void:
	if current_target == null:
		return
	var dir := (current_target.global_position - global_position).normalized()
	velocity = dir * move_speed
	move_and_slide()


func _tick_attack(delta: float) -> void:
	if current_target == null:
		return
	if global_position.distance_to(current_target.global_position) > attack_range:
		return
	attack_timer += delta
	if attack_timer >= attack_interval:
		attack_timer = 0.0
		_attack(current_target)


func _attack(target: Node2D) -> void:
	if target.has_method("take_damage"):
		target.call("take_damage", attack_damage, self)


func take_damage(amount: float, _source: Node = null) -> void:
	if is_dead:
		return
	current_hp = max(0.0, current_hp - amount)
	if current_hp <= 0.0:
		_die()


func _die() -> void:
	is_dead = true
	remove_from_group("enemies")
	died.emit(self)
	queue_free()


func _update_hp_bar() -> void:
	if _hp_bar_fill:
		_hp_bar_fill.size.x = 26.0 * (current_hp / max_hp)
