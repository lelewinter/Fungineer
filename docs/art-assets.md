# FUNGINEER — Manifesto de Assets de Arte

> Checklist de **tudo que precisa ser criado** para o jogo atingir a estética das
> referências (bio-punk fúngico, cogumelos bioluminescentes, luzes quentes no
> escuro). Gerado a partir do conteúdo real do código (zonas, personagens, salas,
> recursos, entidades). Marque `[x]` conforme entregar.

## Convenções (ler antes de produzir)

- **Canvas lógico do jogo:** 480 × 854 px (retrato). Tudo é escalado pro aparelho.
- **Estilo:** pixel-art HD com luz/escuro dramático (ref. 2). Cores sólidas,
  silhuetas legíveis. O **bloom + color-grade global já existe** no engine, então
  **deixe as fontes de luz BEM brilhantes** (esporos, lanternas, olhos de robô,
  bordas mágicas) que elas vão sangrar luz sozinhas. Não pinte o glow no sprite.
- **Formato:** PNG com transparência (alpha). Sem sombra "grudada" no chão
  (o engine pode gerar). Paleta: base verde-azulada escura, destaques âmbar/laranja,
  acentos magenta/roxo/vermelho de cogumelo.
- **Escala de autoria:** desenhe a **2×** o tamanho de jogo (ex.: entidade de 32px
  → autorar 64px) e exporte; mantém nitidez. `antialias` está desligado (pixel-art).
- **Pastas (destino):** `frontend/public/assets/art/<categoria>/...`
- **Nomenclatura:** `snake_case`, prefixo por categoria. Ex.: `char_myco_idle.png`,
  `enemy_runner.png`, `mush_orange.png`, `icon_res_scrap.png`, `zone_torres.png`.
- **Sprite sheets:** animações em tira horizontal (`*_walk_4f.png` = 4 frames) ou
  entregue frames soltos que o AssetPack empacota em atlas.

---

## TIER 0 — Núcleo jogável: HORDAS (prioridade máxima)
*A fase que já está polida; é onde o estilo "aparece" primeiro.*

### Personagem do jogador
- [ ] `char_myco_idle.png` — Dr. Myco parado (32×40 jogo). Jaleco, óculos verdes, cajado-cogumelo.
- [ ] `char_myco_walk_4f.png` — caminhada (4 frames).
- [ ] `char_myco_channel.png` — agachado colhendo (pose exposta/vulnerável).

### Inimigos (robôs-jardineiros CLEAN)
- [ ] `enemy_runner.png` — leve e rápido (`sprout`, ~24px). Olho vermelho brilhante.
- [ ] `enemy_crawler.png` — médio (`crawler`, ~28px).
- [ ] `enemy_bruiser.png` — pesado/resistente (`brute`, ~44px).
- [ ] `enemy_spitter.png` — atirador à distância (variante ranged, ~32px).
- [ ] `boss_sentinel_core.png` — chefe "Sentinel Core" (`boss`, ~96px). Núcleo + tentáculos.

### Cogumelos de buff (pisar = efeito) — 6 cores
- [ ] `mush_red.png` — Carmesim (DANO). ~28px.
- [ ] `mush_blue.png` — Glacial (CADÊNCIA).
- [ ] `mush_green.png` — Veloz (VELOCIDADE).
- [ ] `mush_gold.png` — Áurea (ÍMÃ).
- [ ] `mush_purple.png` — Esporal (ÁREA).
- [ ] `mush_orange.png` — Restauradora (CURA) — laranja brilhante, com "vida".

### Objetos & coletáveis
- [ ] `node_biomass.png` — nódulo de biomassa (vagem âmbar pulsante). ~40px.
- [ ] `gem_xp_small.png` / `gem_xp_big.png` — gemas de XP (verde / âmbar).
- [ ] `beacon_extraction.png` — farol de extração (portal de saída).

### VFX de armas (podem ser tiras de animação)
- [ ] `vfx_dart.png` — bio-dardo (projétil).
- [ ] `vfx_spore_aura.png` — névoa de esporos (textura de aura, tileável/radial).
- [ ] `vfx_orbit_bulb.png` — bulbo orbital.
- [ ] `vfx_pollen_ring.png` — anel da explosão de pólen (nova).

---

## TIER 1 — Personagens (retratos + sprites no hub)
*11 personagens nomeados + 9 unidades de esquadrão. Cada um: retrato p/ diálogo + sprite no bunker.*

### Retratos (≈256×256, busto, estilo ref.)
- [ ] `portrait_myco.png` — Dr. Myco (líder).
- [ ] `portrait_marcus.png` — Marcus Chen · Engenheiro Culpado.
- [ ] `portrait_amara.png` — Dra. Amara Osei · Médica.
- [ ] `portrait_yuki.png` — Yuki Tanaka · Hacker Adolescente.
- [ ] `portrait_elena.png` — Sgt. Elena Vasquez · Ex-Militar.
- [ ] `portrait_bae.png` — Bae Jun-seo · Documentarista.
- [ ] `portrait_priya.png` — Dra. Priya Kapoor · Cientista Rival.
- [ ] `portrait_tomas.png` — Tomas Ferreira · Mecânico.
- [ ] `portrait_lena.png` — Lena · Criança Prodígio.
- [ ] `portrait_richard.png` — Richard Okafor · Ex-Executivo.
- [ ] `portrait_viktor.png` — Viktor Sousa · Cínico Experiente.

### Sprites no hub (≈24×40, parados nos cômodos)
- [ ] `char_marcus.png` · `char_amara.png` · `char_yuki.png` · `char_elena.png`
- [ ] `char_bae.png` · `char_priya.png` · `char_tomas.png` · `char_lena.png`
- [ ] `char_richard.png` · `char_viktor.png`

### Unidades de esquadrão (sprites de jogo, ≈28px)
- [ ] `unit_runa.png` (Guardiã) · `unit_brix.png` (Artilheiro) · `unit_zara.png` (Artificeira)
- [ ] `unit_luz.png` (Médica) · `unit_exec.png` (Estrategista) · `unit_fio.png` (Hacker)
- [ ] `unit_ferrovelho.png` (Engenheiro) · `unit_mira.png` (Elite) · `unit_nulo.png` (Stealth)

---

## TIER 2 — Hub (o bunker da resistência)

### Interiores de cômodo (backdrop/props por sala, ≈160×120)
- [ ] `room_vigia.png` — posto de vigia (tech).
- [ ] `room_campo.png` — depósito de armas (storage).
- [ ] `room_spore_chamber.png` — Câmara de Esporos.
- [ ] `room_mycelium_lab.png` — Mycelium Lab (hospital).
- [ ] `room_hyphae_forge.png` — Hyphae Forge (forja de hifas).
- [ ] `room_common.png` — Sala Comum.
- [ ] `room_fungus_kitchen.png` — Fungus Kitchen.
- [ ] `room_archive.png` — Arquivo vivo.
- [ ] `room_neural_mushroom.png` — rede neural micótica.
- [ ] `room_office.png` — sala de gestão.
- [ ] `room_bedroom.png` — Quarto (Lena).
- [ ] `room_cultivo.png` — Sala de Cultivo.
- [ ] `room_fermentacao.png` — Lab. de Fermentação.
- [ ] `room_oficina.png` — Oficina Biomecânica.

### Estrutura do bunker (tiles & decoração)
- [ ] `hub_wall_tile.png` · `hub_floor_tile.png` — paredes/chão de micélio (tileáveis).
- [ ] `hub_vines.png` · `hub_mushroom_decor.png` — trepadeiras e cogumelos decorativos.
- [ ] `hub_lamp.png` — lanterna/luminária quente (fonte de luz p/ bloom).
- [ ] `hub_frame.png` — moldura/corte transversal do bunker (opcional, p/ tela cheia).

### Foguete biológico — progressão de construção (8 estágios)
- [ ] `rocket_stage_1.png` — Raiz-Âncora (estrutura base).
- [ ] `rocket_stage_2.png` — Câmara Viva (suporte interno).
- [ ] `rocket_stage_3.png` — Núcleo Lógico.
- [ ] `rocket_stage_4.png` — Casca Adaptada (tanques de propulsão).
- [ ] `rocket_stage_5.png` — Rede de Esporo (sistema nervoso).
- [ ] `rocket_stage_6.png` — Bolsão Vital (navegação/controle).
- [ ] `rocket_stage_7.png` — Blindagem Orgânica (escudo térmico).
- [ ] `rocket_stage_8.png` — Ignição Final (foguete completo).
- [ ] `rocket_launch_fx.png` — esporos/gases do lançamento (tira de animação).

---

## TIER 3 — Zonas (fundos das fases + entidades por fase)

### Backdrops de zona (480×854; ⚠ alguns já existem)
- [x] `zone_hordas.png` *(existe)* · [x] `zone_stealth.png` · [x] `zone_circuito.png`
- [x] `zone_extracao.png` · [x] `zone_campo.png` · [x] `zone_infeccao.png`
- [x] `zone_labirinto.png` · [x] `zone_sacrificio.png`
- [ ] `zone_torres.png` — **a criar** (Torres Corporativas).
- [ ] `zone_cordilheira.png` — **a criar** (favela sem IA).
- [ ] `zone_catedral.png` — **a criar** (catedral colonial).
- [ ] *(opcional)* camadas de **parallax** por zona: `*_bg.png` / `*_mid.png` / `*_fg.png`.

> Obs.: os 8 backdrops existentes estão em `assets/art/zones/` mas **ainda não**
> em `frontend/public/assets/` — preciso copiá-los/processar no pipeline (eu faço).

### Entidades por fase (cada fase tem inimigos/objetos próprios)
- [ ] **STEALTH (Grade ARGOS):** câmera/drone de vigilância, cone de visão, nó de retransmissão, fragmento de processamento.
- [ ] **CIRCUITO (Relés NERVE):** fio micelial (segmentos), núcleo lógico, célula de dado vivo.
- [ ] **EXTRAÇÃO (Arquivo):** canister de combustível, rocha/escombro, ferramenta de escavação.
- [ ] **CAMPO (Praça das Águas):** ponto de relé/captura, unidade da FLOW, marcador de zona.
- [ ] **INFECÇÃO (Datacenter):** processo de limpeza (inimigo), resíduo de dados orgânicos, conduto.
- [ ] **LABIRINTO (Distribuição 7):** contêiner empurrável, estação de depósito, parede móvel.
- [ ] **SACRIFÍCIO (Vault CORE):** terminal de autorização, guarda, cofre, marcador de troca.
- [ ] **CORDILHEIRA (favela):** morador territorial (humano), barricada, beco/cache.
- [ ] **TORRES (corporativo):** enxame de drones aéreos, canister-sensor, sala de servidor.
- [ ] **CATEDRAL:** ladrilho de ressonância (mosaico), sino, relíquia, vitral.

---

## TIER 4 — UI / HUD / Ícones

### Ícones de recurso (7) — ≈32×32
- [ ] `icon_res_scrap.png` — Sucata Metálica.
- [ ] `icon_res_ai_components.png` — Componentes de IA.
- [ ] `icon_res_nucleo_logico.png` — Núcleo Lógico.
- [ ] `icon_res_combustivel.png` — Combustível Volátil.
- [ ] `icon_res_sinais.png` — Sinais de Controle.
- [ ] `icon_res_biomassa.png` — Biomassa Adaptativa.
- [ ] `icon_res_fragmentos.png` — Fragmentos Estruturais.

### Ícones de arma/passiva/buff (HUD da Hordas)
- [ ] Armas (4): `icon_wpn_dart` · `icon_wpn_aura` · `icon_wpn_orbit` · `icon_wpn_nova`.
- [ ] Passivas (5): `icon_psv_maxhp` · `icon_psv_speed` · `icon_psv_magnet` · `icon_psv_power` · `icon_psv_regen`.
- [ ] Reforços (5): `icon_boost_edge` · `icon_boost_bloom` · `icon_boost_haste` · `icon_boost_lure` · `icon_boost_vigor`.
- [ ] Buffs (6): reaproveitar os `mush_*` ou ícones dedicados `icon_buff_*`.

### Moldura/HUD & controles
- [ ] `ui_joystick_base.png` · `ui_joystick_knob.png` — joystick flutuante.
- [ ] `ui_card_frame.png` — moldura das cartas de level up.
- [ ] `ui_panel_9slice.png` — painel de janela (9-slice) p/ modais.
- [ ] `ui_healthbar.png` · `ui_xpbar.png` — molduras de barras (opcional; hoje vetorial).
- [ ] `ui_button_9slice.png` — *(opcional)* textura de botão p/ o FancyButton.

---

## TIER 5 — Branding & sistema

- [ ] `logo_fungineer.png` — logotipo (já há versão na key art; quero o PNG limpo c/ alpha).
- [ ] `keyart_title.png` — arte da tela inicial (fundo do StartScene, 480×854).
- [ ] `keyart_main.png` — key art oficial (marketing / loja).
- [ ] **PWA/ícones:** `icon_192.png`, `icon_512.png`, `maskable_512.png`, `favicon.png`, `apple_touch_icon.png`, `splash_*.png`.

---

## TIER 6 — VFX / texturas de partícula (atlas pequeno)
*Hoje as partículas são vetoriais; estes dão acabamento "pintado".*
- [ ] `fx_spore.png` — esporo bioluminescente (partícula ambiente).
- [ ] `fx_spark.png` — faísca de impacto.
- [ ] `fx_smoke.png` — fumaça/poeira.
- [ ] `fx_glow_dot.png` — ponto de luz radial (multiuso p/ bloom).
- [ ] `fx_shockwave.png` — onda de choque (anel).

---

## Resumo de contagem (aprox.)

| Tier | Categoria | Itens |
|------|-----------|-------|
| 0 | Hordas (jogável) | ~22 |
| 1 | Personagens (retratos+sprites+squad) | ~31 |
| 2 | Hub (salas, estrutura, foguete) | ~28 |
| 3 | Zonas (3 backdrops + entidades de 10 fases) | ~13+ |
| 4 | UI/HUD/ícones | ~30 |
| 5 | Branding/PWA | ~10 |
| 6 | VFX/partículas | ~5 |
| | **TOTAL aproximado** | **~140 assets** |

## Ordem recomendada de produção
1. **Tier 0 (Hordas)** — vê o estilo no jogo já, valida a direção.
2. **Tier 1 retratos + Myco** — dá "cara" aos personagens.
3. **Tier 4 ícones** — barato e melhora muito a leitura do HUD.
4. **Tier 2 (hub + foguete)** — o coração da progressão.
5. **Tier 3 (zonas faltantes + entidades)** — completa as fases.
6. **Tier 5/6** — polimento e branding.

> **Mínimo pra provar o pipeline:** me mande **1 sprite** (ex.: `mush_orange.png`
> ou `char_myco_idle.png`) que eu wiro o AssetPack + render de sprites ponta a
> ponta e te mostro brilhando no jogo.
