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
const kid = (name, g, age, fr, lang, track, likes) => ({ stars: 20, plays: { draw: 6, museum: 2 }, learn: {}, days: {}, book: { title: 'Т', log: {} }, settings: { name, gender: g, track, age, friend: fr, onboarded: true, lang, likes } });
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
    // «Миссия Л» has six steps since the maths of the day (audit-rewards)
    for (const [k, nDoors, nMust] of [['k1', 2, 4], ['k2', 3, 6]]) {
      await run(`switchKid('${k}')`); await p.waitForTimeout(700); await home();
      const tag = `${lang}/${k}`;
      ok(!(await p.$('#tabBar')), `${tag}: tab bar still there`, miss);
      ok(!(await p.$('#homeSearch')), `${tag}: search still there`, miss);
      const steps = await p.$$eval('.pd-n[data-l]', ns => ns.map(n => n.dataset.l));
      ok(steps.length === nMust, `${tag}: path steps ${steps.length} ≠ ${nMust}`, miss);
      ok(steps[0] === 'speech' && steps[1] === 'read', `${tag}: path order ${steps}`, miss);
      const doors = await p.$$('.sd-door');
      ok(doors.length === nDoors, `${tag}: doors ${doors.length} ≠ ${nDoors}`, miss);
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
      await run(`P.fav.t = Date.now() - 11 * 60e3`); await p.waitForTimeout(4800);
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
    const fair = await run(`(() => { const res = [];
      for (const k of ['k1', 'k2']) for (const lk of [null, []]) for (const kk of [2, 3]) {
        P = ROOT.profiles[k]; const A = SIMPLE.pool(), n = dayNo(), likes = lk || SIMPLE.likes();
        const pl = SIMPLE.plan(n + 30, { pool: A, likes, k: kk, kid: k }); let rep = 0, mix = 0; const last = {}, gap = {};
        for (let d = n; d < n + 30; d++) { const ds = pl[d]; if ((pl[d - 1] || []).some(x => ds.includes(x))) rep++;
          const gs = ds.map(id => SIMPLE.AREAS.find(a => a.id === id).g); if (new Set(gs).size < Math.min(ds.length, 3)) mix++;
          A.forEach(a => { if (ds.includes(a.id)) { gap[a.id] = Math.max(gap[a.id] || 0, d - (last[a.id] ?? n - 1)); last[a.id] = d; } }); }
        A.forEach(a => { gap[a.id] = Math.max(gap[a.id] || 0, n + 30 - (last[a.id] ?? n - 1)); });
        res.push({ k, likes: likes.length, kk, areas: A.length, rep, mix, max: Math.max(...Object.values(gap)) }); }
      P = ROOT.profiles[ROOT.cur]; return res; })()`);
    fair.forEach(f => ok(f.rep === 0 && f.max <= 10 && f.mix === 0, `${lang}: rotation ${JSON.stringify(f)}`, miss));
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
    const r = fair.map(f => `${f.k}/${f.kk}${f.likes ? '♥' : ''}:${f.max}`).join(' ');
    console.log(`${lang} ${DEV}: rotation max gap ${r} | missing ${JSON.stringify(miss)} | errors ${JSON.stringify(errs)}`);
    if (errs.length || miss.length) bad++;
    await c.close();
  }
  await b.close(); console.log(bad ? `FAIL in ${bad} language(s)` : 'OK: simple day'); process.exit(bad ? 1 : 0);
})();
