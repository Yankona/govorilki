#!/usr/bin/env python3
"""Looks for human-narrated Russian tales we may legally use, through open APIs. Re-run monthly (new LibriVox releases).

  python3 find_recordings.py [OUT_DIR]        # default: dev/tales/found/  (gitignored scratch); prints a short report

Sources (all read-only, paced, generic User-Agent, nothing personal is sent):
  * LibriVox API (librivox.org/api/feed/audiobooks): every Russian item, with sections; every item is public domain.
  * Internet Archive advancedsearch: Russian audio whose uploader gave an explicit CC0 / CC BY / CC BY-SA / Public Domain
    licenseurl (the uploader must also be the performer: that is checked by hand, never by this script).
  * Wikimedia Commons API: audio files in the spoken-Russian categories (licence read from the file's extmetadata).
Nothing is downloaded here except metadata. The verdicts live in RECORDINGS.md.
"""
import json, os, sys, time, urllib.parse, urllib.request
UA = 'govorilki-research/1.0 (children tales; read-only metadata)'
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'tales', 'found')
os.makedirs(OUT, exist_ok=True)

def get(url, pause=1.2):
    req = urllib.request.Request(url, headers={'User-Agent': UA})
    for k in range(3):
        try:
            with urllib.request.urlopen(req, timeout=60) as r: data = r.read()
            time.sleep(pause); return json.loads(data)
        except Exception as e:
            time.sleep(3 * (k + 1)); err = e
    print('  failed:', url[:100], err); return None

def librivox():
    out, off = [], 0
    while True:
        d = get('https://librivox.org/api/feed/audiobooks?format=json&limit=300&offset=%d&extended=0' % off, 1.0)
        if not d or not d.get('books'): break
        out += [b for b in d['books'] if b.get('language') == 'Russian']; off += 300
        if off > 40000: break
    return out

def librivox_sections(bid):
    d = get('https://librivox.org/api/feed/audiobooks?format=json&id=%s&extended=1' % bid, 0.6)
    return (d or {}).get('books', [{}])[0].get('sections') or []

OPEN = ('publicdomain', 'creativecommons.org/licenses/by/', 'creativecommons.org/licenses/by-sa/')
def archive():
    qs = ['(сказка OR сказки OR басни OR рассказ) AND mediatype:audio AND language:rus',
          'subject:(сказки OR "детские сказки" OR fairy) AND mediatype:audio AND language:rus',
          'collection:librivoxaudio AND language:rus']
    seen, out = set(), []
    for q in qs:
        for page in (1, 2, 3):
            u = 'https://archive.org/advancedsearch.php?' + urllib.parse.urlencode(
                [('q', q), ('fl[]', 'identifier'), ('fl[]', 'title'), ('fl[]', 'creator'), ('fl[]', 'licenseurl'), ('fl[]', 'uploader'), ('rows', 100), ('page', page), ('output', 'json')])
            d = get(u, 1.0)
            for x in ((d or {}).get('response') or {}).get('docs', []):
                if x['identifier'] in seen: continue
                seen.add(x['identifier'])
                lic = x.get('licenseurl') or ''
                x['open'] = any(k in lic for k in OPEN) and 'nc' not in lic and '-nd' not in lic
                out.append(x)
    return out

def commons():
    out = []
    for cat in ('Category:Audio files in Russian', 'Category:Spoken Wikipedia - Russian', 'Category:Russian fairy tales', 'Category:Audiobooks in Russian', 'Category:Russian audiobooks'):
        d = get('https://commons.wikimedia.org/w/api.php?' + urllib.parse.urlencode({'action': 'query', 'list': 'categorymembers', 'cmtitle': cat, 'cmtype': 'file', 'cmlimit': 100, 'format': 'json'}), 2.0)
        for m in ((d or {}).get('query') or {}).get('categorymembers', []): out.append((cat, m['title']))
    info = []
    for cat, t in out[:150]:
        d = get('https://commons.wikimedia.org/w/api.php?' + urllib.parse.urlencode({'action': 'query', 'titles': t, 'prop': 'imageinfo', 'iiprop': 'extmetadata|mime|size', 'format': 'json'}), 2.0)
        for p in ((d or {}).get('query') or {}).get('pages', {}).values():
            ii = (p.get('imageinfo') or [{}])[0]; em = ii.get('extmetadata', {})
            info.append({'cat': cat, 'title': t, 'mime': ii.get('mime'), 'licence': (em.get('LicenseShortName') or {}).get('value'), 'artist': (em.get('Artist') or {}).get('value', '')[:80]})
    return info

if __name__ == '__main__':
    lv = librivox()
    json.dump(lv, open(os.path.join(OUT, 'librivox_ru.json'), 'w', encoding='utf-8'), ensure_ascii=False)
    print('LibriVox, Russian items:', len(lv))
    for b in sorted(lv, key=lambda b: int(b['id'])):
        print(' ', b['id'], b['title'][:60], '|', b.get('totaltime'), '|', b.get('url_librivox'))
    ia = archive()
    json.dump(ia, open(os.path.join(OUT, 'archive_ru.json'), 'w', encoding='utf-8'), ensure_ascii=False)
    print('Internet Archive, Russian audio with an open licence URL:')
    for x in ia:
        if x['open']: print(' ', x['identifier'], '|', x.get('title'), '|', x.get('creator'), '|', x.get('licenseurl'), '| uploader:', x.get('uploader'))
    cm = commons()
    json.dump(cm, open(os.path.join(OUT, 'commons_ru.json'), 'w', encoding='utf-8'), ensure_ascii=False)
    print('Wikimedia Commons, audio in the Russian categories:', len(cm))
    for x in cm[:40]: print(' ', x['title'], '|', x['licence'], '|', x['mime'])
