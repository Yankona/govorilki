#!/usr/bin/env python3
"""Human-narrated recordings for the audio tales (LibriVox, public domain) -> dev/site-add/tales/.

For every recording in CONFIG: the tale text (an existing tales/<id>.json, or a Wikisource variant for a new tale),
the speech recogniser's word times of the downloaded file (tools/asr.py writes <file>.asr.json: faster-whisper 'small'),
the start time of every sentence of the text (sentences are split exactly like the game's sentences()),
a trimmed mono 48 kbps MP3 (LibriVox's spoken intro, the title and the end note are cut), audio/index.json.

  python3 recordings.py DOWNLOAD_DIR WIKISOURCE_DIR      (both only read; the folders hold the untrusted downloads)
"""
import difflib, json, os, re, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
OUT = os.path.join(HERE, '..', 'site-add', 'tales')
DL, WS = sys.argv[1], sys.argv[2]
AF = 'Русская народная сказка (собрал А. Н. Афанасьев)'
LV = 'https://librivox.org/russian-fairy-tales-2-by-alexander-nikolayevich-afanasyev/'
LVG = 'https://librivox.org/p-short-stories-for-children-and-adults-by-vsevolod-garshin/'
PD = 'общественное достояние (LibriVox, Public Domain Mark)'
CONFIG = [
    dict(id='tsarevna-lyagushka', file='russianfairytales2_23_afanasyev_64kb.mp3', who='Лена Сухая', src=LV),
    dict(id='kot-petuh-lisa-2', file='russianfairytales2_03_afanasyev_64kb.mp3', who='Лена Сухая', src=LV,
         new=dict(t='Кот, петух и лиса — вторая сказка', e='🐓', age=[4, 6], ws='kot-petuh-lisa.txt', var='39')),
    dict(id='kochet-kurica', file='russianfairytales2_01_afanasyev_64kb.mp3', who='Лена Сухая', src=LV,
         new=dict(t='Кочет и курица', e='🐔', age=[3, 5], ws='kochet-kurica.txt', var='68')),
    dict(id='volk-koza', file='russianfairytales2_04_afanasyev_64kb.mp3', who='Лена Сухая', src=LV,
         new=dict(t='Волк и коза', e='🐐', age=[5, 7], ws='volk-koza.txt', var='54')),
    dict(id='lyagushka-puteshestvennitsa', file='shortstories_04_garshin_64kb.mp3', who='Mark Chulsky', src=LVG,
         new=dict(t='Лягушка-путешественница', e='🐸', age=[5, 8], ws='lyag.txt', var=None, by='В. М. Гаршин')),
]
sys.path.insert(0, HERE)
norm = lambda s: re.findall(r'[а-яё]+', s.lower().replace('ё', 'е'))
sentences = lambda s: re.findall(r'[^.!?…]+[.!?…]+[»"]?\s*|[^.!?…]+$', s) or [s]

def clean(raw):
    s = re.sub(r'<ref[^>]*>.*?</ref>', '', raw, flags=re.S); s = re.sub(r'<ref[^>]*/>', '', s)
    s = re.sub(r'\{\{indent\|\d+\}\}', '', s); s = re.sub(r"<font[^>]*>'''(.)'''</font>", r'\1', s)
    s = re.sub(r'\{\{Poemx1\|\|(.*?)\|\}\}', lambda m: m.group(1), s, flags=re.S); s = re.sub(r'\{\{[^{}]*\}\}', '', s)
    s = re.sub(r'\[\[(?:Категория|Файл|File):[^\]]*\]\]', '', s); s = re.sub(r'\[\[(?:[^\]|]*\|)?([^\]]*)\]\]', r'\1', s); s = s.replace('&nbsp;', ' '); s = re.sub(r'__[A-Z]+__', '', s); s = re.sub(r"'''|''", '', s); s = re.sub(r'<[^>]+>', '', s)
    return s.replace('́', '').replace('­', '')
def whole(raw):          # a page with one text, no numbered variants
    s = clean(raw); s = s.split('== Примечания ==')[0]
    return [re.sub(r'\s+', ' ', p).strip().replace(' - ', ' — ') for p in re.split(r'\n\s*\n', s) if p.strip()]
def variants(raw):
    parts = re.split(r'^==\s*([^=\n]*?)\s*==\s*$', clean(raw), flags=re.M); out = {}
    for i in range(1, len(parts) - 1, 2):
        if parts[i].strip().lower().startswith('примечан'): break
        out[parts[i].strip()] = [re.sub(r'\s+', ' ', p).strip().replace(' - ', ' — ') for p in re.split(r'\n\s*\n', parts[i + 1]) if p.strip()]
    return out

index_old = json.load(open(os.path.join(ROOT, 'tales', 'index.json'), encoding='utf-8'))
by_id = {x['id']: x for x in index_old}
rec = {}; os.makedirs(os.path.join(OUT, 'audio'), exist_ok=True)
for c in CONFIG:
    if 'new' in c:
        n = c['new']; raw = open(os.path.join(WS, n['ws']), encoding='utf-8').read(); paras = variants(raw)[n['var']] if n.get('var') else whole(raw)
        json.dump({'id': c['id'], 't': n['t'], 'by': n.get('by', AF), 'p': paras}, open(os.path.join(OUT, c['id'] + '.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
    else:
        paras = json.load(open(os.path.join(ROOT, 'tales', c['id'] + '.json'), encoding='utf-8'))['p']
    asr = json.load(open(os.path.join(DL, c['file'] + '.asr.json'), encoding='utf-8'))
    aw = [(norm(w[0]), w[1], w[2]) for s in asr for w in s['w']]
    A = [(x, st, en) for ws_, st, en in aw for x in ws_]
    T = []; sent_of = []; S = []
    for p in paras:
        for s in sentences(p):
            S.append(s); 
            for x in norm(s): T.append(x); sent_of.append(len(S) - 1)
    m = difflib.SequenceMatcher(None, [a[0] for a in A], T, autojunk=False)
    tt = [None] * len(T); te = [None] * len(T)
    for b in m.get_matching_blocks():
        for k in range(b.size): tt[b.b + k] = A[b.a + k][1]; te[b.b + k] = A[b.a + k][2]
    hit = [i for i, v in enumerate(tt) if v is not None]
    t0 = tt[hit[0]]; t1 = te[hit[-1]]; cover = len(hit) / len(T)
    start = [None] * len(S)
    for i in hit:
        if start[sent_of[i]] is None: start[sent_of[i]] = tt[i]
    last = t0
    for j in range(len(S)):                       # sentences with no matched word: between their neighbours
        if start[j] is None: start[j] = last
        start[j] = max(start[j], last); last = start[j]
    a0 = max(0, t0 - 0.35); a1 = t1 + 0.5
    mp3 = os.path.join(OUT, 'audio', c['id'] + '.mp3')
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-ss', f'{a0:.2f}', '-to', f'{a1:.2f}', '-i', os.path.join(DL, c['file']), '-af', f'afade=t=out:st={a1 - a0 - 0.5:.2f}:d=0.5',
                    '-ac', '1', '-ar', '24000', '-c:a', 'libmp3lame', '-b:a', '48k', '-map_metadata', '-1', mp3], check=True)
    rec[c['id']] = dict(f=c['id'] + '.mp3', who=c['who'], src=c['src'], lic=PD, dur=round(a1 - a0, 1), ts=[round(x - a0, 2) for x in start], kb=os.path.getsize(mp3) // 1024)
    w = len(T)
    print(c['id'], 'sentences', len(S), 'cover %.2f' % cover, 'audio %.0fs' % (a1 - a0), os.path.getsize(mp3) // 1024, 'KB')
    if 'new' in c:
        n = c['new']; by_id[c['id']] = dict(id=c['id'], t=n['t'], by=n.get('by', AF), e=n['e'], age=n['age'], min=max(1, round((a1 - a0) / 60)), w=len(' '.join(paras).split()))
index_new = [by_id[x['id']] for x in index_old] + [v for k, v in by_id.items() if k not in {x['id'] for x in index_old}]
json.dump(index_new, open(os.path.join(OUT, 'index.json'), 'w', encoding='utf-8'), ensure_ascii=False)
json.dump(rec, open(os.path.join(OUT, 'audio', 'index.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
