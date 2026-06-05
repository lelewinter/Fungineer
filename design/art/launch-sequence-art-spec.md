---
tags: [fungineer, art-direction, launch-sequence, victory-screen]
date: 2026-06-05
tipo: art-direction
status: Referência de Produção
---

# Fungineer — Spec de Arte: Sequência de Lançamento e Tela de Vitória

**Data**: 2026-06-05
**Autor**: Art Director
**Escopo**: Tratamento visual do evento LANÇAR + tela de vitória (RocketLaunchOverlay),
evolução do esquema do casulo por estágio (HubRocketPanel) e spec
de asset/animação placeholder-para-final em 480×854.
**Fonte de verdade do código**:
- `frontend/src/ui/hub/RocketLaunchOverlay.ts`
- `frontend/src/ui/hub/HubRocketPanel.ts`
- `frontend/src/state/HubState.ts` (ROCKET_RECIPE com 8 peças)
**Norte de arte**: pixel art fungal escuro — Dr. Myco / bunker como âncora.
Paleta base obrigatória definida em `design/art/visual-consistency-audit.md`.

---

## 1. Conceito Central: o Foguete-Semente

O foguete não é tecnologia aeroespacial. É um organismo germinado. O Dr. Myco
extraiu vida do fungo, da sucata e de fragmentos de IA para construir um casulo
que vai plantar consciência fungal no céu. A sequência de lançamento é o pico
emocional do jogo precisamente porque não é um lançamento genérico — é uma semente
sendo lançada.

**Princípio visual resultante**: nenhuma chama de propulsão de aço, nenhuma trilha
de oxigênio líquido. O que sai da base do foguete é vida: micélio em ignição,
esporos liberados pela pressão, bioluminescência explodindo para fora da câmara
do bunker. A física do lançamento é fungal, não química.

---

## 2. Paleta da Sequência de Lançamento

A sequência tem acesso a uma paleta expandida em relação ao hub em repouso,
porque o lançamento é excepcional. Ainda assim, todas as cores derivam da paleta
base do bunker — nada novo é inventado.

### 2.1 Paleta base (obrigatória, da auditoria)

| Papel | Hex | Uso na sequência |
|---|---|---|
| Fundo primário | `#1A1008` | Fundo do overlay, sombras do foguete |
| Fundo secundário | `#2A1F14` | Painel do overlay, paredes do bunker visíveis |
| Midtone quente | `#3D2B1F` | Corpo do foguete na espera antes do lançamento |
| Lanterna âmbar | `#E8943A` | Primeira cor de ignição, luz de ascensão |
| Musgo/sombra orgânica | `#2D3B1E` | Hifas de micélio na base, sombra das raízes |
| Outline escuro | `#0D0806` | Outlines de todos os sprites pixel art |

### 2.2 Paleta de evento (apenas durante lançamento)

Estas cores só aparecem na sequência de lançamento e na tela de vitória.
Fora deste contexto não são usadas.

| Papel | Hex | Justificativa |
|---|---|---|
| Bioluminescência de ignição | `#C8F07A` | Verde-esporo no pico de liberação — vivo, não elétrico |
| Esporo pulso interno | `#8FD44E` | Tom médio do verde fungal iluminado |
| Hifa em combustão | `#F5A449` | Âmbar mais brilhante que o de lanterna — calor de ignição |
| Núcleo de micélio | `#FFDD88` | Branco-amarelado no centro do burst — máximo calor orgânico |
| Roxo esporo profundo | `#6B3FA0` | Acento nos esporos liberados em altitude — noite fungal |
| Cyan vital | `#4DC9C4` | Texto de UI na vitória — legível, frio como alívio |

**Proporção máxima da paleta de evento**: 35% da área visual durante a ascensão,
declinando para 20% na tela de vitória estática. O fundo permanece `#1A1008`
em toda a sequência.

---

## 3. Sequência de Lançamento: Fases e Visual

A sequência começa quando o jogador aperta LANÇAR no HubRocketPanel (o botão
`launchRequested` é emitido). O RocketLaunchOverlay é aberto pelo HubScene em
seguida. A sequência tem quatro fases visuais distintas.

### Fase 0 — Countdown (0 ms a 800 ms)
**O que acontece no código atual**: o overlay abre com animateOpen() e startAnimation()
começa imediatamente.

**Visual final descrito**:
A câmara do bunker escurece (`#1A1008` preenchendo 100% da tela), exceto pela
silhueta do foguete ainda na baia. Uma pulsação de bioluminescência começa na base
do foguete: círculo de `#C8F07A` com raio 8px de arte, expandindo-se para 24px de
arte em 400 ms e dissipando. O ciclo repete três vezes antes da ignição.

Ao mesmo tempo, as hifas de micélio (raízes do foguete, que no código atual
aparecem com `built >= 5`) crescem em comprimento — de 10px para 20px de arte
— enquanto pulsam em `#E8943A` → `#F5A449` em alternância.

**Placeholder procedural já implementável**:
- Aumentar o comprimento das raízes de 10px para 20px ao longo de 800 ms usando
  `lerp(10, 20, elapsedMs / 800)` na variável `fyBase + length`
- Três pulsos circulares de `Color.rgb(0.78, 0.94, 0.48)` com alpha declinando
  de 0.9 para 0.0 em 250 ms cada, centrados em `(cx, bottomY)`
- Timing: pulso 1 em t=100ms, pulso 2 em t=350ms, pulso 3 em t=600ms

### Fase 1 — Ignição (800 ms a 1400 ms)
**Visual final**:
O núcleo de micélio na base do foguete explode para fora. É um burst de esporos,
não uma chama. O burst tem três camadas concêntricas:
1. Núcleo (`#FFDD88`): raio 4px de arte, dura 200 ms
2. Anel de ignição (`#F5A449`): raio 12px de arte, dura 300 ms
3. Halo de esporos (`#C8F07A`): raio 24px de arte, dura 400 ms com partículas
   individuais dispersando para cima e para os lados

As paredes do bunker na lateral do foguete são iluminadas pelo burst: tiles de
parede (`#2A1F14`) ganham highlight de `#F5A449` com alpha 0.4, aplicado como
overlay — como se a luz quente do micélio em ignição estivesse pingando na pedra.

**Placeholder procedural**:
- Três círculos concêntricos em `(cx, bottomY - 5)` com raios crescendo ao longo
  de seus respectivos durações, cores conforme acima
- Os "stripes" de plating do corpo do foguete (já presentes no código em `built > 0`)
  pulsam de `CYAN` para `#FFDD88` durante os 600 ms da ignição, voltando a CYAN
  gradualmente até t=2000ms

### Fase 2 — Ascensão (1400 ms a 4000 ms)
**Visual final**:
O foguete sobe. Na tela de 480×854 o foguete começa centralizado verticalmente
(y ≈ 427px) e se move para y = -120px (saindo pelo topo da tela) ao longo de
2600 ms com curva ease-in: lento nos primeiros 800 ms, rápido no final.

**Trilha do foguete-semente**: não é fogo. São três elementos simultâneos saindo
da base do foguete enquanto sobe:
1. **Fios de micélio**: linhas finas onduladas, cor `#2D3B1E` com edge highlight
   `#8FD44E`, comprimento aumentando conforme a distância percorrida. No final
   da ascensão, ocupam todo o espaço vertical que o foguete percorreu — como se o
   foguete tivesse deixado uma rede de raízes no ar antes de cortar e seguir.
2. **Esporos dispersos**: partículas de 2px de arte em `#C8F07A` e `#6B3FA0`,
   liberadas em leque a cada 80 ms, com velocidade horizontal aleatória entre
   -20px/s e +20px/s e velocidade vertical entre +10px/s e +40px/s (subindo, mas
   mais devagar que o foguete). Alpha começa em 1.0 e cai para 0.0 em 1200 ms.
3. **Pulsação do núcleo**: o corpo do foguete emite um pulso de bioluminescência
   (`#8FD44E`, alpha 0.6) a cada 320 ms durante toda a ascensão.

**Placeholder procedural**:
- O `rise` já calculado no código (`Math.min(1, this.elapsedMs / 1200)`) expande
  para `Math.min(1, Math.max(0, (this.elapsedMs - 1400) / 2600))` — só começa
  após a ignição
- `this.flame.y` passa a representar a posição y do foguete completo, não apenas
  o glifo emoji: começar em `0` (centro do overlay) e mover para `-600` ao longo
  da ascensão
- Para os esporos: array de 40 objetos `{x, y, vx, vy, alpha, color}` criado em
  `startAnimation()`, populado a cada 80 ms durante a fase de ascensão. Renderizar
  como círculos de raio 1px de arte (2px na tela) usando `this.g.circle(p.x, p.y, 1)`
  com as cores especificadas acima

### Fase 3 — Tela de Vitória (4000 ms em diante)
**Visual final**:
O foguete saiu de cena. A tela mostra o espaço depois do lançamento: o interior
da câmara do bunker visto de baixo, com o buraco no teto por onde o foguete passou.
Esporos ainda flutuam, agora mais lentamente. Uma nuvem de bioluminescência
(`#C8F07A`, alpha 0.15) paira no centro superior da tela, dissipando-se durante
os próximos 8 segundos.

O overlay de vitória (o painel atual com DECOLAGEM, a citação do Dr. Myco e o
resumo de raides) desliza de baixo para cima entrando em cena.

**O que o painel de vitória deve mostrar (visual)**:
- Fundo do painel: `#1A1008` com borda de 1px `#E8943A` em pixel art (sem
  cantos arredondados — corte em ângulo reto, pixel perfeito)
- Título DECOLAGEM: fonte display, cor `#F5A449`, tracking +3, tamanho 22px de arte
- Citação do Dr. Myco: itálico, cor `#4DC9C4`, tamanho 9px de arte
- Sumário: fonte mono, cor `#D8C89A` (creme quente), tamanho 11px de arte
- Botão Novo Ciclo: fundo `#4A2F12`, hover `#6B431A`, texto `#E8943A`, borda `#E8943A` 1px

**Glifo do foguete-semente no painel de vitória**:
Substituir o emoji `🚀` atual por um glifo de pixel art canônico: o foguete-semente
visto de frente, 16×32px de arte (32×64px na tela), com o seguinte esquema de cor:
- Corpo: `#4DC9C4` (cyan vital)
- Bulbo/cone: `#B87ADB` (roxo esporo do painel HubRocketPanel)
- Detalhe de soldagem: `#E8943A`
- Hifas na base: `#8FD44E`
- Outline: `#0D0806`

O glifo "boia" suavemente (bob de 3px verticalmente, período de 1800 ms,
função `sin`) e pulsa em alpha 0.75–1.0 (período de 1200 ms). Estes dois ciclos
de período diferente criam um batimento orgânico, não mecânico.

---

## 4. Evolução Visual do HubRocketPanel por Estágio

O HubRocketPanel já tem a lógica de `pieceColor()` e `buildY` implementados.
Esta seção define o que cada estágio DEVE parecer visualmente, para que o pixel
art final e os placeholders evoluídos contem a mesma história.

As 8 peças da ROCKET_RECIPE, em ordem:
1. Base Estrutural
2. Motor Principal
3. Processador
4. Revestimento
5. Rede Neural
6. Sistema Vital
7. Blindagem Externa
8. Ignição Final

### 4.1 Linguagem de cor por estágio do painel

| Peças construídas | Cor dominante do foguete no painel | Tom emocional |
|---|---|---|
| 0 / 8 | `#3D3028` (metal inerte, quase aço) | Latência, possibilidade |
| 1 / 8 | Base em `#E8943A`, resto `#3D3028` | Fundação quente, ainda opaco |
| 2 / 8 | Base + Motor em `#E8943A`, resto `#3D3028` | Calor crescendo |
| 3 / 8 | Transição: corpo inferior começa `#4DC9C4`, cone `#3D3028` | Vida entrando |
| 4 / 8 | Metade inferior `#4DC9C4`, metade superior `#3D3028` | Meia gestação |
| 5 / 8 | Corpo 2/3 `#4DC9C4`, cone começando `#B87ADB` | Quase pronto, roxo emergindo |
| 6 / 8 | Corpo completo `#4DC9C4`, cone `#B87ADB`, hifas visíveis | Organismo formado |
| 7 / 8 | Corpo + cone + aletas em cor viva, linha de solda pulsando forte | Última peça faltando |
| 8 / 8 | Foguete completo, todas as peças em cor, sem linha de solda, BRILHO TOTAL | Pronto para voar |

**Nota de implementação**: o código atual usa `PURPLE` para o bulbo e `CYAN` para
o corpo, uniformemente. A evolução acima requer que `pieceColor()` receba a peça
específica e devolva uma cor que varia não só entre built/next/inactive mas também
reflete a progressão narrativa (calor âmbar nas peças estruturais, cyan no corpo,
roxo no cone).

### 4.2 Detalhes visuais por estágio

**Estágios 0–2 (Base e Motor)**:
- Foguete lê como "carcaça de sucata" — predominância de cinza-marrom `#3D3028`
- A Base Estrutural em `#E8943A` é o único ponto de cor quente
- As hifas de raiz na base NÃO aparecem ainda (correto no código atual: `built >= 5`)
- A linha de solda âmbar pulsa muito sutilmente (alpha máximo 0.5)
- Nenhuma janelinha (porthole) visível ainda

**Estágios 3–4 (Processador e Revestimento)**:
- O corpo começa a receber cor `#4DC9C4` da base para cima
- As anotações no lado esquerdo/direito ganham destaque: ✓ em verde-esporo `#8FD44E`,
  não apenas em roxo
- A linha de solda pulsa mais forte (alpha máximo 0.75)
- Uma janelinha (porthole) aparece na seção mais baixa já construída, cor `#C8F07A`

**Estágios 5–6 (Rede Neural e Sistema Vital)**:
- As hifas de raiz aparecem (correto no código: `built >= 5`)
- As hifas têm cor alternada: em vez de apenas âmbar, alternam `#E8943A` e `#8FD44E`
  a cada hifa (índice par/ímpar) — isso sinaliza que o "sistema vital" está integrando
  biologia e circuito
- O cone (bulbo) começa a aparecer em `#B87ADB` (roxo esporo)
- Segunda janelinha aparece na seção do meio

**Estágios 7–8 (Blindagem e Ignição Final)**:
- Estágio 7: linha de solda em alpha máximo 1.0, largura 2px, pulsando rápido
  (período 600 ms em vez de 1000 ms) — urgência, está quase pronto
- Estágio 8 (completo): todas as linhas de solda desaparecem. O foguete pulsa com
  um glow de bioluminescência — um halo suave de `#C8F07A` ao redor do contorno
  inteiro do foguete, alpha 0.2, expandindo e contraindo (não pisca, respira).
  As hifas de raiz ficam mais longas (30px em vez de 10px), movimento mais lento e
  orgânico. Botão LANÇAR aparece.

### 4.3 Texto de status por estágio (HubRocketPanel)

Substituir os textos genéricos por textos que respondam ao progresso:

| Peças | Texto de status | Cor |
|---|---|---|
| 0 | `0 / 8 · em espera de materiais` | `#5A5040` (neutro escuro) |
| 1 | `1 / 8 · fundação fixada` | `#E8943A` |
| 2 | `2 / 8 · motor germinando` | `#E8943A` |
| 3 | `3 / 8 · circuitos acordando` | `#4DC9C4` |
| 4 | `4 / 8 · revestimento tecido` | `#4DC9C4` |
| 5 | `5 / 8 · rede neural ativa` | `#8FD44E` |
| 6 | `6 / 8 · sistema vital respirando` | `#8FD44E` |
| 7 | `7 / 8 · blindagem crescida` | `#B87ADB` |
| 8 | `✓ Casulo germinado — pronto pra plantar no céu` | `#F5A449` |

---

## 5. Spec de Asset Placeholder-para-Final

Esta seção define o caminho de cada asset desde o estado procedural atual
até o pixel art final, com parâmetros específicos para que um dev aproxime
o placeholder proceduralmente já hoje.

### 5.1 Assets do HubRocketPanel (esquema do casulo)

**Asset**: Foguete-semente no painel (desenhado via Pixi Graphics no código atual)

| Parâmetro | Placeholder atual | Placeholder evoluído | Final pixel art |
|---|---|---|---|
| Arquivo | procedural (Graphics) | procedural melhorado | `hub_rocket_schematic_stage[0-8].png` |
| Dimensões arte | N/A (vetorial) | N/A | 80×160px de arte (160×320px na tela) |
| Paleta | PURPLE + CYAN + GRAY | conforme seção 4.1 | conforme seção 4.1 |
| Bulbo/cone | polígono roxo | polígono roxo + borda escura | pixel art com detalhe de 4px |
| Corpo (seções) | retângulos cyan | retângulos + hifas alternadas | 3 seções pixel art com rebites |
| Aletas | polígonos marrom | polígonos marrom + sombra interna | pixel art com detalhe de metal |
| Hifas de raiz | 5 linhas verticais âmbar | 5 linhas alternando âmbar/verde | 7 hifas pixel art com sinuosidade |
| Linha de solda | linha âmbar pulsante | linha com dots âmbar em ritmo | cortada em final — substituída por glow |

**Arquivo de pixel art final**: 9 arquivos (um por estágio 0–8), pois a forma do
foguete muda estruturalmente entre estágios (não apenas a cor).
Nomeação: `hub_rocket_schematic_stage0.png` a `hub_rocket_schematic_stage8.png`
Diretório: `frontend/public/assets/hub/`

**Especificação técnica do pixel art**:
- Canvas: 80×160px de arte (múltiplo de 16: 80 = 5×16, 160 = 10×16)
- Grid de detalhe mínimo: 4px de arte
- Paleta máxima: 12 cores por estágio (excluindo transparente)
- Escala de exportação: 1:1 de arte (engine faz o 2× nearest-neighbor)
- Fundo: transparente
- Outline: `#0D0806` 1px de arte em todas as bordas sólidas

### 5.2 Assets da sequência de lançamento (RocketLaunchOverlay)

**Asset A**: Partícula de esporo (para substituir os círculos procedurais)

| Parâmetro | Spec |
|---|---|
| Arquivo | `vfx_spore_launch_small.png` |
| Formato | PNG spritesheet horizontal, 8 frames |
| Dimensões por frame | 4×4px de arte (8×8px na tela) |
| Paleta | `#C8F07A`, `#8FD44E`, `#6B3FA0`, `#0D0806` (outline) |
| Animação | Frame 0: círculo sólido. Frames 1-4: expanding + fading. Frames 5-7: apenas outline, alpha declinando |
| Tempo por frame | 80 ms |
| Diretório | `frontend/public/assets/vfx/` |

**Asset B**: Glifo do foguete-semente (para substituir o emoji `🚀`)

| Parâmetro | Spec |
|---|---|
| Arquivo | `ui_rocket_seed_glyph_idle.png` (spritesheet, 4 frames de bob) |
| Dimensões por frame | 16×32px de arte |
| Paleta | `#4DC9C4`, `#B87ADB`, `#E8943A`, `#8FD44E`, `#0D0806` |
| Bob: frames | Frame 0: y=0. Frame 1: y=-1px. Frame 2: y=-2px. Frame 3: y=-1px. Loop. |
| Tempo por frame | 450 ms (ciclo de 1800 ms total) |
| Diretório | `frontend/public/assets/ui/` |

**Asset C**: Hifa de micélio (trilha da ascensão)

| Parâmetro | Spec |
|---|---|
| Arquivo | `vfx_mycelium_trail_segment.png` |
| Dimensões | 4×16px de arte (um segmento vertical de hifa) |
| Paleta | `#2D3B1E` (corpo), `#8FD44E` (edge highlight em 1px de arte lateral) |
| Uso | Tiled verticalmente na trilha do foguete, rotação aleatória ±5° por segmento |
| Diretório | `frontend/public/assets/vfx/` |

**Asset D**: Burst de ignição (Fase 1 da sequência)

| Parâmetro | Spec |
|---|---|
| Arquivo | `vfx_mycelium_burst_ignition.png` (spritesheet, 6 frames) |
| Dimensões por frame | 48×48px de arte (96×96px na tela) |
| Paleta | `#FFDD88`, `#F5A449`, `#C8F07A`, `#8FD44E`, `#0D0806` |
| Frame 0 | Núcleo sólido 8px de diâmetro, `#FFDD88` |
| Frame 1-2 | Expansão com anel médio `#F5A449`, partículas saindo |
| Frame 3-4 | Anel externo `#C8F07A`, núcleo começando a dissipar |
| Frame 5 | Apenas halo externo `#8FD44E` com alpha 0.4 |
| Tempo por frame | 100 ms |
| Diretório | `frontend/public/assets/vfx/` |

### 5.3 Aproximação procedural imediata (sem pixel art)

Um dev pode aproximar o visual final hoje, sem nenhum asset externo, ajustando
os parâmetros no código procedural existente:

**No RocketLaunchOverlay.ts**:

```
// Parâmetros de placeholder evoluído para a Fase 0 (Countdown)
// Pulsação de halo na base do foguete antes do lançamento:
const haloPulse = Math.abs(Math.sin(this.elapsedMs * 0.004));
// raio do halo: 8px a 24px ao longo de 400ms, repetindo 3x antes de t=800ms
const haloRadius = 8 + 16 * haloPulse;
// cor: Color.rgb(0.78, 0.94, 0.48) — bioluminescência #C8F07A
// alpha: 0.9 * (1 - haloPulse)

// Fase 1 (Ignição, t=800ms a t=1400ms):
// 3 círculos concêntricos em (cx, bottomY - 5):
// raio 4px, cor #FFDD88, alpha: 1.0 declinando em 200ms
// raio 12px, cor #F5A449, alpha: 0.8 declinando em 300ms
// raio 24px, cor #C8F07A, alpha: 0.6 declinando em 400ms

// Fase 2 (Ascensão, t=1400ms a t=4000ms):
// Substituir a animação de bob do emoji por movimento real:
const ascendT = Math.min(1, Math.max(0, (this.elapsedMs - 1400) / 2600));
// ease-in: Math.pow(ascendT, 2)
const ascendY = -this.panelH / 2 + 96 - Math.pow(ascendT, 2) * 720;
this.flame.y = ascendY;

// Esporos: array de partículas inicializado na abertura do overlay
// Ver descrição na Fase 2, seção 3 deste documento
```

**No HubRocketPanel.ts**:

```
// Substituir a cor das hifas de raiz para alternância:
// índice par: Color.rgb(0.91, 0.58, 0.23) — âmbar
// índice ímpar: Color.rgb(0.56, 0.83, 0.31) — verde-esporo #8FD44E

// Estágio 8 completo — glow de bioluminescência no contorno:
// Se built === recipe.length:
//   Desenhar contorno do foguete em cor #C8F07A com alpha pulsante
//   alpha = 0.1 + 0.1 * Math.sin(this.elapsedMs * 0.003)
//   (respira, não pisca)

// Linha de solda em estágio 7 (urgência):
// if (built === recipe.length - 1):
//   período do sin: 0.012 (em vez de 0.006) — pulsa duas vezes mais rápido
//   alpha máximo: 1.0 (em vez de 0.85)
```

---

## 6. Timing da Sequência Completa

| t (ms) | Evento | Visual |
|---|---|---|
| 0 | Overlay abre | Fade in do backdrop `#1A1008`, 90% opacity |
| 0–800 | Countdown | Pulsação de halo verde na base do foguete (3 pulsos) |
| 800–1400 | Ignição | Burst de micélio (3 anéis concêntricos); paredes iluminadas em âmbar |
| 1400–4000 | Ascensão | Foguete sobe; trilha de micélio e esporos ficam para trás |
| 4000 | Foguete sai de cena | Esporos flutuando, glow de bioluminescência residual |
| 4000–5000 | Vitória entra | Painel de vitória sobe de baixo com easing ease-out |
| 5000+ | Estado final | Painel estático, esporos ainda flutuando no fundo |

**Nota de ritmo**: a sequência completa tem ~5 segundos até o estado final. Isso
é intencional — é o pico emocional do jogo, não um loading screen. Não abreviar.
O fade de `animateOpen()` pode ser mantido mas deve ser rápido (200 ms) para não
comprimir os 800 ms do countdown.

---

## 7. O que este Spec Não Cobre

- **Áudio**: sem especificação de SFX ou música aqui. A sequência de lançamento
  precisa de direção de som coordenada separadamente.
- **Shader de distorção térmica**: o efeito de ondulação de calor na ascensão
  (se implementado) é responsabilidade do `technical-artist`. Esta spec assume que
  a trilha do foguete é desenhada via Graphics + partículas, sem shader de distorção.
- **Câmera shake**: se implementado (recomendado na Fase 1), coordenar com
  `ui-programmer` para garantir que não quebre o layout do overlay.

---

## 8. Checklist de Aprovação da Sequência

Antes de a sequência de lançamento ser considerada aprovada como "game ready":

- [ ] Nenhuma chama de aço genérica — toda trilha é micélio/esporos/bioluminescência
- [ ] O glifo do foguete-semente é pixel art canônico (não emoji `🚀`)
- [ ] A paleta de evento usa exclusivamente as cores da seção 2.2 acima
- [ ] O fundo do overlay permanece `#1A1008` em toda a sequência
- [ ] As 4 fases têm timing conforme tabela da seção 6 (tolerância ±100 ms)
- [ ] O painel de vitória tem borda em pixel art (sem cantos arredondados)
- [ ] Os esporos continuam flutuando ao fundo quando o painel de vitória está visível
- [ ] O glifo do foguete-semente boia suavemente no painel de vitória (bob de 3px)
- [ ] Em estágio 8 do HubRocketPanel, o foguete respira (glow pulsante) não pisca
- [ ] A linha de solda desaparece quando `built === 8`

---

*Relacionado: `design/art/visual-consistency-audit.md`,
`design/art/hub-rooms-art-direction.md`,
`frontend/src/ui/hub/RocketLaunchOverlay.ts`,
`frontend/src/ui/hub/HubRocketPanel.ts`,
`frontend/src/state/HubState.ts`*
