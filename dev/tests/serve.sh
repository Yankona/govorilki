#!/bin/bash
# Serves the built site ($SITE, default: the repository root above dev/) at http://localhost:8781/govorilki/
# as the tests expect. Usage: tests/serve.sh &   (stop: pkill -f "http.server 8781")
D=$(cd "$(dirname "$0")/.." && pwd); SITE=$(cd "${SITE:-$D/..}" && pwd)
mkdir -p "$D/.srv" && ln -sfn "$SITE" "$D/.srv/govorilki"
cd "$D/.srv" && exec python3 -m http.server 8781 --bind 127.0.0.1
