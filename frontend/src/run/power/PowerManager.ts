/*
 * PowerManager — o gerenciador do "poder" ativo do jogador.
 *
 * Cada run tem UM poder equipado (definidos em Powers.ts). Este arquivo traz:
 *   - PowerResource: a classe-base de todo poder, com os "ganchos" que as
 *     subclasses redefinem (ao ativar, ao desativar, a cada frame, ao tomar dano).
 *   - PowerManager: guarda o poder atual, encaminha ativação/desativação e roda
 *     o tick por frame; também aplica o efeito de "imã" (Magnet Pulse).
 *
 * Os poderes funcionam mexendo em multiplicadores globais do GameState (dano,
 * velocidade de ataque, dano recebido), que o resto do jogo consulta.
 */
import type { BaseCharacter } from '../BaseCharacter';
import type { RunWorld } from '../RunWorld';
import { GameState } from '../../state/GameState';
import { GameConfig } from '../../state/GameConfig';
import { Signal } from '../../core/Signal';

/** Classe-base de todo poder. As subclasses redefinem os ganchos abaixo. */
export class PowerResource {
  power_name = 'Power';
  description = '';
  cooldown = 0.0;            // tempo de recarga após usar (segundos)
  duration = 0.0;            // quanto o efeito dura (segundos)
  icon_color = 0xffffff;
  is_active = false;
  cooldown_remaining = 0.0;  // recarga restante
  duration_remaining = 0.0;  // duração restante
  hasMagnetPull = false;     // se true, o manager puxa inimigos enquanto ativo

  /** Chamado quando o jogador ATIVA o poder. */
  onActivate(_party: BaseCharacter[], _world: RunWorld): void {}

  /** Chamado quando o poder DESATIVA (fim da duração ou desligado manualmente). */
  onDeactivate(_party: BaseCharacter[], _world: RunWorld): void {}

  /** Roda a cada frame, enquanto ativo ou em recarga. */
  process(_dt: number, _party: BaseCharacter[], _world: RunWorld): void {}

  /** Chamado quando a party toma dano (usado pelo Reflective Shell). */
  onDamageReceived(_amount: number, _source: { take_damage?: (amount: number, src: unknown) => void } | null): void {}

  /** Pode ativar? Só se não estiver em recarga nem já ativo. */
  canActivate(): boolean {
    return this.cooldown_remaining <= 0 && !this.is_active;
  }
}

/** Guarda o poder ativo e encaminha ativação e os ticks por frame. */
export class PowerManager {
  readonly powerActivated = new Signal<[PowerResource]>();
  readonly powerDeactivated = new Signal<[PowerResource]>();

  active_power: PowerResource | null = null;
  private world: RunWorld;

  constructor(world: RunWorld) {
    this.world = world;
  }

  /** Equipa um poder. Desativa o anterior e zera os multiplicadores globais
   *  para o novo começar "limpo". */
  setPower(power: PowerResource): void {
    if (this.active_power) this.deactivateCurrent();
    this.active_power = power;
    GameState.active_power = power;
    GameState.power_damage_multiplier = 1;
    GameState.power_attack_speed_multiplier = 1;
    GameState.power_damage_taken_multiplier = 1;
  }

  /** Ativa o poder atual, se for possível agora. */
  activate(): void {
    if (!this.active_power || !this.active_power.canActivate()) return;
    this.active_power.onActivate(this.world.characters, this.world);
    this.powerActivated.emit(this.active_power);
  }

  /** Liga/desliga o poder (para poderes do tipo alternável). */
  toggle(): void {
    if (!this.active_power) return;
    if (this.active_power.is_active) this.deactivateCurrent();
    else this.activate();
  }

  private deactivateCurrent(): void {
    if (!this.active_power) return;
    this.active_power.onDeactivate(this.world.characters, this.world);
    this.powerDeactivated.emit(this.active_power);
  }

  /** Roda todo frame: só processa o poder durante o jogo de fato. */
  update(dt: number): void {
    const p = this.active_power;
    if (!p) return;
    const s = GameState.current_state;
    if (s !== 'PLAYING' && s !== 'BOSS_FIGHT') return;
    p.process(dt, this.world.characters, this.world);

    if (p.hasMagnetPull && p.is_active) this.processMagnetPull(dt);
  }

  /** Efeito "imã": puxa os inimigos comuns (não-elites) em direção ao centro
   *  da party enquanto o poder estiver ativo. */
  private processMagnetPull(dt: number): void {
    const centroid = this.world.partyCentroid();
    for (const enemy of this.world.enemies) {
      if (enemy.is_dead || enemy.is_elite) continue;
      const dx = centroid.x - enemy.position.x;
      const dy = centroid.y - enemy.position.y;
      const dist = Math.hypot(dx, dy);
      if (dist <= GameConfig.MAGNET_PULSE_RADIUS && dist > 0.001) {
        const inv = 1 / dist;
        enemy.position.x += dx * inv * 60 * dt;
        enemy.position.y += dy * inv * 60 * dt;
      }
    }
  }
}

