import { Container, Graphics, Text } from 'pixi.js';
import { Scene } from '../../core/Scene';
import { Color } from '../../core/Color';
import { GameConfig } from '../../state/GameConfig';
import { sceneManager } from '../../core/SceneManager';
import { HubScene } from '../hub/HubScene';
import { PixiButton } from '../../ui/PixiButton';
import { type ZoneData } from '../../state/Zones';

/** Placeholder run scene used by Phases 1-6 — replaced by real run logic in
 *  Phases 4-7. Shows the zone banner and a button to return to the hub. */
export class StubRunScene extends Scene {
  private zone: ZoneData;
  private bg = new Graphics();
  private banner = new Container();

  constructor(zone: ZoneData) {
    super();
    this.zone = zone;
  }

  override async enter(): Promise<void> {
    const W = GameConfig.VIEWPORT_WIDTH;
    const H = GameConfig.VIEWPORT_HEIGHT;
    this.bg.rect(0, 0, W, H).fill(Color.hex(Color.rgb(0.05, 0.04, 0.06)));
    this.root.addChild(this.bg);

    // Accent banner
    const accentBg = new Graphics();
    accentBg
      .rect(0, H * 0.25, W, 110)
      .fill({ color: Color.hex(this.zone.accent_color), alpha: 0.18 });
    this.root.addChild(accentBg);

    const stripe = new Graphics();
    stripe
      .rect(0, H * 0.25, W, 4).fill(Color.hex(this.zone.accent_color))
      .rect(0, H * 0.25 + 106, W, 4).fill(Color.hex(this.zone.accent_color));
    this.root.addChild(stripe);

    const zoneTitle = new Text({
      text: this.zone.zone_name,
      style: {
        fontFamily: 'system-ui, sans-serif',
        fontSize: 32,
        fontWeight: '900',
        fill: Color.hex(this.zone.accent_color),
        letterSpacing: 4,
      },
    });
    zoneTitle.anchor.set(0.5);
    zoneTitle.x = W / 2;
    zoneTitle.y = H * 0.25 + 38;
    this.root.addChild(zoneTitle);

    const subtitle = new Text({
      text: this.zone.subtitle,
      style: {
        fontFamily: 'system-ui, sans-serif',
        fontSize: 12,
        fill: Color.hex(Color.rgb(0.85, 0.85, 0.85)),
      },
    });
    subtitle.anchor.set(0.5);
    subtitle.x = W / 2;
    subtitle.y = H * 0.25 + 70;
    this.root.addChild(subtitle);

    // Stub message
    const msg = new Text({
      text: 'Cena de run em construção.\nFases 4–7 do port populam o gameplay.',
      style: {
        fontFamily: 'system-ui, sans-serif',
        fontSize: 13,
        fill: Color.hex(Color.rgb(0.65, 0.7, 0.6)),
        align: 'center',
      },
    });
    msg.anchor.set(0.5);
    msg.x = W / 2;
    msg.y = H * 0.55;
    this.root.addChild(msg);

    const recurso = new Text({
      text: `Recurso alvo: ${this.zone.resource || '—'}`,
      style: {
        fontFamily: 'monospace',
        fontSize: 11,
        fill: Color.hex(Color.rgb(0.55, 0.7, 0.55)),
      },
    });
    recurso.anchor.set(0.5);
    recurso.x = W / 2;
    recurso.y = H * 0.55 + 56;
    this.root.addChild(recurso);

    const back = new PixiButton({
      label: '← Voltar ao bunker',
      width: 220,
      height: 36,
      onClick: () => {
        void sceneManager.replace(new HubScene());
      },
    });
    back.x = (W - 220) / 2;
    back.y = H - 80;
    this.root.addChild(back);

    this.root.addChild(this.banner);
  }
}
