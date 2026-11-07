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
