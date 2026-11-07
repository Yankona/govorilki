# raw/<id>.jpg → site/img/learn/<id>.webp (960 px) and <id>-s.webp (330 px); a contact sheet to look at; LEARN_IMG entries
import json, os, sys, urllib.parse, re
from PIL import Image, ImageDraw
D = os.path.dirname(os.path.abspath(__file__))
SITE = os.environ.get('SITE') or os.path.join(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'), '..')
P = json.load(open(D + '/photos.json', encoding='utf-8'))
skip = set(sys.argv[1].split(',')) if len(sys.argv) > 1 and sys.argv[1] else set()
out = {}; tiles = []
for sid, m in P.items():
    if sid in skip: continue
    im = Image.open(f'{D}/raw/{sid}.jpg').convert('RGB')
    w, h = im.size
    big = im if w <= 960 else im.resize((960, round(h * 960 / w)), Image.LANCZOS)
    big.save(f'{SITE}/img/learn/{sid}.webp', 'WEBP', quality=78, method=6)
    sm = im.resize((330, round(h * 330 / w)), Image.LANCZOS); sm.save(f'{SITE}/img/learn/{sid}-s.webp', 'WEBP', quality=75, method=6)
    lic = 'общественное достояние' if m['license'].lower().startswith(('public domain', 'pd')) else m['license']
    a = m['author'] or ''
    if '.mw-parser-output' in a: a = a.split('}')[-1].strip() if '}' in a else ''
    a = re.sub(r'\s*\(\s*(?:talk|Telegram)[^)]*\)?', '', a).strip(' ,;')
    a = re.sub(r'\s+uploaded\b.*$', '', a).strip(' ,;')
    a = re.sub(r'^User:', '', a)
    out[sid] = [a if a and 'unknown' not in a.lower() and 'неизвест' not in a.lower() else '', lic, m.get('page') or 'https://commons.wikimedia.org/wiki/File:' + urllib.parse.quote(m['file'].replace(' ', '_'))]
    t = im.copy(); t.thumbnail((220, 160)); tiles.append((sid, t))
json.dump(out, open(D + '/learn_img_new.json', 'w', encoding='utf-8'), ensure_ascii=False)
cols = 6; rows = (len(tiles) + cols - 1) // cols
for part in range(0, rows, 6):
    sheet = Image.new('RGB', (cols * 230, 6 * 185), 'white'); d = ImageDraw.Draw(sheet)
    for n, (sid, t) in enumerate(tiles[part * cols:(part + 6) * cols]):
        x, y = (n % cols) * 230, (n // cols) * 185
        sheet.paste(t, (x + 5, y + 5)); d.text((x + 5, y + 168), sid, fill='black')
    sheet.save(f'{D}/sheet{part // 6}.png')
print(len(out), 'placed')
