## AudioManager — Centralized audio singleton. Persists across scene changes.
## Provides music crossfade and SFX pooling.
extends Node

# ── Music registry ────────────────────────────────────────────────────────────
const MUSIC: Dictionary = {
	"menu":      "res://assets/audio/music/menu.wav",
	"battle":    "res://assets/audio/music/battle.wav",
	"loading":   "res://assets/audio/music/loading.wav",
	"night_1":   "res://assets/audio/music/zones/night_theme_1.wav",
	"night_2":   "res://assets/audio/music/zones/night_theme_2.wav",
	"dungeon_1": "res://assets/audio/music/zones/dungeon_theme_1.wav",
	"dungeon_2": "res://assets/audio/music/zones/dungeon_theme_2.wav",
	"field_1":   "res://assets/audio/music/zones/field_theme_1.wav",
	"field_2":   "res://assets/audio/music/zones/field_theme_2.wav",
}

# ── Scene-to-music mapping (key → [music_key, volume_db]) ────────────────────
const SCENE_MUSIC: Dictionary = {
	"hub":        ["menu",      -8.0],
	"world_map":  ["menu",      -10.0],
	"hordas":     ["battle",    -4.0],
	"stealth":    ["night_1",   -14.0],
	"circuito":   ["dungeon_1", -10.0],
	"extracao":   ["field_1",   -4.0],
	"campo":      ["field_2",   -8.0],
	"infeccao":   ["night_2",   -10.0],
	"labirinto":  ["dungeon_2", -8.0],
	"sacrificio": ["loading",   -12.0],
}

# ── SFX registry ──────────────────────────────────────────────────────────────
const SFX: Dictionary = {
	"click":    "res://assets/audio/sfx/ui/Click_01.wav",
	"click_2":  "res://assets/audio/sfx/ui/Click_02.wav",
	"confirm":  "res://assets/audio/sfx/ui/Confirm_01.wav",
	"bleep":    "res://assets/audio/sfx/ui/Bleep_01.wav",
	"denied":   "res://assets/audio/sfx/ui/Denied_01.wav",
	"complete": "res://assets/audio/sfx/ui/Complete_01.wav",
	"execute":  "res://assets/audio/sfx/ui/Execute_01.wav",
}

# ── Volume ────────────────────────────────────────────────────────────────────
var music_volume_db: float = -8.0
var sfx_volume_db: float = 0.0

# ── Internal ──────────────────────────────────────────────────────────────────
const CROSSFADE_TIME: float = 0.5

var _music_a: AudioStreamPlayer
var _music_b: AudioStreamPlayer
var _active_player: AudioStreamPlayer
var _current_key: String = ""
var _tween: Tween

var _sfx_pool: Array[AudioStreamPlayer] = []
var _sfx_index: int = 0
const SFX_POOL_SIZE: int = 4


func _ready() -> void:
	_music_a = AudioStreamPlayer.new()
	_music_a.name = "MusicA"
	add_child(_music_a)

	_music_b = AudioStreamPlayer.new()
	_music_b.name = "MusicB"
	add_child(_music_b)

	_active_player = _music_a

	for i in SFX_POOL_SIZE:
		var player := AudioStreamPlayer.new()
		player.name = "SFX_%d" % i
		add_child(player)
		_sfx_pool.append(player)


## Play music for a scene key (e.g. "hordas", "stealth"). Uses SCENE_MUSIC
## mapping to resolve track and volume. Crossfades from current track.
func play_music_for_scene(scene_key: String) -> void:
	if scene_key not in SCENE_MUSIC:
		push_warning("AudioManager: unknown scene key '%s'" % scene_key)
		return
	var cfg: Array = SCENE_MUSIC[scene_key]
	var music_key: String = cfg[0]
	var volume: float = cfg[1]
	music_volume_db = volume
	play_music(music_key)


## Play a music track by registry key. Crossfades if a different track is playing.
func play_music(key: String) -> void:
	if key == _current_key:
		return
	if key not in MUSIC:
		push_warning("AudioManager: unknown music key '%s'" % key)
		return

	var stream: AudioStream = load(MUSIC[key])
	if stream == null:
		push_warning("AudioManager: failed to load '%s'" % MUSIC[key])
		return

	_current_key = key
	var next_player := _music_b if _active_player == _music_a else _music_a
	next_player.stream = stream
	next_player.volume_db = -80.0
	next_player.play()

	# Loop: reconnect finished signal
	if next_player.finished.is_connected(next_player.play):
		next_player.finished.disconnect(next_player.play)
	next_player.finished.connect(next_player.play)

	_crossfade(_active_player, next_player)
	_active_player = next_player


## Stop music with a fade-out.
func stop_music() -> void:
	_current_key = ""
	if _tween and _tween.is_valid():
		_tween.kill()
	_tween = create_tween()
	_tween.tween_property(_active_player, "volume_db", -80.0, CROSSFADE_TIME)
	_tween.tween_callback(_active_player.stop)


## Play a sound effect by registry key.
func play_sfx(key: String) -> void:
	if key not in SFX:
		push_warning("AudioManager: unknown sfx key '%s'" % key)
		return
	var stream: AudioStream = load(SFX[key])
	if stream == null:
		return
	var player := _sfx_pool[_sfx_index]
	_sfx_index = (_sfx_index + 1) % SFX_POOL_SIZE
	player.stream = stream
	player.volume_db = sfx_volume_db
	player.play()


func _crossfade(from: AudioStreamPlayer, to: AudioStreamPlayer) -> void:
	if _tween and _tween.is_valid():
		_tween.kill()
	_tween = create_tween().set_parallel(true)
	_tween.tween_property(from, "volume_db", -80.0, CROSSFADE_TIME)
	_tween.tween_property(to, "volume_db", music_volume_db, CROSSFADE_TIME)
	_tween.chain().tween_callback(from.stop)
