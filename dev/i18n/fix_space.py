# v145: translations — the space game «Космос» (planets, day and night, the Moon, two games) and the story section's name
import json, os, re
H = os.path.dirname(os.path.abspath(__file__))
fixed = json.load(open(H + '/fixed.json', encoding='utf-8')); fde = json.load(open(H + '/de/fixed_de.json', encoding='utf-8'))
miss = json.load(open(H + '/out-en.html.missing.json', encoding='utf-8'))
W = {
  'Солнце': ('Sun', 'Sol', 'Sonne'),
  'Это Солнце — наша звезда, огромный горячий шар. Оно такое большое, что внутри поместился бы миллион Земель. Свет от Солнца летит до нас около восьми минут.':
    ('This is the Sun, our star: a huge, hot ball. It is so big that a million Earths could fit inside it. Sunlight takes about eight minutes to reach us.',
     'Este é o Sol, a nossa estrela: uma bola enorme e quente. É tão grande que lá dentro cabia um milhão de Terras. A luz do Sol demora cerca de oito minutos a chegar até nós.',
     'Das ist die Sonne, unser Stern: eine riesige, heiße Kugel. Sie ist so groß, dass eine Million Erden hineinpassen würden. Das Sonnenlicht braucht etwa acht Minuten bis zu uns.'),
  'Меркурий': ('Mercury', 'Mercúrio', 'Merkur'),
  'Это Меркурий — самая маленькая планета и самая близкая к Солнцу. Он облетает Солнце быстрее всех: его год длится всего 88 дней. Днём там жарче, чем в печке, а ночью страшный мороз.':
    ('This is Mercury, the smallest planet and the closest to the Sun. It goes round the Sun faster than all the others: its year lasts only 88 days. In the daytime it is hotter than an oven, and at night it is freezing cold.',
     'Este é Mercúrio, o planeta mais pequeno e o mais perto do Sol. Dá a volta ao Sol mais depressa do que todos: o seu ano dura só 88 dias. De dia é mais quente do que um forno e à noite faz um frio terrível.',
     'Das ist Merkur, der kleinste Planet und der Sonne am nächsten. Er fliegt am schnellsten um die Sonne: Sein Jahr dauert nur 88 Tage. Am Tag ist es dort heißer als in einem Ofen, und in der Nacht ist es eiskalt.'),
  'Первая — самая маленькая, ближе всех к Солнцу.': ('The first one is the smallest, closest to the Sun.', 'O primeiro é o mais pequeno, o mais perto do Sol.', 'Der erste ist der kleinste, ganz nah an der Sonne.'),
  'Венера': ('Venus', 'Vénus', 'Venus'),
  'Это Венера — вторая планета от Солнца, почти такая же по размеру, как Земля. Это самая горячая планета: её укрывают толстые облака и держат жару, как одеяло. На нашем небе Венера видна как очень яркая звезда.':
    ('This is Venus, the second planet from the Sun, almost the same size as the Earth. It is the hottest planet: thick clouds cover it and keep the heat in, like a blanket. In our sky Venus looks like a very bright star.',
     'Esta é Vénus, o segundo planeta a contar do Sol, quase do tamanho da Terra. É o planeta mais quente: nuvens grossas tapam-no e guardam o calor, como um cobertor. No nosso céu, Vénus parece uma estrela muito brilhante.',
     'Das ist die Venus, der zweite Planet von der Sonne aus, fast so groß wie die Erde. Sie ist der heißeste Planet: Dicke Wolken decken sie zu und halten die Hitze fest wie eine Decke. An unserem Himmel sieht die Venus aus wie ein sehr heller Stern.'),
  'Вторая — горячая планета в жёлтых облаках.': ('The second one is a hot planet in yellow clouds.', 'O segundo é um planeta quente, com nuvens amarelas.', 'Der zweite ist ein heißer Planet mit gelben Wolken.'),
  'Земля': ('Earth', 'Terra', 'Erde'),
  'Это Земля — наш дом, третья планета от Солнца. Больше двух третей Земли покрыто океанами. Это единственная планета, где мы точно знаем, что есть жизнь.':
    ('This is the Earth, our home, the third planet from the Sun. More than two thirds of the Earth is covered by oceans. It is the only planet where we know for sure that there is life.',
     'Esta é a Terra, a nossa casa, o terceiro planeta a contar do Sol. Mais de dois terços da Terra estão cobertos de oceanos. É o único planeta onde sabemos com certeza que há vida.',
     'Das ist die Erde, unser Zuhause, der dritte Planet von der Sonne aus. Mehr als zwei Drittel der Erde sind von Ozeanen bedeckt. Sie ist der einzige Planet, von dem wir sicher wissen, dass es dort Leben gibt.'),
  'Третья — наш дом, голубая с зелёными материками.': ('The third one is our home, blue with green continents.', 'O terceiro é a nossa casa, azul com continentes verdes.', 'Der dritte ist unser Zuhause, blau mit grünen Kontinenten.'),
  'Марс': ('Mars', 'Marte', 'Mars'),
  'Это Марс — четвёртая планета, красная, потому что покрыта рыжей пылью. Он в два раза меньше Земли. На Марсе есть самая высокая гора Солнечной системы, а сейчас по нему ездят марсоходы.':
    ('This is Mars, the fourth planet. It is red because it is covered in rusty dust. It is half the size of the Earth. Mars has the highest mountain in the Solar System, and robot rovers are driving around on it right now.',
     'Este é Marte, o quarto planeta. É vermelho porque está coberto de pó cor de ferrugem. É duas vezes mais pequeno do que a Terra. Marte tem a montanha mais alta do Sistema Solar e, neste momento, há robôs a andar por lá.',
     'Das ist der Mars, der vierte Planet. Er ist rot, weil er mit rostigem Staub bedeckt ist. Er ist halb so groß wie die Erde. Auf dem Mars steht der höchste Berg im Sonnensystem, und gerade fahren dort Roboterfahrzeuge herum.'),
  'Четвёртая — маленькая и красная.': ('The fourth one is small and red.', 'O quarto é pequeno e vermelho.', 'Der vierte ist klein und rot.'),
  'Юпитер': ('Jupiter', 'Júpiter', 'Jupiter'),
  'Это Юпитер — пятая планета и самая большая. Внутри него поместилось бы больше тысячи Земель! Красное пятно на Юпитере — это буря, которая больше всей нашей Земли.':
    ('This is Jupiter, the fifth planet and the biggest of all. More than a thousand Earths could fit inside it! The red spot on Jupiter is a storm that is bigger than our whole Earth.',
     'Este é Júpiter, o quinto planeta e o maior de todos. Lá dentro cabiam mais de mil Terras! A mancha vermelha de Júpiter é uma tempestade maior do que a Terra inteira.',
     'Das ist Jupiter, der fünfte Planet und der größte von allen. Mehr als tausend Erden würden in ihn hineinpassen! Der rote Fleck auf Jupiter ist ein Sturm, der größer ist als unsere ganze Erde.'),
  'Пятая — самая большая, в полосках.': ('The fifth one is the biggest, with stripes.', 'O quinto é o maior, às riscas.', 'Der fünfte ist der größte, mit Streifen.'),
  'Сатурн': ('Saturn', 'Saturno', 'Saturn'),
  'Это Сатурн — шестая планета, с красивыми кольцами. Кольца сделаны из кусочков льда и камней. Сатурн такой лёгкий, что в огромной-огромной ванне он бы плавал.':
    ('This is Saturn, the sixth planet, with beautiful rings. The rings are made of bits of ice and rock. Saturn is so light that it would float in a huge, huge bath.',
     'Este é Saturno, o sexto planeta, com uns anéis lindos. Os anéis são feitos de pedacinhos de gelo e de pedra. Saturno é tão leve que flutuaria numa banheira enorme, enorme.',
     'Das ist Saturn, der sechste Planet, mit wunderschönen Ringen. Die Ringe bestehen aus Eis- und Gesteinsbrocken. Saturn ist so leicht, dass er in einer riesig großen Badewanne schwimmen würde.'),
  'Шестая — с кольцами.': ('The sixth one has rings.', 'O sexto tem anéis.', 'Der sechste hat Ringe.'),
  'Уран': ('Uranus', 'Úrano', 'Uranus'),
  'Это Уран — седьмая планета, голубая и очень холодная. Уран лежит на боку и катится вокруг Солнца, как мячик. Один год на Уране длится 84 наших года.':
    ('This is Uranus, the seventh planet, pale blue and very cold. Uranus lies on its side and rolls round the Sun like a ball. One year on Uranus lasts 84 of our years.',
     'Este é Úrano, o sétimo planeta, azul-claro e muito frio. Úrano está deitado de lado e rola à volta do Sol como uma bola. Um ano em Úrano dura 84 dos nossos anos.',
     'Das ist Uranus, der siebte Planet, hellblau und sehr kalt. Uranus liegt auf der Seite und rollt wie ein Ball um die Sonne. Ein Jahr auf Uranus dauert 84 von unseren Jahren.'),
  'Седьмая — голубая, лежит на боку.': ('The seventh one is pale blue and lies on its side.', 'O sétimo é azul-claro e está deitado de lado.', 'Der siebte ist hellblau und liegt auf der Seite.'),
  'Нептун': ('Neptune', 'Neptuno', 'Neptun'),
  'Это Нептун — восьмая планета, дальше всех от Солнца. Он тёмно-синий, и на нём дуют самые сильные ветры. Один оборот вокруг Солнца Нептун делает за 165 наших лет.':
    ('This is Neptune, the eighth planet, the farthest from the Sun. It is dark blue, and the strongest winds of all blow there. Neptune takes 165 of our years to go once round the Sun.',
     'Este é Neptuno, o oitavo planeta, o mais longe do Sol. É azul-escuro e lá sopram os ventos mais fortes de todos. Neptuno demora 165 dos nossos anos a dar uma volta ao Sol.',
     'Das ist Neptun, der achte Planet, am weitesten von der Sonne entfernt. Er ist dunkelblau, und dort wehen die stärksten Winde von allen. Für eine Runde um die Sonne braucht Neptun 165 von unseren Jahren.'),
  'Последняя — тёмно-синяя, дальше всех.': ('The last one is dark blue, the farthest away.', 'O último é azul-escuro, o mais longe de todos.', 'Der letzte ist dunkelblau und am weitesten weg.'),
  'Солнечная система': ('The Solar System', 'O Sistema Solar', 'Das Sonnensystem'),
  '🔍 Планеты': ('🔍 Planets', '🔍 Planetas', '🔍 Planeten'),
  '🌍 День и ночь': ('🌍 Day and night', '🌍 Dia e noite', '🌍 Tag und Nacht'),
  '🌙 Луна': ('🌙 Moon', '🌙 Lua', '🌙 Mond'),
  '🔢 По порядку': ('🔢 In order', '🔢 Por ordem', '🔢 Der Reihe nach'),
  '🏆 Самая большая': ('🏆 The biggest', '🏆 O maior', '🏆 Der größte'),
  'Космос': ('Space', 'Espaço', 'Weltall'),
  '<button class="chip" id="spStories">📖 Истории</button>': ('<button class="chip" id="spStories">📖 Stories</button>', '<button class="chip" id="spStories">📖 Histórias</button>', '<button class="chip" id="spStories">📖 Geschichten</button>'),
  '<h2>👆 Нажми на планету</h2><p>Вокруг Солнца летают восемь планет. Нажми на любую — и узнай, какая она.</p>':
    ('<h2>👆 Tap a planet</h2><p>Eight planets fly round the Sun. Tap any one to find out what it is like.</p>',
     '<h2>👆 Toca num planeta</h2><p>Há oito planetas a voar à volta do Sol. Toca em qualquer um e descobre como é.</p>',
     '<h2>👆 Tippe auf einen Planeten</h2><p>Acht Planeten fliegen um die Sonne. Tippe auf einen und finde heraus, wie er ist.</p>'),
  'Вокруг Солнца летают восемь планет. Нажми на любую и узнай, какая она.': ('Eight planets fly round the Sun. Tap any one to find out what it is like.', 'Há oito planetas a voar à volta do Sol. Toca em qualquer um e descobre como é.', 'Acht Planeten fliegen um die Sonne. Tippe auf einen und finde heraus, wie er ist.'),
  '<h2>{0}{1}</h2><p>{2}</p><button class="link-btn" id="spAgain">🔊 Послушать ещё раз</button>': ('<h2>{0}{1}</h2><p>{2}</p><button class="link-btn" id="spAgain">🔊 Listen again</button>', '<h2>{0}{1}</h2><p>{2}</p><button class="link-btn" id="spAgain">🔊 Ouvir outra vez</button>', '<h2>{0}{1}</h2><p>{2}</p><button class="link-btn" id="spAgain">🔊 Noch einmal hören</button>'),
  'Ты облетела всю Солнечную систему: Солнце и восемь планет! Теперь поставь планеты по порядку.': ('You have flown round the whole Solar System: the Sun and eight planets! Now put the planets in order.', 'Voaste por todo o Sistema Solar: o Sol e oito planetas! Agora põe os planetas por ordem.', 'Du bist durch das ganze Sonnensystem geflogen: die Sonne und acht Planeten! Jetzt bring die Planeten in die richtige Reihenfolge.'),
  'Ты облетел всю Солнечную систему: Солнце и восемь планет! Теперь поставь планеты по порядку.': ('You have flown round the whole Solar System: the Sun and eight planets! Now put the planets in order.', 'Voaste por todo o Sistema Solar: o Sol e oito planetas! Agora põe os planetas por ordem.', 'Du bist durch das ganze Sonnensystem geflogen: die Sonne und acht Planeten! Jetzt bring die Planeten in die richtige Reihenfolge.'),
  'Земля крутится': ('The Earth turns', 'A Terra gira', 'Die Erde dreht sich'),
  '☀️ У домика день': ('☀️ It is day at the little house', '☀️ Na casinha é dia', '☀️ Beim Häuschen ist Tag'),
  'Домик смотрит на Солнце — там светло и день.': ('The little house faces the Sun, so it is light there: daytime.', 'A casinha está virada para o Sol: lá está claro, é dia.', 'Das Häuschen schaut zur Sonne: Dort ist es hell und Tag.'),
  '🌙 У домика ночь': ('🌙 It is night at the little house', '🌙 Na casinha é noite', '🌙 Beim Häuschen ist Nacht'),
  'Домик отвернулся от Солнца — там темно и ночь.': ('The little house has turned away from the Sun, so it is dark there: night-time.', 'A casinha virou-se de costas para o Sol: lá está escuro, é noite.', 'Das Häuschen hat sich von der Sonne weggedreht: Dort ist es dunkel und Nacht.'),
  '<h2>{0}</h2><p>{1} Земля крутится, как волчок. Один оборот — это сутки, 24 часа.</p>': ('<h2>{0}</h2><p>{1} The Earth spins like a top. One turn is one day: 24 hours.</p>', '<h2>{0}</h2><p>{1} A Terra gira como um pião. Uma volta é um dia inteiro: 24 horas.</p>', '<h2>{0}</h2><p>{1} Die Erde dreht sich wie ein Kreisel. Eine Drehung ist ein ganzer Tag: 24 Stunden.</p>'),
  'Земля всё время крутится. Та сторона, что смотрит на Солнце, — день, а другая — ночь. Следи за домиком!': ('The Earth is always turning. The side that faces the Sun has day, and the other side has night. Watch the little house!', 'A Terra está sempre a girar. O lado virado para o Sol tem dia e o outro tem noite. Olha para a casinha!', 'Die Erde dreht sich immer. Auf der Seite, die zur Sonne schaut, ist Tag, auf der anderen Nacht. Pass auf das Häuschen auf!'),
  'Новолуние': ('New Moon', 'Lua nova', 'Neumond'),
  'Луна между Землёй и Солнцем, и к нам повёрнута её тёмная сторона. Луну почти не видно.': ('The Moon is between the Earth and the Sun, and its dark side faces us. We can hardly see the Moon.', 'A Lua está entre a Terra e o Sol, e o seu lado escuro está virado para nós. Quase não se vê a Lua.', 'Der Mond steht zwischen Erde und Sonne, und seine dunkle Seite zeigt zu uns. Man sieht den Mond fast gar nicht.'),
  'Молодой месяц': ('A young crescent', 'Lua nova a crescer', 'Junge Mondsichel'),
  'Появился тонкий серп. Приставь к нему палочку — получится буква «Р»: Луна растёт.': ('A thin crescent has appeared. Put a little stick in front of it and you get the letter “D”: the Moon is growing.', 'Apareceu um fino crescente. Junta-lhe um pauzinho e fica a letra «D»: a Lua está a crescer, mas parece dizer «decrescente». A Lua é mentirosa!', 'Eine dünne Sichel ist erschienen. Setz einen Strich davor, dann wird daraus ein „D“: Der Mond wächst.'),
  'Первая четверть': ('First quarter', 'Quarto crescente', 'Erstes Viertel'),
  'Освещена правая половина Луны. С новолуния прошла примерно неделя.': ('The right half of the Moon is lit up. About a week has passed since the New Moon.', 'A metade direita da Lua está iluminada. Passou mais ou menos uma semana desde a Lua nova.', 'Die rechte Hälfte des Mondes ist beleuchtet. Seit dem Neumond ist etwa eine Woche vergangen.'),
  'Луна растёт': ('The Moon is growing', 'A Lua está a crescer', 'Der Mond wächst'),
  'Светлая часть становится всё больше. Скоро полнолуние!': ('The bright part is getting bigger and bigger. Soon it will be Full Moon!', 'A parte clara está cada vez maior. Em breve é Lua cheia!', 'Der helle Teil wird immer größer. Bald ist Vollmond!'),
  'Полнолуние': ('Full Moon', 'Lua cheia', 'Vollmond'),
  'Земля между Солнцем и Луной, и Луна светит нам вся, как круглый фонарь.': ('The Earth is between the Sun and the Moon, and the whole Moon shines at us like a round lantern.', 'A Terra está entre o Sol e a Lua, e a Lua brilha toda para nós, como uma lanterna redonda.', 'Die Erde steht zwischen Sonne und Mond, und der ganze Mond leuchtet uns wie eine runde Laterne.'),
  'Луна убывает': ('The Moon is shrinking', 'A Lua está a minguar', 'Der Mond nimmt ab'),
  'Светлая часть становится меньше, тень наползает справа.': ('The bright part is getting smaller, and the shadow creeps in from the right.', 'A parte clara fica mais pequena e a sombra avança pela direita.', 'Der helle Teil wird kleiner, und der Schatten kriecht von rechts herein.'),
  'Последняя четверть': ('Last quarter', 'Quarto minguante', 'Letztes Viertel'),
  'Освещена левая половина Луны. Ещё неделя — и снова новолуние.': ('The left half of the Moon is lit up. One more week and it will be New Moon again.', 'A metade esquerda da Lua está iluminada. Mais uma semana e volta a ser Lua nova.', 'Die linke Hälfte des Mondes ist beleuchtet. Noch eine Woche, dann ist wieder Neumond.'),
  'Старый месяц': ('An old crescent', 'Lua velha', 'Alte Mondsichel'),
  'Серп похож на букву «С» — значит, Луна стареет. Скоро она совсем спрячется.': ('The crescent looks like the letter “C”: the Moon is getting old. Soon it will hide completely.', 'O crescente parece a letra «C», mas a Lua está a minguar: a Lua é mentirosa! Em breve vai esconder-se de todo.', 'Die Sichel sieht aus wie ein „C“: Der Mond wird alt. Bald versteckt er sich ganz.'),
  'Луна': ('The Moon', 'A Lua', 'Der Mond'),
  'Луна сама не светит: её освещает Солнце. Луна облетает Землю примерно за месяц, и мы видим её по-разному. Нажимай «Дальше».': ('The Moon does not shine by itself: the Sun lights it up. The Moon goes round the Earth in about a month, and we see it differently each night. Tap “Next”.', 'A Lua não brilha sozinha: é o Sol que a ilumina. A Lua dá a volta à Terra em cerca de um mês, e vemo-la de maneiras diferentes. Carrega em «Seguinte».', 'Der Mond leuchtet nicht selbst: Die Sonne beleuchtet ihn. Der Mond kreist in etwa einem Monat um die Erde, und wir sehen ihn immer anders. Tippe auf „Weiter“.'),
  'Луна прошла полный круг: от новолуния до полнолуния и обратно. Это около месяца!': ('The Moon has gone all the way round: from New Moon to Full Moon and back again. That takes about a month!', 'A Lua deu uma volta completa: da Lua nova à Lua cheia e outra vez de volta. Isso demora cerca de um mês!', 'Der Mond hat eine ganze Runde gemacht: vom Neumond zum Vollmond und zurück. Das dauert etwa einen Monat!'),
  '<h2>🔢 Какая планета {0}-я от Солнца?</h2><p>{1}</p>': ('<h2>🔢 Which planet is number {0} from the Sun?</h2><p>{1}</p>', '<h2>🔢 Qual é o planeta número {0} a contar do Sol?</h2><p>{1}</p>', '<h2>🔢 Welcher Planet ist Nummer {0} von der Sonne aus?</h2><p>{1}</p>'),
  'Поставь планеты по порядку, начиная от Солнца. Какая планета первая?': ('Put the planets in order, starting from the Sun. Which planet comes first?', 'Põe os planetas por ordem, a começar pelo Sol. Qual é o primeiro planeta?', 'Bring die Planeten in die richtige Reihenfolge, von der Sonne aus. Welcher Planet ist der erste?'),
  'Все восемь планет на месте!': ('All eight planets are in their places!', 'Os oito planetas estão no seu lugar!', 'Alle acht Planeten sind an ihrem Platz!'),
  'Меркурий, Венера, Земля, Марс, Юпитер, Сатурн, Уран, Нептун — все планеты на своих местах!': ('Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune: every planet is in its place!', 'Mercúrio, Vénus, Terra, Marte, Júpiter, Saturno, Úrano, Neptuno: todos os planetas estão no seu lugar!', 'Merkur, Venus, Erde, Mars, Jupiter, Saturn, Uranus, Neptun: Alle Planeten sind an ihrem Platz!'),
  '{0}! А какая следующая?': ('{0}! And which one comes next?', '{0}! E qual é o seguinte?', '{0}! Und welcher kommt als Nächstes?'),
  'Нет, это {0}. {1}': ('No, that is {0}. {1}', 'Não, esse é {0}. {1}', 'Nein, das ist {0}. {1}'),
  'Какая из них самая маленькая?': ('Which of them is the smallest?', 'Qual deles é o mais pequeno?', 'Welcher von ihnen ist der kleinste?'),
  'Какая из них самая большая?': ('Which of them is the biggest?', 'Qual deles é o maior?', 'Welcher von ihnen ist der größte?'),
  '<h2>{0} {1}</h2><p>Здесь они нарисованы одинаковыми. Вспомни, какие они на самом деле!</p>': ('<h2>{0} {1}</h2><p>Here they are drawn the same size. Remember what they are really like!</p>', '<h2>{0} {1}</h2><p>Aqui estão desenhados do mesmo tamanho. Lembra-te de como são na realidade!</p>', '<h2>{0} {1}</h2><p>Hier sind sie gleich groß gemalt. Erinnere dich, wie groß sie wirklich sind!</p>'),
  'Посмотри, где мигает!': ('Look where it is blinking!', 'Olha onde está a piscar!', 'Schau, wo es blinkt!'),
  'Нет, подумай ещё!': ('No, think again!', 'Não, pensa outra vez!', 'Nein, denk noch einmal nach!'),
  'Самая маленькая тут — {0}.': ('The smallest one here is {0}.', 'O mais pequeno aqui é {0}.', 'Der kleinste hier ist {0}.'),
  'Самая большая тут — {0}.': ('The biggest one here is {0}.', 'O maior aqui é {0}.', 'Der größte hier ist {0}.'),
  'Теперь они нарисованы по-настоящему.': ('Now they are drawn at their real sizes.', 'Agora estão desenhados com o tamanho verdadeiro.', 'Jetzt sind sie in ihrer echten Größe gemalt.'),
  'Ты знаешь, какие планеты большие, а какие маленькие! Самый большой — Юпитер, самый маленький — Меркурий.': ('You know which planets are big and which are small! The biggest is Jupiter, the smallest is Mercury.', 'Já sabes que planetas são grandes e quais são pequenos! O maior é Júpiter e o mais pequeno é Mercúrio.', 'Du weißt, welche Planeten groß und welche klein sind! Der größte ist Jupiter, der kleinste ist Merkur.'),
  'Солнце, планеты, Луна, день и ночь': ('the Sun, the planets, the Moon, day and night', 'o Sol, os planetas, a Lua, o dia e a noite', 'Sonne, Planeten, Mond, Tag und Nacht'),
  'планеты солнце луна звёзды гагарин ракета астроном': ('planets sun moon stars gagarin rocket astronomer', 'planetas sol lua estrelas gagarin foguetão astrónomo', 'Planeten Sonne Mond Sterne Gagarin Rakete Astronom'),
  'Гагарин, Луна, звёзды и телескопы': ('Gagarin, the Moon, stars and telescopes', 'Gagarin, a Lua, as estrelas e os telescópios', 'Gagarin, der Mond, Sterne und Teleskope'),
  '🔄 Покрутить Землю': ('🔄 Spin the Earth', '🔄 Girar a Terra', '🔄 Die Erde drehen'),
  'Дальше ▶': ('Next ▶', 'Seguinte ▶', 'Weiter ▶'),
}
# the two long SVG templates: only their button text is Russian
def tpl(s):
    for ru, tr in [('🔄 Покрутить Землю', W['🔄 Покрутить Землю']), ('Дальше ▶', W['Дальше ▶'])]:
        if ru in s: return tuple(s.replace(ru, x) for x in tr)
CYR = re.compile('[А-Яа-яЁё]'); n = 0
# every string already translated elsewhere (the story sections' names) is reused
known = {}
for g, d in fixed.items():
    for k, v in d.items(): known.setdefault(k, list(v) + [None])
for g, d in fde.items():
    for k, v in d.items():
        if k in known and known[k][2] is None: known[k][2] = v
for g, keys in miss.items():
    if g in ('GAMES', 'LEARN_IMG', 'SND_HI'): continue
    for k in keys:
        tr = W.get(k) or tpl(k) or (tuple(known[k]) if k in known and known[k][2] else None)
        assert tr, k
        assert not any(CYR.search(x) for x in tr), k
        fixed.setdefault(g, {})[k] = list(tr[:2]); fde.setdefault(g, {})[k] = tr[2]; n += 1
json.dump(fixed, open(H + '/fixed.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
json.dump(fde, open(H + '/de/fixed_de.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('ok', n)
