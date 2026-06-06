# Fungineer — Masterplan (jogo inteiro)

Fonte de verdade do build. Direção travada na referência visual do Dr. Myco
(pixel art fungal, escuro, cogumelos vibrantes, luz de lanterna).

Atualizado: 2026-06-03

---

## 1. Visão travada

Fungineer. Dr. Myco, botânico-micologista, lidera os últimos humanos num
apocalipse dominado por IAs. Constrói um foguete 100% biológico (micélio, casca
de árvore, fermentação, esporos) raideando zonas controladas pelas máquinas.
Input único em qualquer zona: mover o personagem.

Tese anti-tech: "enquanto eles têm aço e código, nós temos raízes e fé. A
natureza é nossa tecnologia." Tom: esperança desesperada, absurdo otimista.

A referência (sprite sheet Dr. Myco / bunker) é o north star de arte. Tudo que
eu gero proceduralmente é placeholder respeitando essa paleta e mood, pra ser
trocado por pixel art real depois.

---

## 2. Paleta canônica

- Bunker/hub: âmbar quente #E8943A, marrom escuro #3D2B1F, índigo frio #4A5A8C nos cantos, verde musgo #5C7A4E.
- Fungal: vermelho cogumelo #C0392B, roxo esporo #7B2FBE, verde bioluminescente #6BCB77, ciano #4AC0C8.
- Zonas IA (frio/hostil): cinza-metálico, ciano elétrico, vermelho alerta.
- Cada zona tem accent próprio (já em `frontend/src/state/Zones.ts`).

---

## 3. As 11 zonas (mecânica = "o que mover significa")

Specs detalhados em `design/gdd/zone-*.md`; mecânica real verificada em
`design/levels/zone-pacing-verified.md`. Todas as 11 são jogáveis.

1. Hordas — Vampire Survivors: squad em arena infinita, auto-combate radial, coletar nódulos de biomassa parado (exposto), boss na extração. Recurso: biomassa_adaptativa.
2. Stealth — Agar.io: crescer comendo bolhas menores, fugir das maiores; massa maior = mais lento. Recurso: ai_components.
3. Circuito — Snake / Tron: cabeça segue o dedo, rastro cresce por relé coletado, auto-colisão = derrota. Recurso: nucleo_logico.
4. Extração — Boulder Dash: cavar grade de terra, empurrar pedras, coletar combustível sem ser esmagado. Recurso: combustivel_volatil.
5. Campo — Domínio de praça: capturar e segurar 6 zonas contra recapturadores; dominância multiplica os sinais. Recurso: sinais_controle.
6. Infecção — Pac-Man: comer pastilhas no labirinto, fugir de drones, power pellet inverte papéis. Recurso: biomassa_adaptativa.
7. Labirinto — Sokoban: empurrar fragmentos até os receptores; só empurra, nunca puxa. Recurso: fragmentos_estruturais.
8. Sacrifício — Câmaras com custo: 5 câmaras ao redor de um hub, cada uma cobra um preço ao entrar; mochila limitada; tile EXIT encerra. Recurso: scrap + ai_components.
9. Cordilheira — Frogger: atravessar faixas hostis na vertical, 3 travessias. Recurso: scrap (Memórias Coletivas).
10. Torres — Donkey Kong: escalar a torre por vigas/escadas desviando de barris. Recurso: ai_components (Cristais de Memória).
11. Catedral — Q*bert: pular numa pirâmide isométrica acendendo os degraus. Recurso: fragmentos_estruturais (Relíquias).

---

## 4. Sistemas de "feel" a construir (núcleo, eu controlo 100%)

Isto é o que tira o jogo do "vetor morto". Construído uma vez, usado em todas as zonas.

- FX core: sistema de partículas (esporos, faíscas, poeira, sangue/seiva), pooling.
- Juice: screen shake, hit-stop, squash/stretch, knockback, tween de impacto, flash de dano, número de dano flutuante.
- Luz: camada de iluminação radial (lanterna quente no hub, glow bioluminescente nas zonas), bloom leve.
- Post-processing: CRT suavizado (já corrigido o shader WebGL1), vinheta, grão sutil. Toggle de intensidade.
- Transições de cena com wipe/fade temático.
- Câmera: shake, leve zoom-punch em eventos.
- Áudio reativo: cada evento (hit, pickup, morte, spawn, vitória) dispara som.

## 5. Áudio (síntese própria + arte externa depois)

- Engine de áudio: já existe `AudioManager`. Estender pra synth (WebAudio) gerando SFX proceduralmente.
- SFX UI: click, confirm, complete (substituir os WAVs antigos por OGG sintetizados).
- SFX gameplay: hit, pickup, morte, spawn, boss, vitória/derrota — por zona.
- Música: loops chiptune/ambient por zona (menu, battle, 6 temas). Síntese agora, troca por trilha real depois.

## 6. Pipeline de arte

Three-track, porque não tenho gerador de imagem aqui:

- Track A (agora, eu): backgrounds e texturas procedurais via Python/Pillow (ruído, gradiente, luz, grão, vinheta) respeitando a paleta. Sprites sombreados melhores que vetor.
- Track B (CC0): buscar packs pixel-art fungais no itch.io/Kenney via Chrome; integrar com aprovação de download da Leticia. Real pixel art "no espírito" da referência.
- Track C (custom): Dr. Myco, bunker hero art, peças do foguete — IA externa rodada pela Leticia com os prompts em `design/art/`, ou comissão. Eu integro.

Todo placeholder vive em caminho fixo; trocar arquivo = upgrade sem mexer em código.

---

## 7. Milestones (ordem de execução)

- M0 Foundation: FX core, juice, luz, post, audio synth engine, toolchain de geração procedural. Tunar CRT.
- M1 Hub: overhaul visual pra referência — bg texturizado, esporos flutuando, luz de lanterna, foguete com presença, polish das salas.
- M2 Hordas: pass completo de feel (arena texturizada, partículas, hit/morte FX, shake, som).
- M3 Campo + Sacrifício: pass de feel nas outras 2 jogáveis.
- M4 Zonas novas: implementar mecânica das 5 stub (Stealth, Circuito, Extração, Infecção, Labirinto) pelos GDDs.
- M5 Feel nas 5 novas zonas.
- M6 Áudio completo: música por zona + biblioteca de SFX.
- M7 Arte real: integrar pixel art (CC0/externa) substituindo placeholders.
- M8 Meta-loop: mochila, crescimento do foguete, economia de recurso, estado de vitória, NPCs resgatados no hub.
- M9 Ship: build, deploy Cloudflare + Railway, playtest, balance.

Cada milestone termina com teste ao vivo no navegador e commit.

---

## 8. Regras de execução (autonomia dada pela Leticia)

- Decido escolhas razoáveis sozinha e sigo; mostro no fim de cada milestone.
- Commit a cada milestone (e em pontos estáveis intermediários).
- Testo no navegador via dev server + Chrome a cada mudança visual.
- Só paro em blocker real: aprovar download de pack, gerar arte custom externa, decisão de direção que muda o jogo.
- Sem MVP. Alvo é o jogo inteiro, 11 zonas, no ar.

---

## 9. Blockers que vão precisar de você

1. Aprovar download de pack(s) CC0 quando eu achar os certos (Track B).
2. Gerar a arte custom da referência (Dr. Myco, bunker) via IA externa, ou aprovar comissão (Track C).
3. Conta/deploy: Cloudflare Pages e Railway precisam de login seu no fim (M9).
