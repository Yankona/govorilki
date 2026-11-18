// «Простой день» (simple-day): the child's one home — the path of «обязательно» lessons in order, the doors of the day
// after the path (a teaser before), the room of a door, the favourite game with its time, the passport, the grown-ups'
// «День» and «Все игры», and the rotation's fairness over 30 days. Invented children only (Тина 5, Тоша 9).
// node tests/simple_day.js [base=http://localhost:8781/govorilki/] [phone|laptop] [langs=ru,en,pt,de]
const { chromium, devices } = require('playwright');
const path = require('path');
const BASE = process.argv[2] || 'http://localhost:8781/govorilki/', DEV = process.argv[3] || 'phone';
const LANGS = (process.argv[4] || 'ru,en,pt,de').split(',');
const SHOTS = path.join(__dirname, 'shots');
const HOOK = 'const fam = () => ROOT.families[ROOT.curFam] || null;';
const SUB = { ru: 'ru/', en: '', pt: 'pt/', de: 'de/' };
const kid = (name, g, age, fr, lang, track, likes) => ({ stars: 20, plays: { draw: 6, museum: 2 }, learn: {}, days: {}, book: { title: 'Т', log: {} }, settings: { focus: { sp: 'yes', subj: [] }, name, gender: g, track, age, friend: fr, onboarded: true, lang, likes } });
let bad = 0;
const ok = (c, msg, out) => { if (!c) { out.push(msg); } };
(async () => {
  const b = await chromium.launch();
  for (const lang of LANGS) {
    const seed = { engine: 'device', micOff: true, srOff: true, parentPhone: true, cur: 'k1', curFam: 'f1',
      families: { f1: { id: 'f1', name: 'Т', cc: 'PT', kids: ['k1', 'k2'], grands: [] } },
      profiles: { k1: kid('Тина', 'f', 5, 'kitty', lang, 'r', ['draw', 'kpop']), k2: kid('Тоша', 'm', 9, 'tiger', lang, 'l', ['chess', 'space', 'math']) } };
    const c = await b.newContext(DEV === 'laptop' ? { viewport: { width: 1280, height: 800 } } : { ...devices['iPhone 13'], deviceScaleFactor: 1 });
    await c.route(/ntfy|wikipedia|huggingface|jsdelivr|youtube|wikimedia|workers\.dev/, r => r.abort());
    await c.route(u => /\/(ru|de|pt|en)?\/?(index\.html)?$/.test(u.pathname), async r => { const x = await r.fetch(); let t = await x.text(); t = t.replace(HOOK, HOOK + ' window.__T = { run: s => eval(s) };'); r.fulfill({ response: x, body: t }); });
    await c.addInitScript(s => { try { speechSynthesis.speak = u => setTimeout(() => u.onend && u.onend(), 5); } catch (e) {} if (localStorage.getItem('seeded')) return; localStorage.setItem('seeded', 1); localStorage.setItem('govorilki-v2', JSON.stringify(s)); }, seed);
    const p = await c.newPage(), errs = [], miss = [];
    p.on('pageerror', e => errs.push(e.message));
    const run = s => p.evaluate(x => window.__T.run(x), s);
    const home = async () => { await run('goHome()'); await p.waitForTimeout(500); };
    await p.goto(BASE + SUB[lang]); await p.waitForTimeout(1500);
    const who = await p.$$('.who-kid'); if (who.length) { await who[0].click(); await p.waitForTimeout(900); }
    // the book is its own card (my-book); «Миссия Л» got the maths of the day (audit-rewards): 5 steps
    for (const [k, nMust] of [['k1', 3], ['k2', 5]]) {
      await run(`switchKid('${k}')`); await p.waitForTimeout(700); await home();
      const tag = `${lang}/${k}`;
      ok(!(await p.$('#tabBar')), `${tag}: tab bar still there`, miss);
      ok(!(await p.$('#homeSearch')), `${tag}: search still there`, miss);
      const steps = await p.$$eval('.pd-n[data-l]:not(.pd-opt)', ns => ns.map(n => n.dataset.l));
      ok(steps.length === nMust, `${tag}: path steps ${steps.length} ≠ ${nMust}`, miss);
      ok(steps[0] === 'speech' && steps[1] === 'read', `${tag}: path order ${steps}`, miss);
      // «Моё любимое» + one surprise door (the owner, 18.11)
      const doors = await p.$$('.sd-door'), nFav = await run('SIMPLE.favs().length'), nSur = await run('SIMPLE.today().filter(a => SIMPLE.isSurprise(a.id)).length');
      ok(doors.length === nFav + nSur && nSur === 1 && nFav >= 1, `${tag}: doors ${doors.length}, favourites ${nFav}, surprise ${nSur}`, miss);
      const nDoors = doors.length;
      ok((await p.$$('.sd-door.shut')).length === nDoors, `${tag}: doors not shut before the path`, miss);
      await p.screenshot({ path: `${SHOTS}/simple-${lang}-${k}-${DEV}-before.png`, fullPage: false });
      if (doors.length) { await doors[0].click(); await p.waitForTimeout(400); ok(!!(await p.$('#pdBox')), `${tag}: a shut door opened`, miss); }
      // the path done → the doors open, a door is a room of ≤ 3 games, a stamp in the passport
      await run(`P.days[dayKey()] = Object.fromEntries(SIMPLE.must().map(id => [id, 1])); save()`); await home();
      ok((await p.$$('.sd-door.open')).length === nDoors, `${tag}: doors not open after the path`, miss);
      const d0 = await p.$('.sd-door.open');
      if (d0) {
        const id = await d0.getAttribute('data-door'); await d0.click(); await p.waitForTimeout(700);
        const tiles = await p.$$('.sd-room .tile');
        ok(tiles.length >= 1 && tiles.length <= 3, `${tag}: room tiles ${tiles.length}`, miss);
        ok(await run(`SIMPLE.stamped('${id}')`), `${tag}: no stamp for ${id}`, miss);
        await p.screenshot({ path: `${SHOTS}/simple-${lang}-${k}-${DEV}-room.png` });
        await home();
      }
      // the favourite game: shut before the chest, open after; the time runs out → home
      ok(!!(await p.$('#sdFav.shut')), `${tag}: favourite open before the chest`, miss);
      await run(`P.chest = dayKey(); save()`); await home();
      ok(!!(await p.$('#sdFav.open')), `${tag}: favourite not open after the chest`, miss);
      await p.$eval('#pdBox', el => el.scrollIntoView()).catch(() => {});
      await p.screenshot({ path: `${SHOTS}/simple-${lang}-${k}-${DEV}-after.png`, fullPage: false });
      await p.click('#sdFav'); await p.waitForTimeout(800);
      ok(!(await p.$('#pdBox')), `${tag}: favourite game did not open`, miss);
      await run(`P.fav.used = 10 * 60e3 - 500`); await p.waitForTimeout(4800);
      ok(!!(await p.$('#sdHome')), `${tag}: no «time is up»`, miss);
      if (await p.$('#sdHome')) { await p.click('#sdHome'); await p.waitForTimeout(500); }
      ok(!!(await p.$('#pdBox')), `${tag}: not home after the time`, miss);
      // «обязательно» off for speech: reading starts the path, speech comes after the chest
      await run(`P.settings.day = { ...(P.settings.day || {}), must: { speech: false } }; P.days[dayKey()] = {}; P.chest = ''; save()`); await home();
      const st2 = await p.$$eval('.pd-n[data-l]', ns => ns.map(n => n.dataset.l + (n.classList.contains('pd-opt') ? '*' : '')));
      ok(st2[0] === 'read' && st2[st2.length - 1] === 'speech*', `${tag}: must order ${st2}`, miss);
      await run(`P.settings.day = {}; save()`);
    }
    // rotation: 30 days, both children, with likes and without; plus 2 and 3 doors
    // the surprise door over 30 days: never two days running, every other area at least once; favourites every day
    const fair = await run(`(() => { const res = [];
      for (const k of ['k1', 'k2']) for (const lk of [null, []]) {
        P = ROOT.profiles[k]; const fv = SIMPLE.favs(), A = SIMPLE.pool(), n = dayNo(), likes = lk || SIMPLE.likes();
        const pl = SIMPLE.plan(n + 30, { pool: A, likes, kid: k, favs: fv }); let rep = 0, favIn = 0; const seen = new Set();
        for (let d = n; d < n + 30; d++) { const ds = pl[d]; if ((pl[d - 1] || []).some(x => ds.includes(x))) rep++; if (ds.some(x => fv.includes(x))) favIn++; ds.forEach(x => seen.add(x)); }
        const others = A.filter(a => !fv.includes(a.id)).map(a => a.id), unseen = others.filter(x => !seen.has(x));
        res.push({ k, likes: likes.length, areas: others.length, rep, favIn, unseen: unseen.length }); }
      P = ROOT.profiles[ROOT.cur]; return res; })()`);
    fair.forEach(f => ok(f.rep === 0 && f.favIn === 0 && f.unseen === 0, `${lang}: surprise rotation ${JSON.stringify(f)}`, miss));
    // the grown-ups: «День», «Все игры» with the tabs and a way back
    await run(`screenParents('day')`); await p.waitForTimeout(700);
    ok(!!(await p.$('#dayPar:not(.set-off)')), `${lang}: no «День» page`, miss);
    await p.screenshot({ path: `${SHOTS}/simple-${lang}-parent-${DEV}.png` });
    await p.click('#sdAll'); await p.waitForTimeout(700);
    ok(!!(await p.$('#tabBar')) && !!(await p.$('.sd-allbar')), `${lang}: «Все игры» has no tabs`, miss);
    await p.screenshot({ path: `${SHOTS}/simple-${lang}-all-${DEV}.png` });
    await p.click('#sdBack'); await p.waitForTimeout(600);
    ok(!(await p.$('#tabBar')), `${lang}: tabs stay after «← День»`, miss);
    // simple day off → the old tabs
    await run(`P.settings.day = { on: false }; save()`); await home();
    ok(!!(await p.$('#tabBar')), `${lang}: switch off keeps no tabs`, miss);
    await run(`P.settings.day = {}; save()`);
    const r = fair.map(f => `${f.k}${f.likes ? '♥' : ''}:${f.areas}`).join(' ');
    console.log(`${lang} ${DEV}: surprise areas ${r} | missing ${JSON.stringify(miss)} | errors ${JSON.stringify(errs)}`);
    if (errs.length || miss.length) bad++;
    await c.close();
  }
  await b.close(); console.log(bad ? `FAIL in ${bad} language(s)` : 'OK: simple day'); process.exit(bad ? 1 : 0);
})();
