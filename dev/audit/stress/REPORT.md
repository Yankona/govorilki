# Stress audit of the Russian voice pipeline (read-only)

Method. 40 texts: 20 journey stories (data/ru/st1..st12.json, field s, spread over all 12 files), 10 news
(NEWSJOBS-DATA, evenly spaced), 10 friend lines (static `line:` strings of the day path / SOUNDS). Each text went
through the game's own code (ruNums, plainText, sayLetters, sayLong, sayMark taken verbatim from game/govorilki.html
with data/ru/sayru.json) = the text the voice gets. For every word left WITHOUT a mark (1012 distinct polysyllabic
words) I ran Piper's own phonemizer (dev/tools/phsrv wasm, in node) to see which vowel the voice really stresses, and
checked all of them by hand. Marked words (about 190) were checked by hand against the context.
Files in the same folder: picked.json, out.json (voice input per text), esp.json (espeak stress of unmarked words).

Limits. The ruaccent dictionary (.cache/raccw) is not in the container, so "right" = my own knowledge of Russian
orthoepy. Listening check SKIPPED: no Chromium/Playwright, no faster-whisper, no Piper model in the container; only
the Piper model (~63 MB) is reachable, ASR models are larger/blocked and a tiny ASR cannot judge stress anyway. The
phoneme-level check above is the exact input of the voice, so it replaces listening for stress.

## Error rate
Words checked: 2061 tokens (about 1200 distinct), all 40 texts.
- Russian stress (marked + unmarked): 0 definite errors; 2 doubtful (below).
- Definite wrong, any kind: 5 tokens (1 НЬЮотер + 4 English day names) = 0.24 %.
- With doubtful ones: 9 tokens = 0.44 %.
Numbers: all correct (19 апреля 2026 года, в 1703 году, 21 километра, 2,5 часов, 57 минут 20 секунд, 3 тысячи 200 лет,
шести миллионах, четырнадцати дней: right case in each). ё: no missing ё found. Homographs in the sample all right:
за́мок (castle), замки (espeak gives за́мки, right), тепла́, горам, ногами, ушами, воде, насоса, бугоркам, волко́в,
хлопко́м, кольца́, тени́, ноги́/руки́, поля́, берега́, воды́/земли́ in the right case.

## Wrong words
1. НЬЮотер (story 16, sg-water; also 3 places in game/govorilki.html and stories/ st9 source). The mixed-case word is
   spelled out by the phonemizer: «эн мягкий знак ю о́тер» (phonemes ˌɛnmʲˌjaxkʲɪjznˈɑk juˈotʲir). sayForm keeps the
   capitals, so a `w` entry cannot help. Fix in the TEXT: «Ньюотер» (then `"w": {"ньюотер": "ньюо́тер"}` is already
   in the dictionary and works). Sentence: «Очень чистая вода называется НЬЮотер.»
2. Tuesday, Wednesday, Thursday, Friday (story 14, week days of the Vikings). Latin words never match the
   [А-Яа-яЁё]+ rule of sayMark, so no say_manual entry can reach them; the Russian voice gets English phonemes
   (tjˈuːzdeɪ, θˈɜːzdeɪ) it has no clean sound for. No entry possible; either write them for the voice in Cyrillic
   («Тьюзди», «Уэнзди», «Сездей/Сёрздей», «Фрайди») through a Latin-word step in sayParts, or keep Latin only in the
   display (the text can say «по-английски вторник — Тьюздей»).
3. «Звук Рь.» / «Звук Ль.» (SOUNDS lines 7975, 7980, not in the sample but found while probing): the voice says
   «эр мягкий знак» / «эль мягкий знак» (ˌɛrmʲˌjaxkʲɪjznˈɑk), because sayLetters only handles a single letter after
   «букв…» or at sentence start. No say_manual entry (a `w` cannot rewrite letters). Fix in code: extend SAY_LET to
   «Звук Рь/Ль» -> «Звук рь» spoken as «рьи» or reword the spoken line («Мягкий звук Р»).
4. «Звук С.», «Звук Л.», «Звук Ш.» (SOUNDS lines 7046, 7156, 7948): the voice says «Звук эс», «Звук эл», «Звук ша».
   Names of letters, not the sounds (inconsistent: Ш is a sound, С and Л are names). Unsure whether that is wanted;
   the primer rule in the code says a consonant is called by its sound, so probably a bug in the same function.

## Doubtful (not changed)
- «гуляет по ле́су ночью» (story 23, the news about kakapo). The sentence-level choice gives ле́су. The usual norm is
  «по лесу́» (dative stress on the ending). Optional entry: `"phr": {"по лесу": "по лес+у"}`. Low confidence; the
  global `w` already has лесу -> лесу́.
- «Жераже́ш» (story 7, mountains in Portugal; 6 occurrences in all data): the stress as pinned is consistent with
  the written word, but the real name (Serra do Gerês) is «Жере́ш». Check the spelling in the text (not a stress
  entry). If renamed: `"w": {"жереш": "жер+еш"}` and also «жереше».

## Systematic causes
1. Stress itself is in good shape: the build stores only words where the voice's espeak differs from the dictionary/model,
   and everything else matches. All 1012 unmarked polysyllabic words in the sample came out with the right vowel.
   Real risk stays in homographs where the dictionary AND espeak are both wrong, and in sentences changed after the last
   say_ru.py run (sayru.json built 17.11 20:10, game changed 19:32: fresh now).
2. Anything that is not plain lowercase/Capitalised Cyrillic bypasses the dictionary: ALL-CAPS-with-ь (НЬЮотер),
   «Рь/Ль» after «Звук», Latin words. say_manual.json has no way to reach these; they need a text change or a small
   normalising step in sayParts (lower-case a word that is mixed caps; spell Latin day names).
3. Single letters after «Звук» are read by their letter names (эс, эл), while «буква Р» is handled. Same cause as 3/4.
4. Names unknown to the dictionary (the report lists 1666 «unknown_words», incl. Тюра, Хеллоу in this sample) are left
   to espeak: right in this sample (Тю́ра, хелло́у), but each new name needs a check with the node phonemizer
   (my script: scratchpad/stress/ph.mjs <words.json>, prints espeak phonemes with ˈ before the stressed vowel).
