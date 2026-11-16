---
name: add-stories
description: Add journey stories to Говорилки (cities and countries — Кашкайш, Лиссабон, Порту и север, Португалия, Петербург, Россия and others) — format, length, facts, names' stress, Russian-only content, generation into the game, checks. Use when the owner wants more stories or a new place.
---
# Add stories

## Format: `stories/<batch>/<part>.json` (batch = the coming version, e.g. `v143`; parts a, b, c… one per writer)
```json
{ "<section>": [ { "id": "spb-grand-maket", "e": "🚂", "t": "Гранд Макет",
    "s": "<the story, 250–650 characters>", "q": "<a question about the story>",
    "a": ["<the right answer>", "<wrong>", "<wrong>"] } ],
  "stress": { "кашкайш": "кашк+айш" },
  "doubts": ["<facts the writer was not sure about>"] }
```
- Sections: cascais, lisbon, porto, pt, spb, russia (`ORDER` in `build/gen_stories.py`). A new place needs a new section
  in the `NEW` map there (name, emoji, colour, country) — that is a code change, test it.
- `id`: latin, unique across the game (`grep -c '"id": "<id>"' game/govorilki.html` must be 0 before).
- The first answer is the right one (the game shuffles).
- For 5–8-year-olds: concrete, vivid, true. Russian quotes «», dashes —, no straight apostrophes.
- Facts must be checkable; anything uncertain goes to `doubts` and gets checked (web search) or dropped.
- No repeats: list the titles already in the section (`LEARN.<section>.items` via a test hook, or grep) and give them to
  the writers.
- `stress`: every name with 2+ vowels, all forms used (Кашкайш, Кашкайше…).

## Write in parallel
Split by section; one `content-writer` subagent per part with: the section, how many, the existing titles, this format.

## Into the game
```
RACCW=<ruaccent workdir> python3 build/gen_stories.py   # all batches → the STORIES block; names' stress → say_manual.json
```
It prints conflicts with the dictionary: the name use wins for real names; a common word in the list is a writer's
mistake → add it to `REJECT` in gen_stories.py. New stories are Russian-only (MORE_STORIES = {} in the other languages).

## Check
`./build/build_all.sh`, `node tests/names141.js` (every capitalised word and its stress), `node tests/travel141.js`
(sections and counts, a story read aloud, the quiz has no two answers from one country), smoke.

## «Что нового в мире»: a monthly batch of true news (stories/news/YYYY-MM.json)
Translated into en/pt/de (unlike the journey stories), so every new batch is also a translation job.
1. Write `stories/news/<YYYY-MM>.json` (the month of the events; one file a month):
   `{ "month": "2026-12", "news": [ { "id": "news-<slug>", "e": "🚀", "t": "…", "date": "2026-12-05" (or "2026-12"),
   "topic": "space|animals|water|plants|tech|sport|places|old|art|music|ballet", "place": "<ISO country, optional>",
   "s": "<6–10 sentences, 350–750 characters, starts with the date: «5 декабря 2026 года…»>", "q": "…", "a": [right, wrong, wrong],
   "src": ["<reliable source url>", "<second>"] } ], "stress": {…} }`.
   Real, recent, kind events only: check every fact and date with web search on reliable sources (agencies, NASA/ESA,
   Reuters/AP/BBC, museums, universities); no politics, war, disasters with victims, nothing scary; a company name only when
   it is the fact. A `content-writer` per topic group works well (brief: the topics, the month, this format).
2. `RACCW=.cache/raccw python3 build/gen_news_jobs.py` → LEARN.news (newest first, a heading per month), names' stress →
   say_manual.json (a writer's stress for a common word is often wrong: put it into `REJECT` there).
   «Новое!» shows by itself in the section of the topic (space, water, plants, old…) and of the country (`place`).
   The badge «Знаю новости» is for the five newest stories; a new batch makes a new badge.
3. `./build/build_all.sh`, then `python3 i18n/fix_news_jobs.py --todo i18n/nj/todo-news-<YYYY-MM>.json` → give the todo
   file and `i18n/nj/BRIEF.md` to the `translator` subagent (output `i18n/nj/news-<YYYY-MM>.json`), run fix_news_jobs.py
   again, delete the todo file, build: «missing 8 in 3 groups».
4. `node tests/news_jobs.js` (phone) and `… laptop`.
«Профессии» work the same way from `stories/jobs/*.json` (brief: `stories/jobs/BRIEF.md`; sections help, build, move, make,
learn, nature, digital; `tools` 3 emoji and `clue` feed «Угадай профессию», `tags` feed «Кем я буду?»).
