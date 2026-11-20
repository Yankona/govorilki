#!/usr/bin/env python3
"""Audio tales in English, Portuguese and German -> dev/site-add/tales/<lang>/ and dev/site-add/tales/audio/<lang>/.

Source: tales/langs/<lang>.json (hand-checked public-domain texts from Wikisource; `rec` = a LibriVox recording, public domain).
A tale without `rec` is read by the game's own voice (Piper / the phone's voice) — only the text is published.
For a tale with `rec`: the downloaded MP3 (DOWNLOAD_DIR/<lang>-<id>.mp3, fetched by hand into an empty folder) and its speech
recogniser word times (DOWNLOAD_DIR/<lang>-<id>.mp3.asr.json: faster-whisper "small", word_timestamps, language = lang — the
same format as tales/asr.py writes) give the start time of every sentence (split exactly like the game's sentences()); the
LibriVox intro and end note are cut; mono 24 kHz 32 kbps MP3. Refused when the recording reads less than MIN_COVER of the text.

  python3 tales/langs.py DOWNLOAD_DIR          (from dev/; DOWNLOAD_DIR is only read)
"""
import difflib, json, os, re, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', 'site-add', 'tales')
DL = sys.argv[1]
MIN_COVER = 0.85
PD = 'LibriVox, Public Domain'
sentences = lambda s: re.findall(r'[^.!?…]+[.!?…]+[»"]?\s*|[^.!?…]+$', s) or [s]
def norm(s):
    s = s.lower().replace('ß', 'ss').replace('’', "'")
    return re.findall(r"[^\W\d_]+", s)
report = []
for lang in ('en', 'de', 'pt'):
    cfg = json.load(open(os.path.join(HERE, 'langs', lang + '.json'), encoding='utf-8'))
    tdir, adir = os.path.join(OUT, lang), os.path.join(OUT, 'audio', lang)
    os.makedirs(tdir, exist_ok=True); os.makedirs(adir, exist_ok=True)
    index, rec = [], {}
    for it in cfg['items']:
        ps = it['p']; words = len(' '.join(ps).split())
        json.dump({'id': it['id'], 't': it['t'], 'by': it['by'], 'src': cfg['src'], 'p': ps}, open(os.path.join(tdir, it['id'] + '.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
        mins = max(1, round(words / 130))
        r = it.get('rec')
        if r:
            base = os.path.join(DL, lang + '-' + it['id'] + '.mp3')
            if not os.path.exists(base + '.asr.json'): report.append((lang, it['id'], 'NO RECOGNITION YET')); continue
            asr = json.load(open(base + '.asr.json', encoding='utf-8'))
            A = [(x, w[1], w[2]) for s in asr for w in s['w'] for x in norm(w[0])]
            Aw = [a[0] for a in A]
            T, sent_of, S = [], [], []
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
            got = {sent_of[i] for i in hit}; miss = [j for j in range(len(S)) if j not in got]
            if cov < MIN_COVER:
                report.append((lang, it['id'], 'REFUSED cover %.2f' % cov)); print('REFUSED', lang, it['id'], 'cover %.2f' % cov); continue
            t0 = tt[hit[0]]; t1 = te[hit[-1]]
            start = [None] * len(S)
            for i in hit:
                if start[sent_of[i]] is None: start[sent_of[i]] = tt[i]
            last = t0
            for j in range(len(S)):
                if start[j] is None: start[j] = last
                start[j] = max(start[j], last); last = start[j]
            a0 = max(0, t0 - 0.35); a1 = t1 + 0.6
            mp3 = os.path.join(adir, it['id'] + '.mp3')
            subprocess.run(['ffmpeg', '-y', '-v', 'error', '-ss', f'{a0:.2f}', '-to', f'{a1:.2f}', '-i', base, '-af', f'afade=t=out:st={a1 - a0 - 0.5:.2f}:d=0.5',
                            '-ac', '1', '-ar', '24000', '-c:a', 'libmp3lame', '-b:a', '32k', '-map_metadata', '-1', mp3], check=True)
            rec[it['id']] = dict(f=it['id'] + '.mp3', who=r['who'], src=r['src'], lic=PD, dur=round(a1 - a0, 1), ts=[round(x - a0, 2) for x in start], kb=os.path.getsize(mp3) // 1024)
            mins = max(1, round((a1 - a0) / 60))
            report.append((lang, it['id'], 'cover %.2f, %d sentences, %.0f s, %d KB%s' % (cov, len(S), a1 - a0, rec[it['id']]['kb'], ', unmatched sentences %s' % miss if miss else '')))
        else:
            report.append((lang, it['id'], 'text only (game voice), %d words' % words))
        index.append(dict(id=it['id'], t=it['t'], by=it['by'], e=it['e'], age=it['age'], min=mins, w=words))
    json.dump(index, open(os.path.join(tdir, 'index.json'), 'w', encoding='utf-8'), ensure_ascii=False)
    json.dump(rec, open(os.path.join(adir, 'index.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
for r in report: print(*r)
