# slowly fetch the story pictures that are still linked from Wikimedia (it answers 429 when busy): retry with long pauses
import time, urllib.request, os, sys
D = os.path.dirname(os.path.abspath(__file__)); OUT = D + '/out'; os.makedirs(OUT, exist_ok=True)
UA = 'GovorilkiImageFetch/1.0 (kids educational app govorilki.com; one-time self-hosting of CC images)'
rows = [l.rstrip('\n').split('\t') for l in open(D + '/list.tsv') if l.strip()]
todo = [(k + suf, u) for k, big, small in rows for suf, u in (('', big), ('-s', small))]
log = open(D + '/log.txt', 'a')
for rnd in range(12):
    left = [(n, u) for n, u in todo if not os.path.exists(f'{OUT}/{n}.jpg')]
    print(time.strftime('%H:%M:%S'), 'round', rnd, 'left', len(left), file=log, flush=True)
    if not left: break
    for n, u in left:
        try:
            r = urllib.request.urlopen(urllib.request.Request(u, headers={'User-Agent': UA}), timeout=60); b = r.read()
            if b[:2] == b'\xff\xd8' or b[:4] == b'\x89PNG': open(f'{OUT}/{n}.jpg', 'wb').write(b); print(time.strftime('%H:%M:%S'), 'got', n, len(b), file=log, flush=True)
            time.sleep(8)
        except Exception as e:
            print(time.strftime('%H:%M:%S'), n, '->', getattr(e, 'code', e), file=log, flush=True); time.sleep(75)
