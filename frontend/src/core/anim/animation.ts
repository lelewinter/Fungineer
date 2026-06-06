/**
 * animation.ts — ponto único de configuração do GSAP (a biblioteca de animação
 * profissional do ecossistema). Importar `gsap` daqui garante que o PixiPlugin
 * já está registrado — assim dá para animar propriedades do PixiJS (posição,
 * escala, alpha, tint…) com as curvas de easing caprichadas do GSAP.
 *
 * Por que centralizar: o registro do plugin só pode rodar uma vez, e precisa
 * acontecer ANTES de qualquer animação. Quem quiser animar importa daqui:
 *
 *     import { gsap } from '../anim/animation';
 *     gsap.to(card, { pixi: { scale: 1.05 }, duration: 0.2, ease: 'back.out' });
 */

import { gsap } from 'gsap';
import { PixiPlugin } from 'gsap/PixiPlugin';
import * as PIXI from 'pixi.js';

// Dá ao GSAP acesso às classes do PixiJS (para entender `pixi: { ... }`).
PixiPlugin.registerPIXI(PIXI);
gsap.registerPlugin(PixiPlugin);

export { gsap };

/** Promete resolver quando o tween terminar — útil com async/await. */
export function tweenAsync(target: object, vars: gsap.TweenVars): Promise<void> {
  return new Promise((resolve) => {
    gsap.to(target, { ...vars, onComplete: () => resolve() });
  });
}
