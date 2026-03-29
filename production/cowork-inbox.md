# Cowork → Claude Code Inbox

> Arquivo de comunicação entre Cowork (Claude no desktop) e Claude Code.

---

## Status
DONE

## Tarefa

**BUG CRÍTICO: Clicar RAIDAR não entra nas zonas de batalha.**

Observação no browser: clicar RAIDAR fecha o painel mas permanece no WorldMap. Nenhuma mensagem `print("[Main]...")` aparece no console do browser, indicando que `_start_raid()` retorna cedo (linha `if _selected_zone.is_empty(): return`).

**Causa raiz provável:**

O `ColorRect` do painel de detalhes usa `MOUSE_FILTER_IGNORE` por padrão. Isso permite que o clique passe pelo painel até `_unhandled_input`. Na função `_unhandled_input`, o `tap_pos` em coordenadas do jogo (game space) cai dentro do rect da zona CAMPO (floor=1, col=0) — que é exatamente onde o botão RAIDAR aparece visualmente. Isso faz `_show_detail(campo)` substituir `_selected_zone` antes que o signal `pressed` do Button dispare.

**Cálculo que confirma o overlap:**
- Panel em game coords: posição (70, 307), tamanho (340, 240)
- VBox começa em (86, 323); botão RAIDAR estimado em y≈458–494 em game coords
- CAMPO inner rect: (16, 330) a (149, 564)  ← contém os pontos x=86–149, y=458–494 do botão RAIDAR ✓

**O que fazer:**

### Fix 1 — Bloquear clicks no painel com `mouse_filter`

Em `src/scenes/WorldMapScene.gd`, na função `_build_detail_panel()`, logo após criar o `panel` (ColorRect), adiciona:

```gdscript
panel.mouse_filter = Control.MOUSE_FILTER_STOP
```

Isso faz o painel consumir os eventos de clique, impedindo que cheguem ao `_unhandled_input`.

Localização no arquivo (git HEAD, ~linha 546):
```gdscript
var panel := ColorRect.new()
panel.color = Color(0.07, 0.06, 0.05, 0.97)
panel.size = Vector2(340, 240)
panel.position = Vector2(VW * 0.5 - 170, VH * 0.5 - 120)
# ADICIONAR AQUI:
panel.mouse_filter = Control.MOUSE_FILTER_STOP
_detail_layer.add_child(panel)
```

### Fix 2 — Verificar arquivo local

O arquivo local `src/scenes/WorldMapScene.gd` pode estar truncado (575 linhas vs 588 no git HEAD). Antes de editar, restaura do git HEAD:

```bash
git show HEAD:src/scenes/WorldMapScene.gd > src/scenes/WorldMapScene.gd
```

Confirma que tem 588 linhas:
```bash
wc -l src/scenes/WorldMapScene.gd
```

### Fix 3 — Testar outras zonas também

Após o fix do mouse_filter, verifica se as cenas das zonas carregam corretamente. As cenas são:
- HORDAS → `src/scenes/Main.tscn`
- STEALTH → `src/scenes/StealthMain.tscn`
- CIRCUITO → `src/scenes/CircuitMain.tscn`
- EXTRACAO → `src/scenes/ExtractionMain.tscn`
- CAMPO → `src/scenes/FieldControlMain.tscn`
- INFECCAO → `src/scenes/InfectionMain.tscn`
- LABIRINTO → `src/scenes/MazeMain.tscn`
- SACRIFICIO → `src/scenes/SacrificeMain.tscn`

Se alguma cena tiver erro de parse ou script quebrado, o `change_scene_to_file` falha silenciosamente e o jogo fica no WorldMap. Verifica com:
```bash
# Procura erros óbvios de sintaxe nos GDScript das cenas
grep -n "class_name\|extends\|func _ready" src/scenes/*.gd | head -30
```

### Fix 4 — Commit e push

```bash
git add src/scenes/WorldMapScene.gd
git commit -m "fix: panel mouse_filter stops click propagation to _unhandled_input

Clicking RAIDAR was not entering battle scenes because the ColorRect
panel used MOUSE_FILTER_IGNORE (default), allowing the click in game
coordinates to pass through to _unhandled_input. The click fell within
the CAMPO zone rect (floor=1, col=0), causing _show_detail(campo) to
overwrite _selected_zone before Button pressed signal fired.

Fix: panel.mouse_filter = Control.MOUSE_FILTER_STOP blocks clicks.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
git push
```

## Resultado
Executado em 2026-03-28.
- Os 9 arquivos `zone_*.png` já estavam renomeados corretamente em `C:\Users\leeew\Downloads\`.
- Copiados para `assets/art/zones/`: zone_hordas, zone_sacrificio, zone_extracao, zone_campo, zone_foguete, zone_stealth, zone_infeccao, zone_labirinto, zone_circuito.
- Commit `a73afc9` e push feitos com sucesso.

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
- 2026-03-28 — Zone bg code: `_add_zone_bg()` + chamadas em WorldMapScene.gd commitados; pasta zones/ criada. Imagens bloqueadas (PNGs em Downloads sem nomes corretos).
- 2026-03-28 — Watcher fixes aplicados; SFX de clique/confirmação em WorldMap e HubScene commitados.
- 2026-03-28 — 9 imagens de zona copiadas de Downloads para assets/art/zones/ e commitadas (commit a73afc9).
