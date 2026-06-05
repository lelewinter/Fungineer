/*
 * RunWorld — o "mundo" da partida: onde todas as entidades vivem.
 *
 * O que faz: guarda as listas de personagens, inimigos, itens e projéteis, e
 * organiza tudo em camadas (layers) visuais empilhadas na ordem certa (fundo →
 * itens → inimigos → party → efeitos). Também oferece "consultas espaciais"
 * (ex.: qual o inimigo mais próximo de um ponto?), que a IA usa para mirar.
 *
 * Como se encaixa: a cena da run cria um RunWorld, adiciona entidades nele e,
 * a cada frame, atualiza os projéteis. O container `root` é o que a câmera
 * move para seguir a party (estilo Camera2D).
 */
import { Container } from 'pixi.js';
import type { BaseCharacter } from './BaseCharacter';
import type { BaseEnemy } from './BaseEnemy';
import type { ResourceItem } from './ResourceItem';
import type { Projectile } from './Projectiles';
import type { Vec2 } from '../core/types';
import { Signal } from '../core/Signal';

/** Contêiner de todas as entidades de uma run. Guarda as transformações do
 *  mundo (coordenadas da arena) e oferece consultas espaciais. */
export class RunWorld {
  // Camadas visuais — a ordem em que são adicionadas define o que fica na frente.
  readonly root = new Container();
  readonly bgLayer = new Container();
  readonly itemsLayer = new Container();
  readonly extractionLayer = new Container();
  readonly enemiesLayer = new Container();
  readonly partyLayer = new Container();
  readonly fxLayer = new Container();

  characters: BaseCharacter[] = [];
  enemies: BaseEnemy[] = [];
  items: ResourceItem[] = [];
  projectiles: Projectile[] = [];
  readonly enemyAdded = new Signal<[BaseEnemy]>();

  constructor() {
    this.root.addChild(this.bgLayer);
    this.root.addChild(this.extractionLayer);
    this.root.addChild(this.itemsLayer);
    this.root.addChild(this.enemiesLayer);
    this.root.addChild(this.partyLayer);
    this.root.addChild(this.fxLayer);
  }

  addCharacter(c: BaseCharacter): void {
    this.characters.push(c);
    this.partyLayer.addChild(c.node);
  }

  removeCharacter(c: BaseCharacter): void {
    this.characters = this.characters.filter((x) => x !== c);
  }

  addEnemy(e: BaseEnemy): void {
    this.enemies.push(e);
    this.enemiesLayer.addChild(e.node);
    this.enemyAdded.emit(e);
  }

  removeEnemy(e: BaseEnemy): void {
    this.enemies = this.enemies.filter((x) => x !== e);
  }

  addItem(it: ResourceItem): void {
    this.items.push(it);
    this.itemsLayer.addChild(it.node);
  }

  removeItem(it: ResourceItem): void {
    this.items = this.items.filter((x) => x !== it);
  }

  addProjectile(p: Projectile): void {
    this.projectiles.push(p);
    this.fxLayer.addChild(p.node);
  }

  removeProjectile(p: Projectile): void {
    this.projectiles = this.projectiles.filter((x) => x !== p);
  }

  /** Atualiza todos os projéteis. Cada update() devolve true para "continuo
   *  vivo" ou false para "acabei" — neste caso o projétil é removido da tela e
   *  destruído. Reconstruímos a lista só com os que sobreviveram. */
  updateProjectiles(dt: number): void {
    const next: Projectile[] = [];
    for (const p of this.projectiles) {
      if (p.update(dt, this)) {
        next.push(p);
      } else {
        p.node.parent?.removeChild(p.node);
        p.node.destroy({ children: true });
      }
    }
    this.projectiles = next;
  }

  // ── Consultas espaciais ──────────────────────────────────────────────────
  /** Inimigo vivo mais próximo do ponto `p` dentro de um raio. Compara
   *  distâncias ao quadrado para evitar raízes quadradas (mais rápido). */
  nearestEnemyWithin(p: Vec2, radius: number): BaseEnemy | null {
    let best: BaseEnemy | null = null;
    let bestDist = radius * radius;
    for (const e of this.enemies) {
      if (e.is_dead) continue;
      const dx = e.position.x - p.x;
      const dy = e.position.y - p.y;
      const d2 = dx * dx + dy * dy;
      if (d2 <= bestDist) {
        bestDist = d2;
        best = e;
      }
    }
    return best;
  }

  /** Personagem vivo mais próximo do ponto `p` (sem limite de distância).
   *  Usado pelos inimigos para escolher quem perseguir. */
  nearestCharacterTo(p: Vec2): BaseCharacter | null {
    let best: BaseCharacter | null = null;
    let bestDist = Infinity;
    for (const c of this.characters) {
      if (c.is_dead) continue;
      const dx = c.position.x - p.x;
      const dy = c.position.y - p.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < bestDist) {
        bestDist = d2;
        best = c;
      }
    }
    return best;
  }

  /** Centro de massa (média das posições) dos personagens vivos. Usado, por
   *  exemplo, pelo poder Magnet Pulse para puxar inimigos em direção à party. */
  partyCentroid(): Vec2 {
    let sx = 0, sy = 0, n = 0;
    for (const c of this.characters) {
      if (c.is_dead) continue;
      sx += c.position.x;
      sy += c.position.y;
      n++;
    }
    if (n === 0) return { x: 0, y: 0 };
    return { x: sx / n, y: sy / n };
  }
}
