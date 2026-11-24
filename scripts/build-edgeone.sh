#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."
workspace="$(mktemp -d)"
trap 'rm -r -- "$workspace"' EXIT

source_dir="$workspace/dreamhealer"
target_dir="gal/dreamhealer"

git clone --depth 1 --branch main https://github.com/frosttear/gal-dreamhealer.git "$source_dir"
(
    cd "$source_dir"
    python3 scripts/build-tyrano.py
)

test -s "$source_dir/dist/index.html"
test -s "$source_dir/dist/engine/index.html"
mkdir -p "$target_dir"
cp -a "$source_dir/dist/." "$target_dir/"
test -s "$target_dir/index.html"
test -s "$target_dir/engine/index.html"
