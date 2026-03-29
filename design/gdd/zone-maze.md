---
tags: [fungineer, game-design, gdd]
date: 2026-03-23
tipo: game-design-doc
---

# Labirinto Dinâmico — Game Design Document

**Version**: 2.0
**Date**: 2026-03-23
**Status**: Revisado — Impulso de Abertura

---

## 1. Overview

Zona de navegação sob pressão estrutural. O mapa é um labirinto com paredes que abrem e fecham em ciclos temporizados e visíveis; o objetivo é chegar ao EXIT coletando Fragmentos Estruturais pelo caminho. A mecânica central é o Impulso: aproximar-se de uma parede em movimento acelera a abertura — mover é mais eficiente que esperar.

Os **Fragmentos Estruturais** são o material de reforço do casco externo do foguete.

---

## 1b. Contexto Narrativo

- **FLOW** (Facility Logistics and Operations Workflow): sistema logístico do Projeto Olímpio que gerenciava armazéns e distribuição de materiais. Paredes abriam/fechavam conforme volume de tráfego — o labirinto são esses portões automatizados, ainda executando ciclos sem carga para rotear
- **Sentinelas Errantes**: robôs de inventário sem inventário para gerenciar; patrulham aleatoriamente e investigam movimento detectado
- **Fragmentos**: materiais de construção que nunca chegaram ao destino — vigas de titânio, placas de blindagem. O casco do foguete é literalmente construído com o que a cidade deixou para trás
- **Lore encontrável**: etiquetas de carga, fotos de família em terminais, listas de pedidos de endereços que provavelmente não têm mais moradores

---

## 2. Player Fantasy

O labirinto responde ao seu movimento — correr em direção à parede faz ela abrir mais cedo; parar faz ela reagir mais devagar. Na terceira run, você corre como se o chão se movesse junto com você.

**Estética MDA primária**: Challenge (leitura de timing em movimento, planejamento de rota antecipado).
**Estética secundária**: Discovery (descobrir que mover é mais eficiente que esperar; memorizar ritmos das paredes).

---

## 3. Detailed Rules

### 3.1 Estrutura da Run

- Jogador entra **sozinho**
- Estrutura de câmaras e conexões fixa; **timings das paredes parcialmente procedurais** por run
- ENTRADA e EXIT em posições opostas fixas
- Fragmentos Estruturais espalhados — na rota principal e em alcovas laterais
- Run encerra ao chegar ao EXIT (sem timer fixo — pacing pelo movimento do jogador)
- Morrer = fail state, perde todos os Fragmentos da run
- Duração estimada: 60–120s conforme rota

### 3.2 Interpretação do Movimento

- **Input**: arrastar o dedo = mover o personagem
- Aproximar-se de parede em movimento → abre mais cedo (Impulso de Abertura)
- Ficar estático → abre no tempo padrão ou mais devagar
- Parar por > 3s frente a parede fechada → abertura atrasa 2s (Penalidade de Estagnação)
- Salas cinéticas (sem saídas abertas): zero dano, mas entrar em movimento e sair em movimento é mais eficiente que aguardar parado

### 3.3 Mecânica Central — Paredes Cinéticas

#### Estados das Paredes

| Estado | Visual | Duração Base | Efeito |
|--------|--------|--------------|--------|
| **Aberta** | Passagem livre | 3–8s | Passagem permitida |
| **Fechando** | Parede aparecendo + contador vermelho piscante | 3s (aviso fixo) | Passagem ainda permitida; movimento em direção à parede cancela fechamento por 1s |
| **Fechada** | Parede sólida | 5–12s | Bloqueada; modificável por Impulso |
| **Abrindo** | Parede sumindo + contador verde | 2s base → 0.5s com Impulso | Passagem disponível |

**Ciclo completo (sem Impulso):**
```
Fechada → [2s Abrindo] → Aberta → [3s Fechando] → Fechada → ...
```

#### Impulso de Abertura

Condição de ativação:
- Jogador a ≤ 100px da parede fechada
- Movendo-se **em direção a ela** a ≥ 80% da velocidade máxima (≥ 160 px/s) por ≥ 0.5s contínuos

Efeito:
- Parede entra em **Abrindo Antecipado** — abre 1.5s antes do timer normal
- Animação acelerada com faíscas elétricas
- Contador da parede reflete antecipação em tempo real
- Feedback visual: pulso **ciano** na parede

#### Penalidade de Estagnação

Condição:
- Jogador a ≤ 150px da parede fechada
- Parado ou movendo a ≤ 30% da velocidade máxima (≤ 60 px/s) por > 3s

Efeito:
- Timer da parede regride +2s (abertura atrasa)
- Feedback visual: parede pulsa levemente
- Máximo: 1 penalidade por tentativa de passagem

**Impulso só afeta Fechada → Abrindo. O fechamento segue sempre o timer normal.**

#### Visibilidade dos Timers

- Cada parede: contador visual em arco decrescente indicando próxima mudança de estado
- Aberta: tempo até começar a fechar
- Fechada: tempo restante até abrir (inclui antecipação por Impulso em tempo real)
- Fechando: contador vermelho piscante (3s)
- Abrindo: contador verde (2s base; encurtado por Impulso)
- Impulso ativo: pulso ciano na parede

#### Ficar Preso em Parede Fechando

- Aviso (3s): parede pisca vermelho + som de alerta
- Durante aviso: mover para fora do espaço da parede → sem dano
- 1s antes de fechar com personagem ainda no espaço → **-1 HP + empurrão para o lado mais próximo**
- HP: 3 hits; 0 HP = fail state

### 3.4 Layout do Labirinto

```
ENTRADA → Câmara A → (bifurcação) → Câmara B → ... → EXIT
                    ↘ (rota alternativa) ↗
```

| Rota | Fragmentos | Tempo Est. | Inimigos |
|------|------------|------------|----------|
| Direta | 2–3 | ~40s | 0 |
| Alternativa | 4–5 | ~60s | 1 emergente |
| Alcovas (+cada) | +1–2 | +10–15s | Variável |

**Alcovas Laterais:**
- Câmaras menores com acesso por único segmento de parede
- Entrar, coletar, sair antes da parede fechar
- Cada alcova tem ciclo de abertura próprio
- Alcovas com abertura espaçada = mais Fragmentos (oportunidade rara)

### 3.5 Coleta — Fragmentos Estruturais

- Coleta padrão: **1.5s de pausa** sobre o Fragmento
- Posições fixas por mapa; timings de acesso variam por run
- Cada Fragmento = 1 slot de mochila
- Mochila cheia → ir ao EXIT com o que tem
- Decisão central: quais alcovas valem o tempo vs. espaço de mochila

### 3.6 Inimigos — Sentinelas Errantes

- Não presentes no início da run
- **Emergem de passagens abertas**: 30% de chance por abertura de parede
- Comportamento: perseguição se em linha de visão; patrulha aleatória se não
- HP: 60; jogador sem ataque — deve evitar
- Toque no jogador: -1 HP
- Ficam presos em câmaras se parede fechar atrás deles
- Tornam Salas Cinéticas progressivamente menos seguras

---

## 4. Formulas

### Janela de Passagem Segura

```
janela_segura = duracao_aberta - aviso_fechamento

  duracao_aberta        = 3–8s (procedural)
  aviso_fechamento      = 3s (fixo)
  tempo_para_atravessar = 60px / 200px/s = 0.3s

janela_real_segura = duracao_aberta - 3s → 0s até 5s
  duracao_aberta=3s → janela=0s (apenas o aviso é a oportunidade)
  duracao_aberta=8s → janela=5s (confortável)
```

### Ganho de Tempo por Impulso

```
antecipacao_impulso = 1.5s (fixo quando ativado)

Condições:
  distancia_jogador_parede <= 100px
  velocidade_jogador >= 160 px/s
  duracao_condicao >= 0.5s

Exemplo: parede com 3s restantes, jogador a 160px/s:
  timer_efetivo = 3s - 1.5s = 1.5s quando Impulso ativa
  chegada à parede = 100px / 160px/s = 0.625s
  parede abre 0.875s após chegada → com antecipação suficiente: chegada quase simultânea
```

### Penalidade de Estagnação

```
penalidade = +2s no timer_fechada atual

Condições:
  distancia <= 150px
  velocidade <= 60 px/s
  duracao >= 3s

Máximo: 1 penalidade por tentativa de passagem
```

### Custo de Tempo por Alcova

```
custo_alcova = tempo_espera + tempo_entrada + tempo_coleta + tempo_saida

  tempo_espera    = 0s (timing perfeito) até duracao_fechada (timing ruim)
  tempo_entrada   = ~1–2s
  tempo_coleta    = 1.5s
  tempo_saida     = ~1–2s

Mínimo (timing perfeito, câmara pequena): 0 + 1.0 + 1.5 + 1.0 = 3.5s
Máximo (timing ruim, câmara grande):    12 + 2.0 + 1.5 + 2.0 = 17.5s
```

### Dano por Aprisionamento

```
Condição: personagem na hitbox da parede na última janela de 1s do estado Fechando
Dano: -1 HP
HP total: 3 → o jogador suporta 2 aprisionamentos; o terceiro = fail state
```

### Tempo Estimado por Estratégia

```
Rota Direta (~6–8 paredes):
  8 × (0.3s travessia + 2.0s espera média) ≈ 18s paredes + 20s deslocamento = ~40s

Rota Alternativa (~10–14 paredes + alcovas):
  40s base + 2 alcovas × 12s = ~65–90s
```

### Probabilidade de Inimigo por Abertura

```
chance_inimigo = 30% por abertura

Rota direta (8 paredes):     0.3 × 8 = 2.4 inimigos esperados
Rota alternativa (12 paredes): 0.3 × 12 = 3.6 inimigos esperados
```

---

## 5. Edge Cases

| Situação | Comportamento |
|----------|---------------|
| Personagem exatamente no meio da parede ao fechar | X < 50% do segmento → empurrão para lado de origem; X ≥ 50% → lado de destino |
| Empurrão cai dentro de Sentinela | Inimigo deslocado lateralmente 30px antes do empurrão do jogador |
| Duas paredes fecham simultâneas, aprisionando em câmara 1×1 | Zero dano — jogador está na câmara, não nas paredes. Fica preso até uma parede abrir (Sala Cinética forçada) |
| Sentinela preso com jogador na mesma câmara | Patrulha sem causar dano sem contato; jogador aguarda abertura ou enfrenta o Sentinela em câmara pequena |
| Mochila cheia, alcova com Fragmento acessível | Círculo de coleta não inicia |
| EXIT acessível com 0 Fragmentos | Jogador pode encerrar a run com 0 Fragmentos — não é fail state |
| Timer interno de parede zerado, animação ainda em progresso | Estado Abrindo (2s) precede estado Aberta; passagem só permitida após animação completa |
| Coleta em alcova com parede fechando | Círculo (1.5s) termina antes da parede fechar → coleta OK. Parede fecha antes → coleta cancelada, -1 HP (empurrão) |
| Sentinela bloqueando único caminho para EXIT | Hitbox pequeno relativo ao corredor — jogador pode passar lateralmente. Corredor estreito: Sentinela move aleatoriamente, desobstrui em ~3s |

---

## 6. Dependencies

| Sistema | Relação | Direção |
|---------|---------|---------|
| **Sistema de Mochila** | Fragmentos ocupam slots; mochila cheia bloqueia coleta; upgrades ampliam coleta por run | Zona depende |
| **Sistema de Recursos** | Fragmentos entregues ao hub ao chegar ao EXIT | Zona fornece |
| **Foguete (Hub)** | Fragmentos alimentam o casco de blindagem | Foguete consome |
| **Hub / Mapa-Mundo** | Acesso à zona a partir do hub | Hub controla acesso |
| **Sistema de HP** | 3 HP; empurrões de parede e toques de Sentinela = -1 HP cada | Zona configura via sistema compartilhado |
| **Gerador de Labirinto** | Topologia base fixa; timings de paredes e seed de inimigos variam por run | Zona define parâmetros |
| **Sistema de Paredes Dinâmicas** | Estados, timers, animações, dano por aprisionamento — sistema específico desta zona; implementar como componente reutilizável | Zona define e cria |
| **Zona Circuito Quebrado** | Zona irmã de puzzle de navegação; contraste: Circuito tem sequência estática, Labirinto tem timing dinâmico | Relação temática; ambas modo solo |

---

## 7. Tuning Knobs

| Parâmetro | Valor Base | Range Seguro | Categoria | Efeito |
|-----------|------------|--------------|-----------|--------|
| `duracao_aviso_fechamento` | 3s | 2–5s | Feel | Janela de reação antes do fechamento |
| `duracao_aviso_abertura` | 2s | 1–3s | Feel | Base sem impulso |
| `duracao_aberta_min` | 3s | 2–5s | Curve | Mínimo de tempo com passagem disponível |
| `duracao_aberta_max` | 8s | 5–12s | Curve | Máximo de tempo aberta |
| `duracao_fechada_min` | 5s | 3–8s | Gate | Tempo mínimo de bloqueio |
| `duracao_fechada_max` | 12s | 8–20s | Gate | Tempo máximo de bloqueio |
| `impulso_distancia_ativacao` | 100px | 70–150px | Feel | Distância de ativação do Impulso |
| `impulso_velocidade_minima` | 160 px/s | 120–180 px/s | Feel | Velocidade mínima para Impulso |
| `impulso_duracao_condicao` | 0.5s | 0.3–1.0s | Feel | Tempo de manutenção antes de ativar |
| `impulso_antecipacao` | 1.5s | 0.5–2.5s | Curve | Ganho de tempo por Impulso |
| `estagnacao_duracao_trigger` | 3s | 2–5s | Gate | Tempo estático para disparar penalidade |
| `estagnacao_penalidade` | +2s | +1s a +4s | Gate | Atraso adicional por estagnação |
| `chance_inimigo_abertura` | 30% | 15–50% | Gate | Frequência de Sentinelas emergentes |
| `hp_jogador` | 3 | 2–5 | Gate | Tolerância a aprisionamentos e hits |
| `n_fragmentos_rota_direta` | 2–3 | 1–4 | Curve | Recompensa garantida da rota direta |
| `n_fragmentos_por_alcova` | 1–2 | 1–3 | Curve | Incentivo para desvios |
| `n_alcovas_por_mapa` | 4–6 | 3–8 | Curve | Oportunidades opcionais de coleta |
| `velocidade_sentinela` | 100 px/s | 70–140 px/s | Feel | Ameaça dos Sentinelas |

---

## 8. Acceptance Criteria

**Funcional (pass/fail para QA):**

- [ ] Toda parede exibe contador visual (arco ou barra) indicando tempo até próxima mudança de estado
- [ ] Impulso: jogador a ≤100px, ≥160px/s por ≥0.5s → parede abre 1.5s antes do timer normal
- [ ] Parede com Impulso ativo exibe pulso ciano distinto do estado normal
- [ ] Penalidade de Estagnação: jogador a ≤150px, ≤60px/s por ≥3s → timer +2s (máximo 1× por tentativa)
- [ ] Aviso de fechamento (3s): feedback sonoro e visual distinto ativados
- [ ] Personagem no espaço da parede a 1s do fechamento: -1 HP + empurrão para o lado correto
- [ ] Parede fechada bloqueia fisicamente o personagem
- [ ] Fragmentos em alcovas coletáveis apenas com parede da alcova aberta
- [ ] Chegar ao EXIT transfere todos os Fragmentos ao hub
- [ ] Fail state (0 HP) descarta todos os Fragmentos da run
- [ ] Sentinelas emergem com ~30% de probabilidade por abertura
- [ ] EXIT sempre acessível por pelo menos uma rota

**Experiencial (validado por playtest):**

- [ ] Novo jogador entende que correr em direção à parede abre mais cedo — sem tutorial
- [ ] Após 1–2 runs, jogador percebe que esperar parado é menos eficiente que aproximar em movimento
- [ ] Pulso ciano comunica "você está fazendo certo" claramente
- [ ] Jogador que domina o Impul