# Translations for FEELS, SWAB, IDEAS (en/pt/de); data lists live in lp_*.py
import json, os, re, sys
H = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, H)
from lp_feels import F
from lp_swab import S
from lp_ideas1 import I1
from lp_ideas2 import I2
fixed = json.load(open(H + '/fixed.json', encoding='utf-8')); fde = json.load(open(H + '/de/fixed_de.json', encoding='utf-8'))
miss = json.load(open(H + '/out-en.html.missing.json', encoding='utf-8'))
DATA = {'FEELS': F, 'SWAB': S, 'IDEAS': I1 + I2}
CYR = re.compile('[А-Яа-яЁё]'); TAG = re.compile(r'<[^>]+>|\{\d+\}')
n = 0
for g, tr in DATA.items():
    keys = miss[g]; assert len(keys) == len(tr), (g, len(keys), len(tr))
    for k, t in zip(keys, tr):
        if t == '=': t = (k, k, k)
        else:
            for x in t:
                assert not CYR.search(x), (g, k, x)
                # tags/placeholders: same multiset; attribute text may be translated, so compare tag names + placeholders
            for x in t:
                a = sorted(re.findall(r'\{\d+\}', k)); b = sorted(re.findall(r'\{\d+\}', x)); assert a == b, (g, k, x)
                ta = [re.match(r'<\s*/?\w+', y).group() if y[0] == '<' else y for y in TAG.findall(k)]
                tb = [re.match(r'<\s*/?\w+', y).group() if y[0] == '<' else y for y in TAG.findall(x)]
                assert ta == tb, (g, k, x)
        fixed.setdefault(g, {})[k] = [t[0], t[1]]; fde.setdefault(g, {})[k] = t[2]; n += 1
json.dump(fixed, open(H + '/fixed.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
json.dump(fde, open(H + '/de/fixed_de.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('ok', n)
