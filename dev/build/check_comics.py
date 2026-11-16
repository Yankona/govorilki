# Checks comics/<id>.<lang>.json against comics/BRIEF.md: shape, three levels, lengths, cast, scenes.
# python3 build/check_comics.py [lang]
import json, sys, glob, os
H = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'comics')
LANG = sys.argv[1] if len(sys.argv) > 1 else 'ru'
SC = set('stadium locker park street city room kitchen garden space pad moon mars lab jungle volcano cave sea night'.split())
LIM = [26, 70, 150]
bad = 0
def err(m):
    global bad; bad += 1; print('  ' + m)
for f in sorted(glob.glob(f'{H}/*.{LANG}.json')):
    try: d = json.load(open(f, encoding='utf8'))
    except Exception as e: print(f, 'BAD JSON', e); bad += 1; continue
    print(os.path.basename(f), d.get('id'), len(d.get('eps', [])))
    cast = set(d.get('cast', {})) | {'me'}
    for k in ('r', 'l', 'sz', 'sh'):
        if len(d.get('pw', {}).get(k, [])) != 3: err(f'pw.{k} needs 3')
        if not d.get('tw', {}).get(k): err(f'tw.{k} missing')
    def tx(x, where):
        if not (isinstance(x, list) and len(x) == 3 and all(isinstance(s, str) and s.strip() for s in x)): err(f'{where}: need 3 texts'); return
        for i, s in enumerate(x):
            if len(s) > LIM[i]: err(f'{where} L{i} {len(s)}>{LIM[i]}: {s}')
    def pan(p, where, sp=True):
        if p.get('bg') not in SC: err(f'{where}: scene {p.get("bg")}')
        for w in p.get('who', []):
            if w not in cast: err(f'{where}: who {w}')
        if sp and p.get('sp') != 'nar' and p.get('sp') not in p.get('who', []): err(f'{where}: sp {p.get("sp")} not in who')
        tx(p.get('x'), where)
    if len(d.get('eps', [])) != 6: err('need 6 eps')
    for k, e in enumerate(d.get('eps', [])):
        w = f'ep{k+1}'
        if not 3 <= len(e.get('p', [])) <= 4: err(f'{w}: {len(e.get("p", []))} panels')
        for i, p in enumerate(e.get('p', [])): pan(p, f'{w}.p{i}')
        pan(e.get('pw', {}), f'{w}.pw', sp=False)
        if (k == 3) != bool(e.get('pw', {}).get('battle')): err(f'{w}: battle flag')
        q = e.get('q', [])
        if len(q) != 3 or any(len(x) != 4 for x in q): err(f'{w}: q shape')
        else:
            for x in q:
                if len(set(x[1:])) != 3: err(f'{w}: q answers repeat {x}')
        ch = e.get('ch', {}); tx(ch.get('x'), f'{w}.ch')
        if len(ch.get('o', [])) != 2: err(f'{w}: 2 options')
        for i, o in enumerate(ch.get('o', [])):
            pan(o, f'{w}.ch.o{i}')
            if not o.get('b') or len(o['b']) > 30: err(f'{w}.ch.o{i}: button {o.get("b")}')
        tx(e.get('end'), f'{w}.end')
        c = e.get('card', {})
        if not c.get('n') or not c.get('c'): err(f'{w}: card')
print('problems:', bad)
sys.exit(1 if bad else 0)
