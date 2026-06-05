import { Color, type RGBA } from '../../core/Color';
import { type HubRoom } from '../../state/HubData';
import { type DrawCtx, drawGradientRect } from './HubDrawKit';

/**
 * HubRoomInteriors — o "mobiliario" de cada sala do bunker.
 *
 * O hub mostra um corte do bunker com varias salas (laboratorio, cozinha,
 * enfermaria, servidores, etc). Cada tipo de sala tem uma decoracao propria:
 * macas na enfermaria, monitores na sala tecnica, cogumelos neurais na sala de
 * micelio, e assim por diante.
 *
 * Antes tudo isso vivia dentro do HubRenderer (que ja era enorme). Movemos para
 * ca porque sao funcoes de desenho "puras": elas so recebem onde desenhar
 * (x, y, largura, altura) e o contexto de desenho (DrawCtx, com a prancheta e o
 * cronometro de animacao) e pintam. Nenhuma logica de jogo, nenhum clique.
 *
 * Termos tecnicos: cada funcao desenha no mesmo Graphics; algumas animam usando
 * elapsedMs/elapsedFrames (pulse = piscar/brilhar com o tempo).
 */

/** Tabela: para cada tipo de sala, qual funcao desenha o interior dela.
 *  Tipos sem entrada aqui simplesmente nao tem decoracao interna. */
const INTERIOR_DRAWERS: Record<
  string,
  (ctx: DrawCtx, x: number, y: number, w: number, h: number) => void
> = {
  surface: (ctx, x, y, w, h) =>
    drawGradientRect(ctx.g, x, y, w, h, Color.rgb(0.06, 0.05, 0.03), Color.rgb(0.15, 0.10, 0.06)),
  'surface-exit': drawSurfaceExit,
  tech: drawMonitors,
  storage: drawShelves,
  medical: drawBeds,
  'mycelium-lab': drawMycelium,
  lab: drawBeakers,
  'spore-chamber': drawSporeChamber,
  common: drawTable,
  kitchen: drawStove,
  'fungus-kitchen': drawFungusKitchen,
  workshop: drawWorkbench,
  'hyphae-forge': drawHyphaeForge,
  archive: drawBooks,
  server: drawRacks,
  'neural-mushroom': drawNeuralMushroom,
  office: drawDesk,
  bedroom: drawBed,
  transit: drawDoor,
};

/** Ponto de entrada: desenha o interior da sala conforme o seu tipo. */
export function drawRoomInterior(
  ctx: DrawCtx,
  room: HubRoom,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  INTERIOR_DRAWERS[room.type]?.(ctx, x, y, w, h);
}

// ── Saida para a superficie (escotilha das hordas) ─────────────────────────
function drawSurfaceExit(ctx: DrawCtx, x: number, y: number, w: number, h: number): void {
  const { g } = ctx;
  drawGradientRect(g, x, y, w, h * 0.6, Color.rgb(0.3, 0.15, 0.08), Color.rgb(0.5, 0.2, 0.1));
  g.poly([
    x + w * 0.1, y + h * 0.5,
    x + w * 0.25, y + h * 0.2,
    x + w * 0.35, y + h * 0.5,
  ]).fill(Color.hex(Color.rgb(0.05, 0.05, 0.05)));
  // Pisca-pisca lento: a cada ~10 frames alterna ligado/desligado.
  if ((Math.floor(ctx.elapsedFrames / 10)) % 2 === 0) {
    for (let i = 0; i < 5; i++) {
      g.circle(x + 10 + i * 12, y + h * 0.45, 1).fill(Color.hex(Color.rgb(0.2, 0.1, 0.05)));
    }
  }
}

// ── Sala tecnica: tres monitores que piscam em vermelho ────────────────────
function drawMonitors(ctx: DrawCtx, x: number, y: number, w: number, h: number): void {
  const { g } = ctx;
  const red = Color.rgb(0.82, 0.29, 0.25);
  const monitorW = w * 0.25;
  const monitorH = h * 0.35;
  const startX = x + w * 0.12;
  const startY = y + h * 0.25;
  for (let i = 0; i < 3; i++) {
    const mx = startX + i * (monitorW + 4);
    g.rect(mx, startY, monitorW, monitorH).fill(Color.hex(Color.rgb(0.1, 0.1, 0.15)));
    g.rect(mx, startY, monitorW, monitorH).stroke({ color: Color.hex(Color.rgb(0.6, 0.6, 0.7)), width: 2 });
    if ((Math.floor(ctx.elapsedFrames / 15)) % 2 === 0) {
      g.rect(mx + 3, startY + 3, monitorW - 6, monitorH - 6).fill(Color.hex(red));
    }
  }
}

// ── Deposito: prateleiras com caixas ────────────────────────────────────────
function drawShelves(ctx: DrawCtx, x: number, y: number, w: number, h: number): void {
  const { g } = ctx;
  const shelfYStart = y + h * 0.3;
  const spacing = h * 0.15;
  for (let s = 0; s < 3; s++) {
    const sy = shelfYStart + s * spacing;
    g.moveTo(x + 8, sy).lineTo(x + w - 8, sy)
      .stroke({ color: Color.hex(Color.rgb(0.7, 0.6, 0.5)), width: 3 });
    for (let it = 0; it < 6; it++) {
      const itemW = (w - 16) / 6;
      const ix = x + 8 + it * itemW + itemW * 0.2;
      const c = s % 2 === 0 ? Color.rgb(0.85, 0.75, 0.55) : Color.rgb(1.0, 0.9, 0.4);
      g.rect(ix, sy - 8, itemW * 0.6, 10).fill(Color.hex(c));
    }
  }
}

// ── Enfermaria: duas macas e um monitor verde ──────────────────────────────
function drawBeds(ctx: DrawCtx, x: number, y: number, w: number, h: number): void {
  const { g } = ctx;
  const bedH = h * 0.25;
  const bedY = y + h * 0.35;
  g.rect(x + 8, bedY, w * 0.35, bedH).fill(Color.hex(Color.rgb(0.8, 0.95, 0.85)));
  g.rect(x + w * 0.57, bedY, w * 0.35, bedH).fill(Color.hex(Color.rgb(0.8, 0.95, 0.85)));
  g.circle(x + w - 12, bedY + bedH * 0.5, 6).fill(Color.hex(Color.rgb(0.0, 1.0, 0.533)));
}

// ── Laboratorio: tres bequeres coloridos ────────────────────────────────────
function drawBeakers(ctx: DrawCtx, x: number, y: number, w: number, h: number): void {
  const { g } = ctx;
  const beakerY = y + h * 0.4;
  const size = h * 0.2;
  const colors = [Color.rgb(0.31, 0.722, 0.447), Color.rgb(0.722, 0.353, 0.851), Color.rgb(1, 0.7, 0.2)];
  const spacing = w * 0.25;
  for (let i = 0; i < 3; i++) {
    const bx = x + w * 0.15 + i * spacing;
    g.rect(bx - size * 0.5, beakerY, size, size * 1.2).stroke({ color: Color.hex(colors[i]!), width: 2 });
    g.circle(bx, beakerY + size * 0.6, size * 0.3).fill(Color.hex(colors[i]!));
  }
}

// ── Sala comum: mesa com pratos quentes ─────────────────────────────────────
function drawTable(ctx: DrawCtx, x: number, y: number, w: number, h: number): void {
  const { g } = ctx;
  const tableY = y + h * 0.4;
  const tableH = h * 0.2;
  g.rect(x + w * 0.1, tableY, w * 0.8, tableH).fill(Color.hex(Color.rgb(0.55, 0.42, 0.24)));
  const amber = Color.rgb(0.91, 0.58, 0.23);
  for (let i = 0; i < 4; i++) {
    const icx = x + w * 0.2 + i * w * 0.2;
    g.circle(icx, tableY + tableH * 0.5, 6).fill(Color.hex(amber));
  }
}

// ── Cozinha: fogao com quatro bocas acesas ──────────────────────────────────
function drawStove(ctx: DrawCtx, x: number, y: number, w: number, h: number): void {
  const { g } = ctx;
  const stoveW = w * 0.35;
  const stoveH = h * 0.3;
  const stoveY = y + h * 0.3;
  const stoveX = x + w * 0.325 - stoveW * 0.5;
  g.rect(stoveX, stoveY, stoveW, stoveH).fill(Color.hex(Color.rgb(0.25, 0.25, 0.25)));
  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 2; j++) {
      g.circle(stoveX + 8 + i * 15, stoveY + 8 + j * 15, 5).fill(Color.hex(Color.rgb(1, 0.5, 0.2)));
    }
  }
}

// ── Oficina: bancada com luzinha de trabalho que pisca ─────────────────────
function drawWorkbench(ctx: DrawCtx, x: number, y: number, w: number, h: number): void {
  const { g } = ctx;
  const benchY = y + h * 0.35;
  const benchH = h * 0.25;
  g.rect(x + 8, benchY, w - 16, benchH).fill(Color.hex(Color.rgb(0.35, 0.35, 0.35)));
  for (let i = 0; i < 4; i++) {
    const vx = x + 20 + i * (w - 40) * 0.25;
    g.moveTo(vx, benchY + 4).lineTo(vx, benchY + benchH - 4)
      .stroke({ color: Color.hex(Color.rgb(0.7, 0.7, 0.7)), width: 2 });
  }
  if ((Math.floor(ctx.elapsedFrames / 8)) % 3 === 0) {
    g.circle(x + w - 12, benchY + benchH * 0.5, 4).fill(Color.hex(Color.rgb(1, 0.7, 0.3)));
  }
}

// ── Arquivo: estante de livros coloridos ────────────────────────────────────
function drawBooks(ctx: DrawCtx, x: number, y: number, w: number, h: number): void {
  const { g } = ctx;
  const shelfYStart = y + h * 0.3;
  const spacing = h * 0.15;
  const bookW = (w - 16) / 6;
  const colors = [
    Color.rgb(1.0, 0.4, 0.2), Color.rgb(0.8, 0.2, 0.2), Color.rgb(0.6, 0.3, 0.15),
    Color.rgb(0.7, 0.5, 0.3), Color.rgb(0.5, 0.7, 0.4), Color.rgb(0.4, 0.6, 0.5),
  ];
  for (let r = 0; r < 3; r++) {
    const sy = shelfYStart + r * spacing;
    for (let c = 0; c < 6; c++) {
      g.rect(x + 8 + c * bookW, sy, bookW - 2, 12).fill(Color.hex(colors[c % 6]!));
    }
  }
}

// ── Servidores: racks verdes com LEDs ───────────────────────────────────────
function drawRacks(ctx: DrawCtx, x: number, y: number, w: number, h: number): void {
  const { g } = ctx;
  const green = Color.rgb(0.0, 1.0, 0.533);
  const rackY = y + h * 0.2;
  const rackW = w * 0.22;
  const rackH = h * 0.45;
  for (let i = 0; i < 3; i++) {
    const rx = x + w * 0.1 + i * (rackW + 6);
    g.rect(rx, rackY, rackW, rackH).stroke({ color: Color.hex(green), width: 2 });
    for (let j = 0; j < 5; j++) {
      g.circle(rx + rackW * 0.5, rackY + 6 + j * (rackH - 12) * 0.25, 2).fill(Color.hex(green));
    }
  }
}

// ── Escritorio: mesa com monitor azul ───────────────────────────────────────
function drawDesk(ctx: DrawCtx, x: number, y: number, w: number, h: number): void {
  const { g } = ctx;
  const deskY = y + h * 0.35;
  const deskW = w * 0.6;
  const deskH = h * 0.2;
  const deskX = x + w * 0.2;
  g.rect(deskX, deskY, deskW, deskH).fill(Color.hex(Color.rgb(0.25, 0.2, 0.15)));
  g.rect(deskX + 8, deskY - 12, deskW - 16, 10).fill(Color.hex(Color.rgb(0.05, 0.08, 0.15)));
  g.rect(deskX + 8, deskY - 12, deskW - 16, 10).stroke({ color: Color.hex(Color.rgb(0.3, 0.5, 0.8)), width: 2 });
}

// ── Dormitorio: cama com lencol ─────────────────────────────────────────────
function drawBed(ctx: DrawCtx, x: number, y: number, w: number, h: number): void {
  const { g } = ctx;
  const bedY = y + h * 0.35;
  const bedW = w * 0.6;
  const bedH = h * 0.25;
  const bedX = x + w * 0.2;
  g.rect(bedX, bedY, bedW, bedH).fill(Color.hex(Color.rgb(0.84, 0.39, 0.55)));
  g.moveTo(bedX + 2, bedY + 2).lineTo(bedX + bedW - 2, bedY + 2)
    .stroke({ color: Color.hex(Color.rgb(1, 0.95, 0.9)), width: 2 });
}

// ── Transito: uma porta com maçaneta ────────────────────────────────────────
function drawDoor(ctx: DrawCtx, x: number, y: number, w: number, h: number): void {
  const { g } = ctx;
  g.rect(x + w * 0.3, y + h * 0.15, w * 0.4, h * 0.65).fill(Color.hex(Color.rgb(0.15, 0.15, 0.15)));
  g.rect(x + w * 0.3, y + h * 0.15, w * 0.4, h * 0.65).stroke({ color: Color.hex(Color.rgb(0.3, 0.3, 0.3)), width: 3 });
  g.circle(x + w * 0.65, y + h * 0.48, 4).fill(Color.hex(Color.rgb(0.8, 0.8, 0.8)));
}

// ── Interiores bio/fungo ────────────────────────────────────────────────────

// ── Camara de esporos: vasos roxos que pulsam + esporos subindo ────────────
function drawSporeChamber(ctx: DrawCtx, x: number, y: number, w: number, h: number): void {
  const { g, elapsedFrames } = ctx;
  const purple = Color.rgb(0.72, 0.45, 0.85);
  const glow = Color.rgb(0.85, 0.60, 1.0);
  // pulse: brilho que respira entre 0.7 e 1.0 conforme o tempo passa.
  const pulse = Math.abs(Math.sin(elapsedFrames * 0.04)) * 0.3 + 0.7;
  for (let i = 0; i < 3; i++) {
    const icx = x + w * (0.22 + i * 0.29);
    const icy = y + h * 0.62;
    g.rect(icx - 2, icy, 4, 14).fill(Color.hex(Color.rgb(0.85, 0.78, 0.62)));
    const mod1: RGBA = { r: purple.r * pulse, g: purple.g * pulse, b: purple.b * pulse, a: 1 };
    g.circle(icx, icy, 8).fill(Color.hex(mod1));
    const mod2: RGBA = { r: glow.r * pulse * 0.6, g: glow.g * pulse * 0.6, b: glow.b * pulse * 0.6, a: 1 };
    g.circle(icx, icy - 2, 6).fill(Color.hex(mod2));
  }
  for (let i = 0; i < 6; i++) {
    const sx = x + w * (0.15 + i * 0.12);
    const sy = y + h * 0.3 + Math.sin(elapsedFrames * 0.03 + i) * 6;
    const sp: RGBA = { r: purple.r * 0.8, g: purple.g * 0.8, b: purple.b * 0.8, a: 1 };
    g.circle(sx, sy, 1.5).fill(Color.hex(sp));
  }
}

// ── Sala de micelio: fios ciano descendo com cogumelinhos ──────────────────
function drawMycelium(ctx: DrawCtx, x: number, y: number, w: number, h: number): void {
  const { g } = ctx;
  const cyan = Color.rgb(0.30, 0.78, 0.72);
  for (let i = 0; i < 5; i++) {
    const x1 = x + w * (0.1 + i * 0.18);
    const x2 = x1 + Math.sin(i) * 8;
    const c: RGBA = { r: cyan.r * 0.6, g: cyan.g * 0.6, b: cyan.b * 0.6, a: 1 };
    g.moveTo(x1, y + h * 0.25).lineTo(x2, y + h * 0.75)
      .stroke({ color: Color.hex(c), width: 1.5 });
  }
  for (let i = 0; i < 4; i++) {
    const icx = x + w * (0.15 + i * 0.22);
    const icy = y + h * 0.75;
    g.rect(icx - 1, icy - 6, 2, 6).fill(Color.hex(Color.rgb(0.85, 0.82, 0.72)));
    g.circle(icx, icy - 6, 4).fill(Color.hex(cyan));
  }
}

// ── Cozinha de fungos: caldeirao soltando vapor verde ──────────────────────
function drawFungusKitchen(ctx: DrawCtx, x: number, y: number, w: number, h: number): void {
  const { g, elapsedFrames } = ctx;
  g.rect(x + w * 0.15, y + h * 0.55, w * 0.7, h * 0.12).fill(Color.hex(Color.rgb(0.35, 0.28, 0.20)));
  const potCx = x + w * 0.5;
  const potCy = y + h * 0.48;
  g.rect(potCx - 12, potCy - 6, 24, 14).fill(Color.hex(Color.rgb(0.15, 0.15, 0.15)));
  const pulse = Math.abs(Math.sin(elapsedFrames * 0.05)) * 0.4 + 0.4;
  for (let i = 0; i < 3; i++) {
    const vx = potCx - 6 + i * 6;
    g.circle(vx, potCy - 10, 2).fill({ color: Color.hex(Color.rgb(0.72, 0.85, 0.72)), alpha: pulse });
  }
  for (let i = 0; i < 3; i++) {
    const mx = x + w * (0.22 + i * 0.22);
    g.rect(mx - 1, y + h * 0.52, 2, 6).fill(Color.hex(Color.rgb(0.82, 0.72, 0.55)));
    g.circle(mx, y + h * 0.52, 3).fill(Color.hex(Color.rgb(0.78, 0.45, 0.35)));
  }
}

// ── Forja de hifas: brasas ambar e "barras" crescendo como hifas ───────────
function drawHyphaeForge(ctx: DrawCtx, x: number, y: number, w: number, h: number): void {
  const { g, elapsedFrames } = ctx;
  const amber = Color.rgb(0.91, 0.58, 0.23);
  const pulse = Math.abs(Math.sin(elapsedFrames * 0.03)) * 0.5 + 0.5;
  g.rect(x + w * 0.2, y + h * 0.65, w * 0.6, h * 0.1).fill(Color.hex(Color.rgb(0.25, 0.12, 0.06)));
  for (let i = 0; i < 5; i++) {
    const ex = x + w * (0.25 + i * 0.12);
    const a: RGBA = { r: amber.r * pulse, g: amber.g * pulse, b: amber.b * pulse, a: 1 };
    g.circle(ex, y + h * 0.70, 3).fill(Color.hex(a));
  }
  for (let i = 0; i < 4; i++) {
    const rx = x + w * (0.25 + i * 0.17);
    const points: Array<[number, number]> = [
      [rx, y + h * 0.65], [rx + 3, y + h * 0.5], [rx - 2, y + h * 0.35], [rx + 1, y + h * 0.22],
    ];
    for (let p = 0; p < points.length - 1; p++) {
      g.moveTo(points[p]![0], points[p]![1])
        .lineTo(points[p + 1]![0], points[p + 1]![1])
        .stroke({ color: Color.hex(Color.rgb(0.55, 0.35, 0.18)), width: 2 });
    }
  }
}

// ── Cogumelo neural: nos conectados como uma rede neural ───────────────────
function drawNeuralMushroom(ctx: DrawCtx, x: number, y: number, w: number, h: number): void {
  const { g, elapsedFrames } = ctx;
  const green = Color.rgb(0.30, 0.78, 0.60);
  const pulse = Math.abs(Math.sin(elapsedFrames * 0.04)) * 0.5 + 0.5;
  const nodes: Array<[number, number]> = [
    [x + w * 0.2, y + h * 0.3], [x + w * 0.5, y + h * 0.4], [x + w * 0.8, y + h * 0.3],
    [x + w * 0.3, y + h * 0.65], [x + w * 0.7, y + h * 0.65],
  ];
  // Liga cada par de nos proximos com uma "sinapse" (linha fraca).
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i]!;
      const b = nodes[j]!;
      const dist = Math.hypot(a[0] - b[0], a[1] - b[1]);
      if (dist < w * 0.5) {
        const c: RGBA = { r: green.r * pulse * 0.4, g: green.g * pulse * 0.4, b: green.b * pulse * 0.4, a: 1 };
        g.moveTo(a[0], a[1]).lineTo(b[0], b[1]).stroke({ color: Color.hex(c), width: 1 });
      }
    }
  }
  for (const n of nodes) {
    const c: RGBA = { r: green.r * pulse, g: green.g * pulse, b: green.b * pulse, a: 1 };
    g.circle(n[0], n[1], 5).fill(Color.hex(c));
    g.circle(n[0], n[1], 3).fill(Color.hex(Color.rgb(0.6, 0.95, 0.8)));
  }
}
