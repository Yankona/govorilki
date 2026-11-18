# audit 18.11 (first run in one tap, the grown-up's check, the microphone explained): translations of the new strings
import json, os, re
H = os.path.dirname(os.path.abspath(__file__))
fixed = json.load(open(H + '/fixed.json', encoding='utf-8')); fde = json.load(open(H + '/de/fixed_de.json', encoding='utf-8'))
miss = json.load(open(H + '/out-en.html.missing.json', encoding='utf-8'))
MIC = ('I want to hear you! Now the phone will ask about the microphone. Tap «Allow» — then I can hear you speak and blow. I don\'t record anything.',
       'Quero ouvir-te! Agora o telemóvel vai perguntar pelo microfone. Carrega em «Permitir» — assim oiço-te falar e soprar. Não gravo nada.',
       'Ich möchte dich hören! Gleich fragt das Handy nach dem Mikrofon. Tippe auf «Zulassen» — dann höre ich, wie du sprichst und pustest. Ich nehme nichts auf.')
MICT = ('<div class="winbox" role="dialog" aria-label="{mic}"><div class="ryz-w">{{0}}</div><h2>🎤 {h}</h2>\n      <p>{p}</p>\n      '
        '<div class="win-btns"><button class="big" data-m="1">{ok}</button><button class="big ghost" data-m="0">{no}</button></div></div>')
MICP = [('Microphone', 'I want to hear you!', 'Now the phone will ask about the microphone. Tap «Allow» — then I can hear you speak and blow. I don\'t record anything.', 'OK!', 'Not now'),
        ('Microfone', 'Quero ouvir-te!', 'Agora o telemóvel vai perguntar pelo microfone. Carrega em «Permitir» — assim oiço-te falar e soprar. Não gravo nada.', 'Está bem!', 'Agora não'),
        ('Mikrofon', 'Ich möchte dich hören!', 'Gleich fragt das Handy nach dem Mikrofon. Tippe auf «Zulassen» — dann höre ich, wie du sprichst und pustest. Ich nehme nichts auf.', 'Okay!', 'Nicht jetzt')]
NA = ('<section class="group name-ask" id="nameAsk"><div class="group-head"><h2>👋 {h}</h2><p>{p}</p></div>\n    <input class="fe-name" id="naName" type="text" maxlength="20" autocomplete="off" placeholder="{n}" aria-label="{n}">\n    '
      '<div class="picks-g two"><button class="pick-b {{0}}" data-ng="f">👧 {f}</button><button class="pick-b {{1}}" data-ng="m">🧒 {m}</button></div>\n    '
      '<div class="prow-btns"><button class="big" id="naOk">{ok}</button><button class="big ghost" id="naLater">{l}</button></div></section>')
NAP = [dict(h='What is your name?', p='Your friend will call you by your name', n='Name', f='Girl', m='Boy', ok='Done', l='Later'),
       dict(h='Como te chamas?', p='O teu amigo vai chamar-te pelo nome', n='Nome', f='Menina', m='Menino', ok='Pronto', l='Depois'),
       dict(h='Wie heißt du?', p='Dein Freund ruft dich dann beim Namen', n='Name', f='Mädchen', m='Junge', ok='Fertig', l='Später')]
W = {
  MIC[0][:0] + 'Я хочу тебя услышать! Сейчас телефон спросит про микрофон. Нажми «Разрешить» — тогда я услышу, как ты говоришь и дуешь. Я ничего не записываю.': MIC,
  '<summary>Ещё: интересы, день рождения, разделы, свои слова</summary>': ('<summary>More: interests, birthday, sections, own words</summary>', '<summary>Mais: interesses, aniversário, secções, palavras próprias</summary>', '<summary>Mehr: Interessen, Geburtstag, Bereiche, eigene Wörter</summary>'),
  '<button class="big" id="obGo">Начать занятия</button>': ('<button class="big" id="obGo">Start the lessons</button>', '<button class="big" id="obGo">Começar as atividades</button>', '<button class="big" id="obGo">Mit den Übungen beginnen</button>'),
  'Эта ссылка ведёт на другой сайт. Откроем её вместе со взрослым.': ('This link goes to another website. Let\'s open it together with a grown-up.', 'Esta ligação leva a outro site. Vamos abri-la com um adulto.', 'Dieser Link führt zu einer anderen Website. Öffnen wir ihn zusammen mit einem Erwachsenen.'),
  'Моя книга': ('My book', 'O meu livro', 'Mein Buch'),
  'Наша семья': ('Our family', 'A nossa família', 'Unsere Familie'),
  '<h2 class="lp-q-h">▶️ Играть сейчас</h2><p class="lp-q-p">Сколько лет ребёнку?</p>': ('<h2 class="lp-q-h">▶️ Play now</h2><p class="lp-q-p">How old is your child?</p>', '<h2 class="lp-q-h">▶️ Jogar agora</h2><p class="lp-q-p">Que idade tem a criança?</p>', '<h2 class="lp-q-h">▶️ Jetzt spielen</h2><p class="lp-q-p">Wie alt ist Ihr Kind?</p>'),
  '<p class="muted lp-q-n">Без регистрации. Имя, братьев и сестёр, вход семьи можно добавить потом.</p>': ('<p class="muted lp-q-n">No sign-up. The name, brothers and sisters and the family sign-in can be added later.</p>', '<p class="muted lp-q-n">Sem registo. O nome, irmãos e irmãs e a entrada da família podem ser adicionados depois.</p>', '<p class="muted lp-q-n">Ohne Anmeldung. Name, Geschwister und die Familienanmeldung lassen sich später hinzufügen.</p>'),
  '👪 Создать семью сразу: имена, несколько детей': ('👪 Set up the family now: names, several children', '👪 Criar a família já: nomes, várias crianças', '👪 Familie gleich anlegen: Namen, mehrere Kinder'),
  '📲 Установить на телефон': ('📲 Install on the phone', '📲 Instalar no telemóvel', '📲 Auf dem Handy installieren'),
}
CYR = re.compile('[А-Яа-яЁё]'); n = 0
for g, keys in miss.items():
    if g in ('GAMES', 'LEARN_IMG', 'SND_HI'): continue
    for k in keys:
        if k in W: tr = W[k]
        elif g == 'micExplain': tr = tuple(MICT.format(mic=a, h=b, p=c, ok=d, no=e) for a, b, c, d, e in MICP)
        elif g == 'nameAskHTML': tr = tuple(NA.format(**x) for x in NAP)
        else: raise SystemExit('no translation: ' + g + ' ' + k[:60])
        for x in tr:
            assert not CYR.search(x), x
            for ph in set(re.findall(r'\{\d+\}', k)): assert x.count(ph) == k.count(ph), (k, x)
        fixed.setdefault(g, {})[k] = list(tr[:2]); fde.setdefault(g, {})[k] = tr[2]; n += 1
json.dump(fixed, open(H + '/fixed.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
json.dump(fde, open(H + '/de/fixed_de.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('ok', n)
