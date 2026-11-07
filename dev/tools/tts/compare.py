# compare the stress Piper's phonemizer gives every word of the app with the stress dictionary (ruaccent's)
import json, re, gzip, collections, sys
import os
D = (os.environ.get('RACCW') or os.path.join(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'), '.cache', 'raccw')) + '/dictionary/'
W = json.load(open('words.json', encoding='utf-8')); P = json.load(open('words_ipa.json', encoding='utf-8'))
meta = json.load(open('words_meta.json', encoding='utf-8'))
acc = json.load(gzip.open(D + 'accents.json.gz', 'rt', encoding='utf-8'))
omo = json.load(gzip.open(D + 'omographs.json.gz', 'rt', encoding='utf-8'))
yo = json.load(gzip.open(D + 'yo_words.json.gz', 'rt', encoding='utf-8'))
VL = 'аеёиоуыэюя'; VI = 'aɑeɛiɪoɔuyʌɵ'
def ipa_stress(p):
    n = 0; st = None; prim = 0
    for i, c in enumerate(p):
        if c == 'ˈ': prim += 1; st = n if st is None else st
        if c in VI: n += 1
    return st, n, prim
def dict_stress(f):
    if 'ё' in f and '+' not in f: return [i for i, c in enumerate([c for c in f if c in VL]) if c == 'ё'][0]
    if '+' not in f: return None
    return len([c for c in f[:f.index('+')] if c in VL])
out = {'mis': [], 'omo': [], 'unk': [], 'nv': [], 'yo': []}
for w, p in zip(W, P):
    nvw = len([c for c in w if c in VL]); st, nv, prim = ipa_stress(p)
    if w in yo and 'ё' not in w: out['yo'].append((w, yo[w], meta['cnt'][w]))
    if w in omo:
        opts = [dict_stress(o) for o in omo[w]]
        out['omo'].append((w, p, omo[w], st, meta['cnt'][w], meta['ctx'][w])); continue
    f = acc.get(w)
    if f is None: out['unk'].append((w, p, meta['cnt'][w], meta['ctx'][w])); continue
    ds = dict_stress(f)
    if nv != nvw or prim != 1: out['nv'].append((w, p, f, meta['cnt'][w])); 
    if ds is not None and st is not None and ds != st: out['mis'].append((w, p, f, meta['cnt'][w], meta['ctx'][w]))
json.dump(out, open('cmp.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
for k, v in out.items(): print(k, len(v), 'occurrences', sum(x[3] if k in ('mis',) else x[2] if k in ('unk', 'yo') else x[4] if k == 'omo' else x[3] for x in v))
