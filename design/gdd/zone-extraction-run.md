# Corrida de Extração — Game Design Document

**Version**: 2.0
**Date**: 2026-03-23
**Status**: Draft — Lane Runner Redesign

---

## 1. Overview

Lane runner vertical com pressão de timer. O mundo rola da direita para a esquerda automaticamente; o jogador toca a metade superior ou inferior da tela para mover o squad entre 7 lanes. Obstáculos de debuff e canisters de Combustível Volátil aparecem em lanes específicas; o scroll acelera progressivamente ao longo dos 60 segundos de run.

---

## 2. Player Fantasy

Sete tubulações industriais paralelas. Você só escolhe qual. Campos de faísca bloqueiam duas lanes, névoa de fumaça escurece a direita, um pulso de EMP inverte tudo. Você lê os obstáculos meio segundo antes e pressiona — rápido.

**Estética MDA primária**: Challenge (reação rápida a padrões de obstáculos).
**Estética secundária**: Submission (ritmo frenético, scroll acelerado, "só mais uma run").

---

## 3. Detailed Rules

### 3.1 Estrutura da Run

- 7 lanes horizontais; tela portrait 480×854
- Squad parado em X=100; mundo rola automaticamente da direita para a esquerda
- Run encerra por:
  - **Timer = 0** → sucesso; combustível mantido
  - **Todos mortos** → fail state; perde todo o combustível da run
- Sem EXIT voluntário

### 3.2 Input — Toque para Trocar de Lane

| Gesto | Ação |
|-------|------|
| Toque na metade superior | Sobe 1 lane |
| Toque na metade inferior | Desce 1 lane |

- Transição animada: 0.15s (lerp suave)
- Toque durante transição: transição atual snapa; nova começa imediatamente
- Nas bordas (lane 0 e 6): input ignorado

### 3.3 Scroll e Aceleração

- Velocidade inicial: 180 px/s
- Velocidade final (timer=0): 380 px/s
- Aceleração linear em relação ao tempo restante

### 3.4 Obstáculos de Debuff

Debuff aplicado quando o X do obstáculo coincide com o X do player na mesma lane.

| Obstáculo | Cor | Efeito | Duração |
|-----------|-----|--------|---------|
| **FUMAÇA** | Cinza escuro | Obscurece os 65% direitos da tela | 2.5s |
| **LENTO** | Azul | Transição de lane 3× mais lenta (0.45s) | 3.0s |
| **FAÍSCA** | Âmbar | 8 HP de dano a cada 0.5s enquanto na lane | Até sair da lane |
| **EMP** | Violeta | Inverte controles (topo=desce, base=sobe) | 2.0s |
| **TEIA** | Vermelho | Bloqueia qualquer troca de lane | 1.5s |

- Stacking: apenas 1 debuff ativo por vez; novo debuff do mesmo tipo reinicia o timer

#### Padrões de Spawn de Obstáculos

| Padrão | Descrição |
|--------|-----------|
| Lane única | 1 obstáculo em lane aleatória |
| Dupla adjacente | 2 obstáculos em lanes consecutivas |
| Tríplice escalonada | 3 obstáculos separados por 2 lanes, espaçados em X |
| Muro com corredor | 4–5 lanes bloqueadas, 3 consecutivas livres |
| Dois pares | 2 blocos duplos adjacentes em X diferente |
| Muro com saída única | 6 lanes bloqueadas, 1 livre |

Frequência de waves: de 1.8s (início) a 0.85s (fim).

### 3.5 Canisters

- 65% das waves spawnam 1 canister em lane aleatória (offset de X dos obstáculos)
- 12% dos canisters são **+T** (ícone azul ciano): adicionam 10s ao timer; não ocupam slot
- Coleta instantânea por proximidade (raio 24px)
- Mochila cheia: canisters de combustível ignorados silenciosamente; canisters +T sempre funcionam

### 3.6 Squad e Dano

- HP padrão: Guardian 200, Striker 120, Artificer 100, Medic 80
- Dano exclusivamente via FAÍSCA (8 HP por tick a cada 0.5s)
- Sem drones ou inimigos ativos — obstáculos são os únicos perigos
- Todos mortos = fail state

---

## 4. Formulas

### Velocidade de Scroll

```
t_ratio = 1 - (timer_atual / timer_inicial)
scroll_speed = lerp(180.0, 380.0, t_ratio)

60s: 180 px/s | 30s: 280 px/s | 10s: 347 px/s | 0s: 380 px/s
```

### Intervalo de Spawn de Waves

```
spawn_interval = lerp(1.8, 0.85, t_ratio)

Início: 1 wave/1.8s | Metade: 1 wave/1.325s | Final: 1 wave/0.85s
Total estimado: ~45 waves × ~2.5 obs/wave = ~112 obstáculos por run
```

### Duração de Troca com Debuff LENTO

```
dur_normal = 0.15s
dur_lento  = 0.45s

Com 380px/s e 0.45s de transição: squad percorre ~171px sem esquivar
→ praticamente garante colisão com obstáculos consecutivos
```

### Dano de Faísca por Exposição

```
dano_total = (tempo_na_lane / 0.5) × 8.0

2s = 32 HP (mata Artificer, deixa Medic em 48)
4s = 64 HP (mata Medic e Artificer)
```

---

## 5. Edge Cases

| Situação | Comportamento |
|----------|---------------|
| Toque no limite de lane (0 ou 6) | Input ignorado; sem feedback visual |
| Toque durante debuff TEIA | Input ignorado; UI mostra timer restante do debuff |
| Toque durante transição em andamento | Transição atual snapa; nova transição começa |
| FAÍSCA: jogador sai da lane antes do timer | Debuff encerra ao confirmar nova lane (lerp ≥ 1.0) |
| EMP + TEIA simultâneos | Apenas o mais recente fica ativo (sem stacking) |
| Canister +T coletado com timer em 0 | Impossível — run encerra antes de processar coleta |
| Mochila cheia, canister normal passa | Ignorado silenciosamente; sem feedback especial |
| Obstáculo spawna na lane atual do player | Hit registrado quando X do obstáculo alcança o player |
| Todos morrem durante FAÍSCA | fail state tem prioridade; perde todo o combustível |
| Scroll tão rápido que obstáculo "salta" o player em 1 frame | Impossível: _OBS_W_MIN=70px; a 380px/s e 60fps o obstáculo move ~6.3px/frame |

---

## 6. Dependencies

| Sistema | Relação | Direção |
|---------|---------|---------|
| **Sistema de Mochila** | Combustível ocupa slots; upgrades impactam quantidade coletável | Zona depende |
| **Sistema de Recursos** | Combustível Volátil registrado e transferido ao hub ao fim | Zona fornece |
| **Foguete (Hub)** | Combustível Volátil alimenta o motor principal | Foguete consome |
| **GameConfig** | `EXTRACTION_*` constantes controlam todos os parâmetros | Zona depende |
| **Party / Squad System** | Squad move-se ao Y do player; HP decai com FAÍSCA | Zona depende |
| **HubState** | Mochila transferida ao hub ao encerrar; backpack_capacity define limite | Zona lê e escreve |
| **Zona Hordas** | Compartilha squad e sistema de HP; Hordas é territorial, Extração é reativa | Relação técnica + temática |

---

## 7. Tuning Knobs

| Parâmetro | Valor Base | Range Seguro | Categoria | Efeito |
|-----------|------------|--------------|-----------|--------|
| `EXTRACTION_SCROLL_START` | 180 px/s | 120–240 | Feel | Velocidade inicial; <120 = trivial |
| `EXTRACTION_SCROLL_END` | 380 px/s | 280–480 | Gate | Pico; >480 = reação impossível |
| `EXTRACTION_LANE_SWITCH_DUR` | 0.15s | 0.08–0.25 | Feel | Responsividade; <0.08 = instantâneo |
| `EXTRACTION_SPAWN_IVRL_START` | 1.8s | 1.2–2.5 | Gate | Densidade inicial de obstáculos |
| `EXTRACTION_SPAWN_IVRL_END` | 0.85s | 0.5–1.2 | Gate | Densidade final; <0.5 = ilegível |
| `EXTRACTION_DEBUFF_SMOKE` | 2.5s | 1.5–4.0 | Feel | Duração da visão obstruída |
| `EXTRACTION_DEBUFF_SLOW` | 3.0s | 1.5–5.0 | Gate | Janela de vulnerabilidade do LENTO |
| `EXTRACTION_DEBUFF_EMP` | 2.0s | 1.0–3.0 | Feel | Duração da inversão |
| `EXTRACTION_DEBUFF_WIRE` | 1.5s | 0.8–2.5 | Gate | Duração do trava-lane |
| `EXTRACTION_SPARK_TICK` | 0.5s | 0.3–1.0 | Curve | Frequência de dano da faísca |
| `EXTRACTION_SPARK_DMG` | 8.0 HP | 4–15 | Curve | Dano por tick; 8 = 25 ticks para matar Guardian |
| `EXTRACTION_RUN_TIMER` | 60s | 45–90 | Gate | Duração total; define intensidade |
| `EXTRACTION_BONUS_TIME` | +10s | +5–+20 | Gate | Valor dos canisters +T |

---

## 8. Acceptance Criteria

**Funcional (pass/fail para QA):**

- [ ] Toque superior move squad 1 lane para cima; toque inferior move 1 lane para baixo
- [ ] Lane 0 (topo) e lane 6 (base) bloqueiam input na direção da borda
- [ ] Transição de lane dura 0.15s (0.45s com LENTO ativo)
- [ ] Obstáculo na mesma lane aplica debuff ao cruzar o X do player
- [ ] FUMAÇA escurece os 65% direitos por 2.5s
- [ ] LENTO torna a transição 3× mais lenta por 3.0s
- [ ] FAÍSCA causa 8 HP a cada 0.5s enquanto na lane; encerra ao sair
- [ ] EMP inverte up/down por 2.0s
- [ ] TEIA bloqueia input de troca por 1.5s
- [ ] Canister +T adiciona 10s ao timer; não ocupa slot de mochila
- [ ] Timer conta regressivamente; run encerra com sucesso ao atingir 0
- [ ] Todos mortos = fail state; perde todo o combustível da run

**Experiencial (validado por playtest):**

- [ ] Novo jogador entende "toque cima/baixo = muda de lane" nos primeiros 5s sem tutorial
- [ ] Após 2 runs, jogador lê obstáculos antes de chegarem (não apenas reage)
- [ ] Debuff EMP provoca frustração momentânea seguida de risada (não de abandono)
- [ ] Aceleração do scroll nos últimos 15s cria urgência perceptível
- [ ] Run completa dura entre 45 e 75 segundos

---

*Relacionado: `design/gdd/game-concept.md`, `design/gdd/resource-system.md`, `design/gdd/mvp-game-brief.md`*
