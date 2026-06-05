/*
 * Projectiles — os projéteis disparados na arena.
 *
 * Todo projétil segue o mesmo "contrato" (a interface Projectile): tem um node
 * visual, uma posição, e um update(dt) que devolve true (continuo voando) ou
 * false (acabei — me destruam). O RunWorld cuida de chamar esse update e de
 * limpar os que acabaram.
 *
 * Tipos aqui:
 *   - StrikerBullet: bala reta da party que some no 1º inimigo atingido.
 *   - ArtificerProjectile: projétil lento teleguiado que explode em área.
 *   - SpitterProjectile: tiro reto do inimigo Spitter contra a party.
 *   - SentinelOrb: orbe lento do chefe que persegue um personagem.
 */
import { Container, Graphics } from 'pixi.js';
import { Color } from '../core/Color';
import { GameConfig } from '../state/GameConfig';
import type { BaseEnemy } from './BaseEnemy';
import type { BaseCharacter } from './BaseCharacter';
import type { RunWorld } from './RunWorld';
import type { Vec2 } from '../core/types';

/** Contrato comum a todo projétil (usado por RunWorld.projectiles).
 *  update() retorna true para "continuo vivo" e false para "fui consumido". */
export interface Projectile {
  readonly node: Container;
  position: Vec2;
  update(dt: number, world: RunWorld): boolean;
}

// ── Striker bullet — bala reta, some no primeiro acerto ──────────────────
/** Bala da party: voa em linha reta e desaparece ao atingir um inimigo ou
 *  quando seu tempo de vida acaba. */
export class StrikerBullet implements Projectile {
  static readonly SPEED = 350;
  readonly node = new Container();
  position: Vec2 = { x: 0, y: 0 };
  private dir: Vec2;
  private damage: number;
  private lifetime = 0.4;
  private g = new Graphics();

  constructor(origin: Vec2, dir: Vec2, damage: number) {
    this.position = { ...origin };
    this.dir = dir;
    this.damage = damage;
    this.g
      .rect(-4, -4, 8, 8)
      .fill({ color: Color.hex(Color.rgb(0.0, 0.9, 0.9)), alpha: 0.9 });
    this.node.addChild(this.g);
    this.node.x = origin.x;
    this.node.y = origin.y;
  }

  update(dt: number, world: RunWorld): boolean {
    // Conta o tempo de vida; ao acabar, o projétil se encerra.
    this.lifetime -= dt;
    if (this.lifetime <= 0) return false;

    // Avança em linha reta na direção já normalizada.
    this.position.x += this.dir.x * StrikerBullet.SPEED * dt;
    this.position.y += this.dir.y * StrikerBullet.SPEED * dt;
    this.node.x = this.position.x;
    this.node.y = this.position.y;

    // Checa colisão com qualquer inimigo (raio de 18px). Acertou um, causa dano
    // e se encerra (atinge só um alvo).
    for (const e of world.enemies) {
      if (e.is_dead) continue;
      const dx = e.position.x - this.position.x;
      const dy = e.position.y - this.position.y;
      if (dx * dx + dy * dy < 18 * 18) {
        e.takeDamage(this.damage, null);
        return false;
      }
    }
    return true;
  }
}

// ── Artificer projectile — teleguiado lento, explode em área ──────────────
/** Projétil da party que persegue um inimigo específico e, ao chegar perto,
 *  explode causando dano em todos os inimigos dentro do raio. */
export class ArtificerProjectile implements Projectile {
  static readonly SPEED = 90;
  readonly node = new Container();
  position: Vec2 = { x: 0, y: 0 };
  private target: BaseEnemy;
  private damage: number;
  private lifetime = 5.0;
  private g = new Graphics();

  constructor(origin: Vec2, target: BaseEnemy, damage: number) {
    this.position = { ...origin };
    this.target = target;
    this.damage = damage;
    this.g
      .circle(0, 0, 7)
      .fill({ color: Color.hex(Color.rgb(0.7, 0.2, 0.9)), alpha: 0.9 })
      .circle(0, 0, 5)
      .fill({ color: 0xffffff, alpha: 0.4 });
    this.node.addChild(this.g);
    this.node.x = origin.x;
    this.node.y = origin.y;
  }

  update(dt: number, world: RunWorld): boolean {
    this.lifetime -= dt;
    if (this.lifetime <= 0) return false;
    if (this.target.is_dead) return false; // alvo já morreu: projétil some

    const dx = this.target.position.x - this.position.x;
    const dy = this.target.position.y - this.position.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 20) {
      this.explode(world); // chegou perto o bastante: detona
      return false;
    }
    if (dist > 0.001) {
      // Persegue o alvo em velocidade fixa (direção normalizada × velocidade).
      const inv = 1 / dist;
      this.position.x += dx * inv * ArtificerProjectile.SPEED * dt;
      this.position.y += dy * inv * ArtificerProjectile.SPEED * dt;
      this.node.x = this.position.x;
      this.node.y = this.position.y;
    }
    return true;
  }

  /** Explosão em área: atinge todos os inimigos no raio. Se pegar 3 ou mais de
   *  uma vez, ganha um bônus de dano (recompensa acertar aglomerados). */
  private explode(world: RunWorld): void {
    const r = GameConfig.ARTIFICER_EXPLOSION_RADIUS;
    const hit: BaseEnemy[] = [];
    for (const e of world.enemies) {
      if (e.is_dead) continue;
      const dx = e.position.x - this.position.x;
      const dy = e.position.y - this.position.y;
      if (dx * dx + dy * dy <= r * r) hit.push(e);
    }
    const cluster = hit.length >= 3 ? 1 + GameConfig.ARTIFICER_CLUSTER_BONUS : 1;
    for (const e of hit) e.takeDamage(this.damage * cluster, null);

    // Efeito visual da explosão: um círculo que aparece e some em ~300ms.
    // Como é "fogo e esquece", animamos via requestAnimationFrame próprio em vez
    // do loop principal do jogo, e ao terminar removemos/destruímos o gráfico.
    const flash = new Graphics()
      .circle(this.position.x, this.position.y, r)
      .fill({ color: Color.hex(Color.rgb(0.9, 0.5, 1.0)), alpha: 0.6 });
    world.fxLayer.addChild(flash);
    const start = performance.now();
    const tick = (): void => {
      const t = Math.min(1, (performance.now() - start) / 300); // 0 → 1 ao longo de 300ms
      flash.alpha = 0.6 * (1 - t); // vai desaparecendo
      if (t < 1) {
        requestAnimationFrame(tick);
      } else {
        flash.parent?.removeChild(flash);
        flash.destroy();
      }
    };
    requestAnimationFrame(tick);
  }
}

// ── Spitter projectile — tiro reto do inimigo contra a party ──────────────
/** Projétil inimigo: voa reto e dá dano no primeiro personagem que atingir. */
export class SpitterProjectile implements Projectile {
  readonly node = new Container();
  position: Vec2 = { x: 0, y: 0 };
  private dir: Vec2;
  private damage: number;
  private lifetime = 3.0;
  private g = new Graphics();

  constructor(origin: Vec2, dir: Vec2, damage: number) {
    this.position = { ...origin };
    this.dir = dir;
    this.damage = damage;
    this.g
      .rect(-5, -5, 10, 10)
      .fill({ color: Color.hex(Color.rgb(1.0, 0.5, 0.1)), alpha: 0.85 });
    this.node.addChild(this.g);
    this.node.x = origin.x;
    this.node.y = origin.y;
  }

  update(dt: number, world: RunWorld): boolean {
    this.lifetime -= dt;
    if (this.lifetime <= 0) return false;
    this.position.x += this.dir.x * GameConfig.SPITTER_PROJECTILE_SPEED * dt;
    this.position.y += this.dir.y * GameConfig.SPITTER_PROJECTILE_SPEED * dt;
    this.node.x = this.position.x;
    this.node.y = this.position.y;
    for (const m of world.characters) {
      if (m.is_dead) continue;
      const dx = m.position.x - this.position.x;
      const dy = m.position.y - this.position.y;
      if (dx * dx + dy * dy < 20 * 20) {
        m.takeDamage(this.damage, null);
        return false;
      }
    }
    return true;
  }
}

// ── Sentinel orb — orbe lento teleguiado do chefe ────────────────────────
/** Orbe do chefe que persegue um personagem; se o alvo morre, troca para outro
 *  ainda vivo. Some ao atingir o alvo ou quando o tempo de vida acaba. */
export class SentinelOrb implements Projectile {
  readonly node = new Container();
  position: Vec2 = { x: 0, y: 0 };
  private target: BaseCharacter;
  private lifetime = 6.0;
  private g = new Graphics();

  constructor(origin: Vec2, target: BaseCharacter, _world: RunWorld) {
    this.position = { ...origin };
    this.target = target;
    this.g
      .circle(0, 0, 8)
      .fill({ color: Color.hex(Color.rgb(0.9, 0.9, 0.1)), alpha: 0.9 })
      .circle(0, 0, 5)
      .fill({ color: 0xffffff, alpha: 0.5 });
    this.node.addChild(this.g);
    this.node.x = origin.x;
    this.node.y = origin.y;
  }

  update(dt: number, world: RunWorld): boolean {
    this.lifetime -= dt;
    if (this.lifetime <= 0) return false;

    // Se o alvo morreu, procura outro personagem vivo para perseguir.
    if (this.target.is_dead) {
      let next: BaseCharacter | null = null;
      for (const m of world.characters) {
        if (!m.is_dead) { next = m; break; }
      }
      if (!next) return false; // ninguém vivo: o orbe se encerra
      this.target = next;
    }

    const dx = this.target.position.x - this.position.x;
    const dy = this.target.position.y - this.position.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 0.001) return false;
    const inv = 1 / dist;
    this.position.x += dx * inv * GameConfig.SENTINEL_ORB_SPEED * dt;
    this.position.y += dy * inv * GameConfig.SENTINEL_ORB_SPEED * dt;
    this.node.x = this.position.x;
    this.node.y = this.position.y;

    if (dist < 20) {
      this.target.takeDamage(GameConfig.SENTINEL_ORB_DAMAGE, null);
      return false;
    }
    return true;
  }
}
