#!/bin/bash
# Release, step 2 of 2: build/publish.sh <commit-message-file>
# Commits everything in the repository (the built site and dev/) with the given message (Russian title, a short body,
# the session's attribution trailers), pushes main (the «Site» action deploys govorilki.com) and gh-pages (old links),
# and waits until https://govorilki.com/play/sw.js serves the new version.
set -eo pipefail
D=$(cd "$(dirname "$0")/.." && pwd)
SITE=$(cd "${SITE:-$D/..}" && pwd)
MSG=$1; [ -f "$MSG" ] || { echo "usage: $0 <commit-message-file>"; exit 2; }
V=$(grep -o 'govorilki-v[0-9]*' "$SITE/sw.js" | head -1)
cd "$SITE"
grep -q "(версия ${V#govorilki-v})" README.md || { echo "README.md has no note for ${V#govorilki-v}: add «**… (версия ${V#govorilki-v}).** …» at the top"; exit 3; }
git add -A && git commit -q -F "$MSG"
for i in 1 2 3 4; do git push -q origin main && break; timeout $((2 ** i)) tail -f /dev/null || true; done
for i in 1 2 3 4; do git push -q origin main:gh-pages && break; timeout $((2 ** i)) tail -f /dev/null || true; done
echo "pushed $(git log --oneline -1)"
for i in $(seq 30); do
  LIVE=$(curl -s "https://govorilki.com/play/sw.js?t=$RANDOM" | grep -o 'govorilki-v[0-9]*' | head -1)
  [ "$LIVE" = "$V" ] && { echo "LIVE: $V on https://govorilki.com/play/"; exit 0; }
  timeout 10 tail -f /dev/null || true
done
echo "NOT LIVE after 5 minutes: check the «Site» action in Yankona/govorilki"; exit 4
