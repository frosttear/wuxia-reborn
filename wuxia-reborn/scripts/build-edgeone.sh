#!/usr/bin/env bash
set -euo pipefail

repo="https://github.com/frosttear/gal-dreamhealer.git"
branch="main"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

git clone --depth 1 --branch "$branch" "$repo" "$tmp/src"
python3 "$tmp/src/scripts/build-tyrano.py"
mkdir -p gal/dreamhealer
cp -a "$tmp/src/dist/." gal/dreamhealer/
test -s gal/dreamhealer/index.html
test -s gal/dreamhealer/engine/index.html
