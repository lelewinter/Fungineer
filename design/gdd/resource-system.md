# Sistema de Recursos — Game Design Document

**Version**: 1.0
**Date**: 2026-03-21
**Status**: Draft — Brainstorm Aprovado

---

## 1. Overview

O sistema de recursos conecta as zonas de raid ao foguete no hub. Cada zona dropa
um tipo específico de recurso. O jogador coleta recursos durante runs, os traz de
volta ao hub, e os acumula até ter o suficiente para construir cada peça do foguete.

A tensão central do sistema: **quando sair da zona?** Ficar mais tempo rende mais
recursos, mas aumenta o risco de morrer e perder tudo.

---

## 2. Player Fantasy

Cada recurso na mochila é uma decisão tomada. Você entrou, sobreviveu, escolheu
o momento certo de sair. Ver os recursos sendo depositados no hub e uma nova peça
do foguete aparecendo é a recompensa concreta de ter jogado bem — não de ter tido
sorte.

---

## 3. Detailed Rules

### 3.1 Tipos de Recurso (MVP)

| Recurso | Zona de Origem | Representa |
|---|---|---|
| **Sucata Metálica** | Zona Hordas (Zona 0) | Estrutura física do foguete |
| **Componentes de IA** | Zona Stealth (Zona 1) | Sistemas eletrônicos e navegação |

### 3.1-B Tipos de Recurso (Pós-MVP — Zonas 3–8)

Recursos adicionais desbloqueados conforme o jogador avança para zonas pós-MVP.
Cada recurso representa uma camada de funcionalidade do foguete — o foguete não pode ser completado
sem todos os tipos.

| Recurso | Zona de Origem | Representa no Foguete | Mecânica de Coleta |
|---|---|---|---|
| **Núcleo Lógico** | Zona 3 — Circuito Quebrado | Processador central do sistema de navegação autônoma | 1 por run (alta raridade), coleta após resolver 3 câmaras de puzzle |
| **Combustível Volátil** | Zona 4 — Corrida de Extração | Motor de propulsão — empuxo para vencer a gravidade | Instantâneo ao contato (sem parada de 1.5s) |
| **Sinais de Controle** | Zona 5 — Controle de Campo | Sistema de comunicações e telemetria | Fluxo passivo (não usa slots de mochila) |
| **Biomassa Adaptativa** | Zona 6 — Zona de Infecção | Suporte de vida — filtros, oxigênio, isolamento biológico | Fluxo passivo por nós infectados (não usa slots de mochila) |
| **Fragmentos Estruturais** | Zona 7 — Labirinto Dinâmico | Reforço do casco — vigas e blindagem externa | Padrão 1.5s (usa slots de mochila) |
| **Sucata Metálica + Componentes de IA** | Zona 8 — Zona de Sacrifício | Ambos os recursos base em quantidade premium | Padrão 1.5s com custos por câmara |

**Nota sobre recursos de fluxo (Sinais de Controle e Biomassa Adaptativa):**
Esses recursos não usam o sistema de mochila. Eles são acumulados em um medidor de run separado
e transferidos ao hub ao final da run. O sistema de recursos deve suportar dois tipos de acumulação:
- **Tipo Item**: ocupa slots de mochila (Sucata, Componentes, Núcleos, Combustível, Fragmentos)
- **Tipo Fluxo**: acumulação passiva em medidor (Sinais, Biomassa)

### 3.2 A Mochila

- O jogador carrega uma mochila com **slots limitados** durante cada run
- Capacidade padrão: **3 slots**
- Cada recurso coletado ocupa 1 slot
- A mochila é visível na UI durante a run (slots preenchidos em tempo real)

### 3.3 Coleta por Parada

Para coletar um recurso, o jogador deve **parar completamente sobre ele por 1.5 segundos**.

- Um **círculo de progresso** aparece ao redor do ícone do recurso enquanto o jogador está parado
- Qualquer movimento cancela a coleta e reseta o círculo do zero
- A coleta é sempre intencional — não há coleta acidental por proximidade

**Mochila cheia**: recursos no chão são silenciosamente ignorados. Nenhum prompt, nenhuma interrupção. O jogador vê os slots cheios na UI e sabe que precisa ir ao EXIT.

**Tensão por zona:**
- *Hordas* — parar 1.5s com inimigos se aproximando cria risco de posicionamento real
- *Stealth* — parar elimina ruído de movimento, mas deixa o jogador imóvel durante ciclos de patrulha

### 3.4 Fail State

- Morrer em qualquer zona = **perde todos os recursos da run**
- Recursos acumulados no hub de runs anteriores **não são afetados**
- Retornar ao hub sem morrer = recursos da run vão para o estoque do hub

### 3.5 Estoque do Hub

- Recursos acumulam no hub entre runs (persistência total)
- Sem limite de estoque — o jogador acumula livremente
- O estoque é visível no hub na interface de recursos
- Peças do foguete são construídas automaticamente ao atingir o custo da receita

### 3.6 Upgrade de Mochila

O **Ex-Executivo** pode aumentar a capacidade da mochila conforme confiança cresce:

| Nível | Slots | Custo (confiança) |
|---|---|---|
| Padrão | 3 slots | — |
| Upgrade 1 | 5 slots | Ex-Executivo 40% |
| Upgrade 2 | 7 slots | Ex-Executivo 80% |

---

## 4. Receitas do Foguete (MVP — 8 Peças)

O foguete é construído em 8 etapas sequenciais. Cada peça fica visível no foguete
ao ser completada. Peças devem ser construídas em ordem — não é possível pular.

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
Slots padrão (3): média de 2.5 recursos por run
  69 recursos ÷ 2.5 = ~28 runs para completar
  28 runs × ~2 min = ~56 min de gameplay bruto

Slots upgrade 1 (5): média de 4.0 recursos por run
  69 recursos ÷ 4.0 = ~18 runs para completar
  18 runs × ~2 min = ~36 min de gameplay bruto

Slots upgrade 2 (7): média de 5.5 recursos por run
  69 recursos ÷ 5.5 = ~13 runs para completar
  13 runs × ~2 min = ~26 min de gameplay bruto
```

O upgrade de mochila não torna o jogo "mais fácil" — torna as runs mais eficientes,
recompensando o investimento no relacionamento com o Ex-Executivo.

---

## 5. Formulas

### Pressão de Saída

Não há fórmula de força — a pressão é ambiental (inimigos, risco) e psicológica
(mochila quase cheia, um recurso a mais pode completar uma peça).

### Decisão de Sair — Framework de Valor Esperado (para o jogador raciocinar)

```
valor_esperado_ficar = recursos_coletáveis_restantes × probabilidade_sobreviver
valor_sair_agora = recursos_na_mochila (garantido)

Se valor_esperado_ficar > valor_sair_agora → considerar ficar
Se valor_sair_agora ≥ valor_esperado_ficar → sair

Exemplo:
  Mochila: 2/3 slots preenchidos
  Recursos visíveis no mapa: 3 mais
  Probabilidade subjetiva de sobreviver: 60%
  Valor esperado de ficar: 3 × 0.6 = 1.8 recursos esperados
  Valor de sair agora: 2 recursos garantidos
  → Sair é matematicamente melhor, mas o jogador pode querer arriscar
```

---

## 6. Edge Cases

| Situação | Comportamento |
|---|---|
| Mochila cheia, recurso no chão | Recurso ignorado silenciosamente — sem prompt. Jogador vai ao EXIT. |
| Morre com mochila cheia | Perde tudo — mochila cheia não protege |
| Completa receita de peça mid-hub | Peça é construída imediatamente, animação do foguete atualiza |
| Dois recursos no chão, 1 slot livre | Coleta o primeiro automaticamente; segundo dispara prompt se tentar coletar |
| Estoque do hub com exatamente o custo de uma peça | Peça é construída automaticamente ao retornar da run |
| Jogador descarta recurso errado no prompt | Sem desfazer — decisão é permanente dentro da run |

---

## 7. Dependencies

| Sistema | Relação |
|---|---|
| **Zona Hordas** | Fonte de Sucata Metálica |
| **Zona Stealth** | Fonte de Componentes de IA |
| **Hub** | Armazena estoque; exibe interface de recursos e progresso do foguete |
| **UX / UI** | Círculo de progresso ao redor do recurso durante coleta; slots da mochila visíveis durante a run |
| **Foguete** | Consome recursos do estoque conforme receitas são completadas |
| **Ex-Executivo** | Desbloqueia upgrades de capacidade da mochila |
| **Missões de personagens** | Missões do tipo "trazer recurso" consomem recursos da mochila ao retornar |

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

- [ ] A mochila (slots cheios/vazios) é visível e legível durante a run em tela mobile
- [ ] Círculo de progresso aparece ao redor do recurso imediatamente ao parar sobre ele
- [ ] Qualquer movimento cancela e reseta o círculo instantaneamente
- [ ] Com mochila cheia, parar sobre um recurso não inicia o círculo — sem feedback visual, sem prompt
- [ ] Recursos retornam ao estoque do hub apenas se o jogador chegar ao EXIT vivo
- [ ] Morte remove todos os recursos da run sem afetar o estoque do hub
- [ ] Peça do foguete é construída automaticamente ao atingir o custo (sem input extra)
- [ ] Interface do hub mostra claramente: estoque atual, custo da próxima peça, quanto falta
- [ ] Upgrade de mochila do Ex-Executivo é refletido imediatamente na próxima run

---

*Relacionado: `design/gdd/game-concept.md`, `design/gdd/mvp-game-brief.md`, `design/gdd/zone-stealth.md`, `design/gdd/hub-and-characters.md`*
