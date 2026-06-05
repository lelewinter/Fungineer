/**
 * Signal.ts — um "alto-falante" simples de eventos (padrao observer).
 *
 * Muitas partes do jogo precisam AVISAR outras quando algo acontece, sem que
 * uma conheca a outra diretamente. Um Signal e como um alto-falante: alguem
 * "se inscreve" para ouvir (connect) e, quando o evento dispara (emit), todos os
 * inscritos sao chamados. Ex.: "o jogador morreu", "o inimigo foi derrotado".
 *
 * (Inspirado nos signals da engine Godot, porem com tipos do TypeScript.)
 */

/** Tipo de uma funcao ouvinte (callback) que recebe os argumentos do evento. */
export type SignalListener<T extends unknown[]> = (...args: T) => void;

/** Sinal tipado: `T` define quais argumentos sao enviados quando ele dispara. */
export class Signal<T extends unknown[] = []> {
  // Lista de quem esta "ouvindo" este sinal no momento.
  private listeners: Array<SignalListener<T>> = [];

  /**
   * Inscreve um ouvinte. Retorna uma funcao que, quando chamada, cancela a
   * inscricao — pratico para limpar listeners ao fechar uma tela.
   */
  connect(fn: SignalListener<T>): () => void {
    this.listeners.push(fn);
    return () => this.disconnect(fn);
  }

  /** Remove um ouvinte especifico da lista. */
  disconnect(fn: SignalListener<T>): void {
    this.listeners = this.listeners.filter((l) => l !== fn);
  }

  /** Dispara o evento, chamando todos os ouvintes com os argumentos dados. */
  emit(...args: T): void {
    // Iteramos sobre uma COPIA da lista (`slice()`) para que um ouvinte que se
    // desconecte durante o disparo nao bagunce a iteracao em andamento.
    for (const l of this.listeners.slice()) l(...args);
  }

  /** Remove todos os ouvintes de uma vez. */
  clear(): void {
    this.listeners = [];
  }
}
