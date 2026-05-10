import { App } from './core/App';
import { sceneManager } from './core/SceneManager';
import { audioManager } from './core/AudioManager';
import { HubScene } from './scenes/hub/HubScene';

async function bootstrap(): Promise<void> {
  const host = document.getElementById('app');
  if (!host) throw new Error('#app host element missing');

  const app = await App.create(host);
  sceneManager.attach(app);
  audioManager.unlockOnFirstGesture();

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
