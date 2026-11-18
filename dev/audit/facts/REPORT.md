# Проверка фактов «Говорилок» — выборка 32 текстов (18.11.2026)

Источники текстов: `dev/stories/<batch>/*.json` (истории путешествий, профессии), `dev/stories/news/*.json` (новости),
`art/notes-ru.json` + `art/art-ru.json` (картины), `art/cfacts-ru.json` (композиторы). Проверка — WebSearch по каждому утверждению.
Ничего в проекте не менялось.

Обозначения: ✅ верно · ⚠️ неточно / устарело / упрощено · ❌ неверно.

## Таблица

| # | Текст (id / название) | Утверждение | Вердикт | Источник | Что поправить |
|---|---|---|---|---|---|
| 1 | spb-n-grand-maket «Вся Россия в одном зале» | Ночь наступает каждые 13 минут | ✅ | https://peterburg2.ru/restplaces/5119.html, https://eugene.kaspersky.com/2015/07/23/the-tiniest-biggest-country-in-the-world/ | — (источники дают 13–15 мин; «примерно каждые 13 минут» точнее) |
| 2 | spb-n-kazan-colonnade «Собор, который раскинул руки» | 96 колонн | ✅ | https://www.booksite.ru/fulltext/0/001/005/203/83.htm | — |
| 2 | | Воронихин был крепостным | ✅ | https://t-j.ru/kazanskyi-sobor/ | — |
| 2 | | Строили 10 лет, 1801–1811 | ✅ | https://en.scientificrussia.ru/historical-events/8-sentabra-1801-goda-... | — |
| 3 | spb-c-zaliv-presnyj «Море, где вода почти не солёная» | Невская губа почти пресная | ✅ | https://en.wikipedia.org/wiki/Neva_Bay (солёность ≈ 0,5–2 ‰) | — |
| 4 | cas-a-kazino-eshtoril «Большое здание у моря» | Одно из самых больших казино Европы | ✅ (формулировка осторожная) | https://en.wikipedia.org/wiki/Casino_Estoril | — |
| 4 | | Первый камень в 1916 заложил президент | ✅ (16.01.1916, Бернардину Машаду) | https://www.cascais.pt/node/8593 | — |
| 4 | | Открылось в 1931 | ✅ | https://www.dn.pt/arquivo/diario-de-noticias/inauguracao-do-casino-mais-antigo-da-europa.html | — |
| 5 | lis-b-rimskij-olisipo «Олисипо — римский Лиссабон» | Римский театр на склоне холма рядом с Алфамой | ✅ | https://www.museudelisboa.pt/en/sites/roman-theatre | — |
| 6 | por-a-maria-pia «Мост королевы Марии Пии» | Построила фирма Эйфеля | ✅ (проект Сейрига и Эйфеля, 1877) | https://en.wikipedia.org/wiki/Maria_Pia_Bridge | можно: «инженеры Эйфеля» |
| 6 | | Поездов там нет, рядом новый мост | ✅ (закрыт 1991, мост Сан-Жуан) | https://structurae.net/structures/maria-pia-bridge | — |
| 7 | pt-n-estrela «Звёздные горы» | Самые высокие горы материковой Португалии | ✅ (Торре 1993 м; Пику на Азорах выше) | https://www.visitportugal.com/ru/destinos/centro-de-portugal/73759 | — |
| 7 | | Эштрельская овчарка веками охраняла овец от волков | ✅ | https://en.wikipedia.org/wiki/Estrela_Mountain_Dog | — |
| 8 | ru-transsib «Неделя в поезде» | Самая длинная железная дорога | ✅ | https://bigenc.ru/c/transsibirskaia-magistral-7c856d | — |
| 8 | | Почти неделя пути | ✅ (6–7 суток) | https://www.kupibilet.ru/blog/puteshestvie-po-transsibu | — |
| 8 | | Столбик 9288 во Владивостоке | ✅ | https://bigenc.ru/c/transsibirskaia-magistral-7c856d | — |
| 9 | ru-b-onezhskoe-ozero «Онежское озеро и его острова» | Второе по величине в Европе | ✅ | https://booksite.ru/FullText/1/001/008/084/444.htm | — |
| 9 | | Больше полутора тысяч островов | ⚠️ | БСЭ: 1369 островов; туристические сайты: ~1650 | «больше тысячи островов» |
| 9 | | Рядом добывают шунгит | ✅ | https://en.wikipedia.org/wiki/Shungite (Заонежье) | — |
| 10 | de-berlin-bear «Медведь на гербе Берлина» | Чёрный медведь с красным языком на гербе и флаге | ✅ | https://en.wikipedia.org/wiki/Coat_of_arms_of_Berlin | — |
| 10 | | Разрисованные скульптуры медведей по городу | ✅ (Buddy Bears) | https://theculturetrip.com/.../a-brief-history-of-berlins-iconic-buddy-bears/ | — |
| 11 | de-s-linderhof «Дворец Линдерхоф» | Струя фонтана высотой с многоэтажный дом | ✅ (22–25 м) | https://en.wikipedia.org/wiki/Linderhof_Palace | — |
| 11 | | Пещера с озером, лодка-раковина, цветная подсветка | ✅ | https://schlosslinderhof.de/englisch/grotto/index.htm | — |
| 12 | jpn-a-tokyo-big «Самый большой город» | В Токио с окрестностями больше людей, чем во всей Португалии | ✅ (37–41 млн против 10,6 млн) | https://en.wikipedia.org/wiki/Greater_Tokyo_Area | — |
| 12 | | У линий свой цвет, у станций номер | ✅ | https://www.tokyometro.jp/en/subwaymap/ | — |
| 13 | us-ny-subway «Метро, которое не спит» | Открыли в 1904 | ✅ (27.10.1904) | https://www.history.com/this-day-in-history/october-27/new-york-city-subway-opens | — |
| 13 | | Больше 400 станций | ✅ (472, или 423 комплекса) | https://en.wikipedia.org/wiki/New_York_City_Subway | — |
| 13 | | Поезда ходят круглые сутки | ✅ | там же | — |
| 14 | sp-gagarin «Поехали!» | 12.04.1961, первый человек в космосе, «Восток», один виток | ✅ | https://www.nasa.gov/?p=407852 | — |
| 14 | | Весь полёт занял 108 минут | ⚠️ | https://russianspaceweb.com/vostok1.html (по рассекреченным данным 106 мин; 108 — традиционная цифра) | «почти два часа» или «106 минут» |
| 15 | old-first-hands «Ладошки на стене» | Пещера рук в Аргентине, отпечаткам много тысяч лет | ✅ (≈9000 лет) | https://en.wikipedia.org/wiki/Cueva_de_las_Manos | — |
| 15 | | Краску выдували через трубочку из косточки | ✅ | там же | — |
| 15 | | «Малыши тоже участвовали» | ⚠️ | https://www.discoverwildlife.com/prehistoric-life/cueva-do-las-manos (по размеру рук — подростки и дети 10–13 лет, не малыши) | «дети и подростки тоже оставляли ладошки» |
| 16 | news-parker-closest-sun «Зонд у самого Солнца» | 24.12.2024, ближе всех аппаратов | ✅ | https://www.guinnessworldrecords.com/world-records/sun-closest-approach-by-spacecraft | — |
| 16 | | ≈6 млн км от поверхности | ✅ (6,1 млн) | https://science.nasa.gov/.../nasas-parker-solar-probe-makes-history-with-closest-pass-to-Sun | — |
| 16 | | ≈690 тыс. км/ч | ✅ (692 000) | там же | — |
| 17 | news-thutmose-ii-tomb «Найдена гробница Тутмоса Второго» | Объявлено в феврале 2025 | ✅ (19.02.2025) | https://www.cam.ac.uk/stories/tale-of-thutmose-tomb | — |
| 17 | | Правил ≈3500 лет назад | ✅ (ок. 1493–1479 до н. э.) | https://www.biblicalarchaeology.org/daily/ancient-cultures/ancient-egypt/tomb-of-pharaoh-thutmose-ii-discovered/ | — |
| 17 | | Вход нашли в 2022, думали — жена фараона; имена на осколках алебастра | ✅ | https://www.nbcnews.com/news/world/missing-tomb-egyptian-pharaoh-solves-one-ancient-egypts-great-mysterie-rcna192945 | — |
| 18 | news-saturn-128-moons «У Сатурна 128 новых лун» | 11.03.2025, 128 новых, было 146, стало 274 | ✅ | https://science.ubc.ca/news/march-12-2025/saturn-still-reigns-supreme-moon-king-128-new-moons | — |
| 18 | | У Юпитера 95 | ⚠️ (цифра на 2024 г.; к 2026 у Юпитера 97) | https://www.nationalgeographic.com/science/article/saturn-new-moons-record | «у Юпитера меньше ста» |
| 18 | | Телескоп на Гавайях | ✅ (CFHT) | там же | — |
| 19 | news-rubin-first-images «Самая большая камера для неба» | 23.06.2025, Чили, самая большая цифровая камера | ✅ | https://rubinobservatory.org/news/rubin-first-look/cosmic-treasure-chest | — |
| 19 | | Около 10 млн галактик на одном снимке; Трёхраздельная и Лагуна; 10 лет съёмки | ✅ | там же | — |
| 20 | news-cr450-fast-train «Поезд быстрее четырёхсот пятидесяти» | Октябрь 2025, 453 км/ч на испытаниях | ✅ | https://enapp.chinadaily.com.cn/a/202510/21/AP68f70ef1a31017a8053b817e.html | — |
| 20 | | >125 м за секунду | ✅ (453/3,6 = 125,8) | арифметика | — |
| 20 | | Пассажиров будет возить ≈400 км/ч | ✅ | там же | — |
| 20 | | 600 000 км обкатки | ✅ (с оговоркой: Xinhua, дек. 2024, о прототипе) | https://railway-news.com/china-cr450-electric-train-sets-new-speed-records/ | — |
| 21 | news-grand-egyptian-museum «Большой египетский музей открылся» | Начало ноября 2025 | ✅ (01.11.2025) | https://www.aljazeera.com/news/2025/11/1/egypt-unveils-grand-egyptian-museum-dedicated-to-its-ancient-civilisation | — |
| 21 | | Самый большой музей одной древней цивилизации | ✅ | https://www.euronews.com/culture/2025/11/01/20-years-in-the-making-the-grand-egyptian-museum-officially-opens | — |
| 21 | | Строили >20 лет; статуе Рамсеса ≈3200 лет; сокровища Тутанхамона — несколько тысяч вещей | ✅ (2005–2025; 3200; ≈5000) | https://phys.org/news/2018-01-egypt-colossus-ramses-ii-museum.html | — |
| 22 | news-sagrada-familia-tallest «Самая высокая башня Гауди» | 20.02.2026 поставили верх креста, 172,5 м | ✅ | https://www.catalannews.com/society-science/item/sagrada-familia-reaches-1725-metres | — |
| 22 | | Первый камень 1882, Гауди — главный архитектор | ✅ | https://www.vaticannews.va/en/church/news/2026-02/basilica-sagrada-familia-cross-completed-tower-of-jesus-christ.html | — |
| 22 | | С осени 2025 — самый высокий собор, обогнал Ульм | ✅ (окт. 2025, 162,9 м > 161,5 м) | https://www.domusweb.it/en/news/gallery/2026/03/02/sagrada-familia-completed-world-tallest-church.amp.html | — |
| 23 | news-artemis2-moon-flight «Четверо вокруг Луны» | 01.04.2026 старт, экипаж из четырёх | ✅ | https://www.satellitetoday.com/government-military/2026/04/12/artemis-ii-crew-completes-historic-lunar-flyby-mission | — |
| 23 | | 6 апреля — дальше всех людей, ≈407 тыс. км | ✅ (>250 000 миль) | https://news.wttw.com/2026/04/10/artemis-ii-astronauts-return-moon-splashdown-close-out-record-breaking-lunar-voyage | — |
| 23 | | 10 апреля приводнение в Тихом океане у Калифорнии | ✅ (у Сан-Диего) | https://www.adn.com/nation-world/2026/04/10/artemis-ii-crew-splashdown-in-the-pacific-to-cap-nasas-lunar-comeback/ | — |
| 23 | | Первый полёт людей к Луне за >50 лет | ✅ (Apollo 17 — дек. 1972) | там же | — |
| 24 | news-robot-half-marathon-2026 «Робот-бегун быстрее рекорда» | 19.04.2026, Пекин, 50 мин 26 с | ✅ | https://www.pbs.org/newshour/world/humanoid-robot-wins-beijing-half-marathon-defeating-the-human-world-record | — |
| 24 | | Рекорд людей 57:20 | ✅ (Киплимо, Лиссабон 08.03.2026; ждёт ратификации) | https://worldathletics.org/news/report/jacob-kiplimo-half-marathon-world-record-lisbon | — |
| 24 | | Год назад победителю понадобилось >2,5 ч | ✅ (2:40:42) | https://technode.com/2025/04/21/... | — |
| 25 | news-starship-ship-catch «Корабль поймали «палочками»» | 14.11.2026, корабль пойман башней — впервые | ✅ | https://spacepolicyonline.com/?p=91790 | — |
| 25 | | 14 витков, ≈22,5 ч, 26 спутников | ✅ | https://www.aviation24.be/space/spacex/spacex-catches-starship-after-orbital-flight-but-loses-booster/ | — |
| 25 | | «Нижнюю часть поймать не вышло: она ушла на посадку в море» | ⚠️ (ускоритель увели в залив, и он взорвался над водой) | https://katv.com/news/nation-world/spacex-catches-starship-after-orbit-in-historic-first-as-booster-explodes-over-gulf | «её увели в сторону моря, и она разрушилась» — или оставить мягко, но не «посадка» |
| 26 | Картина Q219831 «Ночной дозор» (1642) | Девочка в золотистом платье; собака внизу справа | ✅ | https://smarthistory.org/?p=20258 | — |
| 26 | | На самом деле день, лак потемнел — прозвали «ночным» | ✅ | там же | — |
| 27 | Картина Q151047 «Рождение Венеры» (1485) | Ветры с надутыми щеками, летят розы, раковина | ✅ | https://uffizi.it/en/artworks/birth-of-venus | — |
| 27 | | Краски смешивал с яичным желтком | ✅ (темпера на холсте) | там же | — |
| 28 | Композитор bach (cfacts) | 20 детей, четверо сыновей — известные композиторы | ✅ | https://www.vermontpublic.org/post/timeline-030-bach-children | — |
| 28 | | В 20 лет прошёл ≈400 км к Букстехуде | ✅ (Арнштадт–Любек ≈ 400–430 км, 1705) | https://gresham.ac.uk/node/12979 | — |
| 28 | | Задержался на четыре месяца вместо одного | ✅ (источники: 3–4 месяца вместо 4 недель) | https://www.britannica.com/biography/Johann-Sebastian-Bach | — |
| 29 | Композитор grieg (cfacts) | Рост ≈1,5 м | ✅ (152 см) | https://en.visitbergen.com/things-to-do/attractions/museums/the-composer-edvard-grieg | — |
| 29 | | Всегда носил в кармане фигурку лягушки на удачу | ✅ (талисман, гладил перед выходом на сцену) | https://greatcomposers.nifc.pl/en/grieg/catalogs/places/272 | — |
| 29 | | 66 «Лирических пьес»; записи 1903 года | ✅ (10 тетрадей, 66 пьес; Париж, 02.05.1903) | https://www.chasingthebutterfly.no/?page_id=2 | — |
| 30 | job-own-bakery «Хозяйка пекарни» | Дрожжи — живые грибки | ✅ | общеизвестно | — |
| 30 | | 30 → 50, остаётся 20 | ✅ | арифметика | — |
| 30 | | Пекарня на севере Португалии, а цены «в рублях» | ⚠️ (в Португалии евро) | — | «стоят 30 монеток, продаю за 50» или перенести пекарню в Россию |
| 31 | job-sci-genetik «Генетик» | ДНК записана четырьмя «буквами» | ✅ | общеизвестно | — |
| 31 | | ДНК двух людей совпадает на ≈99,9 % | ✅ (округлённая оценка HGP) | https://www.genome.gov/human-genome-project | — |
| 31 | | Цвет глаз плодовых мушек — классический объект | ✅ | общеизвестно (Морган) | — |
| 32 | job-feldsher «Фельдшер скорой помощи» | Скорая — 103, с мобильного ещё 112 | ✅ | https://media.mts.ru/technologies/211305-kak-vyzvat-skoruyu-pomoshch-s-mobilnogo | — |
| 32 | | Тонометр, фонендоскоп, бинты | ✅ | — | — |

Просмотрены без проверяемых фактов (только описания): es-barcelona-boqueria «Самый яркий рынок», es-food-gazpacho «Суп, который едят холодным».

## Итоги

- Утверждений проверено: **78**. ✅ верно — **72**, ⚠️ неточно/устарело — **6**, ❌ неверно — **0**.
- По текстам: 32 текста, из них 26 без замечаний, 6 с одной неточностью каждый.
- Плагиат: 5 точных фраз по 8+ слов (Казанский собор, Серра-да-Эштрела, Гагарин, Большой египетский музей, мост Марии Пии) искали в кавычках — совпадений нет, тексты авторские.
- Возраст: пугающего, жестокого или политического не найдено. Новости специально смягчены (взрыв ускорителя не упоминается). Два сомнительных места: cas-a-kazino-eshtoril — казино как достопримечательность для детей (текст честно говорит «взрослое место», но тема спорная для 4–7 лет); Q29530 «Свобода, ведущая народ» — слово «восстание» без объяснения (не страшно, но ребёнку непонятно).

## Закономерности ошибок

1. **Устаревшее «сейчас»**: число лун Юпитера (95 на 2024 г.) — такие цифры стареют за год. Лучше писать «меньше ста», «около».
2. **Цифра из популярного источника против энциклопедии**: острова Онеги (1650 у турсайтов, 1369 в БСЭ), 108 минут Гагарина (официальная старая цифра против 106 по документам). Когда источники спорят, безопаснее округлять («больше тысячи», «почти два часа»).
3. **Трогательное преувеличение**: «малыши тоже участвовали» (Пещера рук) — по данным учёных это подростки. Красивая деталь, но не подтверждена.
4. **Смягчение новости до неправды**: ускоритель Starship «ушёл на посадку в море» — на деле взорвался над заливом. Смягчать можно, но не называть это посадкой.
5. **Несогласованность внутри текста**: пекарня в Португалии считает в рублях (шаблон «Своё дело» писался под Россию).
6. Числа, даты, имена, «первый/самый» в новостях и историях путешествий — все 60+ проверенных совпали с источниками; редакторская работа с источниками (`src` в новостях) видна.

## Пять худших мест (точные цитаты)

1. **sp-gagarin** — «Он облетел вокруг Земли один раз, и весь полёт занял 108 минут.» → по рассекреченным документам 106 минут; 108 — цифра советской печати. Предложение: «…и весь полёт занял меньше двух часов».
2. **ru-b-onezhskoe-ozero** — «А ещё на нём больше полутора тысяч островов» → БСЭ: 1369. Предложение: «больше тысячи островов».
3. **old-first-hands** — «Есть и совсем маленькие ладошки: значит, малыши тоже участвовали в этом художестве!» → учёные говорят о подростках 10–13 лет. Предложение: «Есть и ладошки поменьше: значит, дети и подростки тоже участвовали».
4. **news-starship-ship-catch** — «А нижнюю часть ракеты в этот раз поймать не вышло: она ушла на посадку в море.» → ускоритель увели от башни, и он разрушился над заливом. Предложение: «…поймать не вышло: её увели в сторону моря, подальше от людей».
5. **job-own-bakery** — «у меня своя пекарня в маленьком городке на севере Португалии… Мука, масло и яйца на одну булочку стоят 30 рублей, продаю я её за 50.» → в Португалии евро. Предложение: заменить «рублей» на «монеток» (и так во всех «Своё дело», если герой не в России), либо убрать страну.

(Шестая, мелкая: **news-saturn-128-moons** — «у Юпитера, соседа Сатурна, их 95» → уже 97; лучше «меньше ста».)
