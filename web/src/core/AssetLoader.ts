import { Assets, type Texture } from 'pixi.js';

class AssetLoader {
  private resolved = new Map<string, Texture>();

  /** Resolve a `res://` style path to the served URL. */
  toUrl(path: string): string {
    if (path.startsWith('http')) return path;
    if (path.startsWith('/')) return path;
    if (path.startsWith('res://')) return '/assets/' + path.slice('res://assets/'.length);
    return '/assets/' + path;
  }

  async preload(paths: string[]): Promise<void> {
    const real = paths.filter((p) => p && p !== '__none__');
    if (real.length === 0) return;
    const urls = real.map((p) => this.toUrl(p));
    await Assets.load(urls);
  }

  async texture(path: string): Promise<Texture | null> {
    const cached = this.resolved.get(path);
    if (cached) return cached;
    try {
      const tex = await Assets.load<Texture>(this.toUrl(path));
      this.resolved.set(path, tex);
      return tex;
    } catch (err) {
      console.warn('[assets] failed', path, err);
      return null;
    }
  }
}

export const assets = new AssetLoader();
