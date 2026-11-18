# parent-focus: «Что важно для вашего ребёнка?», the 1-minute sound check, the week as «N of 7»
import json, os, re
H = os.path.dirname(os.path.abspath(__file__))
fixed = json.load(open(H + '/fixed.json', encoding='utf-8')); fde = json.load(open(H + '/de/fixed_de.json', encoding='utf-8'))
miss = json.load(open(H + '/out-en.html.missing.json', encoding='utf-8'))
T = {L: json.load(open(H + f'/tables/{L}.json', encoding='utf-8')) for L in ('en', 'pt', 'de')}
W = {
  'Что важно': ('What matters', 'O que importa', 'Was wichtig ist'),
  'логопедия, чтение, математика — от вашего выбора': ('speech therapy, reading, maths — your choice', 'terapia da fala, leitura, matemática — à vossa escolha', 'Sprachtherapie, Lesen, Mathe — nach Ihrer Wahl'),
  'Чтение': ('Reading', 'Leitura', 'Lesen'), 'Математика': ('Maths', 'Matemática', 'Mathe'), 'Шахматы': ('Chess', 'Xadrez', 'Schach'), 'Рисование': ('Drawing', 'Desenho', 'Malen'),
  'до 10': ('up to 10', 'até 10', 'bis zu 10'),
  'нужна': ('needed', 'necessária', 'nötig'), 'не нужна': ('not needed', 'não é necessária', 'nicht nötig'),
  'нужна по проверке': ('needed after the check', 'necessária segundo o teste', 'laut Check nötig'),
  'по проверке в норме': ('normal after the check', 'normal segundo o teste', 'laut Check normal'),
  'не проверяли': ('not checked yet', 'ainda não testada', 'noch nicht geprüft'),
  '{0}: {1} из 7 дней': ('{0}: {1} of 7 days', '{0}: {1} de 7 dias', '{0}: {1} von 7 Tagen'),
  'Логопедия: {0} из 7 дней': ('Speech therapy: {0} of 7 days', 'Terapia da fala: {0} de 7 dias', 'Sprachtherapie: {0} von 7 Tagen'),
  '<div class="gd-fo"><h3 class="gd-s">🎯 Главное</h3><p>{0}логопедия: {1}</p>{2}<p class="muted">Занимались {3} из 7 последних дней.</p></div>':
    ('<div class="gd-fo"><h3 class="gd-s">🎯 Main focus</h3><p>{0}speech therapy: {1}</p>{2}<p class="muted">Played on {3} of the last 7 days.</p></div>',
     '<div class="gd-fo"><h3 class="gd-s">🎯 O principal</h3><p>{0}terapia da fala: {1}</p>{2}<p class="muted">Praticou em {3} dos últimos 7 dias.</p></div>',
     '<div class="gd-fo"><h3 class="gd-s">🎯 Das Wichtigste</h3><p>{0}Sprachtherapie: {1}</p>{2}<p class="muted">Geübt an {3} der letzten 7 Tage.</p></div>'),
  'ребёнка': ('your child', 'a criança', 'Ihr Kind'),
  'Логопедических заданий в дне нет. Игры со звуками остаются в «Все игры».': ('No speech therapy tasks in the day. The sound games stay in «All games».', 'Sem tarefas de terapia da fala no dia. Os jogos de sons continuam em «Todos os jogos».', 'Keine Sprachtherapie-Aufgaben im Tag. Die Laut-Spiele bleiben unter «Alle Spiele».'),
  'Каждый день короткий блок {0} мин: разминка и игры со звуком, цель — не меньше {1} попыток. Это часть дня, а не сверху.':
    ('Every day a short block of {0} min: a warm-up and sound games, aiming for at least {1} tries. It is part of the day, not on top of it.',
     'Todos os dias um bloco curto de {0} min: aquecimento e jogos com o som, com o objetivo de pelo menos {1} tentativas. Faz parte do dia, não é a mais.',
     'Jeden Tag ein kurzer Block von {0} Min.: Aufwärmen und Laut-Spiele, Ziel: mindestens {1} Versuche. Er ist Teil des Tages, nicht zusätzlich.'),
  'Проверка {0}: {1}. Короткий блок логопедии включён ({2} мин, {3}+ попыток).': ('Check {0}: {1}. A short speech therapy block is on ({2} min, {3}+ tries).', 'Teste {0}: {1}. Um bloco curto de terapia da fala está ligado ({2} min, {3}+ tentativas).', 'Check {0}: {1}. Ein kurzer Sprachtherapie-Block ist an ({2} Min., {3}+ Versuche).'),
  'отстают звуки ': ('sounds behind the norm: ', 'sons atrasados: ', 'Laute hinter der Norm: '),
  'речь трудно понять': ('speech is hard to understand', 'a fala é difícil de compreender', 'die Sprache ist schwer zu verstehen'),
  'Проверка {0}: звуки по возрасту в норме — логопедии в дне нет.': ('Check {0}: the sounds are normal for the age — no speech therapy in the day.', 'Teste {0}: os sons estão normais para a idade — sem terapia da fala no dia.', 'Check {0}: die Laute sind altersgerecht — keine Sprachtherapie im Tag.'),
  'Пока без логопедии. Проверьте звуки за минуту — игра сравнит их с нормой возраста.': ('No speech therapy for now. Check the sounds in one minute — the game compares them with the norm for the age.', 'Por agora sem terapia da fala. Testem os sons num minuto — o jogo compara-os com a norma da idade.', 'Vorerst ohne Sprachtherapie. Prüfen Sie die Laute in einer Minute — das Spiel vergleicht sie mit der Altersnorm.'),
  '<h2>🎯 Что важно для вашего ребёнка?</h2>\n      <p class="sd-note">Говорилки строят день от вашего выбора. Главное получает больше времени, остальное (рисование, шахматы, счёты) остаётся каждый день, понемногу.</p>\n      <h3 class="fam-s">Логопедия</h3>\n      <div class="sd-seg" id="foSp">{0}</div>\n      <p class="sd-note" id="foSpN">{1}</p>\n      {2}\n      {3}\n      <h3 class="fam-s">Главное сейчас</h3>\n      <div class="sd-seg" id="foSubj">{4}</div>\n      <p class="sd-note">День для {5} {6}: {7}–{8} минут, одна игра — {9} мин. Сейчас в дне ≈ <b id="foMin">{10}</b> мин{11}.</p>':
    ('<h2>🎯 What matters for your child?</h2>\n      <p class="sd-note">Govorilki builds the day from your choice. The main thing gets more time; the rest (drawing, chess, the abacus) stays every day, a little.</p>\n      <h3 class="fam-s">Speech therapy</h3>\n      <div class="sd-seg" id="foSp">{0}</div>\n      <p class="sd-note" id="foSpN">{1}</p>\n      {2}\n      {3}\n      <h3 class="fam-s">The main thing now</h3>\n      <div class="sd-seg" id="foSubj">{4}</div>\n      <p class="sd-note">A day at {5} {6}: {7}–{8} minutes, one game — {9} min. The day now ≈ <b id="foMin">{10}</b> min{11}.</p>',
     '<h2>🎯 O que é importante para a vossa criança?</h2>\n      <p class="sd-note">O Govorilki constrói o dia a partir da vossa escolha. O principal tem mais tempo; o resto (desenho, xadrez, ábaco) fica todos os dias, um pouco.</p>\n      <h3 class="fam-s">Terapia da fala</h3>\n      <div class="sd-seg" id="foSp">{0}</div>\n      <p class="sd-note" id="foSpN">{1}</p>\n      {2}\n      {3}\n      <h3 class="fam-s">O principal agora</h3>\n      <div class="sd-seg" id="foSubj">{4}</div>\n      <p class="sd-note">Um dia aos {5} {6}: {7}–{8} minutos, um jogo — {9} min. O dia agora ≈ <b id="foMin">{10}</b> min{11}.</p>',
     '<h2>🎯 Was ist für Ihr Kind wichtig?</h2>\n      <p class="sd-note">Govorilki baut den Tag nach Ihrer Wahl. Das Wichtigste bekommt mehr Zeit; der Rest (Malen, Schach, Abakus) bleibt jeden Tag, ein bisschen.</p>\n      <h3 class="fam-s">Sprachtherapie</h3>\n      <div class="sd-seg" id="foSp">{0}</div>\n      <p class="sd-note" id="foSpN">{1}</p>\n      {2}\n      {3}\n      <h3 class="fam-s">Das Wichtigste jetzt</h3>\n      <div class="sd-seg" id="foSubj">{4}</div>\n      <p class="sd-note">Ein Tag mit {5} {6}: {7}–{8} Minuten, ein Spiel — {9} Min. Der Tag jetzt ≈ <b id="foMin">{10}</b> Min.{11}.</p>'),
  'Нужна': ('Needed', 'Necessária', 'Nötig'), 'Не нужна': ('Not needed', 'Não é necessária', 'Nicht nötig'), 'Не знаю': ("Don't know", 'Não sei', 'Weiß nicht'),
  'Проверить звуки ещё раз': ('Check the sounds again', 'Testar os sons outra vez', 'Laute nochmal prüfen'),
  'Проверить звуки (1 минута)': ('Check the sounds (1 minute)', 'Testar os sons (1 minuto)', 'Laute prüfen (1 Minute)'),
  '<p class="sd-note">⚠️ Советуем показать ребёнка логопеду: игра поддержит занятия, но не заменит специалиста.</p>':
    ('<p class="sd-note">⚠️ We suggest seeing a speech therapist: the game supports the practice but does not replace a specialist.</p>',
     '<p class="sd-note">⚠️ Sugerimos mostrar a criança a um terapeuta da fala: o jogo apoia a prática, mas não substitui um especialista.</p>',
     '<p class="sd-note">⚠️ Wir empfehlen, das Kind einer Logopädin zu zeigen: das Spiel unterstützt das Üben, ersetzt aber keine Fachperson.</p>'),
  'год': ('year', 'ano', 'Jahr'), 'года': ('years', 'anos', 'Jahren'), 'лет': ('years', 'anos', 'Jahren'),
  ', из них логопедия ≈ ': (', speech therapy ≈ ', ', terapia da fala ≈ ', ', davon Sprachtherapie ≈ '),
  ' мин': (' min', ' min', ' Min.'),
  '<h2>🩺 Звуки за минуту</h2>\n      <p class="sd-note">Отметьте, как ребёнок говорит сейчас, в обычной речи. Это не диагноз: игра сравнит ответы с возрастной нормой ({0} {1}).</p>\n      {2}\n      <div class="fo-row"><span><b>Чужие люди понимают речь ребёнка?</b></span><span class="sd-seg" id="foIntel"><button class="chip sel" data-v="1">Да</button><button class="chip" data-v="0">Плохо</button></span></div>\n      <button class="big" id="foDone">Готово</button>':
    ('<h2>🩺 Sounds in a minute</h2>\n      <p class="sd-note">Mark how your child speaks now, in everyday talk. This is not a diagnosis: the game compares the answers with the norm for the age ({0} {1}).</p>\n      {2}\n      <div class="fo-row"><span><b>Do strangers understand your child?</b></span><span class="sd-seg" id="foIntel"><button class="chip sel" data-v="1">Yes</button><button class="chip" data-v="0">Hardly</button></span></div>\n      <button class="big" id="foDone">Done</button>',
     '<h2>🩺 Sons num minuto</h2>\n      <p class="sd-note">Marquem como a criança fala agora, no dia a dia. Não é um diagnóstico: o jogo compara as respostas com a norma da idade ({0} {1}).</p>\n      {2}\n      <div class="fo-row"><span><b>Pessoas de fora percebem a criança?</b></span><span class="sd-seg" id="foIntel"><button class="chip sel" data-v="1">Sim</button><button class="chip" data-v="0">Mal</button></span></div>\n      <button class="big" id="foDone">Pronto</button>',
     '<h2>🩺 Laute in einer Minute</h2>\n      <p class="sd-note">Markieren Sie, wie Ihr Kind jetzt im Alltag spricht. Das ist keine Diagnose: das Spiel vergleicht die Antworten mit der Altersnorm ({0} {1}).</p>\n      {2}\n      <div class="fo-row"><span><b>Verstehen Fremde Ihr Kind?</b></span><span class="sd-seg" id="foIntel"><button class="chip sel" data-v="1">Ja</button><button class="chip" data-v="0">Kaum</button></span></div>\n      <button class="big" id="foDone">Fertig</button>'),
  '<div class="fo-row"><span><b>{0}</b> <small>{1}</small></span>\n        <span class="sd-seg" data-l="{2}" data-g="{3}"><button class="chip sel" data-v="1">Чисто</button><button class="chip" data-v="0">Пока нет</button></span></div>':
    ('<div class="fo-row"><span><b>{0}</b> <small>{1}</small></span>\n        <span class="sd-seg" data-l="{2}" data-g="{3}"><button class="chip sel" data-v="1">Clear</button><button class="chip" data-v="0">Not yet</button></span></div>',
     '<div class="fo-row"><span><b>{0}</b> <small>{1}</small></span>\n        <span class="sd-seg" data-l="{2}" data-g="{3}"><button class="chip sel" data-v="1">Bem</button><button class="chip" data-v="0">Ainda não</button></span></div>',
     '<div class="fo-row"><span><b>{0}</b> <small>{1}</small></span>\n        <span class="sd-seg" data-l="{2}" data-g="{3}"><button class="chip sel" data-v="1">Sauber</button><button class="chip" data-v="0">Noch nicht</button></span></div>'),
}
# changed templates: the old translation with the week as «N of 7»
WK = {'en': ('My calendar: {0} of 7 days', '{0} of 7 days<small>this week</small>'), 'pt': ('O meu calendário: {0} de 7 dias', '{0} de 7 dias<small>esta semana</small>'), 'de': ('Mein Kalender: {0} von 7 Tagen', '{0} von 7 Tagen<small>diese Woche</small>')}
def shift(t, k):  # {n} → {n+k}
    return re.sub(r'\{(\d+)\}', lambda m: '{%d}' % (int(m.group(1)) + k), t)
def old_path(L, k):
    for kk, v in T[L]['PATH'].items():
        if k == 'pill' and 'weekBtn' in kk and '{14}' in kk and '{19}' in kk: return v
        if k == 'card' and 'pdWeek' in kk: return v
def tr_path(L, k):
    v = old_path(L, k)
    if k == 'pill':
        v = re.sub(r'aria-label="[^"]*\{0\} \{1\}[^"]*"><span class="emo">🔥</span><b>\{2\}</b>', 'aria-label="%s"><span class="emo">🔥</span><b>{1}<small>/7</small></b>' % WK[L][0], v)
        head, rest = v.split('<small>/7</small></b>', 1)
        return head + '<small>/7</small></b>' + shift(rest, -1)
    v = re.sub(r'\{0\} \{1\} [^<]*<small>[^<]*</small>', WK[L][1], v, count=1)
    head, rest = v.split('</small></h3>', 1)
    return head + '</small></h3>' + shift(rest, -1)
CYR = re.compile('[А-Яа-яЁё]'); n = 0
for g, keys in miss.items():
    if g in ('GAMES', 'LEARN_IMG', 'SND_HI'): continue
    for k in keys:
        if g == 'PATH': tr = tuple(tr_path(L, 'pill' if 'weekBtn' in k else 'card') for L in ('en', 'pt', 'de'))
        else: tr = W[k]
        assert not any(CYR.search(x) for x in tr), (k, tr)
        assert all(sorted(re.findall(r'\{\d+\}', x)) == sorted(re.findall(r'\{\d+\}', k)) for x in tr), (k, tr)
        fixed.setdefault(g, {})[k] = list(tr[:2]); fde.setdefault(g, {})[k] = tr[2]; n += 1
json.dump(fixed, open(H + '/fixed.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
json.dump(fde, open(H + '/de/fixed_de.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('ok', n)
