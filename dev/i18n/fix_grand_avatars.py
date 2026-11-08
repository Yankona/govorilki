# grand-avatars: translations — the portrait maker, the grandparent's home (big tiles, «Послать привет»), the hello phrases
import json, os, re
H = os.path.dirname(os.path.abspath(__file__))
fixed = json.load(open(H + '/fixed.json', encoding='utf-8')); fde = json.load(open(H + '/de/fixed_de.json', encoding='utf-8'))
miss = json.load(open(H + '/out-en.html.missing.json', encoding='utf-8'))
TB = {L: json.load(open(H + f'/tables/{L}.json', encoding='utf-8')) for L in ('en', 'pt', 'de')}
P1 = '<p class="ty-h">{0}</p>\n        <div class="prow-btns ty-row">'
W = {
  'Портрет': ('Portrait', 'Retrato', 'Porträt'),
  'Не получилось открыть фото. Попробуйте другое.': ("The photo didn't open. Please try another one.", 'Não foi possível abrir a fotografia. Experimente outra.', 'Das Foto ließ sich nicht öffnen. Bitte versuchen Sie ein anderes.'),
  'Нажмите на глаза: сначала на один, потом на другой.': ('Tap the eyes: first one, then the other.', 'Toque nos olhos: primeiro num, depois no outro.', 'Tippen Sie auf die Augen: erst auf eins, dann auf das andere.'),
  'Нажмите, где глаза: {0}.': ('Tap where the eyes are: {0}.', 'Toque onde estão os olhos: {0}.', 'Tippen Sie, wo die Augen sind: {0}.'),
  'теперь второй': ('now the second one', 'agora o segundo', 'jetzt das zweite'),
  'сначала один': ('first one', 'primeiro um', 'erst eins'),
  'Глаза отмечены!': ('The eyes are marked!', 'Olhos marcados!', 'Die Augen sind markiert!'),
  '<button class="chip" id="ptEyesAgain">↩ Заново</button>': ('<button class="chip" id="ptEyesAgain">↩ Again</button>', '<button class="chip" id="ptEyesAgain">↩ De novo</button>', '<button class="chip" id="ptEyesAgain">↩ Nochmal</button>'),
  'А теперь нажмите, где рот.': ('Now tap where the mouth is.', 'Agora toque onde está a boca.', 'Jetzt tippen Sie, wo der Mund ist.'),
  'Рот отмечен!': ('The mouth is marked!', 'Boca marcada!', 'Der Mund ist markiert!'),
  'Нажмите, где рот.': ('Tap where the mouth is.', 'Toque onde está a boca.', 'Tippen Sie, wo der Mund ist.'),
  'Готово! Если нужно, поправьте волосы, очки или цвета — чтобы было похоже.': ('Done! If you like, change the hair, glasses or colours to make it look more alike.', 'Pronto! Se quiser, ajuste o cabelo, os óculos ou as cores para ficar mais parecido.', 'Fertig! Wenn Sie möchten, ändern Sie Haare, Brille oder Farben, damit es ähnlicher wird.'),
  'Вот портрет! Поправьте, чтобы было похоже.': ('Here is the portrait! Adjust it to look alike.', 'Aqui está o retrato! Ajuste-o para ficar parecido.', 'Hier ist das Porträt! Passen Sie es an, damit es ähnlich wird.'),
  'Выберите, чтобы было похоже.': ('Choose to make it look alike.', 'Escolha para ficar parecido.', 'Wählen Sie, damit es ähnlich wird.'),
  'Короткие': ('Short', 'Curto', 'Kurz'), 'Кудри': ('Curls', 'Caracóis', 'Locken'), 'Чёлка набок': ('Side fringe', 'Franja de lado', 'Seitenpony'),
  'Каре': ('Bob', 'Bob', 'Bob'), 'Длинные': ('Long', 'Comprido', 'Lang'), 'Пучок': ('Bun', 'Carrapito', 'Dutt'),
  'Лысинка': ('Bald patch', 'Careca no topo', 'Halbglatze'), 'Без волос': ('No hair', 'Sem cabelo', 'Keine Haare'),
  'Круглое': ('Round', 'Redondo', 'Rund'), 'Вытянутое': ('Long', 'Alongado', 'Länglich'), 'Широкое': ('Wide', 'Largo', 'Breit'),
  'Без очков': ('No glasses', 'Sem óculos', 'Ohne Brille'), '👓 Круглые': ('👓 Round', '👓 Redondos', '👓 Rund'), '🕶 Квадратные': ('🕶 Square', '🕶 Quadrados', '🕶 Eckig'),
  'Без усов': ('No moustache', 'Sem bigode', 'Ohne Bart'), 'Усы': ('Moustache', 'Bigode', 'Schnurrbart'), 'Борода': ('Beard', 'Barba', 'Vollbart'), 'Щетина': ('Stubble', 'Barba por fazer', 'Stoppeln'),
  'Без серёжек': ('No earrings', 'Sem brincos', 'Ohne Ohrringe'), 'Серёжки': ('Earrings', 'Brincos', 'Ohrringe'),
  'Без морщинок': ('No smile lines', 'Sem rugas', 'Ohne Fältchen'), 'Морщинки-лучики': ('Smile lines', 'Ruguinhas do sorriso', 'Lachfältchen'),
  '<button class="chip" id="ptPhoto">📷 По фото</button>': ('<button class="chip" id="ptPhoto">📷 From a photo</button>', '<button class="chip" id="ptPhoto">📷 Pela fotografia</button>', '<button class="chip" id="ptPhoto">📷 Nach Foto</button>'),
  '<button class="chip" id="ptDel">🗑 Убрать портрет</button>': ('<button class="chip" id="ptDel">🗑 Remove portrait</button>', '<button class="chip" id="ptDel">🗑 Tirar o retrato</button>', '<button class="chip" id="ptDel">🗑 Porträt entfernen</button>'),
  'Портрет сохранён! Теперь {0} видно везде в игре.': ('Portrait saved! Now {0} can be seen everywhere in the game.', 'Retrato guardado! Agora {0} aparece em todo o jogo.', 'Porträt gespeichert! Jetzt sieht man {0} überall im Spiel.'),
  'Доброе утро!': ('Good morning!', 'Bom dia!', 'Guten Morgen!'), 'Скучаю по тебе!': ('I miss you!', 'Tenho saudades tuas!', 'Ich vermisse dich!'),
  'Горжусь тобой!': ("I'm proud of you!", 'Tenho orgulho em ti!', 'Ich bin stolz auf dich!'), 'Обнимаю крепко!': ('Big hugs!', 'Um abraço apertado!', 'Ich drück dich ganz fest!'),
  'Скоро увидимся!': ('See you soon!', 'Até breve!', 'Bis bald!'), 'Спокойной ночи!': ('Good night!', 'Boa noite!', 'Gute Nacht!'),
  # the three steps of the maker
  '<p class="ty-h">Сделаем рисованный портрет — похожий, но нарисованный.</p>\n        <p class="ty-p">Снимите лицо прямо, при дневном свете. Фото нужно только на минутку: по нему игра возьмёт цвет волос, кожи и глаз и форму лица.</p>\n        <div class="ty-pick"><button class="big" id="ptShoot">📷 Сфотографировать</button><button class="big ghost" id="ptFile">🖼️ Выбрать фото</button><button class="chip" id="ptNo">✏️ Нарисовать без фото</button></div>\n        <p class="ty-small">🔒 Фото не покидает телефон и не сохраняется: как только портрет нарисован, фото стирается. Остаётся только рисунок.</p>': tuple(
    f'<p class="ty-h">{a}</p>\n        <p class="ty-p">{b}</p>\n        <div class="ty-pick"><button class="big" id="ptShoot">📷 {c}</button><button class="big ghost" id="ptFile">🖼️ {d}</button><button class="chip" id="ptNo">✏️ {e}</button></div>\n        <p class="ty-small">🔒 {f}</p>' for a, b, c, d, e, f in [
      ("Let's make a drawn portrait — alike, but drawn.", 'Take the face straight on, in daylight. The photo is needed only for a minute: the game takes the colour of the hair, skin and eyes and the shape of the face from it.', 'Take a photo', 'Choose a photo', 'Draw without a photo', "The photo never leaves the phone and isn't kept: as soon as the portrait is drawn, the photo is erased. Only the drawing stays."),
      ('Vamos fazer um retrato desenhado — parecido, mas desenhado.', 'Fotografe o rosto de frente, com luz do dia. A fotografia só é precisa por um minuto: o jogo tira dela a cor do cabelo, da pele e dos olhos e a forma do rosto.', 'Tirar fotografia', 'Escolher fotografia', 'Desenhar sem fotografia', 'A fotografia não sai do telemóvel e não é guardada: assim que o retrato fica desenhado, a fotografia é apagada. Fica só o desenho.'),
      ('Wir machen ein gezeichnetes Porträt – ähnlich, aber gezeichnet.', 'Fotografieren Sie das Gesicht von vorn, bei Tageslicht. Das Foto wird nur kurz gebraucht: Das Spiel nimmt daraus die Farbe von Haaren, Haut und Augen und die Form des Gesichts.', 'Foto machen', 'Foto auswählen', 'Ohne Foto zeichnen', 'Das Foto verlässt das Handy nicht und wird nicht gespeichert: Sobald das Porträt gezeichnet ist, wird das Foto gelöscht. Nur die Zeichnung bleibt.')]),
  '<p class="ty-h">Подвиньте фото пальцем, чтобы лицо было в овале.</p>\n        <label class="ty-sl">🔍 Размер <input type="range" id="ptZ" min="1" max="4" step=".05" value="{0}"></label>\n        <div class="prow-btns ty-row"><button class="chip" id="ptAgain">📷 Другое фото</button><button class="big" id="ptNext">Дальше →</button></div>': tuple(
    f'<p class="ty-h">{a}</p>\n        <label class="ty-sl">🔍 {b} <input type="range" id="ptZ" min="1" max="4" step=".05" value="{{0}}"></label>\n        <div class="prow-btns ty-row"><button class="chip" id="ptAgain">📷 {c}</button><button class="big" id="ptNext">{d} →</button></div>' for a, b, c, d in [
      ('Move the photo with your finger so the face is inside the oval.', 'Size', 'Another photo', 'Next'),
      ('Mova a fotografia com o dedo para o rosto ficar dentro da oval.', 'Tamanho', 'Outra fotografia', 'Seguinte'),
      ('Schieben Sie das Foto mit dem Finger, bis das Gesicht im Oval ist.', 'Größe', 'Anderes Foto', 'Weiter')]),
  P1 + '{1}<button class="big" id="ptNext" {2}>Дальше →</button></div>': tuple(P1 + '{1}<button class="big" id="ptNext" {2}>' + x + ' →</button></div>' for x in ('Next', 'Seguinte', 'Weiter')),
  P1 + '<button class="big" id="ptNext" {1}>🎨 Нарисовать</button></div>': tuple(P1 + '<button class="big" id="ptNext" {1}>🎨 ' + x + '</button></div>' for x in ('Draw', 'Desenhar', 'Zeichnen')),
}
PARTS = '<p class="ty-h">{0}</p>\n        <h3 class="pt-s">Волосы</h3>{1}\n        {2}\n        <h3 class="pt-s">Лицо и глаза</h3>{3}{4}\n        {5}\n        <h3 class="pt-s">Очки, усы, борода</h3>{6}\n        {7}\n        {8}{9}\n        <h3 class="pt-s">Кофта</h3>{10}\n        <div class="prow-btns ty-row">{11}{12}<button class="big" id="ptSave">✅ Сохранить</button></div>\n        <p class="ty-small">🔒 Сохраняется только рисунок. Фото не сохраняется и никуда не отправляется.</p>'
def parts(h, f, g, t, s, n):
    return PARTS.replace('Волосы', h).replace('Лицо и глаза', f).replace('Очки, усы, борода', g).replace('Кофта', t).replace('Сохранить', s).replace('Сохраняется только рисунок. Фото не сохраняется и никуда не отправляется.', n)
W[PARTS] = (parts('Hair', 'Face and eyes', 'Glasses, moustache, beard', 'Jumper', 'Save', 'Only the drawing is kept. The photo is not kept and is sent nowhere.'),
            parts('Cabelo', 'Rosto e olhos', 'Óculos, bigode, barba', 'Camisola', 'Guardar', 'Só o desenho fica guardado. A fotografia não é guardada nem enviada para lado nenhum.'),
            parts('Haare', 'Gesicht und Augen', 'Brille, Schnurrbart, Bart', 'Pulli', 'Speichern', 'Nur die Zeichnung wird gespeichert. Das Foto wird nicht gespeichert und nirgendwohin geschickt.'))

# templates that changed: built from their last translation
def last(L, g, needle, n_ph):
    c = [v for k, v in TB[L].get(g, {}).items() if needle in k and len(set(re.findall(r'\{\d+\}', k))) == n_ph]
    assert c, (L, g); return c[-1]
renum = lambda t, m: re.sub(r'\{(\d+)\}', lambda x: '{%d}' % m[int(x.group(1))], t)
TILES = {'en': ('How things are with {2}', 'Send a hello', 'Chess', 'A tale together', "The grandchildren's games", 'Choose a picture and the words. The game will show your hello with your portrait and read it aloud when your grandchild opens the game.'),
         'pt': ('Como estão {2}', 'Mandar um olá', 'Xadrez', 'Uma história juntos', 'Os jogos dos netos', 'Escolha uma imagem e as palavras. O jogo mostra o olá com o seu retrato e lê-o em voz alta quando o neto abrir o jogo.'),
         'de': ('Neues von {2}', 'Einen Gruß schicken', 'Schach', 'Ein Märchen zusammen', 'Spiele der Enkel', 'Wählen Sie ein Bild und die Worte. Das Spiel zeigt Ihren Gruß mit Ihrem Porträt und liest ihn vor, wenn Ihr Enkelkind das Spiel öffnet.')}
def guest(L):
    t = renum(last(L, 'screenGuest', 'g-hero', 13), {0: 0, 1: 1, 2: 3, 3: 4, 4: 7, 5: 8, 6: 9, 7: 10, 8: 11, 9: 12, 10: 13, 11: 14, 12: 15})
    k, h, c, ta, gm, lead = TILES[L]
    a = '<header class="g-hero">{0}<div><h1>{1}</h1></div></header>\n'
    assert t.count(a) == 1
    t = t.replace(a, f'''<header class="g-hero"><span id="gHeroFace">{{0}}</span><div><h1>{{1}}</h1></div></header>
    <div class="gh-tiles" id="ghTiles">
      <button class="gh-t" data-gt="gKidsH"><span class="emo">⭐</span><b id="ghKidsT">{k}</b></button>
      <button class="gh-t" data-gt="gHelloH"><span class="emo">💌</span><b>{h}</b></button>
      <button class="gh-t" data-gt="gChessH"><span class="emo">♟</span><b>{c}</b></button>
      <button class="gh-t" data-gt="tale"><span class="emo">📖</span><b>{ta}</b></button>
      <button class="gh-t" data-gt="gGamesH"><span class="emo">🎮</span><b>{gm}</b></button>
    </div>
''')
    a = '<div id="gHearts" class="g-hearts"></div></div>\n'
    assert t.count(a) == 1
    t = t.replace(a, a + f'''    <div class="fam-card gh-hello"><h2 class="fam-h" id="gHelloH">💌 {h}</h2><p class="lead">{lead}</p>
      <div class="gh-to" id="ghTo"></div>
      <div class="gh-st" id="ghSt">{{5}}</div>
      <div class="gh-ph" id="ghPh">{{6}}</div>
      <p class="fam-out" id="ghOut"></p></div>
''')
    for a, b in [('<h2 class="fam-h">🎮', '<h2 class="fam-h" id="gGamesH">🎮'), ('<div class="fam-card"><h2 class="fam-h">♟', None)]:
        if b: assert t.count(a) == 1; t = t.replace(a, b)
    # the second ♟ card is «Позвать сыграть» (the first is the invitations)
    i = t.index('<div class="fam-card"><h2 class="fam-h">♟'); j = t.index('<div class="fam-card"><h2 class="fam-h">♟', i + 5)
    t = t[:j] + '<div class="fam-card"><h2 class="fam-h" id="gChessH">♟' + t[j + len('<div class="fam-card"><h2 class="fam-h">♟'):]
    return t
def adult(L):
    t = renum(last(L, 'pultAdult', 'pv-ad', 11), {i: (i if i < 5 else i + 2) for i in range(11)})
    lab = {'en': 'Portrait', 'pt': 'Retrato', 'de': 'Porträt'}[L]
    a = '<div class="pv-acts">'; assert t.count(a) == 1
    return t.replace(a, a + f'<button class="chip" data-por="{{5}}" data-fam="{{6}}">🎨 {lab}</button>')
def cheer(L):
    t = renum(last(L, 'homeRelay', 'class="cheer"', 5), {i: i + 1 for i in range(5)}).replace('data-ch="{1}">', 'data-ch="{0}">{1}')
    return t
CYR = re.compile('[А-Яа-яЁё]'); n = 0
for g, keys in miss.items():
    if g in ('GAMES', 'LEARN_IMG', 'SND_HI'): continue
    for k in (keys if isinstance(keys, list) else list(keys)):
        if g == 'screenGuest': tr = (guest('en'), guest('pt'), guest('de'))
        elif g == 'pultAdult': tr = (adult('en'), adult('pt'), adult('de'))
        elif g == 'homeRelay': tr = (cheer('en'), cheer('pt'), cheer('de'))
        else: tr = W[k]
        for x in tr:
            assert not CYR.search(x), x[:200]
            assert sorted(re.findall(r'\{\d+\}', x)) == sorted(re.findall(r'\{\d+\}', k)), (g, x[:300])
        fixed.setdefault(g, {})[k] = list(tr[:2]); fde.setdefault(g, {})[k] = tr[2]; n += 1
json.dump(fixed, open(H + '/fixed.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
json.dump(fde, open(H + '/de/fixed_de.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('ok', n)
