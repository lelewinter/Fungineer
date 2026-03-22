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

**Fallout Shelter (Bethesda)**: Bunker subterrâneo visto de lado, em corte, mostrando todos os andares e cômodos simultaneamente. Personagens visíveis em suas salas. Recursos no topo. Elevadores e escadas conectando andares. Saídas visíveis nas bordas.

---

## Por Que Corte Transversal

A mudança de top-down para corte lateral resolve três problemas ao mesmo tempo:

**1 — O foguete ganha sentido físico.** Em top-down, o foguete seria visto de cima (irreconhecível). Em corte transversal, o foguete cresce **para cima** em um eixo vertical real — o câmara central do bunker é alta o suficiente para abrigá-lo, e o jogador vê literalmente o foguete crescendo a cada peça adicionada.

**2 — As saídas para as zonas têm narrativa visual.** Túneis subterrâneos saindo pelas bordas e pelo fundo do bunker comunicam: *você sai por baixo da cidade para se infiltrar*. A direção de cada saída pode refletir a zona (saída esquerda → Hordas, saída direita → Stealth).

**3 — Cada personagem tem um endereço.** Em top-down com câmera fixa, 10 personagens em um espaço pequeno ficam amontoados. Em corte transversal, cada cômodo é uma "casa" própria — o jogador navega pelos andares para encontrar quem precisa.

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

### Andar 1 — Superfície Rasa (mais vulnerável, mais próximo da cidade)

Tom visual: metal enferrujado, iluminação vermelha de emergência, sensação de perigo próximo.

**Posto de Vigia**
- Personagem: **Ex-Militar**
- Função: Monitora as entradas. Câmeras rudimentares apontando para os túneis. Bancada com armas desmontadas para manutenção.
- Visual: Parede de monitores improvisados (telas de TV velhas), mapas rabiscados, arsenal pendurado.
- Gameplay: Aqui o jogador acessa o **mapa-mundo** — a Ex-Militar gerencia as informações das zonas disponíveis.

**Corredor de Entrada**
- Sem personagem fixo — área de transição
- A **tela de preparação de run** aparece aqui (escolha de squad, revisão de mochila)
- Visual: Porta reforçada à esquerda, escotilha de emergência no teto

**Armamentos / Depósito**
- Personagem: **Cínico Experiente**
- Função: Guarda e organiza os equipamentos. Sabe onde tudo está — e reclama que ninguém devolve nada no lugar.
- Visual: Prateleiras de metal, caixotes empilhados, ferramentas penduradas, luz fria fluorescente

---

### Andar 2 — Núcleo Central Superior

Tom visual: mais habitado, mais quente. A câmara do foguete domina o centro.

**Laboratório da Cientista Rival**
- Personagem: **Cientista Rival**
- Função: Pesquisa alternativas à abordagem do Doutor. Quadros de equações. Protótipos falhos em cima de mesas.
- Visual: Branco científico sujo, equipamentos sofisticados improvisados, post-its em toda parede, concorrência saudável com o Doutor visível no layout (os dois laboratórios quase se tocam)

**⭐ Câmara Central do Foguete** *(cômodo especial — ocupa 2 andares de altura)*
- Personagem: **O Doutor** (fica aqui)
- O foguete fica montado verticalmente neste espaço duplo — começa como sucata no andar 3 e cresce para cima, atravessando o teto para o andar 2
- Visual: Estrutura de andaime ao redor do foguete. Fios e cabos por toda parte. Luz âmbar quente de baixo iluminando o foguete de forma dramática.
- Gameplay: Clicar no foguete abre o **painel de progresso** (receitas, recursos necessários, peças completas).

**Enfermaria**
- Personagem: **Médica Pragmática**
- Função: Área de cuidados. Camas com cortinas de privacidade. Equipamentos médicos misturados com gambiarras.
- Visual: Verde hospitalar desbotado, luzes brancas frias, quadros de dados, prateleiras de medicamentos.
- Gameplay: Após runs com aliados feridos, personagens ficam em "recuperação" aqui por X minutos antes de estarem disponíveis para a próxima run.

---

### Andar 3 — Vida Comunitária

Tom visual: mais orgânico, mais "lar". O andar mais colorido e aconchegante.

**Workshop / Oficina**
- Personagens: **Engenheiro Culpado** + **Mecânico Otimista** (dividem o espaço)
- Função: Fabricação de peças, montagem de equipamentos, upgrades.
- Visual: Bancadas de metal com ferramentas, chão de concreto marcado de graxa, projetos à mostra. Os dois personagens têm estilos opostos: o Engenheiro é organizado e silencioso, o Mecânico é caótico e animado.
- Gameplay: Aqui o **Ex-Executivo** desbloqueia upgrades de mochila (ele traz a "ordem corporativa" para a oficina).

**Sala Comum / Cozinha**
- Personagem: **Mecânico Otimista** (quando não está na oficina) + área social
- Função: Ponto de encontro. Mesa grande com cadeiras desemparelhadas. Cozinha improvisada.
- Visual: Tapetes de cores diferentes sobrepostos, luz âmbar quente, cartazes motivacionais rasgados, o único espaço que tem plantas (um cacto).
- Gameplay: Diálogos casuais entre personagens acontecem aqui. O Doutor pode interagir com múltiplos NPCs nesta área.

**Arquivo / Sala de Documentação**
- Personagem: **Artista Documentarista**
- Função: Registra tudo. Paredes cobertas de fotos polaroid, mapas desenhados à mão, diários. Uma câmera improvisada no tripé aponta para o foguete (janela interna com visão para a câmara central).
- Visual: Penumbra quente, pilhas de cadernos, cordas com fotos penduradas estilo investigação.
- Gameplay: Os **logs de sessão** do jogo (o que foi feito, recursos coletados, história) ficam aqui como "registros do Artista".

---

### Andar 4 — Mais Fundo (mais privado, mais isolado)

Tom visual: escuro, azulado-frio. A parte do bunker que parece mais como esconderijo.

**Quarto do Hacker / Server Room**
- Personagem: **Adolescente Hacker**
- Função: Hackeamento de sistemas de IA, espionagem digital das zonas. Telas por toda parte mostrando feeds de câmeras das cidades.
- Visual: Escuridão total exceto pelo brilho de múltiplas telas, neon verde de código correndo, lixo de fast food, energia de drinks.
- Gameplay: O Hacker pode oferecer **intel de zona** antes de uma run (revela posição de 1 câmera ou patrulha) como missão especial.

**Gestão / Escritório do Ex-Executivo**
- Personagem: **Ex-Executivo**
- Função: Gerencia recursos, faz planilhas do apocalipse, tenta impor processo onde não tem.
- Visual: A única mesa organizada do bunker. Quadro branco com métricas de recursos. Post-its coloridos em sistema de gestão improvisado. Um único vaso de planta morto.
- Gameplay: Interface de **gestão de recursos** e desbloqueio de upgrades de mochila ficam aqui.

**Quarto da Criança Prodígio**
- Personagem: **Criança Prodígio**
- Função: Seu quarto — que é também um laboratório. Experimentos e brinquedos misturados.
- Visual: Misto de quarto infantil e gênio — ursos de pelúcia ao lado de componentes eletrônicos desmontados. Desenhos na parede que, de perto, são diagramas técnicos complexos.

---

## Os Túneis — Saídas para as Zonas

Os túneis ficam no fundo do bunker (andar 4 ou abaixo), saindo pelas laterais e pelo centro. Visualmente são buracos escavados com trilhos de carrinho de mina — comunicam que foram feitos às pressas.

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

**Design dos túneis**:

| Túnel | Zona | Direção | Atmosfera Visual |
|---|---|---|---|
| Túnel Oeste | Zona Hordas | Saída esquerda | Paredes de tijolos velhos, iluminação industrial laranja, sons distantes de metal |
| Túnel Leste | Zona Stealth | Saída direita | Concreto liso, iluminação neon verde fraca, silêncio — chega na periferia da cidade das IAs |
| Túneis Centrais (futuros) | Zonas pós-MVP | Saída central/baixo | Bloqueados por entulho no MVP — comunicam conteúdo futuro |

**A tela de escolha de zona** é acessada ao interagir com o **Posto de Vigia** (Ex-Militar, andar 1). O mapa-mundo aparece como uma visão de cima do sistema de túneis — você vê o bunker no centro e os ramais saindo em diferentes direções. Cada ramal leva a uma zona e mostra: recurso disponível, nível de dificuldade estimado, última vez que foi visitada.

---

## Navegação no Hub

O jogador **rola a tela verticalmente** para navegar entre andares. A câmara central do foguete (andares 2 e 3) é sempre visível ao centro mesmo durante o scroll — ela atravessa o bunker como âncora visual.

**Scroll**: Deslizar dedo para cima/baixo navega entre andares. Animação suave, sem corte.

**Zoom out**: Pinça para fora mostra o bunker inteiro de uma vez (visão "Fallout Shelter") — útil para ter noção geral. Personagens ficam muito pequenos mas o foguete domina o centro.

**Interação com personagem**: Toque sobre o personagem abre o painel de relação (barra de confiança, missões disponíveis, diálogo de estado atual).

**Indicadores de atenção**: Se um personagem tem missão nova disponível, um ícone aparece flutuando acima da sua cabeça (ponto de exclamação estilo Machinarium — sem texto, só o ícone).

---

## Progressão Visual do Bunker

O hub **visualmente evolui** conforme o jogo avança:

| Momento | Visual do Bunker |
|---|---|
| Início | Bunker vazio. Apenas Doutor e 1–2 sobreviventes. Muitos cômodos escuros e sem uso. |
| Médio | Mais personagens chegaram. Cômodos acendem à medida que são ocupados. O foguete começa a ter forma. |
| Late game | Todos os 10 cômodos iluminados e habitados. Foguete reconhecível. NPCs interagindo na sala comum. |
| Final | Foguete completo ultrapassa o teto do andar 1 — visível "saindo" pela superfície. Luz dourada no bunker inteiro. |

---

## Acceptance Criteria

- [ ] O foguete é visível em qualquer andar durante o scroll (câmara central transparece entre andares)
- [ ] Cômodos vazios/sem personagem têm visual escuro — cômodos habitados têm luz e atividade
- [ ] Os dois túneis MVP (Hordas e Stealth) são visualmente distintos em atmosfera já no ponto de entrada
- [ ] A câmara do foguete em zoom out é o ponto focal visual imediato do bunker
- [ ] Um novo jogador encontra o acesso ao mapa-mundo (Posto de Vigia) sem instrução em ≤ 30s
- [ ] A tela de preparação de run (corredor de entrada) está a ≤ 1 toque de distância do mapa-mundo

---

*Relacionado: `design/gdd/hub-and-characters.md` (atualizar perspectiva), `design/art-direction.md`, `design/gdd/game-concept.md`*
