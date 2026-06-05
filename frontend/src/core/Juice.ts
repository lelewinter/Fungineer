/**
 * Juice.ts — o "tempero" de sensacao do jogo: tremor de camera (screen shake).
 *
 * "Juice" (suco/tempero, em ingles de game design) e o conjunto de pequenos
 * efeitos que fazem o jogo PARECER mais gostoso de jogar: tremidas, vibracoes,
 * impactos. Aqui implementamos o tremor de camera baseado em "trauma":
 *
 *   - Quando algo forte acontece (um golpe, uma explosao, um chefe surgindo),
 *     chamamos `addTrauma(...)` para acumular "trauma" (de 0 a 1).
 *   - A cada frame, `update(dt)` devolve um pequeno deslocamento (x, y, rotacao)
 *     que a tela aplica a camera, criando a tremida.
 *   - O trauma vai diminuindo sozinho com o tempo, ate a tela voltar ao normal.
 *
 * Detalhe esperto: o tremor cresce com o trauma AO QUADRADO. Assim, impactos
 * pequenos quase nao mexem na tela e os grandes "chacoalham" forte.
 *
 * Tudo isso e compartilhado por todas as fases (uma unica instancia: `juice`)
 * para a sensacao do jogo ser consistente. Tambem respeita usuarios que pediram
 * "reduzir movimento" no sistema (acessibilidade).
 */

// Limite de quanto a vibracao do aparelho pode durar (em ms), por seguranca.
const MAX_VIBRATION_MS = 200;
const MIN_VIBRATION_MS = 5;
// Quando o usuario pede "reduzir movimento", limitamos a vibracao a algo bem curto.
const REDUCED_MOTION_VIBRATION_CAP_MS = 20;

class Juice {
  // Trauma atual (0 = parado, 1 = tremor maximo). Diminui sozinho com o tempo.
  private trauma = 0;
  // Relogio interno acumulado, usado para gerar o padrao de tremida.
  private time = 0;
  // O usuario ativou "reduzir movimento" no sistema operacional?
  private prefersReducedMotion = false;

  /** Deslocamento maximo em pixels e rotacao maxima no trauma cheio. Ajustaveis. */
  maxOffset = 18;
  maxRot = 0.05;
  /** Quanto de trauma some por segundo (velocidade com que a tela se acalma). */
  decayPerSec = 1.4;

  constructor() {
    // Le a preferencia de acessibilidade do sistema, se disponivel.
    if (typeof window !== 'undefined' && window.matchMedia) {
      this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
  }

  /**
   * Acumula trauma (0..1; valores maiores = tremor mais forte). Opcionalmente
   * tambem vibra o aparelho. Se o usuario pediu "reduzir movimento", pulamos o
   * tremor visual e so deixamos uma vibracao bem curta.
   */
  addTrauma(amount: number, vibrateMs: number | number[] = 0): void {
    if (this.prefersReducedMotion) {
      if (this.hasVibration(vibrateMs)) {
        const capped = Array.isArray(vibrateMs)
          ? vibrateMs.map((ms) => Math.min(REDUCED_MOTION_VIBRATION_CAP_MS, ms))
          : Math.min(REDUCED_MOTION_VIBRATION_CAP_MS, vibrateMs);
        this.vibrate(capped);
      }
      return;
    }
    this.trauma = Math.min(1, this.trauma + amount);
    if (this.hasVibration(vibrateMs)) this.vibrate(vibrateMs);
  }

  /** Apelido de compatibilidade para chamadas vindas do lado das fases (runs). */
  shake(amount: number, vibrateMs: number | number[] = 0): void {
    this.addTrauma(amount, vibrateMs);
  }

  /**
   * Faz o aparelho vibrar (em celulares que suportam). Aceita uma duracao unica
   * ou um padrao (vibra/pausa/vibra...). Cada valor e limitado a uma faixa
   * segura, e erros sao silenciados pois alguns navegadores so permitem vibrar
   * apos um gesto do usuario.
   */
  vibrate(ms: number | number[]): void {
    if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
    if (this.prefersReducedMotion) return;
    const clampMs = (value: number): number =>
      Math.min(MAX_VIBRATION_MS, Math.max(MIN_VIBRATION_MS, Math.round(value)));
    try {
      if (Array.isArray(ms)) navigator.vibrate(ms.map(clampMs));
      else navigator.vibrate(clampMs(ms));
    } catch {
      // Alguns navegadores moveis expoem a API mas recusam chamadas sem gesto.
    }
  }

  /** Ha algum valor de vibracao realmente positivo a aplicar? */
  private hasVibration(ms: number | number[]): boolean {
    return Array.isArray(ms) ? ms.some((value) => value > 0) : ms > 0;
  }

  /** True enquanto a tela ainda estiver tremendo (trauma nao zerado). */
  get active(): boolean {
    return this.trauma > 0.001;
  }

  /**
   * Avanca o tremor um frame e devolve o deslocamento atual para a camera.
   * `dt` (delta time) e o tempo do frame em segundos. Sem trauma, devolve zero.
   */
  update(dt: number): { x: number; y: number; rot: number } {
    this.time += dt;
    if (this.trauma <= 0) return { x: 0, y: 0, rot: 0 };
    // Intensidade cresce com o quadrado do trauma (impactos grandes pesam mais).
    const shake = this.trauma * this.trauma;
    // "Ruido" barato e sem repeticao obvia: senoides em frequencias que nao se
    // alinham, diferentes por eixo, para o tremor parecer organico.
    const t = this.time * 40;
    const nx = Math.sin(t * 1.3) * Math.sin(t * 0.7 + 1.1);
    const ny = Math.sin(t * 1.7 + 2.3) * Math.sin(t * 0.9);
    const nr = Math.sin(t * 1.1 + 0.5);
    // Diminui o trauma proporcionalmente ao tempo passado (a tela se acalma).
    this.trauma = Math.max(0, this.trauma - this.decayPerSec * dt);
    return {
      x: nx * shake * this.maxOffset,
      y: ny * shake * this.maxOffset,
      rot: nr * shake * this.maxRot,
    };
  }

  /** Zera o tremor imediatamente (ex.: ao trocar de fase). */
  reset(): void {
    this.trauma = 0;
  }
}

/** Instancia unica e global do sistema de tremor, usada por todo o jogo. */
export const juice = new Juice();
