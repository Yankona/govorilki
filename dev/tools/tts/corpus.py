# collect every Russian text the app can say: string literals of the source and the Russian data files
import re, json, sys, glob
import os
S = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'); SITE = os.environ.get('SITE') or os.path.join(S, '..')
src = open(S + '/game/govorilki.html', encoding='utf-8').read()
out = set()
for m in re.finditer(r"'((?:[^'\\\n]|\\.)*)'|\"((?:[^\"\\\n]|\\.)*)\"|`((?:[^`\\]|\\.)*)`", src):
    s = next(g for g in m.groups() if g is not None)
    if re.search('[а-яё]', s, re.I): out.add(s)
def walk(x):
    if isinstance(x, str):
        if re.search('[а-яё]', x, re.I): out.add(x)
    elif isinstance(x, list):
        for y in x: walk(y)
    elif isinstance(x, dict):
        for y in x.values(): walk(y)
for f in glob.glob(SITE + '/art/*-ru.json') + glob.glob(SITE + '/trips/*-ru.json'):
    walk(json.load(open(f, encoding='utf-8')))
json.dump(sorted(out), open(sys.argv[1], 'w', encoding='utf-8'), ensure_ascii=False)
print(len(out), sum(len(s) for s in out))
