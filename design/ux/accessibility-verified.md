---
tags: [fungineer, ux, accessibility, audit]
date: 2026-06-05
tipo: ux-audit
versao: 2.0 — Auditoria Verificada (código-fonte)
---

# Auditoria de Acessibilidade Verificada — Fungineer

**Auditora**: UX Designer (subagente)
**Escopo**: Código real em `frontend/src/` — não hipóteses de design
**Arquivos auditados**:
- `frontend/src/scenes/runs/CircuitoScene.ts`
- `frontend/src/scenes/runs/FieldControlScene.ts`
- `frontend/src/scenes/runs/SacrificeScene.ts`
- `frontend/src/scenes/runs/StealthScene.ts`
- `frontend/src/scenes/runs/InfeccaoScene.ts`
- `frontend/src/scenes/runs/LabirintoScene.ts`
- `frontend/src/scenes/runs/RunFrame.ts`
- `frontend/src/ui/hub/HubRocketPanel.ts`
- `frontend/src/ui/hub/RocketLaunchOverlay.ts`
- `frontend/src/ui/PixiButton.ts`

---

## ERRATA — Falso-Positivo da Rodada 1

O documento `design/ux/onboarding-and-input-flows.md` descreveu a Zona
Circuito como "percorrer fios por cor". Isso estava **errado**.

**CircuitoScene.ts é Snake/Tron, não "fios por cor".**

O código real (CircuitoScene.ts):
- A "cabeça" segue o dedo pelo tabuleiro livre (sem fios)
- Atrás dela cresce um rastro (trail) — igual ao corpo da cobrinha
- O objetivo é coletar "relés" (losangos espalhados) até atingir a meta
- Colisão com o próprio rastro ou com a borda termina a run
- Não existe diagrama de sequência, não existe cor de fio, não existe direção
  de condução

Consequências para a rodada 1:
- O "PROBLEMA CRÍTICO — Zona Circuito" sobre "fios por cor" é um **falso-positivo
  total**. Não existe mecânica de distinção por cor de fio nesta zona.
- A solução obrigatória de "textura de fio (sólido/pontilhado/tracejado)" não
  tem alvo real de implementação. Descartada.
- O item de acessibilidade "Toggle de Modo Daltonismo para texturas de fio"
  **não tem fundamento no código atual**.
- O "Diagrama de sequência na UI" mencionado na seção 4.3 (Circuito) do doc
  anterior não existe no código. Descartado.

---

## Parte 1 — Dependências Reais de Canal Único

### 1.1 Cor como Único Canal de Informação Crítica

#### [REAL] InfeccaoScene — Drones assustados vs normais
**Arquivo**: `frontend/src/scenes/runs/InfeccaoScene.ts`, linhas 433–437

```
scared ? 0x4d7adb : 0xc24d4d
```

Drones **normais** = vermelho `0xc24d4d` (mata o jogador ao encostar).
Drones **assustados** = azul `0x4d7adb` (podem ser comidos pelo jogador).

A distinção entre "me mata" e "posso comer" depende **exclusivamente** de cor.
Ambas as bolhas têm o mesmo tamanho, o mesmo formato circular e a mesma
animação de movimento. Para deuteranopia severa, vermelho e azul permanecem
distinguíveis — este par específico de cores não é o par mais problemático
(vermelho-verde seria). Contudo, para protanopia, o vermelho `0xc24d4d` é
percebido como marrom-acinzentado, enquanto o azul `0x4d7adb` permanece azul.
A distinção ainda existe, mas é muito reduzida.

**Severidade**: ALTA. A informação é crítica (errar = morte instantânea).

**Fix necessário**: adicionar diferença de forma. Drone assustado: hexágono
(usando o `hexPts` já existente no mesmo arquivo, linha 362). Drone normal:
círculo (já é). Forma comunica o estado independentemente de cor.

---

#### [REAL] FieldControlScene — Estados de zona (capturing/captured/contested/losing)
**Arquivo**: `frontend/src/scenes/runs/FieldControlScene.ts`, linhas 515–521

```typescript
case 'neutral':   return { color: 0x59595c, ringW: 3 };
case 'capturing': return { color: 0x4073e6, ringW: 3 };
case 'captured':  return { color: 0x3380f2, ringW: 3 };
case 'contested': return { color: 0xd926e6, ringW: 4 };
case 'losing':    return { color: 0xff1a1a, ringW: 4 };
```

Cinco estados distintos comunicados **somente por cor** da borda do anel.
`capturing` (0x4073e6, azul médio) e `captured` (0x3380f2, azul mais claro)
são **virtualmente indistinguíveis** entre si para qualquer usuário, com ou
sem daltonismo — a diferença de matiz é de apenas ~5° no espectro e a
diferença de luminosidade é pequena.

`contested` (roxo/magenta) e `losing` (vermelho) são distinguíveis para a
maioria dos daltônicos por diferença de luminosidade, mas a semântica
estratégica ("estou perdendo esta zona?") depende de ler a cor corretamente.

Há texto de aviso complementar (`CONTESTADA!` / `DEFENDENDO!`, linha 481–486),
**mas só aparece para estados `losing` e `contested`**. Estados `capturing` e
`captured` não têm label de texto. O HUD mostra `[held/6]` (linha 436),
que informa quantas zonas foram capturadas, mas não diferencia
`capturing` de `captured` por zona individualmente.

**Severidade**: MÉDIA. A barra de progresso em arco (linhas 459–461) comunica
quanto falta para capturar, o que é o mais urgente. Mas `capturing` vs
`captured` sem textura ou ícone complementar é falha real.

**Fix necessário**: adicionar ícone de antena diferenciado para estado
`captured` (a antena já existe no código, linhas 463–469 — quando `lit`, pode
ganhar um símbolo de check ou um segundo dot acima). O ringW variável para
`contested` e `losing` já é um diferencial não-cor, mas é sutil.

---

#### [REAL] SacrificeScene — Tipo de custo de câmara por cor de borda
**Arquivo**: `frontend/src/scenes/runs/SacrificeScene.ts`, linhas 754–762

```typescript
case 'none':  return 0x4dff4d;  // verde
case 'timer': return 0xe6c633;  // amarelo
case 'enemy': return 0xe63333;  // vermelho
case 'slot':  return 0x9933e6;  // roxo
case 'chain': return 0xe68019;  // laranja
```

O tipo de custo (informação estratégica crítica — decidir se entro ou não na
câmara) é comunicado **somente pela cor da borda** da câmara.

Mitigação parcial real presente: existe `costLabel` em texto por câmara
(linha 670–678), renderizado como Text no `labelLayer`. Exemplos: "SEM CUSTO",
"-15s", "×3 Inimigos", "-1 Slot", "CADEIA".

**Conclusão**: o rótulo de texto torna isto um problema de reforço (cor +
texto), não de canal único puro. A cor da borda é redundante ao texto. **Falso
positivo parcial da rodada 1** — o documento anterior classificou isso como
crítico, mas o texto de custo já resolve o requisito principal. O que falta
é que o texto tem `fontSize: 10` (linha 673), abaixo do mínimo recomendado
de 14px.

**Fix necessário**: aumentar `fontSize` do `costLabel` de 10 para 14px.
A cor continua como reforço visual útil.

---

#### [REAL] RunFrame — Barra de saúde muda de cor abaixo de 40%
**Arquivo**: `frontend/src/scenes/runs/RunFrame.ts`, linhas 185–190

```typescript
healthFg.rect(...).fill({ color: pct > 0.4 ? accent : 0xe05050, alpha: 0.98 });
```

A barra de saúde muda de cor de `accent` (variável por zona) para vermelho
`0xe05050` quando o HP cai abaixo de 40%.

Mitigação parcial real: a própria **largura da barra** (que diminui) é uma
informação não-cor. O HUD também tem labels de texto com valor numérico de HP
nas cenas que usam seu próprio HUD (SacrificeScene, FieldControlScene). As
cenas que usam RunFrame.buildHud têm `setHealth` com percentual, não valor
absoluto, e nenhum texto de HP separado.

**Severidade**: BAIXA. A largura da barra é canal independente suficiente para
o threshold. A mudança de cor é reforço adicional útil mas não o único canal.
**Falso positivo da rodada 1** se classificado como crítico. Não requer fix
urgente; adicionar um ícone de alerta (!) seria suficiente como reforço não-cor.

---

#### [DESCARTADO] CircuitoScene — cor do rastro
O rastro usa `accent` da zona (cor única, sem variação semântica entre
segmentos). Não há diferenciação de informação por cor no rastro — ele tem um
gradiente de opacidade (0.4 a 0.8) que indica proximidade à cabeça, mas isso
comunica distância, não um estado crítico binário. **Sem problema de
acessibilidade**.

---

### 1.2 Som como Único Canal de Informação Crítica

**Resultado**: nenhuma cena auditada usa som como **único** canal para
informação crítica de gameplay. O `audioManager.playSfx` aparece para:
- Coleta de powerup na InfeccaoScene (linha 276) — reforço de evento visual
- Clique de botão no PixiButton — reforço de evento visual

O `RunJuice` emite sons de alerta (`alarm`, `victoryFx`, `defeatFx`) mas todos
são acompanhados de sobreposição visual (overlay de fim de run, flash de tela).

**Nenhuma dependência exclusiva de áudio identificada no código auditado.**

---

### 1.3 Timing como Único Canal de Informação Crítica

**LabirintoScene**: fase Sokoban — sem timer de pulsação de parede (o "pulsing
wall warning" da rodada 1 não foi encontrado no código). A fase é de
quebra-cabeça com timer global. A preocupação com 3 Hz é válida para o design
proposto mas **não existe implementação atual** para auditar. Não é falso
positivo — é especificação pendente para quando a câmara selante for
implementada.

---

## Parte 2 — Fluxo de Fim de Jogo: Auditoria dos Três Arquivos

### 2.1 RocketLaunchOverlay.ts
**Caminho real**: `frontend/src/ui/hub/RocketLaunchOverlay.ts`

**Botão "Novo Ciclo"**:
- Dimensões: `width: 160, height: 40` (linha 96–99)
- Posição: `launch.x = -80; launch.y = halfH - padding - 40` (relativo ao
  centro do painel de 340×420)
- Area de toque efetiva: 160×40px — **abaixo do mínimo recomendado de 44px
  de altura** por apenas 4px. Está no limite.
- O botão está em modal centralizado na tela — não está em zona de difícil
  alcance pelo polegar. **Sem risco severo de posição**.

**Legibilidade**:
- Título "DECOLAGEM": `fontSize: 26` — aprovado.
- Frase do Dr. Myco: `fontSize: 11` — abaixo do mínimo de 14px.
- Resumo estatístico: `fontSize: 13` — abaixo do mínimo de 14px.
- Botão label: `fontSize: 15` (padrão de PixiButton) — aprovado.

**Problema de emoji**: o glifo `🚀` na linha 54 é renderizado como emoji pelo
sistema operacional. Em alguns dispositivos Android o suporte a emoji em canvas
PixiJS pode falhar ou renderizar como caixa vazia. Risco de conteúdo crítico
(é o elemento visual central da cena de vitória) depender de suporte a emoji
do SO.

**Animação de flickering do foguete** (linhas 40–41): `alpha = 0.7 + 0.3 *
Math.abs(Math.sin(elapsed * 0.006))`. A frequência é `0.006 * 1000ms /
(2*pi) ≈ 0.95 Hz` — abaixo de 3 Hz, seguro para fotossensibilidade.

---

### 2.2 HubRocketPanel.ts — Botão LANÇAR
**Caminho real**: `frontend/src/ui/hub/HubRocketPanel.ts`

**Botão LANÇAR** (condicional — só aparece quando `isRocketComplete()`):
- Dimensões: `width: 150, height: 34` (linha 139–148)
- Altura de 34px está **abaixo do mínimo de 44px** — problema real.
- Posição: `launch.x = -75; launch.y = halfH - padding - 70`. O painel tem
  `panelH = 480`, então `halfH = 240`. Posição Y absoluta na tela: centro do
  painel (VH/2 = 427) + (240 - 16 - 70) = 427 + 154 = ~581px de cima.
  Com a tela de 854px de altura, isso coloca o botão em ~68% da tela — zona de
  acesso confortável ao polegar. **Posição OK**.
- Botão "Fechar": `width: 100, height: 28` — **28px está abaixo do mínimo de
  44px** (linha 155–162). Como é ação secundária, risco menor, mas ainda
  problemático.

**Legibilidade das anotações do foguete**:
- Labels das peças: `fontSize: 9` (linhas 309, 326) — **muito abaixo do
  mínimo de 14px**. As anotações são informação de progresso crítica (qual
  peça construir a seguir). O prefixo `▸` para "próxima peça" é canal
  não-cor, o que é positivo, mas o tamanho é ilegível.
- Status de progresso: `fontSize: 10` (linha 130) — abaixo do mínimo.
- Header "CASULO BIOLÓGICO": `fontSize: 15` — aprovado.
- Linha de solda pulsante: `dashPulse = 0.4 + 0.6 * Math.abs(Math.sin(elapsed
  * 0.006))`. Mesma frequência ~0.95 Hz — seguro.

**Distinção de estados das peças (construída/próxima/futura)**: usa cor
(purple/cyan/gray) + prefixo textual (✓ / ▸ / espaço). Duplo canal — sem
problema de daltonismo crítico aqui. A distinção de cor entre construído
(roxo) e próximo (ciano) é legível para deuteranopia (são cores distinguíveis).

---

### 2.3 FieldControlScene.ts — Botão SAIR
**Caminho real**: `frontend/src/scenes/runs/FieldControlScene.ts`

**Botão SAIR** (linha 226–234):
```typescript
const quitBtn = new Text({ text: '✕ SAIR', style: { fontSize: 13, ... }});
quitBtn.hitArea = new Rectangle(-quitBtn.width - 16, -10, quitBtn.width + 32, quitBtn.height + 20);
```

- O texto base tem `fontSize: 13` e âncora `(1, 0)` — posição `x = VW - 10,
  y = 15`. Ocupa o canto superior direito da tela.
- O `hitArea` padded tem altura de `quitBtn.height + 20`. Altura do texto de
  13px é ~16px de pixels CSS; com padding: ~36px — **ainda abaixo de 44px**.
- Posição em `y = 15` com hitArea começando em `y = 15 - 10 = 5px` do topo.
  O canto superior direito é a **zona mais difícil de alcançar** com polegar
  direito em portrait 480×854. Combinado com área de toque marginal, este é o
  maior risco de touch target no fluxo de fim de jogo.

**Comparação com RunFrame.buildHud**: o botão quit do RunFrame usa PixiButton
com `width: 28, height: 28` (linhas 108–115) — também abaixo do mínimo, mas
tem confirmação modal antes de executar a ação (proteção contra acidente). O
botão SAIR do FieldControlScene chama `endRun(false)` **diretamente** sem
confirmação (linha 233). Isso é um risco adicional de UX além do tamanho.

**Nota positiva**: o comentário no código menciona "~60px wide" (linha 232),
mas o hitArea calculado não atinge essa largura de forma consistente para todos
os tamanhos de texto renderizado — depende do valor de `quitBtn.width` que é
calculado em runtime pelo PixiJS.

---

## Parte 3 — Top-5 Fixes Reais Priorizados

**Prioridade baseada em**: severidade de bloqueio para jogadores com deficiência
+ facilidade de implementação.

---

### FIX 1 — ALTA PRIORIDADE
**InfeccaoScene: Drones assustados vs normais — adicionar diferenciação de forma**

Arquivo: `frontend/src/scenes/runs/InfeccaoScene.ts`, linhas 433–438.

Problema real: "me mata" vs "posso comer" comunicado apenas por cor.
Os drones assustados têm `scared > 0` — condição booleana disponível.
A função `hexPts` já existe no arquivo (linha 362).

Fix: desenhar drone normal como círculo (atual), drone assustado como hexágono
usando `hexPts`. Nenhuma nova infraestrutura necessária.

Impacto de daltonismo: resolve protanopia severa. A forma é canal
completamente independente de cor.

---

### FIX 2 — ALTA PRIORIDADE
**HubRocketPanel: Tamanho de fonte das anotações — ilegível no mobile**

Arquivo: `frontend/src/ui/hub/HubRocketPanel.ts`, linhas 309 e 326.

Problema real: `fontSize: 9` para as labels de peça do foguete — a informação
de "qual peça construir a seguir" é a informação de meta central do jogo. A
9px é ilegível em dispositivos com alta densidade de pixels físicos (3x), onde
9 CSS pixels = 27 pixels físicos — abaixo de qualquer threshold de
legibilidade.

Fix: aumentar para `fontSize: 14`. Verificar com ui-programmer se as labels
cabem na largura da anotação (`wordWrapWidth: 70` na linha 329). Se não
couberem, reduzir para 11px e aumentar `wordWrapWidth` para 90.

Status line (linha 130): aumentar de `fontSize: 10` para `fontSize: 13`.

---

### FIX 3 — ALTA PRIORIDADE
**FieldControlScene: Botão SAIR — touch target insuficiente e sem confirmação**

Arquivo: `frontend/src/scenes/runs/FieldControlScene.ts`, linhas 226–234.

Problema 1: touch target efetivo ~36px de altura contra mínimo de 44px.
Problema 2: ação executada diretamente (sem modal de confirmação), ao contrário
do padrão do RunFrame (que tem confirmação). Um toque acidental encerra a run
como derrota sem possibilidade de cancelar.

Fix parte A: substituir o `Text` raw por um `PixiButton` com `height: 44`
(consistente com o padrão do jogo).
Fix parte B: reutilizar `showQuitConfirm()` de RunFrame — ou extrair como
função utilitária compartilhada — antes de chamar `endRun(false)`.

---

### FIX 4 — MÉDIA PRIORIDADE
**HubRocketPanel e RocketLaunchOverlay: botões abaixo do mínimo de altura**

Arquivos:
- `HubRocketPanel.ts` linha 138: botão LANÇAR com `height: 34`
- `HubRocketPanel.ts` linha 156: botão Fechar com `height: 28`
- `RocketLaunchOverlay.ts` linha 96: botão "Novo Ciclo" com `height: 40`

Fix: aumentar todos para `height: 44`. Verificar com ui-programmer se o layout
do painel absorve o aumento sem overflow (o painel tem `panelH = 480`, há
espaço).

---

### FIX 5 — MÉDIA PRIORIDADE
**SacrificeScene: tamanho de fonte do costLabel**

Arquivo: `frontend/src/scenes/runs/SacrificeScene.ts`, linha 673.

O `costLabel` (que informa o custo de entrar na câmara — informação de
decisão estratégica) usa `fontSize: 10`. O rótulo de recursos (`resLbl`) usa
`fontSize: 9` (linha 662).

Fix: aumentar `costLabel` para `fontSize: 14`. Aumentar `resLbl` para
`fontSize: 11`. Estes são os textos mais importantes dentro das câmaras.

---

## Checklist de Acessibilidade — Estado Real vs Alvo

| Critério | Estado Real (pós-auditoria de código) | Alvo |
|----------|--------------------------------------|------|
| Usável com uma mão (polegar) | Parcial — botão SAIR de FieldControl no canto superior direito | SAIR migrado para PixiButton com confirmação |
| Sem dependência exclusiva de cor | Falha em InfeccaoScene (drones); Ok em SacrificeScene (tem texto) | Adicionar forma a drones assustados |
| Área de toque mínima 44px | Falha em LANÇAR (34px), Fechar (28px), SAIR (~36px efetivo) | Todos os botões ≥44px de altura |
| Texto legível ≥14px | Falha em anotações foguete (9px), status foguete (10px), costLabel (10px), flavor text (11px) | Auditoria completa com 14px como floor |
| Sem pisca problemática | Seguro — todas as animações auditadas < 1 Hz | Manter ao implementar novas animações |
| Subtítulo para áudio informativo | Não aplicável — nenhum áudio informativo sem visual | Requisito para futuras vozes/anúncios |
| Sem dependência de emoji do SO | Risco em RocketLaunchOverlay (`🚀` como elemento central) | Substituir por sprite ou glifo de fonte |
| Confirmação para ações destrutivas | Falha — FieldControlScene.SAIR sem confirmação | Adicionar modal de confirmação |

---

## Falsos Positivos da Rodada 1 — Resumo

| Item da Rodada 1 | Status |
|-----------------|--------|
| Circuito: "fios por cor" como PROBLEMA CRÍTICO | FALSO POSITIVO TOTAL — mecânica não existe |
| Circuito: "textura de fio" como fix obrigatório | FALSO POSITIVO — sem alvo de implementação |
| Circuito: "diagrama de sequência sempre visível" | FALSO POSITIVO — não existe no código |
| Sacrifício: "bordas coloridas por tipo de custo sem texto" | FALSO POSITIVO PARCIAL — texto de custo existe, problema real é tamanho de fonte |
| Barra de saúde muda de cor: PROBLEMA CRÍTICO | FALSO POSITIVO — a largura da barra é canal independente suficiente |
| Parede Labirinto pulsante a 3 Hz: risco confirmado | PENDENTE — não implementado ainda; risco é do design proposto, não do código atual |

---

*Coordena com*: ui-programmer para fixes de botões e tamanhos; art-director
para aprovação da forma hexagonal de drone assustado.

*Relacionado*: `design/ux/onboarding-and-input-flows.md` (errata na seção
sobre Circuito e Sacrifício), `frontend/src/scenes/runs/InfeccaoScene.ts`,
`frontend/src/ui/hub/HubRocketPanel.ts`
