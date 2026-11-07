import sys, json, re, random, time
from ruaccent import RUAccent
C = json.load(open(sys.argv[2], encoding='utf-8'))
words = sys.argv[3].split(',')
random.seed(5)
pick = []
for w in words:
    xs = [s for s in C if re.search(r'(?<![а-яё])' + w + r'(?![а-яё])', s, re.I) and len(s) < 400 and not re.search(r'[{};=<>]', s)]
    random.shuffle(xs); pick += [(w, s) for s in xs[:4]]
a = RUAccent(); a.load(omograph_model_size='turbo3.1', use_dictionary=True, workdir=sys.argv[1])
_pa = a.accent_model.put_accent
def _safe(w):
    try: return _pa(w)
    except Exception: return w
a.accent_model.put_accent = _safe
t = time.time()
for w, s in pick:
    r = a.process_all(s)
    m = re.search(r'(?<![а-яё+])([а-яё+]*' + '[а-яё+]*'.join(w) + r')(?![а-яё])', r, re.I)
    i = r.lower().find(w[:3])
    print(f'{w:10} | {m.group(1) if m else "?":14} | {s[max(0, s.lower().find(w) - 50): s.lower().find(w) + 40]}')
print('sec per sentence', (time.time() - t) / max(1, len(pick)), file=sys.stderr)
