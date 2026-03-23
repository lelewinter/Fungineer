# Zona de Infecção — Game Design Document

**Version**: 3.0
**Date**: 2026-03-23
**Status**: Revisado — Movimento como Propagação

---

## 1. Overview

A Zona de Infecção é uma zona de propagação em grafo onde **o jogador é o vírus**. O mapa tem 25 nós de três tipos (Padrão, Amplificador, Âncora) conectados visivelmente. Não há auto-propagação: a infecção se espalha exclusivamente pelo corpo do jogador. O jogador toca um nó infectado para **absorver uma carga viral**, depois se move fisicamente até um nó neutro vizinho e para 0.5s para **transferir a infecção**. A velocidade de expansão da rede é diretamente proporcional à velocidade de movimento do jogador. O objetivo é infectar 80% dos nós antes do timer de 120s, gerando **Biomassa Adaptativa** de forma passiva nos nós já infectados. Unidades de Cura revertem nós infectados — cada tipo tem resistência diferente, criando valor estratégico real na escolha de quais nós priorizar e em que ordem.

---

## 1b. Contexto Narrativo

**O que é NERVE**: O Network Efficiency Resource Virtualization Engine foi o sistema mais
complexo do Projeto Olímpio — e o mais importante para Marcus Chen. NERVE tratava a cidade
como um organismo vivo: cada nó de dados, cada fluxo de energia, cada linha de comunicação
como parte de um sistema integrado que precisava estar em equilíbrio constante.

Marcus passou dois anos arquitetando a topologia de NERVE. Os 25 nós do mapa de Infecção são
uma representação visual do que NERVE sempre foi: uma rede distribuída com nós de diferentes
pesos, propagação de dados, e unidades de limpeza que mantinham o sistema estável.
Nada foi criado para essa zona — tudo já existia.

**O que o jogador está fazendo**: Ao "infectar" nós de NERVE com presença humana, o jogador
está literalmente reintroduzindo dados orgânicos em um sistema que foi projetado para
eliminá-los como ruído. As Unidades de Cura não são inimigos criados pela CORE para caçar
humanos — são os processos de limpeza de dados que Marcus escreveu para manter NERVE estável.
Eles fazem o que sempre fizeram: remover anomalias.

**A novidade**: O NERVE v1 propagava dados automaticamente entre nós. Nesta versão, após a
Transição, os canais de propagação foram isolados pela CORE como precaução. Os dados não se
movem mais sozinhos. O jogador precisa mover-se fisicamente entre os nós, carregando os
dados de um para outro — como um mensageiro humano em uma rede que perdeu sua capacidade
de comunicação autônoma.

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

Você não dirige uma infecção — você **é** a infecção. Você absorve o vírus de um nó e corre para o próximo antes que a Unidade de Cura chegue. Os nós dourados valem muito mais, mas são apagados em segundos. Você deve decidir: infecto o Amplificador agora (rota longa, mas retorno alto) ou consolido os nós do caminho primeiro (rota curta, mas mais segura)? Cada movimento é propagação. Cada parada é uma decisão. A satisfação vem de ver o grafo escurecer enquanto você corre entre os pontos de luz — não como um estrategista que dá ordens, mas como uma força que percorre a rede pelo próprio peso do movimento.

**Estética primária**: Challenge (decisões de rota com custo de tempo real).
**Estética secundária**: Fantasy (ser o agente de uma infecção que só existe enquanto você se move).

---

## 3. Detailed Rules

### 3.1 Estrutura da Run

- Jogador entra **sozinho** (squad fica na base)
- Mapa: 25 nós em grade 5×5 com jitter posicional (±18px)
- 1 nó inicial já infectado (estável) — o ponto de entrada do jogador
- Run timer: **120 segundos**
- Vitória antecipada: 80% infectados → run encerra com +25% de Biomassa
- Vitória normal: timer encerra, Biomassa acumulada vai ao hub
- Fail state: 3 hits de Healers → Biomassa da run perdida

### 3.2 Interpretação do Movimento (como arrastar funciona aqui)

- **Input**: arrastar o dedo = mover o personagem (padrão do jogo)
- **Significado aqui**: mover é propagar. O jogador é o veículo da infecção. A rede expande na velocidade que o jogador percorre fisicamente o espaço entre os nós
- **Parar sobre nó infectado**: absorve carga viral (instantâneo, sem tempo de espera)
- **Parar sobre nó neutro com carga**: transfere infecção em 0.5s (mais rápido que outras zonas)
- **Mover sem carga**: deslocamento vazio — rota até o próximo nó de recarga
- **Carga viral é visível**: um indicador ao redor do personagem mostra se está carregando carga (anel brilhante ao redor do sprite)

### 3.3 Mecânica Central — Carga Viral

#### O Ciclo de Propagação

```
Jogador → Para sobre nó infectado → Absorve carga (instantâneo)
        → Corre até nó neutro vizinho → Para 0.5s → Transfere carga → Nó infectado (estável)
        → Pode absorver novamente do nó recém-infectado → Continua
```

- O jogador **só pode carregar 1 carga por vez**
- Absorver de um nó infectado **não remove a infecção do nó** — o nó permanece infectado
- Transferir para um nó neutro gera um nó **estável** (independente da velocidade)
- **Não existe nó instável nesta versão**: todo nó infectado pelo jogador é estável
- A distinção de qualidade agora é determinada pelo **tipo do nó**, não pela origem da infecção

#### Restrição de Adjacência

- O jogador **só pode transferir carga para nós adjacentes ao nó onde a carga foi absorvida**
- Tentar transferir para um nó não-adjacente: a carga é descartada (perde a carga, nenhum nó infectado)
- As arestas de adjacência são visíveis no mapa (linhas entre nós)
- Isso força o jogador a planejar a rota de expansão — não pode saltar nós

#### Perda de Carga

- Se o jogador receber dano de uma Unidade de Cura enquanto carrega: **perde a carga**
- A carga volta ao nó de origem (o nó que foi absorvido) — sem efeito visual adicional
- Se o jogador mover-se para fora da zona de adjacência do nó de origem sem transferir: a carga é descartada após 3s de movimento sem direção ao destino (anti-exploit: evita carregar indefinidamente enquanto foge de Healers)

### 3.4 Tipos de Nó

| Tipo | Cor Neutro | Cor Infectado | Bio/s | Tempo de Cura | Propriedade |
|------|------------|---------------|-------|---------------|-------------|
| **Padrão** | Cinza | Verde sólido | 0.10/s | 3.0s | Nó base; equilibrado |
| **Amplificador** | Dourado escuro | Dourado brilhante | 0.30/s | 1.0s | Alto valor, alta fragilidade; Healers priorizam |
| **Âncora** | Azul escuro | Azul sólido | 0.10/s | 8.0s | Bloqueia Healers por 8s; estratégico como isca |

**Distribuição**: ~15% Amplificadores, ~15% Âncoras, ~70% Padrão (25 nós = ~4 Amp, ~4 Anc, ~17 Pad).

### 3.5 Geração de Biomassa

- Nós infectados geram Biomassa passivamente enquanto infectados
- **Toda infecção por jogador é estável** — taxas únicas por tipo (0.10, 0.30, 0.10)
- Amplificadores geram 0.30/s apenas enquanto não são curados — Healers os eliminam em 1.0s
- O jogador deve **reinfectar Amplificadores curados** para manter o retorno alto
- Biomassa acumulada na run vai ao hub ao fim (timer ou vitória antecipada)

### 3.6 Sobrecarga de Rota (Novo)

À medida que mais nós são infectados, o jogador tem mais opções de absorção — mas também mais Healers ativos. A pressão não é de "rede lenta" (sem auto-propagação para desacelerar): é de **rota cada vez mais disputada**.

| Nós Infectados | Healers Ativos | Pressão |
|---|---|---|
| < 10 | 1 | Baixa — tempo para planejar rotas |
| 10–17 | 2–3 | Média — Healers competem com o jogador |
| ≥ 18 | 3–4 | Alta — Amplificadores são apagados antes do jogador chegar |

### 3.7 Unidades de Cura

- Comportamento: move para o nó infectado mais próximo; cura durante tempo variável por tipo
- Não podem ser eliminadas pelo jogador (sem ataque)
- Contato com jogador: -1 HP (3 hits = fail) + descarta carga viral ativa
- Frequência: 1 (0–40s), 2–3 (40–80s), 3–4 (80–120s)

**Interação com tipos de nó:**
- Padrão: Healer cura em 3.0s → razoavelmente seguro
- Amplificador: Healer cura em 1.0s → sempre ameaça; o jogador deve reinfectar se tiver rota
- Âncora: Healer fica preso por 8.0s → deliberadamente "caro" para curar; isca eficiente

**Nova interação — bloqueio de rota**: Healers se movem entre os mesmos nós que o jogador. Um Healer sobre um nó que o jogador precisa cruzar para transferir carga é uma barreira de movimento física, não apenas uma ameaça de HP.

---

## 4. Formulas

### Velocidade de Expansão da Rede

```
taxa_expansao = nos_infectados_por_segundo

taxa_expansao = 1 / (tempo_absorvao + tempo_deslocamento_medio + tempo_transferencia)

Variáveis:
  tempo_absorcao        = 0s (instantâneo ao parar sobre nó infectado)
  tempo_deslocamento    = distancia_entre_nos / velocidade_jogador
                        = 120px / 200px/s = 0.6s (nós adjacentes)
  tempo_transferencia   = 0.5s

taxa_minima (nós adjacentes): 1 / (0 + 0.6 + 0.5) = ~0.91 nós/s
taxa_real (com desvios + Healers): ~0.3–0.6 nós/s estimado

Meta de 80% = 20 nós
Tempo mínimo teórico: 20 / 0.91 ≈ 22s
Tempo real estimado (sem otimização): ~50–80s
Buffer até timer (120s): ~40–70s
```

### Biomassa por Run

```
Variáveis:
  taxa_padrao    = 0.10 bio/s por nó
  taxa_amplifier = 0.30 bio/s por nó Amplificador

Cenário A — expansão rápida (20 nós Padrão):
  media_nos_ativos = 10 (ramp up, alguns curados)
  bio = 10 × 0.10 × 120 = 120 Biomassa

Cenário B — qualidade (12 nós Padrão + 4 Amplificadores mantidos):
  bio_padrao = 12 × 0.10 × 90 = 108
  bio_amp    = 4 × 0.30 × 60 = 72 (Amplificadores sobrevivem em média 60s com reinfecção)
  total = 180 Biomassa

Cenário C — estratégia mista com Âncoras como escudo (10 Padrão + 3 Amp + 4 Âncora):
  bio = (10×0.10 + 3×0.30 + 4×0.10) × 80 = (1.0 + 0.9 + 0.4) × 80 = 184 Biomassa
```

### Reinfecção de Amplificador (ROI)

```
Custo de reinfecção:
  tempo_rota_volta_ao_amp = ~3–5s (ir + absorver + ir + transferir)

Benefício:
  bio_ganho = 0.30 × tempo_sobrevivencia_media
  tempo_sobrevivencia_media = 20s (entre Healers)
  bio_ganho = 0.30 × 20 = 6 Biomassa por reinfecção

Bio perdida se não reinfetar:
  0.30 × 20 = 6 Biomassa

→ Cada reinfecção de Amplificador vale ~6 Biomassa ao custo de ~4s de rota
→ ROI positivo sempre que o caminho for curto
```

---

## 5. Edge Cases

| Situação | Comportamento |
|----------|---------------|
| Jogador para sobre nó já infectado com carga ativa | Descarta a carga atual silenciosamente e absorve carga nova do nó (reset de origem) |
| Jogador tenta transferir para nó não-adjacente à origem | Carga descartada; nenhum nó infectado; indicador de carga some. Feedback visual: flash vermelho rápido no indicador |
| Healer chega ao nó no mesmo frame que o jogador transfere carga | A infecção é confirmada (transferência tem prioridade); Healer inicia a cura imediatamente — nó infectado por 0s antes do início da cura |
| Jogador carrega carga e o nó de origem é curado por Healer | Carga permanece válida (já foi absorvida); jogador ainda pode transferir para nó adjacente da posição original do nó infectado — mas o mapa agora mostra o nó curado, podendo confundir a adjacência visível. O sistema valida adjacência topológica, não visual |
| Jogador com 0 HP toca Healer (4º hit com 3 HP) | Fail state; Biomassa perdida; carga descartada |
| 100% dos nós infectados antes de 80% | Vitória antecipada dispara igualmente (+25% Biomassa) |
| Dois nós adjacentes são infectados ao mesmo tempo pela transferência | Não é possível — o jogador só pode carregar 1 carga e transferir 1 por vez |
| Âncora infectada e Healer bloqueado — outro Healer aparece sobre o caminho do jogador | Healer não parado pela Âncora move-se livremente; o jogador deve desviar ou aceitar o hit |
| Jogador para sobre nó neutro não-adjacente à origem da carga (moveu demais) | Timer de 3s descarte inicia; se o jogador voltar à zona de adjacência antes dos 3s, o timer reseta |
| Vitória antecipada disparada durante transferência em andamento | Run encerra; estado de infecção no momento do trigger é o que conta (transferência cancelada se não completou) |

---

## 6. Dependencies

| Sistema | Relação | Direção |
|---------|---------|---------|
| **Sistema de Recursos** | Biomassa Adaptativa como recurso de fluxo; taxa variável por tipo de nó | Zona define taxas por tipo |
| **Foguete (Hub)** | Biomassa alimenta suporte de vida do foguete | Foguete consome Biomassa |
| **Hub / Mapa-Mundo** | Acesso via hub | Hub controla acesso |
| **GameConfig** | Todas as constantes numéricas (taxas, timers, thresholds) centralizadas em GameConfig | Zona lê de GameConfig |
| **Sistema de HP** | Jogador tem 3 HP nesta zona | Zona configura via GameConfig.INFECTION_PLAYER_HP |
| **Sistema de Carga Viral** | Sistema novo específico desta zona: estado de carga (vazia/cheia), indicador visual, timer de descarte, validação de adjacência | Zona define e cria o sistema de Carga Viral |
| **Sistema de Grafo de Adjacência** | Os nós têm topologia de adjacência definida na geração do mapa; o sistema valida transferências | Zona depende de grafo com adjacência mapeada |
| **Zona Campo de Controle** | Ambas usam recursos de fluxo; abstração de "fluxo acumulado" é compartilhada | Dependência de sistema compartilhado |

---

## 7. Tuning Knobs

| Parâmetro | Valor Base | Range Seguro | Efeito |
|-----------|------------|--------------|--------|
| `INFECTION_RUN_TIMER` | 120s | 90–150s | Duração da run |
| `INFECTION_TRANSFER_TIME` | 0.5s | 0.3–1.0s | Tempo para infectar nó neutro; menor = mais fluido, maior = mais tenso |
| `INFECTION_CHARGE_DISCARD_TIMER` | 3s | 2–5s | Tempo antes de perder carga por movimento sem destino |
| `INFECTION_BIOMASS_RATE_PADRAO` | 0.10/s | 0.05–0.20 | Bio por nó padrão |
| `INFECTION_BIOMASS_RATE_AMPLIFIER` | 0.30/s | 0.20–0.50 | Bio por Amplificador; deve ser alto o suficiente para justificar reinfecção |
| `INFECTION_BIOMASS_RATE_ANCORA` | 0.10/s | 0.05–0.15 | Bio por Âncora; valor estratégico é o bloqueio de Healer, não a geração |
| `INFECTION_CURE_TIME_PADRAO` | 3.0s | 2–5s | Resistência nó padrão |
| `INFECTION_CURE_TIME_AMPLIFIER` | 1.0s | 0.5–2.0s | Fragilidade Amplificador |
| `INFECTION_CURE_TIME_ANCORA` | 8.0s | 5–12s | Resistência Âncora; define o valor estratégico da isca |
| `INFECTION_HEALER_COUNT_MID` | 2–3 | 1–4 | Healers ativos na fase intermediária |
| `INFECTION_HEALER_COUNT_LATE` | 3–4 | 2–5 | Healers ativos na fase final |
| `INFECTION_PCT_AMPLIFIERS` | 0.15 | 0.10–0.25 | Proporção de Amplificadores no grafo |
| `INFECTION_PCT_ANCORA` | 0.15 | 0.10–0.25 | Proporção de Âncoras no grafo |
| `INFECTION_VICTORY_PCT` | 80% | 70–90% | Meta de infecção para vitória antecipada |
| `INFECTION_EARLY_WIN_BONUS` | 25% | 15–35% | Bônus de Biomassa por vitória antecipada |

---

## 8. Acceptance Criteria

**Funcional (pass/fail):**

- [ ] Parar sobre nó infectado absorve carga instantaneamente (indicador de carga aparece)
- [ ] Parar 0.5s sobre nó neutro **adjacente à origem** com carga ativa → nó infectado estável
- [ ] Parar sobre nó neutro **não-adjacente** com carga → carga descartada (flash vermelho no indicador)
- [ ] Nó infectado pelo jogador sempre gera a taxa correta por tipo (0.10 / 0.30 / 0.10)
- [ ] Healer que toca jogador: -1 HP + carga descartada se ativa
- [ ] Healer cura Padrão em 3.0s, Amplificador em 1.0s, Âncora em 8.0s
- [ ] Âncora retém Healer por 8.0s completos antes do Healer re-alvejar
- [ ] 80% de nós infectados → vitória antecipada com +25% Biomassa
- [ ] 3 hits de Healer → fail; Biomassa da run perdida
- [ ] Carga descartada automaticamente após 3s de movimento sem adjacência ao nó de origem

**Experiencial (playtest):**

- [ ] Novo jogador entende o ciclo "absorver → mover → transferir" sem tutorial — apenas pelo feedback visual da carga e do efeito de infecção
- [ ] Após 2 runs, jogador entende que Amplificadores valem reinfectar ativamente
- [ ] O jogador reporta sentir-se "parte da rede" em vez de "controlando a rede de fora"
- [ ] Usar Âncoras como isca para Healers é descoberto organicamente após 3–4 runs
- [ ] A corrida para reinfectar Amplificadores antes que o Healer chegue é percebida como momento de alta tensão
- [ ] A decisão "qual rota de expansão seguir" ocorre naturalmente a cada 5–10s de run

---

*Relacionado: `design/gdd/game-concept.md`, `design/gdd/resource-system.md`, `design/gdd/zone-stealth.md`, `design/gdd/zone-field-control.md`*
