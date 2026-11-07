# Builds site-data/say-ru.json, the pronunciation dictionary of the Russian page, and a report.
# For every sentence the app can say: the stress each word should have (manual list > the stress model in context for
# homographs > the stress dictionary) against the stress the Piper voice's own phonemizer gives; where they differ,
# the corrected phonemes. Needs: ruaccent in S2/racc (dictionary and models in S2/raccw), Chromium with Playwright.
import json, re, gzip, os, sys, subprocess, collections, time, glob
B = os.path.dirname(os.path.abspath(__file__)); S = os.path.dirname(B)
SITE = os.environ.get('SITE') or os.path.join(S, '..')
T = S + '/tools/tts'; RACCW = os.environ.get('RACCW') or S + '/.cache/raccw'; DICT = RACCW + '/dictionary/'
RACC_PY = os.environ.get('RACC_PY') or S + '/.venv-racc/bin/python'
sys.path.insert(0, B)
from say_conv import target, target_move, toks
VL = 'аеёиоуыэюя'; VI = 'aɑeɛiɪoɔuyʌɵ'; ACC = '́'
def load(p, d): return json.load(open(p, encoding='utf-8')) if os.path.exists(p) else d
def save(p, x): json.dump(x, open(p, 'w', encoding='utf-8'), ensure_ascii=False)

# 1. every Russian text of the app, then its sentences as the voice gets them
src = open(S + '/game/govorilki.html', encoding='utf-8').read()
# Ukrainian phrases of «Нужные фразы» are said by a Ukrainian voice: out of the Russian corpus («Я хочу пити»)
src = re.sub(r"\buk:\s*'(?:[^'\\\n]|\\.)*'|\buk:\s*\"(?:[^\"\\\n]|\\.)*\"", "uk: ''", src)
corpus = set()
for m in re.finditer(r"'((?:[^'\\\n]|\\.)*)'|\"((?:[^\"\\\n]|\\.)*)\"|`((?:[^`\\]|\\.)*)`", src):
    s = next(g for g in m.groups() if g is not None)
    if re.search('[а-яё]', s, re.I): corpus.add(s)
# the literal scan loses its place where quotes nest (a ternary inside a template): every run of Russian words as well,
# so a line like «Начни с единицы. Узнаем, что получится!» still gets its stress checked
# (comments left out, and Ukrainian phrases: «Я хочу пити» must not teach the Russian voice)
code = re.sub(r'/\*.*?\*/', ' ', src, flags=re.S)
code = re.sub(r'(?<![:\\\'"`])//[^\n]*', ' ', code)
UKR = 'іїєґІЇЄҐ'
for m in re.finditer(r"[А-ЯЁа-яё" + UKR + r"][А-ЯЁа-яё" + UKR + r"0-9 ,:;—–!?.…«»()\-]{3,}", code):
    t = m.group(0).strip()
    if any(c in UKR for c in t) or re.search(r"\buk:\s*['\"`]$", code[max(0, m.start() - 8):m.start()]): continue
    corpus.add(t)
def walk(x):
    if isinstance(x, str):
        if re.search('[а-яё]', x, re.I): corpus.add(x)
    elif isinstance(x, list): [walk(y) for y in x]
    elif isinstance(x, dict): [walk(y) for y in x.values()]
for f in glob.glob(SITE + '/art/*-ru.json') + glob.glob(SITE + '/trips/*-ru.json'): walk(json.load(open(f, encoding='utf-8')))
save(T + '/corpus.json', sorted(corpus))
subprocess.run(['node', B + '/say_norm.js', T + '/corpus.json', T + '/sents.json'], check=True)
SENTS = json.load(open(T + '/sents.json', encoding='utf-8'))

acc = json.load(gzip.open(DICT + 'accents.json.gz', 'rt', encoding='utf-8'))
omo = json.load(gzip.open(DICT + 'omographs.json.gz', 'rt', encoding='utf-8'))
MAN = json.load(open(B + '/say_manual.json', encoding='utf-8'))
def plus_k(f):
    f = f.lower()
    if '+' in f: return len([c for c in f[:f.index('+')] if c in VL])
    if 'ё' in f: return [c for c in f if c in VL].index('ё')
    return None
MW = {w: plus_k(f) for w, f in MAN['w'].items()}; MC = {w: plus_k(f) for w, f in MAN['cap'].items()}
PHR = [(p.split(' '), [plus_k(x) for x in f.split(' ')]) for p, f in MAN.get('phr', {}).items()]
NUMS = json.load(open(T + '/sents-num.json', encoding='utf-8'))

# 2. the stress model on sentences with homographs (cached)
need = [s for s in SENTS if any(w.lower() in omo for w in re.findall(r'[А-Яа-яЁё]+', s))]
save(T + '/racc_todo.json', need)
subprocess.run([RACC_PY, B + '/say_racc.py', RACCW, T + '/racc_todo.json', T + '/racc_out.json'], check=True, stderr=subprocess.DEVNULL)
R = load(T + '/racc_out.json', {})

# 3. the voice's phonemes of every word (cached), through Piper's own phonemizer in Chromium
srv = subprocess.Popen(['python3', '-m', 'http.server', '8766'], cwd=S + '/tools/phsrv', stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
def phon(items, cache_path, sent=False):
    cache = load(cache_path, {})
    todo = sorted({x for x in items if x not in cache})
    if todo:
        save(T + '/ph_in.json', todo)
        subprocess.run(['node', B + '/say_phsent.js' if sent else T + '/phall.js', '8766', T + '/ph_in.json', T + '/ph_out.json'], check=True)
        cache.update(zip(todo, json.load(open(T + '/ph_out.json', encoding='utf-8'))))
        save(cache_path, cache)
    return cache
try:
    WORDS = set(MC) | {w.lower() for s in SENTS for w in re.findall(r'[А-Яа-яЁё]+', s) if len([c for c in w.lower() if c in VL]) >= 2} | {w for w in NUMS if len([c for c in w if c in VL]) >= 2}
    WIPA = phon(WORDS, T + '/wipa.json')
    def ist(p):
        p = p.replace('ɪ^', '^'); n = 0
        for c in p:
            if c == 'ˈ': return n
            if c in VI: n += 1
    def nv(w): return len([c for c in w if c in VL])
    # 4. what each occurrence should be
    occ = []; unknown = collections.Counter(); unk_ctx = {}
    for s in SENTS:
        toks_s = re.findall(r'[А-Яа-яЁё]+', s)
        r = R.get(s)
        rt = None
        if r:
            b = [x for x in re.findall(r'[А-Яа-яЁё+]+', r) if x.replace('+', '')]
            if [x.lower() for x in toks_s] == [x.replace('+', '').lower() for x in b]: rt = b
        seen = collections.Counter()
        low = [x.lower() for x in toks_s]; forced = {}
        for words, ks in PHR:
            for j in range(len(low) - len(words) + 1):
                if low[j:j + len(words)] == words:
                    for q, kk in enumerate(ks):
                        if kk is not None: forced[j + q] = kk
        for i, t in enumerate(toks_s):
            lw = t.lower(); seen[lw] += 1
            if nv(lw) < 2: continue
            cap = t[0].isupper() and i > 0
            if i in forced: k = forced[i]
            elif lw in MW: k = MW[lw]
            elif cap and lw in MC: k = MC[lw]
            elif lw in omo:
                k = plus_k(rt[i]) if rt else None
            elif lw in acc: k = plus_k(acc[lw])
            else:
                unknown[lw] += 1; unk_ctx.setdefault(lw, s); continue
            if k is None: continue
            e = ist(WIPA.get(lw, ''))
            if e is None: continue
            occ.append((s, lw, seen[lw], k, e, low[i - 1] if i else '', lw in omo or i in forced))
    # 5. one stress per word for the whole app, the sentences that need another
    by = collections.defaultdict(collections.Counter)
    for s, lw, n, k, e, prev, homo in occ: by[lw][k] += 1
    def form(lw, k):
        out = ''; v = 0
        for c in lw:
            out += c
            if c in VL:
                if v == k and c != 'ё': out += ACC
                v += 1
        return out
    W = {}; dflt = {}
    for lw, c in by.items():
        k, _ = c.most_common(1)[0]
        e = ist(WIPA[lw]); dflt[lw] = k
        # a word of the manual list keeps its mark even where Piper reads it right: the phone's own voice needs it
        # (узнаем: Piper says узна́ем, an iPhone may say узнаём)
        if k != e or lw in MW: W[lw] = form(lw, k)
    Sx = collections.defaultdict(list)
    def fnv(t):
        h = 0x811c9dc5
        for ch in t: h = ((h ^ ord(ch)) * 0x01000193) & 0xffffffff
        n = ''
        while True:
            h, r = divmod(h, 36); n = '0123456789abcdefghijklmnopqrstuvwxyz'[r] + n
            if not h: return n
    # a homograph read one way after a given word, wherever it stands (какого цве́та): rules for phrases made on the fly
    bc = collections.defaultdict(collections.Counter)
    for s, lw, n, k, e, prev, homo in occ:
        if homo and prev: bc[(prev, lw)][k] += 1
    Bx = {}
    for (prev, lw), c in bc.items():
        if len(c) == 1 and sum(c.values()) >= 2 and list(c)[0] != dflt[lw]: Bx[prev + ' ' + lw] = form(lw, list(c)[0])
    patched = []   # (sentence, word, form)
    ident = {W[lw] for lw in MW if lw in W and dflt.get(lw) == ist(WIPA[lw])}
    for s, lw, n, k, e, prev, homo in occ:
        guess = Bx.get(prev + ' ' + lw)
        want = form(lw, k)
        if want != (guess or form(lw, dflt[lw])): Sx[fnv(s)].append(f'{lw}#{n}={want}')
        if k != e: patched.append((s, lw, want, k))
    # marked forms the voice already says right (they only stop a wider rule): an empty fix
    for v in [x.split('=')[1] for vs in Sx.values() for x in vs] + list(Bx.values()): ident.add(v)
    # names with a capital inside a sentence (Толсто́й): for phrases made on the fly
    Cx = {}
    for lw, k in MC.items():
        if lw not in WIPA or k is None: continue
        Cx[lw] = form(lw, k)
        if k != ist(WIPA[lw]): patched.append(('', lw, Cx[lw], k))
        else: ident.add(Cx[lw])
    # number words that never occur in the texts: the dictionary's stress
    for lw in NUMS:
        if lw in by or lw in omo or lw not in acc or lw not in WIPA: continue
        k = plus_k(acc[lw]); e = ist(WIPA[lw])
        if k is not None and e is not None and k != e:
            W[lw] = form(lw, k); patched.append(('', lw, form(lw, k), k))
    # 6. the corrected phonemes of every form the voice says wrong: the ё-proxy of the word, read by the phonemizer
    forms = {(lw, k) for s, lw, f, k in patched}
    def proxy(lw, k):
        out = []; v = 0
        for c in lw:
            if c in VL:
                out.append('ё' if v == k else c); v += 1
            else: out.append(c)
        return ''.join(out)
    PX = phon({proxy(lw, k) for lw, k in forms if 'ё' not in lw}, T + '/pxipa.json')
    P = {}; bad = []
    for lw, k in forms:
        orig = WIPA[lw]
        t = target_move(orig, lw, k) if 'ё' in lw else target(orig, PX[proxy(lw, k)], lw, k)
        if not t or t == orig: bad.append((lw, k)); continue
        P[form(lw, k)] = orig + '|' + t
    # 7. check in whole sentences that each word's phonemes are found as the voice will see them
    SIPA = phon({s for s, lw, f, k in patched if s}, T + '/sipa.json', sent=True)
    BOUND = set(' ,.!?:;()-—«»"$^')
    miss = collections.Counter(); alt = collections.defaultdict(set)
    for s, lw, f, k in patched:
        if f not in P or not s: continue
        frm = P[f].split('|')[0]; ipa = SIPA[s]
        ok = any((i == 0 or ipa[i - 1] in BOUND) and (i + len(frm) == len(ipa) or ipa[i + len(frm)] in BOUND) for i in [m.start() for m in re.finditer(re.escape(frm), ipa)])
        if ok: continue
        # the word read differently inside the sentence: take its phonemes there when words and phoneme groups line up
        ws = re.findall(r'[А-Яа-яЁё]+', s); groups = [g for g in re.split(r'[ ,.!?:;()—«»"$^-]+', ipa) if g]
        if len(ws) == len(groups):
            for w, g in zip(ws, groups):
                if w.lower() == lw and g != frm:
                    t2 = target_move(g, lw, k) if 'ё' in lw else target(g, PX[proxy(lw, k)], lw, k)
                    if t2: alt[f].add(g + '|' + t2)
            continue
        miss[f] += 1
    for f, xs in alt.items(): P[f] = '¦'.join([P[f]] + sorted(xs))
    for f in ident:
        if f not in P: P[f] = ''
    # 8. a soft л before a consonant or at the end (альбом, медаль, соль): the phonemizer drops its softness, so the app
    # keeps each such word's phonemes and adds the ʲ itself (SAYRU.l, used by sayPatches)
    SOFTW = {w.lower() for s in SENTS for w in re.findall(r'[А-Яа-яЁё]+', s) if re.search(r'ль(?![аеёиоуыэюя])', w.lower())}
    LIPA = phon(SOFTW, T + '/lipa.json')
    L = {w: LIPA[w] for w in sorted(SOFTW) if LIPA.get(w) and 'ɭ' in LIPA[w]}
finally:
    srv.terminate()
out = {'w': W, 'b': Bx, 'c': Cx, 's': {h: ';'.join(v) for h, v in Sx.items()}, 'p': P, 'l': L}
os.makedirs(S + '/site-data', exist_ok=True)
# keys in a fixed order: the same texts give the same file (sets are ordered differently on every run)
json.dump({k: dict(sorted(v.items())) if isinstance(v, dict) else v for k, v in sorted(out.items())}, open(S + '/site-data/say-ru.json', 'w', encoding='utf-8'), ensure_ascii=False)
rep = {'words_fixed': len(W), 'sentences': len(Sx), 'forms': len(P), 'occurrences_patched': len(patched), 'unconvertible': bad, 'not_found_in_sentence': miss.most_common(),
       'unknown_words': [(w, c, unk_ctx[w][:120]) for w, c in unknown.most_common()]}
save(T + '/say_report.json', rep)
print({k: (v if isinstance(v, int) else len(v)) for k, v in rep.items()}, 'bytes', len(json.dumps(out, ensure_ascii=False).encode()))
