class_name HubData

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
		"h": 60,
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
		"h": 80,
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
		"h": 60,
		"type": "tech",
		"light": "red",
		"npcs": ["elena"]
	},
	# Floor 2 — Armamentos (muro de armas)
	{
		"id": "armamentos",
		"label": "ARMAMENTOS",
		"col": 2,
		"w": 2,
		"h": 60,
		"type": "storage",
		"light": "amber",
		"npcs": []
	},
	# Floor 2 — Enfermaria (verde hospital)
	{
		"id": "enfermaria",
		"label": "ENFERMARIA",
		"col": 4,
		"w": 2,
		"h": 60,
		"type": "medical",
		"light": "hospital",
		"zone_id": "infeccao",
		"npcs": ["amara"]
	},
	# Floor 3 — Lab da Priya (rival)
	{
		"id": "lab",
		"label": "LAB DA PRIYA",
		"col": 0,
		"w": 2,
		"h": 60,
		"type": "lab",
		"light": "cool",
		"zone_id": "sacrificio",
		"npcs": ["priya"]
	},
	# Floor 3 — Sala Comum
	{
		"id": "sala_comum",
		"label": "SALA COMUM",
		"col": 2,
		"w": 2,
		"h": 60,
		"type": "common",
		"light": "amber",
		"npcs": ["richard"]
	},
	# Floor 3 — Cozinha
	{
		"id": "cozinha",
		"label": "COZINHA",
		"col": 4,
		"w": 2,
		"h": 60,
		"type": "kitchen",
		"light": "warm",
		"npcs": ["tomas"]
	},
	# Floor 4 — Workshop
	{
		"id": "workshop",
		"label": "WORKSHOP",
		"col": 0,
		"w": 2,
		"h": 60,
		"type": "workshop",
		"light": "amber",
		"npcs": []
	},
	# Floor 4 — Arquivo (câmera)
	{
		"id": "arquivo",
		"label": "ARQUIVO",
		"col": 2,
		"w": 2,
		"h": 60,
		"type": "archive",
		"light": "office",
		"zone_id": "extracao",
		"npcs": ["bae"]
	},
	# Floor 4 — Server (neon verde)
	{
		"id": "server",
		"label": "SERVER · YUKI",
		"col": 4,
		"w": 2,
		"h": 60,
		"type": "server",
		"light": "neon-green",
		"zone_id": "circuito",
		"npcs": ["yuki"]
	},
	# Floor 5 — Gestão (office)
	{
		"id": "gestao",
		"label": "GESTÃO",
		"col": 0,
		"w": 2,
		"h": 60,
		"type": "office",
		"light": "office",
		"npcs": []
	},
	# Floor 5 — Quarto da Lena
	{
		"id": "quarto_lena",
		"label": "QUARTO",
		"col": 2,
		"w": 2,
		"h": 60,
		"type": "bedroom",
		"light": "pink-dim",
		"npcs": ["lena"]
	},
	# Floor 5 — Corredor
	{
		"id": "corredor",
		"label": "CORREDOR",
		"col": 4,
		"w": 2,
		"h": 60,
		"type": "transit",
		"light": "dim",
		"npcs": []
	},
	# Floor 6 — Túnel Stealth
	{
		"id": "tunel_stealth",
		"label": "TÚNEL STEALTH",
		"col": 0,
		"w": 3,
		"h": 60,
		"type": "tunnel-cool",
		"light": "neon-green",
		"zone_id": "stealth",
		"npcs": []
	},
	# Floor 6 — Túnel Hordas
	{
		"id": "tunel_hordas",
		"label": "TÚNEL HORDAS",
		"col": 3,
		"w": 3,
		"h": 60,
		"type": "tunnel-warm",
		"light": "amber-hot",
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

func get_room(room_id: String) -> Dictionary:
	for room in ROOMS:
		if room["id"] == room_id:
			return room.duplicate()
	return {}

func get_npc(npc_id: String) -> Dictionary:
	for npc in NPCS:
		if npc["id"] == npc_id:
			return npc.duplicate()
	return {}

func get_zone(zone_id: String) -> Dictionary:
	for zone in ZONES:
		if zone["id"] == zone_id:
			return zone.duplicate()
	return {}

func get_npcs_in_room(room_id: String) -> Array:
	for room in ROOMS:
		if room["id"] == room_id:
			var result = []
			for npc_id in room.get("npcs", []):
				result.append(get_npc(npc_id))
			return result
	return []

func get_room_y_offset(room_idx: int) -> float:
	var y = 0.0
	for i in range(room_idx):
		y += ROOMS[i]["h"]
	return y
