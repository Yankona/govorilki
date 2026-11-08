// Exploration (not a pass/fail test): screenshots of «Сегодня» and every «Говорим» game for invented children 4, 6, 9.
// node tests/fun_explore.js [lang=ru] [tag=before] [phone|laptop]
const { chromium, devices } = require('playwright');
const path = require('path');
const BASE = 'http://localhost:8781/govorilki/', LANG = process.argv[2] || 'ru', TAG = process.argv[3] || 'before', DEV = process.argv[4] || 'phone';
const SUB = { ru: 'ru/', en: '', pt: 'pt/', de: 'de/' }[LANG];
const SHOTS = path.join(__dirname, 'shots', 'fun-' + TAG); require('fs').mkdirSync(SHOTS, { recursive: true });
const HOOK = 'const fam = () => ROOT.families[ROOT.curFam] || null;';
const kid = (name, g, age, fr, track) => ({ stars: 12, plays: {}, learn: {}, book: { title: 'Т', log: {} }, settings: { name, gender: g, track, age, friend: fr, onboarded: true, lang: LANG } });
const KIDS = [['k1', 'Тина', 'f', 4, 'kitty', 'r'], ['k2', 'Тоша', 'm', 6, 'tiger', 'r'], ['k3', 'Тим', 'm', 9, 'tiger', 'l']];
(async () => {
  const b = await chromium.launch();
  for (const [id, name, g, age, fr, tr] of KIDS) {
    const seed = { engine: 'device', micOff: true, srOff: true, parentPhone: true, cur: id, curFam: 'f1',
      families: { f1: { id: 'f1', name: 'Т', cc: 'PT', kids: [id], grands: [] } }, profiles: { [id]: kid(name, g, age, fr, tr) } };
    const c = await b.newContext(DEV === 'laptop' ? { viewport: { width: 1280, height: 800 } } : { ...devices['iPhone 13'], deviceScaleFactor: 1 });
    await c.route(/ntfy|wikipedia|huggingface|jsdelivr|youtube|wikimedia|workers\.dev/, r => r.abort());
    await c.route(u => /\/(ru|de|pt|en)?\/?(index\.html)?$/.test(u.pathname), async r => { const x = await r.fetch(); let t = await x.text(); t = t.replace(HOOK, HOOK + ' window.__T = { run: s => eval(s) };'); r.fulfill({ response: x, body: t }); });
    await c.addInitScript(s => { window.__said = []; try { speechSynthesis.speak = u => { window.__said.push(u.text); setTimeout(() => u.onend && u.onend(), 5); }; } catch (e) {} if (localStorage.getItem('seeded')) return; localStorage.setItem('seeded', 1); localStorage.setItem('govorilki-v2', JSON.stringify(s)); }, seed);
    const p = await c.newPage(), errs = [];
    p.on('pageerror', e => errs.push(e.message));
    await p.goto(BASE + SUB); await p.waitForTimeout(1500);
    const who = await p.$$('.who-kid'); if (who.length) { await who[0].click(); await p.waitForTimeout(900); }
    await p.screenshot({ path: `${SHOTS}/${age}-today.png` });
    console.log(age, 'said at home:', (await p.evaluate(() => window.__said.slice(0, 3))).join(' / '));
    await p.evaluate(() => { const s = document.querySelector('#stage'); s.style.height = 'auto'; s.style.overflow = 'visible'; document.querySelector('.screen').style.height = 'auto'; });
    await p.screenshot({ path: `${SHOTS}/${age}-today-full.png`, fullPage: true });
    await p.evaluate(() => window.__T.run("P.homeTab='speak'; goHome()")); await p.waitForTimeout(600);
    await p.screenshot({ path: `${SHOTS}/${age}-speak.png` });
    const ids = await p.evaluate(() => [...document.querySelectorAll('.tile')].map(t => t.dataset.id));
    console.log(age, 'speak tiles', ids.join(','));
    for (const gid of ids) {
      await p.evaluate(() => window.__said.length = 0);
      try { await p.evaluate(x => window.__T.run(`GAMES.find(g=>g.id==='${x}').go()`), gid); } catch (e) { console.log('open fail', gid, e.message); }
      await p.waitForTimeout(900);
      await p.screenshot({ path: `${SHOTS}/${age}-g-${gid}.png` });
      const said = await p.evaluate(() => window.__said.slice(0, 3));
      console.log(' ', gid, '|', said.join(' / ').slice(0, 160));
      await p.evaluate(() => window.__T.run("hush(); goHome()")).catch(() => {}); await p.waitForTimeout(300);
    }
    await p.evaluate(() => window.__T.run("P.homeTab='today'; goHome()")); await p.waitForTimeout(500);
    const st = await p.$$('.pd-n'); if (st.length) { await st[0].click(); await p.waitForTimeout(1500); await p.screenshot({ path: `${SHOTS}/${age}-step1.png` }); }
    console.log(age, 'path steps', st.length, 'errors', JSON.stringify(errs));
    await c.close();
  }
  await b.close();
})();
