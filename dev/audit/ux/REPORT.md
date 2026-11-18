# Говорилки — UX audit of the built site (v167), 2026-11-18

Scope: the built site at http://localhost:8781/govorilki/ (ru / en / pt / de), Playwright + Chromium, phone 390×844 @2x and laptop 1280×800.
Invented children only (Тина 5, Тоша 7, Тим 9 «Миссия Л», Тина 8 trilingual). Nothing under dev/game or the built pages was changed.

All scripts, JSON dumps and screenshots live in
/tmp/claude-0/-home-user-govorilki/c1b0d3e7-ea18-5cf4-9cf9-63cd21a8f7a6/scratchpad/ux/ (screenshots in shots/; below «S/» = that shots/ folder).
Scripts: firstrun.js, day.js <p5|p7|p9l|p8tri>, parents.js, looks.js, offline.js, offline2.js, langs.js, misc.js (shared helper lib.js).
Method note: games were opened by real taps; a game was «played through» by calling the game's own finish({key}), so the counts of
overlays / stars / stickers are exactly what a child gets, while the minutes are estimates (noted as such).

---

## Findings, ranked by severity

### 1. HIGH — The day of a 7–9-year-old is a 30-minute drill of 14–18 games; the speech step alone is 9–11 games
Evidence (day-p7.txt, day-p9l.txt, day-p8tri.txt, day-*.json):

| child | must-steps | games on the path | of them in «Логопед» | celebration overlays | est. minutes* |
|---|---|---|---|---|---|
| Тина 5 (little one) | 3 (speech, read, math) + «Счёты по желанию» | 7 | 3 | 11 | ~15 |
| Тоша 7 | 5 (speech, read, math, soro, puzzle) | 18 | 10 | 24 | ~33 |
| Тим 9, «Миссия Л» | 5 (speech, read, soro, puzzle, book) | 14 (+ the real book) | 9 | 20 | ~25 + reading |
| Тина 8, ru/pt/en | 5 | 18 | 11 | 24 | ~33 |

* estimate: breath ≈ 1 min, articulation ≈ 1–1.5 min (each starts with the camera question), a game ≈ 1.5–2 min, reading placement = 8 tasks ≈ 3 min, every overlay ≈ 5–8 s.

The 7-year-old's «Логопед» = 2 breaths + 5 articulations + the cotton-swab gymnastics + 3 games (gram-page, sh-syll, boxes); the trail on every win overlay shows how far it still is: «👅 👅 👅 👅 🎮 🎮 🎮 🏁» (S/2-day-p7-phone-12-speech-win1.png). The owner's own note says «anything that feels like a drill gets skipped»; ten speech items in a row before the first «real» game is exactly that. For the little one the step is capped at 3 (LITTLE.plan) — the same cap (or 4–5) is missing for 7+.

### 2. HIGH — Reward inflation: half the sticker album in one day, three kinds of «наклейка», a celebration every 60–90 seconds
Evidence (day-*.txt, FINAL lines; fairStars at dev/game/govorilki.html:8350, stickerCount at :3954, album = 30 stickers at :3951):

- Each game +3★, each finished step +3★, chest +5★; a new album sticker every 5★.
- Тина 5: 5★ → 40★ in one day, album stickers 1 → 8, plus 3 «наклейки дня», plus the chest's «Новая наклейка!» → 11 stickers in one day, 11 overlays with confetti for 7 games.
- Тоша 7: 5★ → 79★, album 1 → 15 of 30 in one day; Тим 9: 67★ / 13 stickers; Тина 8: 79★ / 15 stickers. The album (30) is full on day 2–3.
- Replaying a finished game gives the full 3★ again until the 4th replay (fairStars: n > 3), so «Ветерок» ×3 = 9★ = ~2 stickers («REPLAY first game of a done step: +3★» in every day-*.txt).
- The word «наклейка» means three different things (album sticker every 5★, «наклейка дня» per step for little ones, «Раскрась наклейку» after the path) — the child cannot tell them apart.
- Every win overlay also carries 👍/👎 (S/2-day-p5-phone-12-speech-win2.png); the answer to 👎 is text-only «Запомнил. Будем реже предлагать эту игру.» with no voice (misc.js: said = []) — invisible to a non-reader.

### 3. HIGH — The «favourite game» reward turns into a tongue drill / grammar page
- Before the chest the home card says «Любимая игра: Рисовалка · ⏳ после сундука» all day (S/2-day-p5-phone-00-home.png). After the chest the 5-year-old taps it and gets «Разминка для язычка — Сначала одно упражнение для язычка — и сразу рисуем!» with a «Как говорить Р» text block (S/2-day-p5-phone-26-fav-game.png) — although she has just done the whole path with its articulation exercise. Cause: warmGate (govorilki.html:22763) checks P.warmAt, which is set only by the warm-up itself, never by the articulation exercises of the path. The same gate hits the «Мастерская» door's «Игра дня: Рисовалка» for the 8-year-old (day-p8tri.txt: ROOM GAME said «Сначала разомнём язычок…»).
- For Тоша 7 and Тина 8 the favourite after the chest is «Грамматика: страница в день», for Тим 9 «Скороговорки» (day-p7.txt, day-p9l.txt, day-p8tri.txt: fav="OPEN Любимая игра: …"). Cause: favGame() (:27453) picks the most-played game of the profile excluding only breath/artic/soroban/olymp-day/r-skill/m-skill/book; on day one the «most played» is whatever the path just forced. A 10-minute reward that is a grammar page is not a reward.

### 4. MEDIUM — First run: 11 taps and 7 screens before the first game; a 3-screen-long settings page for one child
Evidence: firstrun5.txt, S/1-firstrun5-phone-01…12, laptop the same (firstrun5-laptop.txt).

Landing → «Начать: создать семью» → family form (name, girl/boy, «или просто возраст» fold + age) → «Сохранить» → child settings → «Дальше» → look («Какой вид больше нравится?») → «Дальше» → «Готово!» → «Начать занятия» → home → first step → «В путь!» → «Поехали!» → game. 11 taps + typing, 7 screens, ~2–3 minutes for the parent.

What the parent has to decide, and what gets in the way:
- The family form defaults «Где живёте» to 🇺🇸 США on the Russian page (S/1-firstrun5-phone-02-family-form.png) — the family lives in Portugal; the language page or the browser locale would be a better default. The «Название» field is optional but first; a new parent types there before finding the child.
- The child settings screen is 3.1 screens tall with 244 buttons (parents-phone.txt: kid-setup screen: {"buttons":244,"screens":3.1}): 4 languages × 3 roles, 4 sound chips («Отмечено по возрасту»), «Что она любит?» (wait for the child / mark yourself / own text), birthday, 14 home-screen sections, «Выбрать отдельные игры», «Свои слова». The «Готово!» button is at the very bottom. On first run only sounds and languages matter; the rest belongs in «Для взрослых».
- «Готово!» screen offers «🏆 Лига семей» as the second button to a family that has not played once, and a 50-word anonymous-statistics paragraph (S/1-firstrun5-phone-07-after-look.png).
- For a non-reading 5-year-old everything up to the home screen is parent territory (fine), but the home itself is silent on arrival: voiceOnArrival = [] in firstrun5.txt step 8 — the friend's bubble «Привет, Тина! Сегодня 3 занятия. Начнём?» is text only until she taps the tiger. The voice starts only with the first step («Отправляемся в путь, Тина!»). The orange «НАЧАТЬ» node is big enough to find without reading, so this is a soft dead spot, not a dead end.
- The very first game of a brand-new family is «Ветерок» = blow into the microphone. Without a microphone (denied / none) the game waits ~6 s, then says «Тогда держи оранжевую кнопку, пока дуешь» and swaps in a «Дую!» hold-button (misc.js, S/8-misc-wind-nomic-6s.png) — there is a way through, but the first thing a new family sees is a permission prompt and a 6-second pause.
- After onboarding, every launch starts with «Кто играет? Нажми на себя» even for a one-child family (misc.js: RELOAD … who-plays screen = 1, S/8-misc-reload-who.png): one extra tap per launch, with «🔑 Войти в семью» and «＋ Новенький» next to the child.

### 5. MEDIUM — The old tab bar: the friend's floating button covers the «Узнаём» tab (71 % overlap)
With «Простой день» off (the parent's switch, also what «Все игры» shows), the tab bar comes back and the «Поговорить с другом» FAB (#tkFab, 68×68 at x=308,y=758) sits on top of the last tab (#tabBar «Узнаём», 74×58 at x=310,y=780): 3029 of 4284 px² covered (offline2.js output; S/6-offline-09-tabs-fab.png). A real tap on «Узнаём» opens the talk panel instead; Playwright refused the click twice for exactly this reason. Phone only (390 px).

### 6. MEDIUM — The cotton-swab step in the middle of a child's path needs an adult and 127 words of safety text
«Гимнастика с ватной палочкой» is game 7 of 10 for Тоша 7 and Тина 8, game 7 of 9 for Тим 9 (S/2-day-p7-phone-11-speech-g7-swabmotor.png). The screen is «Для взрослого: как безопасно» + «Понятно, я рядом» + «Садимся перед зеркалом. Взрослый держит палочку…»; the voice says «Позови взрослого». A child doing the path alone (the normal case for 7–9) either taps «Понятно, я рядом» herself or is stuck. Belongs outside the path, or only when a grown-up switched it on.

### 7. MEDIUM — Non-readers: a few screens where text is the only guidance
Good news first: on the little one's path every game speaks its instruction (spokenShare 0.4–1.0 in day-p5.txt), the step node says «НАЧАТЬ» in a big orange pill, and the reading step is ear-based (letters Ч Е Ю after «Найди букву Ю», S/2-day-p5-phone-11-read-g1-r-skill.png). Text-only places that remain:
- Camera question before every articulation: «Включим волшебное зеркало? … Да, включить / Не надо» — two identical brown buttons, no icon; the voice asks only «Хочешь видеть себя, как в зеркале?» (S/2-day-p5-phone-11-speech-g2-articsh-horse.png). The 5-year-old gets this once per exercise, the 7-year-old 5 times a day.
- The «Сказки и книги» door → «Книжная полка»: shelves «Первые сказки 3–5 лет / Добрые герои 5–6 лет / …» and book titles, the voice says only «Полка „Первые сказки“. Выбери книгу!» (S/2-day-p5-phone-25-room-game.png).
- Browser back from an articulation exercise lands on «Зарядка для язычка — Сядь перед зеркалом. Выбери упражнение» with 24 «?» tiles and 10+ named exercises — off the path, text-labelled (S/2-day-p5-phone-30-after-back.png). From a breath game back goes home (older children in day-*.txt: after back: home:true).
- «Давай только одну!» offer after leaving a step halfway is spoken (good), but its two buttons are text.

### 8. LOW — Parent panel: the hub is fine, but the same things live in three places
Evidence: parents-phone.txt, S/3-parents-phone-01-hub.png, S/3-parents-phone-10-*.png (full pages), S/3-parents-phone-42-pult.png.
- 1 tap from home (⚙️) → a 12-row hub (78 words, 1.1 screens) → 12 pages with in total 15 checkboxes, 9 selects, 4 inputs, 91 buttons, 6 folds, 1324 words. The biggest page «День и все игры» = 6 switches, 2 selects, 25 buttons, 417 words, 1.7–2.3 screens.
- Report: 2 taps (⚙️ → Отчёт); for a new child it says «На этой неделе ещё не было занятий» + a folded «одна идея». Good.
- Change the practised sound: 4 taps (⚙️ → «Тина» → «Интересы и игры» → chip), saved at once, no Save button; but the sound chips sit under the 4×3 language block on a 3-screen page (S/3-parents-phone-30-sounds.png), and the «Тина» row has a generic 🧒 icon instead of her face.
- Add a grandparent: 4 taps + name + save (⚙️ → Семья → «Кто в семье» → scroll 1.5 screens past the country list and the children to «＋ Родной»). The same family page also has «Позвать родных» → «＋ Добавить родного», and «Как дела у всех» opens the «пульт» with 21 buttons including «＋ Добавить взрослого», «📨 Пригласить родных», «⚙️ Все настройки», «👑 Я автор приложения: создать ключ», «🧪 Как видят другие» (top card). Three entry points for one job; the «пульт» looks like the developer's own console.
- The reading-fine switch «День без чтения: −10 ⭐» is on by default on the child's page; a parent who never opens the panel does not know the child is fined.

### 9. LOW — Small text and small tap targets (measured with getComputedStyle, visible elements only)
Same numbers in all three looks (looks-phone.txt):
- Home: 0 texts < 14 px, 1 target < 44 px (the child chip 103×42). Scrolled home: «приз за весь день» 13 px; the «Завтра:» chips («🌿 Природа и океан») 33 px tall (3 targets).
- «Узнавай» list (Космос): 9 texts < 14 px («Новое!» badges 12 px, dates) (S/4-look-bright-phone-3-learn-list.png).
- «Путешествие по миру»: 24 tap targets < 44 px — the passport flags 38×38 (S/4-look-dark-phone-5-travel.png); «100 историй» 13 px.
- Parent hub: 7–8 texts at 12–13 px (the children's names under the faces, row subtitles); every switch is 52×32.
- Laptop en/pt/de home: 8 texts < 14 px (the right-hand week/stars panel).
- Contrast (the project's own look_dark.js audit, WCAG 4.5:1 / 3:1): 0 failures on home, two games, the story list, a story, the journey, the parent panel and the album in bright, calm and dark. Dark story text is white on #1b2140 — fine (S/4-look-dark-phone-4-story.png). One cosmetic: in «Похожие слова» one card showed a 🖼️ placeholder instead of a picture in the dark run (S/4-look-dark-phone-2b-game-hear-pairs.png) — a word without a picture, not a look problem.

### 10. LOW — Offline: pages, packs and fonts are cached, pictures of stories are not
After one online visit the service worker holds 29 entries: the 4 language pages, manifest, icons, 2 fonts and all 17 data/ru/*.json packs (offline-cache.json). Offline reload: home opens, a door room opens, «Космос» and a journey story («Кашкайш → Ветер с севера») open with their full text (offline2.js, S/6-offline-12-space-story.png, S/6-offline-15-travel-story.png). What fails offline: the story pictures — 7 × img/learn/pt-*-s.webp of the Кашкайш page (net::ERR_FAILED); the cards show without photos. No page errors.

### 11. LOW — en / pt / de
No untranslated Russian on the home of a 7-year-old on /, /pt/, /de/ (phone and laptop) — the only Cyrillic is the invented child's name (langs.txt). The first step's intro and game are translated. No horizontal overflow (scrollWidth = innerWidth). Two emoji in the «After the path» teaser («🫀», «🩰») are reported as clipped span.pic on all three — a cosmetic crop, visible in S/7-lang-en-phone-home.png only as slightly cut icons.

### 12. INFO — Console, network, break flows
- 0 page errors, 0 console errors, 0 failed local requests across all flows (log-*.json merged: first run ×2, four days, parents ×2, looks, languages, misc).
- The only external host contacted: huggingface.co (the Piper voice «Руслан», …/ru_RU/ruslan/medium/…) at start and after reload; blocked in the tests, the game falls back to the device voice. Nothing else leaves the device (no cloud call without sign-in).
- Reload mid-step: progress survives («Логопед — ДАЛЬШЕ 1/3» with the partial ring, S/2-day-p5-phone-31-after-reload.png) — but the who-plays screen comes first (see 4).
- Home button mid-game: the step keeps «ДАЛЬШЕ 1/3»; for the little one the spoken offer «Давай только одну! … одна маленькая игра — и шаг готов» appears on the next home (S/2-day-p5-phone-32-home-mid-game.png). For 7+ nothing is offered; the step just shows 1/10.
- Chest tapped early: spoken «Сундук откроется, когда всё будет сделано. Осталось одно занятие.» — good; after opening: «Сундук уже открыт. Завтра будет новый!» — good.
- After the chest the loop is clear: doors open («Двери дня — открыты — выбирай!»), «Раскрась наклейку», favourite 10 minutes, «Завтра: …» teaser; no dead end (S/2-day-p5-phone-23-home-after-chest-doors.png). One oddity: the teaser «Завтра:» changed from «Лаборатория, Театр» (before) to «Профессии, Театр» (after the chest) within the same session.
- The trilingual child on /ru/: her reading step is «Русский для меня» (a 4-station quest) and the speech step ends with «Скажи на всех языках» — sensible; but the home shows a single reading step, no sign that Portuguese/English reading come on other days.

---

## What works well
- The path itself: one big orange «НАЧАТЬ», a partial ring for a half-done step, the chest's spoken refusal/acceptance, the progress bar in the friend's bubble; laptop layout with the week/stars panel is clean (S/1-firstrun5-laptop-08-home.png).
- Little ones (≤ 6): 3 short steps, nothing to read on the path, every instruction spoken, ear-based «reading», a dancing friend and a sticker after each step, «Давай только одну!» after a half-left step, colouring after the path — this part matches the design notes.
- The voice fallback when there is no microphone («держи оранжевую кнопку»).
- The parent hub (12 rows) is a big improvement over a long form; the report page is short and kind («одна идея» folded).
- Three looks are consistent: zero contrast failures, dark mode is real dark (not inverted), «Миссия Л» keeps its own tone.
- Offline works for everything except story photos; all data packs are cached after one visit; zero console errors anywhere; nothing is sent to third parties except the voice model download.
- Translations are complete on the home and first step of en/pt/de.

## Suggested order of fixes (shortest path to the biggest effect)
1. Cap the speech step for 7+ at ~4 items (1 breath + 1–2 articulations + 1 game) and move the swab gymnastics out of the path (grown-up switch).
2. Rewards: 1★ per game or a sticker per 15–20★; one meaning of «наклейка»; no 👍/👎 on every win (ask once a week); fairStars → full stars once a day per game.
3. warmGate: count any articulation done today as the warm-up; favGame(): never a lesson game (gram-page, l-twist, sh-syll…) — fall back to likes/draw as before the chest.
4. First run: country from the page language; sounds + languages only on the first settings screen, the rest later; speak the greeting on arrival; skip «Кто играет?» for a one-child family on the same phone.
5. Move the FAB above the tab bar (or hide it while #tabBar exists).
6. Camera question with icons and a spoken «да/нет»; cache img/learn/*-s.webp of opened stories in the service worker.
