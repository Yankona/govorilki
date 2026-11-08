# fun-create: translations for «Творим» made more fun — the exhibition of drawings, the xylophone concert, the museum
# passport. The new drawing menu is built from the old menu's translated cards (same buttons, new order and headings).
import json, os, re
H = os.path.dirname(os.path.abspath(__file__))
fixed = json.load(open(H + '/fixed.json', encoding='utf-8')); fde = json.load(open(H + '/de/fixed_de.json', encoding='utf-8'))
miss = json.load(open(H + '/out-en.html.missing.json', encoding='utf-8'))
TB = {l: json.load(open(H + f'/tables/{l}.json', encoding='utf-8')) for l in ('en', 'pt', 'de')}
W = {
  'Красиво! Нажми «Мой концерт» — и я сыграю всю твою мелодию.': ('Lovely! Press “My concert” and I will play your whole tune.', 'Que bonito! Carrega em «O meu concerto» e eu toco a tua melodia toda.', 'Schön! Drück auf „Mein Konzert“, dann spiele ich deine ganze Melodie.'),
  'Ура! Ты сыграла песенку!': ('Hooray! You played the song!', 'Viva! Tocaste a canção!', 'Hurra! Du hast das Lied gespielt!'),
  'Ура! Ты сыграл песенку!': ('Hooray! You played the song!', 'Viva! Tocaste a canção!', 'Hurra! Du hast das Lied gespielt!'),
  'А теперь послушай всю песенку целиком!': ('Now listen to the whole song!', 'Agora ouve a canção inteira!', 'Und jetzt hör dir das ganze Lied an!'),
  '<span>🎤 Концерт! Слушаем…</span>': ('<span>🎤 Concert time! Listen…</span>', '<span>🎤 Concerto! Vamos ouvir…</span>', '<span>🎤 Konzert! Wir hören zu…</span>'),
  '<span>👏 Браво! 👏</span>': ('<span>👏 Bravo! 👏</span>', '<span>👏 Bravo! 👏</span>', '<span>👏 Bravo! 👏</span>'),
  'Браво! Какой концерт!': ('Bravo! What a concert!', 'Bravo! Que concerto!', 'Bravo! Was für ein Konzert!'),
  'Браво! Вот это музыка!': ('Bravo! That is real music!', 'Bravo! Isto é que é música!', 'Bravo! Das ist Musik!'),
  'Ура! Зрители хлопают!': ('Hooray! Everyone is clapping!', 'Viva! O público está a aplaudir!', 'Hurra! Alle klatschen!'),
  # (the hint under the xylophone: the same words as the screen's own template, set in fixed.json)
  'Твоя выставка! Нажми на рисунок, чтобы посмотреть. Или нарисуем новый?': ('Your exhibition! Tap a drawing to look at it. Or shall we draw a new one?', 'A tua exposição! Toca num desenho para o veres. Ou fazemos um novo?', 'Deine Ausstellung! Tipp auf ein Bild, um es anzusehen. Oder malen wir ein neues?'),
  'Что будем рисовать? Чистый лист, волшебный узор или раскраску?': ('What shall we draw? A blank page, a magic pattern or a colouring page?', 'O que vamos desenhar? Uma folha em branco, um padrão mágico ou um desenho para colorir?', 'Was malen wir? Ein leeres Blatt, ein Zaubermuster oder ein Ausmalbild?'),
  'Зверята и игрушки': ('Animals and toys', 'Animais e brinquedos', 'Tiere und Spielsachen'),
  'Рисунок по заданию теперь на твоей выставке!': ('Your drawing is now in your exhibition!', 'O teu desenho já está na tua exposição!', 'Dein Bild hängt jetzt in deiner Ausstellung!'),
  'Какая красота! Рисунок теперь на твоей выставке.': ('How beautiful! Your drawing is now in your exhibition.', 'Que bonito! O desenho já está na tua exposição.', 'Wie schön! Dein Bild hängt jetzt in deiner Ausstellung.'),
  'штамп': ('stamp', 'carimbo', 'Stempel'), 'штампа': ('stamps', 'carimbos', 'Stempel'), 'штампов': ('stamps', 'carimbos', 'Stempel'),
  '<div class="fun-frame {0}"><img src="{1}" alt="Рисунок"></div>': ('<div class="fun-frame {0}"><img src="{1}" alt="Drawing"></div>', '<div class="fun-frame {0}"><img src="{1}" alt="Desenho"></div>', '<div class="fun-frame {0}"><img src="{1}" alt="Bild"></div>'),
  '<h2 class="sec-h">🖼️ Моя выставка</h2><div class="fun-show">{0}{1}</div>{2}': ('<h2 class="sec-h">🖼️ My exhibition</h2><div class="fun-show">{0}{1}</div>{2}', '<h2 class="sec-h">🖼️ A minha exposição</h2><div class="fun-show">{0}{1}</div>{2}', '<h2 class="sec-h">🖼️ Meine Ausstellung</h2><div class="fun-show">{0}{1}</div>{2}'),
  '<button class="fun-th" data-art="{0}" aria-label="Рисунок">{1}</button>': ('<button class="fun-th" data-art="{0}" aria-label="Drawing">{1}</button>', '<button class="fun-th" data-art="{0}" aria-label="Desenho">{1}</button>', '<button class="fun-th" data-art="{0}" aria-label="Bild">{1}</button>'),
  '<button class="fun-th fun-empty" data-m="free" aria-label="Нарисовать"><div class="fun-frame"><span>➕🎨</span></div></button>': ('<button class="fun-th fun-empty" data-m="free" aria-label="Draw"><div class="fun-frame"><span>➕🎨</span></div></button>', '<button class="fun-th fun-empty" data-m="free" aria-label="Desenhar"><div class="fun-frame"><span>➕🎨</span></div></button>', '<button class="fun-th fun-empty" data-m="free" aria-label="Malen"><div class="fun-frame"><span>➕🎨</span></div></button>'),
  '<p class="muted fun-hint">Нарисуй картину — и она повиснет здесь в золотой рамке!</p>': ('<p class="muted fun-hint">Draw a picture and it will hang here in a golden frame!</p>', '<p class="muted fun-hint">Faz um desenho e ele fica aqui pendurado numa moldura dourada!</p>', '<p class="muted fun-hint">Mal ein Bild, dann hängt es hier in einem goldenen Rahmen!</p>'),
  'Какие яркие цвета!': ('What bright colours!', 'Que cores tão vivas!', 'Was für leuchtende Farben!'),
  'Настоящая картина для музея!': ('A real picture for a museum!', 'Um verdadeiro quadro de museu!', 'Ein echtes Bild fürs Museum!'),
  'Мне очень нравится! Ты художник!': ('I love it! You are an artist!', 'Adoro! És um artista!', 'Das gefällt mir sehr! Du bist ein Künstler!'),
  'Красота! Повесим её на самое видное место.': ('Beautiful! Let’s hang it where everyone can see.', 'Que lindo! Vamos pendurá-lo onde todos o vejam.', 'Wunderschön! Wir hängen es dort auf, wo alle es sehen.'),
  'Вот это да! Сразу хочется рассматривать.': ('Wow! I want to keep looking at it.', 'Uau! Apetece ficar a olhar para ele.', 'Wow! Da möchte man gleich genau hinschauen.'),
  '<div class="fun-wall">{0}<p class="fun-plaque"><b>{1}</b>{2}<br><small>{3}</small></p></div>\n        {4}\n        <p class="fun-n">{5} / {6}</p>\n        <button class="big fun-close" data-v="x">⬅ Назад</button>':
    ('<div class="fun-wall">{0}<p class="fun-plaque"><b>{1}</b>{2}<br><small>{3}</small></p></div>\n        {4}\n        <p class="fun-n">{5} / {6}</p>\n        <button class="big fun-close" data-v="x">⬅ Back</button>',
     '<div class="fun-wall">{0}<p class="fun-plaque"><b>{1}</b>{2}<br><small>{3}</small></p></div>\n        {4}\n        <p class="fun-n">{5} / {6}</p>\n        <button class="big fun-close" data-v="x">⬅ Voltar</button>',
     '<div class="fun-wall">{0}<p class="fun-plaque"><b>{1}</b>{2}<br><small>{3}</small></p></div>\n        {4}\n        <p class="fun-n">{5} / {6}</p>\n        <button class="big fun-close" data-v="x">⬅ Zurück</button>'),
  '<button class="av-arr l" data-v="-1" aria-label="Предыдущий">‹</button><button class="av-arr r" data-v="1" aria-label="Следующий">›</button>':
    ('<button class="av-arr l" data-v="-1" aria-label="Previous">‹</button><button class="av-arr r" data-v="1" aria-label="Next">›</button>', '<button class="av-arr l" data-v="-1" aria-label="Anterior">‹</button><button class="av-arr r" data-v="1" aria-label="Seguinte">›</button>', '<button class="av-arr l" data-v="-1" aria-label="Zurück">‹</button><button class="av-arr r" data-v="1" aria-label="Weiter">›</button>'),
  '<b>Новый штамп в паспорте!</b>': ('<b>A new stamp in your passport!</b>', '<b>Um carimbo novo no passaporte!</b>', '<b>Ein neuer Stempel im Pass!</b>'),
  '<h2 class="art-h">🎟️ Мой музейный паспорт: {0}</h2>{1}': ('<h2 class="art-h">🎟️ My museum passport: {0}</h2>{1}', '<h2 class="art-h">🎟️ O meu passaporte de museus: {0}</h2>{1}', '<h2 class="art-h">🎟️ Mein Museumspass: {0}</h2>{1}'),
  '<p class="lead">Открой картину из любого музея — и в паспорте появится штамп этого музея.</p>': ('<p class="lead">Open a painting from any museum and that museum’s stamp will appear in your passport.</p>', '<p class="lead">Abre um quadro de qualquer museu e o carimbo desse museu aparece no teu passaporte.</p>', '<p class="lead">Öffne ein Bild aus einem Museum, dann kommt der Stempel dieses Museums in deinen Pass.</p>'),
}
HEADS = {'Рисуем': ('Let’s draw', 'Vamos desenhar', 'Wir malen'), 'С буквами и цифрами': ('With letters and numbers', 'Com letras e números', 'Mit Buchstaben und Zahlen')}
LI = {'en': 0, 'pt': 1, 'de': 2}
PH = re.compile(r'\{\d+\}')
def menu_tr(ru, lang):
    # the old menu's translated card for each data-m, its placeholders renumbered as in the new line
    old = [v for k, v in TB[lang]['screenDrawMenu'].items() if 'data-m="code-col"' in k and 'data-m="free"' in k][0]
    cards = {re.search(r'data-m="([^"]+)"', l).group(1): l for l in old.split('\n') if 'data-m="' in l}
    out = []
    for line in ru.split('\n'):
        m = re.search(r'data-m="([^"]+)"', line)
        if m:
            nums = PH.findall(line); it = iter(nums)
            t = PH.sub(lambda _: next(it), cards[m.group(1)]); assert len(PH.findall(t)) == len(nums), (m.group(1), lang)
            out.append(t)
        else:
            for h, tr in HEADS.items(): line = line.replace(f'>{h}<', f'>{tr[LI[lang]]}<')
            out.append(line)
    return '\n'.join(out)
CYR = re.compile('[А-Яа-яЁё]'); n = 0
for g, keys in miss.items():
    if g in ('GAMES', 'LEARN_IMG', 'SND_HI'): continue
    for k in keys:
        if k in W: tr = W[k]
        elif g == 'screenDrawMenu' and 'data-m="free"' in k: tr = tuple(menu_tr(k, l) for l in ('en', 'pt', 'de'))
        elif g == 'screenXylo' and 'id="xyCon"' in k:
            base = TB['en']['screenXylo']; old = {l: [v for kk, v in TB[l]['screenXylo'].items() if 'class="xylo"' in kk][0] for l in LI}
            con = {'en': ('My concert', 'New tune'), 'pt': ('O meu concerto', 'Nova melodia'), 'de': ('Mein Konzert', 'Neue Melodie')}
            tr = tuple(old[l].replace('</div>', f'</div>\n    <div class="xy-con" id="xyCon" hidden><button class="big" id="xyShow">🎤 {con[l][0]}</button><button class="ibtn" id="xyNew" aria-label="{con[l][1]}">🗑️</button></div>', 1) for l in ('en', 'pt', 'de'))
        elif g == 'screenMuseum' and 'art-cnt' in k:
            tr = []
            for l in ('en', 'pt', 'de'):
                old = [v for kk, v in TB[l]['screenMuseum'].items() if 'art-cnt' in kk][0]
                tr.append(re.sub(r'(\{7\}[^<]*)</p>', r'\1 · 🎟️ {8} {9}</p>', old))
            tr = tuple(tr)
        else: raise KeyError((g, k))
        assert not any(CYR.search(x) for x in tr), (k, tr)
        assert all(sorted(PH.findall(x)) == sorted(PH.findall(k)) for x in tr), (k, tr)
        fixed.setdefault(g, {})[k] = list(tr[:2]); fde.setdefault(g, {})[k] = tr[2]; n += 1
json.dump(fixed, open(H + '/fixed.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
json.dump(fde, open(H + '/de/fixed_de.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('ok', n)
