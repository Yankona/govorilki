# One Openverse search per story (free licenses only, with author and license), every 4 seconds; then the first fitting
# photo is downloaded once. Any 429 stops the searches; what was found stays.
import json, os, sys, time, urllib.request, urllib.parse, hashlib, re
D = os.path.dirname(os.path.abspath(__file__))
UA = 'GovorilkiBuild/1.0 (https://yankona.github.io/govorilki/; family learning app)'
Q = json.load(open(D + '/queries.json', encoding='utf-8'))
res = json.load(open(D + '/ov.json', encoding='utf-8')) if os.path.exists(D + '/ov.json') else {}
HAVE = json.load(open(D + '/photos.json', encoding='utf-8'))
def get(url, timeout=75):
    req = urllib.request.Request(url, headers={'User-Agent': UA})
    with urllib.request.urlopen(req, timeout=timeout) as r: return r.read()
for sid, q in Q.items():
    if sid in res or sid in HAVE: continue
    url = 'https://api.openverse.org/v1/images/?' + urllib.parse.urlencode({'q': q, 'license': 'by,by-sa,cc0,pdm', 'mature': 'false', 'page_size': 12})
    time.sleep(4)
    try: d = json.loads(get(url))
    except urllib.error.HTTPError as e:
        print('stop:', e.code, sid, flush=True)
        if e.code == 429: break
        continue
    except Exception as e: print('err', sid, e, flush=True); continue
    keep = [{k: r.get(k) for k in ('title', 'creator', 'license', 'license_version', 'provider', 'source', 'url', 'foreign_landing_url', 'width', 'height', 'filetype')} for r in d.get('results', [])]
    res[sid] = keep
    print(sid, len(keep), (keep[0]['title'] or '')[:50] if keep else '-', flush=True)
    json.dump(res, open(D + '/ov.json', 'w', encoding='utf-8'), ensure_ascii=False)
json.dump(res, open(D + '/ov.json', 'w', encoding='utf-8'), ensure_ascii=False)
print('searched', len(res), 'of', len(Q))
