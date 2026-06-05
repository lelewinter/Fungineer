/**
 * AssetLoader.ts — carregador e cache de imagens (texturas) do jogo.
 *
 * "Asset" e qualquer recurso externo do jogo (imagens, sons...). Aqui cuidamos
 * das imagens, chamadas de "texturas" quando viram material para o PixiJS
 * desenhar. Este modulo faz duas coisas:
 *   1) Traduz caminhos do estilo "res://..." (heranca da engine Godot) para a
 *      URL real onde o arquivo e servido na web ("/assets/...").
 *   2) Carrega e guarda em CACHE as texturas, para nao baixar a mesma imagem
 *      duas vezes.
 *
 * Exporta uma unica instancia pronta para uso: `assets`.
 */

import { Assets, type Texture } from 'pixi.js';

class AssetLoader {
  // Cache: caminho original -> textura ja carregada.
  private resolved = new Map<string, Texture>();

  /**
   * Converte um caminho de asset para a URL real do servidor.
   * Aceita varios formatos e normaliza todos para "/assets/...":
   *   - ja comeca com "http" ou "/"  -> usa como esta.
   *   - "res://assets/foo.png"        -> "/assets/foo.png" (estilo Godot).
   *   - "foo.png"                     -> "/assets/foo.png".
   */
  toUrl(path: string): string {
    if (path.startsWith('http')) return path;
    if (path.startsWith('/')) return path;
    if (path.startsWith('res://')) return '/assets/' + path.slice('res://assets/'.length);
    return '/assets/' + path;
  }

  /**
   * Carrega varias imagens de uma vez (util antes de abrir uma tela, para que
   * tudo ja esteja pronto). Ignora caminhos vazios e o marcador "__none__"
   * (usado quando um slot de imagem deve ficar sem nada).
   */
  async preload(paths: string[]): Promise<void> {
    const real = paths.filter((p) => p && p !== '__none__');
    if (real.length === 0) return;
    const urls = real.map((p) => this.toUrl(p));
    await Assets.load(urls);
  }

  /**
   * Carrega UMA textura, usando o cache quando possivel.
   * Se o arquivo nao existir / falhar, registra um aviso e devolve null em vez
   * de quebrar o jogo (quem chama decide o que fazer sem a imagem).
   */
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

/** Instancia unica e compartilhada do carregador de assets. */
export const assets = new AssetLoader();
