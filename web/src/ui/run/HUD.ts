import { Container, Graphics, Text } from 'pixi.js';
import { Color } from '../../core/Color';
import { FontFamily, TextColor } from '../../core/typography';
import { GameConfig } from '../../state/GameConfig';
import { GameState, RunState } from '../../state/GameState';
import type { BaseCharacter } from '../../run/BaseCharacter';
import type { PowerResource } from '../../run/power/PowerManager';

interface HpRow {
  container: Container;
  bg: Graphics;
  fill: Graphics;
  label: Text;
  character: BaseCharacter;
  dispose: () => void;
}

/** In-run overlay HUD. Lives at scene UI layer; reads GameState directly. */
export class HUD extends Container {
  private timerLabel: Text;
  private waveLabel: Text;
  private powerLabel: Text;
  private siegeIndicator: Text;
  private siegePulse = 0;
  private hpRows: HpRow[] = [];
  private hpStack: Container;
  private backpackSlots: Graphics[] = [];
  private disposers: Array<() => void> = [];

  constructor() {
    super();
    const W = GameConfig.VIEWPORT_WIDTH;
    const H = GameConfig.VIEWPORT_HEIGHT;

    // Top center: timer
    const timerBg = new Graphics()
      .roundRect(W / 2 - 46, 6, 92, 28, 4)
      .fill({ color: 0x0a0e09, alpha: 0.85 })
      .stroke({ color: TextColor.bio, width: 1, alpha: 0.6 });
    this.addChild(timerBg);

    this.timerLabel = new Text({
      text: '00:00',
      style: { fontFamily: FontFamily.mono, fontSize: 16, fill: TextColor.ink, fontWeight: '600', letterSpacing: 2 },
    });
    this.timerLabel.anchor.set(0.5);
    this.timerLabel.x = W / 2;
    this.timerLabel.y = 20;
    this.addChild(this.timerLabel);

    // Top left: wave
    const waveBg = new Graphics()
      .roundRect(6, 6, 148, 28, 4)
      .fill({ color: 0x0a0e09, alpha: 0.85 })
      .stroke({ color: TextColor.muted, width: 1, alpha: 0.5 });
    this.addChild(waveBg);

    this.waveLabel = new Text({
      text: 'Aguardando...',
      style: { fontFamily: FontFamily.body, fontSize: 11, fill: TextColor.muted, fontWeight: '600' },
    });
    this.waveLabel.x = 14;
    this.waveLabel.y = 13;
    this.addChild(this.waveLabel);

    // Top right: power
    this.powerLabel = new Text({
      text: '',
      style: { fontFamily: FontFamily.body, fontSize: 11, fill: Color.hex(Color.rgb(0.72, 0.52, 1.0)), fontWeight: '600' },
    });
    this.powerLabel.anchor.set(1, 0);
    this.powerLabel.x = W - 12;
    this.powerLabel.y = 14;
    this.addChild(this.powerLabel);

    // Bottom center: siege indicator
    this.siegeIndicator = new Text({
      text: '⚡ SIEGE MODE',
      style: { fontFamily: FontFamily.display, fontSize: 14, fill: 0xffd91a, letterSpacing: 3 },
    });
    this.siegeIndicator.anchor.set(0.5);
    this.siegeIndicator.x = W / 2;
    this.siegeIndicator.y = H - 52;
    this.siegeIndicator.alpha = 0;
    this.addChild(this.siegeIndicator);

    // Bottom left: HP rows container
    const hpBg = new Graphics()
      .roundRect(6, H - 132, 174, 124, 5)
      .fill({ color: 0x0a0e09, alpha: 0.85 })
      .stroke({ color: TextColor.muted, width: 1, alpha: 0.4 });
    this.addChild(hpBg);

    this.hpStack = new Container();
    this.hpStack.x = 14;
    this.hpStack.y = H - 124;
    this.addChild(this.hpStack);

    // Bottom right: backpack
    const slotSize = 30;
    const slotGap = 5;
    const totalW = GameConfig.BACKPACK_CAPACITY * slotSize + (GameConfig.BACKPACK_CAPACITY - 1) * slotGap;
    const slotsX = W - totalW - 10;
    const slotsY = H - slotSize - 10;
    const bpBg = new Graphics()
      .roundRect(slotsX - 9, slotsY - 9, totalW + 18, slotSize + 18, 5)
      .fill({ color: 0x0a0e09, alpha: 0.85 })
      .stroke({ color: TextColor.amber, width: 1, alpha: 0.5 });
    this.addChild(bpBg);

    for (let i = 0; i < GameConfig.BACKPACK_CAPACITY; i++) {
      const slot = new Graphics();
      slot.x = slotsX + i * (slotSize + slotGap);
      slot.y = slotsY;
      this.drawSlot(slot, slotSize, false);
      this.addChild(slot);
      this.backpackSlots.push(slot);
    }

    this.disposers.push(GameState.waveStarted.connect((w) => this.onWaveStarted(w)));
    this.disposers.push(GameState.bossSpawned.connect(() => this.onBossSpawned()));
    this.disposers.push(GameState.backpackChanged.connect((c) => this.onBackpackChanged(c)));
  }

  registerCharacter(character: BaseCharacter): void {
    const W = 158;
    const rowH = 22;
    const y = this.hpRows.length * (rowH + 4);
    const container = new Container();
    container.y = y;

    const label = new Text({
      text: character.character_name.substring(0, 4).toUpperCase(),
      style: { fontFamily: FontFamily.mono, fontSize: 10, fill: Color.hex(character.color), fontWeight: '700' },
    });
    label.y = 4;
    container.addChild(label);

    const barX = 42;
    const barW = W - barX;
    const bg = new Graphics().roundRect(barX, 4, barW, rowH - 4, 3).fill({ color: 0x222822, alpha: 0.85 });
    const fill = new Graphics();
    container.addChild(bg);
    container.addChild(fill);

    this.hpStack.addChild(container);

    const update = (_c: BaseCharacter, newHp: number, maxHp: number): void => {
      const ratio = Math.max(0, Math.min(1, newHp / maxHp));
      const c = ratio > 0.4 ? 0x33e64d : ratio > 0.2 ? 0xe6c233 : 0xe64d33;
      fill.clear().roundRect(barX, 4, barW * ratio, rowH - 4, 3).fill({ color: c });
    };
    update(character, character.current_hp, character.max_hp);

    const offHp = character.hpChanged.connect(update);
    const offDead = character.died.connect(() => {
      container.alpha = 0.35;
    });

    this.hpRows.push({
      container,
      bg,
      fill,
      label,
      character,
      dispose: () => { offHp(); offDead(); },
    });
  }

  setPowerDisplay(power: PowerResource | null): void {
    this.powerLabel.text = power ? power.power_name : '';
  }

  update(dt: number): void {
    if (GameState.current_state === RunState.PLAYING || GameState.current_state === RunState.BOSS_FIGHT) {
      const t = Math.floor(GameState.run_time);
      const mm = Math.floor(t / 60).toString().padStart(2, '0');
      const ss = (t % 60).toString().padStart(2, '0');
      this.timerLabel.text = `${mm}:${ss}`;
    }

    // Power label with cooldown / status
    const p = GameState.active_power as PowerResource | null;
    if (p) {
      if (p.cooldown_remaining > 0) {
        this.powerLabel.text = `${p.power_name} [${p.cooldown_remaining.toFixed(1)}s]`;
      } else if (p.is_active) {
        this.powerLabel.text = `${p.power_name} [ON]`;
      } else {
        this.powerLabel.text = p.power_name;
      }
    }

    // Siege indicator
    if (p?.power_name === 'Siege Mode') {
      const target = GameState.siege_mode_active ? 1 : 0;
      this.siegePulse += dt;
      const targetAlpha = target * (0.85 + 0.15 * Math.sin(this.siegePulse * 6));
      this.siegeIndicator.alpha += (targetAlpha - this.siegeIndicator.alpha) * Math.min(1, dt * 8);
    } else {
      this.siegeIndicator.alpha *= 0.9;
    }
  }

  destroyHud(): void {
    for (const d of this.disposers) d();
    for (const r of this.hpRows) r.dispose();
    this.destroy({ children: true });
  }

  private onWaveStarted(index: number): void {
    this.waveLabel.text = `Onda ${index}`;
    this.waveLabel.style.fill = Color.hex(Color.rgb(0.86, 0.80, 0.96));
  }

  private onBossSpawned(): void {
    this.waveLabel.text = '⚠  BOSS';
    this.waveLabel.style.fill = 0xff3845;
    this.waveLabel.style.fontSize = 13;
  }

  private onBackpackChanged(contents: string[]): void {
    for (let i = 0; i < this.backpackSlots.length; i++) {
      this.drawSlot(this.backpackSlots[i]!, 30, i < contents.length);
    }
  }

  private drawSlot(g: Graphics, size: number, filled: boolean): void {
    g.clear();
    if (filled) {
      g.roundRect(0, 0, size, size, 4)
        .fill({ color: Color.hex(Color.rgb(0.65, 0.45, 0.18)), alpha: 0.9 })
        .stroke({ color: TextColor.amber, width: 1.5 });
    } else {
      g.roundRect(0, 0, size, size, 4)
        .fill({ color: 0x14181a, alpha: 0.9 })
        .stroke({ color: TextColor.faint, width: 1, alpha: 0.6 });
    }
  }
}
