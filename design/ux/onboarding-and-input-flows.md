---
tags: [fungineer, ux, onboarding, input, accessibility]
date: 2026-06-05
tipo: ux-design
---

# Onboarding e Linguagem de Input — UX Design Document

**Version**: 1.0
**Date**: 2026-06-05
**Status**: Draft — Para revisão pela equipe

**Premissas documentadas**:
- Plataforma primária: mobile portrait, touch-only, one-handed default
- Resolução de referência: 480×854px (conforme Extração GDD)
- Zona de primeiro contato: Hordas (única zona completamente jogável no MVP)
- O jogador nunca viu o jogo antes; zero familiaridade com a restrição central
- Sessões curtas como padrão (5–15 min); onboarding não pode exceder uma sessão
- Input alternativo (gamepad, teclado) considerado secundário — não proibido, mas
  não é o caso de design primário

---

## 1. O Problema Central de UX

A restrição "único input = mover" é uma elegância de design, mas cria um risco
específico de UX que precisa de solução sistemática:

**O jogador entra numa zona nova sem saber o que "mover" significa ali.**

Esse risco se multiplica em 11 zonas com semânticas radicalmente diferentes. O
dano não é de mecânica — é de desorientação. Um jogador que morre sem entender
por quê não vai fazer mais uma tentativa; vai abandonar.

O objetivo deste documento é eliminar esse risco sem introduzir tutoriais em
texto, sem pausar o jogo, e sem infantilizar jogadores que já entendem o padrão.

**Estrutura do problema por zona:**

| Zona | Semântica do Movimento | Contra-intuição Central |
|------|----------------------|------------------------|
| Hordas | Posicionar squad; combate é automático | Não há botão de ataque |
| Campo | Chegar rápido = capturar mais rápido | Parar é subótimo |
| Sacrifício | Analisar antes de entrar; mover dentro | Parar no centro é correto; parar nas câmaras é errado |
| Stealth | Velocidade = barulho = detecção | Não mover pode ser a melhor ação |
| Circuito | Percorrer fio = conduzir eletricidade | Direção e cor importam tanto quanto mover |
| Extração | Toque cima/baixo = trocar lane | Input discreto (tap), não drag contínuo |
| Infecção | Mover carga viral de nó a nó | Você não infecta em área — você carrega um item |
| Labirinto | Mover rápido em direção a parede = abre | Aproximar-se de obstáculo não é erro |
| Cordilheira | Explorar com risco ambiental | Sem IA inimiga — silêncio é ameaça |
| Torres | Stealth vertical com escalonamento | Ruído tem consequências morais, não só mecânicas |
| Catedral | Timing com janelas de sino | Sistema inimigo pode ser aliado |

---

## 2. Sistema de Ensino de Movimento — "Lê o Chão"

### 2.1 Princípio Fundador

O ambiente ensina a semântica do movimento antes da primeira ação do jogador.
Nenhum texto de tutorial. Nenhuma pausa. O aprendizado é passivo no primeiro
segundo e ativo nos primeiros cinco.

**Teoria aplicada**: affordances de Gibson — a aparência do elemento comunica seu
uso. O chão, os inimigos e o próprio personagem são o manual de instrução.

### 2.2 A Sequência de Leitura (Universal)

Toda zona deve projetar seu ambiente inicial para que o jogador leia nessa ordem:

```
1. PERSONAGEM (onde estou?)
2. AMBIENTE (o que há ao redor?)
3. FEEDBACK IMEDIATO (o que acontece quando eu me movo?)
4. OBJETIVO (o que estou tentando alcançar?)
```

Essa sequência ocorre em 3–5 segundos de movimento natural. Não é linear — é
paralela, emergindo do design do espaço.

### 2.3 "Cartão de Zona" — Telão de Entrada (2 segundos)

**Descrição**: no momento em que a cena da zona é carregada, antes do jogador
ter controle, a câmera faz um pan de 2 segundos revelando o espaço. Um único
ícone animado aparece no canto inferior esquerdo por 2 segundos e desaparece.

**Conteúdo do ícone**: glifo animado representando a semântica do movimento.

| Zona | Glifo do Cartão |
|------|-----------------|
| Hordas | Seta de arraste + silhuetas de squad se movendo juntas |
| Campo | Seta rápida + anel pulsando (burst) |
| Sacrifício | Seta parada (centro) / seta em movimento (câmara) |
| Stealth | Dedo próximo = pegada pequena / dedo distante = pegada grande + onda sonora |
| Circuito | Seta percorrendo fio colorido com onda de luz |
| Extração | Dedo tocando tela superior = seta para cima |
| Infecção | Seta de nó a nó com ícone de carga |
| Labirinto | Seta em direção a parede com parede se abrindo |
| Cordilheira | Seta livre em mapa sem drones |
| Torres | Seta com nível de som ao lado |
| Catedral | Seta + ícone de sino com janela temporal |

**Princípio**: o glifo comunica a mecânica específica desta zona, não o input
genérico (arrastar). Não aparece em runs subsequentes da mesma zona.

**Implementação**: flag `zone_tutorial_shown` por zona no save state. Se true,
pula os 2 segundos e dá controle imediato.

### 2.4 Feedback de Eco — O Ambiente Responde

**Descrição**: nos primeiros 5 segundos de controle do jogador em qualquer zona
(qualquer run, não só a primeira), o ambiente exibe feedback de eco nos elementos
de maior importância mecânica.

O Eco é um glow suave pulsando nos elementos que o jogador deveria notar. Não
aponta, não usa setas — apenas aumenta a saliência visual dos elementos corretos.

**Duração do eco**: 5 segundos ou até o jogador interagir com o elemento pela
primeira vez, o que vier primeiro.

| Zona | Elementos com Eco |
|------|-------------------|
| Hordas | Squad (silhuetas), inimigos se aproximando |
| Campo | Zonas de captura (anel) |
| Sacrifício | Painéis de câmaras, EXIT no hub |
| Stealth | Cone de visão mais próximo, raio de som do próprio personagem |
| Circuito | Fio correto da sequência atual (piscando suave) |
| Extração | Lane atual do player, primeiro obstáculo visível |
| Infecção | Nó inicial infectado, nós adjacentes neutros |
| Labirinto | Primeiro contador de parede |
| Cordilheira | Estrutura instável mais próxima |
| Torres | Drone mais próximo, janela de acesso |
| Catedral | Contador de sino, primeira relíquia |

### 2.5 Primeiro Contato Bem-Sucedido — Reforço de Aprendizado

Quando o jogador executa a ação semântica correta pela primeira vez em uma zona,
o sistema dispara um momento de reforço explícito.

**O que conta como "primeiro contato correto":**

| Zona | Primeiro Contato |
|------|-----------------|
| Hordas | Squad toca inimigo e dano é aplicado automaticamente |
| Campo | Burst de chegada ativa (anel pulsa 3x) |
| Sacrifício | Jogador lê painel sem entrar na câmara |
| Stealth | Entra em sombra E raio de som diminui visivelmente |
| Circuito | Primeiro segmento de fio conduzido (acende) |
| Extração | Primeiro desvio de obstáculo bem-sucedido |
| Infecção | Primeiro nó neutro infectado |
| Labirinto | Impulso ativado pela primeira vez (pulso ciano) |
| Cordilheira | Coleta de primeira Memória Coletiva |
| Torres | Passa por drone sem alarme |
| Catedral | Realiza ação durante janela de sino |

**Reforço**: screen shake leve (12px, 0.2s) + anel de partículas bioluminescentes
ao redor do personagem + som de "clique" positivo (tom âmbar). Não aparece texto.
Dura 0.4 segundos.

Isso aplica a teoria de SDT (Self-Determination Theory) de Deci e Ryan: o
reforço intrinseco de competência percebida ("entendi") é mais motivador que
pontuação externa.

### 2.6 Re-ensino em Zonas com Semântica Bifurcada

Três zonas têm semântica que muda dentro da própria run:

**Sacrifício**: parar é correto no hub, errado nas câmaras.
Solução: o chão muda de cor ao cruzar o threshold da câmara. Hub = textura
orgânica escura (segura). Câmara = textura metálica com grade (urgente). O
próprio espaço comunica "modo de movimento diferente".

**Catedral**: movimento audacioso é errado fora da janela de sino, correto
durante ela.
Solução: a tela tem um vinheta suave que pulsa na cor do sino (dourado) quando
a janela está ativa. Fora da janela, vinheta azul-fria. A própria borda da tela
comunica o estado.

**Circuito**: percorrer o fio correto é diferente de percorrer o fio errado.
Solução: fio correto tem glow dourado leve. Fio errado tem glow vermelho
suprimido (visível mas não gritante — não revela a solução, apenas confirma erro).

---

## 3. Fluxo de Onboarding do Primeiro Jogo

### 3.1 Visão Geral da Estrutura

O primeiro jogo (sessão zero) do jogador segue uma trilha com momentos de
aprendizado intercalados com recompensa. A trilha não usa menus de tutorial —
ela usa o próprio hub como espaço de descoberta.

```
BOOT
 └─ Tela de carregamento (2s, logo + esporos flutuando)
     └─ CENA DO BUNKER — entrada cinematográfica (4s, sem controle)
         └─ CONTROLE DO PLAYER NO HUB (andares 1–4)
             ├─ Descoberta do foguete
             ├─ Encontro com o Doutor
             ├─ Descoberta do mapa-mundo (Ex-Militar)
             └─ PRIMEIRA ZONA: HORDAS
                 ├─ Cartão de Zona (2s)
                 ├─ Run 1 (60–120s)
                 └─ RETORNO AO HUB
                     ├─ Resultado da run (ganhou ou perdeu)
                     └─ PRIMEIRO DEPÓSITO NO FOGUETE (se sobreviveu)
                         └─ Animação do foguete recebendo peça
```

### 3.2 Passo a Passo Detalhado

---

#### PASSO 0 — Boot e entrada (0–6s)

**Tela de carregamento**: tela preta com o nome do jogo e esporos flutuando.
Duração: enquanto carrega (mínimo 2s por design, mesmo em dispositivos rápidos —
o momento de silêncio é intencional).

**Entrada no bunker**: câmera começa na superfície da cidade das IAs (escuridão,
ciano elétrico, linhas frias). Desce através do chão para o bunker (âmbar quente,
esporos, cheiro de vida — comunicado por partículas). Sem texto. Duração: 4s.

**Premissa deste design**: a entrada estabelece o contraste visual hub/zonas que
vai estruturar todo o loop de jogo. Quente = seguro. Frio = hostil. O jogador
absorve isso antes de qualquer mecânica.

---

#### PASSO 1 — Exploração do Hub (30–90s)

**Estado inicial**: o player (Dr. Myco) aparece no Andar 2, na Câmara Central do
Foguete. O foguete em seu estado inicial (sucata) está no centro. É a âncora
visual imediata.

**O que o jogador faz**: scroll vertical livremente entre os 4 andares. Toque em
personagens abre painel de relação.

**Fluxo de descobertas planejadas**:

1. O foguete é visível em qualquer andar (câmara central transparece). O jogador
   não pode deixar de vê-lo. Ao tocar no foguete: painel do foguete abre
   mostrando o progresso e a próxima peça necessária.

2. No Andar 1 (Posto de Vigia), o Ex-Militar tem um ícone de exclamação flutuando.
   Tocar nele revela o mapa-mundo. O mapa mostra: Zona Hordas (acessível) e
   Zona Stealth (acessível). As outras zonas aparecem como silhuetas bloqueadas.

3. A entrada da Zona Hordas (Túnel Oeste) é visível no Andar 4. Tem luz laranja
   de emergência e sons distantes de metal. É affordance visual: "saída".

**Restrição de design**: o jogador NÃO recebe texto de tutorial dizendo "vá ao
Posto de Vigia" ou "clique no Ex-Militar". A sinalência visual (ícone de
exclamação, luz diferenciada dos túneis, foguete central) deve ser suficiente.

---

#### PASSO 2 — Acesso ao Mapa-Mundo

**Ação**: tocar no Ex-Militar abre o mapa-mundo.

**Mapa-mundo na primeira abertura**: mostra duas zonas acessíveis com informação
mínima:
```
[HORDAS]                    [STEALTH]
Sucata Metálica             Comp. de IA
Dificuldade: 2/5            Dificuldade: 3/5
Última visita: —            Última visita: —
```

Nenhuma outra informação. A zona Hordas tem dificuldade menor — a ordem
implicada (Hordas primeiro) emerge dos dados, não de instrução.

**Tocar em Hordas**: abre tela de preparação de run.

---

#### PASSO 3 — Tela de Preparação de Run

**Conteúdo**:
- Squad atual (só o Doutor está disponível no início — ícones dos outros NPCs
  aparecem em cinza com cadeado)
- Mochila: 3 slots visíveis, todos vazios
- Botão "ENTRAR"

**Informação adicional disponível mas não imposta**: tocar no ícone da zona
expande um painel com a semântica de movimento daquela zona (o glifo animado do
Cartão de Zona, mas acessível aqui). É opt-in — o jogador que quer saber pode
checar, o que prefere descobrir por si não precisa.

**Duração esperada nesta tela**: 5–15 segundos.

---

#### PASSO 4 — Cartão de Zona (Hordas)

**Ao entrar na Zona Hordas**:

1. O glifo animado aparece por 2 segundos: seta de arraste + silhuetas de squad
   se movendo juntas. Comunica: "arraste e o squad segue".

2. Fade-in para o ambiente da zona. O Doutor está no centro. Nenhum inimigo
   imediato — 3 segundos de graça antes da primeira wave.

3. O Eco ativa: o squad pisca suave (o próprio personagem é o elemento que o
   jogador deve notar).

---

#### PASSO 5 — Primeira Run (Hordas)

**Wave inicial**: apenas Runners (inimigos de baixa HP, sem ataque especial).
Ao mover o Doutor, o combate automático começa. A satisfação do auto-combate
é imediata — o jogador aprende "mover = posicionar squad = atacar" sem instrução.

**Momento de Primeiro Contato Correto**: quando o primeiro inimigo recebe dano
automaticamente, o reforço dispara (screen shake + partículas + som).

**Progressão da run**:
1. Ondas leves (0–30s)
2. Evento de resgate (escolher 1 de 2 NPCs para o squad)
3. Ondas médias (30–70s)
4. Choice de poder transformativo
5. Boss (Sentinel Core)
6. Win ou Lose

**Fail state na primeira run**: se o jogador morrer, a tela de resultado mostra
"voltou vazio" e o hub reaparece sem recursos adicionais. Não há penalidade extra
para a primeira run. O foguete permanece no mesmo estado. O jogador toca
novamente no Ex-Militar para tentar outra vez.

---

#### PASSO 6 — Retorno ao Hub

**Se sobreviveu**: animação de retorno pelo túnel. Mochila com recursos visível
no canto da tela durante o percurso.

**Depósito no foguete**: ao chegar no hub, uma notificação visual (anel de
partículas ao redor do foguete) indica que ele está pronto para receber recursos.
Tocar no foguete: painel abre automaticamente com a animação de depósito. Se
atingiu o custo mínimo de uma peça, a peça aparece no foguete com animação de
construção (andaime se movendo, luz âmbar se expandindo).

**Este momento é a âncora emocional do jogo inteiro.** Deve ser celebrado:
- Tela fica mais brilhante por 1.5s
- Som de completude (tom musical resolvido)
- O foguete ganha uma nova forma visível
- Texto mínimo: nome da peça construída, por 2 segundos, sumindo

**Duração do fluxo completo (passo 0 ao 6)**: 4–8 minutos para a maioria dos
jogadores, dependendo do ritmo de exploração do hub.

---

### 3.3 O Que Não Fazer no Onboarding

Estas são restrições duras baseadas nos pilares do jogo:

- Nenhuma caixa de diálogo bloqueante com texto instrucional
- Nenhuma seta de UI apontando para elemento ("vá aqui")
- Nenhum "tutorial obrigatório" que pause o jogo
- Nenhum modo de dificuldade apresentado antes da primeira run
  (pode aparecer após a segunda morte, como opt-in)
- Nenhum onboarding específico de input (arrastar, tocar) — o personagem
  responde ao toque natural; a aprendizagem é por tentativa imediata

---

## 4. Padrões de Feedback de Input

### 4.1 Gramática de Toque — Universal

Estas definições se aplicam a todas as zonas sem exceção.

**Drag contínuo** (maioria das zonas):
- O personagem segue o ponto de toque
- Nenhum delay perceptível (responsividade máxima)
- Zona morta: 8px ao redor do ponto inicial de toque (evita tremor acidental)
- Se o dedo sai da tela: personagem para completamente (não continua em inércia)

**Tap discreto** (Extração — metade superior/inferior):
- Área de toque: metade da tela, não um botão delimitado
- Feedback visual: flash sutil de 0.1s na metade tocada (confirma input recebido)
- Sem debounce — tap durante transição inicia nova transição imediatamente
  (conforme GDD da Extração)

**Pinça** (hub — zoom out):
- Comportamento padrão de pinça do sistema
- Nenhuma customização que conflite com gestos do SO

**Scroll vertical** (hub — navegação de andares):
- Deslize vertical navega entre andares
- Inércia suave (decay de 300ms)
- Snap para o andar mais próximo ao soltar

**Long tap** (coleta de recursos — 1.5s):
- O jogador não precisa segurar; precisa parar de arrastar
- O círculo de progresso começa ao detectar velocidade < 5px/s por > 100ms
- Cancelamento: qualquer movimento com velocidade > 5px/s reseta o círculo
- Feedback visual do círculo: cor correspondente ao recurso, não à UI genérica

### 4.2 Estados de Toque — Telegrafe Sempre

Todo elemento interativo deve comunicar três estados visualmente distintos:

| Estado | Definição | Expressão Visual |
|--------|-----------|-----------------|
| **Idle** | Disponível mas não tocado | Opacidade 100%, sem animação de destaque |
| **Pressed** | Tocado, processando input | Scale 0.95 (squish leve), 50ms ease-out |
| **Confirmed** | Input aceito e executado | Ripple de confirmação na cor do tema da zona |
| **Locked** | Não disponível | Opacidade 40%, sem resposta ao toque |
| **Danger** | Disponível mas com consequência | Borda vermelha pulsando |

O estado Pressed deve ser perceptível mesmo com latência de tela. Alvo: resposta
visual em < 16ms do toque (1 frame).

### 4.3 Affordances de Movimento por Zona

**Zona Hordas**:
- Squad tem sombra projetada indicando que "existem fisicamente" (não são HUD)
- Inimigos têm animação de agressão antes de atacar (1s de antecipação)
- Área de auto-combate (raio ao redor do squad) deve ser visível como aura
  translúcida durante os primeiros 5 segundos de cada run (Eco)

**Zona Campo**:
- Anéis de captura pulsam a velocidade proporcional à taxa atual de captura
- Burst ativo: pulso rápido e brilhante. Normal: pulso médio. Decadente: pulso
  lento e opaco
- Ao chegar em velocidade ≥160px/s, a tela tem um flash de "energia" (0.1s,
  branco 10% opacidade) — confirma que o burst foi ativado

**Zona Sacrifício**:
- Painéis de câmaras têm bordas coloridas por tipo de custo:
  Verde = sem custo / Amarelo = custo simples / Vermelho = custo duplo ou cadeia
- O painel é legível a 3 metros de distância (tamanho mínimo de ícones: 44px)
- Threshold de câmara: linha no chão muda de cor ao ser cruzada (âmbar → vermelho)

**Zona Stealth**:
- Raio de som: círculo sempre visível ao redor do personagem, não apenas quando
  há inimigo próximo. Isso é crítico — o jogador deve sempre ver o efeito do
  próprio movimento
- Cones de visão: visíveis mesmo quando o jogador está longe. Não aparecem só
  quando representam ameaça imediata
- Sombra: personagem muda de opacidade ao entrar em zona de sombra (65% opaco =
  "invisível"; 100% opaco = "visível"). Isso é diegético E funcional
- Sincronização Cinética: contorno da cor do drone aparece ao redor do personagem
  — "você virou parte dele"

**Zona Circuito**:
- Onda de luz percorrendo o fio na direção do movimento durante a condução
- Segmento conduzido: muda de cor da base para dourado/brilhante
- Segmento com erro: flash vermelho de 0.3s, depois volta ao estado apagado
- Diagrama de sequência na UI: sempre visível, sempre na tela (não colapsa)
  Tamanho mínimo dos ícones do diagrama: 32px, fundo semi-transparente escuro

**Zona Extração**:
- Cada lane tem uma coloração sutil que diferencia (gradiente de saturação — não
  bordas explícitas, que seriam confusas com obstáculos)
- Debuff ativo: ícone do debuff aparece no canto superior esquerdo com timer
  decrescente. Um único ícone, não empilhado
- EMP ativo: tela tem rotação sutil de 3° para comunicar "invertido" — além da
  inversão do input, o ambiente indica o estado

**Zona Infecção**:
- Carga viral: anel brilhante ao redor do personagem. Sem carga: anel vazio.
  Não pode ser ambíguo — é o estado mais importante do jogador nessa zona
- Arestas do grafo: visíveis como linhas finas. Não iluminadas para não confundir
  com fios da Zona Circuito
- Nós por tipo: cor + forma geométrica (padrão = círculo; amplificador = diamante;
  âncora = hexágono) — nunca só cor

**Zona Labirinto**:
- Contador de parede: arco decrescente diretamente na parede, não em HUD separado
- Fechando (3s de aviso): contador muda para vermelho pulsante + som de alerta
- Impulso ativo: pulso ciano na parede. O pulso deve ser grande o suficiente para
  ser lido perifericamente enquanto o jogador olha para a rota, não para a parede
- Estado Estagnação: parede tem uma pulsação suave de aviso antes da penalidade

**Zona Cordilheira** (draft — mecânica a definir):
- Sem feedback de detecção de IA (a identidade é ausência de sistema inimigo)
- Estruturas instáveis: rachadura visual progressiva ao se aproximar
- Selvagens: animação de agressão com 1.5s de antecipação (diferente dos drones
  mecânicos das outras zonas — são humanos, movem de forma orgânica)

**Zona Torres** (draft — mecânica a definir):
- Nível de ruído: indicador vertical no lado esquerdo da tela (como barômetro)
  — vai de verde (silêncio) a vermelho (alerta). Permanece visível durante toda
  a run
- Apartamento do Coral: janela acesa com sombra se movendo. Visível em pelo menos
  um frame de câmera durante a run. A janela escurece conforme o nível de ruído
  aumenta — conexão visual entre ação do jogador e consequência no NPC

**Zona Catedral** (draft — mecânica a definir):
- Janela de sino: timer em arco visível no canto superior da tela. Quando ativa,
  a vinheta da tela pulsa dourado. Quando inativa, vinheta azul-fria
- Durante janela: o personagem ganha um glow dourado sutil — "você pode agir"
- A Padre (quando presente): aparece em ângulo da câmera sem apontar para ela.
  O jogador nota organicamente

### 4.4 Feedback de Coleta de Recurso (Universal)

O sistema de coleta (parar 1.5s sobre item) tem feedback em quatro camadas:

1. **Círculo de progresso**: aparece imediatamente ao detectar velocidade < 5px/s.
   Cor do anel = cor do recurso. Não é um ícone de UI genérico

2. **Personagem**: animação leve de "agachamento" (squash de 5%) durante a coleta
   — diegético, indica que ele está pegando algo

3. **Cancelamento**: ao mover, o círculo não "desfaz" — ele "quebra" com um flash
   de 0.1s. Diferencia de "ainda está coletando" vs "foi cancelado"

4. **Completado**: recurso vai para o slot de mochila com animação de "voo" do
   chão para o HUD. Som de pickup. Slot de mochila pisca uma vez

**HUD de mochila**: sempre visível no canto superior direito. 3 slots
(ou 5 ou 7, conforme upgrade). Tamanho mínimo de cada slot: 36×36px.
Ícone dentro do slot: 24×24px. Fundo do slot: 20% de opacidade quando vazio,
80% quando cheio. Slot cheio não deve ser visualmente similar a slot vazio.

---

## 5. Auditoria de Acessibilidade — Touch-Only

### 5.1 Metodologia

Auditoria realizada contra a lista de checagem padrão do documento adaptada para
touch-only, one-handed, com foco em:
- Daltonismo (deuteranopia e protanopia, os casos mais comuns)
- Operabilidade com uma mão (polegar como único ponto de toque)
- Tamanho de área de toque
- Ausência de input alternativo por design (o jogo não tem teclado/gamepad no
  contexto primário)

---

### 5.2 Checagem por Critério

#### [A] Usabilidade One-Handed / Polegar

**Análise da área de toque natural do polegar em portrait 480×854:**

A zona de conforto do polegar direito (mão direitista) cobre aproximadamente
os 60% inferiores e centrais da tela. A zona de esforço (polegar estendido)
alcança até 80% da tela. A zona inacessível sem reposicionar a mão é o canto
superior esquerdo (acima de 80% da altura).

**Achados por elemento:**

| Elemento | Posição Atual | Risco | Recomendação |
|----------|---------------|-------|--------------|
| Botão FOGUETE (hub) | Inferior | Seguro | Manter |
| Slots de mochila (HUD in-run) | Superior direito | Esforço | OK (leitura, não toque) |
| Diagrama de sequência (Circuito) | Superior | Esforço | Só leitura — sem interação |
| Timer de run | Superior | Esforço | Só leitura — sem interação |
| Zonas de captura (Campo) | Distribuído | Variável | Garantir que basta mover — sem toque direto em zona |
| EXIT (quando disponível) | Variável | Risco | EXIT deve estar na metade inferior OR ter área de toque ≥ 80px |

**Risco maior identificado**: Zona Campo — se a zona Central estiver no topo da
tela, o jogador precisa mover o personagem até ela (OK — é movimento) mas não
pode ser obrigado a tocar diretamente no elemento de UI para algo crítico.
Regra: nenhuma ação crítica exige toque em UI no quarto superior da tela.

**Risco Extração**: a metade superior da tela é área de input (sobe lane). Para
mãos pequenas ou uma mão, o polegar pode não alcançar confortavelmente o topo.
Recomendação: adicionar configuração de layout espelhado (inverte áreas de toque
— metade inferior = sobe, metade superior = desce) para canhotos e mãos pequenas.

#### [B] Daltonismo

**Análise das cores funcionais (que comunicam informação crítica):**

| Informação | Cor Atual | Visível Deuteranopia | Visível Protanopia | Solução |
|-----------|-----------|---------------------|-------------------|---------|
| Raio de som (Stealth) | Círculo branco/azul | Sim | Sim | Seguro |
| Cone de visão inimigo | Amarelo/laranja | Parcialmente | Parcialmente | Adicionar tracejado na borda |
| Fios por cor (Circuito) | Vermelho, Amarelo, Azul | Vermelho/amarelo problemáticos | Similar | PROBLEMA CRÍTICO |
| Nó Amplificador (Infecção) | Dourado | Pode confundir com cinza | Seguro | Adicionar forma (diamante) |
| Nó Âncora (Infecção) | Azul | Pode confundir com cinza | Problemático | Adicionar forma (hexágono) |
| Estado Capturado (Campo) | Azul sólido | Problemático | Muito problemático | Adicionar ícone no anel |
| Estado Contestado (Campo) | Roxo | Problemático | Problemático | Adicionar padrão de listra |
| Burst ativo (Campo) | Pulsação brilhante | Parcialmente | Parcialmente | Adicionar símbolo no anel |
| Sombra Stealth | Redução de opacidade | Seguro | Seguro | Seguro |
| Impulso ativo (Labirinto) | Ciano | Seguro | Problemático | Adicionar bordas brancas |

**PROBLEMA CRÍTICO — Zona Circuito:**
A mecânica central (percorrer fios por cor) é inacessível para jogadores com
deuteranopia ou protanopia se a distinção depender exclusivamente de cor.
Vermelho e verde são indistinguíveis. Amarelo pode confundir com verde.

**Solução obrigatória**: cada cor de fio deve ter também um padrão de textura
distinto no fio:
- Vermelho: fio com traçado sólido
- Amarelo: fio com traçado pontilhado
- Azul: fio com traçado tracejado

O diagrama de sequência na UI usa os mesmos padrões. A cor é reforço, não o único
canal de informação.

**Implementação**: isso é uma obrigação de acessibilidade, não um toggle opcional.
A textura deve estar sempre presente, independente do modo de acessibilidade.

#### [C] Tamanhos de Área de Toque

**Padrão mínimo estabelecido**: 44×44px para qualquer elemento interativo
(conforme WCAG 2.5.5, nível AAA, adaptado para touch).

**Auditoria:**

| Elemento | Tamanho Estimado | Status |
|----------|-----------------|--------|
| Botão FOGUETE (hub) | ~120×44px | Aprovado |
| NPC no hub (toque para painel) | ~40×48px (sprite) | Borderline — ampliar hitbox para 60×60px |
| Slot de mochila (leitura) | 36×36px | Aprovado (só leitura) |
| Ícone de debuff (toque para info) | Sem toque previsto | OK |
| EXIT (run) | Variável por zona | Risco — garantir mínimo 80×80px com label visível |
| Zona de captura (Campo) | Raio 80–180px | Aprovado — é área de movimento, não toque direto |
| Threshold de câmara (Sacrifício) | Atravessável caminhando | OK — não é toque |
| Zonas com drag | Tela inteira | Aprovado |
| Toque cima/baixo (Extração) | Metade da tela (~480×427px) | Aprovado |

**Achado**: os NPCs no hub têm hitbox igual ao sprite (~40px). Para personagens
pixel-art pequenos, o toque pode errar. Recomendação: hitbox invisível de 60×60px
centrado no sprite, com borda de 10px de tolerância ao redor.

#### [D] Ausência de Input Alternativo

O jogo não tem teclado ou gamepad no contexto primário. Isso é por design
(restrição central). Mas cria barreiras reais.

**Barreiras identificadas:**

1. **Jogadores com mobilidade reduzida nas mãos**: o drag contínuo (a maioria das
   zonas) requer controle fino por tempo estendido. Não há alternativa de tap.

   Mitigação disponível dentro do design: a Zona Extração já usa tap discreto.
   Considerar, para versão futura, um modo de "tap-to-move" para zonas com
   movimento por grid (Circuito, Labirinto) — o personagem vai ao ponto tocado em
   vez de seguir o dedo. Não muda a mecânica, mas reduz o esforço motor contínuo.

2. **Jogadores com visão reduzida**: o jogo é fortemente visual. Não há narração
   de estado. Audio feedback existe mas não é descritivo.

   Mitigação mínima: garantir que todos os sons de feedback (hit, pickup, alerta,
   morte) sejam distintos e acionáveis — o jogador cego pode aprender a jogar
   Extração e Campo por áudio. Zonas como Stealth (dependente de leitura espacial
   visual) são inacessíveis sem adaptação maior.

3. **Jogadores daltônicos**: coberto na seção B. A solução de textura de fio
   (Circuito) e forma de nó (Infecção) é implementável sem custo de design.

**Recomendação de curto prazo** (implementar antes do M9 Ship):
- Toggle de "Modo Daltonismo" nas configurações que aplica padrões de textura
  nos fios (Circuito) e ícones nos estados de zona (Campo)
- O padrão de textura no Circuito deve ser on-by-default, não opt-in

**Recomendação de médio prazo** (pós-ship):
- Tap-to-move opcional para zonas grid-based
- Sons descritivos de estado para as 3 zonas mais jogadas (Hordas, Campo, Stealth)

#### [E] Conteúdo Piscante

Alertas conhecidos:

| Elemento | Frequência de Pisca | Risco |
|----------|---------------------|-------|
| Aviso de fechamento de parede (Labirinto) | ~1–2 Hz (estimado) | Potencialmente problemático |
| Anel da zona em burst (Campo) | ~3 Hz (estimado) | Limite seguro |
| EMP (Extração) — inversão de tela | Efeito único, sem pisca | Seguro |
| Sentinela Guardião (Stealth) — pulsante | ~0.5 Hz | Seguro |

**Achado**: a parede "vermelha pulsante" durante o aviso de 3s no Labirinto pode
estar na faixa de risco para fotossensibilidade (3–50 Hz é a faixa mais
problemática). Recomendação: a pulsação de aviso deve ser uma variação de
brilho/opacidade, não uma alternância de cor completa. Velocidade alvo: < 2 Hz.

**Requisito**: verificar a frequência real em implementação antes do ship. Se
qualquer elemento pulsar > 3 Hz na tela completa, adicionar aviso de
fotossensibilidade na primeira abertura do jogo.

#### [F] Legibilidade de Texto

**Tamanho mínimo de fonte**: 14px em dispositivos com densidade de referência
(96 DPI equivalente). Em dispositivos de alta densidade (3x+), mínimo 14px CSS
(= 42 pixels físicos).

**Elementos de texto em tela:**

| Elemento | Texto | Tamanho Atual | Status |
|----------|-------|---------------|--------|
| Próxima peça (hub) | "Painel de Controle" | ~12px aparente | Risco — verificar |
| Label de zona no mapa | 8–10 chars | ~10px aparente | Risco |
| Timer in-run | Dígitos | ~18px | Aprovado |
| Feedback de debuff (Extração) | Ícone (sem texto) | N/A | Aprovado |
| Custo da câmara (Sacrifício) | Ícone + número | ~14px | Borderline |
| Label de recurso no mapa | "Sucata Metálica" | ~10px | Risco — substituir por ícone + abreviação |

**Observação nas screenshots do hub**: o texto "próxima peça / Painel de
Controle" no topo esquerdo parece ter ~10–12px no mockup. Em tela real mobile
(especialmente 480px de largura), isso pode ser ilegível a distância normal de
leitura (~30cm). Recomendação: mínimo 14px, preferencialmente 16px para
informações de progressão crítica.

#### [G] Subtítulos e Narração

O jogo não tem diálogo voiced (conforme anti-pilar "sem cutscenes longas"). Mas
há interações de NPC via painel de texto.

**Achado**: painéis de NPC têm texto. Se forem adicionados sons de "murmúrio"
(comum em jogos pixel-art para dar personalidade), esses precisam de subtítulo.

**Requisito**: se qualquer elemento de áudio comunicar informação (não apenas
atmosfera), ele deve ter representação visual equivalente. Exemplo: se CORE faz
um anúncio sonoro durante uma run, o texto do anúncio deve aparecer na tela.

---

### 5.3 Checklist de Acessibilidade — Estado Atual vs Alvo

| Critério | Estado Atual | Alvo |
|----------|--------------|------|
| Usável com uma mão | Parcial — EXIT e alguns botões no quadrante superior | Garantir que nenhuma ação crítica exige quadrante superior direito |
| Sem dependência exclusiva de cor | Reprovado (Circuito, Campo) | Textura + forma em todos os elementos com significado de estado |
| Área de toque mínima 44px | Parcial — NPCs no hub borderline | Expandir hitbox invisível dos NPCs para 60×60px |
| Texto legível em tamanho mínimo | Risco — alguns labels pequenos | Auditar todos os textos; mínimo 14px |
| Sem pisca problemática | Risco — parede Labirinto | Verificar frequência; < 2 Hz para avisos |
| Subtítulo para informação por áudio | Não definido | Definir antes de qualquer som informativo ser adicionado |
| Modo daltonismo | Não existe | Implementar como default-on para texturas de fio |
| Layout espelhado (canhotos) | Não existe | Implementar para Extração (único jogo com tap de metade) |

---

## 6. Consistência Cross-Zona — O Que Nunca Muda

Estes padrões devem ser idênticos em todas as 11 zonas, sem exceção. São o
"contrato de UX" do jogo:

1. **Arrastar o dedo = mover o personagem** (ou o squad). Isso nunca muda.
   O que muda é o que mover significa.

2. **Parar sobre item por 1.5s = coletar** (zonas com coleta item-type).
   Círculo de progresso sempre igual em aparência.

3. **HUD de mochila sempre no canto superior direito**. Não muda de posição
   entre zonas.

4. **EXIT sempre marcado com a mesma sinalética** (seta verde + texto "EXIT").
   Não há ambiguidade sobre onde sair.

5. **Timer sempre no canto superior esquerdo** (quando existe). Não muda.

6. **Fail state = fade para escuro + vibração do dispositivo (100ms) + som**.
   Sempre igual. A morte não é um enigma.

7. **Personagem sempre no mesmo sprite** (Dr. Myco). Em zonas solo, é ele.
   Em zonas squad, ele lidera — visualmente distinguível dos aliados.

8. **Recursos sempre têm ícone por tipo**, nunca apenas texto. O ícone é o
   primeiro canal de comunicação; o texto é reforço.

---

## 7. Fluxo Completo — Diagrama de Estados

```
BOOT
 └── Carregamento (esporos + logo)
      └── Entrada cinemática (quente/frio, 4s)
           └── HUB LIVRE
                ├── Foguete (tocar = painel de progresso)
                ├── Ex-Militar (tocar = mapa-mundo)
                │    └── MAPA-MUNDO
                │         └── Zona selecionada
                │              └── TELA DE PREP DE RUN
                │                   ├── Squad (NPCs disponíveis)
                │                   ├── Mochila (slots vazios)
                │                   └── Botão ENTRAR
                │                        └── CARTÃO DE ZONA (2s, skip em runs>1)
                │                             └── ZONA EM JOGO
                │                                  ├── [Run normal]
                │                                  │    └── EXIT alcançado
                │                                  │         └── Retorno ao hub
                │                                  │              └── Depósito de recursos
                │                                  │                   └── [Peça construída?]
                │                                  │                        ├── Sim → animação foguete
                │                                  │                        └── Não → hub normal
                │                                  └── [Fail state]
                │                                       └── Tela de resultado ("voltou vazio")
                │                                            └── Retorno ao hub (sem recursos)
                ├── NPCs (tocar = painel de relação)
                │    └── Missões disponíveis
                │         └── [Completar missão → barra de confiança avança]
                └── Túneis (visual de entrada de zona, sem interação direta)
```

---

## 8. Premissas Documentadas

As seguintes decisões foram tomadas sem confirmação explícita do time:

1. **Zona Hordas como primeira zona de onboarding**: baseado em ser a única zona
   completamente implementada no MVP e ter a mecânica mais transparente (combate
   automático é imediatamente visível).

2. **Cartão de Zona (2s)**: assume que a implementação pode ler e gravar um flag
   por zona no save state. Se o save state não suportar flags por zona, o Cartão
   aparece em toda run.

3. **Eco de 5 segundos**: assume que há uma variável de "tempo desde entrada na
   zona" disponível para os renderers dos elementos. Se não houver, pode ser
   implementado como timer simples na cena.

4. **Textura de fio no Circuito como default-on**: assume que o art-director
   aprova a adição de padrões de textura nos fios sem prejudicar a estética.
   Coordenar com art-director antes de implementar.

5. **Área de toque 60×60px para NPCs**: assume que é implementável sem alterar
   a física de colisão dos sprites. Coordenar com ui-programmer.

6. **Aviso de fotossensibilidade**: assume que a integração do aviso é possível
   na BootScene antes do primeiro carregamento do jogo.

7. **Layout espelhado para Extração**: assume que a divisão da tela em metade
   superior/inferior pode ser configurável nas opções de acessibilidade.

---

## 9. Próximos Passos Recomendados

Por prioridade de impacto:

1. **Imediato**: implementar textura de fio no Circuito (acessibilidade crítica —
   zona é inacessível para daltônicos sem isso)

2. **Antes de M4** (implementação das zonas stub): definir o glifo do Cartão de
   Zona para cada zona nova antes de implementar — o glifo informa o design do
   espaço inicial

3. **Antes de M8** (meta-loop): auditar todos os textos da UI com tamanho mínimo
   14px e expandir hitbox dos NPCs

4. **Antes de M9** (ship): verificar frequência de pulsação do aviso de parede no
   Labirinto; adicionar aviso de fotossensibilidade no boot

5. **Pós-ship v1**: implementar tap-to-move opcional para Circuito e Labirinto;
   implementar sons descritivos de estado para as 3 zonas mais jogadas

---

*Relacionado: `design/gdd/game-concept.md`, `design/MASTERPLAN.md`,
`design/gdd/hub-world-map.md`, todos os `design/gdd/zone-*.md`*

*Coordena com: art-director (glifos, texturas de fio, eco visual), ui-programmer
(hitboxes, flags de save state, timers de cena), game-designer (validar que
padrões de feedback não interferem com mecânicas específicas de zona)*
