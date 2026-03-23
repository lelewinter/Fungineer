# Sistema de Recursos — Game Design Document

**Version**: 1.0
**Date**: 2026-03-21
**Status**: Draft — Brainstorm Aprovado

---

## 1. Overview

O sistema de recursos conecta zonas de raid ao foguete no hub. Cada zona dropa um tipo específico de recurso que o jogador coleta durante runs e acumula até completar cada peça do foguete.

A tensão central: **quando sair da zona?** Ficar mais tempo rende mais recursos, mas aumenta o risco de perder tudo.

---

## 2. Player Fantasy

- Cada recurso na mochila representa uma decisão tomada sob risco
- Ver recursos depositados no hub e uma nova peça do foguete aparecer é a recompensa concreta de jogar bem — não de ter sorte

---

## 3. Detailed Rules

### 3.1 Tipos de Recurso (MVP)

| Recurso | Zona de Origem | Representa |
|---|---|---|
| **Sucata Metálica** | Zona Hordas (Zona 0) | Estrutura física do foguete |
| **Componentes de IA** | Zona Stealth (Zona 1) | Sistemas eletrônicos e navegação |

### 3.1-B Tipos de Recurso (Pós-MVP — Zonas 3–8)

| Recurso | Zona de Origem | Representa no Foguete | Mecânica de Coleta |
|---|---|---|---|
| **Núcleo Lógico** | Zona 3 — Circuito Quebrado | Processador central de navegação autônoma | 1 por run (alta raridade), após resolver 3 câmaras de puzzle |
| **Combustível Volátil** | Zona 4 — Corrida de Extração | Motor de propulsão | Instantâneo ao contato (sem parada de 1.5s) |
| **Sinais de Controle** | Zona 5 — Controle de Campo | Comunicações e telemetria | Fluxo passivo (não usa slots de mochila) |
| **Biomassa Adaptativa** | Zona 6 — Zona de Infecção | Suporte de vida | Fluxo passivo por nós infectados (não usa slots de mochila) |
| **Fragmentos Estruturais** | Zona 7 — Labirinto Dinâmico | Reforço do casco | Padrão 1.5s (usa slots de mochila) |
| **Sucata + Comp. IA** | Zona 8 — Zona de Sacrifício | Recursos base em quantidade premium | Padrão 1.5s com custos por câmara |

**Dois tipos de acumulação:**
- **Tipo Item**: ocupa slots de mochila (Sucata, Componentes, Núcleos, Combustível, Fragmentos)
- **Tipo Fluxo**: acumulação passiva em medidor de run; transferido ao hub ao final (Sinais, Biomassa)

### 3.2 A Mochila

- Capacidade padrão: **3 slots**
- Cada recurso coletado ocupa 1 slot
- Slots visíveis na UI durante a run em tempo real

### 3.3 Coleta por Parada

- Jogador deve **parar completamente sobre o recurso por 1.5 segundos**
- Círculo de progresso aparece ao redor do ícone durante a parada
- Qualquer movimento cancela e reseta o círculo do zero
- Coleta é sempre intencional — sem coleta acidental por proximidade
- **Mochila cheia**: recursos no chão são ignorados silenciosamente (sem prompt, sem interrupção)

**Tensão por zona:**
- *Hordas*: parar 1.5s com inimigos se aproximando cria risco real de posicionamento
- *Stealth*: parar elimina ruído de movimento, mas deixa o jogador imóvel durante ciclos de patrulha

### 3.4 Fail State

- Morrer = **perde todos os recursos da run atual**
- Estoque acumulado no hub de runs anteriores **não é afetado**
- Retornar ao EXIT vivo = recursos da run vão para o estoque do hub

### 3.5 Estoque do Hub

- Recursos acumulam entre runs (persistência total)
- Sem limite de estoque
- Peças do foguete construídas automaticamente ao atingir o custo da receita

### 3.6 Upgrade de Mochila

| Nível | Slots | Custo (confiança) |
|---|---|---|
| Padrão | 3 slots | — |
| Upgrade 1 | 5 slots | Ex-Executivo 40% |
| Upgrade 2 | 7 slots | Ex-Executivo 80% |

---

## 4. Receitas do Foguete (MVP — 8 Peças)

Peças construídas em ordem sequencial — não é possível pular.

| # | Peça | Custo | Zonas necessárias |
|---|---|---|---|
| 1 | Base Estrutural | 6× Sucata | Hordas |
| 2 | Casco Externo | 8× Sucata | Hordas |
| 3 | Suporte Interno | 5× Sucata + 3× Comp. IA | Hordas + Stealth |
| 4 | Sistema Elétrico | 6× Comp. IA | Stealth |
| 5 | Painel de Controle | 4× Sucata + 5× Comp. IA | Hordas + Stealth |
| 6 | Motor Principal | 8× Sucata + 4× Comp. IA | Hordas + Stealth |
| 7 | Sistema de Navegação | 8× Comp. IA | Stealth |
| 8 | Blindagem Final | 6× Sucata + 6× Comp. IA | Hordas + Stealth |

**Totais MVP**: 37× Sucata Metálica + 32× Componentes de IA = 69 recursos

### Pacing Estimado

```
Slots padrão (3): média 2.5 recursos/run → 69 ÷ 2.5 = ~28 runs → ~56 min bruto
Slots upgrade 1 (5): média 4.0 recursos/run → 69 ÷ 4.0 = ~18 runs → ~36 min bruto
Slots upgrade 2 (7): média 5.5 recursos/run → 69 ÷ 5.5 = ~13 runs → ~26 min bruto
```

---

## 5. Formulas

### Decisão de Sair — Framework de Valor Esperado

```
valor_esperado_ficar = recursos_coletáveis_restantes × probabilidade_sobreviver
valor_sair_agora = recursos_na_mochila (garantido)

Se valor_esperado_ficar > valor_sair_agora → considerar ficar
Se valor_sair_agora ≥ valor_esperado_ficar → sair

Exemplo:
  Mochila: 2/3 slots; recursos visíveis: 3; probabilidade sobreviver: 60%
  Valor esperado ficar: 3 × 0.6 = 1.8
  Valor sair agora: 2 (garantido)
  → Sair é matematicamente melhor
```

---

## 6. Edge Cases

| Situação | Comportamento |
|---|---|
| Mochila cheia, recurso no chão | Recurso ignorado silenciosamente — sem prompt |
| Morre com mochila cheia | Perde tudo — mochila cheia não protege |
| Completa receita mid-hub | Peça construída imediatamente; animação do foguete atualiza |
| Dois recursos no chão, 1 slot livre | Coleta o primeiro; segundo ignorado se mochila encher |
| Estoque do hub com exatamente o custo de uma peça | Peça construída automaticamente ao retornar da run |
| Jogador descarta recurso errado | Sem desfazer — decisão permanente dentro da run |

---

## 7. Dependencies

| Sistema | Relação |
|---|---|
| **Zona Hordas** | Fonte de Sucata Metálica |
| **Zona Stealth** | Fonte de Componentes de IA |
| **Hub** | Armazena estoque; exibe interface de recursos e progresso do foguete |
| **UX / UI** | Círculo de progresso durante coleta; slots da mochila visíveis durante run |
| **Foguete** | Consome recursos conforme receitas completadas |
| **Ex-Executivo** | Desbloqueia upgrades de capacidade da mochila |
| **Missões de personagens** | Missões "trazer recurso" consomem recursos da mochila ao retornar |

---

## 8. Tuning Knobs

| Parâmetro | Valor Base | Range Seguro | Efeito |
|---|---|---|---|
| `slots_mochila_base` | 3 | 2–4 | Duração e intensidade de cada run |
| `slots_upgrade_1` | 5 | 4–6 | Eficiência após primeiro upgrade |
| `slots_upgrade_2` | 7 | 6–9 | Eficiência máxima no late game |
| `total_recursos_mvp` | 69 | 50–90 | Duração total do arco MVP |
| `recursos_por_zona` | 6–8 por mapa | 4–12 | Densidade de recursos em cada run |

---

## Acceptance Criteria

- [ ] Mochila (slots cheios/vazios) visível e legível durante a run em tela mobile
- [ ] Círculo de progresso aparece imediatamente ao parar sobre recurso
- [ ] Qualquer movimento cancela e reseta o círculo instantaneamente
- [ ] Com mochila cheia, parar sobre recurso não inicia círculo — sem feedback visual, sem prompt
- [ ] Recursos retornam ao estoque do hub apenas se o jogador chegar ao EXIT vivo
- [ ] Morte remove todos os recursos da run sem afetar estoque do hub
- [ ] Peça do foguete construída automaticamente ao atingir custo (sem input extra)
- [ ] Interface do hub mostra: estoque atual, custo da próxima peça, quanto falta
- [ ] Upgrade de mochila do Ex-Executivo refletido imediatamente na próxima run

---

*Relacionado: `design/gdd/game-concept.md`, `design/gdd/mvp-game-brief.md`, `design/gdd/zone-stealth.md`, `design/gdd/hub-and-characters.md`*
