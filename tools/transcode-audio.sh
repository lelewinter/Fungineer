#!/usr/bin/env bash
# Transcode WAV music + SFX assets to OGG Vorbis to fit Cloudflare Pages
# (25 MB/file cap) and keep the PWA install footprint reasonable.
#
# Defaults aim for ~85% size reduction with imperceptible quality loss for
# game audio:
#   - Music  → OGG, libvorbis quality 4  (~80 kbps stereo VBR)
#   - SFX    → OGG, libvorbis quality 3  (~64 kbps mono VBR, downmixed)
#
# Idempotent: skips files whose .ogg is newer than the source .wav.
# Does NOT delete the source WAVs — that is a separate atomic step paired
# with the code path update from `.wav` to `.ogg`.
#
# Usage:
#   tools/transcode-audio.sh                # default settings
#   tools/transcode-audio.sh --music-q 5    # higher music quality
#   tools/transcode-audio.sh --dry-run      # print what would happen
#
# Requirements: ffmpeg with libvorbis (most distros ship this by default).

set -euo pipefail

# ── Defaults ────────────────────────────────────────────────────────────────

MUSIC_QUALITY=4   # libvorbis -q:a — 0 (worst) .. 10 (best). 4 ≈ 80 kbps stereo.
SFX_QUALITY=3     # SFX is short + monofonic in practice; q3 ≈ 64 kbps.
DRY_RUN=0
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MUSIC_DIR="$REPO_ROOT/assets/audio/music"
SFX_DIR="$REPO_ROOT/assets/audio/sfx"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --music-q) MUSIC_QUALITY="$2"; shift 2 ;;
    --sfx-q)   SFX_QUALITY="$2"; shift 2 ;;
    --dry-run) DRY_RUN=1; shift ;;
    -h|--help)
      sed -n '2,22p' "$0"
      exit 0
      ;;
    *) echo "Unknown arg: $1" >&2; exit 2 ;;
  esac
done

# ── Sanity ──────────────────────────────────────────────────────────────────

if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "ERROR: ffmpeg not found in PATH." >&2
  echo "       macOS:    brew install ffmpeg" >&2
  echo "       Debian:   sudo apt install ffmpeg" >&2
  echo "       Windows:  choco install ffmpeg  (or use WSL)" >&2
  exit 1
fi

if ! ffmpeg -hide_banner -codecs 2>/dev/null | grep -q libvorbis; then
  echo "ERROR: ffmpeg build lacks libvorbis. Reinstall a full ffmpeg." >&2
  exit 1
fi

# ── Convert ─────────────────────────────────────────────────────────────────

total_before=0
total_after=0
converted=0
skipped=0

convert_one() {
  local wav="$1"
  local quality="$2"
  local channels="$3"  # 2 for stereo (music), 1 for mono (SFX)
  local ogg="${wav%.wav}.ogg"

  if [[ -f "$ogg" && "$ogg" -nt "$wav" ]]; then
    skipped=$((skipped + 1))
    return
  fi

  local size_in
  size_in=$(stat -c%s "$wav" 2>/dev/null || stat -f%z "$wav")
  total_before=$((total_before + size_in))

  echo "→ $(realpath --relative-to="$REPO_ROOT" "$wav")  (q=$quality, ${channels}ch)"

  if [[ "$DRY_RUN" == 1 ]]; then
    return
  fi

  ffmpeg -hide_banner -loglevel error -y \
    -i "$wav" \
    -c:a libvorbis -q:a "$quality" -ac "$channels" \
    "$ogg"

  local size_out
  size_out=$(stat -c%s "$ogg" 2>/dev/null || stat -f%z "$ogg")
  total_after=$((total_after + size_out))
  converted=$((converted + 1))
}

echo "== Music (q=$MUSIC_QUALITY, stereo) =="
if [[ -d "$MUSIC_DIR" ]]; then
  while IFS= read -r -d '' wav; do
    convert_one "$wav" "$MUSIC_QUALITY" 2
  done < <(find "$MUSIC_DIR" -type f -name '*.wav' -print0)
fi

echo
echo "== SFX (q=$SFX_QUALITY, mono) =="
if [[ -d "$SFX_DIR" ]]; then
  while IFS= read -r -d '' wav; do
    convert_one "$wav" "$SFX_QUALITY" 1
  done < <(find "$SFX_DIR" -type f -name '*.wav' -print0)
fi

# ── Summary ─────────────────────────────────────────────────────────────────

human() {
  numfmt --to=iec --suffix=B "$1" 2>/dev/null || echo "$1 B"
}

echo
echo "── Summary ──"
echo "Converted: $converted file(s)"
echo "Skipped:   $skipped file(s) (already up to date)"
if [[ "$converted" -gt 0 && "$DRY_RUN" == 0 ]]; then
  echo "Source:    $(human "$total_before")"
  echo "Output:    $(human "$total_after")"
  if [[ "$total_before" -gt 0 ]]; then
    pct=$(( (total_before - total_after) * 100 / total_before ))
    echo "Saved:     ${pct}%"
  fi
fi

echo
echo "Next steps:"
echo "  1. Audition the OGGs (open them — same name, different extension)."
echo "  2. In one atomic PR:"
echo "       - update audioManager paths from .wav to .ogg in frontend/src/"
echo "       - run: find assets/audio -name '*.wav' -delete"
echo "       - commit + push"
echo "  3. See production/task-audio-transcode.md for the playbook."
