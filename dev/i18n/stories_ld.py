# Journey stories for the other languages: i18n/stories/<section>.json = [{id, e, sec?, en:{t,s,q,a}, pt:{…}, de:{…}}]
# (a chosen part of the Russian MORE_STORIES, translated) → LANGDATA.MORE_STORIES {section: [{id, e, t, s, q, a, sec?}]}.
# The Russian version keeps all its stories; build/packs.js moves s and a of these items into data packs.
import json, os, glob
H = os.path.dirname(os.path.abspath(__file__))

def more(lang):
    out = {}
    for f in sorted(glob.glob(H + '/stories/*.json')):
        sec = os.path.basename(f)[:-5]
        items = []
        for x in json.load(open(f, encoding='utf-8')):
            tr = x[lang]
            it = {'id': x['id'], 'e': x['e'], 't': tr['t'], 's': tr['s'], 'q': tr['q'], 'a': tr['a']}
            if 'sec' in x: it['sec'] = x['sec']
            items.append(it)
        out[sec] = items
    return out
