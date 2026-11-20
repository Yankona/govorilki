# langs-games: «Хлопни слоги», «Слоги потерялись», «Один — много», «Что лишнее?» (XLG), «Нужные фразы» (PHR),
# «Кому как сказать?» and «Где на каком языке» (WORLD) on the English, Portuguese and German pages.
# Short strings are whole; long HTML templates are translated piece by piece (FRAG), the markup stays as it is.
import json, os, re
H = os.path.dirname(os.path.abspath(__file__))
fixed = json.load(open(H + '/fixed.json', encoding='utf-8')); fde = json.load(open(H + '/de/fixed_de.json', encoding='utf-8'))
miss = json.load(open(H + '/out-en.html.missing.json', encoding='utf-8'))
W = {
  # XLG
  'Я сказала!': ('I said it!', 'Já disse!', 'Ich habe es gesagt!'), 'Я сказал!': ('I said it!', 'Já disse!', 'Ich habe es gesagt!'),
  'слог': ('syllable', 'sílaba', 'Silbe'), 'слога': ('syllables', 'sílabas', 'Silben'), 'слогов': ('syllables', 'sílabas', 'Silben'),
  'Хлопни слоги': ('Clap the syllables', 'Bate as sílabas', 'Silben klatschen'),
  'Я скажу слово. Хлопни по барабану на каждый слог: {0} — три хлопка. Потом нажми «Готово».': (
    'I will say a word. Tap the drum for every syllable: {0} — three claps. Then tap «Done».',
    'Eu digo uma palavra. Bate no tambor em cada sílaba: {0} — três palmas. Depois carrega em «Pronto».',
    'Ich sage ein Wort. Klopf auf die Trommel für jede Silbe: {0} — dreimal klatschen. Dann drück auf «Fertig».'),
  'Послушай по слогам: {0}. Хлопай вместе со мной.': ('Listen to the syllables: {0}. Clap with me.', 'Ouve as sílabas: {0}. Bate palmas comigo.', 'Hör die Silben: {0}. Klatsch mit mir.'),
  'Да! {0}: {1} {2}.': ('Yes! {0}: {1} {2}.', 'Sim! {0}: {1} {2}.', 'Ja! {0}: {1} {2}.'),
  'Ты слышишь слоги!': ('You can hear syllables!', 'Tu ouves as sílabas!', 'Du hörst die Silben!'),
  'Слоги потерялись': ('Lost syllables', 'Sílabas perdidas', 'Verlorene Silben'),
  'Собери слово из слогов': ('Build the word from its syllables', 'Junta a palavra com as sílabas', 'Bau das Wort aus Silben'),
  'Какой слог потерялся?': ('Which syllable is lost?', 'Que sílaba se perdeu?', 'Welche Silbe fehlt?'),
  'Послушай слово. Один слог потерялся — найди его.': ('Listen to the word. One syllable is lost — find it.', 'Ouve a palavra. Perdeu-se uma sílaba — encontra-a.', 'Hör dir das Wort an. Eine Silbe fehlt — finde sie.'),
  'А теперь собери слово из слогов по порядку.': ('Now build the word from its syllables, in order.', 'Agora junta a palavra com as sílabas, por ordem.', 'Jetzt bau das Wort aus den Silben, der Reihe nach.'),
  'Все слоги нашлись!': ('All the syllables are found!', 'Encontraste todas as sílabas!', 'Alle Silben sind gefunden!'),
  'Один — много': ('One and lots', 'Um e muitos', 'Einer und viele'),
  '{0}{1}. А если их много? Как сказать: {2} или {3}?': ('{0}{1}. And if there are lots? How do we say it: {2} or {3}?', '{0}{1}. E se forem muitos? Como se diz: {2} ou {3}?', '{0}{1}. Und wenn es viele sind? Wie sagt man: {2} oder {3}?'),
  'Один и много. ': ('One and lots. ', 'Um e muitos. ', 'Einer und viele. '),
  'Послушай, как звучит: {0}. Так не говорят. Выбери ещё раз.': ('Listen to how it sounds: {0}. We don\'t say that. Choose again.', 'Ouve como soa: {0}. Assim não se diz. Escolhe outra vez.', 'Hör mal, wie das klingt: {0}. So sagt man das nicht. Wähl noch einmal.'),
  '{0}! Скажи: {1}.': ('{0}! Say it: {1}.', '{0}! Diz: {1}.', '{0}! Sag: {1}.'),
  'Ты знаешь, как сказать «много»!': ('You know how to say «lots»!', 'Sabes dizer «muitos»!', 'Du weißt, wie man «viele» sagt!'),
  'Что лишнее?': ('Odd one out', 'Qual é o intruso?', 'Was passt nicht?'),
  'Три картинки похожи, одна лишняя. Найди лишнюю.': ('Three pictures go together, one does not. Find the odd one out.', 'Três imagens são parecidas, uma não pertence. Encontra o intruso.', 'Drei Bilder passen zusammen, eins passt nicht. Finde es.'),
  'Какая лишняя?': ('Which is the odd one out?', 'Qual é o intruso?', 'Was passt nicht?'),
  'Подумай: какая картинка не такая, как другие?': ('Think: which picture is not like the others?', 'Pensa: que imagem é diferente das outras?', 'Überleg mal: Welches Bild ist anders als die anderen?'),
  '{0} — это {1}. А остальные — {2}. Скажи одним словом: {3}.': ('{0}? That is {1}. The others are {2}. Say it in one word: {3}.', '{0}? Isso é {1}. Os outros são {2}. Diz numa palavra: {3}.', '{0}? Das ist {1}. Die anderen sind {2}. Sag es mit einem Wort: {3}.'),
  'Ты умеешь называть одним словом!': ('You can name things in one word!', 'Sabes dizer numa só palavra!', 'Du kannst es mit einem Wort sagen!'),
  'сколько слогов в слове?': ('how many syllables in a word?', 'quantas sílabas tem a palavra?', 'wie viele Silben hat das Wort?'),
  'найди слог и собери слово': ('find the syllable, build the word', 'encontra a sílaba e junta a palavra', 'finde die Silbe, bau das Wort'),
  'один кот, много котов': ('a mouse, lots of mice', 'o pão, os pães', 'der Apfel, die Äpfel'),
  'и назови одним словом': ('and name the group in one word', 'e diz o grupo numa palavra', 'und nenne die Gruppe mit einem Wort'),
  '{0} {1} или {2}?': ('{0} {1} or {2}?', '{0} {1} ou {2}?', '{0} {1} oder {2}?'),
  '{0}{1}. А если их много? Как сказать:': ('{0}{1}. And if there are lots? How do we say it:', '{0}{1}. E se forem muitos? Como se diz:', '{0}{1}. Und wenn es viele sind? Wie sagt man:'),
  'Назови ласково': ('Little ones', 'Diz com carinho', 'Klein und lieb'),
  'Ты умеешь говорить ласково!': ('You know the little words!', 'Sabes dizer com carinho!', 'Du kennst die kleinen Wörter!'),
  '{0}Это {1}. А маленький, ласково — как сказать:': ('{0}This is {1}. And a little one — how do we say it:', '{0}É {1}. E pequenino, com carinho — como se diz:', '{0}Das ist {1}. Und ganz klein — wie sagt man:'),
  'Назовём ласково, когда он маленький. ': ("Let's say the little word for a little one. ", 'Vamos dizer com carinho, quando é pequenino. ', 'Wir sagen es lieb, wenn es klein ist. '),
  'Чей хвост?': ('Whose tail?', 'De quem é a cauda?', 'Wessen Schwanz?'),
  'Ты знаешь, чей хвост и чья лапа!': ('You know whose tail and whose paw!', 'Sabes de quem é a cauda e a pata!', 'Du weißt, wessen Schwanz und wessen Pfote!'),
  'мяч — мячик, дом — домик': ('dog — doggy, pig — piglet', 'gato — gatinho, pão — pãozinho', 'Hund — Hündchen, Haus — Häuschen'),
  'лисий, волчий, заячьи уши': ("the fox's tail, the bear's paw", 'a cauda da raposa, a pata do urso', 'Fuchsschwanz, Hasenohren'),
  # PHR
  '✍️ Мои фразы': ('✍️ My phrases', '✍️ As minhas frases', '✍️ Meine Sätze'),
  '🏫 В садике и школе': ('🏫 At nursery and school', '🏫 No jardim de infância e na escola', '🏫 In der Kita und in der Schule'),
  '🤒 Самочувствие': ('🤒 How I feel', '🤒 Como me sinto', '🤒 Wie es mir geht'),
  '🧸 Игра и друзья': ('🧸 Play and friends', '🧸 Brincar e amigos', '🧸 Spielen und Freunde'),
  '🍽️ За столом': ('🍽️ At the table', '🍽️ À mesa', '🍽️ Am Tisch'),
  'Вера': ('Vera', 'Vera', 'Vera'),
  'Нужные фразы': ('Useful phrases', 'Frases úteis', 'Wichtige Sätze'),
  '🎯 Тренировка: {0}': ('🎯 Practice: {0}', '🎯 Treino: {0}', '🎯 Üben: {0}'),
  '🎯 На сегодня всё выучено': ('🎯 All learnt for today', '🎯 Tudo aprendido por hoje', '🎯 Für heute alles gelernt'),
  '<i>нет перевода</i>': ('<i>no translation</i>', '<i>sem tradução</i>', '<i>keine Übersetzung</i>'),
  'Нужные фразы. На сегодня {0} {1}.': ('Useful phrases. {0} {1} for today.', 'Frases úteis. Para hoje: {0} {1}.', 'Wichtige Sätze. Heute: {0} {1}.'),
  'фраза': ('phrase', 'frase', 'Satz'), 'фразы': ('phrases', 'frases', 'Sätze'), 'фраз': ('phrases', 'frases', 'Sätze'),
  'Нужные фразы.': ('Useful phrases.', 'Frases úteis.', 'Wichtige Sätze.'),
  'Изменить фразу': ('Change the phrase', 'Mudar a frase', 'Satz ändern'),
  'Записать фразу': ('Write a phrase', 'Escrever uma frase', 'Satz aufschreiben'),
  'ребёнок': ('your child', 'a criança', 'Ihr Kind'),
  'а': ('', '', ''), 'е': ('', '', ''),
  '<button class="big ghost" id="phD">🗑 Удалить</button>': ('<button class="big ghost" id="phD">🗑 Delete</button>', '<button class="big ghost" id="phD">🗑 Apagar</button>', '<button class="big ghost" id="phD">🗑 Löschen</button>'),
  'Как это сказать? Попробуй вслух, потом нажми кнопку.': ('How do you say this? Try it out loud, then tap the button.', 'Como se diz isto? Experimenta em voz alta e depois carrega no botão.', 'Wie sagt man das? Probier es laut, dann drück den Knopf.'),
  'А это как сказать?': ('And how do you say this?', 'E isto, como se diz?', 'Und wie sagt man das?'),
  '<button class="big" data-r="1">✓ Сказал': ('<button class="big" data-r="1">✓ I said it', '<button class="big" data-r="1">✓ Disse', '<button class="big" data-r="1">✓ Ich habe es'),
  ' так же</button><button class="big ghost" data-r="0">↺ Ещё поучу</button><button class="chip" id="phSay">🔊</button>': (
    ' the same way</button><button class="big ghost" data-r="0">↺ I\'ll practise more</button><button class="chip" id="phSay">🔊</button>',
    ' igual</button><button class="big ghost" data-r="0">↺ Vou treinar mais</button><button class="chip" id="phSay">🔊</button>',
    ' genauso gesagt</button><button class="big ghost" data-r="0">↺ Ich übe noch</button><button class="chip" id="phSay">🔊</button>'),
  'Знаю {0} из {1}. Остальные вернутся завтра.': ('I know {0} of {1}. The others come back tomorrow.', 'Sei {0} de {1}. As outras voltam amanhã.', 'Ich kann {0} von {1}. Die anderen kommen morgen wieder.'),
  'как сказать в садике и в школе': ('what to say at nursery and school', 'o que dizer no jardim de infância e na escola', 'was man in der Kita und Schule sagt'),
  'на сегодня {0}': ('{0} for today', 'para hoje: {0}', 'heute: {0}'),
  # WORLD
  'Дома': ('At home', 'Em casa', 'Zu Hause'), 'дома': ('home', 'casa', 'Zuhause'),
  'С бабушкой и дедушкой': ('With Granny and Grandad', 'Com os avós', 'Mit Oma und Opa'), 'бабушка': ('granny', 'avó', 'Oma'),
  'В школе или садике': ('At school or nursery', 'Na escola ou no jardim de infância', 'In der Schule oder Kita'), 'школа': ('school', 'escola', 'Schule'),
  'С друзьями': ('With friends', 'Com os amigos', 'Mit Freunden'), 'друзья': ('friends', 'amigos', 'Freunde'),
  'На улице, в магазине, в кафе': ('Outside, in shops, in cafés', 'Na rua, na loja, no café', 'Draußen, im Laden, im Café'), 'улица': ('outside', 'rua', 'draußen'),
  'Мама': ('Mum', 'Mãe', 'Mama'), 'маме': ('Mum', 'à mãe', 'zu Mama'), 'с мамой': ('with Mum', 'com a mãe', 'mit Mama'),
  'Бабушка': ('Granny', 'Avó', 'Oma'), 'бабушке': ('Granny', 'à avó', 'zu Oma'), 'с бабушкой': ('with Granny', 'com a avó', 'mit Oma'),
  'Учительница': ('Teacher', 'Professora', 'Lehrerin'), 'учительнице': ('your teacher', 'à professora', 'zur Lehrerin'), 'с учительницей': ('with your teacher', 'com a professora', 'mit der Lehrerin'),
  'Друг': ('Friend', 'Amigo', 'Freund'), 'другу': ('your friend', 'ao amigo', 'zu deinem Freund'), 'с другом': ('with your friend', 'com o amigo', 'mit deinem Freund'),
  'Продавец в кафе': ('Café waiter', 'Empregado do café', 'Kellner im Café'), 'продавцу в кафе': ('the café waiter', 'ao empregado do café', 'zum Kellner im Café'), 'в кафе': ('in the café', 'no café', 'im Café'),
  'по-русски': ('Russian', 'russo', 'Russisch'), 'по-украински': ('Ukrainian', 'ucraniano', 'Ukrainisch'), 'по-португальски': ('Portuguese', 'português', 'Portugiesisch'),
  'по-английски': ('English', 'inglês', 'Englisch'), 'по-немецки': ('German', 'alemão', 'Deutsch'), 'по-испански': ('Spanish', 'espanhol', 'Spanisch'),
  'по-французски': ('French', 'francês', 'Französisch'), 'по-итальянски': ('Italian', 'italiano', 'Italienisch'), 'на иврите': ('Hebrew', 'hebraico', 'Hebräisch'),
  'по-турецки': ('Turkish', 'turco', 'Türkisch'), 'по-китайски': ('Chinese', 'chinês', 'Chinesisch'),
  ' и ': (' and ', ' e ', ' und '),
  '🙋 Играть: «Кому как сказать?»': ('🙋 Play: «Who do I say it to?»', '🙋 Jogar: «Como digo a quem?»', '🙋 Spielen: «Wem sage ich was?»'),
  'Готово': ('Done', 'Pronto', 'Fertig'),
  'Где на каком языке': ('Which language where', 'Que língua e onde', 'Welche Sprache wo'),
  'она': ('she', 'ela', 'sie'), 'он': ('he', 'ele', 'er'),
  'Дома должен остаться хотя бы один язык.': ('Home needs at least one language.', 'Em casa tem de ficar pelo menos uma língua.', 'Zu Hause muss mindestens eine Sprache bleiben.'),
  'Где ты говоришь на каком языке? Нажми на флажки вместе со взрослым.': ('Where do you speak which language? Tap the flags with a grown-up.', 'Onde falas cada língua? Carrega nas bandeiras com um adulto.', 'Wo sprichst du welche Sprache? Tipp mit einem Erwachsenen auf die Fahnen.'),
  'Всем': ('Everyone', 'Todos', 'Alle'),
  'Свои фразы': ('Our own phrases', 'As nossas frases', 'Eigene Sätze'),
  '<p class="muted">С этим человеком ты говоришь по-русски: перевод не нужен.</p>': ('<p class="muted">You speak English with this person: no translation needed.</p>', '<p class="muted">Com esta pessoa falas português: não é preciso tradução.</p>', '<p class="muted">Mit dieser Person sprichst du Deutsch: keine Übersetzung nötig.</p>'),
  '<p class="muted">Пока своих фраз нет.</p>': ('<p class="muted">No phrases of your own yet.</p>', '<p class="muted">Ainda não há frases vossas.</p>', '<p class="muted">Noch keine eigenen Sätze.</p>'),
  'Напишите, что сказать.': ('Write what to say.', 'Escreva o que dizer.', 'Schreiben Sie, was gesagt werden soll.'),
  'Напишите, как это сказать хотя бы на одном языке.': ('Write how to say it in at least one language.', 'Escreva como se diz em pelo menos uma língua.', 'Schreiben Sie, wie man es in mindestens einer Sprache sagt.'),
  'Фраза добавлена. Она будет в «Кому как сказать?» и в «Нужных фразах».': ('Phrase added. It will be in «Who do I say it to?» and in «Useful phrases».', 'Frase adicionada. Vai aparecer em «Como digo a quem?» e em «Frases úteis».', 'Satz hinzugefügt. Er kommt in «Wem sage ich was?» und in «Wichtige Sätze».'),
  'Здесь можно добавить свои фразы. Выберите, кому их говорить, и напишите перевод.': ('Here you can add your own phrases. Choose who they are for and write the translation.', 'Aqui pode adicionar as vossas frases. Escolha a quem se dizem e escreva a tradução.', 'Hier können Sie eigene Sätze hinzufügen. Wählen Sie, wem man sie sagt, und schreiben Sie die Übersetzung.'),
  'Верный язык с первого раза: {0} из {1}.{2}': ('The right language first time: {0} of {1}.{2}', 'Língua certa à primeira: {0} de {1}.{2}', 'Gleich die richtige Sprache: {0} von {1}.{2}'),
  ' Сказано понятно: {0}.': (' Said clearly: {0}.', ' Dito com clareza: {0}.', ' Deutlich gesagt: {0}.'),
  'Кому как сказать?': ('Who do I say it to?', 'Como digo a quem?', 'Wem sage ich was?'),
  'Скажи {0}: {1} На каком языке?': ('Say it to {0}: {1} Which language?', 'Diz {0}: {1} Em que língua?', 'Sag {0}: {1} In welcher Sprache?'),
  '{0} ты говоришь {1}. Попробуй ещё.': ('{0} you speak {1}. Try again.', '{0} falas {1}. Tenta outra vez.', '{0} sprichst du {1}. Versuch es noch mal.'),
  'Теперь скажи сам{0}.': ('Now you say it.', 'Agora diz tu.', 'Jetzt sag du es.'),
  '<button class="big" id="wrMic">🎤 Сказать</button>': ('<button class="big" id="wrMic">🎤 Say it</button>', '<button class="big" id="wrMic">🎤 Dizer</button>', '<button class="big" id="wrMic">🎤 Sagen</button>'),
  'Дальше →': ('Next →', 'Seguinte →', 'Weiter →'),
  'Сказала': ('I said it', 'Disse', 'Gesagt'), 'Сказал': ('I said it', 'Disse', 'Gesagt'),
  '👂 Слушаю…': ('👂 Listening…', '👂 A ouvir…', '👂 Ich höre zu…'),
  '🎤 Ещё раз': ('🎤 Again', '🎤 Outra vez', '🎤 Noch mal'),
  '<p>На этом языке телефон пока не слушает. Скажи вслух и нажми «Дальше».</p>': ('<p>This phone can\'t listen in this language yet. Say it out loud and tap «Next».</p>', '<p>Este telemóvel ainda não ouve nesta língua. Diz em voz alta e carrega em «Seguinte».</p>', '<p>Dieses Handy hört in dieser Sprache noch nicht zu. Sag es laut und drück auf «Weiter».</p>'),
  '<small>Слышу: «{0}»</small>': ('<small>I hear: «{0}»</small>', '<small>Ouço: «{0}»</small>', '<small>Ich höre: «{0}»</small>'),
  'Отлично, всё понятно!': ('Great, I understood it all!', 'Ótimo, percebi tudo!', 'Super, alles verstanden!'),
  'Здорово, так и говорят!': ('Brilliant, that\'s just how people say it!', 'Boa, é mesmo assim que se diz!', 'Toll, genau so sagt man das!'),
  'Молодец, очень понятно!': ('Well done, very clear!', 'Muito bem, muito claro!', 'Gut gemacht, sehr deutlich!'),
  'Ничего не слышно. Нажми «Ещё раз» и скажи погромче.': ('I can\'t hear anything. Tap «Again» and say it louder.', 'Não se ouve nada. Carrega em «Outra vez» e diz mais alto.', 'Ich höre nichts. Drück auf «Noch mal» und sag es lauter.'),
  'Почти! Послушай {0}.': ('Almost! Listen to {0}.', 'Quase! Ouve {0}.', 'Fast! Hör dir {0} an.'),
  'эти слова': ('these words', 'estas palavras', 'diese Wörter'), 'это слово': ('this word', 'esta palavra', 'dieses Wort'),
  'Послушай ещё раз, медленно.': ('Listen again, slowly.', 'Ouve outra vez, devagar.', 'Hör noch einmal, langsam.'),
  'Теперь ещё раз!': ('Now once more!', 'Agora outra vez!', 'Jetzt noch einmal!'),
  'Хорошо! Потренируем эту фразу в другой раз.': ('Good! We\'ll practise this phrase another time.', 'Boa! Treinamos esta frase noutra altura.', 'Gut! Diesen Satz üben wir ein andermal.'),
  'где на каком языке, кому как сказать и как звучит каждый твой язык': ('which language where, who to say what to, and how each of your languages sounds', 'que língua e onde, como dizer a quem e como soa cada uma das tuas línguas', 'welche Sprache wo, wem man was sagt und wie jede deiner Sprachen klingt'),
  'маме, учительнице, другу — на своём языке': ('to Mum, your teacher, a friend — each in their language', 'à mãe, à professora, a um amigo — na língua de cada um', 'Mama, der Lehrerin, einem Freund — in ihrer Sprache'),
}
# pieces of the long templates (the longest first)
FRAG = {
  '🔊 Послушать слово': ('🔊 Hear the word', '🔊 Ouvir a palavra', '🔊 Wort anhören'), 'aria-label="Хлопок"': ('aria-label="Clap"', 'aria-label="Palma"', 'aria-label="Klatschen"'),
  '↺ Заново': ('↺ Start again', '↺ Recomeçar', '↺ Nochmal'), '>Готово<': ('>Done<', '>Pronto<', '>Fertig<'),
  'Какая картинка лишняя?': ('Which picture is the odd one out?', 'Qual é a imagem intrusa?', 'Welches Bild passt nicht?'),
  'Добавьте ребёнку язык, который он учит: «Для взрослых» → профиль → языки.': ('Add a language your child is learning: «For grown-ups» → profile → languages.', 'Adicione uma língua que a criança aprende: «Para adultos» → perfil → línguas.', 'Fügen Sie eine Sprache hinzu, die Ihr Kind lernt: «Für Erwachsene» → Profil → Sprachen.'),
  'Фразы, которые нужны каждый день. Не получилось что-то сказать — запишите фразу, и она попадёт в тренировку.': ('Phrases needed every day. If your child could not say something today, write the phrase down and it goes into the practice.', 'Frases precisas todos os dias. Se hoje a criança não conseguiu dizer alguma coisa, escreva a frase e ela entra no treino.', 'Sätze, die man jeden Tag braucht. Konnte Ihr Kind heute etwas nicht sagen, schreiben Sie den Satz auf: Er kommt ins Üben.'),
  '＋ Записать фразу': ('＋ Write a phrase', '＋ Escrever uma frase', '＋ Satz aufschreiben'), 'aria-label="Учить"': ('aria-label="Learn"', 'aria-label="Aprender"', 'aria-label="Lernen"'),
  'Что {0} хотел{1} сказать?': ('What did {0} want to say?', 'O que queria dizer {0}?', 'Was wollte {0} sagen?'),
  'placeholder="Например: можно мне ещё бумаги?"': ('placeholder="For example: can I have more paper?"', 'placeholder="Por exemplo: posso ter mais papel?"', 'placeholder="Zum Beispiel: Kann ich noch Papier haben?"'),
  'Ссылка открывает Google Переводчик с этой фразой: фраза уходит в Google. Проверьте перевод с тем, кто говорит на языке.': ('The link opens Google Translate with this phrase: the phrase goes to Google. Check the translation with someone who speaks the language.', 'A ligação abre o Google Tradutor com esta frase: a frase vai para a Google. Confirme a tradução com quem fala a língua.', 'Der Link öffnet den Google Übersetzer mit diesem Satz: Der Satz geht an Google. Prüfen Sie die Übersetzung mit jemandem, der die Sprache spricht.'),
  '>Сохранить<': ('>Save<', '>Guardar<', '>Speichern<'), '>Назад<': ('>Back<', '>Voltar<', '>Zurück<'),
  'placeholder="перевод"': ('placeholder="translation"', 'placeholder="tradução"', 'placeholder="Übersetzung"'),
  'Перевести в Google ↗': ('Translate in Google ↗', 'Traduzir no Google ↗', 'Mit Google übersetzen ↗'),
  'Как сказать: {2} {3}?': ('How do you say it: {2} {3}?', 'Como se diz: {2} {3}?', 'Wie sagt man das: {2} {3}?'),
  'Скажи вслух — потом проверь': ('Say it out loud, then check', 'Diz em voz alta e depois confirma', 'Sag es laut, dann prüf nach'),
  'другой язык…': ('another language…', 'outra língua…', 'andere Sprache…'),
  'Дома один язык, в школе другой, с друзьями третий — это нормально, так растут дети мира. Отметьте вместе с {0}, где на каком языке {1} говорит. Если с бабушкой или в школе говорят на двух языках, отметьте оба.': (
    'One language at home, another at school, a third with friends: that is normal, it is how children of the world grow up. Mark together with {0} which language {1} speaks where. If two languages are spoken with grandparents or at school, mark both.',
    'Uma língua em casa, outra na escola, uma terceira com os amigos: é normal, é assim que crescem as crianças do mundo. Marque com {0} que língua fala em cada sítio. Se com os avós ou na escola se falam duas línguas, marque as duas.',
    'Zu Hause eine Sprache, in der Schule eine andere, mit Freunden eine dritte: Das ist normal, so wachsen Kinder der Welt auf. Markieren Sie zusammen mit {0}, wo {1} welche Sprache spricht. Werden bei Oma und Opa oder in der Schule zwei Sprachen gesprochen, markieren Sie beide.'),
  'Моя карта языков': ('My language map', 'O meu mapa de línguas', 'Meine Sprachenkarte'), '✍️ Свои фразы': ('✍️ Our own phrases', '✍️ As nossas frases', '✍️ Eigene Sätze'),
  'Фразы, которые нужны именно вам: что сказать тренеру, соседке, врачу. Перевод пишет взрослый.': ('Phrases just for you: what to say to the coach, the neighbour, the doctor. A grown-up writes the translation.', 'Frases só vossas: o que dizer ao treinador, à vizinha, ao médico. Um adulto escreve a tradução.', 'Sätze nur für Sie: was man dem Trainer, der Nachbarin, dem Arzt sagt. Ein Erwachsener schreibt die Übersetzung.'),
  'Кому сказать?': ('Who to say it to?', 'A quem dizer?', 'Wem sagen?'),
  'Что сказать (по-русски)': ('What to say (in English)', 'O que dizer (em português)', 'Was sagen (auf Deutsch)'),
  'placeholder="например, Можно мне ещё?"': ('placeholder="for example, Can I have more?"', 'placeholder="por exemplo, Posso comer mais?"', 'placeholder="zum Beispiel: Kann ich noch etwas haben?"'),
  '＋ Добавить фразу': ('＋ Add the phrase', '＋ Adicionar frase', '＋ Satz hinzufügen'), 'Мои фразы': ('My phrases', 'As minhas frases', 'Meine Sätze'),
  'aria-label="Убрать"': ('aria-label="Remove"', 'aria-label="Remover"', 'aria-label="Entfernen"'),
  'Скажи {4}: «{5}»': ('Say it to {4}: «{5}»', 'Diz {4}: «{5}»', 'Sag {4}: «{5}»'),
  'На каком языке ты говоришь {6}?': ('Which language do you speak {6}?', 'Em que língua falas {6}?', 'Welche Sprache sprichst du {6}?'),
}
CYR = re.compile('[А-Яа-яЁё]'); n = 0
def trans(k):
    if k in W: return W[k]
    out = []
    for i in range(3):
        s = k
        for ru in sorted(FRAG, key=len, reverse=True): s = s.replace(ru, FRAG[ru][i])
        out.append(s)
    return tuple(out)
bad = []
for g, keys in miss.items():
    if g in ('GAMES', 'LEARN_IMG', 'SND_HI'): continue
    for k in keys:
        tr = trans(k)
        if any(CYR.search(x) for x in tr) or [len(re.findall(r'\{\d\}', x)) for x in tr] and any(set(re.findall(r'\{\d\}', x)) - set(re.findall(r'\{\d\}', k)) for x in tr): bad.append((g, k)); continue
        fixed.setdefault(g, {})[k] = list(tr[:2]); fde.setdefault(g, {})[k] = tr[2]; n += 1
for b in bad: print('LEFT', b)
json.dump(fixed, open(H + '/fixed.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
json.dump(fde, open(H + '/de/fixed_de.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('ok', n)
