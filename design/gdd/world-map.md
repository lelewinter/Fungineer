---
tags: [fungineer, game-design, gdd]
date: 2026-03-21
tipo: game-design-doc
---

# Mapa-Mundo — Game Design Document

**Version**: 1.0
**Date**: 2026-03-21
**Status**: Draft — Brainstorm Aprovado

---

## 1. Overview

O Mapa-Mundo é a tela de seleção de zona acessada a partir do hub, representando a cidade dominada pelas IAs vista de cima. Cumpre três funções simultâneas: **seleção de zona**, **medidor de pressão** (deterioração), e **registro de progresso** (zonas desbloqueadas).

---

## 2. Player Fantasy

- Você vê o campo inimigo — drones patrulham, hologramas cobrem quarteirões, escuridão avança
- Cada peça do foguete abre novas rotas, mas a IA intensifica a pressão
- O mapa conta essa história sem diálogos

---

## 3. Detailed Rules

### 3.1 Apresentação Visual

- Perspectiva top-down, estilizada (não realista)
- Mapa maior que a tela — navegação por **arrastar/pan**
- **Base de Resistência**: ponto fixo sempre visível (âncora visual)
- Zonas: ícone, nome e recurso dropado visíveis
- Zonas bloqueadas: silhuetas apagadas — existem, mas inacessíveis

### 3.2 Interação

1. Arrastar para pan no mapa
2. Tocar em uma zona → painel de detalhes:
   - Nome, recurso dropado, nível de deterioração (estágio 0–3), modificadores ativos
3. Confirmar para iniciar a run

### 3.3 Desbloqueio de Zonas

| Evento | Zona Desbloqueada |
|---|---|
| Início do jogo | Zona Hordas |
| Peça 1 construída (Base Estrutural) | Zona Stealth |
| Peça 3 construída (Suporte Interno) | Zona 3 *(pós-MVP)* |
| Peça 5 construída (Painel de Controle) | Zona 4 *(pós-MVP)* |
| Peça 7 construída (Sistema de Navegação) | Zona 5 *(pós-MVP)* |

### 3.4 Sistema de Deterioração

A cada **X runs totais completadas** (qualquer zona, qualquer resultado), a cidade deteriora. Cada zona tem **contador independente**.

#### Estágios de Deterioração

| Estágio | Visual no Mapa | Impacto em Run |
|---|---|---|
| **0 — Estável** | Cores normais | Dificuldade base |
| **1 — Deteriorando** | Zona mais escura, ícones de vigilância | +25% inimigos/patrulhas |
| **2 — Crítico** | Vermelho/laranja, pulso de alerta | +50% inimigos/patrulhas |
| **3 — Fechado** | Grade de IA, inacessível | Bloqueada — missão de reabertura necessária |

#### Ritmo de Deterioração (MVP)

```
Estágio 0→1: após 6 runs totais
Estágio 1→2: após 14 runs acumuladas
Estágio 2→3: após 20 runs acumuladas
```

#### Reabertura de Zona Fechada

- Zona no Estágio 3 requer **missão de reabertura** de personagem do hub
- Após missão: zona volta ao **Estágio 1** (não ao 0)

| Zona | Personagem | Tipo de missão |
|---|---|---|
| Zona Hordas | A Ex-Militar | Trazer 3× Sucata com Estágio 2 ativo |
| Zona Stealth | O Engenheiro Culpado | Run Stealth sem ser detectado |
| Zona 3+ | *(a definir)* | *(a definir)* |

### 3.5 Painel de Detalhes da Zona

```
[ ícone ]  ZONA HORDAS
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

Modificador de dificuldade:
  Estágio 0: 1.0× (base)
  Estágio 1: 1.25× (spawn de inimigos/patrulhas)
  Estágio 2: 1.5×  (spawn de inimigos/patrulhas)
  Estágio 3: bloqueada

Exemplo: 10 runs completadas → Zona Hordas no Estágio 1 (passou de 6). Próximo: run 14.
```

---

## 5. Edge Cases

| Situação | Comportamento |
|---|---|
| Jogador ignora uma zona por muitas runs | Deteriora normalmente — contador próprio por zona |
| Personagem com < 60% confiança | Missão de reabertura não aparece |
| Todas as zonas fecham simultaneamente | Impossível no MVP (2 zonas); pós-MVP: salvaguarda — nunca fecha a última zona aberta |
| Mapa sem zonas disponíveis | Estado impossível por salvaguarda; se ocorrer: hub exibe crise com missões de emergência |
| Run falha (morte) — conta para deterioração? | Sim — qualquer run iniciada e terminada conta |

---

## 6. Dependencies

| Sistema | Relação |
|---|---|
| **Hub** | Mapa-Mundo acessado a partir do hub; retorno ao hub após cada run |
| **Foguete** | Peças construídas desbloqueiam zonas |
| **Sistema de Confiança** | Personagens com 60%+ oferecem missões de reabertura |
| **Zona Hordas** | Representada no mapa com dados de deterioração próprios |
| **Zona Stealth** | Representada no mapa com dados de deterioração próprios |
| **Sistema de Recursos** | Painel de zona exibe capacidade de mochila atual |

---

## 7. Tuning Knobs

| Parâmetro | Valor Base | Range Seguro | Efeito |
|---|---|---|---|
| `runs_ate_estagio_1` | 6 | 4–10 | Velocidade da primeira deterioração |
| `runs_ate_estagio_2` | 14 | 10–20 | Velocidade da deterioração crítica |
| `runs_ate_estagio_3` | 20 | 16–28 | Velocidade do fechamento |
| `modificador_estagio_1` | 1.25× | 1.1–1.4× | Dificuldade no estágio inicial |
| `modificador_estagio_2` | 1.5× | 1.3–1.8× | Dificuldade no estágio crítico |
| `estagio_pos_reabertura` | 1 | 0–1 | Estágio após missão de reabertura |

---

## 8. Acceptance Criteria

- [ ] Mapa navegável por pan e responsivo em mobile
- [ ] Base de Resistência sempre visível como âncora
- [ ] Zonas bloqueadas aparecem como silhuetas — não tocáveis
- [ ] Painel de detalhes exibe: nome, recurso, estágio, modificador ativo
- [ ] Cada zona tem contador de deterioração independente
- [ ] Transição visual entre estágios (0→1→2→3) legível sem texto explicativo
- [ ] Missão de reabertura aparece automaticamente no hub quando zona atinge Estágio 3
- [ ] Após reabertura, zona volta ao Estágio 1 (não ao 0)
- [ ] Run que termina em morte conta para o contador de deterioração

---

## Escopo MVP vs Pós-MVP

| Feature | MVP | Pós-MVP |
|---|---|---|
| Mapa com 2 zonas + pan | Sim | — |
| Deterioração visual (estágios 0–2) | Sim | — |
| Modificador de dificuldade por estágio | Sim | — |
| Zona Fechada (Estágio 3) | Não | Sim |
| Missão de reaber