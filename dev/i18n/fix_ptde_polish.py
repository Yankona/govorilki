# pt-de-polish: language names in the page's language, «Узнаём» before the path, texts without the child's name yet,
# why the panel asks whose phone it is. Built from the old translations where a template only changed a little.
import json, os, re
H = os.path.dirname(os.path.abspath(__file__))
fixed = json.load(open(H + '/fixed.json', encoding='utf-8')); fde = json.load(open(H + '/de/fixed_de.json', encoding='utf-8'))
tde = json.load(open(H + '/tables/de.json', encoding='utf-8'))
miss = json.load(open(H + '/out-en.html.missing.json', encoding='utf-8'))

def old(g, pre):
    k = next(k for k in fixed[g] if k.startswith(pre))
    return fixed[g][k][0], fixed[g][k][1], tde[g][k]

W = {
  'Русский': ('Russian', 'Russo', 'Russisch'), 'Украинский': ('Ukrainian', 'Ucraniano', 'Ukrainisch'),
  'Португальский': ('Portuguese', 'Português', 'Portugiesisch'), 'Английский': ('English', 'Inglês', 'Englisch'),
  'Немецкий': ('German', 'Alemão', 'Deutsch'), 'Испанский': ('Spanish', 'Espanhol', 'Spanisch'),
  'Французский': ('French', 'Francês', 'Französisch'), 'Итальянский': ('Italian', 'Italiano', 'Italienisch'),
  'Иврит': ('Hebrew', 'Hebraico', 'Hebräisch'), 'Турецкий': ('Turkish', 'Turco', 'Türkisch'), 'Китайский': ('Chinese', 'Chinês', 'Chinesisch'),
  'Узнаём — открыто всегда:': ('Discover, always open:', 'Descobrir, sempre aberto:', 'Entdecken, immer offen:'),
  'истории, путешествия, новости, наука, праздники': ('stories, journeys, news, science, holidays', 'histórias, viagens, notícias, ciência, feriados', 'Geschichten, Reisen, Nachrichten, Wissenschaft, Feiertage'),
  'для взрослых: любая игра откроется для {0}': ('for grown-ups: any game will open for {0}', 'para adultos: qualquer jogo abre para {0}', 'für Erwachsene: jedes Spiel öffnet sich für {0}'),
  'для взрослых: откроется любая игра': ('for grown-ups: any game will open', 'para adultos: qualquer jogo abre', 'für Erwachsene: jedes Spiel öffnet sich'),
  '<b>🎮 Все игры</b><small>{0}</small><button class="chip" id="sdBack">← День</button>': ('<b>🎮 All games</b><small>{0}</small><button class="chip" id="sdBack">← Day</button>', '<b>🎮 Todos os jogos</b><small>{0}</small><button class="chip" id="sdBack">← Dia</button>', '<b>🎮 Alle Spiele</b><small>{0}</small><button class="chip" id="sdBack">← Tag</button>'),
  'Желания: {0}': ('Wishes: {0}', 'Desejos: {0}', 'Wünsche: {0}'),
  'Желания ребёнка': ("The child's wishes", 'Desejos da criança', 'Wünsche des Kindes'),
  '👵 Бабушка или дедушка хочет поиграть в игры {0}': ("👵 Grandma or Grandpa wants to play {0}'s games", '👵 A avó ou o avô quer jogar os jogos de {0}', '👵 Oma oder Opa möchte die Spiele von {0} spielen'),
  '👵 Бабушка или дедушка хочет поиграть в игры ребёнка': ("👵 Grandma or Grandpa wants to play the child's games", '👵 A avó ou o avô quer jogar os jogos da criança', '👵 Oma oder Opa möchte die Spiele des Kindes spielen'),
}
# «ребёнок» as the subject of a sentence: «Que línguas fala a criança?», «Hoje a criança deixou para depois…»
SUBJ = ('the child', 'a criança', 'das Kind')
# the whose-phone question: one line why, then the old screen
why = ('<p class="muted">We ask once: if children play on this phone, the panel gets a simple code so they do not change the settings by accident.</p>',
       '<p class="muted">Perguntamos uma vez: se as crianças jogam neste telemóvel, o painel fica com um código simples, para não mudarem as definições sem querer.</p>',
       '<p class="muted">Wir fragen einmal: Wenn Kinder auf diesem Handy spielen, bekommt die Eltern-Zentrale einen einfachen Code, damit sie nicht aus Versehen Einstellungen ändern.</p>')
ow = old('pultWho', '<div class="pult-gate">')
pw = tuple(re.sub(r'(</p>\n)', lambda m, w=why[i]: m.group(1) + '    ' + w + '\n', ow[i], count=1) for i in range(3))
ow = old('WISH', '<h3 class="fam-s">Желания {0}')
wi = tuple(re.sub(r'<h3 class="fam-s">[^<]*\{0\}</h3>', '<h3 class="fam-s">{0}</h3>', ow[i], count=1) for i in range(3))

CYR = re.compile('[А-Яа-яЁё]'); n = 0
for g, keys in miss.items():
    if g in ('GAMES', 'LEARN_IMG', 'SND_HI'): continue
    for k in keys:
        tr = W.get(k) or (SUBJ if k == 'ребёнок' else pw if g == 'pultWho' else wi if g == 'WISH' and k.startswith('<h3') else None)
        assert tr, (g, k)
        assert not any(CYR.search(x) for x in tr), tr
        assert all(x.count('{') == k.count('{') for x in tr), (k, tr)
        fixed.setdefault(g, {})[k] = list(tr[:2]); fde.setdefault(g, {})[k] = tr[2]; n += 1
json.dump(fixed, open(H + '/fixed.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
json.dump(fde, open(H + '/de/fixed_de.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('ok', n)
