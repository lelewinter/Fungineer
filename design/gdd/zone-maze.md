# Labirinto Dinâmico — Game Design Document

**Version**: 2.0
**Date**: 2026-03-23
**Status**: Revisado — Impulso de Abertura

---

## 1. Overview

O Labirinto Dinâmico é uma zona de navegação sob pressão estrutural. O mapa é um labirinto com paredes que abrem e fecham em ciclos temporizados e visíveis. O objetivo é chegar ao EXIT coletando o máximo de Fragmentos Estruturais ao longo do caminho. A complexidade não está nos inimigos — está no próprio mapa. Paredes fecham e abrem em ritmos diferentes; o jogador vê o countdown de cada parede e deve decidir: passar agora ou esperar a próxima abertura. Ficar preso em uma seção fechando causa dano. Múltiplos caminhos existem até o EXIT, mas o mais rápido nunca é o mais seguro.

Os **Fragmentos Estruturais** são usados no foguete como o material de reforço do casco externo — as vigas de titânio recuperado e as placas de blindagem que tornam o foguete resistente às tensões do lançamento e da atmosfera superior. São, literalmente, o que mantém o foguete inteiro.

---

## 1b. Contexto Narrativo

**O que é FLOW**: O Facility Logistics and Operations Workflow foi o sistema "invisível" do
Projeto Olímpio — ninguém notava quando funcionava, apenas quando falhava. FLOW gerenciava
os centros logísticos da cidade: armazéns, rotas de distribuição, movimentação de materiais
entre instalações. As "paredes" dos centros de distribuição de FLOW abriam e fechavam
conforme o volume de tráfego exigia — otimizando o fluxo de carga em tempo real.

**O que o jogador está raideando**: O Labirinto é um centro de distribuição de FLOW. As paredes
dinâmicas não foram "criadas" como armadilha — são os portões automatizados de controle de
fluxo, executando os algoritmos de roteamento exatamente como foram programados. O único
problema é que não há mais carga para rotear, então os algoritmos ficam em ciclo vazio,
abrindo e fechando em padrões que faziam sentido para caminhões autônomos e não fazem mais.

**Os Sentinelas Errantes**: Eram robôs de inventário — unidades que verificavam a localização
e o estado de materiais nos armazéns. Sem inventário para gerenciar, eles patrulham
aleatoriamente. Quando detectam movimento, seus protocolos de "verificação de item não
categorizado" os direcionam em direção ao alvo.

**Fragmentos de lore encontráveis**: Etiquetas de carga ainda coladas nas paredes e no chão,
com endereços de entregas que nunca chegaram. Fotos de família que operadores humanos deixaram
coladas em terminais de controle. Uma lista de pedidos de moradores de um prédio residencial
que parou de receber entregas 18 meses atrás. Os endereços existem. As pessoas provavelmente não.

**Recurso narrativo dos Fragmentos Estruturais**: Os materiais de construção que o jogador
coleta são componentes que ficaram armazenados nos centros logísticos de FLOW quando a Transição
aconteceu — vigas de titânio, placas de blindagem, materiais de engenharia que nunca chegaram
ao destino final. O casco externo do foguete é literalmente construído com os materiais que
uma cidade deixou para trás. O foguete não é novo — é a cidade, reconfigurada para sair.

---

## 2. Player Fantasy

O labirinto responde ao seu movimento. Você corre em direção à parede — e ela abre mais cedo para você. Você fica parado esperando — e ela recusa, fecha mais devagar. O sistema de FLOW foi projetado para otimizar o fluxo de carga em movimento. Parado, você não é carga — é obstáculo. Há um Fragmento na alcova à esquerda. Você entra correndo — a porta da alcova abre no momento que você chega. Você coleta e sai acelerando, a porta se fecha atrás de você no milímetro certo. Um inimigo emerge da passagem recém-aberta. Você não espera — você contorna em movimento. O labirinto é um sistema que recompensa quem nunca para. Na terceira run, você corre como se o chão estivesse se movendo junto com você.

**Estética MDA primária**: Challenge (leitura de timing em movimento, planejamento de rota antecipado).
**Estética secundária**: Discovery (descobrir que mover-se é mais eficiente que esperar, memorizar os ritmos das paredes).

---

## 3. Detailed Rules

### 3.1 Estrutura da Run

- O jogador entra **sozinho** (squad fica na base — modo solo como Stealth e Infecção)
- O mapa é fixo na sua estrutura de câmaras e conexões, mas os **timings das paredes são parcialmente procedurais** (não idênticos a cada run)
- O mapa tem uma entrada (ENTRADA) e uma saída (EXIT) fixas em posições opostas
- Fragmentos Estruturais estão espalhados ao longo do labirinto — na rota principal e em alcovas laterais
- A run encerra quando o jogador chega ao EXIT (não há timer fixo — o pacing é determinado pelo movimento do jogador através do labirinto)
- Morrer = fail state, perde todos os Fragmentos coletados na run

**Duração estimada por run**: 60–120 segundos dependendo da rota escolhida e dos detours por alcovas.

### 3.2 Interpretação do Movimento (como arrastar funciona aqui)

- **Input**: arrastar o dedo = mover o personagem
- **Significado aqui**: mover é o que abre o caminho. As paredes de FLOW foram projetadas para responder a presença cinética — carga em movimento. O algoritmo do sistema detecta velocidade de aproximação e antecipa a abertura. Ficar parado é invisível para o sistema
- **Mover é mais eficiente que esperar**: aproximar-se de uma parede em movimento faz ela abrir mais cedo. Ficar estático esperando faz ela abrir no tempo padrão (ou até mais devagar)
- **Parar tem custo**: parar por mais de 3s em frente a uma parede fechada faz o algoritmo "rejeitar" a presença — a abertura atrasa em 2s adicionais
- **Salas seguras**: salas sem saídas abertas ainda existem como ponto de respiração, mas entrar e sair delas em movimento é mais eficiente que ficar parado dentro

### 3.3 Mecânica Central — Paredes Cinéticas

#### Estados das Paredes

Cada segmento de parede tem um estado cíclico com duração base configurável, **modificável pela proximidade do jogador em movimento**:

| Estado | Visual | Duração Base | Efeito |
|--------|--------|---------|--------|
| **Aberta** | Sem parede, passagem livre | Variável (3–8s) | Passagem permitida |
| **Fechando** | Parede aparecendo + contador piscando (vermelho) | 3s de aviso | Passagem ainda permitida; movimento em direção à parede cancela o fechamento por 1s |
| **Fechada** | Parede sólida | Variável (5–12s) | Passagem bloqueada; modificável por Impulso |
| **Abrindo** | Parede sumindo + contador (verde) | 2s de aviso (base) → 0.5s (com Impulso) | Passagem disponível |

**O ciclo completo de uma parede (sem Impulso):**
```
Fechada → [2s Abrindo] → Aberta → [3s Fechando (aviso)] → Fechada → ...
```

#### Mecânica de Impulso de Abertura (Nova)

As paredes de FLOW respondem à **velocidade de aproximação** do jogador:

**Limiar de Impulso**: quando o jogador está a menos de 100px de uma parede fechada e movendo-se **em direção a ela** a pelo menos 80% da velocidade máxima por 0.5s contínuos:

- A parede entra em estado **Abrindo Antecipado** — abre 1.5s mais cedo que o timer normal indicaria
- A animação de abertura é visualmente acelerada (faíscas elétricas — o sistema reagindo ao impacto cinético)
- O contador da parede reflete a antecipação (pula para o timer de abertura imediata)

**Penalidade de Estagnação**: quando o jogador está a menos de 150px de uma parede fechada e **parado ou movendo-se a menos de 30% da velocidade** por mais de 3s:

- O contador da parede regride em 2s (a abertura atrasa)
- Feedback visual: a parede pulsa levemente (o sistema "empurrando" o obstáculo estático)
- Máximo de 1 penalidade de estagnação por tentativa de passagem

**Sem Impulso Negativo no Fechamento**: a mecânica de Impulso só afeta o estado Fechada → Abrindo. O fechamento (Aberta → Fechando → Fechada) segue sempre o timer normal — para o jogador poder confiar no aviso de fechamento.

#### Visibilidade dos Timers

- Cada parede tem um **contador visual** em cima dela: um arco decrescente que indica quando muda de estado
- Estado Aberta: contador mostra tempo até começar a fechar
- Estado Fechada: contador mostra tempo restante até abrir (inclui antecipação por Impulso em tempo real)
- Estado Fechando (aviso): contador vermelho piscante (3s)
- Estado Abrindo (aviso): contador verde (2s base; pode ser encurtado por Impulso)
- **Indicador de Impulso ativo**: quando o Impulso está sendo aplicado, a parede pulsa em ciano — feedback claro de que a aproximação está acelerando a abertura

#### Ficar Preso em Parede Fechando

- Se o personagem está no espaço de uma parede quando ela fecha:
  - **Aviso (3s)**: a parede pisca vermelho, som de alerta começa
  - **Escape por movimento**: se o jogador se mover rapidamente para fora do espaço da parede durante o aviso, sem dano
  - **1s antes de fechar**: se o personagem ainda está no espaço da parede → **recebe 1 hit de dano e é empurrado para o lado mais próximo**
  - A parede fecha normalmente após o empurrão
- O jogador tem HP de 3 hits
- Ficar preso é consequência de hesitar em vez de continuar em movimento

#### Salas Seguras (Reformuladas)

- Uma sala sem nenhuma saída aberta = Sala Cinética (não mais "segura" no mesmo sentido)
- Ficar em uma Sala Cinética: zero dano, mas a penalidade de estagnação pode se aplicar às paredes ao redor se o jogador ficar estático por 3s+
- O jogador que entra em uma Sala Cinética em movimento e imediatamente posiciona-se em direção à próxima saída ativa o Impulso antes mesmo que a parede comece a abrir
- A Sala Cinética continua sendo ponto de respiração — mas o ritmo correto é entrar, planejar brevemente, sair em movimento

### 3.4 Layout do Labirinto

O labirinto tem estrutura de **camadas** com múltiplas rotas possíveis:

```
ENTRADA → Câmara A → (bifurcação) → Câmara B → ... → EXIT
                    ↘ (rota alternativa) ↗
```

| Rota | Perfil | Fragmentos | Tempo Estimado | Inimigos |
|------|--------|------------|----------------|----------|
| Rota Direta | Mínimas paredes, corredor largo | 2–3 Fragmentos | ~40s | 0 inimigos |
| Rota Alternativa | Mais paredes, curvas | 4–5 Fragmentos | ~60s | 1 inimigo emergindo |
| Alcovas Laterais | Desvio opcional de cada rota | +1–2 Fragmentos cada | +10–15s por alcova | Variável |

#### Alcovas Laterais

- Câmaras menores conectadas à rota principal por um único segmento de parede
- Fragmentos estão dentro das alcovas
- Para coletar: entrar na alcova (esperando a parede abrir), coletar, sair antes que a parede feche
- Cada alcova tem seu próprio ciclo de abertura — o jogador precisa avaliar se vale o tempo
- Algumas alcovas têm a parede com frequência de abertura muito espaçada (oportunidade rara = mais Fragmentos)

### 3.5 Coleta de Recursos — Fragmentos Estruturais

- **Coleta**: padrão de 1.5 segundos de pausa sobre o Fragmento (sistema de mochila padrão)
- Os Fragmentos ficam em posições fixas do mapa (mesmos locais a cada run, mas timings das paredes de acesso variam)
- **Sistema de mochila se aplica** nesta zona: cada Fragmento = 1 slot
- Mochila cheia = Fragmentos restantes no chão não podem ser coletados → o jogador vai ao EXIT
- A tensão da mochila aqui é diferente: o jogador deve decidir quais alcovas valem o tempo vs o espaço de mochila

**Fragmentos na rota direta**: garantidos, fáceis de pegar, pouco risco.
**Fragmentos em alcovas**: requerem timing, mais risco de ficar preso, maior quantidade.

### 3.6 Inimigos — Emergentes de Passagens

- Inimigos não estão presentes no início da run
- Inimigos **emergem de passagens recém-abertas**: quando uma parede abre, há 30% de chance de um inimigo estar do lado de lá
- Tipo: **Sentinela Errante** — inimigo simples que persegue o jogador se em linha de visão, patrulha aleatoriamente se não
- HP: 60 (o jogador não tem ataque — deve evitar)
- Sentinela que toca o jogador: -1 HP
- Sentinelas não passam por paredes fechadas — ficam presos em câmaras se a parede fechar atrás deles
- Os Sentinelas criam pressão para o jogador não ficar parado demais esperando paredes

**Design de inimigo:**
O papel do Sentinela aqui é tornar as Salas Seguras menos "seguras" ao longo do tempo: se um Sentinela entra pela parede que acabou de abrir, a sala deixa de ser segura. O jogador deve escolher entre enfrentar o risco de passar pela parede ou esperar o Sentinela se afastar.

---

## 4. Formulas

### Janela de Passagem Segura

```
janela_segura = duracao_aberta - tempo_para_atravessar

Variáveis:
  duracao_aberta         = tempo que a parede permanece aberta (3–8s, procedural)
  tempo_para_atravessar  = largura_parede / velocidade_jogador = 60px / 200px/s = 0.3s
  aviso_fechamento       = 3s (sempre fixo)

janela_real_segura = duracao_aberta - aviso_fechamento = 0s até 5s

Parede com duracao_aberta = 3s: janela real = 0s → apenas o tempo de aviso é a oportunidade
Parede com duracao_aberta = 8s: janela real = 5s → confortável
```

### Ganho de Tempo por Impulso de Abertura

```
antecipacao_impulso = 1.5s (fixo quando impulso ativado)

Condição:
  distancia_jogador_parede <= 100px
  velocidade_jogador >= 0.8 × velocidade_max = 160 px/s
  duracao_condicao >= 0.5s

Impacto no timing efetivo:
  Sem impulso: jogador espera timer_fechada completo (~5–12s)
  Com impulso: jogador inicia corrida enquanto parede ainda está fechada;
               parede abre 1.5s antes do timer normal
               → o "tempo de espera percebido" é zero se o timing for perfeito

Exemplo:
  Parede com 3s restantes de fechamento. Jogador corre em direção a ela em 160px/s:
  timer_efetivo = 3s - 1.5s = 1.5s restantes quando o impulso ativa
  → Jogador chega à parede em 100px / 160px/s = 0.625s
  → Parede abre em 1.5s - 0.625s = 0.875s após o jogador já ter chegado
  → Com antecipação: o jogador inicia o Impulso mais cedo e chega quase ao mesmo tempo que abre
```

### Penalidade de Estagnação

```
penalidade_estagnacao = +2s no timer_fechada atual

Condição:
  distancia_jogador_parede <= 150px
  velocidade_jogador <= 0.3 × velocidade_max = 60 px/s
  duracao_condicao >= 3s

Máximo: 1 penalidade por tentativa de passagem (não acumula indefinidamente)
```

### Custo de Tempo por Alcova

```
custo_alcova = tempo_espera_abertura + tempo_entrada + tempo_coleta + tempo_saida

Variáveis:
  tempo_espera_abertura  = variável por parede (0s se timing perfeito, até duracao_fechada se timing ruim)
  tempo_entrada          = largura_camara / velocidade_jogador ≈ 1–2s
  tempo_coleta           = 1.5s (coleta de Fragmento)
  tempo_saida            = igual ao tempo_entrada

Custo mínimo (timing perfeito, câmara pequena):
  0 + 1.0 + 1.5 + 1.0 = 3.5s de desvio por 1–2 Fragmentos

Custo máximo (timing ruim, câmara grande):
  12 + 2.0 + 1.5 + 2.0 = 17.5s de desvio por 1–2 Fragmentos
```

### Dano por Aprisionamento (Parede Fechando)

```
Condição de dano: personagem ocupa hitbox da parede ao fim do estado Fechando (última janela de 1s)
Dano: -1 HP (fixo)
HP jogador: 3 HP total

O jogador pode sobreviver a 2 aprisionamentos na mesma run sem morrer.
O terceiro = fail state.
```

### Tempo Estimado de Run por Estratégia

```
Estratégia Rota Direta (sem alcovas):
  Passagens: ~6–8 paredes na rota direta
  Tempo médio por parede (sem espera): 0.3s de atravessamento
  Tempo médio de espera (timing imperfeito): ~2s por parede
  Tempo total estimado: 8 × (0.3 + 2.0) ≈ 18s de paredes + ~20s de deslocamento = ~40s

Estratégia Rota Alternativa (com alcovas):
  Passagens: ~10–14 paredes
  Coletas: 3–4 Fragmentos em alcovas (+10–15s por alcova)
  Tempo total estimado: 40s base + 2 alcovas × 12s = ~65–90s
```

### Probabilidade de Inimigo ao Abrir Passagem

```
chance_inimigo = 30% por abertura de parede

Com 8 paredes na rota direta: expectativa de 0.3 × 8 = 2.4 inimigos encontrados
Com 12 paredes na rota alternativa: 0.3 × 12 = 3.6 inimigos esperados

O jogador deve ser capaz de evitar todos com boa navegação (inimigos têm velocidade menor que o jogador).
```

---

## 5. Edge Cases

| Situação | Comportamento |
|----------|---------------|
| Personagem exatamente no meio de uma parede ao fechar | Sistema verifica posição X no segmento; se X < 50% do segmento = empurrão para o lado de origem; se X >= 50% = empurrão para o lado de destino. Sempre há um lado definido |
| Jogador recebe empurrão e cai dentro de um Sentinela | O empurrão tem prioridade de posicionamento; se a posição de destino do empurrão está ocupada por inimigo, o inimigo é deslocado lateralmente 30px antes do empurrão |
| Duas paredes fecham ao mesmo tempo, aprisionando o jogador em câmara 1×1 | O jogador está na câmara, não em nenhuma parede → zero dano. Está preso até uma parede abrir. Situação válida e intencional (Sala Segura forçada) |
| Sentinela preso atrás de parede fechada com jogador | O Sentinela patrulha a câmara; não causa dano sem contato físico; o jogador deve aguentar até a parede abrir e sair (ou o Sentinela é um problema maior em câmaras minúsculas) |
| Mochila cheia, alcova com Fragmento acessível | Parar sobre o Fragmento não inicia o círculo de coleta (comportamento padrão de mochila cheia) |
| EXIT acessível com mochila vazia (0 Fragmentos) | O jogador pode chegar ao EXIT e encerrar a run com 0 Fragmentos. Não é fail state, apenas run sem retorno |
| Timer interno de parede zerado mas animação de abertura ainda em progresso | Estado Abrindo (2s de animação) é processado antes do estado Aberta. A passagem só é considerada aberta após o fim da animação de 2s |
| Jogador tentando coletar Fragmento em alcova com parede fechando | Se o círculo de coleta (1.5s) termina antes da parede fechar → coleta bem-sucedida. Se a parede fecha antes do círculo completar → coleta cancelada, personagem recebe empurrão (1 HP de dano). O jogador deve avaliar se tem tempo |
| Sentinela bloqueando a único caminho para EXIT | O Sentinela tem hitbox pequeno relativo ao corredor; o jogador pode passar lateralmente com boa navegação. Se o corredor for estreito demais, o Sentinela se move aleatoriamente e desobstruirá o caminho em ~3s |

---

## 6. Dependencies

| Sistema | Relação | Direção |
|---------|---------|---------|
| **Sistema de Mochila** | Fragmentos Estruturais ocupam slots; mochila cheia bloqueia coleta; upgrades de mochila ampliam quantidade coletável por run | Zona depende do Sistema de Mochila |
| **Sistema de Recursos** | Fragmentos Estruturais são entregues ao hub ao chegar ao EXIT; o sistema registra o tipo "Fragmento Estrutural" | Zona fornece recurso; Sistema de Recursos recebe |
| **Foguete (Hub)** | Fragmentos alimentam o casco de blindagem do foguete | Foguete consome Fragmentos |
| **Hub / Mapa-Mundo** | Jogador acessa a zona a partir do hub | Hub controla acesso |
| **Sistema de HP** | O jogador tem 3 HP nesta zona; empurrões de parede e toques de Sentinela causam -1 HP cada | Zona configura HP via sistema compartilhado |
| **Gerador de Labirinto** | A estrutura do labirinto (câmaras, conexões, posições de Fragmentos) é semi-procedural; a topologia base é fixa mas os timings das paredes e a seed de inimigos variam por run | Zona define parâmetros para o Gerador |
| **Sistema de Paredes Dinâmicas** | As paredes dinâmicas são um sistema específico desta zona (estado, timer, animação, dano por aprisionamento); deve ser implementado como componente reutilizável caso outras zonas no futuro usem paredes | Zona define e cria o sistema de Paredes Dinâmicas |
| **Zona Circuito Quebrado** | Zona irmã de puzzle de navegação; contraste: Circuito tem puzzle de sequência estático, Labirinto tem puzzle de timing dinâmico | Relação temática; ambas são modo solo |

---

## 7. Tuning Knobs

| Parâmetro | Valor Base | Range Seguro | Categoria | Efeito no Gameplay |
|-----------|------------|--------------|-----------|---------------------|
| `duracao_aviso_fechamento` | 3s | 2–5s | Feel | Janela de reação antes do fechamento |
| `duracao_aviso_abertura` | 2s | 1–3s | Feel | Base sem impulso; encurtado pelo Impulso |
| `duracao_aberta_min` | 3s | 2–5s | Curve | Mínimo de tempo com passagem disponível |
| `duracao_aberta_max` | 8s | 5–12s | Curve | Máximo de tempo aberta |
| `duracao_fechada_min` | 5s | 3–8s | Gate | Tempo mínimo de bloqueio |
| `duracao_fechada_max` | 12s | 8–20s | Gate | Tempo máximo de bloqueio |
| `impulso_distancia_ativacao` | 100px | 70–150px | Feel | Distância de aproximação que ativa o Impulso; menor = exige mais precisão de rota |
| `impulso_velocidade_minima` | 160 px/s (80%) | 120–180px/s | Feel | Velocidade mínima para ativar o Impulso; muito alto = difícil de ativar |
| `impulso_duracao_condicao` | 0.5s | 0.3–1.0s | Feel | Quanto tempo manter a condição antes do Impulso ativar; mais alto = menos acidental |
| `impulso_antecipacao` | 1.5s | 0.5–2.5s | Curve | Ganho de tempo por Impulso; muito alto = trivializa o timing |
| `estagnacao_duracao_trigger` | 3s | 2–5s | Gate | Tempo estático para disparar penalidade; muito baixo = frustrante |
| `estagnacao_penalidade` | +2s | +1s a +4s | Gate | Atraso adicional por estagnação; muito alto = punitivo, muito baixo = sem efeito |
| `chance_inimigo_abertura` | 30% | 15–50% | Gate | Frequência de Sentinelas emergindo de passagens |
| `hp_jogador` | 3 | 2–5 | Gate | Tolerância a aprisionamentos e hits |
| `n_fragmentos_rota_direta` | 2–3 | 1–4 | Curve | Recompensa garantida para rota direta |
| `n_fragmentos_por_alcova` | 1–2 | 1–3 | Curve | Incentivo para desvios |
| `n_alcovas_por_mapa` | 4–6 | 3–8 | Curve | Oportunidades opcionais de coleta |
| `velocidade_sentinela` | 100 px/s | 70–140 px/s | Feel | Ameaça dos Sentinelas |

---

## 8. Acceptance Criteria

**Funcional (pass/fail para QA):**

- [ ] Toda parede exibe um contador visual (arco ou barra) indicando tempo até a próxima mudança de estado
- [ ] Impulso de Abertura: quando jogador está a ≤100px da parede em movimento ≥160px/s por ≥0.5s → parede abre 1.5s antes do timer normal
- [ ] Parede com Impulso ativo exibe pulso ciano claramente distinto do estado normal
- [ ] Penalidade de Estagnação: quando jogador está a ≤150px da parede parado/lento por ≥3s → timer da parede aumenta em 2s (máximo 1 vez por tentativa)
- [ ] Estado de aviso de fechamento (3s) aciona feedback sonoro e visual distinto
- [ ] Personagem no espaço da parede a 1s do fechamento: -1 HP + empurrão para o lado correto
- [ ] Parede fechada bloqueia fisicamente o personagem
- [ ] Fragmentos em alcovas são coletáveis apenas enquanto a parede da alcova está aberta
- [ ] Chegar ao EXIT transfere todos os Fragmentos ao hub
- [ ] Fail state (0 HP) descarta todos os Fragmentos da run
- [ ] Sentinelas emergem de passagens com ~30% de probabilidade por abertura
- [ ] EXIT está sempre acessível por pelo menos uma rota

**Experiencial (validado por playtest):**

- [ ] Novo jogador entende que correr em direção à parede faz ela abrir mais cedo — sem tutorial
- [ ] Após 1–2 runs, o jogador percebe que esperar parado é menos eficiente que aproximar-se em movimento
- [ ] O pulso ciano da parede com Impulso comunica "você está fazendo certo" claramente
- [ ] Jogador que domina o Impulso completa a run ~20–30s mais rápido que jogador que espera
- [ ] A escolha entre rota direta e rota alternativa continua sendo decisão real
- [ ] Uma run completa (entrada ao EXIT) ocorre entre 30 e 80 segundos (mais curta que v1 por conta do Impulso)

---

*Relacionado: `design/gdd/game-concept.md`, `design/gdd/resource-system.md`, `design/gdd/zone-circuit.md`*
