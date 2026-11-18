# my-book: «📚 Моя книга» — the card on the home screen, «Я почитал», the shelf, the report line, the switch in «День»
import json, os, re
H = os.path.dirname(os.path.abspath(__file__))
fixed = json.load(open(H + '/fixed.json', encoding='utf-8')); fde = json.load(open(H + '/de/fixed_de.json', encoding='utf-8'))
miss = json.load(open(H + '/out-en.html.missing.json', encoding='utf-8'))
TAB = {L: json.load(open(H + f'/tables/{L}.json', encoding='utf-8')) for L in ('en', 'pt', 'de')}
W = {
  'Ещё один день с книгой! Плюс три звёздочки. Читай с удовольствием.': ('One more day with a book! Plus three stars. Enjoy your reading.', 'Mais um dia com um livro! Mais três estrelas. Lê com gosto.', 'Noch ein Tag mit einem Buch! Drei Sterne dazu. Viel Spaß beim Lesen.'),
  '📚 Книга{0}, прочитано {1} {2} за неделю{3}': ('📚 Book{0}, {1} {2} read this week{3}', '📚 Livro{0}, {1} {2} lidas esta semana{3}', '📚 Buch{0}, {1} {2} gelesen diese Woche{3}'),
  'страница': ('page', 'página', 'Seite'), 'страницы': ('pages', 'páginas', 'Seiten'), 'страниц': ('pages', 'páginas', 'Seiten'), 'страницу': ('page', 'página', 'Seite'),
  ', {0} {1} подряд': (', {0} {1} in a row', ', {0} {1} seguidos', ', {0} {1} am Stück'),
  'глава': ('chapter', 'capítulo', 'Kapitel'), 'главы': ('chapters', 'capítulos', 'Kapitel'), 'глав': ('chapters', 'capítulos', 'Kapitel'), 'главу': ('chapter', 'capítulo', 'Kapitel'),
  ' · 🌙 перед сном': (' · 🌙 bedtime', ' · 🌙 antes de dormir', ' · 🌙 vor dem Schlafen'),
  '{0} {1} подряд': ('{0} {1} in a row', '{0} {1} seguidos', '{0} {1} am Stück'),
  'день': ('day', 'dia', 'Tag'), 'дня': ('days', 'dias', 'Tage'), 'дней': ('days', 'dias', 'Tage'),
  'начни серию': ('start a streak', 'começa uma série', 'starte eine Serie'),
  '✅ сегодня {0}': ('✅ today {0}', '✅ hoje {0}', '✅ heute {0}'),
  '{0} мин': ('{0} min', '{0} min', '{0} Min.'), 'мин': ('min', 'min', 'Min.'),
  'сегодня ещё нет': ('nothing yet today', 'hoje ainda nada', 'heute noch nichts'),
  '➕ Почитала ещё': ('➕ I read more', '➕ Li mais', '➕ Ich habe weitergelesen'), '➕ Почитал ещё': ('➕ I read more', '➕ Li mais', '➕ Ich habe weitergelesen'),
  '📖 Я почитала': ('📖 I read', '📖 Eu li', '📖 Ich habe gelesen'), '📖 Я почитал': ('📖 I read', '📖 Eu li', '📖 Ich habe gelesen'),
  'Я почитала': ('I read', 'Eu li', 'Ich habe gelesen'), 'Я почитал': ('I read', 'Eu li', 'Ich habe gelesen'),
  '📄 Страницы': ('📄 Pages', '📄 Páginas', '📄 Seiten'), '⏱️ Минуты': ('⏱️ Minutes', '⏱️ Minutos', '⏱️ Minuten'), '📑 Главы': ('📑 Chapters', '📑 Capítulos', '📑 Kapitel'),
  'так себе': ('so-so', 'mais ou menos', 'geht so'), 'хорошо': ('good', 'bom', 'gut'), 'очень': ('loved it', 'adorei', 'super'),
  'Я дочитала книгу!': ('I finished the book!', 'Acabei o livro!', 'Ich habe das Buch fertig!'), 'Я дочитал книгу!': ('I finished the book!', 'Acabei o livro!', 'Ich habe das Buch fertig!'),
  'Сколько страниц? Нажми плюс или выбери число.': ('How many pages? Press plus or pick a number.', 'Quantas páginas? Carrega no mais ou escolhe um número.', 'Wie viele Seiten? Drück auf Plus oder wähl eine Zahl.'),
  'Сколько минут ты читала?': ('How many minutes did you read?', 'Quantos minutos leste?', 'Wie viele Minuten hast du gelesen?'),
  'Сколько минут ты читал?': ('How many minutes did you read?', 'Quantos minutos leste?', 'Wie viele Minuten hast du gelesen?'),
  'Сколько глав?': ('How many chapters?', 'Quantos capítulos?', 'Wie viele Kapitel?'),
  'Спокойной ночи!': ('Good night!', 'Boa noite!', 'Gute Nacht!'), ' Спокойной ночи!': (' Good night!', ' Boa noite!', ' Gute Nacht!'),
  '🌙 Спокойной ночи': ('🌙 Good night', '🌙 Boa noite', '🌙 Gute Nacht'),
  'Записано!': ('Saved!', 'Registado!', 'Eingetragen!'), 'Записано': ('Saved', 'Registado', 'Eingetragen'),
  'Ура!': ('Hooray!', 'Viva!', 'Hurra!'),
  'Молодец. {0} Спокойной ночи!': ('Well done. {0} Good night!', 'Muito bem. {0} Boa noite!', 'Gut gemacht. {0} Gute Nacht!'),
  '{0} {1} подряд с книгой.': ('{0} {1} in a row with a book.', '{0} {1} seguidos com um livro.', '{0} {1} am Stück mit einem Buch.'),
  'Плюс три звёздочки! ': ('Plus three stars! ', 'Mais três estrelas! ', 'Drei Sterne dazu! '),
  'Уже {0} {1} подряд с книгой!': ('Already {0} {1} in a row with a book!', 'Já são {0} {1} seguidos com um livro!', 'Schon {0} {1} am Stück mit einem Buch!'),
  'Читай с удовольствием!': ('Enjoy your reading!', 'Lê com gosto!', 'Viel Spaß beim Lesen!'),
  'Ты дочитала': ('Did you finish', 'Acabaste', 'Hast du fertig gelesen:'), 'Ты дочитал': ('Did you finish', 'Acabaste', 'Hast du fertig gelesen:'),
  'дочитала': ('finished', 'acabei', 'fertig'), 'дочитал': ('finished', 'acabei', 'fertig'),
  'Дочитала': ('Finished', 'Acabei', 'Fertig'), 'Дочитал': ('Finished', 'Acabei', 'Fertig'),
  'Книга прочитана?': ('Finished the book?', 'Livro acabado?', 'Buch fertig?'), 'Книга прочитана': ('Book finished', 'Livro acabado', 'Buch fertig'),
  'Ура! Книга «{0}» прочитана! Плюс {1} {2}.{3}': ('Hooray! You finished «{0}»! Plus {1} {2}.{3}', 'Viva! Acabaste «{0}»! Mais {1} {2}.{3}', 'Hurra! Du hast «{0}» fertig gelesen! {1} {2} dazu.{3}'),
  'звёздочка': ('star', 'estrela', 'Stern'), 'звёздочки': ('stars', 'estrelas', 'Sterne'), 'звёздочек': ('stars', 'estrelas', 'Sterne'),
  'Какую книгу читаешь?': ('Which book are you reading?', 'Que livro estás a ler?', 'Welches Buch liest du?'),
  'Читаем: {0}. Отмечай каждый вечер, сколько {1}.': ('Reading now: {0}. Every evening, mark how much you have {1}.', 'A ler: {0}. Todas as noites, marca quanto {1}.', 'Wir lesen: {0}. Trag jeden Abend ein, wie viel du {1} hast.'),
  'прочитала': ('read', 'leste', 'gelesen'), 'прочитал': ('read', 'leste', 'gelesen'),
  ' из {0}': (' of {0}', ' de {0}', ' von {0}'),
  'Здесь будут книги, которые ты дочитала.': ('The books you have finished will stand here.', 'Aqui vão ficar os livros que acabaste.', 'Hier stehen die Bücher, die du fertig gelesen hast.'),
  'Здесь будут книги, которые ты дочитал.': ('The books you have finished will stand here.', 'Aqui vão ficar os livros que acabaste.', 'Hier stehen die Bücher, die du fertig gelesen hast.'),
}
# pieces of the HTML templates
F = {
  '💡 Если хотите помочь — одна идея': ('💡 If you would like to help — one idea', '💡 Se quiserem ajudar — uma ideia', '💡 Wenn Sie helfen möchten — eine Idee'),
  '📚 Моя книга': ('📚 My book', '📚 O meu livro', '📚 Mein Buch'), 'Моя книга:': ('My book:', 'O meu livro:', 'Mein Buch:'),
  'Какую книгу ты читаешь?': ('Which book are you reading?', 'Que livro estás a ler?', 'Welches Buch liest du?'),
  '📖 Выбрать книгу': ('📖 Choose a book', '📖 Escolher um livro', '📖 Buch auswählen'),
  'из': ('of', 'de', 'von'), 'прочитано': ('read:', 'lido:', 'gelesen:'),
  'отмечай, сколько прочитано': ('mark how much you have read', 'marca quanto leste', 'trag ein, wie viel du gelesen hast'),
  'Тихо почитай перед сном. Спокойной ночи!': ('Read quietly before sleep. Good night!', 'Lê baixinho antes de dormir. Boa noite!', 'Lies leise vor dem Schlafen. Gute Nacht!'),
  'Закрыть': ('Close', 'Fechar', 'Schließen'), 'Меньше': ('Less', 'Menos', 'Weniger'), 'Больше': ('More', 'Mais', 'Mehr'),
  'Понравилось?': ('Did you like it?', 'Gostaste?', 'Hat es dir gefallen?'), 'О чём было?': ('What was it about?', 'De que se tratava?', 'Worum ging es?'),
  '(можно не писать)': ('(you can skip this)', '(podes não escrever)', '(kannst du weglassen)'), 'одной строчкой': ('in one line', 'numa linha', 'in einer Zeile'),
  'Эта строчка остаётся только на этом телефоне.': ('This line stays only on this phone.', 'Esta linha fica só neste telemóvel.', 'Diese Zeile bleibt nur auf diesem Handy.'),
  'Записать': ('Save', 'Registar', 'Eintragen'), 'Сказать голосом': ('Say it aloud', 'Dizer em voz alta', 'Laut sagen'),
  'подряд с книгой': ('in a row with a book', 'seguidos com um livro', 'am Stück mit einem Buch'),
  'Книга уйдёт в «Мой книжный шкаф».': ('The book will go to «My bookcase».', 'O livro vai para «A minha estante».', 'Das Buch kommt in «Mein Bücherregal».'),
  'Да,': ('Yes,', 'Sim,', 'Ja,'), 'Ещё читаю': ('Still reading', 'Ainda estou a ler', 'Ich lese noch'),
  'Книга прочитана!': ('Book finished!', 'Livro acabado!', 'Buch fertig!'),
  'Теперь она в «Моём книжном шкафу». Какую книгу читаем дальше?': ('Now it is in «My bookcase». Which book shall we read next?', 'Agora está na «Minha estante». Que livro lemos a seguir?', 'Jetzt steht es in «Mein Bücherregal». Welches Buch lesen wir als Nächstes?'),
  '📚 Выбрать следующую': ('📚 Choose the next one', '📚 Escolher o próximo', '📚 Das nächste auswählen'),
  'Новая наклейка!': ('New sticker!', 'Autocolante novo!', 'Neuer Sticker!'),
  'Какую книгу читаешь?': ('Which book are you reading?', 'Que livro estás a ler?', 'Welches Buch liest du?'),
  'Или своя книга': ('Or your own book', 'Ou um livro teu', 'Oder ein eigenes Buch'), 'Название': ('Title', 'Título', 'Titel'),
  'Автор (можно не писать)': ('Author (you can skip this)', 'Autor (podes não escrever)', 'Autor (kannst du weglassen)'),
  'Сколько страниц в книге (можно не писать)': ('How many pages in the book (you can skip this)', 'Quantas páginas tem o livro (podes não escrever)', 'Wie viele Seiten hat das Buch (kannst du weglassen)'),
  'Читаю эту книгу': ('I am reading this book', 'Estou a ler este livro', 'Ich lese dieses Buch'),
  '🔄 Другая книга': ('🔄 Another book', '🔄 Outro livro', '🔄 Anderes Buch'), '🗄️ Мой книжный шкаф': ('🗄️ My bookcase', '🗄️ A minha estante', '🗄️ Mein Bücherregal'),
  'Книга пока не выбрана.': ('No book chosen yet.', 'Ainda não escolheste um livro.', 'Noch kein Buch ausgewählt.'),
  'Здесь будут книги, которые ты': ('The books you have', 'Aqui vão ficar os livros que', 'Hier stehen die Bücher, die du'),
}
# the SIMPLE and GUIDE templates: the old translation plus the new line, the placeholders moved on
BOOKSW = {'en': '<label class="sw" for="sdBook"><input id="sdBook" type="checkbox" {3}><span class="set-t"><b>📚 My book</b><small>a card of its own on the home screen: which book and how much is read; it can be marked at any time, in the evening too — it never holds up the path</small></span></label>',
  'pt': '<label class="sw" for="sdBook"><input id="sdBook" type="checkbox" {3}><span class="set-t"><b>📚 O meu livro</b><small>um cartão próprio no ecrã inicial: que livro e quanto foi lido; pode ser marcado a qualquer hora, também à noite — não prende o trilho</small></span></label>',
  'de': '<label class="sw" for="sdBook"><input id="sdBook" type="checkbox" {3}><span class="set-t"><b>📚 Mein Buch</b><small>eine eigene Karte auf dem Startbildschirm: welches Buch und wie viel gelesen ist; jederzeit eintragbar, auch abends — der Pfad wartet nie darauf</small></span></label>'}
shift = lambda t, frm: re.sub(r'\{(\d+)\}', lambda m: '{%d}' % (int(m.group(1)) + 1 if int(m.group(1)) >= frm else int(m.group(1))), t)
def tmpl(k, i):
    L = ('en', 'pt', 'de')[i]
    if k.startswith('<h2>🗺️ День</h2>{0}'):
        old = next(v for kk, v in TAB[L]['SIMPLE'].items() if kk.startswith('<h2>🗺️ День</h2>{0}') and 'sdBook' not in kk)
        a, b = old.split('<div class="sd-must">{2}</div>\n')
        return a + '<div class="sd-must">{2}</div>\n      ' + BOOKSW[L] + '\n' + shift(b, 3)
    out = k
    for ru in sorted(F, key=len, reverse=True):
        out = re.sub(r'(?<=[>"\s(])' + re.escape(ru) + r'(?=[<"\s.:!?)]|$)', F[ru][i], out) if ru in ('из', 'Да,') else out.replace(ru, F[ru][i])
    return out
CYR = re.compile('[А-Яа-яЁё]'); n = 0
for g, keys in miss.items():
    if g in ('GAMES', 'LEARN_IMG', 'SND_HI'): continue
    for k in (keys if isinstance(keys, list) else list(keys)):
        tr = W[k] if k in W else tuple(tmpl(k, i) for i in range(3))
        assert not any(CYR.search(x) for x in tr), (k, tr)
        assert all(sorted(re.findall(r'\{\d+\}', x)) == sorted(re.findall(r'\{\d+\}', k)) for x in tr), (k, tr)
        fixed.setdefault(g, {})[k] = list(tr[:2]); fde.setdefault(g, {})[k] = tr[2]; n += 1
json.dump(fixed, open(H + '/fixed.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
json.dump(fde, open(H + '/de/fixed_de.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('ok', n)
