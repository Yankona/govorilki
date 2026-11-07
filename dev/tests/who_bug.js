// «Кто играет?» shows again after a child is picked? A family signed in by its login, the server answers slowly
const { chromium, devices } = require('playwright');
const D = require('path').join(__dirname, 'shots') + '/';
const PAGE = process.argv[2] || 'http://localhost:8781/govorilki/ru/';
const DELAY = +(process.argv[3] || 1200), MODE = process.argv[4] || 'tap';
const kid = (name, g, tr, age, fr, stars, upd) => ({ stars, upd, plays: {}, likeG: {}, book: { title: 'Т', log: {} }, settings: { name, gender: g, track: tr, age, friend: fr, onboarded: true, lang: 'ru' } });
(async () => {
  const b = await chromium.launch(), log = (...a) => console.log(...a);
  const now = Date.now();
  const fam = { engine: 'device', micOff: true, srOff: true, parentPhone: true, cur: 'k1', curFam: 'ft', families: { ft: { id: 'ft', name: 'Т', cc: 'PT', kids: ['k1', 'k2'], grands: [], cloud: { token: 'tok', login: 'tinatosha', sent: { k1: now - 9e6, k2: now - 9e6 }, at: now - 9e6 } } }, profiles: { k1: kid('Тина', 'f', 'r', 5, 'kitty', 35, now - 9e6), k2: kid('Тоша', 'm', 'l', 8, 'tiger', 140, now - 9e6) } };
  // the server has newer copies (another phone played)
  const server = { ok: true, meta: { name: 'Т', cc: 'PT', kids: ['k1', 'k2'], grands: [] }, kids: [{ id: 'k1', upd: now - 1000, profile: kid('Тина', 'f', 'r', 5, 'kitty', 40, now - 1000) }, { id: 'k2', upd: now - 1000, profile: kid('Тоша', 'm', 'l', 8, 'tiger', 150, now - 1000) }] };
  const c = await b.newContext(MODE === 'mouse' ? { viewport: { width: 1000, height: 700 } } : { ...devices['iPhone 13'], deviceScaleFactor: 1 });
  const calls = [];
  await c.route(/ntfy|wikipedia|huggingface|jsdelivr|youtube|wikimedia/, r => r.abort());
  await c.route(/workers\.dev/, async r => {
    const u = new URL(r.request().url()); calls.push(`${((Date.now() - T0) / 1000).toFixed(1)}s ${r.request().method()} ${u.pathname}`);
    if (u.pathname === '/v1/family' && r.request().method() === 'GET') { await new Promise(x => setTimeout(x, DELAY)); return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(server) }); }
    return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, upd: Date.now() }) });
  });
  await c.addInitScript(s => { try { speechSynthesis.speak = u => setTimeout(() => u.onend && u.onend(), 5); } catch (e) {} if (localStorage.getItem('seeded')) return; localStorage.setItem('seeded', 1); localStorage.setItem('govorilki-v2', JSON.stringify(s)); }, fam);
  const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  const screens = []; let last = '';
  const where = () => p.evaluate(() => document.querySelector('.who-grid') ? 'WHO' : document.querySelector('#tabBar') ? 'HOME:' + ((document.querySelector('.kid.sel') || {}).textContent || '') : document.querySelector('.who-sub') ? 'LOADING' : 'other').catch(() => 'nav');
  const T0 = Date.now();
  const watch = setInterval(async () => { const w = await where(); if (w !== last) { last = w; screens.push(`${((Date.now() - T0) / 1000).toFixed(1)}s ${w}`); } }, 100);
  await p.goto(PAGE);
  // tap the child as soon as «Кто играет?» shows its children
  await p.waitForSelector('.who-kid', { timeout: 15000 });
  // the app comes back to the screen: the family's sync starts again (iPhone fires this when the app is reopened)
  const VIS = +(process.argv[5] || -1), AT = +(process.argv[6] || 0);
  if (VIS >= 0) { await p.waitForTimeout(VIS); await p.evaluate(() => document.dispatchEvent(new Event('visibilitychange'))); screens.push(`${((Date.now() - T0) / 1000).toFixed(1)}s visibilitychange`); }
  await p.waitForTimeout(AT);
  const t = ((Date.now() - T0) / 1000).toFixed(1);
  const k = (await p.$$('.who-kid'))[1];
  if (MODE === 'mouse') await k.click(); else await k.tap();
  screens.push(`${t}s → tapped Тоша`);
  await p.waitForTimeout(9000);
  clearInterval(watch);
  log(`delay ${DELAY} ms, ${MODE}:`); screens.forEach(x => log('  ', x)); log('  calls:', calls.join(' | ')); log('  errs', JSON.stringify(errs));
  await b.close();
})();
