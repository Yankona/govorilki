// The globe in the journey: opens from «Путешествие по миру», turns by a finger (phone, touch) and by the mouse (laptop),
// a tap names the right country or city and offers its journey stories; a second run offline, from the cache.
// Fictional children only (Тина). node tests/globe.js [base=http://localhost:8781/govorilki/] [langs=ru,en,pt,de]
const { chromium, devices } = require('playwright');
const D = require('path').join(__dirname, 'shots') + '/';
const BASE = process.argv[2] || 'http://localhost:8781/govorilki/', LANGS = (process.argv[3] || 'ru,en,pt,de').split(',');
const SUB = { ru: 'ru/', en: '', pt: 'pt/', de: 'de/' };
const HOOK = 'const fam = () => ROOT.families[ROOT.curFam] || null;';
const kid = (name, lang) => ({ stars: 5, plays: {}, learn: {}, book: { title: 'Т', log: {} }, settings: { name, gender: 'f', track: 'r', age: 6, friend: 'kitty', onboarded: true, lang } });
const seedOf = lang => ({ engine: 'device', micOff: true, srOff: true, parentPhone: true, cur: 'k1', curFam: 'f1', families: { f1: { id: 'f1', name: 'Т', cc: 'PT', kids: ['k1'], grands: [] } }, profiles: { k1: kid('Тина', lang) } });
let bad = 0; const fail = m => { bad++; console.log('  FAIL ' + m); };

async function ctxFor(b, dev, lang, hook = true) {
  const c = await b.newContext(dev === 'laptop' ? { viewport: { width: 1280, height: 800 } } : { ...devices['iPhone 13'], deviceScaleFactor: 2 });
  await c.route(/ntfy|wikipedia|huggingface|jsdelivr|youtube|wikimedia|workers\.dev/, r => r.abort());
  if (hook) await c.route(u => /\/(ru|de|pt|en)?\/?(index\.html)?$/.test(u.pathname), async r => { const x = await r.fetch(); let t = await x.text(); t = t.replace(HOOK, HOOK + ' window.__T = { run: s => eval(s) };'); r.fulfill({ response: x, body: t }); });
  await c.addInitScript(s => { window.__said = []; try { speechSynthesis.speak = u => { window.__said.push(u.text); setTimeout(() => u.onend && u.onend(), 5); }; } catch (e) {} if (localStorage.getItem('seeded')) return; localStorage.setItem('seeded', 1); localStorage.setItem('govorilki-v2', JSON.stringify(s)); }, seedOf(lang));
  return c;
}
async function drag(p, dev, x0, y0, dx, dy) {
  if (dev === 'laptop') { await p.mouse.move(x0, y0); await p.mouse.down(); for (let i = 1; i <= 8; i++) { await p.mouse.move(x0 + dx * i / 8, y0 + dy * i / 8); await p.waitForTimeout(16); } await p.mouse.up(); return; }
  const s = await p.context().newCDPSession(p), pt = (x, y) => [{ x, y, id: 1 }];
  await s.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: pt(x0, y0) });
  for (let i = 1; i <= 8; i++) { await s.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: pt(x0 + dx * i / 8, y0 + dy * i / 8) }); await p.waitForTimeout(16); }
  await s.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}
async function tapAt(p, dev, x, y) { if (dev === 'laptop') await p.mouse.click(x, y); else await p.touchscreen.tap(x, y); await p.waitForTimeout(400); }

(async () => {
  const b = await chromium.launch();
  for (const dev of ['phone', 'laptop']) for (const lang of LANGS) {
    const c = await ctxFor(b, dev, lang), p = await c.newPage(), errs = [];
    p.on('pageerror', e => errs.push(e.message));
    await p.goto(BASE + SUB[lang]); await p.waitForTimeout(1500);
    const who = await p.$$('.who-kid'); if (who.length) { await who[0].click(); await p.waitForTimeout(800); }
    await p.evaluate(() => window.__T.run('TRAVEL.screen()')); await p.waitForTimeout(700);
    const btn = await p.$('#tvGlobe'); if (!btn) { fail(`${dev} ${lang}: no globe button`); await c.close(); continue; }
    if (dev === 'phone') await p.screenshot({ path: D + `globe-${lang}-travel.png` });
    await btn.click(); await p.waitForTimeout(800);
    const box = await p.$eval('#glC', e => { const r = e.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width }; });
    const cx = box.x + box.w / 2, cy = box.y + box.w / 2, line = [`${dev} ${lang}: globe ${Math.round(box.w)}px`];
    // a drag turns it
    await p.evaluate(() => window.__T.run('GLOBE_SCREEN.look(0, 20)')); await p.waitForTimeout(100);
    await drag(p, dev, cx + 60, cy, -120, 40); await p.waitForTimeout(600);
    const st = await p.evaluate(() => window.__T.run('GLOBE_SCREEN.state()'));
    line.push(`drag → lon ${st.lon.toFixed(0)} lat ${st.lat.toFixed(0)}`);
    if (!(st.lon > 10 && st.lat > 25)) fail(`${dev} ${lang}: the drag did not turn the globe (${JSON.stringify(st)})`);
    // taps on countries away from the city dots, then on a capital
    for (const [lo, la, cc] of [[100, 62, 'RU'], [-55, -5, 'BR'], [134, -25, 'AU']]) {
      await p.evaluate(([lo, la]) => window.__T.run(`GLOBE_SCREEN.look(${lo}, ${la})`), [lo, la]); await p.waitForTimeout(120);
      await tapAt(p, dev, cx, cy);
      const s = await p.evaluate(() => window.__T.run('GLOBE_SCREEN.state()'));
      if (!s.sel || s.sel.cc !== cc || s.sel.city) fail(`${dev} ${lang}: tap at ${lo},${la} gave ${JSON.stringify(s.sel)}, not ${cc}`);
    }
    line.push('Australia: ' + (await p.$eval('#glInfo .gl-t', e => e.textContent.trim())));
    await p.evaluate(() => window.__T.run('GLOBE_SCREEN.look(-9.14, 38.72)')); await p.waitForTimeout(120);
    await tapAt(p, dev, cx, cy);
    const city = await p.evaluate(() => window.__T.run('GLOBE_SCREEN.state()'));
    if (!city.sel || !city.sel.city || city.sel.cc !== 'PT') fail(`${dev} ${lang}: Lisbon tap gave ${JSON.stringify(city.sel)}`);
    line.push('Lisbon: ' + (await p.$eval('#glInfo .gl-t', e => e.textContent.trim())) + ` | links ${await p.$$eval('#glInfo [data-k]', x => x.map(e => e.textContent).join(', '))}`);
    // Portugal itself, with its stories
    await p.evaluate(() => window.__T.run('GLOBE_SCREEN.look(-7.6, 37.6, 6)')); await p.waitForTimeout(120);
    await tapAt(p, dev, cx, cy);
    const links = await p.$$eval('#glInfo [data-k]', x => x.map(e => e.dataset.k));
    line.push(`Portugal links ${links.join(',')} (${(await p.$eval('#glInfo .gl-t', e => e.textContent.trim()))})`);
    if (!links.includes('pt')) fail(`${dev} ${lang}: Portugal has no link to its stories`);
    line.push('said: ' + JSON.stringify((await p.evaluate(() => window.__said.slice(-1)))[0] || '').slice(0, 120));
    await p.screenshot({ path: D + `globe-${dev}-${lang}.png` });
    if (links.includes("pt")) { await p.click('#glInfo [data-k="pt"]'); await p.waitForTimeout(700); if (!(await p.$$('.story-c')).length) fail(`${dev} ${lang}: the link did not open the stories`); }
    // an ocean
    await p.evaluate(() => window.__T.run('GLOBE_SCREEN.screen()')); await p.waitForTimeout(500);
    await p.evaluate(() => window.__T.run('GLOBE_SCREEN.look(-30, 30)')); await p.waitForTimeout(120);
    await tapAt(p, dev, cx, cy); line.push('ocean: ' + (await p.$eval('#glInfo .gl-t', e => e.textContent.trim())));
    if (errs.length) fail(`${dev} ${lang}: page errors ${JSON.stringify(errs)}`);
    console.log(line.join(' | '));
    await c.close();
  }
  // offline: once online (the worker keeps the page), then without the network, through the menus only
  {
    // a plain phone, no routes and no voice stub: the worker sees the page as a family would
    const c = await b.newContext({ ...devices['iPhone 13'] });
    await c.addInitScript(s => { if (localStorage.getItem('seeded')) return; localStorage.setItem('seeded', 1); localStorage.setItem('govorilki-v2', JSON.stringify(s)); }, seedOf('ru'));
    const p = await c.newPage(), errs = [];
    p.on('pageerror', e => errs.push(e.message));
    await p.goto(BASE + 'ru/'); await p.evaluate(() => navigator.serviceWorker && navigator.serviceWorker.ready); await p.waitForTimeout(1500);
    await p.reload(); await p.waitForTimeout(1500);
    await c.setOffline(true);
    await p.reload(); await p.waitForTimeout(2000);
    const who = await p.$$('.who-kid'); if (who.length) { await who[0].click(); await p.waitForTimeout(800); }
    await p.getByText('Узнаём').first().click({ timeout: 5000 }).catch(() => fail('offline: no «Узнаём» tab')); await p.waitForTimeout(1500);
    // the first tap on a home tile right after the tab is drawn can be lost in the test browser: try again
    for (let i = 0; i < 3 && !(await p.$('.bar h1')); i++) { await p.evaluate(() => { const t = document.querySelector('.tile[data-id="travel"]'); if (t) t.click(); }); await p.waitForTimeout(1000); }
    if (!(await p.$('.bar h1'))) fail('offline: the journey did not open');
    await p.screenshot({ path: D + 'globe-offline-0.png' });
    await p.click('#tvGlobe', { timeout: 5000 }).catch(() => fail('offline: no globe button'));
    await p.waitForTimeout(800);
    const box = await p.$eval('#glC', e => { const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }).catch(() => null);
    if (box) { await p.touchscreen.tap(box.x, box.y); await p.waitForTimeout(500); }
    const t = await p.$eval('#glInfo', e => e.textContent.trim()).catch(() => '');
    await p.screenshot({ path: D + 'globe-offline.png' });
    console.log(`offline ru: ${box ? 'globe drawn' : 'NO GLOBE'} | info: ${t.slice(0, 80)} | errors ${JSON.stringify(errs)}`);
    if (!box || errs.length) fail('offline');
    await c.close();
  }
  await b.close(); console.log(bad ? `FAIL: ${bad}` : 'OK: globe'); process.exit(bad ? 1 : 0);
})();
