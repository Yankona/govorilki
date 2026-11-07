# <venv python> say_racc.py <ruaccent workdir> <sentences.json> <cache.json>: stress the sentences the cache lacks (ruaccent, build time only)
import sys, json, os
from ruaccent import RUAccent
todo = json.load(open(sys.argv[2], encoding='utf-8'))
cache = json.load(open(sys.argv[3], encoding='utf-8')) if os.path.exists(sys.argv[3]) else {}
todo = [s for s in todo if s not in cache]
print('to stress', len(todo), file=sys.stderr, flush=True)
if todo:
    a = RUAccent(); a.load(omograph_model_size='turbo3.1', use_dictionary=True, workdir=sys.argv[1])
    _pa = a.accent_model.put_accent
    def _safe(w):
        try: return _pa(w)
        except Exception: return w
    a.accent_model.put_accent = _safe
    for i, s in enumerate(todo):
        try: cache[s] = a.process_all(s[0].lower() + s[1:])
        except Exception: cache[s] = None
        if i % 500 == 499: json.dump(cache, open(sys.argv[3], 'w', encoding='utf-8'), ensure_ascii=False)
json.dump(cache, open(sys.argv[3], 'w', encoding='utf-8'), ensure_ascii=False)
