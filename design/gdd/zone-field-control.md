# Controle de Campo — Game Design Document

**Version**: 2.0
**Date**: 2026-03-23
**Status**: Revisado — Burst de Chegada (Captura Cinética)

---

## 1. Overview

O Controle de Campo é uma zona de dominação territorial em tempo real. O mapa tem 5–7 zonas de captura (anéis no chão) distribuídas em diferentes posições. O jogador posiciona seu squad dentro dessas zonas para capturá-las; zonas capturadas geram **Sinais de Controle** passivamente ao longo do tempo. Inimigos do tipo "Recapturador" contestam as zonas, forçando o jogador a reposicionar continuamente. A mecânica central é que **mover é redistribuir presença** — o squad cobre mais zonas quando bem posicionado, mas nenhuma delas com a mesma força de quando concentrado. A tensão é entre cobertura ampla (gera mais, mas cada zona é fraca) e foco (gera menos, mas mais seguro).

Os **Sinais de Controle** são usados no foguete como o sistema de comunicações e telemetria — sem eles, o foguete não consegue transmitir dados de voo para a base, tornando impossível qualquer correção de rota durante o lançamento.

---

## 2. Player Fantasy

Você é um sinal de rádio que nunca para de transmitir. Cada zona capturada é uma antena que precisa de energia constante — e a energia vem do movimento. Você chega à zona central em velocidade, e a antena acende no burst de chegada. Você sai correndo para a zona pequena à direita antes que o Recapturador chegue — e ela também acende ao seu toque. Você está sempre em movimento, sempre gerando presença, sempre empurrando sua energia para os pontos certos. Um comandante que fica parado num ponto é uma antena morta. Um comandante que circula é uma rede viva.

**Estética MDA primária**: Challenge (gestão de presença cinética, circulação ótima entre zonas).
**Estética secundária**: Fantasy (comandante territorial que é o próprio sinal, não o operador do sinal).

---

## 3. Detailed Rules

### 3.1 Estrutura da Run

- O jogador entra **com o squad** (até 4 personagens, igual à Zona Hordas)
- O mapa tem **5–7 zonas de captura** visíveis desde o início
- A run dura **90 segundos** (timer fixo — não encerra antes)
- Ao fim dos 90 segundos: run encerra automaticamente, Sinais acumulados vão para o hub
- **Não há EXIT nesta zona** — o encerramento é sempre pelo timer
- Morrer (todos os personagens mortos) = fail state, perde os Sinais gerados na run
- O jogador não pode "sair cedo" — a zona é sobre sustentar presença, não extrair e escapar

### 3.2 Interpretação do Movimento (como arrastar funciona aqui)

- **Input**: arrastar o dedo = mover o squad (igual à Zona Hordas)
- **Significado aqui**: mover é energizar a rede. Cada chegada a uma zona nova gera um burst de captura. Ficar parado demais numa zona drena o potencial cinético do squad
- **Chegada em movimento é recompensada**: entrar em uma zona com velocidade alta ativa a taxa de captura de burst (3× por 4s). Entrar devagar ou parado ativa apenas a taxa base (1×)
- **Circulação é a estratégia ótima**: em vez de defender 1 zona, o squad que circula ativamente gera mais Sinais por segundo no total — o burst de cada chegada compensa o tempo de deslocamento
- **Formação de squad importa**: com 4 personagens em formação, a área coberta pode sobrepor múltiplas zonas pequenas simultaneamente — um movimento único pode burstar 2 zonas ao mesmo tempo

### 3.3 Mecânica Central — Zonas de Captura

#### Estados de uma Zona

Cada zona de captura possui 5 estados possíveis:

| Estado | Cor Visual | Condição | Efeito |
|--------|-----------|----------|--------|
| **Neutra** | Cinza | Nenhum personagem dentro | Não gera recursos |
| **Capturando** | Azul pulsante | Pelo menos 1 personagem do jogador dentro, sem inimigos | Barra de captura sobe |
| **Capturada** | Azul sólido | Barra de captura = 100% | Gera Sinais de Controle passivamente |
| **Contestada** | Roxo | Personagens do jogador E inimigos dentro simultaneamente | Barra de captura congela; não gera recursos; combate automático ocorre |
| **Perdida** | Vermelho pulsante | Apenas inimigos dentro | Barra de captura desce para 0; zona retorna ao estado Neutra |

#### Tamanhos de Zona

| Tamanho | Raio | Tempo para Capturar | Geração de Sinais | Quantidade no Mapa |
|---------|------|---------------------|--------------------|--------------------|
| Pequena | 80px | 5s | 0.5 Sinais/s | 3–4 zonas |
| Média | 120px | 10s | 1.0 Sinais/s | 1–2 zonas |
| Central | 180px | 20s | 2.5 Sinais/s | 1 zona (sempre no centro) |

#### Barra de Captura e Taxa Cinética

- A barra vai de 0% a 100%
- **Subida — Taxa Burst**: quando o squad entra em uma zona com velocidade ≥80% da velocidade máxima → **3× a taxa de captura por 4 segundos** (antena acende com o impacto de chegada)
- **Subida — Taxa Base**: enquanto o squad permanece na zona além dos 4s de burst → **1× a taxa normal**
- **Subida — Taxa Decadente**: quando o squad está na mesma zona por mais de 8s sem se mover → **0.5× a taxa** (antena perde sinal por ausência de movimento)
- **Congelamento**: enquanto houver personagens do jogador E inimigos dentro (estado Contestada)
- **Descida**: quando apenas inimigos estão dentro (0.5× a velocidade de subida base do jogador)
- A barra de captura é visível na zona (arco ao redor do anel); indicador de burst ativo = anel pulsando

#### Indicador de Estado Cinético da Zona

| Estado | Visual | Condição |
|--------|--------|----------|
| **Burst ativo** | Anel pulsando rapidamente, cor vibrante | Squad chegou em velocidade alta (≤4s atrás) |
| **Capturando normal** | Anel sólido, avançando | Squad presente, sem burst, sem decadência |
| **Decadente** | Anel pulsando lentamente, cor apagada | Squad parado >8s |
| **Contestada** | Anel roxo | Ambos presentes |
| **Perdida** | Anel vermelho | Apenas inimigos |

#### Cobertura de Squad por Zona

Com múltiplos personagens, a formação pode tocar fisicamente mais de uma zona ao mesmo tempo:

- **Personagem dentro da zona** = conta como presença para captura/defesa daquela zona
- Com 4 personagens em formação padrão (2×2), a formação cobre uma área de ~240×240px
- Uma zona Pequena (raio 80px) pode ser coberta por 1 personagem; a zona Central (raio 180px) exige presença centralizada
- Estratégia avançada: posicionar o squad entre duas zonas pequenas adjacentes — ambas recebem presença de membros diferentes simultaneamente

### 3.4 Coleta de Recursos — Sinais de Controle

- **Geração**: passiva e contínua enquanto uma zona está no estado Capturada
- **Não há coleta manual**: os Sinais se acumulam em um medidor de run (visível na UI)
- Ao fim dos 90 segundos: o total acumulado no medidor vai para o estoque do hub
- **Sistema de mochila NÃO se aplica aqui**: não há slots; os Sinais são um recurso de fluxo, não um item coletado
- **Fail state**: se todos os personagens morrerem antes do timer zerar, os Sinais acumulados são perdidos

**Justificativa de design — por que sem mochila:**
A mochila cria a tensão de "quando sair". Nesta zona, a tensão é diferente: "quais zonas priorizar". A mochila seria uma camada redundante de pressão que competiria com o raciocínio territorial. Sinais como fluxo passivo são a mecânica mais coerente com o tema de presença.

**Sinal mínimo garantido:**
Se o jogador capturar e manter pelo menos 1 zona pequena por 90 segundos:
- 0.5 Sinais/s × 90s = 45 Sinais garantidos
- Uma run abaixo de 45 Sinais é considerada run frustrada (calibração de missões e upgrades deve usar este como piso)

### 3.5 Risco e Fail State

#### Inimigos — Recapturadores

- Tipo específico desta zona: **Recapturador**
- Comportamento: o Recapturador identifica a zona Capturada com maior geração de Sinais dentro de alcance e se move em direção a ela
- Ao entrar na zona: estado muda para Contestada; combate automático do squad começa
- HP do Recapturador: baixo a médio (70 HP) — o squad os derrota razoavelmente rápido se o jogador estiver presente
- Problema real: múltiplos Recapturadores em zonas diferentes ao mesmo tempo — o jogador não pode estar em dois lugares

**Spawning de Recapturadores:**

| Tempo de Run | Frequência de Spawn | Quantidade por Wave |
|---|---|---|
| 0–30s | 1 Recapturador a cada 15s | 1–2 |
| 30–60s | 1 a cada 10s | 2–3 |
| 60–90s | 1 a cada 8s | 2–4 |

- Recapturadores não aparecem aleatoriamente no mapa — emergem de **pontos fixos de spawn** nos cantos do mapa (posições predefinidas, visíveis ao jogador)
- O jogador pode prever a direção de ameaça observando os pontos de spawn

#### Inimigos de Combate (Hordas reciclados)

- Além de Recapturadores, a zona usa inimigos da Zona Hordas (Runners, Bruisers) para pressão de dano
- Esses inimigos perseguem o squad diretamente (não contestam zonas)
- Servem para forçar o jogador a se mover quando preferiria ficar parado em uma zona
- Aparecem em waves leves (2–4 por wave, a cada 20s)

#### Fail State

- Todos os personagens morrem = fail state; Sinais acumulados na run são perdidos
- Personagens individuais mortos reduzem a força de presença do squad — uma morte significa menos cobertura, acelerando a perda de zonas

---

## 4. Formulas

### Taxa de Captura com Sistema Cinético

```
taxa_captura(zona, estado_cinetico):
  Burst ativo (0–4s após chegada em velocidade):   taxa_base × 3.0
  Normal (4–8s após chegada):                       taxa_base × 1.0
  Decadente (>8s sem movimento):                    taxa_base × 0.5

taxa_base_zona_pequena  = 20%/s  (captura em 5s no base; 1.67s no burst)
taxa_base_zona_media    = 10%/s  (captura em 10s no base; 3.3s no burst)
taxa_base_zona_central  = 5%/s   (captura em 20s no base; 6.7s no burst)
```

### Geração Total de Sinais — Estratégias Comparadas

```
Estratégia A — Foco na Central (v1: campar):
  Captura central (20s base), fica 70s parado:
  2.5 × 4s(burst) = 10 + 2.5 × 4s(normal) = 10 + 2.5 × 62s(decadente×0.5) = 77.5
  Total estimado: ~100 Sinais (prejudicado pela decadência)

Estratégia B — Circulação entre 4 zonas pequenas (nova estratégia ótima):
  Ciclo: chega em zona em velocidade (burst 4s → 2 Sinais), sai para próxima
  Tempo de deslocamento entre zonas ~5s; ciclo por zona: ~9s
  4 zonas × ciclo de 9s = 36s por rodada completa; ~2.5 rodadas em 90s
  Burst por chegada: 3 × 0.5 × 4 = 6 Sinais por chegada
  Total: 4 zonas × 2.5 rodadas × 6 = 60 Sinais de burst
  + 4 zonas × 2.5 rodadas × 0.5 × 5s_normal = 25 Sinais de normal
  Total estimado: ~85 Sinais

Estratégia C — Central + Circulação ativa nas médias:
  Captura central em burst (6.7s), sai para média 1 (burst 3.3s), volta à central (reburst),
  vai para média 2 (burst), volta à central (reburst) — ciclo de ~30s
  3 rebursts na central × 2.5 × 4s = 30 Sinais de central-burst
  + 2 médias × 3 visitas × 1.0 × 4s burst = 24 Sinais de médias-burst
  + Geração base entre bursts
  Total estimado: ~200 Sinais (estratégia ótima: burst constante em zonas de alto valor)

Nota: Circulação contínua ativa vence acampamento estático em todas as estratégias.
```

### Tempo de Captura por Zona com Burst

```
tempo_captura(zona, com_burst):
  zona_pequena  base:  100% em 5s  (20%/s)
  zona_pequena  burst: 100% em 1.7s (60%/s por 4s → captura completa em ~1.7s)
  zona_media    base:  100% em 10s (10%/s)
  zona_media    burst: 100% em 3.3s (30%/s por 4s → captura completa em ~3.3s)
  zona_central  base:  100% em 20s (5%/s)
  zona_central  burst: 100% em 6.7s (15%/s por 4s = 60% em 4s; restante em 4s base = 6.7s total)

Um squad que chega sempre em velocidade captura zonas 3× mais rápido.
A vantagem do burst incentiva a circulação constante.

Com múltiplos personagens dentro da zona, a taxa de captura não aumenta.
O squad conta como "presença confirmada", não como multiplicador de velocidade.
```

### Taxa de Descida de Zona (Recapturador sem oposição)

```
taxa_descida = 0.5 × taxa_subida_padrao

Zona pequena capturada, Recapturador sozinho:
  tempo_para_perder = 5s × 2 = 10s (desce na metade da velocidade que subiu)

Isso dá ao jogador uma janela para responder antes de perder a zona completamente.
```

### Pressão de Recapturadores vs Eficiência do Squad

```
HP_Recapturador = 70
DPS_squad_padrao = 30 DPS (estimativa: Guardian + Striker)

tempo_para_eliminar_recapturador = 70 / 30 = ~2.3s

Comparado com janela de 10s para perda de zona: o jogador tem ~7.7s de margem
para se reposicionar antes que a zona seja perdida mesmo se o squad não chegar.
Isso garante que há sempre uma decisão viável disponível, não uma punição instantânea.
```

---

## 5. Edge Cases

| Situação | Comportamento |
|----------|---------------|
| Squad inteiro na zona Central, Recapturador entra em zona Pequena | Estado da zona Pequena muda para Perdida após a descida (não para Contestada — não há presença do jogador). Jogador pode ignorar ou reposicionar |
| Dois Recapturadores na mesma zona simultaneamente | Estado permanece Contestada com múltiplos inimigos; combate do squad recebe mais danos; zona não é perdida mais rápido (apenas 1 Recapturador é suficiente para descer a barra) |
| Squad dividido entre duas zonas (personagens em zonas diferentes) | Cada zona conta os personagens dentro dela independentemente; combate automático é local a cada zona; o jogador (líder) está em uma zona; os outros vão para a formação mas se espalharem é implementado como distância máxima da formação |
| Personagem do squad morre dentro de uma zona Capturada | Presença é reduzida; se era o único personagem na zona e outros ainda existem, zona continua Capturada desde que outro personagem esteja dentro |
| Todos os personagens morrem na zona Central (fail state) | Fail state acionado; todos os Sinais acumulados até aquele momento são perdidos |
| Zona Pequena e zona Central se sobrepõem espacialmente | Não é permitido pelo gerador de mapa — zonas têm distância mínima entre elas de (raio_maior + 50px) |
| Timer atinge 0 com Recapturador em combate com o squad na zona | Timer tem prioridade; run encerra com os Sinais acumulados; o combate é interrompido |
| Squad de 1 personagem tentando capturar a zona Central | Totalmente possível — demora 20s e o personagem é o único defensor. Arriscado mas válido |
| Zona Contestada: personagem do squad morre, squad é eliminado da zona | Estado muda de Contestada para Perdida; barra começa a descer na taxa de descida padrão |
| Recapturador vai para zona Neutra (não foi capturada) | Recapturador não tem como "capturar para o inimigo" — ele apenas patrulha se não houver zona Capturada em alcance. O comportamento de alvo só se ativa para zonas no estado Capturada |

---

## 6. Dependencies

| Sistema | Relação | Direção |
|---------|---------|---------|
| **Sistema de Squad (Zona Hordas)** | Sistema de squad (até 4 personagens, formação, combate automático) é herdado integralmente; HP e stats dos personagens são os mesmos | Zona depende do Sistema de Squad |
| **Sistema de Recursos** | Sinais de Controle são registrados como tipo de recurso; transferidos ao hub ao fim da run como fluxo acumulado, não como item de mochila | Zona fornece recurso; Sistema de Recursos deve suportar recurso de "fluxo" além de "item" |
| **Foguete (Hub)** | Sinais de Controle alimentam o sistema de comunicações e telemetria do foguete | Foguete consome Sinais |
| **Hub / Mapa-Mundo** | Jogador acessa a zona a partir do hub | Hub controla acesso |
| **Sistema de Inimigos (Zona Hordas)** | Runners e Bruisers são reutilizados nesta zona; Recapturador é inimigo novo específico desta zona | Zona herda inimigos existentes + define novo tipo |
| **Gerador de Mapas** | Posição e tamanho das zonas de captura são gerados proceduralmente; pontos de spawn dos Recapturadores são fixos por layout mas variáveis entre runs | Zona define parâmetros para o Gerador |
| **Sistema de Timer** | Timer de 90s com encerramento automático (sem EXIT voluntário) — comportamento diferente de outras zonas | Zona define comportamento específico do Timer |
| **Zona Hordas** | Zona irmã de squad; Controle de Campo é a Zona Hordas com foco em posicionamento territorial em vez de sobrevivência de horda | Dependência técnica (squad) + relação temática |

---

## 7. Tuning Knobs

| Parâmetro | Valor Base | Range Seguro | Categoria | Efeito no Gameplay |
|-----------|------------|--------------|-----------|---------------------|
| `timer_run` | 90s | 60–120s | Gate | Duração total da run; abaixo de 60s favorece demais quem captura cedo; acima de 120s perde urgência |
| `n_zonas_captura` | 6 | 5–7 | Curve | Complexidade territorial; menos = mais fácil defender, mais = mais difícil cobrir tudo |
| `n_zonas_pequenas` | 3–4 | 2–5 | Curve | Distribuição de zonas fáceis; mais = mais válido espalhar o squad |
| `n_zonas_centrais` | 1 | 1 | Gate | Sempre exatamente 1 — é o landmark estratégico do mapa |
| `taxa_geracao_zona_central` | 2.5 Sinais/s | 1.5–4.0 | Curve | Valor da zona central |
| `tempo_captura_zona_pequena` | 5s | 3–8s | Feel | Tempo de captura base (sem burst) |
| `tempo_captura_zona_central` | 20s | 15–30s | Gate | Tempo de captura base; burst reduz para ~6.7s |
| `taxa_descida_zona` | 0.5× taxa_subida | 0.3–0.8× | Feel | Velocidade de perda de zona |
| `burst_multiplicador` | 3.0× | 2.0–4.0× | Curve | Fator de aceleração na chegada; muito alto = trivializa captura, muito baixo = sem incentivo de movimento |
| `burst_duracao` | 4s | 2–6s | Feel | Janela de burst após chegada; muito longa = incentiva acampamento no burst |
| `burst_velocidade_minima` | 160 px/s (80%) | 120–180 px/s | Feel | Velocidade mínima para ativar o burst; muito alto = difícil de ativar em zonas próximas |
| `decadencia_trigger` | 8s | 5–12s | Gate | Tempo parado antes do decaimento; muito baixo = punitivo para quem defende zonas |
| `decadencia_fator` | 0.5× | 0.3–0.7× | Feel | Taxa de captura no decaimento; deve ser perceptível mas não dramático |
| `hp_recapturador` | 70 | 50–120 | Curve | Tempo para o squad eliminar um Recapturador em combate |
| `frequencia_spawn_recapturador_early` | 15s | 10–25s | Gate | Pressão na primeira fase da run |
| `frequencia_spawn_recapturador_late` | 8s | 5–12s | Gate | Pressão na fase final; escala de dificuldade ao longo da run |
| `freq_wave_inimigos_horda` | 20s | 15–30s | Gate | Pressão de dano secundária (Runners/Bruisers) |

---

## 8. Acceptance Criteria

**Funcional (pass/fail para QA):**

- [ ] Squad entrando em zona com velocidade ≥160px/s → taxa de captura de 3× por 4s (burst ativo)
- [ ] Squad entrando em zona com velocidade <160px/s → taxa de captura de 1× (sem burst)
- [ ] Anel da zona pulsa visivelmente durante o estado de burst
- [ ] Squad parado >8s na mesma zona → taxa de captura cai para 0.5× (decadência)
- [ ] Anel da zona visual fica apagado durante decadência
- [ ] A barra de captura congela quando jogador E Recapturador estão na mesma zona (Contestada)
- [ ] Uma zona capturada gera a taxa correta de Sinais/s (0.5 / 1.0 / 2.5)
- [ ] Recapturador identifica zona Capturada com maior taxa de geração e se move para ela
- [ ] Timer de 90s encerra a run automaticamente; Sinais transferidos ao hub
- [ ] Todos os personagens mortos = fail state; Sinais da run descartados
- [ ] Não há EXIT; a run só encerra por timer ou fail state
- [ ] Sistema de Sinais usa contabilidade de fluxo (não slot de mochila)

**Experiencial (validado por playtest):**

- [ ] Novo jogador percebe visualmente que "chegar correndo" faz o anel acender mais rápido — sem tutorial
- [ ] Após 2 runs, jogador testa conscientemente "chegar em velocidade vs chegar devagar" e percebe a diferença
- [ ] Jogador que circula entre zonas supera significativamente jogador que acampa uma zona (≥30% mais Sinais)
- [ ] O pulso do anel durante burst comunica "você fez certo" sem texto
- [ ] A decisão "para onde ir agora" ocorre a cada 4–8s naturalmente durante a run
- [ ] Uma run completa gera entre 100 e 250 Sinais para um jogador de habilidade média em circulação

---

*Relacionado: `design/gdd/game-concept.md`, `design/gdd/resource-system.md`, `design/gdd/mvp-game-brief.md`, `design/gdd/enemies-horda-zone.md`*
