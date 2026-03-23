# Zona de Sacrifício — Game Design Document

**Version**: 2.0
**Date**: 2026-03-23
**Status**: Revisado — Execução Urgente

---

## 1. Overview

Zona de tomada de decisão estratégica com execução urgente. O jogador analisa 4–6 câmaras visíveis ao redor de uma câmara central (hub), cada uma com recursos e custos sinalizados antes da entrada; ao entrar, um contador de pressão inicia e dormentes acordam se o jogador parar.

---

## 2. Player Fantasy

A análise é fria — você vê tudo antes de entrar. A execução é quente — ao cruzar a entrada, o depósito acorda e parar por mais de 1.5s tem consequências.

**Estética MDA primária**: Challenge (análise estratégica + execução urgente).
**Estética secundária**: Expression (estilo revelado na análise e no padrão de movimento).

---

## 3. Detailed Rules

### 3.1 Estrutura da Run

- Squad de até 4 personagens
- Mapa: câmara central (hub) + 4–6 câmaras de recurso visíveis desde o início
- Timer da run: 90s
- Run encerra: jogador chega ao EXIT (sempre disponível no hub) ou timer zera
- Timer zerando = recursos mantidos (não é fail state); jogador teletransportado ao EXIT se preso em câmara
- Todos mortos = fail state; perde todos os recursos da run

### 3.2 Interpretação do Movimento

- **Centro (análise)**: parar é seguro e produtivo; jogador lê painéis e decide
- **Câmaras (execução)**: mover é sobreviver; parar >1.5s acelera o despertar dos dormentes
- **Entrar é irreversível**: custo aplicado no primeiro frame de cruzamento; sem desfazer

### 3.3 Câmaras de Recurso

#### Painel Informativo (visível antes da entrada)

```
┌─────────────────────────────┐
│  [Ícone do recurso]         │
│  Sucata Metálica × 8        │
│  CUSTO: [Ícone de Custo]    │
│  Spawn: 3 Bruisers          │
└─────────────────────────────┘
```

Nenhuma informação escondida.

#### Tipos de Custo

| Tipo | Símbolo | Efeito |
|------|---------|--------|
| **Sem custo** | — | Nenhum |
| **Timer** | Relógio "-Xs" | Reduz timer da run em X segundos imediatamente |
| **Inimigo** | Caveira + número | Spawna N inimigos dentro da câmara imediatamente |
| **Slot bloqueado** | Mochila com X | Bloqueia permanentemente 1 slot de mochila pelo restante da run |
| **Cadeia** | Corrente | Ativa o custo de outra câmara específica imediatamente |

#### Distribuição de Câmaras por Run

| # Câmaras | Perfil de Custo | Recompensa |
|-----------|----------------|------------|
| 1 | Sem custo | 3–4 recursos (baixa) |
| 1–2 | Custo simples (timer ou inimigo) | 5–7 recursos (média) |
| 1–2 | Custo duplo (2 tipos) | 8–10 recursos (alta) |
| 1 | Cadeia | 6–8 recursos + consequência indireta |

#### Ativação de Custo

- Ativado no primeiro frame em que qualquer membro cruza a entrada
- Efeitos: imediatos e irreversíveis
- Timer: reduzido instantaneamente
- Inimigos: spawnam em posições pré-definidas (nunca sobre recursos)
- Slot: menor índice livre bloqueado; recurso já no slot não é afetado
- Cadeia: custo da câmara-alvo ativado imediatamente, sem cascata (1 nível)
- Reentrada na mesma câmara não reativa o custo

#### Contador de Pressão (por câmara)

- Inicia ao entrar: 30s
- A cada 5s de pausa (parado >1.5s sem coletar): contador acelera em 2s
- Contador zera: todos os dormentes acordam + inimigos triplicados (inclui câmaras sem custo de inimigo — dormentes de manutenção)
- Visível na UI como barra "calor do depósito"
- Resetado ao voltar ao centro e ao entrar em câmara nova
- Calibração: coleta em movimento esvazia câmara em ~20s sem alarmar dormentes

### 3.4 Coleta de Recursos

- Tipos: Sucata Metálica E Componentes de IA (ambos os recursos base)
- Sistema de mochila padrão: 1 slot por recurso, independente do tipo
- Coleta: 1.5s de pausa padrão (aciona o contador de pressão)
- Única zona que oferece os dois recursos base em quantidade premium

### 3.5 Inimigos

- Roster: Runners, Bruisers, Spitters (mesmos da Zona Hordas, stats padrão)
- Combate automático do squad
- Câmaras com custo de inimigo spawnam inimigos derrotáveis em 10–20s com squad de 2+
- Inimigos do custo são previsíveis (quantidade e posição conhecidas) — contraste com Zona Hordas

---

## 4. Formulas

### Valor Líquido de uma Câmara

```
valor_liquido = recursos_coletados - custo_equivalente

Conversões de custo:
  Timer -15s: 90s base, 0.1 rec/s → custo ≈ 1.5 recursos
  Timer -20s: custo ≈ 2.0 recursos
  Inimigos:   10s × 0.1 rec/s ≈ 1.0 recurso
  Slot:       1–2 recursos perdidos (estimativa)
  Cadeia:     custo da câmara-alvo (calculado separadamente)

Exemplos:
  Câmara E: 10 recursos, custo cadeia (-15s) → valor_líquido = 8.5
  Câmara F: 10 recursos, custo -20s + slot  → valor_líquido = 10 - 2.0 - 1.5 = 6.5
  Câmara A: 4 recursos, sem custo           → valor_líquido = 4.0
```

### Máximo Real vs Teórico

```
max_teorico (6 câmaras × 7 rec): 42 recursos
max_pratico mochila base (3 slots): 3 recursos
max_pratico mochila upgrade 2 (7 slots): 7 recursos

→ Mochila é o principal bottleneck, não os custos.
→ Zona de Sacrifício recompensa upgrades de mochila mais que qualquer outra zona.
```

### Pressão de Timer por Câmaras Visitadas

```
timer_inicial = 90s
custo_deslocamento = 5s por câmara (hub → câmara → hub)
tempo_coleta = 1.5s por recurso

Câmara de 7 recursos: 5 + (7 × 1.5) = 15.5s
Após 3 câmaras: 90 - 46.5 = 43.5s restantes (confortável)
Após câmara -15s: 90 - 15 - 15.5 = 59.5s (confortável)
Após 2 câmaras -15s: 90 - 30 - 31 = 29s (apertado)
```

---

## 5. Edge Cases

| Situação | Comportamento |
|----------|---------------|
| Cadeia aponta para câmara já visitada | Cadeia aplica apenas custos futuros; não retroativo |
| Jogador entra em câmara de Cadeia sem ler o painel | Custo ativado normalmente; ignorância não é proteção |
| Mochila cheia ao entrar em câmara | Recursos no chão ignorados silenciosamente; sem penalidade |
| Custo de Slot com mochila já cheia (3/3) | Slot bloqueado; capacidade reduz para 2; recursos já coletados permanecem |
| Timer zera com jogador em câmara sem saída | Teletransportado ao EXIT com recursos coletados; sem dano extra |
| Todos morrem durante combate em câmara | Fail state; perde todos os recursos da run |
| Câmara de Cadeia cujo alvo também é Cadeia | Não há cascata — apenas 1 nível de ativação |
| Reentrada na mesma câmara | Custo não reativado; recursos não coletados ainda disponíveis |
| Câmara sem custo, mochila com 1 slot livre, 3 recursos | Coleta 1 recurso; 2 ficam no chão; sem prompt |

---

## 6. Dependencies

| Sistema | Relação | Direção |
|---------|---------|---------|
| **Sistema de Mochila** | Upgrades têm impacto máximo aqui; Custo de Slot modifica capacidade da mochila | Zona depende + modifica |
| **Sistema de Recursos** | Distribui Sucata Metálica e Componentes de IA simultaneamente | Zona fornece ambos |
| **Foguete (Hub)** | Ambos os recursos contribuem para receitas do foguete | Foguete consome |
| **Sistema de Squad (Zona Hordas)** | Squad, combate automático e composição herdados | Zona depende |
| **Hub / Mapa-Mundo** | Acesso controlado pelo hub | Hub controla acesso |
| **Sistema de Timer** | Timer de 90s com custo de timer como modificador dinâmico | Zona usa e estende |
| **Gerador de Câmaras** | Câmaras, recursos, custos gerados proceduralmente | Zona define parâmetros |
| **Zona Hordas** | Inimigos compartilhados (Runners, Bruisers, Spitters) | Dependência técnica de assets |
| **Ex-Executivo (Hub NPC)** | Upgrade de mochila especialmente valioso aqui | Relação temática |

---

## 7. Tuning Knobs

| Parâmetro | Valor Base | Range Seguro | Categoria | Efeito |
|-----------|------------|--------------|-----------|--------|
| `timer_run` | 90s | 75–120s | Gate | Generoso por design; reduzir penaliza custo de timer |
| `n_camaras_por_run` | 5 | 4–6 | Curve | Número de decisões disponíveis |
| `n_camaras_sem_custo` | 1 | 1–2 | Gate | Câmara segura garantida; remove paralisia total |
| `recursos_camara_sem_custo` | 3–4 | 2–5 | Curve | Piso de retorno garantido |
| `recursos_camara_custo_alto` | 8–10 | 6–14 | Curve | Teto de recompensa para arrojo |
| `custo_timer_medio` | -15s | -10s a -20s | Gate | <10s = trivial, >25s = muito punitivo |
| `custo_timer_alto` | -20s | -15s a -30s | Gate | Custo de câmaras de maior recompensa |
| `n_inimigos_custo_baixo` | 2–3 Runners | 1–4 | Gate | Derrota em ~5s com squad 2+ |
| `n_inimigos_custo_alto` | 2–3 Bruisers | 1–4 | Gate | Derrota em ~15s com squad 2+ |
| `chance_custo_cadeia` | 20% | 10–30% | Gate | Frequência de custos indiretos |
| `chance_custo_duplo` | 30% | 20–40% | Curve | Proporção de câmaras com 2 tipos de custo |

---

## 8. Acceptance Criteria

**Funcional (pass/fail para QA):**

- [ ] Painel de cada câmara (recurso + custo) visível desde a câmara central antes de entrar
- [ ] Custo aplicado no primeiro frame de cruzamento da entrada por qualquer membro do squad
- [ ] Custo de Timer reduz o timer imediatamente; novo valor refletido na UI
- [ ] Custo de Inimigo spawna exatamente os inimigos indicados nas posições predefinidas
- [ ] Custo de Slot bloqueia 1 slot imediatamente; capacidade máxima reduz em 1 pelo restante da run
- [ ] Custo de Cadeia aplica o custo da câmara-alvo imediatamente; limitado a 1 nível de propagação
- [ ] Reentrada na mesma câmara não reativa o custo
- [ ] Timer zero teletransporta ao EXIT com recursos coletados (não é fail state)
- [ ] Todos mortos = fail state; perde todos os recursos da run
- [ ] EXIT sempre disponível na câmara central durante toda a run

**Experiencial (validado por playtest):**

- [ ] Novo jogador entende custo/recompensa sem tutorial — apenas pelo painel visual
- [ ] Parar no centro para analisar câmaras é reportado como a parte mais interessante
- [ ] ≥60% dos playtestadores expressam preferência estratégica (arrojado vs conservador) após 3 runs
- [ ] Câmara de Cadeia surpreende na primeira vez, mas o mecanismo é entendido imediatamente após
- [ ] Run apenas com câmaras sem custo percebida como "segura mas insatisfatória"
- [ ] Run completa (entrada ao EXIT) ocorre entre 30 e 70 segundos para a maioria

---

*Relacionado: `design/gdd/game-concept.md`, `design/gdd/resource-system.md`, `design/gdd/mvp-game-brief.md`, `design/gdd/hub-and-characters.md`, `design/gdd/enemies-horda-zone.md`*
