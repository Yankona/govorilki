#!/usr/bin/env python3
"""Human-narrated recordings for the audio tales (LibriVox, public domain) -> dev/site-add/tales/.

Config: recordings.json, a list of entries
  {id, file, who, src, new?: {t, e, age, by?, ws, var?}}      (new = a tale whose text is not in tales/ yet: Wikisource page
   file ws = a saved raw wikitext page, var = its variant header or null: then the best variant is chosen by the recording)
For every entry not yet published (tales/audio/index.json at the site root): the tale text (existing tales/<id>.json or Wikisource),
the recogniser's word times of the downloaded file (asr.py writes <file>.asr.json), the start time of every sentence (split
exactly like the game's sentences()), a trimmed mono 48 kbps MP3 (LibriVox's spoken intro, title and end note are cut), and
the merged audio/index.json + index.json. An entry whose recording reads less than MIN_COVER of the text is refused and listed.

  python3 recordings.py DOWNLOAD_DIR WIKISOURCE_DIR [--all]     (both folders are only read; --all redoes the published ones too)
"""
import difflib, json, os, re, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
OUT = os.path.join(HERE, '..', 'site-add', 'tales')
DL, WS = sys.argv[1], sys.argv[2]
ALL = '--all' in sys.argv
MIN_COVER = 0.75
PD = 'общественное достояние (LibriVox, Public Domain Mark)'
norm = lambda s: re.findall(r'[а-яё]+', s.lower().replace('ё', 'е'))
sentences = lambda s: re.findall(r'[^.!?…]+[.!?…]+[»"]?\s*|[^.!?…]+$', s) or [s]

def clean(raw):
    s = re.sub(r'<ref[^>]*>.*?</ref>', '', raw, flags=re.S); s = re.sub(r'<ref[^>]*/>', '', s)
    s = re.sub(r'\{\{indent\|\d+\}\}', '', s); s = re.sub(r"<font[^>]*>'''(.)'''</font>", r'\1', s)
    s = re.sub(r'\{\{Poemx1\|\|(.*?)\|\}\}', lambda m: m.group(1), s, flags=re.S)
    while re.search(r'\{\{[^{}]*\}\}', s): s = re.sub(r'\{\{[^{}]*\}\}', '', s)
    s = re.sub(r'\[\[(?:Категория|Файл|File):[^\]]*\]\]', '', s); s = re.sub(r'\[\[(?:[^\]|]*\|)?([^\]]*)\]\]', r'\1', s)
    s = s.replace('&nbsp;', ' '); s = re.sub(r'__[A-Z]+__', '', s); s = re.sub(r"'''|''", '', s); s = re.sub(r'<[^>]+>', '', s)
    return s.replace('́', '').replace('­', '')
def paras(text):
    return [re.sub(r'[ \t]+', ' ', p).strip().replace(' - ', ' — ') for p in re.split(r'\n\s*\n', text) if p.strip()]
def whole(raw):          # a page with one text, no numbered variants
    return paras(clean(raw).split('== Примечания ==')[0])
def variants(raw):
    parts = re.split(r'^==\s*([^=\n]*?)\s*==\s*$', clean(raw), flags=re.M); out = {}
    for i in range(1, len(parts) - 1, 2):
        if parts[i].strip().lower().startswith('примечан'): break
        out[parts[i].strip()] = paras(parts[i + 1])
    return out
def cover(A, T):
    m = difflib.SequenceMatcher(None, A, T, autojunk=False)
    return sum(b.size for b in m.get_matching_blocks()) / max(len(T), 1)

def published():
    f = os.path.join(ROOT, 'tales', 'audio', 'index.json')
    return json.load(open(f, encoding='utf-8')) if os.path.exists(f) else {}
index_old = json.load(open(os.path.join(ROOT, 'tales', 'index.json'), encoding='utf-8'))
by_id = {x['id']: x for x in index_old}
rec = dict(published()); done = set(rec)
os.makedirs(os.path.join(OUT, 'audio'), exist_ok=True)
rejected = []
for c in json.load(open(os.path.join(HERE, 'recordings.json'), encoding='utf-8')):
    if c['id'] in done and not ALL: continue
    asr_f = os.path.join(DL, c['file'] + '.asr.json')
    if not os.path.exists(asr_f): print('no recognition yet:', c['id']); continue
    asr = json.load(open(asr_f, encoding='utf-8'))
    A = [(x, w[1], w[2]) for s in asr for w in s['w'] for x in norm(w[0])]
    Aw = [a[0] for a in A]
    if 'new' in c:
        n = c['new']; raw = open(os.path.join(WS, n['ws']), encoding='utf-8').read(); vs = variants(raw)
        if vs:
            best = max(vs, key=lambda k: cover(Aw, norm(' '.join(vs[k])))) if not n.get('var') else n['var']
            ps = vs[best]
        else: best = '-'; ps = whole(raw)
    else:
        best = '-'; ps = json.load(open(os.path.join(ROOT, 'tales', c['id'] + '.json'), encoding='utf-8'))['p']
    T = []; sent_of = []; S = []
    for p in ps:
        for s in sentences(p):
            S.append(s)
            for x in norm(s): T.append(x); sent_of.append(len(S) - 1)
    m = difflib.SequenceMatcher(None, Aw, T, autojunk=False)
    tt = [None] * len(T); te = [None] * len(T)
    for b in m.get_matching_blocks():
        for k in range(b.size): tt[b.b + k] = A[b.a + k][1]; te[b.b + k] = A[b.a + k][2]
    hit = [i for i, v in enumerate(tt) if v is not None]
    cov = len(hit) / max(len(T), 1)
    if cov < MIN_COVER or not hit:
        rejected.append((c['id'], best, round(cov, 2))); print('REJECTED', c['id'], 'variant', best, 'cover %.2f' % cov); continue
    t0 = tt[hit[0]]; t1 = te[hit[-1]]
    wps = len(T) / max(t1 - t0, 1)          # a recording of several tales matches one variant: words per second give it away
    if not 1.0 <= wps <= 3.8:
        rejected.append((c['id'], best, 'wps %.2f' % wps)); print('REJECTED', c['id'], 'variant', best, 'words per second %.2f' % wps); continue
    start = [None] * len(S)
    for i in hit:
        if start[sent_of[i]] is None: start[sent_of[i]] = tt[i]
    last = t0
    for j in range(len(S)):
        if start[j] is None: start[j] = last
        start[j] = max(start[j], last); last = start[j]
    a0 = max(0, t0 - 0.35); a1 = t1 + 0.5
    if 'new' in c:
        n = c['new']
        json.dump({'id': c['id'], 't': n['t'], 'by': n['by'], 'p': ps}, open(os.path.join(OUT, c['id'] + '.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
    mp3 = os.path.join(OUT, 'audio', c['id'] + '.mp3')
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-ss', f'{a0:.2f}', '-to', f'{a1:.2f}', '-i', os.path.join(DL, c['file']), '-af', f'afade=t=out:st={a1 - a0 - 0.5:.2f}:d=0.5',
                    '-ac', '1', '-ar', '24000', '-c:a', 'libmp3lame', '-b:a', '48k', '-map_metadata', '-1', mp3], check=True)
    rec[c['id']] = dict(f=c['id'] + '.mp3', who=c['who'], src=c['src'], lic=PD, dur=round(a1 - a0, 1), ts=[round(x - a0, 2) for x in start], kb=os.path.getsize(mp3) // 1024)
    print(c['id'], 'variant', best, 'sentences', len(S), 'cover %.2f' % cov, 'audio %.0fs' % (a1 - a0), os.path.getsize(mp3) // 1024, 'KB')
    if 'new' in c:
        n = c['new']; by_id[c['id']] = dict(id=c['id'], t=n['t'], by=n['by'], e=n['e'], age=n['age'], min=max(1, round((a1 - a0) / 60)), w=len(' '.join(ps).split()))
index_new = [by_id[x['id']] for x in index_old] + [v for k, v in by_id.items() if k not in {x['id'] for x in index_old}]
json.dump(index_new, open(os.path.join(OUT, 'index.json'), 'w', encoding='utf-8'), ensure_ascii=False)
json.dump(rec, open(os.path.join(OUT, 'audio', 'index.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print('refused:', rejected)
