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
  // Floor 1 — Surface (split: half hordas-exit, half three surface zones)
  { id: 'saida_hordas', label: 'SAÍDA · HORDAS', col: 0, w: 3, floor: 1,
    type: 'surface-exit', light: 'red', zone_id: 'hordas', npcs: [] },
  { id: 'rota_cordilheira', label: 'CORDILHEIRA', col: 3, w: 1, floor: 1,
    type: 'surface-exit', light: 'amber', zone_id: 'cordilheira', silhouette: 'favela silenciosa', npcs: [] },
  { id: 'rota_torres', label: 'TORRES', col: 4, w: 1, floor: 1,
    type: 'surface-exit', light: 'cool', zone_id: 'torres', silhouette: 'arranha-céus podres', npcs: [] },
  { id: 'rota_catedral', label: 'CATEDRAL', col: 5, w: 1, floor: 1,
    type: 'surface-exit', light: 'warm', zone_id: 'catedral', silhouette: 'catedral em ruínas', npcs: [] },

  // Floor 2
  { id: 'vigia',       label: 'VIGIA',     col: 0, w: 2, floor: 2, type: 'tech',          light: 'red',      zone_id: 'stealth',   silhouette: 'posto de vigia',           npcs: ['elena'] },
  { id: 'rocket_top',  label: '',           col: 2, w: 2, floor: 2, type: 'rocket-top',    light: 'dim',      npcs: [] },
  { id: 'deposito',    label: 'TRANSMISSÃO', col: 4, w: 2, floor: 2, type: 'tech',        light: 'neon-green', zone_id: 'campo', silhouette: 'sala de transmissão',     npcs: [] },

  // Floor 3
  { id: 'lab_rival',   label: 'CÂMARA DE ESPOROS', col: 0, w: 2, floor: 3, type: 'spore-chamber', light: 'cool',  zone_id: 'sacrificio', silhouette: 'camara de esporos',       npcs: ['priya'] },
  { id: 'rocket_mid1', label: '',                   col: 2, w: 2, floor: 3, type: 'rocket',        light: 'dim',   npcs: [] },
  { id: 'enfermaria',  label: 'MYCELIUM LAB',       col: 4, w: 2, floor: 3, type: 'mycelium-lab',  light: 'hospital', zone_id: 'infeccao', silhouette: 'laboratorio de bioformas', npcs: ['amara'] },

  // Floor 4
  { id: 'workshop',    label: 'LABIRINTO',    col: 0, w: 2, floor: 4, type: 'transit',      light: 'dim',      zone_id: 'labirinto', silhouette: 'corredores recursivos', npcs: [] },
  { id: 'rocket_mid2', label: '',              col: 2, w: 2, floor: 4, type: 'rocket',       light: 'dim',      npcs: [] },
  { id: 'sala',        label: 'SALA COMUM',   col: 4, w: 2, floor: 4, type: 'common',       light: 'amber',    silhouette: 'sala de convivência',      npcs: ['richard'] },

  // Floor 5
  { id: 'cozinha',     label: 'FUNGUS KITCHEN', col: 0, w: 2, floor: 5, type: 'fungus-kitchen', light: 'warm',  silhouette: 'cozinha de fungos',       npcs: ['tomas'] },
  { id: 'rocket_base', label: '',               col: 2, w: 2, floor: 5, type: 'rocket-base',    light: 'dim',   npcs: [] },
  { id: 'arquivo',     label: 'ARQUIVO',        col: 4, w: 2, floor: 5, type: 'archive',        light: 'office', zone_id: 'extracao', silhouette: 'arquivo vivo',            npcs: ['bae'] },

  // Floor 6
  { id: 'server',      label: 'NEURAL MUSHROOM', col: 0, w: 2, floor: 6, type: 'neural-mushroom', light: 'neon-green', zone_id: 'circuito', silhouette: 'rede neural micótica', npcs: ['yuki'] },
  { id: 'gestao',      label: 'GESTÃO',          col: 2, w: 2, floor: 6, type: 'office',          light: 'office',                         silhouette: 'sala de gestão',        npcs: [] },
  { id: 'quarto_lena', label: 'QUARTO',          col: 4, w: 2, floor: 6, type: 'bedroom',         light: 'pink-dim',                       silhouette: 'quarto',                npcs: ['lena'] },
];

export const ZONE_SCENE: Record<string, string> = {
  hordas:      'main',
  stealth:     'stealth',
  circuito:    'circuit',
  extracao:    'extraction',
  campo:       'field',
  infeccao:    'infection',
  labirinto:   'maze',
  sacrificio:  'sacrifice',
  cordilheira: 'cordilheira',
  torres:      'torres',
  catedral:    'catedral',
};

export const ROOM_TO_ZONE: Record<string, string> = {
  saida_hordas:     'hordas',
  vigia:            'stealth',
  lab_rival:        'sacrificio',
  enfermaria:       'infeccao',
  server:           'circuito',
  arquivo:          'extracao',
  deposito:         'campo',
  workshop:         'labirinto',
  rota_cordilheira: 'cordilheira',
  rota_torres:      'torres',
  rota_catedral:    'catedral',
};

const ZONES: HubZone[] = [
  { id: 'hordas',     name: 'Zona Hordas',          color: C(0.72, 0.45, 0.85),    briefing: 'Drones CLEAN varrendo escombros — matar é o trabalho deles, coletar é o nosso. Sucata metálica bruta: pó de ferro, malhas, parafusos. O Dr. tritura isso em microesqueleto mineral. O micélio cresce ao redor como concreto armado orgânico. "Metal morto é só treliça esperando ser colonizada."', allow_squad: true  },
  { id: 'stealth',    name: 'Túnel Micótico',       color: C(0.30, 0.78, 0.72),    briefing: 'Rede ARGOS caça movimento, não silhuetas. O que Paulo precisa não está nos chips — está nas fórmulas de estabilização, catalisadores e protocolos de purificação gravados nos nós de controle. Receita do Orvalho Oxidante. Sem oxidante, o combustível não queima. Entra quem não pisa.', allow_squad: false },
  { id: 'infeccao',   name: 'Zona Contaminada',     color: C(0.565, 0.878, 0.722), briefing: 'Bioformas em colapso expelem biomassa adaptativa concentrada: quitina estrutural, beta-glucanos elásticos, melanina fúngica contra radiação. Paulo chama de "polímero com autoestima". Vira casco, juntas e selagem de tanques. O risco é inoculação. Amara quer amostras vivas. Traga as duas coisas.', allow_squad: false },
  { id: 'circuito',   name: 'Rede Neural Fúngica',  color: C(0.0, 1.0, 0.533),    briefing: 'Onde o micélio cresceu ao redor dos cabos mortos da IA. Os Núcleos Lógicos não são computadores — são padrões: geometria de injetores, sequência de válvulas, temporização de pressão. Paulo traduz para bio: câmaras de mistura em espiral, membranas que contraem com calor. "Não é um motor. É um estômago que cospe Newton."', allow_squad: false },
  { id: 'extracao',   name: 'Estufa Abandonada',    color: C(0.62, 0.55, 0.35),   briefing: 'Arquivo industrial de fermentação: canisters, culturas de bactérias celulolíticas, fórmulas de destilação. Tudo que Paulo precisa para produzir etanol de celulose, metano biogênico, hidrogênio fermentativo. "Tecnicamente é cachaça. Espiritualmente é fuga orbital." Bae documenta. Paulo destila. A corrida é contra a gravidade do depósito.', allow_squad: false },
  { id: 'sacrificio', name: 'Câmara de Esporos',    color: C(0.78, 0.35, 0.55),   briefing: 'Lab da Priya. Mutações experimentais que só ela ousa cultivar. Paulo precisa de catalisadores especiais, enzimas sintéticas e compostos de fermentação concentrada — as peças críticas que nenhuma zona normal produz. Nenhum dos oito sistemas do foguete fecha sem isso. O preço é cruel. Priya sabe disso e cobra.', allow_squad: false },
  { id: 'campo',      name: 'Setor de Transmissão', color: C(0.102, 0.435, 0.800), briefing: 'Relés da IA transmitem sinais de controle em frequências que o micélio condutivo consegue aprender. Paulo não quer os transmissores — quer os padrões. A Rede Nervosa Micelial vai detectar vibração, calor, rachadura, pressão. "Ele não pensa. Ele se arrepia na direção certa."', allow_squad: false },
  { id: 'labirinto',  name: 'Labirinto Subterrâneo', color: C(0.290, 0.565, 0.643), briefing: 'Complexo pré-colapso: placas cerâmicas, fibra mineral, sílica industrial. Nada aqui serve para construir — tudo serve para carbonizar. Paulo mistura ao micélio formando pele ablativa: queima por fora para não morrer por dentro. "Queimar por fora é uma forma muito elegante de não morrer por dentro." Drones em patrulha recursiva. Colhe rápido.', allow_squad: false },
  { id: 'cordilheira', name: 'Favela Silenciosa',     color: C(0.420, 0.380, 0.350), briefing: 'Sobreviventes humanos sem IA — fluxos hostis em vielas estreitas. Atravesse com timing, não com força.', allow_squad: false },
  { id: 'torres',      name: 'Arranha-céus Podres',   color: C(0.180, 0.300, 0.520), briefing: 'Escalada vertical entre andares colapsados. Algo sempre cai do alto — leia o ritmo.', allow_squad: false },
  { id: 'catedral',    name: 'Catedral em Ruínas',    color: C(0.780, 0.680, 0.420), briefing: 'Pirâmide ritualística iluminada por passos. Cada tile aceso é uma relíquia. Não pare onde algo está caindo.', allow_squad: false },
];

const DIALOGS: Record<string, HubDialog> = {
  doutor:  { briefing: 'Dr. Paulo. Botânico-mícologo. Acredita que o micélio não é matéria-prima — é arquiteto. Oito sistemas. Oito zonas. Um organismo balístico cultivado em simbiose: micélio para estrutura, fermentação para energia, peróxido bioestabilizado para oxidação, redes fúngicas bioelétricas para controle reflexo, casca ablativa orgânica para sobreviver ao calor da saída.', mission: 'Qualquer zona onde o fungo conseguir enraizar. O que a IA guarda, o micélio digere.', quote: 'O foguete não é construído. Ele é cultivado, curado, alimentado e convencido a querer subir.' },
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
