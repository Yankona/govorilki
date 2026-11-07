---
name: ui-test
description: Test Говорилки in a real browser — Playwright against the built site with an invented family, a phone and a laptop, the voice captured, page errors caught, screenshots to look at. Use after any change to the game, to reproduce a bug the owner reports, and before every release.
---
# UI tests

## Run
```
./build/build_all.sh                       # from dev/: builds into the repo root
(tests/serve.sh >/dev/null 2>&1 &)         # http://localhost:8781/govorilki/  (ru/, pt/, de/; English at the root)
node tests/smoke.js                        # 4 languages on an iPhone 13: who-plays → child → «Сегодня» → step → journey
node tests/smoke.js http://localhost:8781/govorilki/ laptop
```
Screenshots land in `tests/shots/` (gitignored). Look at the ones that matter with Read. For the owner use
`deviceScaleFactor: 2`; for your own checks 1.

## Write a test for your change: `tests/<slug>.js`
Copy `tests/smoke.js` (or a feature test like `travel141.js`, `v140.js`, `kids138.js`) and keep its harness:
- **Hook**: the page is fetched through `route` and `window.__T = { run: s => eval(s) }` is injected after
  `const fam = () => ROOT.families[ROOT.curFam] || null;` — then `__T.run("screenLearn('spb')")`, `__T.run('P.stars')`…
- **Seed**: `addInitScript` writes localStorage `govorilki-v2` once: an invented family (Тина 5, Тоша 8, Тим), `micOff`,
  `srOff`, `engine: 'device'`. Never real names.
- **Voice**: replace `speechSynthesis.speak` to push `u.text` into `window.__said` and call `onend` — then assert what
  the game said.
- **Network**: abort ntfy, wikipedia, wikimedia, huggingface, jsdelivr, youtube, workers.dev — tests must not depend on them.
- **Errors**: collect `pageerror`; any error = fail. Print one line per check; exit 1 on failure.
- Devices: `devices['iPhone 13']` (the family's phones are iPhones) and a 1280×800 laptop; the rail appears from 900 px,
  the side column from 1100 px.

## Reproducing the owner's bug
Build the exact path from their words or video (who taps what, in which language, with a signed-in family or not), make
it fail first, then fix, then keep the test in `tests/`.
