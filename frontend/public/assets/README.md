# Assets

Pasta zerada — repor do zero. O `frontend/public/assets` é symlink pra cá.

O código do frontend referencia os caminhos abaixo por string fixa. Enquanto o
arquivo não existir, o jogo roda mas sem a arte/áudio correspondente. Os nomes
têm que bater exatamente (case-sensitive no build Linux do Cloudflare).

## Arte de zona (`art/zones/`)

Uma imagem por zona, usada no card do World Map.

```
zone_hordas.png
zone_sacrificio.png
zone_extracao.png
zone_campo.png
zone_stealth.png
zone_infeccao.png
zone_labirinto.png
zone_circuito.png
```

## Música (`audio/music/` e `audio/music/zones/`)

```
audio/music/menu.wav
audio/music/battle.wav
audio/music/zones/field_theme_1.wav
audio/music/zones/field_theme_2.wav
audio/music/zones/dungeon_theme_1.wav
audio/music/zones/dungeon_theme_2.wav
audio/music/zones/night_theme_1.wav
audio/music/zones/night_theme_2.wav
```

## SFX de UI (`audio/sfx/ui/`)

```
Click_01.wav  Click_02.wav  Click_03.wav  Click_04.wav
Confirm_01.wav  Confirm_03.wav  Confirm_04.wav  Confirm_05.wav  Confirm_06.wav  Confirm_07.wav
Complete_01.wav  Complete_02.wav
```

## SFX de gameplay (`audio/sfx/game/`)

Disparados pelo `RunJuice` (kit de game-feel das zonas):

```
hit_01.wav    dano em corrida / near-miss
hit_02.wav    derrota (impacto mais grave)
alarm.wav     perigo / início de perseguição
jump.wav      pulo/hop (Catedral, Cordilheira, ...)
```

## Síntese procedural (fallback)

**Enquanto não houver arquivo no caminho acima, o jogo NÃO fica mudo.** O
`AudioManager` detecta o 404 e cai para um sintetizador Web Audio embutido
(`src/core/SfxSynth.ts`) que gera o efeito proceduralmente a partir do nome do
arquivo (família `Click_/Confirm_/Complete_/hit_/alarm/jump` + índice numérico).
Assim que um `.wav` real for colocado na pasta, ele tem prioridade — o synth só
toca quando o arquivo realmente falha em carregar.

## Formato de áudio

O código hoje aponta pra `.wav`. WAV é pesado e o Cloudflare Pages limita 25MB
por arquivo. Pra produção, converter pra OGG/MP3 e atualizar os caminhos no
frontend (`grep -rn "audio/" frontend/src`). Se trocar o formato, trocar a
extensão nas referências também.
