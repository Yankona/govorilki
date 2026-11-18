import sys, re, json
src, out = sys.argv[1], sys.argv[2]
lang = sys.argv[3] if len(sys.argv) > 3 else 'ru'
import os.path
SITE = os.environ.get('SITE') or os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
up = '' if os.path.abspath(out) == os.path.abspath(SITE) else '../'   # the main page sits at the top; the others one folder down share icons and the worker
# desc: the search snippet and the link card, at most 155 characters (checked below)
META = {
  'ru': dict(desc='Логопедия, чтение, математика, шахматы, живопись и музыка для детей 4–12 лет. Бесплатно и без рекламы; бабушки и дедушки играют вместе с внуками.', short='Говорилки', name='Говорилки с Рыжиком', title='Говорилки с Рыжиком — игры для детей 4–12 лет', loc='ru_RU', path='ru/',
             mdesc='Логопедическая игра: дыхание, зарядка для язычка и игры со звуком Р.', saved='Прогресс хранится только на этом устройстве.'),
  'en': dict(desc='Speech, reading, maths, chess, art and music games for children aged 4–12. Free, with no ads; grandparents can play along with their grandchildren.', short='Chatterbox', name='Chatterbox with Ginger', title='Chatterbox with Ginger — games for children aged 4–12', loc='en_GB', path='',
             mdesc='Speech and learning game: breathing, tongue workouts, sounds, reading and maths.', saved=None),
  'pt': dict(desc='Fala, leitura, matemática, xadrez, arte e música para crianças dos 4 aos 12 anos. Grátis e sem anúncios; os avós também podem jogar com os netos.', short='Tagarelas', name='Tagarelas com o Ruivinho', title='Tagarelas com o Ruivinho — jogos para crianças dos 4 aos 12 anos', loc='pt_PT', path='pt/',
             mdesc='Jogo de fala e aprendizagem: respiração, ginástica da língua, sons, leitura e matemática.', saved=None),
  'de': dict(desc='Sprechen, Lesen, Mathe, Schach, Kunst und Musik für Kinder von 4 bis 12 Jahren. Kostenlos und ohne Werbung; Oma und Opa spielen mit den Enkeln mit.', short='Plaudertaschen', name='Plaudertaschen mit Rotschopf', title='Plaudertaschen mit Rotschopf — Spiele für Kinder von 4 bis 12', loc='de_DE', path='de/',
             mdesc='Sprach- und Lernspiel: Atmen, Zungengymnastik, Laute, Lesen und Mathe.', saved=None),
}[lang]
assert len(META['desc']) <= 155, (lang, len(META['desc']))
import os
os.makedirs(out, exist_ok=True)
s = open(src, encoding='utf8').read()
head, rest = s.split('<div id="app"></div>', 1)
head = head.replace('<meta name="claude:viewport-fit-sides" content="cover">\n', '')
head = re.sub(r'<title>.*?</title>\s*', '', head)
# fonts: the site serves its own copy (fonts/, from site-add); no request to Google. The claude.ai copy keeps Google
# Fonts, the only font host its page rules allow.
GFONTS = re.search(r'<link rel="preconnect" href="https://fonts.googleapis.com">.*?display=swap">\n', head, re.S)
assert GFONTS, 'the Google Fonts links moved: update build.py'
head_site = head.replace(GFONTS.group(0), f'<link rel="stylesheet" href="{up}fonts/fonts.css">\n')
# what messengers and search show for a link: the language's own title, text and card (absolute addresses)
BASE = 'https://govorilki.com/play/'
URL = BASE + META['path']
SHARE = f'''<title>{META['title']}</title>
<link rel="canonical" href="{URL}">
<link rel="alternate" hreflang="en" href="{BASE}">
<link rel="alternate" hreflang="ru" href="{BASE}ru/">
<link rel="alternate" hreflang="pt-PT" href="{BASE}pt/">
<link rel="alternate" hreflang="de" href="{BASE}de/">
<link rel="alternate" hreflang="x-default" href="{BASE}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="{META['name']}">
<meta property="og:title" content="{META['name']}">
<meta property="og:description" content="{META['desc']}">
<meta property="og:url" content="{URL}">
<meta property="og:image" content="{BASE}img/og-{lang}.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="{META['name']}">
<meta property="og:locale" content="{META['loc']}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{META['name']}">
<meta name="twitter:description" content="{META['desc']}">
<meta name="twitter:image" content="{BASE}img/og-{lang}.png">'''
script = rest.strip()
# the Russian page's pronunciation dictionary (made by build/say_ru.py): a data pack next to the page, inline in the
# claude.ai copy
_sp = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'site-data', 'say-ru.json')
SAYRU = _sp if lang == 'ru' and os.path.exists(_sp) else None
# the version the page shows in the control panel: the number of the offline copy in sw.js
_v = re.search(r"govorilki-v(\d+)", open(os.path.join(SITE, 'sw.js')).read())
script = script.replace("/*__VER__*/''", repr(_v.group(1) if _v else ''))
script = script.replace(
"""const hot = window.claude && window.claude.hot;
if (hot && typeof hot.ready === 'function') { try { hot.ready(() => goHome()); } catch (e) { goHome(); } }
else goHome();""", "goHome();")
if META['saved']: script = script.replace('Прогресс хранится только в этом браузере.', META['saved'])
assert 'goHome();\n})();' in script
def make_page(script, head=head_site):
  return f'''<!doctype html>
<html lang="{lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="description" content="{META['desc']}">
{SHARE}
<meta name="theme-color" content="#CDEEF6">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" type="image/png" href="{up}icons/icon-192.png">
<link rel="apple-touch-icon" href="{up}icons/apple-touch-icon.png">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="{META['short']}">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<style>
/* people can pinch-zoom (no maximum-scale); manipulation keeps quick double taps on buttons from zooming, inputs are ≥16px */
:root{{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}}
html{{touch-action:manipulation}}
body{{margin:0;overscroll-behavior:none;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}}
input{{-webkit-user-select:text;user-select:text}}
img{{max-width:100%}}
[hidden]{{display:none!important}}
</style>
{head.strip()}
</head>
<body>
<div id="app"></div>
{script}
<script>
// a new version takes over right away: reload once when the updated worker starts controlling the page
if ('serviceWorker' in navigator) {{
  const had = !!navigator.serviceWorker.controller; let reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {{ if (had && !reloaded) {{ reloaded = true; location.reload(); }} }});
  addEventListener('load', () => navigator.serviceWorker.register('{up}sw.js').then(r => r.update()).catch(() => {{}}));
}}
</script>
</body>
</html>
'''
# the claude.ai copy (Russian): one file with everything inline, since it cannot fetch files next to it
DEV = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
if lang == 'ru':
  os.makedirs(os.path.join(DEV, 'artifact'), exist_ok=True)
  full = script.replace('/*__SAYRU__*/null', open(SAYRU, encoding='utf8').read().strip()) if SAYRU else script
  open(os.path.join(DEV, 'artifact', 'ru.html'), 'w', encoding='utf8').write(make_page(full, head))
# the site's page: big data the first screen does not need goes to data/<lang>/*.json (build/packs.js)
import subprocess, tempfile
with tempfile.TemporaryDirectory() as tmp:
  open(tmp + '/in.html', 'w', encoding='utf8').write(make_page(script))
  subprocess.run(['node', os.path.join(DEV, 'build', 'packs.js'), tmp + '/in.html', tmp + '/out.html', lang,
                  os.path.join(SITE, 'data', lang)] + (['sayru=' + SAYRU] if SAYRU else []), check=True)
  page = open(tmp + '/out.html', encoding='utf8').read()
# the first screen sooner: the game's script (2–3 MB) leaves the page for data/<lang>/app.<hash>.js, loaded with defer,
# so the page itself is small; until the script runs, the page shows the start screen's title and words (taken from the
# translated script, so every language gets its own), or only the title for a family that plays already
import hashlib
a = page.index('<div id="app"></div>'); b = page.index('<script>', a); c = page.index('</script>', b)
js = page[b + 8:c]
assert 'goHome();' in js, 'the game script moved: update build.py'
# the copy of the start screen is painted first, then the game draws its screen in the next frame
assert js.count('goHome();\n})();') == 1
js = js.replace('goHome();\n})();', "if (document.hidden || !document.fonts) goHome(); else Promise.race([window.__gvF || document.fonts.ready, new Promise(r => setTimeout(r, 1600))]).then(() => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(goHome, 0))));\n})();")
h = hashlib.sha1(js.encode('utf8')).hexdigest()[:10]
ddir = os.path.join(SITE, 'data', lang)
for f in os.listdir(ddir):
  if f.startswith('app.') and f.endswith('.js'): os.remove(os.path.join(ddir, f))
open(os.path.join(ddir, f'app.{h}.js'), 'w', encoding='utf8').write(js)
def pick(rx):
  m = re.search(rx, js); return m.group(1) if m else ''
logo = pick(r'\[\.\.\.[\'"]([^\'"]+)[\'"]\]\.map\(c => `<span class="lt')
tag = pick(r'<p class="lp-tag">([^<$`]+)</p>')
free = pick(r'<p class="lp-free">([^<$`]+)</p>')
assert logo and tag, 'the start screen moved: update the first-screen copy in build.py'
letters = ''.join(f'<span class="lt" data-c="{ch}"></span>' for ch in logo)
skel = f'''<div id="app"><script>(function(){{var k='calm';try{{var r=JSON.parse(localStorage.getItem('govorilki-v2')||'null');if(r&&r.profiles&&Object.keys(r.profiles).length)document.documentElement.classList.add('gv-ret');var p=r&&r.profiles&&r.profiles[r.cur],f=r&&r.families&&r.families[r.curFam];k=(p&&p.settings&&p.settings.look)||(f&&f.look)||k}}catch(e){{}}document.body.classList.toggle('look-calm',k!=='bright');document.body.classList.toggle('look-dark',k==='dark')}})()</script><style>.lp-skel{{visibility:hidden}}.gv-f .lp-skel{{visibility:visible}}.gv-ret .lp-skel{{display:none}}.lp-wait{{display:block;width:44px;height:44px;margin:28px auto;border-radius:50%;border:5px solid var(--line,#ddd);border-top-color:var(--tiger-deep,#e07a2e);animation:lpw 1s linear infinite}}@keyframes lpw{{to{{transform:rotate(1turn)}}}}</style><div class="screen"><main class="stage scroll" id="stage"><div class="lp"><header class="lp-hero"><h1 class="logo"><span class="vh">{logo}</span><span aria-hidden="true">{letters}</span></h1><p class="lp-tag lp-skel">{tag}</p><span class="lp-wait" role="progressbar" aria-label="…"></span>{f'<p class="lp-free lp-skel">{free}</p>' if free else ''}</header></div></main></div><script>(function(){{var F,G=new Promise(function(r){{F=function(){{document.documentElement.classList.add('gv-f');r()}}}});window.__gvF=G;try{{var p=document.querySelector('.lp-skel'),t=setTimeout(F,1500);document.fonts.load(getComputedStyle(p).font,p.textContent).then(function(){{clearTimeout(t);F()}},F)}}catch(e){{F()}}}})()</script></div>'''
# the script starts downloading once the copy is painted, so the fonts and the copy do not wait behind its megabytes
load = f'''<script>window.GV_APP='{up}data/{lang}/app.{h}.js';(window.__gvF||Promise.resolve()).then(function(){{var go=function(){{var s=document.createElement('script');s.src=window.GV_APP;document.body.appendChild(s)}};document.hidden?go():requestAnimationFrame(function(){{setTimeout(go,0)}})}})</script>'''
page = page[:a] + skel + '\n' + load + page[c + 9:]
open(out + '/index.html', 'w', encoding='utf8').write(page)
json.dump({
  "name": META['name'],
  "short_name": META['short'],
  "description": META['mdesc'],
  "lang": lang,
  "start_url": "./",
  "scope": "./",
  "display": "standalone",
  "orientation": "any",
  "background_color": "#CDEEF6",
  "theme_color": "#CDEEF6",
  "icons": [
    {"src": up + "icons/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any"},
    {"src": up + "icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any"},
    {"src": up + "icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable"}
  ]
}, open(out + '/manifest.webmanifest', 'w', encoding='utf8'), ensure_ascii=False, indent=2)
