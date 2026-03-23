# Corrida de Extração — Game Design Document

**Version**: 2.0
**Date**: 2026-03-23
**Status**: Draft — Lane Runner Redesign

---

## 1. Overview

A Corrida de Extração é um lane runner vertical com pressão de timer. O mundo rola automaticamente da direita para a esquerda; o jogador toca a metade superior ou inferior da tela para mover o squad uma lane para cima ou para baixo. Obstáculos com efeitos de debuff aparecem em lanes específicas — o desafio é reagir a eles a tempo. Combustível Volátil aparece como canisters em diferentes lanes e é coletado instantaneamente ao passar pela lane correta. O timer começa em 60 segundos e o scroll acelera progressivamente, tornando a zona mais frenética quanto mais avança a run.

---

## 2. Player Fantasy

Sete tubulações industriais paralelas preenchendo a tela. Seu squad corre por elas automaticamente — você só escolhe qual. Campos de faísca bloqueiam duas lanes à sua frente; névoa de fumaça escurece a direita; um pulso de EMP inverte tudo. Você lê os obstáculos meio segundo antes de chegarem e pressiona. Rápido. Errou? Você trava, leva dano, perde controle — e ainda tem obstáculos chegando. Certo? Canister coletado, timer estendido, próximo obstáculo já aparecendo.

**Estética MDA primária**: Challenge (reação rápida a padrões de obstáculos).
**Estética secundária**: Submission (ritmo frenético, scroll que acelera, "só mais uma run").

---

## 3. Detailed Rules

### 3.1 Estrutura da Run

- O jogador controla o squad em **7 lanes horizontais** que preenchem toda a tela (portrait, 480×854)
- O mundo rola automaticamente da direita para a esquerda — o squad fica parado no X=100
- A run dura até:
  - O **timer chegar a 0** → sucesso; combustível coletado é mantido
  - **Todos os personagens morrerem** → fail state; perde todo o combustível da run
- Não há EXIT voluntário nesta versão (o timer é o encerramento natural)

### 3.2 Input — Toque para Trocar de Lane

| Gesto | Ação |
|-------|------|
| Toque na metade superior da tela | Sobe 1 lane |
| Toque na metade inferior da tela | Desce 1 lane |

- A transição entre lanes é **animada** (0.15s de lerp suave)
- Se o jogador tocar novamente no meio de uma transição, a transição atual é concluída instantaneamente e uma nova começa
- Nos limites (lane 0 e lane 6): input ignorado se já estiver na borda

### 3.3 Scroll e Aceleração

- Velocidade inicial: **180 px/s**
- Velocidade final (timer=0): **380 px/s**
- A aceleração é linear em relação ao tempo restante — quanto menos tempo, mais rápido o scroll
- O aumento de velocidade é a principal fonte de pressão (substitui a parede vermelha)

### 3.4 Obstáculos de Debuff

Obstáculos aparecem como blocos coloridos em lanes específicas. Quando o squad passa por um bloco (X do player coincide com X do obstáculo, mesma lane), o debuff é aplicado imediatamente.

| Obstáculo | Cor | Efeito | Duração |
|-----------|-----|--------|---------|
| **FUMAÇA** | Cinza escuro | Obscurece os 65% direitos da tela — não dá para ver obstáculos que se aproximam | 2.5s |
| **LENTO** | Azul | Transição entre lanes 3× mais lenta (0.45s em vez de 0.15s) | 3.0s |
| **FAÍSCA** | Âmbar | Dano periódico de 8 HP a cada 0.5s enquanto na lane; encerra ao sair da lane | Até sair |
| **EMP** | Violeta | Inverte os controles: toque no topo desce, toque na base sobe | 2.0s |
| **TEIA** | Vermelho | Bloqueia qualquer troca de lane | 1.5s |

**Stacking**: apenas um debuff ativo por vez. Um novo debuff do mesmo tipo reinicia o timer (sem stack).

#### Padrões de Spawn de Obstáculos

O sistema sorteia um padrão por wave:

| Padrão | Descrição |
|--------|-----------|
| Lane única | 1 obstáculo em lane aleatória — dodge trivial |
| Dupla adjacente | 2 obstáculos em lanes consecutivas — requer movimento de 2 lanes |
| Tríplice escalonada | 3 obstáculos em lanes separadas por 2, espaçados em X — forçam 2 movimentos rápidos |
| Muro com corredor | 4–5 lanes bloqueadas, 3 consecutivas livres — obriga a estar no corredor certo |
| Dois pares | Dois blocos duplos adjacentes em X diferente — 2 esquivas em sequência |
| Muro com saída única | 6 lanes bloqueadas, 1 livre — leitura imediata crítica |

A frequência de waves começa em **1.8s** e diminui para **0.85s** conforme o timer corre.

### 3.5 Canisters

- 65% das waves spawnam um canister adicional em lane aleatória, com offset de X diferente dos obstáculos
- 12% dos canisters são do tipo **+T** (ícone azul ciano) — adicionam 10s ao timer e não ocupam slot de mochila
- Coleta é **instantânea por proximidade** (raio 24px) — passar pela lane correta = coletado
- Mochila cheia: canisters de combustível são ignorados silenciosamente; canisters +T sempre funcionam

### 3.6 Squad e Dano

- O squad mantém a formação padrão ao redor do líder no ponto do player
- HP dos personagens: padrão (Guardian 200, Striker 120, Artificer 100, Medic 80)
- Dano vem exclusivamente da **FAÍSCA** (8 HP por tick, 0.5s)
- Não há drones ou inimigos ativos nesta versão — os obstáculos são os únicos perigos
- Todos mortos = fail state

---

## 4. Formulas

### Velocidade de Scroll

```
t_ratio = 1 - (timer_atual / timer_inicial)

scroll_speed = lerp(180.0, 380.0, t_ratio)

Aos 60s restantes (início): 180 px/s
Aos 30s restantes:          280 px/s
Aos 10s restantes:          347 px/s
Aos 0s (fim):               380 px/s
```

### Intervalo de Spawn de Waves

```
spawn_interval = lerp(1.8, 0.85, t_ratio)

Início: 1 wave a cada 1.8s
Metade: 1 wave a cada 1.325s
Final:  1 wave a cada 0.85s

Obstáculos totais por run (estimativa):
  Média = 60s / lerp_media(1.8, 0.85) ≈ 60 / 1.325 ≈ 45 waves
  Média de obstáculos por wave ≈ 2.5 (ponderando padrões)
  Total estimado: ~112 obstáculos por run
```

### Duração de Troca de Lane com Debuff LENTO

```
dur_normal = 0.15s
dur_lento  = 0.15s × 3.0 = 0.45s

Impacto: com 380px/s de scroll e 0.45s de transição,
         o squad percorre ~171px sem conseguir esquivar —
         praticamente garante colisão com obstáculos consecutivos.
```

### Dano de Faísca por Exposição

```
dano_total = (tempo_na_lane_faiscante / 0.5) × 8.0

2s na faísca = 4 ticks × 8 = 32 HP (mata Artificer, deixa Medic a 48)
4s na faísca = 8 ticks × 8 = 64 HP (mata Medic e Artificer)
```

---

## 5. Edge Cases

| Situação | Comportamento |
|----------|---------------|
| Toque no limite de lane (já na 0 ou 6) | Input ignorado; sem feedback visual de erro |
| Toque durante debuff TEIA | Input ignorado; _debuff_lbl mostra o timer restante |
| Toque durante transição em andamento | Transição atual snapa imediatamente para _lane_t; nova transição começa |
| Debuff FAÍSCA: jogador sai da lane antes do timer | Debuff encerra imediatamente ao confirmar a nova lane (_lerp >= 1.0) |
| Debuff EMP + TEIA simultâneos | Apenas o mais recente fica ativo (sem stacking) |
| Canister +T coletado com timer em 0 | Impossível — run encerra ao atingir 0 antes de processar coletas daquele frame |
| Mochila cheia, canister normal passa | Canister é ignorado silenciosamente; sem feedback visual especial |
| Obstáculo spawna na lane atual do player | Hit registrado imediatamente quando a X do obstáculo alcança o player |
| Todos morrem durante debuff FAÍSCA | _end_run(false) tem prioridade; perde todo o combustível |
| Scroll tão rápido que obstáculo "salta" o player em 1 frame | Impossível com _OBS_W_MIN=70px e max 380px/s: a cada frame (60fps) o obstáculo move ~6.3px, menor que a largura |

---

## 6. Dependencies

| Sistema | Relação | Direção |
|---------|---------|---------|
| **Sistema de Mochila** | Combustível ocupa slots; upgrades têm impacto direto na quantidade coletável por run | Zona depende |
| **Sistema de Recursos** | Combustível Volátil é registrado como tipo de recurso; transferido ao hub ao fim | Zona fornece |
| **Foguete (Hub)** | Combustível Volátil alimenta o motor principal | Foguete consome |
| **GameConfig** | `EXTRACTION_*` constantes controlam todos os parâmetros tunáveis externamente | Zona depende |
| **Party / Squad System** | Squad node move-se ao Y do player; personagens têm HP que decai com FAÍSCA | Zona depende |
| **HubState** | Mochila transferida ao hub ao encerrar; backpack_capacity determina limite de coleta | Zona lê e escreve |
| **Zona Hordas** | Zona irmã; compartilha squad e sistema de HP; contraste: Hordas é territorial, Extração é reativa | Relação temática + técnica |

---

## 7. Tuning Knobs

| Parâmetro | Valor Base | Range Seguro | Categoria | Efeito |
|-----------|------------|--------------|-----------|--------|
| `EXTRACTION_SCROLL_START` | 180 px/s | 120–240 | Feel | Velocidade inicial; abaixo de 120 = trivial |
| `EXTRACTION_SCROLL_END` | 380 px/s | 280–480 | Gate | Pico de velocidade; acima de 480 = reação impossível |
| `EXTRACTION_LANE_SWITCH_DUR` | 0.15s | 0.08–0.25 | Feel | Responsividade do input; abaixo de 0.08 = instantâneo |
| `EXTRACTION_SPAWN_IVRL_START` | 1.8s | 1.2–2.5 | Gate | Densidade inicial de obstáculos |
| `EXTRACTION_SPAWN_IVRL_END` | 0.85s | 0.5–1.2 | Gate | Densidade final; abaixo de 0.5 = ilegível |
| `EXTRACTION_DEBUFF_SMOKE` | 2.5s | 1.5–4.0 | Feel | Duração da visão obstruída |
| `EXTRACTION_DEBUFF_SLOW` | 3.0s | 1.5–5.0 | Gate | Janela de vulnerabilidade do LENTO |
| `EXTRACTION_DEBUFF_EMP` | 2.0s | 1.0–3.0 | Feel | Duração da inversão — curto o suficiente pra não frustrar |
| `EXTRACTION_DEBUFF_WIRE` | 1.5s | 0.8–2.5 | Gate | Duração do trava-lane |
| `EXTRACTION_SPARK_TICK` | 0.5s | 0.3–1.0 | Curve | Frequência de dano da faísca |
| `EXTRACTION_SPARK_DMG` | 8.0 HP | 4–15 | Curve | Dano por tick; 8 = 25 ticks para matar Guardian |
| `EXTRACTION_RUN_TIMER` | 60s | 45–90 | Gate | Duração total; define a intensidade da corrida |
| `EXTRACTION_BONUS_TIME` | +10s | +5–+20 | Gate | Valor dos canisters +T |

---

## 8. Acceptance Criteria

**Funcional (pass/fail para QA):**

- [ ] Toque na metade superior da tela move o squad 1 lane para cima
- [ ] Toque na metade inferior da tela move o squad 1 lane para baixo
- [ ] Lane 0 (topo) e lane 6 (base) bloqueiam input na direção da borda
- [ ] Transição de lane dura exatamente 0.15s (0.45s com LENTO ativo)
- [ ] Obstáculo na mesma lane do player aplica debuff ao cruzar o X do player
- [ ] FUMAÇA escurece os 65% direitos da tela por 2.5s
- [ ] LENTO torna a transição 3× mais lenta por 3.0s
- [ ] FAÍSCA causa 8 HP de dano a cada 0.5s enquanto o player estiver na lane; encerra ao sair
- [ ] EMP inverte up/down por 2.0s
- [ ] TEIA bloqueia qualquer input de troca por 1.5s
- [ ] Canister +T adiciona 10s ao timer e não ocupa slot de mochila
- [ ] O timer conta regressivamente e a run encerra com sucesso ao atingir 0
- [ ] Todos os personagens mortos = fail state; mochila perde todo o combustível

**Experiencial (validado por playtest):**

- [ ] Novo jogador entende "toque cima/baixo = muda de lane" nos primeiros 5 segundos sem tutorial
- [ ] Após 2 runs, o jogador começa a ler os obstáculos antes de chegarem (não apenas reagir)
- [ ] Debuff EMP provoca frustração momentânea seguida de risada (não de abandono)
- [ ] A aceleração do scroll nos últimos 15 segundos cria urgência perceptível
- [ ] Uma run completa dura entre 45 e 75 segundos

---

*Relacionado: `design/gdd/game-concept.md`, `design/gdd/resource-system.md`, `design/gdd/mvp-game-brief.md`*
