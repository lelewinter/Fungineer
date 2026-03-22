# Zona de Sacrifício — Game Design Document

**Version**: 1.0
**Date**: 2026-03-22
**Status**: Draft

---

## 1. Overview

A Zona de Sacrifício é uma zona de tomada de decisão estratégica pura. O jogador se posiciona no centro de um mapa com 4–6 câmaras visíveis ao redor, cada uma contendo recursos com custos claramente sinalizados antes da entrada. Não há timer apertado, os inimigos são fracos, e a coleta é simples (1.5s padrão). O único desafio é decidir quais câmaras valem a pena visitar dado os custos que cada uma impõe. O recurso coletado é duplo — **Sucata Metálica E Componentes de IA** (os dois recursos base do MVP) em quantidades superiores às zonas originais, mas com custos que tornam impossível coletar tudo.

Esta é a única zona do jogo onde **o desafio acontece antes do movimento**, não durante. Mover é o ato de confirmar uma decisão já tomada.

---

## 2. Player Fantasy

Você está diante de 5 câmaras. Consegue ver tudo o que cada uma oferece — e tudo o que cada uma vai custar. A câmara da esquerda tem 8 Sucatas, mas vai spawnar 3 Bruisers. A câmara do centro tem 5 Componentes de IA, mas vai reduzir seu timer em 15 segundos. A câmara da direita é simples — 4 Sucatas, custo zero — mas ativa automaticamente o custo da câmara que está ao lado dela. Você olha para a composição do squad, pensa no que o foguete precisa, e decide. Depois de decidir, executar é trivial. A tensão foi toda na análise. Quando você sai da zona, a satisfação não é de quem sobreviveu — é de quem fez a escolha certa.

**Estética MDA primária**: Challenge (análise estratégica, tomada de decisão com informação completa e custos assimétricos).
**Estética secundária**: Expression (cada sessão revela o estilo de jogo do jogador — arrojado, conservador, oportunista).

---

## 3. Detailed Rules

### 3.1 Estrutura da Run

- O jogador entra **com o squad** (até 4 personagens, igual Zona Hordas)
- O mapa tem uma **câmara central (hub)** onde o jogador começa, rodeada de **4–6 câmaras de recurso**
- As câmaras de recurso são visíveis desde o centro — o jogador vê o conteúdo e o custo de cada uma antes de entrar
- **Timer da run**: 90 segundos (permissivo — dá tempo de visitar 3–4 câmaras confortavelmente)
- A run encerra quando o jogador chega ao EXIT (na câmara central, sempre disponível) ou quando o timer zera
- Morrer = fail state, perde todos os recursos coletados na run

### 3.2 Interpretação do Movimento (como arrastar funciona aqui)

- **Input**: arrastar o dedo = mover o squad
- **Significado aqui**: mover é confirmar uma decisão. Entrar em uma câmara de recurso é aceitar seu custo — não há como entrar "só para ver". O custo é ativado no momento em que qualquer membro do squad cruza a entrada da câmara
- **Parar é pensar**: ficar no centro e observar todas as câmaras antes de mover é a habilidade-chave desta zona
- **Mover é irreversível**: ao entrar em uma câmara, o custo é aplicado. Não há desfazer.

### 3.3 Mecânica Central — Câmaras de Recurso e Custos

#### Anatomia de uma Câmara de Recurso

Cada câmara exibe, na sua entrada (visível desde o centro sem entrar), um **painel informativo**:

```
┌─────────────────────────────┐
│  [Ícone do recurso]         │
│  Sucata Metálica × 8        │
│                             │
│  CUSTO: [Ícone de Custo]    │
│  Spawn: 3 Bruisers          │
└─────────────────────────────┘
```

O painel é sempre legível antes da entrada. Nenhuma informação está escondida.

#### Tipos de Custo

| Tipo | Símbolo | Efeito | Impacto |
|------|---------|--------|---------|
| **Sem custo** | Nenhum | Nenhum | Baixo risco, baixa recompensa |
| **Timer** | Relógio com "-Xs" | Reduz o timer da run em X segundos imediatamente | Menos tempo para visitar outras câmaras |
| **Inimigo** | Caveira + número | Spawna N inimigos dentro da câmara imediatamente | Combate antes de coletar o recurso |
| **Slot bloqueado** | Mochila com X | Bloqueia permanentemente 1 slot da mochila pelo restante da run | Menos capacidade de carregamento |
| **Cadeia de custo** | Corrente | Ativar esta câmara também ativa o custo de outra câmara específica | Custo indireto e inesperado se não lido com atenção |

#### Configuração de Câmaras por Run

O gerador de mapa cria 4–6 câmaras seguindo uma distribuição de custos balanceada:

| # Câmaras | Perfil de Custo | Recompensa Típica |
|-----------|----------------|-------------------|
| 1 câmara | Sem custo | 3–4 recursos mistos (baixa) |
| 1–2 câmaras | Custo simples (timer ou inimigo) | 5–7 recursos mistos (média) |
| 1–2 câmaras | Custo duplo (2 tipos de custo) | 8–10 recursos mistos (alta) |
| 1 câmara | Custo de Cadeia | 6–8 recursos + consequência indireta |

**Exemplos de câmaras geradas:**

- Câmara A: 4× Sucata | SEM CUSTO
- Câmara B: 6× Componentes de IA | CUSTO: -15s do timer
- Câmara C: 8× Sucata | CUSTO: Spawn 3 Bruisers
- Câmara D: 5× Componentes de IA | CUSTO: Bloqueia 1 slot de mochila
- Câmara E: 7× Sucata + 3× Componentes | CUSTO: Ativa o custo de Câmara B também (cadeia)
- Câmara F: 10× Sucata | CUSTO: -20s do timer + Bloqueia 1 slot

#### Ativação de Custo

- O custo é ativado no **primeiro frame** em que qualquer membro do squad cruza a linha de entrada da câmara
- O efeito é imediato e irreversível
- Timer: reduzido instantaneamente
- Inimigos: spawnam na câmara imediatamente, em posições pré-definidas (não no centro, não sobre os recursos)
- Slot bloqueado: o slot de menor índice livre é bloqueado imediatamente; recurso que estava nele não é afetado
- Cadeia: o custo da câmara ligada é ativado imediatamente, mesmo que o jogador não entre nela

#### Coleta de Recursos dentro da Câmara

- Os recursos ficam distribuídos pelo chão da câmara
- Coleta: padrão de 1.5 segundos de pausa (sistema de mochila)
- Se inimigos foram spawnados (custo de Inimigo): o jogador deve sobreviver ao combate automático do squad enquanto coleta os recursos
- Recursos não coletados na câmara ficam lá — mas o jogador só tem incentivo para voltar à câmara central, não a câmaras visitadas

### 3.4 Coleta de Recursos

- **Tipos coletados**: Sucata Metálica E Componentes de IA (ambos os recursos base)
- **Sistema de mochila padrão**: cada recurso (de qualquer tipo) ocupa 1 slot
- **Paridade de slot**: Sucata e Componentes de IA ocupam o mesmo espaço de mochila — o jogador não precisa gerenciar tipo, apenas quantidade
- A Zona de Sacrifício é a única zona que oferece os dois recursos base em quantidade premium
- Justificativa narrativa: esta zona é um depósito de emergência que a resistência encontrou — tem de tudo, mas há um preço para cada acesso

### 3.5 Risco e Fail State

#### Inimigos dentro das Câmaras

- Inimigos da Zona de Sacrifício são versões do roster da Zona Hordas (Runners, Bruisers, Spitters)
- Stats padrão: iguais à Zona Hordas
- O squad combate automaticamente — o jogador não precisa fazer nada extra
- A câmara tem espaço suficiente para o squad combater sem ficar preso
- Câmaras com custo de Inimigo sempre spawnam inimigos derrotáveis em 10–20s com squad de 2+

**Inimigos como custo vs inimigos como perigo:**
Os inimigos spawnados pelo custo são "previsíveis e gerenciáveis" — o jogador sabe exatamente quantos vão aparecer e onde. A ameaça é calculada. Isso contrasta com a Zona Hordas onde a pressão é contínua e imprevisível.

#### Pressão do Timer

- Timer de 90s começa ao entrar na run
- Câmaras de custo de timer reduzem diretamente esse timer
- Um jogador que visita duas câmaras com "-15s" cada tem apenas 60s restantes
- Isso limita quantas câmaras restantes pode visitar (ou se tem tempo de ir até o EXIT com segurança)
- Timer zerando com recursos na mochila: run encerra automaticamente, recursos são mantidos (não é fail state — mesma lógica da Corrida de Extração)
- Timer zerando na câmara sem saída: o jogador é teletransportado ao EXIT (o jogo sempre permite encerrar a run mesmo se o timer pegar o jogador preso)

#### Fail State Real

- Todos os personagens morrem = fail state; perde tudo
- Dado a fraqueza dos inimigos e o squad de 4, fail state por morte é raro e geralmente resultado de decisão muito ruim (câmara com muitos Bruisers + squad fraco)

---

## 4. Formulas

### Valor Esperado de uma Câmara

```
valor_liquido(câmara) = recursos_coletados - custo_equivalente

Conversão de custo para equivalente em recursos:
  Custo Timer -15s:   se timer médio = 90s, e rendimento médio = 0.1 recursos/s → custo ≈ 1.5 recursos
  Custo Timer -20s:   custo ≈ 2.0 recursos
  Custo Inimigos:     custo = tempo_para_derrotar × 0.1 recursos/s ≈ 10s × 0.1 = 1.0 recurso
  Custo Slot:         custo = slots_bloqueados × recursos_que_não_poderei_pegar ≈ 1–2 recursos perdidos
  Custo Cadeia:       custo = custo_da_câmara_ativada (que o jogador teria que calcular)

Exemplo:
  Câmara E: 7 Sucata + 3 Componentes = 10 recursos
  Custo: Ativa custo da Câmara B (-15s)
  valor_bruto = 10 recursos
  custo_equivalente = 1.5 recursos (15s perdidos)
  valor_líquido = 8.5 recursos

  Câmara F: 10 Sucata = 10 recursos
  Custo: -20s + bloqueia 1 slot
  custo_timer = 2.0 recursos
  custo_slot = 1.5 recursos (estimativa de 1-2 recursos não coletáveis)
  valor_líquido = 10 - 2.0 - 1.5 = 6.5 recursos

  Câmara A (sem custo): 4 recursos = 4.0 valor líquido

  Câmara A tem melhor valor líquido por recurso (~1.0), mas absoluto menor.
  Câmara E tem maior valor absoluto e razoável valor líquido (8.5).
  A "decisão certa" depende do contexto do jogador.
```

### Máximo Teórico vs Máximo Real por Run

```
Cenário máximo teórico (todas as câmaras, sem custos):
  Assumindo 6 câmaras com média de 7 recursos cada:
  max_teorico = 6 × 7 = 42 recursos

Máximo real com 3 slots de mochila (padrão):
  mochila_base = 3 slots
  O jogador coleta até 3 recursos antes de ter que ir ao EXIT ou descartar

Máximo real com 7 slots (upgrade 2):
  mochila_upgrade = 7 slots
  O jogador pode coletar de 1–2 câmaras grandes sem atingir o limite
  max_pratico_upgrade = 7 recursos por run

Conclusão: o sistema de mochila é o principal bottleneck, não os custos.
A Zona de Sacrifício recompensa quem tem upgrade de mochila mais do que qualquer outra zona.
```

### Pressão de Timer por Câmaras Visitadas

```
timer_inicial = 90s
custo_deslocamento_por_câmara = 5s (deslocamento centro → câmara → centro)
tempo_coleta_por_recurso = 1.5s

Câmara com 7 recursos (sem custo):
  tempo_total = 5s (deslocamento) + 7 × 1.5s (coleta) = 5 + 10.5 = 15.5s

Timer restante após 3 câmaras similares: 90 - (3 × 15.5) = 90 - 46.5 = 43.5s
  → Tempo confortável para EXIT (5s) + margem de 38.5s

Timer restante após câmara com -15s de custo:
  90 - 15 (custo) - 15.5 (tempo câmara) = 59.5s → ainda confortável

Timer restante após 2 câmaras com -15s cada:
  90 - 30 (custos) - 31 (tempo 2 câmaras) = 29s → apertado
```

---

## 5. Edge Cases

| Situação | Comportamento |
|----------|---------------|
| Custo de Cadeia aponta para câmara que o jogador já visitou | Custo da cadeia é aplicado ao histórico da câmara (se a câmara já foi visitada, o custo que ela teria ativado já foi pago ou não; a Cadeia não ativa nada retroativamente — apenas aplica os custos futuros) |
| Jogador entra na câmara de Cadeia sem ter lido o painel | O custo é ativado normalmente; ignorância não é proteção. O painel estava legível antes da entrada |
| Mochila completamente cheia ao entrar em câmara com recursos | Recursos no chão são ignorados silenciosamente; o jogador pode sair e ir ao EXIT. Sem penalidade adicional |
| Custo de Slot bloqueado com mochila já cheia (ex: 3/3 slots ocupados) | O slot é bloqueado — capacidade reduz para 2. Os 3 recursos já coletados permanecem; apenas novos recursos ficam bloqueados pelo slot a menos. Mochila efetiva = 2 slots para o restante da run |
| Timer zera enquanto jogador está em câmara sem saída (inimigos bloqueando) | Run encerra; jogador é teletransportado ao centro/EXIT com os recursos já coletados. Inimigos persistentes não causam dano extra no teleporte |
| Câmara com custo de Inimigo: todos os personagens morrem durante o combate | Fail state: perde todos os recursos coletados até agora na run (incluindo os da câmara atual que ainda não foram coletados) |
| Câmara F (custo duplo) com squad de 1 personagem (Doutor sozinho) | Custo é o mesmo; o jogador assumiu o risco com squad fraco. O inimigo spawnado pode ser difícil de derrotar — mas o Doutor ainda tem DPS automático |
| Câmara sem custo com 3 recursos e mochila com 1 slot livre | O jogador coleta 1 recurso (ocupa o slot) e os 2 restantes ficam no chão. Sem prompt. Sem problema. O jogador sabe da limitação |
| Câmara de Cadeia: o custo ativado é de outra câmara de Cadeia | Cadeia não propaga em cascata — apenas 1 nível de ativação. O custo ativado da câmara B (que é uma cadeia) ativa apenas o custo de B, não os custos da câmara que B apontaria |
| Câmara visitada múltiplas vezes (jogador entra, sai, entra de novo) | O custo é ativado apenas na primeira entrada. Recursos não coletados na primeira visita ainda estão lá. A segunda entrada não ativa nenhum custo adicional |

---

## 6. Dependencies

| Sistema | Relação | Direção |
|---------|---------|---------|
| **Sistema de Mochila** | Recursos de ambos os tipos ocupam slots; upgrades de mochila têm impacto máximo aqui; custo de slot bloqueado interage diretamente com a capacidade da mochila | Zona depende do Sistema de Mochila e adiciona o custo "Slot Bloqueado" que modifica a mochila |
| **Sistema de Recursos** | Sucata Metálica e Componentes de IA são os mesmos recursos do MVP; esta zona distribui os dois tipos simultaneamente | Zona fornece dois tipos de recurso; Sistema de Recursos já registra ambos |
| **Foguete (Hub)** | Ambos os recursos contribuem para as receitas do foguete (ver resource-system.md) | Foguete consome ambos |
| **Sistema de Squad (Zona Hordas)** | Squad completo herda comportamento da Zona Hordas; combate automático funciona igual; composição do squad influencia viabilidade de câmaras com custo de inimigo | Zona depende do Sistema de Squad |
| **Hub / Mapa-Mundo** | Jogador acessa a zona a partir do hub | Hub controla acesso |
| **Sistema de Timer** | Timer de 90s com custo de timer aplicado por câmaras (efeito de redução dinâmica do timer durante a run) | Zona usa o sistema de timer e define o custo de timer como modificador |
| **Gerador de Câmaras** | Câmaras, recursos, tipos de custo e valores são gerados proceduralmente seguindo distribuição de custos balanceada | Zona define parâmetros de distribuição para o Gerador |
| **Zona Hordas** | Zona irmã; usa os mesmos inimigos (Runners, Bruisers, Spitters) com stats padrão | Zona herda inimigos; dependência técnica de assets |
| **Ex-Executivo (Hub NPC)** | O upgrade de mochila do Ex-Executivo é especialmente valioso aqui; potencial missão de confiança: "tome uma decisão difícil na Zona de Sacrifício" | Relação temática com progressão de personagem |

---

## 7. Tuning Knobs

| Parâmetro | Valor Base | Range Seguro | Categoria | Efeito no Gameplay |
|-----------|------------|--------------|-----------|---------------------|
| `timer_run` | 90s | 75–120s | Gate | Generoso por design — reduzir penaliza custo de timer mais duramente |
| `n_camaras_por_run` | 5 | 4–6 | Curve | Número de decisões disponíveis por run |
| `n_camaras_sem_custo` | 1 | 1–2 | Gate | Sempre pelo menos uma câmara "segura" — remove paralisia total de análise |
| `recursos_camara_sem_custo` | 3–4 | 2–5 | Curve | Recompensa da câmara mais segura; piso de retorno garantido |
| `recursos_camara_custo_alto` | 8–10 | 6–14 | Curve | Recompensa máxima; define o teto para arrojo |
| `custo_timer_medio` | -15s | -10s a -20s | Gate | Custo de tempo médio; abaixo de 10s = trivial, acima de 25s = muito punitivo |
| `custo_timer_alto` | -20s | -15s a -30s | Gate | Custo de tempo alto; câmaras de maior recompensa |
| `n_inimigos_custo_baixo` | 2–3 Runners | 1–4 | Gate | Custo de combate leve; derrota em ~5s com squad de 2+ |
| `n_inimigos_custo_alto` | 2–3 Bruisers | 1–4 | Gate | Custo de combate pesado; derrota em ~15s com squad de 2+ |
| `chance_custo_cadeia` | 20% por câmara | 10–30% | Gate | Frequência de custos indiretos; mais = mais complexidade de análise |
| `chance_custo_duplo` | 30% por câmara | 20–40% | Curve | Proporção de câmaras com 2 tipos de custo |

---

## 8. Acceptance Criteria

**Funcional (pass/fail para QA):**

- [ ] O painel de informação de cada câmara (recurso + custo) é visível desde a câmara central antes de entrar
- [ ] O custo é aplicado no primeiro frame de cruzamento da entrada da câmara por qualquer membro do squad
- [ ] Custo de Timer reduz o timer imediatamente e o novo valor é refletido na UI
- [ ] Custo de Inimigo spawna exatamente os inimigos indicados no painel, nas posições predefinidas dentro da câmara
- [ ] Custo de Slot bloqueia 1 slot de mochila imediatamente; capacidade máxima da mochila reduz em 1 para o restante da run
- [ ] Custo de Cadeia aplica o custo da câmara-alvo imediatamente ao entrar na câmara-fonte; o efeito é limitado a 1 nível de propagação
- [ ] Entrar na mesma câmara duas vezes não reativa o custo na segunda entrada
- [ ] Timer zero teleporta o jogador ao EXIT com todos os recursos já coletados (não é fail state)
- [ ] Todos os personagens mortos = fail state; perde todos os recursos da run
- [ ] EXIT está sempre disponível na câmara central durante toda a run

**Experiencial (validado por playtest):**

- [ ] Novo jogador entende o sistema de custo/recompensa sem tutorial — apenas lendo o painel visual da câmara
- [ ] O momento de "parar no centro e analisar as câmaras" é reportado pelos playtestadores como a parte mais interessante da run
- [ ] Pelo menos 60% dos playtestadores expressam uma preferência por estratégia específica (arrojado vs conservador) após 3 runs
- [ ] A câmara de Cadeia surpreende o jogador na primeira vez, mas ele entende o mecanismo imediatamente após a ativação
- [ ] Uma run com apenas câmaras sem custo é percebida como "segura mas insatisfatória" (incentivando o risco)
- [ ] Uma run completa (entrada ao EXIT) ocorre entre 30 e 70 segundos para a maioria dos jogadores

---

*Relacionado: `design/gdd/game-concept.md`, `design/gdd/resource-system.md`, `design/gdd/mvp-game-brief.md`, `design/gdd/hub-and-characters.md`, `design/gdd/enemies-horda-zone.md`*
