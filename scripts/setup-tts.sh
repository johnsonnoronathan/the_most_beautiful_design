#!/usr/bin/env bash
# Set up the offline narration voice (Kokoro-82M, Apache-2.0) in .cache/tts.
#
# The model and voice files come from the expo-kokoro npm package and the runtime
# from PyPI (kokoro-onnx), so no model hub access is needed. Nothing is installed
# globally; delete .cache/ to remove it all.
set -euo pipefail
cd "$(dirname "$0")/.."

CACHE=.cache/tts
mkdir -p "$CACHE"

if [ ! -x "$CACHE/venv/bin/python" ]; then
  python3 -m venv "$CACHE/venv"
  "$CACHE/venv/bin/pip" install -q kokoro-onnx==0.4.9 soundfile==0.13.1
fi

if [ ! -f "$CACHE/kokoro-quantized.onnx" ]; then
  tmp=$(mktemp -d)
  # --ignore-scripts: we only want the files inside the tarball
  (cd "$tmp" && npm pack expo-kokoro@1.1.9 --ignore-scripts --silent >/dev/null)
  tar -xzf "$tmp/expo-kokoro-1.1.9.tgz" -C "$tmp" package/build
  cp "$tmp/package/build/kokoro-quantized.onnx" "$CACHE/"
  mkdir -p "$CACHE/voices"
  cp "$tmp"/package/build/voices/[ab][fm]_*.bin "$CACHE/voices/"
  rm -rf "$tmp"
fi

# espeak-ng refuses data paths longer than ~160 characters, so keep a short copy.
if [ ! -d .cache/espeak-ng-data ]; then
  data=$("$CACHE/venv/bin/python" -c "import espeakng_loader as e; print(e.get_data_path())")
  cp -r "$data" .cache/espeak-ng-data
fi

echo "TTS ready: $CACHE"
