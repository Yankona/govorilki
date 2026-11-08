# The city and country stories (Russian only) of every batch in stories/<batch>/*.json → the STORIES block of
# game/govorilki.html (also kept in build/part_stories.js); their names' stress → say_manual.json;
# an empty MORE_STORIES for the other languages (their pages keep the sections with the stories they already had)
import json, os, re, sys
B = os.path.dirname(os.path.abspath(__file__))
import glob
FILES = sorted(glob.glob(os.path.join(B, '..', 'stories', '*', '*.json')))
T = os.path.join(B, '..', 'i18n') + '/'
ORDER = ['cascais', 'lisbon', 'porto', 'pt', 'spb', 'russia', 'ger', 'esp', 'old']
more = {k: [] for k in ORDER}; stress = {}; ids = set(); warn = []
for f in FILES:
    d = json.load(open(f, encoding='utf-8'))
    for k in ORDER:
        for x in d.get(k, []):
            assert set(x) >= {'id', 'e', 't', 's', 'q', 'a'} and len(x['a']) == 3, x.get('id')
            assert re.fullmatch(r'[a-z0-9-]+', x['id']) and x['id'] not in ids, x['id']
            ids.add(x['id'])
            if not 250 <= len(x['s']) <= 650: warn.append(f"{x['id']}: length {len(x['s'])}")
            if "'" in json.dumps(x, ensure_ascii=False): warn.append(f"{x['id']}: straight apostrophe")
            more[k].append({kk: x[kk] for kk in ('id', 'e', 't', 's', 'q', 'a', 'sec') if kk in x})
    stress.update({w.lower(): v.lower() for w, v in d.get('stress', {}).items()})
print({k: len(v) for k, v in more.items()}, 'stress', len(stress)); [print(' !', w) for w in warn]
# the stress of names: a word the dictionary also knows as a common word is marked only with a capital (a name)
import gzip
acc = json.load(gzip.open((os.environ.get('RACCW') or os.path.join(B, '..', '.cache', 'raccw')) + '/dictionary/accents.json.gz', 'rt', encoding='utf-8'))
man = json.load(open(B + '/say_manual.json', encoding='utf-8')); nw = nc = 0
# a word the dictionary knows is a common word unless the stories write it with a capital in the middle of a sentence (a name)
texts = ' '.join(x[kk] if isinstance(x[kk], str) else ' '.join(x[kk]) for v in more.values() for x in v for kk in ('t', 's', 'q', 'a'))
names = {m.group(1).lower() for m in re.finditer(r'(?<=[^.!?…\s«»—–-])\s+«?([А-ЯЁ][а-яё]+)', texts)}
def acc_k(w):
    f = acc.get(w); return f.index('+') if f and '+' in f else None
conflicts = []
# stress the story writers proposed that is wrong for the word as it stands (checked by ear and in the dictionary)
REJECT = {'соломенным', 'исаакиевского', 'третьяков', 'третьяковская', 'ярославля', 'ярославле', 'салехард', 'салехарде', 'соловках', 'палехская', 'ростральные', 'ростральными', 'александровская', 'исаакиевской', 'рафаэля', 'бурлаки', 'ладожского', 'конюшенной', 'садовой', 'котлин', 'вильгельм', 'измайлове', 'екатерина', 'екатерины', 'агриппины', 'менделеева', 'мелихово', 'боголюбский'}
for w, f in stress.items():
    if ' ' in w or not re.fullmatch(r'[а-яё+-]+', f) or f.replace('+', '') != w or f.count('+') < 1: continue
    for part, pf in zip(w.split('-'), f.split('-')):
        if '+' not in pf or len([c for c in part if c in 'аеёиоуыэюя']) < 2: continue
        if part in man['w'] or part in man['cap'] or part in REJECT: continue
        if part in acc:
            if part not in names: continue
            if acc_k(part) != pf.index('+'): conflicts.append((part, acc[part], pf))
            man['cap'][part] = pf; nc += 1
        else: man['w'][part] = pf; nw += 1
# names the voice gets wrong at the start of a sentence too (they are not common words)
for part, pf in {'хохлома': 'хохлом+а', 'хохломы': 'хохлом+ы', 'хохломой': 'хохлом+ой', 'хохломе': 'хохлом+е', 'хохломская': 'хохл+омская', 'устюг': '+устюг', 'устюга': '+устюга', 'устюге': '+устюге', 'сююмбике': 'сююмбик+е'}.items():
    man['w'][part] = pf
print('conflicts with the dictionary (name use wins):', conflicts)
json.dump(man, open(B + '/say_manual.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('stress added: words', nw, 'names', nc)
js = json.dumps(more, ensure_ascii=False, indent=0).replace('\n', ' ')
part = """/* ---------- more city and country stories (Russian only: the other languages keep the sections they had). Sections:
   Кашкайш, Лиссабон, Порту и север, the whole of Portugal, Петербург and a new section
   «Россия». The stories of Cascais, Lisbon and Porto that were in «Португалия» move into their own sections (same ids,
   so what was read stays read). ---------- */
const MORE_STORIES = LX('MORE_STORIES', """ + js + """);
(() => {
  const OLD_SECS = [['first', 'Первые люди', '🦣'], ['egypt', 'Древний Египет', '🔺'], ['china', 'Древний Китай', '🐉'], ['greece', 'Древняя Греция', '🏛️'], ['rome', 'Древний Рим', '🏟️'], ['vikings', 'Викинги', '⚓'], ['rus', 'Древняя Русь', '🛶'], ['knights', 'Рыцари и замки', '🏰']];
  const NEW = { cascais: ['Кашкайш', '🏖️', 'var(--t-mint)'], lisbon: ['Лиссабон', '🚋', 'var(--t-yellow)'], porto: ['Порту и север', '🌉', 'var(--t-peach)'], russia: ['Россия', '🪆', 'var(--t-pink)'], old: ['Давние времена', '🏺', 'var(--t-peach)'] };
  const MOVE = { cascais: ['pt-king', 'pt-light', 'pt-boca', 'pt-farol', 'pt-guincho', 'pt-pescadores', 'pt-carmona'],
    lisbon: ['pt-tram', 'pt-santa-justa', 'pt-ponte-abril', 'pt-sao-jorge', 'pt-belem', 'pt-ocean', 'pt-nata', 'pt-c-pombal', 'pt-c-santo-antonio', 'pt-flamingos', 'pt-c-earthquake'],
    porto: ['pt-ponte-porto', 'pt-rabelo', 'pt-c-galo'] };
  const SUB = { old: 'пирамиды, рыцари, викинги — и что было раньше', cascais: 'город у океана рядом с Лиссабоном', lisbon: 'трамваи, холмы и мосты', porto: 'Порту, Дору, Брага, Гимарайнш', russia: 'Байкал, Камчатка, Казань и вся страна' };
  Object.entries(NEW).forEach(([k, [name, e, bg]]) => {
    if (LEARN[k]) return;
    const items = [];
    (MOVE[k] || []).forEach(id => { const i = LEARN.pt.items.findIndex(x => x.id === id); if (i >= 0) items.push(...LEARN.pt.items.splice(i, 1)); });
    LEARN[k] = { name, e, bg, place: k === 'old' ? null : k === 'russia' ? 'RU' : 'PT', sub: SUB[k], items };
    if (k === 'old') LEARN.old.secs = OLD_SECS;
  });
  LEARN.pt.name = 'Португалия';
  Object.entries(MORE_STORIES || {}).forEach(([k, list]) => { if (LEARN[k]) list.forEach(x => { if (!LEARN[k].items.some(y => y.id === x.id)) LEARN[k].items.push(x); }); });
})();
"""
open(B + '/part_stories.js', 'w', encoding='utf-8').write(part)
# into the game: the block between the STORIES markers
G = os.path.join(B, '..', 'game', 'govorilki.html'); g = open(G, encoding='utf-8').read()
a = g.index('/* STORIES-BEGIN */\n') + len('/* STORIES-BEGIN */\n'); b = g.index('/* STORIES-END */\n', a)
open(G, 'w', encoding='utf-8').write(g[:a] + part + g[b:]); print('game: stories block updated')
for p in [T + 'phonics/C.en.json', T + 'phonics/C.pt.json', T + 'langdata/en.json', T + 'langdata/pt.json', T + 'de/langdata_de.json']:
    d = json.load(open(p, encoding='utf-8')); d['MORE_STORIES'] = {}; json.dump(d, open(p, 'w', encoding='utf-8'), ensure_ascii=False)
print('part', len(part), 'bytes')
