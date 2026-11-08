// the home tabs' layout for a little one (track r, 5) and an older one (track l, 9): every section with its tiles, and
// every tile that shows in more than one tab (a duplicate). Usage: node tests/tabs_layout.js [base url] [lang]
const { chromium } = require('playwright');
const BASE = process.argv[2] || 'http://localhost:8781/govorilki/', LANG = process.argv[3] || 'ru';
const HOOK = 'const fam = () => ROOT.families[ROOT.curFam] || null;';
(async () => {
  const b = await chromium.launch(); let dups = 0;
  for (const [track, age] of [['r', 5], ['l', 9]]) {
    const c = await b.newContext();
    await c.route(/ntfy|wikipedia|huggingface|jsdelivr|youtube|wikimedia|workers\.dev/, r => r.abort());
    await c.route(u => /\/(ru|de|pt|en)?\/?(index\.html)?$/.test(u.pathname), async r => { const x = await r.fetch(); let t = await x.text(); t = t.replace(HOOK, HOOK + ' window.__T = { run: s => eval(s) };'); r.fulfill({ response: x, body: t }); });
    const kid = { stars: 5, plays: {}, book: { title: 'Т', log: {} }, settings: { name: 'Тина', gender: 'f', track, age, friend: 'kitty', onboarded: true, lang: LANG } };
    await c.addInitScript(s => { if (localStorage.getItem('seeded')) return; localStorage.setItem('seeded', 1); localStorage.setItem('govorilki-v2', JSON.stringify(s)); }, { engine: 'device', micOff: true, srOff: true, cur: 'k1', curFam: 'f1', families: { f1: { id: 'f1', name: 'Т', kids: ['k1'], grands: [] } }, profiles: { k1: kid } });
    const p = await c.newPage();
    await p.goto(BASE + (LANG === 'en' ? '' : LANG + '/')); await p.waitForTimeout(1500);
    const L = await p.evaluate(() => window.__T.run(`HOME_TABS.filter(t => t.g).map(t => ({ tab: t.n, secs: t.g.map(g => { const s = SECTIONS.find(x => x.g === g); if (s && s.only && s.only !== P.settings.track) return null;
      const ids = GAMES.filter(x => (x.grp === g || (x.also || []).includes(g)) && !(x.hide && x.hide()) && !gameOff(x.id)).map(x => x.id); return ids.length ? { g, h: s && s.h, ids } : null; }).filter(Boolean) }))`));
    console.log(`== track ${track}, age ${age}`);
    const where = {};
    L.forEach(t => { console.log(`[${t.tab}]`); t.secs.forEach(s => { console.log(`  ${s.g} ${s.h || '-'}: ${s.ids.join(' ')}`); s.ids.forEach(id => (where[id] = where[id] || new Set()).add(t.tab)); }); });
    // deliberate doubles (the owner asked): the colouring by letters and syllables is in «Учимся» and in «Творим»
    const ALLOWED = ['code-abc', 'code-syl'];
    Object.entries(where).filter(([id, v]) => v.size > 1 && ALLOWED.includes(id)).forEach(([id, v]) => console.log(`  also ${id}: ${[...v].join(', ')} (allowed)`));
    const d = Object.entries(where).filter(([id, v]) => v.size > 1 && !ALLOWED.includes(id));
    d.forEach(([id, v]) => console.log(`  DUP ${id}: ${[...v].join(', ')}`)); dups += d.length;
    await c.close();
  }
  await b.close();
  console.log(dups ? `DUPLICATES ${dups}` : 'NO DUPLICATES');
  process.exit(dups ? 1 : 0);
})();
