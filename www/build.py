#!/usr/bin/env python3
"""The website of «Говорилки» (Chatterbox, Tagarelas): static pages for search, in Russian, English and Portuguese.

content/{ru,en,pt}.json hold the texts (see the shape in content/README.md); this script writes dist/:
  /                      the three languages (x-default)
  /{lang}/               the home page of each language
  /{lang}/{slug}/        the articles
  /sitemap.xml, /robots.txt, /404.html, /assets/…
SITE_URL (env) is the address the pages are served from; the game is copied to /play/ from APP_DIR (yankona.github.io/govorilki moves there).
Run: python3 www/build.py  (writes www/dist)
"""
import html, json, os, re, shutil, datetime

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'dist')
SITE = os.environ.get('SITE_URL', 'https://govorilki.com').rstrip('/')
LANGS = ['ru', 'en', 'pt']
KEYS = ['home', 'r', 'l', 's', 'gym', 'read', 'grand', 'faq']
APP = {'ru': SITE + '/play/ru/', 'en': SITE + '/play/', 'pt': SITE + '/play/pt/'}
# the game itself is served from /play/ of the same site (APP_DIR: the folder with its built files, the repository's root)
APP_DIR = os.environ.get('APP_DIR', '')
APP_FILES = ['index.html', 'ru', 'en', 'pt', 'art', 'img', 'trips', 'engine', 'icons', 'sw.js', 'manifest.webmanifest']
HL = {'ru': 'ru', 'en': 'en', 'pt': 'pt-PT'}
OG_LOCALE = {'ru': 'ru_RU', 'en': 'en_GB', 'pt': 'pt_PT'}
SHORT = {'ru': 'RU', 'en': 'EN', 'pt': 'PT'}
TODAY = datetime.date.today().isoformat()
FRIENDS = ['tiger', 'kitty', 'panda', 'unicorn', 'ghost']

C = {l: json.load(open(os.path.join(HERE, 'content', l + '.json'), encoding='utf-8')) for l in LANGS}
for l in LANGS:
    assert set(C[l]['pages']) >= set(KEYS), (l, set(KEYS) - set(C[l]['pages']))

esc = lambda s: html.escape(str(s), quote=True)
def path(l, k):
    slug = C[l]['pages'][k]['slug'].strip('/')
    return f'/{l}/' + (slug + '/' if slug else '')
url = lambda l, k: SITE + path(l, k)

ALLOWED = re.compile(r'</?(p|ul|ol|li|strong|em|h3|br)\s*/?>', re.I)
def rich(l, s):
    """the content's small html: placeholders become links; anything outside the allowed tags is escaped"""
    def page(m):
        k, text = m.group(1), m.group(2)
        assert k in KEYS, k
        return f'\x00a href="{path(l, k)}"\x01{esc(text)}\x00/a\x01'
    s = re.sub(r'\{\{page:(\w+)\|([^}]*)\}\}', page, s)
    s = re.sub(r'\{\{play\|([^}]*)\}\}', lambda m: f'\x00a href="{APP[l]}"\x01{esc(m.group(1))}\x00/a\x01', s)
    parts = re.split(r'(</?(?:p|ul|ol|li|strong|em|h3|br)\s*/?>)', s, flags=re.I)
    out = ''.join(p if ALLOWED.fullmatch(p or '') else esc(p) for p in parts)
    return out.replace('\x00', '<').replace('\x01', '>').replace('&quot;', '"').replace('&#x27;', "'")

def plain(s):
    s = re.sub(r'\{\{page:\w+\|([^}]*)\}\}', r'\1', s); s = re.sub(r'\{\{play\|([^}]*)\}\}', r'\1', s)
    return re.sub(r'<[^>]+>', '', s)

CSS = open(os.path.join(HERE, 'site.css'), encoding='utf-8').read()
# search engines' ownership checks (Google Search Console, Yandex Webmaster, Bing): www/verify.json {"google": "…", "yandex": "…", "bing": "…"}
VERIFY = json.load(open(os.path.join(HERE, 'verify.json'))) if os.path.exists(os.path.join(HERE, 'verify.json')) else {}
VERIFY_META = ''.join(f'<meta name="{n}" content="{html.escape(VERIFY[k], quote=True)}">' for k, n in (('google', 'google-site-verification'), ('yandex', 'yandex-verification'), ('bing', 'msvalidate.01')) if VERIFY.get(k))

def head(l, k, title, desc, canonical, alts, ld, og_type='website'):
    links = ''.join(f'<link rel="alternate" hreflang="{HL[a]}" href="{u}">' for a, u in alts.items())
    links += f'<link rel="alternate" hreflang="x-default" href="{SITE}/">' if k in ('home', None) else f'<link rel="alternate" hreflang="x-default" href="{alts.get("en", canonical)}">'
    og_alt = ''.join(f'<meta property="og:locale:alternate" content="{OG_LOCALE[a]}">' for a in alts if a != l)
    return f'''<!doctype html>
<html lang="{HL[l] if l else 'ru'}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{esc(title)}</title>
<meta name="description" content="{esc(desc)}">{VERIFY_META}
<link rel="canonical" href="{canonical}">
{links}
<meta property="og:type" content="{og_type}">
<meta property="og:site_name" content="Говорилки · Chatterbox · Tagarelas">
<meta property="og:title" content="{esc(title)}">
<meta property="og:description" content="{esc(desc)}">
<meta property="og:url" content="{canonical}">
<meta property="og:image" content="{SITE}/assets/og-{l or 'ru'}.png">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta property="og:locale" content="{OG_LOCALE[l or 'ru']}">{og_alt}
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#FF8A2A">
<link rel="icon" type="image/png" sizes="192x192" href="/assets/icon-192.png">
<link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Balsamiq+Sans:wght@400;700&family=Nunito:wght@600;800&display=swap">
<style>{CSS}</style>
<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>
</head>
<body>'''

def topbar(l, k, alts):
    u = C[l]['ui']
    cur = ' aria-current="true"'
    langs = ''.join(f'<a href="{alts[a]}" hreflang="{HL[a]}" lang="{HL[a]}"{cur if a == l else ""}>{SHORT[a]}</a>' for a in LANGS if a in alts)
    return f'''<header class="top"><div class="wrap">
<a class="brand" href="{path(l, 'home')}"><img src="/assets/tiger.svg" alt="" width="40" height="40"><span>{esc(C[l]['brand'])}</span></a>
<nav class="langs" aria-label="Language">{langs}</nav>
<a class="btn sm" href="{APP[l]}">{esc(u['play'])}</a>
</div></header>'''

def cta(l):
    u = C[l]['ui']
    return f'''<div class="cta"><div class="cta-f">{''.join(f'<img src="/assets/{f}.svg" alt="" width="56" height="56">' for f in FRIENDS)}</div>
<a class="btn" href="{APP[l]}">{esc(u['play'])}</a><p class="sub">{esc(u['play_sub'])}</p><p class="sub"><a href="{APP[l]}#login">{esc(u['login'])}</a></p></div>'''

def faq_html(l, items):
    if not items: return ''
    qa = ''.join(f'<details><summary>{esc(i["q"])}</summary><div>{rich(l, "<p>" + i["a"] + "</p>") if "<p>" not in i["a"] else rich(l, i["a"])}</div></details>' for i in items)
    return f'<section class="faq" id="faq"><h2>{esc(C[l]["ui"]["faq"])}</h2>{qa}</section>'

def more(l, k):
    u = C[l]['ui']
    items = ''.join(f'<li><a href="{path(l, x)}">{esc(C[l]["pages"][x]["nav"])}</a></li>' for x in KEYS if x not in (k, 'home'))
    return f'<nav class="more" aria-label="{esc(u["articles"])}"><h2>{esc(u["articles"])}</h2><ul>{items}</ul></nav>'

def footer(l):
    u = C[l]['ui']
    pages = ''.join(f'<a href="{path(l, x)}">{esc(C[l]["pages"][x]["nav"])}</a>' for x in KEYS)
    langs = ''.join(f'<a href="{path(a, "home")}" hreflang="{HL[a]}" lang="{HL[a]}">{esc(C[a]["ui"]["lang_name"])}</a>' for a in LANGS)
    return f'''<footer><div class="wrap"><nav>{pages}</nav><nav class="fl">{langs}</nav>
<p>{esc(u['footer'])}</p><p class="disc">{esc(u['disclaimer'])}</p></div></footer>
</body></html>'''

def ld_for(l, k, pg, canonical):
    brand = C[l]['brand']
    org = {'@type': 'Organization', 'name': brand, 'url': SITE + path(l, 'home')}
    crumbs = {'@type': 'BreadcrumbList', 'itemListElement': [{'@type': 'ListItem', 'position': 1, 'name': brand, 'item': SITE + path(l, 'home')}]
              + ([{'@type': 'ListItem', 'position': 2, 'name': pg['nav'], 'item': canonical}] if k != 'home' else [])}
    graph = [crumbs]
    if k == 'home':
        graph += [{'@type': 'WebSite', 'name': brand, 'url': canonical, 'inLanguage': HL[l]},
                  {'@type': 'WebApplication', 'name': brand, 'url': APP[l], 'applicationCategory': 'EducationalApplication', 'operatingSystem': 'Web, iOS, Android',
                   'inLanguage': HL[l], 'description': pg['description'], 'offers': {'@type': 'Offer', 'price': '0', 'priceCurrency': 'EUR'},
                   'audience': {'@type': 'PeopleAudience', 'suggestedMinAge': 4, 'suggestedMaxAge': 12}, 'isAccessibleForFree': True}]
    else:
        graph.append({'@type': 'Article', 'headline': pg['h1'][:110], 'description': pg['description'], 'inLanguage': HL[l], 'mainEntityOfPage': canonical,
                      'author': org, 'publisher': org, 'datePublished': '2026-11-05', 'dateModified': TODAY, 'image': f'{SITE}/assets/og-{l}.png'})
    if pg.get('faq'):
        graph.append({'@type': 'FAQPage', 'mainEntity': [{'@type': 'Question', 'name': i['q'], 'acceptedAnswer': {'@type': 'Answer', 'text': plain(i['a'])}} for i in pg['faq']]})
    return {'@context': 'https://schema.org', '@graph': graph}

def page(l, k):
    pg = C[l]['pages'][k]; u = C[l]['ui']
    canonical = url(l, k)
    alts = {a: url(a, k) for a in LANGS}
    secs = pg['sections']
    ids = [f's{i + 1}' for i in range(len(secs))]
    toc = '' if k == 'home' or len(secs) < 3 else f'<nav class="toc" aria-label="{esc(u["toc"])}"><b>{esc(u["toc"])}</b><ol>' + ''.join(f'<li><a href="#{i}">{esc(s["h2"])}</a></li>' for i, s in zip(ids, secs)) + '</ol></nav>'
    body = ''.join(f'<section id="{i}"><h2>{esc(s["h2"])}</h2>{rich(l, s["html"])}</section>' for i, s in zip(ids, secs))
    crumbs = '' if k == 'home' else f'<nav class="crumbs"><a href="{path(l, "home")}">{esc(C[l]["brand"])}</a> › <span>{esc(pg["nav"])}</span></nav>'
    imgs = ''.join(f'<img src="/assets/{f}.svg" alt="" width="84" height="84">' for f in FRIENDS)
    hero = f'<div class="hero-f">{imgs}</div>' if k == 'home' else ''
    top_cta = f'<p class="hero-cta"><a class="btn" href="{APP[l]}">{esc(u["play"])}</a></p><p class="sub center">{esc(u["play_sub"])}</p>' if k == 'home' else ''
    html_ = (head(l, k, pg['title'], pg['description'], canonical, alts, ld_for(l, k, pg, canonical), 'website' if k == 'home' else 'article')
             + topbar(l, k, alts)
             + f'<main class="wrap{" home" if k == "home" else ""}"><article>{crumbs}{hero}<h1>{esc(pg["h1"])}</h1><p class="lead">{esc(pg["lead"])}</p>{top_cta}{toc}{body}{cta(l)}{faq_html(l, pg.get("faq"))}</article>{more(l, k)}</main>'
             + footer(l))
    d = os.path.join(OUT, path(l, k).strip('/'))
    os.makedirs(d, exist_ok=True)
    open(os.path.join(d, 'index.html'), 'w', encoding='utf-8').write(html_)

def hub():
    alts = {a: url(a, 'home') for a in LANGS}
    ld = {'@context': 'https://schema.org', '@type': 'WebSite', 'name': 'Говорилки · Chatterbox · Tagarelas', 'url': SITE + '/'}
    title = 'Говорилки · Chatterbox · Tagarelas — игры для речи, чтения и счёта'
    cards = ''.join(f'''<a class="lang-card" href="{path(a, 'home')}" hreflang="{HL[a]}" lang="{HL[a]}" data-l="{a}"><b>{esc(C[a]['brand'])}</b><span>{esc(C[a]['ui']['lang_name'])}</span><small>{esc(C[a]['pages']['home']['lead'])}</small></a>''' for a in LANGS)
    h = head('ru', None, title, C['ru']['pages']['home']['description'], SITE + '/', alts, ld)
    h += f'''<main class="wrap hub"><div class="hero-f">{"".join(f'<img src="/assets/{f}.svg" alt="" width="84" height="84">' for f in FRIENDS)}</div>
<h1>Говорилки · Chatterbox · Tagarelas</h1><div class="lang-cards">{cards}</div></main>
<script>try{{var n=(navigator.language||'').slice(0,2),c=document.querySelector('[data-l="'+n+'"]');if(c)c.classList.add('mine')}}catch(e){{}}</script>
</body></html>'''
    open(os.path.join(OUT, 'index.html'), 'w', encoding='utf-8').write(h)

def extras():
    urls = []
    for k in KEYS:
        for l in LANGS:
            alts = ''.join(f'<xhtml:link rel="alternate" hreflang="{HL[a]}" href="{url(a, k)}"/>' for a in LANGS)
            urls.append(f'<url><loc>{url(l, k)}</loc><lastmod>{TODAY}</lastmod>{alts}</url>')
    urls.insert(0, f'<url><loc>{SITE}/</loc><lastmod>{TODAY}</lastmod></url>')
    open(os.path.join(OUT, 'sitemap.xml'), 'w', encoding='utf-8').write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' + '\n'.join(urls) + '\n</urlset>\n')
    open(os.path.join(OUT, 'robots.txt'), 'w').write(f'User-agent: *\nAllow: /\nDisallow: /play/\n\nSitemap: {SITE}/sitemap.xml\n')
    open(os.path.join(OUT, '_headers'), 'w').write('/assets/*\n  Cache-Control: public, max-age=604800\n/play/sw.js\n  Cache-Control: no-cache\n/play/*\n  X-Robots-Tag: noindex\n')
    nf = head('ru', None, 'Говорилки · Chatterbox · Tagarelas', C['ru']['pages']['home']['description'], SITE + '/', {a: url(a, 'home') for a in LANGS}, {'@context': 'https://schema.org', '@type': 'WebPage'})
    nf = nf.replace('<head>', '<head>\n<meta name="robots" content="noindex">')
    nf += f'<main class="wrap hub"><div class="hero-f"><img src="/assets/ghost.svg" alt="" width="96" height="96"></div><h1>404</h1><div class="lang-cards">' + ''.join(f'<a class="lang-card" href="{path(a, "home")}"><b>{esc(C[a]["brand"])}</b><span>{esc(C[a]["ui"]["lang_name"])}</span></a>' for a in LANGS) + '</div></main></body></html>'
    open(os.path.join(OUT, '404.html'), 'w', encoding='utf-8').write(nf)

if __name__ == '__main__':
    shutil.rmtree(OUT, ignore_errors=True); os.makedirs(OUT)
    shutil.copytree(os.path.join(HERE, 'assets'), os.path.join(OUT, 'assets'))
    for l in LANGS:
        for k in KEYS: page(l, k)
    hub(); extras()
    if APP_DIR:
        for f in APP_FILES:
            src = os.path.join(APP_DIR, f); dst = os.path.join(OUT, 'play', f)
            if os.path.isdir(src): shutil.copytree(src, dst)
            elif os.path.exists(src): os.makedirs(os.path.dirname(dst), exist_ok=True); shutil.copy2(src, dst)
    n = sum(len(fs) for _, _, fs in os.walk(OUT))
    print(f'built {len(LANGS) * len(KEYS) + 1} pages, {n} files → {OUT} for {SITE}')
