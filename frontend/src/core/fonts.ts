/**
 * fonts.ts — carregamento confiável das fontes do jogo.
 *
 * As fontes são auto-hospedadas (pacotes @fontsource), então carregam na hora e
 * funcionam offline (PWA) — sem depender do CDN do Google nem do `display=swap`.
 *
 * POR QUE ISSO IMPORTA: o PixiJS desenha cada texto numa textura no MOMENTO em
 * que o `Text` é criado, usando a fonte que estiver disponível naquele instante.
 * Se a fonte ainda não carregou, ele "assa" o texto com a fonte de fallback do
 * sistema e NÃO redesenha quando a fonte certa chega depois. Resultado: texto
 * feio e inconsistente. A solução é simples: ESPERAR as fontes carregarem
 * (`loadFonts()`) ANTES de montar qualquer cena.
 */

// CSS auto-hospedado (Vite empacota os .woff2). Pesos que o jogo usa.
import '@fontsource/rubik/400.css';
import '@fontsource/rubik/500.css';
import '@fontsource/rubik/600.css';
import '@fontsource/rubik/700.css';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';
import '@fontsource/ibm-plex-mono/600.css';
import '@fontsource/major-mono-display/400.css';

// Especificações (peso + família) que precisam estar prontas antes do texto.
const REQUIRED = [
  '400 16px "Rubik"',
  '500 16px "Rubik"',
  '600 16px "Rubik"',
  '700 16px "Rubik"',
  '400 16px "IBM Plex Mono"',
  '600 16px "IBM Plex Mono"',
  '400 16px "Major Mono Display"',
];

/** Garante que todas as fontes estejam carregadas. Tolerante a falhas: se algo
 *  der errado, segue com o que tiver (melhor que travar a inicialização). */
export async function loadFonts(): Promise<void> {
  try {
    await Promise.all(REQUIRED.map((spec) => document.fonts.load(spec)));
    await document.fonts.ready;
  } catch {
    // Sem fontes não é fatal — o jogo ainda roda com o fallback do sistema.
  }
}
