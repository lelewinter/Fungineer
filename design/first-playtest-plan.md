# Fungineer — Plano do Primeiro Playtest

**Data de referência:** 2026-06-05
**Fase:** Pre-alpha / Vertical Slice
**Condutor:** Game Designer + 1 observador
**Participantes alvo:** 2-4 jogadores externos (nao-developers), preferencialmente familiarizados com roguelikes mas sem conhecimento previo do Fungineer

---

## 1. As 5 Perguntas que o Playtest Precisa Responder

### P1 — O loop central diverte antes de completar o foguete?
**Por que importa:** O jogo tem um macro-loop de varias runs antes do lancamento. Se a corrida individual (raid+deposito) ja nao for satisfatoria isoladamente, o objetivo do foguete nao vai salvar a experiencia. Esta e a pergunta de vida ou morte.

**Indicadores de SIM:** O jogador volta pro hub por vontade propria sem ser forcado; comenta "de novo" ou "quero tentar diferente"; a run tem sensacao de conclusao mesmo sem peca do foguete.

**Indicadores de NAO:** O jogador parece estar "cumprindo tarefa"; silencio prolongado nas runs; frases como "e so isso?" ou "quando termina?".

---

### P2 — A mecanica "so-mover" por zona e legivel sem texto?
**Por que importa:** Cada zona tem uma fantasia diferente (circuito de velocidade, infeccao de pressao de tempo, campo de controle de area, etc.) comunicada inteiramente por movimento. Se o jogador nao entender o que a zona "pede" dele nos primeiros 30 segundos, a variedade de zonas perde o ponto.

**Indicadores de SIM:** O jogador muda de estrategia de movimento ao entrar em zona diferente; verbaliza o "jeito" da zona ("aqui e pra ir rapido", "aqui tenho que desviar dos inimigos"); adapta comportamento sem instrucao.

**Indicadores de NAO:** Comportamento de movimento identico em todas as zonas; pergunta "o que eu tenho que fazer aqui?"; nao percebe mecanica de zona ate ser apontada.

---

### P3 — O foguete funciona como objetivo de pull (atracao)?
**Por que importa:** O foguete e o macro-loop de progressao. Se o jogador nao sentir urgencia ou desejo em relacao ao lancamento, o Novo Ciclo nao vai criar retenção. A pergunta nao e "o jogador entende o foguete?" mas "o jogador QUER lancar o foguete?".

**Indicadores de SIM:** O jogador verifica o painel do foguete espontaneamente entre runs; comenta sobre o progresso sem que perguntem; expressa antecipacao sobre o lancamento.

**Indicadores de NAO:** O foguete e ignorado ate ser apontado; deposito de recursos parece desconectado do objetivo; painel do foguete nao e visitado entre runs.

---

### P4 — O gargalo de sinais_controle (50 unidades, so do Campo) vira grind chato?
**Por que importa:** Conforme os dados verificados, sinais_controle e o recurso com volume mais alto (50x) e fonte unica (Zona Campo). Isso significa que runs repetidas da mesma zona sao necessarias — e repetição de zona unica e o maior risco de tedio e percepcao de grind. Esta pergunta precisa de evidencia concreta antes de qualquer rebalanceamento.

**Indicadores de grind chato:** O jogador suspira ao voltar para o Campo pela terceira vez; comenta "de novo esse lugar"; perde o ritmo de exploracao (movimento mais apressado, menos atento); compara desfavoravelmente com outras zonas.

**Indicadores de grind saudavel (mastery loop):** O jogador demonstra melhora visivel no Campo entre runs; comenta estrategia ou "aprendi que aqui e melhor ir por esse lado"; o Campo parece desafiador mas dominavel.

**O que medir (ver secao 4):** Numero de runs no Campo vs. outras zonas; tom emocional verbalizacao durante runs do Campo; se o jogador escolhe Campo voluntariamente ou por obrigacao quando o recurso faz sentido.

---

### P5 — O climax do lancamento emociona?
**Por que importa:** O lancamento e o fechamento do macro-loop, a recompensa de toda a progressao. A implementacao atual e minimalista (glifo). Se o momento nao criar impacto emocional proporcional ao esforco investido, o Novo Ciclo vai parecer vazio e a motivacao para o proximo ciclo vai ser fraca. Esta e a pergunta mais difcil de quantificar mas talvez a mais importante.

**Indicadores de SIM:** Pausa espontanea; exclamacao ou reacao visivel; o jogador fala sobre o lancamento depois que acabou; pede "o que acontece no proximo ciclo?".

**Indicadores de NAO:** Reacao neutra ou confusa; pergunta "foi isso?"; sem pausa, clica imediatamente em continuar; nao menciona o lancamento depois.

---

## 2. Configuracao Exata da Build de Teste

### Zonas incluidas no teste (5 de 11)
Criterio de selecao: maxima cobertura das perguntas com minima complexidade de setup.

| Zona | Por que incluir | Recurso chave |
|---|---|---|
| Hub | Ponto de ancoragem, painel do foguete | — |
| Circuito | Fantasia de velocidade mais clara do jogo; timer 90s | scrap (7), ai_components (7) |
| Campo de Controle | Unica fonte de sinais_controle (50); gargalo central | sinais_controle (50) |
| Hordas | Fantasia de pressao de horda; fonte de biomassa (10) | biomassa (10), frag (6) |
| Infecção | Timer 120s, pressao de tempo diferente do Circuito; fonte de biomassa | biomassa (10), nucleo (3) |

**Zonas excluidas neste teste:** Catedral, Torres, Labirinto, Cordilheira, Sacrificio, Stealth. Motivo: complexidade de leitura adicional sem cobrir nenhuma pergunta nova para esta fase. Introduzir depois que o loop central estiver validado.

### Numero de runs
- **Runs minimas para completar o foguete com as 5 zonas:** estimativa 8-12 runs (campo dominara com ~4-6 runs para sinais_controle, resto se fecha em 1-2 runs cada).
- **Alvo de sessao:** 45-60 minutos de jogo efetivo.
- **Limite pratico:** Parar a sessao em 75 minutos independente de progresso. Registrar estado do foguete no momento da parada.
- **Numero de participantes:** 2 sessoes separadas de 1 jogador cada (nao jogar em grupo para capturar verbalizacao individual) ou 1 sessao com 2 jogadores alternando a cada run.

### Tutorial: SEM tutorial formal
**Racional:** A pergunta P2 (legibilidade das zonas) so pode ser respondida sem tutorial. Se o jogador precisar de texto para entender a zona, o design da zona precisa de trabalho — nao o tutorial. Permitir que o Dr. Myco fale normalmente se ja implementado, mas sem tela de instrucoes separada.

**Excecao:** Uma unica linha de contexto oral do observador antes de comecar: "Voce e Dr. Myco. Explore as zonas, colete recursos, construa o foguete. Qualquer duvida, fale em voz alta." Nada mais.

### Estado inicial da build
- Foguete zerado (nenhuma peca depositada)
- Todas as 5 zonas acessiveis desde o inicio (nao travar progressao por nivel)
- Timers nos valores atuais (Circuito 90s, Infeccao 120s) — nao ajustar antes do teste; queremos saber se estao certos ou errados
- Nenhum dado de run anterior persistido

---

## 3. Hipotese de Balance + O Que Medir

### Hipotese central
**"O custo de sinais_controle (50 unidades, fonte unica: Campo) vai dominar o runs-ate-lancar e criar percepcao de grind antes do climax."**

Formalizando:

- Recursos com custo <= 10 e fontes multiplas fecham em 1-2 runs (scrap 7, comb 5, nucleo 3, frag 6, ai 7, biomassa 10).
- sinais_controle (50) com fonte unica exige ~4-6 runs exclusivamente no Campo assumindo coleta media.
- Proporcionalmente, Campo representa ~40-60% do total de runs necessarias.
- Distribuicao de runs altamente assimetrica = variedade de zonas percebida como baixa.

### Risco associado
Se confirmada: jogador nao experimenta suficientemente as outras zonas antes de "completar" o jogo, reduzindo valor percebido do design de zonas e enfraquecendo retenção.

### O que medir durante o playtest

**Metricas de runs (observador registra manualmente):**

| Metrica | Como medir |
|---|---|
| Runs por zona | Contar e registrar qual zona foi escolhida em cada run |
| Runs ate lancamento total | Contador simples |
| Tempo medio por run por zona | Cronometro por run (opcional se dificil) |
| Sinais_controle acumulados por run | Pedir ao jogador que leia em voz alta ao depositar |

**Metricas qualitativas (observador anota):**

| Sinal | O que anotar |
|---|---|
| Escolha de zona | O jogador escolheu por desejo ou por obrigacao? Verbalizou motivo? |
| Tom no Campo | Animado, neutro, entediado, frustrado? |
| Verificacoes do foguete | Quantas vezes abriu o painel sem ser incentivado? |
| Reacao ao lancamento | Reacao nos primeiros 5 segundos; o que disse depois |
| Momentos de confusao | Quando ficou parado sem saber o que fazer |
| Momentos de flow | Quando ficou completamente absorto, sem falar |

### Criterio de confirmacao da hipotese
A hipotese de grind e confirmada se:
- Campo > 50% das runs totais, E
- O jogador demonstra sinal negativo (verbal ou comportamental) em pelo menos 2 runs do Campo, E
- O jogador nao escolhe o Campo voluntariamente na ultima metade das runs necessarias.

### Ajuste proposto SE confirmada (nao implementar antes do teste)
Opcao A: Distribuir sinais_controle por 2-3 zonas (reduz dependencia do Campo).
Opcao B: Reduzir custo total de sinais_controle para 20-25 (manter Campo como fonte unica mas exigir menos runs).
Opcao C: Adicionar mecanica de multiplicador no Campo que recompensa runs consecutivas de forma crescente (transforma grind em mastery loop).
Decisao de qual opcao depende dos dados do playtest.

---

## 4. Roteiro de Observacao

### Antes de comecar
- [ ] Configurar gravacao de tela (sem audio obrigatorio, mas util)
- [ ] Observador sentado ao lado, nao na frente — presente mas nao intrusive
- [ ] Bloco de notas fisico com colunas: TEMPO | ZONA | ACAO | VERBALIZACAO | SINAL (+ ou -)
- [ ] Dizer ao jogador: "Fale em voz alta o que voce esta pensando. Nao existe certo ou errado. Eu nao posso ajudar durante o jogo mas estou anotando tudo."
- [ ] Iniciar cronometro global

### O que olhar em cada run

**Primeiros 30 segundos na zona nova:**
- O jogador muda o comportamento de movimento ou continua identico ao hub?
- Ha uma pausa de "leitura" da zona ou mergulha imediatamente?
- Verbaliza o que a zona "parece ser"?

**Durante a run:**
- Nivel de engajamento: esta olhando para a tela, para o lado, bocejando?
- Comportamento de risco: tenta manobras arriscadas ou joga conservador?
- Coleta de recursos: nota os recursos no cenario ou passa por eles?

**No deposito (volta ao hub):**
- Vai direto ao painel do foguete ou explora o hub antes?
- Reage ao progresso do foguete (barra/indicador) ou ignora?
- Quanto tempo passa no hub antes de escolher proxima zona?

**Escolha da proxima zona:**
- Hesita? Por quanto tempo?
- Verbaliza criterio de escolha?
- Parece motivado ou resignado?

### Momentos criticos — foco total do observador

**Primeiro deposito de recurso:**
O jogador entende que o recurso depositado vai para o foguete? Ha conexao percebida entre a run e o objetivo macro?

**Terceira run no Campo (se ocorrer):**
Este e o momento de maior risco de grind. Anotar tudo: tom de voz, postura, velocidade de movimento, se o jogador comenta algo sobre repetitividade.

**Abertura do painel do foguete ao completar uma peca:**
Ha reacao emocional? O jogador percebe que uma peca foi completada ou o indicador nao e legivel?

**Momento do LANCAR (ultimo deposito + botao):**
- Preparar cronometro separado a partir do clique em LANCAR
- Anotar reacao segundo a segundo nos primeiros 10 segundos
- Nao interromper, nao comentar, deixar o silencio existir
- Primeira coisa que o jogador diz apos o lancamento: anotar palavra por palavra

**Pos-lancamento / Novo Ciclo:**
- O jogador quer continuar? Pergunta o que mudou?
- Expressa sensacao de fechamento ou de "e so isso?"

### Perguntas pos-sessao (5 minutos, nao mais)
Fazer apenas 4 perguntas abertas, em ordem:

1. "Qual foi o momento mais divertido da sessao?"
2. "Teve algum momento em que voce se sentiu entediado ou frustrado?"
3. "Quando voce estava coletando recursos, o que estava passando pela sua cabeca?"
4. "O lancamento do foguete foi como voce esperava?"

Nao fazer perguntas de escala numerica neste teste — queremos linguagem qualitativa, nao numeros falso-precisos.

---

## 5. Criterios de Saida do Playtest

O playtest atingiu seu objetivo se, ao final, o observador consegue responder com confianca (SIM, NAO, ou DADOS INSUFICIENTES) cada uma das 5 perguntas da secao 1.

**Acoes imediatas pos-playtest:**
- Dentro de 24h: o observador transcreve notas para um arquivo de findings (nao formatado — bullet points brutos sao suficientes)
- Dentro de 48h: reuniao de 30 minutos para decidir: continuar sem mudancas / ajustar balance / revisitar design de zona antes do proximo playtest
- Se hipotese de grind confirmada: levar opcoes A/B/C da secao 3 para decisao do time antes de implementar qualquer mudanca

---

## Apendice: Checklist de Prontidao da Build

Verificar antes de agendar o playtest:

- [ ] Loop hub→raid→deposito→LANCAR→Novo Ciclo funciona end-to-end sem crash
- [ ] resetForNewCycle limpa estado corretamente (sem recursos orfaos)
- [ ] Painel do foguete mostra progresso por recurso (legivel)
- [ ] Todas as 5 zonas carregam sem erro
- [ ] Timers Circuito (90s) e Infeccao (120s) ativos e visiveis
- [ ] Nenhum dado de run anterior persistido no dispositivo de teste
- [ ] Build instalada em dispositivo real (nao emulador) — PWA no celular ou tablet preferido
