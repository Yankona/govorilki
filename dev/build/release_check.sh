#!/bin/bash
# Release, step 1 of 2: build/release_check.sh <version> [--voice]
# Copies new site files from site-add/ into $SITE, sets the version in $SITE/sw.js, rebuilds the Russian pronunciation
# dictionary when asked (--voice: Russian texts changed; needs .venv-racc, see skill voice-stress), builds all four
# languages, checks that no new string is left untranslated, checks the built pages and packs (build/check_site.js)
# and runs the browser tests of tests/ci.sh (smoke on a phone and a laptop + tests/ci.txt, about 5 minutes).
# Exit codes: 2 usage, 3 untranslated strings (skill translate), 4 a browser test failed, 5 the site check failed.
set -eo pipefail
D=$(cd "$(dirname "$0")/.." && pwd); cd "$D"
export SITE=$(cd "${SITE:-$D/..}" && pwd)
V=$1; [[ "$V" =~ ^[0-9]+$ ]] || { echo "usage: $0 <version number> [--voice]"; exit 2; }
CUR=$(grep -o 'govorilki-v[0-9]*' "$SITE/sw.js" | head -1 | tr -dc 0-9)
[ "$V" -gt "$CUR" ] || { echo "version $V is not above the published $CUR"; exit 2; }
N=0   # every real file of site-add/ (not the .gitkeep placeholder) to the same path in the site
while IFS= read -r -d '' f; do r=${f#site-add/}; mkdir -p "$SITE/$(dirname "$r")"; cp "$f" "$SITE/$r"; N=$((N + 1)); done < <(find site-add -type f ! -name .gitkeep -print0 2>/dev/null)
if [ $N -gt 0 ]; then echo "site-add: $N files copied into the site"; fi
sed -i -E "s/govorilki-v[0-9]+/govorilki-v$V/" "$SITE/sw.js"
if [ "$2" = "--voice" ]; then timeout 1500 python3 build/say_ru.py | tail -2; fi
OUT=$(./build/build_all.sh 2>&1) || { echo "$OUT" | tail -20; exit 1; }
echo "$OUT" | grep -E "translated|missing"
# the baseline: 8 strings in 3 groups stay Russian on purpose in every language (GAMES, LEARN_IMG, SND_HI)
if echo "$OUT" | grep -E "built; missing" | grep -vq "missing 8 in 3 groups"; then
  echo "UNTRANSLATED: see i18n/out-{en,pt,de}.html.missing.json, then skill translate"; exit 3; fi
# the built pages: scripts parse, every data pack the page names is there with its hash, the service worker's files
# exist, source JSON parses, no secrets or personal emails (build/check_site.js, seconds)
node build/check_site.js | grep -v '^ok' || { echo "SITE CHECK FAILED (above)"; exit 5; }
# the smoke test on a phone and a laptop + the fast feature tests of tests/ci.txt (the same as the «Checks» action on
# every task branch, about 5 minutes)
tests/ci.sh || exit 4
echo "$V $(git -C "$SITE" rev-parse HEAD)" > "$D/.release-ok"   # build/publish.sh refuses a version not checked here
echo "READY: v$V built and checked in $SITE (git -C $SITE status --short to review)"
