/**
 * Scene.ts — a base de toda "tela" do jogo.
 *
 * Pense numa Scene como uma TELA inteira do jogo: o menu inicial, o hub, uma
 * fase de labirinto, etc. Cada tela e uma subclasse desta `Scene`. Ela define o
 * ciclo de vida basico que o SceneManager usa para trocar entre telas:
 *   - enter():  monta tudo que aparece na tela (chamada quando a tela "abre").
 *   - update(): roda a cada frame, para animar e atualizar a logica.
 *   - exit():   limpa o que precisar antes da tela fechar.
 *
 * (Para quem conhece a engine Godot: equivale a um Node2D raiz de uma cena.)
 */

import { Container } from 'pixi.js';
import type { App } from './App';

/** Classe base abstrata: nao se usa diretamente, serve para herdar. */
export abstract class Scene {
  /** O "no raiz" do PixiJS onde todos os elementos visuais desta tela ficam. */
  readonly root: Container = new Container();
  /** Referencia ao app principal (renderer, ticker, etc). Preenchida no bind. */
  protected app!: App;

  /** Chamada uma vez pelo SceneManager logo apos criar a cena, antes do enter. */
  bind(app: App): void {
    this.app = app;
  }

  /** Monta os elementos da tela. Chamada quando a cena se torna a ativa. */
  abstract enter(): Promise<void> | void;

  /** Atualizacao por frame. `dt` (delta time) vem em segundos. */
  update(_dt: number): void {}

  /**
   * Liberar listeners / estado externo antes de fechar a tela.
   * A destruicao do Container visual e automatica, entao so sobrescreva isto se
   * voce criou algo "por fora" (ex.: um event listener no window) que precise
   * ser removido manualmente.
   */
  exit(): Promise<void> | void {}
}
