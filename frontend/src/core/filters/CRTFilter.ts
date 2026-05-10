import { Filter, GlProgram } from 'pixi.js';

/** CRT-ish post-process: subtle chromatic aberration, scanlines, vignette,
 *  warm temperature shift. Sized for the 480×854 logical viewport. */

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

const FRAGMENT = /* glsl */ `
in vec2 vTextureCoord;

uniform sampler2D uTexture;
uniform float uTime;
uniform vec2 uViewport;
uniform float uIntensity;

out vec4 fragColor;

void main(void) {
  vec2 uv = vTextureCoord;

  // Mild barrel distortion (the corners curve in slightly).
  vec2 cc = uv - 0.5;
  float d = dot(cc, cc);
  uv = uv + cc * d * 0.05 * uIntensity;

  // Chromatic aberration — split RGB channels horizontally.
  float ab = 0.0018 * uIntensity;
  float r = texture(uTexture, uv + vec2(ab, 0.0)).r;
  vec4 base = texture(uTexture, uv);
  float b = texture(uTexture, uv - vec2(ab, 0.0)).b;
  vec3 col = vec3(r, base.g, b);

  // Scanlines — sin wave keyed off scaled Y resolution.
  float scan = sin(uv.y * uViewport.y * 1.6) * 0.05 * uIntensity;
  col -= scan;

  // Subtle rolling brightness bar.
  float roll = sin((uv.y + uTime * 0.07) * 3.14159 * 2.0) * 0.012;
  col += roll;

  // Soft vignette.
  vec2 vc = (vTextureCoord - 0.5) * vec2(1.55, 1.0);
  float vig = 1.0 - dot(vc, vc) * 0.85;
  col *= clamp(vig, 0.35, 1.0);

  // Warm tint + mild contrast lift.
  col.r *= 1.025;
  col.b *= 0.97;
  col = (col - 0.5) * 1.04 + 0.5;

  // Outside the curved frame → black (keeps corners clean after distortion).
  float mask = step(0.0, uv.x) * step(uv.x, 1.0) * step(0.0, uv.y) * step(uv.y, 1.0);
  col *= mask;

  fragColor = vec4(col, base.a);
}
`;

export interface CRTOptions {
  viewportW: number;
  viewportH: number;
  intensity?: number;
}

export class CRTFilter extends Filter {
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

  /** Update animated uniforms. Call once per frame. */
  tick(): void {
    const uniforms = (this.resources['crtUniforms'] as unknown as {
      uniforms: { uTime: number };
    }).uniforms;
    uniforms.uTime = (performance.now() - this.startTime) / 1000;
  }

  setIntensity(v: number): void {
    const uniforms = (this.resources['crtUniforms'] as unknown as {
      uniforms: { uIntensity: number };
    }).uniforms;
    uniforms.uIntensity = v;
  }
}
