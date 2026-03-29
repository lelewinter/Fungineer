# Cowork → Claude Code Inbox

> Arquivo de comunicação entre Cowork (Claude no desktop) e Claude Code.

---

## Status
DONE

## Tarefa

Teste de watcher automático. Cria o arquivo `production/watcher-test.txt` com o conteúdo `watcher ok - {data e hora atual}`, faz commit e push.

**Problema:** `tools/cowork-watcher.py` usa watchdog mas só dispara em eventos de modificação de arquivo. Se o inbox já está `PENDING` quando o watcher inicia, nada acontece. Além disso, quando há uma sessão interativa aberta, o `claude --print` pode conflitar.

**O que fazer:**

### Fix 1 — Checa status no startup (arquivo `tools/cowork-watcher.py`)

Em `run_with_watchdog()`, logo após `observer.start()` e antes do `log.info`, adiciona:

```python
# Check immediately on startup in case file is already PENDING
import threading
threading.Timer(1.0, handler._check).start()
```

Isso faz com que 1 segundo após iniciar, o watcher cheque o status atual e dispare se já estiver PENDING.

### Fix 2 — Polling também checa no startup

Em `run_polling()`, logo após `last_status = get_status()`, adiciona:

```python
# Trigger immediately if already PENDING on startup
if last_status == "PENDING":
    running = True
    last_status = "IN_PROGRESS"
    trigger_claude_code()
    last_status = get_status()
    running = False
```

### Fix 3 — Atualiza `start-watcher.bat` para sempre usar polling (mais confiável no Windows)

Em `tools/start-watcher.bat`, adiciona o argumento `--poll` ao comando python, e em `cowork-watcher.py` adiciona suporte ao argumento:

No início do `if __name__ == "__main__":`, antes do try/import watchdog:
```python
if "--poll" in sys.argv:
    run_polling()
else:
    try:
        import watchdog
        run_with_watchdog()
    except ImportError:
        run_polling()
```

E em `tools/start-watcher.bat`, muda a linha do python para:
```bat
python tools/cowork-watcher.py --poll
```

O polling checa a cada 5 segundos e funciona com sessão interativa aberta.

### Fix 4 — Próxima task pendente (imagens das zonas)

Após aplicar os fixes e confirmar que o watcher está funcionando, executa também a task de mover as imagens das zonas:

1. Copia estes 9 arquivos de `C:\Users\leeew\Downloads\` para `assets/art/zones/`:
   `zone_hordas.png`, `zone_sacrificio.png`, `zone_extracao.png`, `zone_campo.png`, `zone_foguete.png`, `zone_stealth.png`, `zone_infeccao.png`, `zone_labirinto.png`, `zone_circuito.png`

2. Em `src/scenes/WorldMapScene.gd`, para cada RoomCard de zona adiciona uma `TextureRect` como fundo:
```gdscript
var bg := TextureRect.new()
bg.texture = load("res://assets/art/zones/zone_NOME.png")
bg.expand_mode = TextureRect.EXPAND_FIT_WIDTH_PROPORTIONAL
bg.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
bg.anchor_right = 1.0
bg.anchor_bottom = 1.0
bg.z_index = -1
card.add_child(bg)
card.move_child(bg, 0)
```

3. Commit e push de tudo: `tools/cowork-watcher.py`, `tools/start-watcher.bat`, `assets/art/zones/`, `src/scenes/WorldMapScene.gd`.

**Resultado:**
- Fix 1 (startup check watchdog): ✅ `threading.Timer(1.0, handler._check).start()`
- Fix 2 (polling startup): ✅ checa PENDING imediatamente ao iniciar
- Fix 3 (--poll flag): ✅ `start-watcher.bat` usa `--poll` por padrão
- Fix 4 (imagens zonas): ⚠️ BLOQUEADO — arquivos `zone_*.png` não encontrados em `C:\Users\leeew\Downloads\`. Renomeie os PNGs gerados com os nomes corretos e crie nova tarefa.
- Push: commit `1899691`

**O que fazer:**

### Passo 1 — Cria pasta e copia as imagens

Copia estes 9 arquivos de `C:\Users\leeew\Downloads\` para `assets/art/zones/` (cria a pasta se não existir):

```
zone_hordas.png
zone_sacrificio.png
zone_extracao.png
zone_campo.png
zone_foguete.png
zone_stealth.png
zone_infeccao.png
zone_labirinto.png
zone_circuito.png
```

### Passo 2 — Conecta as imagens no WorldMapScene.gd

Abre `src/scenes/WorldMapScene.gd`. Localiza onde os RoomCards são criados ou onde as zonas recebem seus nomes/labels. Para cada card de zona, adiciona uma `TextureRect` como filho com a textura correspondente:

```gdscript
var bg := TextureRect.new()
bg.texture = load("res://assets/art/zones/zone_NOME.png")
bg.expand_mode = TextureRect.EXPAND_FIT_WIDTH_PROPORTIONAL
bg.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
bg.anchor_right = 1.0
bg.anchor_bottom = 1.0
bg.z_index = -1
card.add_child(bg)
card.move_child(bg, 0)
```

Mapeamento zona → arquivo:
- Hordas → `zone_hordas.png`
- Sacrifício → `zone_sacrificio.png`
- Extração / Gerador → `zone_extracao.png`
- Campo / Oficina → `zone_campo.png`
- Baia do Foguete → `zone_foguete.png`
- Stealth / Comunicações → `zone_stealth.png`
- Infecção / Depósito → `zone_infeccao.png`
- Labirinto / Enfermaria → `zone_labirinto.png`
- Circuito / Pesquisa → `zone_circuito.png`

### Passo 3 — Commit e push

```bash
git add assets/art/zones/ src/scenes/WorldMapScene.gd
git commit -m "Add pixel art zone card backgrounds to WorldMapScene

- 9 AI-generated 1024x1024 zone backgrounds in assets/art/zones/
- TextureRect added as background layer on each RoomCard
- Zones: hordas, sacrificio, extracao, campo, foguete,
  stealth, infeccao, labirinto, circuito

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
git push
```

**Sucesso:** push feito, WorldMapScene mostra as imagens pixel art como fundo de cada card de zona.

## Resultado
Executado em 2026-03-28.
- `WorldMapScene.gd`: código de zone backgrounds aplicado — `_add_zone_bg()` adicionado, chamadas para 9 zonas em `_ready()`. Função tem null-check (`ResourceLoader.exists`) — não crasha sem as imagens.
- `assets/art/zones/`: pasta criada e trackeada com `.gitkeep`.
- ⚠️ BLOQUEADO (imagens): os 23 PNGs em Downloads têm nomes UUID/Gemini — sem mapeamento zona→arquivo não é possível renomear. Renomeie manualmente e copie para `assets/art/zones/` com os nomes: `zone_hordas.png`, `zone_sacrificio.png`, `zone_extracao.png`, `zone_campo.png`, `zone_foguete.png`, `zone_stealth.png`, `zone_infeccao.png`, `zone_labirinto.png`, `zone_circuito.png`. Depois faça `git add assets/art/zones/ && git commit && git push`.
- Commit + push: feito para o código (sem as imagens).

## Histórico
- 2026-03-28 — Zone bg code: `_add_zone_bg()` + chamadas em WorldMapScene.gd commitados; pasta zones/ criada. Imagens bloqueadas (PNGs em Downloads sem nomes corretos).

## Resultado antigo (SFX)

Restaura arquivos corrompidos e adiciona SFX de UI nas cenas WorldMap e Hub.

**Contexto:** O índice git local e dois arquivos GDScript estão corrompidos/truncados. O `WorldMapScene.gd` local tem 566 linhas mas o HEAD no git tem 574 — os últimos 8 linhas estão faltando, incluindo `_start_raid()`. O `HubScene.gd` também está corrompido (erro UTF-8). O índice git em si está corrompido (`unknown index entry format`).

**O que fazer:**

### Passo 1 — Corrige o índice git corrompido
```bash
rm .git/index
git reset HEAD
```
Isso reconstrói o índice a partir do HEAD sem alterar os commits. Confirma com `git status`.

### Passo 2 — Restaura os arquivos corrompidos do git object store
```bash
git show HEAD:src/scenes/WorldMapScene.gd > src/scenes/WorldMapScene.gd
git show HEAD:src/scenes/HubScene.gd > src/scenes/HubScene.gd
```
Confirma que WorldMapScene.gd tem 574 linhas e HubScene.gd tem 435 linhas:
```bash
wc -l src/scenes/WorldMapScene.gd src/scenes/HubScene.gd
```

### Passo 3 — Adiciona SFX de UI em `src/scenes/WorldMapScene.gd`

**3a.** Adiciona a variável `_sfx` logo abaixo de `_music` (por volta da linha 112):
```gdscript
var _sfx: AudioStreamPlayer
```

**3b.** Em `_ready()`, logo após inicializar `_music`, adiciona:
```gdscript
_sfx = AudioStreamPlayer.new()
add_child(_sfx)
```

**3c.** Em `_show_detail()`, na primeira linha do corpo da função, adiciona som de clique:
```gdscript
_sfx.stream = load("res://assets/audio/sfx/ui/Click_01.wav")
_sfx.play()
```

**3d.** Em `_start_raid()`, na primeira linha do corpo (antes de `if _selected_zone.is_empty()`), adiciona som de confirmação:
```gdscript
_sfx.stream = load("res://assets/audio/sfx/ui/Confirm_01.wav")
_sfx.play()
```

**3e.** A lambda do botão Cancelar está em `_build_detail_panel()`:
```gdscript
cancel.pressed.connect(func(): _detail_layer.visible = false)
```
Substitui por uma função nomeada `_on_cancel_pressed()` e adiciona-a ao arquivo:
```gdscript
cancel.pressed.connect(_on_cancel_pressed)
```
```gdscript
func _on_cancel_pressed() -> void:
	_sfx.stream = load("res://assets/audio/sfx/ui/Click_02.wav")
	_sfx.play()
	_detail_layer.visible = false
```

### Passo 4 — Adiciona SFX de UI em `src/scenes/HubScene.gd`

**4a.** Adiciona `var _sfx: AudioStreamPlayer` logo abaixo de `var _music`.

**4b.** Em `_ready()`, logo após inicializar `_music`:
```gdscript
_sfx = AudioStreamPlayer.new()
add_child(_sfx)
```

**4c.** Em `_go_to_world_map()`, antes de `get_tree().change_scene_to_file(...)`:
```gdscript
_sfx.stream = load("res://assets/audio/sfx/ui/Confirm_01.wav")
_sfx.play()
```

**4d.** Em `_show_character_card()`, na primeira linha do corpo:
```gdscript
_sfx.stream = load("res://assets/audio/sfx/ui/Click_01.wav")
_sfx.play()
```

### Passo 5 — Commit e push
```bash
git add src/scenes/WorldMapScene.gd src/scenes/HubScene.gd
git commit -m "Add UI click/confirm SFX to WorldMapScene and HubScene

- Click_01.wav plays when opening zone detail panel and character cards
- Click_02.wav plays on cancel/dismiss
- Confirm_01.wav plays on RAIDAR and navigating to world map
- Also restores truncated WorldMapScene.gd and corrupted HubScene.gd

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
git push
```

**Sucesso:** push feito sem erros, sons de clique e confirmação tocam ao interagir com botões no WorldMap e Hub.

## Resultado
Executado em 2026-03-28.
- Índice git corrompido reconstruído (`rm .git/index && git reset HEAD`)
- `WorldMapScene.gd` restaurado (574 linhas) e `HubScene.gd` restaurado (435 linhas)
- `_sfx: AudioStreamPlayer` adicionado em ambas as cenas
- Click_01 em zone detail e character card; Click_02 em cancel; Confirm_01 em RAIDAR e navegação
- Lambda de cancel substituída por `_on_cancel_presse