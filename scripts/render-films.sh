#!/usr/bin/env bash
# Render every film to MP4 (1920 × 1080, 30 fps, H.264 + AAC) in one folder.
#   scripts/render-films.sh [out-dir]        default: out/films
# Files that already exist are skipped, so a stopped run can be resumed. Each film is
# written under a .part name and renamed only once it has finished. Exits non-zero if
# any film failed. Used by .github/workflows/render-films.yml.
# Adding a film: list its composition id (from studio/catalog.ts) and a file name below.
set -uo pipefail
cd "$(dirname "$0")/.."
OUT="${1:-out/films}"
mkdir -p "$OUT"

FILMS=(
  "Calculus-01-Derivative calculus-visually-01-the-derivative"
  "Calculus-02-Integral calculus-visually-02-the-integral"
  "Calculus-03-Fundamental-Theorem calculus-visually-03-the-fundamental-theorem"
  "Calculus-04-Limit calculus-visually-04-the-limit"
  "Calculus-05-Sine-Cosine calculus-visually-05-sine-and-cosine"
  "Calculus-06-Chain-Rule calculus-visually-06-the-chain-rule"
  "Calculus-07-Product-Rule calculus-visually-07-the-product-rule"
  "Afterglow afterglow"
)

failed=0
for film in "${FILMS[@]}"; do
  read -r id name <<< "$film"
  file="$OUT/$name.mp4"
  if [ -s "$file" ]; then echo "skip  $name (already rendered)"; continue; fi
  start=$(date +%s)
  echo "start $name"
  if npx remotion render "$id" "$OUT/$name.part.mp4" --codec=h264 --concurrency="$(nproc)" --log=error; then
    mv "$OUT/$name.part.mp4" "$file"
    echo "done  $name in $(( $(date +%s) - start )) s, $(du -h "$file" | cut -f1)"
  else
    echo "FAIL  $name"
    failed=1
  fi
done
exit "$failed"
