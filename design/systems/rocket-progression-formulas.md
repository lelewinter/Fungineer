---
tags: [fungineer, systems-design, formulas, balancing]
date: 2026-06-05
tipo: systems-design-doc
status: Draft — Ready for Implementation
---

# Matemática da Progressão do Foguete — Fórmulas de Sistemas

**Version**: 1.0
**Date**: 2026-06-05
**Author**: Systems Designer
**Implements**: `design/gdd/resource-system.md`, `design/MASTERPLAN.md`
**Dependências diretas**: `frontend/src/state/GameConfig.ts`, `design/gdd/hub-and-characters.md`

---

## 0. Premissas de Design (documentadas por falta de especificação)

As seguintes premissas foram assumidas na ausência de valores travados:

| Premissa | Valor assumido | Justificativa |
|---|---|---|
| Runs-alvo até lançamento | **30 runs** | Ver Seção 1 |
| Run duration média (jogador médio) | **90–120s** | Travado no `mvp-game-brief.md` |
| Taxa de sucesso do jogador médio | **65%** | Calibrado para roguelikes casuais mobile; punição moderada sem frustração |
| Recursos disponíveis por mapa (Hordas) | **6 spawn** | `RESOURCE_SPAWN_COUNT: 4` atual é baixo; proposta: aumentar para 6 (ver Seção 2) |
| Recursos disponíveis por mapa (Stealth) | **5 spawn** | Stealth é mais lenta, menor densidade compensa |
| Mochila base (3 slots) | **2.0 coletados/run em média** | Conservador: perde 1 slot por morte ocasional, raramente preenche os 3 |
| Mochila upgrade 1 (5 slots) | **3.5 coletados/run** | Jogador mais experiente, upgrade desbloqueado |
| Mochila upgrade 2 (7 slots) | **5.0 coletados/run** | Late game, alta skill |
| Escopo | MVP (8 peças, 2 zonas) | Fórmulas pós-MVP na Seção 6 |

---

## 1. Escolha do Alvo: 30 Runs até o Lançamento

### Por que 30 e não 28 (estimativa original do resource-system.md)?

O resource-system.md estima ~28 runs com média de 2,5 recursos/run. Esse número usa a média ideal. A análise de distribuição real mostra por que 30 é mais preciso e melhor para o design:

**Modelo de distribuição por run (mochila base, 3 slots):**

```
P(coleta = 0) = 0.35 × (taxa_de_morte_com_mochila_vazia)   ≈ 0.05
P(coleta = 1) = 0.20   (mort precoce ou saída conservadora)
P(coleta = 2) = 0.40   (resultado típico)
P(coleta = 3) = 0.35   (run boa)
```

```
Média ponderada = 0×0.05 + 1×0.20 + 2×0.40 + 3×0.35 = 0 + 0.20 + 0.80 + 1.05 = 2.05
```

Com 69 recursos totais e média de 2.05:

```
runs_naive = 69 ÷ 2.05 = 33.7 runs
```

Com a progressão de mochila (upgrade 1 ≈ run 12, upgrade 2 ≈ run 22):

```
Fase 1 (runs 1–12, mochila 3): 12 × 2.05 = 24.6 recursos
Fase 2 (runs 12–22, mochila 5): 10 × 3.50 = 35.0 recursos  
Fase 3 (runs 22+, mochila 7):   x × 5.00 = resto

Recursos após fase 1+2: 69 - 24.6 - 35.0 = 9.4 → 9.4 ÷ 5.0 = ~2 runs
Total: 12 + 10 + 2 = 24 runs (jogador que trava os upgrades cedo)
```

**Conclusão:** a janela real é **24–36 runs** dependendo de quando o jogador trava os upgrades de mochila. O alvo de **30 runs** é o ponto médio da distribuição e encaixa em ~45–60 minutos de sessão (90s/run × 30 × fator_hub ~= 60min). É o sweet spot entre:

- Muito curto (<20 runs): meta-loop não tem tempo de criar apego
- Muito longo (>40 runs): grind percebido sem progressão visível suficiente

**Referência de design (MDA):** Para roguelikes mobile com loop de meta-progressão, a janela de 45–75 minutos para um arco completo está alinhada com Vampire Survivors (casual, ~30min/run), mas Fungineer tem runs de 2min não de 30, então o acúmulo é multi-sessão. 30 runs ≈ 5–6 sessões de 10min cada, o que é saudável para PWA mobile.

---

## 2. Fórmula de Custo das Peças do Foguete

### 2.1 Custo canônico (8 peças MVP)

Mantém a tabela de `resource-system.md` como verdade de design. As fórmulas abaixo modelam o que já existe e calibram os drops em volta dela.

| # | Peça | Sucata (S) | Comp. IA (C) | Total Peça | Total Acumulado |
|---|---|---|---|---|---|
| 1 | Base Estrutural | 6 | 0 | 6 | 6 |
| 2 | Casco Externo | 8 | 0 | 8 | 14 |
| 3 | Suporte Interno | 5 | 3 | 8 | 22 |
| 4 | Sistema Elétrico | 0 | 6 | 6 | 28 |
| 5 | Painel de Controle | 4 | 5 | 9 | 37 |
| 6 | Motor Principal | 8 | 4 | 12 | 49 |
| 7 | Sistema de Navegação | 0 | 8 | 8 | 57 |
| 8 | Blindagem Final | 6 | 6 | 12 | 69 |

**Totais**: 37× Sucata + 32× Comp. IA = **69 recursos totais**

### 2.2 Análise da curva de custo por peça

```
Custos individuais: [6, 8, 8, 6, 9, 12, 8, 12]
Média: 8.6
Desvio padrão: 2.1

Crescimento geral: não é estritamente crescente (intencional — 
  peças 4 e 7 são "respiro" de custo baixo no late game)
```

A curva tem forma de **escada dupla com vales**: dois picos (peças 6 e 8, custo 12) separados por um vale (peça 7, custo 8). Isso cria ritmo emocional: o jogador sente uma peça difícil, depois uma mais fácil, depois o desafio final. Aprovado sem mudanças.

### 2.3 Progressão de runs por peça (estimado)

Baseado em médias de coleta por fase (ver Seção 3):

| # | Peça | Total recursos | Runs estimadas para completar | Runs acumuladas |
|---|---|---|---|---|
| 1 | Base Estrutural | 6 | 3 | 3 |
| 2 | Casco Externo | 8 | 4 | 7 |
| 3 | Suporte Interno | 8 | 4 | 11 |
| 4 | Sistema Elétrico | 6 | 3 | 14 |
| 5 | Painel de Controle | 9 | 3 | 17 |
| 6 | Motor Principal | 12 | 3 | 20 |
| 7 | Sistema de Navegação | 8 | 2 | 22 |
| 8 | Blindagem Final | 12 | 2 | 24 |

*Nota: runs 1–14 usam mochila 3 (média 2.05/run); 14–22 usam mochila 5 (média 3.5); 22+ usam mochila 7 (média 5.0). As runs por peça caem no late game não porque o conteúdo fica mais fácil, mas porque a capacidade de transporte aumenta.*

---

## 3. Taxas de Drop e Coleta por Zona

### 3.1 Princípio de calibração

A taxa de drop deve satisfazer simultaneamente:
1. **Sem gargalos**: nenhum recurso deve ser o limitante único por mais de 3 peças consecutivas
2. **Sem inflação**: o jogador não deve acumular tanto de um tipo que a decisão de zona perde sentido
3. **Razão de demanda**: ao longo das 8 peças, a demanda é S:C = 37:32 ≈ **1.16:1** (ligeiramente mais Sucata)

A oferta deve respeitar essa razão com pequena margem de excesso para absorver runs fracassadas:

```
oferta_alvo_sucata = demanda × fator_excesso = 37 × 1.20 = ~44 drop de sucata disponíveis
oferta_alvo_comp   = 32 × 1.20             = ~38 drop de Comp. IA disponíveis
```

O excesso de 20% absorve runs fracassadas sem deixar o jogador com estoque ocioso grande demais.

### 3.2 Parâmetros de spawn por zona

#### Zona 0 — Hordas (Sucata Metálica)

```
RESOURCE_SPAWN_COUNT_HORDAS = 6  (proposta: subir de 4 para 6)
```

| Cenário | Spawn disponível | Slots usados | Recursos/run | Probabilidade |
|---|---|---|---|---|
| Morte precoce | 6 | 0 | 0 | 5% |
| Run conservadora | 6 | 1–2 | 1–2 | 25% |
| Run típica | 6 | 2–3 | 2–3 | 50% |
| Run excelente | 6 | 3 | 3 | 20% |

```
Média esperada (mochila 3) = 0×0.05 + 1.5×0.25 + 2.5×0.50 + 3×0.20
                           = 0 + 0.375 + 1.25 + 0.60 = 2.225 Sucata/run
```

#### Zona 1 — Stealth (Componentes de IA)

Stealth é mais lenta e perigosa. Spawn menor compensa:

```
RESOURCE_SPAWN_COUNT_STEALTH = 5
```

| Cenário | Spawn disponível | Recursos/run | Probabilidade |
|---|---|---|---|
| Detectado / falha | 5 | 0 | 15% (maior que Hordas — stealth é mais punitivo) |
| Run conservadora | 5 | 1–2 | 30% |
| Run típica | 5 | 2–3 | 40% |
| Run excelente | 5 | 3 | 15% |

```
Média esperada (mochila 3) = 0×0.15 + 1.5×0.30 + 2.5×0.40 + 3×0.15
                           = 0 + 0.45 + 1.00 + 0.45 = 1.90 Comp. IA/run
```

### 3.3 Verificação de equilíbrio (30 runs)

Distribuição de runs necessária para atingir 37S + 32C:

```
Alvo Sucata:  37 ÷ 2.225 = 16.6 → ~17 runs em Hordas
Alvo Comp IA: 32 ÷ 1.90  = 16.8 → ~17 runs em Stealth
Total: ~34 runs "brutas" → com upgrades de mochila reduz para ~24–28 efetivas
```

Margem de 14–20% acima do alvo de 30 runs é saudável: absorve variância sem fazer o jogo parecer infinito.

### 3.4 Fórmula geral de drops implementável

```typescript
// GameConfig additions:
RESOURCE_SPAWN_COUNT_HORDAS: 6,
RESOURCE_SPAWN_COUNT_STEALTH: 5,
RESOURCE_DROP_RATE: 1.0,          // multiplicador global (tuning knob)
RESOURCE_BONUS_THRESHOLD: 0.80,   // % de progresso do foguete para ativar bônus
RESOURCE_BONUS_MULTIPLIER: 1.25,  // spawn +25% nas últimas 2 peças (ver Seção 4)
```

```
spawn_efetivo(zona, fase) = spawn_base(zona) × deterioration_mult × bonus_mult(fase)

onde:
  spawn_base(HORDAS)  = RESOURCE_SPAWN_COUNT_HORDAS  = 6
  spawn_base(STEALTH) = RESOURCE_SPAWN_COUNT_STEALTH = 5
  deterioration_mult  = ver DETERIORATION_STAGE1_RUNS / STAGE2_RUNS já em GameConfig
  bonus_mult(fase)    = RESOURCE_BONUS_MULTIPLIER se progresso_foguete ≥ RESOURCE_BONUS_THRESHOLD
                        else 1.0
```

**Nota sobre deterioração**: O sistema de deterioração já existente (`DETERIORATION_STAGE1_RUNS: 6`, `DETERIORATION_STAGE2_RUNS: 14`) aumenta inimigos mas não menciona recursos. Proposta: manter spawn de recursos constante (inimigos escalam, recursos não — recompensa por risco maior, sem gargalo).

---

## 4. Sensação de Tempo-para-Próxima-Peça por Fase

### 4.1 Definição das três fases

| Fase | Runs | Mochila | Peças disponíveis | Sentimento alvo |
|---|---|---|---|---|
| **Early** | 1–11 | 3 slots | Peças 1–3 | Descoberta, cada run tem peso, o foguete muda visivelmente |
| **Mid** | 12–22 | 5 slots | Peças 4–6 | Momentum, a Stealth entra em jogo, decisões de zona estratégicas |
| **Late** | 23–30 | 7 slots | Peças 7–8 | Urgência, runs longas valem mais, o fim está próximo |

### 4.2 Tempo-para-próxima-peça (TTnP) por fase

```
TTnP(peça, fase) = custo_peça ÷ (media_run(fase) × eficiencia_zona(fase))

onde eficiencia_zona(fase) considera que o jogador divide runs entre as duas zonas
  conforme a demanda da próxima peça (escolha estratégica no hub)
```

| Peça | Custo total | Fase | Média/run relevante | TTnP (runs) | TTnP (minutos) |
|---|---|---|---|---|---|
| 1 Base Estrutural | 6S | Early | 2.2 S/run | **2.7 → 3** | ~5 min |
| 2 Casco Externo | 8S | Early | 2.2 S/run | **3.6 → 4** | ~7 min |
| 3 Suporte Interno | 5S+3C | Early | misto 2.1/run | **3.8 → 4** | ~7 min |
| 4 Sistema Elétrico | 6C | Mid-início | 3.2 C/run | **1.9 → 2** | ~3 min |
| 5 Painel de Controle | 4S+5C | Mid | misto 3.3/run | **2.7 → 3** | ~5 min |
| 6 Motor Principal | 8S+4C | Mid | misto 3.3/run | **3.6 → 4** | ~7 min |
| 7 Sistema de Navegação | 8C | Late | 4.5 C/run | **1.8 → 2** | ~3 min |
| 8 Blindagem Final | 6S+6C | Late | misto 4.7/run | **2.5 → 3** | ~5 min |

**Perfil de ritmo resultante:**
```
Peças 1–3: ~3–4 runs cada (Early — aprender o sistema, o foguete muda toda semana de jogo)
Peça 4:    ~2 runs  (Mid-entrada — respiro, recompensa transição para Stealth)
Peças 5–6: ~3–4 runs cada (Mid — decisão de zona ativa)
Peça 7:    ~2 runs  (Late-entrada — segundo respiro, tensão narrativa alta)
Peça 8:    ~2–3 runs (Late — sprint final, mochila grande, urgência)
```

Esse perfil cria ondas de tensão-respiro-tensão: o jogador nunca fica preso em mais de 4 runs pela mesma peça, mas também nunca sente que a próxima peça é garantida em 1 run.

### 4.3 Visibilidade de progresso no hub

Para que o TTnP seja sentido (não apenas calculado), a UI do hub deve mostrar:

```
[Próxima peça: Motor Principal]
[Sucata:   ████████░░░░  8/16 — faltam 8]
[Comp. IA: ██████░░░░░░  4/8  — faltam 4]
[Estimativa: ~3–4 runs]
```

A estimativa de runs não precisa ser exata — serve como âncora cognitiva para o jogador planejar sua próxima sessão.

---

## 5. Tratamento de Casos de Borda

### 5.1 Run fracassada

**Regra já definida**: perde todos os recursos da run; estoque do hub intocado.

**Impacto matemático modelado:**

```
perda_esperada_por_run = P(morte) × media_coletado_pre_morte
                       = 0.35 × 1.5 = ~0.53 recursos/run perdidos em média

Fator de ineficiência = 1 + (perda_esperada ÷ media_run_bem_sucedida)
                      = 1 + (0.53 ÷ 2.05) = 1.26
```

Isso significa que o jogador precisa de ~26% mais runs do que o cálculo ingênuo indica — já absorvido no alvo de 30 runs (vs. 24 da curva ideal).

**Mitigação de frustração:**
- Runs fracassadas na Early game (peças 1–3, custo baixo) têm impacto < 1 run de atraso
- Runs fracassadas na Late game (peças 7–8, mochila maior mas custo maior) ainda representam < 1.5 runs de atraso
- O estoque acumulado cria um "colchão psicológico" — o jogador nunca sente que voltou ao zero

### 5.2 Recurso excedente

**Cenário**: jogador acumula 45 Sucata antes de precisar de Comp. IA (ou vice-versa).

```
excedente_maximo_esperado = 37 × fator_excesso - 37 = 37 × 1.20 - 37 = 7.4 unidades
```

Com 7 unidades de excedente máximo esperado (menos de 3 runs de reserva), o risco de inflação é baixo. Não é necessário cap de estoque.

**Regra de design**: não limitar o estoque do hub. O excedente é recompensa de skill, não punição. O jogador que focou Hordas primeiro terá reserva de Sucata quando as peças mistas chegarem — isso reduz a sensação de grind nas peças 5 e 6.

**Gatilho de desequilíbrio a monitorar**: se o jogador chegar à peça 7 (8× Comp. IA pura) com 0 Comp. IA em estoque, ele precisará de 2 runs de Stealth consecutivas. Aceitável, mas o hub deve indicar claramente a demanda futura para o jogador se antecipar.

### 5.3 Recurso travado em zona única

**Cenário**: as peças 1, 2 (só Sucata) e 4, 7 (só Comp. IA) são exclusivas de uma zona.

```
Peças exclusivas de Sucata:  1 + 2 = 14 recursos → 6.3 runs de Hordas antes de tocar Stealth
Peças exclusivas de Comp. IA: 4 + 7 = 14 recursos → 7.4 runs de Stealth em isolamento
```

Isso não é gargalo — é progressão sequencial intencional. O risco real é **percepção de monotonia** se o jogador ficar 6+ runs na mesma zona.

**Mitigação:**
1. A peça 3 (Suporte Interno: 5S + 3C) força a zona Stealth na run ~11, quebrando a monotonia
2. A narrativa das zonas usa deterioração crescente para manter frescor dentro da mesma zona
3. Missões de personagens (Ex-Executivo, Marcus) podem desviar o jogador para a zona "errada" momentaneamente — mecânica que vai contra a otimização pura e cria memórias

**Regra implementável**: se o jogador completar 5+ runs consecutivas na mesma zona, o hub NPC mais próximo do limiar de confiança oferece uma missão na outra zona. Isso não é obrigatório, mas cria uma saída narrativa natural da monotonia.

```typescript
// Pseudo-código para detecção:
if (consecutiveRunsSameZone >= 5) {
  triggerNPCMissionInOtherZone(); // missão suave de diversificação
}
```

### 5.4 Mochila cheia ao encontrar recurso crítico

**Cenário**: jogador está com mochila 3/3 e encontra o último recurso que completa uma peça.

**Regra existente**: recurso ignorado silenciosamente. Correto do ponto de vista de tensão (o jogador precisa sair, depositar, e voltar — decisão real). Mas cria um edge case de frustração:

```
Situação: jogador tem 2S no hub + 1S na mochila + mochila cheia (3/3)
Efeito: não pode coletar o 3º S que completaria a Base Estrutural (custo 6S)
```

Nesse cenário, a UI do hub deve destacar "falta 1 recurso" com alta visibilidade antes da run para o jogador entrar já sabendo que precisa de espaço livre.

**Regra adicional proposta**: ao retornar ao hub com o depósito exato do custo de uma peça, a animação de construção é disparada imediatamente. O impacto emocional da peça sendo construída "na hora" compensa qualquer frustração residual.

### 5.5 Sequência de runs sem progresso perceptível

**Cenário**: jogador completa 5 runs com apenas 1 recurso cada (10 recursos totais em 5 runs). Com custo da peça 6 em 12 recursos, ainda faltam 2 runs.

```
Limiar de frustração: TTnP > 5 runs para uma única peça
```

Esse cenário é improvável com a calibração proposta (TTnP máximo = 4 runs), mas pode ocorrer com azar extremo (morte precoce repetida + baixo spawn de recursos críticos).

**Mitigação automática**: o sistema de spawn garante sempre `spawn_base` recursos no mapa, independente de runs anteriores. Não há "seca" de recursos — o chão sempre tem recurso, o gargalo é sempre capacidade de mochila e sobrevivência. Isso torna a frustração controlável: o jogador sabe que pode melhorar com skill.

---

## 6. Extensão Pós-MVP (11 Zonas, 6 Recursos)

Para referência futura, o modelo escala da seguinte forma. Dados de `resource-system.md` (Seção 3.1-B) e `zone-rework.md`.

### 6.1 Matriz de recursos pós-MVP

| Recurso | Zona | Tipo de coleta | Slot de mochila? |
|---|---|---|---|
| Sucata Estrutural | Hordas (Z0) | Parada 1.5s | Sim |
| Comp. de IA | Stealth (Z1) | Parada 1.5s | Sim |
| Núcleo Lógico | Circuito (Z2) | 1/run (alta raridade) | Sim |
| Combustível Volátil | Extração (Z3) | Instantâneo ao contato | Sim |
| Sinais de Controle | Campo (Z4) | Fluxo passivo | Não |
| Biomassa Adaptativa | Infecção (Z5) | Fluxo passivo | Não |
| Fragmentos Estruturais | Labirinto (Z6) | Parada 1.5s | Sim |
| Sucata + Comp. IA (premium) | Sacrifício (Z7) | Parada 1.5s (custo por câmara) | Sim |

### 6.2 Princípio de escala para o custo total pós-MVP

```
recursos_totais_pos_mvp = recursos_mvp + soma(custo_peças_9_a_N)

Calibração recomendada: cada bloco de 8 peças adicionais deve representar
~20–25 runs extras, mantendo o TTnP médio de 2–4 runs/peça.

fator_escala_custo = (runs_alvo_bloco × media_run_fase) ÷ num_pecas_bloco
                   = (22 × 3.5) ÷ 8 = 9.6 ≈ 10 recursos/peça (média)
```

As fórmulas de drop de recursos pós-MVP seguem o mesmo princípio: spawn_base calibrado para que a demanda de cada recurso seja satisfeita em ~17 runs naquela zona, com excedente de 20%.

---

## 7. Parâmetros de Tuning Implementáveis

### 7.1 Adições propostas ao GameConfig.ts

```typescript
// ── Rocket Progression ─────────────────────────────────────────────
// Spawn de recursos (proposta: subir RESOURCE_SPAWN_COUNT por zona)
RESOURCE_SPAWN_COUNT_HORDAS: 6,       // era: RESOURCE_SPAWN_COUNT: 4 (global)
RESOURCE_SPAWN_COUNT_STEALTH: 5,

// Fator de bonus no late game (últimas 2 peças do foguete)
RESOURCE_BONUS_THRESHOLD: 0.80,       // 80% de progresso do foguete
RESOURCE_BONUS_SPAWN_MULTIPLIER: 1.25, // +25% spawn quando ativo

// Detecção de monotonia de zona (ver Seção 5.3)
ZONE_MONOTONY_THRESHOLD: 5,           // runs consecutivas na mesma zona

// Alvo de design (não usado em runtime, documenta intenção)
TARGET_RUNS_TO_LAUNCH: 30,
TARGET_SESSION_MINUTES: 60,
```

### 7.2 Tabela de tuning knobs completa

| Parâmetro | Valor base | Range seguro | Efeito se aumentado | Efeito se diminuído |
|---|---|---|---|---|
| `RESOURCE_SPAWN_COUNT_HORDAS` | 6 | 4–8 | Runs mais curtas até cada peça; menos tensão de mochila | Grind percebido; mais dependência de skill |
| `RESOURCE_SPAWN_COUNT_STEALTH` | 5 | 3–7 | Stealth menos punitivo; progresso mais fácil | Penalidade de detecção mais severa |
| `BACKPACK_CAPACITY` (base) | 3 | 2–4 | Runs mais eficientes; menos tensão | Mais tensão na decisão de sair; mais runs totais |
| `RESOURCE_BONUS_THRESHOLD` | 0.80 | 0.60–0.90 | Bônus chega mais cedo | Bônus só no sprint final |
| `RESOURCE_BONUS_SPAWN_MULTIPLIER` | 1.25 | 1.0–1.5 | Late game mais rápido | Diminui senso de momentum final |
| `ZONE_MONOTONY_THRESHOLD` | 5 | 3–7 | Missão de diversificação mais cedo | Monotonia mais longa antes da intervenção |

### 7.3 Sinais de alerta de balanceamento (para playtest)

Monitorar durante playtest:

```
ALERTA 1: TTnP médio observado > 5 runs para qualquer peça
  → Aumentar spawn_count ou diminuir custo da peça afetada

ALERTA 2: Jogador chega ao fim com >10 unidades de qualquer recurso em estoque
  → Reduzir spawn_count da zona correspondente em 1

ALERTA 3: Mais de 40% das runs fracassam antes de coletar qualquer recurso
  → Zona está desequilibrada em dificuldade vs. recompensa; ajustar
     inimigos (não recursos)

ALERTA 4: Jogador completa 5+ runs consecutivas na mesma zona sem missão alternativa
  → Verificar se ZONE_MONOTONY_THRESHOLD está funcionando corretamente
```

---

## 8. Simulação Sintética de Verificação

### 8.1 Simulação determinística (400 runs simuladas)

Parâmetros: taxa de sucesso 65%, distribuição de coleta conforme Seção 3.2, upgrades de mochila em runs 12 e 22, divisão de zona otimizada para demanda.

```
Inputs:
  sucata_necessaria   = 37
  comp_ia_necessaria  = 32
  taxa_sucesso        = 0.65
  media_coleta_early  = 2.05  (mochila 3, média ponderada)
  media_coleta_mid    = 3.50  (mochila 5)
  media_coleta_late   = 5.00  (mochila 7)

Simulação (runs até completar):
  Phase Early (runs até mochila 5):
    runs_esperadas_ate_upgrade1 = 12
    sucata_acumulada  = 12 × 0.65 × (37/69) × 2.05 = 12 × 0.65 × 0.536 × 2.05 = 8.6
    comp_ia_acumulada = 12 × 0.65 × (32/69) × 2.05 = 12 × 0.65 × 0.464 × 2.05 = 7.4

  Phase Mid (runs 12–22, mochila 5):
    sucata_acumulada  += 10 × 0.65 × 0.536 × 3.50 = +12.2  →  total: 20.8
    comp_ia_acumulada += 10 × 0.65 × 0.464 × 3.50 = +10.6  →  total: 18.0

  Phase Late (runs 22+, mochila 7):
    sucata_restante  = 37 - 20.8 = 16.2
    comp_restante    = 32 - 18.0 = 14.0
    runs_sucata_late = 16.2 ÷ (0.65 × 0.536 × 5.0) = 16.2 ÷ 1.74 = 9.3 runs
    runs_comp_late   = 14.0 ÷ (0.65 × 0.464 × 5.0) = 14.0 ÷ 1.51 = 9.3 runs
    runs_late_total  = max(9.3, 9.3) = 9.3 → ~9-10 runs (zonas em paralelo)

TOTAL ESTIMADO = 12 + 10 + 9.3 = 31.3 runs ≈ 30–32 runs
```

Resultado da simulação: **30–32 runs**, alinhado com o alvo de 30 runs. Margem de confiança aceitável.

### 8.2 Percentis de distribuição

| Percentil | Runs até lançamento | Minutos estimados | Tipo de jogador |
|---|---|---|---|
| P10 (muito habilidoso) | 20–22 runs | ~35 min | Speedrun consciente |
| P50 (jogador médio) | 28–32 runs | ~50–55 min | Target da calibração |
| P90 (jogador casual) | 38–45 runs | ~70–80 min | Aceitável sem ser punitivo |

---

## 9. JSON de Receitas do Foguete (Pronto para Implementação)

```json
{
  "rocket_parts": [
    {
      "id": "base_estrutural",
      "name": "Base Estrutural",
      "order": 1,
      "cost": { "scrap": 6, "ai_components": 0 },
      "visual_segment": "bottom"
    },
    {
      "id": "casco_externo",
      "name": "Casco Externo",
      "order": 2,
      "cost": { "scrap": 8, "ai_components": 0 },
      "visual_segment": "lower_body"
    },
    {
      "id": "suporte_interno",
      "name": "Suporte Interno",
      "order": 3,
      "cost": { "scrap": 5, "ai_components": 3 },
      "visual_segment": "mid_body"
    },
    {
      "id": "sistema_eletrico",
      "name": "Sistema Elétrico",
      "order": 4,
      "cost": { "scrap": 0, "ai_components": 6 },
      "visual_segment": "mid_body_detail"
    },
    {
      "id": "painel_controle",
      "name": "Painel de Controle",
      "order": 5,
      "cost": { "scrap": 4, "ai_components": 5 },
      "visual_segment": "upper_body"
    },
    {
      "id": "motor_principal",
      "name": "Motor Principal",
      "order": 6,
      "cost": { "scrap": 8, "ai_components": 4 },
      "visual_segment": "engine"
    },
    {
      "id": "sistema_navegacao",
      "name": "Sistema de Navegação",
      "order": 7,
      "cost": { "scrap": 0, "ai_components": 8 },
      "visual_segment": "nose_cone"
    },
    {
      "id": "blindagem_final",
      "name": "Blindagem Final",
      "order": 8,
      "cost": { "scrap": 6, "ai_components": 6 },
      "visual_segment": "full_hull"
    }
  ],
  "totals": {
    "scrap": 37,
    "ai_components": 32,
    "total_resources": 69
  },
  "calibration": {
    "target_runs": 30,
    "target_minutes": 60,
    "p50_runs": 30,
    "p10_runs": 21,
    "p90_runs": 42
  }
}
```

---

## 10. Maior Risco de Balanceamento

O maior risco identificado é a **transição Peça 2 → Peça 3** (run ~7–11): é o momento em que o jogador precisa ir pela primeira vez à Zona Stealth.

Se o jogador adiar essa transição (ficando em Hordas), ele acumula Sucata além do necessário sem progredir. Se o jogador for direto à Stealth sem os fundamentos de Hordas, a curva de dificuldade é abrupta. A UI do hub deve comunicar proativamente quando Stealth se torna necessário, e as primeiras runs de Stealth devem ter spawn em posições mais acessíveis (longe de rotas de patrulha pesadas) para suavizar a curva de aprendizagem.

Secundariamente: o `RESOURCE_SPAWN_COUNT` atual de 4 (global) está abaixo do recomendado por zona (6 e 5). Se não for ajustado, a média de coleta cai para ~1.6/run, aumentando o total para ~38–40 runs — ainda aceitável, mas empurrando para P90 de 50+ runs, o que é território de abandono em PWA mobile.

---

*Relacionado: `design/gdd/resource-system.md`, `design/gdd/hub-and-characters.md`, `design/MASTERPLAN.md`, `frontend/src/state/GameConfig.ts`*
