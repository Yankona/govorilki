# German: the translated batches (de/batches/dNN.out*.json), later additions (de/fixed_de.json {group: {russian: german}})
# and the learning content (de/langdata_de.json) → tables/de.json and langdata/de.json for i18n.js build
import json, os, glob, sys
H = os.path.dirname(os.path.abspath(__file__)); T = os.path.dirname(H)
table, done, missing = {}, 0, 0
for bf in sorted(glob.glob(H + '/batches/d[0-9][0-9].json')):
    b = os.path.basename(bf)[:-5]
    out = {}
    for f in sorted(glob.glob(H + f'/batches/{b}.out*.json')):
        try: out.update(json.load(open(f, encoding='utf-8')))
        except Exception as e: print('bad json', f, e)
    for it in json.load(open(bf, encoding='utf-8'))['items']:
        o = out.get(it['id'])
        if not isinstance(o, str): missing += 1; continue
        table.setdefault(it['g'], {})[it['ru']] = o; done += 1
fx = H + '/fixed_de.json'
if os.path.exists(fx):
    for g, d in json.load(open(fx, encoding='utf-8')).items():
        for ru, de in d.items(): table.setdefault(g, {})[ru] = de
json.dump(table, open(T + '/tables/de.json', 'w', encoding='utf-8'), ensure_ascii=False)
ld = H + '/langdata_de.json'
ldd = json.load(open(ld, encoding='utf-8')) if os.path.exists(ld) else {}
sys.path.insert(0, T); import stories_ld
ldd['MORE_STORIES'] = stories_ld.more('de')
json.dump(ldd, open(T + '/langdata/de.json', 'w', encoding='utf-8'), ensure_ascii=False)
print('de translated', done, 'missing', missing, '| langdata', 'yes' if os.path.exists(ld) else 'not yet')
