// ============================================================================
// HORDAS — A FLORESTA AUTOMATIZADA DA IA (arena estilo Vampire Survivors)
// ----------------------------------------------------------------------------
// O que e esta fase, em palavras simples:
//   - Dr. Myco esta numa floresta infinita controlada pela IA. Robos-
//     jardineiros surgem em ondas cada vez maiores e correm atras dele.
//   - Myco NAO atira sozinho com botoes: ele so se DESLOCA (com um joystick
//     flutuante que aparece onde voce toca). As armas dele disparam automaticamente.
//   - Matar inimigos solta gemas de XP; juntar XP sobe de nivel; ao subir,
//     voce escolhe uma melhoria (nova arma, mais nivel de arma, ou uma passiva).
//   - O objetivo de verdade e arriscado: existem NODULOS DE BIOMASSA. Para
//     coletar um, Myco precisa ficar PARADO em cima dele por alguns segundos,
//     com as armas guardadas e tomando dano extra, enquanto a IA despeja reforcos.
//   - Atingir a meta de biomassa ABRE a extracao (e invoca um boss). Mas quanto
//     mais voce coleta e mais tempo sobrevive, maior o multiplicador de
//     recompensa — fica a tentacao de "empurrar a sorte" e colher mais.
//
// Como o codigo esta organizado (pasta hordas/):
//   - config.ts ........ todos os numeros de balanceamento (vidas, dano, etc.)
//   - entities.ts ...... os "formatos" de cada coisa movel (inimigo, gema, ...)
//   - separation.ts .... o algoritmo que evita inimigos amontoados
//   - HordasRenderer.ts  toda a parte de desenhar a tela e o HUD
//   - HordasScene.ts ... ESTE arquivo: a logica do jogo e a "cola" entre tudo
//
// A classe HordasScene continua exportada deste mesmo arquivo (o resto do jogo
// importa ela daqui), entao nada quebra para quem usa esta fase.
// ============================================================================

import { Container, Graphics, Text } from 'pixi.js';
import { audioManager } from '../../core/AudioManager';
import { FontFamily, TextColor } from '../../core/typography';
import { HubState } from '../../state/HubState';
import type { Vec2 } from '../../core/types';
import { RunJuice } from '../../run/fx/RunJuice';
import { bindDrag, type DragInput } from './RunFrame';
import { RunScene } from './RunScene';
import {
  AURA, BASE_HP, BASE_PICKUP, BASE_SPEED, BUFF_TIME, DART, DESPAWN_R, ENEMY_CAP,
  ESTATS, FOREST, GOAL, HARVEST_DECAY, HARVEST_DIST, HARVEST_NEARBY, HARVEST_SURGE,
  HARVEST_TIME, HARVEST_VULN, JOY_DEAD, JOY_MAX, MAXLV, MOVE_ACCEL, NOVA, ORBIT,
  PASSIVE_DESC, PASSIVE_NAME, PLANT_CULL_R, PLANT_DIST, PLANT_TYPES, PLANTS,
  PLANTS_NEARBY, PLAYER_R, PROJ_LIFE, PROJ_SPEED, SHADOW, SPAWN_MIN, SPAWN_RING,
  SPAWN_START, TAU, TOUCH_CD, VH, VW, WEAPON_DESC, WEAPON_NAME, ZONE,
  type EKind, type PassiveId, type PlantType, type WeaponId,
} from './hordas/config';
import { rand, type Enemy, type Gem, type Node, type Nova, type Offer, type Plant, type Proj } from './hordas/entities';
import { computeSeparation, createSepScratch, type SepScratch } from './hordas/separation';
import { HordasRenderer } from './hordas/HordasRenderer';

/** Cena principal da fase Hordas. Cuida da LOGICA do jogo; o desenho fica no
 *  HordasRenderer e os numeros no config. Veja o bloco no topo do arquivo. */
export class HordasScene extends RunScene {
  protected readonly zone = ZONE;

  private content = new Container();  // container que treme com o RunJuice; segura fundo + camera
  private camera = new Container();   // deslocado por -cam; segura o mundo (inimigos, jogador, ...)
  private overlay = new Container();  // HUD fixo de tela (nao se mexe com a camera)

  private renderer = new HordasRenderer();  // tudo que desenha a tela mora aqui

  drag!: DragInput;

  // ── Estado do jogador (em coordenadas do mundo; o mundo nao tem bordas) ────
  // OBS: campos sem "private" sao lidos pelo HordasRenderer (interface HordasView).
  // Eles continuam parte interna da fase — nada disso e usado fora desta pasta.
  player: Vec2 = { x: 0, y: 0 };
  private vel: Vec2 = { x: 0, y: 0 };
  hp = BASE_HP;
  maxHp = BASE_HP;
  private moveSpeed = BASE_SPEED;
  private pickupRadius = BASE_PICKUP;
  private damageMult = 1;
  private regen = 0;
  hurtFlash = 0;
  facing = 0;

  // ── Joystick flutuante ─────────────────────────────────────────────────────
  private prevDrag = false;
  joyOrigin: Vec2 = { x: 0, y: 0 };

  // Buffs ativos (tipo da planta -> segundos restantes).
  buffs: Record<PlantType, number> = { red: 0, blue: 0, green: 0, gold: 0, purple: 0 };

  // ── Progressao ──────────────────────────────────────────────────────────────
  level = 1;
  xp = 0;
  xpNext = 8;
  private pendingLevels = 0;  // niveis ganhos que ainda nao foram "gastos" no menu de melhoria
  private kills = 0;
  private paused = false;

  // ── Arsenal (nivel de cada arma/passiva; 0 = ainda nao possui) ──────────────
  weapons: Record<WeaponId, number> = { dart: 1, aura: 0, orbit: 0, nova: 0 };
  private passives: Record<PassiveId, number> = { maxhp: 0, speed: 0, magnet: 0, power: 0, regen: 0 };
  private fireTimer = 0;
  private auraTimer = 0;
  private novaTimer = NOVA.cd[0]!;
  orbitAngle = 0;

  // ── Entidades vivas na arena ────────────────────────────────────────────────
  enemies: Enemy[] = [];
  projs: Proj[] = [];
  gems: Gem[] = [];
  novas: Nova[] = [];
  plants: Plant[] = [];
  nodes: Node[] = [];

  // Pools / buffers reaproveitados (evitam criar e descartar memoria por frame,
  // o que reduz pausas do garbage collector e mantem o jogo fluido).
  private projPool: Proj[] = [];
  private gemPool: Gem[] = [];
  private sepScratch: SepScratch = createSepScratch();

  // ── Fluxo da run ────────────────────────────────────────────────────────────
  private harvested = 0;       // biomassa coletada — sem teto; mais = mais recompensa
  channeling = false;          // true enquanto Myco esta coletando um nodulo (exposto)
  private surgeTimer = 0;
  private spawnTimer = SPAWN_START;
  elapsed = 0;
  extractOpen = false;
  private bossSpawned = false;
  boss: Enemy | null = null;
  extractPos: Vec2 = { x: 0, y: 0 };

  protected override onEnter(): void {
    this.renderer.buildBackground();
    this.renderer.attachWorldLayers(this.camera);
    this.content.addChild(this.renderer.bgStatic, this.renderer.gridG, this.camera);
    this.root.addChild(this.content);

    // Comeca com alguns nodulos e plantas ja espalhados ao redor do jogador.
    for (let i = 0; i < HARVEST_NEARBY; i++) this.spawnNode();
    for (let i = 0; i < PLANTS_NEARBY; i++) this.spawnPlant();

    // Overlay de tela: textos brilhantes e com sombra para boa legibilidade.
    this.overlay.zIndex = 90;
    this.renderer.attachOverlayLayers(this.overlay);
    this.root.addChild(this.overlay);

    this.drag = bindDrag(this.app.pixi.canvas, this.app.world, { x: VW / 2, y: VH / 2 });
  }

  /** A base para a musica e destroi o juice; aqui so soltamos o drag. */
  protected override onExit(): void {
    this.drag.cleanup();
  }

  /** Hordas treme o conteudo do jogo (camera+fundo), nao o root/HUD. */
  protected override buildJuice(): RunJuice {
    return new RunJuice(this.root, { accent: FOREST, shakeTarget: this.content, ambient: 22 });
  }

  /** Coracao do jogo: roda uma vez por frame. "dt" e o delta time (segundos
   *  desde o frame anterior). Limitamos a 1/30 para que, num travamento, a
   *  fisica nao "salte" muito de uma vez. */
  protected override onUpdate(d: number): void {
    if (this.paused) return;
    this.elapsed += d;
    this.hurtFlash = Math.max(0, this.hurtFlash - d * 3);
    if (this.regen > 0 && this.hp < this.maxHp) this.hp = Math.min(this.maxHp, this.hp + this.regen * d);

    // Conta o tempo restante de cada buff ativo.
    for (const t of PLANT_TYPES) if (this.buffs[t] > 0) this.buffs[t] = Math.max(0, this.buffs[t] - d);

    this.movePlayer(d);
    this.updateHarvest(d);

    // Armas (disparam sozinhas).
    this.updateDart(d);
    this.updateAura(d);
    this.updateOrbit(d);
    this.updateNova(d);
    this.updateProjectiles(d);

    // Inimigos, drops e efeitos.
    this.updateSpawns(d);
    this.updateEnemies(d);
    this.updateGems(d);
    this.updateNovaRings(d);
    this.updatePlants();

    // Chegou na extracao aberta? Venceu.
    if (this.extractOpen && Math.hypot(this.player.x - this.extractPos.x, this.player.y - this.extractPos.y) < 28) {
      this.end(true);
      return;
    }

    // A camera centraliza o jogador na tela.
    this.camera.x = VW / 2 - this.player.x;
    this.camera.y = VH / 2 - this.player.y;

    // Desenha tudo (a cena so passa o seu proprio estado como "view").
    this.renderer.drawWorld(this);
    this.renderer.drawHudOverlay(this);
    this.hud.setTimer(this.elapsed);
    this.hud.setScore(`☠ ${this.kills}`);
    this.hud.setStatus(this.extractOpen ? 'extração aberta — colha mais!' : `coleta ${this.harvested}/${GOAL}`);
    this.hud.setHealth(this.hp / this.maxHp);
  }

  // ── Conversao mundo -> tela (usada nos efeitos do RunJuice, que sao em tela) ──
  private sx(wx: number): number { return wx + (VW / 2 - this.player.x); }
  private sy(wy: number): number { return wy + (VH / 2 - this.player.y); }

  // ── Stats modificados pelos buffs (cada buff e um bonus brando e temporario) ──
  private get atk(): number { return this.damageMult * (this.buffs.red > 0 ? 1.45 : 1); }
  private get fireMult(): number { return this.buffs.blue > 0 ? 0.7 : 1; }
  get areaMult(): number { return this.buffs.purple > 0 ? 1.35 : 1; }
  private get effSpeed(): number { return this.moveSpeed * (this.buffs.green > 0 ? 1.35 : 1); }
  private get effPickup(): number { return this.pickupRadius + (this.buffs.gold > 0 ? 130 : 0); }

  // Multiplicador de recompensa: sobe com o tempo sobrevivido e com a sobre-coleta
  // (alem da meta). E o que torna tentador "empurrar a sorte". Limitado a 3x.
  get rewardMult(): number {
    return Math.min(3, 1 + this.elapsed / 100 + Math.max(0, this.harvested - GOAL) * 0.08);
  }
  get reward(): number { return Math.round(this.harvested * this.rewardMult); }

  // ── Jogador — joystick flutuante, movimento continuo com inercia ────────────
  private movePlayer(dt: number): void {
    // Ao comecar um toque novo, fixa a "origem" do joystick onde o dedo encostou.
    if (this.drag.dragging && !this.prevDrag) this.joyOrigin = { ...this.drag.pos };
    this.prevDrag = this.drag.dragging;

    // Calcula a velocidade-alvo a partir de quanto o dedo se afastou da origem.
    let tvx = 0;
    let tvy = 0;
    if (this.drag.dragging) {
      const dx = this.drag.pos.x - this.joyOrigin.x;
      const dy = this.drag.pos.y - this.joyOrigin.y;
      const len = Math.hypot(dx, dy);
      if (len > JOY_DEAD) {
        const mag = Math.min(1, (len - JOY_DEAD) / (JOY_MAX - JOY_DEAD));
        tvx = (dx / len) * this.effSpeed * mag;
        tvy = (dy / len) * this.effSpeed * mag;
      }
    }
    // Aproxima a velocidade atual da alvo aos poucos (da peso/inercia ao andar).
    const k = Math.min(1, MOVE_ACCEL * dt);
    this.vel.x += (tvx - this.vel.x) * k;
    this.vel.y += (tvy - this.vel.y) * k;
    this.player.x += this.vel.x * dt;
    this.player.y += this.vel.y * dt;
  }

  // ── Coleta de biomassa — canalizar exposto, o verdadeiro risco da run ───────
  private updateHarvest(dt: number): void {
    // Remove nodulos longe demais (nunca o que esta sendo coletado) e repoe os de perto.
    for (let i = this.nodes.length - 1; i >= 0; i--) {
      const n = this.nodes[i]!;
      const dist = Math.hypot(n.pos.x - this.player.x, n.pos.y - this.player.y);
      if (dist > PLANT_CULL_R && n.progress <= 0) { this.nodes.splice(i, 1); continue; }
      if (dist > PLAYER_R + 16) n.progress = Math.max(0, n.progress - dt * HARVEST_DECAY);  // sai de cima -> progresso decai
    }
    while (this.nodes.length < HARVEST_NEARBY) this.spawnNode();

    // O nodulo em que estamos pisando (se houver) avanca o progresso.
    let cur: Node | null = null;
    for (const n of this.nodes) {
      if (Math.hypot(n.pos.x - this.player.x, n.pos.y - this.player.y) <= PLAYER_R + 16) { cur = n; break; }
    }
    const startNow = cur !== null && !this.channeling;
    this.channeling = cur !== null;
    if (startNow) { this.juice.alarm(0xffb347); this.surgeTimer = 0; this.harvestSurge(4); }
    if (!cur) return;

    cur.progress += dt;
    // Punicao por tempo — a IA despeja reforcos enquanto voce esta preso aqui.
    this.surgeTimer -= dt;
    if (this.surgeTimer <= 0) { this.surgeTimer = HARVEST_SURGE; this.harvestSurge(2); }

    // Nodulo completo: ganha 1 de biomassa, comemora e gera o proximo.
    if (cur.progress >= HARVEST_TIME) {
      this.harvested += 1;
      this.nodes.splice(this.nodes.indexOf(cur), 1);
      this.channeling = false;
      this.juice.pop(VW / 2, VH / 2, 0xffd36b);
      this.juice.flash(0xffd36b, 0.16, 0.26);
      if (this.harvested >= GOAL && !this.extractOpen) this.openExtraction();
      this.spawnNode();
    }
  }

  /** Gera uma pequena onda de reforcos durante a coleta (a "punicao" do objetivo). */
  private harvestSurge(count: number): void {
    for (let i = 0; i < count && this.enemies.length < ENEMY_CAP; i++) this.spawnEnemy(this.elapsed > 30 ? 'crawler' : 'sprout');
  }

  /** Cria um novo nodulo de biomassa num ponto aleatorio ao redor do jogador. */
  private spawnNode(): void {
    const a = Math.random() * TAU;
    const d = rand(HARVEST_DIST.min, HARVEST_DIST.max);
    this.nodes.push({ pos: { x: this.player.x + Math.cos(a) * d, y: this.player.y + Math.sin(a) * d }, phase: Math.random() * TAU, progress: 0 });
  }

  /** Abre a extracao: cria o farol de saida e invoca o boss. */
  private openExtraction(): void {
    this.extractOpen = true;
    const a = Math.random() * TAU;
    this.extractPos = { x: this.player.x + Math.cos(a) * 280, y: this.player.y + Math.sin(a) * 280 };
    this.juice.alarm(FOREST);
    this.spawnBoss();
  }

  // ── XP / subir de nivel (curva propositalmente lenta) ───────────────────────
  private gainXp(v: number): void {
    this.xp += v;
    // Pode subir varios niveis de uma vez se pegar muito XP junto.
    while (this.xp >= this.xpNext) {
      this.xp -= this.xpNext;
      this.level += 1;
      this.xpNext = Math.round(this.xpNext * 1.5 + 6);
      this.pendingLevels += 1;
    }
    if (this.pendingLevels > 0 && !this.paused) this.openLevelUp();
  }

  /** Monta as 3 cartas de melhoria oferecidas ao subir de nivel. */
  private buildOffers(): Offer[] {
    const pool: Offer[] = [];
    // Armas: oferece "nova arma" se nivel 0, ou "subir nivel" se ainda nao no maximo.
    (Object.keys(this.weapons) as WeaponId[]).forEach((id) => {
      const lv = this.weapons[id];
      if (lv === 0) pool.push({ kind: 'weapon', id, name: WEAPON_NAME[id], desc: WEAPON_DESC[id], tag: 'NOVA ARMA' });
      else if (lv < MAXLV) pool.push({ kind: 'weapon', id, name: WEAPON_NAME[id], desc: WEAPON_DESC[id], tag: `Nível ${lv + 1}` });
    });
    // Passivas: mesma logica.
    (Object.keys(this.passives) as PassiveId[]).forEach((id) => {
      const lv = this.passives[id];
      if (lv < MAXLV) pool.push({ kind: 'passive', id, name: PASSIVE_NAME[id], desc: PASSIVE_DESC[id], tag: lv === 0 ? 'PASSIVA' : `Nível ${lv + 1}` });
    });
    // Embaralha (algoritmo de Fisher-Yates) e pega 3.
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j]!, pool[i]!];
    }
    const picks = pool.slice(0, 3);
    // Se faltarem opcoes (tudo no maximo), completa com cartas de cura.
    while (picks.length < 3) picks.push({ kind: 'heal', name: 'Refúgio', desc: 'Recupera 30 de vida.', tag: 'CURA' });
    return picks;
  }

  /** Abre o menu de subir de nivel (pausa o jogo e mostra 3 cartas). */
  private openLevelUp(): void {
    this.paused = true;
    const offers = this.buildOffers();
    const panel = new Container();
    panel.zIndex = 150;

    const dim = new Graphics();
    dim.rect(0, 0, VW, VH).fill({ color: 0x000000, alpha: 0.78 });
    dim.eventMode = 'static';
    panel.addChild(dim);

    const title = new Text({
      text: 'SUBIU DE NÍVEL',
      style: { fontFamily: FontFamily.body, fontSize: 22, fill: FOREST, fontWeight: '700', letterSpacing: 1.5, dropShadow: SHADOW },
    });
    title.anchor.set(0.5);
    title.x = VW / 2;
    title.y = VH * 0.25;
    panel.addChild(title);

    const sub = new Text({
      text: 'Escolha uma melhoria — toque numa carta',
      style: { fontFamily: FontFamily.mono, fontSize: 13, fill: TextColor.ink, dropShadow: SHADOW },
    });
    sub.anchor.set(0.5);
    sub.x = VW / 2;
    sub.y = VH * 0.25 + 28;
    panel.addChild(sub);

    const cardW = 322;
    const cardH = 86;
    const gap = 14;
    const x0 = (VW - cardW) / 2;
    const y0 = VH * 0.35;
    offers.forEach((offer, i) => {
      panel.addChild(this.buildCard(offer, x0, y0 + i * (cardH + gap), cardW, cardH, () => {
        this.applyOffer(offer);
        panel.destroy({ children: true });
        this.pendingLevels = Math.max(0, this.pendingLevels - 1);
        // Se ainda restam niveis para gastar, abre o menu de novo; senao, despausa.
        if (this.pendingLevels > 0) this.openLevelUp();
        else this.paused = false;
      }));
    });

    this.root.addChild(panel);
    audioManager.playSfx('res://assets/audio/sfx/ui/Confirm_03.wav', 0.5);
  }

  /** Desenha uma carta de melhoria clicavel (com efeito de hover). */
  private buildCard(offer: Offer, x: number, y: number, w: number, h: number, onPick: () => void): Container {
    const card = new Container();
    card.x = x;
    card.y = y;

    const bg = new Graphics();
    const paint = (hover: boolean): void => {
      bg.clear();
      bg.roundRect(0, 0, w, h, 8)
        .fill({ color: hover ? 0x16291d : 0x0d1611, alpha: 0.99 })
        .stroke({ color: FOREST, width: hover ? 2.4 : 1.6, alpha: hover ? 1 : 0.8 });
    };
    paint(false);
    card.addChild(bg);

    const tag = new Text({
      text: offer.tag,
      style: { fontFamily: FontFamily.mono, fontSize: 11, fill: TextColor.amber, fontWeight: '700', letterSpacing: 1, dropShadow: SHADOW },
    });
    tag.x = 14;
    tag.y = 11;
    card.addChild(tag);

    const name = new Text({
      text: offer.name,
      style: { fontFamily: FontFamily.body, fontSize: 18, fill: TextColor.white, fontWeight: '700', dropShadow: SHADOW },
    });
    name.x = 14;
    name.y = 27;
    card.addChild(name);

    const desc = new Text({
      text: offer.desc,
      style: { fontFamily: FontFamily.mono, fontSize: 12, fill: TextColor.ink, wordWrap: true, wordWrapWidth: w - 28, dropShadow: SHADOW },
    });
    desc.x = 14;
    desc.y = 52;
    card.addChild(desc);

    card.eventMode = 'static';
    card.cursor = 'pointer';
    card.on('pointerover', () => paint(true));
    card.on('pointerout', () => paint(false));
    card.on('pointertap', (e) => { e.stopPropagation(); audioManager.playSfx('res://assets/audio/sfx/ui/Click_03.wav', 0.4); onPick(); });
    return card;
  }

  /** Aplica o efeito da carta escolhida (cura, nova arma/nivel, ou passiva). */
  private applyOffer(offer: Offer): void {
    if (offer.kind === 'heal') {
      this.hp = Math.min(this.maxHp, this.hp + 30);
    } else if (offer.kind === 'weapon') {
      const id = offer.id as WeaponId;
      this.weapons[id] = Math.min(MAXLV, this.weapons[id] + 1);
      // Ao destravar a nova explosao de polen, reinicia o tempo de recarga dela.
      if (id === 'nova' && this.weapons.nova === 1) this.novaTimer = NOVA.cd[0]!;
    } else {
      const id = offer.id as PassiveId;
      this.passives[id] = Math.min(MAXLV, this.passives[id] + 1);
      this.recomputeStats(id === 'maxhp');
    }
    this.juice.flash(FOREST, 0.14, 0.2);
  }

  /** Recalcula os atributos do jogador a partir dos niveis das passivas. */
  private recomputeStats(healFromMaxHp: boolean): void {
    const prevMax = this.maxHp;
    this.maxHp = BASE_HP + this.passives.maxhp * 25;
    this.moveSpeed = BASE_SPEED + this.passives.speed * 22;
    this.pickupRadius = BASE_PICKUP + this.passives.magnet * 20;
    this.damageMult = 1 + this.passives.power * 0.15;
    this.regen = this.passives.regen * 0.8;
    // Ganhar +vida maxima tambem cura na hora a diferenca conquistada.
    if (healFromMaxHp) this.hp += this.maxHp - prevMax;
  }

  // ── Arma: Bio-dardo (fica guardada durante a coleta — eis a vulnerabilidade) ──
  private updateDart(dt: number): void {
    this.fireTimer -= dt;
    if (this.channeling) return;
    const lv = this.weapons.dart;
    if (lv === 0 || this.fireTimer > 0) return;
    const target = this.nearestEnemy();
    if (!target) return;
    this.fireTimer = DART.interval[lv - 1]! * this.fireMult;
    const count = DART.count[lv - 1]!;
    const dmg = DART.dmg[lv - 1]! * this.atk;
    const pierce = DART.pierce[lv - 1]!;
    const base = Math.atan2(target.pos.y - this.player.y, target.pos.x - this.player.x);
    this.facing = base;
    const spread = 0.26;  // leque de angulo quando ha varios dardos por disparo
    for (let i = 0; i < count; i++) {
      const a = base + (i - (count - 1) / 2) * spread;
      const p = this.acquireProj();
      p.pos.x = this.player.x; p.pos.y = this.player.y;
      p.vel.x = Math.cos(a) * PROJ_SPEED; p.vel.y = Math.sin(a) * PROJ_SPEED;
      p.life = PROJ_LIFE; p.dmg = dmg; p.pierce = pierce;
      this.projs.push(p);
    }
    audioManager.playSfx('res://assets/audio/sfx/ui/Click_03.wav', 0.16);
  }

  // Pega um dardo do pool (reaproveitando memoria) ou cria um novo se o pool secou.
  private acquireProj(): Proj {
    const p = this.projPool.pop();
    if (p) { p.hit.clear(); return p; }
    return { pos: { x: 0, y: 0 }, vel: { x: 0, y: 0 }, life: 0, dmg: 0, pierce: 0, hit: new Set() };
  }

  private releaseProj(p: Proj): void { p.hit.clear(); this.projPool.push(p); }

  private acquireGem(): Gem {
    return this.gemPool.pop() ?? { pos: { x: 0, y: 0 }, vel: { x: 0, y: 0 }, value: 0, t: 0 };
  }

  private releaseGem(g: Gem): void { this.gemPool.push(g); }

  /** Acha o inimigo mais proximo do jogador (usado para mirar o dardo e a "mira" visual).
   *  Compara distancias ao quadrado para evitar raizes quadradas caras. */
  nearestEnemy(): Enemy | null {
    let best: Enemy | null = null;
    let bd = Infinity;
    for (const e of this.enemies) {
      const dd = (e.pos.x - this.player.x) ** 2 + (e.pos.y - this.player.y) ** 2;
      if (dd < bd) { bd = dd; best = e; }
    }
    return best;
  }

  /** Move os dardos, checa colisao com inimigos e cuida do "atravessar" (pierce). */
  private updateProjectiles(dt: number): void {
    for (let i = this.projs.length - 1; i >= 0; i--) {
      const p = this.projs[i]!;
      p.life -= dt;
      p.pos.x += p.vel.x * dt;
      p.pos.y += p.vel.y * dt;
      // Some quando o tempo de vida acaba ou quando voa longe demais.
      if (p.life <= 0 || Math.hypot(p.pos.x - this.player.x, p.pos.y - this.player.y) > 600) {
        this.projs.splice(i, 1);
        this.releaseProj(p);
        continue;
      }
      const inv = 1 / (Math.hypot(p.vel.x, p.vel.y) || 1);  // para empurrar o inimigo na direcao do tiro
      for (const e of this.enemies) {
        if (p.hit.has(e)) continue;  // nao bate duas vezes no mesmo inimigo
        if (Math.hypot(e.pos.x - p.pos.x, e.pos.y - p.pos.y) < e.r + 4) {
          this.damageEnemy(e, p.dmg, p.vel.x * inv * 7, p.vel.y * inv * 7);
          p.hit.add(e);
          this.juice.burst(this.sx(p.pos.x), this.sy(p.pos.y), { count: 5, color: 0x9fffe0, speed: 130, life: 0.25, size: 1.6 });
          if (p.pierce <= 0) { this.projs.splice(i, 1); this.releaseProj(p); break; }
          p.pierce -= 1;
        }
      }
    }
  }

  /** Arma: Nevoa de esporos (aura) — causa dano em area ao redor, sem mirar. */
  private updateAura(dt: number): void {
    const lv = this.weapons.aura;
    if (lv === 0) return;
    this.auraTimer -= dt;
    if (this.auraTimer > 0) return;
    const tick = 0.2;  // a aura aplica dano em "tiquetaques" de 0.2s
    this.auraTimer = tick;
    const r = AURA.r[lv - 1]! * this.areaMult;
    const dmg = AURA.dps[lv - 1]! * tick * this.atk;
    for (const e of this.enemies) {
      if (Math.hypot(e.pos.x - this.player.x, e.pos.y - this.player.y) < r + e.r) {
        this.damageEnemy(e, dmg, 0, 0);
      }
    }
  }

  /** Arma: Bulbos orbitais — esferas que giram ao redor e esmagam quem encostam. */
  private updateOrbit(dt: number): void {
    const lv = this.weapons.orbit;
    if (lv === 0) return;
    this.orbitAngle += dt * 2.6;
    const count = ORBIT.count[lv - 1]!;
    const r = ORBIT.r[lv - 1]!;
    const dmg = ORBIT.dmg[lv - 1]! * this.atk;
    for (const e of this.enemies) e.orbitCd = Math.max(0, e.orbitCd - dt);
    for (let b = 0; b < count; b++) {
      const a = this.orbitAngle + (b / count) * TAU;
      const bx = this.player.x + Math.cos(a) * r;
      const by = this.player.y + Math.sin(a) * r;
      for (const e of this.enemies) {
        if (e.orbitCd > 0) continue;  // recarga para nao bater no mesmo inimigo todo frame
        if (Math.hypot(e.pos.x - bx, e.pos.y - by) < e.r + 7) {
          const inv = 1 / (Math.hypot(e.pos.x - this.player.x, e.pos.y - this.player.y) || 1);
          this.damageEnemy(e, dmg, (e.pos.x - this.player.x) * inv * 8, (e.pos.y - this.player.y) * inv * 8);
          e.orbitCd = 0.3;
        }
      }
    }
  }

  /** Arma: Explosao de polen (nova) — pulso periodico de dano em area + empurrao. */
  private updateNova(dt: number): void {
    const lv = this.weapons.nova;
    if (lv === 0) return;
    this.novaTimer -= dt;
    if (this.novaTimer > 0) return;
    this.novaTimer = NOVA.cd[lv - 1]!;
    const r = NOVA.r[lv - 1]! * this.areaMult;
    const dmg = NOVA.dmg[lv - 1]! * this.atk;
    this.novas.push({ x: this.player.x, y: this.player.y, r: 0, max: r, life: 0.45 });  // anel visual que cresce
    for (const e of this.enemies) {
      const dist = Math.hypot(e.pos.x - this.player.x, e.pos.y - this.player.y);
      if (dist < r + e.r) {
        const inv = 1 / (dist || 1);
        this.damageEnemy(e, dmg, (e.pos.x - this.player.x) * inv * 16, (e.pos.y - this.player.y) * inv * 16);
      }
    }
    this.juice.shockwave(FOREST, 0.45);
    this.juice.shake(0.18, 14);
  }

  /** Faz os aneis visuais da nova crescerem e sumirem com o tempo. */
  private updateNovaRings(dt: number): void {
    for (let i = this.novas.length - 1; i >= 0; i--) {
      const n = this.novas[i]!;
      n.life -= dt;
      n.r = n.max * (1 - n.life / 0.45);
      if (n.life <= 0) this.novas.splice(i, 1);
    }
  }

  // ── Dano / morte ──────────────────────────────────────────────────────────────
  private damageEnemy(e: Enemy, dmg: number, kx: number, ky: number): void {
    e.hp -= dmg;
    e.flash = 0.12;       // pisca branco
    e.pos.x += kx;        // empurrao (knockback)
    e.pos.y += ky;
    if (e.hp <= 0) this.killEnemy(e);
  }

  private killEnemy(e: Enemy): void {
    const idx = this.enemies.indexOf(e);
    if (idx < 0) return;
    this.enemies.splice(idx, 1);
    if (e === this.boss) this.boss = null;
    this.kills += 1;
    this.juice.burst(this.sx(e.pos.x), this.sy(e.pos.y), { count: e.kind === 'boss' ? 30 : 9, color: 0x9fffe0, speed: 170, life: 0.4, size: 2 });
    if (e.kind === 'boss') {
      this.juice.alarm(FOREST);
      for (let i = 0; i < 8; i++) this.dropGem(e.pos.x + rand(-18, 18), e.pos.y + rand(-18, 18), 5);
      this.harvested += 2; // matar o boss da um bom bonus de biomassa
    } else {
      this.dropGem(e.pos.x, e.pos.y, e.xp);
    }
  }

  /** Solta uma gema de XP no chao, com um pequeno espalhamento aleatorio. */
  private dropGem(x: number, y: number, value: number): void {
    const g = this.acquireGem();
    g.pos.x = x; g.pos.y = y;
    g.vel.x = rand(-40, 40); g.vel.y = rand(-40, 40);
    g.value = value; g.t = 0;
    this.gems.push(g);
  }

  /** Move as gemas: atrai as que estao dentro do raio de coleta, ate o jogador pega-las. */
  private updateGems(dt: number): void {
    const pickup = this.effPickup;
    for (let i = this.gems.length - 1; i >= 0; i--) {
      const g = this.gems[i]!;
      g.t += dt;
      const dx = this.player.x - g.pos.x;
      const dy = this.player.y - g.pos.y;
      const dist = Math.hypot(dx, dy) || 1;
      if (dist < pickup) {
        // Dentro do raio: e atraida (e quanto mais perto, mais rapido vem — efeito ima).
        const pull = 240 + (1 - dist / pickup) * 360;
        g.pos.x += (dx / dist) * pull * dt;
        g.pos.y += (dy / dist) * pull * dt;
      } else {
        // Fora do raio: so escorrega com a inercia do espalhamento inicial.
        g.pos.x += g.vel.x * dt;
        g.pos.y += g.vel.y * dt;
        g.vel.x *= 0.88;
        g.vel.y *= 0.88;
      }
      // Encostou: vira XP.
      if (dist < 14) {
        this.gainXp(g.value);
        this.gems.splice(i, 1);
        this.releaseGem(g);
        audioManager.playSfx('res://assets/audio/sfx/ui/Click_03.wav', 0.12);
      }
    }
  }

  // ── Plantas de buff (raras) ──────────────────────────────────────────────────
  private spawnPlant(): void {
    const a = Math.random() * TAU;
    const d = rand(PLANT_DIST.min, PLANT_DIST.max);
    const type = PLANT_TYPES[Math.floor(Math.random() * PLANT_TYPES.length)]!;
    this.plants.push({ pos: { x: this.player.x + Math.cos(a) * d, y: this.player.y + Math.sin(a) * d }, type, phase: Math.random() * TAU });
  }

  private updatePlants(): void {
    for (let i = this.plants.length - 1; i >= 0; i--) {
      const p = this.plants[i]!;
      const dist = Math.hypot(p.pos.x - this.player.x, p.pos.y - this.player.y);
      if (dist > PLANT_CULL_R) { this.plants.splice(i, 1); continue; }
      // Pisou na planta: ativa o buff por BUFF_TIME segundos.
      if (dist < PLAYER_R + 13) {
        this.buffs[p.type] = BUFF_TIME;
        this.juice.pop(this.sx(p.pos.x), this.sy(p.pos.y), PLANTS[p.type].color);
        this.juice.flash(PLANTS[p.type].color, 0.12, 0.22);
        this.plants.splice(i, 1);
      }
    }
    while (this.plants.length < PLANTS_NEARBY) this.spawnPlant();
  }

  // ── Inimigos ────────────────────────────────────────────────────────────────
  /** Controla o ritmo de nascimento dos inimigos (vai acelerando com o tempo). */
  private updateSpawns(dt: number): void {
    this.spawnTimer -= dt;
    if (this.spawnTimer > 0 || this.enemies.length >= ENEMY_CAP) return;
    const burst = 1 + Math.floor(this.elapsed / 20);  // cada onda cresce ao longo do tempo
    for (let i = 0; i < burst && this.enemies.length < ENEMY_CAP; i++) this.spawnEnemy();
    this.spawnTimer = Math.max(SPAWN_MIN, SPAWN_START - this.elapsed * 0.014 - (this.extractOpen ? 0.4 : 0));
  }

  /** Sorteia o tipo de inimigo, com tipos mais fortes liberando ao longo do tempo. */
  private pickKind(): EKind {
    const r = Math.random();
    if (this.elapsed > 55 && r < 0.18) return 'brute';
    if (this.elapsed > 20 && r < 0.46) return 'crawler';
    return 'sprout';
  }

  /** Ponto aleatorio sobre um circulo (anel) de dado raio ao redor do jogador. */
  private ringPos(radius: number): Vec2 {
    const a = Math.random() * TAU;
    return { x: this.player.x + Math.cos(a) * radius, y: this.player.y + Math.sin(a) * radius };
  }

  private spawnEnemy(force?: EKind): void {
    const kind = force ?? this.pickKind();
    const s = ESTATS[kind];
    const hpScale = 1 + this.elapsed * 0.006;  // inimigos ficam um pouco mais resistentes com o tempo
    this.enemies.push({
      kind, pos: this.ringPos(SPAWN_RING + rand(0, 80)),
      hp: s.hp * hpScale, maxHp: s.hp * hpScale,
      speed: s.speed + Math.random() * 16, dmg: s.dmg, r: s.r, xp: s.xp, color: s.color,
      flash: 0, touchCd: 0, orbitCd: 0, pushX: 0, pushY: 0,
    });
  }

  private spawnBoss(): void {
    if (this.bossSpawned) return;
    this.bossSpawned = true;
    const s = ESTATS.boss;
    this.boss = {
      kind: 'boss', pos: this.ringPos(SPAWN_RING),
      hp: s.hp, maxHp: s.hp, speed: s.speed, dmg: s.dmg, r: s.r, xp: s.xp, color: s.color,
      flash: 0, touchCd: 0, orbitCd: 0, pushX: 0, pushY: 0,
    };
    this.enemies.push(this.boss);
  }

  /** Move os inimigos em direcao ao jogador, aplica a separacao e o dano de contato. */
  private updateEnemies(dt: number): void {
    // Calcula o empurrao anti-amontoamento (escrito em e.pushX/e.pushY de cada um).
    computeSeparation(this.enemies, this.sepScratch);

    const contactMult = this.channeling ? HARVEST_VULN : 1;  // dano de contato extra ao coletar
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i]!;
      e.flash = Math.max(0, e.flash - dt);
      e.touchCd = Math.max(0, e.touchCd - dt);
      const dx = this.player.x - e.pos.x;
      const dy = this.player.y - e.pos.y;
      const dist = Math.hypot(dx, dy) || 1;
      // Inimigos comuns que se afastam demais sao removidos (o boss nunca).
      if (e.kind !== 'boss' && dist > DESPAWN_R) { this.enemies.splice(i, 1); continue; }
      e.pos.x += (dx / dist) * e.speed * dt + (e.kind === 'boss' ? 0 : e.pushX);
      e.pos.y += (dy / dist) * e.speed * dt + (e.kind === 'boss' ? 0 : e.pushY);
      // Encostou no jogador (e nao esta em recarga): causa dano.
      if (dist < PLAYER_R + e.r && e.touchCd <= 0) {
        e.touchCd = TOUCH_CD;
        this.hp -= e.dmg * contactMult;
        this.hurtFlash = 1;
        this.juice.hurt(VW / 2, VH / 2);
        if (this.hp <= 0) { this.hp = 0; this.end(false); return; }
      }
    }
  }

  /** Encerra a run (vitoria ou derrota): aplica efeitos, deposita recompensa e mostra o overlay. */
  private end(victory: boolean): void {
    if (this.ended) return; // protege contra deposito duplo
    const payout = this.reward;
    if (victory && payout > 0) {
      HubState.depositFlow('biomassa_adaptativa', payout);
    }
    this.endRun(victory, {
      rewardLabel: `+${payout} Biomassa  (×${this.rewardMult.toFixed(1)}) · Nv ${this.level} · ☠ ${this.kills}`,
      failLabel: 'Capturado pelos jardineiros — biomassa perdida.',
    });
  }
}
