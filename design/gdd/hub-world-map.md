---
tags: [fungineer, game-design, gdd]
date: 2026-03-22
tipo: game-design-doc
---

# Hub — Mapa-Mundo (Corte Transversal)

**Version**: 1.0
**Date**: 2026-03-22
**Status**: Draft — Referência Visual Aprovada

---

## Mudança de Perspectiva

> **Nota de design**: Este documento substitui a perspectiva top-down mencionada em
> `hub-and-characters.md`. A perspectiva adotada é **corte transversal lateral**
> (side-scroll cross-section), como em Fallout Shelter.

---

## Referência Visual

**Fallout Shelter (Bethesda)**: Bunker subterrâneo visto de lado em corte, mostrando todos os andares e cômodos simultaneamente. Personagens visíveis em suas salas. Elevadores e escadas conectando andares. Saídas visíveis nas bordas.

---

## Por Que Corte Transversal

Três problemas resolvidos simultaneamente:

1. **O foguete ganha sentido físico.** Em corte transversal, o foguete cresce para cima em eixo vertical real — o jogador vê literalmente cada peça adicionada.
2. **As saídas para zonas têm narrativa visual.** Túneis saindo pelas bordas comunicam: *você sai por baixo da cidade para se infiltrar*. Direção reflete zona (esquerda → Hordas, direita → Stealth).
3. **Cada personagem tem um endereço.** 10 personagens distribuídos por andares — o jogador navega verticalmente para encontrar quem precisa.

---

## Estrutura Geral do Bunker

```
╔══════════════════════════════════════════════════════╗
║  [TOPO — SUPERFÍCIE / CIDADE DAS IAs]                ║  ← invisível; só as entradas
╠══════════════════════════════════════════════════════╣
║                                                      ║
║  ANDAR 1 (mais raso)  ──────────────────────────     ║
║  [ Vigia ] [ Corredor de entrada ] [ Armamentos ]    ║
║                                                      ║
║  ANDAR 2 (central superior)  ──────────────────     ║
║  [ Lab da Rival ] [ CÂMARA DO FOGUETE ] [ Médica ]  ║
║                        ↑ alto, central, sempre       ║
║                          visível                     ║
║                                                      ║
║  ANDAR 3 (central inferior)  ──────────────────     ║
║  [ Workshop ] [ Sala comum / Cozinha ] [ Arquivo ]   ║
║                                                      ║
║  ANDAR 4 (mais fundo)  ─────────────────────────    ║
║  [ Quarto Hacker ] [ Gestão / Ex-Exec ] [ Infirmary ]║
║                                                      ║
║  ╔═══╗      ╔═══╗      ╔═══╗      ╔═══╗             ║
║  ║ T ║      ║   ║      ║   ║      ║ T ║  ← túneis   ║
║  ╚═╦═╝      ╚═╦═╝      ╚═╦═╝      ╚═╦═╝             ║
║    ║          ║          ║          ║                ║
║  [HORDAS]  [futuro]  [futuro]   [STEALTH]           ║
╚══════════════════════════════════════════════════════╝
```

---

## Os Andares e Cômodos

### Andar 1 — Superfície Rasa
Tom visual: metal enferrujado, iluminação vermelha de emergência, sensação de perigo próximo.

**Posto de Vigia**
- Personagem: **Ex-Militar**
- Monitora entradas; câmeras rudimentares apontando para os túneis; arsenal pendurado
- Gameplay: acesso ao **mapa-mundo** — Ex-Militar gerencia informações das zonas disponíveis

**Corredor de Entrada**
- Sem personagem fixo — área de transição
- Gameplay: **tela de preparação de run** aparece aqui (squad + mochila)
- Visual: porta reforçada à esquerda, escotilha de emergência no teto

**Armamentos / Depósito**
- Personagem: **Cínico Experiente**
- Guarda e organiza equipamentos; sabe onde tudo está (e reclama que ninguém devolve)
- Visual: prateleiras de metal, caixotes, ferramentas, luz fluorescente fria

---

### Andar 2 — Núcleo Central Superior
Tom visual: mais habitado, mais quente. A câmara do foguete domina o centro.

**Laboratório da Cientista Rival**
- Personagem: **Cientista Rival**
- Pesquisa alternativas à abordagem do Doutor; quadros de equações, protótipos falhos
- Visual: branco científico sujo, post-its em toda parede; laboratório quase se toca com o do Doutor

**⭐ Câmara Central do Foguete** *(cômodo especial — ocupa 2 andares de altura)*
- Personagem: **O Doutor** (fica aqui)
- Foguete montado verticalmente — começa como sucata no andar 3, cresce atravessando o teto para o andar 2
- Visual: estrutura de andaime, fios por toda parte, luz âmbar quente iluminando o foguete dramaticamente
- Gameplay: clicar no foguete abre o **painel de progresso** (receitas, recursos, peças completas)

**Enfermaria**
- Personagem: **Médica Pragmática**
- Camas com cortinas, equipamentos médicos misturados com gambiarras
- Visual: verde hospitalar desbotado, luzes brancas frias, quadros de dados
- Gameplay: aliados feridos ficam em "recuperação" aqui por X minutos antes de estarem disponíveis

---

### Andar 3 — Vida Comunitária
Tom visual: mais orgânico, mais "lar". O andar mais colorido e aconchegante.

**Workshop / Oficina**
- Personagens: **Engenheiro Culpado** + **Mecânico Otimista** (dividem o espaço)
- Fabricação de peças, montagem, upgrades
- Visual: bancadas com ferramentas, chão marcado de graxa. Engenheiro = organizado e silencioso; Mecânico = caótico e animado
- Gameplay: **Ex-Executivo** desbloqueia upgrades de mochila aqui

**Sala Comum / Cozinha**
- Personagem: **Mecânico Otimista** (quando não está na oficina) + área social
- Ponto de encontro; mesa grande com cadeiras desemparelhadas; cozinha improvisada
- Visual: tapetes sobrepostos, luz âmbar, o único espaço com plantas (um cacto)
- Gameplay: diálogos casuais entre personagens; Doutor pode interagir com múltiplos NPCs

**Arquivo / Sala de Documentação**
- Personagem: **Artista Documentarista**
- Paredes cobertas de polaroids, mapas desenhados à mão, diários; câmera no tripé apontando para o foguete
- Visual: penumbra quente, pilhas de cadernos, cordas com fotos estilo investigação
- Gameplay: **logs de sessão** do jogo ficam aqui como "registros do Artista"

---

### Andar 4 — Mais Fundo
Tom visual: escuro, azulado-frio. Parece mais esconderijo.

**Quarto do Hacker / Server Room**
- Personagem: **Adolescente Hacker**
- Hackeamento de sistemas de IA, espionagem digital das zonas; telas com feeds de câmeras
- Visual: escuridão total exceto brilho de múltiplas telas, neon verde de código, lixo de fast food
- Gameplay: Hacker oferece **intel de zona** antes da run (revela posição de 1 câmera ou patrulha)

**Gestão / Escritório do Ex-Executivo**
- Personagem: **Ex-Executivo**
- Gerencia recursos, faz planilhas, tenta impor processo
- Visual: a única mesa organizada do bunker; quadro branco com métricas; post-its em sistema improvisado; um único vaso de planta morto
- Gameplay: interface de **gestão de recursos** e desbloqueio de upgrades de mochila

**Quarto da Criança Prodígio**
- Personagem: **Criança Prodígio**
- Quarto + laboratório; experimentos e brinquedos misturados
- Visual: ursos de pelúcia ao lado de componentes eletrônicos desmontados; desenhos na parede que de perto são diagramas técnicos complexos

---

## Os Túneis — Saídas para as Zonas

Túneis no fundo do bunker (andar 4 ou abaixo), saindo pelas laterais. Visualmente são buracos escavados com trilhos de carrinho de mina — feitos às pressas.

```
Bunker (corte)
     │
     │  (andares 1-4)
     │
  ───┼───────────────────────────────────
     │
 ╔═══╧═══╗    ╔═══════╗    ╔═══╧═══╗
 ║ TÚNEL ║    ║FUTURO ║    ║TÚNEL  ║
 ║       ║    ║       ║    ║       ║
 ║HORDAS ║    ║       ║    ║STEALTH║
 ╚═══════╝    ╚═══════╝    ╚═══════╝
```

| Túnel | Zona | Direção | Atmosfera Visual |
|---|---|---|---|
| Túnel Oeste | Zona Hordas | Saída esquerda | Tijolos velhos, iluminação industrial laranja, sons distantes de metal |
| Túnel Leste | Zona Stealth | Saída direita | Concreto liso, neon verde fraco, silêncio — chega na periferia da cidade das IAs |
| Túneis Centrais | Zonas pós-MVP | Saída central/baixo | Bloqueados por entulho no MVP — comunicam conteúdo futuro |

**Acesso ao mapa-mundo**: interagir com o **Posto de Vigia** (Ex-Militar, andar 1). Mapa aparece como visão de cima do sistema de túneis — bunker no centro, ramais em diferentes direções. Cada ramal mostra: recurso disponível, dificuldade estimada, última visita.

---

## Navegação no Hub

- **Scroll vertical**: deslizar para cima/baixo navega entre andares. Animação suave, sem corte.
- **Zoom out**: pinça para fora mostra bunker inteiro (visão "Fallout Shelter"). Foguete domina o centro.
- **Câmara central**: sempre visível como âncora visual durante o scroll, mesmo entre andares.
- **Interação com personagem**: toque abre painel de relação (barra de confiança, missões, diálogo de estado).
- **Indicadores de atenção**: missão nova disponível = ícone flutuante sobre o personagem (ponto de exclamação, sem texto).

---

## Progressão Visual do Bunker

| Momento | Visual do Bunker |
|---|---|
| Início | Bunker vazio. Apenas Doutor e 1–2 sobreviventes. Muitos cômodos escuros. |
| Médio | Mais personagens chegaram. Cômodos acendem ao serem ocupados. Foguete começa a ter forma. |
| Late game | Todos os 10 cômodos iluminados e habitados. Foguete reconhecível. NPCs interagindo na sala comum. |
| Final | Foguete completo ultrapassa o teto do andar 1 — visível saindo pela superfície. Luz dourada no bunker. |

---

## Acceptance Criteria

- [ ] O foguete é visível em qualquer andar durante o scroll (câmara central transparece entre andares)
- [ ] Cômodos sem personagem têm visual escuro — cômodos habitados têm luz e atividade
- [ ] Os dois túneis MVP (Hordas e Stealth) são visualmente distintos em atmosfera no ponto de entrada
- [ ] A câmara do foguete em zoom out é o ponto focal visual imediato do bunker
- [ ] Um novo jogador encontra o acesso ao mapa-mundo (Posto de Vigia) sem instrução em ≤ 30