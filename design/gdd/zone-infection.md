# Zona de Infecção — Game Design Document

**Version**: 1.0
**Date**: 2026-03-22
**Status**: Draft

---

## 1. Overview

A Zona de Infecção é uma zona de propagação em grafo. O mapa consiste em 20–30 nós (terminais, máquinas, plantas biônicas) conectados por linhas visíveis — uma estrutura de grafo visível ao jogador. O jogador toca nós para infectá-los; nós infectados propagam automaticamente a infecção para nós adjacentes ao longo do tempo. Nós infectados geram **Biomassa Adaptativa** passivamente. O objetivo é infectar 80% dos nós antes do timer encerrar. Inimigos do tipo "Unidade de Cura" revertem nós infectados de volta ao estado neutro. A mecânica central é que **mover é expandir** — o jogador não combate, não coleta itens: ele espalha algo que se auto-propaga.

A **Biomassa Adaptativa** é usada no foguete como o sistema de suporte de vida — os filtros biológicos, o oxigênio sintético, e os materiais de isolamento orgânico que tornam o foguete habitável. Sem ela, o foguete pode voar, mas ninguém sobrevive à viagem.

---

## 2. Player Fantasy

Você não é um soldado, um ladrão ou um engenheiro — você é uma ideia espalhando-se. Cada nó que você toca começa a brilhar com sua cor. Você se afasta e, segundos depois, vê a infecção pular para o nó vizinho sozinha. E daí para o próximo. E para o próximo. O mapa está gradualmente se tornando seu. Uma Unidade de Cura chega e reverte um nó — uma pequena derrota. Mas você já infectou mais 3 enquanto ela estava ocupada. No final, olhar para o mapa e ver 80% dele na sua cor é a satisfação de alguém que venceu não pela força, mas pela geometria.

**Estética MDA primária**: Discovery (entender a topologia do grafo, encontrar os nós de maior conectividade).
**Estética secundária**: Fantasy (ser o vírus, a ideia espalhando-se, o inevitável).

---

## 3. Detailed Rules

### 3.1 Estrutura da Run

- O jogador entra **sozinho** (o squad fica na base — assim como Zona Stealth)
- O mapa é uma tela única com **20–30 nós** distribuídos em posições semi-procedurais
- Os nós são conectados por linhas (arestas); a estrutura é sempre um grafo conectado (não há nó isolado de todo o grafo, mas pode haver nós com apenas 1 conexão)
- A run tem **timer de 120 segundos**
- **Condição de vitória antecipada**: infectar 80% dos nós antes do timer → run encerra com bônus de Biomassa
- **Condição de vitória normal**: timer encerra, Biomassa acumulada é transferida ao hub
- **Fail state**: jogador morre → perde toda a Biomassa acumulada na run
- O jogador tem HP nesta zona (3 hits, como no Circuito Quebrado)

### 3.2 Interpretação do Movimento (como arrastar funciona aqui)

- **Input**: arrastar o dedo = mover o personagem pelo mapa
- **Significado aqui**: mover é alcançar fisicamente nós para iniciar a infecção. Depois de iniciada, a propagação acontece sem o jogador — mas o jogador pode acelerá-la chegando a nós adjacentes antes da propagação automática
- **Toque em nó**: o personagem deve **parar sobre um nó por 1.0 segundo** para iniciar a infecção (barra de infecção do nó específico)
- O jogador pode tomar decisões de alto nível: quais nós tocar para maximizar a propagação automática

**O papel do movimento aqui é diferente:**
Em outras zonas, mover é o único jeito de agir. Aqui, mover é o primeiro ato de uma cadeia que continua sem o jogador. A satisfação vem de ver essa cadeia se propagar — o jogador é o catalisador, não o executor.

### 3.3 Mecânica Central — Grafo de Infecção

#### Estados dos Nós

| Estado | Cor | Condição | Efeito |
|--------|-----|----------|--------|
| **Neutro** | Cinza | Padrão | Não gera Biomassa |
| **Infectando** | Verde pulsante | Jogador parou sobre o nó por < 1.0s | Animação de infecção em progresso |
| **Infectado** | Verde sólido | Infecção completa (1.0s de pausa do jogador OU propagação automática chegou) | Gera 0.1 Biomassa/s; inicia timer de propagação |
| **Propagando** | Verde brilhante | Timer interno do nó atingiu 5s após infecção | Propaga automaticamente para nós adjacentes |
| **Curado** | Cinza com rastro | Unidade de Cura chegou e reverteu | Retorna ao estado Neutro; timer de propagação é resetado |

#### Infecção Manual pelo Jogador

- O personagem para sobre o nó → após 1.0s contínuo → nó muda para Infectado
- Qualquer movimento cancela a infecção em progresso (mas se o nó já estava Infectado, permanece assim)
- O jogador pode infectar múltiplos nós manualmente movendo entre eles

#### Propagação Automática

- Todo nó no estado Infectado tem um **timer interno de propagação**: 5 segundos
- Após 5 segundos: o nó propaga a infecção para **todos os nós adjacentes** (conectados por linha) que ainda estão Neutros
- Propagação automática não requer presença do jogador
- A propagação em cadeia funciona: um nó infectado propaga → novos nós infectados iniciam seus próprios timers de 5s → propagam para seus vizinhos, e assim por diante

**Exemplo de cadeia:**
```
Tempo 0s: Jogador infecta nó A (conectado a B, C, D)
Tempo 5s: Nó A propaga para B, C, D automaticamente
Tempo 10s: Nós B, C, D propagam para seus vizinhos automaticamente
```

#### Aceleração pelo Jogador

- O jogador pode tocar nós adjacentes manualmente antes dos 5s de propagação automática
- Isso é mais rápido que esperar (1.0s de pausa vs 5s de espera automática)
- A estratégia ideal é: infectar nós de alta conectividade manualmente → deixar a propagação automática cobrir os periféricos

#### Nós Isolados

- 15–20% dos nós no mapa têm apenas **1 conexão** (folhas do grafo)
- A propagação automática chega a eles automaticamente se o nó pai for infectado
- Mas alguns nós são **fisicamente isolados no mapa** (sem conexão a nenhum outro): esses nós devem ser **tocados manualmente** — são os únicos que nunca recebem propagação automática
- Nós isolados são indicados visualmente por não ter linhas de conexão visíveis

### 3.4 Coleta de Recursos — Biomassa Adaptativa

- **Geração**: passiva e contínua; cada nó no estado Infectado gera **0.1 Biomassa/segundo**
- Com 20 nós infectados: 20 × 0.1 = 2.0 Biomassa/s
- **Não há coleta manual**: Biomassa acumula em medidor de run (visível na UI)
- **Sistema de mochila NÃO se aplica aqui**: recurso de fluxo, igual aos Sinais de Controle (Zona 5)
- Ao fim da run (timer ou vitória antecipada): Biomassa acumulada vai para o estoque do hub
- **Bônus de vitória antecipada**: infectar 80% antes do timer = +25% de Biomassa acumulada

**Justificativa do bônus de vitória antecipada:**
É a única zona com esta mecânica porque a propagação automática cria um ponto natural onde o jogo "acabou antes do timer". Recompensar isso incentiva o jogador a infectar eficientemente (não apenas esperar o timer).

### 3.5 Risco e Fail State

#### Inimigos — Unidades de Cura

- Tipo único desta zona: **Unidade de Cura**
- Comportamento: identifica o nó Infectado mais próximo e se move para ele
- Ao chegar: aplica cura por **3 segundos** → nó retorna ao estado Neutro
- HP da Unidade: 40 HP (o jogador não tem ataque — as Unidades devem ser contornadas, não combatidas)
- Se uma Unidade de Cura tocar o jogador: -1 HP (3 hits = fail state)
- Unidades de Cura **não morrem** — após curar um nó, buscam o próximo nó Infectado mais próximo

**O jogador não pode eliminar as Unidades de Cura.** Elas são uma força constante de anti-propagação. A estratégia é infectar mais rápido do que elas curam.

**Frequência de Unidades:**

| Tempo de Run | Unidades Ativas Simultaneamente |
|---|---|
| 0–40s | 1–2 Unidades |
| 40–80s | 2–3 Unidades |
| 80–120s | 3–4 Unidades |

#### Desequilíbrio de Propagação

Se o jogador não infectar nós de alta conectividade cedo, as Unidades de Cura conseguem acompanhar o ritmo de propagação natural. O risco real não é morrer — é **ficar preso em equilíbrio negativo**: propagando lentamente enquanto as Unidades curam no mesmo ritmo ou mais rápido.

---

## 4. Formulas

### Porcentagem de Infecção

```
porcentagem_infecção = nós_infectados / total_nós × 100%

Meta de vitória antecipada = 80%
Com 25 nós totais: 80% = 20 nós infectados
Com 20 nós totais: 80% = 16 nós infectados
```

### Biomassa por Run (cenário ideal — 80% de infecção por 120s)

```
Variáveis:
  n_nos_total    = 25 (valor médio)
  n_nos_meta     = 20 (80% de 25)
  taxa_por_no    = 0.1 Biomassa/s
  timer_run      = 120s
  bonus_antecipado = 1.25 (×25%)

Cenário: jogador atinge 80% em 60s, recebe bônus e run encerra:
  Fase 0–60s: ramp up de infecção; média de 10 nós infectados ao longo do período
  biomassa_pre = 10 × 0.1 × 60 = 60 Biomassa
  biomassa_com_bonus = 60 × 1.25 = 75 Biomassa

Cenário: jogador usa todo o timer, termina com 16 nós infectados:
  Fase 0–120s: ramp up gradual; média de 8 nós infectados ao longo do período
  biomassa_total = 8 × 0.1 × 120 = 96 Biomassa (sem bônus)

Conclusão: usar todo o timer sem atingir 80% pode render mais Biomassa
do que uma vitória antecipada rápida. O bônus recompensa eficiência, mas não pune quem joga lento.
```

### Ritmo de Propagação vs Ritmo de Cura

```
Propagação automática: 1 nó propaga para n_vizinhos_medios nós a cada 5s
  n_vizinhos_medios = 2.5 (média estimada para grafo de 25 nós com 30 arestas)

Cura por Unidade: 1 nó curado a cada 3s (tempo de cura) + tempo de deslocamento (~5s)
  taxa_cura_por_unidade = 1 nó / ~8s = 0.125 nós/s

Propagação automática (a partir de 5 nós infectados):
  taxa_propagacao = 5 nós × 2.5 vizinhos / 5s = 2.5 nós/s

Com 3 Unidades de Cura ativas: taxa_cura_total = 3 × 0.125 = 0.375 nós/s
Com 5 nós infectados: propagação (2.5/s) >> cura (0.375/s) → infecção ganha

Ponto de equilíbrio crítico: quantos nós infectados são necessários para que a
propagação automática supere as Unidades de Cura?
  n_min_para_superar = taxa_cura_total / (n_vizinhos_medios / tempo_propagacao)
  n_min = 0.375 / (2.5 / 5) = 0.375 / 0.5 = 0.75 → arredonda para 1 nó

Isso significa que 1 nó infectado já propaga mais rápido que 1 Unidade cura.
Com 3+ Unidades: precisaria de 3 nós infectados para superar todas.
O jogador nunca está em equilíbrio negativo se tiver 5+ nós infectados.
```

### Tempo de Infecção Manual vs Automática

```
Tempo manual (jogador toca nó adjacente): 1.0s de pausa + deslocamento (~2.0s) = ~3.0s
Tempo automático (propagação de nó pai): 5.0s (timer de propagação)

Manual é ~1.67× mais rápido que automático por nó individual.
Para nós de alta conectividade (3+ vizinhos), manual é crítico:
  Infectar manualmente 1 nó com 4 vizinhos = 4 nós propagados em 5s
  Esperar propagação = mesma coisa, mas 2s depois
  Diferença de 2s em 120s de run = marginal, mas pode significar 1–2 nós extras
```

---

## 5. Edge Cases

| Situação | Comportamento |
|----------|---------------|
| Jogador toca nó que a Unidade de Cura está curando simultaneamente | Infecção e cura competem: infecção leva 1.0s, cura leva 3.0s. O jogador termina antes — nó fica Infectado, Unidade reinicia busca por próximo nó |
| Unidade de Cura e propagação automática chegam ao mesmo nó simultaneamente | Propagação automática é aplicada primeiro (resolução de frame); Unidade de Cura começa a curar o nó recem-infectado |
| Dois nós propagam para o mesmo nó neutro ao mesmo tempo | Nó é infectado normalmente — propagação dupla não cria nenhum efeito especial |
| Todos os 25 nós infectados antes de 80% do timer | Vitória antecipada ativada; bônus de 25% aplicado ao total acumulado |
| Nó isolado (sem conexões) nunca recebido propagação | Permanece Neutro até que o jogador o toque manualmente. Não há outro caminho. Se nunca tocado, não contribui para a porcentagem |
| Jogador leva 3 hits de Unidades de Cura | Fail state: Biomassa acumulada na run é perdida; run encerra |
| Unidade de Cura cura o único nó infectado (de volta a 0% de infecção) | Estado normal — o jogador precisa tocar o nó novamente. Não há efeito especial por chegar a 0% de infecção |
| Vitória antecipada (80%) ativada enquanto Unidade de Cura está curando um nó | Run encerra imediatamente — o processo de cura em andamento é cancelado. O total de nós infectados no momento do trigger é o que conta |
| Jogador entra em run sem ter tocado nenhum nó por 30s | Sem penalidade; 0 nós infectados = 0 Biomassa gerada. Apenas tempo perdido |
| Bônus de vitória antecipada com Biomassa muito baixa (jogador infectou tarde) | O bônus de 25% ainda se aplica ao total, mesmo que seja pequeno. Não há limiar mínimo |

---

## 6. Dependencies

| Sistema | Relação | Direção |
|---------|---------|---------|
| **Sistema de Recursos** | Biomassa Adaptativa é recurso de fluxo (não item de mochila); sistema de recursos deve suportar o tipo "fluxo acumulado por run" | Zona define novo tipo de fluxo de recurso |
| **Foguete (Hub)** | Biomassa alimenta o sistema de suporte de vida do foguete | Foguete consome Biomassa |
| **Hub / Mapa-Mundo** | Jogador acessa a zona a partir do hub | Hub controla acesso |
| **Sistema de HP** | O jogador tem 3 HP nesta zona (mesmo que no Circuito Quebrado); HP é configurável por zona | Zona configura HP via sistema compartilhado |
| **Gerador de Mapas** | O grafo de nós (quantidade, posições, conexões) é gerado proceduralmente; deve garantir conectividade, n_vizinhos_medio alvo, e percentual de nós isolados | Zona define parâmetros para o Gerador de Grafo |
| **Sistema de Timer** | Timer de 120s com condição de vitória antecipada (80% de nós infectados) — comportamento único; o sistema de timer deve suportar condição de vitória por threshold externo | Zona define parâmetros especiais do Timer |
| **Zona Stealth** | Zona irmã de modo solo; contraste temático: Stealth é sobre não ser visto, Infecção é sobre expandir presença sem confronto | Relação temática, sem dependência técnica direta |
| **Zona Campo de Controle** | Ambas usam recursos de fluxo (não mochila); ambas têm inimigos que contestam o progresso passivo; a abstração de "recurso de fluxo" deve ser compartilhada | Dependência de sistema compartilhado de fluxo |

---

## 7. Tuning Knobs

| Parâmetro | Valor Base | Range Seguro | Categoria | Efeito no Gameplay |
|-----------|------------|--------------|-----------|---------------------|
| `timer_run` | 120s | 90–150s | Gate | Duração da run; mais tempo = mais Biomassa mas menos urgência |
| `n_nos_total` | 25 | 20–30 | Curve | Densidade do grafo; mais nós = mais complexidade de roteamento |
| `porcentagem_meta_vitoria` | 80% | 70–90% | Gate | Meta de vitória antecipada; abaixo de 70% = muito fácil, acima de 90% = pode ser impossível |
| `bonus_vitoria_antecipada` | 1.25 (×25%) | 1.10–1.50 | Curve | Incentivo para jogar eficientemente |
| `timer_propagacao_automatica` | 5s | 3–8s | Feel | Ritmo de auto-propagação; muito rápido = jogador irrelevante, muito lento = frustração |
| `tempo_infeccao_manual` | 1.0s | 0.5–2.0s | Feel | Velocidade de infecção pelo jogador; deve ser visivelmente mais rápido que automático |
| `taxa_biomassa_por_no` | 0.1/s | 0.05–0.2/s | Curve | Geração de recurso; ajusta retorno por run sem mudar o gameplay |
| `hp_unidade_cura` | 40 | — | Gate | HP não relevante — Unidades não morrem. Valor reservado se futuramente implementar mecânica de interação |
| `tempo_cura_por_no` | 3s | 2–5s | Feel | Velocidade de remoção das Unidades; muito rápido = impossível acompanhar |
| `n_unidades_early` | 1–2 | 1–3 | Gate | Pressão inicial; não deve superar a propagação manual no começo da run |
| `n_unidades_late` | 3–4 | 2–5 | Gate | Pressão final; deve criar tensão mas nunca impossibilitar vitória com bom play |
| `porcentagem_nos_isolados` | 15–20% | 10–25% | Curve | Proporção de nós que exigem toque manual obrigatório |

---

## 8. Acceptance Criteria

**Funcional (pass/fail para QA):**

- [ ] Pausar sobre um nó por 1.0s exato muda o estado do nó para Infectado
- [ ] Mover antes de completar 1.0s cancela a infecção em progresso sem mudar o estado do nó
- [ ] Todo nó infectado inicia um timer interno de 5s após ficar Infectado
- [ ] Ao completar os 5s, o nó propaga para TODOS os nós adjacentes neutros simultaneamente
- [ ] Cada nó infectado gera exatamente 0.1 Biomassa/s
- [ ] Atingir 80% de nós infectados encerra a run com bônus de 25% imediatamente
- [ ] Unidade de Cura reverte um nó de Infectado para Neutro após 3s dentro do nó
- [ ] Jogador tocado 3 vezes por Unidade de Cura = fail state; Biomassa da run perdida
- [ ] Timer de 120s encerra a run; Biomassa acumulada vai para o hub
- [ ] Nós isolados (sem conexões) nunca recebem propagação automática
- [ ] O grafo gerado é sempre conectado (existe caminho entre qualquer par de nós)

**Experiencial (validado por playtest):**

- [ ] Novo jogador entende que tocar nós os infecta sem tutorial; a propagação automática deve ser visualmente óbvia
- [ ] Após 1 run, o jogador identifica nós de alta conectividade como alvos prioritários
- [ ] A sensação de "ver o mapa ficar verde" enquanto o jogador está longe cria satisfação de progressão passiva
- [ ] A ameaça das Unidades de Cura é percebida como "corrida contra o relógio" e não como "punição injusta"
- [ ] A vitória antecipada (80% antes do timer) é percebida como conquista de habilidade, não como sorte
- [ ] Uma run completa de 120s com desfecho normal (sem vitória antecipada) gera entre 60 e 150 Biomassa

---

*Relacionado: `design/gdd/game-concept.md`, `design/gdd/resource-system.md`, `design/gdd/zone-stealth.md`, `design/gdd/zone-field-control.md`*
