# Fungineer — Plano de Pós-Lançamento e Retenção

**Versão**: 1.0
**Data**: 2026-06-05
**Status**: Aprovado para referência

**Premissas documentadas** (subagente não-interativo):
- Time indie pequeno: 1-2 devs. Nenhuma cadência AAA.
- PWA mobile-first, single-player, sem multiplayer.
- Monetização: modelo premium ou doação; nenhum modelo pay-to-win.
- O jogo tem fim narrativo definido (foguete + 3 finais). Retenção serve à descoberta de conteúdo, não a um loop infinito vazio.
- Backend FastAPI/SQLite já existe para save remoto — métricas podem ser enviadas para o mesmo serviço sem infra adicional.
- "Pós-lançamento" assume que M9 (Ship) está completo: 11 zonas, meta-loop, 3 finais.

---

## 1. Loop de Retenção

### Por que um roguelike de "só-movimento" retém diferente

A retenção clássica de roguelike se apoia em "mais uma run" via builds emergentes e poder crescente. Fungineer não tem builds — cada zona é um minigame com regras fixas. O que retém aqui é diferente: **maestria de posicionamento** (Challenge como estética primária do GDD) e **progressão narrativa** (foguete + confiança dos personagens).

Isso define o loop de retenção em três camadas:

---

### Camada 1 — Tensão da Run (~2 minutos)

O gatilho de retorno no nível micro não é "eu quero mais poder" — é "eu sei que posso fazer melhor". A decisão de sair cedo vs. arriscar mais slots é o coração do loop.

**O que faz o jogador repetir runs:**
- A sensação de que a morte foi evitável por posicionamento. O jogador volta porque quer provar que entendeu a zona.
- O recurso que faltou para completar a próxima peça do foguete. A receita visível no hub cria uma meta concreta para a próxima run.
- O personagem que quase acompanhou (confiança a 55%) — mais uma missão e ele vai na próxima run.

**Design implication**: A tela de resultado ao voltar de uma run é o momento mais importante de retenção. Deve mostrar claramente: (a) o que o jogador coletou, (b) quanto falta para a próxima peça do foguete, (c) qual missão de NPC está mais próxima de completar. Três ganchos visíveis antes de o jogador fechar o jogo.

---

### Camada 2 — Progressão de Sessão (5-15 minutos)

Entre runs, o hub é o espaço de recompensa. O foguete crescendo é a "âncora emocional" declarada no GDD — deve ser visível, animado, comemorativo. Cada peça nova que aparece na estrutura é uma pequena vitória tangível.

**O que faz o jogador passar para a próxima zona:**
- Curiosidade sobre "o que mover significa" em uma zona nova. A variedade radical entre zonas (Pilar 2) é o motor de descoberta.
- O desbloqueio de uma nova zona é um evento narrativo: o Doutor e algum NPC comentam o que está lá dentro antes de o jogador entrar pela primeira vez.
- A missão de confiança ativa: o NPC pediu algo específico e o jogador quer cumprir antes de sair.

**Design implication**: A ordem de desbloqueio das zonas deve ser curada, não escolha livre desde o início. Revelar uma zona nova a cada 2-3 peças do foguete entregues mantém a sensação de descoberta distribuída ao longo da campanha.

---

### Camada 3 — Retorno Diário (o que traz o jogador de volta amanhã)

Aqui está o núcleo da questão de retenção pós-launch. Fungineer tem fim narrativo — quando o foguete está completo e o final foi visto, o que traz o jogador de volta?

**Três respostas honestas para um jogo indie single-player:**

**Resposta A — Os outros finais.** O jogo tem três finais com condições distintas (Final C exige todos os 10 personagens a 100% de confiança). O jogador que viu o Final A sabe que existe o Final C e que é difícil. Isso é retenção legítima: não é grind artificial, é conteúdo real que o jogador ainda não viu.

**Resposta B — Domínio por zona.** O roguelike cria variação procedural em cada run. Um jogador que dominou a Zona Hordas ainda pode aprender a Zona Catedral. O objetivo informal de "completar todas as zonas sem morrer" é uma meta de maestria que não precisa de sistema formal para existir.

**Resposta C — Seed fixo semanal.** Ver seção 2.3 abaixo. É o único mecanismo de retorno diário/semanal que faz sentido para o escopo indie sem criar grind.

**Conclusão sobre o loop de retenção:** Fungineer é um jogo com começo, meio e fim. O objetivo não é reter infinitamente — é fazer o jogador completar a jornada (foguete completo, 3 finais vistos) e sair com a pergunta filosófica do jogo incrustada. Retenção além disso vem de conteúdo novo genuíno, não de sistemas de engagement forçado.

---

## 2. Cadência de Conteúdo Sustentável

### Princípio-guia para indie

Um time de 1-2 devs não pode manter cadência de conteúdo AAA. Cada item abaixo foi dimensionado para ser executável sem burn-out. A regra é: **um conteúdo novo bem-feito a cada 6-8 semanas vale mais do que três conteúdos apressados a cada 2 semanas.**

---

### 2.1 Fase 0 — Pré-Launch (últimas 4 semanas antes do ship)

Estas são tarefas de live-ops que precisam estar prontas no dia de lançamento, não depois:

- [ ] **Analytics básico instrumentado** (ver seção 4). Sem dados do D1, as decisões de conteúdo futuro são cegas.
- [ ] **Página de atualizações** dentro do próprio hub ou como changelog externo — jogadores precisam saber que o jogo está sendo mantido.
- [ ] **Seed semanal funcionando** (ver 2.3) — deve ir ao ar na semana 1, não semanas depois.
- [ ] **Formulário de feedback** linkado da tela de resultado de run. Uma linha de texto + botão. Nada mais.

---

### 2.2 Fase 1 — Primeiros 3 meses pós-launch (consolidação)

Nenhum conteúdo novo. Foco exclusivo em:

**Mês 1**: Corrigir bugs reportados. Ajustar dificuldade de zonas com base em dados reais de conclusão (ver métricas na seção 4). Tunar a curva de progressão do foguete se jogadores estão chegando ao final muito rápido ou muito devagar.

**Mês 2**: Se a curva de retenção D7 for abaixo de 20%, investigar qual zona está sendo abandonada (taxa de conclusão por zona). Ajustar, não adicionar. Conteúdo novo com base ruim enterrada debaixo é desperdício.

**Mês 3**: Primeiro changelog público de qualidade-de-vida. Pequenas melhorias de UX, ajustes de feedback visual, talvez um diálogo novo de NPC. Sinaliza que o jogo está vivo sem exigir grande produção.

---

### 2.3 Seed Fixo Semanal — "A Run da Semana"

Este é o mecanismo de engajamento recorrente mais adequado ao design de Fungineer. Custo de implementação: baixo (seed determinístico já implícito em geração procedural). Valor de retenção: alto.

**Como funciona:**
- Uma vez por semana (segunda-feira 00:00 UTC), o backend sorteia e publica um seed global.
- Todos os jogadores que fizerem a "Run da Semana" jogam com exatamente o mesmo layout de zona, mesma distribuição de recursos, mesmos padrões de inimigos.
- A zona da semana é escolhida em rotação (11 zonas = 11 semanas de ciclo).
- O jogador vê um indicador no mapa-mundo: "Run da Semana: Zona Circuito — Seed #0047".
- Ao completar, o jogo registra o resultado localmente (recursos coletados, morreu ou não, tempo).

**Por que funciona no design do Fungineer:**
- Respeita o Pilar 4 (cada run é uma aposta) sem modificá-lo.
- Cria conversa social orgânica: "você fez a run da semana? eu fui pra Zona Catedral e travei na segunda câmara". Isso não exige sistema de amigos — acontece em qualquer fórum ou grupo.
- Não pune quem não joga. Quem perdeu a semana, perdeu. Sem FOMO agressivo, sem recompensa exclusiva — apenas a experiência compartilhada.

**Recompensa da Run da Semana:**
- Nenhuma recompensa exclusiva de gameplay. Recompensa é um fragmento de lore extra: um log de terminal, um diálogo inédito de NPC, uma entrada do diário de Paulo. Conteúdo narrativo que expande o mundo sem afetar o balanço.
- Isso é eticamente limpo: quem não joga a run semanal não perde poder. Perde apenas um fragmento de contexto que pode ser recuperado em wikis ou futuros changelogs.

**Custo de implementação:**
- Backend: endpoint `GET /api/weekly-seed` que retorna `{ zone, seed, week_id }`. Cron job semanal ou seed derivado de `hash(semana_iso)` — sem banco de dados extra.
- Frontend: flag visual no mapa-mundo. Registro local do resultado. Zero infra adicional.

---

### 2.4 Fase 2 — 3 a 9 meses pós-launch (conteúdo incremental)

Cadência realista: **um pacote de conteúdo a cada 6-8 semanas**. Cada pacote é pequeno e usa o framework existente de zonas e personagens.

**Tipo A — Modificador de Zona (mais fácil)**

Um modificador muda as regras de uma zona existente sem criar nova zona. Exemplos usando o framework atual:

- Zona Hordas: "Modo Neblina" — alcance de visão reduzido para todos. O jogador e os inimigos operam com informação parcial. Mesmo código de arena, nova leitura de posicionamento.
- Zona Stealth: "Patrulha Dupla" — dois cones de visão sobrepostos com ciclos dessincronizados. Ordem de magnitude mais difícil sem uma linha de código nova nos patrulheiros.
- Zona Circuito: "Corrente Invertida" — o rastro cresce ao contrário, diminuindo ao coletar nós. A mecânica de Snake mas com objetivo negado.

Cada modificador vem com um fragmento de lore que o justifica narrativamente ("CORE atualizou os protocolos de segurança da zona").

Custo de produção: 1-2 dias de desenvolvimento, alguns parágrafos de texto. Um modificador a cada 4 semanas é sustentável.

**Tipo B — Missão de NPC Nova (médio)**

Um NPC existente recebe uma missão adicional com novo diálogo. Não muda mecânica — usa zonas e recursos já existentes. Expande o arco do personagem ou revela lore novo.

Exemplo: Marcus (Engenheiro Culpado) em 3 meses pós-launch recebe uma missão de "recuperar um arquivo específico de NERVE" que revela um fragmento da conversa que ele teve com Paulo antes do Projeto Olímpio. Não muda o final — adiciona camadas ao personagem que jogadores que voltaram ao jogo ainda não viram.

Custo de produção: escrita + integração de diálogo. Nenhum código novo de mecânica. Uma missão de NPC a cada 6-8 semanas é sustentável.

**Tipo C — Zona Nova (maior, raro)**

Uma zona nova completa seguindo o framework "só-movimento" existente. Isso é o maior investimento de conteúdo pós-launch — justificado apenas se:
- As 11 zonas originais foram absorvidas (D30 retention > 30%, maioria dos jogadores completou o foguete pelo menos uma vez)
- A nova zona tem conceito de "o que mover significa" genuinamente diferente das 11 existentes
- O time tem capacidade sem comprometer qualidade das correções em andamento

Ritmo realista: uma zona nova a cada 4-6 meses se as condições acima forem atendidas. Não antes.

---

### 2.5 Calendário de Referência (primeiros 12 meses)

```
LAUNCH
  |
  +-- Semana 1:     Analytics ao vivo, seed semanal ativo, formulário de feedback
  |
  +-- Mês 1-2:     Bugfixes, tuning de dificuldade baseado em dados
  |
  +-- Mês 3:       Changelog de qualidade-de-vida + 1 missão de NPC nova (ex: Viktor)
  |
  +-- Mês 4:       Modificador de zona A (ex: Modo Neblina em Hordas)
  |
  +-- Mês 5:       Missão de NPC nova (ex: Priya — lore do relatório arquivado)
  |
  +-- Mês 6:       Modificador de zona B + avaliação de retenção D180
  |
  +-- Mês 7-8:     Se D30 > 30%: desenvolvimento de Zona Nova (Tipo C)
  |
  +-- Mês 9:       Missão de NPC nova (ex: Lena — fragmento de CORE)
  |
  +-- Mês 10:      Modificador de zona C
  |
  +-- Mês 11:      Zona Nova (se desenvolvida nos meses 7-8)
  |
  +-- Mês 12:      Changelog de aniversário + avaliação de roadmap do Ano 2
```

---

## 3. Engajamento Ético Sem Monetização Predatória

### 3.1 O que NÃO fazer (explícito)

- Sem energia/stamina que limita runs. A restrição de sessão é o próprio design (runs de 2 minutos), não uma barreira artificial.
- Sem loot boxes. Nenhum elemento de randomização vinculado a pagamento.
- Sem conteúdo de gameplay exclusivo para pagantes. Um jogador free e um pagante jogam o mesmo jogo.
- Sem rotação de loja com pressão de tempo em itens de gameplay.
- Sem notificações push agressivas. No máximo uma notificação semanal: "A Run da Semana está disponível: Zona [X]". Opt-in. Desativável.

### 3.2 Engajamento ético ativo

**Fragmentos de lore progressivos.** O mundo de Fungineer tem profundidade narrativa (world-lore.md, arcos de personagens, a questão filosófica sobre o Projeto Olímpio). Lore adicional pode ser revelado sem custo — terminais de CORE desbloqueados, entradas de diário de Paulo, gravações do arquivo do Documentarista. Cada fragmento é uma razão para voltar que respeita o tempo do jogador.

**Diários de desenvolvimento.** Para um indie, o próprio processo de criação é conteúdo. Um devlog periódico (texto simples, sem obrigação de vídeo) mostrando o que está sendo trabalhado cria audiência que volta para ver o resultado. Custo: zero de produção de jogo.

**Comunidade orgânica.** A Run da Semana com seed fixo cria naturalmente comparações entre jogadores. Um canal Discord ou thread no Reddit onde jogadores compartilham os resultados da seed semanal tem custo de manutenção baixo e cria pertencimento sem precisar de sistema de ranking serverside.

### 3.3 Modelo de monetização respeitoso (se houver)

Fungineer como PWA tem opções limitadas de monetização convencional. As únicas que respeitam o brief anti-predatório:

**Opção 1 — Preço único (recomendada para indie com narrativa completa)**
Jogo completo por um preço justo (US$3-5 em mobile, US$5-8 em desktop). Conteúdo pós-launch gratuito para quem comprou. Sem trial com paywall no meio da narrativa — isso quebra o arco emocional do jogo.

Para PWA especificamente: pode ser implementado como "pay-what-you-want na itch.io" com link no hub do jogo. A itch.io aceita PWA e tem audiência indie receptiva a esse modelo.

**Opção 2 — Gratuito com doação voluntária**
O jogo é totalmente gratuito. Um botão "Apoiar o Projeto" no hub (discreto, em lugar que não interrompa o fluxo de jogo) leva para Ko-fi ou itch.io. Sem menção de exclusividades ou vantagens para doadores — apenas gratidão.

Lore-justificativa opcional: "Contribuidores são listados como 'Nomes no Memorial dos Que Ajudaram' no hub" — sem efeito de gameplay, puramente simbólico.

**O que NÃO implementar como monetização:**
- Skin exclusiva paga (cria percepção de conteúdo bloqueado mesmo que seja cosmético)
- DLC de zona adicional que fragmenta a base de jogadores (jogadores em comunidade deveriam estar falando sobre o mesmo jogo)
- Assinatura mensal para acesso a conteúdo recorrente (amplitude de audiência indie não sustenta)

---

## 4. Métricas de Engajamento para Instrumentar desde o Launch

### Premissa de implementação

O backend FastAPI + SQLite já existe. Métricas podem ser enviadas como eventos simples ao mesmo serviço sem infra adicional. No launch, instrumentar apenas o mínimo necessário — dados demais com time pequeno gera ruído, não insight.

A regra é: **instrumentar apenas o que você vai agir sobre nas próximas 4 semanas.**

---

### 4.1 As 3 Métricas Essenciais (instrumentar no D1 de launch)

**Métrica 1 — Taxa de Conclusão por Zona**

```
conclusao_zona = runs_completadas_zona_X / runs_iniciadas_zona_X
```

Por que é a mais importante: Fungineer tem 11 zonas radicalmente diferentes. Se uma zona tem taxa de conclusão abaixo de 30% (enquanto outras têm 60%+), ela está quebrando o ritmo de progressão do foguete. Isso é a primeira informação que direciona qualidade — não quantidade de jogadores.

Implementação: evento `zone_start` e `zone_complete` (ou `zone_fail`) com `zone_id`. Dois eventos simples. Agregação por zona.

**Métrica 2 — Retention D1 / D7 / D30**

```
retention_D7 = jogadores_ativos_no_dia_7 / jogadores_que_iniciaram_há_7_dias
```

Por que é essencial: indica se o loop de retenção está funcionando antes de investir em conteúdo novo. Para um indie, benchmarks realistas são: D1 > 30%, D7 > 15%, D30 > 8%. Abaixo disso, conteúdo novo não resolve — o problema está no core loop ou na curva de progressão.

Implementação: evento `session_start` com timestamp. Agrupamento por cohort de primeiro acesso. O SaveService já persiste estado — adicionar timestamp de primeira sessão é trivial.

**Métrica 3 — Progresso do Foguete (peças completadas por jogador)**

```
distribuicao_progresso = histograma de "peças do foguete concluídas" por jogador ativo
```

Por que é a âncora de pacing: se a maioria dos jogadores chegou até a peça 3 de 8 e parou, o gargalo de progressão está ali. Pode ser dificuldade de zona, pode ser falta de recursos, pode ser que a narrativa do Ato 1 não gerou tração suficiente para o Ato 2. Essa métrica traduz o comportamento em diagnóstico de design.

Implementação: evento `rocket_piece_completed` com `piece_id`. O sistema já dispara quando a peça é construída automaticamente — apenas adicionar o evento.

---

### 4.2 Métricas Secundárias (adicionar no mês 2, se o time tiver capacidade)

**Participação na Run da Semana**: `weekly_run_started / DAU` na semana. Meta: >20% dos jogadores ativos. Abaixo disso, o mecanismo não está criando hábito semanal — investigar se a comunicação in-game é clara ou se a rotação de zonas está desmotivando.

**Confiança média por NPC**: histograma de progresso de confiança de cada personagem. Identifica quais missões estão sendo ignoradas e quais narrativas os jogadores estão priorizando. Útil para decidir qual NPC recebe conteúdo novo primeiro.

**Taxa de abandono por ponto de progressão narrativa**: percentual de jogadores que pararam de jogar antes das revelações do Ato 2 (peças 4-6). Se muitos param antes de Marcus revelar sua conexão com NERVE, o jogo pode estar demorando demais para entregar o payoff narrativo.

---

### 4.3 O que NÃO medir inicialmente

- Tempo médio de sessão (ruído sem contexto — uma sessão de 3 minutos pode ser um jogador satisfeito ou um abandono)
- DAU absoluto (irrelevante sem comparativo histórico)
- Número de downloads (vaidade metric — não informa qualidade de experiência)

---

### 4.4 Implementação mínima no backend

Adicionar um endpoint simples de evento:

```
POST /api/event
{ "event": "zone_complete", "zone_id": "hordas", "player_id": "hashed_local_id" }
```

Sem PII. `player_id` é hash do localStorage key existente — nunca email, nunca device ID real. Conformidade com LGPD sem precisar de advogado.

Tabela SQLite: `events (id, event, data_json, created_at)`. Queries de agregação rodam semanalmente, não em tempo real — não precisa de dashboard sofisticado.

---

## 5. Ética de Monetização e Engajamento — Declaração de Posição

Fungineer é um jogo com tese anti-tech explícita: "enquanto eles têm aço e código, nós temos raízes e fé." Seria incoerente implementar dark patterns de engajamento num jogo sobre os danos do design de sistemas otimizado sem ética.

**Princípios:**
1. O jogador pode parar de jogar a qualquer momento sem penalidade. Sem streaks que punem ausência.
2. Nenhum conteúdo de gameplay é bloqueado por pagamento.
3. Recompensas são narrativas (lore, diálogo, contexto), nunca estatísticas.
4. A Run da Semana não tem recompensa exclusiva — apenas a experiência compartilhada.
5. Notificações são opt-in e podem ser desativadas sem consequência.
6. Métricas coletadas são anônimas e usadas apenas para melhorar o design — nunca para otimizar engagement a custo da saúde do jogador.

---

*Relacionado: `design/MASTERPLAN.md`, `design/gdd/game-concept.md`, `design/gdd/resource-system.md`, `design/gdd/hub-and-characters.md`, `design/narrative/narrative-arc.md`*
