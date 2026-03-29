---
tags: [fungineer, game-design, gdd]
date: 2026-03-23
tipo: game-design-doc
---

# Zona de Infecção — Game Design Document

**Version**: 3.0
**Date**: 2026-03-23
**Status**: Revisado — Movimento como Propagação

---

## 1. Overview

Zona de propagação em grafo onde o jogador é o vírus: absorve carga viral de nós infectados e transfere fisicamente para nós neutros adjacentes. 25 nós (3 tipos), sem auto-propagação — a velocidade de expansão é diretamente proporcional à velocidade de movimento do jogador. Objetivo: infectar 80% dos nós em 120s gerando Biomassa Adaptativa passiva; Unidades de Cura revertem nós com resistência variável por tipo.

---

## 2. Player Fantasy

Você não controla a infecção de fora — você é a infecção, carregando o vírus no próprio corpo entre os nós. A satisfação vem de ver o grafo escurecer enquanto você corre entre pontos de luz, tomando decisões de rota a cada 5–10s sob pressão de Healers.

**Estética primária**: Challenge (decisões de rota com custo de tempo real).
**Estética secundária**: Fantasy (ser o agente de uma infecção que só existe enquanto você se move).

---

## 3. Detailed Rules

### 3.1 Estrutura da Run

- Jogador entra sozinho (squad fica na base)
- Mapa: 25 nós em grade 5×5 com jitter posicional (±18px)
- 1 nó inicial já infectado (estável) — ponto de entrada
- Run timer: **120 segundos**
- Vitória antecipada: 80% infectados → run encerra com +25% de Biomassa
- Vitória normal: timer encerra, Biomassa acumulada vai ao hub
- Fail state: 3 hits de Healers → Biomassa da run perdida

### 3.2 Interpretação do Movimento

- **Input**: arrastar o dedo = mover o personagem (padrão do jogo)
- **Parar sobre nó infectado**: absorve carga viral (instantâneo)
- **Parar sobre nó neutro com carga**: transfere infecção em 0.5s
- **Mover sem carga**: deslocamento vazio — rota até próximo nó de recarga
- **Carga viral visível**: anel brilhante ao redor do sprite indica carga ativa

### 3.3 Mecânica Central — Carga Viral

#### Ciclo de Propagação

```
Jogador → Para sobre nó infectado → Absorve carga (instantâneo)
        → Corre até nó neutro vizinho → Para 0.5s → Transfere carga → Nó infectado (estável)
        → Pode absorver novamente do nó recém-infectado → Continua
```

- Jogador carrega **1 carga por vez**
- Absorver de nó infectado **não remove a infecção do nó**
- Todo nó infectado pelo jogador é estável (sem nós instáveis nesta versão)
- Qualidade determinada pelo **tipo do nó**, não pela origem da infecção

#### Restrição de Adjacência

- Transferência só é válida para nós **adjacentes ao nó onde a carga foi absorvida**
- Tentar transferir para nó não-adjacente: carga descartada, nenhum nó infectado
- Arestas de adjacência visíveis no mapa (linhas entre nós)

#### Perda de Carga

- Dano de Healer enquanto carrega → perde a carga (volta ao nó de origem)
- Movimento por 3s sem direção ao destino fora da zona de adjacência → carga descartada (anti-exploit)

### 3.4 Tipos de Nó

| Tipo | Cor Neutro | Cor Infectado | Bio/s | Tempo de Cura | Propriedade |
|------|------------|---------------|-------|---------------|-------------|
| **Padrão** | Cinza | Verde sólido | 0.10/s | 3.0s | Base; equilibrado |
| **Amplificador** | Dourado escuro | Dourado brilhante | 0.30/s | 1.0s | Alto valor, alta fragilidade; Healers priorizam |
| **Âncora** | Azul escuro | Azul sólido | 0.10/s | 8.0s | Bloqueia Healer por 8s; estratégico como isca |

**Distribuição**: ~15% Amplificadores, ~15% Âncoras, ~70% Padrão (25 nós = ~4 Amp, ~4 Anc, ~17 Pad).

### 3.5 Geração de Biomassa

- Nós infectados geram Biomassa passivamente (taxas únicas por tipo: 0.10 / 0.30 / 0.10)
- Amplificadores geram 0.30/s apenas enquanto não curados — Healers os eliminam em 1.0s
- Jogador deve **reinfectar Amplificadores curados** para manter retorno alto

### 3.6 Sobrecarga de Rota

| Nós Infectados | Healers Ativos | Pressão |
|---|---|---|
| < 10 | 1 | Baixa — tempo para planejar |
| 10–17 | 2–3 | Média — Healers competem com o jogador |
| ≥ 18 | 3–4 | Alta — Amplificadores apagados antes do jogador chegar |

### 3.7 Unidades de Cura

- Move para o nó infectado mais próximo; cura durante tempo variável por tipo
- Não podem ser eliminadas pelo jogador
- Contato com jogador: -1 HP + descarta carga viral ativa
- Frequência: 1 (0–40s), 2–3 (40–80s), 3–4 (80–120s)
- Padrão: cura em 3.0s | Amplificador: cura em 1.0s | Âncora: preso por 8.0s
- Healer sobre nó de travessia = barreira de movimento física, não apenas ameaça de HP

---

## 4. Formulas

### Velocidade de Expansão da Rede

```
taxa_expansao = 1 / (tempo_absorcao + tempo_deslocamento + tempo_transferencia)

  tempo_absorcao      = 0s (instantâneo)
  tempo_deslocamento  = 120px / 200px/s = 0.6s (nós adjacentes)
  tempo_transferencia = 0.5s

taxa_minima (adjacentes): 1 / (0 + 0.6 + 0.5) = ~0.91 nós/s
taxa_real (com desvios + Healers): ~0.3–0.6 nós/s estimado

Meta 80% = 20 nós
Tempo mínimo teórico: 20 / 0.91 ≈ 22s
Tempo real estimado (sem otimização): ~50–80s
Buffer até timer: ~40–70s
```

### Biomassa por Run

```
taxa_padrao    = 0.10 bio/s por nó
taxa_amplifier = 0.30 bio/s por nó Amplificador

Cenário A — expansão rápida (20 nós Padrão):
  bio = 10 × 0.10 × 120 = 120 Biomassa

Cenário B — qualidade (12 Padrão + 4 Amplificadores mantidos):
  bio = 12×0.10×90 + 4×0.30×60 = 108 + 72 = 180 Biomassa

Cenário C — misto com Âncoras (10 Padrão + 3 Amp + 4 Âncora):
  bio = (10×0.10 + 3×0.30 + 4×0.10) × 80 = 2.3 × 80 = 184 Biomassa
```

### Reinfecção de Amplificador (ROI)

```
Custo: ~3–5s de rota (ir + absorver + ir + transferir)
Benefício: 0.30 × 20s sobrevivência média = 6 Biomassa por reinfecção
→ ROI positivo sempre que o caminho for curto
```

---

## 5. Edge Cases

| Situação | Comportamento |
|----------|---------------|
| Para sobre nó infectado com carga ativa | Descarta carga atual silenciosamente, absorve carga nova (reset de origem) |
| Tenta transferir para nó não-adjacente | Carga descartada; flash vermelho no indicador |
| Healer chega ao nó no mesmo frame que a transferência | Infecção confirmada (transferência tem prioridade); Healer inicia cura imediatamente |
| Nó de origem curado enquanto jogador carrega carga | Carga permanece válida; adjacência validada topologicamente, não visualmente |
| Jogador com 0 HP toca Healer | Fail state; Biomassa perdida; carga descartada |
| 100% infectados antes de 80% | Vitória antecipada dispara igualmente (+25% Biomassa) |
| Dois nós infectados simultaneamente | Impossível — jogador carrega 1 carga e transfere 1 por vez |
| Âncora bloqueia Healer, outro Healer aparece no caminho | Healer livre move-se normalmente; jogador desvia ou aceita hit |
| Para sobre nó neutro não-adjacente (moveu demais) | Timer de 3s inicia; voltar à zona de adjacência antes dos 3s reseta o timer |
| Vitória antecipada durante transferência em andamento | Run encerra; transferência cancelada se não completou |

---

## 6. Dependencies

| Sistema | Relação | Direção |
|---------|---------|---------|
| **Sistema de Recursos** | Biomassa Adaptativa como recurso de fluxo; taxa variável por tipo | Zona define taxas por tipo |
| **Foguete (Hub)** | Biomassa alimenta suporte de vida do foguete | Foguete consome Biomassa |
| **Hub / Mapa-Mundo** | Acesso via hub | Hub controla acesso |
| **GameConfig** | Todas as constantes numéricas centralizadas | Zona lê de GameConfig |
| **Sistema de HP** | Jogador tem 3 HP nesta zona | Zona configura via `GameConfig.INFECTION_PLAYER_HP` |
| **Sistema de Carga Viral** | Estado de carga (vazia/cheia), indicador visual, timer de descarte, validação de adjacência | Zona define e cria o sistema |
| **Sistema de Grafo de Adjacência** | Topologia definida na geração do mapa; valida transferências | Zona depende de grafo com adjacência mapeada |
| **Zona Campo de Controle** | Ambas usam recursos de fluxo; abstração de "fluxo acumulado" compartilhada | Dependência de sistema compartilhado |

---

## 7. Tuning Knobs

| Parâmetro | Valor Base | Range Seguro | Efeito |
|-----------|------------|--------------|--------|
| `INFECTION_RUN_TIMER` | 120s | 90–150s | Duração da run |
| `INFECTION_TRANSFER_TIME` | 0.5s | 0.3–1.0s | Tempo para infectar nó neutro |
| `INFECTION_CHARGE_DISCARD_TIMER` | 3s | 2–5s | Tempo antes de perder carga por movimento sem destino |
| `INFECTION_BIOMASS_RATE_PADRAO` | 0.10/s | 0.05–0.20 | Bio por nó padrão |
| `INFECTION_BIOMASS_RATE_AMPLIFIER` | 0.30/s | 0.20–0.50 | Bio por Amplificador; alto o suficiente para justificar reinfecção |
| `INFECTION_BIOMASS_RATE_ANCORA` | 0.10/s | 0.05–0.15 | Bio por Âncora; valor estratégico é o bloqueio de Healer |
| `INFECTION_CURE_TIME_PADRAO` | 3.0s | 2–5s | Resistência nó padrão |
| `INFECTION_CURE_TIME_AMPLIFIER` | 1.0s | 0.5–2.0s | Fragilidade Amplificador |
| `INFECTION_CURE_TIME_ANCORA` | 8.0s | 5–12s | Resistência Âncora; define valor estratégico da isca |
| `INFECTION_HEALER_COUNT_MID` | 2–3 | 1–4 | Healers ativos na fase intermediária |
| `INFECTION_HEALER_COUNT_LATE` | 3–4 | 2–5 | Healers ativos na fase final |
| `INFECTION_PCT_AMPLIFIERS` | 0.15 | 0.10–0.25 | Proporção de Amplificadores no grafo |
| `INFECTION_PCT_ANCORA` | 0.15 | 0.10–0.25 | Proporção de Âncoras no grafo |
| `INFECTION_VICTORY_PCT` | 80% | 70–90% | Meta de infecção para vitória antecipada |
| `INFECTION_EARLY_WIN_BONUS` | 25% | 15–35% | Bônus de Biomassa por vitória antecipada |

---

## 8. Acceptance Criteria

**Funcional (pass/fail):**

- [ ] Parar sobre nó infectado absorve carga instantaneamente (indicador aparece)
- [ ] Parar 0.5s sobre nó neutro **adjacente à origem** com carga → nó infectado estável
- [ ] Parar sobre nó neutro **não-adjacente** com carga → carga descartada (flash vermelho)
- [ ] Nó infectado gera taxa correta por tipo (0.10 / 0.30 / 0.10)
- [ ] Healer toca jogador: -1 HP + carga descartada se ativa
- [ ] Healer cura Padrão em 3.0s, Amplificador em 1.0s, Âncora em 8.0s
- [ ] Âncora retém Healer por 8.0s completos antes de re-alvejar
- [ ] 80% de nós infectados → vitória antecipada com +25% Biomassa
- [ ] 3 hits de Healer → fail; Biomassa da run perdida
- [ ] Carga descartada automaticamente após 3s de movimento sem adjacência ao nó de origem

**Experiencial (playtest):**

- [ ] Novo jogador entende o ciclo "absorver → mover → transferir" sem tutorial (feedback visual suficiente)
- [ ] Após 2 runs, jogador entende que vale reinfectar Amplificadores ativamente
- [ ] Jogador reporta sentir-se "parte da rede" em vez de "controlando a rede de fora"
- [ ] Usar Âncoras como isca é descoberto organicamente após 3–4 runs
- [ ] Corrida para reinfectar Amplificador antes do Healer = momento de alta tensão percebido
- [ ] Decisão de rota de expansão ocorre naturalmente a cada 5–10s de run

---

*Relacionado: `design/gdd/game-concept.md`, `design/gdd/resource-system.md`, `design/gdd/zone-stealth.md`, `design/gdd/zone-field-control.md`*
