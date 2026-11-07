---
name: release
description: Release a new version of Говорилки to govorilki.com and the artifact — version bump, build of 4 languages, translation check, voice dictionary, smoke tests, README note, push, wait for live, artifact, report. Only the parent session releases. Use after child branches are merged into main, or when the owner asks to publish.
---
# Release

From `dev/`, on an up-to-date `main` (`git pull -q origin main`), with the children's branches merged.

1. **Version**: N = the live number + 1 (`grep -o 'govorilki-v[0-9]*' ../sw.js`). One version per batch.
2. **Build and check**: `build/release_check.sh N` — add `--voice` if Russian texts changed (new text, stories,
   `say_manual.json`); it needs `.venv-racc` (skill `voice-stress`) and ~2 min.
   - exit 3 → untranslated strings: skill `translate`, then run it again;
   - exit 4 → a smoke test failed: fix, then run it again;
   - also run the feature tests the children wrote (`tests/<slug>.js`) against the served site.
3. **README note** at the top of `../README.md`, right before the latest note (the first line that starts with `**`
   and has `(версия …).**`). Russian, for the owner, no code words:
   `**<Что нового, коротко> (версия N).** <2–5 предложений: что изменилось и где это найти>`
   Build it from the children's «Заметка для README».
4. **Clean up**: `site-add/` files are now copied into the site — `git rm -r -q site-add/*` except `.gitkeep`;
   move the tasks to «Сделано» in `BACKLOG.md` with the version.
5. **Commit message** file (Russian title «<что нового> (vN)», 2–4 lines of body, the session's attribution trailers),
   then `build/publish.sh <file>`: one commit of the site and `dev/`, pushes `main` and `main:gh-pages`, waits until
   https://govorilki.com/play/sw.js serves vN (prints LIVE). If NOT LIVE: look at the «Site» action.
6. **Artifact**: Artifact publish of `ru/index.html` (repo root) with
   `url: https://claude.ai/artifact/QGYxZFefN7EH7khLeqiVvt` and `label: "vN <коротко>"` (read it first if this session has
   not published it). The warning about downloads is known — ignore it.
7. **Branches**: merged `task/*` branches stay on GitHub (the session's git proxy refuses branch deletion with 403);
   the owner can delete them on GitHub if they get in the way.
8. **Report** to the owner in Russian: point by point what they asked for and what is live now, then what is still open.
   Link: https://govorilki.com/play/ru/ — the game updates itself on the next start.
