# Labirinto Dinâmico — Game Design Document

**Version**: 1.0
**Date**: 2026-03-22
**Status**: Draft

---

## 1. Overview

O Labirinto Dinâmico é uma zona de navegação sob pressão estrutural. O mapa é um labirinto com paredes que abrem e fecham em ciclos temporizados e visíveis. O objetivo é chegar ao EXIT coletando o máximo de Fragmentos Estruturais ao longo do caminho. A complexidade não está nos inimigos — está no próprio mapa. Paredes fecham e abrem em ritmos diferentes; o jogador vê o countdown de cada parede e deve decidir: passar agora ou esperar a próxima abertura. Ficar preso em uma seção fechando causa dano. Múltiplos caminhos existem até o EXIT, mas o mais rápido nunca é o mais seguro.

Os **Fragmentos Estruturais** são usados no foguete como o material de reforço do casco externo — as vigas de titânio recuperado e as placas de blindagem que tornam o foguete resistente às tensões do lançamento e da atmosfera superior. São, literalmente, o que mantém o foguete inteiro.

---

## 2. Player Fantasy

O labirinto muda. Você vê a parede se fechando — 3 segundos. Você corre. Passa. A parede fecha atrás de você com um clique metálico. Há um Fragmento na alcova à esquerda. Você desvia, coleta, volta para o corredor principal — e agora uma parede na frente está abrindo em 2 segundos. Você espera. Passa. Um inimigo emerge da passagem recém-aberta. Você desvia. O labirinto é um sistema vivo, e você está aprendendo o ritmo. Na terceira run, você já sabe qual parede abrir primeiro, qual alcova tem o melhor Fragmento, qual caminho evitar no final. O mapa é a mecânica.

**Estética MDA primária**: Challenge (leitura de timing, planejamento de rota sob pressão dinâmica).
**Estética secundária**: Discovery (memorizar o labirinto, encontrar rotas alternativas, acumular conhecimento entre runs).

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
- **Significado aqui**: mover é navegar — cada posição no labirinto tem implicações de timing. O movimento é tanto sobre "onde ir" quanto sobre "quando ir"
- **Parar é uma tática**: esperar uma parede abrir é parar voluntariamente; esperar na posição certa na hora certa é a habilidade central
- **Salas seguras**: algumas salas (sem saídas abertas no momento) são refúgios temporários — ficar parado aqui é seguro, mas custa tempo

### 3.3 Mecânica Central — Paredes Dinâmicas

#### Estados das Paredes

Cada segmento de parede tem um estado cíclico com duração configurável:

| Estado | Visual | Duração | Efeito |
|--------|--------|---------|--------|
| **Aberta** | Sem parede, passagem livre | Variável (3–8s) | Passagem permitida |
| **Fechando** | Parede aparecendo + contador piscando (vermelho) | 3s de aviso | Passagem ainda permitida, mas ativa o aviso sonoro e visual |
| **Fechada** | Parede sólida | Variável (5–12s) | Passagem bloqueada |
| **Abrindo** | Parede sumindo + contador (verde) | 2s de aviso | Passagem disponível em 2s |

**O ciclo completo de uma parede:**
```
Fechada → [2s Abrindo] → Aberta → [3s Fechando (aviso)] → Fechada → ...
```

A duração de Aberta e Fechada varia por parede e por run (procedural dentro de ranges definidos). Os timings do aviso (3s fechando, 2s abrindo) são sempre os mesmos — o jogador pode confiar neles.

#### Visibilidade dos Timers

- Cada parede tem um **contador visual** em cima dela: um arco decrescente ou barra que indica quando muda de estado
- Estado Aberta: contador mostra tempo restante até começar a fechar
- Estado Fechada: contador mostra tempo restante até começar a abrir
- Estado Fechando (aviso): contador vermelho piscante (3s)
- Estado Abrindo (aviso): contador verde (2s)
- O jogador pode ler todos os timers visíveis na tela simultaneamente — o planejamento é possível

#### Ficar Preso em Parede Fechando

- Se o personagem está no espaço de uma parede quando ela fecha:
  - **Aviso (3s)**: a parede pisca vermelho, som de alerta começa
  - **1s antes de fechar**: se o personagem ainda está no espaço da parede → **recebe 1 hit de dano e é empurrado para o lado mais próximo** (definido pela posição exata do personagem no segmento)
  - A parede fecha normalmente após o empurrão
- O jogador tem HP de 3 hits (como Circuito Quebrado e Infecção)
- Ficar preso é consequência de má leitura de timing ou de decisão apressada, não de dificuldade injusta

#### Salas Seguras

- Uma sala sem nenhuma saída aberta no momento = Sala Segura temporária
- Ficar em uma Sala Segura: zero risco de dano, zero risco de armadilha
- Custo: tempo parado enquanto espera uma parede abrir
- As Salas Seguras são pontos de respiração — o jogador pode reorganizar o planejamento

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
  aviso_fechamento       = 3s (always fixed)

janela_real_segura = duracao_aberta - aviso_fechamento = 0s até 5s

Parede com duracao_aberta = 3s: janela real = 0s → APENAS o tempo de aviso é a oportunidade
Parede com duracao_aberta = 8s: janela real = 5s → confortável
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
| `duracao_aviso_fechamento` | 3s | 2–5s | Feel | Tempo para o jogador reagir antes da parede fechar; reduzir = mais punitivo |
| `duracao_aviso_abertura` | 2s | 1–3s | Feel | Antecipação antes de poder passar; muito curto = jogador não planeja |
| `duracao_aberta_min` | 3s | 2–5s | Curve | Mínimo de tempo com passagem disponível; abaixo de 2s = quase impossível passar |
| `duracao_aberta_max` | 8s | 5–12s | Curve | Máximo de tempo aberta; paredes mais lentas criam run mais lenta |
| `duracao_fechada_min` | 5s | 3–8s | Gate | Tempo mínimo de bloqueio; afeta quantas esperas o jogador enfrenta |
| `duracao_fechada_max` | 12s | 8–20s | Gate | Tempo máximo de bloqueio; paredes com 20s fechadas criam frustração |
| `chance_inimigo_abertura` | 30% | 15–50% | Gate | Frequência de encontros com Sentinelas; abaixo de 15% = sem tensão, acima de 50% = run sempre combativa |
| `hp_jogador` | 3 | 2–5 | Gate | Tolerância a aprisionamentos e hits de Sentinela |
| `n_fragmentos_rota_direta` | 2–3 | 1–4 | Curve | Recompensa mínima garantida para quem joga seguro |
| `n_fragmentos_por_alcova` | 1–2 | 1–3 | Curve | Incentivo para desvios de rota |
| `n_alcovas_por_mapa` | 4–6 | 3–8 | Curve | Quantidade de oportunidades opcionais de coleta |
| `velocidade_sentinela` | 100 px/s | 70–140 px/s | Feel | Ameaça dos Sentinelas; nunca deve exceder velocidade do jogador |

---

## 8. Acceptance Criteria

**Funcional (pass/fail para QA):**

- [ ] Toda parede exibe um contador visual (arco ou barra) indicando tempo até a próxima mudança de estado
- [ ] Estado de aviso de fechamento (3s) é visualmente distinto do estado Fechando e aciona feedback sonoro
- [ ] Personagem que ainda ocupa o espaço de parede a 1s do fechamento recebe -1 HP e é empurrado para o lado correto
- [ ] Parede fechada bloqueia fisicamente o personagem — não é possível atravessá-la
- [ ] Fragmentos em alcovas são coletáveis apenas enquanto a parede da alcova está no estado Aberta
- [ ] Chegar ao EXIT transfere todos os Fragmentos da mochila ao hub
- [ ] Fail state (0 HP) descarta todos os Fragmentos da run
- [ ] Sentinelas emergem de passagens com ~30% de probabilidade por abertura
- [ ] Sentinelas ficam presos em câmaras quando paredes fecham ao redor deles
- [ ] EXIT está sempre acessível por pelo menos uma rota em qualquer estado das paredes (o gerador de mapa garante isso)

**Experiencial (validado por playtest):**

- [ ] Novo jogador entende o sistema de timing de paredes na primeira run sem tutorial — apenas pelo feedback visual dos contadores
- [ ] O "quase preso" (receber empurrão mas sobreviver) é percebido como tenso, não como injusto
- [ ] Após 2–3 runs no mesmo mapa, o jogador começa a memorizar quais paredes têm timings rápidos vs lentos
- [ ] A escolha entre rota direta e rota alternativa é percebida como uma decisão real com trade-offs claros
- [ ] Alcovas laterais são percebidas como oportunidades opcionais, não como obstáculos
- [ ] Uma run completa (entrada ao EXIT) ocorre entre 40 e 100 segundos

---

*Relacionado: `design/gdd/game-concept.md`, `design/gdd/resource-system.md`, `design/gdd/zone-circuit.md`*
