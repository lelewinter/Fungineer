/**
 * tween.ts — animacoes suaves de valores ao longo do tempo.
 *
 * "Tween" (de "in-between") e a tecnica de mover um valor de um ponto a outro de
 * forma gradual, criando os quadros intermediarios — e o que faz uma animacao
 * parecer suave em vez de "pular" direto pro fim. Aqui temos:
 *   - Easing: curvas que controlam o RITMO da animacao (acelerar, desacelerar).
 *   - tween():  roda a animacao quadro a quadro e avisa quando termina.
 *
 * Em vez de mexer numa propriedade especifica, o `tween` so te entrega o
 * progresso (0 a 1) a cada frame via `onUpdate`; quem chama decide o que animar.
 */

/** Uma funcao de "easing": recebe o progresso bruto (0..1) e devolve o ajustado. */
export type EaseFn = (t: number) => number;

/**
 * Curvas de easing prontas. Elas mudam a sensacao do movimento:
 *   - linear: ritmo constante do inicio ao fim.
 *   - easeOutCubic: comeca rapido e desacelera no fim (sensacao mais natural).
 *   - easeInCubic: comeca devagar e acelera no fim.
 *   - easeInOutCubic: devagar nas pontas, rapido no meio.
 */
export const Easing = {
  linear: (t: number) => t,
  easeOutCubic: (t: number) => 1 - Math.pow(1 - t, 3),
  easeInCubic: (t: number) => t * t * t,
  easeInOutCubic: (t: number) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
};

/** Opcoes para iniciar um tween. */
export interface TweenOpts {
  /** Duracao total da animacao, em milissegundos. */
  durationMs: number;
  /** Curva de ritmo (padrao: easeOutCubic). */
  ease?: EaseFn;
  /** Chamada a cada frame com o progresso ja "suavizado" (0..1). */
  onUpdate: (t: number) => void;
  /** Permite CANCELAR a animacao no meio (ex.: ao trocar de tela). */
  signal?: AbortSignal;
}

/**
 * Roda uma animacao e devolve uma Promise que termina quando ela acaba (ou e
 * cancelada). Usa `requestAnimationFrame` para se sincronizar com a tela.
 */
export function tween({ durationMs, ease = Easing.easeOutCubic, onUpdate, signal }: TweenOpts): Promise<void> {
  return new Promise<void>((resolve) => {
    const start = performance.now();
    let raf = 0;

    // Esta funcao roda uma vez por frame ate o tempo acabar.
    const step = (): void => {
      // Se pediram para cancelar, encerramos sem agendar o proximo frame.
      if (signal?.aborted) {
        resolve();
        return;
      }
      const elapsed = performance.now() - start;
      // Quanto do tempo total ja passou (limitado a 1 = 100%).
      const progress = Math.min(1, elapsed / durationMs);
      onUpdate(ease(progress));
      if (progress >= 1) {
        resolve();
      } else {
        raf = requestAnimationFrame(step);
      }
    };
    raf = requestAnimationFrame(step);

    // Se um sinal de cancelamento chegar, paramos o loop imediatamente.
    if (signal) {
      signal.addEventListener('abort', () => {
        cancelAnimationFrame(raf);
        resolve();
      });
    }
  });
}
