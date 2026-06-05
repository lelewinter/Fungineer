---
tags: [fungineer, game-design, review]
date: 2026-06-05
tipo: design-review
---

# Fungineer — Revisão do Core Loop

**Autor**: Game Designer (subagente)
**Data**: 2026-06-05
**Fontes lidas**: mechanics-overview.md, MASTERPLAN.md, resource-system.md,
hub-world-map.md, zone-*.md (todas as 11 zonas)

**Premissas assumidas** (sem interação com usuário): as zonas de "superfície"
(Cordilheira, Torres, Catedral) estão em spec de brainstorm aprovado mas sem
mecânica detalhada; avaliadas pelo que está documentado. O número canônico de
zonas é 11 (README) e não 8 (MASTERPLAN — documento mais antigo).

---

## Parte 1 — Tensão do Loop e Gancho "só mais uma run"

### O que está funcionando

O loop de três camadas (movimento → coleta → foguete) tem uma estrutura
teoricamente sólida. Pela lente do MDA, a Aesthetic alvo é corretamente
definida como Challenge + Discovery, e a Mechanic central (input único = mover)
é elegante e diferenciadora. A decisão "sair agora com 2 recursos ou arriscar
mais tempo para encher a mochila?" é um exemplo limpo de Expected Value
Decision com stakes assimétricos — o estoque do hub é protegido (perder é
suportável), mas a run atual é perdida (fracasso tem dentes). Isso calibra bem o
loop de risco pelo modelo de Self-Determination Theory: Autonomy (decido quando
sair), Competence (melhoro minha leitura de risco), Relatedness (o foguete
cresce com cada entrega).

A âncora visual do foguete é a decisão de design mais forte do projeto: progresso
persistente e visível entre sessões é o mecanismo primário do "só mais uma run"
pelo Zeigarnik Effect (tarefas incompletas criam tensão cognitiva que motiva
retorno). A divisão de receitas do foguete em 8 peças, cada uma com custo
específico, garante micro-metas frequentes dentro do arco de 56 minutos.

### Onde o loop está frouxo

**Ponto crítico 1: Desconexão entre a escolha de zona e a peça atual do foguete.**

O recurso que o jogador precisa para a próxima peça deveria ser o critério
dominante de qual zona visitar. Mas as primeiras 7 peças dependem apenas de
Sucata (Hordas) e Componentes de IA (Stealth). Isso significa que nas primeiras
~28 runs do jogo, o mapa-mundo tem escolha mas não tem consequência diferenciada:
qualquer zona disponível pode não fornecer o que você precisa, então o jogador
vai visitar sempre as mesmas duas.

Consequência MDA: a Aesthetic de Discovery do mapa-mundo esvazia. O mapa existe
mas não direciona. O jogador vai à zona que ele joga melhor, não à que o foguete
pede. A tensão estratégica (qual zona raidar?) perde sentido quando a resposta
é quase sempre "a que você ainda não desbloqueou completamente."

Na versão pós-MVP com 11 zonas, esse problema se multiplica: os recursos de
fluxo (Sinais de Controle de Campo, Biomassa de Infecção) não ocupam slots de
mochila e têm mecânica de acumulação diferente. Se as receitas do foguete não
absorverem esses recursos de forma explícita e visível, o jogador não sentirá
que "essa run importou para o foguete" — o que é o gancho central.

**Recomendação**: o painel de progresso do foguete deve mostrar o recurso faltante
para a próxima peça de forma proeminente (não enterrado em receita). E o mapa
deve sinalizar claramente "esta zona tem o que você precisa agora."

---

**Ponto crítico 2: A mochila com 3 slots cria uma run muito curta para construir
tensão real.**

A mecânica de coleta de 1.5s por item é correta: cria uma microdecisão de
posicionamento em todas as zonas. O problema está na relação entre capacidade
da mochila e duração da run. Com 3 slots e ~2.5 recursos/run, a maioria das runs
termina antes de o jogador atingir o pico de tensão.

Pelo modelo de Flow Channel de Csikszentmihalyi, a tensão deve escalar dentro
da sessão (curva em dente de serra): começo tranquilo → construção de pressão →
momento de decisão crítica → resolução. Com mochila de 3 slots, o jogador
raramente chega ao terceiro ato dentro da run — já saiu antes.

A Zona de Sacrifício foi designada corretamente para expor esse problema: ela
recompensa upgrades de mochila mais que qualquer outra zona, e o máximo prático
com upgrade 2 é 7 recursos. Mas o upgrade de mochila está bloqueado atrás do
Ex-Executivo (40% confiança), que requer tempo e missões. Isso cria um ciclo de
onboarding frouxo: o jogador não tem mochila grande o suficiente para sentir a
tensão plena até bem depois de ter aprendido as mecânicas básicas.

**Recomendação**: criar uma "run de demonstração de tensão" nas primeiras sessões:
a primeira run de alguma zona deve garantir pelo menos 1 recurso, para que o
retorno ao hub e a animação do foguete crescendo aconteça cedo. Adicionar um
gancho emocional imediato é mais valioso que o design de progressão correto a
longo prazo.

---

**Ponto crítico 3: O hub não tem atividade de loop entre runs.**

O hub está bem desenhado visualmente (corte transversal, câmara do foguete
central, 10 NPCs com endereços), mas entre runs o jogador faz o seguinte:
chega, deposita recursos, talvez fala com um NPC, sai. Isso é correto para
manter o ritmo mobile (não queremos hub builder), mas cria uma transição
"fria" — o jogador não tem um momento de antecipação antes de escolher a
próxima zona.

Pelo MDA: a Aesthetic de Submission ("só mais uma run") depende de que o
retorno ao hub seja satisfatório e que a volta à zona seja imediatamente
desejável. O momento entre "depositar recursos" e "escolher próxima zona" é
onde o "só mais uma" se vende ou se perde.

**Recomendação** (ver Ajuste 3 abaixo): adicionar um "gancho de próxima run"
explícito no hub.

---

## Parte 2 — Agrupamento por Verbo de Movimento

As 11 zonas foram analisadas por qual tipo de ação motora o movimento representa
para o jogador, não pelo tema visual.

---

### Grupo A — "Posicionar" (movimento como alocação espacial)

**Zonas**: Hordas, Campo de Controle, Sacrifício

O verbo compartilhado é: "estar aqui importa mais que como cheguei aqui." O
movimento é o meio para alcançar uma posição estratégica. A fantasia é de
comandante ou estrategista.

- **Hordas**: posicionar para maximizar combate automático do squad; coleta em
  1.5s com inimigos ao redor.
- **Campo de Controle**: posicionar com velocity burst para captura cinética;
  circular entre zonas é a estratégia ótima.
- **Sacrifício**: posicionar no hub central para análise; depois entrar em
  câmara e mover continuamente para não despertar dormentes.

**Risco de colapso interno**: Hordas e Sacrifício compartilham o mesmo roster
de inimigos (Runners, Bruisers, Spitters) e o mesmo squad de 4. Se o feedback
visual for similar, as duas zonas parecerão a mesma zona com cenário diferente.
A diferenciação está na intent: Hordas é reativo (ondas chegam a você), Sacrifício
é analítico (você decide quando entrar). Essa diferença precisa ser legível em
5 segundos na tela.

**Campo de Controle** tem o verbo mais distinto do grupo porque o movimento em
si tem valor mecânico (burst de chegada), não apenas o destino. É o ponto
mais interessante do Grupo A.

---

### Grupo B — "Navegar" (movimento como exploração de espaço hostil)

**Zonas**: Stealth, Torres, Catedral, Cordilheira

O verbo compartilhado é: "o espaço tem regras implícitas que eu preciso
descobrir e respeitar." O movimento é leitura ambiental. A fantasia é de
infiltrador ou explorador.

- **Stealth**: velocidade = barulho = risco. Parar pode ser a jogada certa.
  Cone de visão + raio de som + câmeras + luz/sombra = 4 sistemas simultâneos.
- **Torres**: stealth vertical, drones de cima e baixo, NPCs civis em risco
  pelas suas ações (o Coral). Adiciona dimensão moral ao movimento.
- **Catedral**: stealth rítmico — janela de sino a cada 60s onde o barulho é
  permitido. O movimento é sincronizado com ciclos externos.
- **Cordilheira**: ausência de IA como ameaça; estruturas instáveis, Selvagens
  humanos. Movimento cauteloso em espaço emocional (memórias coletivas).

**Risco de colapso**: Stealth, Torres e Catedral têm o mesmo verbo central —
"ser silencioso" — com variações de execução. Para um jogador, as três podem
sentir como "stealth mais difícil", "stealth vertical" e "stealth rítmico."
A Catedral tem a inversão mais interessante (sino = janela de poder, não de
risco) e é a mais diferenciada. Torres adiciona moralidade ao stealth (Coral)
mas o verbo motor ainda é igual ao de Stealth básico.

**Cordilheira** é o elemento mais diferenciado do grupo: sem IA, sem drone,
sem cone de visão. A tensão vem do ambiente e de humanos. Mas o GDD está em
brainstorm — a mecânica de "estabilidade de estrutura" pode duplicar a
sensação de "parar vs mover" da Stealth (parar = seguro de colapso, mas
Selvagens atacam). Dependendo da implementação, pode colapsar.

---

### Grupo C — "Traçar" (movimento como desenho de trajetória contínua)

**Zonas**: Circuito Quebrado, Infecção

O verbo compartilhado é: "a rota que escolho é o projeto." O movimento não é
sobre onde chegar mas sobre qual caminho percorrer. A fantasia é de agente
sistêmico.

- **Circuito**: percorrer fios na sequência certa por 1.0s contínuo por segmento.
  O personagem é a corrente elétrica; sair do fio reseta o progresso.
- **Infecção**: absorver carga viral de nó infectado, correr até nó neutro adjacente,
  transferir em 0.5s. O jogador é o vírus; a rota de expansão é o projeto.

**Colapso interno**: esses dois têm verbos bem distintos e não colapsam entre
si. Circuito é prescritivo (existe uma sequência correta) e Infecção é
emergente (o jogador decide a rota de expansão). O risco é colapso com o
Grupo A: tanto Circuito quanto Campo de Controle têm a ideia de "percorrer
pontos em sequência." A distinção que salva o Circuito é que o movimento
precisa ser contínuo e a rota é o puzzle, não o destino.

---

### Grupo D — "Reagir" (movimento como resposta reflexa a ameaças)

**Zonas**: Extração, Labirinto Dinâmico

O verbo compartilhado é: "o mundo está me forçando a agir agora." O movimento
é resposta a eventos externos com timing. A fantasia é de sobrevivente ágil.

- **Extração**: lane runner vertical, scroll acelerado, trocar de lane para
  desviar de obstáculos e coletar canisters. Decisão em 0.5–1s.
- **Labirinto**: paredes que abrem e fecham em ciclos com timers visíveis;
  Impulso de Abertura (correr em direção à parede = abre mais cedo) e
  Penalidade de Estagnação (parar = parede atrasa).

**Colapso interno**: o Labirinto está a 1 decisão de design de ser "Extração
com paredes" — e o GDD atual escapa disso pela inversão elegante (o Impulso
de Abertura recompensa correr em direção à ameaça, não de fugir dela). Essa
inversão é o que diferencia o Labirinto. Se a implementação não comunicar
claramente que correr para a parede é a jogada certa, o Labirinto vai sentir
como "Extração mais lento."

---

### Tabela Consolidada

| Zona | Grupo | Verbo de Movimento | Diferenciador Crítico |
|------|-------|-------------------|-----------------------|
| Hordas | A — Posicionar | Alocar squad para combate | Evento de resgate; poderes transformativos |
| Campo de Controle | A — Posicionar | Circular com velocity burst | Burst de chegada como mecânica central |
| Sacrifício | A — Posicionar | Analisar parado, executar em movimento | Painel de informação completa antes da decisão |
| Stealth | B — Navegar | Velocidade = risco de detecção | 4 sistemas de detecção simultâneos |
| Torres | B — Navegar | Stealth vertical com moral stakes | NPCs civis em risco pelas suas ações |
| Catedral | B — Navegar | Stealth rítmico com janela de poder | Sino inverte risco: barulho é permitido |
| Cordilheira | B — Navegar | Exploração emocional sem IA | Única zona sem inimigo mecânico |
| Circuito | C — Traçar | Rota prescrita como corrente elétrica | Sequência correta existe; sair reseta |
| Infecção | C — Traçar | Rota emergente como propagação viral | Jogador decide a expansão; sem sequência certa |
| Extração | D — Reagir | Trocar lane para desviar/coletar | Scroll acelerado; decisão em <1s |
| Labirinto | D — Reagir | Timing de paredes + Impulso de Abertura | Correr em direção à ameaça é a jogada certa |

---

### Leitura por Bartle

O mapeamento de grupos por tipo de jogador mostra um possível desequilíbrio:

- **Achievers e Competitors**: Grupos A e D são os mais satisfatórios (objetivos
  claros, recompensas mensuráveis, tempo como pressão).
- **Explorers**: Grupo B e C têm a maior riqueza de descoberta, mas exigem que
  o jogador "encontre" a mecânica ideal organicamente (Catedral, Infecção).
- **Socializers**: o sistema de confiança de NPCs serve esse perfil, mas está
  desacoplado das zonas em si.

O risco é que Explorers abandonem antes de chegar às zonas do Grupo B e C (que
são as mais ricas), porque o onboarding se concentra em Hordas (Grupo A, que
é o mais familiar e acessível mas o menos único).

---

## Parte 3 — Risco #1 de Diversão e Como Testar Barato

### O risco principal: o foguete não é sentido como consequência real das runs

**Diagnóstico**: O foguete cresce a cada entrega de recursos — esta é a âncora
de progresso. Mas o design atual cria uma separação entre a ação (run) e a
recompensa (foguete cresce). Especificamente:

- O progresso do foguete é automático ("peças construídas automaticamente ao
  atingir o custo da receita") — o jogador não tem um momento de revelação
  ativa.
- Com 28 runs necessárias e cada peça custando múltiplas runs, o foguete
  pode demorar várias sessões para visivelmente mudar de forma.
- O hub tem a câmara do foguete como centro visual, mas se o jogador faz
  múltiplas runs sem que uma peça complete, a âncora fraqueja.

**Por que é o risco #1**: pelo MDA, a Aesthetic de Fantasy ("construo um
foguete biológico para escapar do apocalipse") depende de que cada run sinta
que contribuiu para o foguete. Se o jogador joga 4 runs consecutivas e o
foguete não muda visivelmente, o loop de motivação quebra. Não importa que
matematicamente ele estava acumulando — a falta de feedback visual intermitente
quebra a Sensation Aesthetic que ancora o "só mais uma run."

Esse é especificamente um problema de **Reinforcement Schedule**: o design usa
Fixed Ratio (X recursos = 1 peça), que é o schedule mais fraco para "só mais
uma run" — o jogador sabe exatamente quando a recompensa vai chegar, e o vazio
antes dela é sentido como grind, não como tensão.

**Como testar barato** (antes de implementar qualquer coisa):

1. **Teste de papel em 10 minutos**: desenhe o foguete em papel com as 8 peças.
   Peça a 2–3 pessoas que não conhecem o jogo para "construir o foguete" jogando
   Hordas em papel (simulado). Registre quando cada pessoa expressa frustração
   ("ainda não completei nada?") vs satisfação ("uau cresceu!"). O ponto de
   ruptura de frustração é o limite do loop sem reforço intermediário.

2. **Teste de HUD**: antes de implementar o foguete animado, teste se uma barra
   de progresso simples (X/Y recursos para próxima peça) já cria o gancho. Se
   sim, a âncora é o progresso numérico, não a animação — e você pode priorizar
   a UX antes do visual.

3. **Sessão de 15 minutos com 5 runs**: observe se o jogador olha para o foguete
   espontaneamente entre runs. Se não olhar, a câmara do foguete não está fazendo
   seu trabalho narrativo — independente de quão bonita ela for.

---

## Parte 4 — Ajustes de Design de Alto Impacto e Baixo Custo

### Ajuste 1 — "Bônus de peça parcial" como reforço intermediário

**Problema que resolve**: intervalo de reforço longo entre runs sem foguete crescer.

**O que é**: quando o jogador deposita recursos no hub, mesmo que não complete
uma peça ainda, o foguete exibe um micro-progress visual. Proposta concreta:
cada recurso depositado acende uma partícula de esporo ou um fio de micélio
na peça em construção. A peça completa quando todos os fios/esporos estão
acesos (visual de "enchendo" em vez de "aparecendo de uma vez").

**Por que funciona**: transforma o Fixed Ratio Schedule em Variable Ratio
implícito (o jogador vê progresso a cada entrega, mas a "grande revelação" da
peça completa ainda tem momento de pico). Pelo modelo de Reinforcement
Learning de Skinner aplicado a games (Lazzaro, 2004), Variable Ratio é o
schedule mais eficiente para manutenção de comportamento ("slot machine").

**Custo de implementação**: baixo. Não muda nenhuma fórmula do resource-system.
Só adiciona um estado visual "enchendo" à câmara do foguete. O GDD de
resource-system já prevê "Peça construída automaticamente ao atingir custo" —
ajuste apenas a animação para ser progressiva, não binária.

**Medida de sucesso**: jogador olha espontaneamente para o foguete após depositar
em runs parciais (não apenas após completar uma peça).

---

### Ajuste 2 — "Pedido urgente" como gancho de próxima run no hub

**Problema que resolve**: transição fria entre retornar de run e escolher a
próxima zona; falta de "por que voltar amanhã."

**O que é**: após depositar recursos, um NPC relevante (qualquer um dos 10
sobreviventes, rotacionando) exibe uma linha de diálogo que conecta o recurso
recebido com a próxima peça do foguete. Não é cutscene — é uma linha de texto
curta (2–3 palavras + ícone) que aparece sobre o sprite do NPC.

Exemplos concretos:
- Engenheiro: "Faltam 3 sucatas pro casco." (com ícone de Sucata)
- Médica: "A Stealth tem componentes que precisamos." (com ícone de Comp. IA)
- Ex-Executivo: "Mochila tem slot livre. Boa hora para o upgrade." (se confiança ≥ 40%)

Esse "pedido urgente" também serve como direcionamento de qual zona visitar —
resolve o Ponto Crítico 1 (loop frouxo entre escolha de zona e peça atual).

**Por que funciona**: pelo SDT, Relatedness é satisfeita quando outros personagens
reconhecem e respondem às suas ações. O feedback de NPC ("você trouxe sucata,
isso importou") fecha o loop de significado que a peça do foguete abre. É
também um veículo barato de tutorial contextual — sem popup, sem tela de
instrução.

**Custo de implementação**: mínimo. São linhas de diálogo condicionais (recurso
depositado → NPC relevante → linha específica). Nenhum sistema novo: o hub já
tem sprites de NPC e o resource-system já sabe qual peça está em construção.

**Cuidado (anti-padrão)**: as linhas devem ser curtas e varíáveis. Se o mesmo NPC
disser a mesma frase 20 vezes seguidas, o efeito inverte e passa a sinalizar
grind. Manter banco de 3–4 variações por NPC por recurso.

---

### Ajuste 3 — "Resistência de zona" como meta de curto prazo entre runs

**Problema que resolve**: mapa-mundo sem consequências diferenciadas (ponto
crítico 1), e loop macro sem sensação de escalonamento.

**O que é**: cada zona tem um nível de Resistência (1 a 5) que sobe conforme o
jogador visita. Resistência maior = mais inimigos, variações de mapa, mas
também recursos mais densos (mais recursos por run). Cada 3 visitas a uma zona,
a Resistência sobe 1 nível.

Isso cria:
- Uma razão para variar zonas (resistência mais alta = mais recursos, mas a 1
  vai ser mais fácil para recuperar depois de falhar muito)
- Uma sensação de que o mundo reage à sua presença (narrativamente: as IAs
  estão aprendendo que alguém está raideando)
- Um meta de curto prazo que não é o foguete: "quero levar a Stealth para
  Resistência 3 para conseguir mais Comp. IA por run"

**Por que funciona**: pelo Quantic Foundry model, jogadores de Mastery precisam
de metas intermediárias escaláveis. O foguete é a meta de longo prazo; a peça
atual é a meta de médio prazo; a Resistência da zona é a meta de curto prazo
que o jogador pode sentir dentro de 2–3 sessões. Resolve o vazio de motivação
entre "já sei jogar essa zona" e "o foguete ainda está longe."

**Custo de implementação**: médio (mais alto que os outros dois). Requer:
1. Contagem de visitas por zona (já parcialmente existe em HubState)
2. Curvas de escalonamento de inimigos e recursos por nível de resistência
3. Indicador visual de resistência no mapa-mundo (número + ícone)

A implementação completa pode ser M8 (Meta-loop), mas o framework pode ser
definido no GDD agora sem código. Começar com apenas 3 níveis (1, 2, 3) em
vez de 5 para reduzir escopo inicial.

**Cuidado (anti-padrão)**: resistência não deve punir o jogador que tem
dificuldade. O nível 1 de resistência deve sempre ser uma zona viável. Se
a resistência acumular sem opção de "resetar" ou "descair", jogadores que
falham muito ficarão presos em zonas difíceis sem progressão no foguete.
Proposta de solução: resistência sobe a cada 3 visitas independente de
sucesso, mas a densidade de recursos escala na mesma proporção que a
dificuldade — o valor esperado por run se mantém constante entre níveis.

---

## Sumário de Problemas e Ajustes

| # | Problema | Impacto | Ajuste | Custo |
|---|----------|---------|--------|-------|
| 1 | Loop zona→foguete sem reforço intermediário | Alto | Bônus de peça parcial (visual progressivo) | Baixo |
| 2 | Transição fria no hub entre runs | Médio | Pedido urgente de NPC com direcionamento | Mínimo |
| 3 | Mapa-mundo sem consequência diferenciada | Médio | Resistência de zona como meta de curto prazo | Médio |
| 4 | Mochila de 3 slots encerra a run antes do pico de tensão | Médio | (já mitigado pelo upgrade de mochila; ajuste de pacing, não estrutural) | — |
| 5 | Grupos B e C (Navegar, Traçar) podem perder jogadores antes de serem descobertos | Baixo | Ordem de desbloqueio no mapa: Extração (D) antes de Circuito (C) | Mínimo |

---

*Próximos passos sugeridos: validar Ajuste 1 com teste de sessão antes de
implementar; detalhar mecânica de Resistência de Zona em GDD próprio se
aprovado; revisar ordem de desbloqueio de zonas no mapa-mundo.*
