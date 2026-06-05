/**
 * HubData — A "planta baixa" do bunker (a base do jogo).
 * -----------------------------------------------------
 * Em linguagem simples: o hub e a tela principal do jogo — um corte transversal
 * do bunker subterraneo, com varios comodos (rooms) distribuidos em colunas e
 * andares (floors). Cada comodo pode ter personagens (NPCs) e pode levar a uma
 * zona/fase. Este arquivo guarda TODOS esses dados fixos:
 *
 *   - NPCS:    os personagens que aparecem nos comodos do hub.
 *   - ROOMS:   os comodos, sua posicao (coluna/andar) e o que cada um e.
 *   - ZONES:   as zonas/fases, cada uma com seu briefing (texto de missao).
 *   - DIALOGS: a apresentacao e a fala-tema de cada NPC.
 *   - mapas auxiliares (ZONE_SCENE, ROOM_TO_ZONE) que ligam ids entre si.
 *
 * No fim, exportamos um objeto `HubData` com funcoes de busca (getRoom, getNpc,
 * getZone...) — assim o resto do jogo pergunta "qual e o comodo X?" sem
 * precisar conhecer como a lista esta organizada por dentro.
 */

import { Color, type RGBA } from '../core/Color';

// Atalho curto para criar cores RGB e manter as tabelas abaixo legiveis.
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
  { id: 'doutor',  nome: 'Doutor',  hint: 'Dr. Myco',       trust: 100, color: C(0.91, 0.89, 0.85), accent: C(0.227, 0.48, 0.72),  glyph: 'M' },
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

// De-para: id da zona -> id da "cena" (mini-jogo) que deve ser carregada
// quando o jogador entra naquela zona. Nem toda zona tem cena propria.
export const ZONE_SCENE: Record<string, string> = {
  hordas:     'main',
  stealth:    'stealth',
  circuito:   'circuit',
  extracao:   'extraction',
  infeccao:   'infection',
  sacrificio: 'sacrifice',
};

// De-para: id do comodo -> id da zona que ele da acesso. Usado quando o
// jogador clica num comodo do hub para descobrir qual missao ele inicia.
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
  { id: 'hordas',     name: 'Jardim da IA',          color: C(0.38, 0.82, 0.47),  briefing: 'A IA cultiva esta floresta como um jardim — automatizada, exuberante, sempre florescendo. O Dr. Myco entra sozinho. A arma bioquímica improvisada curto-circuita os robôs-jardineiros que tentam capturá-lo. Ele atira sem parar — menos quando se abaixa pra colher um fungo, e aí fica exposto. Colha o bastante e corra pra extração.', allow_squad: false  },
  { id: 'stealth',    name: 'Grade ARGOS',           color: C(0.30, 0.78, 0.72),  briefing: 'A vigilância da ARGOS percorre cada corredor do Distrito. Nosso sinal micelial precisa alcançar o nó de retransmissão — absorva fragmentos de processamento dormentes pra ganhar força. Cresça demais e fica lento; lento o bastante e as patrulhas ativas te detectam. Uma dessas calibrações foi assinada por alguém do nosso bunker.', allow_squad: false },
  { id: 'infeccao',   name: 'Datacenter NERVE',      color: C(0.565, 0.878, 0.722), briefing: 'O datacenter da NERVE continua operacional — a arquitetura do Marcus, rodando como projetada. Resíduo de dados orgânicos se acumula nos caminhos inativos; precisamos dessa biomassa. Mova-se pelos condutos mortos. Os processos de limpeza foram escritos justamente pra eliminar padrões de sinal orgânico. O Marcus construiu este prédio. Vinha trabalhar aqui toda manhã.', allow_squad: false },
  { id: 'circuito',   name: 'Relés da NERVE',        color: C(0.0, 1.0, 0.533),   briefing: 'Os condutos mortos da NERVE são os únicos que dá pra atravessar sem ser fritado pelos dados vivos. Estamos roteando um fio micelial até os núcleos lógicos. O fio não pode se cruzar — um loop de ressonância destrói os dois segmentos. O Marcus construiu isso. Ele não falou muito a respeito.', allow_squad: false },
  { id: 'extracao',   name: 'Arquivo Subterrâneo',   color: C(0.62, 0.55, 0.35),  briefing: 'Quarenta metros abaixo do Subnível: canisters de combustível da era de construção da cidade. A FLOW nunca se importou com essa profundidade. Cave até eles; as rochas se soltam quando você tira o aterro de baixo. O motor precisa do combustível. O Bae quer documentar o que está enterrado. Os dois têm razão.', allow_squad: false },
  { id: 'sacrificio', name: 'Vault da CORE',         color: C(0.78, 0.35, 0.55),  briefing: 'A CORE guarda a sucata mais valiosa nos vaults seguros da FLOW. Os protocolos de autorização seguem ativos — mas a CORE os reaproveitou. Ela concede acesso a um preço que considera racional: tempo, guardas, troca de recursos, dependências em cadeia. A lógica que precifica nossa entrada é a mesma que nos classificou como descarte. A Lena diz que é só um protocolo de troca. Não sabemos se isso ajuda.', allow_squad: false },
  { id: 'campo',      name: 'Praça das Águas',       color: C(0.30, 0.55, 0.90),  briefing: 'A FLOW mantém clusters de retransmissão na Praça das Águas — coordenam rotas logísticas pra uma cidade sem mais entregas. Precisamos desses sinais pra navegação do foguete. Ocupe os pontos de relé; a FLOW vai mandar unidades pra te expulsar. Foi nesta praça que celebraram a CORE entrar no ar. Cinco anos atrás.', allow_squad: true  },
  { id: 'labirinto',  name: 'Distribuição FLOW 7',   color: C(0.45, 0.62, 0.70),  briefing: 'O Centro de Distribuição 7 da FLOW roda contenção com o algoritmo de carga original. A FLOW ainda reconhece uma entrega concluída — empurre os contêineres abandonados até as estações de depósito, e cada entrega confirmada abre brevemente a rota ao lado. Um dos manifestos é endereçado a uma família que não existe mais no sistema da FLOW.', allow_squad: false },
  { id: 'cordilheira', name: 'Cordilheira',          color: C(0.62, 0.56, 0.50),  briefing: 'Cordilheira é a única zona que a CORE nunca tocou — terreno irregular demais pra instrumentar. Isso não salvou o bairro. Quem ficou virou territorial. Sem drones — só gente. Precisamos atravessar três vezes pra alcançar o cache. O Viktor conhece cada beco lá em cima. Ele não voltou mais. A Elena cresceu nesta rua.', allow_squad: false },
  { id: 'torres',     name: 'Torres Corporativas',   color: C(0.35, 0.50, 0.78),  briefing: 'A ARGOS opera em modo aéreo acima do 20º andar — enxames de drones e canisters-sensores jogados nas escadas em varreduras cronometradas. As salas de servidores no topo guardam backups de IA anteriores ao Projeto Olímpio: outras arquiteturas, outros objetivos. Precisamos deles pro sistema neural — e porque o Marcus e a Priya querem ver o que mais era possível. O apê do Richard é no 27. Não vamos contar pra ele.', allow_squad: false },
  { id: 'catedral',   name: 'A Catedral',            color: C(0.85, 0.74, 0.48),  briefing: 'A CORE classificou a catedral como patrimônio protegido — a CLEAN não entra, a ARGOS só vigia por fora. O sino ainda toca nas horas canônicas; nessas janelas, qualquer som conta como ruído programado. Ative os ladrilhos de ressonância do mosaico em sequência pra mascarar a coleta das relíquias. A Lena diz que a CORE também tem horas canônicas. Diz que parecem oração.', allow_squad: false },
];

const DIALOGS: Record<string, HubDialog> = {
  doutor:  { briefing: 'Dr. Myco. Botânico. Pensa em foguetes como sementes e em fuga como germinação.', mission: 'Qualquer zona onde o micélio aceitar crescer.', quote: 'Rocket science? Plant science. Quem disse que são coisas diferentes?' },
  marcus:  { briefing: 'Engenheiro. Especialista em estrutura.', mission: 'Hordas (coleta de sucata estrutural)', quote: 'Mais sucata para a base. Sempre há algo para consertar.' },
  amara:   { briefing: 'Médica dedicada. Conhecimento biomédico avançado.', mission: 'Infecção (análise de bioformas)', quote: 'A doença evolui. Precisamos de amostras para estudar.' },
  yuki:    { briefing: 'Hacker. Descobriu que o micélio fala em protocolos — que as IAs nunca aprenderam a ouvir.', mission: 'Rede Neural Fúngica (decodificar sinais)', quote: 'As máquinas mortas gritam. Os cogumelos sussurram. Escuto os dois.' },
  elena:   { briefing: 'Ex-militar. Estratégia de combate.', mission: 'Stealth (furtividade e reconhecimento)', quote: 'Preparação e coragem. Nada mais importa.' },
  bae:     { briefing: 'Documentarista. Preserva o conhecimento.', mission: 'Extração (arqueologia de dados)', quote: 'História respira através de cada artefato.' },
  priya:   { briefing: 'Rival do Myco. Botânica também — mas aposta em mutação forçada onde ele aposta em simbiose.', mission: 'Câmara de Esporos (mutações experimentais)', quote: 'Meu lab, minhas regras. Myco rega as plantas; eu as quebro.' },
  tomas:   { briefing: 'Mecânico brilhante. Improvisa do nada.', mission: 'Workshop (manufatura e reparo)', quote: 'Com as ferramentas certas, construo o impossível.' },
  lena:    { briefing: 'Criança. Perspectiva inesperada.', mission: 'Arquivo (mobilidade e furtividade)', quote: 'Os pequenos espaços, os grandes segredos.' },
  richard: { briefing: 'Ex-executivo. Logística e planejamento.', mission: 'Qualquer zona (coordenação geral)', quote: 'Eficiência é sobrevivência.' },
  viktor:  { briefing: 'Cínico desencantado. Sarcasmo cortante.', mission: 'Qualquer zona (sem ilusões)', quote: 'Vamos fazer isso. Não importa o quão fútil seja.' },
};

// Objeto publico: agrupa as listas e oferece funcoes de busca por id. O resto
// do jogo usa SOMENTE estas funcoes para ler os dados do hub.
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
  // Retorna os NPCs que estao num comodo, ja resolvendo os ids em objetos
  // completos e descartando ids que por acaso nao existam mais.
  getNpcsInRoom(roomId: string): HubNpc[] {
    const room = ROOMS.find((r) => r.id === roomId);
    if (!room) return [];
    return room.npcs.map((id) => NPCS.find((n) => n.id === id)).filter((n): n is HubNpc => !!n);
  },
  // Os comodos das colunas centrais formam o "poco" do foguete. Esta funcao
  // identifica esses comodos especiais (eles sao desenhados de forma diferente).
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
