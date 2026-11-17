# comics/<id>.ru.json → the data block of the game (/*COMICS-DATA*/…/*COMICS-DATA-END*/); the other languages go to
# LANGDATA.COMIC_EPS through i18n/merge.py and i18n/de/merge_de.py (comics_ld below). python3 build/gen_comics.py
import json, os, re, glob
D = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
ORDER = ['foot', 'space', 'detective', 'dino']
def load(lang):
    out = {}
    for id in ORDER:
        f = f'{D}/comics/{id}.{lang}.json'
        if os.path.exists(f):
            d = json.load(open(f, encoding='utf8')); d.pop('id', None); out[id] = d
    return out
def load_me(lang):
    # «Мой комикс»: plots, worlds, powers and achievements of one language ({} when not written yet)
    H = f'{D}/comics/me'; plots, worlds = [], []
    for f in sorted(glob.glob(f'{H}/plots-*.{lang}.json')): plots += json.load(open(f, encoding='utf8'))
    for f in sorted(glob.glob(f'{H}/worlds-*.{lang}.json')): worlds += json.load(open(f, encoding='utf8'))
    ex = f'{H}/extra.{lang}.json'
    if not plots or not worlds or not os.path.exists(ex): return {}
    for w in worlds: w.pop('st', None)
    e = json.load(open(ex, encoding='utf8'))
    return {'plots': plots, 'worlds': worlds, 'powers': e['powers'], 'cameo': e['cameo']}
if __name__ == '__main__':
    g = f'{D}/game/govorilki.html'; s = open(g, encoding='utf8').read()
    data = json.dumps(load('ru'), ensure_ascii=False, separators=(',', ':'))
    s2, n = re.subn(r'/\*COMICS-DATA\*/.*?/\*COMICS-DATA-END\*/', lambda m: '/*COMICS-DATA*/' + data + '/*COMICS-DATA-END*/', s, flags=re.S)
    assert n == 1, 'no COMICS-DATA block'
    me = json.dumps(load_me('ru'), ensure_ascii=False, separators=(',', ':'))
    s2, n = re.subn(r'/\*COMICME-DATA\*/.*?/\*COMICME-DATA-END\*/', lambda m: '/*COMICME-DATA*/' + me + '/*COMICME-DATA-END*/', s2, flags=re.S)
    assert n == 1, 'no COMICME-DATA block'
    open(g, 'w', encoding='utf8').write(s2); print('comics ru:', len(data), 'bytes; my comic:', len(me), 'bytes')
