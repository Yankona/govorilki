// The site's first pages and search tags (task seo-week1). Needs the site built: APP_DIR=. python3 www/build.py
// and served: (cd www/dist && python3 -m http.server 8790 --bind 127.0.0.1 &) — plus tests/serve.sh for the game.
// 1. www/dist: every page has a unique title and description, a canonical, the one hreflang set with x-default (and the
//    alternates point back); sitemap.xml has the same set; robots.txt closes /play/ only; no redirect of «/».
// 2. «/», /ru/, /en/, /pt/, /de/ on a phone and a laptop: no horizontal scroll, the Play button opens the game.
// 3. The game (ru/en/pt/de): the heading reads as a word, the page can be zoomed, inputs are ≥16px (no zoom on focus).
// node tests/seo_week1.js [site=http://localhost:8790/] [game=http://localhost:8781/govorilki/]
const { chromium, devices } = require('playwright');
const fs = require('fs'), path = require('path');
const SITE = process.argv[2] || 'http://localhost:8790/', GAME = process.argv[3] || 'http://localhost:8781/govorilki/';
const DIST = path.join(__dirname, '..', '..', 'www', 'dist'), SHOTS = path.join(__dirname, 'shots');
const bad = []; const ok = (c, m) => { if (!c) bad.push(m); };
const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? (e.name === 'play' ? [] : walk(path.join(d, e.name))) : [path.join(d, e.name)]);
const attr = (t, re) => [...t.matchAll(re)].map(m => m[1]);

// 1. tags
const pages = walk(DIST).filter(f => f.endsWith('index.html'));
const T = {}, D = {}, H = {};
for (const f of pages) {
  const t = fs.readFileSync(f, 'utf8'), rel = '/' + path.relative(DIST, path.dirname(f)).replace(/\\/g, '/');
  const u = 'https://govorilki.com' + (rel === '/' ? '/' : rel + '/');
  const title = attr(t, /<title>([^<]*)<\/title>/g)[0], desc = attr(t, /<meta name="description" content="([^"]*)"/g)[0];
  ok(title && !T[title], `${u}: title missing or repeated`); T[title] = u;
  ok(desc && !D[desc], `${u}: description missing or repeated`); D[desc] = u;
  ok(attr(t, /<link rel="canonical" href="([^"]*)"/g)[0] === u, `${u}: canonical`);
  const hl = Object.fromEntries([...t.matchAll(/<link rel="alternate" hreflang="([^"]*)" href="([^"]*)"/g)].map(m => [m[1], m[2]]));
  ok(hl['x-default'], `${u}: no x-default`);
  ok(Object.keys(hl).every(k => ['ru', 'en', 'pt-PT', 'de', 'x-default'].includes(k)), `${u}: odd hreflang ${Object.keys(hl)}`);
  ok(!/googletagmanager|google-analytics|gtag\(|facebook\.net|yandex\.ru\/metrika|mc\.yandex/.test(t), `${u}: a tracker`);
  ok(!/maximum-scale|user-scalable/.test(t), `${u}: zoom blocked`);
  H[u] = hl;
}
for (const [u, hl] of Object.entries(H)) for (const [k, v] of Object.entries(hl)) {
  ok(H[v], `${u}: hreflang ${k} → ${v} is not a page`);
  if (H[v] && k !== 'x-default') ok(Object.values(H[v]).includes(u) || u === 'https://govorilki.com/', `${v} does not point back to ${u}`);
}
const sm = fs.readFileSync(path.join(DIST, 'sitemap.xml'), 'utf8');
const locs = attr(sm, /<loc>([^<]*)<\/loc>/g);
ok(locs.length === pages.length - 0 && locs.every(l => H[l]), `sitemap: ${locs.length} urls for ${pages.length} pages`);
ok((sm.match(/hreflang="x-default"/g) || []).length === locs.length, 'sitemap: x-default on every url');
ok(/^<\?xml/.test(sm) && (sm.match(/<url>/g) || []).length === (sm.match(/<\/url>/g) || []).length, 'sitemap: xml');
const rb = fs.readFileSync(path.join(DIST, 'robots.txt'), 'utf8');
ok(/Disallow: \/play\//.test(rb) && /Sitemap: https:\/\/govorilki\.com\/sitemap\.xml/.test(rb) && !/Disallow: \/\s*$/m.test(rb), 'robots.txt');
ok(!fs.existsSync(path.join(DIST, '_redirects')), '_redirects still there (302 on «/»)');
console.log(`tags: ${pages.length} pages, ${locs.length} sitemap urls`);
const table = Object.entries(H).filter(([u]) => /\.com\/((ru|en|pt|de)\/)?$/.test(u) || /\/r\/$|\/sound-r\//.test(u));

(async () => {
  const b = await chromium.launch();
  // 2. the first pages
  for (const dev of ['phone', 'laptop']) {
    const c = await b.newContext(dev === 'laptop' ? { viewport: { width: 1280, height: 800 } } : { ...devices['iPhone 13'], deviceScaleFactor: 1 });
    for (const sub of ['', 'ru/', 'en/', 'pt/', 'de/']) {
      const p = await c.newPage(), errs = []; p.on('pageerror', e => errs.push(e.message));
      const r = await p.goto(SITE + sub); ok(r.status() === 200 && r.url() === SITE + sub, `${sub || '/'}: status ${r.status()} ${r.url()}`);
      await p.waitForTimeout(400);
      const sw = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      ok(sw <= 0, `${dev} ${sub || '/'}: horizontal scroll ${sw}px`);
      await p.screenshot({ path: `${SHOTS}/seo-home-${sub.replace('/', '') || 'root'}-${dev}.png`, fullPage: sub === '' });
      const btn = sub ? p.locator('.hero-cta .btn').first() : p.locator('#play');
      const href = await btn.getAttribute('href');
      ok(/\/play\//.test(href), `${sub || '/'}: play href ${href}`);
      await btn.click(); await p.waitForURL(/\/play\//, { timeout: 8000 }).catch(() => ok(false, `${dev} ${sub || '/'}: play did not open`));
      ok(!errs.length, `${sub || '/'}: errors ${errs}`);
      await p.close();
    }
    await c.close();
  }
  // 3. the game
  for (const [lang, sub, word] of [['ru', 'ru/', 'Говорилки'], ['en', '', 'Chatterbox'], ['pt', 'pt/', 'Tagarelas'], ['de', 'de/', 'Plaudertaschen']]) {
    const c = await b.newContext({ ...devices['iPhone SE'] });
    await c.route(/ntfy|wikipedia|huggingface|jsdelivr|youtube|wikimedia|workers\.dev/, r => r.abort());
    const p = await c.newPage(), errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto(GAME + sub); await p.waitForTimeout(1800);
    const vp = await p.$eval('meta[name=viewport]', m => m.content);
    ok(!/maximum-scale|user-scalable/.test(vp), `game ${lang}: viewport ${vp}`);
    const desc = await p.$eval('meta[name=description]', m => m.content);
    ok([...desc].length <= 155, `game ${lang}: description ${[...desc].length} chars`);
    const title = await p.title(); ok(!/(\S )\S \S /.test(title), `game ${lang}: title ${title}`);
    const h1 = await p.$$eval('h1', hs => hs.map(h => h.innerText.trim() + ' | ' + h.textContent.trim()));
    const logo = await p.$eval('h1.logo', h => ({ text: h.textContent, inner: h.innerText, w: h.getBoundingClientRect().width })).catch(() => null);
    if (logo) {
      ok(logo.text.startsWith(word) && !/(\S )\S \S /.test(logo.text), `game ${lang}: heading text «${logo.text}»`);
      ok(logo.w > 100, `game ${lang}: heading not drawn`);
      await p.locator('h1.logo').screenshot({ path: `${SHOTS}/seo-logo-${lang}.png` });
    } else console.log(`game ${lang}: no h1.logo on the first screen (${h1.join(' / ')})`);
    // every input the first screens show is ≥16px (iOS zooms into smaller ones)
    const small = await p.$$eval('input,textarea,select', els => els.filter(e => e.offsetParent && parseFloat(getComputedStyle(e).fontSize) < 16).map(e => e.outerHTML.slice(0, 80)));
    ok(!small.length, `game ${lang}: small inputs ${small}`);
    ok(!errs.length, `game ${lang}: errors ${errs}`);
    console.log(`game ${lang}: «${title}» | logo «${logo ? logo.text : '-'}» | viewport ${vp}`);
    await c.close();
  }
  // every textarea/input rule in the game's CSS is ≥16px
  const css = fs.readFileSync(path.join(__dirname, '..', 'game', 'govorilki.html'), 'utf8');
  const tiny = [...css.matchAll(/(?:^|[},])([^{}]*\b(?:input|textarea|select)\b[^{}]*)\{([^}]*)\}/g)].filter(m => /font:[^;]*?\b(1[0-5]|[0-9])px/.test(m[2]) || /font-size:(1[0-5]|[0-9])px/.test(m[2])).map(m => m[1].trim().slice(-50));
  ok(!tiny.length, `game css: inputs under 16px: ${tiny}`);
  await b.close();
  console.log('hreflang (homes and one article):');
  for (const [u, hl] of table) console.log('  ' + u.replace('https://govorilki.com', '') + ' → ' + Object.entries(hl).map(([k, v]) => k + ' ' + v.replace('https://govorilki.com', '')).join(', '));
  console.log(bad.length ? 'FAIL\n' + bad.join('\n') : 'OK: seo-week1');
  process.exit(bad.length ? 1 : 0);
})();
