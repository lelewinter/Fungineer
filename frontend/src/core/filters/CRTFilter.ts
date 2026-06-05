/**
 * CRTFilter.ts — o efeito visual de "TV antiga" (monitor CRT) do jogo.
 *
 * Um "filter" (filtro / shader) e um programinha que roda na placa de video e
 * processa a imagem ja desenhada, pixel por pixel, antes de mostra-la. Este aqui
 * da a cara retro do jogo, aplicando varios efeitos sutis sobre a tela inteira:
 *   - leve curvatura (barrel distortion), como o vidro abaulado de uma TV antiga;
 *   - aberracao cromatica (as cores vermelho/azul levemente separadas);
 *   - scanlines (as linhas horizontais tipicas de monitores antigos);
 *   - uma barra de brilho que "rola" devagar pela tela;
 *   - vinheta (cantos um pouco mais escuros);
 *   - um tom mais quentinho e leve aumento de contraste.
 *
 * Ele e calibrado para a "viewport" logica de 480x854. O codigo GLSL abaixo
 * (linguagem dos shaders) e dividido em VERTEX (posiciona os pontos na tela) e
 * FRAGMENT (decide a cor de cada pixel) — onde ficam de fato os efeitos.
 */

import { Filter, GlProgram } from 'pixi.js';

// VERTEX SHADER: padrao do PixiJS para filtros de tela cheia. Apenas mapeia cada
// vertice para a posicao correta na tela e calcula a coordenada de textura. Nao
// precisa ser editado para mexer no visual — os efeitos ficam no FRAGMENT.
const VERTEX = /* glsl */ `
in vec2 aPosition;
out vec2 vTextureCoord;

uniform vec4 uInputSize;
uniform vec4 uOutputFrame;
uniform vec4 uOutputTexture;

vec4 filterVertexPosition() {
  vec2 position = aPosition * uOutputFrame.zw + uOutputFrame.xy;
  position.x = position.x * (2.0 / uOutputTexture.x) - 1.0;
  position.y = position.y * (2.0 * uOutputTexture.z / uOutputTexture.y) - uOutputTexture.z;
  return vec4(position, 0.0, 1.0);
}

vec2 filterTextureCoord() {
  return aPosition * (uOutputFrame.zw * uInputSize.zw);
}

void main(void) {
  gl_Position = filterVertexPosition();
  vTextureCoord = filterTextureCoord();
}
`;

// FRAGMENT SHADER: roda para CADA pixel da tela e decide sua cor final. Aqui
// moram, em sequencia, todos os efeitos do visual retro. As "uniforms" sao
// valores que o codigo TypeScript envia: uTime (relogio, anima a barra de
// brilho), uViewport (resolucao logica) e uIntensity (forca geral do efeito).
const FRAGMENT = /* glsl */ `
in vec2 vTextureCoord;

uniform sampler2D uTexture;
uniform float uTime;
uniform vec2 uViewport;
uniform float uIntensity;

void main(void) {
  vec2 uv = vTextureCoord;

  // Curvatura leve (os cantos curvam para dentro, como vidro de TV antiga).
  vec2 cc = uv - 0.5;
  float d = dot(cc, cc);
  uv = uv + cc * d * 0.05 * uIntensity;

  // Aberracao cromatica — separa os canais R e B horizontalmente.
  float ab = 0.0018 * uIntensity;
  float r = texture(uTexture, uv + vec2(ab, 0.0)).r;
  vec4 base = texture(uTexture, uv);
  float b = texture(uTexture, uv - vec2(ab, 0.0)).b;
  vec3 col = vec3(r, base.g, b);

  // Scanlines — onda senoidal baseada na resolucao Y escalada.
  float scan = sin(uv.y * uViewport.y * 1.6) * 0.03 * uIntensity;
  col -= scan;

  // Barra de brilho sutil rolando devagar pela tela (usa o tempo).
  float roll = sin((uv.y + uTime * 0.07) * 3.14159 * 2.0) * 0.010;
  col += roll;

  // Vinheta suave — leve o bastante para nao atrapalhar a leitura nas bordas.
  vec2 vc = (vTextureCoord - 0.5) * vec2(1.35, 1.0);
  float vig = 1.0 - dot(vc, vc) * 0.55;
  col *= mix(1.0, clamp(vig, 0.80, 1.0), uIntensity);

  // Tom mais quente + leve aumento de contraste.
  col.r *= 1.025;
  col.b *= 0.97;
  col = (col - 0.5) * 1.10 + 0.55;

  // Fora da moldura curvada -> preto (mantem os cantos limpos apos a curvatura).
  float mask = step(0.0, uv.x) * step(uv.x, 1.0) * step(0.0, uv.y) * step(uv.y, 1.0);
  col *= mask;

  finalColor = vec4(col, base.a);
}
`;

/** Opcoes de criacao do filtro CRT. */
export interface CRTOptions {
  /** Largura logica da viewport (em px). */
  viewportW: number;
  /** Altura logica da viewport (em px). */
  viewportH: number;
  /** Forca geral do efeito, de 0 (nenhum) a 1 (cheio). Padrao 1. */
  intensity?: number;
}

// Formato interno das "uniforms" que o shader recebe (atalho para os casts).
type CrtUniforms = { uTime: number; uIntensity: number };

export class CRTFilter extends Filter {
  // Momento de criacao, usado para calcular o tempo decorrido (anima a barra).
  private startTime = performance.now();

  constructor(opts: CRTOptions) {
    const glProgram = GlProgram.from({ vertex: VERTEX, fragment: FRAGMENT, name: 'crt-filter' });
    super({
      glProgram,
      resources: {
        crtUniforms: {
          uTime: { value: 0, type: 'f32' },
          uViewport: {
            value: new Float32Array([opts.viewportW, opts.viewportH]),
            type: 'vec2<f32>',
          },
          uIntensity: { value: opts.intensity ?? 1.0, type: 'f32' },
        },
      },
    });
  }

  /** Acesso tipado ao bloco de uniforms que enviamos ao shader. */
  private get uniforms(): CrtUniforms {
    return (this.resources['crtUniforms'] as unknown as { uniforms: CrtUniforms }).uniforms;
  }

  /** Atualiza os valores animados do shader. Chamar uma vez por frame. */
  tick(): void {
    this.uniforms.uTime = (performance.now() - this.startTime) / 1000;
  }

  /** Ajusta a forca geral do efeito (0 a 1) em tempo real. */
  setIntensity(v: number): void {
    this.uniforms.uIntensity = v;
  }
}
