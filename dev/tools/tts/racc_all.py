# stress every sentence of the app that holds a homograph, with ruaccent (build-time check only)
import sys, json, re, gzip
from ruaccent import RUAccent
W, D = sys.argv[1], sys.argv[1] + '/dictionary/'
C = json.load(open(sys.argv[2], encoding='utf-8'))
omo = json.load(gzip.open(D + 'omographs.json.gz', 'rt', encoding='utf-8'))
sents = set()
for s in C:
    for p in re.findall(r'[^.!?…]+[.!?…]*', s):
        p = p.strip()
        if p and len(p) < 600 and any(w.lower() in omo for w in re.findall(r'[А-Яа-яЁё]+', p)): sents.add(p)
sents = sorted(sents)
print('sentences', len(sents), file=sys.stderr, flush=True)
a = RUAccent(); a.load(omograph_model_size='turbo3.1', use_dictionary=True, workdir=W)
_pa = a.accent_model.put_accent
def _safe(w):
    try: return _pa(w)
    except Exception: return w
a.accent_model.put_accent = _safe
out = {}
for i, s in enumerate(sents):
    low = s[0].lower() + s[1:]
    try: out[s] = a.process_all(low)
    except Exception as e: out[s] = None
    if i % 1000 == 0: print(i, file=sys.stderr, flush=True); json.dump(out, open(sys.argv[3], 'w', encoding='utf-8'), ensure_ascii=False)
json.dump(out, open(sys.argv[3], 'w', encoding='utf-8'), ensure_ascii=False)
print('done', len(out), file=sys.stderr)
