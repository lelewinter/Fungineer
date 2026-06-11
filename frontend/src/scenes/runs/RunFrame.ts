// ============================================================================
// RUNFRAME — A "MOLDURA" COMPARTILHADA DE TODA FASE DE RAID
// ----------------------------------------------------------------------------
// O que e este arquivo, em palavras simples:
//   - Toda fase de raid (Snake, Pac-Man, Frogger, etc.) tem as MESMAS pecas de
//     interface por cima do jogo: uma barrinha no topo com o nome da zona,
//     o tempo restante, a pontuacao e a vida; um botao de "desistir"; e a
//     tela de fim de fase ("missao cumprida" / "run perdida").
//   - Em vez de cada fase reescrever tudo isso, elas chamam as funcoes daqui.
//     Assim a aparencia fica igual em todas e a manutencao acontece num lugar so.
//
// O que mora aqui:
//   - buildHud(zone) ......... monta a barra de HUD do topo e devolve "controles"
//                              (setTimer, setScore, ...) que a fase chama a cada quadro.
//   - buildEndOverlay(opts) .. monta a tela escura de fim de raid com o botao
//                              de voltar ao bunker.
//   - bindDrag(...) .......... liga o arrastar do dedo/mouse no canvas e devolve
//                              a posicao do ponteiro ja convertida para coordenadas
//                              do jogo (usada pelas fases controladas por arraste).
//
// Tudo aqui e exportado e usado pelas fases; os nomes/assinaturas sao estaveis.
// ============================================================================

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

// A sombra (drop shadow) mantem o texto do HUD legivel mesmo por cima de um
// fundo de jogo agitado e de baixo contraste.
const HUD_SHADOW = { color: 0x000000, alpha: 0.85, blur: 3, distance: 1, angle: Math.PI / 2 } as const;

// Os "controles" do HUD que cada fase recebe e atualiza durante o jogo.
// container = o desenho a ser adicionado a cena; os setters mudam cada campo.
export interface RunHud {
  container: Container;
  setTimer: (s: number) => void;       // segundos restantes (mostrados como "Ns")
  setScore: (label: string) => void;   // texto livre de pontuacao/coleta
  setStatus: (label: string) => void;  // subtitulo de status sob o nome da zona
  setHealth: (pct: number) => void;    // 0..1 -> largura da barrinha de vida
}

/** Monta a barra de HUD padrao do topo, usada por toda fase de raid. */
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
    style: { fontFamily: FontFamily.body, fontSize: 16, fill: accent, fontWeight: '700', letterSpacing: 1, dropShadow: HUD_SHADOW },
  });
  title.x = 40;
  title.y = 6;
  container.addChild(title);

  const status = new Text({
    text: '',
    style: { fontFamily: FontFamily.mono, fontSize: 13, fill: TextColor.ink, fontWeight: '600', letterSpacing: 0.5, dropShadow: HUD_SHADOW },
  });
  status.x = 40;
  status.y = 27;
  container.addChild(status);

  const timer = new Text({
    text: '',
    style: { fontFamily: FontFamily.mono, fontSize: 18, fill: TextColor.white, fontWeight: '700', dropShadow: HUD_SHADOW },
  });
  timer.anchor.set(1, 0);
  timer.x = VW - 12;
  timer.y = 5;
  container.addChild(timer);

  const score = new Text({
    text: '',
    style: { fontFamily: FontFamily.mono, fontSize: 14, fill: accent, fontWeight: '700', dropShadow: HUD_SHADOW },
  });
  score.anchor.set(1, 0);
  score.x = VW - 12;
  score.y = 28;
  container.addChild(score);

  const healthBg = new Graphics();
  const healthFg = new Graphics();
  const HBW = 110;
  const HBX = (VW - HBW) / 2;
  healthBg.rect(HBX, 39, HBW, 5).fill({ color: 0x2a2a2a, alpha: 0.9 });
  container.addChild(healthBg);
  container.addChild(healthFg);

  // Botao de desistir — toda raid pode voltar para o bunker (com uma confirmacao,
  // para nunca acontecer por toque acidental). Como mora no HUD compartilhado,
  // todas as zonas herdam esse botao de graca.
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

  // Mostra a janelinha de confirmacao antes de abandonar o raid de verdade.
  function showQuitConfirm(): void {
    const layer = new Container();

    const dim = new Graphics();
    dim.rect(0, 0, VW, VH).fill({ color: 0x000000, alpha: 0.74 });
    dim.eventMode = 'static'; // "engole" os toques para nao vazarem para o jogo/HUD atras
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

    // Confirmar: registra a run como perdida e volta ao bunker.
    const giveUp = new PixiButton({
      label: 'Desistir', width: 116, height: 38,
      fill: 0x3a1c1f, hoverFill: 0x4a2226, textColor: TextColor.red,
      onClick: () => { HubState.onRunEnded(false); void sceneManager.replace(new HubScene()); },
    });
    giveUp.x = cx - cardW / 2 + 16;
    giveUp.y = cy + 22;
    layer.addChild(giveUp);

    // Cancelar: apenas fecha a janelinha e segue jogando.
    const cancel = new PixiButton({
      label: 'Continuar', width: 116, height: 38,
      textColor: accent,
      onClick: () => { layer.destroy({ children: true }); },
    });
    cancel.x = cx + cardW / 2 - 16 - 116;
    cancel.y = cy + 22;
    layer.addChild(cancel);

    container.addChild(layer); // por cima da barra de HUD
  }

  return {
    container,
    // Mostra o tempo arredondado pra cima e nunca negativo (ex.: "12s").
    setTimer: (s: number) => { timer.text = `${Math.ceil(Math.max(0, s))}s`; },
    setScore: (label: string) => { score.text = label; },
    setStatus: (label: string) => { status.text = label; },
    setHealth: (pct: number) => {
      // pct e limitado a 0..1; abaixo de 40% a barra vira vermelha (aviso de perigo).
      const w = Math.max(0, Math.min(1, pct)) * HBW;
      healthFg.clear();
      healthFg.rect(HBX, 39, w, 5).fill({ color: pct > 0.4 ? accent : 0xe05050, alpha: 0.98 });
    },
  };
}

// Configuracao da tela de fim de raid.
export interface RunEndOpts {
  zone: ZoneData;
  victory: boolean;
  rewardLabel?: string;  // texto da recompensa quando vence
  failLabel?: string;    // texto quando falha
  storyLine?: string;    // beat narrativo (ex.: sobrevivente resgatado)
}

/** Desenha a tela escura de fim de raid com o botao de "voltar ao bunker". */
export function buildEndOverlay(opts: RunEndOpts): Container {
  const accent = Color.hex(opts.zone.accent_color);
  const layer = new Container();
  layer.zIndex = 200;
  const cardW = 290;
  const cardH = opts.storyLine ? 234 : 184;
  const cx = VW / 2;
  const cy = VH / 2;

  const dim = new Graphics();
  dim.rect(0, 0, VW, VH).fill({ color: 0x000000, alpha: 0.7 });
  dim.eventMode = 'static'; // "engole" os toques para nao chegarem ao botao de desistir do HUD atras
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
      fontFamily: FontFamily.body, fontSize: 22,
      fill: opts.victory ? accent : TextColor.red,
      fontWeight: '700', letterSpacing: 1.5, dropShadow: HUD_SHADOW,
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
    style: { fontFamily: FontFamily.mono, fontSize: 13, fill: TextColor.white, fontWeight: '600', align: 'center', wordWrap: true, wordWrapWidth: cardW - 28, dropShadow: HUD_SHADOW },
  });
  detail.anchor.set(0.5);
  detail.x = cx;
  detail.y = opts.storyLine ? cy - 48 : cy - 24;
  layer.addChild(detail);

  // Beat narrativo: o resgate da run, em destaque acima do botão.
  if (opts.storyLine) {
    const story = new Text({
      text: '◈ ' + opts.storyLine,
      style: { fontFamily: FontFamily.body, fontSize: 12, fill: accent, fontStyle: 'italic', align: 'center', wordWrap: true, wordWrapWidth: cardW - 28, dropShadow: HUD_SHADOW },
    });
    story.anchor.set(0.5);
    story.x = cx;
    story.y = cy - 6;
    layer.addChild(story);
  }

  const back = new PixiButton({
    label: '← Voltar ao bunker',
    width: 200, height: 36,
    textColor: accent,
    onClick: () => { void sceneManager.replace(new HubScene()); },
  });
  back.x = cx - 100;
  back.y = opts.storyLine ? cy + 44 : cy + 14;
  layer.addChild(back);

  return layer;
}

// O resultado do bindDrag: a posicao do ponteiro ja em coordenadas do jogo,
// se o dedo esta pressionado, e uma funcao para soltar os listeners.
export interface DragInput {
  pos: { x: number; y: number };
  dragging: boolean;
  cleanup: () => void;
}

/** Liga o arraste do dedo/mouse no canvas. As fases controladas por arraste leem
 *  "pos" (atualizada a cada movimento) como o alvo a perseguir. Lembre de chamar
 *  cleanup() ao sair da fase para remover os listeners. */
export function bindDrag(canvas: HTMLCanvasElement, world: { x: number; y: number; scale: { x: number } }, initial: { x: number; y: number }): DragInput {
  const state: DragInput = { pos: { ...initial }, dragging: false, cleanup: () => undefined };
  // Converte a posicao do clique do navegador para coordenadas do jogo, desfazendo
  // o deslocamento (world.x/y) e o zoom (world.scale) aplicados ao mundo.
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
