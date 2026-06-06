/**
 * CharacterSprite.ts — render de personagem animado a partir de frames soltos.
 *
 * É a primeira peça do "pipeline de arte": pega um pacote de sprites (frames PNG
 * organizados por animação e direção) e vira um personagem que anda, fica parado
 * e agacha, virado para o lado certo. Usa o AnimatedSprite do PixiJS (que avança
 * os quadros sozinho pelo ticker) e o modo de escala "nearest" para manter o
 * pixel-art nítido.
 *
 * Estrutura de arquivos esperada (ex.: Dr. Myco):
 *   /assets/art/char/myco/<anim>/<dir>/frame_000.png ...
 *   onde <anim> ∈ {idle, run, crouch} e <dir> ∈ {south, east, west}.
 *
 * O bloom/color-grade global (CinematicPipeline) já faz as partes brilhantes do
 * sprite (a espada azul, etc.) acenderem sozinhas — não precisa pintar glow.
 */

import { AnimatedSprite, Assets, Container, Texture } from 'pixi.js';

/** Direções que o pacote de sprites fornece (vista lateral). */
export type SpriteDir = 'south' | 'east' | 'west';

/** Uma animação: quantos quadros, a que velocidade, e se repete em loop. */
export interface AnimDef {
  frames: number;
  fps: number;
  loop: boolean;
}

/** "Ficha" de um personagem: onde estão os frames e como animá-los. */
export interface CharacterDesc {
  /** Pasta base (URL pública), ex.: '/assets/art/char/myco'. */
  base: string;
  /** Animações disponíveis por nome (idle/run/crouch...). */
  anims: Record<string, AnimDef>;
  /** Direções fornecidas pelo pacote. */
  dirs: SpriteDir[];
  /** Escala de desenho (frames são 68px; 0.5 ≈ 34px no jogo). */
  scale?: number;
  /** Âncora vertical (0.5 = centro; ~0.62 deixa os "pés" no ponto). */
  anchorY?: number;
}

const frameName = (i: number): string => `frame_${String(i).padStart(3, '0')}.png`;

export class CharacterSprite extends Container {
  private sprite?: AnimatedSprite;
  // textures[anim][dir] = lista de quadros já carregados.
  private readonly textures: Record<string, Partial<Record<SpriteDir, Texture[]>>> = {};
  private ready = false;
  private curAnim = '';
  private curDir: SpriteDir | '' = '';

  constructor(private readonly desc: CharacterDesc) {
    super();
    void this.load();
  }

  /** Carrega todos os frames descritos e monta o AnimatedSprite. */
  private async load(): Promise<void> {
    const urls: string[] = [];
    for (const [anim, def] of Object.entries(this.desc.anims)) {
      for (const dir of this.desc.dirs) {
        for (let i = 0; i < def.frames; i++) urls.push(`${this.desc.base}/${anim}/${dir}/${frameName(i)}`);
      }
    }
    const loaded = await Assets.load<Texture>(urls);
    if (this.destroyed) return;  // a cena pode ter saído enquanto carregava

    for (const [anim, def] of Object.entries(this.desc.anims)) {
      this.textures[anim] = {};
      for (const dir of this.desc.dirs) {
        const arr: Texture[] = [];
        for (let i = 0; i < def.frames; i++) {
          const tex = loaded[`${this.desc.base}/${anim}/${dir}/${frameName(i)}`];
          if (tex) {
            tex.source.scaleMode = 'nearest';  // pixel-art nítido
            arr.push(tex);
          }
        }
        this.textures[anim]![dir] = arr;
      }
    }

    const firstAnim = this.desc.anims['idle'] ? 'idle' : Object.keys(this.desc.anims)[0]!;
    this.sprite = new AnimatedSprite(this.textures[firstAnim]!['south'] ?? this.textures[firstAnim]![this.desc.dirs[0]!]!);
    this.sprite.anchor.set(0.5, this.desc.anchorY ?? 0.5);
    this.sprite.scale.set(this.desc.scale ?? 1);
    this.addChild(this.sprite);
    this.ready = true;
    this.play(firstAnim, 0);
  }

  /** Já carregou e está pronto para desenhar? (até lá fica invisível). */
  isReady(): boolean {
    return this.ready;
  }

  /** Define a animação atual e a direção, a partir do ângulo de facing (rad).
   *  Só troca os quadros quando algo muda, para não reiniciar a animação à toa. */
  play(anim: string, facing: number): void {
    if (!this.ready || !this.sprite) return;
    const dir = this.dirFromAngle(facing);
    if (anim === this.curAnim && dir === this.curDir) return;
    const frames = this.textures[anim]?.[dir];
    if (!frames || frames.length === 0) return;
    this.curAnim = anim;
    this.curDir = dir;
    const def = this.desc.anims[anim]!;
    this.sprite.textures = frames;
    this.sprite.animationSpeed = def.fps / 60;  // fps reais (ticker ~60Hz)
    this.sprite.loop = def.loop;
    this.sprite.gotoAndPlay(0);
  }

  /** Converte um ângulo em uma das direções disponíveis (vista lateral:
   *  esquerda/direita dominam; cima/baixo caem para 'south'). */
  private dirFromAngle(facing: number): SpriteDir {
    const dx = Math.cos(facing);
    const dy = Math.sin(facing);
    if (Math.abs(dx) >= Math.abs(dy)) return dx >= 0 ? 'east' : 'west';
    return 'south';
  }
}

/** Ficha do Dr. Myco (placeholder: mago-sapo com espada azul). */
export const MYCO_DESC: CharacterDesc = {
  base: '/assets/art/char/myco',
  anims: {
    idle: { frames: 6, fps: 8, loop: true },
    run: { frames: 4, fps: 12, loop: true },
    crouch: { frames: 5, fps: 10, loop: false },
  },
  dirs: ['south', 'east', 'west'],
  scale: 0.85,
  anchorY: 0.6,
};
