# Prints «Мой комикс» stories as the game fills them, for proofreading a language:
#   python3 build/render_me.py LANG [level 0|1|2] [world id …]   (no worlds: every world, one plot each in turn)
import json, glob, os, re, sys
H = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'comics', 'me')
L = sys.argv[1]; lv = int(sys.argv[2]) if len(sys.argv) > 2 else 2; only = sys.argv[3:]
P = [p for f in sorted(glob.glob(f'{H}/plots-*.{L}.json')) for p in json.load(open(f, encoding='utf8'))]
W = [w for f in sorted(glob.glob(f'{H}/worlds-*.{L}.json')) for w in json.load(open(f, encoding='utf8'))]
NAME, FR = {'ru': ('Тоша', 'Рыжик'), 'en': ('Tosha', 'Ginger'), 'pt': ('Tosha', 'Ruivinho'), 'de': ('Tosha', 'Rotfuchs')}.get(L, ('Tosha', 'Ginger'))
def fill(s, w, girl=False):
    s = re.sub(r'\{([^{}|]*)\|([^{}]*)\}', lambda m: m.group(2) if girl else m.group(1), s)
    s = re.sub(r'\{(\w+)\}', lambda m: NAME if m.group(1) == 'name' else FR if m.group(1) == 'fr' else w['s'].get(m.group(1), m.group(0)), s)
    return re.sub(r'(^|[.!?…]\s+)([«"„]?)([a-zà-ÿа-яё])', lambda m: m.group(1) + m.group(2) + m.group(3).upper(), s)
for i, w in enumerate(W):
    if only and w['id'] not in only: continue
    for p in (P if only else [P[i % len(P)]]):
        print(f"\n=== {fill(p['n'], w)} × {w['n']} (L{lv}) ===")
        for k, e in enumerate(p['eps']):
            print(f"-- {k+1}. {fill(e['t'], w)}")
            if k == 0: print('  [open]', fill(w['open'][0][lv], w))
            else: print('  [rec]', fill(e['rec'][0][lv], w))
            for x in e['p']: print('  ', x['sp'] + ':', fill(x['x'][lv], w))
            print('  [pw]', fill(e['pw']['x'][lv], w), '→', w['pw']['r'][0])
            q = e['q'][lv]; print('  [q]', fill(q[0], w), '→', fill(q[1], w))
            print('  [ch]', fill(e['ch']['x'][lv], w), '/', ' | '.join(fill(o['b'], w) + ': ' + fill(o['x'][lv], w) for o in e['ch']['o']))
            print('  [end]', fill(e['end'][lv], w))
