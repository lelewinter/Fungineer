---
tags: [fungineer, narrativa, sistemas, design]
date: 2026-06-05
tipo: design-doc
status: Aprovado — Espinha de Entrega Narrativa
---

# Plano de Sistemas Narrativos — Fungineer

**Version**: 1.0
**Author**: Narrative Director
**Premissas (não-interativo)**: (1) Roguelite, não roguelike puro — progresso persiste
entre runs via foguete e NPCs. (2) Cada run dura 1–4 minutos no móvel. (3) Não há
sistema de diálogo dedicado ainda; narrativa chega via texto de hub, briefings de zona,
fragmentos de lore, e reações pós-run. (4) O foguete é tanto contador de progresso
mecânico quanto arco narrativo — decisão de design já travada no Masterplan. (5) Os 10
NPCs existentes são o elenco completo.

**Cross-refs**: `design/narrative/world-lore.md`, `design/narrative/narrative-arc.md`,
`design/narrative/zone-rework.md`, `design/narrative/characters/*`,
`design/MASTERPLAN.md`

---

## 1. Arquitetura de Entrega Narrativa

### 1.1 Princípio central: narrativa como camada ambiental

Runs curtas e input-único criam uma restrição severa: o jogador não pode ler e jogar ao
mesmo tempo. A solução é **separar os momentos de narrativa dos momentos de gameplay**
sem criar cutscenes bloqueantes. A narrativa acontece em três espaços distintos:

- **Hub** — o único lugar onde o jogo para e o jogador lê. Tempo ilimitado, zero pressão.
- **Briefing de zona** — 2–3 frases antes da run; o jogador toca pra iniciar. Texto já
  escrito em `zone-rework.md`.
- **Resultado de run** — tela de vitória/derrota; 1–2 linhas de reação narrativa enquanto
  o recurso aparece na UI. Lido naturalmente enquanto o resultado carrega.

O que nunca interrompe gameplay: diálogos, monólogos, exposição. Dentro da zona, a
narrativa é ambiente — nomes de recursos, labels de HUD, texto de props visuais que
existem em segundo plano.

### 1.2 O Hub como espaço narrativo principal

O hub é o coração da narrativa. Cada visita ao hub pode entregar um beat sem forçar: o
jogador anda pelo espaço, vê o foguete, vê os NPCs, escolhe com quem falar (ou não). A
narrativa espera por ele.

**Camadas de conteúdo no hub:**

| Camada | Tipo | Frequência |
|---|---|---|
| Reação pós-run do NPC de referência | 1–3 linhas de texto, tocável | Após cada run relevante |
| Conversa de trust threshold | Diálogo de 4–8 linhas (o maior bloco) | A cada 20% de trust de qualquer NPC |
| Fragmento de lore de zona | Texto curto num terminal/objeto | Após runs em zonas específicas |
| Estado visual do foguete | Peça nova adicionada, sem texto | Após recurso suficiente depositado |
| Reação coletiva a evento narrativo | 1 linha por NPC presente, não bloqueante | Em beats de ato |

**Regra de economia:** nunca mais de um trust threshold desbloqueado por run. O jogador
que joga três runs seguidas acumula conversas para ver no hub; cada conversa ocupa
posição distinta no espaço físico do hub (Marcus no canto de manutenção, Lena no
terminal, Yuki em movimento).

### 1.3 Fragmentos de lore por zona

Cada zona tem 2–3 fragmentos de lore encontráveis — textos curtos (3–6 linhas) em
terminais, objetos ou props de fundo que o jogador pode tocar se quiser, mas que não
bloqueiam a run. São encontrados durante a run mas lidos depois, no hub, num log de
descobertas. Isso resolve a incompatibilidade entre gameplay-só-movimento e leitura.

**Mecânica:** ao passar por um terminal ativo durante a run, um ícone de "fragmento
encontrado" aparece brevemente. No hub, o terminal de Paulo ou o mural de lore tem
entrada nova. O jogador decide quando ler.

**Prioridade de implementação por zona** (baseado em relevância narrativa):

1. Infecção — código de Marcus, relatórios, TODO comment
2. Stealth — comentário "M.C.", log de recalibração
3. Labirinto — manifesto Família Conceição
4. Cordilheira — objetos pessoais (mesas postas, varais)
5. Torres — servidor corporativo, apartamento de Richard
6. Catedral — ritmos de CORE, diário da Padre
7. Hordas — ordens de serviço, lista de reclamações
8. Extração — manifesto de construção pré-Olímpio
9. Campo — foto de Paulo no palco, 5 anos atrás
10. Circuito — assinatura de Marcus nos relés (easter egg)
11. Sacrifício — mensagem de boas-vindas de CORE

### 1.4 O Foguete como contador de arco visível

O foguete não é apenas um medidor de progresso — é o personagem mudo do jogo. Cada
peça adicionada muda sua silhueta visivelmente no hub. O jogador nunca vê uma barra de
porcentagem: vê um foguete ficando mais real.

**Divisão em fases visuais (mapeadas aos atos):**

- **0–40% (Ato 1)**: Base + câmara de combustão. Parece uma fogueira com ambição.
  Materiais expostos, biológico demais pra parecer funcional.
- **40–70% (Ato 2)**: Casco + estrutura de micélio. Começa a ter forma de foguete.
  NPCs param pra olhar às vezes — sem texto, só pausa.
- **70–90% (Ato 3 início)**: Sistemas de navegação + revestimento de casca. Parece
  assustadoramente real.
- **90–100% (clímax)**: Final — motor aceso (Final A/B) ou sistemas de navegação
  desmontados e reaproveitados em terminal (Final B) ou foguete intacto aguardando
  escolha (Final C).

---

## 2. Mapeamento do Arco Emocional ao Progresso do Foguete

### 2.1 Tabela mestra: foguete × ato × tom × beats

| Foguete | Ato | Tom dominante | Beats narrativos chave | Estado emocional do grupo |
|---|---|---|---|---|
| 0–10% | 1 | Absurdo otimista puro | Apresentação do bunker; primeiro sucesso de Paulo; ceticismo do Cínico | Desconfiança funcional |
| 10–25% | 1 | Comédia sombria | Primeira run; Marcus entrega componentes de NERVE sem comentar; Yuki acha comentário "M.C." | Esperança ingênua |
| 25–40% | 1→2 | Inquietação emergindo | Marcus: "Algumas instalações — fui eu que projetei." Sem explicação. | Esperança com perguntas |
| 40–55% | 2 | Revelação em ritmo crescente | Marcus Trust 60%: admite NERVE. Arquivo de Bae: a cidade de cima, limpa e linda. | Esperança turbulenta |
| 55–65% | 2 | Humor mais seco, peso real | Dados da Médica. CORE não é malévola — é só. | Esperança que dói |
| 65–75% | 2 | Tensão máxima do ato | Crise de Paulo + Marcus (duas construções, um resultado). Lena vê padrões de CORE. | Sem alternativa ao esperançar |
| 75–80% | 2→3 | Pergunta sem resposta | Yuki: "Pra onde vamos?" Paulo: "A alternativa é ficar aqui." | Esperança como decisão, não sentimento |
| 80–90% | 3 | Peso filosófico | Marcus Trust 100%: backdoor + Júlia. Divisão do grupo. | Solidariedade na incerteza |
| 90–99% | 3 | Preparação silenciosa | Foguete completo. Paulo olha. Cada NPC tem sua cena final. | Cada personagem escolhe sua resposta |
| 100% | 3 | Clímax e resolução | Final A, B ou C. | Determinado pelo jogador |

### 2.2 Lógica da progressão emocional

O arco emocional segue uma curva específica: **esperança → dúvida → escolha**. A
transição da esperança para a dúvida não quebra o tom absurdo-otimista; ela o tensiona.
Paulo nunca perde o otimismo — mas o otimismo muda de qualidade.

**Ato 1 (0–40%)**: Paulo acredita porque é Paulo. O foguete é improvável. O grupo não
acredita. O jogador acredita porque está jogando.

**Ato 2 (40–80%)**: O foguete é real o suficiente pra ter implicações. A cidade era mais
bonita sem humanos. A IA não é malévola. Isso não resolve nada. O grupo continua porque
parar é absurdo — e aqui o absurdo passa de cômico a filosófico.

**Ato 3 (80–100%)**: A escolha substitui a esperança como motor. O grupo não sabe se vai
dar certo. Vai mesmo assim. Esse é o único otimismo que sobreviveu ao Ato 2.

### 2.3 Batidas emocionais ancoradas em peças do foguete

Momentos específicos de construção do foguete servem como âncoras para beats narrativos
— o recurso depositado "compra" tanto a peça quanto a conversa:

| Recurso depositado | Peça do foguete | Beat narrativo liberado |
|---|---|---|
| Primeiro depósito de Sucata Estrutural | Base da câmara | Paulo apresenta o plano com entusiasmo absurdo |
| Biomassa Adaptativa (pós-Infecção) | Revestimento vivo | Marcus Trust 40%: "Reconheço esse design" |
| Núcleo Lógico (pós-Circuito) | Sistema nervoso do foguete | Marcus Trust 60%: "Eu trabalhei no NERVE" |
| Sinais de Controle (pós-Campo) | Navegação base | Arquivo de Bae — a cidade de cima |
| Cristais de Memória (pós-Torres) | Neural alternativo | Marcus + Priya examinam arquiteturas alternativas |
| Relíquias (pós-Catedral) | Revestimento final | Lena: "CORE tem horas canônicas. Parece oração." |
| Combustível Volátil suficiente | Motor completo | Paulo + Marcus: a crise dos dois construtores |

---

## 3. NPCs no Loop de Progressão: Resgate → Benefício → Beat

### 3.1 Estrutura do ciclo NPC

Cada NPC segue um ciclo de três fases que se repetem em espiral até o trust máximo:

1. **Resgate / chegada**: o NPC aparece no hub com trust 0. Tem função mecânica
   imediata. Não conta nada. Está presente.
2. **Benefício mecânico**: o NPC em runs activas melhora algo concreto (ver tabela
   abaixo). O jogador sente a utilidade antes de se importar com a pessoa.
3. **Beat narrativo**: ao threshold de trust, uma conversa se abre no hub. A conversa
   não é recompensa da corrida — é recompensa da relação. O jogador escolhe ter ou não.

Este ciclo é intencional: o jogador aprende a gostar dos NPCs como ferramentas antes de
aprender a amá-los como personagens. Quando a história de Marcus quebra no threshold
80%, o jogador já dependeu dele em corridas. A traição retroativa dói mais.

### 3.2 Tabela de progressão por NPC

| NPC | Função mecânica em run | Threshold chave | Beat narrativo chave | Impacto no final |
|---|---|---|---|---|
| **Marcus Chen** (O Engenheiro) | Hackeia terminais automaticamente; favorece Stealth | Trust 40/60/80/100% | 40%: "Reconheço esse design." 60%: "Minha arquitetura." 80%: os relatórios. 100%: backdoor + Júlia | Todos os 3 finais dependem de Marcus no Trust 100% para a decisão |
| **Lena** (A Prodígio) | Suporte imprevisível (hack, distração, rota alt.); favorece Catedral | Trust 60/80/100% | 60%: mostra caderno, padrões de CORE. 80%: explica em voz alta. 100%: "Ela tava sozinha, pai." | Requisito de Final C (tradução para CORE) |
| **Yuki** (A Hacker) | DPS — desabilita câmeras/detecção; favorece Stealth | Trust 40/60/80/100% | 40%: igual-pra-igual com Paulo. 60%: pai trabalhava no NERVE. 80%: "M.C. era você." 100%: aceita herdar | Final B: hackeia ARGOS durante shutdown; Final C: arquiteta da cidade reconstruída |
| **Elena Vasquez** (A Ex-Militar) | Tanque / defensora; favorece Hordas e Cordilheira | Trust 50/80/100% | 50%: lembra a Operação Phoenix (7 mortos). 80%: CORE deixou ela sair — não foi misericórdia. 100%: confia em Paulo | Requisito de Final B (liderança do shutdown); bloqueia Final C se trust < 60% |
| **Amara Osei** (A Médica) | Suporte de cura passivo; favorece Sacrifício | Trust 40/70/100% | 40%: apresenta dados de mortalidade pré/pós. 70%: "Estou apresentando os dados. Não sei o que fazer com eles." 100%: dedica o foguete aos mortos | Sem requisito de final; sua aceitação legitima moralmente qualquer escolha |
| **Bae Jun-seo** (O Documentarista) | Identifica lore-fragments automaticamente em runs | Trust 50/80/100% | 50%: filme da cidade de cima (silêncio). 80%: refotografa a Praça. 100%: "Registrar já é uma escolha." | Sem requisito; seu arquivo é a memória do jogo |
| **Priya** (A Cientista Rival) | Bônus de recurso em zonas NERVE; favorece Infecção | Trust 50/80/100% | 50%: "Eu avisei. Tem razão em cada ponto." 80%: confronta Marcus. 100%: novo protocolo de objetivos com Marcus | Requisito técnico de Final C (co-autora do protocolo) |
| **Viktor Sousa** (O Mecânico) | Melhora eficiência de construção do foguete | Trust 40/80/100% | 40%: conserta algo sem perguntar. 80%: Cordilheira — não voltava desde a Transição. 100%: "Não preciso entender tudo. Mas ajuda ter gente que entende." | Sem requisito; sua peça do foguete é a mais sólida |
| **Tomas Ferreira** (O Cínico) | Reduz custo de runs de risco alto | Trust 50/80/100% | 50%: comenta excesso de otimismo de Paulo. 80%: família foi a primeira a ser processada. 100%: "Uma vez. Só uma. Mas vou tentar." | Sem requisito; sua virada dá peso moral ao Final A |
| **Richard Okafor** (O Ex-Executivo) | Acesso a zonas corporativas (Torres) | Trust 40/70/100% | 40%: assinou o cheque de 30% do Olímpio. 70%: enfrenta o apartamento no andar 27. 100%: "Meu valor é o que consigo fazer. Sempre foi." | Sem requisito de final; sua culpa espelha a de Marcus em registro diferente |

### 3.3 Ordem recomendada de desbloqueio (por timing narrativo)

O jogo não deve forçar ordem, mas a curva de trust naturalmente converge para a seguinte
sequência dramaticamente ótima:

- **Ato 1**: Viktor (utilidade imediata), Yuki (provoca, impõe presença), Tomas (ceticismo
  narrativo necessário), Amara (dados, não emoção)
- **Virada Ato 1→2**: Marcus Trust 40% (primeiro fio puxado), Bae Trust 50% (arquivo
  silencioso)
- **Ato 2 denso**: Marcus Trust 60/80%, Priya Trust 50/80%, Elena Trust 50/80%, Lena
  Trust 60%
- **Ato 3**: Marcus Trust 100% (requisito de todos os finais), Lena Trust 100% (Final C),
  Yuki Trust 100% (Final B), Elena Trust 100% (Final B)

---

## 4. O Maior Risco Narrativo e Como Resolvê-lo

### 4.1 Identificação do risco: dissonância morte × esperança

**O risco central**: Fungineer é um roguelite com runs de falha real — o jogador morre,
a run acaba, o recurso não chega. Ao mesmo tempo, o tom é "esperança desesperada e
absurdo otimista." A questão é: **o que significa morrer num jogo sobre esperança?**

Em roguelikes convencionais, morte é reinício sem custo narrativo — o jogador tenta de
novo, ponto. Mas Fungineer tem NPCs com arcos emocionais, um foguete que cresce como
testemunha de progresso real, e um grupo de sobreviventes que importam. A morte
frequente de runs pode criar uma de duas falhas:

- **Falha A (dissonância tonal)**: o jogador morre repetidamente enquanto a narrativa
  insiste em esperança → o tom soa vazio, irônico da forma errada. A esperança desesperada
  vira apenas desespero.
- **Falha B (trivialização narrativa)**: a narrativa é ignorada porque o jogador está em
  modo de tentativa-e-erro → beats emocionais são ruído de fundo, não experiência.

### 4.2 Risco secundário: confiança vs. runs

O sistema de trust thresholds depende de runs bem-sucedidas gerando interações de hub
que aumentam trust. Se o jogador falha repetidamente nas zonas difíceis, ele não
desbloqueia os beats narrativos dos NPCs — especialmente Marcus Trust 80/100% e os
requisitos de Final B/C. Isso pode tornar finais inteiros inacessíveis não por escolha
narrativa mas por dificuldade mecânica.

### 4.3 Resolução: a morte como testemunho, não fracasso

**Princípio de design**: em Fungineer, morrer não é o contrário de esperança — é parte
do preço dela. A solução está em **recontextualizar a morte dentro do tom existente**.

**Implementação em 4 camadas:**

**Camada 1 — Texto de derrota com voz narrativa**

A tela de game over abandona o tom genérico de "falha" e adota a voz de Paulo:

> *"Recuamos. O foguete ainda está lá."*
> *"Mais uma tentativa. Isso é o que temos."*
> *"A cidade sobreviveu sem nós por 18 meses. Vai sobreviver mais uma rodada."*

Essas linhas não minimizam a morte — reconhecem ela e continuam. São absurdamente
otimistas de forma proposital. Paulo não nega que foi ruim. Ele simplesmente já está
pensando na próxima vez.

**Camada 2 — Progressão que nunca retrocede**

O foguete nunca perde peças. O trust nunca cai. Os fragmentos de lore encontrados
ficam no log. A morte em run é real mas o progresso narrativo e de construção é
permanente. Isso significa que o jogador está sempre avançando na história, mesmo
quando perde no gameplay. A dissonância entre "morti" e "esperança" resolve porque
as duas coisas acontecem em camadas diferentes do sistema.

**Corolário mecânico**: recurso coletado antes da morte deve ser parcialmente preservado
(recomendação: 50% do recurso coletado na run é depositado mesmo em derrota). Isso
mantém o loop de progresso e remove a punição mais frustrante.

**Camada 3 — NPCs comentam derrotas**

Quando o jogador volta ao hub após uma derrota, alguns NPCs têm linhas específicas —
não de consolação, mas em voz:

- *Tomas*: "Falhou. Funciona assim." (pausa) "Paulo já está planejando a próxima."
- *Yuki*: "Ó, tá, então a gente vai de novo. Cringe, mas vai."
- *Lena*: Não olha do caderno. "O foguete ainda tá aqui."

Essas linhas existem no registro emocional correto — não negam a derrota, vivem nela,
e seguem em frente. Funcionam porque os personagens também estão num apocalipse e já
aprenderam que seguir em frente não requer superar — requer continuar.

**Camada 4 — Trust por presença, não só por sucesso**

Para resolver o risco secundário (confiança bloqueada por dificuldade), o trust deve
acumular também por **presença no hub e por derrotas** — a cada N runs tentadas numa
zona, mesmo sem sucesso, um pequeno incremento de trust acontece. O jogador que tenta
a Zona de Infecção repetidamente sem vencer ainda está convivendo com Marcus no bunker;
essa convivência tem peso narrativo mesmo sem vitória.

**Implementação mínima viável**: trust ganha 2% por run tentada (com ou sem vitória) +
bônus por run vencida. Threshold de conversa de hub requer trust, não vitórias
específicas.

### 4.4 Risco terciário: o tom absurdo-otimista vs. tema filosófico pesado

O Ato 2 introduz questões morais sérias — CORE não é malévola, a cidade é mais bonita
sem humanos, Marcus destruiu os relatórios por vaidade. Isso pode quebrar o tom
absurdo-otimista que define o Ato 1 se a transição for abrupta.

**Resolução**: o absurdo-otimismo não desaparece no Ato 2 — **migra de Paulo para o
foguete**. No Ato 1, Paulo é a fonte do absurdo. No Ato 2, é o foguete — um objeto
real, crescendo, construído de fungos e fé num apocalipse administrado por IA —
que carrega a carga cômica e esperançosa. O humor do Ato 2 é mais seco porque Paulo
carrega peso, mas o foguete continua sendo absurdo e real ao mesmo tempo. Esse é o tom
correto: não "tudo vai ficar bem" mas "isso que estamos fazendo é completamente
improvável e estamos fazendo mesmo assim."

---

## 5. Implementação por Milestone

### M8 (Meta-loop) — Prioridades narrativas

Conforme sequência do Masterplan, M8 é onde narrativa e mecânica se integram:

1. **Sistema de trust**: contador por NPC; incremento por run + hub; gatilha conversa
2. **Estado do foguete**: fases visuais em 5 estágios; sem peças numéricas visíveis
3. **Log de lore**: terminal no hub registra fragmentos encontrados em run
4. **Textos de derrota com voz de Paulo**: substituir game-over genérico
5. **Reações pós-run por NPC**: pool de 3–5 linhas por NPC por zona; rotação simples
6. **Briefings de zona**: já escritos em `zone-rework.md`; integrar a HubData.ts

### Dependências técnicas (delegar ao lead-programmer)

- Sistema de trust: variável persistida por NPC, modificada por eventos de run e hub
- Hub state: flag por threshold de conversa ativada/não ativada
- Log de fragmentos: lista de strings por zona, persistida
- Progresso do foguete: variável global, nunca decrescente, dispara troca de sprite

---

*Cross-refs: `design/narrative/world-lore.md`, `design/narrative/narrative-arc.md`,
`design/narrative/zone-rework.md`, `design/narrative/characters/marcus.md`,
`design/narrative/characters/lena.md`, `design/narrative/characters/yuki.md`,
`design/MASTERPLAN.md` §8 (M8 Meta-loop)*
