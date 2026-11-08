#!/bin/bash
# Builds the pages into $SITE, the root of this repository (default: the folder above dev/): English is the main page ($SITE/),
# then $SITE/ru/, $SITE/pt/, $SITE/de/ and $SITE/en/ (English, for old links).
set -e
D=$(cd "$(dirname "$0")/.." && pwd)
T=$D/i18n
export SITE=$(cd "${SITE:-$D/..}" && pwd)
cd $D
# a fresh clone has no node_modules (gitignored): install acorn for the translator once
[ -d $T/node_modules/acorn-walk ] || (cd $T && npm ci --silent)
# English is the main page (site/), Russian and Portuguese one folder down; site/en/ stays English for old links
python3 build/build.py game/govorilki.html $SITE/ru ru
python3 $T/merge.py         # English, Portuguese: translated batches + i18n/fixed.json → tables/{en,pt}.json, langdata/{en,pt}.json
python3 $T/de/merge_de.py   # German: translated batches + additions → tables/de.json, langdata/de.json
for L in en pt de; do
  node $T/i18n.js build game/govorilki.html $L $T/tables/$L.json $T/langdata/$L.json $T/out-$L.html
  python3 build/build.py $T/out-$L.html $SITE/$L $L
done
python3 build/build.py $T/out-en.html $SITE en
