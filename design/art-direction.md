---
tags: [fungineer, design]
date: 2026-03-21
tipo: design
---

# Orbs — Direção de Arte

**Data**: 2026-03-21
**Status**: Draft — Referências Visuais Mapeadas

---

## Visão Geral

O visual de Orbs é definido pelo contraste intencional entre dois mundos: o calor improvisado e humano do hub subterrâneo vs o frio digital e hostil das zonas controladas por IAs. A linguagem visual reforça o tom narrativo — esperança descuidada dentro, perigo calculado fora.

**Estilo base**: 2D top-down com iluminação dinâmica. Arte ilustrada com outlines suaves, personagens de silhueta forte e paletas de cor por zona (cada área tem sua identidade cromática imediata).

---

## Mapeamento de Referências Visuais

### Hub — Base de Resistência

**Referência primária**: Jogo de dungeons top-down com câmera que mostra múltiplos cômodos simultaneamente *(ref. 1)*

O hub deve ser lido como um organismo vivo — cada sobrevivente ocupando seu canto, cada cômodo com iluminação e atmosfera própria. A câmera fixa mostra o espaço inteiro na tela, como uma planta baixa iluminada de dentro.

**Iluminação**: Sistema de iluminação local por fonte, como na referência. O centro do hub — onde fica o foguete — recebe luz quente laranja-âmbar (lanternas, improvisadas). Os cantos onde dormem os sobreviventes têm tons mais frios e intimistas (azul-roxo suave). Essa dualidade calor/frio é idêntica ao contraste do jogo de dungeons de referência, onde os cômodos especiais têm luz azul mágica e os espaços comuns têm laranja.

**Linguagem visual dos objetos**: Clutter intencional — fios pendurados, gambiarras, caixas empilhadas, tapetes improvisados, equipamentos remendados. Similar ao detalhamento interno dos cômodos na ref. 1. Cada NPC tem seu espaço reconhecível à distância por cor de roupa + objeto característico (planilhas do Ex-Executivo, ferramentas do Mecânico, câmera do Artista).

**O Foguete**: Fica no centro do hub, montado verticalmente. Começa como uma pilha de sucata irreconhecível e vai tomando forma a cada peça entregue. O calor laranja das lanternas bate nele de baixo, criando sombras que mudam conforme ele cresce. É o único elemento vertical num espaço horizontal — sempre chama o olho.

**Paleta do Hub**:
- Primária: laranja-âmbar (#E8943A), marrom escuro (#3D2B1F)
- Secundária: azul-índigo suave (#4A5A8C) nos cantos habitados
- Acentos: verde musgo (#5C7A4E) nos tapetes e plantas improvisadas
- UI/ícones: estilo pedra lapidada com brilho interno, similar à iconografia de gemas da ref. 1

---

### Zona Hordas — Arena de Combate

**Referências**: Jogo top-down 3D com arena ao ar livre colorida *(ref. 4)* + cena de ação subterrânea *(ref. 3)*

O look da Zona Hordas é **legibilidade acima de tudo** — o jogador precisa ler posição, inimigos, e area-of-effect em menos de um segundo. A referência ao jogo de arena ao ar livre (ref. 4) captura isso perfeitamente: chão com textura clara, inimigos com silhuetas distintas por tipo, paleta de chão em verde/terra para contrastar com os personagens coloridos.

**Ambiente**: Arena cercada com paredes visíveis mas sem teto — espaço aberto que comunica "aqui você luta". O chão alterna entre grama/terra e superfície industrial (sucata, metal enferrujado). Resquícios de infraestrutura humana abandonada — cercas tombadas, caixotes de madeira, tambores de metal enferrujado — criam cobertura natural.

**Inimigos**: Silhuetas geométricas claras por tipo, como na ref. 4:
- Runners: baixos, finos, velocidade comunicada pela postura inclinada
- Bruisers: largos, lentos, presença comunicada pelo tamanho
- Spitters: médios, postura de costas arqueadas, projéteis com rastro visível
- Partículas de dano e explosão grandes e legíveis (ref. 4 mostra claramente isso com os flashes de tiro em laranja-dourado)

**Paleta da Zona Hordas**:
- Chão: verde saturado (#5A8C3E) / terra #8C6A3E — contraste claro com personagens
- Inimigos: tons de cinza-metálico com detalhes laranja (sucata com componentes de IA)
- Efeitos de combate: laranja-âmbar para explosões, azul-ciano para projéteis dos Spitters
- HUD de squad: ícones circulares com borda colorida por personagem (Guardian = azul, Striker = vermelho, Artificer = roxo, Medic = verde)

---

### Zona Stealth — Cidade Controlada por IA

**Referência primária**: Cidade cyberpunk com grade neon verde sobre fundo azul-roxo profundo *(ref. 7)*

Esta é a zona com identidade visual mais forte e distinta. Enquanto o hub é quente e orgânico, a cidade das IAs é **fria, geométrica, e glowing**. A ref. 7 captura exatamente o que a narrativa pede: uma cidade que foi tomada por inteligências artificiais — tudo é grade, tudo é monitorado, tudo glows com luz que não foi feita para olhos humanos.

**Ambiente**: Top-down de ruas de uma cidade à noite. Prédios como silhuetas geométricas escuras com bordas iluminadas em neon verde (#00FF88) ou azul-ciano (#00D4FF). O chão das ruas é escuro com reflexo úmido das luzes. Postes com hologramas de IA pulsando. Câmeras de segurança como olhos mecânicos com cone de luz visível.

**Sistema de luz e sombra como elemento visual central**: Zonas iluminadas têm o chão coberto por gradiente neon — o jogador visivelmente sai do "mundo visível" ao entrar nas sombras. As sombras são literalmente mais escuras, com o personagem perdendo saturação ao entrar (ficando mais escuro, quase invisível). Essa transição visual comunica mecânica sem UI: o jogador vê que ficou "menos visível" por causa da cor.

**Cones de visão e câmeras**: Os cones são desenhados em neon translúcido — verde para drones de visão direta, laranja-âmbar para câmeras rotatórias. A referência da grade neon da ref. 7 se traduz direto nessa linguagem de UI diegética (o cone é parte do visual do mundo, não uma sobreposição de HUD).

**O Raio de Som**: Círculo pulsante ao redor do personagem em lilás/roxo translúcido. Cresce visivelmente conforme o personagem acelera. Quando o personagem para, o círculo encolhe suavemente até quase desaparecer. A animação de encolhimento é o feedback principal de que você está seguro.

**Paleta da Zona Stealth**:
- Fundo/prédios: azul-petróleo muito escuro (#0D1B2A) e preto-azulado (#07111A)
- Neon primário (IA/câmeras/cones): verde-neon (#00FF88)
- Neon secundário (câmeras rotatórias): âmbar (#FFB830)
- Ruas/chão: roxo-escuro com reflexos (#1A0A2E + speculares neon)
- Personagem nas sombras: dessaturado, escuro — quase uma silhueta
- Personagem iluminado: cores normais, visível — em perigo

---

### Personagens — Linguagem Visual Geral

**Referência**: Personagens pequenos com silhueta forte e cor de identificação imediata *(refs. 1, 4)*

Em tela mobile, os personagens têm, no máximo, 60–80px de altura. A ref. 1 mostra como personagens minúsculos ainda são legíveis quando têm: (a) cor principal única, (b) formato de cabeça distinto, (c) acessório icônico em silhueta.

**O Doutor**: Jaleco branco com manchas de graxa, cabelo bagunçado para o alto, óculos redondos. Postura ligeiramente curvada para frente (o eterno entusiasmo). Cor de identificação: branco-creme + detalhes azul-elétrico.

**Linguagem geral dos aliados**: Cada personagem tem uma cor-âncora que aparece na roupa, na barra de confiança do hub, e no ícone do squad durante runs. Essa cor é o sistema de reconhecimento principal — não os rostos (que seriam ilegíveis na tela mobile).

---

### UI / HUD

**Referência**: Ícones estilo gema/cristal *(ref. 1)* + barras de status limpas *(refs. 3, 4)*

**Hub**: Interface de recursos usa ícones de cristal/gema para Sucata Metálica (cinza-prata facetado) e Componentes de IA (verde-neon translúcido). O foguete no centro serve como barra de progresso visual principal — não há barra de progresso numérica global, apenas o foguete crescendo.

**Durante runs (Hordas)**: HUD minimal — barra de HP coletiva no canto superior esquerdo, ícone do poder ativo centralizado. Sem minimap. O que importa está na tela.

**Durante runs (Stealth)**: Slots da mochila visíveis como ícones no canto superior direito (quadrados com borda; preenchidos = item dentro). O círculo de progresso ao redor do item a ser coletado usa a mesma linguagem neon da zona.

---

## Resumo de Paletas por Área

| Área | Tom Emocional | Cor Primária | Cor Secundária | Acento |
|---|---|---|---|---|
| Hub | Calor / esperança | Laranja-âmbar | Marrom escuro | Azul-índigo |
| Zona Hordas | Adrenalina / caos | Verde saturado | Terra | Laranja explosivo |
| Zona Stealth | Tensão / silêncio | Azul-petróleo | Preto-azulado | Neon verde |
| Personagens | Legibilidade | Cor-âncora única | Branco/preto outfit | Acessório icônico |

---

*Baseado nas referências visuais fornecidas (7 imagens). Para próximas etapas, ver `/prototype` e `/design-system`.*
