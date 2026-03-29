## zones.gd — Zone data constants for WorldMapScene.
## ZONES is an Array indexed by zone_id (0–7).
## Each entry contains zone_name, accent_color, scene_path, resource, subtitle,
## and room_subtitle (physical room label displayed inside ZoneRoom).
## ROCKET_BAY covers the rocket bay slot (FLOOR_LAYOUT zone_id == -1).
class_name Zones

const ZONES: Array = [
	{  # id 0
		zone_name     = "HORDAS",
		accent_color  = Color(0.800, 0.133, 0.000),  # #CC2200
		scene_path    = "res://src/scenes/Main.tscn",
		resource      = "Sucata Metalica",
		subtitle      = "Zona de combate",
		room_subtitle = "Sala de Combate",
	},
	{  # id 1
		zone_name     = "STEALTH",
		accent_color  = Color(0.000, 0.667, 0.267),  # #00AA44
		scene_path    = "res://src/scenes/StealthMain.tscn",
		resource      = "Comp. de IA",
		subtitle      = "Zona de infiltracao",
		room_subtitle = "Sala de Infiltração",
	},
	{  # id 2
		zone_name     = "CIRCUITO",
		accent_color  = Color(0.000, 0.808, 0.820),  # #00CED1
		scene_path    = "res://src/scenes/CircuitMain.tscn",
		resource      = "Nucleo Logico",
		subtitle      = "Zona de puzzle",
		room_subtitle = "Sala de Puzzles",
	},
	{  # id 3
		zone_name     = "EXTRAÇÃO",
		accent_color  = Color(0.800, 0.400, 0.000),  # #CC6600
		scene_path    = "res://src/scenes/ExtractionMain.tscn",
		resource      = "Combustivel Volatil",
		subtitle      = "Zona de velocidade",
		room_subtitle = "Sala de Suprimentos",
	},
	{  # id 4
		zone_name     = "CAMPO",
		accent_color  = Color(0.102, 0.435, 0.800),  # #1A6FCC
		scene_path    = "res://src/scenes/FieldControlMain.tscn",
		resource      = "Sinais de Controle",
		subtitle      = "Zona de controle",
		room_subtitle = "Sala de Controle",
	},
	{  # id 5
		zone_name     = "INFECÇÃO",
		accent_color  = Color(0.133, 0.545, 0.133),  # #228B22
		scene_path    = "res://src/scenes/InfectionMain.tscn",
		resource      = "Biomassa Adapt.",
		subtitle      = "Zona de propagacao",
		room_subtitle = "Laboratório Bio",
	},
	{  # id 6
		zone_name     = "LABIRINTO",
		accent_color  = Color(0.290, 0.565, 0.643),  # #4A90A4
		scene_path    = "res://src/scenes/MazeMain.tscn",
		resource      = "Frag. Estruturais",
		subtitle      = "Zona de navegacao",
		room_subtitle = "Corredor Técnico",
	},
	{  # id 7
		zone_name     = "SACRIFÍCIO",
		accent_color  = Color(0.482, 0.184, 0.745),  # #7B2FBE
		scene_path    = "res://src/scenes/SacrificeMain.tscn",
		resource      = "Sucata + Comp. IA",
		subtitle      = "Zona de decisao",
		room_subtitle = "Câmara de Detenção",
	},
]

## Rocket bay — used when FLOOR_LAYOUT zone_id == -1 (not a raid zone).
const ROCKET_BAY: Dictionary = {
	zone_name     = "BAIA DO FOGUETE",
	accent_color  = Color(0.800, 0.200, 0.000),  # #CC3300
	scene_path    = "",
	resource      = "",
	subtitle      = "",
	room_subtitle = "Baia de Lançamento",
}
