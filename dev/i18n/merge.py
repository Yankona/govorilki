# Merges the translated batches, the fixed translations and the phonics content into tables/{en,pt}.json and langdata/{en,pt}.json
import json, os, glob
H = os.path.dirname(os.path.abspath(__file__))
tables = {'en': {}, 'pt': {}}
done = missing = 0
for bf in sorted(glob.glob(H + '/batches/b[0-9][0-9].json')):
    b = os.path.basename(bf)[:-5]
    items = json.load(open(bf))['items']
    out = {}
    for f in glob.glob(H + f'/batches/{b}.out*.json'):
        try: out.update(json.load(open(f)))
        except Exception as e: print('bad json', f, e)
    for it in items:
        o = out.get(it['id'])
        if not (isinstance(o, list) and len(o) == 2): missing += 1; continue
        done += 1
        for k, L in enumerate(('en', 'pt')): tables[L].setdefault(it['g'], {})[it['ru']] = o[k]
fixed = json.load(open(H + '/fixed.json'))
for g, d in fixed.items():
    for ru, pair in d.items():
        for k, L in enumerate(('en', 'pt')): tables[L].setdefault(g, {})[ru] = pair[k]
os.makedirs(H + '/tables', exist_ok=True); os.makedirs(H + '/langdata', exist_ok=True)
for L in tables: json.dump(tables[L], open(H + f'/tables/{L}.json', 'w'), ensure_ascii=False)
for L in ('en', 'pt'):
    data = {}
    for part in ('A', 'B', 'C'):
        f = H + f'/phonics/{part}.{L}.json'
        if os.path.exists(f): data.update(json.load(open(f)))
    json.dump(data, open(H + f'/langdata/{L}.json', 'w'), ensure_ascii=False)
print('translated', done, 'missing', missing)
