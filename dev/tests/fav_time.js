// The favourite game's minutes (the owner, 18.11): a balance per child, spent only while that child plays with the app
// in front; switching to a sister pauses it, a hidden app pauses it, ⏸ keeps the rest, unused minutes wait («потом»),
// midnight starts afresh. Invented children only (Тоша 9, Тина 5).
// node tests/fav_time.js [base=http://localhost:8781/govorilki/] [phone|laptop] [langs=ru,en,pt,de]
const { chromium, devices } = require('playwright');
const BASE = process.argv[2] || 'http://localhost:8781/govorilki/', DEV = process.argv[3] || 'phone';
const LANGS = (process.argv[4] || 'ru,en,pt,de').split(',');
const HOOK = 'const fam = () => ROOT.families[ROOT.curFam] || null;';
const SUB = { ru: 'ru/', en: '', pt: 'pt/', de: 'de/' };
const kid = (name, g, age, fr, lang, track, likes) => ({ stars: 12, plays: { 'chess-ai': 9 }, learn: {}, days: {}, book: { title: 'Т', log: {} }, settings: { name, gender: g, track, age, friend: fr, onboarded: true, lang, likes } });
let bad = 0;
(async () => {
  const b = await chromium.launch();
  for (const lang of LANGS) {
    const seed = { engine: 'device', micOff: true, srOff: true, parentPhone: true, cur: 'k2', curFam: 'f1',
      families: { f1: { id: 'f1', name: 'Т', cc: 'PT', kids: ['k1', 'k2'], grands: [] } },
      profiles: { k1: kid('Тина', 'f', 5, 'kitty', lang, 'r', ['draw']), k2: kid('Тоша', 'm', 9, 'tiger', lang, 'l', ['chess']) } };
    const c = await b.newContext(DEV === 'laptop' ? { viewport: { width: 1280, height: 800 } } : { ...devices['iPhone 13'], deviceScaleFactor: 1 });
    await c.route(/ntfy|wikipedia|huggingface|jsdelivr|youtube|wikimedia|workers\.dev/, r => r.abort());
    await c.route(u => /\/(ru|de|pt|en)?\/?(index\.html)?$/.test(u.pathname), async r => { const x = await r.fetch(); let t = await x.text(); t = t.replace(HOOK, HOOK + ' window.__T = { run: s => eval(s) };'); r.fulfill({ response: x, body: t }); });
    await c.addInitScript(s => {
      try { speechSynthesis.speak = u => setTimeout(() => u.onend && u.onend(), 5); } catch (e) {}
      window.__vis = 'visible'; try { Object.defineProperty(document, 'visibilityState', { get: () => window.__vis }); } catch (e) {}
      if (localStorage.getItem('seeded')) return; localStorage.setItem('seeded', 1); localStorage.setItem('govorilki-v2', JSON.stringify(s));
    }, seed);
    const p = await c.newPage(), errs = [], miss = [];
    p.on('pageerror', e => errs.push(e.message));
    const ok = (cond, m) => { if (!cond) miss.push(m); };
    const run = s => p.evaluate(x => window.__T.run(x), s);
    await p.goto(BASE + SUB[lang]); await p.waitForTimeout(1500);
    const who = await p.$$('.who-kid'); if (who.length) { await who[0].click(); await p.waitForTimeout(900); }
    await run(`switchKid('k2')`); await p.waitForTimeout(600);
    await run(`P.days[dayKey()] = Object.fromEntries(SIMPLE.must().map(id => [id, 1])); P.chest = dayKey(); P.book.log[dayKey()] = 1; save(); goHome()`); await p.waitForTimeout(800);
    // «потом»: nothing spent before the start
    ok((await run('SIMPLE.favLeft()')) === 600000, 'minutes spent before the start');
    await run('SIMPLE.favGo()'); await p.waitForTimeout(4500);
    const u1 = await run('ROOT.profiles.k2.fav.used');
    ok(u1 >= 2000 && u1 <= 7000, `playing does not count: ${u1}`);
    ok(!!(await p.$('#sdFavBar')), 'no timer with ⏸');
    // the app hidden: nothing counts
    await p.evaluate(() => { window.__vis = 'hidden'; document.dispatchEvent(new Event('visibilitychange')); }); await p.waitForTimeout(4500);
    const u2 = await run('ROOT.profiles.k2.fav.used');
    ok(u2 - u1 < 2500, `hidden app counted: ${u1} → ${u2}`);
    await p.evaluate(() => { window.__vis = 'visible'; document.dispatchEvent(new Event('visibilitychange')); });
    // the sister takes the phone: his minutes stay
    await run(`switchKid('k1')`); await p.waitForTimeout(800);
    await run(`GAMES.find(g => g.id === 'draw').go()`); await p.waitForTimeout(4500);
    const u3 = await run('ROOT.profiles.k2.fav.used');
    ok(u3 - u2 < 2500, `sister spent his minutes: ${u2} → ${u3}`);
    ok(!(await p.$('#sdFavBar')), 'timer still shown for the sister');
    // back to him, ⏸ keeps the rest
    await run(`switchKid('k2')`); await p.waitForTimeout(600);
    await run('SIMPLE.favGo()'); await p.waitForTimeout(2500);
    if (await p.$('#sdFavBar')) { await p.click('#sdFavBar'); await p.waitForTimeout(700); }
    const u4 = await run('ROOT.profiles.k2.fav.used'); await p.waitForTimeout(4500);
    ok(!!(await p.$('.home-t')) && (await run('ROOT.profiles.k2.fav.used')) === u4, 'pause does not keep the minutes');
    ok((await run('SIMPLE.favLeft()')) > 590000 - 15000, 'too many minutes gone');
    // midnight: a new day, a full balance
    await run(`P.fav.d = '2000-01-01'; save()`);
    ok((await run('SIMPLE.favLeft()')) === 600000, 'midnight does not reset');
    // the reward is a reward: never speech, grammar or a game of the path; no warm-up in front of it (audit 18.11)
    await run(`P.plays = { 'gram-many': 30, 'breath': 40, 'l-twist': 25, 'olymp-day': 20 }; delete P.favGameKid; save()`);
    const fg = await run('(() => { const g = SIMPLE.favGame(); return g ? { id: g.id, grp: g.grp } : null; })()');
    ok(fg && ![0, 1, 2, 3, 5, 6, 9, 12, 14, 15, 16].includes(fg.grp) || (fg && ['l-moto', 'l-rap', 'l-catch', 'l-boss', 'l-word'].includes(fg.id)), `reward is ${JSON.stringify(fg)}`);
    await run(`switchKid('k1')`); await p.waitForTimeout(600);
    await run(`P.plays = { 'artic': 50, 'breath': 40 }; P.warmAt = 0; P.days[dayKey()] = Object.fromEntries(SIMPLE.must().map(id => [id, 1])); P.chest = dayKey(); save()`);
    ok((await run('SIMPLE.favGame().id')) === 'draw', 'little one\'s reward is not drawing');
    await run('SIMPLE.favGo()'); await p.waitForTimeout(1200);
    ok(!(await p.$('.warm')), 'a tongue warm-up in front of the reward');
    await run('SIMPLE.favStop(); goHome()'); await p.waitForTimeout(500);
    // the child chooses the reward
    await run('SIMPLE.favChoose()'); await p.waitForTimeout(600);
    const t0 = await p.$('.sd-room .tile:not(.sd-feat)'); const tid = t0 ? await t0.getAttribute('data-id') : '';
    if (t0) { await t0.click(); await p.waitForTimeout(1200); }
    ok(tid && (await run('SIMPLE.favGame().id')) === tid, `child choice not kept (${tid})`);
    console.log(`${lang} ${DEV}: missing ${JSON.stringify(miss)} | errors ${JSON.stringify(errs)}`);
    if (errs.length || miss.length) bad++;
    await c.close();
  }
  await b.close(); console.log(bad ? `FAIL in ${bad} language(s)` : 'OK: favourite time'); process.exit(bad ? 1 : 0);
})();
