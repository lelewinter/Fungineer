---
tags: [fungineer, level-design, pacing, verified]
date: 2026-06-05
tipo: level-design-doc
versao: 2.0
status: Verificado em código — todas as mecânicas confirmadas via leitura direta dos *Scene.ts
---

# Fungineer — Curva de Dificuldade Corrigida (Rodada 2)

**Premissa desta rodada**: toda afirmação de mecânica foi verificada lendo o arquivo
`frontend/src/scenes/runs/*Scene.ts` correspondente antes de qualquer texto de design.
O doc anterior (zone-pacing-plan.md v1.0) é citado explicitamente onde estava errado.

---

## Parte 1 — Mecânica Real das 11 Zonas (1 linha por zona, verificada em código)

| Índice Zones[] | Nome | Arquivo verificado | Mecânica real (verbo de movimento) | Referência de classe/arcade | Estava errado no v1.0? |
|---|---|---|---|---|---|
| 0 | HORDAS | HordasScene.ts | Mover joystick flutuante pelo mundo aberto; ficar PARADO sobre nódulos de biomassa (vulnerável, toma dano extra) para coletar; armas disparam sozinhas; ao bater meta, porta de extração abre e boss surge. | Vampire Survivors | Parcialmente — o "parar para coletar" como risco central não estava descrito com precisão, e o boss de extração estava ausente. |
| 1 | STEALTH | StealthScene.ts | Arrastar bolha pelo espaço aberto; crescer comendo bolhas MENORES; fugir de bolhas MAIORES; crescer deixa mais LENTO (tradeoff massa×velocidade); atingir raio-alvo vence. | Agar.io | COMPLETAMENTE ERRADO. O v1.0 descreveu cone visual, raio de som, sombras, Sincronização Cinética, Sentinela Guardião — nada disso existe. É Agar.io puro. |
| 2 | CIRCUITO | CircuitoScene.ts | Arrastar cabeça pelo tabuleiro; rastro cresce a cada relé coletado (igual cobra); tocar no próprio rastro = curto-circuito e derrota; mais rápido a cada coleta. | Snake / Tron Light-Cycles | COMPLETAMENTE ERRADO. O v1.0 descreveu fios coloridos, câmaras com timer, sequência de cores, Sentinelas — nada disso existe. É Snake. |
| 3 | EXTRAÇÃO | ExtractionScene.ts | Cavar grade de terra com gesto direcional (um quadrado por vez); empurrar pedras de lado; coletar tanques de combustível; pedras caem quando o quadrado abaixo fica vazio e esmagam se caírem no jogador. | Boulder Dash | COMPLETAMENTE ERRADO. O v1.0 descreveu lane-runner com debuffs LENTO/FAÍSCA/TEIA, scroll acelerado, canisters +T — nada disso existe. |
| 4 | CAMPO | FieldControlScene.ts | Arrastar esquadão pela praça com 6 zonas circulares; ficar dentro captura a zona (enche barra); zonas capturadas geram sinais/segundo; recapturadores da IA retomam zonas desocupadas; mais zonas = multiplicador de dominância. | Battlefield/MOBA objetivos | Correto na essência; o v1.0 descreveu o verbo com precisão adequada. |
| 5 | INFECÇÃO | InfeccaoScene.ts | Arrastar direção pelo labirinto fixo 13×17; mover automaticamente pelo corredor comendo pastilhas; pastilhas de poder deixam drones assustados e comíveis; drone normal que toca = derrota. | Pac-Man | COMPLETAMENTE ERRADO. O v1.0 descreveu "transportar carga viral entre nós", Healer, timer de nós, Amplificadores — nada disso existe. É Pac-Man. |
| 6 | LABIRINTO | LabirintoScene.ts | Arrastar para andar; ao encontrar caixa no caminho empurra um quadrado; só empurra (nunca puxa); colocar todas as caixas sobre receptores vence; caixa em canto errado trava o puzzle. | Sokoban | COMPLETAMENTE ERRADO. O v1.0 descreveu paredes com timers de abertura, Sentinela emergente, Impulso ativado por velocidade — nada disso existe. É Sokoban. |
| 7 | SACRIFÍCIO | SacrificeScene.ts | Arrastar esquadão entre hub central e 5 câmaras ao redor; cada câmara tem custo de entrada (nenhum / -timer / inimigos / -slot de mochila / cadeia); câmara sela em 8s e cospe invasores; EXIT no hub encerra com sucesso. | Roguelike de câmaras com custo de entrada | Parcialmente correto — os tipos de custo existem no código. O hub central e a saída existem. A "fase de análise antes de mover" descrita não existe como barreira forçada. |
| 8 | CORDILHEIRA | CordilheiraScene.ts | Arrastar vertical para pular uma faixa para cima/baixo; arrastar horizontal para deslizar dentro da faixa; ameaças deslizam horizontalmente nas faixas de rua; chegar no telhado conta travessia; 3 travessias vencem. | Frogger | COMPLETAMENTE ERRADO. O v1.0 descreveu Selvagens com IA, estruturas instáveis que colapsam, narrativa de tensão como mecânica central — nada disso existe. É Frogger urbano. |
| 9 | TORRES | TorresScene.ts | Arrastar horizontal para andar no andar atual; arrastar para cima perto de escada para subir; barris (canisters ARGOS) descem do topo, rolam pelos andares inclinados e caem nas bordas; tocar barril = derrota; chegar no andar do topo vence. | Donkey Kong | COMPLETAMENTE ERRADO. O v1.0 descreveu drones em enxame, ruído acumulado, stealth vertical, eixo Y como complexidade diferencial, impacto moral no Coral — nada disso existe. É Donkey Kong. |
| 10 | CATEDRAL | CatedralScene.ts | Tocar degrau vizinho na pirâmide isométrica para pular até ele (acende o degrau ao pousar); acender todos os degraus ou 70%+ quando o tempo acaba vence; sondas caem do topo e descem saltando aleatoriamente — se pousam no jogador parado, derrota. | Q*bert | COMPLETAMENTE ERRADO. O v1.0 descreveu ciclo de sino de 60s, timer de sino, ARGOS como sistema rítmico, relíquias com janela de acesso — a pirâmide existe mas o mecanismo real é Q*bert, não puzzle de timing. |

---

## Parte 2 — Curva de Dificuldade Corrigida

### Metodologia de Reclassificação

Após verificação em código, a carga cognitiva real de cada zona é radicalmente diferente
do v1.0. O critério agora é:

- **Grau de leitura do espaço** necessário por frame (quanto o jogador precisa processar simultaneamente)
- **Natureza do fail state** (reativo imediato vs. acumulativo)
- **Familiaridade do padrão arcade** (jogador que conhece o referente aprende em ~10s)
- **Reversibilidade do erro** (erros irrecuperáveis vs. recuperáveis)

| Zona | Referente | Carga real | Fail state | Reversível? |
|------|-----------|------------|------------|-------------|
| HORDAS | Vampire Survivors | Baixa — mover livre; armas automáticas | Acumulativo (HP) | Sim (sempre pode fugir) |
| CIRCUITO | Snake | Baixa-Média — seguir ponteiro, evitar rastro próprio | Imediato (auto-colisão) | Não (rastro não recua) |
| CAMPO | Battlefield obj. | Baixa-Média — mover para zona certa, ignorar resto | Acumulativo (HP do squad) | Sim (pode se retirar) |
| STEALTH | Agar.io | Média — avaliar tamanho relativo de cada bolha, tradeoff massa×vel | Imediato (bolha maior toca) | Não (sem reload de posição) |
| EXTRAÇÃO | Boulder Dash | Média — modelo mental de física de pedras; antecipação de queda | Imediato (pedra cai na cabeça) | Não (pedra já caída não volta) |
| INFECÇÃO | Pac-Man | Média — leitura de rotas de fantasmas, uso oportuno de power pellet | Imediato (fantasma toca) | Não |
| CORDILHEIRA | Frogger | Média-Alta — timing de faixa, múltiplas velocidades simultâneas | Imediato (hazard toca) | Não |
| SACRIFÍCIO | Câmaras/custo | Média-Alta — leitura de custo antes de entrar, gestão de mochila + seal timer + invasores | Acumulativo (HP + timer) | Parcial (pode sair da câmara antes de selar) |
| LABIRINTO | Sokoban | Alta — planejamento de sequência; erro irreversível sem undo | Acumulativo (timer esgota com puzzle travado) | Não (puzzle pode ficar insolúvel) |
| CATEDRAL | Q*bert | Alta — cobertura total da pirâmide, leitura de trajetória de sondas, geometria isométrica não-intuitiva | Misto (sonda pousa = imediato; timeout = acumulativo) | Parcial (70% já é vitória) |
| TORRES | Donkey Kong | Alta — timing de barris em duas dimensões (rolar + queda), localização de escadas específicas, câmera que rola | Imediato (barril toca) | Não |

---

### Ordem Recomendada Corrigida

```
ONBOARDING           DESENVOLVIMENTO          TRANSIÇÃO          MASTERY
    |                      |                      |                  |
[1] Hordas           [4] Stealth            [7] Sacrifício     [10] Labirinto
[2] Circuito         [5] Extração           [8] Cordilheira    [11] Catedral
[3] Campo            [6] Infecção           [9] Torres
```

**MUDANÇA CRÍTICA vs. v1.0**: A ordem do v1.0 estava baseada em mecânicas fictícias.
A ordem corrigida se baseia nos referentes arcade reais e na carga cognitiva verificada.

---

#### Tier 1 — Onboarding (Referentes Imediatos, Aprendizado em <30s)

**Slot 1: Hordas (Vampire Survivors)**
Único verbo: mover. Armas automáticas. Nenhuma decisão de timing precisa acontecer nos
primeiros segundos. O risco real (parar sobre nódulo) é opt-in — o jogador descobre
quando decide fazê-lo. Fail state por HP é legível. Ensina: "mover é o input central".

**Slot 2: Circuito (Snake)**
Referente amplamente conhecido. Verbo: arrastar cabeça, evitar rastro. A única variável
nova é que mais coletas = mais rápido. Fail state imediato (auto-colisão) ensina
imediatamente. Sem inimigos ativos. Ensina: "seu próprio histórico de movimento é um
obstáculo".

**Slot 3: Campo (Battlefield objetivos)**
Primeiro contato com inimigos ativos (recapturadores). Verbo: cobrir círculos com o
corpo. A interface de dominância e multiplier introduz uma dimensão estratégica de "onde
ficar" sem exigir reação rápida. Fail state por HP do squad é lento o suficiente para
o jogador entender o que está errado. Ensina: "presença no lugar certo é mais importante
que eliminar inimigos".

---

#### Tier 2 — Desenvolvimento (Referentes Moderados, Nova Variável por Zona)

**Slot 4: Stealth (Agar.io)**
Verbo: crescer comendo menores, fugir de maiores. A variável nova é o tradeoff
massa×velocidade — ficar grande é vantagem e desvantagem ao mesmo tempo. Leitura visual
de "quem é maior que eu agora" exige atenção contínua a múltiplas bolhas em movimento.
Ensina: "otimizar um atributo cria vulnerabilidade em outro".

**Slot 5: Extração (Boulder Dash)**
Grade discreta de células, movimento por passo. A variável nova é física de gravidade
de pedras — o jogador precisa modelar mentalmente "o que vai cair se eu cavar aqui".
Fail state por pedra é imediato mas antecipável. Ensina: "consequências indiretas do
movimento — sua rota cria o ambiente".

**Slot 6: Infecção (Pac-Man)**
Labirinto fixo, fantasmas com IA de perseguição. A variável nova é o power pellet como
inversão temporária de papel (de presa a predador). Ensina: "o mesmo espaço tem
janelas de segurança — timing importa mais que posição absoluta".

---

#### Tier 3 — Transição (Múltiplas Variáveis Simultâneas, Timing Preciso)

**Slot 7: Sacrifício (Câmaras com custo)**
Primeira zona com decisão estratégica explícita ANTES de entrar em qualquer área (ler
o custo de cada câmara). O seal timer de 8s cria urgência ao entrar. Invasores no hub
criam pressão na zona "segura". Gestão de mochila adiciona recurso limitado. Ensina:
"o tempo de análise tem custo — indecisão é uma decisão".

**Slot 8: Cordilheira (Frogger)**
Timing de múltiplas faixas com velocidades diferentes. A variável nova em relação a
Hordas/Campo é que o movimento é em grid discreto com animação de pulo — não há
desaceleração antes do hazard, o colide ou não colide é binário. Faixas mais altas são
mais rápidas (escalada de velocidade intra-run). Ensina: "ler o ritmo das ameaças antes
de se mover, não durante".

**Slot 9: Torres (Donkey Kong)**
Eixo vertical explícito com câmera que rola. Barris têm física de rolar + cair — duas
dimensões de leitura simultânea. Escadas em posições alternadas exigem memorização de
layout antes de subir. Ensina: "navegação vertical requer planejamento de rota vertical,
não só posição horizontal".

---

#### Tier 4 — Mastery (Alta Carga Cognitiva, Erro Irrecuperável ou Geometria Não-Intuitiva)

**Slot 10: Labirinto (Sokoban)**
Única zona puramente cognitiva — sem inimigos ativos, o fail state é o timeout causado
por puzzle travado. Empurrar uma caixa para um canto torna a solução impossível sem
reset. A carga é planejamento de 3-5 movimentos à frente em grade 9×11. Ensina: "o
custo de um movimento não é imediato — é o que torna impossível um estado futuro".

**Slot 11: Catedral (Q*bert)**
Pirâmide isométrica não-intuitiva (geometria que não mapeia diretamente para cima/baixo
da tela). Cobertura total exige rota eficiente por uma grade triangular crescente (1, 2,
3, 4, 5, 6 degraus por fileira). Sondas com descida aleatória introduzem pressão
imprevisível. O threshold de 70% como vitória parcial mitiga a frustração da cobertura
total. Ensina: "completar um espaço inteiro exige rota planejada, não só reação".

---

### Diagrama de Curva de Intensidade Corrigido

```
Dificuldade
Percebida
   ^
10 |                                                [11] Catedral
 9 |                                     [10] Labirinto
 8 |                          [9] Torres
 7 |              [7] Sacrifício [8] Cordilheira
 6 |   [4] Stealth [5] Extração
 5 |              [6] Infecção
 4 | [2] Circuito [3] Campo
 3 |[1] Hordas
 2 |
 1 |
   +--------------------------------------------------->
     Slot 1   2   3   4   5   6   7   8   9  10  11

Nota: Torres (Slot 9) está intencionalmente abaixo de Labirinto (Slot 10) porque
o fail state de Torres é imediato (recuperável via re-tentativa) enquanto o de
Labirinto pode ser irrecuperável dentro da run (puzzle travado sem undo).
```

---

## Parte 3 — Riscos Reais de Spike Injusto e Monotonia

### Risco 1 — SPIKE INJUSTO: Extração (Boulder Dash) — Pedra Caindo por Câmera Fria

**Arquivo**: `ExtractionScene.ts` — `updateRocks()` / `ROCK_FALL_TIME = 0.22s`

**O problema real**: O jogador não vê onde há pedras atrás de terra compacta. Ao cavar
um corredor, uma pedra oculta a dois quadrados acima pode já estar prestes a cair.
O tempo de queda de 0.22s é rápido o suficiente para que o jogador que acabou de
cavar não tenha tempo de recuar. A grade é proceduralmente gerada (`buildGrid()` com
7% de probabilidade de pedra por célula), portanto a densidade pode gerar configurações
onde múltiplas pedras caem em cascata em poucos frames.

**Impacto para pacing**: primeira run invariavelmente termina por pedra que o jogador
não modelou mentalmente — leitura como "injusto" até o modelo mental de física ser
aprendido. Isso é estruturalmente correto para Boulder Dash, mas se o jogador for
colocado nesta zona muito cedo (Tier 1), o aprendizado ocorre por punição repetida, não
por descoberta controlada.

**Regra de pacing que se segue**: Extração deve estar em Tier 2 (Slot 5), não em Tier 1.
O jogador deve já ter aprendido que suas ações têm consequências indiretas (Stealth:
crescer te deixa lento) antes de enfrentar física de queda oculta.

---

### Risco 2 — SPIKE INJUSTO: Torres (Donkey Kong) — Barril Gerado Sobre Escada

**Arquivo**: `TorresScene.ts` — `tickBarrels()` / `barrelTimer = 2.5 + Math.random() * 1.5`

**O problema real**: barris nascem sempre no centro do andar do topo (`x: VW / 2`) e
rolam em direção aleatória. Se o jogador estiver subindo pela escada central no momento
do spawn (`Math.abs(this.px - ladder.x) < 16`), o barril pode estar sobre a escada
antes de o jogador terminar de subir. O jogador está em `climbing = true`, que o
imuniza da colisão com barris (`!this.climbing` no check), mas ao sair da escada
(`py >= STORY_H - 4` → `climbing = false`) pode imediatamente colidir com um barril
já presente. A janela de invulnerabilidade termina antes do jogador ter pixel de espaço.

**Impacto para pacing**: spike de morte que o jogador lê como "morri na escada", que
tecnicamente não é o que aconteceu. Rompe o contrato de comunicação de fail state.

**Regra de pacing que se segue**: o `barrelTimer` deve ter no mínimo 0.5s adicional
após uma subida de andar detectada (`storyIdx` incrementado). Isso cria uma janela de
segurança pós-escada sem alterar a dificuldade geral.

---

### Risco 3 — SPIKE INJUSTO: Catedral (Q*bert) — Sonda no Topo Toca Jogador Imóvel no Topo

**Arquivo**: `CatedralScene.ts` — `hazards.push({ row: 0, col: 0, t: 0, falling: true })`
e `nextDrop = DROP_INTERVAL + Math.random()` com `DROP_INTERVAL = 3.5`

**O problema real**: sondas nascem SEMPRE em row=0, col=0 — o mesmo degrau onde o
jogador começa. A primeira sonda nasce em `nextDrop = 2` segundos, antes do jogador
ter tido tempo de explorar. Se o jogador permanecer no topo (row=0, col=0) por qualquer
razão (desorientação com a geometria isométrica), a primeira sonda o mata. A geometria
não-intuitiva torna provável que o jogador demore >2s para fazer o primeiro movimento.

**Impacto para pacing**: primeira morte em menos de 2s por spike que não foi telegrafado
visualmente de forma suficiente. O jogador não aprendeu a geometria ainda quando morre.

**Regra de pacing que se segue**: `nextDrop` inicial deve ser 5-6s em vez de 2s, dando
ao jogador tempo para entender a geometria isométrica antes da primeira ameaça. As sondas
subsequentes podem manter o `DROP_INTERVAL = 3.5`.

---

### Risco 4 — MONOTONIA: Hordas e Campo Parecem a Mesma Zona

**Arquivos**: `HordasScene.ts` e `FieldControlScene.ts`

**O problema real**: ambas usam esquadão de personagens que se move arrastando, têm
inimigos com HP bar, e terminam com tela de resultado de recursos. A diferença central
— "coletar biomassa ficando parado" vs. "capturar círculos ficando dentro deles" — é
funcionalmente semelhante ao jogador casual (ficar em cima de algo por X segundos).

A separação visual entre as duas zonas é o principal fator de diferenciação e deve ser
reforçada pelo art-director. A diferença mecânica mais visível que pode ser acentuada
pelo level design é: em Hordas o objetivo se move (nódulos reaparecem aleatoriamente);
em Campo os objetivos são estáticos. O HUD de "dominância ×1.5/×2/×3" em Campo é o
indicador diferencial mais legível disponível — deve ser o elemento mais visualmente
saliente da tela.

---

### Risco 5 — MONOTONIA: Circuito e Infecção São Ambas "Personagem em Grade Coletando Coisas"

**Arquivos**: `CircuitoScene.ts` e `InfeccaoScene.ts`

**O problema real**: ambas têm o personagem se movendo por um espaço 2D coletando
itens (relés vs. pastilhas) com um contador de progresso. A diferença fundamental —
rastro crescente que mata (Circuito) vs. labirinto fixo com fantasmas (Infecção) — é
mecânica mas visualmente pode parecer similar se as artes forem parecidas.

O risco é mitigado pela posição na curva: Circuito está em Slot 2 (onboarding) e
Infecção em Slot 6 (desenvolvimento), com 4 zonas de separação. O jogador encontrará
estas duas zonas em momentos muito distintos da experiência.

---

## Parte 4 — Regras de Pacing que Sobrevivem à Verificação

As seguintes regras do v1.0 são válidas e permanecem, com ajuste de zona:

### Regra 1 — A Primeira Morte Deve Ser Ensinadora (sobrevive, aplicação corrigida)

| Zona | Primeira ameaça ensinadora |
|------|---------------------------|
| Hordas | Primeiros sprouts: lentos, legíveis |
| Circuito | Auto-colisão com rastro curto (< 6 segmentos): baixo risco nos primeiros segundos |
| Campo | Primeiro recapturador em 5s: tempo para o jogador capturar 1 zona antes da primeira ameaça |
| Stealth | Bolhas predadoras visíveis de longe pelo tamanho — o jogador as lê como "perigo" antes de tocar |
| Extração | Primeira pedra perto do spawn não deve estar em posição de cair imediatamente (argumento para ajuste de `buildGrid`) |
| Infecção | Fantasmas começam no centro do labirinto — jogador tem o perímetro livre por ~3s |
| Cordilheira | Faixa 0 (de baixo) é 'safe'; primeira faixa de rua logo acima é visível antes de pular |
| Sacrifício | Câmara 'none' (sem custo) sempre existe — o jogador pode entrar nela primeiro sem consequência |
| Labirinto | Layout do puzzle único atual (LEVELS[0]) tem os receptores visíveis e a primeira caixa acessível sem bloqueio inicial |
| Torres | Primeiros 2.5s sem barril — janela de aprendizado do controle de andar |
| Catedral | **CORRIGIDO**: primeira sonda deve nascer em 5-6s, não 2s |

---

### Regra 2 — Todo Pico de Tensão Deve Ter Alívio Prévio (sobrevive)

Aplicação por zona confirmada em código:

- **Hordas**: o multiplicador de recompensa e o "empurrar a sorte" criam um ciclo
  de tensão (nódulo) → alívio (recuar e matar inimigos) que é jogador-dirigido.
- **Circuito**: rastro curto no início = tensão baixa; sobe naturalmente com coletas.
- **Infecção**: power pellet em posições estratégicas do labirinto MAZE (linhas 3 e 11)
  oferece alívio concreto antes da região central do labirinto.
- **Cordilheira**: faixas 'safe' alternadas com faixas 'road' por design do código
  (`i % 2 === 0 ? 'road' : 'safe'`) — o labirinto estrutural garante alívio entre picos.
- **Torres**: zona de escada é imune a barris (`!this.climbing`) — a escada É o alívio
  garantido antes de cada novo andar.

---

### Regra 3 — O Fail State Deve Ser Resultado de uma Decisão (sobrevive, exceção identificada)

**Violação confirmada em código**: Catedral gera sondas em row=0, col=0 em 2s. O jogador
não decidiu nada — foi morto por timing de spawn. Esta regra é violada neste caso específico.
Correção recomendada: ajustar `nextDrop` inicial para 5-6s (ver Risco 3 acima).

Todas as outras zonas atendem à regra: o fail state pode sempre ser atribuído a uma
decisão identificável do jogador (auto-colisão no Circuito, não fugir de bolha maior no
Stealth, cavar sob pedra na Extração, etc.).

---

## Parte 5 — O que Mudou vs. zone-pacing-plan.md v1.0

### Mudanças Críticas (mecânica completamente errada antes)

| Zona | v1.0 (errado) | v2.0 (verificado) |
|------|--------------|-------------------|
| STEALTH (ZONES[1]) | Cone visual, raio de som, sombras, Sentinela Guardião, Sincronização Cinética, Pulso de Extração | Agar.io: crescer comendo bolhas menores, fugir de maiores, tradeoff massa×velocidade |
| CIRCUITO (ZONES[2]) | Fios coloridos com câmaras, sequência de cores, Sentinelas, timer por câmara | Snake: cabeça segue dedo, rastro cresce e mata ao auto-colidir |
| EXTRAÇÃO (ZONES[3]) | Lane-runner com debuffs LENTO/FAÍSCA/TEIA, scroll horizontal, canisters +T | Boulder Dash: grade de terra, cavar com gesto, pedras caem por gravidade |
| INFECÇÃO (ZONES[5]) | Transportar carga viral entre nós, Healer, Amplificador, sistema de propagação de rede | Pac-Man: labirinto fixo, pastilhas, fantasmas, power pellet |
| LABIRINTO (ZONES[6]) | Timers de parede abrindo/fechando, Impulso ativado por velocidade, Sentinela emergente | Sokoban: empurrar caixas para receptores, sem puxar, puzzle pode ser travado |
| CORDILHEIRA (ZONES[8]) | Selvagens com IA inimiga, estruturas instáveis, narrativa de tensão como mecânica | Frogger: faixas horizontais com hazards deslizando, pular para cima para atravessar |
| TORRES (ZONES[9]) | Drones em enxame, ruído acumulado, stealth vertical, impacto moral no Coral | Donkey Kong: escalar torre com vigas inclinadas e escadas, barris rolando do topo |
| CATEDRAL (ZONES[10]) | Ciclo de sino de 60s, timer de sino como janela de segurança, relíquias com janela de acesso | Q*bert: pirâmide isométrica, pular degraus para acender, sondas descem aleatoriamente |

### Mudanças na Curva de Dificuldade

| Aspecto | v1.0 | v2.0 |
|---------|------|------|
| Extração no slot | Slot 2 (Onboarding) | Slot 5 (Desenvolvimento) |
| Infecção no slot | Slot 5 (Desenvolvimento) | Slot 6 (Desenvolvimento) |
| Labirinto no slot | Slot 6 (Desenvolvimento) | Slot 10 (Mastery) |
| Stealth no slot | Slot 8 (Parede) | Slot 4 (Desenvolvimento) |
| Torres no slot | Slot 10 (Mastery) | Slot 9 (Transição) |
| Catedral no slot | Slot 11 (Mastery) | Slot 11 (Mastery — mantido, mas por razões diferentes) |
| Cordilheira no slot | Slot 9 (Pausa emocional) | Slot 8 (Transição — é Frogger, não narrativa) |

### Regras de Pacing Que Mudaram de Zona

- Risco de spike injusto de Extração: era "LENTO + FAÍSCA em sequência" (inexistente);
  agora é "pedra caindo em câmera fria após cavar".
- Risco de spike injusto de Circuito: era "reset de fio tardio com timer esgotado"
  (inexistente); a zona real (Snake) não tem esse problema estruturalmente.
- Risco de monotonia de Stealth e Torres: era "dois zones de stealth colapsando";
  agora são Agar.io vs. Donkey Kong — risco de monotonia eliminado (mecânicas distintas).

---

*Verificado via leitura direta de:*
- `frontend/src/scenes/runs/HordasScene.ts` (ZONES[0])
- `frontend/src/scenes/runs/StealthScene.ts` (ZONES[1])
- `frontend/src/scenes/runs/CircuitoScene.ts` (ZONES[2])
- `frontend/src/scenes/runs/ExtractionScene.ts` (ZONES[3])
- `frontend/src/scenes/runs/FieldControlScene.ts` (ZONES[4])
- `frontend/src/scenes/runs/InfeccaoScene.ts` (ZONES[5])
- `frontend/src/scenes/runs/LabirintoScene.ts` (ZONES[6])
- `frontend/src/scenes/runs/SacrificeScene.ts` (ZONES[7])
- `frontend/src/scenes/runs/CordilheiraScene.ts` (ZONES[8])
- `frontend/src/scenes/runs/TorresScene.ts` (ZONES[9])
- `frontend/src/scenes/runs/CatedralScene.ts` (ZONES[10])
- `frontend/src/state/Zones.ts` (mapeamento de índice para nome)

*Reporta a: game-designer*
*Coordena com: art-director (diferenciação visual Hordas/Campo), audio-director (sem mudanças de escopo)*
