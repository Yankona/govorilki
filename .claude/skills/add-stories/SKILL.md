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

## «Что нового в мире»: weekly or monthly batches of true news (stories/news/)
Translated into en/pt/de (unlike the journey stories), so every batch is also a translation job. No code change is needed:
the build picks up every file in `stories/news/`.

### The weekly run (3–6 stories, e.g. a scheduled child session each Monday)
1. Pick 3–6 events of the last 7–10 days on our topics: space, animals, water (oceans, rivers), plants, tech (inventions,
   robots, how things work), sport, places on the globe, old times (archaeology). Check the titles already in
   `stories/news/*.json` — no repeats (a follow-up of an old story is fine if the news is new).
2. Safety, every story: kind and calm; no politics, elections, war, weapons, crime, disasters with victims, illness
   outbreaks, animal deaths, nothing scary; no brands as ads (a company name only when it is the fact, said once, neutral).
3. Facts: every fact and date from TWO reliable sources on two different sites (space agencies NASA/ESA/JAXA/Roscosmos,
   Reuters, AP, BBC, museums, universities, zoos, IUCN, official event sites). Wikipedia and blogs are not a source.
   Anything only one source says: drop it. Your training data is older than the news: search, never write from memory.
4. Write `stories/news/<YYYY-MM-DD>.json`, named by that Monday (a monthly file `<YYYY-MM>.json` works too):
   `{ "week": "2026-11-23", "news": [ { "id": "news-<slug>", "e": "🚀", "t": "<short title>", "date": "2026-11-19" (or "2026-11"),
   "topic": "space|animals|water|plants|tech|sport|places|old|art|music|ballet", "place": "<ISO country, optional>",
   "s": "<6–10 short sentences, 300–800 characters, starts with the date: «19 ноября 2026 года…»>", "q": "<question>",
   "a": ["<right>", "<wrong>", "<wrong>"], "src": ["https://…", "https://…"] } ], "stress": { "<name form>": "<with +>" } }`.
   Russian typography: «ёлочки», —, ё; no straight quotes or apostrophes. One hard word explained simply.
5. `RACCW=.cache/raccw python3 build/gen_news_jobs.py` → LEARN.news, newest first, a heading per month, the date on each
   card; stories older than a year move by themselves to «Архив новостей» (still readable). It adds the names' stress to
   say_manual.json and prints conflicts with the dictionary: a writer's stress for a common word is often wrong → `REJECT` there.
6. `./build/build_all.sh`, then `python3 i18n/fix_news_jobs.py --todo i18n/nj/todo-news.json` → give the todo file and
   `i18n/nj/BRIEF.md` to the `translator` subagent (output `i18n/nj/news-<YYYY-MM-DD>.json`; facts must stay true in each
   language), run `python3 i18n/fix_news_jobs.py` again, delete the todo file, build: «missing 8 in 3 groups».
7. `node tests/news_batch.js` (every batch: fields, real dates not in the future, the file's month or week, two sources,
   lengths, answers, typography, and a non-empty translation of every text), `node tests/news_jobs.js` (phone) and
   `… laptop`, smoke. Then the usual child-task report, or the release.
What the child sees: «Новое!» on the tile «Что нового в мире», on the tile of the story's topic (Космос, Океан и вода,
Растения, Что было раньше) and on the journey (a story with a `place` the family has), while it has news of the last 60
days not heard yet; inside a topic's section the latest news of that topic sit on top. The badge «Знаю новости» is for
the five newest stories; a new batch brings a new badge (P.newsB by month).

«Профессии» work the same way from `stories/jobs/*.json` (brief: `stories/jobs/BRIEF.md`; sections help, build, move, make,
learn, nature, digital; `tools` 3 emoji and `clue` feed «Угадай профессию», `tags` feed «Кем я буду?»).
