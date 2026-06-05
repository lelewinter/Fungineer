---
tags: [fungineer, creative-direction, readiness, playtest]
date: 2026-06-05
tipo: creative-direction
status: REVISÃO — pré-primeiro-playtest
autor: Creative Director
fontes: design/creative-pillars.md, production/implementation-notes.md
---

# Fungineer — Revisão de Prontidão pro Primeiro Playtest

**Contexto:** O loop agora FECHA — `RocketLaunchOverlay` + botão LANÇAR +
`resetForNewCycle()` estão shipados (build verde). Pela primeira vez o jogo tem
começo, meio e fim. Esta revisão checa se o loop *entrega os pilares de
ponta-a-ponta* e o que travar antes de sentar a primeira pessoa na frente dele.

Escopo: revisão criativa contra os 5 pilares travados. Não é QA de bug nem
auditoria de código (isso está nas implementation-notes).

---

## 1. O loop entrega os pilares de ponta-a-ponta? Onde quebra a fantasia?

O macro-loop **mover → coletar → depositar → foguete cresce → LANÇAR → novo
ciclo** agora existe inteiro. Avaliação pilar a pilar:

### Pilar 1 — Mover é a única ação → **ENTREGUE**
Todas as zonas shipadas são posição-pura (Pac-Man, Snake/Tron, Boulder Dash,
etc.). O botão "✕ SAIR" do Field e o tile EXIT do Sacrifício são meta-controles
de run (sair ≠ ação de zona), então não violam P1. **Não quebra.**

### Pilar 2 — Cada zona é um gênero inteiro → **ENTREGUE no conteúdo, NÃO VALIDADO no feel**
As 11 zonas existem e são gêneros distintos e reconhecíveis. O risco de P2 não é
"as zonas existem?" — é o **teste de legibilidade**: *"um jogador novo entende o
objetivo da zona sem tutorial em até 2 tentativas?"*. Isso **só o playtest
responde.** É exatamente o que este primeiro playtest precisa medir. Não está
quebrado; está **não-verificado** — e essa é a razão de existir o playtest.

### Pilar 3 — Natureza é tecnologia, não magia → **PARCIAL — aqui a fantasia treme**
- **Onde segura:** zonas de IA frias vs. personagem quente; música data-driven
  já permite tom orgânico vs. sintético por zona.
- **Onde QUEBRA:** o **momento de pagamento da fantasia é o foguete**, e o FX de
  lançamento hoje é "mínimo — bob/flicker do glifo" (implementation-notes §5). O
  pilar 3 diz que *"o foguete biológico é o argumento visual de que vida vence
  eficiência"* e a aesthetic Fantasy depende dele. **O clímax do loop inteiro é
  um glifo piscando.** A fantasia "esperança desesperada / foguete improvável
  crescendo" não tem onde aterrissar emocionalmente. Esta é a maior fissura de
  fantasia do loop atual — não porque está errado, mas porque o pico está vazio.
- **Pendência relacionada:** o re-enquadramento "micélio que canibaliza a
  máquina" (Decisão 3 dos pilares) ainda não cascateou pra UI de crescimento do
  foguete. Pro primeiro playtest isto é tolerável (flavor), não bloqueante.

### Pilar 4 — A ficção justifica a mecânica → **ENTREGUE o suficiente pro playtest**
Cânone Dr. Myco travado e fiado nas strings player-facing. Os ~23 docs com
"Paulo" são dívida de narrativa interna, **não visível ao playtester**. A
consonância ludonarrativa por zona não precisa estar perfeita pro primeiro
teste — precisa não *contradizer*. Não quebra a fantasia do playtester.

### Pilar 5 — A run é curta e é uma aposta → **ENTREGUE, com UM número suspeito**
Estrutura de run curta/sem-checkpoint/perda-no-fail está intacta. **Risco:**
Circuito foi de 60→90s e Infecção de 75→120s ao rotear pro GameConfig. O Level
Designer marcou **Circuito como "a parede"** do jogo — e acabamos de afrouxá-la
30s sem querer. P5 ("sair cedo vs. arriscar" é a decisão central) depende de a
run *apertar*. 120s de Infecção também arrisca furar a sensação de "<2 min,
aposta". Não é fatal pro playtest — mas é o número que mais vai enviesar o que o
playtest te diz sobre tensão. Decidir o valor *antes* de testar, senão você
testa a curva errada.

### Veredito do loop
**O loop entrega os pilares de ponta-a-ponta — exceto no clímax.** A fantasia
não quebra *durante* o jogo; ela quebra *no pagamento*. O jogador faz tudo certo,
o foguete completa, ele aperta LANÇAR — e o momento que justifica todas as runs
é um glifo piscando e um resumo de texto. Tudo aponta pra um cano que não
dispara.

---

## 2. A ÚNICA coisa mais importante a consertar antes do primeiro playtest

> **Dar peso ao momento LANÇAR — transformar o clímax de "glifo pisca + resumo
> de texto" em um beat que *sente* o pagamento da fantasia.** Não precisa ser a
> `LaunchScene` cheia com tween de subida e câmera (isso é polish pós-playtest).
> Precisa ser o **mínimo que faz o jogador sentir que valeu**: o foguete
> orgânico subindo/crescendo na tela, som quente de decolagem, e uma batida de
> pausa antes do resumo. Versão de 20% do esforço que entrega 80% do beat.

**Por que esta e não as outras (timer, FX de zona, dívida de docs):**

1. **É o único ponto onde o loop FECHADO toca a fantasia CENTRAL.** O resto do
   loop é meio; LANÇAR é o fim — e a tese inteira do jogo (P3: "vida bagunçada
   vence eficiência limpa") é um *argumento visual* que só acontece no foguete.
   Se o clímax é oco, o playtester aprende "as zonas são legais" mas **nunca
   sente o jogo que você está fazendo.** Você vai colher feedback sobre um jogo
   sem alma porque o momento da alma não foi construído.

2. **É o que o primeiro playtest existe pra validar e você está cego nele.** A
   pergunta nº1 de um primeiro playtest não é "as zonas funcionam?" (você sabe
   que funcionam) — é **"o jogador quer fazer o ciclo de novo?"**. A vontade de
   reiniciar nasce da catarse do lançamento. Sem um clímax que pague, "Novo
   Ciclo" é só um botão. Você arrisca concluir "o loop não engaja" quando o
   problema real é que o loop nunca recompensou.

3. **Psicologia (SDT — Competence):** runs curtas e duras entregam esforço
   acumulado; o lançamento é o **feedback de competência** desse esforço. Pico de
   competência sem celebração sensorial é dissonância — o jogador *fez* algo
   grande e o jogo respondeu pequeno. Isso lê como "anticlímax" mesmo que o
   testador não saiba nomear.

4. **Custo-benefício imbatível pré-playtest.** Reusa o glifo do foguete que já
   existe, a música quente que já é data-driven, e o overlay que já está fiado.
   É horas, não semanas — e é a diferença entre um playtest que mede *o seu jogo*
   e um que mede *uma demo de minigames*.

**Trade-off que estou aceitando:** adiar a `LaunchScene` cheia, o FX de zona
mais rico, a limpeza dos 23 docs "Paulo", e o re-tema do foguete-canibal. Todos
são reais e nenhum impede o playtester de *sentir o jogo* — este impede.

**Segundo lugar (não é a escolha, mas trave junto se for de graça):** fixar o
timer do Circuito/Infecção no valor pretendido. Não é "consertar o clímax", mas
enviesa diretamente o dado de tensão que o playtest vai te dar. 1 linha. Decida
antes de testar.

---

## 3. Três critérios de "pronto pra mostrar"

Falsificáveis. Se qualquer um falha, ainda não está pronto pra sentar a primeira
pessoa.

### Critério 1 — O loop fecha sem o facilitador tocar no jogo
Um jogador novo, sem ajuda verbal, completa **pelo menos um ciclo inteiro**:
entra em zonas, coleta, deposita, vê o foguete crescer, aperta LANÇAR, vê a tela
de vitória, e volta ao hub via Novo Ciclo — **sem travar, sem softlock, sem
precisar perguntar "e agora?".** Mede: o loop é auto-explicativo o bastante pra
ser jogado, não demonstrado. (Cobre P1, P5 e a integridade do loop recém-fechado.)

### Critério 2 — O clímax do lançamento arranca uma reação
No momento LANÇAR, o playtester **reage** — inclina pra frente, sorri, faz um
som, comenta. Silêncio ou "ah, acabou?" = reprovado. Mede: a fantasia central
(P3 / aesthetic Fantasy) *aterrissa*. Este é o critério que a correção da §2
existe pra atender — se você consertar o clímax e ele não arrancar reação, você
descobriu algo grande cedo.

### Critério 3 — Pelo menos 7 das 11 zonas passam o teste de legibilidade
O jogador entende o objetivo da zona **em até 2 tentativas, sem tutorial** (o
teste passa/não-passa do Pilar 2). Não exijo 11/11 num primeiro playtest — exijo
maioria clara, pra confirmar que "cada zona é um gênero inteiro" se sustenta como
identidade e não como caos. As zonas que falham viram a lista de prioridade de
leitura espacial pós-playtest. (Cobre P2 e P4.)

**Anti-critério (NÃO trave o playtest esperando isto):** não espere FX de zona
polido, áudio final transcodificado pra OGG, docs de narrativa alinhados, nem o
re-tema do foguete-canibal. Nada disso impede o playtester de sentir o jogo. Cair
nessa armadilha é trocar o primeiro playtest (barato, cedo, esclarecedor) por um
segundo playtest disfarçado.

---

## Cascata (pós-decisão da Leticia)
- Se aprovar a §2 → notificar **art-director** (foguete sobe/cresce, mínimo
  viável) e **audio-director** (som quente de decolagem) com o brief "20% do
  esforço, 80% do beat — não é a LaunchScene cheia".
- **game-designer** decide o timer Circuito/Infecção *antes* do playtest.
- Pós-playtest: zonas que falham o Critério 3 entram na fila de leitura espacial.

*Saberemos que esta revisão acertou se:* o primeiro playtest produzir feedback
sobre **o jogo** (vontade de reiniciar, tensão de saída, clareza de zona) e não
sobre **a ausência de um final** — porque o final foi construído pra ser sentido.

*Relacionado: design/creative-pillars.md, production/implementation-notes.md,
design/narrative/canon-decision-protagonist.md.*
