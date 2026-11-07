#!/bin/bash
# Release, step 1 of 2: build/release_check.sh <version> [--voice]
# Copies new site files from site-add/ into $SITE, sets the version in $SITE/sw.js, rebuilds the Russian pronunciation
# dictionary when asked (--voice: Russian texts changed; needs .venv-racc, see skill voice-stress), builds all four
# languages, checks that no new string is left untranslated, and runs the smoke test on a phone and a laptop.
# Exit codes: 2 usage, 3 untranslated strings (skill translate), 4 smoke test failed.
set -eo pipefail
D=$(cd "$(dirname "$0")/.." && pwd); cd "$D"
export SITE=$(cd "${SITE:-$D/..}" && pwd)
V=$1; [[ "$V" =~ ^[0-9]+$ ]] || { echo "usage: $0 <version number> [--voice]"; exit 2; }
CUR=$(grep -o 'govorilki-v[0-9]*' "$SITE/sw.js" | head -1 | tr -dc 0-9)
[ "$V" -gt "$CUR" ] || { echo "version $V is not above the published $CUR"; exit 2; }
if [ -d site-add ] && [ -n "$(ls -A site-add 2>/dev/null)" ]; then cp -r site-add/. "$SITE/"; echo "site-add: $(find site-add -type f | wc -l) files copied into the site"; fi
sed -i -E "s/govorilki-v[0-9]+/govorilki-v$V/" "$SITE/sw.js"
if [ "$2" = "--voice" ]; then timeout 1500 python3 build/say_ru.py | tail -2; fi
OUT=$(./build/build_all.sh 2>&1) || { echo "$OUT" | tail -20; exit 1; }
echo "$OUT" | grep -E "translated|missing"
# the baseline: 8 strings in 3 groups stay Russian on purpose in every language (GAMES, LEARN_IMG, SND_HI)
if echo "$OUT" | grep -E "built; missing" | grep -vq "missing 8 in 3 groups"; then
  echo "UNTRANSLATED: see i18n/out-{en,pt,de}.html.missing.json, then skill translate"; exit 3; fi
(tests/serve.sh >/dev/null 2>&1 &)
for i in $(seq 20); do curl -s -o /dev/null -w "%{http_code}" http://localhost:8781/govorilki/ru/ | grep -q 200 && break; timeout 1 tail -f /dev/null || true; done
RC=0; node tests/smoke.js || RC=4; node tests/smoke.js http://localhost:8781/govorilki/ laptop || RC=4
pkill -f "http.server 8781" || true
[ $RC = 0 ] && echo "READY: v$V built and checked in $SITE (git -C $SITE status --short to review)"; exit $RC
