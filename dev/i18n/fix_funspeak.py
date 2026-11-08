# fun-speak: the lesson trail, the trip start card, the surprise game, more praise words
import json, os, re
H = os.path.dirname(os.path.abspath(__file__))
fixed = json.load(open(H + '/fixed.json', encoding='utf-8')); fde = json.load(open(H + '/de/fixed_de.json', encoding='utf-8'))
miss = json.load(open(H + '/out-en.html.missing.json', encoding='utf-8'))
SHELL = '<div class="screen">\n    <header class="bar">\n      <button class="ibtn" id="backBtn" aria-label="%s">{0}</button>\n      {1}\n      <h1>{2}</h1>\n      <div class="starpill" title="%s">{3}<b id="starN">{4}</b></div>\n    </header>\n    <div class="gstrip" id="gstrip">{5}</div>\n    <main class="stage" id="stage">{6}</main>\n    {7}\n  </div>'
SURP = '<button class="surp" id="surpBtn"><span class="surp-g">🎁</span><b>%s</b><span class="surp-q">?</span></button>'
INTRO = '<div class="winbox ls-intro" role="dialog" aria-label="{0}">\n    <div class="ryz-w">{1}</div>\n    <h2>{2}</h2>\n    {3}\n    <div class="win-btns"><button class="big" data-a="go">%s</button></div></div>'
TRAIL = '<div class="ls-trail{0}" role="img" aria-label="{1}: {2} %s {3}">{4}<i class="ls-d"></i><span class="ls-st goal">{5}</span></div>'
W = {
  'Красиво!': ('Beautiful!', 'Lindo!', 'Schön!'), 'Огонь!': ('Brilliant!', 'Brutal!', 'Stark!'),
  'Браво!': ('Bravo!', 'Bravo!', 'Bravo!'), 'Чудесно!': ('Wonderful!', 'Maravilha!', 'Wunderbar!'),
  'Ты звезда!': ('You are a star!', 'És uma estrela!', 'Du bist ein Star!'),
  'Миссия начинается! {0} {1} до флага. Погнали!': ('The mission begins! {0} {1} to the flag. Let’s go!', 'A missão começa! {0} {1} até à bandeira. Bora!', 'Die Mission beginnt! {0} {1} bis zur Flagge. Los geht’s!'),
  'шаг': ('step', 'passo', 'Schritt'), 'шага': ('steps', 'passos', 'Schritte'), 'шагов': ('steps', 'passos', 'Schritte'),
  'Тренировка{0}! Разогрев, язык, арена — и флаг. Готов{1}?': ('Training time{0}! Warm-up, tongue, arena — and the flag. Ready{1}?', 'Treino{0}! Aquecimento, língua, arena — e a bandeira. Vamos{1}?', 'Training{0}! Aufwärmen, Zunge, Arena — und die Flagge. Bereit{1}?'),
  'а': ('', '', ''),
  'Новый маршрут! Каждый камень — одно задание. Вперёд!': ('A new route! Every stone is one task. Forward!', 'Uma nova rota! Cada pedra é uma tarefa. Em frente!', 'Eine neue Route! Jeder Stein ist eine Aufgabe. Vorwärts!'),
  'Отправляемся в путь{0}! Подуем, разомнём язычок и поиграем. А в конце — флажок!': ('Off we go{0}! We’ll blow, wake up our tongue and play. And at the end — a little flag!', 'Vamos a caminho{0}! Vamos soprar, aquecer a língua e brincar. E no fim — uma bandeirinha!', 'Wir machen uns auf den Weg{0}! Wir pusten, wecken die Zunge auf und spielen. Und am Ende wartet ein Fähnchen!'),
  'Сегодня идём в гости к Домику Язычка. По дороге нас ждут игры!': ('Today we’re visiting the Little Tongue’s House. There are games along the way!', 'Hoje vamos visitar a Casinha da Língua. Pelo caminho há jogos!', 'Heute besuchen wir das Zungenhäuschen. Unterwegs warten Spiele auf uns!'),
  'Поехали{0}! Каждый камушек — одна игра. Дойдём до флажка?': ('Let’s go{0}! Every little stone is one game. Shall we reach the flag?', 'Vamos{0}! Cada pedrinha é um jogo. Chegamos à bandeirinha?', 'Los geht’s{0}! Jedes Steinchen ist ein Spiel. Schaffen wir es bis zum Fähnchen?'),
  'Миссия!': ('Mission!', 'Missão!', 'Mission!'), 'В путь!': ('Off we go!', 'A caminho!', 'Los geht’s!'),
  INTRO % 'Поехали!': (INTRO % 'Let’s go!', INTRO % 'Vamos!', INTRO % 'Los!'),
  TRAIL % 'из': (TRAIL % 'of', TRAIL % 'de', TRAIL % 'von'),
  SURP % 'Игра-сюрприз': (SURP % 'Surprise game', SURP % 'Jogo surpresa', SURP % 'Überraschungsspiel'),
}
W[SHELL.replace('%s', 'Назад', 1).replace('%s', 'Звёздочки', 1)] = tuple(SHELL.replace('%s', a, 1).replace('%s', b, 1) for a, b in (('Back', 'Stars'), ('Voltar', 'Estrelas'), ('Zurück', 'Sterne')))
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
