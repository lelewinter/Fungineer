// ============================================================================
// TORRES — A FASE DE ESCALAR UMA TORRE COM "BARRIS" CAINDO (estilo Donkey Kong)
// ----------------------------------------------------------------------------
// O que e esta fase, em palavras simples:
//   - Uma torre vertical com varios andares (vigas inclinadas) ligados por
//     escadas. Voce comeca embaixo e precisa chegar no topo.
//   - Arraste para os LADOS para andar; arraste para CIMA quando estiver perto de
//     uma escada para subir um andar.
//   - Do topo descem "barris" (na verdade canisters do ARGOS) que rolam pelos
//     andares e caem nas bordas. Encostar num barril te derruba e perde a run.
//   - A camera acompanha voce para cima conforme sobe. Chegar no andar do topo
//     vence a fase.
//
// Como se encaixa no jogo:
//   - E uma fase de raid. Usa a moldura compartilhada do RunFrame (HUD, tela de
//     fim). Ao vencer, deposita "ai_components" no bunker.
//
// A classe TorresScene continua exportada deste mesmo arquivo, entao nada
// quebra para quem usa esta fase.
// ============================================================================

import { Graphics } from 'pixi.js';
import { RunScene } from './RunScene';
import { Color } from '../../core/Color';
import { GameConfig } from '../../state/GameConfig';
import { HubState } from '../../state/HubState';
import { ZONES } from '../../state/Zones';
import { RunJuice } from '../../run/fx/RunJuice';

const VW = GameConfig.VIEWPORT_WIDTH;
const VH = GameConfig.VIEWPORT_HEIGHT;
const ZONE = ZONES[9]!;

// ── Tamanhos e tempos ────────────────────────────────────────────────────────
const FOOT = 70;          // distancia do chao (andar 0) ate a base da tela
const STORY_H = 70;       // altura de um andar
const STORY_COUNT = 8;    // numero de andares da torre
const PLAYER_W = 14;      // largura do jogador
const PLAYER_H = 18;      // altura do jogador
const MOVE_SPEED = 130;   // velocidade andando (pixels/seg)
const CLIMB_SPEED = 90;   // velocidade subindo escada (pixels/seg)
const BARREL_FALL = 60;   // velocidade de queda dos barris
const BARREL_ROLL = 70;   // velocidade de rolagem dos barris num andar
const TIMER = GameConfig.TORRES_RUN_TIMER;         // duracao da fase em segundos

// Um barril rolando/caindo: posicao, sentido da rolagem e se esta caindo.
interface Barrel { x: number; y: number; dir: 1 | -1; falling: boolean }
// Uma escada: posicao x e o andar de baixo que ela liga ao de cima.
interface Ladder { x: number; storyTop: number }
// Um andar: altura, extremos horizontais e a inclinacao (slope) da viga.
interface Floor { y: number; xStart: number; xEnd: number; slope: number }

/** Fase de escalada: suba a torre pelas escadas desviando dos barris ate o topo.
 *  Veja o bloco no topo do arquivo. */
export class TorresScene extends RunScene {
  protected readonly zone = ZONE;

  private bg = new Graphics();
  private floorsG = new Graphics();
  private laddersG = new Graphics();
  private barrelsG = new Graphics();
  private playerG = new Graphics();

  private floors: Floor[] = [];
  private ladders: Ladder[] = [];
  private barrels: Barrel[] = [];

  private px = VW / 2;       // posicao horizontal do jogador
  private py = 0;            // altura DENTRO do andar atual (0 = no piso do andar)
  private storyIdx = 0;      // indice do andar atual (0 = base)
  private climbing = false;  // se esta no meio de uma escada
  private barrelTimer = 2;   // segundos ate o proximo barril surgir
  private elapsed = 0;
  private timeLeft = TIMER;
  private cameraY = 0;        // deslocamento atual da camera (rolagem para cima)
  private targetCameraY = 0;  // alvo suave que a camera persegue
  private dragging = false;
  private dragPos = { x: 0, y: 0 };  // posicao do dedo (em coordenadas do mundo)
  private cleanup: (() => void) | null = null;

  /** A base monta HUD/juice/musica; aqui montamos a torre e os toques. */
  protected override onEnter(): void {
    this.bg.rect(0, 0, VW, VH).fill({ color: 0x05070b });
    // Silhueta de arranha-ceus ao fundo (so enfeite).
    for (let i = 0; i < 8; i++) {
      const x = (i * 67) % VW;
      const w = 30 + ((i * 13) % 50);
      const h = 200 + ((i * 91) % 300);
      this.bg.rect(x, VH - h, w, h).fill({ color: 0x0a1018, alpha: 0.5 });
    }
    // Luzes da cidade ainda funcionando, brilhando la embaixo (so enfeite).
    for (let i = 0; i < 44; i++) {
      const lx = (i * 53.7) % VW;
      const ly = VH * 0.45 + ((i * 71.3) % (VH * 0.5));
      this.bg.rect(lx, ly, 2, 2).fill({ color: 0xffd9a0, alpha: 0.05 + ((i * 13) % 9) * 0.012 });
    }
    this.root.addChild(this.bg);

    this.buildTower();
    this.root.addChild(this.floorsG);
    this.root.addChild(this.laddersG);
    this.root.addChild(this.barrelsG);
    this.root.addChild(this.playerG);

    this.hud.setStatus('escalada vertical');

    this.bindPointer();
    this.drawStatic();
  }

  /** A base para a musica e destroi o juice; aqui so soltamos o toque. */
  protected override onExit(): void {
    this.cleanup?.();
  }

  /** Torres desenha direto no root (sem container de conteudo) — usa o shake
   *  padrao (null) com ambiente um pouco menor. */
  protected override buildJuice(): RunJuice {
    return new RunJuice(this.root, { accent: this.accentHex(), ambient: 22, shakeTarget: null });
  }

  /** Posicao do jogador na TELA (as camadas do jogo rolam por -cameraY). */
  private screenPlayer(): { x: number; y: number } {
    return { x: this.px, y: this.worldPlayerY() - this.cameraY - PLAYER_H / 2 };
  }

  /** Quadro a quadro: move jogador e barris e desloca a camera para acompanhar. */
  protected override onUpdate(d: number): void {
    this.elapsed += d;
    this.timeLeft -= d;
    // Acabou o tempo: vence se chegou perto do topo (penultimo andar ou acima).
    if (this.timeLeft <= 0) { this.end(this.storyIdx >= STORY_COUNT - 2); return; }

    this.tickPlayer(d);
    this.tickBarrels(d);

    if (this.storyIdx >= STORY_COUNT - 1) { this.end(true); return; } // chegou ao topo

    // A camera persegue suavemente uma posicao acima do jogador (efeito de rolagem).
    this.targetCameraY = Math.max(0, this.worldPlayerY() - VH * 0.6);
    this.cameraY += (this.targetCameraY - this.cameraY) * Math.min(1, 6 * d);
    // Desloca todas as camadas do jogo de uma vez para simular a camera subindo.
    this.floorsG.y = -this.cameraY;
    this.laddersG.y = -this.cameraY;
    this.barrelsG.y = -this.cameraY;
    this.playerG.y = -this.cameraY;

    this.drawDynamic();
    this.hud.setTimer(this.timeLeft);
    this.hud.setScore(`andar ${this.storyIdx + 1}/${STORY_COUNT}`);
    this.hud.setHealth(this.storyIdx / (STORY_COUNT - 1));
  }

  /** Altura do jogador em coordenadas do MUNDO (sobe conforme o andar e o py). */
  private worldPlayerY(): number {
    return (VH - FOOT) - (this.storyIdx * STORY_H) - this.py;
  }

  /** Monta a torre: cada andar tem uma viga inclinada e uma escada para o de cima
   *  (alternando o lado). O ultimo andar e plano e nao tem escada. */
  private buildTower(): void {
    for (let i = 0; i < STORY_COUNT; i++) {
      const slope = i === STORY_COUNT - 1 ? 0 : (i % 2 === 0 ? 1 : -1);
      const y = (VH - FOOT) - i * STORY_H;
      this.floors.push({ y, xStart: 16, xEnd: VW - 16, slope });
      if (i < STORY_COUNT - 1) {
        const lx = i % 2 === 0 ? VW - 50 : 38; // escada alterna direita/esquerda
        this.ladders.push({ x: lx, storyTop: i });
      }
    }
  }

  /** Altura da viga de um andar numa posicao x (considerando a inclinacao). */
  private floorYAt(story: number, x: number): number {
    const f = this.floors[story];
    if (!f) return VH;
    const t = (x - f.xStart) / (f.xEnd - f.xStart);
    return f.y - f.slope * 8 * (t - 0.5) * 2;
  }

  /** Move o jogador: andando na horizontal ou subindo quando esta numa escada. */
  private tickPlayer(dt: number): void {
    if (this.climbing) {
      // Subindo/descendo a escada: o gesto vertical define o sentido.
      if (this.dragging) {
        const dy = this.dragPos.y - this.worldPlayerY();
        if (Math.abs(dy) > 6) {
          this.py += (dy < 0 ? 1 : -1) * CLIMB_SPEED * dt;
        }
      }
      // Chegou no topo da escada: sobe um andar. Voltou ao pe: sai da escada.
      if (this.py >= STORY_H - 4) {
        this.py = 0;
        this.storyIdx += 1;
        this.climbing = false;
        const sp = this.screenPlayer();
        this.juice.pop(sp.x, sp.y);
      } else if (this.py <= 0) {
        this.py = 0;
        this.climbing = false;
      }
    } else {
      // Andando no andar: o gesto horizontal define para que lado ir.
      if (this.dragging) {
        const dx = this.dragPos.x - this.px;
        if (Math.abs(dx) > 4) {
          this.px += (dx > 0 ? 1 : -1) * MOVE_SPEED * dt;
          this.px = Math.max(20, Math.min(VW - 20, this.px)); // limita as bordas
        }
        // Perto de uma escada e arrastando para cima: comeca a subir.
        const ladder = this.ladders[this.storyIdx];
        if (ladder && Math.abs(this.px - ladder.x) < 16) {
          const dy = this.dragPos.y - this.worldPlayerY();
          if (dy < -12) {
            this.climbing = true;
            this.px = ladder.x; // "gruda" na escada
          }
        }
      }
    }
  }

  /** Faz nascer e mover os barris: eles rolam pelo andar e caem nas bordas,
   *  pousando no andar de baixo e invertendo o sentido. Acerta o jogador = derrota. */
  private tickBarrels(dt: number): void {
    this.barrelTimer -= dt;
    if (this.barrelTimer <= 0) {
      const topY = this.floors[STORY_COUNT - 1]!.y - 18;
      this.barrels.push({ x: VW / 2, y: topY, dir: Math.random() < 0.5 ? -1 : 1, falling: false });
      this.barrelTimer = 2.5 + Math.random() * 1.5;
    }

    const alive: Barrel[] = [];
    for (const b of this.barrels) {
      // Descobre em qual andar o barril esta (se estiver apoiado em algum).
      let onStory = -1;
      for (let i = 0; i < STORY_COUNT; i++) {
        const fy = this.floorYAt(i, b.x);
        if (Math.abs(b.y - (fy - 6)) < 10) { onStory = i; break; }
      }
      if (onStory >= 0 && !b.falling) {
        // Apoiado num andar: rola para o lado; ao chegar na borda, comeca a cair.
        const fy = this.floorYAt(onStory, b.x);
        b.y = fy - 6;
        b.x += b.dir * BARREL_ROLL * dt;
        if (b.x < 24 || b.x > VW - 24) {
          b.falling = true;
        }
      } else {
        // Caindo: desce ate pousar num andar de baixo, onde inverte o sentido.
        b.y += BARREL_FALL * dt;
        for (let i = 0; i < STORY_COUNT; i++) {
          const fy = this.floorYAt(i, b.x);
          if (Math.abs(b.y - (fy - 6)) < 4 && b.x >= 24 && b.x <= VW - 24) {
            b.y = fy - 6;
            b.falling = false;
            b.dir = b.dir === 1 ? -1 : 1;
            break;
          }
        }
      }
      // Saiu da tela por baixo: descarta o barril.
      if (b.y > VH + 100) continue;
      // Acertou o jogador (que nao esteja na escada)? Perdeu.
      const pY = this.worldPlayerY();
      if (!this.climbing && Math.abs(b.x - this.px) < 12 && Math.abs(b.y - (pY - PLAYER_H / 2)) < 14) {
        const sp = this.screenPlayer();
        this.juice.hurt(sp.x, sp.y);
        this.end(false);
        return;
      }
      alive.push(b);
    }
    this.barrels = alive;
  }

  /** Liga o arraste: guarda a posicao do dedo (ja somando a camera, para virar
   *  coordenada do mundo) — usada no tickPlayer para andar/subir. */
  private bindPointer(): void {
    const canvas = this.app.pixi.canvas;
    // Converte o clique para coordenadas do mundo: soma cameraY porque o mundo
    // esta deslocado por -cameraY na tela (a camera "subiu").
    const toLocal = (e: PointerEvent): { x: number; y: number } => {
      const rect = canvas.getBoundingClientRect();
      const scale = this.app.world.scale.x || 1;
      return {
        x: (e.clientX - rect.left - this.app.world.x) / scale,
        y: (e.clientY - rect.top - this.app.world.y) / scale + this.cameraY,
      };
    };
    const onDown = (e: PointerEvent): void => { this.dragging = true; this.dragPos = toLocal(e); };
    const onMove = (e: PointerEvent): void => { if (this.dragging) this.dragPos = toLocal(e); };
    const onUp = (): void => { this.dragging = false; };
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onUp);
    this.cleanup = (): void => {
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onUp);
    };
  }

  /** Desenha as vigas e as escadas (uma vez; nao mudam durante a partida). */
  private drawStatic(): void {
    const accent = Color.hex(ZONE.accent_color);
    this.floorsG.clear();
    for (let i = 0; i < this.floors.length; i++) {
      const f = this.floors[i]!;
      const xs = f.xStart;
      const xe = f.xEnd;
      const ys = f.y;
      const ye = f.y - f.slope * 8;
      // As vigas vao clareando conforme a torre sobe em direcao ao ceu aberto.
      const ft = i / (STORY_COUNT - 1);
      const girder = Color.hex(Color.rgb(0.38 + ft * 0.22, 0.30 + ft * 0.14, 0.16 + ft * 0.10));
      this.floorsG.moveTo(xs, ys).lineTo(xe, ye).stroke({ color: girder, width: 6, alpha: 0.95 });
      this.floorsG.moveTo(xs, ys + 2).lineTo(xe, ye + 2).stroke({ color: 0x4a2a10, width: 2, alpha: 0.7 });
      if (i === STORY_COUNT - 1) {
        // Brilho do telhado (andar do topo, o objetivo).
        this.floorsG.rect(xs, ys - 8, xe - xs, 4).fill({ color: accent, alpha: 0.6 });
      }
    }
    this.laddersG.clear();
    for (const l of this.ladders) {
      const top = this.floorYAt(l.storyTop, l.x);
      const bot = this.floorYAt(l.storyTop + 1, l.x);
      this.laddersG.rect(l.x - 8, bot, 2, top - bot + 4).fill({ color: 0xb09060, alpha: 0.9 });
      this.laddersG.rect(l.x + 6, bot, 2, top - bot + 4).fill({ color: 0xb09060, alpha: 0.9 });
      for (let yy = top + 4; yy < bot; yy += 8) {
        this.laddersG.rect(l.x - 8, yy, 14, 2).fill({ color: 0xb09060, alpha: 0.8 });
      }
    }
  }

  /** Redesenha os barris e o jogador (chamado todo quadro). */
  private drawDynamic(): void {
    const accent = Color.hex(ZONE.accent_color);
    this.barrelsG.clear();
    for (const b of this.barrels) {
      // Barril = canister sensor do ARGOS rolando pelas placas do piso.
      this.barrelsG.ellipse(b.x, b.y, 9, 7).fill({ color: 0x5b6a78, alpha: 0.95 });
      this.barrelsG.ellipse(b.x, b.y, 9, 7).stroke({ color: 0xff3a3a, width: 1.2, alpha: 0.7 });
      this.barrelsG.rect(b.x - 9, b.y - 1.5, 18, 3).fill({ color: 0x2a2a30, alpha: 0.6 });
      this.barrelsG.circle(b.x, b.y, 2).fill({ color: 0xff2424, alpha: 0.85 });
    }
    this.playerG.clear();
    const py = this.worldPlayerY();
    this.playerG.rect(this.px - PLAYER_W / 2, py - PLAYER_H, PLAYER_W, PLAYER_H)
      .fill({ color: accent, alpha: 0.95 });
    this.playerG.circle(this.px, py - PLAYER_H - 4, 5).fill({ color: accent });
    this.playerG.rect(this.px - 4, py - PLAYER_H + 2, 8, 4).fill({ color: 0xffffff, alpha: 0.7 });
  }

  /** Encerra a fase (uma vez so): efeito de fim, recompensa se venceu (1 por
   *  andar alcancado), avisa o HubState e mostra a tela de fim. */
  private end(victory: boolean): void {
    if (this.ended) return; // protege contra deposito duplo
    const reward = this.storyIdx;
    if (victory && reward > 0) {
      // Depositado como ai_components (representa os Cristais de Memoria da zona).
      HubState.depositFlow('ai_components', reward);
    }
    this.endRun(victory, {
      rewardLabel: `+${reward} Cristais de Memória — servidores acessados`,
      failLabel: 'Canister de patrulha. Queda confirmada.',
    });
  }
}
