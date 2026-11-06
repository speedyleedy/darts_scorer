#!/usr/bin/env bash
# Deploy TapDarts to Cloudflare Pages.
# Writes docs/version.txt first: the app checks it when it comes back on screen and reloads
# itself when it changes, so phones that keep old tabs in memory (iOS) pick up new versions.
set -euo pipefail
cd "$(dirname "$0")"

if [ -e docs/sampleImages ]; then
  echo "Warning: docs/sampleImages will be published with the site. Move it out of docs/ if it should stay private."
fi

v="$(date -u +%Y%m%d-%H%M%S)"
if git rev-parse --short HEAD >/dev/null 2>&1; then
  v="$v-$(git rev-parse --short HEAD)"
  [ -n "$(git status --porcelain -- docs)" ] && v="$v-dirty"
fi
printf '%s\n' "$v" > docs/version.txt
echo "Deploying version $v"

npx wrangler pages deploy docs --project-name tapdarts --commit-dirty=true
