import { App } from './core/App';
import { sceneManager } from './core/SceneManager';
import { audioManager } from './core/AudioManager';
import { saveService } from './state/SaveService';
import { HubScene } from './scenes/hub/HubScene';

async function bootstrap(): Promise<void> {
  const host = document.getElementById('app');
  if (!host) throw new Error('#app host element missing');

  const app = await App.create(host);
  sceneManager.attach(app);
  audioManager.unlockOnFirstGesture();

  // Restore HubState before mounting the first scene, then start watching
  // for changes. Failures are non-fatal — defaults take over.
  const source = await saveService.load();
  console.info('[Fungineer] save loaded from:', source);
  saveService.arm();

  window.addEventListener('pagehide', () => { void saveService.flush(); });

  await sceneManager.replace(new HubScene());
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
