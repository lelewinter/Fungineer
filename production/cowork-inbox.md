# Cowork → Claude Code Inbox

> Arquivo de comunicação entre Cowork (Claude no desktop) e Claude Code.

---

## Status
PENDING

## Tarefa

**FIX: WorldMap aparece minúsculo no canto do browser — corrigir stretch mode do projeto.**

**Diagnóstico confirmado visualmente em 2026-03-28:**

O projeto usa `window/stretch/aspect="expand"` em `project.godot`. Com este modo, o canvas cresce para preencher o browser inteiro (2560×911 CSS pixels), mas o WorldMapScene desenha o conteúdo com constantes fixas `VW=480, VH=854`. Resultado: o conteúdo do mapa fica apenas no canto superior esquerdo (480×854 pixels) de um canvas de 2560×911, deixando ~80% da tela preta e inutilizável.

A cena de batalha (Main.tscn) usa Camera2D com arena de 3200×2400 e funciona bem com `expand`. Mas o WorldMap não se adapta ao viewport expandido.

**Solução dupla:**

### Parte 1 — Trocar stretch aspect para `keep_height` em `project.godot`

No arquivo `project.godot`, trocar:
```
window/stretch/aspect="expand"
```
por:
```
window/stretch/aspect="keep_height"
```

Com `keep_height`, o game escala para preencher a altura do browser mantendo o aspect ratio. Em um browser 2560×911, o viewport de jogo será ~511×911 CSS pixels (correto para o WorldMap 480×854).

### Parte 2 — Adaptar WorldMapScene.gd para usar o viewport real

Após trocar o stretch mode, o WorldMap ainda usa `const VW = 480.0` e `const VH = 854.0` hard-coded. Com `keep_height`, o viewport pode ser ligeiramente diferente de 480×854 (pode ser mais largo se o browser for muito largo). Porém, `keep_height` mantém a altura em 854, então VH=854 ainda é correto. A largura pode variar.

Para segurança, no início de `_ready()` em `WorldMapScene.gd`, adicionar:
```gdscript
# Ajusta VW/VH ao viewport real para suportar diferentes tamanhos de tela
var vp_size := get_viewport().get_visible_rect().size
```
E trocar as constantes `VW` e `VH` para variáveis que pegam o valor do viewport:

- Trocar `const VW: float = 480.0` por `var VW: float = 480.0`
- Trocar `const VH: float = 854.0` por `var VH: float = 854.0`
- No início de `_ready()`, antes de `_build_detail_panel()`, adicionar:
```gdscript
VW = get_viewport().get_visible_rect().size.x
VH = get_viewport().get_visible_rect().size.y
```

Isso garante que o WorldMap preenche o viewport disponível independente do stretch mode.

**Cuidado:** As constantes `COL_X`, `COL_W`, `SURFACE_Y`, `FLOOR_H` também usam valores derivados de VW/VH (via cálculos inline em `_draw()`, `_build_detail_panel()`, etc.) — não são constantes separadas que precisam de mudança, pois são calculadas ao longo do código usando VW e VH. Verificar que todas as referências a `VW` e `VH` usam as variáveis (não valores literais 480/854 escondidos no código).

### Verificação esperada

Após o fix, recarregar https://lelewinter.github.io/Fungineer/ deve mostrar o WorldMap preenchendo a maioria da tela do browser, não só um canto.

### Commit esperado

```bash
git add project.godot src/scenes/WorldMapScene.gd
git commit -m "fix: stretch keep_height + viewport-relative WorldMap layout

WorldMap was rendering in only ~20% of the browser window because
expand stretch mode grew the canvas to 2560x911 but WorldMapScene
used hardcoded VW=480/VH=854 constants for all drawing.

Fix: switch to keep_height stretch (fills browser height, black bars
on sides) and read actual viewport size in WorldMapScene._ready() so
the map scales correctly to the available space.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
git push
```

## Resultado
_Aguardando execução._

---

## Protocolo

**Claude Code faz:**
1. Detecta Status: PENDING via hook UserPromptSubmit
2. Executa a tarefa completamente
3. Atualiza Status para DONE
4. Escreve resultado em ## Resultado
5. Faz git add, git commit e git push de tudo que foi modificado

---

## Histórico

- **2026-03-28**: Copiados 9 arquivos zone_*.png para assets/art/zones/ (commit a73afc9). Sistema de background de zonas já presente no código.
- **2026-03-28**: Fix RAIDAR — adicionado `panel.mouse_filter = Control.MOUSE_FILTER_STOP` em `_build_detail_panel()` para evitar propagação de clique para `_unhandled_input` (commit 6af0ab4). Confirmado funcionando: batalha inicia corretamente via JS click em CSS (256, 507).
