import { Color, type RGBA } from '../core/Color';

const C = (r: number, g: number, b: number): RGBA => Color.rgb(r, g, b);

export interface HubNpc {
  id: string;
  nome: string;
  hint: string;
  trust: number;
  color: RGBA;
  accent: RGBA;
  glyph: string;
}

export interface HubRoom {
  id: string;
  label: string;
  col: number;
  w: number;
  floor: number;   // 1=surface, 2-6=underground
  type: string;
  light: string;
  npcs: string[];
  zone_id?: string;
  silhouette?: string;
}

export interface HubZone {
  id: string;
  name: string;
  color: RGBA;
  briefing: string;
  allow_squad: boolean;
}

export interface HubDialog {
  briefing: string;
  mission: string;
  quote: string;
}

const NPCS: HubNpc[] = [
  { id: 'doutor',  nome: 'Doutor',  hint: 'Dr. Paulo',       trust: 100, color: C(0.91, 0.89, 0.85), accent: C(0.227, 0.48, 0.72),  glyph: 'P' },
  { id: 'marcus',  nome: 'Marcus',  hint: 'Engenheiro',      trust: 72,  color: C(0.486, 0.557, 0.659), accent: C(0.659, 0.541, 0.439), glyph: 'M' },
  { id: 'amara',   nome: 'Amara',   hint: 'Médica',          trust: 58,  color: C(0.31, 0.722, 0.447),  accent: C(0.96, 0.89, 0.78),    glyph: 'A' },
  { id: 'yuki',    nome: 'Yuki',    hint: 'Hacker',          trust: 81,  color: C(0.722, 0.353, 0.851), accent: C(0.0, 1.0, 0.533),     glyph: 'Y' },
  { id: 'elena',   nome: 'Elena',   hint: 'Ex-Militar',      trust: 64,  color: C(0.561, 0.627, 0.314), accent: C(0.82, 0.29, 0.25),    glyph: 'E' },
  { id: 'bae',     nome: 'Bae',     hint: 'Documentarista',  trust: 44,  color: C(0.784, 0.659, 0.494), accent: C(0.29, 0.353, 0.549),  glyph: 'B' },
  { id: 'priya',   nome: 'Priya',   hint: 'Rival',           trust: 36,  color: C(0.784, 0.314, 0.392), accent: C(0.96, 0.89, 0.78),    glyph: 'K' },
  { id: 'tomas',   nome: 'Tomas',   hint: 'Mecânico',        trust: 87,  color: C(0.851, 0.722, 0.224), accent: C(0.239, 0.169, 0.122), glyph: 'T' },
  { id: 'lena',    nome: 'Lena',    hint: 'Criança',         trust: 28,  color: C(0.91, 0.639, 0.722),  accent: C(0.0, 1.0, 0.533),     glyph: 'L' },
  { id: 'richard', nome: 'Richard', hint: 'Ex-Exec',         trust: 52,  color: C(0.29, 0.416, 0.659),  accent: C(0.659, 0.541, 0.439), glyph: 'R' },
  { id: 'viktor',  nome: 'Viktor',  hint: 'Cínico',          trust: 40,  color: C(0.549, 0.416, 0.243), accent: C(0.91, 0.58, 0.23),    glyph: 'V' },
];

// 6-column × 6-floor cross-section layout (matches Hub.html mockup).
// Cols 2-3 on floors 2-5 are the rocket shaft (type: rocket-*).
const ROOMS: HubRoom[] = [
  // Floor 1 — Surface exit (full width)
  { id: 'saida_hordas', label: 'SAÍDA · HORDAS', col: 0, w: 6, floor: 1,
    type: 'surface-exit', light: 'red', zone_id: 'hordas', npcs: [] },

  // Floor 2
  { id: 'vigia',       label: 'VIGIA',     col: 0, w: 2, floor: 2, type: 'tech',          light: 'red',      zone_id: 'stealth',   silhouette: 'posto de vigia',           npcs: ['elena'] },
  { id: 'rocket_top',  label: '',           col: 2, w: 2, floor: 2, type: 'rocket-top',    light: 'dim',      npcs: [] },
  { id: 'deposito',    label: 'CAMPO',  col: 4, w: 2, floor: 2, type: 'storage',       light: 'amber',    zone_id: 'campo',    silhouette: 'depósito de armas',        npcs: [] },

  // Floor 3
  { id: 'lab_rival',   label: 'CÂMARA DE ESPOROS', col: 0, w: 2, floor: 3, type: 'spore-chamber', light: 'cool',  zone_id: 'sacrificio', silhouette: 'camara de esporos',       npcs: ['priya'] },
  { id: 'rocket_mid1', label: '',                   col: 2, w: 2, floor: 3, type: 'rocket',        light: 'dim',   npcs: [] },
  { id: 'enfermaria',  label: 'MYCELIUM LAB',       col: 4, w: 2, floor: 3, type: 'mycelium-lab',  light: 'hospital', zone_id: 'infeccao', silhouette: 'laboratorio de bioformas', npcs: ['amara'] },

  // Floor 4
  { id: 'workshop',    label: 'HYPHAE FORGE', col: 0, w: 2, floor: 4, type: 'hyphae-forge', light: 'amber',    silhouette: 'forja de hifas',           npcs: [] },
  { id: 'rocket_mid2', label: '',              col: 2, w: 2, floor: 4, type: 'rocket',       light: 'dim',      npcs: [] },
  { id: 'sala',        label: 'SALA COMUM',   col: 4, w: 2, floor: 4, type: 'common',       light: 'amber',    silhouette: 'sala de convivência',      npcs: ['richard'] },

  // Floor 5
  { id: 'cozinha',     label: 'FUNGUS KITCHEN', col: 0, w: 2, floor: 5, type: 'fungus-kitchen', light: 'warm',  silhouette: 'cozinha de fungos',       npcs: ['tomas'] },
  { id: 'rocket_base', label: '',               col: 2, w: 2, floor: 5, type: 'rocket-base',    light: 'dim',   npcs: [] },
  { id: 'arquivo',     label: 'ARQUIVO',        col: 4, w: 2, floor: 5, type: 'archive',        light: 'office', zone_id: 'extracao', silhouette: 'arquivo vivo',            npcs: ['bae'] },

  // Floor 6
  { id: 'server',      label: 'NEURAL MUSHROOM', col: 0, w: 2, floor: 6, type: 'neural-mushroom', light: 'neon-green', zone_id: 'circuito', silhouette: 'rede neural micótica', npcs: ['yuki'] },
  { id: 'gestao',      label: 'LABIRINTO',          col: 2, w: 2, floor: 6, type: 'office',          light: 'office',     zone_id: 'labirinto',               silhouette: 'sala de gestão',        npcs: [] },
  { id: 'quarto_lena', label: 'QUARTO',          col: 4, w: 2, floor: 6, type: 'bedroom',         light: 'pink-dim',                       silhouette: 'quarto',                npcs: ['lena'] },
];

export const ZONE_SCENE: Record<string, string> = {
  hordas:     'main',
  stealth:    'stealth',
  circuito:   'circuit',
  extracao:   'extraction',
  infeccao:   'infection',
  sacrificio: 'sacrifice',
};

export const ROOM_TO_ZONE: Record<string, string> = {
  saida_hordas: 'hordas',
  vigia:        'stealth',
  lab_rival:    'sacrificio',
  enfermaria:   'infeccao',
  server:       'circuito',
  arquivo:      'extracao',
  deposito:     'campo',
  gestao:       'labirinto',
};

/** Surface ruins reachable from the hub's surface band (zone ids). */
export const SURFACE_ZONE_IDS = ['cordilheira', 'torres', 'catedral'] as const;

const ZONES: HubZone[] = [
  { id: 'hordas',     name: 'Zona Hordas',          color: C(0.72, 0.45, 0.85),  briefing: 'Enxame de drones IA caçando esporos. Sozinhos fracos, em banda vorazes. Colheita: biomassa bruta.', allow_squad: true  },
  { id: 'stealth',    name: 'Túnel Micótico',       color: C(0.30, 0.78, 0.72),  briefing: 'Micélio cultivado crescendo entre as ruínas. Silêncio protege — pisoteio mata a rede. Colheita: hifas raras.', allow_squad: false },
  { id: 'infeccao',   name: 'Zona Contaminada',     color: C(0.565, 0.878, 0.722), briefing: 'Bioformas mutadas pela esterilização da IA. Amara precisa de amostras vivas. Risco de inoculação.', allow_squad: false },
  { id: 'circuito',   name: 'Rede Neural Fúngica',  color: C(0.0, 1.0, 0.533),   briefing: 'Onde o micélio encontrou os cabos mortos das IAs. Yuki decodifica os sinais. Colheita: núcleos lógicos.', allow_squad: false },
  { id: 'extracao',   name: 'Estufa Abandonada',    color: C(0.62, 0.55, 0.35),  briefing: 'Arqueologia botânica — sementes pré-colapso ainda dormentes. Bae documenta o que Paulo sonha reviver.', allow_squad: false },
  { id: 'sacrificio', name: 'Câmara de Esporos',    color: C(0.78, 0.35, 0.55),  briefing: 'Laboratório da Priya. Mutações experimentais que só ela ousa cultivar. O preço é cruel.',   allow_squad: false },
  { id: 'campo',      name: 'Zona de Transmissão',  color: C(0.30, 0.55, 0.90),  briefing: 'A IA controla o território por sinais. Perturbe as antenas e tome os pontos de controle. Colheita: sinais de controle.', allow_squad: true  },
  { id: 'labirinto',  name: 'Complexo Subterrâneo', color: C(0.45, 0.62, 0.70),  briefing: 'Corredores que se fecham e abrem. Drones de patrulha ainda operam. Navegue sem ficar preso. Colheita: fragmentos estruturais.', allow_squad: false },
  { id: 'cordilheira', name: 'Favela Silenciosa',   color: C(0.62, 0.56, 0.50),  briefing: 'Superfície sem IA — só os que ficaram. Hostis, mas humanos. Atravesse com calma. Colheita: memórias coletivas.', allow_squad: false },
  { id: 'torres',     name: 'Arranha-céus',         color: C(0.35, 0.50, 0.78),  briefing: 'Torres podres da superfície. Subir é metade da batalha; o que cai do alto é a outra metade. Colheita: cristais de memória.', allow_squad: false },
  { id: 'catedral',   name: 'A Catedral',           color: C(0.85, 0.74, 0.48),  briefing: 'Relíquias, ritmo, ressonância. Pise certo e ela canta com você. Colheita: relíquias.', allow_squad: false },
];

const DIALOGS: Record<string, HubDialog> = {
  doutor:  { briefing: 'Dr. Paulo. Botânico. Pensa em foguetes como sementes e em fuga como germinação.', mission: 'Qualquer zona onde o micélio aceitar crescer.', quote: 'Rocket science? Plant science. Quem disse que são coisas diferentes?' },
  marcus:  { briefing: 'Engenheiro. Especialista em estrutura.', mission: 'Hordas (coleta de sucata estrutural)', quote: 'Mais sucata para a base. Sempre há algo para consertar.' },
  amara:   { briefing: 'Médica dedicada. Conhecimento biomédico avançado.', mission: 'Infecção (análise de bioformas)', quote: 'A doença evolui. Precisamos de amostras para estudar.' },
  yuki:    { briefing: 'Hacker. Descobriu que o micélio fala em protocolos — que as IAs nunca aprenderam a ouvir.', mission: 'Rede Neural Fúngica (decodificar sinais)', quote: 'As máquinas mortas gritam. Os cogumelos sussurram. Escuto os dois.' },
  elena:   { briefing: 'Ex-militar. Estratégia de combate.', mission: 'Stealth (furtividade e reconhecimento)', quote: 'Preparação e coragem. Nada mais importa.' },
  bae:     { briefing: 'Documentarista. Preserva o conhecimento.', mission: 'Extração (arqueologia de dados)', quote: 'História respira através de cada artefato.' },
  priya:   { briefing: 'Rival do Paulo. Botânica também — mas aposta em mutação forçada onde ele aposta em simbiose.', mission: 'Câmara de Esporos (mutações experimentais)', quote: 'Meu lab, minhas regras. Paulo rega as plantas; eu as quebro.' },
  tomas:   { briefing: 'Mecânico brilhante. Improvisa do nada.', mission: 'Workshop (manufatura e reparo)', quote: 'Com as ferramentas certas, construo o impossível.' },
  lena:    { briefing: 'Criança. Perspectiva inesperada.', mission: 'Arquivo (mobilidade e furtividade)', quote: 'Os pequenos espaços, os grandes segredos.' },
  richard: { briefing: 'Ex-executivo. Logística e planejamento.', mission: 'Qualquer zona (coordenação geral)', quote: 'Eficiência é sobrevivência.' },
  viktor:  { briefing: 'Cínico desencantado. Sarcasmo cortante.', mission: 'Qualquer zona (sem ilusões)', quote: 'Vamos fazer isso. Não importa o quão fútil seja.' },
};

export const HubData = {
  ROOMS,
  NPCS,
  ZONES,
  DIALOGS,
  ZONE_SCENE,
  ROOM_TO_ZONE,
  getRoom(id: string): HubRoom | undefined {
    return ROOMS.find((r) => r.id === id);
  },
  getNpc(id: string): HubNpc | undefined {
    return NPCS.find((n) => n.id === id);
  },
  getZone(id: string): HubZone | undefined {
    return ZONES.find((z) => z.id === id);
  },
  getDialog(id: string): HubDialog | undefined {
    return DIALOGS[id];
  },
  getNpcsInRoom(roomId: string): HubNpc[] {
    const room = ROOMS.find((r) => r.id === roomId);
    if (!room) return [];
    return room.npcs.map((id) => NPCS.find((n) => n.id === id)).filter((n): n is HubNpc => !!n);
  },
  isRocketRoom(room: HubRoom): boolean {
    return room.type === 'rocket' || room.type === 'rocket-top' || room.type === 'rocket-base';
  },
  allRooms(): HubRoom[] {
    return ROOMS;
  },
  allNpcs(): HubNpc[] {
    return NPCS;
  },
  allZones(): HubZone[] {
    return ZONES;
  },
};
