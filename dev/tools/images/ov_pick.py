# For every story found in Openverse: the first fitting picture (a free licence, big enough, not on the throttled
# Wikimedia servers), downloaded once. argv[1]: {"story": n} to take the n-th fitting one instead (after a look).
import json, os, sys, time, urllib.request
D = os.path.dirname(os.path.abspath(__file__))
UA = 'GovorilkiBuild/1.0 (https://yankona.github.io/govorilki/; family learning app)'
OV = json.load(open(D + '/ov.json', encoding='utf-8'))
P = json.load(open(D + '/photos.json', encoding='utf-8'))
alt = json.loads(sys.argv[1]) if len(sys.argv) > 1 else {}
# pictures looked at and turned down (off the subject, a stranger in front, not for children): never picked again
REJ = json.load(open(D + '/rejects.json', encoding='utf-8')) if os.path.exists(D + '/rejects.json') else {}
LIC = {'by': 'CC BY', 'by-sa': 'CC BY-SA', 'cc0': 'CC0', 'pdm': 'Public domain'}
import re
BAD = re.compile(r'penis|foreskin|sex|nude|naked|porn|erot|bikini|topless|lingerie|corpse|dead|blood|kill|gore|drunk|beer|wine|cigar|smok|gun|weapon|tattoo', re.I)
def fits(r):
    if BAD.search((r.get('title') or '') + ' ' + ' '.join(t.get('name', '') for t in (r.get('tags') or []) if isinstance(t, dict))): return False
    return r.get('license') in LIC and (r.get('filetype') or 'jpg') in ('jpg', 'jpeg', 'png') and (r.get('width') or 1000) >= 700 \
        and (r.get('width') or 4) >= (r.get('height') or 3) * 0.9 and 'wikimedia.org' not in (r.get('url') or '')
for sid, rs in OV.items():
    if sid in P and sid not in alt: continue
    ok = [r for r in rs if fits(r) and r['url'] not in REJ.get(sid, [])]
    n = alt.get(sid, 0)
    if n >= len(ok): print(sid, 'no fitting picture'); P.pop(sid, None) if sid in alt else None; continue
    r = ok[n]
    try:
        req = urllib.request.Request(r['url'], headers={'User-Agent': UA})
        with urllib.request.urlopen(req, timeout=60) as x: img = x.read()
    except Exception as e: print(sid, 'download failed', e); continue
    if len(img) < 8000: print(sid, 'too small'); continue
    open(f'{D}/raw/{sid}.jpg', 'wb').write(img)
    lic = LIC[r['license']] + (' ' + r['license_version'] if r.get('license_version') and r['license'] not in ('cc0', 'pdm') else '')
    P[sid] = {'file': r['url'], 'license': lic, 'author': r.get('creator') or '', 'page': r.get('foreign_landing_url') or r['url'], 'from': 'openverse:' + (r.get('provider') or ''), 'title': r.get('title') or ''}
    print(sid, '←', r.get('provider'), '|', (r.get('title') or '')[:40], '|', lic, '|', (r.get('creator') or '')[:30], flush=True)
    time.sleep(1.5)
json.dump(P, open(D + '/photos.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
print('photos', len(P))
