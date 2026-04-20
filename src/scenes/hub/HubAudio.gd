class_name HubAudio
extends Node

var music_player: AudioStreamPlayer
var sfx_player: AudioStreamPlayer

func _ready() -> void:
	_setup_audio()
	_play_ambient_music()


func _setup_audio() -> void:
	music_player = AudioStreamPlayer.new()
	music_player.bus = "Music"
	music_player.volume_db = -15.0
	add_child(music_player)

	sfx_player = AudioStreamPlayer.new()
	sfx_player.bus = "SFX"
	sfx_player.volume_db = -10.0
	add_child(sfx_player)


func _play_ambient_music() -> void:
	# Placeholder: música ambiente do Hub
	# Em produção: carregar HubTheme.ogg ou similar
	if music_player.playing:
		return
	# music_player.stream = load("res://assets/audio/music/hub-theme.ogg")
	# music_player.play()
	pass


func play_click_sfx() -> void:
	# Som de clique em UI
	_play_sfx_oneshot("res://assets/audio/sfx/ui-click.ogg")


func play_open_panel_sfx() -> void:
	# Som de abertura de painel (zoom in)
	_play_sfx_oneshot("res://assets/audio/sfx/panel-open.ogg")


func play_close_panel_sfx() -> void:
	# Som de fechamento de painel (zoom out)
	_play_sfx_oneshot("res://assets/audio/sfx/panel-close.ogg")


func play_npc_select_sfx() -> void:
	# Som de seleção de NPC
	_play_sfx_oneshot("res://assets/audio/sfx/npc-select.ogg")


func play_rocket_progress_sfx() -> void:
	# Som de progresso do foguete
	_play_sfx_oneshot("res://assets/audio/sfx/rocket-progress.ogg")


func _play_sfx_oneshot(path: String) -> void:
	# Placeholder: em produção, verificar se arquivo existe
	# if ResourceLoader.exists(path):
	# 	var stream = load(path)
	# 	sfx_player.stream = stream
	# 	sfx_player.play()
	pass


func set_music_volume(db: float) -> void:
	music_player.volume_db = db


func set_sfx_volume(db: float) -> void:
	sfx_player.volume_db = db
