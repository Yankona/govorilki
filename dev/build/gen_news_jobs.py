# «Что нового в мире» and «Профессии» → the NEWSJOBS-DATA block of game/govorilki.html (LEARN.news, LEARN.jobs):
#  - stories/news/YYYY-MM.json or YYYY-MM-DD.json (a weekly batch, named by its Monday): true news { "month", "news": [ {id, e, t, date, topic, place?, s, q, a, src} ],
#    "stress", "doubts" } — the newest month gives the news badge; src stays in the batch (for checking), not in the game;
#  - stories/jobs/*.json: { "jobs": [ {id, e, t, sec, s, q, a, tools, clue, tags} ], "stress", "doubts" };
#  - names' stress → build/say_manual.json (a name that is also a common word only when capitalised).
# Texts are translated by the build like any string (i18n/fix_news_jobs.py), story texts go to the data packs.
# RACCW=<ruaccent workdir> python3 build/gen_news_jobs.py
import json, os, re, glob, gzip
B = os.path.dirname(os.path.abspath(__file__)); S = os.path.join(B, '..', 'stories')
TOPICS = {'space', 'animals', 'water', 'plants', 'tech', 'sport', 'places', 'old', 'art', 'music', 'ballet'}
SECS = ['help', 'build', 'move', 'make', 'learn', 'sci', 'nature', 'digital', 'ai', 'own']
TAGS = {'help', 'animals', 'nature', 'tech', 'build', 'art', 'music', 'stage', 'sport', 'science', 'computers', 'words', 'travel', 'food', 'ideas'}
ids, warn, stress, news, jobs, TRY = set(), [], {}, [], [], {}
def check(x, lo, hi):
    assert re.fullmatch(r'[a-z0-9-]+', x['id']) and x['id'] not in ids, x['id']
    ids.add(x['id'])
    assert len(x['a']) == 3 and all(x[k] for k in ('e', 't', 's', 'q')), x['id']
    if not lo <= len(x['s']) <= hi: warn.append(f"{x['id']}: {len(x['s'])} characters")
    if "'" in json.dumps({k: x[k] for k in ('t', 's', 'q', 'a')}, ensure_ascii=False): warn.append(x['id'] + ": straight apostrophe")
for p in sorted(glob.glob(os.path.join(S, 'news', '[0-9][0-9][0-9][0-9]-[0-9][0-9]*.json'))):
    d = json.load(open(p, encoding='utf-8')); fm = os.path.basename(p)[:7]
    for x in d['news']:
        check(x, 300, 800)
        # a monthly file holds that month's events; a weekly file may also hold the end of the month before
        assert re.fullmatch(r'\d{4}-\d{2}(-\d{2})?', x['date']) and x['topic'] in TOPICS and len(x.get('src', [])) >= 2, x['id']
        assert x['date'][:7] == fm or len(os.path.basename(p)) > 12, x['id'] + ': the date is not in the month of ' + os.path.basename(p)
        news.append({**{k: x[k] for k in ('id', 'e', 't', 's', 'q', 'a')}, 'sec': x['date'][:7], 'date': x['date'], 'topic': x['topic'], **({'place': x['place']} if x.get('place') else {}), '_d': x['date']})
    stress.update(d.get('stress', {}))
news.sort(key=lambda x: x['_d'], reverse=True)
for x in news: del x['_d']
for p in sorted(glob.glob(os.path.join(S, 'jobs', '*.json'))):
    d = json.load(open(p, encoding='utf-8'))
    TRY.update(d.get('try_existing', {}))
    for x in d['jobs']:
        check(x, 400, 1000)
        assert x['sec'] in SECS and set(x['tags']) <= TAGS and x['tools'] and x['clue'], x['id']
        jobs.append({k: x[k] for k in ('id', 'e', 't', 'sec', 's', 'q', 'a', 'tools', 'clue', 'tags', 'try') if k in x})
    stress.update(d.get('stress', {}))
# «Опыт дома» for scientists written in another batch: { id: try }
for x in jobs:
    if x['id'] in TRY: x['try'] = TRY.pop(x['id'])
assert not TRY, 'try_existing for unknown ids: ' + ', '.join(TRY)
jobs.sort(key=lambda x: SECS.index(x['sec']))
G = os.path.join(B, '..', 'game', 'govorilki.html'); g = open(G, encoding='utf-8').read()
part = ("LEARN.news = { name: 'Что нового в мире', e: '🗞️', bg: 'var(--t-blue)', sub: 'настоящие новости: космос, звери, открытия', items: "
        + json.dumps(news, ensure_ascii=False) + " };\n"
        "LEARN.jobs = { name: 'Профессии', e: '🧑‍🔧', bg: 'var(--t-yellow)', sub: 'один день из жизни: врач, пилот, программист…', items: "
        + json.dumps(jobs, ensure_ascii=False) + " };\n")
A, Z = '/* NEWSJOBS-DATA-BEGIN */\n', '/* NEWSJOBS-DATA-END */\n'
a = g.index(A) + len(A); b = g.index(Z, a)
rest = g[:a] + g[b:]
for i in ids: assert f'"id": "{i}"' not in rest and f"id: '{i}'" not in rest, 'id used elsewhere: ' + i
open(G, 'w', encoding='utf-8').write(g[:a] + part + g[b:])
# stress: names (capitalised mid-sentence) the dictionary knows as common words → 'cap'; words it does not know → 'w'
acc = json.load(gzip.open((os.environ.get('RACCW') or os.path.join(B, '..', '.cache', 'raccw')) + '/dictionary/accents.json.gz', 'rt', encoding='utf-8'))
texts = ' '.join(x[k] if isinstance(x[k], str) else ' '.join(x[k]) for x in news + jobs for k in ('t', 's', 'q', 'a', 'clue') if k in x)
names = {m.group(1).lower() for m in re.finditer(r'(?<=[^.!?…\s«»—–-])\s+«?([А-ЯЁ][а-яё]+)', texts)}
man = json.load(open(B + '/say_manual.json', encoding='utf-8')); nw = nc = 0; conflicts = []
REJECT = {'луксор', 'аделаида', 'олимпиаде', 'орион', 'штаты', 'гренландии', 'ключевская'}  # writers' stress wrong (dictionary right)
for w, f in stress.items():
    w, f = w.lower().strip(), f.lower().strip()
    if ' ' in w or not re.fullmatch(r'[а-яё+-]+', f) or f.replace('+', '') != w or f.count('+') < 1: continue
    for part_, pf in zip(w.split('-'), f.split('-')):
        if '+' not in pf or len([c for c in part_ if c in 'аеёиоуыэюя']) < 2: continue
        if part_ in man['w'] or part_ in man['cap'] or part_ in REJECT: continue
        if part_ in acc:
            if part_ not in names: continue
            if acc[part_].index('+') != pf.index('+') if '+' in acc[part_] else False: conflicts.append((part_, acc[part_], pf))
            man['cap'][part_] = pf; nc += 1
        else: man['w'][part_] = pf; nw += 1
json.dump(man, open(B + '/say_manual.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('news:', len(news), 'months:', sorted({x['sec'] for x in news}), 'jobs:', {s: sum(x['sec'] == s for x in jobs) for s in SECS})
print('stress added: words', nw, 'names', nc, '| conflicts with the dictionary (name use wins):', conflicts)
[print(' !', w) for w in warn]
