# ru-bilingual: «Русский для меня» — the game's name, the «Сегодня» node, the parents' report area and monthly note.
# The module itself and its content are Russian-only (RUME in I18N_SKIP, RUME_DATA through LX).
import json, os, re
H = os.path.dirname(os.path.abspath(__file__))
fixed = json.load(open(H + '/fixed.json', encoding='utf-8')); fde = json.load(open(H + '/de/fixed_de.json', encoding='utf-8'))
miss = json.load(open(H + '/out-en.html.missing.json', encoding='utf-8'))
W = {
 'Русский для меня': ('Russian for me', 'Russo para mim', 'Russisch für mich'),
 'текст про то, что ты любишь, и рассказ': ('a text about what you love, and your own story', 'um texto sobre o que gostas e a tua história', 'ein Text über das, was du magst, und deine Geschichte'),
 'квест: как ты говоришь по-русски': ('quest: how you speak Russian', 'missão: como falas russo', 'Quest: wie du Russisch sprichst'),
 'тексты про то, что ты любишь, грамматика, свои истории': ('texts about what you love, grammar, your own stories', 'textos sobre o que gostas, gramática, as tuas histórias', 'Texte über das, was du magst, Grammatik, eigene Geschichten'),
 'русский язык грамматика падежи рассказ история существо эксперт пропись': ('russian language grammar cases story creature expert handwriting', 'russo língua gramática casos história criatura especialista caligrafia', 'russisch sprache grammatik fälle geschichte wesen experte schreiben'),
 'урок дня': ('lesson of the day', 'lição do dia', 'Lektion des Tages'),
 'Русский язык': ('Russian', 'Russo', 'Russisch'),
 'чтение': ('reading', 'leitura', 'Lesen'),
 'грамматика': ('grammar', 'gramática', 'Grammatik'),
 'словарь': ('vocabulary', 'vocabulário', 'Wortschatz'),
 'речь': ('speaking', 'fala', 'Sprechen'),
 'начало': ('beginning', 'início', 'Anfang'),
 'середина': ('getting there', 'a meio', 'auf dem Weg'),
 'уверенно': ('confident', 'com confiança', 'sicher'),
 'падежи после предлогов (в школу — в школе)': ('cases after prepositions (в школу — в школе)', 'casos depois das preposições (в школу — в школе)', 'Fälle nach Präpositionen (в школу — в школе)'),
 'род слов (какой, какая, какое)': ('gender agreement (какой, какая, какое)', 'concordância de género (какой, какая, какое)', 'Genus-Übereinstimmung (какой, какая, какое)'),
 'вид глагола (делал — сделал)': ('verb aspect (делал — сделал)', 'aspeto verbal (делал — сделал)', 'Verbaspekt (делал — сделал)'),
 'числа со словами (два мяча, пять мячей)': ('numbers with nouns (два мяча, пять мячей)', 'números com substantivos (два мяча, пять мячей)', 'Zahlen mit Nomen (два мяча, пять мячей)'),
 'русские обороты вместо дословного перевода': ('Russian phrases instead of word-for-word translation', 'expressões russas em vez de tradução literal', 'russische Wendungen statt Wort-für-Wort-Übersetzung'),
 'занятий «Русский для меня» — {0}': ('«Russian for me» sessions — {0}', 'sessões «Russo para mim» — {0}', 'Einheiten «Russisch für mich» — {0}'),
 'своих историй вслух — {0}': ('own stories told aloud — {0}', 'histórias próprias contadas em voz alta — {0}', 'eigene Geschichten laut erzählt — {0}'),
 'слов написано по-русски — {0}': ('words written in Russian — {0}', 'palavras escritas em russo — {0}', 'Wörter auf Russisch geschrieben — {0}'),
 'За месяц: {0}. Сейчас: {1}.{2}{3}': ('This month: {0}. Now: {1}.{2}{3}', 'Este mês: {0}. Agora: {1}.{2}{3}', 'Diesen Monat: {0}. Jetzt: {1}.{2}{3}'),
 ' Выросло: {0}.': (' Grew: {0}.', ' Cresceu: {0}.', ' Gewachsen: {0}.'),
 ' Больше всего тренируем: {0}.': (' Practising most: {0}.', ' Treinamos sobretudo: {0}.', ' Am meisten üben wir: {0}.'),
 'русский язык — выросло: {0}': ('Russian — grew: {0}', 'russo — cresceu: {0}', 'Russisch — gewachsen: {0}'),
 '<p class="gd-month">🪆 <b>Русский язык.</b> {0}</p>': ('<p class="gd-month">🪆 <b>Russian.</b> {0}</p>', '<p class="gd-month">🪆 <b>Russo.</b> {0}</p>', '<p class="gd-month">🪆 <b>Russisch.</b> {0}</p>'),
}
# the card template: the old one with the monthly note {9} before the idea, the idea becoming {10}
def card(s): return s.replace('{9}</p></details>', '{10}</p></details>').replace('<details class="gd-idea">', '{9}\n      <details class="gd-idea">', 1)
for k in list(fixed.get('GUIDE', {})):
    if k.startswith('<div class="gd-card"') and '{10}' not in k:
        W[card(k)] = (card(fixed['GUIDE'][k][0]), card(fixed['GUIDE'][k][1]), card(fde['GUIDE'][k]))
CYR = re.compile('[А-Яа-яЁё]'); n = 0; lost = []
OK_CYR = ('в школу', 'какой', 'делал', 'два мяча')
for g, keys in miss.items():
    if g in ('GAMES', 'LEARN_IMG', 'SND_HI'): continue
    for k in keys:
        tr = W.get(k)
        if not tr: lost.append((g, k[:70])); continue
        assert all(not CYR.search(x) or any(c in x for c in OK_CYR) for x in tr), (k, tr)
        assert all(sorted(re.findall(r'\{\d+\}', k)) == sorted(re.findall(r'\{\d+\}', x)) for x in tr), k
        fixed.setdefault(g, {})[k] = list(tr[:2]); fde.setdefault(g, {})[k] = tr[2]; n += 1
json.dump(fixed, open(H + '/fixed.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
json.dump(fde, open(H + '/de/fixed_de.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('ok', n, 'missing', len(lost), lost)
