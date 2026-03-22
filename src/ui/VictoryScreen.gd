## VictoryScreen — Shown when the boss is defeated.
class_name VictoryScreen
extends CanvasLayer

signal hub_requested()
signal quit_requested()

var _time_label: Label
var _frag_label: Label


func _ready() -> void:
	visible = false
	var panel := Panel.new()
	panel.size = Vector2(320, 220)
	panel.position = Vector2(
		GameConfig.VIEWPORT_WIDTH * 0.5 - 160,
		GameConfig.VIEWPORT_HEIGHT * 0.5 - 110
	)
	add_child(panel)

	var vbox := VBoxContainer.new()
	vbox.position = Vector2(20, 20)
	vbox.size = Vector2(280, 180)
	panel.add_child(vbox)

	var title := Label.new()
	title.text = "VICTORY!"
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title.add_theme_font_size_override("font_size", 28)
	title.modulate = Color(0.9, 0.9, 0.1)
	vbox.add_child(title)

	_time_label = Label.new()
	_time_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	vbox.add_child(_time_label)

	_frag_label = Label.new()
	_frag_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_frag_label.modulate = Color(0.4, 0.8, 1.0)
	vbox.add_child(_frag_label)

	var restart_btn := Button.new()
	restart_btn.text = "Voltar a Base"
	restart_btn.pressed.connect(func(): hub_requested.emit())
	vbox.add_child(restart_btn)

	var quit_btn := Button.new()
	quit_btn.text = "Quit"
	quit_btn.pressed.connect(func(): quit_requested.emit())
	vbox.add_child(quit_btn)


func show_screen(run_time: float, fragments: int) -> void:
	visible = true
	var t := int(run_time)
	_time_label.text = "Run time: %02d:%02d" % [t / 60, t % 60]
	_frag_label.text = "Tech Fragments: +%d" % fragments
