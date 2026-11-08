# museum-icon: the museum quiz by age with true-or-false rounds inside — translations
import json, os, re
H = os.path.dirname(os.path.abspath(__file__))
fixed = json.load(open(H + '/fixed.json', encoding='utf-8')); fde = json.load(open(H + '/de/fixed_de.json', encoding='utf-8'))
miss = json.load(open(H + '/out-en.html.missing.json', encoding='utf-8'))
W = {
  '<div class="art aq"><div class="sp-hud"><span>Вопрос <b id="aqN">1</b>/{0}</span><span id="aqLv"></span></div><div id="aqBox"><p class="lead">Открываю музей…</p></div></div>':
    ('<div class="art aq"><div class="sp-hud"><span>Question <b id="aqN">1</b>/{0}</span><span id="aqLv"></span></div><div id="aqBox"><p class="lead">Opening the museum…</p></div></div>',
     '<div class="art aq"><div class="sp-hud"><span>Pergunta <b id="aqN">1</b>/{0}</span><span id="aqLv"></span></div><div id="aqBox"><p class="lead">A abrir o museu…</p></div></div>',
     '<div class="art aq"><div class="sp-hud"><span>Frage <b id="aqN">1</b>/{0}</span><span id="aqLv"></span></div><div id="aqBox"><p class="lead">Ich öffne das Museum…</p></div></div>'),
  '<button class="aq-big" data-full="{0}" aria-label="Открыть картину целиком"><img class="aq-img" src="{1}" alt="{2}"></button><p class="aq-t">«{3}»</p>':
    ('<button class="aq-big" data-full="{0}" aria-label="Open the whole painting"><img class="aq-img" src="{1}" alt="{2}"></button><p class="aq-t">“{3}”</p>',
     '<button class="aq-big" data-full="{0}" aria-label="Abrir o quadro inteiro"><img class="aq-img" src="{1}" alt="{2}"></button><p class="aq-t">«{3}»</p>',
     '<button class="aq-big" data-full="{0}" aria-label="Das ganze Bild öffnen"><img class="aq-img" src="{1}" alt="{2}"></button><p class="aq-t">„{3}“</p>'),
  '<p class="aq-q aq-s">{0}</p><p class="aq-sub">Правда или выдумка?</p><div class="og-btns tfq-b"><button class="big" data-a="1">👍 Правда</button><button class="big ghost" data-a="0">🙃 Выдумка</button></div>':
    ('<p class="aq-q aq-s">{0}</p><p class="aq-sub">True or made up?</p><div class="og-btns tfq-b"><button class="big" data-a="1">👍 True</button><button class="big ghost" data-a="0">🙃 Made up</button></div>',
     '<p class="aq-q aq-s">{0}</p><p class="aq-sub">Verdade ou invenção?</p><div class="og-btns tfq-b"><button class="big" data-a="1">👍 Verdade</button><button class="big ghost" data-a="0">🙃 Invenção</button></div>',
     '<p class="aq-q aq-s">{0}</p><p class="aq-sub">Wahr oder erfunden?</p><div class="og-btns tfq-b"><button class="big" data-a="1">👍 Wahr</button><button class="big ghost" data-a="0">🙃 Erfunden</button></div>'),
  '<p class="aq-q">Где картина «{0}»?</p><div class="aq-four three">{1}</div>':
    ('<p class="aq-q">Where is the painting “{0}”?</p><div class="aq-four three">{1}</div>', '<p class="aq-q">Onde está o quadro «{0}»?</p><div class="aq-four three">{1}</div>', '<p class="aq-q">Wo ist das Bild „{0}“?</p><div class="aq-four three">{1}</div>'),
  'Посмотри ещё! Что нарисовано на картине «{0}»?': ('Look again! What is in the painting “{0}”?', 'Olha outra vez! O que está pintado no quadro «{0}»?', 'Schau noch mal! Was ist auf dem Bild „{0}“ gemalt?'),
  'Верно! Это «{0}».': ('Right! This is “{0}”.', 'Certo! Este é «{0}».', 'Richtig! Das ist „{0}“.'),
  'Посмотри на картину внимательно.': ('Look carefully at the painting.', 'Olha bem para o quadro.', 'Schau dir das Bild genau an.'),
  'Кто написал эту картину? {0}?': ('Who painted this picture? {0}?', 'Quem pintou este quadro? {0}?', 'Wer hat dieses Bild gemalt? {0}?'),
  'Подсказка: этот художник написал ещё картину «{0}».': ('A clue: this artist also painted “{0}”.', 'Uma pista: este pintor também pintou «{0}».', 'Ein Tipp: Dieser Maler hat auch „{0}“ gemalt.'),
  'Подсказка: имя начинается на «{0}».': ('A clue: the name starts with “{0}”.', 'Uma pista: o nome começa por «{0}».', 'Ein Tipp: Der Name fängt mit „{0}“ an.'),
  'Верно! Её написал {0}.': ('Right! It was painted by {0}.', 'Certo! Foi pintado por {0}.', 'Richtig! Gemalt hat es {0}.'),
  'В каком городе живёт эта картина?': ('Which city does this painting live in?', 'Em que cidade vive este quadro?', 'In welcher Stadt wohnt dieses Bild?'),
  'В каком городе живёт эта картина? {0}?': ('Which city does this painting live in? {0}?', 'Em que cidade vive este quadro? {0}?', 'In welcher Stadt wohnt dieses Bild? {0}?'),
  'Подсказка: в этой стране такой флаг — {0}': ('A clue: that country has this flag — {0}', 'Uma pista: esse país tem esta bandeira — {0}', 'Ein Tipp: Dieses Land hat diese Flagge — {0}'),
  'Подсказка: посмотри на флажок.': ('A clue: look at the little flag.', 'Uma pista: olha para a bandeirinha.', 'Ein Tipp: Schau dir das Fähnchen an.'),
  'Верно! Она живёт в городе {0}, в музее «{1}».': ('Right! It lives in {0}, in the museum “{1}”.', 'Certo! Vive em {0}, no museu «{1}».', 'Richtig! Es wohnt in {0}, im Museum „{1}“.'),
  'Подсказка: этот музей в городе {0}.': ('A clue: this museum is in {0}.', 'Uma pista: este museu fica em {0}.', 'Ein Tipp: Dieses Museum ist in {0}.'),
  'Посмотри ещё раз!': ('Look once more!', 'Olha mais uma vez!', 'Schau noch einmal!'),
  'Верно! Её дом — {0}.': ('Right! Its home is {0}.', 'Certo! A casa dele é {0}.', 'Richtig! Sein Zuhause ist {0}.'),
  'Эта картина живёт в городе {0}.': ('This painting lives in {0}.', 'Este quadro vive em {0}.', 'Dieses Bild wohnt in {0}.'),
  'Эта картина живёт в городе {0}. Правда или выдумка?': ('This painting lives in {0}. True or made up?', 'Este quadro vive em {0}. Verdade ou invenção?', 'Dieses Bild wohnt in {0}. Wahr oder erfunden?'),
  'Она живёт в городе {0}.': ('It lives in {0}.', 'Vive em {0}.', 'Es wohnt in {0}.'),
  'Дом этой картины — {0}.': ('This painting’s home is {0}.', 'A casa deste quadro é {0}.', 'Das Zuhause dieses Bildes ist {0}.'),
  'Дом этой картины — {0}. Правда или выдумка?': ('This painting’s home is {0}. True or made up?', 'A casa deste quadro é {0}. Verdade ou invenção?', 'Das Zuhause dieses Bildes ist {0}. Wahr oder erfunden?'),
  'Её дом — {0}.': ('Its home is {0}.', 'A casa dele é {0}.', 'Sein Zuhause ist {0}.'),
  'Эту картину написали в {0} году.': ('This painting was made in {0}.', 'Este quadro foi pintado em {0}.', 'Dieses Bild wurde {0} gemalt.'),
  'Эту картину написали в {0} году. Правда или выдумка?': ('This painting was made in {0}. True or made up?', 'Este quadro foi pintado em {0}. Verdade ou invenção?', 'Dieses Bild wurde {0} gemalt. Wahr oder erfunden?'),
  'Её написали в {0} году.': ('It was painted in {0}.', 'Foi pintado em {0}.', 'Es wurde {0} gemalt.'),
  'Эту картину написал {0}.': ('This painting is by {0}.', 'Este quadro é de {0}.', 'Dieses Bild ist von {0}.'),
  'Эту картину написал {0}. Правда или выдумка?': ('This painting is by {0}. True or made up?', 'Este quadro é de {0}. Verdade ou invenção?', 'Dieses Bild ist von {0}. Wahr oder erfunden?'),
  'Её написал {0}.': ('It is by {0}.', 'É de {0}.', 'Es ist von {0}.'),
  'Уровень {0}{1}': ('Level {0}{1}', 'Nível {0}{1}', 'Stufe {0}{1}'),
  'Новый уровень! Вопросы чуть труднее.': ('New level! The questions get a little harder.', 'Novo nível! As perguntas ficam um pouco mais difíceis.', 'Neue Stufe! Die Fragen werden ein bisschen schwerer.'),
  'С первого раза: {0} из {1}! Ты знаешь картины лучших музеев мира.': ('First try: {0} of {1}! You know the paintings of the world’s best museums.', 'À primeira: {0} de {1}! Conheces os quadros dos melhores museus do mundo.', 'Beim ersten Mal: {0} von {1}! Du kennst die Bilder der besten Museen der Welt.'),
  'Верно! {0}': ('Right! {0}', 'Certo! {0}', 'Richtig! {0}'),
  'Это правда!': ('That is true!', 'É verdade!', 'Das ist wahr!'),
  'Это выдумка!': ('That is made up!', 'É invenção!', 'Das ist erfunden!'),
  'Вот она — нажми!': ('Here it is — tap it!', 'Está aqui — toca!', 'Da ist sie — tipp drauf!'),
  'смотри, угадывай, правда или выдумка': ('look, guess, true or made up', 'olha, adivinha, verdade ou invenção', 'schau, rate, wahr oder erfunden'),
  'правда выдумка картины вопросы': ('true made up paintings questions quiz', 'verdade invenção quadros perguntas', 'wahr erfunden Bilder Fragen Quiz'),
}
CYR = re.compile('[А-Яа-яЁё]'); PH = re.compile(r'\{\d+\}'); n = 0
for g, keys in miss.items():
    if g in ('GAMES', 'LEARN_IMG', 'SND_HI'): continue
    for k in keys:
        tr = W[k]
        assert not any(CYR.search(x) for x in tr), k
        assert all(sorted(PH.findall(x)) == sorted(PH.findall(k)) for x in tr), k
        fixed.setdefault(g, {})[k] = list(tr[:2]); fde.setdefault(g, {})[k] = tr[2]; n += 1
json.dump(fixed, open(H + '/fixed.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
json.dump(fde, open(H + '/de/fixed_de.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('ok', n)
