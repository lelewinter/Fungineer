/**
 * SceneManager.ts — o "trocador de telas" do jogo.
 *
 * O jogo e feito de varias telas (Scenes): menu, hub, fases, etc. Este modulo e
 * o responsavel por TROCAR de uma tela para outra com elegancia:
 *   1) escurece a tela (fade para preto);
 *   2) fecha a tela antiga (chama exit(), destroi seus elementos);
 *   3) abre a tela nova (chama enter(), liga o update por frame);
 *   4) clareia de volta (fade saindo do preto).
 *
 * Ele tambem garante que so UMA troca aconteca por vez (a flag `busy`), para
 * evitar bagunca se o jogador clicar varias vezes rapido. Exporta uma instancia
 * unica: `sceneManager`.
 *
 * Termos: "fade" = transicao suave de claro/escuro; "overlay" = um retangulo
 * preto por cima de tudo; "ticker" = o relogio do PixiJS que dispara cada frame.
 */

import { Graphics, Ticker } from 'pixi.js';
import type { App } from './App';
import type { Scene } from './Scene';
import { tweenAsync } from './anim/animation';

// Duracao padrao do escurece/clareia, em milissegundos.
const DEFAULT_FADE_MS = 220;

class SceneManager {
  private app: App | null = null;
  // A tela atualmente ativa (null antes da primeira troca).
  private current: Scene | null = null;
  // A funcao que registramos no ticker para chamar o update da tela atual.
  private tickerHandler: ((tk: Ticker) => void) | null = null;
  // O retangulo preto usado para os fades.
  private fadeOverlay: Graphics | null = null;
  // Trava: impede iniciar uma troca enquanto outra ainda esta em andamento.
  private busy = false;

  /** Liga o gerenciador ao app e prepara o retangulo de fade. */
  attach(app: App): void {
    this.app = app;
    this.ensureFadeOverlay();
  }

  /** Devolve a tela atualmente ativa (ou null). */
  getCurrent(): Scene | null {
    return this.current;
  }

  /**
   * Cria (uma unica vez) o retangulo preto que cobre a tela durante os fades.
   * Ele fica no topo de tudo (zIndex bem alto), ignora cliques (eventMode none)
   * e se redesenha quando a janela muda de tamanho.
   */
  private ensureFadeOverlay(): void {
    if (!this.app || this.fadeOverlay) return;
    const w = this.app.pixi.screen.width;
    const h = this.app.pixi.screen.height;
    this.fadeOverlay = new Graphics().rect(0, 0, w, h).fill(0x000000);
    this.fadeOverlay.alpha = 0;
    this.fadeOverlay.eventMode = 'none';
    this.fadeOverlay.zIndex = 9999;
    this.app.stage.sortableChildren = true;
    this.app.stage.addChild(this.fadeOverlay);
    const resize = (): void => {
      if (!this.app || !this.fadeOverlay) return;
      this.fadeOverlay.clear()
        .rect(0, 0, this.app.pixi.screen.width, this.app.pixi.screen.height)
        .fill(0x000000);
    };
    window.addEventListener('resize', resize);
  }

  /**
   * Substitui a tela atual pela `next`, com transicao de fade.
   * Ignora a chamada se uma troca ja estiver em andamento (`busy`).
   */
  async replace(next: Scene, opts: { fadeMs?: number } = {}): Promise<void> {
    if (!this.app) throw new Error('SceneManager not attached');
    if (this.busy) return;
    this.busy = true;
    try {
      const fadeMs = opts.fadeMs ?? DEFAULT_FADE_MS;
      const overlay = this.fadeOverlay;

      // 1) Escurece (so se ja havia uma tela na frente).
      if (this.current && overlay) {
        await tweenAsync(overlay, { alpha: 1, duration: fadeMs / 1000, ease: 'power2.in' });
      }

      // 2) Fecha a tela antiga: desliga seu update, chama exit() e destroi tudo.
      if (this.current) {
        if (this.tickerHandler) {
          this.app.pixi.ticker.remove(this.tickerHandler);
          this.tickerHandler = null;
        }
        await this.current.exit();
        this.app.world.removeChild(this.current.root);
        this.current.root.destroy({ children: true });
        this.current = null;
      }

      // 3) Abre a tela nova: liga ao app, adiciona ao mundo e chama enter().
      next.bind(this.app);
      this.app.world.addChild(next.root);
      await next.enter();
      this.current = next;

      // Liga o update da nova tela ao ticker. O ticker conta em milissegundos;
      // convertemos para segundos (deltaMS / 1000) que e o que as telas esperam.
      this.tickerHandler = (tk) => next.update(tk.deltaMS / 1000);
      this.app.pixi.ticker.add(this.tickerHandler);

      // 4) Clareia de volta (fade saindo do preto).
      if (overlay) {
        await tweenAsync(overlay, { alpha: 0, duration: fadeMs / 1000, ease: 'power2.out' });
        overlay.alpha = 0;
      }
    } finally {
      // Libera a trava mesmo que algo de errado aconteca no meio do caminho.
      this.busy = false;
    }
  }
}

/** Instancia unica e global do gerenciador de telas. */
export const sceneManager = new SceneManager();
