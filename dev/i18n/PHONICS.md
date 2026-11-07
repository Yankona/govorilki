# English and Portuguese learning content for «Говорилки»

«Говорилки» is a speech-therapy and learning PWA for children 5–9 (single HTML file, Russian). We are making English
(British, en-GB) and European Portuguese (pt-PT — the family lives near Lisbon) versions. A build step replaces every
Russian UI string with its translation (a separate team translates UI text and stories — do not do that). Your job is the
part that cannot be translated word for word: the letters, syllables, words with the trained sounds, rhymes and chants,
and the code that assumes the Russian alphabet.

Source (do NOT edit it): game/govorilki.html
Tools folder: i18n/

## What already exists in the source (top of the script)
```js
const LANG = 'ru';                 // the build sets 'en' or 'pt'
const LANGDATA = /*__LANGDATA__*/{}; // the build injects your JSON here
const LX = (k, v) => LANGDATA[k] !== undefined ? LANGDATA[k] : v;
const LOC = { ru: 'ru-RU', en: 'en-GB', pt: 'pt-PT' }[LANG];  // speech recognition, voice, dates already use it
const IS_RU = LANG === 'ru';
```
Also already language-aware: plural(), decl() (no cases outside Russian), normW() (what the child said: lowercase,
accents stripped outside Russian), hiR (highlights r/R), SND_RE/SND_HI (which words carry a trained sound), voices,
recognition language, the gender helper gx().

## How the build works
`node i18n.js build <src.html> <en|pt> <table.json> <langdata.json> <out.html>`
- Every Russian string literal / template literal is replaced from the translation table (missing ones stay Russian —
  fine while you test: use `empty.json` as the table).
- Strings inside the second argument of `LX('NAME', …)` are NOT translated: that Russian default is used only by the
  Russian page; the other pages get `LANGDATA.NAME` from your JSON.
- Group = the top-level declaration a string sits in (function name / const name / e.g. `GAMES.push`). Do not rename
  declarations and do not change existing Russian UI strings (talk(), shell titles, buttons): the translation tables are
  keyed on their exact text. You may ADD new code, LANG branches and LX wrappers.

## Your deliverables (in phonics/)
1. `<X>.patch.json` — a JSON array of `{ "old": "...", "new": "..." }` exact replacements against the CURRENT source
   (each `old` must occur exactly once; they are applied in order). Typical changes:
   - wrap a content constant: `const ABC = [` … `];` → `const ABC = LX('ABC', [` … `]);` (Russian unchanged inside);
   - Russian-only logic → branch on LANG or read a LX value (e.g. `['КЫ', 'ШЫ']` → `LX('M_BAD', ['КЫ', 'ШЫ'])`,
     `/^[А-Я]$/` → a test against the keyboard letters, `'Ё'→'Е'` only in Russian).
   The Russian page must behave exactly as before.
2. `<X>.en.json` and `<X>.pt.json` — `{ "NAME": value, ... }` for every LX name you introduced: the same shape as the
   Russian default (arrays/objects/strings/numbers; JSON only — if the default has functions or SVG, wrap only the parts
   that are text). Lengths may differ where the language needs it (26 letters, not 33).
3. `<X>.notes.md` — short: what you changed, how each game works in EN/PT, anything you could not finish.

## Content principles
- Real speech-therapy and early-literacy practice for that language, written natively (not word-for-word translation),
  safe and warm for 5–9-year-olds. Original rhymes and chants only (no copyrighted songs or characters).
- Sound slots used by the app: `r`, `l`, `sh`, `sz`.
  - EN: r = /r/ (red, rabbit, carrot); l = /l/ (lion, yellow, ball); sh = SH, CH, J/soft G (ship, chair, jam, giraffe);
    sz = S, Z (sun, zoo).
  - PT (European): r = R forte (rato, carro, rua) and r fraco (pera, caro, prato); l = L and LH (lua, bola, galinha);
    sh = CH/X and J/G [ʃ ʒ] (chave, peixe, janela, girafa); sz = S/SS/Ç and Z (sapo, osso, zebra, casa).
- Where a word is paired with an emoji, the word must name that emoji (change the emoji if needed) and must carry the
  trained sound where the list is about a sound.
- Reading: EN beginners read with phonics (letter sounds, CVC words: cat, sun, dog; then blends and digraphs); PT
  beginners read with syllables (ba-be-bi-bo-bu, GA-TO, BO-LA, MA-CA-CO) — very close to the Russian method.
- Letters: EN 26 letters; PT 26 letters (A–Z, k/w/y rare) — keep accents and Ç out of letter games and word puzzles
  unless the game handles them.
- Text spoken by the voice must read well with an en-GB / pt-PT voice.
- Names: the children Vera and Sava keep their names (the code swaps in the real child's name).

## Testing
Apply your patch to a copy (`phonics/work-<X>.html`), build EN and PT with your JSON as LANGDATA and empty.json as the
table, serve the folder with `python3 -m http.server <port>` (A: 8771, B: 8772) and drive the games with Playwright
(`require('playwright')`, `chromium.launch()` needs no options; see the existing tests in
build/ (old scratch files, not kept) v47.js and v28.js for how a
profile is put into localStorage and games are opened). Check: no page errors, the games show your letters/words, the
Russian copy still behaves as before. UI text will still be Russian in these test builds — that is expected.
