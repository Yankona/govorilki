# the story pictures downloaded by imgdl/get.py → site/img/learn/<id>.webp (960 px) and <id>-s.webp (330 px), the same way as
# photos/place.py; a contact sheet to check by eye that each file is the picture it should be
import os, sys
from PIL import Image
SRC = sys.argv[1]; OUT = sys.argv[2]; SHEET = sys.argv[3]
os.makedirs(OUT, exist_ok=True)
ids = sorted({f[:-4] for f in os.listdir(SRC) if f.endswith('.jpg') and not f.endswith('-s.jpg')})
tiles = []
for sid in ids:
    im = Image.open(os.path.join(SRC, sid + '.jpg')); im.load(); im = im.convert('RGB'); w, h = im.size
    big = im if w <= 960 else im.resize((960, round(h * 960 / w)), Image.LANCZOS)
    big.save(f'{OUT}/{sid}.webp', 'WEBP', quality=78, method=6)
    sm = im.resize((330, round(h * 330 / w)), Image.LANCZOS) if w > 330 else im
    sm.save(f'{OUT}/{sid}-s.webp', 'WEBP', quality=75, method=6)
    t = im.copy(); t.thumbnail((220, 160)); tiles.append((sid, t))
    print(sid, im.size, os.path.getsize(f'{OUT}/{sid}.webp'), os.path.getsize(f'{OUT}/{sid}-s.webp'))
from PIL import ImageDraw
cols = 6; rows = (len(tiles) + cols - 1) // cols
sheet = Image.new('RGB', (cols * 230, rows * 185), 'white'); dr = ImageDraw.Draw(sheet)
for i, (sid, t) in enumerate(tiles):
    x, y = (i % cols) * 230 + 5, (i // cols) * 185 + 5
    sheet.paste(t, (x, y)); dr.text((x, y + 165), sid, fill='black')
sheet.save(SHEET); print('ids', len(ids))
