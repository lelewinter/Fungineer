import { Container, FederatedPointerEvent, Graphics, Text } from 'pixi.js';
import { Color, type RGBA } from '../../core/Color';
import { Signal } from '../../core/Signal';
import { seededRng, strHash } from '../../core/hash';
import { GameConfig } from '../../state/GameConfig';
import { HubData, type HubRoom } from '../../state/HubData';
import { HubState } from '../../state/HubState';
import { type DrawCtx, drawGradientRect } from './HubDrawKit';
import { drawRoomInterior } from './HubRoomInteriors';
import { drawRocketShaft } from './HubRocketShaft';

/**
 * HubRenderer — o desenhista do bunker.
 *
 * O hub e a "tela base" do jogo: um corte do bunker visto de lado, como uma
 * casa de bonecas, com uma grade de 6 colunas por 6 andares.
 *   - Andar 1 (topo): a superficie / o ceu, com as ruinas clicaveis e a
 *     escotilha de saida das hordas.
 *   - Andares 2 a 6: as salas subterraneas (laboratorios, cozinha, etc).
 *   - Colunas 2 e 3, andares 2 a 5: o poco do foguete (o "casulo"), desenhado
 *     por cima como uma sobreposicao.
 *
 * Este arquivo cuida de:
 *   1. Calcular onde cada sala fica na tela (layout).
 *   2. Criar as areas clicaveis (hitboxes) e avisar quem clicou via signals.
 *   3. Redesenhar a cena a cada quadro — mas com throttle (~20fps), porque o
 *      hub e calmo e nao precisa redesenhar 60 vezes por segundo.
 *
 * Para nao virar um arquivo gigante, o "mobiliario" das salas vive em
 * HubRoomInteriors.ts e o foguete em HubRocketShaft.ts. Aqui fica so o
 * esqueleto: paredes, salas, iluminacao, fungos, badges e a orquestracao.
 */
export class HubRenderer extends Container {
  // ── Signals: avisam o HubScene de cliques (ele decide o que abrir) ─────────
  readonly roomClicked = new Signal<[roomId: string]>();
  readonly rocketShaftClicked = new Signal<[]>();
  readonly surfaceZoneClicked = new Signal<[zoneId: string]>();

  /** Ruinas da superficie (clicaveis), desenhadas no ceu acima da escotilha. */
  private readonly surfaceZones: ReadonlyArray<{ id: string; label: string }> = [
    { id: 'cordilheira', label: 'CORDILHEIRA' },
    { id: 'torres', label: 'TORRES' },
    { id: 'catedral', label: 'CATEDRAL' },
  ];
  private roomLabels: Text[] = [];

  /** Altura fixa da faixa de superficie (o ceu). */
  private readonly SURFACE_H = 110;
  /** Altura de um andar subterraneo (calculada no layout). */
  private floorH = 0;

  private cellWidth: number;
  /** Para cada sala, a coordenada Y do seu topo na tela. */
  private roomYOffset: Record<string, number> = {};
  /** A "prancheta" vetorial onde todo o cenario e pintado. */
  private g = new Graphics();
  /** Camada separada so com as areas clicaveis (invisiveis). */
  private hitLayer = new Container();
  private silhouetteLabels = new Map<string, Text>();
  // Dois relogios de animacao: um contando frames (animacoes antigas) e outro
  // em milissegundos (animacoes baseadas em tempo real).
  private elapsedFrames = 0;
  private elapsedMs = 0;
  // Acumulador do throttle de redraw (ver tick()).
  private redrawAccum = 0;
  private variantColors = HubState.getVariantData();
  // Funcoes de "desinscricao" dos signals — chamadas ao destruir o renderer
  // para nao deixar listeners orfaos (memory leak).
  private disposers: Array<() => void> = [];

  constructor() {
    super();
    this.cellWidth = GameConfig.VIEWPORT_WIDTH / 6;
    this.calculateLayout();
    this.addChild(this.g);
    this.addChild(this.hitLayer);
    this.buildHitboxes();
    this.buildSurfaceZones();
    this.buildRoomLabels();
    this.disposers.push(HubState.hubVariantChanged.connect(() => this.applyVariant()));
    this.disposers.push(HubState.roomUnlockedSignal.connect(() => this.refreshSilhouettes()));
  }

  /** Desconecta os signals e destroi os objetos graficos. Deve ser chamado
   *  quando o hub sai de cena, senao cada re-entrada vaza listeners. */
  destroyRenderer(): void {
    for (const d of this.disposers) d();
    this.disposers = [];
    this.destroy({ children: true });
  }

  /** Empacota o estado de animacao no formato que os helpers de desenho esperam. */
  private get drawCtx(): DrawCtx {
    return { g: this.g, elapsedMs: this.elapsedMs, elapsedFrames: this.elapsedFrames };
  }

  /** Chamado a cada quadro pelo HubScene. */
  tick(dt: number): void {
    this.elapsedFrames += Math.round(dt * 60);
    this.elapsedMs += dt * 1000;
    // O hub e uma tela calma, com so animacao ambiente lenta — redesenhar o
    // corte inteiro 60x/s e desperdicio. Fazemos throttle para ~20fps (a
    // animacao parece identica e o consumo de CPU/bateria cai ~2/3). O redraw()
    // ainda le elapsedMs, entao o movimento continua suave o bastante.
    this.redrawAccum += dt;
    if (this.redrawAccum >= 1 / 20) {
      this.redrawAccum = 0;
      this.redraw();
    }
  }

  // ── Layout (onde cada sala fica) ───────────────────────────────────────────
  private calculateLayout(): void {
    this.floorH = (GameConfig.VIEWPORT_HEIGHT - this.SURFACE_H) / 5;
    for (const room of HubData.ROOMS) {
      this.roomYOffset[room.id] = room.floor === 1
        ? 0
        : this.SURFACE_H + (room.floor - 2) * this.floorH;
    }
  }

  private getTotalH(): number {
    return this.SURFACE_H + 5 * this.floorH;
  }

  /** Altura de uma sala: o andar 1 (superficie) tem altura especial. */
  private roomFloorH(room: HubRoom): number {
    return room.floor === 1 ? this.SURFACE_H : this.floorH;
  }

  // ── Areas clicaveis (hitboxes) ─────────────────────────────────────────────
  private buildHitboxes(): void {
    for (const room of HubData.ROOMS) {
      if (HubData.isRocketRoom(room)) continue;
      const x = this.cellWidth * room.col;
      const y = this.roomYOffset[room.id] ?? 0;
      const w = this.cellWidth * room.w;
      const h = this.roomFloorH(room);
      // Retangulo quase invisivel (alpha 0.001) so para capturar o toque.
      const hit = new Graphics().rect(0, 0, w, h).fill({ color: 0x000000, alpha: 0.001 });
      hit.x = x;
      hit.y = y;
      hit.eventMode = 'static';
      hit.cursor = 'pointer';
      hit.on('pointertap', (_e: FederatedPointerEvent) => {
        if (HubState.isRoomUnlocked(room.id)) this.roomClicked.emit(room.id);
      });
      this.hitLayer.addChild(hit);

      if (room.silhouette) {
        const label = new Text({
          text: room.silhouette,
          style: {
            fontFamily: '"Space Grotesk", system-ui, sans-serif',
            fontSize: 8,
            fill: Color.hex(Color.rgb(0.55, 0.48, 0.40)),
            align: 'center',
          },
        });
        label.alpha = 0.6;
        label.anchor.set(0.5, 0);
        label.x = x + w * 0.5;
        label.y = y + h * 0.5 + 10;
        // A silhueta-pista so aparece enquanto a sala esta trancada.
        label.visible = !HubState.isRoomUnlocked(room.id);
        this.addChild(label);
        this.silhouetteLabels.set(room.id, label);
      }
    }

    // Hitbox do poco do foguete — cobre andares 2-5, colunas 2-3.
    const rocketHit = new Graphics()
      .rect(0, 0, this.cellWidth * 2, this.floorH * 4)
      .fill({ color: 0x000000, alpha: 0.001 });
    rocketHit.x = this.cellWidth * 2;
    rocketHit.y = this.SURFACE_H;
    rocketHit.eventMode = 'static';
    rocketHit.cursor = 'pointer';
    rocketHit.on('pointertap', () => this.rocketShaftClicked.emit());
    this.hitLayer.addChild(rocketHit);
  }

  // ── Ruinas da superficie (cordilheira / torres / catedral) ─────────────────

  /** Calcula a faixa horizontal (x, largura) de cada ruina da superficie. */
  private surfaceRegion(i: number): { x: number; w: number } {
    const margin = 10;
    const usable = GameConfig.VIEWPORT_WIDTH - margin * 2;
    const w = usable / this.surfaceZones.length;
    return { x: margin + i * w, w };
  }

  private buildSurfaceZones(): void {
    const hitH = this.SURFACE_H - 36;
    for (let i = 0; i < this.surfaceZones.length; i++) {
      const sz = this.surfaceZones[i]!;
      const { x, w } = this.surfaceRegion(i);

      const hit = new Graphics().rect(0, 0, w, hitH).fill({ color: 0x000000, alpha: 0.001 });
      hit.x = x;
      hit.y = 2;
      hit.eventMode = 'static';
      hit.cursor = 'pointer';
      hit.on('pointertap', (e: FederatedPointerEvent) => {
        // stopPropagation: impede que o clique "vaze" para a escotilha das hordas.
        e.stopPropagation();
        this.surfaceZoneClicked.emit(sz.id);
      });
      this.hitLayer.addChild(hit);

      const label = new Text({
        text: sz.label,
        style: {
          fontFamily: '"Space Grotesk", system-ui, sans-serif',
          fontSize: 11,
          fontWeight: '700',
          fill: 0xeef4e8,
          letterSpacing: 0.4,
          align: 'center',
          dropShadow: { color: 0x000000, alpha: 0.9, blur: 3, distance: 1, angle: Math.PI / 2 },
        },
      });
      label.anchor.set(0.5, 0);
      label.x = x + w * 0.5;
      label.y = 5;
      this.addChild(label);
    }

    // Hordas — a escotilha de saida ocupa a faixa de baixo da superficie.
    const hordasLabel = new Text({
      text: '▼ HORDAS · SAÍDA',
      style: {
        fontFamily: '"Space Grotesk", system-ui, sans-serif',
        fontSize: 11,
        fontWeight: '700',
        fill: 0xffae90,
        letterSpacing: 0.4,
        align: 'center',
        dropShadow: { color: 0x000000, alpha: 0.95, blur: 3, distance: 1, angle: Math.PI / 2 },
      },
    });
    hordasLabel.anchor.set(0.5, 1);
    hordasLabel.x = GameConfig.VIEWPORT_WIDTH * 0.5;
    hordasLabel.y = this.SURFACE_H - 6;
    this.addChild(hordasLabel);
  }

  /** Desenha os predios/ruinas da superficie (animados: janelas piscando). */
  private drawSurfaceZoneBuildings(): void {
    const groundY = this.SURFACE_H - 32;
    const t = this.elapsedMs;
    for (let i = 0; i < this.surfaceZones.length; i++) {
      const sz = this.surfaceZones[i]!;
      const zone = HubData.getZone(sz.id);
      const accent = zone?.color ?? Color.rgb(0.6, 0.6, 0.6);
      const { x, w } = this.surfaceRegion(i);
      const cx = x + w * 0.5;
      const bw = Math.min(w - 26, 54);

      // Silhueta do predio — forma diferente por zona da superficie.
      const dark = Color.rgb(0.10, 0.11, 0.15);
      if (sz.id === 'torres') {
        const bh = 58;
        this.g.rect(cx - bw * 0.32, groundY - bh, bw * 0.64, bh).fill(Color.hex(dark));
        this.g.moveTo(cx, groundY - bh).lineTo(cx, groundY - bh - 8)
          .stroke({ color: Color.hex(accent), width: 1.5, alpha: 0.7 });
      } else if (sz.id === 'catedral') {
        const bh = 44;
        this.g.rect(cx - bw * 0.42, groundY - bh, bw * 0.84, bh).fill(Color.hex(dark));
        this.g.poly([cx - bw * 0.42, groundY - bh, cx, groundY - bh - 18, cx + bw * 0.42, groundY - bh])
          .fill(Color.hex(dark));
      } else {
        // cordilheira — aglomerado baixo de barracos.
        const bh = 30;
        this.g.rect(cx - bw * 0.5, groundY - bh, bw * 0.5, bh).fill(Color.hex(dark));
        this.g.rect(cx - bw * 0.05, groundY - bh * 0.7, bw * 0.5, bh * 0.7).fill(Color.hex(dark));
      }

      // Janelas acesas (piscam fora de fase entre as zonas).
      const blink = 0.45 + 0.4 * Math.abs(Math.sin(t * 0.002 + i * 1.7));
      for (let wy = 0; wy < 3; wy++) {
        for (let wx = 0; wx < 2; wx++) {
          this.g.rect(cx - 8 + wx * 9, groundY - 38 + wy * 11, 4, 5)
            .fill({ color: Color.hex(accent), alpha: 0.30 * blink });
        }
      }

      // Badge brilhante (a "bolinha" da zona) acima do predio.
      const pulse = 0.7 + 0.3 * Math.abs(Math.sin(t * 0.003 + i));
      const by = groundY - 52;
      this.g.circle(cx, by, 7).fill({ color: Color.hex(accent), alpha: 0.14 * pulse });
      this.g.circle(cx, by, 4).fill({ color: Color.hex(accent), alpha: 0.85 });
      this.g.circle(cx, by, 1.8).fill({ color: 0xffffff, alpha: 0.9 * pulse });
    }

    // Linha fraca do chao separando as ruinas no ceu da escotilha das hordas.
    this.g.moveTo(10, groundY).lineTo(GameConfig.VIEWPORT_WIDTH - 10, groundY)
      .stroke({ color: Color.hex(Color.rgb(0.30, 0.22, 0.14)), width: 1, alpha: 0.5 });
  }

  // ── Rotulos dos nomes das salas (legibilidade) ─────────────────────────────
  private buildRoomLabels(): void {
    for (const room of HubData.ROOMS) {
      if (HubData.isRocketRoom(room) || room.floor === 1 || !room.label) continue;
      const x = this.cellWidth * room.col;
      const y = this.roomYOffset[room.id] ?? 0;
      const isZone = !!room.zone_id;
      const label = new Text({
        text: room.label,
        style: {
          fontFamily: '"Space Grotesk", system-ui, sans-serif',
          fontSize: 11,
          fontWeight: '700',
          fill: isZone ? 0xf6faef : 0xd6decb,
          letterSpacing: 0.2,
          align: 'center',
          dropShadow: { color: 0x000000, alpha: 0.95, blur: 3, distance: 1, angle: Math.PI / 2 },
        },
      });
      // Canto superior-esquerdo da sala: mantem o rotulo longe da faixa de
      // recursos (embaixo) e do badge da zona (canto superior-direito).
      label.anchor.set(0, 0);
      label.x = x + 6;
      label.y = y + 5;
      this.addChild(label);
      this.roomLabels.push(label);
    }
  }

  /** Mostra/esconde as silhuetas-pista conforme as salas vao sendo liberadas. */
  private refreshSilhouettes(): void {
    for (const [roomId, label] of this.silhouetteLabels) {
      label.visible = !HubState.isRoomUnlocked(roomId);
    }
  }

  private applyVariant(): void {
    this.variantColors = HubState.getVariantData();
  }

  // ── Desenho (montado a cada redraw, na ordem das camadas) ──────────────────
  private redraw(): void {
    this.g.clear();
    this.drawSideWalls();
    for (const room of HubData.ROOMS) this.drawRoom(room);
    drawRocketShaft(this.drawCtx, {
      cellWidth: this.cellWidth,
      surfaceH: this.SURFACE_H,
      floorH: this.floorH,
    });
    this.drawSurfaceZoneBuildings();
    this.drawGridLines();
    this.drawAmbientSpores();
  }

  /** Paredes de rocha nas laterais, com "costuras" irregulares de pedra. */
  private drawSideWalls(): void {
    const surfaceH = this.SURFACE_H;
    const totalH = this.getTotalH();
    const wallW = 10;
    const ww = GameConfig.VIEWPORT_WIDTH;
    const rock = Color.rgb(0.04, 0.03, 0.02);
    const seam = Color.rgb(0.18, 0.13, 0.09);
    this.g
      .rect(0, surfaceH, wallW, totalH - surfaceH).fill(Color.hex(rock))
      .rect(ww - wallW, surfaceH, wallW, totalH - surfaceH).fill(Color.hex(rock));
    // Pequenas riscas pseudo-aleatorias (derivadas de y) imitam camadas de rocha.
    for (let y = surfaceH + 12; y < totalH; y += 22 + ((y * 13) % 9)) {
      this.g.moveTo(0, y).lineTo(wallW - 1, y + (((y * 7) % 4) - 2))
        .stroke({ color: Color.hex(seam), width: 1, alpha: 0.55 });
      this.g.moveTo(ww - wallW + 1, y + (((y * 11) % 4) - 2)).lineTo(ww, y)
        .stroke({ color: Color.hex(seam), width: 1, alpha: 0.55 });
    }
    this.g.moveTo(wallW, surfaceH).lineTo(wallW, totalH)
      .stroke({ color: Color.hex(seam), width: 1.5, alpha: 0.7 });
    this.g.moveTo(ww - wallW, surfaceH).lineTo(ww - wallW, totalH)
      .stroke({ color: Color.hex(seam), width: 1.5, alpha: 0.7 });
  }

  /** Desenha uma sala completa: fundo, interior, detalhes e moldura.
   *  Salas trancadas recebem um visual "entulhado" diferente. */
  private drawRoom(room: HubRoom): void {
    if (HubData.isRocketRoom(room)) return;
    const x = this.cellWidth * room.col;
    const y = this.roomYOffset[room.id] ?? 0;
    const w = this.cellWidth * room.w;
    const h = this.roomFloorH(room);

    if (!HubState.isRoomUnlocked(room.id)) {
      this.drawLockedRoom(room, x, y, w, h);
      return;
    }

    // Ordem importa: cada camada e desenhada por cima da anterior.
    this.g.rect(x, y, w, h).fill(Color.hex(this.getRoomBaseColor(room)));
    drawRoomInterior(this.drawCtx, room, x, y, w, h);
    this.drawAiScar(room, x, y, w, h);
    this.applyRoomLighting(room, x, y, w, h);
    this.drawRoomVignette(x, y, w, h);
    this.drawRoomTopLight(x, y, w, h, room);
    this.drawFungalAccents(room, x, y, w, h);
    this.drawZoneBadgeIfNeeded(room, x, y, w, h);
    this.g.rect(x, y, w, h).stroke({ color: Color.hex(Color.rgb(0.46, 0.42, 0.34)), width: 1.5, alpha: 0.86 });
  }

  // ── Motivo narrativo: o fungo da colonia retomando a maquina morta ─────────

  /** Paleta bioluminescente conforme o "clima" de cada tipo de sala. */
  private fungalTone(room: HubRoom): RGBA {
    switch (room.type) {
      case 'lab':
      case 'spore-chamber':
      case 'bedroom':
        return Color.rgb(0.74, 0.47, 0.86); // roxo de esporo
      case 'server':
      case 'neural-mushroom':
      case 'medical':
      case 'mycelium-lab':
        return Color.rgb(0.32, 0.86, 0.58); // verde neural
      case 'kitchen':
      case 'fungus-kitchen':
      case 'workshop':
      case 'hyphae-forge':
      case 'storage':
        return Color.rgb(0.95, 0.64, 0.30); // ambar quente
      default:
        return Color.rgb(0.30, 0.82, 0.76); // ciano de micelio
    }
  }

  /** Micelio subindo de um canto inferior + alguns cogumelos brilhantes.
   *  A "forma" do crescimento e semeada pelo id da sala (seededRng), entao fica
   *  estavel quadro a quadro; so o brilho (glow) pulsa com o tempo. */
  private drawFungalAccents(room: HubRoom, x: number, y: number, w: number, h: number): void {
    const tone = this.fungalTone(room);
    const dark: RGBA = { r: tone.r * 0.45, g: tone.g * 0.45, b: tone.b * 0.45, a: 1 };
    const rng = seededRng(strHash('fungus_' + room.id));
    const t = this.elapsedMs;
    const fromLeft = rng() < 0.5;
    const baseX = fromLeft ? x + 4 : x + w - 4;
    const dir = fromLeft ? 1 : -1;
    const floorY = y + h - 3;

    // Fios de micelio escalando a parede a partir do canto.
    const threads = 3;
    for (let i = 0; i < threads; i++) {
      const len = h * (0.3 + rng() * 0.4);
      const sway = (4 + rng() * 6) * dir;
      const tx = baseX + dir * (2 + i * 3);
      this.g
        .moveTo(tx, floorY)
        .bezierCurveTo(tx + sway, floorY - len * 0.4, tx - sway, floorY - len * 0.7, tx + sway * 0.5, floorY - len)
        .stroke({ color: Color.hex(dark), width: 1, alpha: 0.5 });
    }

    // Cogumelos brilhantes agrupados no canto do chao.
    const caps = 2 + Math.floor(rng() * 2);
    for (let i = 0; i < caps; i++) {
      const cx = baseX + dir * (3 + rng() * w * 0.32);
      const cyy = floorY - rng() * 5;
      const r = 2 + rng() * 2.2;
      const pulse = 0.55 + 0.45 * Math.abs(Math.sin(t * 0.0022 + i * 1.7 + (fromLeft ? 0 : 1)));
      // pe (stem)
      this.g.rect(cx - 0.8, cyy - r * 1.6, 1.6, r * 1.6).fill({ color: Color.hex(Color.rgb(0.82, 0.78, 0.64)), alpha: 0.8 });
      // halo de brilho + chapeu (cap)
      this.g.circle(cx, cyy - r * 1.6, r * 2.4).fill({ color: Color.hex(tone), alpha: 0.10 * pulse });
      const capC: RGBA = { r: tone.r * pulse, g: tone.g * pulse, b: tone.b * pulse, a: 1 };
      this.g.circle(cx, cyy - r * 1.6, r).fill(Color.hex(capC));
      this.g.circle(cx, cyy - r * 1.6, r * 0.45).fill({ color: 0xffffff, alpha: 0.55 * pulse });
    }

    // Esporo flutuando acima do grupo.
    const sy = floorY - (h * 0.4) - ((t * 0.012) % (h * 0.4));
    this.g.circle(baseX + dir * 8, sy, 1).fill({ color: Color.hex(tone), alpha: 0.4 });
  }

  /** "Cicatriz da IA" fria nas salas de tecnologia — a assinatura do sistema
   *  rebelde, agora meio estrangulada pela colonia. */
  private drawAiScar(room: HubRoom, x: number, y: number, w: number, h: number): void {
    const t = this.elapsedMs;
    if (room.type === 'tech') {
      // Olho de vigilancia ARGOS, apagado e piscando.
      const ex = x + w * 0.78;
      const ey = y + h * 0.3;
      const blink = 0.25 + 0.35 * Math.abs(Math.sin(t * 0.0016));
      this.g.circle(ex, ey, 7).stroke({ color: Color.hex(Color.rgb(0.82, 0.22, 0.20)), width: 1, alpha: 0.5 * blink });
      this.g.circle(ex, ey, 3).fill({ color: Color.hex(Color.rgb(0.90, 0.20, 0.18)), alpha: 0.85 * blink });
      this.g.circle(ex, ey, 1.2).fill({ color: 0x000000, alpha: 0.7 });
    } else if (room.type === 'office') {
      // FLOW logistica: uma linha azul fria de roteamento sendo coberta.
      const ly = y + h * 0.22;
      this.g.moveTo(x + w * 0.15, ly).lineTo(x + w * 0.85, ly)
        .stroke({ color: Color.hex(Color.rgb(0.22, 0.45, 0.82)), width: 1, alpha: 0.4 });
      const nodeX = x + w * (0.2 + ((t * 0.00006) % 0.6));
      this.g.circle(nodeX, ly, 1.6).fill({ color: Color.hex(Color.rgb(0.45, 0.70, 0.95)), alpha: 0.55 });
    }
  }

  // ── Acabamentos das salas (vinheta, luzes, badges) ─────────────────────────

  /** Vinheta: escurece as bordas da sala para dar profundidade (camadas). */
  private drawRoomVignette(x: number, y: number, w: number, h: number): void {
    const layers = 4;
    for (let i = 0; i < layers; i++) {
      const t = (i + 1) / layers;
      const ringSize = t * 6;
      this.g
        .rect(x, y, w, ringSize).fill({ color: 0x000000, alpha: 0.05 + 0.04 * (1 - t) })
        .rect(x, y + h - ringSize, w, ringSize).fill({ color: 0x000000, alpha: 0.05 + 0.04 * (1 - t) })
        .rect(x, y + ringSize, ringSize, h - ringSize * 2).fill({ color: 0x000000, alpha: 0.05 + 0.04 * (1 - t) })
        .rect(x + w - ringSize, y + ringSize, ringSize, h - ringSize * 2).fill({ color: 0x000000, alpha: 0.05 + 0.04 * (1 - t) });
    }
  }

  /** Faixa de luz fraca colada ao teto da sala, na cor da iluminacao dela. */
  private drawRoomTopLight(x: number, y: number, w: number, _h: number, room: HubRoom): void {
    const c = this.getLightColor(room.light);
    this.g.rect(x + 2, y + 2, w - 4, 1.5).fill({ color: Color.hex(c), alpha: 0.35 });
    for (let i = 0; i < 4; i++) {
      this.g.rect(x + 2, y + 4 + i, w - 4, 1).fill({ color: Color.hex(c), alpha: 0.04 - i * 0.008 });
    }
  }

  /** Sala trancada: entulho, rachaduras e uma caixa central — sem decoracao. */
  private drawLockedRoom(room: HubRoom, x: number, y: number, w: number, h: number): void {
    drawGradientRect(this.g, x, y, w, h, Color.rgb(0.18, 0.14, 0.09), Color.rgb(0.28, 0.20, 0.13));
    const rng = seededRng(strHash(room.id));
    for (let i = 0; i < 22; i++) {
      const px = x + rng() * w;
      const py = y + rng() * h;
      this.g.circle(px, py, 1.5).fill({ color: Color.hex(Color.rgb(0.25, 0.18, 0.12)), alpha: 0.5 });
    }
    for (let i = 0; i < 3; i++) {
      const vy = y + h * (0.2 + i * 0.3);
      this.g.moveTo(x + 6, vy).lineTo(x + w - 6, vy + 4)
        .stroke({ color: Color.hex(Color.rgb(0.22, 0.16, 0.10)), width: 1, alpha: 0.6 });
    }
    const rcx = x + w * 0.5;
    const rcy = y + h * 0.5;
    const boxW = Math.min(w * 0.55, 80);
    const boxH = Math.min(h * 0.45, 50);
    this.g.rect(rcx - boxW * 0.5, rcy - boxH * 0.5, boxW, boxH)
      .fill({ color: Color.hex(Color.rgb(0.28, 0.25, 0.22)), alpha: 0.35 });
    this.g.rect(rcx - boxW * 0.5, rcy - boxH * 0.5, boxW, boxH)
      .stroke({ color: Color.hex(Color.rgb(0.45, 0.40, 0.35)), width: 1, alpha: 0.5 });
    this.g.rect(x, y, w, h).stroke({ color: Color.hex(Color.rgb(0.40, 0.31, 0.22)), width: 1.5, alpha: 0.75 });
  }

  /** Cor de fundo base de cada tipo de sala (antes do interior e das luzes). */
  private getRoomBaseColor(room: HubRoom): RGBA {
    switch (room.type) {
      case 'surface': return Color.rgb(0.08, 0.06, 0.03);
      case 'surface-exit': return Color.rgb(0.2, 0.1, 0.05);
      case 'tech': return Color.rgb(0.08, 0.08, 0.12);
      case 'storage': return Color.rgb(0.12, 0.10, 0.08);
      case 'medical':
      case 'mycelium-lab': return Color.rgb(0.08, 0.14, 0.11);
      case 'lab':
      case 'spore-chamber': return Color.rgb(0.12, 0.09, 0.16);
      case 'common': return Color.rgb(0.1, 0.09, 0.07);
      case 'kitchen':
      case 'fungus-kitchen': return Color.rgb(0.13, 0.10, 0.07);
      case 'workshop':
      case 'hyphae-forge': return Color.rgb(0.14, 0.11, 0.07);
      case 'archive': return Color.rgb(0.1, 0.10, 0.12);
      case 'server':
      case 'neural-mushroom': return Color.rgb(0.06, 0.08, 0.06);
      case 'office': return Color.rgb(0.12, 0.12, 0.10);
      case 'bedroom': return Color.rgb(0.12, 0.08, 0.10);
      case 'transit': return Color.rgb(0.10, 0.09, 0.08);
      default: return Color.rgb(0.08, 0.08, 0.08);
    }
  }

  /** Tinge a sala inteira com a cor da iluminacao (camada semitransparente). */
  private applyRoomLighting(room: HubRoom, x: number, y: number, w: number, h: number): void {
    const c = this.getLightColor(room.light);
    this.g.rect(x, y, w, h).fill({ color: Color.hex(c), alpha: 0.32 });
  }

  /** Traduz o nome da iluminacao da sala em uma cor RGB. */
  private getLightColor(light: string): RGBA {
    switch (light) {
      case 'red': return Color.rgb(0.82, 0.29, 0.25);
      case 'cool': return Color.rgb(0.0, 1.0, 0.533);
      case 'clinical': return Color.rgb(0.8, 0.85, 0.85);
      case 'hospital': return Color.rgb(0.565, 0.878, 0.722);
      case 'amber':
      case 'amber-hot':
      case 'warm': return Color.rgb(0.91, 0.58, 0.23);
      case 'neon-green': return Color.rgb(0.0, 1.0, 0.533);
      case 'office': return Color.rgb(0.56, 0.66, 0.78);
      case 'pink-dim': return Color.rgb(0.85, 0.53, 0.62);
      default: return Color.rgb(0.5, 0.5, 0.5);
    }
  }

  /** Badge pulsante da zona (a "bolinha" no canto da sala que leva a uma run). */
  private drawZoneBadgeIfNeeded(room: HubRoom, x: number, _y: number, w: number, _h: number): void {
    if (!room.zone_id) return;
    const zone = HubData.getZone(room.zone_id);
    if (!zone) return;
    const pulse = Math.abs(Math.sin(this.elapsedFrames * 0.02)) * 0.3 + 0.7;
    const bcx = x + w - 10;
    const bcy = (this.roomYOffset[room.id] ?? 0) + 10;
    this.g.circle(bcx, bcy, 14).fill({ color: Color.hex(zone.color), alpha: 0.08 * pulse });
    this.g.circle(bcx, bcy, 10).fill({ color: Color.hex(zone.color), alpha: 0.16 * pulse });
    const c: RGBA = { r: zone.color.r * pulse, g: zone.color.g * pulse, b: zone.color.b * pulse, a: 1 };
    this.g.circle(bcx, bcy, 5).fill(Color.hex(c));
    this.g.circle(bcx, bcy, 2.5).fill({ color: 0xffffff, alpha: 0.85 * pulse });
  }

  /** Linhas verticais da grade do bunker (as "paredes" entre as colunas). */
  private drawGridLines(): void {
    const totalH = this.getTotalH();
    for (let col = 0; col < 7; col++) {
      const x = this.cellWidth * col;
      this.g.moveTo(x, 0).lineTo(x, totalH)
        .stroke({ color: Color.hex(this.variantColors.grid), width: 1.25, alpha: 0.92 });
    }
  }

  /** Esporos flutuantes de fundo — so aparecem dentro de salas ja liberadas. */
  private drawAmbientSpores(): void {
    const W = GameConfig.VIEWPORT_WIDTH;
    const H = GameConfig.VIEWPORT_HEIGHT;
    const t = this.elapsedMs * 0.0006;
    const purple = Color.rgb(0.72, 0.45, 0.85);
    const cyan = Color.rgb(0.30, 0.78, 0.72);
    for (let i = 0; i < 18; i++) {
      // Posicoes espalhadas por multiplos irracionais (espaca sem repetir feio).
      const baseX = (i * 97.3) % W;
      const baseY = (i * 53.1) % H;
      let py = (baseY - t * 12 * (1 + (i % 3) * 0.3)) % H;
      if (py < 0) py += H;
      const px = baseX + Math.sin(t + i) * 8;
      if (!this.isPointInUnlockedRoom(px, py)) continue;
      const alpha = 0.25 + 0.15 * Math.sin(t * 2 + i);
      const c = i % 2 === 0 ? purple : cyan;
      this.g.circle(px, py, 1.2).fill({ color: Color.hex(c), alpha });
    }
  }

  /** Diz se um ponto (px, py) cai dentro de alguma sala ja liberada. */
  private isPointInUnlockedRoom(px: number, py: number): boolean {
    for (const room of HubData.ROOMS) {
      if (HubData.isRocketRoom(room)) continue;
      const rx = this.cellWidth * room.col;
      const ry = this.roomYOffset[room.id] ?? 0;
      const rw = this.cellWidth * room.w;
      const rh = this.roomFloorH(room);
      if (px >= rx && px <= rx + rw && py >= ry && py <= ry + rh) {
        return HubState.isRoomUnlocked(room.id);
      }
    }
    return false;
  }
}
