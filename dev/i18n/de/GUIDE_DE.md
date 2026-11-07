# Translating «Говорилки» into German

«Говорилки» is a speech-therapy and learning game (PWA) for children 4–12: breathing and tongue exercises, games with the
sounds R, L, SH, S/Z, reading, maths, drawing, stories about cities, holidays, museums and composers, chess, and a family
part where grandparents and parents follow the children. It is written in Russian and already exists in English and
Portuguese. A build step swaps every Russian string in the script for its translation, so each string you translate is
used *exactly where it stands in the code*. The German version is for German-speaking families (children whose parents
speak German, at a German school).

Source (read-only, for context): game/govorilki.html
Each item gives its `line` in that file: look at the line when the meaning is unclear (who speaks, to whom, what is glued
around it, whether a string is shown or spoken). Each item also carries the existing English (`en`) and Portuguese (`pt`)
translations: they show how the team already solved the item (adapted speech exercises, kid-friendly wording, what to
leave empty). Translate the meaning of the Russian; use EN/PT as a guide, not as the source.

## Language
- Standard German (Germany), warm and simple, short sentences for children.
- The child is **du** (Tippe auf …, Puste, Sag: …). Grown-ups (parents, grandparents, the control panel, settings,
  invitations, privacy texts) are **Sie** (Tippen Sie auf …, Öffnen Sie den Link …).
- Correct German typography: „…" quotation marks for quotes in running text are welcome but plain "…" is fine when the
  Russian uses «…» inside code-like strings; keep what is easiest to read. Numbers: 1.000, 3,5.

## Hard rules (a build check rejects items that break them)
1. Every placeholder `{0}`, `{1}`, … in the Russian must appear in the translation, each exactly as many times; you may
   move them. Never invent new ones. They stand for code (names, numbers, HTML, other translated strings).
2. HTML stays HTML: keep every tag, attribute, class, id, data-*, entity and emoji. Translate only the visible text and
   the values of aria-label, title, alt, placeholder.
3. Keep leading and trailing spaces and punctuation that glue a string to its neighbours (", ", " — ", ": ").
4. Text that is not human language (CSS, ids, keys, regex fragments, single code letters) → return it unchanged (as EN did).
5. No Cyrillic left in the translation.
6. Tiny fragments glued by code ('а', 'ась', 'ся', 'ой', 'у', 'и') are Russian gender/case endings: look at the line and
   at EN — usually they become "". When the code gives both forms, e.g. G('Готова!', 'Готов!') (girl first, boy second),
   give the proper German form for each item ("Fertig!" / "Fertig!", "Du bist eine Heldin!" / "Du bist ein Held!").
7. Plural triples like ['звезда', 'звезды', 'звёзд'] are Russian forms for 1 / 2–4 / 5+: give ['Stern', 'Sterne',
   'Sterne'] (2nd and 3rd = plural). Same for 'день','дня','дней' → 'Tag','Tage','Tage'.
8. Texts are written for a girl; for a boy the Russian code changes the verbs itself. German verbs do not change, so this
   rarely matters; avoid gendered nouns about the child unless the code gives both forms.
9. The children's names **Vera** and **Sava** stay exactly so (the code replaces them with the real child's name). Other
   people's names in German spelling: Нина → Nina, Саша → Sascha, Миша → Mischa, Лиза → Lisa, Маша → Mascha.
10. Text spoken by the voice: write numbers and symbols so a German voice reads them well; "Скажи: …" → "Sag: …".
11. Where EN left an item empty "" or unchanged on purpose (endings, code), do the same.

## Speech-practice content inside lines
Where a line makes the child say syllables or words to train a Russian sound, keep the exercise but use the matching German
sound with natural German syllables/words (as EN and PT did for theirs):
- Р → R (ra-ra-ra; Rabe, Roller, Rose, Regen, Tür, Brot)
- Л → L (la-la-la; Löwe, Lampe, Ball, Lolli)
- Ш Ж Ч Щ → SCH / CH / TSCH (Schule, Schiff, Tasche; ich, Milch; Tschüss, Quatsch)
- С З → S / Z (Sonne, Salat, Zebra, Zahn, Haus, Bus)
Talk about the sounds in German letters ("der Laut R", "das SCH"). Sound-set labels: 'Р' → 'R', 'Л' → 'L',
'С и З' → 'S und Z', 'Ш Ж Ч Щ' → 'SCH CH TSCH'. Russian alphabet specifics (Ъ, Ь, Ё, Ы) — adapt sensibly (e.g. "Buchstaben",
"Vokale", Umlaute ä ö ü) or keep neutral, as EN did.

## Glossary (use these everywhere)
| Russian | EN (for reference) | DE |
|---|---|---|
| Говорилки (app) | Chatterbox | Plaudertaschen |
| Говорилки с Рыжиком | Chatterbox with Ginger | Plaudertaschen mit Rotschopf |
| Рыжик (тигрёнок) | Ginger (tiger cub) | Rotschopf (Tigerjunges) |
| Кира (коала) | Kira (koala) | Kira (Koala) |
| Радуга (единорожка) | Rainbow (unicorn) | Regenbogen (Einhorn) |
| Кудряшка (альпака) | Curly (alpaca) | Löckchen (Alpaka) |
| Рябинка (красная панда) | Berry (red panda) | Beerchen (Roter Panda) |
| Пирожок (панда) | Dumpling (panda) | Knödel (Panda) |
| Лорд (привидение) | Lord (ghost) | Lord (Gespenst) |
| Белоснежка / белый котёнок (if met) | see EN | follow EN's idea in German (Schneeflocke, weißes Kätzchen) |
| Рина, Шани, Жасми | Rina, Shani, Jasmi | Rina, Shani, Jasmi |
| Бабушка / Дедушка | Granny / Grandpa | Oma / Opa |
| Бабушка Нина / Дедушка Саша | Granny Nina / Grandpa Sasha | Oma Nina / Opa Sascha |
| Мама / Папа | Mum / Dad | Mama / Papa |
| Тётя / Дядя | Auntie / Uncle | Tante / Onkel |
| Сестра / Брат | Sister / Brother | Schwester / Bruder |
| внуки (of grandparents) | grandchildren | Enkel |
| дети (of parents) | children | Kinder |
| племянники | nieces and nephews | Nichten und Neffen |
| Логопед (lesson) | Speech | Sprechen |
| Чтение | Reading | Lesen |
| Математика | Maths | Mathe |
| Скорочтение | Speed reading | Schnelllesen |
| Книга | Book | Buch |
| Тренировка Л | L training | L-Training |
| занятие (daily lesson) | lesson | Übung |
| Занятия на сегодня | Today's lessons | Heute üben |
| звёзды | stars | Sterne |
| наклейка | sticker | Sticker |
| медаль | medal | Medaille |
| уровень | level | Level |
| лига / семейная лига | league / family league | Liga / Familienliga |
| баттл | battle | Duell |
| семья | family | Familie |
| Кто играет? | Who's playing? | Wer spielt? |
| Для взрослых | For grown-ups | Für Erwachsene |
| 👑 Пульт | 👑 Control panel | 👑 Eltern-Zentrale |
| Войти в семью | Join your family | Familien-Login |
| Пригласить / Пригласить родных | Invite / Invite family | Einladen / Familie einladen |
| Похвалить | Praise | Loben |
| Говорим / Учимся / Творим / Узнаём / Сегодня (tabs) | Speak / Learn / Make / Find out / Today | Sprechen / Lernen / Gestalten / Entdecken / Heute |
| Мои языки | My languages | Meine Sprachen |
| миссия | mission | Mission |
| праздник / выходной | holiday / day off | Fest, Feiertag / freier Tag |
| история (story) | story | Geschichte |
| раскраска | colouring page | Ausmalbild |
| шахматы: король, ферзь, ладья, слон, конь, пешка, шах, мат | king, queen, rook, bishop, knight, pawn, check, checkmate | König, Dame, Turm, Läufer, Springer, Bauer, Schach, Schachmatt |
| Я сказала! / Я сказал! | I said it! | Gesagt! |
| Я прочитала! | I read it! | Gelesen! |
| Нажми … | Tap … | Tippe auf … |
| Дыхание | Breathing | Atmen |
| Зарядка для язычка | Tongue workout | Zungengymnastik |

## Data you will meet
- Stories (LEARN, PLACE_DATA, LEARN.phys, museum and composer texts): titles, texts, questions and answers for children.
  Translate faithfully and simply; keep facts; keep the order of answers.
- Holidays: the official German name of each holiday (Heilige Drei Könige, Tag der Deutschen Einheit …); for Portuguese and
  Russian holidays a clear German name.
- COUNTRY_INFO: capitals in German (Lissabon, Moskau, Wien), and "hello"/"thank you" in the country's own language in its
  own Latin spelling ('Olá', 'Obrigado'); for non-Latin scripts a simple romanization ('Privet', 'Spasibo').
- City and country names in their German form (Sankt Petersburg, Lissabon, Porto, Moskau, Rom, Mailand).
- Months: 'января' (after a day number) → 'Januar'. Short weekdays Пн..Вс → Mo Di Mi Do Fr Sa So.
- Interests (INTEREST_CAT, LIKES_BASE): names and the word lists the child practises: natural German words, keep the count.

## Output
Write `<batch>.out.json` next to the batch file: one JSON object `{ "<id>": "<German>", ... }` with every id of the batch
(a plain string per id). You may write it in several parts named `<batch>.out.1.json`, `<batch>.out.2.json`, … (same
format) — all parts together must cover every id once. Write the JSON with a script (Python json.dump, ensure_ascii=False)
so quotes and backslashes are escaped correctly. Then run `node check_de.js <batch>` in
i18n/de and fix every problem it lists
until it prints "OK".
