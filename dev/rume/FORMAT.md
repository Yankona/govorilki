# «Русский для меня» — content format (dev/rume/*.json)

For children 8–14 who live abroad and speak Russian at home, but their Russian is stuck at home-talk level.
Texts are about what the child is into (space, football…), NOT rhymes or drills. Original writing only.

Each file is a JSON array of text objects:

```json
{
  "id": "space1",              // topic + level number (1, 2, 3)
  "t": "space",                // topic id
  "lv": 1,                     // 1 = easy (short simple sentences, ~45–60 words), 2 = middle (~60–80 words), 3 = richer (~80–110 words, a few less common words)
  "e": "🚀",                   // one emoji
  "title": "Как спят космонавты",
  "text": "4–6 sentences. Interesting, true, concrete facts. Vocabulary beyond home talk: school, science, feelings.",
  "q": ["A question about the text?", "the right answer", "wrong 1", "wrong 2"],
  "v": ["a word FROM the text (beyond everyday)", "its simple meaning", "wrong meaning", "wrong meaning"],
  "g": [
    {"k": "case", "s": "Космонавты летят на … станцию.", "a": "космическую", "o": ["космической"]},
    {"k": "gend", "s": "…", "a": "…", "o": ["…"]},
    {"k": "asp",  "s": "…", "a": "…", "o": ["…"]},
    {"k": "num",  "s": "…", "a": "…", "o": ["…", "…"]},
    {"k": "calq", "s": "…", "a": "…", "o": ["…"]}
  ],
  "w": ["три", "слова", "из текста"],           // 3 words from the text to copy in Cyrillic handwriting (4–9 letters, no ё ideally, no hyphens)
  "say": "Speaking task for 30 seconds about the child's own experience or opinion on the topic, e.g. «Расскажи, каким был бы твой день на космической станции.»"
}
```

Grammar items `g` — exactly 5 per text, one of each kind, built from WORDS OF THAT TEXT, typical errors of bilingual children:
- `case`: noun case after a preposition or verb, esp. в/на + accusative (direction) vs prepositional (place): «иду в школу» / «я в школе», «играю в футбол», «думаю о космосе». `o` = the same word in the wrong case.
- `gend`: adjective/pronoun/past-tense agreement with the noun's gender: «большой стадион», «новая ракета», «моё окно», «команда выиграла». `o` = the same word in the wrong gender.
- `asp`: verb aspect: one finished result (прочитал, построил) vs process/repeated (читал, строил). The sentence must make only one answer right (use «уже/за час/до конца» vs «каждый день/долго/часто»). `o` = the other aspect.
- `num`: numbers with nouns: два/три/четыре + gen. sg (два мяча), пять+ + gen. pl (пять мячей), один + nom (один мяч), also «много/несколько + gen. pl». `o` = 1–2 wrong forms of the same noun.
- `calq`: a natural Russian phrase vs a word-for-word calque from English/Portuguese/German that bilingual kids say: «мне девять лет» (not «я имею девять лет»), «сфотографировать» (not «сделать фото» is ok-ish — avoid borderline ones), «ехать на автобусе» (not «брать автобус»), «принять решение» (not «сделать решение»), «скучаю по тебе», «звонить бабушке» (not «звонить к бабушке»), «он прав» (not «он имеет право» in that sense), «в субботу» (not «на субботу»), «играть на гитаре», «смотреть фильм» ... For `calq` the sentence `s` gives a context with «…» for the whole phrase, `a` is the natural phrase, `o` the calque. Only one option may be correct Russian in that context.

Rules for every gap item: `s` contains «…» exactly once; `a` + each of `o` fill the gap; only `a` is correct; the wrong options are real word forms (no invented words). Sentence ≤ 12 words, on the text's topic.

Language: correct, natural, modern Russian; ё everywhere it belongs; «ёлочки» quotes; long dash —. No real people's private names; famous facts ok (Гагарин, Пеле ok). Kind tone, no war/politics/scary details. Facts must be true — if unsure, leave it out.
