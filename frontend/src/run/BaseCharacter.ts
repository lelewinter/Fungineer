/*
 * BaseCharacter — o "molde" de qualquer herói jogável da party.
 *
 * O que faz: guarda os atributos (vida, dano, alcance, velocidade de ataque),
 * desenha o quadradinho do personagem com a barra de vida e roda a lógica de
 * combate a cada frame (procurar inimigo, atacar no ritmo certo, tomar dano,
 * curar, morrer). Cada herói específico (Guardian, Striker, Medic, Artificer,
 * em Characters.ts) HERDA desta classe e só troca os números e alguns
 * comportamentos pontuais.
 *
 * Como se encaixa no jogo: a Party posiciona vários BaseCharacter em formação;
 * o RunWorld guarda todos eles e responde a perguntas tipo "qual o inimigo mais
 * perto?". A cada frame o jogo chama update() em cada personagem.
 */
import { Container, Graphics } from 'pixi.js';
import type { Vec2 } from '../core/types';
import { Color, type RGBA } from '../core/Color';
import { Signal } from '../core/Signal';
import { GameState } from '../state/GameState';
import type { BaseEnemy } from './BaseEnemy';
import type { RunWorld } from './RunWorld';
import { CombatSfx, spawnDamageNumber } from './fx/DamageNumbers';

/** Conjunto de atributos que define um personagem (vindo do balanceamento). */
export interface CharacterStats {
  name: string;
  max_hp: number;
  attack_damage: number;
  attack_range: number;
  attack_speed: number;
  color: RGBA;
}

/** Classe-base de todo personagem jogável. As subclasses trocam os atributos
 *  e, quando precisam, redefinem ganchos opcionais de combate (reduzir dano,
 *  visual do ataque etc.). */
export class BaseCharacter {
  // Atributos (copiados de CharacterStats no construtor)
  character_name: string;
  max_hp: number;
  attack_damage: number;
  attack_range: number;
  attack_speed: number;
  color: RGBA;

  // Estado durante a partida
  position: Vec2 = { x: 0, y: 0 };
  current_hp = 0;
  is_dead = false;
  /** Tempo acumulado desde o último ataque; quando passa do intervalo, ataca. */
  protected attack_timer = 0;
  current_target: BaseEnemy | null = null;
  /** Intangível = não toma dano (usado pelo poder Ghost Drive). */
  private intangible = false;
  world: RunWorld | null = null;

  // Parte visual (Pixi): o "node" é o container que vai pra tela
  readonly node = new Container();
  protected visual = new Graphics();
  protected hpBarBg = new Graphics();
  protected hpBarFill = new Graphics();

  // Signals = avisos que o personagem dispara para quem estiver ouvindo
  // (ex.: a HUD ouve hpChanged para atualizar a barra de vida).
  readonly died = new Signal<[BaseCharacter]>();
  readonly hpChanged = new Signal<[BaseCharacter, number, number]>();
  readonly attacked = new Signal<[BaseEnemy, number]>();

  constructor(stats: CharacterStats) {
    this.character_name = stats.name;
    this.max_hp = stats.max_hp;
    this.attack_damage = stats.attack_damage;
    this.attack_range = stats.attack_range;
    this.attack_speed = stats.attack_speed;
    this.color = stats.color;
    this.current_hp = this.max_hp;

    this.node.addChild(this.visual);
    this.node.addChild(this.hpBarBg);
    this.node.addChild(this.hpBarFill);
    this.buildVisual();
    this.updateHpBar();
  }

  /** Desenha o corpo do personagem. Padrão: um quadrado colorido de 28×28
   *  com cantos arredondados. Subclasses podem redefinir para outro visual. */
  protected buildVisual(): void {
    this.visual.clear();
    this.visual
      .roundRect(-14, -14, 28, 28, 4)
      .fill(Color.hex(this.color))
      .roundRect(-14, -14, 28, 28, 4)
      .stroke({ color: 0x000000, alpha: 0.5, width: 1 });
  }

  /** Reduz o dano que está prestes a ser recebido. O padrão não reduz nada;
   *  o Guardian redefine para "blindar" a party. */
  protected applyDamageReduction(amount: number): number {
    return amount;
  }

  /** Executa o ataque em si. O padrão é dano corpo-a-corpo instantâneo;
   *  Striker e Artificer redefinem para disparar projéteis. */
  protected onAttack(target: BaseEnemy, damage: number, world: RunWorld): void {
    target.takeDamage(damage, this);
    this.attacked.emit(target, damage);
    void world;
  }

  /** Gancho opcional rodado todo frame (ex.: o Medic usa para curar aliados). */
  protected onTick(_dt: number, _world: RunWorld): void {}

  /** Passo de simulação de um frame. dt = delta time (segundos desde o frame
   *  anterior); multiplicar tudo por dt deixa o jogo na mesma velocidade
   *  independente da taxa de quadros. */
  update(dt: number, world: RunWorld): void {
    if (this.is_dead) return;
    this.attack_timer += dt;
    // Velocidade de ataque efetiva = base × bônus de poderes ativos.
    // O intervalo entre ataques é o inverso da velocidade (2 ataques/s = 0,5s).
    const effSpeed = this.attack_speed * GameState.power_attack_speed_multiplier;
    if (effSpeed > 0 && this.attack_timer >= 1 / effSpeed) {
      this.attack_timer = 0;
      this.tryAttack(world);
    }
    this.onTick(dt, world);
    // Sincroniza a posição lógica com a posição visual na tela.
    this.node.x = this.position.x;
    this.node.y = this.position.y;
    this.updateHpBar();
  }

  /** Procura o inimigo mais próximo dentro do alcance e o ataca, se houver. */
  protected tryAttack(world: RunWorld): void {
    const target = world.nearestEnemyWithin(this.position, this.attack_range);
    this.current_target = target;
    if (!target) return;
    const effDamage = this.attack_damage * GameState.power_damage_multiplier;
    this.onAttack(target, effDamage, world);
  }

  /** Recebe dano de um inimigo. Aplica, nesta ordem: multiplicadores de poder,
   *  redução de dano da subclasse, gancho do poder ativo (ex.: Reflective Shell
   *  devolve parte do dano), e por fim subtrai da vida. */
  takeDamage(amount: number, source: { take_damage?: (amount: number, src: unknown) => void } | null = null): void {
    if (this.is_dead || this.intangible) return;
    let effective = amount * GameState.power_damage_taken_multiplier;
    effective = this.applyDamageReduction(effective);
    // Avisa o poder ativo que tomamos dano (pode reagir, ex.: refletir).
    const ap = GameState.active_power as { onDamageReceived?: (a: number, s: unknown) => void } | null;
    ap?.onDamageReceived?.(effective, source);
    this.current_hp = Math.max(0, this.current_hp - effective);
    this.hpChanged.emit(this, this.current_hp, this.max_hp);
    GameState.damageDealt.emit(this as unknown as never, effective, { ...this.position });
    // Número de dano flutuante em vermelho-claro (dano recebido pela party).
    if (this.world) spawnDamageNumber(this.world, this.position, effective, 0xff7a7a);
    CombatSfx.partyHit();
    if (this.current_hp <= 0) this.die();
  }

  /** Recupera vida, sem ultrapassar o máximo. */
  heal(amount: number): void {
    if (this.is_dead) return;
    this.current_hp = Math.min(this.max_hp, this.current_hp + amount);
    this.hpChanged.emit(this, this.current_hp, this.max_hp);
  }

  /** Liga/desliga a intangibilidade (deixa o personagem semi-transparente). */
  setIntangible(v: boolean): void {
    this.intangible = v;
    this.node.alpha = v ? 0.5 : 1.0;
  }

  /** Marca o personagem como morto, some com ele e avisa o resto do jogo. */
  protected die(): void {
    this.is_dead = true;
    this.node.visible = false;
    this.died.emit(this);
    GameState.registerCharacterDeath(this as unknown as never);
  }

  /** Redesenha a barrinha de vida sobre a cabeça do personagem.
   *  A cor passa de verde → amarelo → vermelho conforme a vida cai. */
  protected updateHpBar(): void {
    const w = 30;
    const h = 4;
    const x = -w / 2;
    const y = -22;
    this.hpBarBg.clear()
      .rect(x, y, w, h)
      .fill({ color: 0x333333, alpha: 0.85 });
    const ratio = this.max_hp > 0 ? this.current_hp / this.max_hp : 0;
    const fillCol = ratio > 0.4 ? 0x33e64d : ratio > 0.2 ? 0xe6c233 : 0xe64d33;
    this.hpBarFill.clear()
      .rect(x, y, w * ratio, h)
      .fill({ color: fillCol });
  }
}

// Conecta um ouvinte vazio ao sinal global de "personagem morreu". Serve para
// garantir que o sinal exista/esteja inicializado; a lógica real virá quando o
// GameState evoluir além da fase atual.
GameState.characterDied.connect(() => undefined);
