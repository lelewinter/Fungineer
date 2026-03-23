#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# tools/ci/export-android.sh
# Local helper to reproduce the CI Android export environment and test builds.
#
# Usage:
#   ./tools/ci/export-android.sh [--godot /path/to/godot]
#
# Requirements:
#   - Godot 4.6 headless binary in PATH or passed via --godot
#   - ANDROID_SDK_ROOT set (or $ANDROID_HOME)
#   - Java 17+
#   - keytool in PATH (from JDK)
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

# ── Config ────────────────────────────────────────────────────────────────────
GODOT_BIN="${GODOT_BIN:-godot}"
EXPORT_PRESET="Android"
APK_NAME="Fungineer"
OUTPUT_DIR="build/android"
GODOT_CONFIG_DIR="${HOME}/.config/godot"
DEBUG_KEYSTORE="${GODOT_CONFIG_DIR}/debug.keystore"

# Parse args
while [[ $# -gt 0 ]]; do
  case "$1" in
    --godot) GODOT_BIN="$2"; shift 2 ;;
    *) echo "Unknown arg: $1"; exit 1 ;;
  esac
done

# ── Validate environment ──────────────────────────────────────────────────────
echo "=== Environment check ==="

if ! command -v "$GODOT_BIN" &>/dev/null; then
  echo "ERROR: Godot not found. Pass --godot /path/to/godot or add it to PATH." >&2
  exit 1
fi
echo "  Godot   : $($GODOT_BIN --version)"

SDK_ROOT="${ANDROID_SDK_ROOT:-${ANDROID_HOME:-}}"
if [ -z "$SDK_ROOT" ]; then
  echo "ERROR: Neither ANDROID_SDK_ROOT nor ANDROID_HOME is set." >&2
  exit 1
fi
echo "  SDK     : $SDK_ROOT"

JAVA_VERSION=$(java -version 2>&1 | head -1)
echo "  Java    : $JAVA_VERSION"

# ── Debug keystore ────────────────────────────────────────────────────────────
if [ ! -f "$DEBUG_KEYSTORE" ]; then
  echo ""
  echo "=== Generating debug keystore ==="
  mkdir -p "$GODOT_CONFIG_DIR"
  keytool -genkey -v \
    -keystore "$DEBUG_KEYSTORE" \
    -alias androiddebugkey \
    -keyalg RSA \
    -keysize 2048 \
    -validity 10000 \
    -storepass android \
    -keypass android \
    -dname "CN=Android Debug,O=Android,C=US"
  echo "✓ Keystore created at: $DEBUG_KEYSTORE"
else
  echo "  Keystore: $DEBUG_KEYSTORE (exists)"
fi

# ── Editor settings ───────────────────────────────────────────────────────────
echo ""
echo "=== Writing editor settings ==="
mkdir -p "$GODOT_CONFIG_DIR"
{
  printf '[gd_resource type="EditorSettings" format=3]\n'
  printf '\n'
  printf '[resource]\n'
  printf 'export/android/android_sdk_path = "%s"\n'    "$SDK_ROOT"
  printf 'export/android/debug_keystore = "%s"\n'      "$DEBUG_KEYSTORE"
  printf 'export/android/debug_keystore_user = "%s"\n' "androiddebugkey"
  printf 'export/android/debug_keystore_pass = "%s"\n' "android"
} > "${GODOT_CONFIG_DIR}/editor_settings-4.tres"
echo "✓ Editor settings written"

# ── Import ────────────────────────────────────────────────────────────────────
echo ""
echo "=== Importing project ==="
timeout 120 "$GODOT_BIN" --headless --import 2>&1 || true
echo "✓ Import done"

# ── Export ────────────────────────────────────────────────────────────────────
echo ""
echo "=== Exporting APK ==="
mkdir -p "$OUTPUT_DIR"
OUTPUT_APK="${OUTPUT_DIR}/${APK_NAME}-debug.apk"

"$GODOT_BIN" --headless --export-debug "$EXPORT_PRESET" "$OUTPUT_APK" 2>&1

if [ ! -f "$OUTPUT_APK" ]; then
  echo "ERROR: APK not found at '$OUTPUT_APK'" >&2
  exit 1
fi

APK_SIZE=$(du -h "$OUTPUT_APK" | cut -f1)
echo ""
echo "✓ Success! APK: $OUTPUT_APK ($APK_SIZE)"
