# Translating «Что нового в мире» (news) and «Профессии» (jobs) — brief

Input: `i18n/nj/todo-<chunk>.json` — a JSON list of Russian strings (story titles, story texts, questions, answers,
riddles, UI). Output: `i18n/nj/<chunk>.json` — `{ "<russian, exactly as given>": ["<English>", "<European Portuguese>", "<German>"] }`
with EVERY string of the list. Validate with `python3 -c "import json; json.load(open('<file>'))"` and check that every key
of the todo list is present.

Style (read `i18n/GUIDE.md` and `i18n/de/GUIDE_DE.md` quickly): for children 4–12, read aloud by a voice.
- EN: simple, warm British English (colour, Mum, maths). PT: European Portuguese only (never Brazilian: ecrã, autocarro,
  comboio, telemóvel, equipa, pequeno-almoço). DE: simple, warm, du-form for children.
- Keep every `{0}`, `{1}`… exactly, and HTML tags, attributes, emoji.
- Stories: natural, not word-for-word; same length and facts; numbers may stay as digits.
- The question and its answers must match the translated story (if you change a detail in the story, change it in the answer too).
  Context: the full items are in `stories/jobs/*.json` and `stories/news/*.json` (fields t, s, q, a, clue).
- Facts must stay TRUE for a child in the UK, Portugal and Germany:
  emergency numbers — EN: 999 (also 112), PT: 112, DE: 112 for fire and ambulance, 110 police (DE); a Russian holiday or
  Russian-only fact → say «in Russia …» or replace with a true general fact; school subjects by local names
  (EN: maths, science, PE, design and technology; PT: Matemática, Estudo do Meio, Educação Física; DE: Mathe, Sachunterricht, Sport).
- Job stories are told by a person: «Привет! Меня зовут Олег, я пожарный.» → use an ordinary local first name of the SAME
  gender (EN: Oliver, Emily…; PT: Tiago, Inês…; DE: Lukas, Anna…), the same name in every string of that story.
  Job names (field t, e.g. «Пожарный»): in EN gender-neutral (firefighter, police officer); in PT and DE the form that
  matches the narrator's gender in that story (bombeira / Feuerwehrfrau when the narrator is a woman).
- News: real names of people and places in their usual spelling for each language (Artemis II, Sagrada Família, Bormio…).
- Months in UI: lowercase in PT (outubro), capitalised in EN/DE.
- Russian school grades/typography: use each language's quotes (EN “ ”, PT « », DE „ “).
