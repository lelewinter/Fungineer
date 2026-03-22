# Mapa-Mundo — Game Design Document

**Version**: 1.0
**Date**: 2026-03-21
**Status**: Draft — Brainstorm Aprovado

---

## 1. Overview

O Mapa-Mundo é a tela de seleção de zona acessada a partir do hub. Representa a
cidade dominada pelas IAs vista de cima — um ambiente hostil que o jogador vai
infiltrando progressivamente para coletar recursos e construir o foguete.

O mapa cumpre três funções simultâneas: **interface de seleção** (onde vou raidar?),
**medidor de pressão** (quanto tempo tenho antes que a cidade piore?), e **registro
de progresso** (o quanto já desbloqueamos).

---

## 2. Player Fantasy

Você está olhando para o campo inimigo. A cidade que pertencia aos humanos agora
pulsa com a presença das IAs — drones patrulham, hologramas de vigilância cobrem
quarteirões inteiros, e a escuridão avança lentamente sobre os bairros. Mas você
conhece brechas. E a cada peça do foguete construída, novas rotas se abrem — ao
mesmo tempo que a IA percebe que há resistência organizada e intensifica a pressão.
O mapa conta essa história sem uma palavra de diálogo.

---

## 3. Detailed Rules

### 3.1 Apresentação Visual

- Perspectiva top-down da cidade, vista esquemática/estilizada (não realista)
- Mapa é **maior que a tela** — o jogador navega por **arrastar/pan**
- A **Base de Resistência** aparece como ponto fixo e sempre visível
  (âncora visual no canto ou centro-inferior do mapa)
- Zonas são locais distintos na cidade com ícone, nome e recurso dropado visíveis
- Zonas bloqueadas aparecem como silhuetas apagadas — existem, mas inacessíveis

### 3.2 Interação

1. Jogador arrasta o dedo para fazer pan no mapa
2. Toca em uma zona para ver o painel de detalhes:
   - Nome da zona
   - Recurso dropado
   - Nível de deterioração atual (estágio 0–3)
   - Modificadores de dificuldade ativos (se houver)
3. Confirma para iniciar a run

### 3.3 Desbloqueio de Zonas

Zonas são reveladas conforme o foguete avança. Cada peça construída desbloqueia
a próxima zona do mapa — narrativamente, a resistência encontra novas rotas à
medida que os planos do foguete ficam mais claros.

| Evento | Zona Desbloqueada |
|---|---|
| Início do jogo | Zona Hordas (disponível imediatamente) |
| Peça 1 construída (Base Estrutural) | Zona Stealth |
| Peça 3 construída (Suporte Interno) | Zona 3 *(pós-MVP)* |
| Peça 5 construída (Painel de Controle) | Zona 4 *(pós-MVP)* |
| Peça 7 construída (Sistema de Navegação) | Zona 5 *(pós-MVP)* |

### 3.4 Sistema de Deterioração

A cada **X runs totais completadas** (independente de qual zona ou resultado),
a cidade deteriora um grau. As IAs estão sempre avançando — o jogador não pode
simplesmente ignorar uma zona sem consequências.

#### Estágios de Deterioração

| Estágio | Visual no Mapa | Impacto em Run |
|---|---|---|
| **0 — Estável** | Cores normais, iluminação padrão | Dificuldade base |
| **1 — Deteriorando** | Zona mais escura, ícones de vigilância aparecem | +25% inimigos / patrulhas |
| **2 — Crítico** | Vermelho/laranja, pulso visual de alerta | +50% inimigos / patrulhas |
| **3 — Fechado** | Zona coberta por grade de IA, inacessível | Run bloqueada — missão de reabertura necessária |

#### Ritmo de Deterioração (MVP)

```
Estágio 0 → 1: após 6 runs totais
Estágio 1 → 2: após +8 runs totais (14 acumuladas)
Estágio 2 → 3: após +6 runs totais (20 acumuladas)

Cada zona tem seu próprio contador independente.
```

#### Reabertura de Zona Fechada

Quando uma zona atinge Estágio 3, ela é bloqueada até que o jogador complete
uma **missão de reabertura** de um personagem específico do hub que conhece
uma rota alternativa ou ponto cego da IA naquela área.

| Zona | Personagem que reabre | Tipo de missão |
|---|---|---|
| Zona Hordas | A Ex-Militar | Trazer 3× Sucata com Estágio 2 ativo |
| Zona Stealth | O Engenheiro Culpado | Run Stealth sem ser detectado |
| Zona 3+ | *(a definir por zona)* | *(a definir)* |

Completar a missão faz a zona **voltar ao Estágio 1** — não ao 0. A pressão não
é zerada, só aliviada. A zona volta a deteriorar no ritmo normal a partir daí.

### 3.5 Informação por Zona no Painel de Detalhes

Ao tocar em uma zona, o painel mostra:

```
[ ícone da zona ]  ZONA HORDAS
                   Recurso: Sucata Metálica
                   Estágio: ● Deteriorando (+25% inimigos)
                   Mochila: 3 slots
                   [  ENTRAR  ]
```

---

## 4. Formulas

### Ritmo de Deterioração

```
runs_para_deteriorar[estágio] = limiar_estágio - runs_totais_acumuladas

Limiares MVP:
  Estágio 0→1: 6 runs
  Estágio 1→2: 14 runs acumuladas
  Estágio 2→3: 20 runs acumuladas

Modificador de dificuldade por estágio:
  Estágio 0: 1.0×  (base)
  Estágio 1: 1.25× (spawn de inimigos/patrulhas)
  Estágio 2: 1.5×  (spawn de inimigos/patrulhas)
  Estágio 3: bloqueada

Exemplo:
  Jogador completou 10 runs. Zona Hordas está no Estágio 1 (passou de 6).
  Próximo deterioramento: run 14.
```

---

## 5. Edge Cases

| Situação | Comportamento |
|---|---|
| Jogador ignora uma zona por muitas runs | Zona deteriora normalmente — cada zona tem contador próprio |
| Missão de reabertura disponível mas jogador não tem confiança com o personagem | Missão não aparece — personagem com < 60% confiança não oferece missões especiais |
| Todas as zonas fecham simultaneamente | Impossível no MVP (apenas 2 zonas); pós-MVP precisa de salvaguarda (ex: nunca fecha a última zona aberta) |
| Jogador abre o mapa sem zonas disponíveis para raidar | Estado impossível por salvaguarda acima; mas se ocorrer: hub exibe estado de crise com missões de emergência |
| Run falha (morte) — conta para deterioração? | Sim — qualquer run iniciada e terminada (sucesso ou falha) conta para o contador |

---

## 6. Dependencies

| Sistema | Relação |
|---|---|
| **Hub** | Mapa-Mundo é acessado a partir do hub; retorno ao hub após cada run |
| **Foguete** | Peças construídas desbloqueiam zonas no mapa |
| **Sistema de Confiança** | Personagens com 60%+ oferecem missões de reabertura de zona |
| **Zona Hordas** | Zona representada no mapa com seus próprios dados de deterioração |
| **Zona Stealth** | Zona representada no mapa com seus próprios dados de deterioração |
| **Sistema de Recursos** | Painel de zona exibe capacidade da mochila atual |

---

## 7. Tuning Knobs

| Parâmetro | Valor Base | Range Seguro | Efeito |
|---|---|---|---|
| `runs_ate_estagio_1` | 6 | 4–10 | Velocidade da primeira deterioração — quão cedo a pressão aparece |
| `runs_ate_estagio_2` | 14 | 10–20 | Velocidade da deterioração crítica |
| `runs_ate_estagio_3` | 20 | 16–28 | Velocidade do fechamento — quanto tempo o jogador tem |
| `modificador_estagio_1` | 1.25× | 1.1–1.4× | Quanto a dificuldade aumenta no estágio inicial |
| `modificador_estagio_2` | 1.5× | 1.3–1.8× | Quanto a dificuldade aumenta no estágio crítico |
| `estagio_pos_reabertura` | 1 | 0–1 | Estágio ao qual a zona volta após missão de reabertura |

---

## 8. Acceptance Criteria

- [ ] O mapa é navegável por pan (arrastar) e responde fluidamente em mobile
- [ ] A Base de Resistência é sempre visível como âncora no mapa
- [ ] Zonas bloqueadas aparecem como silhuetas — existem mas não são tocáveis
- [ ] Ao tocar em uma zona, o painel de detalhes exibe: nome, recurso, estágio, modificador ativo
- [ ] Cada zona tem contador de deterioração independente
- [ ] A transição visual entre estágios (0→1→2→3) é legível sem texto explicativo
- [ ] Missão de reabertura aparece automaticamente no hub quando uma zona atinge Estágio 3
- [ ] Após reabertura, zona volta ao Estágio 1 (não ao 0)
- [ ] Uma run que termina em morte conta para o contador de deterioração

---

## Escopo MVP vs Pós-MVP

| Feature | MVP | Pós-MVP |
|---|---|---|
| Mapa com 2 zonas + pan | Sim | — |
| Deterioração visual (estágios 0–2) | Sim | — |
| Modificador de dificuldade por estágio | Sim | — |
| Zona Fechada (Estágio 3) | Não | Sim |
| Missão de reabertura | Não | Sim |
| Zonas 3–5 no mapa | Não | Sim |

---

*Relacionado: `design/gdd/game-concept.md`, `design/gdd/hub-and-characters.md`, `design/gdd/resource-system.md`*
