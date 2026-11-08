// tour of «Творим» (exploration helper): opens every game of the tab and screenshots it.
// Usage: node tests/fun_tour.js [age] [lang] [outdir] [ids,comma,separated]
const { chromium, devices } = require('playwright');
const AGE = +(process.argv[2] || 4), LANG = process.argv[3] || 'ru', OUT = (process.argv[4] || require('path').join(__dirname, 'shots')) + '/';
const BASE = 'http://localhost:8781/govorilki/';
const HOOK = 'const fam = () => ROOT.families[ROOT.curFam] || null;';
const kid = (name, g, age, fr, lang, track) => ({ stars: 5, plays: {}, book: { title: 'Т', log: {} }, settings: { name, gender: g, track, age, friend: fr, onboarded: true, lang, warmDraw: false } });
(async () => {
  const b = await chromium.launch();
  const fam = { engine: 'device', micOff: true, srOff: true, parentPhone: true, cur: 'k1', curFam: 'f1', families: { f1: { id: 'f1', name: 'Т', cc: 'PT', kids: ['k1'], grands: [] } }, profiles: { k1: kid('Тина', 'f', AGE, 'kitty', LANG, AGE >= 8 ? 'l' : 'r') } };
  const c = await b.newContext({ ...devices['iPhone 13'], deviceScaleFactor: 1 });
  await c.route(/ntfy|wikipedia|huggingface|jsdelivr|youtube|wikimedia|workers\.dev/, r => r.abort());
  await c.route(u => /\/(ru|de|pt|en)?\/?(index\.html)?$/.test(u.pathname), async r => { const x = await r.fetch(); let t = await x.text(); t = t.replace(HOOK, HOOK + ' window.__T = { run: s => eval(s) };'); r.fulfill({ response: x, body: t }); });
  await c.addInitScript(s => { window.__said = []; try { speechSynthesis.speak = u => { window.__said.push(u.text); setTimeout(() => u.onend && u.onend(), 5); }; } catch (e) {} if (localStorage.getItem('seeded')) return; localStorage.setItem('seeded', 1); localStorage.setItem('govorilki-v2', JSON.stringify(s)); }, fam);
  const p = await c.newPage(); p.on('pageerror', e => console.log('PAGEERR', e.message));
  const run = s => p.evaluate(s => window.__T.run(s), s);
  await p.goto(BASE + (LANG === 'en' ? '' : LANG + '/')); await p.waitForTimeout(1500);
  const who = await p.$$('.who-kid'); if (who.length) { await who[0].click(); await p.waitForTimeout(900); }
  await p.evaluate(() => document.querySelector('[data-tab="create"]').click()); await p.waitForTimeout(800);
  await p.screenshot({ path: OUT + `tab-${AGE}.png`, fullPage: true });
  const ids = await p.$$eval('.tile[data-id]', x => [...new Set(x.map(e => e.dataset.id))]);
  console.log('tiles', ids.join(' '));
  for (const id of (process.argv[5] ? process.argv[5].split(',') : ids)) {
    await run(`GAMES.find(g => g.id === '${id}').go()`).catch(e => console.log('ERR', id, e.message)); await p.waitForTimeout(1600);
    await p.screenshot({ path: OUT + `${id}-${AGE}.png`, fullPage: !!process.env.FULL });
    const txt = await p.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').slice(0, 300));
    console.log(id, '|', txt);
  }
  await b.close();
})();
