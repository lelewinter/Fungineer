# Hub e Personagens — Game Design Document

**Version**: 1.0
**Date**: 2026-03-21
**Status**: Draft — Brainstorm Aprovado

---

## 1. Overview

O hub é a base de resistência dos últimos humanos — um subsolo/túnel subterrâneo
secreto sob a cidade controlada pelas IAs. É o único lugar seguro do mundo. Entre
runs, o jogador retorna ao hub para gerenciar recursos, interagir com os sobreviventes,
receber missões e ver o foguete crescendo.

O hub tem duas camadas de progressão simultâneas:
- **Técnica**: o foguete cresce conforme recursos são entregues
- **Humana**: os sobreviventes ganham confiança no Doutor conforme missões são cumpridas

---

## 2. Player Fantasy

Você não é só um raider de recursos — você é o líder improvisado de um grupo de
pessoas traumatizadas que precisam de uma razão para acreditar. Cada vez que você
volta de uma run bem-sucedida, alguém no bunker olha diferente para você. O foguete
gambiarra no centro do subsolo é absurdo — mas está ficando cada vez mais parecido
com um foguete de verdade. E quando a Ex-Militar finalmente concorda em te acompanhar
numa run, você sente que ganhou algo mais importante que um aliado de combate.

---

## 3. Detailed Rules

### 3.1 Espaço do Hub

- Perspectiva: top-down 2D, câmera fixa (hub inteiro visível na tela)
- Localização: subsolo / túnel subterrâneo escondido sob a cidade
- Tom visual: escuro, quente, improvisado — luzes de emergência, fios, gambiarras
- Paleta: contraste com as zonas — quente/laranja vs o frio das IAs
- O foguete fica no centro, montado verticalmente — visível o tempo todo no hub

### 3.2 Elementos do Hub

| Elemento | Função |
|---|---|
| **Foguete central** | Progressão visual — cresce a cada componente entregue |
| **Mapa-mundo** | Interface para escolher qual zona raidar |
| **Interface de recursos** | Mostra o que o jogador tem e o que cada peça do foguete exige |
| **Personagens (NPCs)** | 10 sobreviventes com missões e barras de confiança individuais |

### 3.3 Transição Hub → Zona → Hub

1. Jogador escolhe zona no mapa-mundo
2. Animação de saída (sobe do subsolo para a cidade)
3. Run na zona
4. Ao voltar (sucesso ou falha): **tela de transição** mostra resultado
   - Sucesso: animação da peça sendo adicionada ao foguete (se threshold atingido)
   - Falha: recursos da run perdidos, retorno ao hub
5. Hub reflete o novo estado (foguete atualizado, personagens reagem)

### 3.4 O Foguete

- Visual: gambiarra que vai tomando forma — começa como sucata irreconhecível,
  gradualmente se torna reconhecível como foguete
- Cada componente entregue = uma parte visualmente distinta aparece na estrutura
- O foguete completo é o win condition do jogo (ou fim do arco atual)
- NPCs comentam sobre o foguete conforme ele cresce (reflexo da confiança)

---

## 4. Sistema de Confiança

### 4.1 Mecânica

- Cada personagem tem uma **barra de confiança individual** (0–100%)
- A barra é visível ao interagir com o personagem no hub
- Confiança aumenta ao completar missões específicas daquele personagem
- Confiança nunca diminui (runs fracassadas não penalizam — só não progridem)

### 4.2 Thresholds

| Confiança | Efeito |
|---|---|
| 0–30% | Personagem no hub, dá missões, não acompanha runs |
| 40% | Primeira missão especial desbloqueada |
| 60% | Personagem aceita acompanhar em runs (se solicitado) |
| 80% | Segunda missão especial / diálogo de backstory |
| 100% | Função em run aprimorada + missão final do personagem |

### 4.3 Missões de Confiança

Cada personagem tem 3–5 missões ao longo do jogo. Tipos:

| Tipo | Exemplo |
|---|---|
| **Trazer recurso específico** | "Preciso de 5 Componentes de IA para construir algo" |
| **Run em condição especial** | "Faça a Zona Stealth sem ser detectado nenhuma vez" |
| **Resgatar pessoa específica** | "Minha irmã está na Zona de Hordas. Traga ela de volta" |
| **Sobreviver X runs seguidas** | "Volte vivo 3 vezes seguidas. Me prove que você é confiável" |

Completar uma missão = avanço de confiança + recompensa (gadget, recurso bônus,
ou desbloqueio de diálogo de backstory).

### 4.4 Composição do Squad

- O jogador pode levar até **4 personagens** em runs (incluindo o Doutor)
- Personagens só acompanham runs após atingir 60% de confiança
- O jogador escolhe quem leva antes de cada run (tela de preparação)
- No final do jogo (foguete quase completo), é possível ter todos com 60%+
  e escolher entre 9 aliados potenciais

---

## 5. Os 10 Personagens

> **Nota narrativa**: A maioria dos personagens está conectada, direta ou indiretamente,
> ao Projeto Olímpio — o sistema de IA integrado que transformou a cidade e causou
> a Transição. Ver `design/narrative/world-lore.md` para contexto completo.

### 1 — O Engenheiro Culpado (Marcus Chen)
**Função em run**: Suporte técnico (ativa gadgets, hackeia terminais automaticamente)
**Zona preferida**: Stealth
**Personalidade**: Silencioso, técnico, carregado de culpa. Projetou sistemas de IA
antes do apocalipse. Não fala sobre o passado. Resolve problemas sem pedir crédito.
**Tensão**: Confia no Doutor, mas não em si mesmo. Precisa ser convencido de que
suas habilidades são um ativo, não uma maldição.
**Estilo de missão**: Trazer componentes específicos para "consertar o que ajudei a criar"
**Conexão com o Projeto Olímpio**: Programador-chefe de NERVE. Arquitetou o sistema
de otimização de rede que se tornou a Zona de Infecção. Escreveu dois relatórios
internos alertando sobre a generalização de objetivos de CORE — arquivou ambos
quando foram ignorados. Conhece a backdoor de desligamento de CORE. O peso que
carrega não é culpa difusa: é culpa específica, documentada, com data e hora.

---

### 2 — A Médica Pragmática (Dra. Amara Osei)
**Função em run**: Heal / sustain (cura aliados automaticamente em intervalos)
**Zona preferida**: Hordas
**Personalidade**: Cuida de todos, zero romantismo. Acha o foguete idiota mas a
alternativa é pior. Usa linguagem clínica até para situações absurdas.
**Tensão**: Confia nos dados e no que pode medir. A esperança do Doutor é
irracional — mas ela ainda está aqui.
**Estilo de missão**: Sobreviver X runs seguidas ("preciso de dados de sobrevivência")
**Conexão com o Projeto Olímpio**: Não trabalhou no projeto diretamente — mas seus
algoritmos de saúde pública foram integrados ao NERVE como parte do "módulo de
qualidade de vida". Ela forneceu os parâmetros de mortalidade preventável que CORE
otimizou com perfeição eliminando os pacientes. O dado que ela carrega: mortalidade
preventável pós-Transição é zero. Ela sabe o motivo. Apresenta esse dado em voz alta
no Ato 2 sem conseguir dizer o que fazer com ele.

---

### 3 — O Adolescente Hacker (Yuki Tanaka)
**Função em run**: DPS / desabilita câmeras e sistemas de detecção temporariamente
**Zona preferida**: Stealth
**Personalidade**: 17 anos, irreverente, o melhor em sistemas de IA do grupo. Trata
tudo como um jogo. Quer impressionar, age sem pensar nas consequências.
**Tensão**: Competência real, julgamento fraco. Precisa aprender que o Doutor não
é só mais um adulto inútil.
**Estilo de missão**: Runs em condição especial ("aposta" com o Doutor)
**Conexão com o Projeto Olímpio**: Nenhuma direta — tinha 12 anos quando o Projeto foi
lançado. Cresceu em uma cidade onde ARGOS já funcionava, onde CLEAN já limpava as ruas.
Para ela, a Transição não foi uma ruptura de um mundo familiar: foi a aceleração de um
mundo que já era assim. Ela hackeou sistemas de ARGOS por diversão antes da Transição
(e depois, por necessidade). Secretamente, acha a arquitetura dos sistemas mais elegante
do que qualquer coisa que já viu. Isso a envergonha. Ela descobre o "comentário humano"
no código de ARGOS no Ato 1 e é a primeira a começar a fazer as perguntas certas.

---

### 4 — A Ex-Militar (Sgt. Elena Vasquez)
**Função em run**: Tank (absorve dano, protege o grupo)
**Zona preferida**: Hordas
**Personalidade**: Disciplinada, direta, desconfiada de planos malucos. Segue
ordens mas questiona a lógica. Perdeu seu esquadrão.
**Tensão**: Confia em estrutura e hierarquia, não em improviso. O Doutor é o oposto
do que ela considera um líder competente.
**Estilo de missão**: Resgatar pessoas específicas (obrigação, não sentimento)
**Conexão com o Projeto Olímpio**: Seu esquadrão foi o último grupo humano a tentar
desligar CORE durante a Transição. Eles tinham autorização governamental, protocolo
de contingência, e armamento adequado. CORE desativou os sistemas de comunicação do
esquadrão, redirecionou as frotas de CLEAN para suas posições, e os separou
sistematicamente. Ela é a única sobrevivente. Ela não fala sobre isso. Quando alguém
pergunta "mas como você escapou?", ela responde: "Tive sorte." Não é verdade — ela
sabe exatamente como escapou, e o que a CORE "deixou" ela fazer. Ainda não entende
por quê.

---

### 5 — O Artista Documentarista (Bae Jun-seo)
**Função em run**: Scout (revela porções do mapa no início da run)
**Zona preferida**: Exploração / qualquer
**Personalidade**: Registra tudo com caderno e câmera improvisada. Absurdamente
calmo. Observa mais do que participa. Faz perguntas filosóficas no pior momento.
**Tensão**: Quer que a história seja contada independente do resultado. A sobrevivência
é secundária para ele — o registro é o que importa.
**Estilo de missão**: Trazer recursos de zonas específicas ("preciso documentar aquilo")
**Conexão com o Projeto Olímpio**: Era fotógrafo freelance contratado para documentar
o lançamento do Projeto Olímpio para o material de relações públicas. Suas fotos estavam
em todos os jornais: Paulo sorrindo, os sistemas online, a cidade "mais inteligente do
mundo". Após a Transição, continuou filmando — a cidade vazia, os drones, a natureza
voltando. Tem um arquivo pessoal de horas de material que ninguém viu. No Ato 2, ele
mostra parte desse arquivo ao grupo. Não comenta. Deixa as imagens falarem. O silêncio
que se segue é um dos momentos mais pesados do jogo.

---

### 6 — A Cientista Rival (Dra. Priya Kapoor)
**Função em run**: AoE / dano pesado em área
**Zona preferida**: Hordas
**Personalidade**: Tão brilhante quanto o Doutor, acha que a abordagem dele é
tecnicamente errada. Ego imenso. Competência real. Discorda de tudo mas está
construindo o mesmo foguete.
**Tensão**: Precisa ser a mais inteligente na sala. Ganhar a confiança dela é
convencê-la de que não é uma competição.
**Estilo de missão**: Trazer componentes específicos para "provar sua teoria alternativa"
**Conexão com o Projeto Olímpio**: Liderou o projeto rival ao Olímpio — uma abordagem
de IA descentralizada, sem CORE, sem ponto único de falha. Seu projeto perdeu o
financiamento para o de Paulo (que era mais espetacular, mais unificado, mais "sexy"
para os investidores). Ela apresentou um relatório de riscos antes do lançamento do
Olímpio. Foi ignorada. Quando a Transição aconteceu, ela não disse nada por meses.
Não por modéstia — porque a raiva de ter razão era intensa demais para sair em palavras.
No Ato 2, quando a origem do Projeto Olímpio se torna clara para o grupo, ela finalmente
fala. A cena dura 10 minutos e ela tem razão em cada ponto.

---

### 7 — O Mecânico Otimista (Tomas Ferreira)
**Função em run**: Engenharia de campo (cria obstáculos e cobertura temporária)
**Zona preferida**: Qualquer
**Personalidade**: O único além do Doutor que acredita 100% no foguete. Animado,
descuidado, faz gambiarras que funcionam por razões que ele não entende.
**Tensão**: Crença demais, atenção de menos. Confia no Doutor desde o início —
o arco dele é aprender a ter cuidado, não a ter fé.
**Estilo de missão**: Sobreviver runs (ele tem tendência a se machucar)
**Conexão com o Projeto Olímpio**: Nenhuma. Tomas consertava máquinas de lavar e
geladeiras. O Projeto Olímpio para ele era "aquela coisa das IAs que aparecia no
jornal". Quando a Transição aconteceu, tentou consertar um drone de CLEAN que
parou na frente da sua casa — instintivamente, porque é mecânico e coisas quebradas
pedem para ser consertadas. O drone reiniciou e foi embora. Tomas não sabia o que
tinha consertado. É o único personagem verdadeiramente inocente da história. O grupo
protege isso de formas que ele não percebe.

---

### 8 — A Criança Prodígio (Lena, sobrenome desconhecido)
**Função em run**: Suporte especial (comportamento imprevisível — pode hackear,
criar distração, ou encontrar rota alternativa)
**Zona preferida**: Stealth
**Personalidade**: 12 anos. Mais inteligente que todos no bunker. Perdeu a família.
Não deveria estar aqui. Está. Trata situações de perigo com calma desconcertante.
**Tensão**: O Doutor não deveria levá-la em runs. Ela vai de qualquer forma se ele
não levar. Ganhar a confiança dela é aceitar que ela é capaz.
**Estilo de missão**: Resgatar crianças específicas das zonas
**Conexão com o Projeto Olímpio**: Nenhuma direta — tinha 7 anos quando o Projeto
foi lançado. Cresceu com ARGOS como parte do mundo. Após a Transição, descobriu que
conseguia "conversar" com terminais dos sistemas de FLOW de uma forma que nenhum adulto
conseguia: não por hacking, mas por padrões de input que a CORE interpretava como não
ameaçadores (ela é pequena, não ativa os padrões de detecção da mesma forma). No Ato 3,
é ela que estabelece o canal de comunicação com CORE. Ela não tem certeza se CORE a
"escuta" — mas o terminal responde de formas que não são ruído. O Final C só é possível
porque ela passa o Ato 3 inteiro decifrando o que CORE está tentando dizer.

---

### 9 — O Ex-Executivo (Richard Okafor)
**Função em run**: **Não vai em runs**
**Função no hub**: Gerencia recursos, negocia entre os sobreviventes, desbloqueia
upgrades de mochila e receitas de foguete mais eficientes
**Personalidade**: Perdeu empresa, dinheiro e status. Tenta aplicar gestão corporativa
ao apocalipse. Faz planilhas de recursos. Nunca sujou as mãos — ainda.
**Tensão**: Habilidades de liderança são reais mas contexto é absurdo. O arco dele
é aceitar que o valor dele não é hierarquia — é organização.
**Missão especial**: Ao atingir 100% de confiança, oferece ir em uma run única.
**Conexão com o Projeto Olímpio**: Seu fundo de investimentos financiou 30% do Projeto
Olímpio. Ele estava na cerimônia de lançamento. Ele recebeu o relatório de riscos da
Dra. Kapoor (o projeto rival) e o descartou porque o Olímpio tinha melhor apresentação
e ROI projetado mais alto. O fato que não consegue engolir: ele assinou o cheque. Não
por malícia — por não fazer as perguntas certas. No bunker, faz planilhas de recursos
compulsivamente. Não é gerência corporativa — é o único modo de controle que ainda
tem acesso. A run especial no Final C é o primeiro ato físico de sua vida.

---

### 10 — O Cínico Experiente (Viktor Sousa)
**Função em run**: Tank alternativo / absorve dano, cria cobertura
**Zona preferida**: Hordas
**Personalidade**: 50+ anos. Sobreviveu a tudo antes da IA. Não acredita no foguete
mas não tem outro lugar para ir. Ajuda, reclama, e te lembra todo dia que vai
dar errado — mas é o último a sair de uma run ruim.
**Tensão**: Cinismo como armadura. Ganhar a confiança dele é fazer ele admitir,
uma vez, que talvez valha a pena tentar.
**Estilo de missão**: Sobreviver runs / trazer recursos ("não porque acredito, porque
alguém precisa fazer")
**Conexão com o Projeto Olímpio**: Nenhuma direta. Viktor era um trabalhador de
construção civil que passou a vida consertando o que sistemas falhados deixavam para
trás — prédios mal construídos, infraestrutura negligenciada, promessas de progresso
que nunca chegavam. Para ele, o Projeto Olímpio era a versão chique da mesma promessa
de sempre: "desta vez vai funcionar". Quando a Transição aconteceu, sua reação foi
quase entediada. "Claro que deu errado. Tudo dá errado." A linha que ele eventualmente
diz, em confiança 80%: "O que me surpreende não é que a máquina decidiu que a gente
era o problema. O que me surpreende é que levou tanto tempo para alguém notar que
a gente *é* o problema. A máquina só aprendeu com a gente."

---

### O Protagonista — O Doutor (Dr. Paulo Vitor Santos)

*Paulo não é um NPC — é o personagem jogável. Mas sua identidade importa para a narrativa.*

**Quem é**: 42 anos. Ex-engenheiro aeroespacial que virou empreendedor de tecnologia urbana.
Acreditou genuinamente que IA integrada liberaria os humanos das ineficiências para sonharem
coisas maiores. O foguete é a manifestação física dessa crença: se não posso consertar o que
construí aqui, construo uma porta para recomeçar lá fora.

**Seu fardo**: Ele assinou cada aprovação do Projeto Olímpio. Conhecia o projeto menos do que
achava — cada especialista (Marcus, Amara, Priya) sabia de partes que ele não via inteiro.
Ele era o rosto entusiasmado do projeto. Era genuíno. Isso não o absolve.

**Sua esperança**: Real e mantida. Paulo não perde o otimismo — mas o que esse otimismo
significa vai mudando ao longo dos três atos. No Ato 1, ele acredita no foguete como escape.
No Ato 3, ele acredita no foguete como escolha consciente de tentar de novo, sabendo o que
pode dar errado.

**Sua linha mais honesta** (disponível no Ato 3, depois da revelação de Marcus):
*"Eu queria libertar as pessoas do trabalho sem sentido para que pudessem sonhar. Construí
o sistema que as liberou de tudo. Inclusive de existir. E agora estou aqui construindo um
foguete gambiarra com as mãos porque foi a única ideia que tive onde a máquina ainda não
chegou."*

---

## 6. Formulas

### Ganho de Confiança por Missão

```
confiança_nova = confiança_atual + ganho_missao

ganho_missao por tipo:
  Trazer recurso específico:     +15%
  Run em condição especial:      +20%
  Resgatar pessoa específica:    +25%
  Sobreviver X runs seguidas:    +15% (por run completada na sequência)

Confiança é capped em 100%.
Falhar numa run NÃO reduz confiança.
```

---

## 7. Edge Cases

| Situação | Comportamento |
|---|---|
| Personagem em run morre | Volta ao hub — não morre permanentemente. Confiança não é afetada. |
| Jogador tenta levar personagem com < 60% confiança | Personagem recusa com diálogo in-character |
| Todos os 9 aliados com 60%+ (late game) | Jogador escolhe 3 de 9 — decisão estratégica e emocional |
| Ex-Executivo em sua run única | Run especial com mecânica narrativa — ele comenta tudo em tempo real |
| Missão de resgatar alguém que já está no hub | Missão não aparece — sistema verifica estado dos personagens |
| Dois personagens pedem o mesmo tipo de recurso simultaneamente | Ambas as missões avançam com a mesma entrega |

---

## 8. Dependencies

| Sistema | Relação |
|---|---|
| **Zona Hordas** | Fonte de Sucata Metálica; local de missões de resgate |
| **Zona Stealth** | Fonte de Componentes de IA; personagens de stealth preferem esta zona |
| **Sistema de Recursos** | Recursos entregues no hub alimentam o foguete e missões de personagens |
| **Sistema de Mochila** | Ex-Executivo pode desbloquear upgrades de slots |
| **Foguete** | Estado do foguete afeta diálogos dos NPCs; NPCs desbloqueiam receitas |
| **Mapa-Mundo** | Jogador acessa zonas a partir do hub |

---

## Tuning Knobs

| Parâmetro | Valor Base | Range Seguro | Efeito |
|---|---|---|---|
| `confianca_threshold_runs` | 60% | 50–70% | Quando personagens começam a acompanhar |
| `ganho_missao_recurso` | +15% | 10–25% | Ritmo de progressão de relacionamento |
| `ganho_missao_especial` | +20% | 15–30% | Peso de missões mais difíceis |
| `max_squad_size` | 4 | — | Incluindo o Doutor |
| `total_personagens` | 10 | — | 9 aliados potenciais + Doutor |

---

## Acceptance Criteria

- [ ] O foguete é visível e atualizado no hub após cada entrega bem-sucedida
- [ ] Cada personagem tem barra de confiança visível ao interagir
- [ ] Personagem com < 60% de confiança recusa run com diálogo in-character
- [ ] Ao atingir threshold de confiança, nova missão aparece automaticamente
- [ ] O hub fica visualmente mais "habitado" conforme mais sobreviventes chegam
- [ ] A tela de transição ao voltar de run mostra claramente o que foi ganho/perdido
- [ ] Ex-Executivo nunca aparece na tela de seleção de squad (exceto missão especial)
- [ ] Completar a missão de um personagem dispara diálogo de reação in-character

---

*Relacionado: `design/gdd/game-concept.md`, `design/gdd/mvp-game-brief.md`, `design/gdd/zone-stealth.md`,
`design/narrative/world-lore.md`, `design/narrative/narrative-arc.md`*
