---
tags: [fungineer, design]
date: 2026-03-21
tipo: design
---

# Orbs — Visão Geral das Mecânicas

**Data**: 2026-03-21
**Status**: Para avaliação
**Baseado em**: `design/gdd/game-concept.md`, `mvp-game-brief.md`, `zone-stealth.md`, `resource-system.md`, `hub-and-characters.md`

---

## O Conceito Central

Orbs é um jogo mobile roguelike onde **mover o personagem é o único input disponível ao jogador em qualquer situação de jogo**. Não há botão de ataque, não há habilidade ativada manualmente, não há interação direta com o ambiente.

Essa restrição é o coração do design: o que *mover significa* muda completamente entre as zonas do jogo. O jogador já sabe o que pode fazer antes de entrar em qualquer zona nova — a surpresa é descobrir o que o movimento representa ali.

**Contexto narrativo**: Um apocalipse dominado por IAs. Um cientista maluco lidera os últimos humanos na construção de um foguete artesanal para escapar. Cada run é uma incursão nas zonas controladas pelas IAs para roubar os recursos necessários para construir o foguete peça por peça.

---

## Os 3 Pilares do Loop de Jogo

### 1 — Momento-a-Momento (segundos)
Mover o personagem através de ambientes hostis. Cada zona recontextualiza o que mover significa — a tensão vem da leitura do ambiente e da escolha de posicionamento.

### 2 — A Run (1–2 minutos)
Entrar na zona → coletar recursos → decidir quando sair → sobreviver ou falhar → retornar com o que coletou.

### 3 — A Sessão (5–15 minutos)
Múltiplas runs em zonas diferentes. Cada run traz progresso no foguete. A tela da base entre as runs mostra o foguete crescendo — a recompensa visual entre os momentos de tensão.

---

## A Mochila — Tensão Central

Dentro de cada run, o jogador carrega uma **mochila com slots limitados**:

- **Capacidade base**: 3 slots (expansível via progressão de personagens)
- Cada recurso coletado ocupa 1 slot
- **Fail state**: morrer = perde todos os recursos da run (o estoque acumulado no hub não é afetado)
- **Decisão recorrente**: sair agora com o que coletei, ou arriscar mais tempo na zona para encher a mochila?

A coleta de recursos é intencional — o jogador precisa **parar completamente sobre o item por 1,5 segundos** para coletá-lo. Um círculo de progresso aparece durante a coleta; qualquer movimento cancela e reseta do zero.

---

## As Zonas (MVP)

### Zona 1 — Hordas

**Recurso coletado**: Sucata Metálica (estrutura física do foguete)

**Como o movimento funciona aqui**: O jogador controla o líder de um esquadrão de criaturas tecnológicas arrastando o dedo pela tela. O esquadrão inteiro segue o líder; o combate é **completamente automático** — o posicionamento define quem ataca o quê. Não há botão de ataque.

**Estrutura de uma run**:
1. Entra com 1 personagem
2. Ondas de inimigos (Runners, Bruisers, Spitters)
3. Evento de resgate: escolher 1 de 2 personagens para adicionar ao esquadrão
4. Mais ondas
5. Escolha de poder transformativo (muda como o movimento funciona)
6. Boss: Sentinel Core (2 fases)
7. Win/Lose

**Os 4 personagens disponíveis** têm roles distintos:

| Personagem | Role | HP | Passiva |
|---|---|---|---|
| Guardian | Tank | 200 | −20% dano recebido |
| Striker | DPS | 120 | Nenhuma (puro dano) |
| Artificer | AoE | 100 | Explosões: +50% dano em grupos de 3+ |
| Medic | Sustain | 80 | Cura 15 HP do aliado mais ferido a cada 5s |

**Os 6 poderes transformativos** — todos mudam *como* o movimento funciona, não apenas *quanto* dano causa:

| Poder | Trigger | Efeito | Trade-off |
|---|---|---|---|
| Siege Mode | Automático após 1,5s parado | Dano ×3,0 | Mover cancela instantaneamente |
| Split Orbit | Toggle manual | Formação ×2 em área | +30% dano recebido |
| Overclock | Toggle (10s, cooldown 15s) | Vel. de ataque ×2,5 | −5 HP/s enquanto ativo |
| Magnet Pulse | Toggle | Auto-coleta em 200px; atrai Runners | Elites causam +20% dano |
| Reflective Shell | Passivo | 25% do dano recebido refletido | −35% ataque base |
| Ghost Drive | Tap (3s, cooldown 20s) | Intangível — atravessa inimigos | Não pode capturar objetivo; cooldown longo |

---

### Zona 2 — Stealth

**Recurso coletado**: Componentes de IA (sistemas eletrônicos e navegação do foguete)

**Como o movimento funciona aqui**: O personagem entra **sozinho** (sem esquadrão). A velocidade do movimento determina o nível de barulho emitido. Parar completamente pode ser a jogada certa.

**Input de movimento**:
- Dedo próximo ao personagem → movimento lento e silencioso
- Dedo distante → movimento rápido e barulhento
- Dedo parado / solto → personagem para completamente

**Os 4 sistemas de detecção simultâneos**:

**A — Cone de Visão** (drones e sentinelas): Área visível na tela. Entrar no cone inicia uma barra de alerta progressiva — sair antes de encher é seguro.

**B — Raio de Som**: Círculo visível ao redor do personagem, proporcional à velocidade.
```
raio_som = 20px + (velocidade_atual / 200px/s) × 160px

Parado: 20px (quase zero)
Velocidade máxima (200px/s): 180px
```
Qualquer inimigo dentro do raio entra em modo investigação.

**C — Câmeras de Segurança**: Cone rotatório com padrão previsível e visível. Detectam mas não perseguem — ativam alarme.

**D — Luz e Sombra**: Zonas de sombra (becos, marquises, obstáculos) tornam o jogador **invisível para visão e câmeras**. O raio de som não é cancelado — barulho ainda atrai inimigos mesmo na sombra. Ficar parado na sombra = máxima segurança.

**Estados dos inimigos**:

| Estado | Condição | Comportamento |
|---|---|---|
| Patrulha | Normal | Rota fixa, cone ativo |
| Investigação | Ouviu barulho | Vai até a origem, procura 3–4s, retorna |
| Alerta | Viu o jogador | Perseguição |
| Perseguição | Em alerta | Corre em direção ao jogador |
| Buscando | Perdeu o jogador | Varre a última posição por ~5s, retorna |

**Mecânica de distração**: O jogador pode usar o raio de som **intencionalmente** como isca — criar barulho em uma direção para desviar patrulhas e abrir uma rota em outra direção.

**Tensão de coleta na Zona Stealth**: Para coletar um componente, o jogador para completamente (raio de som zero) — mas ficar parado expõe a cones de visão e ciclos de câmera. O timing de coleta precisa ser sincronizado com as patrulhas.

---

## O Hub — Base de Resistência

Entre as runs, o jogador retorna ao hub: um subsolo secreto com os últimos humanos da Terra. O hub tem duas camadas de progressão simultâneas:

- **Técnica**: o foguete cresce conforme recursos são entregues
- **Humana**: os sobreviventes ganham confiança no Doutor conforme missões são cumpridas

**O Foguete** fica no centro do hub. Começa como sucata irreconhecível e vai tomando forma visualmente a cada componente entregue. O foguete completo é a win condition do jogo.

**Receita do foguete (MVP — 8 peças em sequência)**:

| # | Peça | Custo |
|---|---|---|
| 1 | Base Estrutural | 6× Sucata |
| 2 | Casco Externo | 8× Sucata |
| 3 | Suporte Interno | 5× Sucata + 3× Comp. IA |
| 4 | Sistema Elétrico | 6× Comp. IA |
| 5 | Painel de Controle | 4× Sucata + 5× Comp. IA |
| 6 | Motor Principal | 8× Sucata + 4× Comp. IA |
| 7 | Sistema de Navegação | 8× Comp. IA |
| 8 | Blindagem Final | 6× Sucata + 6× Comp. IA |

**Total necessário**: 37× Sucata Metálica + 32× Componentes de IA

---

## Os 10 Personagens — Sistema de Confiança

Cada sobrevivente no hub tem uma **barra de confiança individual (0–100%)** que avança ao completar missões específicas daquele personagem.

**Thresholds**:
- **60%** → personagem aceita acompanhar runs
- **80%** → segunda missão especial / backstory
- **100%** → função em run aprimorada + missão final

A confiança **nunca diminui** — falhar em runs não penaliza o relacionamento.

**Tipos de missão**: trazer recurso específico, completar run em condição especial (ex: Zona Stealth sem ser detectado), resgatar pessoa específica, sobreviver X runs seguidas.

**Os 10 sobreviventes**:

| # | Personagem | Função em Run | Zona Preferida |
|---|---|---|---|
| 1 | Engenheiro Culpado | Suporte técnico — hackeia terminais automaticamente | Stealth |
| 2 | Médica Pragmática | Heal / sustain — cura aliados em intervalos | Hordas |
| 3 | Adolescente Hacker | DPS — desabilita câmeras temporariamente | Stealth |
| 4 | Ex-Militar | Tank — absorve dano, protege o grupo | Hordas |
| 5 | Artista Documentarista | Scout — revela porções do mapa no início da run | Qualquer |
| 6 | Cientista Rival | AoE — dano pesado em área | Hordas |
| 7 | Mecânico Otimista | Engenharia de campo — cria obstáculos temporários | Qualquer |
| 8 | Criança Prodígio | Suporte imprevisível — hackeia, distrai, ou encontra rotas alternativas | Stealth |
| 9 | Ex-Executivo | **Não vai em runs** — gerencia recursos no hub, desbloqueia upgrades de mochila | Hub |
| 10 | Cínico Experiente | Tank alternativo — absorve dano, cria cobertura | Hordas |

O Ex-Executivo é o único que não acompanha runs diretamente — ele gerencia o hub e desbloqueia os upgrades de capacidade da mochila (3 → 5 → 7 slots) conforme a confiança cresce.

---

## Progressão e Pacing Estimado

Com mochila de 3 slots (base), a média é ~2,5 recursos por run, levando aproximadamente **28 runs** (~56 min de gameplay) para completar o arco MVP. Upgrades de mochila reduzem esse tempo sem reduzir a dificuldade — recompensam o investimento nos relacionamentos.

O jogador toma decisões em dois níveis antes e durante cada run:
1. **Estratégico (no hub)**: qual zona raidar com base nos recursos que faltam para a próxima peça do foguete?
2. **Tático (dentro da run)**: quando sair? Com quantos recursos na mochila vale o risco de continuar?

---

## Anti-Pilares (o que o jogo não é)

- **Não é combate manual**: nenhum ataque ativado pelo jogador em nenhuma zona
- **Não é base builder**: o hub é recompensa visual e social, não gestão de construção
- **Não é narrativa pesada**: o apocalipse é cenário e tom, não roteiro com cutscenes longas
- **Não tem runs longas**: se uma zona passar de 2 minutos, corta conteúdo

---

*Para detalhes completos, ver os GDDs em `design/gdd/`.*
