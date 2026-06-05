# Decisão de Áudio — Soft-launch com áudio generativo

**Data:** 2026-06-05
**Decisão da Leticia:** "vamos pelo caminho mais simples"
**Status:** TRAVADO

## Caminho escolhido: aceitar o áudio sintetizado já existente

A produção **não fica muda** e **não exige transcode** para lançar. O
`AudioManager` já tem fallback generativo, verificado no código:

- **Música ausente (404) → `MusicSynth` generativo** (`AudioManager.playMusic`
  → `startSynthMusic`, linhas 112-145). Cada zona pede sua faixa `.wav`; como os
  WAVs não são servidos, toca música procedural.
- **SFX ausente (404) → `SfxSynth` sintetizado** (mesmo padrão).

Os 106 MB de WAV vivem em `/assets/audio` na **raiz do repo**, fora de
`frontend/public/` — então **não entram no build** (`dist/assets/audio` ≈ 20 KB).
Isso é bom: o PWA fica leve e o cap de 25 MB/arquivo da Cloudflare é irrelevante
para o soft-launch.

### O que isso significa
- **Soft-launch:** ship como está — música generativa + SFX sintetizado. Zero
  trabalho de áudio bloqueando o lançamento. Zero risco de build sem som.
- **Nenhuma mudança de código foi necessária** — o fallback já cobre tudo.

## Fast-follow pós-launch (quando houver ffmpeg local)
A música/SFX gravados (WAV→OGG) entram depois, sem pressa, seguindo o manifesto
turn-key em `design/audio/transcode-manifest.md`:
1. `tools/transcode-audio.sh` (precisa de ffmpeg local — indisponível no ambiente
   de CI/agente).
2. Mover os OGG resultantes para `frontend/public/assets/audio/` (ou ajustar o
   serving para que sejam empacotados).
3. Trocar as refs `.wav → .ogg` (≈41 refs, ver manifesto).
4. Como o fallback é por-arquivo, dá pra introduzir as faixas reais
   **incrementalmente** — cada OGG que aparecer substitui sua versão generativa,
   sem big-bang.

## Riscos / notas
- O áudio generativo é placeholder de qualidade variável — o Audio Director deve
  validar que ele "não envergonha" no soft-launch (provável que sirva).
- Se o serving de `public/assets` precisar de ajuste para os OGG futuros, é a
  mesma correção que o Producer apontou em `sprint-next.md` (R-A1) — fora do
  caminho crítico do soft-launch.
