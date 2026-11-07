# Phonics B: speech sounds (articulation cards, words, chants, songs)

Files: `B.patch.json` (88 replacements, applied in order), `B.en.json`, `B.pt.json` (one key per LX name below plus
`GX` and `HI_RE`). The Russian page behaves as before. I tested it with a seeded `Math.random` against the original:
every game showed the same text.

## What changed in the code
- **Content constants wrapped in LX** (the Russian is unchanged inside):
  W, CNT, HOUSE, BOXI, SONGS, SOUNDS (+ `SOUND_L` for the Л push, `SOUNDS_SH` for the Ш/Ж push), CHIST_L (+ `CHIST_L2`),
  TWIST_L (+ `TWIST_L2`), CHIST_R, HOUSE_L, RAP, CATCH_L (+ `CATCH_L2`), CATCH_X (+ `CATCH_X2`), MOVES, SYL_SH, SYL_REND,
  HOUSE_SH, SH_ITEMS, SH_BINS, `SH_PAIRS` (the bin pairs in screenSort), BEAUTY, MOTO_WORDS (only the extra words; the list
  still starts with the CATCH_L words), MOTO_R, MOTO_SH, MOTO_SZ, KP_R, KP_CHANTS, MC_NAMES, VERSES, HOOK, HYPE,
  `BOSS_1`, `BOSS_2`, `BOSS_F` (the syllable lines in screenBoss).
- **BEAUTY**: the Russian `line` functions stay. In EN/PT `line` is a string where `{c}` stands for the colour word.
  A `.map` after the LX turns that string into the function the game calls.
- **Highlighting (`hiS`)**: in Russian it works as before (a character class of the given letters). Elsewhere
  `LANGDATA.HI_RE` gives a regex for each sound key: `r l sh ch j sz`, `shf` (the whole hushing family) and the SND_HI
  groups (`shcj`, `chjx`, `szç`). A Russian code letter passed by the code (`'л'`, `'рршжчщ'`, `'шжчщ'`, `'Ш'`…) maps to
  those keys, so every existing call highlights the right letters: EN R only before a vowel (car**r**ot, not star), EN SH
  includes sh/ch/j/soft g, PT CH includes x and final s/z ([ʃ] in pt-PT: lápi**s**, nari**z**), PT L includes lh.
  This also fixes A's `hiS(word, 'л')` (wordle) and the `askSaid` card.
- **Code letters protected with RU()**: `screenHouse(RU('Л'))`, `screenHouse(RU('Ш'))`, `sndIdx(RU('Л'/'Ш'))` in GAMES and
  screenSounds, the `hl` argument of the two screenSyll calls, and the KP highlight strings. A translated literal can no
  longer break the game logic. `sndIdx` falls back to the Russian card order (С З Р Л Ш Ж) when the shown letter is
  Latin.
- **screenHouse**: the parameter is now `S0` (the Russian code). `S` is the letter shown, taken from SOUNDS (R / L / SH
  in EN, R / L / CH in PT). If a word list has no word with the sound at the end, the game takes 4 + 4 words instead
  of 3 + 3 + 2. This is the case for EN R, because British English does not say R at the end of a word.

## How the games work in EN / PT
- **Articulation cards (screenSounds)**: six cards in the Russian order.
  - EN: S, Z, R, L, SH, CH. The EN R is not trilled: lips a little rounded, tongue tip lifted towards the ridge without
    touching it, sides against the back teeth, no vibration mark (I changed the drawing data: tip, hump, air line,
    lips). CH is a quick T + SH; the CH drawing has no voice mark.
  - PT: S, Z, R, L, CH, J. The PT R keeps the tip and the vibration mark: tap for «pera», a longer trill for «rato,
    carro». The card also says the R forte can come from the throat. J is CH with voice.
- **Vera's box (W)**: R words that name their pictures. Each word carries its own article («a crown», «uma coroa»),
  so the UI sentence «In Vera's box there is {0}» must not add one.
- **Find and count (CNT)**: rabbit, robot, rocket, rainbow, ring, rose / rato, rã, robô, raposa, rosa, relógio. Each type
  has its own «Find all the …!» line, and the PT entries have the right gender for um/uma, dois/duas.
- **Where does the sound live (HOUSE, HOUSE_L, HOUSE_SH)**:
  - EN R: start and middle only. EN L and SH: all three positions. EN SH uses only SH words.
  - PT: all three positions. The PT CH list uses CH/X words and, at the end, final -s/-z ([ʃ]: nariz, arroz, lápis,
    ananás, luz).
- **Counting boxes (BOXI)**: R nouns with [1, 2, 5] plural forms.
- **Songs and xylophone (SONGS)**: six original songs per language, one note per syllable. Every note is a xylophone bar
  (C4–C5); the checker verifies the counts.
  - EN: The R Song, Robin Redbreast, The Porridge Pot (a finger rhyme), Little Rooster, Clappy Hands, Sunshine, Come Out.
  - PT: A canção do R, Pardalito, A papinha, O galo (cocorocó), Palminhas, Sol, solzinho.
  - The `by` lines describe the kind of rhyme («a clapping rhyme», «lengalenga das palmas»), because these are not
    traditional texts.
- **Syllables then word (SYL_SH, SYL_REND)**:
  - SYL_SH: sha… shark, chip… chips, jag… jaguar / cha… chave, ja… janela, gi… girafa.
  - SYL_REND in PT: final R (mar, flor, colher, tambor…).
  - SYL_REND in EN: a final R is silent in British English, so the R starts the last syllable instead (rot… carrot,
    bra… zebra, raff… giraffe). The tile title «R at the end» still roughly fits.
- **Hushing sort (SH_ITEMS, SH_BINS, SH_PAIRS)**:
  - EN bins: SH 🤫 «shh, be quiet», CH 🚂 «choo-choo train», J 🦘 «jumping kangaroo». Pairs SH/CH, CH/J, SH/J.
  - PT bins: CH 🤫 «chiu, silêncio» (CH and X words), J 🪲 «besouro a zumbir» (J and G words).
  - The k-pop game also takes two words from SH_ITEMS.
- **Chants, twisters, duo, recorder, boss (CHIST_*, TWIST_*, BOSS_*)**:
  - All original lines in the Russian format («La-la-la — …!»), full of the sound.
  - Sava's extra lines keep his hobbies: chess, lizard Liza, surf, piano, bike, skate, taekwondo.
  - Vera's R chants: EN uses R between vowels (Erry-erry — a very merry cherry!); PT uses R forte and r fraco.
  - Texts about Sava avoid gendered words, so a girl on the L track gets them right too.
- **Catch (CATCH_L / CATCH_X)**: L words and pictures to catch, and words with no L at all to avoid (the checker enforces
  both).
- **Moto signs (MOTO_*)**: racing words with L, R, SH-family and S/Z.
- **Rap battle (RAP, VERSES, HOOK, HYPE, MC_NAMES)**:
  - Syllable rounds: LA LO LOO LEE / LA LO LU LI.
  - Four 4-line verses with rhymes, a hook, and hype words with L (BRILLIANT!, BRUTAL!).
  - MC names: «Big L» is a real rapper, so it became «Lucky L».
- **Beauty salon (BEAUTY)**:
  - Every item or colour carries R or SH.
  - EN: rosy blusher, red/rose/cherry lipstick, grape/green/shiny eyeshadow, mascara, shimmer, hairbrush, earrings,
    jewels, a royal crown.
  - PT: blush cor-de-rosa, batom vermelho/cor-de-rosa/cor de cereja, sombra roxa/verde/perolada, rímel preto, pó
    brilhante, escova, brincos, colar de pérolas, coroa real.
- **K-pop (KP_R, KP_CHANTS)**: R words and four chants (R, SH, J, R).
- **Move (MOVES)**: the same nine moves with LA/LO/LOO/LEE (PT LA/LO/LU/LI) and L phrases.
- **GX**:
  - EN `{}`.
  - PT maps feminine → masculine for texts written for a girl: pronta, sozinha, cansada, campeã (and «uma campeã» → «um
    campeão»), obrigada, atenta, esperta, corajosa, preparada, concentrada, bem-vinda, menina, princesa (+ «uma
    princesa» → «um príncipe»), leitora, jogadora, plus the capitalised forms.
  - I left out generic adjectives (linda, rápida…) because they often describe other feminine nouns.
- screenSprint has nothing of this area (math only).

## For the translators / lead (UI text, not changed by me)
- **GAMES tile texts that list Russian sound words**. Suggested wording:
  - count sub: «rabbit, robot, rocket, rainbow…» / «rato, rã, robô, raposa…»
  - r-end sub: «carrot, parrot, zebra» / «mar, flor, colher»
  - sh-syll sub: «sha-sha-sha… shark!» / «cha-cha-cha… chave!»
  - sh-sort name and sub: «Hush or jump?» with «SH, CH or J» / «Chiu ou besouro?» with «CH ou J»
  - beauty sub: «blusher, lipstick, crown» / «blush, batom, coroa»
  - sounds sub: «S, Z and R»; sounds-sh sub: «SH and CH» / «CH e J»
  - house titles: «Where does the SH sound live» / «Onde mora o som do CH»
  - section «Шипящие: Ш Ж Ч Щ»: «SH, CH and J» / «CH e J»
- **Other UI sentences around this content**:
  - The EN R house never needs the third window. The first spoken line of the game still names all three windows.
  - screenCount says «Это {0}.» with the bare noun (rabbit / rato). The EN/PT translation should not need an article.
  - numW/NUM: PT needs 'одна' → «uma» and 'две' → «duas» for feminine counts (CNT and BOXI carry g: 'f').
- **Strings now owned by LX**: b02-0213, -0214, -0216, -0217, -0224 and -0225 (the screenBoss syllable lines) are no
  longer translated from the table, so their table entries are unused.

## Testing
- Pages built with `i18n.js build` (empty table, B JSON as LANGDATA) and served on 8772 with charset utf-8.
  - The page has no `<meta charset>`. A plain `python3 -m http.server` makes Chrome read it as Latin-1, and this
    breaks the original page too.
- Playwright opened every game above in EN, PT and RU (vera and sava profiles). Seeded random, all external requests
  blocked.
- No page errors. Each game showed the B words, highlights and lines.
  - The EN R house finishes after 8 words (4 at the start, 4 in the middle).
  - The last run used the current source, which already holds A's merged patch; my 88 replacements still apply on top.
  - A's `hiS(word, RU('л'))` highlights the L.
- `B-work/mkjson.py` checks:
  - shapes against the Russian defaults
  - song syllables equal notes, and every note is a xylophone bar
  - L / no-L / R lists
  - SH bins and pairs
  - house positions
  - the regexes compile with flags `giu`
  - no Cyrillic in the JSON

## Open issues
- EN/PT TTS reads stretched sounds («sss», «zzz», «lll», «jjj») however the voice decides. The Russian lines have the
  same issue («л-л-л»).
- The traditional nursery rhymes (EN: Row, row; Pat-a-cake. PT: Papagaio louro, Dedo mindinho) are public domain. They
  could replace some of the original songs if the family prefers rhymes the children hear at school.
