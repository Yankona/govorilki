# «Комиксы» — how an episode is written

Говорилки turns reading and speech practice into an ongoing comic series for children 5–10. Each series has
6 episodes; a child reads one new episode a day; every episode ends with a cliffhanger («Продолжение завтра!»),
except episode 6 which closes the season. All characters and stories are ORIGINAL: no Marvel/DC/Disney/manga/cartoon
characters or look-alikes, no brands, no real people. Kind humour, no fear, no violence; villains are funny and end up
friends. Facts (space, dinosaurs, football rules) must be true.

## The hero
The child's own friend (a tiger cub, a koala, a panda, a unicorn… — it varies) is the hero, speaker id `me`. NEVER name
the hero or say what animal it is; others call the hero «Капитан» (detectives: «Детектив»). The hero's lines must fit
any friend and be gender-neutral in Russian: avoid past-tense verbs and adjectives about the hero in the hero's own
lines and in others' lines about the hero («Я нашёл/нашла» ✗ → «Нашёлся!/Вот он!», «Ты готов?» ✗ → «Готовы?»,
«Капитан, смотри!» ✓). The narrator (`nar`) is a caption box.

## Three reading levels — every text is an array of three: [L0, L1, L2]
- L0 (a child who just reads syllables, 5–6 y.): 1–4 short common words, max 22 letters, no rare words, no clusters
  of 3+ consonants, ends with «!» or «.» or «?». E.g. «Мяч в воде!», «Где торт?».
- L1 (reads short sentences, 7 y.): one sentence of 4–9 words, max 60 characters.
- L2 (fluent reader, 8–10 y.): 1–2 sentences, 9–22 words, max 140 characters; richer words, jokes, a fact.
All three tell the SAME moment of the story, so pictures fit all. Use «ё» everywhere it belongs.

## File format (JSON, UTF-8), one file per series: comics/<id>.ru.json
{
 "id": "<id>", "t": "<series title>", "e": "<one emoji>", "about": "<one line for the shelf, ≤ 60 chars>",
 "cast": { "<castId>": { "n": "Имя", "d": "кто это, ≤ 40 chars", "st": "имя с ударением: Шуст+рик" } },
 "pw": { "r": [3 lines], "l": [3 lines], "sz": [3 lines], "sh": [3 lines] },
 "tw": { "r": "…", "l": "…", "sz": "…", "sh": "…" },
 "eps": [ 6 episodes ]
}
- `pw` — «power phrases» the hero says to power up / open a door / start the rocket: 3–6 words, packed with the sound
  (r = Р; l = hard Л; sz = С and З; sh = Ш Ж Ч Щ), e.g. r: «Рыжий робот, раз-два-три!». Original, fun, fit the series.
- `tw` — an ORIGINAL tongue twister per sound (6–12 words) for the tongue-twister battle (not from books).

An episode:
{
 "t": "<episode title ≤ 30 chars>",
 "p": [ 3 or 4 panels ],
 "pw": { "bg": "<scene>", "who": ["me", …], "x": [L0, L1, L2], "battle": false },
 "q": [ [question, right, wrong, wrong] for L0, … for L1, … for L2 ],
 "ch": { "x": [L0, L1, L2], "o": [ { "b": "<button ≤ 24 chars>", "bg": "<scene>", "who": [...], "sp": "<speaker>", "x": [L0, L1, L2] }, { second option } ] },
 "end": [L0, L1, L2],
 "card": { "n": "<card name ≤ 22 chars>", "c": "<castId or emoji>", "d": "<one funny line ≤ 60 chars>" }
}
- a panel: { "bg": "<scene>", "who": ["me", "<castId>"], "sp": "<who speaks: me | castId | nar>", "x": [L0, L1, L2] }
  `who` = 1–3 characters drawn in the panel (left to right); `sp` must be in `who` or be `nar`.
- `pw` — the panel where the hero must say a power phrase: `x` is the narration/line just before it («Дверь открывается
  только паролем! Скажи его!»). In episode 4 of every series `battle: true`: it is a tongue-twister battle with a rival
  (`x` announces the battle).
- `q` — a comprehension question per level about THIS episode (the answer is in that level's texts), right answer
  first, 2 plausible wrong ones, each answer ≤ 30 chars.
- `ch` — the story branches: `x` asks what to do; two options, each with its own result panel (both are fine, just
  different and fun; one may be wiser — logic for the detectives).
- `end` — the cliffhanger caption (episodes 1–5 end with a question/hook; episode 6 ends the season happily).
- `card` — a collectible hero card earned by this episode (a character, an object, a place of the series).

Scenes (`bg`) to choose from: stadium, locker, park, street, city, room, kitchen, garden, space, pad, moon, mars,
lab, jungle, volcano, cave, sea, night.

Return nothing but the file; check it is valid JSON (python3 -c "import json;json.load(open('…'))").
