/**
 * main.ts — A "porta de entrada" do jogo no navegador.
 * ---------------------------------------------------
 * Em linguagem simples: este e o primeiro arquivo que roda quando a pagina
 * abre. Ele monta tudo na ordem certa (o "bootstrap" = dar a partida):
 *
 *   1. acha o elemento #app na pagina onde o jogo sera desenhado;
 *   2. cria o motor grafico (App) e o gerenciador de cenas (SceneManager);
 *   3. liga o som (audio) e prepara para destrava-lo no primeiro toque/clique
 *      do jogador (navegadores exigem um gesto antes de tocar som);
 *   4. carrega o progresso salvo e passa a salvar automaticamente as mudancas;
 *   5. mostra a primeira tela (StartScene);
 *   6. registra o service worker (PWA) por ultimo, ja com a tela montada.
 *
 * Se qualquer passo falhar, mostramos o erro na propria tela em vez de deixar
 * o jogo numa pagina em branco e silenciosa.
 */

import { App } from './core/App';
import { sceneManager } from './core/SceneManager';
import { audioManager } from './core/AudioManager';
import { audioSettings } from './state/AudioSettings';
import { saveService } from './state/SaveService';
import { StoryProgress } from './state/StoryProgress';
import { StartScene } from './scenes/StartScene';
import { registerSW } from './pwa/registerSW';

async function bootstrap(): Promise<void> {
  const host = document.getElementById('app');
  if (!host) throw new Error('#app host element missing');

  const app = await App.create(host);
  sceneManager.attach(app);
  audioSettings.init();
  audioManager.unlockOnFirstGesture();

  // Restore HubState before mounting the first scene, then start watching
  // for changes. Failures are non-fatal — defaults take over.
  const source = await saveService.load();
  // Reconstrói as salas destravadas a partir dos resgates (cura saves antigos).
  StoryProgress.reconcileUnlocks();
  console.info('[Fungineer] save loaded from:', source);
  saveService.arm();

  window.addEventListener('pagehide', () => { void saveService.flush(); });

  await sceneManager.replace(new StartScene());

  // PWA registration runs AFTER the hub is mounted, so the update banner
  // (a DOM overlay) attaches to a fully-built #ui-overlay and never races
  // the bootstrap. Failures inside registerSW are swallowed there.
  registerSW();
}

bootstrap().catch((err: unknown) => {
  console.error('[Fungineer] bootstrap failed', err);
  const host = document.getElementById('app');
  if (host) {
    host.textContent = String(err);
    host.style.color = '#ff8080';
    host.style.padding = '20px';
  }
});
