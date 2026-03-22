## RocketDrawer — Draws the rocket visual based on how many pieces are built.
## Add as child of a Node2D positioned where the rocket center should be.
class_name RocketDrawer
extends Node2D

var pieces_built: int = 0

# Rocket segment colors
const COLOR_METAL := Color(0.55, 0.55, 0.65)
const COLOR_ACCENT := Color(0.85, 0.55, 0.2)
const COLOR_GLASS := Color(0.4, 0.75, 1.0, 0.7)
const COLOR_ENGINE := Color(1.0, 0.6, 0.15)
const COLOR_DARK := Color(0.2, 0.2, 0.25)


func _draw() -> void:
	if pieces_built == 0:
		_draw_base_only()
		return
	_draw_rocket(pieces_built)


func _draw_base_only() -> void:
	# Just a rough pile of scrap — not a rocket yet
	draw_rect(Rect2(-18, 10, 36, 20), Color(0.3, 0.3, 0.35))
	draw_rect(Rect2(-12, -4, 24, 16), Color(0.28, 0.28, 0.32))
	draw_string(ThemeDB.fallback_font, Vector2(-22, 44), "em construcao...",
		HORIZONTAL_ALIGNMENT_LEFT, -1, 10, Color(0.4, 0.4, 0.4))


func _draw_rocket(p: int) -> void:
	# All segment positions relative to center (0,0)
	# Rocket drawn bottom-up

	# Piece 1 — Base Estrutural (base legs)
	if p >= 1:
		draw_rect(Rect2(-28, 28, 8, 18), COLOR_METAL)   # left leg
		draw_rect(Rect2(20, 28, 8, 18), COLOR_METAL)    # right leg
		draw_rect(Rect2(-20, 30, 40, 12), COLOR_DARK)   # base plate

	# Piece 2 — Casco Externo (main body lower)
	if p >= 2:
		draw_rect(Rect2(-14, -10, 28, 42), COLOR_METAL)
		draw_rect(Rect2(-12, -8, 24, 38), COLOR_DARK)   # interior shadow

	# Piece 3 — Suporte Interno (body reinforcement bands)
	if p >= 3:
		draw_rect(Rect2(-15, 8, 30, 4), COLOR_ACCENT)
		draw_rect(Rect2(-15, 18, 30, 4), COLOR_ACCENT)

	# Piece 4 — Sistema Elétrico (panel details)
	if p >= 4:
		draw_rect(Rect2(-10, -6, 8, 12), Color(0.2, 0.35, 0.6))
		draw_rect(Rect2(2, -6, 8, 12), Color(0.2, 0.35, 0.6))
		draw_rect(Rect2(-10, 10, 20, 3), Color(0.3, 0.8, 0.3, 0.6))

	# Piece 5 — Painel de Controle (upper body + window)
	if p >= 5:
		draw_rect(Rect2(-12, -38, 24, 30), COLOR_METAL)
		draw_rect(Rect2(-8, -34, 16, 16), COLOR_GLASS)  # cockpit glass
		draw_rect(Rect2(-10, -36, 20, 28), Color(0.0, 0.0, 0.0, 0.0))

	# Piece 6 — Motor Principal (engine nozzles)
	if p >= 6:
		draw_rect(Rect2(-18, 40, 12, 10), COLOR_ENGINE)
		draw_rect(Rect2(6, 40, 12, 10), COLOR_ENGINE)
		# Engine glow
		draw_circle(Vector2(-12, 52), 6, Color(1.0, 0.5, 0.1, 0.5))
		draw_circle(Vector2(12, 52), 6, Color(1.0, 0.5, 0.1, 0.5))

	# Piece 7 — Sistema de Navegação (nose cone + antenna)
	if p >= 7:
		# Nose cone (triangle approximated with polygon)
		var cone := PackedVector2Array([
			Vector2(0, -70),
			Vector2(-12, -38),
			Vector2(12, -38),
		])
		draw_colored_polygon(cone, COLOR_METAL)
		draw_polyline(cone, COLOR_ACCENT, 1.5)
		# Antenna
		draw_line(Vector2(0, -70), Vector2(0, -80), COLOR_ACCENT, 1.5)
		draw_circle(Vector2(0, -82), 3, COLOR_ACCENT)

	# Piece 8 — Blindagem Final (full armor sheen overlay)
	if p >= 8:
		# Side fins
		var fin_l := PackedVector2Array([
			Vector2(-14, 10), Vector2(-28, 36), Vector2(-14, 32),
		])
		var fin_r := PackedVector2Array([
			Vector2(14, 10), Vector2(28, 36), Vector2(14, 32),
		])
		draw_colored_polygon(fin_l, COLOR_ACCENT)
		draw_colored_polygon(fin_r, COLOR_ACCENT)
		# Armor highlight
		draw_line(Vector2(-14, -38), Vector2(-14, 30), Color(0.8, 0.8, 0.9, 0.3), 2.0)

	# Piece count label
	draw_string(
		ThemeDB.fallback_font,
		Vector2(-20, 72),
		"%d/8 pecas" % p,
		HORIZONTAL_ALIGNMENT_LEFT, -1, 10,
		Color(0.6, 0.6, 0.6),
	)
