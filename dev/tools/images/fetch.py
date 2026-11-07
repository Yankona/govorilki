# For each story: the lead photo of a Wikipedia article (og:image), its author and license from the file's Commons page,
# and a 960 px copy. One request every two seconds; any 429 stops the run (the rest stay for later).
import json, re, sys, time, hashlib, html, urllib.request, urllib.parse, os
D = os.path.dirname(os.path.abspath(__file__))
UA = 'GovorilkiBuild/1.0 (https://yankona.github.io/govorilki/; family learning app)'
M = json.load(open(D + '/map.json', encoding='utf-8'))
out = json.load(open(D + '/photos.json', encoding='utf-8')) if os.path.exists(D + '/photos.json') else {}
class Stop(Exception): pass
BLOCKED = set(['ru.wikipedia.org'])   # answered 429 earlier today: not asked in this run
GAP = {'commons.wikimedia.org': 15.0, 'en.wikipedia.org': 3.0, 'pt.wikipedia.org': 3.0, 'upload.wikimedia.org': 2.0}
last = {}
def get(url):
    host = urllib.parse.urlparse(url).hostname
    if host in BLOCKED: return None
    refused = 0
    while True:
        w = GAP.get(host, 3.0) - (time.time() - last.get(host, 0))
        if w > 0: time.sleep(w)
        last[host] = time.time()
        req = urllib.request.Request(url, headers={'User-Agent': UA})
        try:
            with urllib.request.urlopen(req, timeout=40) as r: return r.read()
        except urllib.error.HTTPError as e:
            if e.code != 429: return None
            refused += 1
            if refused >= 3: raise Stop(url)
            wait = int(e.headers.get('Retry-After') or 600) if str(e.headers.get('Retry-After') or '600').isdigit() else 600
            print(f'429 from {host}: waiting {wait} s as asked', flush=True)
            time.sleep(max(wait, 60))
        except Exception: return None
def lead_file(cand):
    lang, title = cand.split(':', 1)
    if f'{lang}.wikipedia.org' in BLOCKED: return None
    page = get(f'https://{lang}.wikipedia.org/wiki/' + urllib.parse.quote(title.replace(' ', '_')))
    if not page: return None
    m = re.search(rb'<meta property="og:image" content="([^"]+)"', page)
    if not m: return None
    u = html.unescape(m.group(1).decode())
    m2 = re.search(r'/wikipedia/commons/(?:thumb/)?[0-9a-f]/[0-9a-f]{2}/([^/]+)', u)
    return urllib.parse.unquote(m2.group(1)) if m2 else None
def meta(name):
    page = get('https://commons.wikimedia.org/wiki/File:' + urllib.parse.quote(name))
    if not page: return None
    t = page.decode('utf-8', 'replace')
    lic = re.search(r'class="licensetpl(?:_|&#95;)short"[^>]*>(.*?)</span>', t, re.S)
    aut = re.search(r'id="fileinfotpl(?:_|&#95;)aut"[^>]*>.*?</td>\s*<td[^>]*>(.*?)</td>', t, re.S)
    clean = lambda s: re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', ' ', s))).strip()
    return clean(lic.group(1)) if lic else '', clean(aut.group(1))[:90] if aut else ''
def thumb(name, w=960):
    h = hashlib.md5(name.replace(' ', '_').encode()).hexdigest(); n = urllib.parse.quote(name.replace(' ', '_'))
    if name.lower().endswith(('.svg', '.tif', '.tiff', '.gif')): return None
    return get(f'https://upload.wikimedia.org/wikipedia/commons/thumb/{h[0]}/{h[:2]}/{n}/{w}px-{n}') or get(f'https://upload.wikimedia.org/wikipedia/commons/{h[0]}/{h[:2]}/{n}')
try:
    for sid, cands in M.items():
        if sid in out: continue
        for c in cands:
            name = lead_file(c)
            if not name: continue
            md = meta(name)
            if not md or not md[0]: continue
            img = thumb(name)
            if not img or len(img) < 5000: continue
            open(f'{D}/raw/{sid}.jpg', 'wb').write(img)
            out[sid] = {'file': name, 'license': md[0], 'author': md[1], 'from': c}
            print(sid, '←', c, '|', name, '|', md[0], '|', md[1][:40], flush=True)
            break
        else: print(sid, 'NOTHING', flush=True)
        json.dump(out, open(D + '/photos.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
except Stop as e:
    print('STOPPED on 429:', e, flush=True)
json.dump(out, open(D + '/photos.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
print('have', len(out), 'of', len(M))
