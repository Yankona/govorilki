# parent-report: «Гайд» became «Отчёт» (results only). The three big templates are carried over from their «Гайд»
# translations; the short strings are below as {russian: (en, pt, de)}. Money-free; parents addressed politely.
import json, os, re
H = os.path.dirname(os.path.abspath(__file__))
fixed = json.load(open(H + '/fixed.json', encoding='utf-8')); fde = json.load(open(H + '/de/fixed_de.json', encoding='utf-8'))
miss = json.load(open(H + '/out-en.html.missing.json', encoding='utf-8'))
SWAP = [  # (old piece, new piece) per language: en, pt, de
  [('<b>Guide</b>', '<b>Report</b>'), ('🧭 Guide</h2><p class="lead">What went well this week, a tip from everyday life and something to talk about.</p>', '📊 Report</h2><p class="lead">What the grandchildren are getting right and what is still hard.</p>'),
   ('🧭 Guide</h2><p class="muted">The game teaches and you guide: what went well this week, one tip from everyday life and the project of the week.</p>', '📊 Report</h2><p class="muted">What is going well and what is still hard — briefly, for each child.</p>'), ('🧭 Guide</button>', '📊 Report</button>'), ('🧭', '📊')],
  [('<b>Guia</b>', '<b>Relatório</b>'), ('🧭 Guia</h2><p class="lead">O que correu bem esta semana, uma dica do dia a dia e um assunto para conversar.</p>', '📊 Relatório</h2><p class="lead">O que os netos já conseguem e o que ainda é difícil.</p>'),
   ('🧭 Guia</h2><p class="muted">O jogo ensina e vocês orientam: o que correu bem esta semana, uma dica do dia a dia e o projeto da semana.</p>', '📊 Relatório</h2><p class="muted">O que está a correr bem e o que ainda é difícil — em resumo, para cada criança.</p>'), ('🧭 Guia</button>', '📊 Relatório</button>'), ('🧭', '📊')],
  [('<b>Ratgeber</b>', '<b>Bericht</b>'), ('🧭 Ratgeber</h2><p class="lead">Was diese Woche gut geklappt hat, ein Tipp aus dem Alltag und ein Gesprächsthema.</p>', '📊 Bericht</h2><p class="lead">Was den Enkeln schon gelingt und was noch schwerfällt.</p>'),
   ('🧭 Ratgeber</h2><p class="muted">Das Spiel lehrt, und Sie begleiten: was diese Woche gut geklappt hat, ein Tipp aus dem Alltag und das Projekt der Woche.</p>', '📊 Bericht</h2><p class="muted">Was gut läuft und was noch schwerfällt — kurz, für jedes Kind.</p>'), ('🧭 Ratgeber</button>', '📊 Bericht</button>'), ('🧭', '📊')]]
RU_SWAP = [('<b>Гайд</b>', '<b>Отчёт</b>'), ('🧭 Гайд</h2><p class="lead">Что получилось за неделю, совет из жизни и о чём поговорить.</p>', '📊 Отчёт</h2><p class="lead">Что у внуков получается и что пока трудно.</p>'),
  ('🧭 Гайд</h2><p class="muted">Игра учит, а вы направляете: что получилось за неделю, один совет из жизни и проект недели.</p>', '📊 Отчёт</h2><p class="muted">Что получается и что пока трудно — коротко, по каждому ребёнку.</p>'), ('🧭 Гайд</button>', '📊 Отчёт</button>'), ('🧭', '📊')]
def swap(s, pairs):
    for a, b in pairs: s = s.replace(a, b)
    return s
W = {
 'Отчёт': ('Report', 'Relatório', 'Bericht'),
 'что получается и что пока трудно': ('what is going well and what is still hard', 'o que corre bem e o que ainda é difícil', 'was gut läuft und was noch schwerfällt'),
 'Речь': ('Speech', 'Fala', 'Sprechen'),
 'звуки ': ('sounds ', 'sons ', 'Laute '),
 'Чтение': ('Reading', 'Leitura', 'Lesen'),
 '{0} слов в минуту': ('{0} words a minute', '{0} palavras por minuto', '{0} Wörter pro Minute'),
 'Математика': ('Maths', 'Matemática', 'Mathe'),
 'Логика': ('Logic', 'Lógica', 'Logik'),
 'решено задач: {0}': ('puzzles solved: {0}', 'problemas resolvidos: {0}', 'gelöste Aufgaben: {0}'),
 'Шахматы': ('Chess', 'Xadrez', 'Schach'),
 'уроков пройдено: {0}': ('lessons done: {0}', 'lições feitas: {0}', 'Lektionen geschafft: {0}'),
 'Истории': ('Stories', 'Histórias', 'Geschichten'),
 'историй: {0}': ('stories: {0}', 'histórias: {0}', 'Geschichten: {0}'),
 'Музыка и рисование': ('Music and drawing', 'Música e desenho', 'Musik und Malen'),
 'чтение — новая ступень: «{0}»': ('reading — new step: “{0}”', 'leitura — novo degrau: «{0}»', 'Lesen — neue Stufe: „{0}“'),
 'математика — новый уровень: «{0}»': ('maths — new level: “{0}”', 'matemática — novo nível: «{0}»', 'Mathe — neues Niveau: „{0}“'),
 'счёты — ступень {0}': ('abacus — step {0}', 'ábaco — degrau {0}', 'Abakus — Stufe {0}'),
 'шахматы — уроков пройдено: {0}': ('chess — lessons done: {0}', 'xadrez — lições feitas: {0}', 'Schach — Lektionen geschafft: {0}'),
 'шахматы — компьютер уровня {0}': ('chess — computer at level {0}', 'xadrez — computador de nível {0}', 'Schach — Computer auf Stufe {0}'),
 'скорость чтения — {0} слов в минуту': ('reading speed — {0} words a minute', 'velocidade de leitura — {0} palavras por minuto', 'Lesetempo — {0} Wörter pro Minute'),
 'на ⭐⭐⭐: {0}': ('⭐⭐⭐ in: {0}', '⭐⭐⭐ em: {0}', '⭐⭐⭐ bei: {0}'),
 'послушано историй: {0}': ('stories listened to: {0}', 'histórias ouvidas: {0}', 'gehörte Geschichten: {0}'),
 'математика, «{0}» — {1} {2} на этом уровне. Игра подсказывает и даёт задания чуть полегче, пока не станет легко.': ('maths, “{0}” — {1} {2} at this level. The game gives hints and slightly easier tasks until it feels easy.', 'matemática, «{0}» — {1} {2} neste nível. O jogo dá pistas e tarefas um pouco mais fáceis até ficar fácil.', 'Mathe, „{0}“ — {1} {2} auf diesem Niveau. Das Spiel gibt Hinweise und etwas leichtere Aufgaben, bis es leicht fällt.'),
 'чтение, «{0}» — {1} {2} на этой ступени. Игра повторяет её и после ошибок возвращает на шаг назад.': ('reading, “{0}” — {1} {2} on this step. The game repeats it and steps back for review after mistakes.', 'leitura, «{0}» — {1} {2} neste degrau. O jogo repete-o e, depois de erros, volta um degrau para rever.', 'Lesen, „{0}“ — {1} {2} auf dieser Stufe. Das Spiel wiederholt sie und geht nach Fehlern zum Üben einen Schritt zurück.'),
 '{0} — пока на одну звезду. Игра подсказывает и даёт попробовать ещё раз.': ('{0} — one star so far. The game gives hints and lets them try again.', '{0} — por agora com uma estrela. O jogo dá pistas e deixa tentar outra vez.', '{0} — bisher ein Stern. Das Spiel gibt Hinweise und lässt es noch einmal versuchen.'),
 '🎯 {0} {1} из 7{2}{3}': ('🎯 {0} {1} of 7{2}{3}', '🎯 {0} {1} de 7{2}{3}', '🎯 {0} {1} von 7{2}{3}'),
 ' · ⏱️ {0} мин': (' · ⏱️ {0} min', ' · ⏱️ {0} min', ' · ⏱️ {0} Min.'),
 'Итоги недели': ('The week in short', 'Resumo da semana', 'Die Woche im Überblick'),
 'Неделя пока': ('The week so far', 'A semana até agora', 'Die Woche bisher'),
 'Итоги прошлой недели': ('Last week in short', 'Resumo da semana passada', 'Die letzte Woche im Überblick'),
 '✅ Получается:': ('✅ Going well:', '✅ Corre bem:', '✅ Klappt gut:'),
 '🌱 Пока трудно:': ('🌱 Still hard:', '🌱 Ainda difícil:', '🌱 Noch schwer:'),
 '— Говорилки': ('— Govorilki', '— Govorilki', '— Govorilki'),
 '<p class="gd-act">🌱 На этой неделе ещё не было занятий. Как только {0} поиграет, здесь появятся успехи.</p>': ('<p class="gd-act">🌱 No practice yet this week. As soon as {0} plays, the progress will show up here.</p>', '<p class="gd-act">🌱 Ainda não houve atividades esta semana. Assim que {0} jogar, os progressos aparecem aqui.</p>', '<p class="gd-act">🌱 Diese Woche gab es noch keine Übungen. Sobald {0} spielt, erscheinen hier die Fortschritte.</p>'),
 '<div class="gd-ok"><h3 class="gd-s">✅ Получается</h3>{0}</div>': ('<div class="gd-ok"><h3 class="gd-s">✅ Going well</h3>{0}</div>', '<div class="gd-ok"><h3 class="gd-s">✅ Corre bem</h3>{0}</div>', '<div class="gd-ok"><h3 class="gd-s">✅ Klappt gut</h3>{0}</div>'),
 '<div class="gd-ok"><h3 class="gd-s">✅ Получается</h3><p>Занятия идут, новых уровней на этой неделе пока нет — это нормально.</p></div>': ('<div class="gd-ok"><h3 class="gd-s">✅ Going well</h3><p>Practice is going on; no new levels this week yet — that is normal.</p></div>', '<div class="gd-ok"><h3 class="gd-s">✅ Corre bem</h3><p>As atividades continuam; ainda não há novos níveis esta semana — é normal.</p></div>', '<div class="gd-ok"><h3 class="gd-s">✅ Klappt gut</h3><p>Es wird geübt; neue Stufen gab es diese Woche noch nicht — das ist normal.</p></div>'),
 '<div class="gd-hard"><h3 class="gd-s">🌱 Пока трудно</h3>{0}</div>': ('<div class="gd-hard"><h3 class="gd-s">🌱 Still hard</h3>{0}</div>', '<div class="gd-hard"><h3 class="gd-s">🌱 Ainda difícil</h3>{0}</div>', '<div class="gd-hard"><h3 class="gd-s">🌱 Noch schwer</h3>{0}</div>'),
 '<p class="muted">Пока нечего показать.</p>': ('<p class="muted">Nothing to show yet.</p>', '<p class="muted">Ainda não há nada para mostrar.</p>', '<p class="muted">Noch nichts zu zeigen.</p>'),
 '✅ Текст скопирован': ('✅ Text copied', '✅ Texto copiado', '✅ Text kopiert'),
 '📤 Поделиться': ('📤 Share', '📤 Partilhar', '📤 Teilen'),
 '<p class="lead">Добавьте ребёнка в семью — и здесь появится отчёт.</p>': ('<p class="lead">Add a child to the family and the report will appear here.</p>', '<p class="lead">Adicionem uma criança à família e o relatório aparece aqui.</p>', '<p class="lead">Fügen Sie ein Kind zur Familie hinzu, dann erscheint hier der Bericht.</p>'),
 '<p class="lead">Отчёт появится, когда телефон детей пришлёт новости о неделе.</p>': ('<p class="lead">The report will appear when the children\'s phone sends news about the week.</p>', '<p class="lead">O relatório aparece quando o telemóvel das crianças enviar notícias da semana.</p>', '<p class="lead">Der Bericht erscheint, sobald das Handy der Kinder Neuigkeiten über die Woche schickt.</p>'),
}
# the two card templates: only their Russian words change
TPL = [('💡 Если хотите помочь — одна идея', ('💡 If you would like to help — one idea', '💡 Se quiserem ajudar — uma ideia', '💡 Wenn Sie helfen möchten — eine Idee')),
       ('📤 Поделиться', ('📤 Share', '📤 Partilhar', '📤 Teilen'))]
for g, keys in miss.items():
    for k in keys:
        if k.startswith('<div class="gd-card"') or k.startswith('<details class="gd-wkr"'):
            W[k] = tuple(swap(k, [(r, t[i]) for r, t in TPL]) for i in range(3))
CYR = re.compile('[А-Яа-яЁё]'); n = 0; lost = []
for g, keys in miss.items():
    if g in ('GAMES', 'LEARN_IMG', 'SND_HI'): continue
    for k in keys:
        tr = W.get(k)
        if not tr:
            # a big template: its «Гайд» version, translated, with the guide pieces swapped
            old = next((o for o in fixed.get(g, {}) if swap(o, RU_SWAP) == k and o != k), None)
            if old is None and g == 'GUIDE':
                # the card template: from the old card, built anew
                pass
            if old is not None:
                tr = (swap(fixed[g][old][0], SWAP[0]), swap(fixed[g][old][1], SWAP[1]), swap(fde[g][old], SWAP[2]))
        if not tr: lost.append(k[:70]); continue
        assert not any(CYR.search(x) for x in tr), (k, tr)
        assert all(sorted(re.findall(r'\{\d+\}', k)) == sorted(re.findall(r'\{\d+\}', x)) for x in tr), k
        fixed.setdefault(g, {})[k] = list(tr[:2]); fde.setdefault(g, {})[k] = tr[2]; n += 1
json.dump(fixed, open(H + '/fixed.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
json.dump(fde, open(H + '/de/fixed_de.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('ok', n, 'missing', len(lost), lost)
