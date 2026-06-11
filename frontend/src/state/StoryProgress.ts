/**
 * StoryProgress — a espinha narrativa do jogo.
 *
 * O arco: o Dr. Myco vivia sozinho na casa anti-tech dele. Marcus chega
 * fugindo das IAs e explica que o mundo caiu (IntroScene). A casa vira o
 * bunker. A partir daí, cada zona vencida RESGATA um sobrevivente — e cada
 * sobrevivente assume a sala do bunker que combina com a habilidade dele,
 * destravando a próxima zona (cuja mecânica é o tema dessa sala).
 *
 * A corrente de resgates (zona vencida → quem você encontra → sala que a
 * pessoa assume → zona que isso destrava):
 *
 *   HORDAS     → Elena  (ex-militar)     → VIGIA            → STEALTH
 *   STEALTH    → Amara  (médica)         → MYCELIUM LAB     → INFECÇÃO
 *   INFECÇÃO   → Yuki   (hacker)         → NEURAL MUSHROOM  → CIRCUITO
 *   CIRCUITO   → Bae    (documentarista) → ARQUIVO          → EXTRAÇÃO
 *   EXTRAÇÃO   → Tomas  (mecânico)       → DEPÓSITO+COZINHA → CAMPO
 *   CAMPO      → Richard (ex-exec, com Viktor) → GESTÃO+SALA → LABIRINTO
 *   LABIRINTO  → Priya  (rival)          → CÂMARA DE ESPOROS → SACRIFÍCIO
 *   SACRIFÍCIO → Lena   (criança)        → QUARTO           → (coração do bunker)
 *
 * Marcus chega na intro e assume a HYPHAE FORGE (workshop).
 * É um singleton sem estado próprio além de flags — o estado real
 * (resgatados, salas) vive no CharacterRegistry e no HubState.
 */

import { CharacterRegistry } from './CharacterRegistry';
import { HubState } from './HubState';

/** Um elo da corrente: vencer `zoneId` resgata `charId`, que abre `rooms`. */
export interface RescueLink {
  /** Zona (id de hub, ex.: 'hordas') cuja vitória dispara este resgate. */
  zoneId: string;
  /** Personagem resgatado. */
  charId: string;
  /** Quem chega junto (sem beat próprio). */
  alsoRescue?: string[];
  /** Salas do bunker que o personagem reativa. */
  rooms: string[];
  /** Zona nova que essas salas dão acesso (null = nenhuma). */
  unlocksZone: string | null;
  /** Onde o personagem foi encontrado (linha do overlay de fim de run). */
  foundLine: string;
  /** Fala do personagem ao chegar no bunker (modal de chegada). */
  arrivalQuote: string;
  /** O que a chegada destrava, em uma linha (modal de chegada). */
  unlockLine: string;
}

export const RESCUE_CHAIN: RescueLink[] = [
  {
    zoneId: 'hordas', charId: 'elena', rooms: ['vigia'], unlocksZone: 'stealth',
    foundLine: 'Você encontrou ELENA segurando uma barricada sozinha.',
    arrivalQuote: 'Elena: "Eu vigio. Ninguém entra, nada nos vê sair."',
    unlockLine: 'Elena assume o POSTO DE VIGIA — a rede de vigilância de ARGOS agora é legível. Nova zona: STEALTH.',
  },
  {
    zoneId: 'stealth', charId: 'amara', rooms: ['enfermaria'], unlocksZone: 'infeccao',
    foundLine: 'Você encontrou AMARA escondida num ponto cego de ARGOS.',
    arrivalQuote: 'Amara: "Tem gente doente lá fora. O micélio cura — se a gente chegar a tempo."',
    unlockLine: 'Amara monta o MYCELIUM LAB — agora dá pra conter surtos. Nova zona: INFECÇÃO.',
  },
  {
    zoneId: 'infeccao', charId: 'yuki', rooms: ['server'], unlocksZone: 'circuito',
    foundLine: 'Você encontrou YUKI em quarentena voluntária, cercada de terminais mortos.',
    arrivalQuote: 'Yuki: "As IAs falam por relés. Eu falo a língua delas."',
    unlockLine: 'Yuki acorda o NEURAL MUSHROOM — os relés de NERVE viraram alvo. Nova zona: CIRCUITO.',
  },
  {
    zoneId: 'circuito', charId: 'bae', rooms: ['arquivo'], unlocksZone: 'extracao',
    foundLine: 'Você encontrou BAE protegendo discos de memória com o próprio corpo.',
    arrivalQuote: 'Bae: "Se ninguém registrar, é como se a gente nunca tivesse existido."',
    unlockLine: 'Bae organiza o ARQUIVO VIVO — há registros soterrados pra recuperar. Nova zona: EXTRAÇÃO.',
  },
  {
    zoneId: 'extracao', charId: 'tomas', rooms: ['deposito', 'cozinha'], unlocksZone: 'campo',
    foundLine: 'Você encontrou TOMAS desmontando um drone pra fazer uma panela.',
    arrivalQuote: 'Tomas: "Me dão um depósito e uma cozinha e eu seguro esse bunker de pé."',
    unlockLine: 'Tomas reativa o DEPÓSITO DE ARMAS — dá pra tomar e segurar território. Nova zona: CAMPO.',
  },
  {
    zoneId: 'campo', charId: 'richard', alsoRescue: ['viktor'], rooms: ['gestao', 'sala'], unlocksZone: 'labirinto',
    foundLine: 'Você encontrou RICHARD (e Viktor, reclamando) num posto avançado caindo aos pedaços.',
    arrivalQuote: 'Richard: "Eu desenhei metade daqueles corredores corporativos. Sei onde eles se perdem."',
    unlockLine: 'Richard mapeia a SALA DE GESTÃO — os corredores técnicos têm saída. Nova zona: LABIRINTO.',
  },
  {
    zoneId: 'labirinto', charId: 'priya', rooms: ['lab_rival'], unlocksZone: 'sacrificio',
    foundLine: 'Você encontrou PRIYA. Ela não pediu ajuda. Veio mesmo assim.',
    arrivalQuote: 'Priya: "Meu foguete falhou. O seu não vai — porque agora eu estou nele."',
    unlockLine: 'Priya sela a CÂMARA DE ESPOROS — há recursos que custam caro. Nova zona: SACRIFÍCIO.',
  },
  {
    zoneId: 'sacrificio', charId: 'lena', rooms: ['quarto_lena'], unlocksZone: null,
    foundLine: 'Você encontrou LENA. Ela estava esperando alguém vir.',
    arrivalQuote: 'Lena: "Eu sabia que vinha alguém. Eu desenhei o foguete na parede, olha."',
    unlockLine: 'Lena ganha um QUARTO. O bunker agora tem um coração. Todos estão em casa.',
  },
];

/** Salas estruturais do bunker — sempre visíveis (não dependem de resgate). */
export const BASE_ROOMS: string[] = [
  'saida_hordas', 'workshop', 'rocket_top', 'rocket_mid1', 'rocket_mid2', 'rocket_base',
];

const ZONE_TO_LINK = new Map(RESCUE_CHAIN.map((l) => [l.zoneId, l] as const));

class StoryProgressClass {
  /** Resgate concluído numa run, aguardando o modal de chegada no hub. */
  pendingArrival: RescueLink | null = null;

  /**
   * Chamado pelo RunScene numa vitória. Se esta zona tem um resgate pendente,
   * aplica tudo (registry + salas) e devolve o elo pro overlay de fim de run.
   */
  onZoneVictory(zoneId: string): RescueLink | null {
    const link = ZONE_TO_LINK.get(zoneId);
    if (!link || CharacterRegistry.isRescued(link.charId)) return null;
    CharacterRegistry.rescue(link.charId);
    for (const extra of link.alsoRescue ?? []) CharacterRegistry.rescue(extra);
    HubState.rescued_characters = CharacterRegistry.getRescued();
    for (const room of link.rooms) HubState.unlockRoom(room);
    this.pendingArrival = link;
    return link;
  }

  /** O modal de chegada foi mostrado; limpa a pendência. */
  consumeArrival(): RescueLink | null {
    const link = this.pendingArrival;
    this.pendingArrival = null;
    return link;
  }

  /**
   * Reconstrói as salas destravadas a partir de quem já foi resgatado.
   * Chamado ao carregar um save (cura saves antigos/parciais) e no novo ciclo.
   */
  reconcileUnlocks(): void {
    // Reconstrói do zero: o conjunto canônico é casa-base + salas ganhas por
    // resgate. Isso também REMOVE destravas órfãs de saves antigos.
    HubState.room_unlocked = {};
    for (const room of BASE_ROOMS) HubState.unlockRoom(room);
    for (const link of RESCUE_CHAIN) {
      if (CharacterRegistry.isRescued(link.charId)) {
        for (const room of link.rooms) HubState.unlockRoom(room);
      }
    }
  }

  /** Zonas de superfície (Cordilheira/Torres/Catedral) abrem na metade do arco. */
  isSurfaceOpen(): boolean {
    return CharacterRegistry.isRescued('tomas');
  }

  /** A zona está acessível? (hordas sempre; as outras, via corrente). */
  isZoneOpen(zoneId: string): boolean {
    if (zoneId === 'hordas') return true;
    const opener = RESCUE_CHAIN.find((l) => l.unlocksZone === zoneId);
    if (!opener) return true; // zonas fora da corrente (superfície) não são gated aqui
    return CharacterRegistry.isRescued(opener.charId);
  }
}

/** De-para: id de cena de run → id de zona do hub (corrente de resgates). */
const SCENE_TO_HUB: Record<string, string> = {
  main: 'hordas', stealth: 'stealth', circuit: 'circuito', extraction: 'extracao',
  field: 'campo', infection: 'infeccao', maze: 'labirinto', sacrifice: 'sacrificio',
};

/** Id de zona do hub para uma cena de run (null para zonas fora da corrente). */
export function hubZoneIdForScene(scene: string): string | null {
  return SCENE_TO_HUB[scene] ?? null;
}

/** Instância única compartilhada. */
export const StoryProgress = new StoryProgressClass();
