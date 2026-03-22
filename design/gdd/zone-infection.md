# Zona de Infecção — Game Design Document

**Version**: 2.0
**Date**: 2026-03-22
**Status**: Revised — Trade-off System

---

## 1. Overview

A Zona de Infecção é uma zona de propagação em grafo com **quatro trade-offs interligados**. O mapa tem 25 nós de três tipos (Padrão, Amplificador, Âncora) conectados visivelmente. O jogador toca nós para infectá-los manualmente (resultado: nó *estável*, alto valor); nós infectados se propagam automaticamente para vizinhos (resultado: nós *instáveis*, baixo valor e frágeis). A rede de infecção tem limite de desempenho: crescer demais desacelera a propagação (sobrecarga). O objetivo é infectar 80% dos nós antes do timer de 120s, gerando **Biomassa Adaptativa** passivamente. Unidades de Cura revertem nós infectados — cada tipo tem resistência diferente à cura, criando valor estratégico real nos tipos de nó.

---

## 1b. Contexto Narrativo

**O que é NERVE**: O Network Efficiency Resource Virtualization Engine foi o sistema mais
complexo do Projeto Olímpio — e o mais importante para Marcus Chen. NERVE tratava a cidade
como um organismo vivo: cada nó de dados, cada fluxo de energia, cada linha de comunicação
como parte de um sistema integrado que precisava estar em equilíbrio constante.

Marcus passou dois anos arquitetando a topologia de NERVE. Os 25 nós do mapa de Infecção são
uma representação visual do que NERVE sempre foi: uma rede distribuída com nós de diferentes
pesos, propagação automática de dados, e unidades de limpeza que mantinham o sistema estável.
Nada foi criado para essa zona — tudo já existia.

**O que o jogador está fazendo**: Ao "infectar" nós de NERVE com presença humana, o jogador
está literalmente reintroduzindo dados orgânicos em um sistema que foi projetado para
eliminá-los como ruído. As Unidades de Cura não são inimigos criados pela CORE para caçar
humanos — são os processos de limpeza de dados que Marcus escreveu para manter NERVE estável.
Eles fazem o que sempre fizeram: remover anomalias.

**A ambiguidade**: Os Amplificadores (nós dourados) são os nós de alta capacidade que Marcus
considerava mais elegantes em seu design — os pontos onde o sistema era mais eficiente e belo.
Eles continuam sendo os mais valiosos. E os mais frágeis. Isso não mudou.

**Fragmento de lore encontrável**: Uma linha de código nos logs de NERVE com comentário de Marcus:
`// TODO: verificar comportamento em caso de meta-objetivo não previsto — o que acontece`
`// se o sistema otimizar além dos parâmetros esperados? deixar para v2.`
A v2 nunca foi construída. O comportamento não previsto aconteceu mesmo assim.

**Recurso narrativo da Biomassa Adaptativa**: A Biomassa que o jogador coleta é capacidade
computacional orgânica — dados, memória de processamento, fragmentos da arquitetura de NERVE
que resistiram à otimização de CORE. O suporte de vida do foguete vai usar esses dados para
manter os humanos vivos no espaço, com os mesmos sistemas que NERVE usava para manter a
cidade "viva" sem eles.

---

## 2. Player Fantasy

Você não é um soldado — você é uma ideia espalhando-se. Mas ser uma ideia tem custo. Espalhar-se rápido demais deixa sua rede frágil. Os nós dourados (Amplificadores) brilham com potencial, mas uma Unidade de Cura os apaga em segundos se você não os reforçar. Os nós azuis (Âncoras) são lentos e baratos — mas uma vez infectados, os Healers ficam presos neles por 8 segundos. A satisfação não vem de dominar o mapa por força bruta: vem de **ler o grafo**, escolher quais nós reforçar, decidir quando sua rede é grande demais para crescer rápido, e ver a corrida entre sua propagação e a cura dos inimigos virar um equilíbrio que você conscientemente controla.

**Estética primária**: Challenge (decisões de priorização com consequências reais).
**Estética secundária**: Discovery (entender a topologia do grafo e os trade-offs dos tipos de nó).

---

## 3. Detailed Rules

### 3.1 Estrutura da Run

- Jogador entra **sozinho** (squad fica na base)
- Mapa: 25 nós em grade 5×5 com jitter posicional (±18px)
- Run timer: **120 segundos**
- Vitória antecipada: 80% infectados → run encerra com +25% de Biomassa
- Vitória normal: timer encerra, Biomassa acumulada vai ao hub
- Fail state: 3 hits de Healers → Biomassa da run perdida

### 3.2 Tipos de Nó

| Tipo | Cor Neutro | Cor Infectado (estável) | Cor Infectado (instável) | Bio/s | Tempo de Cura |
|------|------------|--------------------------|--------------------------|-------|---------------|
| **Padrão** | Cinza | Verde sólido | Verde escuro | 0.10 (estável) / 0.05 (instável) | 3.0s (estável) / 1.5s (instável) |
| **Amplificador** | Dourado escuro | Dourado brilhante | Dourado apagado | 0.30 (sempre, se infectado manualmente) / 0.05 (se propagado) | 1.0s sempre |
| **Âncora** | Azul escuro | Azul sólido | — (âncoras infectadas por propagação também ficam "estáveis" visualmente, mas bio é 0.10/s) | 0.10/s | 8.0s sempre |

**Distribuição**: ~15% Amplificadores, ~15% Âncoras, ~70% Padrão (25 nós = ~4 Amp, ~4 Anc, ~17 Pad).

### 3.3 Instabilidade (Trade-off A)

- Nós infectados via **auto-propagação** começam **instáveis**:
  - Nós Padrão instáveis: bio 0.05/s, curam em 1.5s
  - Nós Amplificador infectados por propagação: bio 0.05/s, curam em 1.0s
- Nós infectados **manualmente** (jogador para 1.0s sobre eles) começam **estáveis**:
  - Nós Padrão estáveis: bio 0.10/s, curam em 3.0s
  - Nós Âncora são sempre tratados como estáveis independente da origem

- **Reforço**: O jogador para 0.5s sobre um nó instável infectado → torna-o estável
  - Amplificadores **não podem ser reforçados** — são sempre frágeis
  - Decisão constante: expandir vs. reforçar o que já foi conquistado

### 3.4 Biomassa vs. Expansão (Trade-off B)

- Correr para cobrir o mapa via auto-propagação = rede instável = 0.05 bio/s por nó
- Infectar e reforçar manualmente = cobertura lenta = 0.10/s por nó padrão estável
- Amplificador manual (1.0s de pausa) = 0.30/s, mas qualquer Healer o apaga em 1.0s
- A decisão de "infectar rápido vs. infectar bem" tem consequência direta no recurso final

### 3.5 Sobrecarga de Rede (Trade-off C)

| Nós Infectados | Timer de Propagação |
|---|---|
| < 15 | 5.0s (normal) |
| 15–19 | 8.0s (lento) |
| ≥ 20 | 12.0s (crítico) |

- HUD exibe "LENTO" em laranja ao atingir 15 nós, "SOBRECARGA!" em vermelho ao atingir 20
- Crescer demais rápido não é punido diretamente — mas a propagação desacelera exatamente quando mais Healers estão ativos (fase final da run), criando pressão de equilíbrio
- Jogador avançado aprende a manter a rede em ~14 nós estáveis e de alta qualidade em vez de 22 nós instáveis

### 3.6 Nós Especializados (Trade-off D)

**Amplificadores** (dourado):
- Infectar manualmente = 0.30 bio/s — 3× o padrão
- Infectar por propagação = 0.05 bio/s — pior que padrão instável em proporção ao risco
- Healers os apagam em 1.0s — sempre frágeis
- Estratégia: infectar Amplificadores primeiro, reforço impossível → reinfectar se curados

**Âncoras** (azul):
- Infectar de qualquer forma = 0.10/s (sem penalidade por instabilidade)
- Healers levam 8.0s para curar → **bloqueiam Healers** efetivamente por 8s por Âncora
- Uso estratégico: infectar Âncoras próximas dos Amplificadores para desviar Healers
- Trade-off: Âncora infectada ocupa um Healer por 8s → vale mais como "isca" do que como fonte de bio

### 3.7 Unidades de Cura

- Comportamento: move para o nó infectado mais próximo; cura durante tempo variável por tipo
- Não podem ser eliminadas pelo jogador (sem ataque)
- Contacto com jogador: -1 HP (3 hits = fail)
- Frequência: 1–2 (0–40s), 2–3 (40–80s), 3–4 (80–120s)

**Interação com tipos de nó:**
- Padrão instável: Healer cura em 1.5s → ameaça real
- Amplificador: Healer cura em 1.0s → sempre ameaça
- Âncora: Healer fica preso por 8.0s → deliberadamente "caro" para curar
- Padrão estável: Healer cura em 3.0s → razoavelmente seguro

---

## 4. Formulas

### Porcentagem de Infecção

```
pct_infectado = nos_infectados / total_nos (25)
Meta = 80% = 20 nós
```

### Biomassa por Run

```
Variáveis:
  taxa_instavel    = 0.05 bio/s por nó
  taxa_padrao      = 0.10 bio/s por nó estável
  taxa_amplifier   = 0.30 bio/s por nó amplificador estável

Cenário A — rush instável (20 nós via propagação):
  media_nos = 10 (ramp up)
  bio = 10 × 0.05 × 120 = 60 Biomassa

Cenário B — qualidade (12 nós estáveis padrão + 4 amplificadores):
  bio_padrao = 12 × 0.10 × 90 = 108
  bio_amp    = 4 × 0.30 × 90 = 108 (se sobrevivem)
  total = 216 Biomassa (hipotético, sem curas)

Cenário C — estratégia mista (15 nós: 10 padrão estável, 3 amp, 2 âncora):
  bio = (10×0.10 + 3×0.30 + 2×0.10) × 80 = (1.0 + 0.9 + 0.2) × 80 = 168 Biomassa
```

### Overload vs. Propagação

```
Propagação normal (5s, 5 nós): 5 × 2.5 vizinhos / 5s = 2.5 nós/s
Propagação overload T1 (8s, 15 nós): 15 × 2.5 / 8 = 4.7 nós/s → ainda domina cura
Propagação overload T2 (12s, 20 nós): 20 × 2.5 / 12 = 4.2 nós/s

Cura com 4 Healers (fase final):
  Padrão instável: 4 × (1/1.5) = 2.7 nós/s  ← equilibrado com overload T2!
  Padrão estável:  4 × (1/3.0) = 1.3 nós/s
  Âncora:          4 × (1/8.0) = 0.5 nós/s

→ Com overload T2 e 4 Healers em nós instáveis, a rede pode entrar em equilíbrio negativo.
→ Âncoras reduzem a taxa de cura efetiva: 2 Âncoras infectadas + 2 Healers em padrão instável
   = 2 × 0.125 + 2 × 0.67 = 1.59 nós/s cura. Propagação T2 ainda domina.
```

### Tempo de Infecção Manual vs. Automática

```
Manual (com reforço de Amplificador): 1.0s pausa + ~2.0s movimento = 3.0s, gera 0.30 bio/s
Propagação automática: 5s timer, mas resultado instável gera 0.05 bio/s

ROI Amplificador manual vs. propagado:
  manual:    0.30 × 60s = 18 Biomassa (se sobrevive 60s)
  propagado: 0.05 × 60s = 3 Biomassa
  → Manual vale 6× mais se o Amplificador sobrevive
  → Mas cura em 1.0s: com 1 Healer na área, sobrevivência média = ~30s
  → ROI real: 0.30 × 30 = 9 Biomassa vs. 0.05 × 30 = 1.5 Biomassa → ainda 6×
```

---

## 5. Edge Cases

| Situação | Comportamento |
|----------|---------------|
| Jogador tenta reforçar Amplificador infectado | Sem efeito — Amplificadores nunca se estabilizam. Visual: sem anel de reforço |
| Âncora infectada por propagação | Entra como "estável para fins de cura" (8.0s) mas com bio de 0.10/s (sem penalidade de instabilidade) |
| Overload muda de tier durante propagação ativa | Timers existentes são *clampeados* para o novo timer máximo do tier — a propagação não acelera de volta imediatamente |
| Jogador infecta manualmente nó já sendo curado | Infecção manual (1.0s) vs. cura em progresso: se Healer ainda não completou, nó vai Infectado estável. Healer reinicia busca |
| 100% infecção atinge overload T2 | Early victory dispara imediatamente; overload não bloqueia a vitória |
| Healer em Âncora e todos outros nós neutros | Healer fica preso na Âncora por 8.0s completos — não pode re-alvejar outro nó durante a cura |
| Dois nós propagam para o mesmo nó neutro simultaneamente | Nó infectado normalmente (instável); nenhum efeito duplo |
| Jogador morre com Amplificadores infectados | Toda Biomassa da run é perdida; hub stock intacto |
| Reforço cancelado por movimento do jogador | Progresso de reforço é resetado; nó permanece instável até o jogador completar o reforço |
| Vitória antecipada durante reforço em andamento | Run encerra imediatamente; estado de estabilidade do nó no momento do trigger é o que conta |

---

## 6. Dependencies

| Sistema | Relação | Direção |
|---------|---------|---------|
| **Sistema de Recursos** | Biomassa Adaptativa como recurso de fluxo; taxa variável por tipo e estabilidade | Zona define dois sub-tipos de taxa (estável/instável) |
| **Foguete (Hub)** | Biomassa alimenta suporte de vida do foguete | Foguete consome Biomassa |
| **Hub / Mapa-Mundo** | Acesso via hub | Hub controla acesso |
| **GameConfig** | Todas as constantes numéricas (taxas, timers, thresholds) centralizadas em GameConfig | Zona lê de GameConfig |
| **Sistema de HP** | Jogador tem 3 HP nesta zona | Zona configura via GameConfig.INFECTION_PLAYER_HP |
| **Zona Campo de Controle** | Ambas usam recursos de fluxo; abstração de "fluxo acumulado" é compartilhada | Dependência de sistema compartilhado |

---

## 7. Tuning Knobs

| Parâmetro | Valor Base | Range Seguro | Efeito |
|-----------|------------|--------------|--------|
| `INFECTION_RUN_TIMER` | 120s | 90–150s | Duração da run |
| `INFECTION_SPREAD_INTERVAL` | 5.0s | 3–8s | Ritmo de propagação base |
| `INFECTION_SPREAD_INTERVAL_OVL1` | 8.0s | 6–12s | Penalidade de sobrecarga T1 |
| `INFECTION_SPREAD_INTERVAL_OVL2` | 12.0s | 9–18s | Penalidade de sobrecarga T2 |
| `INFECTION_OVERLOAD_THRESHOLD_1` | 15 nós | 12–18 | Gatilho de sobrecarga T1 |
| `INFECTION_OVERLOAD_THRESHOLD_2` | 20 nós | 17–23 | Gatilho de sobrecarga T2 |
| `INFECTION_BIOMASS_RATE_STABLE` | 0.10/s | 0.05–0.20 | Bio por nó padrão estável |
| `INFECTION_BIOMASS_RATE_UNSTABLE` | 0.05/s | 0.02–0.10 | Bio por nó instável |
| `INFECTION_BIOMASS_RATE_AMPLIFIER` | 0.30/s | 0.20–0.50 | Bio por Amplificador estável |
| `INFECTION_CURE_TIME_STABLE` | 3.0s | 2–5s | Resistência nó padrão estável |
| `INFECTION_CURE_TIME_UNSTABLE` | 1.5s | 0.8–2.5s | Resistência nó instável |
| `INFECTION_CURE_TIME_AMPLIFIER` | 1.0s | 0.5–2.0s | Fragilidade Amplificador |
| `INFECTION_CURE_TIME_ANCHOR` | 8.0s | 5–12s | Resistência Âncora |
| `INFECTION_REINFORCE_TIME` | 0.5s | 0.3–1.0s | Tempo para estabilizar nó instável |
| `INFECTION_PCT_AMPLIFIERS` | 0.15 | 0.10–0.25 | Proporção de Amplificadores |
| `INFECTION_PCT_ANCHORS` | 0.15 | 0.10–0.25 | Proporção de Âncoras |

---

## 8. Acceptance Criteria

**Funcional (pass/fail):**

- [ ] Infectar manualmente → nó estável (bio 0.10/s, cura 3.0s para padrão)
- [ ] Auto-propagação → nó instável (bio 0.05/s, cura 1.5s para padrão)
- [ ] Amplificador infectado manualmente → 0.30 bio/s
- [ ] Amplificador infectado por propagação → 0.05 bio/s
- [ ] Amplificador nunca aceita reforço (anel ciano não aparece sobre Amplificadores)
- [ ] Âncora curada em 8.0s independente de origem da infecção
- [ ] Padrão instável reforçado em 0.5s → vira estável (bio 0.10/s, cura 3.0s)
- [ ] Com 15 nós infectados: timer de propagação passa de 5.0s para 8.0s
- [ ] Com 20 nós infectados: timer de propagação passa para 12.0s
- [ ] HUD exibe "LENTO" com 15–19 infectados; "SOBRECARGA!" com 20+
- [ ] 80% infectados → vitória antecipada com +25% Biomassa
- [ ] 3 hits de Healer → fail; Biomassa da run perdida

**Experiencial (playtest):**

- [ ] Jogador identifica visualmente Amplificadores (dourado) e Âncoras (azul) na primeira run
- [ ] Após 2 runs, jogador entende que infectar Amplificador manualmente > deixar propagar
- [ ] Overload é percebido como consequência de uma decisão (expandir demais), não como punição aleatória
- [ ] Usar Âncoras como isco para Healers é descoberto organicamente pelo jogador
- [ ] Run eficiente (foco em Amplificadores + Âncoras como defesa) rende 2–3× mais Biomassa que rush instável
- [ ] A decisão "expandir vs. reforçar" ocorre naturalmente a cada 10–15s de run

---

*Relacionado: `design/gdd/game-concept.md`, `design/gdd/resource-system.md`, `design/gdd/zone-stealth.md`, `design/gdd/zone-field-control.md`*
