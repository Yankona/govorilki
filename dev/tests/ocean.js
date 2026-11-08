// ocean-water: «Океан в глубину» (scroll down, depth meter, every animal tappable with its card and voice, the finish),
// «Как вода путешествует» (every stage tappable, the learn finish, «По порядку» with a hint and the finish), the water
// stories (Russian only); 4 languages, phone (iPhone 13) and laptop. Usage: node tests/ocean.js [base url] [phone|laptop]
const { chromium, devices } = require('playwright');
const D = require('path').join(__dirname, 'shots') + '/';
const BASE = process.argv[2] || 'http://localhost:8781/govorilki/', DEV = process.argv[3] || 'phone';
const HOOK = 'const fam = () => ROOT.families[ROOT.curFam] || null;';
const kid = (name, g, age, fr, lang) => ({ stars: 5, plays: {}, book: { title: 'Т', log: {} }, settings: { name, gender: g, track: 'r', age, friend: fr, onboarded: true, lang } });
let bad = 0; const ok = (c, m) => { console.log((c ? '  ok  ' : '  FAIL ') + m); if (!c) bad++; };
const cyr = s => /[А-яЁё]/.test(s.replace(/Тина|Тоша/g, ''));
(async () => {
  require('fs').mkdirSync(D, { recursive: true });
  const b = await chromium.launch();
  for (const [lang, path] of [['ru', 'ru/'], ['en', ''], ['pt', 'pt/'], ['de', 'de/']]) {
    console.log(lang, DEV);
    const fam = { engine: 'device', micOff: true, srOff: true, parentPhone: true, cur: 'k1', curFam: 'f1', families: { f1: { id: 'f1', name: 'Т', cc: 'PT', kids: ['k1', 'k2'], grands: [] } }, profiles: { k1: kid('Тина', 'f', 6, 'kitty', lang), k2: kid('Тоша', 'm', 8, 'tiger', lang) } };
    const c = await b.newContext(DEV === 'phone' ? { ...devices['iPhone 13'], deviceScaleFactor: 1 } : { viewport: { width: 1280, height: 800 } });
    await c.route(/ntfy|wikipedia|huggingface|jsdelivr|youtube|wikimedia|workers\.dev/, r => r.abort());
    await c.route(u => /\/(ru|de|pt|en)?\/?(index\.html)?$/.test(u.pathname), async r => { const x = await r.fetch(); let t = await x.text(); t = t.replace(HOOK, HOOK + ' window.__T = { run: s => eval(s) };'); r.fulfill({ response: x, body: t }); });
    await c.addInitScript(s => { window.__said = []; try { speechSynthesis.speak = u => { window.__said.push(u.text); setTimeout(() => u.onend && u.onend(), 5); }; } catch (e) {} if (localStorage.getItem('seeded')) return; localStorage.setItem('seeded', 1); localStorage.setItem('govorilki-v2', JSON.stringify(s)); }, fam);
    const p = await c.newPage(); const errs = []; p.on('pageerror', e => { errs.push(e.message); console.log('PAGEERR', e.stack.slice(0, 400)); });
    await p.goto(BASE + path); await p.waitForTimeout(1500);
    const who = await p.$$('.who-kid'); if (who.length) { await who[0].click(); await p.waitForTimeout(900); }
    const tap = async (x, y) => { if (DEV === 'phone') await p.touchscreen.tap(x, y); else await p.mouse.click(x, y); };
    await p.evaluate(() => { const t = document.querySelector('[data-tab="discover"]'); if (t) t.click(); }); await p.waitForTimeout(700);
    const tiles = await p.evaluate(() => ['water', 'ocean-deep', 'water-cycle', 'learn-water'].map(id => { const t = document.querySelector(`.tile[data-id="${id}"]`); return t ? t.innerText.replace(/\s+/g, ' ') : null; }));
    ok(tiles[0] && !tiles[1] && !tiles[2] && !tiles[3], 'one water tile on the discover tab: ' + tiles.join(' | '));
    ok(!(lang !== 'ru' && cyr(tiles.join(''))), 'tile translated');
    // ---- the water menu: three parts in Russian, two in the other languages
    const tile = await p.$('.tile[data-id="water"]');
    if (tile) { await tile.scrollIntoViewIfNeeded(); await tile.click(); await p.waitForTimeout(600); }
    if (!await p.$('.wh')) await p.evaluate(() => window.__T.run('OCEAN.hub()'));
    await p.waitForTimeout(500); await p.screenshot({ path: D + `water-${lang}-${DEV}-hub.png` });
    const parts = await p.$$eval('.wh-b', b => b.map(x => x.dataset.k + ':' + x.innerText.replace(/\s+/g, ' ')));
    ok(parts.length === (lang === 'ru' ? 3 : 2) && !(lang !== 'ru' && cyr(parts.join(''))), 'water menu: ' + parts.join(' | '));
    await p.click('.wh-b[data-k="deep"]'); await p.waitForTimeout(400);
    await p.waitForTimeout(800); await p.screenshot({ path: D + `ocean-${lang}-${DEV}-top.png` });
    ok(await p.$('#ocSea') !== null, 'ocean opened: ' + await p.$eval('.bar h1', e => e.textContent).catch(() => '-'));
    const ks = await p.$$eval('#ocSea .oc-a', a => a.map(x => x.dataset.k));
    let prevD = -1, deeper = true;
    for (const k of ks) {
      await p.evaluate(k => document.querySelector(`#ocSea .oc-a[data-k="${k}"]`).scrollIntoView({ block: 'center' }), k);
      await p.waitForTimeout(250);
      const pt = await p.evaluate(k => { const el = document.querySelector(`#ocSea .oc-a[data-k="${k}"]`), r = el.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2, e = document.elementFromPoint(x, y), g = e && e.closest('.oc-a'); return { x, y, hit: g ? g.dataset.k : (e ? String(e.className.baseVal ?? e.className) : null), meter: document.querySelector('#ocD').textContent }; }, k);
      const d = +pt.meter.replace(/\D/g, ''); if (d < prevD) deeper = false; prevD = d;
      ok(pt.hit === k, `${k}: tappable at ${pt.meter} (${pt.hit})`);
      const n0 = await p.evaluate(() => window.__said.length);
      await tap(pt.x, pt.y); await p.waitForTimeout(600);
      const st = await p.evaluate(n0 => ({ h: document.querySelector('#ocCard h2') ? document.querySelector('#ocCard h2').textContent : '', t: document.querySelector('#ocCard p').textContent, said: window.__said.slice(n0).join(' ') }), n0);
      ok(st.t.length > 60 && st.said.length > 3 && !(lang !== 'ru' && cyr(st.t + st.said + st.h)), `${k}: «${st.h}» — ${st.said.slice(0, 60)}…`);
      if (k === 'whale' || k === 'squid' || k === 'bathy') await p.screenshot({ path: D + `ocean-${lang}-${DEV}-${k}.png` });
    }
    ok(ks.length === 15 && deeper && prevD > 9000, `meter goes deeper all the way: last ${prevD}`);
    await p.waitForSelector('.winbox', { timeout: 15000 }).catch(() => {});
    ok(await p.$('.winbox') !== null, 'all animals seen → ' + await p.$eval('.win-line', e => e.textContent).catch(() => '-'));
    // ---- the water cycle: learn
    await p.evaluate(() => window.__T.run('OCEAN.hub()')); await p.waitForTimeout(400); await p.click('.wh-b[data-k="cycle"]'); await p.waitForTimeout(800);
    await p.screenshot({ path: D + `water-${lang}-${DEV}-open.png` });
    for (let s = 0; s < 6; s++) {
      const pt = await p.evaluate(s => { const g = document.querySelector(`#wcSvg .wc-g[data-s="${s}"]`), h = g.querySelector('circle,rect,path'), r = h.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2, e = document.elementFromPoint(x, y), w = e && e.closest('.wc-g'); return { x, y, hit: w ? +w.dataset.s : null }; }, s);
      ok(pt.hit === s, `stage ${s + 1}: tappable (${pt.hit})`);
      const n0 = await p.evaluate(() => window.__said.length);
      await tap(pt.x, pt.y); await p.waitForTimeout(600);
      const st = await p.evaluate(n0 => ({ on: document.querySelector('#wcSvg').dataset.on, h: document.querySelector('#wcCard h2').textContent, said: window.__said.slice(n0).join(' ') }), n0);
      ok(+st.on === s && st.said.length > 3 && !(lang !== 'ru' && cyr(st.h + st.said)), `stage ${s + 1}: «${st.h}» — ${st.said.slice(0, 60)}…`);
      if (s === 3) await p.screenshot({ path: D + `water-${lang}-${DEV}-rain.png` });
    }
    await p.waitForSelector('.winbox', { timeout: 15000 }).catch(() => {});
    ok(await p.$('.winbox') !== null, 'six stages → ' + await p.$eval('.win-line', e => e.textContent).catch(() => '-'));
    // ---- in order
    await p.evaluate(() => window.__T.run("OCEAN.cycle('order')")); await p.waitForTimeout(700);
    const wrong = await p.$('#wcCards .wc-c:not([data-s="0"])');
    await wrong.click(); await p.waitForTimeout(200); await wrong.click(); await p.waitForTimeout(300);
    const hint = await p.$eval('#wcCards .wc-c.hint', e => e.dataset.s).catch(() => null), line = await p.$eval('#wcCard p', e => e.textContent);
    ok(hint === '0' && !(lang !== 'ru' && cyr(line)), `two misses → «${line}», the sun blinks`);
    await p.screenshot({ path: D + `water-${lang}-${DEV}-order.png` });
    for (let s = 0; s < 6; s++) { const h0 = await p.$('#wcCard h2'); await p.click(`#wcCards .wc-c[data-s="${s}"]`); if (s < 5) await p.waitForFunction(h => !h.isConnected, h0, { timeout: 8000 }).catch(() => {}); if (s === 3) await p.screenshot({ path: D + `water-${lang}-${DEV}-order4.png` }); }
    await p.waitForSelector('.winbox', { timeout: 15000 }).catch(() => {});
    ok(await p.$('.winbox') !== null, 'in order → ' + await p.$eval('.win-line', e => e.textContent).catch(() => '-'));
    // ---- the stories (Russian)
    if (lang === 'ru') {
      const n = await p.evaluate(() => window.__T.run('LEARN.water.items.length'));
      ok(n === 20, 'water stories: ' + n);
      await p.evaluate(() => window.__T.run('OCEAN.hub()')); await p.waitForTimeout(400); await p.click('.wh-b[data-k="stories"]'); await p.waitForTimeout(700);
      await p.screenshot({ path: D + `water-stories-${DEV}.png` });
      ok((await p.$eval('#stage', e => e.innerText)).includes('Байкал'), 'stories list shows');
    } else ok(await p.evaluate(() => window.__T.run('!LEARN.water')), 'no water stories section');
    ok(!errs.length, 'page errors: ' + JSON.stringify(errs));
    await c.close();
  }
  await b.close();
  console.log(bad ? `FAILED ${bad}` : 'ALL OK'); process.exit(bad ? 1 : 0);
})();
