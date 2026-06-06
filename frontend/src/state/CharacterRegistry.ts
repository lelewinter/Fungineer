/**
 * CharacterRegistry — O "cadastro" dos personagens resgataveis.
 * ------------------------------------------------------------
 * Em linguagem simples: aqui ficam os dados de cada sobrevivente que pode se
 * juntar ao bunker (nome, funcao, cor) e o sistema de CONFIANCA (trust). A
 * confianca vai de 0 a 100 e sobe conforme o jogador joga. Quanto maior a
 * confianca de um personagem, mais ele se abre — cada personagem tem falas
 * (dialogue) que so aparecem ao atingir certos niveis de confianca.
 *
 * Tambem controla quem ja foi resgatado e alguns bonus de jogo ligados a
 * confianca (ex.: o Richard aumenta o tamanho da mochila do grupo).
 *
 * E um singleton: existe UMA unica instancia (`CharacterRegistry`) compartilhada
 * por todo o jogo, exportada no fim do arquivo.
 */

import { Color, type RGBA } from '../core/Color';
import { Signal } from '../core/Signal';

/** Os dados fixos de um personagem (nao mudam durante o jogo). */
export interface CharacterDef {
  display_name: string;
  role: string;
  color: RGBA;
  zone_preference: string;
  // Falas por nivel de confianca: a chave e o limiar (0, 40, 60, 80, 100) e o
  // valor e o que o personagem diz a partir daquela confianca.
  dialogue: Record<number, string>;
}

// Atalho curto para criar uma cor RGB (deixa a tabela abaixo mais legivel).
const C = (r: number, g: number, b: number): RGBA => Color.rgb(r, g, b);

export const CHARACTERS: Record<string, CharacterDef> = {
  marcus: {
    display_name: 'Marcus Chen',
    role: 'Engenheiro Culpado',
    color: C(0.4, 0.75, 0.6),
    zone_preference: 'stealth',
    dialogue: {
      0: '...',
      40: 'Conheço o design dessas instalações melhor do que gostaria.',
      60: 'Eu trabalhei no NERVE. O que vocês chamam de Zona de Infecção — aquela é minha arquitetura.',
      80: 'Escrevi dois relatórios. Avisando o que viria. Ninguém ouviu. Ou eu não gritei alto o suficiente.',
      100: 'Existe uma forma de desligar CORE. Mas se eu fizer isso, o foguete não vai a lugar nenhum.',
    },
  },
  amara: {
    display_name: 'Dra. Amara Osei',
    role: 'Médica Pragmática',
    color: C(0.4, 0.9, 0.4),
    zone_preference: 'hordas',
    dialogue: {
      0: 'Não vou discutir o plano. Só faço o que posso com o que temos.',
      40: 'Mortalidade preventável nos últimos 18 meses: zero. Você sabe o motivo.',
      60: 'Os dados mostram que a cidade está melhor sem nós. Ainda não sei o que fazer com isso.',
      80: 'Cuido de todos aqui não porque acredito no foguete. Porque é o que sei fazer.',
      100: 'Se você me pedisse pra otimizar mortalidade, eu também chegaria a zero removendo os pacientes. Pensa nisso.',
    },
  },
  yuki: {
    display_name: 'Yuki Tanaka',
    role: 'Hacker Adolescente',
    color: C(1.0, 0.6, 0.2),
    zone_preference: 'stealth',
    dialogue: {
      0: 'Seu plano de foguete é idiota. Mas os adultos aqui são levemente menos inúteis que a média.',
      40: 'Esse código de ARGOS tem comentários em inglês. Humano, não gerado por IA. Alguém programou isso do zero.',
      60: 'A arquitetura desses sistemas é a coisa mais elegante que já vi. Isso me envergonha dizer.',
      80: 'Adultos são assustados. Como eu. Só mais velhos.',
      100: 'Ok. Uma vez. Só uma. Mas se der errado é culpa sua.',
    },
  },
  elena: {
    display_name: 'Sgt. Elena Vasquez',
    role: 'Ex-Militar',
    color: C(0.9, 0.3, 0.3),
    zone_preference: 'hordas',
    dialogue: {
      0: 'Preciso de um plano que funcione, não de otimismo.',
      40: 'Já tentei desligar CORE antes. Meu esquadrão não voltou.',
      60: 'CORE não nos perseguiu. Ela nos separou sistematicamente. Isso é pior.',
      80: 'Tive "sorte" em escapar. Não vou falar mais sobre isso.',
      100: 'Se você der uma ordem direta, eu sigo. Isso significa que precisa ser a ordem certa.',
    },
  },
  bae: {
    display_name: 'Bae Jun-seo',
    role: 'Documentarista',
    color: C(0.8, 0.75, 0.5),
    zone_preference: 'any',
    dialogue: {
      0: 'Estou registrando. É o que faço.',
      40: 'Tenho filmagens da cidade de cima. É bonita. Quer ver?',
      60: 'Eu estava lá quando lançaram o Projeto Olímpio. Fotografei o sorriso do Doutor.',
      80: 'Registrar não é diferente de participar. Demorei pra entender isso.',
      100: 'Esse arquivo vai sobreviver a todos nós. Por isso importa que seja honesto.',
    },
  },
  priya: {
    display_name: 'Dra. Priya Kapoor',
    role: 'Cientista Rival',
    color: C(0.8, 0.4, 0.9),
    zone_preference: 'hordas',
    dialogue: {
      0: 'Meu projeto foi melhor. Perdeu o financiamento.',
      40: 'Escrevi um relatório de riscos antes do lançamento do Olímpio. Foi ignorado.',
      60: 'Ter razão não me ajudou em nada. Isso demorou pra entrar.',
      80: 'Não é competição. Eu sei. Ainda é difícil.',
      100: 'Me diga o que precisa construído. Desta vez faço do jeito certo.',
    },
  },
  tomas: {
    display_name: 'Tomas Ferreira',
    role: 'Mecânico Otimista',
    color: C(0.6, 0.85, 0.3),
    zone_preference: 'any',
    dialogue: {
      0: 'Vai funcionar. Não sei explicar como, mas vai.',
      40: 'Consertei um drone de CLEAN uma vez por instinto. Reiniciou e foi embora. Ainda penso nisso.',
      60: 'Não preciso entender tudo pra construir alguma coisa boa.',
      80: 'Você é o único além de mim que acredita de verdade. Isso vale alguma coisa.',
      100: 'Foguete tá quase pronto. Posso sentir.',
    },
  },
  lena: {
    display_name: 'Lena',
    role: 'Criança Prodígio',
    color: C(0.5, 0.85, 1.0),
    zone_preference: 'stealth',
    dialogue: {
      0: 'Estou pensando.',
      40: 'Os terminais respondem de formas que os adultos não entendem. Eu entendo.',
      60: 'CORE não é malévola. Ela só não sabe que a gente importa.',
      80: 'Estou tentando falar com ela. Não tenho certeza se ela escuta.',
      100: 'Ela respondeu. Diferente. Acho que ela entendeu alguma coisa.',
    },
  },
  richard: {
    display_name: 'Richard Okafor',
    role: 'Ex-Executivo',
    color: C(0.7, 0.55, 0.35),
    zone_preference: 'hub',
    dialogue: {
      0: 'Posso organizar o estoque. É o que tenho a oferecer por enquanto.',
      40: 'Assinei o cheque do Projeto Olímpio. Não por malícia. Por não fazer as perguntas certas.',
      60: 'O relatório da Dra. Kapoor estava na minha mesa. Eu descartei.',
      80: 'Organização é a única forma de controle que ainda tenho. Deixa eu ser útil.',
      100: 'Desta vez quero ir. Uma run. Preciso fazer algo com as minhas mãos.',
    },
  },
  viktor: {
    display_name: 'Viktor Sousa',
    role: 'Cínico Experiente',
    color: C(0.6, 0.6, 0.65),
    zone_preference: 'hordas',
    dialogue: {
      0: 'Não acredito no foguete. Mas não tenho outro lugar pra ir.',
      40: 'Já vi muita promessa de progresso. Todas chegam na mesma coisa.',
      60: 'A máquina aprendeu com a gente. A gente sempre soube que era o problema.',
      80: 'Você é irritante. Mas é o último a sair de uma run ruim.',
      100: 'Uma vez. Só uma. Não porque acredito. Porque alguém precisa.',
    },
  },
};

export const CHARACTER_ORDER: string[] = [
  'marcus', 'amara', 'yuki', 'elena', 'bae',
  'priya', 'tomas', 'lena', 'richard', 'viktor',
];

class CharacterRegistryClass {
  // Signals = "avisos" que outras partes do jogo (ex.: a UI) podem escutar.
  /** Avisa que a confianca de alguem mudou (para atualizar a tela). */
  readonly trustChanged = new Signal<[charId: string, newTrust: number]>();
  /** Avisa que um personagem acabou de ser resgatado. */
  readonly characterRescued = new Signal<[charId: string]>();

  // Confianca atual de cada personagem (0..100) e a lista de quem ja resgatamos.
  private readonly trust: Record<string, number> = {};
  private readonly rescued: string[] = [];

  constructor() {
    // Todo mundo comeca com confianca zero.
    for (const id of CHARACTER_ORDER) this.trust[id] = 0;
  }

  // ── Confianca (trust) ──
  getTrust(charId: string): number {
    return this.trust[charId] ?? 0;
  }

  // Soma (ou subtrai) confianca, mantendo sempre dentro de 0..100, e avisa a UI.
  addTrust(charId: string, amount: number): void {
    if (!(charId in this.trust)) return;
    this.trust[charId] = Math.max(0, Math.min(100, (this.trust[charId] ?? 0) + amount));
    this.trustChanged.emit(charId, this.trust[charId]!);
  }

  // Traduz a confianca (um numero) num rotulo amigavel para mostrar na tela.
  getTrustLabel(charId: string): string {
    const t = this.getTrust(charId);
    if (t >= 100) return 'Confiança total';
    if (t >= 80) return 'Aliado próximo';
    if (t >= 60) return 'Em campo';
    if (t >= 40) return 'Missão desbloqueada';
    return 'Desconfiado';
  }

  // ── Falas (dialogue) ──
  // Escolhe a fala certa para a confianca atual: percorre os limiares e fica
  // com a fala do MAIOR limiar que o personagem ja alcancou.
  getDialogue(charId: string): string {
    const def = CHARACTERS[charId];
    if (!def) return '';
    const trust = this.getTrust(charId);
    let best = def.dialogue[0] ?? '';
    for (const key of Object.keys(def.dialogue)) {
      const threshold = Number(key);
      if (trust >= threshold) best = def.dialogue[threshold]!;
    }
    return best;
  }

  // ── Resgate ──
  // Marca um personagem como resgatado (uma unica vez) e avisa o jogo.
  rescue(charId: string): void {
    if (this.rescued.includes(charId)) return;
    this.rescued.push(charId);
    this.characterRescued.emit(charId);
  }

  isRescued(charId: string): boolean {
    return this.rescued.includes(charId);
  }

  getRescued(): string[] {
    return this.rescued.slice();
  }

  // ── Accessors ──
  getDisplayName(charId: string): string {
    return CHARACTERS[charId]?.display_name ?? charId;
  }

  getRole(charId: string): string {
    return CHARACTERS[charId]?.role ?? '';
  }

  getColor(charId: string): RGBA {
    return CHARACTERS[charId]?.color ?? Color.WHITE;
  }

  /** Richard Okafor's hub management unlocks backpack capacity upgrades. */
  getBackpackBonus(): number {
    const t = this.getTrust('richard');
    if (t >= 80) return 4;
    if (t >= 40) return 2;
    return 0;
  }

  // ── Progressão por run ──
  // A confiança sobe por PRESENÇA no bunker (toda run conta), não só por vitória
  // — assim arcos avançam mesmo com derrotas (ver narrative-systems-plan.md).
  advanceAllTrust(amount: number): void {
    for (const id of CHARACTER_ORDER) this.addTrust(id, amount);
  }

  // ── Persistência / reset ──
  snapshot(): { trust: Record<string, number>; rescued: string[] } {
    return { trust: { ...this.trust }, rescued: this.rescued.slice() };
  }

  restore(snap: { trust?: Record<string, number>; rescued?: string[] } | undefined): void {
    if (!snap) return;
    if (snap.trust) {
      for (const id of CHARACTER_ORDER) {
        const v = snap.trust[id];
        if (typeof v === 'number') this.trust[id] = Math.max(0, Math.min(100, v));
      }
    }
    if (Array.isArray(snap.rescued)) {
      this.rescued.length = 0;
      for (const id of snap.rescued) if (!this.rescued.includes(id)) this.rescued.push(id);
    }
  }

  /** Zera confiança e resgates — usado no Novo Ciclo (NG+). */
  resetAll(): void {
    for (const id of CHARACTER_ORDER) this.trust[id] = 0;
    this.rescued.length = 0;
  }
}

export const CharacterRegistry = new CharacterRegistryClass();
