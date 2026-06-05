/*
 * Juice — central de "game feel" (a sensação de impacto do jogo): tremor de
 * tela (screen shake) e vibração do aparelho (haptics).
 *
 * Ideia geral: registra-se uma vez a câmera da cena; depois, qualquer parte do
 * jogo pode chamar shake(intensidade, ms) quando acontece algo impactante. O
 * tremor é guardado como "trauma" (0 a 1) que vai diminuindo sozinho — assim
 * um golpe forte balança bastante e depois acalma naturalmente.
 *
 * (Este é o Juice global; em fx/RunJuice.ts há uma versão "kit completo" para as
 * cenas mais leves, com partículas e efeitos de tela embutidos.)
 */
import type { Container } from 'pixi.js';

/** Central de tremor de tela + vibração. Veja o bloco no topo do arquivo. */
class JuiceClass {
  private camera: Container | null = null;
  private baseX = 0;
  private baseY = 0;
  /** "Trauma" acumulado (0 a 1). Quanto maior, mais forte o tremor. */
  private trauma = 0;
  private decayPerSec = 1.4; // quão rápido o trauma diminui por segundo
  private maxOffset = 18;     // deslocamento máximo do tremor, em pixels
  private prefersReducedMotion = false;

  constructor() {
    if (typeof window !== 'undefined' && window.matchMedia) {
      this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
  }

  /** Registra a câmera que receberá o tremor. Passe null ao sair da cena para
   *  soltar a referência (evita vazamento de memória). */
  bind(camera: Container | null): void {
    this.camera = camera;
    this.trauma = 0;
    if (camera) {
      this.baseX = camera.pivot.x;
      this.baseY = camera.pivot.y;
    }
  }

  /** Adiciona um impacto. `amount` vai de 0 a 1 (limitado a 1); maior = mais
   *  violento. Várias chamadas no mesmo frame se somam, então combos grandes
   *  batem mais forte. */
  shake(amount: number, vibrateMs = 0): void {
    if (this.prefersReducedMotion) {
      // Acessibilidade: se o usuário pediu "menos movimento", pulamos o tremor
      // visual mas ainda damos uma vibração suave como feedback.
      if (vibrateMs > 0) this.vibrate(Math.min(20, vibrateMs));
      return;
    }
    this.trauma = Math.min(1, this.trauma + amount);
    if (vibrateMs > 0) this.vibrate(vibrateMs);
  }

  /** Dispara uma vibração. Navegadores sem a API (ou sem permissão) simplesmente
   *  não fazem nada. Tempos acima de 200ms são limitados para não irritar. */
  vibrate(ms: number): void {
    if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
    if (this.prefersReducedMotion) return;
    try {
      navigator.vibrate(Math.min(200, Math.max(5, Math.round(ms))));
    } catch {
      /* algumas versões do iOS Safari lançam erro aqui; ignoramos. */
    }
  }

  /** Roda todo frame: diminui o trauma e aplica o deslocamento de tremor na
   *  câmera registrada. */
  update(dt: number): void {
    if (!this.camera) return;
    if (this.trauma <= 0) {
      // Sem trauma: garante a câmera na posição-base (sem tremor residual).
      this.camera.pivot.x = this.baseX;
      this.camera.pivot.y = this.baseY;
      return;
    }
    // Usar trauma² é a curva clássica de screen shake: tremor forte no auge e
    // suavizando naturalmente conforme o trauma cai.
    const t2 = this.trauma * this.trauma;
    const ox = (Math.random() * 2 - 1) * this.maxOffset * t2;
    const oy = (Math.random() * 2 - 1) * this.maxOffset * t2;
    // O "pivot" é subtraído da transformação do container, então negamos para
    // empurrar a câmera no sentido contrário ao eixo do tremor (o solavanco visual).
    this.camera.pivot.x = this.baseX - ox;
    this.camera.pivot.y = this.baseY - oy;
    this.trauma = Math.max(0, this.trauma - this.decayPerSec * dt);
  }
}

export const Juice = new JuiceClass();
