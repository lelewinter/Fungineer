import { Container, FederatedPointerEvent, Graphics, Text } from 'pixi.js';
import { Color } from '../../core/Color';
import { FontFamily, TextColor } from '../../core/typography';
import { Signal } from '../../core/Signal';
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
  readonly powerTapped = new Signal<[]>();

  private timerLabel: Text;
  private waveLabel: Text;
  private powerLabel: Text;
  private powerButton: Container;
  private powerButtonBg: Graphics;
  private siegeIndicator: Text;
  private siegePulse = 0;
  private hpRows: HpRow[] = [];
  private hpStack: Container;
  private backpackSlots: Graphics[] = [];
  private xpBarBg = new Graphics();
  private xpBarFill = new Graphics();
  private xpLabel!: Text;
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

    // Top right: power button (clickable). Width grows with text.
    this.powerButton = new Container();
    this.powerButtonBg = new Graphics();
    this.powerButton.addChild(this.powerButtonBg);

    this.powerLabel = new Text({
      text: '',
      style: { fontFamily: FontFamily.body, fontSize: 11, fill: Color.hex(Color.rgb(0.72, 0.52, 1.0)), fontWeight: '600' },
    });
    this.powerLabel.anchor.set(1, 0.5);
    this.powerLabel.x = 0;
    this.powerLabel.y = 0;
    this.powerButton.addChild(this.powerLabel);

    this.powerButton.x = W - 12;
    this.powerButton.y = 20;
    this.powerButton.eventMode = 'static';
    this.powerButton.cursor = 'pointer';
    this.powerButton.on('pointertap', (e: FederatedPointerEvent) => {
      e.stopPropagation();
      this.powerTapped.emit();
    });
    this.addChild(this.powerButton);
    this.drawPowerButton(null);

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

    // Bottom right: backpack. Each slot is colour-coded by resource type so
    // the player can read at a glance "I have 2× scrap, 1× combustivel" etc.
    const cols = 6;
    const rows = Math.ceil(GameConfig.BACKPACK_CAPACITY / cols);
    const slotSize = 22;
    const slotGap = 3;
    const totalW = cols * slotSize + (cols - 1) * slotGap;
    const totalH = rows * slotSize + (rows - 1) * slotGap;
    const slotsX = W - totalW - 10;
    const slotsY = H - totalH - 10;
    const bpBg = new Graphics()
      .roundRect(slotsX - 7, slotsY - 7, totalW + 14, totalH + 14, 4)
      .fill({ color: 0x0a0e09, alpha: 0.85 })
      .stroke({ color: TextColor.amber, width: 1, alpha: 0.5 });
    this.addChild(bpBg);

    for (let i = 0; i < GameConfig.BACKPACK_CAPACITY; i++) {
      const r = Math.floor(i / cols);
      const c = i % cols;
      const slot = new Graphics();
      slot.x = slotsX + c * (slotSize + slotGap);
      slot.y = slotsY + r * (slotSize + slotGap);
      this.drawSlot(slot, slotSize, null);
      this.addChild(slot);
      this.backpackSlots.push(slot);
    }

    // XP bar — slim strip directly under the timer. Fills as the player
    // collects gems; resets and bumps the level number on each level-up.
    const xpBarW = 160;
    const xpBarH = 6;
    const xpBarX = W / 2 - xpBarW / 2;
    const xpBarY = 36;
    this.xpBarBg
      .roundRect(xpBarX, xpBarY, xpBarW, xpBarH, 3)
      .fill({ color: 0x0a0e09, alpha: 0.9 })
      .stroke({ color: 0x6dffba, width: 1, alpha: 0.55 });
    this.addChild(this.xpBarBg);
    this.addChild(this.xpBarFill);
    this.xpLabel = new Text({
      text: 'LV 1',
      style: { fontFamily: FontFamily.mono, fontSize: 9, fill: 0x6dffba, fontWeight: '700', letterSpacing: 1 },
    });
    this.xpLabel.anchor.set(0.5);
    this.xpLabel.x = W / 2;
    this.xpLabel.y = xpBarY + xpBarH + 6;
    this.addChild(this.xpLabel);
    this.drawXp(0, GameState.xp_to_next, GameState.level, xpBarX, xpBarY, xpBarW, xpBarH);

    this.disposers.push(GameState.waveStarted.connect((w) => this.onWaveStarted(w)));
    this.disposers.push(GameState.bossSpawned.connect(() => this.onBossSpawned()));
    this.disposers.push(GameState.backpackChanged.connect((c) => this.onBackpackChanged(c)));
    this.disposers.push(GameState.xpChanged.connect((cur, toNext, lvl) =>
      this.drawXp(cur, toNext, lvl, xpBarX, xpBarY, xpBarW, xpBarH)));
  }

  private drawXp(cur: number, toNext: number, lvl: number, x: number, y: number, w: number, h: number): void {
    const ratio = Math.max(0, Math.min(1, toNext > 0 ? cur / toNext : 0));
    this.xpBarFill.clear()
      .roundRect(x + 1, y + 1, (w - 2) * ratio, h - 2, 2)
      .fill({ color: 0x6dffba });
    this.xpLabel.text = `LV ${lvl}`;
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
    this.powerLabel.text = power ? power.power_name : '— sem poder —';
    this.drawPowerButton(power);
  }

  private drawPowerButton(power: PowerResource | null): void {
    const padding = 12;
    const w = this.powerLabel.width + padding * 2;
    const h = 22;
    this.powerButtonBg.clear();
    const color = power?.icon_color ?? 0x4a584b;
    const active = power?.is_active === true;
    const cd = (power?.cooldown_remaining ?? 0) > 0;
    this.powerButtonBg
      .roundRect(-w, -h / 2, w, h, 4)
      .fill({ color: active ? 0x2a1f3a : cd ? 0x101010 : 0x14181a, alpha: 0.95 })
      .roundRect(-w, -h / 2, w, h, 4)
      .stroke({ color, width: 1.5, alpha: power ? 0.9 : 0.4 });
  }

  update(dt: number): void {
    if (GameState.current_state === RunState.PLAYING || GameState.current_state === RunState.BOSS_FIGHT) {
      const t = Math.floor(GameState.run_time);
      const mm = Math.floor(t / 60).toString().padStart(2, '0');
      const ss = (t % 60).toString().padStart(2, '0');
      this.timerLabel.text = `${mm}:${ss}`;
    }

    // Power label with cooldown / status + power level
    const p = GameState.active_power as PowerResource | null;
    if (p) {
      const lv = p.level > 1 ? `  Lv.${p.level}` : '';
      if (p.cooldown_remaining > 0) {
        this.powerLabel.text = `${p.power_name}${lv} [${p.cooldown_remaining.toFixed(1)}s]`;
      } else if (p.is_active) {
        this.powerLabel.text = `${p.power_name}${lv} [ON]`;
      } else {
        this.powerLabel.text = `${p.power_name}${lv}  ▸ TAP`;
      }
      this.drawPowerButton(p);
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
      const content = i < contents.length ? contents[i]! : null;
      this.drawSlot(this.backpackSlots[i]!, 22, content);
    }
  }

  private static readonly SLOT_COLORS: Record<string, number> = {
    scrap:                  0xb8b3a6,
    ai_components:          0x4dc7b9,
    nucleo_logico:          0x6e9bff,
    combustivel_volatil:    0xff7a3a,
    sinais_controle:        0xa1ffaa,
    biomassa_adaptativa:    0xb573d8,
    fragmentos_estruturais: 0xe8c061,
  };

  private drawSlot(g: Graphics, size: number, content: string | null): void {
    g.clear();
    if (content) {
      const c = HUD.SLOT_COLORS[content] ?? 0xb8b3a6;
      g.roundRect(0, 0, size, size, 3)
        .fill({ color: c, alpha: 0.95 })
        .roundRect(2, 2, size - 4, size - 4, 2)
        .fill({ color: c, alpha: 0.35 })
        .roundRect(0, 0, size, size, 3)
        .stroke({ color: c, width: 1.5 });
    } else {
      g.roundRect(0, 0, size, size, 3)
        .fill({ color: 0x14181a, alpha: 0.9 })
        .stroke({ color: TextColor.faint, width: 1, alpha: 0.6 });
    }
  }
}
