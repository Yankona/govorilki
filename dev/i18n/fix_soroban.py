# soroban: «Счёты» — the abacus, its story, twelve levels, flash anzan, the daily step of «Сегодня»
import json, os, re
H = os.path.dirname(os.path.abspath(__file__))
fixed = json.load(open(H + '/fixed.json', encoding='utf-8')); fde = json.load(open(H + '/de/fixed_de.json', encoding='utf-8'))
miss = json.load(open(H + '/out-en.html.missing.json', encoding='utf-8'))
W = {
  'Счёты': ('Abacus', 'Ábaco', 'Abakus'),
  'бусины и счёт в уме, каждый день': ('beads and mental maths, every day', 'contas e cálculo mental, todos os dias', 'Perlen und Kopfrechnen, jeden Tag'),
  'единицы': ('ones', 'unidades', 'Einer'), 'десятки': ('tens', 'dezenas', 'Zehner'), 'сотни': ('hundreds', 'centenas', 'Hunderter'),
  'Придвинь бусины к перекладине.': ('Move beads up to the bar.', 'Encosta contas à barra.', 'Schieb Perlen an die Leiste.'),
  'Отодвинь бусины от перекладины.': ('Move beads away from the bar.', 'Afasta contas da barra.', 'Schieb Perlen von der Leiste weg.'),
  'Нижних бусин не хватает. {0} — это 5 без {1}: опусти пятёрку и убери {2} {3}.': ('Not enough lower beads. {0} is 5 take away {1}: bring the five down and take away {2} {3}.', 'Não há contas de baixo que cheguem. {0} é 5 menos {1}: desce o cinco e tira {2} {3}.', 'Es gibt nicht genug untere Perlen. {0} ist 5 weniger {1}: schieb die Fünf runter und nimm {2} {3} weg.'),
  'Нижних бусин не хватает. {0} — это 5 без {1}: подними пятёрку и добавь {2} {3}.': ('Not enough lower beads. {0} is 5 take away {1}: push the five up and add {2} {3}.', 'Não há contas de baixo que cheguem. {0} é 5 menos {1}: sobe o cinco e junta {2} {3}.', 'Es gibt nicht genug untere Perlen. {0} ist 5 weniger {1}: schieb die Fünf hoch und nimm {2} {3} dazu.'),
  'нижнюю': ('lower bead', 'conta de baixo', 'untere Perle'), 'нижние': ('lower beads', 'contas de baixo', 'untere Perlen'), 'нижних': ('lower beads', 'contas de baixo', 'untere Perlen'),
  'Единиц не хватает. {0} — это 10 без {1}: добавь десяток слева и убери {2} справа.': ('Not enough ones. {0} is 10 take away {1}: add a ten on the left and take away {2} on the right.', 'Não há unidades que cheguem. {0} é 10 menos {1}: junta uma dezena à esquerda e tira {2} à direita.', 'Es gibt nicht genug Einer. {0} ist 10 weniger {1}: nimm links einen Zehner dazu und rechts {2} weg.'),
  'Единиц не хватает. {0} — это 10 без {1}: убери десяток слева и добавь {2} справа.': ('Not enough ones. {0} is 10 take away {1}: take away a ten on the left and add {2} on the right.', 'Não há unidades que cheguem. {0} é 10 menos {1}: tira uma dezena à esquerda e junta {2} à direita.', 'Es gibt nicht genug Einer. {0} ist 10 weniger {1}: nimm links einen Zehner weg und rechts {2} dazu.'),
  'Слева направо: сначала десятки, потом единицы.': ('Left to right: tens first, then ones.', 'Da esquerda para a direita: primeiro as dezenas, depois as unidades.', 'Von links nach rechts: erst die Zehner, dann die Einer.'),
  'Слева направо: сотни, десятки, единицы.': ('Left to right: hundreds, tens, ones.', 'Da esquerda para a direita: centenas, dezenas, unidades.', 'Von links nach rechts: Hunderter, Zehner, Einer.'),
  'Покажи число до 4': ('Show a number up to 4', 'Mostra um número até 4', 'Zeig eine Zahl bis 4'),
  'Покажи число до 9': ('Show a number up to 9', 'Mostra um número até 9', 'Zeig eine Zahl bis 9'),
  'Сколько на счётах?': ('What is on the abacus?', 'Quanto está no ábaco?', 'Wie viel ist auf dem Abakus?'),
  'Плюс и минус': ('Plus and minus', 'Mais e menos', 'Plus und Minus'),
  'Маленькие друзья: пятёрка': ('Little friends: the five', 'Amigos pequenos: o cinco', 'Kleine Freunde: die Fünf'),
  'Большие друзья: десяток': ('Big friends: the ten', 'Amigos grandes: a dezena', 'Große Freunde: die Zehn'),
  'Двузначные числа': ('Two-digit numbers', 'Números de dois algarismos', 'Zweistellige Zahlen'),
  'Трёхзначные числа': ('Three-digit numbers', 'Números de três algarismos', 'Dreistellige Zahlen'),
  'Флеш-анзан на счётах': ('Flash sums on the abacus', 'Contas-relâmpago no ábaco', 'Blitzrechnen auf dem Abakus'),
  'Счёты-призрак': ('Ghost abacus', 'Ábaco-fantasma', 'Geister-Abakus'),
  'Счёт в уме': ('Mental maths', 'Cálculo mental', 'Kopfrechnen'),
  'Мастер счёта в уме': ('Mental maths master', 'Mestre do cálculo mental', 'Kopfrechen-Meister'),
  '<div class="sb2 r{0}{1}{2}" role="group" aria-label="Счёты">{3}</div>': ('<div class="sb2 r{0}{1}{2}" role="group" aria-label="Abacus">{3}</div>', '<div class="sb2 r{0}{1}{2}" role="group" aria-label="Ábaco">{3}</div>', '<div class="sb2 r{0}{1}{2}" role="group" aria-label="Abakus">{3}</div>'),
  'минус {0}': ('minus {0}', 'menos {0}', 'minus {0}'), 'плюс {0}': ('plus {0}', 'mais {0}', 'plus {0}'),
  'Это счёты — волшебная машинка для счёта. Бусины считают, только когда прижмутся к перекладине. Сейчас все бусины спят — это ноль.': ('This is an abacus — a magic counting machine. Beads only count when they touch the bar. Now all the beads are asleep — that is zero.', 'Isto é um ábaco — uma máquina mágica de contar. As contas só contam quando tocam na barra. Agora estão todas a dormir — isso é zero.', 'Das ist ein Abakus — eine Zaubermaschine zum Rechnen. Perlen zählen nur, wenn sie die Leiste berühren. Jetzt schlafen alle Perlen — das ist null.'),
  'Разбуди одну нижнюю бусину: подвинь её вверх, к перекладине!': ('Wake up one lower bead: move it up to the bar!', 'Acorda uma conta de baixo: empurra-a para cima, até à barra!', 'Weck eine untere Perle: schieb sie hoch an die Leiste!'),
  'Один! Каждая нижняя бусина — это один. Разбуди ещё две. Сколько станет?': ('One! Each lower bead is one. Wake up two more. How many now?', 'Um! Cada conta de baixo vale um. Acorda mais duas. Quantas ficam?', 'Eins! Jede untere Perle ist eins. Weck noch zwei. Wie viele sind es jetzt?'),
  'Три! А верхняя бусина — особенная. Она как ладошка: стоит целых пять! Уложим нижние бусины спать.': ('Three! The top bead is special. It is like a hand: it is worth five! Let us put the lower beads to sleep.', 'Três! A conta de cima é especial. É como uma mão: vale cinco! Vamos pôr as contas de baixo a dormir.', 'Drei! Die obere Perle ist besonders. Sie ist wie eine Hand: Sie ist fünf wert! Wir legen die unteren Perlen schlafen.'),
  'Опусти верхнюю бусину к перекладине. Это пять!': ('Bring the top bead down to the bar. That is five!', 'Desce a conta de cima até à barra. Isso é cinco!', 'Schieb die obere Perle runter an die Leiste. Das ist fünf!'),
  'Пять и ещё одна нижняя — это шесть. Покажи шесть!': ('Five and one more lower bead is six. Show six!', 'Cinco e mais uma de baixo é seis. Mostra seis!', 'Fünf und noch eine untere ist sechs. Zeig sechs!'),
  'Ура! Теперь ты знаешь секрет счётов: внизу — по одной, наверху — пятёрка. Поиграем?': ('Hooray! Now you know the secret of the abacus: ones below, a five on top. Shall we play?', 'Viva! Agora sabes o segredo do ábaco: em baixo vale um, em cima vale cinco. Vamos jogar?', 'Hurra! Jetzt kennst du das Geheimnis des Abakus: unten je eins, oben die Fünf. Spielen wir?'),
  'Как считают счёты': ('How the abacus counts', 'Como conta o ábaco', 'Wie der Abakus zählt'),
  'Играть!': ('Play!', 'Jogar!', 'Spielen!'), 'Дальше ▶': ('Next ▶', 'Seguinte ▶', 'Weiter ▶'),
  '<button class="link-btn" id="sbHow">🐣 Как считают счёты?</button>': ('<button class="link-btn" id="sbHow">🐣 How does the abacus count?</button>', '<button class="link-btn" id="sbHow">🐣 Como conta o ábaco?</button>', '<button class="link-btn" id="sbHow">🐣 Wie zählt der Abakus?</button>'),
  '<button class="big" id="sbOk">Готово</button>': ('<button class="big" id="sbOk">Done</button>', '<button class="big" id="sbOk">Pronto</button>', '<button class="big" id="sbOk">Fertig</button>'),
  'Приготовились…': ('Get ready…', 'Prepara-te…', 'Mach dich bereit…'),
  'Смотри внимательно!': ('Watch carefully!', 'Olha com atenção!', 'Schau genau hin!'),
  'Покажи на счётах: <b class="sb-n">{0}</b>': ('Show on the abacus: <b class="sb-n">{0}</b>', 'Mostra no ábaco: <b class="sb-n">{0}</b>', 'Zeig auf dem Abakus: <b class="sb-n">{0}</b>'),
  'Покажи на счётах число {0}. Нижняя бусина — один, верхняя — пять.': ('Show the number {0} on the abacus. A lower bead is one, the top bead is five.', 'Mostra o número {0} no ábaco. Uma conta de baixo vale um, a de cima vale cinco.', 'Zeig die Zahl {0} auf dem Abakus. Eine untere Perle ist eins, die obere ist fünf.'),
  'Покажи {0}.': ('Show {0}.', 'Mostra {0}.', 'Zeig {0}.'),
  'Какое число на счётах?': ('What number is on the abacus?', 'Que número está no ábaco?', 'Welche Zahl ist auf dem Abakus?'),
  'Посчитай бусины у перекладины. Верхняя — это пять. Какое число?': ('Count the beads at the bar. The top one is five. What number is it?', 'Conta as contas junto à barra. A de cima vale cinco. Que número é?', 'Zähl die Perlen an der Leiste. Die obere ist fünf. Welche Zahl ist das?'),
  'Какое число?': ('What number?', 'Que número?', 'Welche Zahl?'),
  'На счётах {0}. {1} {2}.': ('The abacus shows {0}. {1} {2}.', 'No ábaco está {0}. {1} {2}.', 'Auf dem Abakus ist {0}. {1} {2}.'),
  'Прибавь': ('Add', 'Junta', 'Plus'), 'Отними': ('Take away', 'Tira', 'Minus'),
  'Числа будут мелькать. Сразу прибавляй каждое на счётах!': ('Numbers will flash by. Add each one on the abacus straight away!', 'Os números vão passar depressa. Junta cada um logo no ábaco!', 'Gleich blitzen Zahlen auf. Rechne jede sofort auf dem Abakus dazu!'),
  'Счёты стали призраком. Смотри, как двигаются бусины, а потом они исчезнут. Запомни!': ('The abacus is a ghost now. Watch the beads move, then they will vanish. Remember!', 'O ábaco virou fantasma. Vê as contas a mexer, depois elas desaparecem. Lembra-te!', 'Der Abakus ist jetzt ein Geist. Schau, wie sich die Perlen bewegen, dann verschwinden sie. Merk es dir!'),
  'Счётов нет — они у тебя в голове. Представляй бусины и складывай!': ('No abacus now — it is in your head. Picture the beads and add!', 'Não há ábaco — está na tua cabeça. Imagina as contas e soma!', 'Kein Abakus mehr — er ist in deinem Kopf. Stell dir die Perlen vor und rechne!'),
  'Сколько получилось?': ('How much is it?', 'Quanto deu?', 'Wie viel ist es?'),
  'Сколько получилось? Покажи на счётах и нажми «Готово».': ('How much is it? Show it on the abacus and press «Done».', 'Quanto deu? Mostra no ábaco e carrega em «Pronto».', 'Wie viel ist es? Zeig es auf dem Abakus und drück «Fertig».'),
  'Нижняя бусина — один, верхняя — пять. Посчитай ещё раз.': ('A lower bead is one, the top bead is five. Count again.', 'Uma conta de baixo vale um, a de cima vale cinco. Conta outra vez.', 'Eine untere Perle ist eins, die obere ist fünf. Zähl noch mal.'),
  'Верхняя бусина у перекладины — это пять, и ещё нижние по одной.': ('The top bead at the bar is five, and each lower bead is one more.', 'A conta de cima junto à barra vale cinco, e cada uma de baixo vale mais um.', 'Die obere Perle an der Leiste ist fünf, und jede untere ist eins mehr.'),
  'Почти! Попробуй ещё раз.': ('Nearly! Try again.', 'Quase! Tenta outra vez.', 'Fast! Versuch es noch mal.'),
  'Почти! ': ('Nearly! ', 'Quase! ', 'Fast! '),
  'Вот так: {0}. Ничего, получится!': ('Like this: {0}. Never mind, you will get it!', 'Assim: {0}. Não faz mal, vais conseguir!', 'So: {0}. Macht nichts, das schaffst du!'),
  'Верно!': ('Right!', 'Certo!', 'Richtig!'), 'Да!': ('Yes!', 'Sim!', 'Ja!'), 'Точно!': ('Exactly!', 'Exato!', 'Genau!'), 'Правильно!': ('Correct!', 'Correto!', 'Stimmt!'),
  'Верно {0} из {1}.': ('{0} out of {1} right.', '{0} de {1} certas.', '{0} von {1} richtig.'),
  ' Открыт уровень {0}: {1}!': (' Level {0} is open: {1}!', ' Nível {0} desbloqueado: {1}!', ' Stufe {0} ist offen: {1}!'),
  ' Ещё разок — и получится!': (' One more go and you will get it!', ' Mais uma vez e vais conseguir!', ' Noch einmal, dann klappt es!'),
  '<label class="prow" for="sbLvIn">🧮 Счёты: уровень <select id="sbLvIn">{0}</select></label>': ('<label class="prow" for="sbLvIn">🧮 Abacus: level <select id="sbLvIn">{0}</select></label>', '<label class="prow" for="sbLvIn">🧮 Ábaco: nível <select id="sbLvIn">{0}</select></label>', '<label class="prow" for="sbLvIn">🧮 Abakus: Stufe <select id="sbLvIn">{0}</select></label>'),
  'для всех: бусины, а потом счёт в уме': ('for everyone: beads, then maths in your head', 'para todos: contas, depois cálculo mental', 'für alle: Perlen, dann Kopfrechnen'),
}
CYR = re.compile('[А-Яа-яЁё]'); n = 0
for g, keys in miss.items():
    if g in ('GAMES', 'LEARN_IMG', 'SND_HI'): continue
    for k in (keys if isinstance(keys, list) else list(keys)):
        tr = W[k]
        assert not any(CYR.search(x) for x in tr), k
        fixed.setdefault(g, {})[k] = list(tr[:2]); fde.setdefault(g, {})[k] = tr[2]; n += 1
json.dump(fixed, open(H + '/fixed.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
json.dump(fde, open(H + '/de/fixed_de.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('ok', n)
