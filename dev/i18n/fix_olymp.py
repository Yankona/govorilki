# olymp: translations of the olympiad by skill (the problems, hints, explanations, the screen and «Задачка дня»)
import json, os, re, sys
H = os.path.dirname(os.path.abspath(__file__))
fixed = json.load(open(H + '/fixed.json', encoding='utf-8')); fde = json.load(open(H + '/de/fixed_de.json', encoding='utf-8'))
miss = json.load(open(H + '/out-en.html.missing.json', encoding='utf-8'))
W = {}
for f in sys.argv[1:]: W.update(json.load(open(f, encoding='utf-8')))
CYR = re.compile('[А-Яа-яЁё]'); n = 0; lost = []
for g, keys in miss.items():
    if g in ('GAMES', 'LEARN_IMG', 'SND_HI'): continue
    for k in keys:
        if k not in W: lost.append(k); continue
        tr = W[k]
        assert len(tr) == 3 and not any(CYR.search(x) for x in tr), k
        assert re.findall(r'\{\d\}', k) == re.findall(r'\{\d\}', tr[0]) == re.findall(r'\{\d\}', tr[1]) == re.findall(r'\{\d\}', tr[2]), k
        fixed.setdefault(g, {})[k] = list(tr[:2]); fde.setdefault(g, {})[k] = tr[2]; n += 1
json.dump(fixed, open(H + '/fixed.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
json.dump(fde, open(H + '/de/fixed_de.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('ok', n, 'missing', len(lost), lost[:10])
