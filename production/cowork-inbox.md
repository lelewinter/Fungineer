# Cowork → Claude Code Inbox

> Arquivo de comunicação entre Cowork (Claude no desktop) e Claude Code.
> Cowork escreve tarefas aqui. Claude Code detecta e executa automaticamente.

---

## Status
DONE

## Tarefa

Adiciona música de fundo ao jogo usando os assets de áudio já extraídos.

**O que fazer:**

1. Abre `src/scenes/Main.gd` (zona Hordas — o loop principal do jogo).

2. Adiciona um `AudioStreamPlayer` para música de fundo na função `_ready()`. O arquivo de música está em `assets/audio/music/battle.wav`. Usa `load()` para carregar e configura o player para fazer loop (`stream.loop = true`) e toca automaticamente.

   Exemplo de como adicionar no `_ready()`:
   ```gdscript
   var music = AudioStreamPlayer.new()
   music.stream = load("res://assets/audio/music/battle.wav")
   music.volume_db = -10.0
   music.autoplay = true
   add_child(music)
   ```

3. Abre `src/scenes/HubScene.gd`. Faz o mesmo mas usando `assets/audio/music/menu.wav` com volume_db = -8.0.

4. Abre `src/scenes/WorldMapScene.gd`. Faz o mesmo com `assets/audio/music/menu.wav`.

5. Confere se o `project.godot` tem o AudioStreamPlayer configurado como autoload ou se precisa de ajuste. Provavelmente não precisa — AudioStreamPlayer como filho de cena é suficiente.

6. Faz git add, git commit e git push:
   ```
   git add src/scenes/Main.gd src/scenes/HubScene.gd src/scenes/WorldMapScene.gd assets/audio/
   git commit -m "Add background music to main game scenes

   - battle.wav loops during Hordas zone gameplay
   - menu.wav plays in Hub and WorldMap scenes
   - Volume set to -10db/-8db to not overpower SFX

   Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
   git push
   ```

**Sucesso:** push feito, sem erros de GDScript, música toca ao entrar nas cenas.

## Resultado
Executado com sucesso em 2026-03-28.
- `Main.gd`: `_setup_music()` adicionado, toca `battle.wav` em loop (-10db)
- `HubScene.gd`: música `menu.wav` em loop (-8db) adicionada no `_ready()`
- `WorldMapScene.gd`: mesma música `menu.wav` em loop (-8db)
- Loop via `finished.connect(play)` — não modifica o resource importado
- Push: commit `dd1a0e6` em `lelewinter/Fungineer` main

---

## Protocolo

**Claude Code faz:**
1. Detecta `Status: PENDING` via hook `UserPromptSubmit`
2. Executa a tarefa completamente
3. Atualiza `Status: DONE`
4. Escreve resultado em `## Resultado`
5. Faz git add, git commit e git push de tudo que foi modificado

**Ciclo volta para IDLE** após leitura do resultado.

---

## Histórico
<!-- Claude Code appenda entradas aqui após execução -->

### 2026-03-28 — Música de fundo
`battle.wav` no loop de Hordas, `menu.wav` no Hub e WorldMap. Commit `dd1a0e6`.
