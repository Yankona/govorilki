// Inventory of what a child sees in each language: the tabs of home, their sections and tiles, the «Сегодня» path, and
// every game of GAMES with the reason it is hidden. Writes tests/shots/inventory.json; prints the ru-vs-others diff.
// Invented children only (Тина 5 r, Тим 9 r, Тоша 9 l). node tests/inventory.js [base] [phone|laptop]
const { chromium, devices } = require('playwright');
const fs = require('fs'), D = require('path').join(__dirname, 'shots') + '/';
fs.mkdirSync(D, { recursive: true });
const BASE = process.argv[2] || 'http://localhost:8781/govorilki/', DEV = process.argv[3] || 'phone';
const HOOK = 'const fam = () => ROOT.families[ROOT.curFam] || null;';
const LANGS = { ru: 'ru/', en: '', pt: 'pt/', de: 'de/' };
const KIDS = { young: ['Тина', 'f', 5, 'r'], older: ['Тим', 'm', 9, 'r'], mission: ['Тоша', 'm', 9, 'l'] };
const kid = (name, g, age, track, lang) => ({ stars: 5, plays: {}, learn: {}, book: { title: 'Т', log: {} }, settings: { name, gender: g, track, age, friend: 'kitty', onboarded: true, lang } });
(async () => {
  const b = await chromium.launch(), out = {};
  for (const [lang, sub] of Object.entries(LANGS).filter(x => !process.env.LANGS || process.env.LANGS.includes(x[0]))) {
    for (const [who, k] of Object.entries(KIDS)) {
      const seed = { engine: 'device', micOff: true, srOff: true, parentPhone: true, cur: 'k1', curFam: 'f1',
        families: { f1: { id: 'f1', name: 'Т', cc: 'PT', kids: ['k1'], grands: [] } }, profiles: { k1: kid(...k, lang) } };
      const c = await b.newContext(DEV === 'laptop' ? { viewport: { width: 1280, height: 800 } } : { ...devices['iPhone 13'], deviceScaleFactor: 1 });
      await c.route(/ntfy|wikipedia|huggingface|jsdelivr|youtube|wikimedia|workers\.dev/, r => r.abort());
      await c.route(u => /\/(ru|de|pt|en)?\/?(index\.html)?$/.test(u.pathname), async r => { const x = await r.fetch(); let t = await x.text(); t = t.replace(HOOK, HOOK + ' window.__T = { run: s => eval(s) };'); r.fulfill({ response: x, body: t }); });
      await c.addInitScript(s => { try { speechSynthesis.speak = u => setTimeout(() => u.onend && u.onend(), 5); } catch (e) {} if (localStorage.getItem('seeded')) return; localStorage.setItem('seeded', 1); localStorage.setItem('govorilki-v2', JSON.stringify(s)); }, seed);
      const p = await c.newPage(), errs = [];
      p.on('pageerror', e => errs.push(e.message));
      await p.goto(BASE + sub); await p.waitForTimeout(1500);
      const w = await p.$$('.who-kid'); if (w.length) { await w[0].click(); await p.waitForTimeout(900); }
      const r = { tabs: {}, errs };
      r.path = await p.$$eval('.pd-n .pd-lb b', a => a.map(x => x.textContent.trim()));
      r.pathIds = await p.evaluate(() => window.__T.run('typeof LIDS === "function" ? LIDS() : []')).catch(e => 'ERR ' + e.message);
      for (const t of ['speak', 'learn', 'create', 'discover']) {
        const tb = await p.$(`.tb[data-tab="${t}"]`); if (!tb) { r.tabs[t] = 'NO TAB'; continue; }
        await tb.click(); await p.waitForTimeout(500);
        r.tabs[t] = await p.$$eval('.group[id^="sec"]', a => a.map(s => ({ sec: s.id, h: (s.querySelector('h2') || {}).textContent, tiles: [...s.querySelectorAll('.tile')].map(x => x.dataset.id) })));
        if (who === 'young') await p.screenshot({ path: D + `inv-${lang}-${t}-${DEV}.png`, fullPage: true });
      }
      r.games = await p.evaluate(() => window.__T.run(`GAMES.map(g => { let h = false; try { h = !!(g.hide && g.hide()); } catch (e) { h = 'ERR'; }
        return { id: g.id, grp: g.grp, hidden: h, why: h ? String(g.hide).slice(0, 80) : '', off: gameOff(g.id), inside: !!g.inside, place: g.place || '' }; })`));
      out[`${lang}/${who}`] = r;
      await c.close();
      console.log(lang, who, 'tiles', Object.values(r.tabs).flat().reduce((n, s) => n + (s.tiles ? s.tiles.length : 0), 0), 'path', r.path.length, 'errors', errs.length);
    }
  }
  fs.writeFileSync(D + `inventory-${DEV}.json`, JSON.stringify(out, null, 1));
  await b.close();
})();
