// Asia 1 (Сингапур, Япония): the globe's 📖 links lead to the new sections, Singapore is a tappable dot, 50 stories each.
// Based on globe.js. node tests/asia1.js [base] [langs]
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
    const cards = await p.$$eval('.tv-c', x => x.map(e => e.dataset.k + ':' + e.textContent));
    // the stories are Russian-only: other languages keep the sections they had (an empty section is hidden)
    const RU = lang === 'ru';
    for (const k of ['sgp', 'jpn']) if (RU && !cards.some(t => t.startsWith(k + ':') && /5[01]/.test(t))) fail(`${dev} ${lang}: no card for ${k} with 50/51 stories: ${cards.filter(t => t.startsWith(k)).join()}`);
    const info = await p.evaluate(() => window.__T.run("['sgp','jpn'].map(k => LEARN[k].items.length + ':' + FLAG(LEARN[k].place))"));
    await (await p.$('#tvGlobe')).click(); await p.waitForTimeout(800);
    const box = await p.$eval('#glC', e => { const r = e.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width }; });
    const cx = box.x + box.w / 2, cy = box.y + box.w / 2, line = [`${dev} ${lang}: ${info.join(' ')}`];
    for (const [lo, la, want, k] of [[103.82, 1.35, 'SG', 'sgp'], [139.69, 35.69, 'JP', 'jpn'], [138, 38, 'JP', 'jpn']]) {
      await p.evaluate(([lo, la]) => window.__T.run(`GLOBE_SCREEN.look(${lo}, ${la})`), [lo, la]); await p.waitForTimeout(150);
      await tapAt(p, dev, cx, cy);
      const st = await p.evaluate(() => window.__T.run('GLOBE_SCREEN.state()'));
      if (!st.sel || st.sel.cc !== want) fail(`${dev} ${lang}: tap at ${lo},${la} gave ${JSON.stringify(st.sel)}, not ${want}`);
      const links = await p.$$eval('#glInfo [data-k]', x => x.map(e => e.dataset.k));
      if (RU && !links.includes(k)) fail(`${dev} ${lang}: ${want} has no link to ${k} (${links})`);
      line.push(`${want}${st.sel && st.sel.city ? ' city' : ''} → ${links}`);
      if (want === 'SG' && dev === 'phone' && lang === 'ru') await p.screenshot({ path: D + 'asia1-sgp.png' });
    }
    if (RU) { await p.click('#glInfo [data-k="jpn"]'); await p.waitForTimeout(700); }
    const n = await p.$$eval('.lg-row, .tv-c, [data-i]', x => x.length);
    line.push('section opened, rows ' + n);
    if (errs.length) fail(`${dev} ${lang}: page errors ${errs.join('|')}`);
    console.log(line.join(' | ')); await c.close();
  }
  await b.close(); console.log(bad ? 'FAILED ' + bad : 'OK: asia1'); process.exit(bad ? 1 : 0);
})();
