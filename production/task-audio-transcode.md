# Task: Transcode audio assets from WAV to OGG Vorbis

**Status:** OPEN
**Priority:** Medium (blocks Cloudflare Pages deploy of full audio set)
**Owner:** TBD
**Created:** 2026-05-11

---

## Why

The 8 music tracks under `assets/audio/music/` total **~106 MB** as WAV.
Two consequences:

1. **Cloudflare Pages caps individual files at 25 MB.**
   `assets/audio/music/zones/dungeon_theme_2.wav` is 23 MB — one rev of the
   master and it tips over the limit. `menu.wav` (5.4 MB) and the other
   zone themes (13–18 MB each) are all in the danger zone if a designer
   re-exports at a higher bit depth.
2. **PWA install footprint.** The service worker already LRU-caps audio
   to 40 entries to avoid blowing browser storage quotas on mid-range
   Android. Shrinking the source files makes that cap less of a concern
   and speeds up the first-fetch on every device.

Expected outcome: **~85% reduction** (106 MB → ~15 MB) with imperceptible
quality loss for game audio.

---

## How

A transcode script is in place: `tools/transcode-audio.sh`.

### Local run (you need ffmpeg with libvorbis)

```bash
# from repo root
tools/transcode-audio.sh
```

Defaults:
- Music → OGG, libvorbis quality 4 (~80 kbps stereo VBR)
- SFX   → OGG, libvorbis quality 3 (~64 kbps mono VBR)
- Idempotent: re-running skips OGGs newer than their WAV source.

Tuning knobs:
```bash
tools/transcode-audio.sh --music-q 5   # higher music quality (~96 kbps)
tools/transcode-audio.sh --sfx-q 4     # higher SFX quality
tools/transcode-audio.sh --dry-run     # print plan, no encoding
```

Install ffmpeg if missing:
- macOS:   `brew install ffmpeg`
- Debian:  `sudo apt install ffmpeg`
- Windows: `choco install ffmpeg` (or use WSL)

### After the script runs

You will have `.ogg` files next to every `.wav` in `assets/audio/`.
**Audition at least one music track and a couple of SFX** before continuing
— if anything sounds wrong, re-run with `--music-q 5` or `--sfx-q 4`.

---

## Code update (atomic with WAV removal)

This is the **one atomic commit** that flips the runtime over to OGG and
deletes the WAVs. Code paths use `res://assets/...` strings that
`AssetLoader` resolves to `/assets/...`.

Files that need `.wav` → `.ogg`:

| File | Calls |
|---|---|
| `frontend/src/ui/PixiButton.ts` | `Click_03.wav` |
| `frontend/src/scenes/WorldMapScene.ts` | `menu.wav`, `Click_01.wav`, `Confirm_01.wav`, `Click_02.wav` |
| `frontend/src/scenes/hub/HubAudio.ts` | `menu.wav`, `Click_01.wav`, `Confirm_03.wav`, `Click_02.wav`, `Confirm_05.wav`, `Complete_01.wav` |
| `frontend/src/scenes/runs/HordasScene.ts` | `battle.wav` |
| `frontend/src/scenes/runs/SacrificeScene.ts` | `dungeon_theme_1.wav` |
| `frontend/src/scenes/runs/FieldControlScene.ts` | (verify) |
| `frontend/src/scenes/runs/SimpleRunScene.ts` | (verify zone themes) |

> Don't trust this list blindly — grep the repo before editing:
> ```bash
> grep -rnE "\\.wav['\"]" frontend/src/
> ```

Suggested mass edit (from repo root):
```bash
grep -rlE "\\.wav(['\"])" frontend/src/ \
  | xargs sed -i 's/\.wav\([\x27"]\)/.ogg\1/g'
```
(Adjust `sed` syntax for macOS: `sed -i ''` instead of `sed -i`.)

After the swap:
```bash
# delete the WAVs (they live in git history if you ever need them back)
find assets/audio -name '*.wav' -delete

# sanity-check
cd frontend && npm run typecheck && npm run build
```

---

## Verification before merge

- [ ] Music plays on Hub, World Map, and each zone scene.
- [ ] All UI SFX (button click, confirm, complete) play.
- [ ] No 404s in DevTools Network tab when running `npm run dev`.
- [ ] Bundle / asset audit: total `assets/audio/` is under 20 MB.
- [ ] On mobile (PWA): first-load completes without storage warnings.

---

## Out of scope

- Designing new audio (this is a format change, not a mix change).
- Splitting music into intro / loop. If we want gapless looping later, the
  OGG format supports it; add a separate task.
- Sprite-sheet style SFX bundling. Premature for the current cache pressure.

---

## Rollback plan

If anything sounds wrong post-merge:
1. `git revert <merge-sha>` restores both the code paths and the WAVs.
2. Or cherry-pick just the code revert and keep the OGGs around for a
   follow-up tuning pass.

The WAVs are recoverable from git history (`git show <pre-merge-sha>:assets/audio/music/menu.wav > menu.wav`) even after the merge.
