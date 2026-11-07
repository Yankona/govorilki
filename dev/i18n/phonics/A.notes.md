# A: letters, reading, word puzzles, chess notation

Files: `A.patch.json` (60 small replacements), `A.en.json`, `A.pt.json` (27 LX names each). Generators and tests are in
`phonics/A-src/` (`make_patch.py`, `make_data.py` with content checks, `test.js` Playwright driver).

## What the patch changes (the Russian page is unchanged)
- Content constants wrapped in `LX`: `ABC`, `VOWELS`, `LNAME`, `M_CONS`, `M_VOW`, `RWORDS`, `SYL`, `LROWS`, `BOOK_ITEMS`,
  `MAGIC`, `WORDS5`, `KB`, `ABC_ORDER`, `PIECE_RU`, `RU_PC`. `WORDS5.push(...)` now uses `LX('WORDS5_PUSH')`.
- New LX names:
  - `ABC_LINE`: what the voice says on the ABC card, "{L} is for {w}." / "{L} de {w}.". The second form is for a
    letter inside its word (EN X, fox).
  - `ABC_NOT_FIRST`: letters left out of «Первая буква» (RU ЪЬЫ, EN X, PT HKWY: H is silent, K W Y are foreign).
  - `M_BAD`: the old ['КЫ','ШЫ'] list.
  - `M_LIST`: a complete list of merge items, used by EN word families.
  - `M_INTRO`: EN only, the first sentence of the merge game.
  - `SYL_TTS`: PT. It respells the vowel at the end of a consonant+vowel syllable for the voice: pá, pé, pó.
  - `BOOK_SY` and `BOOK_TITLE`: the four books.
  - `DOT_W`: names of the dot pictures (only the words are wrapped, not the shapes).
  - `CODE_ABC` and `CODE_SYL`: letter pools and syllable sets for «Раскрась по коду».
- New helpers:
  - `sylSay(s)`: how a syllable is spoken. In RU and EN it lowercases, as before. It is used by chip hints, the
    syllable-track taps, the merge game and code-colour syllables.
  - `chL(san)`: shows the puzzle moves in this page's piece letters.
- Code letters that are not UI text are wrapped in `RU()` so translators never touch them: 'ЪЬ', 'р', 'л',
  'рршжчщсз', 'Ё'/'Е'.
- The highlights in «Слоги и слова», the word puzzle and the dot pictures pass Russian code letters to `hiS`. B's patch
  (`HI_RE`) maps them to each language's spellings. Tested with A+B together: EN `STAR` lights S and not the silent R,
  PT `ESTRELA` lights S and R.
- Word puzzle keyboard: RU keeps `/^[А-Я]$/` and Ё→Е. EN and PT accept only the letters on `KB`, so é, ç and Cyrillic
  are ignored.
- Chess: `CHESS1` and `CHESS2` are wrapped in `RU()`, so the checked data stays single and the build leaves it alone.
  The solution line is shown through `chL`: EN K Q R B N, PT R D T B C. Example: Лd7# → Rd7# / Td7#.
  `RU_PC` (the online/AI game notation from `chSan`) comes from LX.
- `screenMerge`: the item is split as first letter + rest. A rest of more than one letter is shown as one red chunk.
- `screenBooks`: a card may carry a 4th item, the start as the voice says it. The highlight covers the book label length.
- `codeSet`: the abc voice uses `lsay(c)` (letter names in PT). With `v: []` the syllable mode uses the lists as ready
  short words (EN).

## How each game works now
| Game | EN (phonics, lower case where children read) | PT (syllabic method, upper case like RU) |
|---|---|---|
| Азбука / Найди букву / Первая буква / Пишем буквы | 26 letters, "A is for apple", X is for fox ("X, as in fox"); X is not in «first letter» | 26 letters with spoken names (bê, guê, agá…): "Bê de bola"; H K W Y not in «first letter» |
| Буквы дружат | word families: c + at → cat, r + ug → rug (52 CVC words), "c and at make a word!" | consonant + vowel: M + A → MA, spoken "má", "pé", "ló" |
| Читаем слова / Прочитай и найди | CVC words (cat, sun, rat…) and words in chunks (sun-set, rab-bit, car-rot, kan-ga-roo); a tap on a chunk says it | GA-TO, BO-LA, MA-CA-CO, PEI-XE… (26); a tap says the syllable with a clear vowel |
| Слоги и слова (R) | R blends: croc→crocodile, drag→dragon, cray→crayon, trac→tractor, straw→strawberry… | TRA→trator, PRA→prato, BRU→bruxa, GRI→grilo, TRE→trevo, BRÓ→brócolos… |
| Книжки | RA RI RO RU with short vowels: rabbit, raccoon, ribbon, ring, rocket, rock, rucksack, rugby ball, runner; "rab… rabbit!" | RA RE RO RU, strong R: rato, raposa, relógio, rebuçado, rosa, robô, rubi, Ruivinho; "ró… rosa!" |
| Волшебник | cat→hat, mouse→house, goat→boat, pear→bear, nose→rose, bell→ball | rato→gato, bolo→bola, mota→bota, gelo→galo, meia→teia, foca→boca |
| Слоговые дорожки (L) | la lee lie low loo / all eel ill owl oil / halo kilo polo solo oily / blue clap flag glue play / milk belt gold wolf help | LA…LU / AL…UL / ALA…ULU / BLA CLE FLI GLO PLU / LHA LHE LHI LHO LHU |
| Угадай слово | 19 five-letter words with L (LEMON, KOALA, CLOWN, MEDAL…), QWERTY keys | 19 words with L/LH, no accents (LEITE, FOLHA, MILHO, POLVO…), QWERTY keys |
| Точки по алфавиту | A–Q | A–Q, letter names spoken |
| Раскрась по коду: letters | vowels + r, j, l; the older child gets b d p q g j y w v z x k (the letters children mix up) | vowels + R, J, X, L; the older child gets B D P Q G J H X Z V F R |
| Раскрась по коду: syllables | short words by sound: rat red rug… / lip log leg… / ship chip jam… / sun zip six… | R, L, LH, CH, J, S, Z × A E I O U |
| Шахматные задачи | Rd7#, Qe7, Kf7 | Td7#, De7, Rf7 |

## For the translation team (UI strings that describe this content; suggested so they match)
- GAMES `magic` sub «кит → кот: одна буковка»: EN "cat → hat: one letter", PT "rato → gato: uma letra".
- GAMES `books` name «Книжки РА РО РУ РЫ»: EN "RA RI RO RU books", PT "Livros RA RE RO RU". The screen title already
  comes from `BOOK_TITLE`.
- GAMES `syll` sub «кры-кры-кры… крыса!»: EN "croc-croc-croc… crocodile!", PT "trá-trá-trá… trator!". Icon КРА/ГРУ:
  EN `cray`/`tri`, PT `TRA`/`GRA`.
- GAMES `read-merge` sub «М + А = МА»: EN "c + at = cat", PT "M + A = MA". Icon letters М, А: EN c + at, PT M + A.
- GAMES `read-words` sub «ма-ма, ры-ба, ко-а-ла»: EN "cat, sun-set, pan-da", PT "ga-to, bo-la, ma-ca-co".
- GAMES `l-syll` sub «ЛА-ЛО-ЛУ на время»: EN "la-lee-loo against the clock", PT "LA-LE-LI contra o relógio".
- GAMES `dots-abc` sub «А, Б, В… что получится?»: EN "A, B, C… what will it be?", PT "A, B, C… o que vai aparecer?".
- GAMES icons that are a single Cyrillic letter (А Б В, М, Л О Д, Р А): use A B C, M, L E M (EN) / L I V (PT), R A.
- `screenDots`: «…по алфавиту: а, бэ, вэ. Начни с буквы а!»: EN "…in ABC order: A, B, C. Start with A!", PT "…pela
  ordem do alfabeto: á, bê, cê. Começa pela letra á!".
- «Буквы дружат»: EN plays word families, so "Letters make words" fits better than "Letters are friends".
- `screenCodeColor` and `CODE_NAME.syl`: the EN syllable mode shows short words. Suggested EN: "Colour by words",
  "Little words are hidden in the picture…", "Read the word in this part again!".
- `abcLine` items 'Ъ', 'Ь', 'Ы', 'Й': code letters, keep unchanged (only the Russian page reaches them).
- Talk lines are built around a letter given by `lsay()`. In PT that is the letter's name, e.g. "Encontra a letra
  bê." / "A letra eme corre para a letra á.". Templates should put the letter after "letra".

## Testing (phonics/A-test, port 8771, utf-8)
- The patch applies to the current source, alone and together with B's patch, in both orders, with no overlap. The
  EN, PT and RU builds all parse.
- Playwright drove abc, abc-find, abc-first, read-merge, read-words, read-pick, magic, books, syll, dots-abc, code-abc,
  code-syl, write, l-syll, l-word and chess (mate in 1, solved from the board) on EN, PT and RU. No page errors.
- RU is unchanged: the same driver with a seeded `Math.random` on the original source and on the patched copy gives
  identical logs for all those games. Word-puzzle keydown is identical in RU, including Ё→Е and Ъ.
- Combined A+B builds: highlights work through B's `HI_RE`.

## Open points
- The PT build logs a console error, `TypeMismatchError: The path supplied exists, but was not an entry of requested
  type.`, in headless Chromium around the 4th–5th dot of «Точки по алфавиту». It happens on the unpatched PT build too,
  so it is not from this patch (not traced further).
- EN letter names are left to the voice. It says "A" and "Z" ("zed") correctly in "A is for apple" and "the letter A".
  A voice that reads a lone "A." as "uh" would need `LNAME` entries.
- Emoji choices stay at Emoji 13 or older, the same level the RU content uses (🪨 🦭 🫖 🫒 🪣). They were not checked
  on old phones.
- The EN syllable-mode colouring uses CVC words because English syllables alone are not read reliably by voices or
  speech recognition. The UI text should say "words" (see above).
- PT accented words appear only where the word is shown or spoken (relógio, robô, brócolos, balão). Letter games and
  the word puzzle have no accents or Ç.
