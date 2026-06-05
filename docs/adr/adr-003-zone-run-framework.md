---
tags: [fungineer, arquitetura, adr, decisao, zonas, runs, performance]
date: 2026-06-05
tipo: adr
---

# ADR-003: Framework Compartilhado de Zonas / Runs

**Date**: 2026-06-05
**Status**: Accepted
**Deciders**: Technical Director
**Relacionado**: [ADR-002](./adr-002-web-port.md), [adr-pwa](../architecture/adr-pwa.md)

> **Premissas (subagente não-interativo).** Decisões tomadas com defaults
> documentados onde havia ambiguidade. Marcadas com **[premissa]** ao longo do
> texto. Nenhuma decisão de design/criativa é feita aqui — apenas a moldura
> técnica que sustenta as 11+ zonas.

---

## Context

O jogo tem 11 zonas "só-movimento" (`frontend/src/state/Zones.ts`, `ZONES[]`)
mais a baia do foguete. Hoje **cada zona é uma classe própria que `extends
Scene`** (`frontend/src/core/Scene.ts`) e implementa seu próprio
`enter()/update()/exit()`. Inspeção do código real revela um contrato *de
facto* já convergente, mas **não formalizado e parcialmente divergente**:

### O que já está padronizado (de facto)

- **Lifecycle** vem de `Scene` (base): `bind(app)` → `enter()` →
  `update(dt em segundos)` por frame → `exit()`. O `SceneManager`
  (`frontend/src/core/SceneManager.ts`) já gerencia fade, troca, `ticker.add`,
  `destroy({children:true})` e um lock `busy` contra trocas reentrantes.
- **HUD compartilhado**: `RunFrame.ts` (`buildHud(zone)`, `buildEndOverlay`,
  `bindDrag`) é importado por **9 das 11 zonas** (Hordas, Stealth, Circuito,
  Extração, Infecção, Labirinto, Torres, Catedral, Cordilheira). O HUD já provê
  timer, score, status, barra de vida e o botão "desistir" com confirmação.
- **Input de movimento abstraído**: `bindDrag(canvas, world, initial)` converte
  pointer/touch em coordenadas de cena. Hordas e Circuito constroem um joystick
  flutuante por cima. Como o único input é mover, `DragInput` (`{pos, dragging,
  cleanup}`) é a primitiva universal correta.
- **Win/Lose + entrega ao hub**: todas as zonas (exceto Sacrifice) chamam
  `HubState.depositFlow(<key>, n)` no sucesso, depois
  `HubState.onRunEnded(victory)` (`frontend/src/state/HubState.ts`), e adicionam
  `buildEndOverlay(...)`. Quase todas declaram `private ended = false` como
  guarda de idempotência e capam o delta com `const d = Math.min(dt, 1/30)`.

### Divergências reais observadas (a dívida que este ADR ataca)

1. **Dois HUDs paralelos.** `FieldControlScene` e `SacrificeScene` definem seu
   próprio `private buildHud()` em vez de usar `RunFrame.buildHud`. Botão de
   desistir, estilo e shadow divergem.
2. **`SacrificeScene` não chama `depositFlow`** — só `onRunEnded`. A entrega de
   recursos pode estar quebrada/incompleta nessa zona.
3. **Chave de recurso hardcoded por cena.** Cada `end()` chama
   `depositFlow('biomassa_adaptativa' | 'nucleo_logico' | 'scrap' | ...)` com a
   `ResourceKey` literal embutida na lógica. `ZoneData` (`Zones.ts`) só tem um
   campo `resource` *de display* (`'Biomassa'`), **não** a `ResourceKey`. Isso
   viola a convenção do projeto (valores de gameplay em dados, não hardcoded) e
   é a maior fonte de divergência ao escalar para 11+ zonas.
4. **`RunWorld` existe mas a zona-carro-chefe não usa.**
   `frontend/src/run/RunWorld.ts` é um container de entidades rico (layers,
   spatial queries, projéteis), porém `HordasScene` — a zona mais completa —
   gerencia seus próprios arrays + camadas `Graphics` e ignora `RunWorld`.
   Temos duas filosofias de mundo concorrendo.
5. **Boilerplate repetido** em cada cena: cópia de `ZONE = ZONES[n]`, `ended`,
   cap de delta, sequência `deposit → onRunEnded → overlay`, fim por timeout vs.
   morte. ~11 reimplementações do mesmo fluxo.
6. **Renderização imediata pesada.** Quase tudo é `Graphics.clear()` + redesenho
   total por frame (ver `HordasScene.draw()`, ~130 linhas/frame). Funciona, mas
   é o teto de performance ao adicionar zonas mais densas.

Sem um contrato formal, a 11ª–15ª zona vai multiplicar essas divergências.

---

## Decision

Formalizar um **Zone/Run Framework de adoção incremental**, construído *sobre* o
que já existe (`Scene`, `SceneManager`, `RunFrame`, `HubState`) — sem reescrever
zonas funcionando. Quatro partes:

### (1) Contrato comum de Zona/Run

Introduzir uma classe base fina `RunScene` (proposta:
`frontend/src/scenes/runs/RunScene.ts`) que `extends Scene` e codifica o fluxo
hoje copiado à mão. Zonas passam a `extends RunScene` em vez de `Scene`.

```text
RunScene extends Scene
  // dados
  readonly zone: ZoneData            // injetado no construtor (substitui ZONES[n] hardcoded)

  // lifecycle (Scene): enter() / update(dt) / exit()  — inalterado
  // o framework provê os ganchos abaixo, a zona implementa o miolo

  protected abstract buildRun(): void        // a zona constrói seu mundo (chamado por enter)
  protected abstract stepRun(d: number): void // a zona avança 1 frame com delta JÁ CAPADO
  protected abstract teardownRun(): void      // libera listeners da zona

  // input de movimento (único input do jogo) — abstraído
  protected drag: DragInput                   // bindDrag já ligado/limpo pelo framework
  protected get move(): MoveIntent            // {dir:{x,y}, magnitude 0..1, active}
                                              // joystick flutuante derivado do drag,
                                              // unificando Hordas/Circuito

  // win/lose + entrega ao hub (idempotente, um único caminho)
  protected win(reward: ZoneReward): void     // deposita + onRunEnded(true) + overlay
  protected lose(failLabel?: string): void    // onRunEnded(false) + overlay
  // ambos respeitam um único `ended` interno; chamadas repetidas são no-op
```

**Contrato de lifecycle (normativo):**

| Fase | Responsável | Garantia |
|---|---|---|
| `enter()` | framework | monta HUD (`buildHud(zone)`), liga `bindDrag`, toca música da zona, chama `buildRun()` |
| `update(dt)` | framework | capa `d = min(dt, 1/30)`, atualiza juice, retorna cedo se `ended`/pausado, chama `stepRun(d)` |
| `win/lose` | framework | exatamente-uma-vez; faz entrega ao hub; mostra overlay; toca FX vitória/derrota |
| `exit()` | framework | para música, `drag.cleanup()`, `juice.destroy()`, chama `teardownRun()` |

**Input de movimento (normativo):** o único input é mover. A primitiva é
`DragInput` (`RunFrame.bindDrag`). O framework expõe um `MoveIntent` derivado
(direção normalizada + magnitude 0..1 com dead-zone/clamp configuráveis via
`GameConfig`), de modo que zonas com joystick flutuante (Hordas, Circuito) e
zonas de arrasto-direto (Stealth) consumam a mesma abstração. **[premissa]** o
joystick flutuante vira o default por já ser o padrão dominante.

**Win/lose + entrega ao hub (normativo):** zonas **nunca** chamam
`depositFlow`/`onRunEnded` diretamente. Chamam `this.win({...})` /
`this.lose()`. O framework resolve a `ResourceKey` a partir de `ZoneData`
(ver parte 2) e garante idempotência via `ended`. Isso corrige de uma vez a
divergência do Sacrifice (sem deposit) e os dois HUDs paralelos
(Field/Sacrifice migram para `RunFrame.buildHud`).

### (2) Onde dados vs. lógica devem viver (escalar p/ 11+ zonas)

**Princípio:** *o que difere entre zonas é dado; o que se repete é framework.*

| Categoria | Onde vive | Por quê |
|---|---|---|
| Identidade da zona (nome, accent, música, arte, **`resource_key`**) | `Zones.ts` (`ZoneData`) — estender com `resource_key: ResourceKey` | hoje a `ResourceKey` está hardcoded em cada `end()`; mover para dado elimina a divergência nº 3 |
| Constantes numéricas de gameplay por zona | `GameConfig.ts` (já é o caso: blocos `STEALTH_*`, `CIRCUIT_*`, `INFECTION_*`...) | convenção do projeto; tuning sem mexer em lógica |
| Tabelas grandes/estruturadas (waves, ofertas de upgrade, layouts) | `assets/data/*.json` carregado via `AssetLoader` | dados volumosos não pertencem ao bundle de código; permite hot-tune |
| Fluxo de run (lifecycle, deposit, overlay, input) | `RunScene` (framework) | invariante entre zonas |
| Chrome de UI (HUD, end overlay, confirm) | `RunFrame.ts` (já existe) | fonte única de verdade visual |
| Game-feel (partículas, shake, flash) | `run/fx/RunJuice` (já existe) | já é drop-in |
| Mundo de entidades + queries espaciais | `run/RunWorld.ts` | **[premissa]** adoção recomendada porém **opcional**: zonas densas de enxame (Hordas, Infecção) devem migrar para `RunWorld` p/ herdar o spatial-hash; zonas leves (Circuito, Labirinto) podem permanecer com estado próprio |

**Regra de escala:** adicionar a zona nº 12 deve significar: (a) 1 entrada em
`ZONES[]` com `resource_key`, (b) opcionalmente 1 bloco em `GameConfig` e/ou 1
JSON em `assets/data/`, (c) 1 classe `extends RunScene` com 3 métodos. **Zero**
toque em deposit/HUD/lifecycle.

### (3) Orçamento de Performance (PWA mobile)

Alvo: smartphone mid-range (Android Moto-G-class, iPhone SE), portrait
480×854 lógico, render a `min(DPR, 1.5)` (já fixado em `App.ts`), CRT
full-screen ligado, ticker capado a 60fps (`App.ts`: `ticker.maxFPS = 60`).

| Métrica | Budget | Fonte / racional |
|---|---|---|
| **Frame time (alvo)** | **16.6 ms @ 60fps**; piso aceitável 30fps em mid-range frio | `App.ts` já capa 60; CRT roda todo frame |
| **Frame budget de gameplay** | **≤ 8 ms** para `stepRun + draw`; resto para CRT/composição | deixa folga p/ o shader e GC |
| **Draw calls** | **≤ 60/frame** | manter batching; cada `Graphics` redesenhado é 1+ draw — Hordas usa ~10 camadas Graphics |
| **Sprites/Graphics ativos** | **≤ 400 nós visíveis**; cap de inimigos já = `ENEMY_CAP 110` (Hordas) | enxames são o pior caso |
| **Memória JS heap** | **≤ 200 MB** em uso; alocação por-frame ≈ 0 em estado estável | Hordas já faz pooling (`projPool`, `gemPool`, `bucketPool`) — tornar isso padrão |
| **Memória de textura GPU** | **≤ 128 MB** residente | atlas único por zona; descarregar texturas da zona anterior no `exit()` |
| **Atlas de textura** | **≤ 2048×2048** por atlas; 1 atlas/zona **[premissa]** | limite seguro p/ GPUs mobile antigas |
| **Tempo de carga de zona** | **≤ 800 ms** do tap ao jogável (fade de 220ms cobre parte) | `SceneManager.replace` já tem fade |
| **Tamanho de transfer inicial (PWA)** | **≤ 5 MB** JS+CSS comprimido p/ shell jogável; assets lazy | crítico p/ 1ª abertura mobile |
| **Áudio** | converter WAV→OGG/MP3 antes de prod; cache LRU ≤ 40 (já em adr-pwa) | herdado de ADR-002 |
| **Long tasks** | nenhum frame > 50 ms; sem `Assets.load` síncrono no `update` | evita jank/ANR |

**Política de asset loading (normativa):**
- **Preload do shell** (boot): só o necessário p/ Hub + fontes. Nada de zonas.
- **Preload da zona** no `enter()` via `assets.preload([...])` *antes* de
  `buildRun()` — o fade do `SceneManager` mascara a latência.
- **Lazy/on-demand** para arte de zona pesada (`AssetLoader.texture` já cacheia).
- **Descarregar** texturas exclusivas da zona no `exit()` p/ respeitar o budget
  de GPU (hoje não há unload — risco listado abaixo).
- **JSON de dados** (`assets/data/`) carregado no `enter()` da zona, não no boot.

### (4) Registro de Risco Técnico — TOP 5

| # | Risco | Prob. | Impacto | Mitigação |
|---|---|---|---|---|
| **R1** | **Divergência de contrato ao escalar.** Field/Sacrifice já fogem do HUD compartilhado; Sacrifice não deposita recurso. Sem base comum, cada zona nova vira um floco de neve. | Alta | Alto (bugs de economia + UI inconsistente) | `RunScene` base + `resource_key` em `ZoneData`; migrar as 2 zonas divergentes; lint/review barrando `depositFlow` direto fora do framework |
| **R2** | **Teto de performance da render imediata.** `Graphics.clear()`+redesenho total por frame em zonas de enxame (Hordas: ~130 linhas de draw/frame, cap 110 inimigos). Zonas futuras mais densas estouram o budget de 8ms/draw-calls em mid-range. | Média | Alto (queda p/ <30fps, aquecimento) | Budget formalizado (acima); profiling obrigatório por zona; migrar enxames p/ `RunWorld` + sprites em batch quando exceder; manter pooling como padrão |
| **R3** | **Sem unload de textura entre zonas.** `AssetLoader` só cacheia (`resolved` Map cresce monotonicamente); nada descarrega no `exit()`. Trocar muitas zonas numa sessão escala a memória de GPU até crash em iOS Safari. | Média | Alto (OOM/crash de aba) | `exit()` do framework chama unload das texturas exclusivas da zona; budget de 128MB GPU; teste de "tour das 11 zonas" no CI manual |
| **R4** | **`ResourceKey` hardcoded desacoplada de `ZoneData`.** A entrega ao hub depende de literais espalhados pelos `end()`. Renomear/rebalancear recursos exige caçar 11 call-sites; fácil errar a chave (deposita no balde errado, silenciosamente). | Alta | Médio (economia silenciosamente quebrada) | Mover `resource_key` p/ `ZoneData`; `win()` resolve a partir do dado; remover literais das cenas |
| **R5** | **Acoplamento de input ao layout do canvas/DPR.** `bindDrag` resolve coords via `getBoundingClientRect` + `world.x/scale` manualmente; `App.fit()` muda escala entre portrait (stretch) e landscape (letterbox). Mudanças de viewport (URL bar mobile, rotação) podem dessincronizar input do mundo. | Média | Médio (toques "errando" o alvo) | Centralizar conversão tela→mundo numa única função testável; testar em rotação + visualViewport; cobrir com asserts de roundtrip |

Riscos secundários monitorados (fora do top 5): cap de 25MB/arquivo do
Cloudflare Pages p/ WAVs (herdado de ADR-002); throttling de PWA em background
no iOS; `RunWorld` vs. estado-próprio criando duas filosofias se a adoção não
for guiada.

---

## Consequences

### Positivas
- Adicionar a 12ª–15ª zona vira trabalho de dados + 1 classe de 3 métodos.
- Uma única fonte de verdade p/ HUD, entrega ao hub e lifecycle elimina as
  divergências reais já existentes (Field/Sacrifice/Sacrifice-deposit).
- Budgets de performance explícitos dão critério objetivo de aceite por zona.
- Política de asset loading + unload protege contra o crash de memória de GPU.

### Negativas / Trade-offs
- **Migração incremental** de 11 cenas existentes (esforço real, ainda que cada
  uma seja mecânica). **[premissa]** migrar primeiro as 2 divergentes
  (Field/Sacrifice) e a carro-chefe (Hordas); o resto conforme tocado.
- `RunScene` adiciona uma camada de indireção sobre `Scene`. Mantida fina de
  propósito (só o fluxo invariante), para não virar um framework-dentro-do-jogo.
- Adoção opcional de `RunWorld` mantém duas filosofias coexistindo no curto
  prazo (aceito conscientemente; R2/risco-secundário cobre isso).

## Performance Implications
- Nenhuma regressão esperada: o framework encapsula código que já roda. O cap de
  delta, o pooling e o `min(DPR,1.5)` viram padrão herdado em vez de copiados.
- O unload de textura no `exit()` é a única mudança com efeito mensurável
  imediato (reduz memória de GPU residente entre runs).

## Alternatives Considered
1. **Manter status quo (cada zona = `Scene` própria).** Rejeitado: as
   divergências já existem com 11 zonas; escalam linearmente.
2. **ECS completo (entidades/componentes/sistemas genéricos).** Rejeitado:
   over-engineering p/ runs de 90–150s com input único; `RunWorld` + pooling já
   cobrem o pior caso (enxame) sem o custo de manutenção de um ECS.
3. **Forçar todas as zonas para `RunWorld` agora.** Rejeitado: reescrita grande
   de zonas funcionando, sem ganho p/ zonas leves; adoção é opcional e guiada
   por budget.
4. **Mover lifecycle p/ o `SceneManager` (em vez de uma base `RunScene`).**
   Rejeitado: `SceneManager` é genérico (Hub, Start, Boot também o usam);
   sobrecarregá-lo com semântica de "run" vazaria conceitos. `RunScene` isola
   o que é específico de zona.

## Review
Revisitar se: uma zona exigir input além de mover (quebra a premissa central);
o budget de 60fps não for atingível em mid-range mesmo após migração de render;
ou o número de zonas passar de ~15 (avaliar geração data-driven de zonas).
