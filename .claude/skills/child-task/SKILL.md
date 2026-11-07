---
name: child-task
description: How a child session of Говорилки does its one task — branch, change, build, translate, test, push the branch, report to the parent session with send_message. Use whenever your prompt says you are a child session of Говорилки.
---
# Child task

## 1. Set up (fresh container, repository Yankona/govorilki)
```
git checkout -b task/<slug>
cd dev && (cd i18n && npm ci --silent)
```
Read CLAUDE.md first. Run commands from `dev/`. Keep your context small: grep the game, never Read it whole.

## 2. Do the task
- Change `dev/game/govorilki.html` directly (Edit with an exact old_string; it is one file, so keep changes local).
- New Russian UI text → translate it (skill `translate`); Russian stress fixes → `build/say_manual.json` (skill
  `voice-stress`); new stories → `stories/<batch>/` + `build/gen_stories.py` (skill `add-stories`); new pictures or music
  for the site → `dev/site-add/<path as on the site>` (skill `self-host-images`).
- Big parallel chunks (e.g. 40 stories, 300 translations) → subagents from `.claude/agents` (`content-writer`,
  `translator`, `tester`, `voice-checker`); give each a narrow brief.

## 3. Check
```
./build/build_all.sh            # builds into the repo root; must end with «missing 8 in 3 groups» for en, pt, de
(tests/serve.sh >/dev/null 2>&1 &)
node tests/smoke.js && node tests/smoke.js http://localhost:8781/govorilki/ laptop
node tests/<slug>.js            # your own test of what you changed (skill ui-test)
```
Look at the screenshots that matter (Read the png). Fix until everything is green.

## 4. Never
- commit the built pages (root `index.html`, `ru/`, `en/`, `pt/`, `de/`, `sw.js`) — the parent's release builds them;
- bump the version, push to `main`, publish the artifact;
- run `build/say_ru.py`, commit `dev/site-data/say-ru.json` or `dev/tools/tts/*` caches — the release regenerates them;
- put real children's data or the owner's family details anywhere — the repository is public.

## 5. Push and report
Commit only the source (from the repo root):
```
git add dev .claude CLAUDE.md && git commit -F <message file with your session's trailers>
git checkout -- . && git push -u origin task/<slug>      # drop the built pages, push the branch
```
Then `send_message` (claude-code-remote) to the parent session id from your prompt, at most ~12 lines, Russian:
```
[task/<slug>] готово            (или: не готово — <почему>)
Сделано: <2–4 строки, словами владельца, без кода>
Проверки: сборка ок (missing 8), smoke ru/en/pt/de ок (телефон, ноутбук), <свой тест> ок
Заметка для README: **<Заголовок>.** <1–3 предложения для владельца>
Нужно от владельца: <вопрос> / ничего
```
If you have no send_message tool, end your turn with exactly this report instead (the parent reads it from your
session). If you are blocked, report the block the same way — never fake a result.
