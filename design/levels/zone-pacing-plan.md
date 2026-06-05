---
tags: [fungineer, level-design, pacing]
date: 2026-06-05
tipo: level-design-doc
---

# Fungineer — Plano de Pacing e Dificuldade entre Zonas

**Version**: 1.0
**Date**: 2026-06-05
**Autor**: Level Design (subagente)
**Status**: Draft — Premissas documentadas, aguarda revisão do game-designer

---

## Premissas de Design Assumidas

1. O jogador tem acesso livre ao mapa-mundo — pode raidar qualquer zona desbloqueada
   em qualquer ordem. A curva de dificuldade recomendada é para o **fluxo de onboarding
   ideal**, não uma progressão forçada (exceto onde o README indica que zonas de
   superfície aparecem "na linha superior do mapa").

2. Três zonas (Cordilheira, Torres, Catedral) são espacialmente superiores no mapa.
   Assumi que isso implica acesso tardio — possivelmente requerendo recursos ou
   foguete em certo nível. Tratei-as como zonas de tier avançado.

3. Cordilheira e Torres têm GDDs em estado de brainstorm (v0.1). Avaliei sua
   carga cognitiva a partir dos conceitos aprovados, não de mecânicas finalizadas.

4. "Carga cognitiva do verbo de movimento" significa: quantas variáveis o jogador
   precisa modelar mentalmente para executar o input básico de mover com segurança.
   Mais variáveis = mais carga = dificuldade de onboarding mais alta.

5. Hordas é definido como zona MVP e o tutorial implícito do jogo. Começa a curva.

---

## Parte 1 — Curva de Dificuldade entre as 11 Zonas

### Metodologia: Carga Cognitiva do Verbo de Movimento

Para cada zona, identifico:

- **O que mover FAZ** (o verbo central)
- **Quais variáveis o jogador precisa rastrear simultaneamente** enquanto se move
- **Se o erro é imediato ou acumulativo** (erro imediato = mais fácil de aprender)
- **Se o jogador tem agência de retirada** (exit voluntário = menor risco percebido)

| # | Zona | Verbo Central | Variáveis Simultâneas | Feedback de Erro | Carga |
|---|------|---------------|----------------------|-----------------|-------|
| 1 | **Hordas** | Posicionar squad com auto-combat | 1: posição vs horda | Imediato (HP) | Baixa |
| 2 | **Extração** | Trocar de lane para desviar | 2: debuff ativo + timing de onda | Imediato (HP/debuff) | Baixa |
| 3 | **Campo** | Circular entre zonas de captura | 3: velocidade de chegada + posição + ameaça de recaptura | Acumulativo (perda de zona) | Baixa-Média |
| 4 | **Sacrifício** | Mover em câmara sob pressão de tempo | 4: custo analisado + contador de pressão + dormentes + mochila | Misto | Média |
| 5 | **Infecção** | Transportar carga viral entre nós | 4: carga ativa + adjacência + Healer + timer | Imediato (carga perdida) | Média |
| 6 | **Labirinto** | Correr para acionar Impulso + timing de parede | 4: timer de parede + velocidade + rota + Sentinela emergente | Misto (HP + atraso) | Média-Alta |
| 7 | **Circuito** | Percorrer fio exato por 1s contínuo | 5: cor de fio + sequência + cruzamento + Sentinela + timer | Imediato (reset parcial) | Média-Alta |
| 8 | **Stealth** | Mover calibrando velocidade e direção | 5: raio de som + cone visual + sombra + Sincronização + rota de fuga | Imediato (alerta) | Alta |
| 9 | **Cordilheira** | Atravessar faixas com timing | 3-4: timing de faixa + Selvagens + estrutura instável | Imediato (queda/dano) | Alta* |
| 10 | **Torres** | Escalar verticalmente evitando drones | 5+: eixo vertical + enxame + ruído acumulado + destino moral (Coral) | Acumulativo + moral | Alta |
| 11 | **Catedral** | Mover em janelas de sino para burlar ARGOS | 4: ciclo de 60s + timer de sino + posição silenciosa + relíquas | Rítmico (timing preciso) | Alta |

*Cordilheira tem poucos inimigos de IA mas narrativa de tensão densa — carga cognitiva-emocional,
não mecânica. Posicionada como "pausa narrativa" entre picos mecânicos.

---

### Ordem Recomendada e Justificativa

```
ONBOARDING          DESENVOLVIMENTO          PAREDE          MASTERY
    |                      |                    |               |
[1] Hordas          [4] Sacrifício        [7] Circuito   [10] Torres
[2] Extração        [5] Infecção          [8] Stealth    [11] Catedral
[3] Campo           [6] Labirinto         [9] Cordilheira
```

#### Tier 1 — Onboarding (Baixa Carga, Feedback Imediato)

**Slot 1: Hordas**
Mover = posicionar. O squad ataca automaticamente. O jogador aprende que mover
é o único input sem ter de gerenciar consequências indiretas. Erro (dano de HP)
é imediato e legível. Squad de 4 personagens dilui o risco — uma morte não é
game over. Teach: "mover = fazer algo acontecer". O personagem é agente visível.

**Slot 2: Extração** (lane runner)
Mover = trocar de lane. Input binário (cima/baixo), sem cursor livre. Introduz
debuffs como complicação do verbo, mas cada debuff tem duração visível e
efeito isolado. Run de 60s com scroll acelerado cria urgência clara. Teach:
"mover tem consequências de timing — agir cedo é melhor que reagir".

**Slot 3: Campo**
Mover = energizar território. Jogador aprende que velocity ao chegar importa
(burst 3×). Primeiro zona onde parar é penalizado mecanicamente (decaimento
0.5×) — reforca o pilar "movimento é tudo" agora com custo explícito de ficar
parado. Teach: "o modo como você chega importa tanto quanto onde você chega".

---

#### Tier 2 — Desenvolvimento (Carga Média, Verbo com Camadas)

**Slot 4: Sacrifício**
Introduz decisão estratégica explícita ANTES de mover (leitura de painéis no
hub central) e depois execução urgente quando dentro das câmaras. Divide a
sessão em duas fases cognitivas distintas — análise fria + execução quente.
Teach: "o movimento começa antes de se mover — a leitura do espaço é parte
do jogo". Primeiro zona onde parar causa escalada de ameaça progressiva
(contador de pressão de 30s).

**Slot 5: Infecção**
Verbo = transportar carga viral em corpo. Jogador aprende restrição de
adjacência — não é só "chegar a um nó", é "chegar ao nó correto na sequência
correta". A carga viral como estado corporal (anel brilhante) externaliza
uma variável interna do verbo de mover. Teach: "mover carrega estado — você
transforma o ambiente sendo um vetor, não um atacante".

**Slot 6: Labirinto**
Introduz timing como dimensão do verbo: mover rápido para acionar Impulso,
mas mover rápido demais pode prender em parede fechando. Primeiro zona onde
a velocidade tem dois efeitos opostos dependendo do contexto. Sentinelas
emergentes adicionam variabilidade sem ser o foco central. Teach: "a
intensidade do mover tem consequências opostas dependendo do momento —
leitura de estado supera reflexo".

---

#### Tier 3 — Parede (Alta Carga, Múltiplas Variáveis Simultâneas)

**Slot 7: Circuito**
A parede de complexidade de sequenciamento. Jogador precisa: (a) identificar
a cor do fio, (b) lembrar a sequência, (c) manter movimento contínuo por 1s
sem sair do fio, (d) gerenciar cruzamentos, (e) evitar Sentinelas. São 5
variáveis ativas simultaneamente com feedback de reset parcial que pode
frustar antes de "clicar". Esta é a zona onde jogadores que não gostam de
puzzle vão parar. Design mitiga com câmara 1 como tutorial orgânico.

**Slot 8: Stealth**
A parede de autonomia. Ao contrário do Circuito (sequência linear), o
Stealth tem espaço aberto sem sequência fixa — o jogador constrói a
solução. Velocidade controla raio de som (escalar contínua, não binária),
e a Sincronização Cinética exige modelagem do estado do inimigo em tempo
real. A combinação "posso parar aqui?" requer 4 avaliações simultâneas.
Alta recompensa de "inteligência cinética" para quem domina.

**Slot 9: Cordilheira**
Posicionada aqui não por carga mecânica máxima, mas como contraponto
emocional após dois picos de tensão. Sem IA inimiga — primeira zona onde
o perigo é ambiental e humano (Selvagens). Serve como pausa narrativa
densa: o jogador descobre que nem toda morte foi causada por CORE. Carga
cognitiva reduzida, carga emocional elevada. Previne fadiga de dificuldade
crescente antes das duas últimas zonas.

---

#### Tier 4 — Mastery (Alta Carga, Pressão Integrada)

**Slot 10: Torres**
Eixo vertical + drones em enxame + sistema de ruído acumulado + consequência
moral (Coral). Primeira zona onde uma ação do jogador causa efeito permanente
no estado do mundo (re-otimização do Coral). O stealth vertical é mais
complexo que o horizontal (Stealth) por combinar ambos os eixos e adicionar
pressão moral que não existe em nenhuma outra zona. Teach: "mover tem peso
fora da zona".

**Slot 11: Catedral**
Desfecho mecânico e narrativo. Timing rítmico com ciclo de 60s de sino cria
um meta-ritmo que o jogador deve internalizar — em vez de reagir a ameaças,
o jogador usa o sistema CORE como aliado. Pico de inversão narrativa: a
zona mais perigosa é a que você joga junto com a infraestrutura do vilão.
A Padre e as pistas para o Final C consolidam o arco emocional.

---

### Diagrama da Curva de Intensidade entre Zonas

```
Intensidade
de Dificuldade
(percebida)
   ^
10 |                                                        [11]Torres
 9 |                                           [10]Stealth  [12]Catedral*
 8 |                                  [8]Stealth
 7 |                        [7]Circuito            [9]Cordilheira*
 6 |             [6]Labirinto
 5 |    [4]Sacrifício [5]Infecção
 4 |  [3]Campo
 3 |[2]Extração
 2 |[1]Hordas
 1 |
   +-------------------------------------------------------->
     Zona 1     2     3     4     5     6     7     8     9   Tempo

*Cordilheira: carga emocional alta, carga mecânica moderada — desaceleração intencional
```

---

## Parte 2 — Plano de Pacing Intra-Zona: Stealth (Zona Representativa)

**Por que Stealth como zona representativa:**
É a zona com maior complexidade de verbo finalizada (GDD v2.0 completo),
está no centro da curva (Slot 8), e concentra os três problemas clássicos
de pacing em só-movimento: tensão de detecção, alívio por evasão, e pico
de extração. Resolve bem como modelo.

---

### Estrutura Temporal de uma Run (60–120s)

```
TEMPO     0s          15s         35s         60s         90s         120s
          |___________|___________|___________|___________|___________|
FASE      [ENTRADA]   [PRIMEIRA   [ZONA       [PICO:      [RETIRADA]  [EXIT]
                       COLETA]     QUENTE]     EXTRAÇÃO]
```

---

### Fase 1 — ENTRADA (0–15s): Orientação e Calibração

**Objetivo do jogador**: entender o layout do mapa, localizar primeiro
componente, identificar patrulhas e câmeras.

**O que o nível deve fazer:**

- Câmera inicial ABERTA: visão de largo trecho do mapa (não apenas ao redor do spawn)
- Pelo menos 1 drone visível na rota óbvia logo no início — ensina cone de visão
  sem detectar o jogador se ele parar
- Primeira zona de sombra acessível em <5s de movimento lento
- Primeiro componente a 30–40s de movimento seguro do spawn

**Parâmetros de pacing:**
- Nenhum drone em perseguição nesta fase
- Raio de som visível e responsivo desde o primeiro segundo
- Densidade de drones: 1–2 na área de entrada

**Curva de tensão**: Gradual. Começa em 2/10, sobe para 4/10 ao ver o
primeiro cone.

**Alívio natural**: chegar à primeira sombra depois do primeiro cone
evadido. O jogador aprende que sombra = respiração.

**Anti-padrão a evitar**: spawn com drone imediatamente no cone do jogador.
O primeiro segundo deve ser sempre seguro — a agressividade deve ser
descoberta, não imposta.

---

### Fase 2 — PRIMEIRA COLETA (15–35s): Loop Central

**Objetivo do jogador**: coletar 1–2 componentes, aprender o ciclo
investigar-evitar-coletar.

**O que o nível deve fazer:**

- Layout força pelo menos 1 decisão de distração (barulho para desviar drone)
  antes de chegar ao segundo componente
- Segundo componente mais distante da sombra mais próxima do que o primeiro
  (escalada de risco)
- Câmera de segurança protegendo um dos componentes — introduz segundo tipo
  de ameaça

**Parâmetros de pacing:**
- 1 drone em patrulha perto de cada componente
- Câmera com ciclo de 6–8s (previsível, aprendível em 1 observação)
- Coleta de 1.5s: janela de vulnerabilidade máxima, zero movimento possível

**Mecânica de ritmo:**
O ciclo de parar-para-coletar (1.5s parado = raio de som mínimo mas máxima
vulnerabilidade a cones) cria um padrão de tensão binária:

```
[mover rápido] → tensão SONORA alta, tensão VISUAL baixa
[parar para coletar] → tensão SONORA baixa, tensão VISUAL alta
```

Este é o coração rítmico da zona. O jogador aprende a alternar entre os dois
tipos de tensão, não a eliminar a tensão.

**Alívio natural**: completar a coleta do primeiro componente. O anel de
mochila aparece — feedback visual de progresso que ancora o jogador
emocionalmente.

**Anti-padrão a evitar**: drone investigando durante coleta. O Pulso de
Extração (Regra 3.11) já pune o jogador depois de coletar — punir durante
cria dois spikes simultâneos que não são legíveis.

---

### Fase 3 — ZONA QUENTE (35–60s): Escalada e Complicação

**Objetivo do jogador**: coletar componentes adicionais na zona sem sombras
ao redor dos terminais (Regra 3.9), gerenciando Sentinela Guardião.

**O que o nível deve fazer:**

- Entrada na zona quente marcada visualmente (ausência de sombra percebida)
- Sentinela Guardião visível antes de entrar na zona quente (Regra 3.10)
- Pelo menos 1 drone em patrulha dentro da zona quente cuja rota permite
  Sincronização Cinética como bypass do Guardião

**Parâmetros de pacing:**
- Zona quente: raio de 150px sem sombra ao redor de cada terminal (fixo)
- Guardião: cone 240px, ângulo 22° fixo — ângulo morto lateral é a saída
- Drones na zona quente: 2 (um possível para Sincronização, um que força distração)

**O momento de oportunidade:**
A Sincronização Cinética é o pico de habilidade desta fase. Quando ativada
(contorno colorido no sprite), a tensão cai momentaneamente — o jogador
sente controle. Dura enquanto mantiver velocidade/direção do drone.
Esta é a mecânica que transforma um jogador casual em um jogador avançado.
O nível deve garantir que pelo menos 1 drone na zona quente tenha velocidade
e rota compatíveis com Sincronização.

**Curva de tensão**: Pico em 7–8/10. O jogador está sem sombra, perto
do Guardião, com raio de som ativo.

**Alívio natural**: completar o hack e iniciar a saída da zona quente ANTES
do Pulso de Extração atingir drones próximos.

---

### Fase 4 — PICO: EXTRAÇÃO (60–80s): Momento Mais Tenso

**Objetivo do jogador**: concluir hack do terminal, fugir do Pulso de
Extração, começar rota ao EXIT.

**O que o nível deve fazer:**

- Pulso de Extração (150px) ativa TODOS os drones na zona quente em modo
  INVESTIGATE — cria janela de 4s onde a área está transitoriamente
  ocupada por drones investigando
- EXIT posicionado FORA da zona quente (garantido pelo design do mapa)
- Rota ao EXIT passa por pelo menos 1 zona de sombra (alívio garantido
  antes do exit)

**O spike controlado:**
O Pulso de Extração é o único momento do jogo onde a ameaça aumenta
instantaneamente sem input do jogador (o jogador pode antecipar, mas não
cancelar). Isso o torna o pico de tensão mais honesto — é telegrafado
(o anel laranja), tem duração conhecida (drones investigam por 4s), e
a saída é sempre possível se o jogador planejou a rota antes do hack.

**A decisão crítica antes do pico:**
Antes de iniciar o hack, o jogador deve DECIDIR sua rota de fuga.
Este é o momento de maior maestria: a tensão do Pulso de Extração é
proporcional ao quanto o jogador planejou (ou não planejou) a retirada.

**Curva de tensão**: Pico absoluto em 9/10 (hack completado + Pulso ativo).
Cai para 5/10 ao quebrar linha de visão dos investigadores.

**Anti-padrão a evitar**: EXIT bloqueado por drone em perseguição sem
rota de escape visível. O jogo COMunica que EXIT com perseguição ativa
bloqueia a saída (Regra edge cases) — mas a frustração máxima ocorre
quando o jogador não tem caminho para perder a perseguição. O mapa deve
sempre ter uma rota de quebra de visão antes do EXIT.

---

### Fase 5 — RETIRADA (80–120s): Descida de Tensão + Exit

**Objetivo do jogador**: chegar ao EXIT sem perseguição ativa.

**O que o nível deve fazer:**

- Ao menos 1 zona de sombra na rota de retirada (alívio garantido)
- EXIT: sem zona quente, sem Guardião
- Drones em patrulha normal (não em investigação): estado padrão recuperado

**Curva de tensão**: Desce de 5/10 para 2/10 ao chegar à sombra final.
Chegar ao EXIT é 1/10 — a tensão deve estar resolvida antes do exit,
não no exit. O exit é a confirmação do sucesso, não o obstáculo final.

**A recompensa final:**
O jogador chega ao EXIT com componentes coletados. A tela de resultado
mostra o que foi extraído. Emocionalmente, a descida de tensão da Fase 5
para o exit transforma o sucesso em alívio genuíno — não celebração, mas
"sobrevivência confirmada". Coerente com o tom "esperança desesperada".

---

### Diagrama de Tensão Intra-Zona: Stealth

```
Tensão
(1-10)
  ^
10|                         [Pulso de Extração]
 9|                              *PICO*
 8|                   [Zona Quente]
 7|                   sem sombra  |       
 6|         [Distração  (Guardião)|              [Rota de Fuga]
 5|          + Coleta 2]          |              ativo
 4| [Cone evadido]               |                    [Sombra Final]
 3| [Orientação]                 |                          [EXIT]
 2|*SPAWN*                       |                              *SAÍDA*
 1|
  +--------+--------+-----------+------------+----------+-------->
  0s      15s      35s         60s          80s        100s  120s
  ENTRADA  1aCOLETA ZONA QUENTE  EXTRAÇÃO  RETIRADA   EXIT
```

---

### Regra de Composição de Mapas do Stealth

Todo mapa do Stealth deve satisfazer estas condições de pacing:

1. Componente 1: acessível com apenas 1 drone a evitar (aprendizado)
2. Componente 2+: exigem decisão de distração OU Sincronização
3. Pelo menos 1 drone com velocidade e rota compatíveis com Sincronização
4. Zona quente: sem sombra, com Guardião, com drone Sincronizável no ângulo morto
5. Rota EXIT: sempre tem zona de sombra antes do exit
6. Timer de confirmação: run de 60-120s (qualquer mapa fora desse range é ajustado)

---

## Parte 3 — Regras de Pacing Reutilizáveis (Todas as Zonas)

Estas regras derivam da análise das 11 zonas e devem ser testadas em qualquer
zona nova ou revisada.

---

### Regra 1 — A Primeira Morte Deve Ser Ensinadora, Não Punitiva

**Princípio**: O primeiro erro que mata (ou falha a run) em qualquer zona
deve ser causado por uma ameaça que o jogador viu e não interpretou — não
por uma ameaça que estava oculta ou que surgiu sem antecedência.

**Como verificar:**
Faça um playtest de primeira vez. Se o jogador disser "não vi isso" na
primeira morte, o nível falhou. Se disser "eu sabia que era arriscado mas
fui mesmo assim", o nível ensinou.

**Implementação por zona:**

- Hordas: primeira onda com apenas Runners (frágeis, legíveis)
- Extração: scroll lento nos primeiros 20s, obstáculos em lane única
- Sacrifício: câmara sem custo visível e acessível primeiro
- Stealth: primeiro drone visível a ≥200px do spawn, cone óbvio
- Circuito: câmara 1 com 2 fios, 0 Sentinelas — ensina o sistema
- Labirinto: primeira parede com duracao_aberta_max (8s) — janela generosa

**Anti-padrão**: spawn de inimigo elite na primeira onda (Hordas), obstáculo
TEIA nos primeiros 10s (Extração), câmara de Cadeia como primeira opção
visível (Sacrifício).

---

### Regra 2 — Todo Pico de Tensão Deve Ter Alívio Garantido Antes

**Princípio**: Antes de qualquer momento de intensidade máxima, o jogador
deve ter tido um momento de alívio real (tensão < 4/10) nos 15-20s anteriores.
Picos sem alívio prévio são percebidos como injustos, não desafiadores.

**Estrutura mandatória:**

```
[Alívio: tensão < 4] → [Escalada: 15-30s] → [Pico] → [Saída] → [Alívio]
```

**Como verificar:**
Desenhe a curva de tensão da run. Se houver dois picos consecutivos sem
intervalo de tensão < 4 entre eles, redesenhe o layout ou ajuste os timers.

**Exemplos corretos:**
- Extração: obstáculo isolado (pico 6/10) → lane livre por 2-3s (alívio) → próximo
- Labirinto: câmara com parede rápida (pico 7) → câmara aberta com Fragmento (alívio)
- Campo: Recapturador na zona central (pico 8) → zona pequena safe para reburst (alívio)
- Stealth: zona quente (pico 8) → sombra na rota de retirada (alívio garantido)

**Casos especiais:**
Catedral é a exceção parcial: a janela de sino (8s a cada 60s) É o alívio
garantido. O pacing da Catedral é cadenciado pela mecânica — o design do
mapa deve garantir que toda posição de perigo tenha uma rota de 8s ou menos
até a próxima janela de sino.

---

### Regra 3 — O Fail State Deve Ser o Resultado de uma Decisão, Não de um Acidente

**Princípio**: O jogador deve poder apontar a decisão específica que causou
a falha. Fail states por "não tive como saber" destroem a motivação roguelike.
A volta ao hub deve sentir como "eu aprendi algo", não "isso foi injusto".

**Como verificar:**
Após cada fail state em playtest, pergunta: "O que você faria diferente
numa próxima run?" Se a resposta for "nada — não tive como saber", o nível
tem spike injusto. Se for "eu teria feito X diferente", o pacing está correto.

**Implementação:**
Toda ameaça nova deve ter telegraph de ≥0.8s antes do dano:

| Zona | Spike Potencial | Telegraph Obrigatório |
|------|----------------|----------------------|
| Hordas | Boss Sentinel Core | Aparece em 90s fixo (previsível) |
| Extração | Obstáculo TEIA | Cor vermelha visível vindo da direita |
| Campo | Recapturador | Spawn em ponto fixo visível desde o início |
| Sacrifício | Câmara de Cadeia | Painel informativo lido antes da entrada |
| Labirinto | Parede fechando com jogador dentro | Aviso visual 3s + som |
| Circuito | Sentinela no fio | Rota de patrulha fixa (aprendível) |
| Stealth | Barra de alerta cheia | Barra visível crescendo (player controla) |
| Infecção | Healer bloqueando nó | Healer visível se movendo para o nó |

**Anti-padrão sistêmico a evitar:** stacking de debuffs não telegrafados.
Em Extração, EMP + TEIA em sequência imediata (sem lane livre entre eles)
cria fail state inevitável — o jogador não tem input possível. O gerador
de waves deve garantir que ondas com 2+ debuffs severos tenham 2-3s de
buffer entre elas.

---

## Parte 4 — Análise de Riscos: Monotonia e Spikes Injustos

---

### Risco 1 — MONOTONIA: Zonas de Squad se Homogeneizam

**Zonas afetadas**: Hordas, Campo, Sacrifício (todas usam squad de 4,
combate automático, inimigos compartilhados do roster).

**Por quê**: O jogador não vê diferença entre Hordas e Campo se o feedback
visual for similar. Ambas têm Runners e Bruisers. A identidade de Campo
(captura de zona) é mais abstrata que a de Hordas (matar horda).

**Sinal de alerta**: playtesters descrevem Campo como "Hordas com círculos".

**Prevenção:**

1. Campo deve ter UI de território DOMINANTE — a barra de captura deve ser
   o elemento mais legível na tela, não um detalhe periférico.
2. Recapturadores (tipo exclusivo de Campo) devem ter silhueta e cor
   distintas dos Runners/Bruisers — sugerir ao art-director paleta
   diferente (violeta ou dourado) para identificação imediata.
3. O mapa de Campo deve ter geometria territorial legível (zonas claramente
   demarcadas, não arena aberta como Hordas).
4. Sacrifício se diferencia de Campo pela fase de análise — garantir que
   o tempo de análise (parar no hub central lendo painéis) seja 10-15s
   mínimos antes de qualquer entrada possível. A câmera deve mostrar os
   painéis primeiro, não a ação.

---

### Risco 2 — SPIKE INJUSTO: Extração no Trecho Final (45-60s)

**Zona afetada**: Extração (lane runner).

**Por quê**: O scroll chega a 380px/s nos últimos 15s. Combinado com
spawn_interval de 0.85s, o jogador recebe waves a cada ~0.85s com obstáculos
se movendo a 380px/s. O tempo de reação humano para identificar cor de
obstáculo + mudar lane é ~0.3s — com 0.45s de transição no debuff LENTO
ativo, o jogador pode estar matematicamente impossibilitado de escapar.

**Cálculo do problema:**

```
Wave final: 0.85s entre waves
Obstáculo a 380px/s com spawn em X=480: chega ao player em X=100 em ~1s
Debuff LENTO ativo: transição de 0.45s

Se onda com LENTO + próxima onda com FAÍSCA chegam em sequência:
  Jogador gasta 0.45s na transição (LENTO)
  Próxima onda já passou 50% da tela antes da transição terminar
  → Nenhuma ação defensiva é possível se as lanes intermediárias também têm obstáculo
```

**Solução recomendada:**
Implementar regra de exclusão no gerador de waves: LENTO não pode ser
seguido por FAÍSCA ou TEIA em menos de 1.5s de intervalo. O gerador
deve verificar o debuff ativo do jogador antes de criar a próxima wave.

Adicionalmente: o spawn de canisters +T no final da run (padrão atual:
65% das waves) é a válvula de alívio intencional — mas se o jogador
está em LENTO quando um canister passa, não consegue coletar. Canisters
+T em runs avançadas devem ter prioridade de spawnar na lane ATUAL do
jogador (ou em lanes livres de debuff).

---

### Risco 3 — SPIKE INJUSTO: Circuito na Câmara 3 com Timer Esvaziado por Resets

**Zona afetada**: Circuito Quebrado (Câmara 3).

**Por quê**: O reset parcial por "erro de fio tardio" pode voltar 3 fios
atrás. Na câmara 3 com 4 fios, um erro no fio 4 volta ao fio 1. São
~24s de progresso perdidos (fios 1+2+3 a 1s/segmento × ~5 segmentos +
deslocamento). Com timer de 90s total e câmaras 1-2 consumindo ~24s
ideais, o jogador tem ~66s para câmara 3. Um único erro tardio consome
24s → deixa apenas 42s para refazer câmara 3 inteira. Um segundo erro
tardio na refação: fail state por timer.

**O problema não é a punição — é que o timer não foi projetado com a
pior combinação de resets em mente.**

**Solução recomendada (não altera a mecânica, só o timer):**
Aumentar o timer base de 90s para 105s, ou introduzir um +15s ao
completar câmara 1 e +15s ao completar câmara 2 (timer por milestone,
não timer global). Isso mantém a pressão de tempo na câmara 3 sem
tornar 2 resets tardios em fail state matematicamente determinístico.

**Alternativa**: tornar o reset por "fio tardio" voltar 2 fios em vez
de 3 na câmara 3 especificamente (dificuldade escalada pela densidade,
não pelo multiplicador de punição).

---

### Risco 4 — MONOTONIA: Stealth e Torres Colapsam em Mesma Fantasia

**Zonas afetadas**: Stealth (Slot 8) e Torres (Slot 10).

**Por quê**: Ambas são zones de stealth. Stealth é top-down horizontal,
Torres é vertical com eixo Y principal. Se Torres for "Stealth mas mais
alto", o jogador não experimenta zona nova — experimenta dificuldade
maior da mesma zona. O diferencial mecânico (eixo vertical, consequência
moral do Coral) precisa ser IMEDIATAMENTE visível.

**Prevenção:**

1. Torres deve ter perspectiva visivelmente diferente do Stealth (câmera
   isométrica ou side-scroller lateral, não top-down). O eixo vertical
   deve mudar como o jogador lê o espaço.
2. O sistema de ruído acumulado (Torres) deve ter medidor próprio visível
   — diferente do raio de som do Stealth (que é dinâmico por velocidade).
   Ruído acumulado como barra persistente cria risco permanente, não
   situacional.
3. A janela do Coral deve estar visível pelo menos uma vez em cada run
   antes do Cristal de Memória — o jogador deve VER o que está arriscando
   antes de fazer barulho.
4. Coordenar com art-director: Stealth tem estética urbana noturna;
   Torres deve ter estética de cobertura diurna, polida, com vistas abertas.
   Contraste visual reforça contraste mecânico.

---

### Risco 5 — SPIKE INJUSTO: Infecção com Healers Simultâneos no Trecho 80-120s

**Zona afetada**: Infecção.

**Por quê**: No trecho final (80-120s), 3-4 Healers ativos com 18+ nós
infectados. Se 2 Healers se posicionam em nós Amplificadores adjacentes,
o jogador precisa reinfectar ambos dentro de ~1s cada (Amplificador cura
em 1.0s). O ciclo de carga viral é 1 por vez — é fisicamente impossível
reinfectar dois Amplificadores simultaneamente.

**O problema é real mas pode ser benigno se calibrado**: o design intencional
prevê pressão impossível no final — o jogador aceita perder Amplificadores
e migra para Âncoras como estratégia. Mas se TODOS os Amplificadores forem
curados antes do timer (cenário possível com 4 Healers rápidos), o jogador
perde a decisão estratégica central.

**Solução recomendada:**
Healers devem ter distribuição geográfica mínima: nenhum gerador de Healer
pode spawnar 2 Healers no mesmo quadrante do mapa 5×5 simultaneamente.
Isso garante que o jogador sempre tem um Amplificador defensável em alguma
região do mapa, mesmo no pior cenário.

---

## Resumo de Regras de Pacing por Zona

| Zona | Regra de Pacing Principal | Anti-Padrão Monitorado |
|------|--------------------------|----------------------|
| Hordas | Primeira onda: só Runners | Elite na wave 1 |
| Extração | LENTO não seguido de FAÍSCA < 1.5s | Stacking de debuffs |
| Campo | Recapturadores com silhueta única | Campo = "Hordas com círculos" |
| Sacrifício | Câmara sem custo sempre visível e acessível | Cadeia como primeira opção |
| Infecção | Healers distribuídos geograficamente | 2 Healers no mesmo Amplificador |
| Labirinto | Primeira parede com janela máxima (8s) | Sentinela no único corredor de saída |
| Circuito | Timer 105s ou milestones (+15s por câmara) | 2 resets tardios = fail determinístico |
| Stealth | Sombra garantida na rota de retirada | EXIT sem rota de quebra de visão |
| Cordilheira | Selvagens visíveis antes de agir | Parede estrutural colapsando sem aviso |
| Torres | Coral visível antes do ruído crítico | Eixo vertical colapsando em stealth top-down |
| Catedral | Todo perigo tem rota de 8s até próximo sino | Relíquia necessária só acessível fora da janela |

---

*Relacionado: `design/gdd/game-concept.md`, `design/gdd/zone-stealth.md`,
`design/gdd/zone-circuit.md`, `design/gdd/zone-extraction-run.md`,
`design/gdd/zone-infection.md`, `design/gdd/zone-maze.md`,
`design/gdd/zone-field-control.md`, `design/gdd/zone-sacrifice.md`,
`design/gdd/zone-torres.md`, `design/gdd/zone-catedral.md`,
`design/gdd/zone-cordilheira.md`*

*Reporta a: game-designer*
*Coordena com: narrative-director (Cordilheira, Torres, Catedral — lore pesado),
art-director (silhuetas de Recapturador, perspectiva de Torres),
audio-director (janela de sino da Catedral como ancora rítmica de pacing)*
