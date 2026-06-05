import { Container, Graphics, Text } from 'pixi.js';
import { Color } from '../../core/Color';
import { FontFamily, TextColor } from '../../core/typography';
import { GameConfig } from '../../state/GameConfig';
import { HubState } from '../../state/HubState';
import { sceneManager } from '../../core/SceneManager';
import { HubScene } from '../hub/HubScene';
import { PixiButton } from '../../ui/PixiButton';
import type { ZoneData } from '../../state/Zones';

const VW = GameConfig.VIEWPORT_WIDTH;
const VH = GameConfig.VIEWPORT_HEIGHT;

export interface RunHud {
  container: Container;
  setTimer: (s: number) => void;
  setScore: (label: string) => void;
  setStatus: (label: string) => void;
  setHealth: (pct: number) => void;
}

/** Builds the standard top HUD strip used by every zone run scene. */
export function buildHud(zone: ZoneData): RunHud {
  const accent = Color.hex(zone.accent_color);
  const container = new Container();
  container.zIndex = 100;

  const BARH = 46;
  const bg = new Graphics();
  bg.rect(0, 0, VW, BARH).fill({ color: 0x080b0c, alpha: 0.9 })
    .rect(0, BARH, VW, 2).fill({ color: accent, alpha: 0.7 });
  container.addChild(bg);

  const title = new Text({
    text: zone.zone_name,
    style: { fontFamily: FontFamily.body, fontSize: 15, fill: accent, fontWeight: '700', letterSpacing: 1 },
  });
  title.x = 40;
  title.y = 7;
  container.addChild(title);

  const status = new Text({
    text: '',
    style: { fontFamily: FontFamily.mono, fontSize: 12, fill: TextColor.muted, letterSpacing: 0.5 },
  });
  status.x = 40;
  status.y = 28;
  container.addChild(status);

  const timer = new Text({
    text: '',
    style: { fontFamily: FontFamily.mono, fontSize: 17, fill: TextColor.ink, fontWeight: '700' },
  });
  timer.anchor.set(1, 0);
  timer.x = VW - 12;
  timer.y = 6;
  container.addChild(timer);

  const score = new Text({
    text: '',
    style: { fontFamily: FontFamily.mono, fontSize: 13, fill: accent, fontWeight: '600' },
  });
  score.anchor.set(1, 0);
  score.x = VW - 12;
  score.y = 28;
  container.addChild(score);

  const healthBg = new Graphics();
  const healthFg = new Graphics();
  const HBW = 110;
  const HBX = (VW - HBW) / 2;
  healthBg.rect(HBX, 40, HBW, 4).fill({ color: 0x2a2a2a, alpha: 0.85 });
  container.addChild(healthBg);
  container.addChild(healthFg);

  // Give-up button — every run can bail back to the bunker (with a confirm so
  // it's never a fat-finger). Lives in the shared HUD, so all zones inherit it.
  const quit = new PixiButton({
    label: '✕',
    width: 28, height: 28, fontSize: 15,
    fill: 0x2a1416, hoverFill: 0x3a1c1f,
    textColor: TextColor.red,
    onClick: () => showQuitConfirm(),
  });
  quit.x = 6;
  quit.y = 9;
  container.addChild(quit);

  function showQuitConfirm(): void {
    const layer = new Container();

    const dim = new Graphics();
    dim.rect(0, 0, VW, VH).fill({ color: 0x000000, alpha: 0.74 });
    dim.eventMode = 'static'; // swallow taps to the field/HUD behind
    layer.addChild(dim);

    const cardW = 280;
    const cardH = 168;
    const cx = VW / 2;
    const cy = VH / 2;
    const card = new Graphics();
    card.roundRect(cx - cardW / 2, cy - cardH / 2, cardW, cardH, 8)
      .fill({ color: 0x0a0d0e, alpha: 0.97 })
      .stroke({ color: accent, width: 1.5, alpha: 0.9 });
    layer.addChild(card);

    const heading = new Text({
      text: 'DESISTIR DO RAID?',
      style: { fontFamily: FontFamily.body, fontSize: 19, fill: TextColor.red, fontWeight: '700', letterSpacing: 1 },
    });
    heading.anchor.set(0.5);
    heading.x = cx;
    heading.y = cy - 46;
    layer.addChild(heading);

    const detail = new Text({
      text: 'Você volta ao bunker sem recompensa.',
      style: { fontFamily: FontFamily.mono, fontSize: 12, fill: TextColor.ink, align: 'center', wordWrap: true, wordWrapWidth: cardW - 32 },
    });
    detail.anchor.set(0.5);
    detail.x = cx;
    detail.y = cy - 14;
    layer.addChild(detail);

    const giveUp = new PixiButton({
      label: 'Desistir', width: 116, height: 38,
      fill: 0x3a1c1f, hoverFill: 0x4a2226, textColor: TextColor.red,
      onClick: () => { HubState.onRunEnded(false); void sceneManager.replace(new HubScene()); },
    });
    giveUp.x = cx - cardW / 2 + 16;
    giveUp.y = cy + 22;
    layer.addChild(giveUp);

    const cancel = new PixiButton({
      label: 'Continuar', width: 116, height: 38,
      textColor: accent,
      onClick: () => { layer.destroy({ children: true }); },
    });
    cancel.x = cx + cardW / 2 - 16 - 116;
    cancel.y = cy + 22;
    layer.addChild(cancel);

    container.addChild(layer); // on top of the HUD strip
  }

  return {
    container,
    setTimer: (s: number) => { timer.text = `${Math.ceil(Math.max(0, s))}s`; },
    setScore: (label: string) => { score.text = label; },
    setStatus: (label: string) => { status.text = label; },
    setHealth: (pct: number) => {
      const w = Math.max(0, Math.min(1, pct)) * HBW;
      healthFg.clear();
      healthFg.rect(HBX, 40, w, 4).fill({ color: pct > 0.4 ? accent : 0xe05050, alpha: 0.95 });
    },
  };
}

export interface RunEndOpts {
  zone: ZoneData;
  victory: boolean;
  rewardLabel?: string;
  failLabel?: string;
}

/** Renders the end-of-run overlay with a "back to bunker" button. */
export function buildEndOverlay(opts: RunEndOpts): Container {
  const accent = Color.hex(opts.zone.accent_color);
  const layer = new Container();
  layer.zIndex = 200;
  const cardW = 290;
  const cardH = 184;
  const cx = VW / 2;
  const cy = VH / 2;

  const dim = new Graphics();
  dim.rect(0, 0, VW, VH).fill({ color: 0x000000, alpha: 0.7 });
  dim.eventMode = 'static'; // block taps from reaching the HUD give-up button beneath
  layer.addChild(dim);

  const card = new Graphics();
  card
    .roundRect(cx - cardW / 2, cy - cardH / 2, cardW, cardH, 8)
    .fill({ color: 0x0a0d0e, alpha: 0.96 })
    .stroke({ color: accent, width: 1.5, alpha: 0.9 });
  layer.addChild(card);

  const title = new Text({
    text: opts.victory ? 'MISSÃO CUMPRIDA' : 'RUN PERDIDA',
    style: {
      fontFamily: FontFamily.body, fontSize: 20,
      fill: opts.victory ? accent : TextColor.red,
      fontWeight: '700', letterSpacing: 1.5,
    },
  });
  title.anchor.set(0.5);
  title.x = cx;
  title.y = cy - 50;
  layer.addChild(title);

  const detail = new Text({
    text: opts.victory
      ? (opts.rewardLabel ?? '+0')
      : (opts.failLabel ?? 'Você não voltou com nada.'),
    style: { fontFamily: FontFamily.mono, fontSize: 13, fill: TextColor.ink, align: 'center', wordWrap: true, wordWrapWidth: cardW - 28 },
  });
  detail.anchor.set(0.5);
  detail.x = cx;
  detail.y = cy - 24;
  layer.addChild(detail);

  const back = new PixiButton({
    label: '← Voltar ao bunker',
    width: 200, height: 36,
    textColor: accent,
    onClick: () => { void sceneManager.replace(new HubScene()); },
  });
  back.x = cx - 100;
  back.y = cy + 14;
  layer.addChild(back);

  return layer;
}

/** Subscribes a canvas pointer drag and returns a position resolver in scene coords. */
export interface DragInput {
  pos: { x: number; y: number };
  dragging: boolean;
  cleanup: () => void;
}

export function bindDrag(canvas: HTMLCanvasElement, world: { x: number; y: number; scale: { x: number } }, initial: { x: number; y: number }): DragInput {
  const state: DragInput = { pos: { ...initial }, dragging: false, cleanup: () => undefined };
  const resolve = (e: PointerEvent): void => {
    const rect = canvas.getBoundingClientRect();
    const scale = world.scale.x || 1;
    state.pos.x = (e.clientX - rect.left - world.x) / scale;
    state.pos.y = (e.clientY - rect.top - world.y) / scale;
  };
  const onDown = (e: PointerEvent): void => { state.dragging = true; resolve(e); };
  const onMove = (e: PointerEvent): void => { if (state.dragging) resolve(e); };
  const onUp = (): void => { state.dragging = false; };
  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', onUp);
  state.cleanup = (): void => {
    canvas.removeEventListener('pointerdown', onDown);
    canvas.removeEventListener('pointermove', onMove);
    canvas.removeEventListener('pointerup', onUp);
    canvas.removeEventListener('pointercancel', onUp);
  };
  return state;
}
