# Translating «Говорилки» into English and Portuguese

«Говорилки» is a speech-therapy and learning game (PWA) for children 5–9: breathing and tongue exercises, games with the
sounds R, L, SH, S/Z, reading, maths, drawing, stories about cities and holidays, chess, and a family part where
grandparents and parents follow the children. It is written in Russian. A build step swaps every Russian string in the
script for its translation, so each string you translate is used *exactly where it stands in the code*.

Source (read-only, for context): game/govorilki.html
Each item gives its `line` in that file: look at the line when the meaning is unclear (who speaks, to whom, what is glued
around it).

## Languages
- **EN** — simple, warm British English (colour, maths, Mum). Short sentences for children.
- **PT** — European Portuguese (Portugal!), never Brazilian: ecrã (not tela), telemóvel (not celular), autocolante
  (not adesivo), casa de banho, pequeno-almoço, comboio, autocarro, sumo, carregar/tocar. Talk to the child with **tu**
  (Carrega no botão, Sopra, Diz: …). Talk to adults (parents, grandparents, settings, invites) politely without "você"
  where possible: "Toque em…", "Abra o link…", "Escreva o nome…".

## Hard rules (a build check rejects items that break them)
1. Every placeholder `{0}`, `{1}`, … in the Russian must appear in the translation, each exactly as many times; you may
   move them. Never invent new ones. They stand for code (names, numbers, HTML, other translated strings).
2. HTML stays HTML: keep every tag, attribute, class, id, data-*, entity and emoji. Translate only the visible text and
   the values of aria-label, title, alt, placeholder.
3. Keep leading and trailing spaces and punctuation that glue a string to its neighbours (", ", " — ", ": ").
4. Text that is not human language (CSS, ids, keys, regex fragments, single code letters) → return it unchanged.
5. No Cyrillic left in either translation (except where the item is a Russian word the child learns *as Russian*, which
   should not happen in these batches).
6. Tiny fragments glued by code ('а', 'ась', 'ся', 'ой', 'у', 'и') are Russian gender/case endings: look at the line —
   usually they become "" in both languages. When the code gives both forms, e.g. G('Готова!', 'Готов!') (girl first,
   boy second), give the proper forms: "Ready!"/"Ready!", "Pronta!"/"Pronto!".
7. Plural triples like ['звезда', 'звезды', 'звёзд'] are Russian forms for 1 / 2–4 / 5+: give EN ['star', 'stars',
   'stars'] and PT ['estrela', 'estrelas', 'estrelas'] (2nd and 3rd = plural). Same for 'день','дня','дней' etc.
8. Texts are written for a girl; for a boy the Russian code changes the verbs itself. In PT avoid gendered words about the
   child (prefer "Conseguiste!", "Muito bem!", "Leste tudo!" over "Estás pronta!") unless the code gives both forms.
9. The children's names **Vera** and **Sava** stay exactly so (the code replaces them with the real child's name). Keep
   other people's names (Нина → Nina, Саша → Sasha, Миша → Misha, Лиза → Liza…).
10. Text spoken by the voice: write numbers and symbols so a voice reads them well; keep "Скажи: …" lines as
    "Say: …" / "Diz: …".

## Speech-practice content inside lines
Where a line makes the child say syllables or words to train a Russian sound, keep the exercise but use the matching sound
of the target language, with natural syllables/words: Р → R (ra-ra-ra; PT also "rr" words: carro, rato), Л → L
(la-la-la; PT also lh), Ш Ж Ч Щ → EN sh/ch/j (ship, chair, jam), PT ch/x/j (chave, xícara, janela), С З → s/z.
Talk about the sound R/L/SH… in the target language's letters ("the R sound", "o som do R"). Russian alphabet specifics
(Ъ, Ь, Ё, Ы) — adapt sensibly (e.g. "letters" / "vowels") or keep neutral.

## Glossary (use these everywhere)
| Russian | EN | PT |
|---|---|---|
| Говорилки (app) | Chatterbox | Tagarelas |
| Говорилки с Рыжиком | Chatterbox with Ginger | Tagarelas com o Ruivinho |
| Рыжик (тигрёнок) | Ginger (tiger cub) | Ruivinho (tigrezinho) |
| Кира (коала) | Kira (koala) | Kira (coala) |
| Радуга (единорожка) | Rainbow (unicorn) | Arco-Íris (unicórnio) |
| Кудряшка (альпака) | Curly (alpaca) | Caracolinhos (alpaca) |
| Рябинка (красная панда) | Berry (red panda) | Baguinha (panda-vermelho) |
| Пирожок (панда) | Dumpling (panda) | Pastelinho (panda) |
| Лорд (привидение) | Lord (ghost) | Lorde (fantasma) |
| Рина, Шани, Жасми | Rina, Shani, Jasmi | Rina, Shani, Jasmi |
| Бабушка / Дедушка | Granny / Grandpa | Avó / Avô |
| Бабушка Нина / Дедушка Саша | Granny Nina / Grandpa Sasha | Avó Nina / Avô Sasha |
| Мама / Папа | Mum / Dad | Mãe / Pai |
| Тётя / Дядя | Auntie / Uncle | Tia / Tio |
| Сестра / Брат | Sister / Brother | Irmã / Irmão |
| внуки (of grandparents) | grandchildren | netos |
| дети (of parents) | children | filhos |
| племянники | nieces and nephews | sobrinhos |
| Логопед (lesson) | Speech | Fala |
| Чтение | Reading | Leitura |
| Математика | Maths | Matemática |
| Скорочтение | Speed reading | Leitura rápida |
| Книга | Book | Livro |
| Тренировка Л | L training | Treino do L |
| занятие (daily lesson) | lesson | lição |
| звёзды | stars | estrelas |
| наклейка | sticker | autocolante |
| медаль | medal | medalha |
| уровень | level | nível |
| лига | league | liga |
| семья | family | família |
| миссия | mission | missão |
| праздник / выходной | holiday / day off | festa, feriado / dia de folga |
| история (story) | story | história |
| раскраска | colouring page | desenho para colorir |
| шахматы: король, ферзь, ладья, слон, конь, пешка, шах, мат | king, queen, rook, bishop, knight, pawn, check, checkmate | rei, dama, torre, bispo, cavalo, peão, xeque, xeque-mate |
| Я сказала! / Я сказал! | I said it! | Já disse! |
| Я прочитала! | I read it! | Já li! |
| Нажми … | Tap … / Press … | Carrega em … / Toca em … |
| Дыхание | Breathing | Respiração |
| Зарядка для язычка | Tongue workout | Ginástica da língua |
| Пригласить | Invite | Convidar |
| Похвалить | Praise | Elogiar |

## Data you will meet
- Stories (LEARN, PLACE_DATA, LEARN.phys): titles, texts, questions and answers for children. Translate faithfully and
  simply; keep facts; keep answer order.
- Holidays (HOL_PTRU, HOL_WORLD): use the official EN/PT name of each holiday ("Dia de Portugal, de Camões e das
  Comunidades Portuguesas", "Epiphany"/"Dia de Reis").
- COUNTRY_INFO: capitals, and "hello"/"thank you" in the country's own language written in Russian letters
  ('Ола', 'Обригаду'). Give them in that language's own Latin spelling ('Olá', 'Obrigado'); for non-Latin scripts a
  simple romanization ('Privet', 'Spasibo', 'Konnichiwa').
- Months: 'января' (genitive, after a day number) → EN 'January', PT 'de janeiro'. Short weekdays Пн..Вс → EN Mon Tue
  Wed Thu Fri Sat Sun, PT Seg Ter Qua Qui Sex Sáb Dom.
- Interests (INTEREST_CAT, LIKES_BASE): names and the word lists the child practises: natural words, keep the count.
- SOUND_SET labels: 'Р' → 'R'; 'Л' → 'L'; 'С и З' → 'S and Z' / 'S e Z'; 'Ш Ж Ч Щ' → EN 'SH CH J', PT 'CH J X'.

## Output
Write `<batch>.out.json` next to the batch file: one JSON object `{ "<id>": ["<EN>", "<PT>"], ... }` with every id of
the batch. You may write it in several parts named `<batch>.out.1.json`, `<batch>.out.2.json`, … (same format) — all
parts together must cover every id once. Then run `node check.js <batch>` in the i18n-tools folder and fix every problem
it lists until it prints "OK".
