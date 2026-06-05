/*
 * BaseEnemy — o "molde" de qualquer inimigo da arena.
 *
 * O que faz: a cada frame o inimigo escolhe um alvo (o personagem mais perto),
 * caminha em direção a ele e, quando chega no alcance, ataca em intervalos
 * regulares. Também sabe tomar dano, mostrar a barra de vida e morrer.
 *
 * Como se encaixa no jogo: o WaveSpawner cria inimigos (definidos em Enemies.ts)
 * e os entrega ao RunWorld. Cada inimigo específico HERDA desta classe e muda
 * números e, às vezes, o jeito de mirar/se mover/atacar.
 */
import { Container, Graphics } from 'pixi.js';
import type { Vec2 } from '../core/types';
import { Color, type RGBA } from '../core/Color';
import { Signal } from '../core/Signal';
import type { BaseCharacter } from './BaseCharacter';
import type { RunWorld } from './RunWorld';
import { CombatSfx, spawnDamageNumber } from './fx/DamageNumbers';
import { GameState } from '../state/GameState';

/** Atributos que definem um inimigo (vindos do balanceamento). */
export interface EnemyStats {
  name: string;
  max_hp: number;
  move_speed: number;
  attack_damage: number;
  attack_interval: number;
  attack_range: number;
  color: RGBA;
  /** Elite = versão mais forte (mais vida/dano) e com cor/feedback diferentes. */
  is_elite?: boolean;
}

/** Classe-base de todo inimigo. Subclasses (Runner, Bruiser, Spitter, boss)
 *  herdam daqui e redefinem mira, movimento ou ataque conforme o necessário. */
export class BaseEnemy {
  // Atributos
  enemy_name: string;
  max_hp: number;
  move_speed: number;
  attack_damage: number;
  attack_interval: number;
  attack_range: number;
  color: RGBA;
  is_elite: boolean;

  // Estado durante a partida
  position: Vec2 = { x: 0, y: 0 };
  current_hp = 0;
  is_dead = false;
  protected attack_timer = 0;
  /** Personagem que este inimigo está perseguindo/atacando agora. */
  protected current_target: BaseCharacter | null = null;

  // Parte visual (Pixi)
  readonly node = new Container();
  protected visual = new Graphics();
  protected hpBarBg = new Graphics();
  protected hpBarFill = new Graphics();
  protected world: RunWorld | null = null;

  readonly died = new Signal<[BaseEnemy]>();

  constructor(stats: EnemyStats) {
    this.enemy_name = stats.name;
    this.max_hp = stats.max_hp;
    this.move_speed = stats.move_speed;
    this.attack_damage = stats.attack_damage;
    this.attack_interval = stats.attack_interval;
    this.attack_range = stats.attack_range;
    this.color = stats.color;
    this.is_elite = stats.is_elite ?? false;
    this.current_hp = this.max_hp;

    this.node.addChild(this.visual);
    this.node.addChild(this.hpBarBg);
    this.node.addChild(this.hpBarFill);
    this.buildVisual();
    this.updateHpBar();
  }

  protected buildVisual(): void {
    this.visual.clear();
    this.visual
      .roundRect(-12, -12, 24, 24, 3)
      .fill(Color.hex(this.color))
      .stroke({ color: 0x000000, alpha: 0.5, width: 1 });
  }

  setWorld(world: RunWorld): void {
    this.world = world;
  }

  /** Passo de simulação de um frame: mira, anda, ataca e atualiza o visual.
   *  dt = delta time (segundos desde o frame anterior). */
  update(dt: number, world: RunWorld): void {
    if (this.is_dead) return;
    this.findTarget(world);
    this.move(dt);
    this.tickAttack(dt);
    this.node.x = this.position.x;
    this.node.y = this.position.y;
    this.updateHpBar();
  }

  /** Escolhe o alvo. Padrão: o personagem mais próximo. Bruiser redefine. */
  protected findTarget(world: RunWorld): void {
    this.current_target = world.nearestCharacterTo(this.position);
  }

  /** Caminha em linha reta na direção do alvo. Multiplicar por dt mantém a
   *  velocidade constante independente da taxa de quadros. */
  protected move(dt: number): void {
    if (!this.current_target) return;
    const dx = this.current_target.position.x - this.position.x;
    const dy = this.current_target.position.y - this.position.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 0.001) return;
    // Normaliza a direção (divide pela distância) e já multiplica pela
    // velocidade — assim "inv" leva o passo direto à magnitude certa.
    const inv = this.move_speed / dist;
    this.position.x += dx * inv * dt;
    this.position.y += dy * inv * dt;
  }

  /** Conta o tempo e dispara um ataque quando o alvo está no alcance e o
   *  intervalo entre golpes já passou. */
  protected tickAttack(dt: number): void {
    if (!this.current_target) return;
    const dx = this.current_target.position.x - this.position.x;
    const dy = this.current_target.position.y - this.position.y;
    if (Math.hypot(dx, dy) > this.attack_range) return;
    this.attack_timer += dt;
    if (this.attack_timer >= this.attack_interval) {
      this.attack_timer = 0;
      this.attack(this.current_target);
    }
  }

  /** Aplica o ataque. Padrão: dano corpo-a-corpo. Spitter redefine p/ projétil. */
  protected attack(target: BaseCharacter): void {
    target.takeDamage(this.attack_damage, this);
  }

  /** Versão "take_damage" (snake_case) usada como alvo de reflexão de dano
   *  pelo poder Reflective Shell, que devolve dano à fonte que o atingiu. */
  take_damage(amount: number, _source: unknown): void {
    this.takeDamage(amount);
  }

  /** Recebe dano: subtrai da vida, mostra o número flutuante, toca o som e,
   *  se a vida zerar, morre. */
  takeDamage(amount: number, _source: BaseCharacter | null = null): void {
    if (this.is_dead) return;
    this.current_hp = Math.max(0, this.current_hp - amount);
    if (this.world) {
      const color = this.is_elite ? 0xffd966 : 0xffffff;
      spawnDamageNumber(this.world, this.position, amount, color);
    }
    GameState.damageDealt.emit(this as unknown as never, amount, { ...this.position });
    if (this.is_elite) CombatSfx.bossHit(0.3);
    else CombatSfx.hit(0.28);
    if (this.current_hp <= 0) this.die();
  }

  /** Morte: avisa o mundo, remove o node da tela e libera a memória do Pixi. */
  protected die(): void {
    this.is_dead = true;
    CombatSfx.death(this.is_elite ? 0.6 : 0.35);
    this.died.emit(this);
    if (this.world) this.world.removeEnemy(this);
    this.node.parent?.removeChild(this.node);
    this.node.destroy({ children: true });
  }

  /** Redesenha a barrinha de vida vermelha acima do inimigo. */
  protected updateHpBar(): void {
    const w = 26;
    const h = 3;
    const x = -w / 2;
    const y = -18;
    this.hpBarBg.clear()
      .rect(x, y, w, h)
      .fill({ color: 0x222222, alpha: 0.85 });
    const ratio = this.max_hp > 0 ? this.current_hp / this.max_hp : 0;
    this.hpBarFill.clear()
      .rect(x, y, w * ratio, h)
      .fill({ color: 0xe64d4d });
  }
}
