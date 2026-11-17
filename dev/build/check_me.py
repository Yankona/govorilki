# Checks the «Мой комикс» data (comics/me/plots-*.json, worlds-*.json) against comics/me/BRIEF_ME.md, PLOTS.md, WORLDS.md.
# python3 build/check_me.py FILE…   (no files: all of comics/me/*.ru.json)
import json, sys, re, glob, os
H = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'comics', 'me')
SLOTS = {'name', 'fr', 'place_in', 'place_to', 'thing', 'thing_acc', 'thing_gen', 'event', 'event_to', 'event_in', 'npc', 'rival', 'crowd', 'tool', 'tool_acc'}
SC = set('home away out stadium locker park street city room kitchen garden space pad moon mars lab jungle volcano cave sea night stage track castle'.split())
WHO = {'kid', 'me', 'npc', 'rival'}
CAST = set('coach bolt zhuk iskra bip kometa sova ezh bublik pushok shchek prof hrum grom pera nota balla krab avto kist drak'.split())
LIM = [26, 70, 150]; SLOTLEN = [12, 14, 14]
bad = 0
def err(m):
    global bad; bad += 1; print('  ' + m)
def length(s, lv):
    t = re.sub(r'\{([^{}|]*)\|([^{}]*)\}', lambda m: max(m.group(1), m.group(2), key=len), s)
    return len(re.sub(r'\{(\w+)\}', 'x' * SLOTLEN[lv], t))
def text(s, where, lv):
    for m in re.findall(r'\{([^{}]*)\}', s):
        if '|' in m: continue
        if m not in SLOTS: err(f'{where}: unknown slot {{{m}}}')
    if lv == 0 and len(re.findall(r'\{(\w+)\}', s)) > 1 and not s.startswith('{name}'): pass
    if length(s, lv) > LIM[lv]: err(f'{where} L{lv} {length(s, lv)}>{LIM[lv]}: {s}')
def tx(x, where):
    if not (isinstance(x, list) and len(x) == 3 and all(isinstance(s, str) and s.strip() for s in x)): err(f'{where}: need [L0,L1,L2]'); return
    for i, s in enumerate(x): text(s, where, i)
def pan(p, where, sp=True):
    if p.get('bg') not in SC: err(f'{where}: scene {p.get("bg")}')
    for w in p.get('who', []):
        if w not in WHO: err(f'{where}: who {w}')
    if sp and p.get('sp') != 'nar' and p.get('sp') not in p.get('who', []): err(f'{where}: sp {p.get("sp")} not in who')
    tx(p.get('x'), where)
def plot(d, w):
    if len(d.get('eps', [])) != 3: err(f'{w}: need 3 eps')
    text(d.get('n', ''), w + '.n', 1)
    for k, e in enumerate(d.get('eps', [])):
        we = f'{w}.ep{k+1}'
        if k == 0 and 'rec' in e: err(f'{we}: no rec in episode 1')
        if k > 0:
            r = e.get('rec', [])
            if len(r) != 2: err(f'{we}: rec needs 2')
            for i, x in enumerate(r): tx(x, f'{we}.rec{i}')
        if len(e.get('p', [])) != 3: err(f'{we}: need 3 panels')
        for i, p in enumerate(e.get('p', [])): pan(p, f'{we}.p{i}')
        pan(e.get('pw', {}), f'{we}.pw', sp=False)
        q = e.get('q', [])
        if len(q) != 3 or any(len(x) != 4 or len(set(x[1:])) != 3 for x in q): err(f'{we}: q shape')
        else:
            for x in q:
                for a in x[1:]:
                    if len(a) > 34: err(f'{we}: answer too long {a}')
        ch = e.get('ch', {}); tx(ch.get('x'), f'{we}.ch')
        if len(ch.get('o', [])) != 2: err(f'{we}: 2 options')
        for i, o in enumerate(ch.get('o', [])):
            pan(o, f'{we}.ch.o{i}')
            if not o.get('b') or length(o['b'], 1) > 30: err(f'{we}.ch.o{i}: button {o.get("b")}')
        tx(e.get('end'), f'{we}.end')
def world(d, w):
    for k in ('home', 'away', 'out'):
        if d.get('bg', {}).get(k) not in SC - {'home', 'away', 'out'}: err(f'{w}: bg.{k}')
    for k in ('npc', 'rival'):
        if d.get('cast', {}).get(k) not in CAST: err(f'{w}: cast.{k} {d.get("cast", {}).get(k)}')
    s = d.get('s', {})
    for k in SLOTS - {'name', 'fr'}:
        if not s.get(k): err(f'{w}: slot {k} missing')
    if len(s.get('thing', '')) > 16: err(f'{w}: thing too long')
    for k, n in (('open', 3), ('fact', 4), ('fun', 4), ('final', 2)):
        v = d.get(k, [])
        if len(v) != n: err(f'{w}: {k} needs {n}')
        for i, x in enumerate(v): tx(x, f'{w}.{k}{i}')
    for k in ('r', 'l', 'sz', 'sh'):
        if len(d.get('pw', {}).get(k, [])) != 3: err(f'{w}: pw.{k} needs 3')
files = sys.argv[1:] or sorted(f for f in glob.glob(H + '/*.ru.json') if not f.endswith('extra.ru.json'))
for f in files:
    try: data = json.load(open(f, encoding='utf8'))
    except Exception as e: print(f, 'BAD JSON', e); bad += 1; continue
    print(os.path.basename(f), len(data))
    for d in data:
        (plot if 'eps' in d else world)(d, d.get('id', '?'))
print('problems:', bad)
sys.exit(1 if bad else 0)
