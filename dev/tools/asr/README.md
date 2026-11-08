# Speech recognition: audit, matching, offline option

## Where the game listens (v150)
| Place | How | Expects | Before | Now |
|---|---|---|---|---|
| `askSaid(…, { expect })` — «Скажи слово» in 13 games: drawing (я нарисовала …), Л-arena (all caught words), word guess ×3, Жар-птицы, sound cards, colouring syllables, grammar phrases (это фрукты…), Р-track vowels and words | `hear()`: one recogniser per try, `lang` = page language, interim on, 5 alternatives, continuous only for phrases/×3, 7 s per try | a word, a phrase or a word ×3 | exact word (short words) or one letter off for ≥5 letters, and **never a change in Л** — «водка» for «лодка» refused; up to 6 tries ≈ 40 s before the button | tolerant of the recogniser's slips; a learned sound said wrong is «почти» with an explanation, 👄 and a retry (below); «Дальше →» after 3 tries, not counted; syllables take any voice |
| Motorbike ride (`hearLive`) | one continuous session for the ride, restarted when the phone closes it; 3 alternatives per phrase | the sign's word; after a crash the word ×3 | same strict matching; ×3 had to come in one phrase; skip button after 15 s | kind matching; ×3 adds up separate phrases; skip after 8 s |
| Dictionary 🎤 | one word, no interim, 1 alternative | any word (a search) | the mic could stay «on» if the phone never ended | ends itself after 9 s |
| «Кому как сказать?» (`listenIn`) | the phrase's language, 3 alternatives, continuous | 75 % of the phrase's words | own fuzzy check (one letter off) | unchanged (many languages; its own check fits) |

Errors: `not-allowed`, `service-not-allowed`, `audio-capture`, `language-not-supported` switch word checks off (the loudness
meter takes over); `network` (no internet: Chrome and Android send the voice to a server) now pauses word checks for a
minute instead of failing every try; `no-speech` = «Не слышно. Скажи громче!». No recogniser (Firefox, the artifact)
or the microphone off → the loudness meter or a timed button, as before.

What the child sees: the yellow button with a pulsing green microphone and «Я слушаю…», the word card with «Слышу: …»,
then ✓ or a hint, and after two tries the button «Я сказала!» to go on.

## Matching (`ASR` block in the game, `tests/asr_match.js`)
Every alternative and the whole session's text; lower case, ё = е, punctuation off, digits → words; a weighted edit
distance where a voiced/voiceless pair, soft/hard, an unstressed vowel cost 0.25 (the recogniser's slips — taken);
endings may differ (лодку = лодка); a word split or glued by the recogniser counts. A learned sound of the wanted word
(Р Л Ш Ж Ч Щ С З Ц; R L S TH) said as another sound, or a dropped Р/Л, is **«почти»** (since v152, the owner's
decision: mistakes are not counted, the child is shown how to say it better): `ASR.match` gives the sound in `slip`.

In «Скажи слово» (askSaid) an «почти» is not taken: the friend says what was heard and how to say the sound
(«Скажи с рычащим звуком Р…»), says the word slowly, «👄 Как сказать?» opens the mouth teacher for that sound, and the
child tries again. After three tries «Дальше →» lets the child go on; the word is not counted (`SAY_MISS`: the game's
stars lose one or two, «Потренируем ещё: …»), and «Мои слова», the Жар-птицы demons and the Р track bring it back once.
The motorbike ride says «Почти! … Скажи чётко звук Р».

Test set (76 cases): v150 38/76 (strict: correct words taken 16/26), v151 51/76 (took every slip), now 76/76
(correct 26/26, learned-sound slips caught 25/25, other words refused 25/25).

## Offline recogniser
Candidate: Vosk (`vosk-browser` 0.0.8, Apache-2.0; `vosk-model-small-ru-0.22`, Apache-2.0). Size: model 45 MB zip,
library 5.8 MB JS with the WASM inside — about 52 MB once, like the Piper voice. Its grammar mode (only the expected word
or «[unk]») suits word checks well. Russian only in a small model of this quality; en/pt/de would need their own models.
Whisper tiny (ONNX via transformers.js) is ~40 MB quantised but much slower on a phone and needs 30 s windows.

Measurement: `synth.py` makes 320 test sounds from `words.json` (20 words, each said right and with a child's
substitution; Piper voices Руслан and Ирина; normal and 25 % slower; plus a child-like copy 40 % higher), phonemes from
`ph.cjs` (the app's own phonemizer in `tools/phsrv`). Running the downloaded Vosk library on them in Chromium was not
allowed in the session that wrote this, so accuracy and speed are **not measured yet**. Verdict: not added; worth a
measured try as an opt-in («Распознавание без интернета», download on demand, cached) only if on these sounds it takes
the right words at least as often as the browser's recogniser and refuses other words.

```
node tools/asr/ph.cjs $PWD/tools/tts/pp.cjs $PWD/tools/asr/words.json <ids.json> $PWD/tools/phsrv $PWD/tools/phsrv/pp.js
python3 tools/asr/synth.py <voices dir with ru_RU-{ruslan,irina}-medium.onnx(.json)> <ids.json> <wav dir>
```
