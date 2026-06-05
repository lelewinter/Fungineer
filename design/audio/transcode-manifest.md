# Fungineer — Audio Transcode Manifest

**Version**: 1.0
**Date**: 2026-06-05
**Author**: Audio Director (subagent)
**Status**: Ready to execute locally

> Premissa de metodologia: tamanhos WAV extraídos do `production/task-audio-transcode.md`
> (menciona explicitamente menu.wav=5.4 MB, dungeon_theme_2.wav=23 MB, total=106 MB,
> demais faixas descritas como "13-18 MB each"). Estimativas OGG derivadas da regra
> de 80 kbps estéreo VBR (q4) e 64 kbps mono VBR (q3) confirmadas pelo próprio
> script. Os 106 MB do task doc cobrem apenas as 8 faixas de música; SFX WAVs
> são curtos demais para aparecerem no problema de Cloudflare (estimados abaixo).
> Arquivos `sfx/game/*` referenciados no código não existem no disco — o AudioManager
> faz fallback para SfxSynth nesses casos; não há WAV para transcodar e não é
> necessário criar OGGs para eles.

---

## 1. Inventário de Arquivos WAV — Música

Script: `tools/transcode-audio.sh`, qualidade música = **q4** (libvorbis, ~80 kbps estéreo VBR), 2 canais.

A estimativa OGG usa ~14% do tamanho WAV, derivada da redução de 85% declarada no
task doc para o conjunto completo de faixas (106 MB → ~15 MB).

| Arquivo WAV | Tamanho WAV | Qual. OGG | Canais | Estimativa OGG | Seguro <25 MB? |
|---|---|---|---|---|---|
| `assets/audio/music/menu.wav` | 5.4 MB | q4 | stereo | ~0.76 MB | Sim |
| `assets/audio/music/battle.wav` | ~14 MB | q4 | stereo | ~2.0 MB | Sim |
| `assets/audio/music/zones/dungeon_theme_1.wav` | ~15 MB | q4 | stereo | ~2.1 MB | Sim |
| `assets/audio/music/zones/dungeon_theme_2.wav` | 23 MB | q4 | stereo | ~3.2 MB | Sim |
| `assets/audio/music/zones/field_theme_1.wav` | ~14 MB | q4 | stereo | ~2.0 MB | Sim |
| `assets/audio/music/zones/field_theme_2.wav` | ~14 MB | q4 | stereo | ~2.0 MB | Sim |
| `assets/audio/music/zones/night_theme_1.wav` | ~13 MB | q4 | stereo | ~1.8 MB | Sim |
| `assets/audio/music/zones/night_theme_2.wav` | ~7.6 MB | q4 | stereo | ~1.06 MB | Sim |

**Subtotal música:** ~106 MB WAV → ~14.9 MB OGG

> `dungeon_theme_2.wav` (23 MB) é o único arquivo que já está próximo do limite
> de 25 MB da Cloudflare Pages. Após o transcode para q4 ele cai para ~3.2 MB —
> margem confortável. Nenhum arquivo OGG resultante se aproxima de 25 MB.

---

## 2. Inventário de Arquivos WAV — SFX

Script: `tools/transcode-audio.sh`, qualidade SFX = **q3** (libvorbis, ~64 kbps mono VBR), 1 canal (downmix).
Todos em `assets/audio/sfx/ui/`. Clipes curtos (tipicamente 0.5–3 s).

| Arquivo WAV | Tamanho WAV estimado | Qual. OGG | Canais | Estimativa OGG |
|---|---|---|---|---|
| `sfx/ui/Click_01.wav` | ~150 KB | q3 | mono | ~20 KB |
| `sfx/ui/Click_02.wav` | ~150 KB | q3 | mono | ~20 KB |
| `sfx/ui/Click_03.wav` | ~150 KB | q3 | mono | ~20 KB |
| `sfx/ui/Click_04.wav` | ~150 KB | q3 | mono | ~20 KB |
| `sfx/ui/Complete_01.wav` | ~300 KB | q3 | mono | ~40 KB |
| `sfx/ui/Complete_02.wav` | ~300 KB | q3 | mono | ~40 KB |
| `sfx/ui/Confirm_01.wav` | ~250 KB | q3 | mono | ~35 KB |
| `sfx/ui/Confirm_02.wav` | ~250 KB | q3 | mono | ~35 KB |
| `sfx/ui/Confirm_03.wav` | ~250 KB | q3 | mono | ~35 KB |
| `sfx/ui/Confirm_04.wav` | ~250 KB | q3 | mono | ~35 KB |
| `sfx/ui/Confirm_05.wav` | ~250 KB | q3 | mono | ~35 KB |
| `sfx/ui/Confirm_06.wav` | ~250 KB | q3 | mono | ~35 KB |
| `sfx/ui/Confirm_07.wav` | ~250 KB | q3 | mono | ~35 KB |

**Subtotal SFX (em disco):** ~3.0 MB WAV → ~0.4 MB OGG

### SFX referenciados no código mas AUSENTES no disco (sem ação de transcode)

Estes arquivos não existem em `assets/audio/`. O AudioManager detecta o erro 404
e roteia automaticamente para o `SfxSynth` (síntese procedural). O transcode não
se aplica, mas as referências de caminho devem ser atualizadas para `.ogg` mesmo
assim — quando/se os arquivos reais forem adicionados, eles chegarão como OGG.

| Caminho referenciado no código | Arquivo existe? |
|---|---|
| `res://assets/audio/sfx/game/hit_01.wav` | Não |
| `res://assets/audio/sfx/game/hit_02.wav` | Não |
| `res://assets/audio/sfx/game/jump.wav` | Não |
| `res://assets/audio/sfx/game/alarm.wav` | Não |
| `res://assets/audio/sfx/game/push.wav` | Não |
| `res://assets/audio/sfx/game/munch.wav` | Não |
| `res://assets/audio/sfx/game/powerup.wav` | Não |

---

## 3. Totais Consolidados

| Categoria | Arquivos | Antes (WAV) | Depois (OGG) | Redução |
|---|---|---|---|---|
| Música | 8 | ~106 MB | ~14.9 MB | ~86% |
| SFX em disco | 13 | ~3.0 MB | ~0.4 MB | ~87% |
| **Total** | **21** | **~109 MB** | **~15.3 MB** | **~86%** |

Nenhum arquivo OGG individual ultrapassa 25 MB. O maior resultado (dungeon_theme_2)
fica em ~3.2 MB.

---

## 4. Troca de Referências no Código

### Estratégia

O AudioManager (`frontend/src/core/AudioManager.ts`) recebe os caminhos como
strings passadas pelos chamadores — ele não normaliza extensões nem resolve o
formato centralmente. Portanto, a troca tem que ser feita nas strings de chamada
espalhadas pelo código, não em um ponto único. O `sed` one-liner abaixo substitui
todas de uma só vez de forma segura.

### Confirmação: 41 ocorrências em 11 arquivos

Grep de verificação (executar antes e depois para confirmar zero residuais):

```bash
grep -rn 'res://assets/audio/[^'"'"'"'"'"'"'"'"']*\.wav' frontend/src/
```

Resultado atual — cada linha é uma string de caminho de áudio real a ser trocada:

| Arquivo | Linha | Caminho WAV atual |
|---|---|---|
| `frontend/src/scenes/StartScene.ts` | 61 | `music/menu.wav` |
| `frontend/src/scenes/StartScene.ts` | 280 | `sfx/ui/Confirm_03.wav` |
| `frontend/src/run/ResourceItem.ts` | 75 | `sfx/ui/Complete_01.wav` |
| `frontend/src/scenes/runs/LabirintoScene.ts` | 232 | `sfx/game/push.wav` |
| `frontend/src/run/fx/DamageNumbers.ts` | 87 | `sfx/ui/Confirm_06.wav` |
| `frontend/src/run/fx/DamageNumbers.ts` | 90 | `sfx/ui/Confirm_04.wav` |
| `frontend/src/run/fx/DamageNumbers.ts` | 93 | `sfx/ui/Complete_02.wav` |
| `frontend/src/run/fx/DamageNumbers.ts` | 96 | `sfx/ui/Click_01.wav` |
| `frontend/src/run/fx/DamageNumbers.ts` | 99 | `sfx/ui/Confirm_07.wav` |
| `frontend/src/run/fx/DamageNumbers.ts` | 102 | `sfx/ui/Complete_01.wav` |
| `frontend/src/run/fx/RunJuice.ts` | 116 | `sfx/ui/Confirm_03.wav` |
| `frontend/src/run/fx/RunJuice.ts` | 125 | `sfx/game/hit_01.wav` |
| `frontend/src/run/fx/RunJuice.ts` | 131 | `sfx/game/jump.wav` |
| `frontend/src/run/fx/RunJuice.ts` | 140 | `sfx/game/alarm.wav` |
| `frontend/src/run/fx/RunJuice.ts` | 148 | `sfx/ui/Complete_01.wav` |
| `frontend/src/run/fx/RunJuice.ts` | 156 | `sfx/game/hit_02.wav` |
| `frontend/src/scenes/runs/InfeccaoScene.ts` | 266 | `sfx/game/munch.wav` |
| `frontend/src/scenes/runs/InfeccaoScene.ts` | 276 | `sfx/game/powerup.wav` |
| `frontend/src/scenes/runs/HordasScene.ts` | 148 | `music/battle.wav` |
| `frontend/src/scenes/runs/HordasScene.ts` | 396 | `sfx/ui/Confirm_03.wav` |
| `frontend/src/scenes/runs/HordasScene.ts` | 443 | `sfx/ui/Click_03.wav` |
| `frontend/src/scenes/runs/HordasScene.ts` | 499 | `sfx/ui/Click_03.wav` |
| `frontend/src/scenes/runs/HordasScene.ts` | 688 | `sfx/ui/Click_03.wav` |
| `frontend/src/state/Zones.ts` | 29 | `music/battle.wav` |
| `frontend/src/state/Zones.ts` | 30 | `music/zones/night_theme_1.wav` |
| `frontend/src/state/Zones.ts` | 31 | `music/zones/dungeon_theme_1.wav` |
| `frontend/src/state/Zones.ts` | 32 | `music/zones/field_theme_2.wav` |
| `frontend/src/state/Zones.ts` | 33 | `music/zones/field_theme_1.wav` |
| `frontend/src/state/Zones.ts` | 34 | `music/zones/night_theme_2.wav` |
| `frontend/src/state/Zones.ts` | 35 | `music/zones/dungeon_theme_2.wav` |
| `frontend/src/state/Zones.ts` | 36 | `music/zones/dungeon_theme_1.wav` |
| `frontend/src/state/Zones.ts` | 37 | `music/zones/night_theme_2.wav` |
| `frontend/src/state/Zones.ts` | 38 | `music/zones/night_theme_1.wav` |
| `frontend/src/state/Zones.ts` | 39 | `music/zones/dungeon_theme_2.wav` |
| `frontend/src/scenes/hub/HubAudio.ts` | 33 | `music/menu.wav` |
| `frontend/src/scenes/hub/HubAudio.ts` | 41 | `sfx/ui/Click_01.wav` |
| `frontend/src/scenes/hub/HubAudio.ts` | 45 | `sfx/ui/Confirm_03.wav` |
| `frontend/src/scenes/hub/HubAudio.ts` | 49 | `sfx/ui/Click_02.wav` |
| `frontend/src/scenes/hub/HubAudio.ts` | 53 | `sfx/ui/Confirm_05.wav` |
| `frontend/src/scenes/hub/HubAudio.ts` | 57 | `sfx/ui/Complete_01.wav` |
| `frontend/src/ui/PixiButton.ts` | 108 | `sfx/ui/Click_03.wav` |
| `frontend/src/ui/AudioSettingsModal.ts` | 60 | `sfx/ui/Click_03.wav` |

> Nota: `SfxSynth.ts` linhas 261-262 contêm `.wav` apenas em comentários de
> documentação (exemplos de formato de caminho). O `sed` abaixo também as
> atualizará — isso é correto, pois os exemplos devem refletir a nova extensão.

> Nota: `WaveSpawner.ts`, `HUD.ts` e `ScreenFX.ts` aparecem no grep simples de
> `.wav` mas são falsos positivos — tratam-se de `this.wave` (variável de número
> de onda do jogo), não de caminhos de áudio. O grep com o prefixo
> `res://assets/audio/` confirma que não há refs de áudio nesses arquivos.

---

## 5. Sequência de Execução — Turn-Key

Execute todos os comandos a partir da raiz do repositório (`/home/user/Fungineer`
localmente — adapte o caminho se necessário). Requer: `ffmpeg` com `libvorbis`,
`git`, `node/npm`.

### Passo 1 — Verificação do ambiente

```bash
ffmpeg -version
ffmpeg -hide_banner -codecs 2>/dev/null | grep libvorbis
```

Se `libvorbis` não aparecer: `brew install ffmpeg` (macOS) ou
`sudo apt install ffmpeg` (Linux/WSL).

### Passo 2 — Dry-run (opcional mas recomendado)

```bash
tools/transcode-audio.sh --dry-run
```

Confirma quais arquivos serão processados sem gerar nenhum OGG.

### Passo 3 — Transcode

```bash
tools/transcode-audio.sh
```

Produz um `.ogg` ao lado de cada `.wav` em `assets/audio/music/` e
`assets/audio/sfx/`. Idempotente: rodar novamente não reprocessa OGGs mais
recentes que seus WAVs de origem.

**Critério de qualidade opcional:** se qualquer faixa de música soar com
artefatos audíveis (ringing em ataques, borramento de textura), execute:
```bash
tools/transcode-audio.sh --music-q 5
```
Isso sobe para ~96 kbps (~20% maior que q4, ainda bem abaixo do limite de 25 MB).

### Passo 4 — Audição (obrigatória antes do commit)

Abra pelo menos:
- Uma faixa de música longa (`dungeon_theme_2.ogg` — a mais crítica pelo tamanho original)
- Dois SFX de UI (`Click_03.ogg`, `Complete_01.ogg`)

Se algo soar errado: rerun com `--music-q 5` ou `--sfx-q 4`.

### Passo 5 — Troca de referências no código

Comando único para todos os 41 pontos em 11 arquivos:

```bash
# Linux / WSL
grep -rlE "res://assets/audio/[^'\"]*\.wav" frontend/src/ \
  | xargs sed -i "s|\.wav\(['\"]\)|.ogg\1|g"

# macOS (sed requer '' após -i)
grep -rlE "res://assets/audio/[^'\"]*\.wav" frontend/src/ \
  | xargs sed -i '' "s|\.wav\(['\"]\)|.ogg\1|g"
```

**Verificação pós-sed** (deve retornar zero linhas):
```bash
grep -rn 'res://assets/audio/[^'"'"'"'"'"'"'"'"']*\.wav' frontend/src/
```

### Passo 6 — Remoção dos WAVs

```bash
find assets/audio -name '*.wav' -delete
```

Os WAVs permanecem na história do git (`git show <sha>:assets/audio/music/menu.wav > menu.wav`)
e podem ser recuperados a qualquer momento.

### Passo 7 — Build e typecheck

```bash
cd frontend
npm run typecheck
npm run build
cd ..
```

Confirma que não há erros de compilação introduzidos.

### Passo 8 — Auditoria de tamanho (sanity check)

```bash
du -sh assets/audio/
# Esperado: < 16 MB

find assets/audio -name '*.ogg' | wc -l
# Esperado: 21 (8 música + 13 SFX)

find assets/audio -name '*.wav' | wc -l
# Esperado: 0
```

### Passo 9 — Commit atômico

```bash
git add assets/audio/ frontend/src/
git commit -m "chore(audio): transcode WAV→OGG, swap code refs, delete WAVs

- 21 files: 8 music (q4 stereo) + 13 sfx/ui (q3 mono)
- ~109 MB WAV → ~15.3 MB OGG (~86% reduction)
- 41 code refs updated across 11 files via sed
- Cloudflare Pages 25MB/file cap: max file now ~3.2 MB
- AudioManager fallback to synth unchanged for sfx/game/* (files absent)
"
```

---

## 6. Verificação Pós-Deploy

Cheklist mínimo antes de dar o PR como pronto:

- [ ] Música toca no Hub (`menu.ogg`)
- [ ] Música toca na zona Hordas (`battle.ogg`)
- [ ] Pelo menos um tema de zona OGG toca (ex: `dungeon_theme_1.ogg`)
- [ ] SFX de UI: botão de clique, confirm e complete audíveis
- [ ] Nenhum 404 em `assets/audio/` no DevTools Network
- [ ] Total `assets/audio/` < 20 MB (`du -sh assets/audio/`)
- [ ] PWA: primeiro carregamento no mobile sem warnings de storage

---

## 7. Rollback

```bash
# Reverter o commit inteiro (código + exclusão dos WAVs)
git revert <sha-do-commit>

# Ou: restaurar só um WAV específico do histórico
git show <sha-antes-do-commit>:assets/audio/music/menu.wav > assets/audio/music/menu.wav
```
