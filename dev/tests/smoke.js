// Smoke test of the built game in all four languages (needs tests/serve.sh running):
// the who-plays screen → a child → «Сегодня» with its path → the first step of the path → the journey → back home.
// Fictional children only (Тина, Тоша). Prints one line per language and exits 1 on any page error or missing screen.
// node tests/smoke.js [base=http://localhost:8781/govorilki/] [phone|laptop]
const { chromium, devices } = require('playwright');
const path = require('path');
const BASE = process.argv[2] || 'http://localhost:8781/govorilki/', DEV = process.argv[3] || 'phone';
const SHOTS = path.join(__dirname, 'shots');
const HOOK = 'const fam = () => ROOT.families[ROOT.curFam] || null;';
const LANGS = { ru: 'ru/', en: '', pt: 'pt/', de: 'de/' };
const kid = (name, g, age, fr, lang) => ({ stars: 5, plays: {}, learn: {}, book: { title: 'Т', log: {} }, settings: { name, gender: g, track: 'r', age, friend: fr, onboarded: true, lang } });
(async () => {
  const b = await chromium.launch(); let bad = 0;
  for (const [lang, sub] of Object.entries(LANGS)) {
    const seed = { engine: 'device', micOff: true, srOff: true, parentPhone: true, cur: 'k1', curFam: 'f1',
      families: { f1: { id: 'f1', name: 'Т', cc: 'PT', kids: ['k1', 'k2'], grands: [] } },
      profiles: { k1: kid('Тина', 'f', 5, 'kitty', lang), k2: kid('Тоша', 'm', 8, 'tiger', lang) } };
    const c = await b.newContext(DEV === 'laptop' ? { viewport: { width: 1280, height: 800 } } : { ...devices['iPhone 13'], deviceScaleFactor: 1 });
    await c.route(/ntfy|wikipedia|huggingface|jsdelivr|youtube|wikimedia|workers\.dev/, r => r.abort());
    await c.route(u => /\/(ru|de|pt|en)?\/?(index\.html)?$/.test(u.pathname), async r => { const x = await r.fetch(); let t = await x.text(); t = t.replace(HOOK, HOOK + ' window.__T = { run: s => eval(s) };'); r.fulfill({ response: x, body: t }); });
    await c.addInitScript(s => { try { speechSynthesis.speak = u => setTimeout(() => u.onend && u.onend(), 5); } catch (e) {} if (localStorage.getItem('seeded')) return; localStorage.setItem('seeded', 1); localStorage.setItem('govorilki-v2', JSON.stringify(s)); }, seed);
    const p = await c.newPage(), errs = [], miss = [];
    p.on('pageerror', e => errs.push(e.message));
    await p.goto(BASE + sub); await p.waitForTimeout(1500);
    const who = await p.$$('.who-kid'); if (who.length) { await who[0].click(); await p.waitForTimeout(900); }
    const steps = await p.$$('.pd-n'); if (!steps.length) miss.push('path');
    if (steps.length) { await steps[0].click(); await p.waitForTimeout(1500); await p.screenshot({ path: `${SHOTS}/smoke-${lang}-step.png` }); }
    await p.evaluate(() => window.__T.run('goHome()')).catch(e => miss.push('goHome ' + e.message)); await p.waitForTimeout(700);
    await p.evaluate(() => window.__T.run('TRAVEL.screen()')).catch(e => miss.push('travel ' + e.message)); await p.waitForTimeout(900);
    if (!(await p.$$('.tv-c')).length) miss.push('travel cards');
    await p.screenshot({ path: `${SHOTS}/smoke-${lang}-travel.png` });
    const ver = await p.evaluate(() => window.__T.run("typeof APP_VER !== 'undefined' ? APP_VER : ''")).catch(() => '');
    console.log(`${lang}: path steps ${steps.length}${ver ? ' | v' + ver : ''} | missing ${JSON.stringify(miss)} | errors ${JSON.stringify(errs)}`);
    if (errs.length || miss.length) bad++;
    await c.close();
  }
  await b.close(); console.log(bad ? `FAIL in ${bad} language(s)` : 'OK: all languages'); process.exit(bad ? 1 : 0);
})();
