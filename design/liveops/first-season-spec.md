# Fungineer — Primeira Temporada: "Ciclos do Fim do Mundo"

**Versão**: 1.0
**Data**: 2026-06-05
**Status**: Draft para revisão
**Depende de**: `design/liveops/post-launch-plan.md`, `HubState.resetForNewCycle()`

---

## 0. O que este documento define

Este documento especifica a camada de retenção construída sobre o Novo Ciclo (NG+) existente.
Não cria sistemas novos do zero — ancora tudo no que `resetForNewCycle()` já faz e no framework
de zonas já implementado.

Escopo: primeiros 90 dias pós-launch. Time indie de 1-2 devs. Sem monetização predatória.

---

## 1. O Gancho do Novo Ciclo — O que muda numa segunda jornada

### 1.1 O que resetForNewCycle() zera (lido diretamente do código)

```
stock               → todos os recursos voltam a zero
rocket_pieces_built → volta a 0 (foguete desmontado)
rescued_characters  → equipe perdida
zones_unlocked      → todas true (sem regressão de acesso)
zone_deterioration  → todos 0 (inimigos voltam ao baseline)
total_runs          → contador zerado
lore_found          → fragmentos perdidos
room_unlocked       → volta ao padrão {saida_hordas: true, lab_rival: true}
```

### 1.2 O que resetForNewCycle() preserva

```
hub_variant         → paleta visual escolhida pelo jogador
hub_density         → preferência de UI
hub_ui_visible      → visibilidade da UI do hub
```

**Implicação de design:** O ciclo 2 começa com o mesmo jogo mecânico, mas com contexto
narrativo completamente diferente — o jogador já sabe o que o foguete representa, já leu os
lores, já conhece o fim. A segunda jornada é vivida com peso que a primeira não tinha.
O reset de `lore_found` tem papel dramático: o jogador recolhe os mesmos fragmentos que já leu,
mas agora os entende de um ângulo diferente.

---

## 2. Modificadores de Ciclo — O que torna o Ciclo 2+ diferente

### 2.1 Principio

O código de deterioração já escala inimigos em três estágios via `getSpawnMultiplier()`
(1.0 → 1.25 → 1.5×, ativados em `DETERIORATION_STAGE1_RUNS: 6` e `STAGE2_RUNS: 14`).
Modificadores de ciclo usam esse mesmo eixo de dificuldade — sem novo sistema de progressão,
apenas parâmetros diferentes no ciclo subsequente.

### 2.2 Tabela de Modificadores por Ciclo

| Ciclo | Nome              | Efeito mecânico                                                                 | Justificativa narrativa                              |
|-------|-------------------|---------------------------------------------------------------------------------|------------------------------------------------------|
| 1     | Baseline          | Padrão. Deterioração começa em 0.                                               | Primeira fuga. O mundo ainda está "intacto".         |
| 2     | CORE Desperto     | Deterioração começa em estágio 1 (spawn ×1.25 desde a run 1). `total_runs` inicia em `STAGE1_RUNS` internamente. | CORE processou a fuga anterior. Protocolos reforçados. |
| 3+    | Protocolo Vermelho| Deterioração começa em estágio 2 (spawn ×1.5 desde o início). Backpack capacity -1 (sobrepõe o base de 3 → 2). | CORE classifica a tripulação como ameaça máxima. Extração mais difícil. |

**Implementação:** Ao iniciar um novo ciclo, um campo `cycle_number` (inteiro, persistido no
snapshot mas não resetado por `resetForNewCycle`) controla qual modificador está ativo.
`total_runs` é inicializado no valor de limiar correspondente. A redução de backpack capacity
é aplicada como offset negativo em `getBackpackCapacity()`.

### 2.3 Modificadores de Zona Semanais (sobrepõem ao ciclo)

Um modificador ativo por semana, em rotação pelas 11 zonas. Usa a infraestrutura de seed
semanal descrita em `post-launch-plan.md` seção 2.3. O modificador é cosmético ao sistema
mas muda radicalmente a leitura de posicionamento:

| Zona           | Modificador Disponível        | Regra resumida                                                          |
|----------------|-------------------------------|-------------------------------------------------------------------------|
| Hordas         | Modo Neblina                  | Visibilidade reduzida a 60% para todos (jogador e inimigos).            |
| Stealth        | Patrulha Dupla                | Dois sentinelas com cones dessincronizados na mesma área.               |
| Circuito       | Corrente Invertida            | Placas ativadas "queimam" — o jogador deve evitá-las após ativar.       |
| Extração       | Vento Cruzado                 | Velocidade de troca de raia aumentada em 30%; obstáculos chegam mais cedo. |
| Infecção       | Amplificador Duplo            | Percentual de amplificadores dobrado (0.15 → 0.30); spread mais rápido. |
| Labirinto      | Paredes Rápidas               | `MAZE_WALL_CLOSED_MIN/MAX` reduzido em 2s — menos tempo entre fechamentos. |
| Sacrifício     | Drones Ferozes                | `SACRIFICE_DRONE_ESCALATE_INTERVAL` reduzido 30%; cap de drones +1.    |
| Field Control  | Captura Inversa               | Pontos neutros começam capturados pelo inimigo — o jogador parte atrás. |
| Cordilheira    | Tempestade                    | Timer reduzido em 15s; recursos mais espalhados.                        |
| Torres         | Torres Silenciosas            | Sem animação de alerta visual; apenas o som sinaliza ativação.          |
| Catedral       | Pressão Crescente             | Timer começa 20s mais curto; bônus de tempo por ação correto dobrado.  |

---

## 3. Desafio Diário

### 3.1 Estrutura

O desafio diário não é um modo separado — é uma lente sobre uma run normal.

**Formato:**
- Uma zona específica designada para o dia (rotação fixa: as 11 zonas em ciclo de 11 dias,
  sem aleatoriedade — previsível, planejável).
- Uma condição adicional aplicada sobre a zona do dia.
- Recompensa: um fragmento de lore desbloqueado no hub (terminal de CORE, entrada de diário,
  diálogo de NPC). Nenhuma recompensa de gameplay.

**Regras:**
- Um único attempt conta para o desafio (não é necessário completar na primeira tentativa —
  apenas completar a zona com a condição no dia conta).
- Sem penalidade por não jogar. O desafio do dia expirado simplesmente desaparece.
  Nenhum streak, nenhuma punição de ausência.
- O recurso coletado na run do desafio vai normalmente para o estoque do foguete.

### 3.2 Condições de Desafio Diário

| Tier | Condição                     | Descrição                                                                 |
|------|------------------------------|---------------------------------------------------------------------------|
| A    | Sem baixas                   | Completar sem nenhum personagem morrer.                                  |
| A    | Extração mínima              | Completar com apenas 1 slot de mochila preenchido (testar contenção).    |
| B    | Sem usar poder               | Completar sem ativar o Power do líder da party.                          |
| B    | Sob pressão                  | Timer reduzido em 20% em relação ao normal da zona.                      |
| C    | Cobertura total              | Cobrir toda a arena antes de extrair (para zonas com deslocamento livre). |

Cada nível de condição define a dificuldade percebida:
- **A** — acessível, voltado para jogadores em qualquer estágio
- **B** — requer familiaridade com a zona
- **C** — maestria; não obrigatório

O desafio do dia alterna entre tiers A e B (C apenas no fim de semana).

### 3.3 Recompensas do Desafio Diário

| Completou | Recompensa                                                                 |
|-----------|---------------------------------------------------------------------------|
| Sim       | Fragmento de lore desbloqueado: um log de terminal ou diálogo de NPC inédito exibido no hub ao retornar. |
| Não       | Nenhuma punição. O jogador pode revisitar o fragmento quando completar a zona em qualquer run futura (não é exclusivo permanente — apenas antecipado para quem jogou o desafio). |

**Nota sobre "exclusividade":** Fragmentos não são bloqueados para sempre por quem não jogou o
desafio. Eles se tornam disponíveis normalmente após 14 dias de qualquer forma. A recompensa
do desafio é acesso antecipado ao lore, não conteúdo permanentemente exclusivo.

### 3.4 Implementação mínima

- Backend: o endpoint `GET /api/daily-challenge` retorna `{ zone_id, condition, day_id }`.
  O `day_id` é derivado de `hash(data_iso)` — sem banco de dados extra.
- Frontend: flag visual na zona correspondente no mapa-mundo. Um ícone discreto.
  Nenhuma nova UI de sistema de missões necessária.
- Custo de produção: escrever ~20 fragmentos de lore em antecipação (2-3 dias de escrita)
  e o endpoint de seed. O conteúdo narrativo já existe no worldbuilding — apenas fragmentar
  em entradas discretas.

---

## 4. Desafio Semanal — "A Run da Semana"

Herda diretamente a estrutura de `post-launch-plan.md` seção 2.3, com especificação
adicional para a temporada.

### 4.1 Estrutura

- Seed global sortida toda segunda-feira 00:00 UTC.
- Zona em rotação semanal (11 semanas = ciclo completo de zonas).
- Modificador de zona da semana ativo simultaneamente (ver tabela 2.3).
- Todos os jogadores jogam exatamente o mesmo layout.

### 4.2 Condição Especial Semanal

Além do modificador de zona, a run da semana inclui uma **meta de domínio** — uma condição
que mede não apenas "completou" mas "quão bem completou":

| Nível de domínio | Critério                                                        | Recompensa adicional                  |
|------------------|-----------------------------------------------------------------|---------------------------------------|
| Completou        | Chegou à extração com pelo menos 1 slot cheio.                 | Fragmento de lore semanal (garantido) |
| Sem perdas       | Completou sem nenhum personagem cair.                          | Segundo fragmento de lore (aprofundamento do mesmo arco) |
| Domínio pleno    | Completou sem perdas e com backpack cheia (todos os slots).    | Entrada de diário de Paulo — narrativa rara, disponível apenas via domínio pleno desta zona esta semana. |

"Domínio pleno" é exigente mas não impossível para um jogador experiente. O fragmento de Paulo
é conteúdo narrativo de alto valor (revela a perspectiva dele sobre o Projeto Olímpio) que
pode ser visto em wikis — a exclusividade temporal é de semanas, não permanente.

### 4.3 Ausência e tolerância

Quem não jogou a run da semana não perde acesso permanente a nada. Após 28 dias, todos os
fragmentos da semana são publicados no changelog público do jogo. Isso respeita o tempo do
jogador e elimina FOMO como mecanismo de pressão.

---

## 5. Metas de Domínio por Zona — Objetivos de Longo Prazo

### 5.1 O que são

Metas de domínio são conquistas informais não rastreadas por sistema de achievements (evita
infra desnecessária) mas exibidas como "objetivos conhecidos" na tela de entrada de cada zona.
São a resposta do jogo para a questão "o que faço depois de ter visto o fim narrativo?"

### 5.2 Formato

Cada zona tem três metas de domínio:

```
[Zona Hordas]
  1. Sobreviver às 3 ondas sem mover o líder para fora do quadrante central.
  2. Completar com todos os 4 slots de backpack preenchidos.
  3. Vencer a run inteira sem nenhum personagem receber dano.
```

Essas metas não têm rastreamento automático inicial — são objetivos declarativos que o jogador
tenta por autoimposto. Em uma atualização futura (mês 3-4), podem receber rastreamento simples
via evento `zone_complete` com flags de condição.

### 5.3 Por que isso funciona sem infra adicional

A deterioração de zona (`zone_deterioration`) já cria variação natural de dificuldade.
As metas de domínio adicionam uma camada de desafio de posicionamento autoimposto que não
requer código novo — apenas texto descritivo exibido na tela de zona. Custo de produção:
escrever 33 objetivos (11 zonas × 3 metas). Estimativa: meio dia de trabalho.

---

## 6. Métricas de Retenção D1/D7/D30

### 6.1 Métricas prioritárias para a temporada (instrumentar no lançamento)

**Métrica T1 — Taxa de início de Ciclo 2 (retenção pós-conclusão)**

```
ciclo2_start_rate = jogadores_que_iniciaram_ciclo_2 / jogadores_que_completaram_foguete
```

Esta é a métrica mais importante da temporada: valida se o gancho do Novo Ciclo está funcionando.
Meta conservadora para indie: >40%. Abaixo de 25% indica que a tela de vitória não está
comunicando o gancho do ciclo 2 com clareza suficiente.

Evento a instrumentar: `new_cycle_started` com `{ cycle_number, previous_cycle_time_seconds }`.

**Métrica T2 — Participação no Desafio Diário (engajamento recorrente)**

```
daily_challenge_participation = runs_com_flag_desafio_ativo / DAU_do_dia
```

Meta: >20% do DAU em dias com desafio ativo. Abaixo de 10% por três dias consecutivos indica
que a comunicação in-game do desafio não está sendo vista — revisar posicionamento visual
no mapa-mundo.

Evento a instrumentar: `daily_challenge_started` e `daily_challenge_completed` com `{ zone_id, condition, day_id }`.

**Métrica T3 — Retention D7 cohorte de launch**

```
D7_retention = jogadores_que_tiveram_sessão_no_dia_7 / jogadores_que_tiveram_sessão_no_dia_1
```

Meta base (indie realista): >15%. Se D7 for >20%, o loop diário está funcionando e os
recursos de conteúdo da temporada estão justificados. Se for <10%, investigar qual zona está
com taxa de conclusão abaixo de 30% — o problema provavelmente está na curva de dificuldade,
não na falta de conteúdo de temporada.

Evento a instrumentar: `session_start` com timestamp (já descrito em `post-launch-plan.md`).

### 6.2 Métricas secundárias (adicionar no mês 2)

- **Distribuição de nível de domínio semanal**: quantos jogadores atingiram "completou" vs.
  "sem perdas" vs. "domínio pleno" por zona. Identifica quais zonas são percebidas como mais
  difíceis pelos jogadores que se engajam com o desafio semanal.
- **Ciclo médio de chegada ao foguete**: `tempo_médio_entre_new_cycle_started e rocket_complete`
  no ciclo 2. Se for mais de 50% mais curto que no ciclo 1, o modificador "CORE Desperto" pode
  estar subestimado. Se for mais de 3× mais longo, pode estar punindo demais.

---

## 7. Cadência Sustentável para os Primeiros 90 Dias

### 7.1 Princípio de operação

Reutilizar o framework de zonas existente como motor de conteúdo. Nenhum conteúdo novo que
exija construir sistemas novos. A cadência é:

- **Semanal (automático):** seed semanal gerada por hash de data ISO. Custo de operação: zero
  após implementação inicial.
- **Semanal (editorial):** escolher o modificador da semana e escrever o fragmento de lore
  correspondente. Custo: 30 min de escrita por semana.
- **Quinzenal:** revisar métricas T1/T2/T3 e ajustar se necessário (dificuldade de condição
  diária, posicionamento de UI). Custo: 1h de análise.

### 7.2 Calendário de 90 dias

```
DIA 1 (Launch)
  Seed semanal ativa.
  Desafio diário ativo (Zona 1 do ciclo de 11).
  Metas de domínio visíveis na entrada de cada zona.

SEMANA 1-2
  Observação: monitorar T1 (início ciclo 2) e T3 (D7).
  Nenhum conteúdo novo — apenas correções de bugs.

SEMANA 3
  Primeiro ajuste de balanceamento se taxa de conclusão de alguma zona < 30%.
  Escrever os 20 fragmentos de lore do mês 2 (buffer).

MÊS 2 (dia 30-60)
  Changelog de QoL com notas públicas.
  Métricas secundárias instrumentadas.
  Avaliação: se D7 < 10%, investigar zona problemática antes de qualquer outro item.

MÊS 2-3 (dia 45-75)
  Primeiro modificador de zona novo (Tipo A — 1-2 dias de dev).
  Priorizar a zona com maior participação na run semanal (indica amor da comunidade).
  Escrever fragmento de lore que justifica o modificador narrativamente.

MÊS 3 (dia 75-90)
  Avaliação de D30 e ciclo2_start_rate.
  Se ciclo2_start_rate > 40%: confirmar roadmap de missão de NPC nova (Tipo B).
  Se ciclo2_start_rate < 25%: revisar tela de vitória — o gancho não está comunicando.
  Changelog público de 3 meses.
```

### 7.3 O que NÃO fazer neste período

- Não adicionar zona nova antes do mês 6 (regra de `post-launch-plan.md` seção 2.4 Tipo C).
- Não criar sistema de achievements/conquistas antes de validar D30 > 8%.
- Não aumentar a frequência de desafios (diário já é o máximo sustentável sem grind).
- Não criar recompensas de gameplay para desafios — apenas lore.

---

## 8. Alinhamento com Pilares do Jogo

| Pilar do GDD                   | Como a temporada respeita                                                  |
|--------------------------------|----------------------------------------------------------------------------|
| Challenge como estética        | Modificadores de ciclo e condições de desafio aumentam dificuldade de posicionamento, não de grind. |
| Variedade radical entre zonas  | A rotação de 11 dias mantém o foco em cada zona individualmente.          |
| Cada run é uma aposta          | A run da semana e os desafios usam as apostas existentes — sem modo seguro especial. |
| Narrativa integrada à mecânica | Recompensas são lore, não poder. O reset de `lore_found` no ciclo 2 é dramático por design. |
| Sem monetização predatória     | Sem streaks punitivos. Sem conteúdo de gameplay exclusivo. Lore temporário vira público em 28 dias. |

---

## 9. Sumário Técnico de Implementação

### Campos novos no HubStateSnapshot (versão 2)

```typescript
cycle_number: number;       // Qual ciclo está ativo (1 = baseline, 2 = CORE Desperto, 3+ = Protocolo Vermelho)
daily_challenge_completed: string[]; // IDs dos desafios diários completados (para não duplicar recompensa)
lore_unlocked_early: string[];       // Fragmentos desbloqueados antecipadamente via desafio
```

`resetForNewCycle()` incrementa `cycle_number` e limpa `daily_challenge_completed`, mas
preserva `lore_unlocked_early` (o jogador já leu — sem senso retirar).

### Novos endpoints (mínimos)

```
GET /api/daily-challenge
→ { zone_id, condition, day_id, lore_fragment_id }
  (day_id = hash(data_iso_utc), determinístico)

GET /api/weekly-seed
→ { zone_id, seed, modifier_id, week_id }
  (já especificado em post-launch-plan.md — adicionar modifier_id)

POST /api/event
→ { event: "daily_challenge_completed" | "new_cycle_started" | ..., data: {...} }
  (endpoint existente — adicionar novos event types)
```

---

*Relacionado: `design/liveops/post-launch-plan.md`, `frontend/src/state/HubState.ts`,
`frontend/src/state/GameConfig.ts`*
