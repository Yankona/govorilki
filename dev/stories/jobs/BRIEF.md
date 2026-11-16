# «Профессии» — brief for writers

Each profession is a short story «один день из жизни», told in the first person by a grown-up who does this work,
for children 4–12 (read aloud by the game's voice). Mix women and men naturally (about half and half; also in jobs
people think of as «male» or «female»). Invented first names only, ordinary Russian ones (Аня, Олег, Марина, Тимур…),
never the names Тина, Тоша, Тим, and no famous people.

Story `s` (7–10 short sentences, 450–850 characters):
1. «Привет! Меня зовут Марина, я ветеринар.» (who + the job word);
2. what the day looks like, concrete and vivid (morning → work → a nice moment);
3. the tools (2–4 named tools);
4. which school subjects help («В школе мне больше всего пригодились…»);
5. one fun, true fact about the job;
No dangerous or scary details, no weapons focus (police: helping, finding lost children, road safety),
no brands, healthy framing (blogger: works a few hours, checks facts, no chasing likes). True facts only.
Russian typography: «ёлочки», —, ё everywhere it belongs, no straight apostrophes, no English words in the text.

JSON item:
{ "id": "job-<latin-slug>", "e": "<one emoji for the job, e.g. 🧑‍🚒 👩‍⚕️ 🧑‍🍳>", "t": "<job name, Russian, nominative, e.g. «Пожарный», «Ветеринар»>",
  "sec": "<section key, given to you>", "s": "<story>",
  "q": "<a question about the story>", "a": ["<right answer, 1–5 words>", "<wrong>", "<wrong>"],
  "tools": "<exactly 3 emoji of the job's tools or things, NOT the job emoji itself, e.g. 🚒🧯🪜>",
  "clue": "<a riddle for the game «Угадай профессию», one sentence in the first person WITHOUT the job word, e.g. «Я приезжаю на красной машине с сиреной и тушу огонь водой.»>",
  "tags": ["<2–3 of: help, animals, nature, tech, build, art, music, stage, sport, science, computers, words, travel, food>"] }
Tags mean what the child likes: help = помогать людям, animals = звери, nature = природа и растения, tech = машины и механизмы,
build = строить и мастерить руками, art = рисовать и придумывать красивое, music = музыка, stage = выступать перед людьми,
sport = двигаться, спорт, science = опыты и открытия, computers = компьютеры, words = книги, слова, рассказы,
travel = путешествовать, food = готовить еду.

File: { "jobs": [ … ], "stress": { "<lowercase name or word form>": "<with + before the stressed vowel, e.g. мар+ина>" }, "doubts": [ … ] }
Every first name used (and its forms) goes to "stress"; also rare words (дрон, логопед…) if the stress may be unclear.
