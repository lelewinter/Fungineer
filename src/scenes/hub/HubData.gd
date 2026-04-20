class_name HubData
extends RefCounted

# NPCs — 11 sobreviventes + Doutor
const NPCS = [
	{
		"id": "doutor",
		"nome": "Doutor",
		"hint": "Dr. Paulo",
		"trust": 100,
		"color": Color(0.91, 0.89, 0.85),
		"accent": Color(0.227, 0.48, 0.72),
		"glyph": "P"
	},
	{
		"id": "marcus",
		"nome": "Marcus",
		"hint": "Engenheiro",
		"trust": 72,
		"color": Color(0.486, 0.557, 0.659),
		"accent": Color(0.659, 0.541, 0.439),
		"glyph": "M"
	},
	{
		"id": "amara",
		"nome": "Amara",
		"hint": "Médica",
		"trust": 58,
		"color": Color(0.31, 0.722, 0.447),
		"accent": Color(0.96, 0.89, 0.78),
		"glyph": "A"
	},
	{
		"id": "yuki",
		"nome": "Yuki",
		"hint": "Hacker",
		"trust": 81,
		"color": Color(0.722, 0.353, 0.851),
		"accent": Color(0.0, 1.0, 0.533),
		"glyph": "Y"
	},
	{
		"id": "elena",
		"nome": "Elena",
		"hint": "Ex-Militar",
		"trust": 64,
		"color": Color(0.561, 0.627, 0.314),
		"accent": Color(0.82, 0.29, 0.25),
		"glyph": "E"
	},
	{
		"id": "bae",
		"nome": "Bae",
		"hint": "Documentarista",
		"trust": 44,
		"color": Color(0.784, 0.659, 0.494),
		"accent": Color(0.29, 0.353, 0.549),
		"glyph": "B"
	},
	{
		"id": "priya",
		"nome": "Priya",
		"hint": "Rival",
		"trust": 36,
		"color": Color(0.784, 0.314, 0.392),
		"accent": Color(0.96, 0.89, 0.78),
		"glyph": "K"
	},
	{
		"id": "tomas",
		"nome": "Tomas",
		"hint": "Mecânico",
		"trust": 87,
		"color": Color(0.851, 0.722, 0.224),
		"accent": Color(0.239, 0.169, 0.122),
		"glyph": "T"
	},
	{
		"id": "lena",
		"nome": "Lena",
		"hint": "Criança",
		"trust": 28,
		"color": Color(0.91, 0.639, 0.722),
		"accent": Color(0.0, 1.0, 0.533),
		"glyph": "L"
	},
	{
		"id": "richard",
		"nome": "Richard",
		"hint": "Ex-Exec",
		"trust": 52,
		"color": Color(0.29, 0.416, 0.659),
		"accent": Color(0.659, 0.541, 0.439),
		"glyph": "R"
	},
	{
		"id": "viktor",
		"nome": "Viktor",
		"hint": "Cínico",
		"trust": 40,
		"color": Color(0.549, 0.416, 0.243),
		"accent": Color(0.91, 0.58, 0.23),
		"glyph": "V"
	},
]

# Salas em grid 6 colunas
const ROOMS = [
	# Floor 1 — Superfície (rocha poluída)
	{
		"id": "surface",
		"label": "SUPERFÍCIE",
		"col": 0,
		"w": 6,
		"h": 150,
		"type": "surface",
		"light": "dim",
		"npcs": []
	},
	# Floor 1 — Saída com enxame
	{
		"id": "saida_hordas",
		"label": "SAÍDA · HORDAS",
		"col": 0,
		"w": 6,
		"h": 200,
		"type": "surface-exit",
		"light": "red",
		"zone_id": "hordas",
		"npcs": []
	},
	# Floor 2 — Vigia
	{
		"id": "vigia",
		"label": "VIGIA",
		"col": 0,
		"w": 2,
		"h": 150,
		"type": "tech",
		"light": "red",
		"silhouette": "posto de vigia",
		"npcs": ["elena"]
	},
	# Floor 2 — Armamentos
	{
		"id": "armamentos",
		"label": "ARMAMENTOS",
		"col": 2,
		"w": 2,
		"h": 150,
		"type": "storage",
		"light": "amber",
		"silhouette": "depósito de armas",
		"npcs": []
	},
	# Floor 2 — Mycelium Lab (ex-enfermaria)
	{
		"id": "enfermaria",
		"label": "MYCELIUM LAB",
		"col": 4,
		"w": 2,
		"h": 150,
		"type": "mycelium-lab",
		"light": "hospital",
		"zone_id": "infeccao",
		"silhouette": "laboratorio de bioformas",
		"npcs": ["amara"]
	},
	# Floor 3 — Câmara de Esporos (ex-lab da Priya, Day-1)
	{
		"id": "lab",
		"label": "CÂMARA DE ESPOROS",
		"col": 0,
		"w": 2,
		"h": 150,
		"type": "spore-chamber",
		"light": "cool",
		"zone_id": "sacrificio",
		"silhouette": "camara de esporos",
		"npcs": ["priya"]
	},
	# Floor 3 — Sala Comum
	{
		"id": "sala_comum",
		"label": "SALA COMUM",
		"col": 2,
		"w": 2,
		"h": 150,
		"type": "common",
		"light": "amber",
		"silhouette": "sala de convivência",
		"npcs": ["richard"]
	},
	# Floor 3 — Fungus Kitchen
	{
		"id": "cozinha",
		"label": "FUNGUS KITCHEN",
		"col": 4,
		"w": 2,
		"h": 150,
		"type": "fungus-kitchen",
		"light": "warm",
		"silhouette": "cozinha de fungos",
		"npcs": ["tomas"]
	},
	# Floor 4 — Hyphae Forge (ex-workshop)
	{
		"id": "workshop",
		"label": "HYPHAE FORGE",
		"col": 0,
		"w": 2,
		"h": 150,
		"type": "hyphae-forge",
		"light": "amber",
		"silhouette": "forja de hifas",
		"npcs": []
	},
	# Floor 4 — Arquivo (câmera)
	{
		"id": "arquivo",
		"label": "ARQUIVO",
		"col": 2,
		"w": 2,
		"h": 150,
		"type": "archive",
		"light": "office",
		"zone_id": "extracao",
		"silhouette": "arquivo vivo",
		"npcs": ["bae"]
	},
	# Floor 4 — Neural Mushroom (ex-server)
	{
		"id": "server",
		"label": "NEURAL MUSHROOM",
		"col": 4,
		"w": 2,
		"h": 150,
		"type": "neural-mushroom",
		"light": "neon-green",
		"zone_id": "circuito",
		"silhouette": "rede neural micótica",
		"npcs": ["yuki"]
	},
	# Floor 5 — Gestão
	{
		"id": "gestao",
		"label": "GESTÃO",
		"col": 0,
		"w": 2,
		"h": 150,
		"type": "office",
		"light": "office",
		"silhouette": "sala de gestão",
		"npcs": []
	},
	# Floor 5 — Quarto da Lena
	{
		"id": "quarto_lena",
		"label": "QUARTO",
		"col": 2,
		"w": 2,
		"h": 150,
		"type": "bedroom",
		"light": "pink-dim",
		"silhouette": "quarto",
		"npcs": ["lena"]
	},
	# Floor 5 — Corredor
	{
		"id": "corredor",
		"label": "CORREDOR",
		"col": 4,
		"w": 2,
		"h": 150,
		"type": "transit",
		"light": "dim",
		"silhouette": "corredor",
		"npcs": []
	},
	# Floor 6 — Túnel Stealth
	{
		"id": "tunel_stealth",
		"label": "TÚNEL STEALTH",
		"col": 0,
		"w": 3,
		"h": 150,
		"type": "tunnel-cool",
		"light": "neon-green",
		"zone_id": "stealth",
		"silhouette": "túnel stealth",
		"npcs": []
	},
	# Floor 6 — Túnel Hordas
	{
		"id": "tunel_hordas",
		"label": "TÚNEL HORDAS",
		"col": 3,
		"w": 3,
		"h": 150,
		"type": "tunnel-warm",
		"light": "amber-hot",
		"silhouette": "túnel das hordas",
		"npcs": []
	},
]

# Map sala → zona
const ROOM_TO_ZONE = {
	"saida_hordas": "hordas",
	"tunel_hordas": "hordas",
	"tunel_stealth": "stealth",
	"enfermaria": "infeccao",
	"server": "circuito",
	"arquivo": "extracao",
	"lab": "sacrificio",
}

# Zonas (portais para runs)
const ZONES = [
	{
		"id": "hordas",
		"name": "Zona Hordas",
		"color": Color(0.91, 0.58, 0.23),
		"briefing": "Enxame contínuo de fungos. Fraco singular, forte em banda.",
		"allow_squad": true
	},
	{
		"id": "stealth",
		"name": "Zona Stealth",
		"color": Color(0.0, 1.0, 0.533),
		"briefing": "Infiltração em território inimigo. Silêncio é ouro.",
		"allow_squad": false
	},
	{
		"id": "infeccao",
		"name": "Zona Infecção",
		"color": Color(0.565, 0.878, 0.722),
		"briefing": "Bioformas contaminadas. Risco de inoculação.",
		"allow_squad": false
	},
	{
		"id": "circuito",
		"name": "Zona Circuito",
		"color": Color(0.0, 1.0, 0.533),
		"briefing": "Redes digitais. Yuki coordena.",
		"allow_squad": false
	},
	{
		"id": "extracao",
		"name": "Zona Extração",
		"color": Color(0.29, 0.353, 0.549),
		"briefing": "Arqueologia urbana. Dados antigos.",
		"allow_squad": false
	},
	{
		"id": "sacrificio",
		"name": "Zona Sacrifício",
		"color": Color(0.784, 0.314, 0.392),
		"briefing": "Lab rival. Experimental e perigoso.",
		"allow_squad": false
	},
]

# Diálogos por NPC
const DIALOGS = {
	"doutor": {
		"briefing": "Liderança inquestionável. Coordena todas as operações.",
		"mission": "Qualquer zona para a qual você esteja pronto.",
		"quote": "Precisamos de recursos. Você saberá para onde ir."
	},
	"marcus": {
		"briefing": "Engenheiro. Especialista em estrutura.",
		"mission": "Hordas (coleta de sucata estrutural)",
		"quote": "Mais sucata para a base. Sempre há algo para consertar."
	},
	"amara": {
		"briefing": "Médica dedicada. Conhecimento biomédico avançado.",
		"mission": "Infecção (análise de bioformas)",
		"quote": "A doença evolui. Precisamos de amostras para estudar."
	},
	"yuki": {
		"briefing": "Hacker brilhante. Controla redes digitais.",
		"mission": "Circuito (hacking de sistemas)",
		"quote": "As máquinas falam comigo. Deixe-me ouvir."
	},
	"elena": {
		"briefing": "Ex-militar. Estratégia de combate.",
		"mission": "Hordas (tática de confronto)",
		"quote": "Preparação e coragem. Nada mais importa."
	},
	"bae": {
		"briefing": "Documentarista. Preserva o conhecimento.",
		"mission": "Extração (arqueologia de dados)",
		"quote": "História respira através de cada artefato."
	},
	"priya": {
		"briefing": "Rival. Ambições próprias.",
		"mission": "Sacrifício (experiências secretas)",
		"quote": "Meu lab, minhas regras. Queremos o mesmo?"
	},
	"tomas": {
		"briefing": "Mecânico brilhante. Improvisa do nada.",
		"mission": "Workshop (manufatura e reparo)",
		"quote": "Com as ferramentas certas, construo o impossível."
	},
	"lena": {
		"briefing": "Criança. Perspectiva inesperada.",
		"mission": "Stealth (mobilidade e furtividade)",
		"quote": "Os pequenos espaços, os grandes segredos."
	},
	"richard": {
		"briefing": "Ex-executivo. Logística e planejamento.",
		"mission": "Qualquer zona (coordenação geral)",
		"quote": "Eficiência é sobrevivência."
	},
	"viktor": {
		"briefing": "Cínico desencantado. Sarcasmo cortante.",
		"mission": "Qualquer zona (sem ilusões)",
		"quote": "Vamos fazer isso. Não importa o quão fútil seja."
	},
}

static func get_room(room_id: String) -> Dictionary:
	for room in ROOMS:
		if room["id"] == room_id:
			return room.duplicate()
	return {}

static func get_npc(npc_id: String) -> Dictionary:
	for npc in NPCS:
		if npc["id"] == npc_id:
			return npc.duplicate()
	return {}

static func get_zone(zone_id: String) -> Dictionary:
	for zone in ZONES:
		if zone["id"] == zone_id:
			return zone.duplicate()
	return {}

static func get_npcs_in_room(room_id: String) -> Array:
	for room in ROOMS:
		if room["id"] == room_id:
			var result := []
			for npc_id in room.get("npcs", []):
				result.append(get_npc(npc_id))
			return result
	return []

static func is_rocket_room(room: Dictionary) -> bool:
	var t: String = room.get("type", "")
	return t == "rocket" or t == "rocket-top" or t == "rocket-base"

static func get_floor_height(floor_num: int) -> float:
	if floor_num == 1:
		return 150.0
	return 150.0

static func get_rooms_by_floor(floor_num: int) -> Array:
	var result := []
	for room in ROOMS:
		if room.get("floor", 1) == floor_num:
			result.append(room)
	return result
