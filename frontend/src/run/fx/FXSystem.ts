/*
 * FXSystem — sistema de partículas reutilizável de uma zona/run.
 *
 * Faz duas coisas:
 *   - Partículas "ambiente": esporos bioluminescentes que sobem sem parar, só
 *     para dar atmosfera ao cenário.
 *   - "Bursts": explosõezinhas pontuais de partículas (acerto, morte, coleta).
 *
 * Tudo usa um "pool" (lista de partículas reaproveitadas) com limite fixo: nada
 * é criado/destruído durante o jogo, o que mantém a performance estável.
 */
import { Container, Graphics } from 'pixi.js';

/** Uma partícula. v = velocidade (vx, vy); life/maxLife controlam o tempo de
 *  vida; ambient diferencia esporos de atmosfera dos bursts; active diz se a
 *  partícula está em uso (ocupando uma vaga do pool). */
interface Particle {
  g: Graphics;
  x: number; y: number;
  vx: number; vy: number;
  life: number; maxLife: number;
  size: number;
  drift: number;
  ambient: boolean;
  active: boolean;
}

/** Opções de um burst (todas opcionais, com padrões sensatos). */
export interface BurstOpts {
  count?: number;
  color?: number;
  speed?: number;
  life?: number;
  size?: number;
  spread?: number; // direção (em radianos) para bursts direcionais; omitido = radial (todas as direções)
  gravity?: number;
}

/** Sistema de partículas genérico, reaproveitado por todas as zonas. Barato:
 *  pool fixo, sem texturas. Veja o bloco no topo do arquivo. */
export class FXSystem {
  private layer = new Container();
  private pool: Particle[] = [];
  private bounds: { w: number; h: number };
  private ambientCount: number;
  private ambientColor: number;

  constructor(parent: Container, bounds: { w: number; h: number }, opts: { ambient?: number; cap?: number; ambientColor?: number; zIndex?: number } = {}) {
    this.bounds = bounds;
    this.ambientCount = opts.ambient ?? 0;
    this.ambientColor = opts.ambientColor ?? 0x6bffb0;
    if (opts.zIndex !== undefined) this.layer.zIndex = opts.zIndex;
    parent.addChild(this.layer);
    // Pré-cria o pool inteiro de partículas (todas invisíveis e inativas). Elas
    // serão "ligadas" sob demanda — nunca criamos partículas novas em jogo.
    const cap = opts.cap ?? 320;
    for (let i = 0; i < cap; i++) {
      const g = new Graphics();
      g.visible = false;
      this.layer.addChild(g);
      this.pool.push({ g, x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 1, size: 2, drift: 0, ambient: false, active: false });
    }
    // Liga o campo inicial de esporos de atmosfera.
    for (let i = 0; i < this.ambientCount; i++) this.spawnAmbient(true);
  }

  /** Pega a primeira partícula livre do pool, ou null se todas estão em uso. */
  private take(): Particle | null {
    for (const p of this.pool) if (!p.active) return p;
    return null;
  }

  /** Pinta uma partícula: um círculo sólido com um halo suave maior em volta. */
  private paint(p: Particle, color: number, alpha: number): void {
    p.g.clear();
    p.g.circle(0, 0, p.size).fill({ color, alpha });
    p.g.circle(0, 0, p.size * 2.2).fill({ color, alpha: alpha * 0.25 });
  }

  /** Liga uma partícula de atmosfera. `initial=true` espalha pela tela toda
   *  (usado no começo); `false` faz nascer na base e subir (reposição contínua). */
  private spawnAmbient(initial = false): void {
    const p = this.take();
    if (!p) return;
    p.ambient = true;
    p.active = true;
    p.g.visible = true;
    p.x = Math.random() * this.bounds.w;
    p.y = initial ? Math.random() * this.bounds.h : this.bounds.h + 10;
    p.vx = (Math.random() - 0.5) * 8;
    p.vy = -6 - Math.random() * 12;
    p.drift = Math.random() * Math.PI * 2;
    p.size = 1 + Math.random() * 2.2;
    p.maxLife = 6 + Math.random() * 6;
    p.life = initial ? Math.random() * p.maxLife : 0;
    this.paint(p, this.ambientColor, 0.5);
  }

  /** Dispara uma explosão pontual de partículas numa posição do mundo. */
  burst(x: number, y: number, opts: BurstOpts = {}): void {
    const count = opts.count ?? 10;
    const color = opts.color ?? 0xffd070;
    const speed = opts.speed ?? 120;
    const life = opts.life ?? 0.5;
    const size = opts.size ?? 2.5;
    for (let i = 0; i < count; i++) {
      const p = this.take();
      if (!p) return; // pool esgotado: para por aqui
      // Direção: se "spread" foi dado, joga num cone em torno dele; senão, em
      // todas as direções (radial). O resto dá variação aleatória natural.
      const ang = opts.spread !== undefined
        ? opts.spread + (Math.random() - 0.5) * 1.0
        : Math.random() * Math.PI * 2;
      const sp = speed * (0.4 + Math.random() * 0.6);
      p.ambient = false;
      p.active = true;
      p.g.visible = true;
      p.x = x; p.y = y;
      p.vx = Math.cos(ang) * sp;
      p.vy = Math.sin(ang) * sp;
      p.drift = opts.gravity ?? 0;
      p.size = size * (0.6 + Math.random() * 0.8);
      p.maxLife = life * (0.7 + Math.random() * 0.6);
      p.life = 0;
      this.paint(p, color, 1);
    }
  }

  /** Avança todas as partículas ativas um frame. Esporos de atmosfera flutuam e
   *  cintilam (e renascem ao subir demais); partículas de burst desaceleram e
   *  desbotam até morrer. */
  update(dt: number): void {
    for (const p of this.pool) {
      if (!p.active) continue;
      p.life += dt;
      if (p.ambient) {
        // Movimento ondulante: soma um vai-e-vem horizontal (seno) à subida.
        p.drift += dt * 1.5;
        p.x += (p.vx + Math.sin(p.drift) * 6) * dt;
        p.y += p.vy * dt;
        p.g.alpha = 0.35 + 0.25 * Math.sin(p.drift * 3); // cintilação
        // Acabou a vida ou subiu além do topo: desliga e cria um substituto.
        if (p.life >= p.maxLife || p.y < -20) {
          p.active = false; p.g.visible = false;
          this.spawnAmbient(false);
          continue;
        }
      } else {
        p.vy += (p.drift || 0) * dt; // aqui "drift" funciona como gravidade
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= 0.92; p.vy *= 0.92; // atrito: desacelera a cada frame
        const t = p.life / p.maxLife;
        p.g.alpha = Math.max(0, 1 - t); // some linearmente
        if (p.life >= p.maxLife) { p.active = false; p.g.visible = false; continue; }
      }
      p.g.x = p.x; p.g.y = p.y;
    }
  }

  /** Libera o layer e zera o pool. Chamar ao sair da zona. */
  destroy(): void {
    this.layer.destroy({ children: true });
    this.pool = [];
  }
}
