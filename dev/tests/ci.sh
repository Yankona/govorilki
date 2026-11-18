#!/bin/bash
# The fast browser tests, for every task branch (.github/workflows/checks.yml) and every release (build/release_check.sh):
# the smoke test on a phone and a laptop, then each test named in tests/ci.txt (one per line: [VAR=value …] test.js
# [arguments]; # starts a comment). Serves the built site itself unless something already answers on :8781.
# Prints one line per test with its time; exits 1 if any failed (their last lines are shown).
# Usage, from dev/ after build/build_all.sh: tests/ci.sh        env: CI_TIMEOUT=300 (seconds per test)
D=$(cd "$(dirname "$0")/.." && pwd); cd "$D" || exit 2
mkdir -p tests/shots
LOG=$(mktemp -d); STARTED=
up() { curl -s -o /dev/null -w "%{http_code}" http://localhost:8781/govorilki/ru/ | grep -q 200; }
if ! up; then
  (tests/serve.sh >/dev/null 2>&1 &); STARTED=1
  for i in $(seq 40); do up && break; sleep 0.5; done
  up || { echo "tests/ci.sh: the site does not answer on :8781"; exit 2; }
fi
trap '[ -n "$STARTED" ] && pkill -f "http.server 8781"; rm -rf "$LOG"' EXIT
FAILED=(); T0=$(date +%s)
run() {   # run <name> <command…>
  local n=$1; shift; local s=$(date +%s)
  if timeout "${CI_TIMEOUT:-300}" "$@" < /dev/null > "$LOG/$n.txt" 2>&1; then echo "ok   $n ($(( $(date +%s) - s )) s)"
  else echo "FAIL $n ($(( $(date +%s) - s )) s)"; FAILED+=("$n"); fi
}
run smoke-phone node tests/smoke.js
run smoke-laptop node tests/smoke.js http://localhost:8781/govorilki/ laptop
while read -r line; do
  line=${line%%#*}; read -ra w <<< "$line"; [ ${#w[@]} = 0 ] && continue
  vars=(); while [[ "${w[0]}" == *=* ]]; do vars+=("${w[0]}"); w=("${w[@]:1}"); done
  run "${w[0]}" env "${vars[@]}" node "tests/${w[0]}" "${w[@]:1}"
done < tests/ci.txt
echo "tests/ci.sh: $(( $(date +%s) - T0 )) s"
for n in "${FAILED[@]}"; do echo "--- $n (last lines)"; tail -15 "$LOG/$n.txt"; done
[ ${#FAILED[@]} = 0 ] && echo "ALL GREEN" || { echo "FAILED: ${FAILED[*]}"; exit 1; }
