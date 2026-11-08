---
name: delegate
description: Parent session of Говорилки — turn the owner's request into tasks, start one child cloud session per task, track them in dev/BACKLOG.md, merge their branches and release. Use when the owner asks for several things, or for anything bigger than a quick fix that a child can do while the parent stays light.
---
# Delegate work to child sessions

The parent stays small: it plans, starts children, reads their short reports, merges and releases. It does not do the
heavy work itself (no reading the 2 MB game, no long test runs), so its context stays cheap for the whole day.

## 1. Plan
- Split the request into tasks; one task = one child = one branch `task/<slug>` (slug: short latin, e.g. `stories-porto`).
- Prefer tasks that touch different parts (stories / a game screen / voice / pictures) so branches merge cleanly.
  Two tasks in the same function → one child, or one after the other.
- Quick things (a one-line fix, a question) the parent may do itself.
- Add every task to `dev/BACKLOG.md` under «В работе» with slug, date and the owner's words.

## 2. Start the children
- This session's id: `get_session` (claude-code-remote) with no `session_id`.
- For each task `create_session` with:
  - `source_url`: `https://github.com/Yankona/govorilki`
  - `title`: `Говорилки · <задача по-русски>`
  - `model`: `claude-sonnet-5-5` for routine work (tests, translations, stories, pictures, small fixes, checks);
    omit it (the parent's model) for new games, design, tricky bugs.
  - `prompt` (fill in, keep the owner's own words):
    ```
    You are a child session of Говорилки. Parent session: <parent session id>.
    Task «<slug>»: <what to do>. The owner's words: «<quote>».
    Done when: <checks that prove it>.
    Follow the skill child-task (.claude/skills/child-task/SKILL.md): branch task/<slug>, build, test, push the branch,
    report to the parent with send_message. Do not release.
    ```
- Tell the owner in one or two lines which tasks went out; they can watch each child in their session list.

## 3. Wait
- Do not poll and do not sleep. Each child reports with `send_message` (it arrives here as a new turn); a failed child
  arrives as a `<child-session-event>`. Only if a child is silent for long: `get_session` once, then
  `list_events` with `kinds: ["result"]` to read how its last turn ended.
- Answer a child's question with `send_message` to its session id; if only the owner can decide, ask the owner.

## 4. Merge and release
- When the reports of a batch are in:
  `git fetch origin task/<slug> && git merge --no-ff origin/task/<slug>` for each, in a sensible order.
- Conflicts: in `game/govorilki.html` merge by hand (both sides usually add) — never `git checkout --ours` the whole game
  file: it silently drops the branch's other changes (v145: the «Что было раньше?» quiz was lost that way). A conflict
  inside the STORIES block: take either side there only, then rerun `build/gen_stories.py`; the anonymous `() => {…}`
  group in `fixed.json` is keyed by that block's code, so after a change copy its translations to the new key; in `i18n/fixed.json`, `say_manual.json`
  keep both entries; generated files are not in git — rerun the generator. Children never commit built pages, so the site
  files do not conflict.
- Then the skill `release` (one version for the whole batch; the README note is made of the children's notes).
- `archive_session` for finished children once the owner has seen the result.

## 5. Report to the owner
Russian, short: what is live now (per the owner's points), what is still in work, what needs their decision.
