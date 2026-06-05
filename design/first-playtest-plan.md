# Plano do Primeiro Playtest — Fungineer
Data: 2026-06-05
Fase: Pre-alpha / Vertical Slice
Condutor: Game Designer + 1 observador
Participantes alvo: 2-3 jogadores externos (nao-developers)

---

## 1. As 5 Perguntas que o Playtest Precisa Responder

### P1 — O loop central diverte antes de completar o foguete?
Por que importa: O macro-loop e multiplas runs antes do lancamento. Se a run individual (raid+deposito) ja nao for satisfatoria isoladamente, o objetivo do foguete nao vai salvar a experiencia. Esta e a pergunta de vida ou morte do design.

Indicadores de SIM: O jogador volta ao hub por vontade propria; comenta "quero tentar diferente"; a run tem sensacao de conclusao mesmo sem peca do foguete.

Indicadores de NAO: Silencio prolongado nas runs; frases como "e so isso?" ou "quando termina?"; parece cumprir tarefa, nao jogar.

---

### P2 — A mecanica "so-mover" por zona e legivel sem texto?
Por que importa: Cada zona tem uma fantasia de movimento diferente (circuito de velocidade, infeccao de fuga, campo de controle de area, hordas de desvio). Se o jogador nao entender o que a zona "pede" dele nos primeiros 30 segundos, a variedade de 11 zonas perde todo o ponto.

Indicadores de SIM: O jogador muda o comportamento de movimento ao entrar em zona diferente; verbaliza o "jeito" da zona ("aqui e pra ir rapido", "preciso desviar"); adapta rota sem instrucao.

Indicadores de NAO: Comportamento de movimento identico em todas as zonas; pergunta "o que eu tenho que fazer aqui?"; nao percebe mecanica de zona ate ser apontada.

Threshold de falha de design: se o jogador nao consegue descrever o padrao da zona apos 3 mortes, a zona precisa de redesign de feedback — nao de tutorial.

---

### P3 — O foguete funciona como objetivo de pull (atracao)?
Por que importa: O foguete e o macro-loop de progressao. A pergunta nao e "o jogador entende o foguete?" mas "o jogador QUER lancar o foguete?". Diferenca critica: entendimento intelectual nao gera tensao de progressao.

Indicadores de SIM: O jogador verifica o painel espontaneamente entre runs; comenta sobre o progresso sem ser perguntado; expressa antecipacao ("falta pouco").

Indicadores de NAO: Painel do foguete nao e visitado entre runs; deposito de recursos parece desconectado do objetivo; o foguete so aparece na conversa quando o observador pergunta.

---

### P4 — O gargalo de sinais_controle (50, so do Campo) vira grind chato?
Por que importa: sinais_controle e o recurso com maior volume (50x) e fonte unica (Campo de Controle). Todos os outros recursos fecham em 1-2 runs. O Campo vai representar 40-60% das runs totais. Repeticao de zona unica e o maior risco de tedio antes do climax.

Indicadores de grind chato: O jogador suspira ao voltar para o Campo pela terceira vez; comenta "de novo esse lugar"; perde o ritmo (movimento apressado, menos atento); compara desfavoravelmente com outras zonas.

Indicadores de grind saudavel (mastery loop): O jogador demonstra melhora visivel no Campo entre runs; comenta estrategia; o Campo parece desafiador mas dominavel; escolhe o Campo voluntariamente mesmo quando poderia ir a outra zona.

---

### P5 — O climax do lancamento emociona?
Por que importa: O lancamento e a recompensa de toda a progressao. Com implementacao minimalista (glifo), o risco e que o momento nao crie impacto proporcional ao esforco investido. Se falhar aqui, o Novo Ciclo vai parecer vazio e a motivacao para o segundo ciclo vai ser fraca.

Indicadores de SIM: Pausa espontanea antes de clicar em "Novo Ciclo"; exclamacao ou reacao visivel; o jogador fala sobre o lancamento depois; pergunta "o que muda no proximo ciclo?".

Indicadores de NAO: Reacao neutra ou confusa; sem pausa, clique imediato em continuar; pergunta "foi isso?" com tom neutro ou negativo; nao menciona o lancamento depois.

---

## 2. Configuracao Exata da Build de Teste

### Zonas incluidas no teste (4 de 11)
Criterio de selecao: maxima cobertura das perguntas P1-P5 com minima complexidade de setup.

| Zona | Por que incluir | Recurso chave |
|---|---|---|
| Hub | Ponto de ancoragem, painel do foguete, Dr. Myco | — |
| Circuito | Fantasia de velocidade mais clara; timer 90s; dois recursos (scrap+ai) | scrap (7), ai_components (7) |
| Campo de Controle | Unica fonte de sinais_controle; gargalo central — P4 depende disso | sinais_controle (50) |
| Hordas | Pressao de horda, contraste de ritmo com Circuito; cobre biomassa+frag | biomassa (parte de 10), frag (6) |
| Infeccao | Timer 120s, fuga vs pulso — contraste com Circuito; cobre biomassa+nucleo | biomassa (parte de 10), nucleo (3), comb (5) |

Zonas excluidas neste teste: Catedral, Torres, Labirinto, Cordilheira, Sacrificio, Stealth.
Motivo: complexidade de aprendizado adicional sem cobrir nenhuma pergunta nova nesta fase. Introduzir apos loop central validado.

### Custo do foguete — valores verificados
| Recurso | Custo | Fonte |
|---|---|---|
| scrap | 7 | Circuito |
| comb | 5 | Infeccao |
| nucleo | 3 | Infeccao |
| frag | 6 | Hordas |
| ai_components | 7 | Circuito |
| sinais_controle | **50** | **So Campo** |
| biomassa | 10 | Hordas + Infeccao |

### Dois bracos de teste
Se houver 2+ playtesters disponíveis, rodar bracos separados para isolar o risco de grind:

**Braco A (custo reduzido — baseline saudavel):**
sinais_controle = 15 (todos os outros custos inalterados).
Objetivo: verificar se o loop diverte quando a variedade de zonas esta presente.
Estimativa de runs: 6-9 runs totais para completar o foguete.
Usar com: jogador casual de mobile ou jogador sem experiencia em roguelikes.

**Braco B (custo original — expoe o risco):**
sinais_controle = 50 (producao real).
Objetivo: confirmar ou refutar a hipotese de grind com dados.
Estimativa de runs: 15-20+ runs, maioria Campo.
Usar com: jogador de roguelike que aguenta sessao longa (avise que sera mais demorado).

Se so houver 1 playtester disponivel: usar Braco A. Documentar explicitamente que o custo de producao nao foi testado.

### Numero de runs e duracao
- Braco A: 6-9 runs, 45-60 minutos de jogo efetivo.
- Braco B: 15-20+ runs, 90-120 minutos.
- Limite pratico: encerrar a sessao em 75 min (Braco A) ou 120 min (Braco B) independente de progresso. Registrar estado do foguete no momento do corte.
- Numero de participantes: 2-3 sessoes separadas de 1 jogador cada — nao jogar em grupo para capturar verbalizacao individual.

### Tutorial: SEM tutorial formal
Racional: a pergunta P2 (legibilidade das zonas) so pode ser respondida sem texto instrucional. Se o jogador precisar de texto para entender a zona, o design da zona precisa de trabalho — nao o tutorial.

Unica concessao: uma linha oral do observador antes de comecar — "Voce e Dr. Myco. Explore as zonas, colete recursos, construa o foguete. Qualquer duvida fale em voz alta." Nada mais.

O Dr. Myco pode falar normalmente se ja implementado. Nenhuma tela de instrucoes adicional.

### Estado inicial da build
- Foguete zerado (nenhuma peca depositada)
- Todas as 4 zonas acessiveis desde o inicio (nao travar por progressao)
- Timers nos valores atuais — Circuito 90s, Infeccao 120s — nao ajustar antes do teste; queremos saber se estao certos ou errados
- Nenhum dado de run anterior persistido no dispositivo de teste
- Build instalada em dispositivo real (nao emulador) — PWA no celular ou tablet

---

## 3. Hipotese de Balance + O Que Medir

### Hipotese central
"O custo de sinais_controle (50 unidades, fonte unica: Campo) vai dominar o runs-ate-lancar e criar percepcao de grind antes do climax."

Formalizando:
- Recursos com custo <= 10 e fontes distribuidas fecham em 1-2 runs (scrap 7, comb 5, nucleo 3, frag 6, ai 7, biomassa 10).
- sinais_controle (50) com fonte unica exige ~8-12 runs exclusivamente no Campo assumindo coleta media de 4-6 por run.
- Proporcionalmente, Campo representa 50-70% do total de runs necessarias.
- Distribuicao altamente assimetrica = variedade de zonas percebida como baixa; design de 11 zonas perde valor antes que o jogador as veja.

### Risco de design associado
Este e um degenerate equilibrium: o jogador racional maximiza Campo e ignora as outras zonas, esvaziando a promessa de variedade. Nao e um problema de dificuldade — e um problema de distribuicao de incentivos.

### Metricas de runs (observador registra manualmente)

| Metrica | Como medir | Threshold de alarme |
|---|---|---|
| % de runs no Campo vs total | Contagem por zona na planilha de campo | > 50% das runs totais no Campo |
| Runs ate lancamento | Contador simples | > 12 runs no Braco A |
| Yield de sinais_controle por run | Pedir ao jogador que leia em voz alta ao depositar | < 4 por run (grind prolongado) |
| Alternancia voluntaria de zonas | Jogador escolhe zona diferente do Campo quando poderia ir ao Campo | Menos de 2 trocas voluntarias |

### Metricas qualitativas (observador anota)

| Sinal | O que anotar |
|---|---|
| Tom emocional no Campo | Animado, neutro, entediado, frustrado — anotar run por run |
| Escolha de zona | Voluntaria ou resignada? Verbalizou motivo? |
| Verificacoes do painel do foguete | Quantas vezes abriu sem ser incentivado? |
| Reacao ao lancamento | Reacao nos primeiros 5 segundos; primeira frase apos |
| Momentos de confusao | Quando ficou parado sem saber o que fazer — zona + duracao |
| Momentos de flow | Completamente absorto, sem falar — zona + duracao |

### Criterio de confirmacao da hipotese de grind
Confirmada se, simultaneamente:
- Campo representa > 50% das runs totais, E
- O jogador demonstra sinal negativo (verbal ou comportamental) em pelo menos 2 runs do Campo, E
- O jogador nao escolhe o Campo voluntariamente na ultima metade das runs necessarias.

### Nota sobre os timers afrouxados
Circuito 90s e Infeccao 120s foram afrouxados no merge. O playtest vai revelar se ainda criam tensao adequada. Anotar explicitamente: o jogador sente pressao de tempo? Menciona o timer? Age diferente quando o tempo esta baixo? Esta informacao informa se o reajuste e necessario antes do proximo teste.

### Decisao de balance pós-playtest (nao implementar antes)
- Se hipotese refutada (mesmo producao sem grind percebido): nenhuma mudanca.
- Se hipotese confirmada, Braco A saudavel: distribuir sinais_controle por 2-3 zonas reduzindo dependencia do Campo, ou reduzir custo total para 20-25 mantendo Campo como fonte unica.
- Se mesmo Braco A apresenta monotonia: revisar loop interno do Campo de Controle para aumentar replay value intrinseco antes de qualquer ajuste de numero.
- Decisao de qual opcao aplicar depende dos dados — nao antecipar.

---

## 4. Roteiro de Observacao

### Preparacao (5 min antes)
- [ ] Gravacao de tela ativa (audio opcional mas util para capturar verbalizacao)
- [ ] Observador sentado ao lado, nao na frente — presente mas nao intrusivo
- [ ] Planilha de campo impressa ou aberta (ver Apendice)
- [ ] Cronometro global iniciado ao primeiro input do jogador
- [ ] Dizer ao jogador: "Fale em voz alta o que voce esta pensando. Nao existe certo ou errado. Eu nao posso ajudar durante o jogo, mas anoto tudo."

### Eventos a marcar com timestamp

| Evento | Simbolo | O que anotar alem do simbolo |
|---|---|---|
| Morte | M | Zona, numero da morte nessa zona, expressao verbal |
| Escolha de zona | Z | Qual zona, havia alternativa visivel, jogador verbalizou motivo? |
| Acesso ao painel do foguete | P | Espontaneo ou forcado pela UI? Quanto tempo ficou olhando |
| Verbalizacao negativa | F | Citacao literal |
| Verbalizacao positiva | + | Citacao literal |
| Hesitacao > 5s sem acao | H | Onde o olhar estava na tela |
| Pergunta ao observador | ? | Citacao literal — nao responder, anotar |
| Deposito de recurso | D | Recursos depositados, leu o painel do foguete? |
| Lancamento | L | Pausa (sim/nao) antes de clicar; reacao verbal e facial |

### O que olhar em cada run

Primeiros 30 segundos na zona nova:
- O jogador muda o comportamento de movimento ou continua identico?
- Ha uma pausa de "leitura" da zona ou mergulha imediatamente?
- Verbaliza o que a zona "parece ser"?

Durante a run:
- Nivel de engajamento: esta olhando para a tela, para o lado, bocejando?
- Comportamento de risco: tenta manobras ousadas ou joga conservador?
- Coleta de recursos: nota os drops no cenario ou passa por eles?

No deposito (volta ao hub):
- Vai direto ao painel do foguete ou explora o hub antes?
- Reage ao progresso do foguete ou ignora?
- Quanto tempo passa no hub antes de escolher proxima zona?

Escolha da proxima zona:
- Hesita? Por quanto tempo?
- Verbaliza criterio de escolha?
- Parece motivado ou resignado?

### Momentos criticos — foco total do observador

Primeiro deposito de recurso:
O jogador entende que o recurso depositado vai para o foguete? Ha conexao percebida entre a run e o objetivo macro?

Terceira run no Campo (se ocorrer no Braco B, ou segunda no Braco A):
Este e o momento de maior risco de grind. Anotar tudo: tom de voz, postura, velocidade de movimento, qualquer comentario sobre repetitividade.

Abertura do painel ao completar uma peca:
Ha reacao emocional? O jogador percebe que uma peca foi completada ou o indicador nao e legivel?

Momento do LANCAR:
- Preparar cronometro separado a partir do clique em LANCAR
- Anotar reacao segundo a segundo nos primeiros 10 segundos
- Nao interromper, nao comentar, deixar o silencio existir
- Primeira coisa que o jogador diz apos o lancamento: anotar palavra por palavra

Pos-lancamento / Novo Ciclo:
- O jogador quer continuar? Pergunta o que mudou?
- Expressa sensacao de fechamento ou de "e so isso?"

### Perguntas pos-sessao (maximo 10 minutos)
Nao fazer perguntas de escala numerica neste teste — queremos linguagem qualitativa.

1. "Qual foi o momento mais divertido da sessao?" (ancora positiva antes de qualquer critica)
2. "Teve algum momento em que voce se sentiu entediado ou frustrado?"
3. "Quando voce estava coletando recursos, o que estava passando pela sua cabeca?"
4. "O lancamento do foguete foi como voce esperava? O que voce esperava que acontecesse?"
5. "O que o Dr. Myco tem a ver com o que voce fez?" (testa se narrativa chegou)

Nao fazer perguntas leading ("voce achou divertido?"). Se o jogador der resposta curta, usar "pode me falar mais sobre isso?" — apenas uma vez por pergunta.

---

## 5. Criterios de Decisao Pos-Playtest

### Verde (prosseguir para mais zonas e playtesters)
- P1: pelo menos 1 playtester pediu mais uma run espontaneamente.
- P2: mortalidade de aprendizado < 3 mortes por zona nova em 2 de 3 playtesters.
- P3: painel do foguete foi acessado espontaneamente em > 50% das transicoes hub.
- P4 (Braco A): Campo representou < 50% das runs; nenhum sinal negativo explícito de grind.
- P5: pelo menos 1 playtester pausou visivelmente antes de clicar em Novo Ciclo.

### Amarelo (iterar antes de expandir)
- P1: jogadores continuam mas sem entusiasmo verbal — investigar qual parte do loop esta flat.
- P4: Campo dominante mesmo no Braco A → redesign de distribuicao de sinais_controle antes do proximo teste.
- P2: uma zona especifica com mortalidade > 3 → revisar feedback visual daquela zona.
- P5: reacao ao lancamento variada — 1 playtester impactado, 1 nao → investigar o que separou as experiencias.

### Vermelho (parar e redesenhar antes do proximo teste)
- P1: multiplos playtesters param voluntariamente antes de completar o foguete.
- P2: nenhum jogador consegue descrever o padrao de qualquer zona apos 3 mortes.
- P5: resposta universal de "e so isso?" no climax — o momento precisa de mais investimento antes de qualquer outra feature.
- Qualquer crash que interrompa a sessao antes do lancamento.

### Acoes imediatas pos-playtest
- Dentro de 24h: transcrever notas para arquivo de findings (bullet points brutos sao suficientes).
- Dentro de 48h: reuniao de 30 minutos para decidir: prosseguir / ajustar balance / revisitar design de zona.
- Se hipotese de grind confirmada: levar opcoes de distribuicao (secao 3) para decisao do time antes de implementar qualquer mudanca.

---

## Apendice: Checklist de Prontidao da Build

Verificar antes de agendar o playtest:

- [ ] Loop hub → raid → deposito → LANCAR → Novo Ciclo funciona end-to-end sem crash
- [ ] resetForNewCycle limpa estado corretamente (sem recursos orfaos)
- [ ] Painel do foguete mostra progresso por recurso de forma legivel
- [ ] Todas as 4 zonas (Circuito, Campo, Hordas, Infeccao) carregam sem erro
- [ ] Timers Circuito (90s) e Infeccao (120s) ativos e visiveis ao jogador
- [ ] Nenhum dado de run anterior persistido no dispositivo de teste
- [ ] Build instalada em dispositivo real (nao emulador) — PWA no celular ou tablet
- [ ] Braco A ou B configurado antes do teste (sinais_controle = 15 ou 50)

---

## Apendice: Planilha de Campo (imprimir ou copiar)

```
Playtester: ___________  Braco: A / B  Data: ___________
sinais_controle configurado: ___  Duracao total: ___

Run | Zona        | Dur | Mortes | sinais col. | Outros recursos    | Notas de tom
----|-------------|-----|--------|-------------|--------------------|--------------
  1 |             |     |        |             |                    |
  2 |             |     |        |             |                    |
  3 |             |     |        |             |                    |
  4 |             |     |        |             |                    |
  5 |             |     |        |             |                    |
  6 |             |     |        |             |                    |
  7 |             |     |        |             |                    |
  8 |             |     |        |             |                    |
  9 |             |     |        |             |                    |
 10 |             |     |        |             |                    |
 11 |             |     |        |             |                    |
 12 |             |     |        |             |                    |

Lancamento: Run nº ___  Pausa antes de clicar: S / N
Primeira frase apos lancamento: _________________________________

Runs no Campo: ___  Runs totais: ___  %Campo: ___

Momentos marcados (tempo — simbolo — nota literal):
________________________________________________________________________
________________________________________________________________________
________________________________________________________________________
________________________________________________________________________

Perguntas pos-sessao:
1. ______________________________________________________________________
2. ______________________________________________________________________
3. ______________________________________________________________________
4. ______________________________________________________________________
5. ______________________________________________________________________

Hipotese de grind confirmada? S / N / PARCIAL
Criterio de saida: VERDE / AMARELO / VERMELHO
```
