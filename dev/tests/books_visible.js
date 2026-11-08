// Books and tales are always in «Учимся» (section «Книги и сказки»), whatever the child's age, track or module list,
// and the search finds them. ru: both tiles; en/pt/de: the bookshelf.
// Usage: node tests/books_visible.js [lang] [phone|laptop]
const { chromium, devices } = require('playwright');
const LANG = process.argv[2] || 'ru', DEV = process.argv[3] || 'phone';
const PAGE = `http://localhost:8781/govorilki/${LANG === 'en' ? '' : LANG + '/'}`;
const HOOK = 'const fam = () => ROOT.families[ROOT.curFam] || null;';
const kid = (name, tr, age, mods) => ({ stars: 12, plays: {}, likeG: {}, book: { title: '', log: {} }, settings: { name, gender: 'f', track: tr, age, friend: 'kitty', onboarded: true, lang: LANG, ...(mods ? { mods } : {}) } });
const CASES = [['r4', 'r', 4, 0], ['r6', 'r', 6, 0], ['l9', 'l', 9, 0], ['l6', 'l', 6, 0], ['r9', 'r', 9, 0],
  ['c4', 'r', 4, ['r', 'math']], ['c9', 'l', 9, ['warm', 'l', 'brain']], ['c6', 'r', 6, ['art']]];
let bad = 0; const check = (n, ok, m = '') => { if (!ok) bad++; console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}${m ? ' — ' + m : ''}`); };
(async () => {
  const b = await chromium.launch();
  const profiles = {}; CASES.forEach(([id, tr, age, mods]) => profiles[id] = kid('Тина', tr, age, mods));
  const base = { engine: 'device', micOff: true, srOff: true, parentPhone: true, cur: 'r4', curFam: 'ft', families: { ft: { id: 'ft', name: 'Т', cc: 'PT', kids: CASES.map(c => c[0]), grands: [] } }, profiles };
  const c = await b.newContext(DEV === 'laptop' ? { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 } : { ...devices['iPhone 13'], deviceScaleFactor: 1 });
  await c.route(/ntfy|wikipedia|wikimedia|huggingface|jsdelivr|youtube|workers\.dev/, r => r.abort());
  await c.route(u => /\/(ru|de|pt|en)?\/?(index\.html)?$/.test(u.pathname), async r => { const x = await r.fetch(); let t = await x.text(); t = t.replace(HOOK, HOOK + ' window.__T = { get P() { return P; }, run: s => eval(s) };'); r.fulfill({ response: x, body: t }); });
  await c.addInitScript(s => { if (localStorage.getItem('seeded')) return; localStorage.setItem('seeded', 1); localStorage.setItem('govorilki-v2', JSON.stringify(s)); }, base);
  const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  const T = s => p.evaluate(x => window.__T.run(x), s);
  const want = LANG === 'ru' ? ['tales', 'bookshelf'] : ['bookshelf'];
  await p.goto(PAGE); await p.waitForTimeout(1500);
  const who = await p.$$('.who-kid'); if (who.length) { await who[0].click(); await p.waitForTimeout(800); }
  for (const [id, tr, age] of CASES) {
    await T(`ROOT.cur = '${id}'; P = ROOT.profiles['${id}']; goHome()`); await p.waitForTimeout(500);
    await p.click('.tb[data-tab="learn"]'); await p.waitForTimeout(500);
    const inLearn = await p.evaluate(w => w.map(g => !!document.querySelector(`#sec30 .tile[data-id="${g}"]`)), want);
    if (process.env.DBG) console.log(await p.evaluate(() => document.body.innerText.slice(0, 200).replace(/\n/g, ' ')));
    check(`${id} (${tr}, ${age}): ${want.join('+')} in «Учимся» section`, inLearn.every(Boolean));
    const top = await p.evaluate(() => { const s = document.querySelector('section.group'); return s ? s.id : ''; });
    check(`${id}: section is first in the tab`, top === 'sec30', top);
    const y = await p.evaluate(() => { const e = document.querySelector('#sec30 .tile'); return e ? Math.round(e.getBoundingClientRect().top) : 9999; });
    check(`${id}: tiles near the top`, y < 700, 'y=' + y);
    if (id === 'r4' || id === 'c9') await p.screenshot({ path: __dirname + `/shots/books_visible-${LANG}-${DEV}-${id}.png` });
    await T('homeSearch()'); await p.waitForTimeout(300);
    const ids = await p.$$eval('.srch-i', e => e.map(x => x.dataset.id));
    check(`${id}: search lists ${want.join('+')}`, want.every(g => ids.includes(g)));
    await T("document.querySelector('.srch').remove()");
  }
  check('no page errors', !errs.length, errs.join('|'));
  await b.close(); console.log(bad ? `${bad} FAILED` : 'all ok'); process.exit(bad ? 1 : 0);
})();
