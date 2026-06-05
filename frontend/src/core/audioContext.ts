/**
 * audioContext.ts — o "motor de som" compartilhado do navegador.
 *
 * Todo som gerado por codigo (efeitos do SfxSynth e musica do MusicSynth) usa a
 * Web Audio API, e essa API gira em torno de um objeto central: o AudioContext.
 * Os navegadores reclamam (e gastam recursos) se voce cria varios desses, entao
 * aqui mantemos UM unico, criado so quando alguem realmente vai tocar som
 * ("lazy", isto e, na primeira vez que e necessario).
 *
 * Detalhe importante: por politica de "autoplay", os navegadores comecam o som
 * PAUSADO ate o usuario interagir com a pagina (um clique/toque). Por isso existe
 * o `resumeAudioContext`, chamado no primeiro gesto do usuario.
 */

// O contexto unico (null = ainda nao foi criado).
let ctx: AudioContext | null = null;
// Marca se a criacao ja falhou, para nao ficar tentando de novo a cada chamada.
let failed = false;

/**
 * Devolve o AudioContext compartilhado, criando-o na primeira chamada.
 * Retorna null se o ambiente nao suportar audio (ex.: rodando fora do navegador
 * ou em um navegador muito antigo) — nesse caso o jogo simplesmente fica mudo.
 */
export function getAudioContext(): AudioContext | null {
  if (ctx) return ctx;
  if (failed || typeof window === 'undefined') return null;
  // Alguns navegadores antigos (Safari) usam o nome com prefixo "webkit".
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) {
    failed = true;
    return null;
  }
  try {
    ctx = new Ctor();
    return ctx;
  } catch {
    failed = true;
    return null;
  }
}

/**
 * "Acorda" o contexto se ele estiver suspenso (pausado pela politica de
 * autoplay). Deve ser chamado a partir de um gesto do usuario.
 */
export function resumeAudioContext(): void {
  if (ctx && ctx.state === 'suspended') void ctx.resume();
}
