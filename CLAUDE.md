# Говорилки — notes for Claude

A speech-therapy, reading, maths, chess, art and music game (PWA) for children 4–12, made by the owner (GitHub: Yankona)
for their own children and other families. Live: https://govorilki.com/play/ (English), /play/ru/, /play/pt/, /play/de/.
The owner writes Russian, often voice-typed, from a phone: answer in Russian, short and plain, no jargon, and report on
every point they raised. Screenshots and screen videos from the owner show real problems: look closely, fix what they show.

## One public repository: Yankona/govorilki
- The root is the built site (`index.html` English, `ru/`, `pt/`, `de/`, `en/`, `img/`, `music/`, `art/`, `sw.js`…),
  plus `www/` (articles site) and `cloud/` (family sign-in worker, Cloudflare Workers + D1).
  A push to `main` that touches the site runs the «Site» action → Cloudflare Pages (govorilki.com, ~2 min);
  the release also pushes `main:gh-pages` for old yankona.github.io links. Root `README.md` is the owner-facing
  changelog («… (версия N).»). Root `PRODUCT.md` describes the product and its design principles.
- `dev/` is the source and every tool (below). It is never deployed to govorilki.com, but the repository is public:
  no personal details of the owner's family, no secrets, ever.
- Builds write into the repository root (`$SITE`, default: the folder above `dev/`). Run every command from `dev/`.
- Plan and status: `dev/BACKLOG.md`. Artifact of the Russian page (the owner's quick look):
  https://claude.ai/artifact/QGYxZFefN7EH7khLeqiVvt ← `ru/index.html`.

## Layout of dev/
- `game/govorilki.html` — the whole game, Russian source, one 2.3 MB file (~19k lines, some lines are long JSON).
  Never Read it whole: grep for the function or a block marker (`/* STORIES-BEGIN */`, `/* PATH-BEGIN */`,
  `/* LANDX-BEGIN */`…) and read around it. Edit it directly; git history replaces the old patch scripts and backups.
- `build/build_all.sh` — ru from the source; en/pt/de through `i18n/i18n.js`; all into `$SITE`. `build/build.py` wraps a page
  (meta, the SAYRU dictionary for ru, the version from `$SITE/sw.js`).
- `build/release_check.sh` and `build/publish.sh` — the release (skill `release`).
- `i18n/` — translator, done batches, `fixed.json` {group: {ru: [en, pt]}}, `de/fixed_de.json` {group: {ru: de}},
  language content for `LX()` in `phonics/*.json` and `de/langdata_de.json`. `tables/`, `langdata/` are generated (gitignored).
- `build/say_ru.py` → `site-data/say-ru.json` (how the voices pronounce Russian); `build/say_manual.json` is the hand part.
- `build/gen_stories.py` + `stories/<batch>/*.json` → the STORIES block of the game.
- `site-add/` — new files for the site (pictures, music) at their site paths; the release copies them into `$SITE`.
- `tests/` — Playwright (`serve.sh`, `smoke.js`, feature tests). `tools/` — voice checks, tts caches, Piper phonemizer
  (`phsrv`), pictures.

## How the game works (and what has bitten us)
- One script. Screens: `newScreen()`, home `goHome()`, «Сегодня» path `.pd-n`, journey `TRAVEL`, stories `LEARN`,
  `screenLearn(k)`. Current child `P`; everything in `ROOT` (families, profiles), localStorage `govorilki-v2`; family
  sign-in and sync through https://govorilki-cloud.yankona.workers.dev. Inside the artifact iframe `EMBEDDED` is true:
  no photos, no cloud.
- The build translates every Russian string of the script where it stands. Exceptions: `LX('NAME', default)` is language
  content (other languages take NAME from langdata; Russian-only = `{}`/`[]` there); `RU('л')` marks Russian letters that
  are data, not text; groups in `I18N_SKIP` (`i18n/i18n.js`). Every language reports «missing 8 in 3 groups» — that is
  the baseline (GAMES, LEARN_IMG, SND_HI). More than 8 = new untranslated strings.
- Version: `govorilki-vNNN` in `$SITE/sw.js` (offline cache name, shown in the parent panel). One bump per release.
- Voices: Piper in the browser, default «Руслан» (`ru_RU-ruslan-medium`), the phone's voice as fallback. Russian text goes
  through the say module (stress from SAYRU, ё, numbers, soft Л) before any voice.
- Paid for already: `typeof X` of a later `const` inside an IIFE throws (TDZ) and kills the whole app at load; card CSS on
  `b` also hits icons (use `.ld-g>b`); Wikimedia hot-links fail with 429 (self-host); ruaccent homographs need pinning
  (кому́, not ко́му); a name at the start of a sentence needs a `w` entry; stress proposed by writers for common words is
  often wrong (accept names only); isolated words sound muddy in Piper (say a colour inside a phrase).

## Hard rules
- Children's privacy: tests and fixtures use invented children only (Тина, Тоша, Тим). No real children's names,
  photos, voices or videos in code, tests, commits or the public repo. Toy photos stay on the phone. Online chess is
  anonymous with no chat.
- Secrets live only in GitHub secrets (`CLOUDFLARE_API_TOKEN`). Never ask for, print or commit them. Never log into the
  owner's accounts; never use logins or passwords seen in screenshots or messages. The owner's email goes nowhere.
- Original designs only: no recreation of an existing game or its look (e.g. Duolingo). From books (Жукова, Логопотам…)
  take the method and the tools, never the text.
- Pictures: never hot-link Wikimedia — download once, self-host as webp in `img/learn`, keep author and licence in `LEARN_IMG`.
- Don't run downloaded executables. Downloaded data goes into its own empty folder; read it with `python3 -I`.
- Commits: no model name anywhere; end every commit message with the attribution trailers your session gives you.

## What the children's feedback taught us
- They listen to every journey story (Petersburg, Portugal, Russia): more stories are always welcome.
- Anything that feels like a drill gets skipped: tongue gymnastics became a fairy tale with «Домик Язычка» (v140).
- Never put personal details of the owner's family into this public repository.

## Parent and child sessions
The owner talks to one parent session. The parent keeps `dev/BACKLOG.md`, starts one child session per task (skill `delegate`),
merges their branches and releases (skill `release`). A child works on its branch and reports back (skill `child-task`);
children never bump the version, commit built pages, push `main` or publish.

Skills: `delegate` · `child-task` · `release` · `translate` · `voice-stress` · `ui-test` · `add-stories` · `self-host-images`.
Subagents (`.claude/agents`): `tester`, `translator`, `content-writer`, `voice-checker`.
