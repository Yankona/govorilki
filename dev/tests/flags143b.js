// flags: all cards face up on the biggest board (to look at every drawn flag) + its row in «Путешествие по миру»
const { chromium, devices } = require('playwright');
const D = require('path').join(__dirname, 'shots') + '/';
const HOOK = 'const fam = () => ROOT.families[ROOT.curFam] || null;';
(async () => {
  const b = await chromium.launch();
  const fam = { engine: 'device', micOff: true, srOff: true, parentPhone: true, cur: 'k1', curFam: 'main', families: { main: { id: 'main', name: 'Т', cc: 'PT', kids: ['k1'], grands: [] } }, profiles: { k1: { stars: 5, plays: {}, learn: {}, book: { title: 'Т', log: {} }, settings: { name: 'Тина', gender: 'f', track: 'r', age: 5, friend: 'kitty', onboarded: true, lang: 'ru' } } } };
  const c = await b.newContext({ ...devices['iPhone 13'], deviceScaleFactor: 1 });
  await c.route(/ntfy|wikipedia|huggingface|jsdelivr|youtube|wikimedia|workers\.dev/, r => r.abort());
  await c.route(u => /\/(ru|de|pt|en)?\/?(index\.html)?$/.test(u.pathname), async r => { const x = await r.fetch(); let t = await x.text(); t = t.replace(HOOK, HOOK + ' window.__T = { run: s => eval(s) };'); r.fulfill({ response: x, body: t }); });
  await c.addInitScript(s => { localStorage.setItem('govorilki-v2', JSON.stringify(s)); }, fam);
  const p = await c.newPage(); await p.goto('http://localhost:8781/govorilki/ru/'); await p.waitForTimeout(1500);
  const who = await p.$$('.who-kid'); if (who.length) { await who[0].tap(); await p.waitForTimeout(900); }
  await p.evaluate(() => window.__T.run('TRAVEL.screen()')); await p.waitForTimeout(900);
  console.log('row in the journey:', await p.getByText('Мемори: флаги').count());
  await p.screenshot({ path: D + 'f143-home.png' });
  await p.evaluate(() => window.__T.run('screenFlagMemory(8)')); await p.waitForTimeout(700);
  await p.evaluate(() => document.querySelectorAll('.mc').forEach(e => e.classList.add('up')));
  await p.waitForTimeout(800); await p.screenshot({ path: D + 'f143-all.png' });
  await b.close();
})();
