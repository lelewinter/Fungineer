// hub-data.jsx — MANY rooms, more life, rocket spanning multiple floors

// 11 survivors + Doutor. Cor-âncora + glyph.
const NPCS = [
  { id: 'doutor',   nome: 'Doutor',      hint: 'Dr. Paulo',     trust: 100, color: '#E8E4D8', accent: '#3A7AB8', glyph: 'P' },
  { id: 'marcus',   nome: 'Marcus',      hint: 'Engenheiro',    trust: 72,  color: '#7C8EA8', accent: '#A89070', glyph: 'M' },
  { id: 'amara',    nome: 'Amara',       hint: 'Médica',        trust: 58,  color: '#4FB872', accent: '#F4E4C8', glyph: 'A' },
  { id: 'yuki',     nome: 'Yuki',        hint: 'Hacker',        trust: 81,  color: '#B85AD9', accent: '#00FF88', glyph: 'Y' },
  { id: 'elena',    nome: 'Elena',       hint: 'Ex-Militar',    trust: 64,  color: '#8FA050', accent: '#D14A3F', glyph: 'E' },
  { id: 'bae',      nome: 'Bae',         hint: 'Documentarista',trust: 44,  color: '#C8A97E', accent: '#4A5A8C', glyph: 'B' },
  { id: 'priya',    nome: 'Priya',       hint: 'Rival',         trust: 36,  color: '#C85064', accent: '#F4E4C8', glyph: 'K' },
  { id: 'tomas',    nome: 'Tomas',       hint: 'Mecânico',      trust: 87,  color: '#D9B838', accent: '#3D2B1F', glyph: 'T' },
  { id: 'lena',     nome: 'Lena',        hint: 'Criança',       trust: 28,  color: '#E8A4B8', accent: '#00FF88', glyph: 'L' },
  { id: 'richard',  nome: 'Richard',     hint: 'Ex-Exec',       trust: 52,  color: '#4A6AA8', accent: '#A89070', glyph: 'R' },
  { id: 'viktor',   nome: 'Viktor',      hint: 'Cínico',        trust: 40,  color: '#8C6A3E', accent: '#E8943A', glyph: 'V' },
];

// ROOMS — grid-based. Each floor is 6 columns wide.
// col: 0..5 ; w = how many cols the room spans
// The rocket shaft occupies cols 2-3 on floors 2..5 (4 floors high).
// Floors are numbered 1 (top/surface) to 6 (deepest).

const GRID_COLS = 6;
const NUM_FLOORS = 7;

const ROOMS = [
  // Floor 1 — SUPERFÍCIE · SAÍDA (campo aberto, zona hordas) — a saída da base
  { id: 'saida_hordas', floor: 1, col: 0, w: 6, label: 'SAÍDA · ZONA HORDAS', type: 'surface-exit' },

  // Floor 2 — entrance / vigia
  { id: 'vigia',     floor: 2, col: 0, w: 2, label: 'VIGIA',       type: 'tech',    light: 'red',     occupants: ['elena'] },
  { id: 'rocket_top',floor: 2, col: 2, w: 2, label: '',            type: 'rocket-top', light: 'amber-hot' },
  { id: 'deposito',  floor: 2, col: 4, w: 2, label: 'DEPÓSITO',    type: 'storage', light: 'cool',    occupants: ['viktor'] },

  // Floor 3 — labs & rocket upper
  { id: 'lab_rival', floor: 3, col: 0, w: 2, label: 'LAB · RIVAL', type: 'lab',     light: 'clinical',occupants: ['priya'] },
  { id: 'rocket_2',  floor: 3, col: 2, w: 2, label: '',            type: 'rocket',  light: 'amber-hot' },
  { id: 'enfermaria',floor: 3, col: 4, w: 2, label: 'ENFERMARIA',  type: 'medical', light: 'hospital',occupants: ['amara'] },

  // Floor 4 — community & rocket mid
  { id: 'workshop',  floor: 4, col: 0, w: 2, label: 'WORKSHOP',    type: 'workshop',light: 'amber',   occupants: ['marcus','tomas'] },
  { id: 'rocket_3',  floor: 4, col: 2, w: 2, label: '',            type: 'rocket',  light: 'amber-hot' },
  { id: 'sala',      floor: 4, col: 4, w: 2, label: 'SALA COMUM',  type: 'common',  light: 'warm',    occupants: ['doutor'] },

  // Floor 5 — rocket base + kitchen + arquivo
  { id: 'cozinha',   floor: 5, col: 0, w: 2, label: 'COZINHA',     type: 'kitchen', light: 'warm',    occupants: [] },
  { id: 'rocket_4',  floor: 5, col: 2, w: 2, label: '',            type: 'rocket-base', light: 'amber-hot' },
  { id: 'arquivo',   floor: 5, col: 4, w: 2, label: 'ARQUIVO',     type: 'archive', light: 'amber-dim',occupants: ['bae'] },

  // Floor 6 — server, gestão, lena
  { id: 'server',    floor: 6, col: 0, w: 2, label: 'SERVER',      type: 'server',  light: 'neon-green', occupants: ['yuki'] },
  { id: 'gestao',    floor: 6, col: 2, w: 2, label: 'GESTÃO',      type: 'office',  light: 'office',  occupants: ['richard'] },
  { id: 'quarto_lena', floor: 6, col: 4, w: 2, label: 'QUARTO · L', type: 'bedroom', light: 'pink-dim', occupants: ['lena'] },
];

const ROCKET_RECIPE = [
  { n: 1, nome: 'Base Estrutural',    scrap: 6, ai: 0, built: true },
  { n: 2, nome: 'Casco Externo',      scrap: 8, ai: 0, built: true },
  { n: 3, nome: 'Suporte Interno',    scrap: 5, ai: 3, built: true },
  { n: 4, nome: 'Sistema Elétrico',   scrap: 6, ai: 0, built: true  },
  { n: 5, nome: 'Painel de Controle', scrap: 4, ai: 5, built: false, partial: 0.55 },
  { n: 6, nome: 'Motor Principal',    scrap: 8, ai: 4, built: false },
  { n: 7, nome: 'Sist. de Navegação', scrap: 0, ai: 8, built: false },
  { n: 8, nome: 'Blindagem Final',    scrap: 6, ai: 6, built: false },
];

const INVENTORY = { scrap: 14, ai: 9, slots: 5, slotsMax: 7, survivors: 11, capacity: 15 };

// zones — mapeadas pra cômodos específicos (roomId)
const ZONES = [
  { id: 'hordas',    nome: 'Zona Hordas',    roomId: 'saida_hordas', difficulty: 3, drop: 'scrap', squad: true,  color: '#E8943A', glyph: '▲', last: 'há 2 runs', lore: 'Ondas de enxame mecânico. Combate aberto. Leve gente.', history: [{r:1, res:'SUCESSO', drop:'+4 sucata', loss:'—'},{r:2, res:'SUCESSO', drop:'+3 sucata', loss:'Viktor ferido'},{r:3, res:'FALHA',   drop:'—',       loss:'Sobrevivente perdido'}] },
  { id: 'stealth',   nome: 'Zona Stealth',   roomId: 'quarto_lena', difficulty: 4, drop: 'ai',    squad: false, color: '#00FF88', glyph: '◆', last: 'há 1 run',  lore: 'Cones de visão patrulham a área. Solo. Silencioso.',   history: [{r:1, res:'SUCESSO', drop:'+2 comp.ia', loss:'—'},{r:2, res:'FALHA', drop:'—', loss:'Detectado'}] },
  { id: 'infeccao',  nome: 'Zona Infecção',  roomId: 'enfermaria',  difficulty: 3, drop: 'ai',    squad: false, color: '#90E0B8', glyph: '✚', last: 'há 5 runs', lore: 'Spore-zombies. Você pode contaminar a base ao voltar.', history: [{r:1, res:'SUCESSO', drop:'+1 comp.ia', loss:'Quarentena 2d'}] },
  { id: 'circuito',  nome: 'Zona Circuito',  roomId: 'server',      difficulty: 4, drop: 'ai',    squad: false, color: '#00FFAA', glyph: '◉', last: 'há 3 runs', lore: 'Sinais de IA vivos. Yuki abre a porta — se confiar em você.', history: [{r:1, res:'SUCESSO', drop:'+3 comp.ia', loss:'—'},{r:2, res:'SUCESSO', drop:'+2 comp.ia', loss:'Yuki irritada'}] },
  { id: 'extracao',  nome: 'Zona Extração',  roomId: 'arquivo',     difficulty: 2, drop: 'scrap', squad: false, color: '#C8A97E', glyph: '◇', last: 'há 8 runs', lore: 'Timer apertado. Pegar e correr. Bae registra tudo.',     history: [{r:1, res:'SUCESSO', drop:'+5 sucata', loss:'—'}] },
  { id: 'sacrificio',nome: 'Zona Sacrifício',roomId: 'lab_rival',   difficulty: 5, drop: 'ai',    squad: false, color: '#C85064', glyph: '✖', last: 'nunca',     lore: 'Priya pede um "voluntário". Recompensa alta. Custo maior.', history: [] },
];

// Mapa reverso: roomId → zone
const ROOM_TO_ZONE = {};
ZONES.forEach(z => { ROOM_TO_ZONE[z.roomId] = z; });

const VARIANTS = {
  warm: {
    name: 'Warm Gambiarra',
    tagline: 'quente, lanterna, âmbar',
    bg: '#120A06',
    bgTint: '#1E1209',
    rock: '#0A0604',
    wall: '#2A1D12',
    floorLine: '#3D2B1F',
    floorFill: '#1F1508',
    ink: '#F4E4C8',
    inkMuted: '#A89070',
    inkLow: '#6B5A48',
    warmLight: '#E8943A',
    coolLight: '#4A5A8C',
    rocketLight: '#E8943A',
    rocketGlow: '#FFB830',
    neonGreen: '#00FF88',
    neonAmber: '#FFB830',
    panelBg: 'rgba(26,20,16,0.96)',
    panelBorder: '#A89070',
    specialElite: true,
    density: 'informative',
  },
  balanced: {
    name: 'Balanced',
    tagline: 'meio-termo (padrão)',
    bg: '#0A0605',
    bgTint: '#140D08',
    rock: '#050302',
    wall: '#1F1610',
    floorLine: '#3A2A1E',
    floorFill: '#170F08',
    ink: '#ECE5D6',
    inkMuted: '#8C7E6C',
    inkLow: '#4A3F33',
    warmLight: '#E8943A',
    coolLight: '#4A5A8C',
    rocketLight: '#E8943A',
    rocketGlow: '#FFB830',
    neonGreen: '#00FF88',
    neonAmber: '#FFB830',
    panelBg: 'rgba(10,6,5,0.96)',
    panelBorder: '#3D2B1F',
    specialElite: true,
    density: 'balanced',
  },
  blueprint: {
    name: 'Blueprint Cold',
    tagline: 'blueprint do Doutor',
    bg: '#050D14',
    bgTint: '#0A1A26',
    rock: '#03080E',
    wall: '#12202E',
    floorLine: '#1E3347',
    floorFill: '#081421',
    ink: '#D8E8F0',
    inkMuted: '#6A8090',
    inkLow: '#3A4A5A',
    warmLight: '#E8943A',
    coolLight: '#4A7AA8',
    rocketLight: '#E8943A',
    rocketGlow: '#FFB830',
    neonGreen: '#00FF88',
    neonAmber: '#FFB830',
    panelBg: 'rgba(5,13,20,0.96)',
    panelBorder: '#3E6FA8',
    specialElite: false,
    density: 'minimal',
  },
};

// Itens inspecionáveis por cômodo (flavor)
const ROOM_ITEMS = {
  deposito:    [
    { name: 'caixa · comp.ia (6)', note: 'trazidos da zona circuito' },
    { name: 'pilha de sucata (14kg)', note: 'peso: 14/15 · quase no limite' },
    { name: 'bobina de cabo', note: 'da última run em extração' },
    { name: 'placa-mãe rachada', note: 'Marcus acha que dá pra salvar' },
    { name: 'lista de inventário', note: 'última atualização: ontem · Viktor' },
  ],
  tun_hordas:  [{ name: 'caixote de munição', note: '"últimas 3 — Viktor"' },{ name: 'marcas de garra na parede', note: 'profundas' }],
  tun_stealth: [{ name: 'cabo de fibra ótica', note: 'direcionado ao subsolo' },{ name: 'caderno da Yuki', note: '"eles ouvem passos, não código"' }],
  enfermaria:  [{ name: 'frasco lacrado', note: '"amostra 04 — INSTÁVEL"' },{ name: 'raio-x rasgado', note: 'assinatura da Amara' }],
  server:      [{ name: 'hard drive quebrado', note: 'ainda quente' },{ name: 'post-it', note: '"priya mentiu"' }],
  arquivo:     [{ name: 'fita VHS sem rótulo', note: 'data: antes do colapso' },{ name: 'fotos da família do Bae', note: 'dobradas' }],
  lab_rival:   [{ name: 'formol com algo dentro', note: 'não olhe de perto' },{ name: 'caderno da Priya', note: '"eles precisam ser quebrados para serem consertados"' }],
};

Object.assign(window, { NPCS, ROOMS, ROCKET_RECIPE, INVENTORY, ZONES, ROOM_TO_ZONE, ROOM_ITEMS, VARIANTS, GRID_COLS, NUM_FLOORS });
