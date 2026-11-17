# «Что нового в мире» and «Профессии»: translations kept in i18n/nj/<chunk>.json { russian: [en, pt, de] }
# (one file per translated chunk; a new month of news adds a file such as i18n/nj/news-2026-12.json).
# Applies them to every group still missing after a build (out-en.html.missing.json). Run after ./build/build_all.sh,
# then build again. Lists what is still missing, so a new batch is easy to send to the translator:
#   python3 i18n/fix_news_jobs.py --todo i18n/nj/todo-<name>.json   writes the still-missing strings there
import json, os, re, glob, sys
H = os.path.dirname(os.path.abspath(__file__))
fixed = json.load(open(H + '/fixed.json', encoding='utf-8')); fde = json.load(open(H + '/de/fixed_de.json', encoding='utf-8'))
miss = json.load(open(H + '/out-en.html.missing.json', encoding='utf-8'))
W = {}
for p in sorted(glob.glob(H + '/nj/*.json')):
    if os.path.basename(p).startswith('todo-'): continue
    W.update(json.load(open(p, encoding='utf-8')))
CYR = re.compile('[А-Яа-яЁё]'); PH = re.compile(r'\{\d+\}'); n = 0; left = []
for g, keys in miss.items():
    if g in ('GAMES', 'LEARN_IMG', 'SND_HI'): continue
    for k in (keys if isinstance(keys, list) else list(keys)):
        tr = W.get(k)
        if not tr: left.append(k); continue
        assert len(tr) == 3 and not any(CYR.search(x) for x in tr), k[:60]
        assert all(sorted(PH.findall(x)) == sorted(PH.findall(k)) for x in tr), 'placeholders: ' + k[:60]
        fixed.setdefault(g, {})[k] = list(tr[:2]); fde.setdefault(g, {})[k] = tr[2]; n += 1
json.dump(fixed, open(H + '/fixed.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
json.dump(fde, open(H + '/de/fixed_de.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('applied', n, '| still missing', len(left))
if '--todo' in sys.argv and left:
    json.dump(left, open(sys.argv[sys.argv.index('--todo') + 1], 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
