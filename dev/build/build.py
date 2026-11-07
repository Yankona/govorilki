import sys, re, json
src, out = sys.argv[1], sys.argv[2]
lang = sys.argv[3] if len(sys.argv) > 3 else 'ru'
import os.path
SITE = os.environ.get('SITE') or os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
up = '' if os.path.abspath(out) == os.path.abspath(SITE) else '../'   # the main page sits at the top; the others one folder down share icons and the worker
META = {
  'ru': dict(desc='Логопедия, чтение, математика, шахматы, живопись и музыка для детей 4–12 лет. На русском, английском, португальском и немецком; бабушки и дедушки играют вместе с внуками.', short='Говорилки', name='Говорилки с Рыжиком', title='Говорилки с Рыжиком — игры для детей 4–12 лет', loc='ru_RU', path='ru/',
             mdesc='Логопедическая игра: дыхание, зарядка для язычка и игры со звуком Р.', saved='Прогресс хранится только на этом устройстве.'),
  'en': dict(desc='Speech, reading, maths, chess, art and music games for children aged 4–12. In English, German, Portuguese and Russian; grandparents can play along with their grandchildren.', short='Chatterbox', name='Chatterbox with Ginger', title='Chatterbox with Ginger — games for children aged 4–12', loc='en_GB', path='',
             mdesc='Speech and learning game: breathing, tongue workouts, sounds, reading and maths.', saved=None),
  'pt': dict(desc='Fala, leitura, matemática, xadrez, arte e música para crianças dos 4 aos 12 anos. Em português, inglês, alemão e russo; os avós também podem jogar com os netos.', short='Tagarelas', name='Tagarelas com o Ruivinho', title='Tagarelas com o Ruivinho — jogos para crianças dos 4 aos 12 anos', loc='pt_PT', path='pt/',
             mdesc='Jogo de fala e aprendizagem: respiração, ginástica da língua, sons, leitura e matemática.', saved=None),
  'de': dict(desc='Sprechen, Lesen, Mathe, Schach, Kunst und Musik für Kinder von 4 bis 12 Jahren. Auf Deutsch, Englisch, Portugiesisch und Russisch; Oma und Opa spielen mit den Enkeln mit.', short='Plaudertaschen', name='Plaudertaschen mit Rotschopf', title='Plaudertaschen mit Rotschopf — Spiele für Kinder von 4 bis 12', loc='de_DE', path='de/',
             mdesc='Sprach- und Lernspiel: Atmen, Zungengymnastik, Laute, Lesen und Mathe.', saved=None),
}[lang]
import os
os.makedirs(out, exist_ok=True)
s = open(src, encoding='utf8').read()
head, rest = s.split('<div id="app"></div>', 1)
head = head.replace('<meta name="claude:viewport-fit-sides" content="cover">\n', '')
head = re.sub(r'<title>.*?</title>\s*', '', head)
# what messengers and search show for a link: the language's own title, text and card (absolute addresses)
BASE = 'https://govorilki.com/play/'
URL = BASE + META['path']
SHARE = f'''<title>{META['title']}</title>
<link rel="canonical" href="{URL}">
<link rel="alternate" hreflang="en" href="{BASE}">
<link rel="alternate" hreflang="ru" href="{BASE}ru/">
<link rel="alternate" hreflang="pt" href="{BASE}pt/">
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
# the Russian page carries its pronunciation dictionary (made by build/say_ru.py)
if lang == 'ru':
    _sp = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'site-data', 'say-ru.json')
    if os.path.exists(_sp): script = script.replace('/*__SAYRU__*/null', open(_sp, encoding='utf8').read().strip())
# the version the page shows in the control panel: the number of the offline copy in sw.js
_v = re.search(r"govorilki-v(\d+)", open(os.path.join(SITE, 'sw.js')).read())
script = script.replace("/*__VER__*/''", repr(_v.group(1) if _v else ''))
script = script.replace(
"""const hot = window.claude && window.claude.hot;
if (hot && typeof hot.ready === 'function') { try { hot.ready(() => goHome()); } catch (e) { goHome(); } }
else goHome();""", "goHome();")
if META['saved']: script = script.replace('Прогресс хранится только в этом браузере.', META['saved'])
assert 'goHome();\n})();' in script
page = f'''<!doctype html>
<html lang="{lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,viewport-fit=cover">
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
:root{{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}}
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
