#!/usr/bin/env bash
# Deploy TapDarts to Cloudflare Pages.
#
# Builds a copy of docs/ in a temporary folder (so the source stays untouched), then:
#  - writes version.txt: the app checks it when it comes back on screen and reloads when it changes,
#    so phones that keep old tabs in memory (iOS) pick up new versions;
#  - adds ?v=<version> to every local script and stylesheet in the HTML pages, so each deploy uses
#    new file addresses and no browser can reuse an old cached copy;
#  - leaves out docs/sampleImages, which is not part of the site.
set -euo pipefail
cd "$(dirname "$0")"

v="$(date -u +%Y%m%d-%H%M%S)"
if git rev-parse --short HEAD >/dev/null 2>&1; then
  v="$v-$(git rev-parse --short HEAD)"
  [ -n "$(git status --porcelain -- docs)" ] && v="$v-dirty"
fi

out="$(mktemp -d)"
trap 'rm -rf "$out"' EXIT
rsync -a --exclude sampleImages --exclude .DS_Store --exclude version.txt docs/ "$out/"
printf '%s\n' "$v" > "$out/version.txt"
for page in "$out"/*.html; do
  V="$v" perl -pi -e 's{(src|href)="((?:js|css|vendor|img)/[^"?#]+)"}{$1="$2?v=$ENV{V}"}g' "$page"
done

echo "Deploying version $v"
npx wrangler pages deploy "$out" --project-name tapdarts --commit-dirty=true
