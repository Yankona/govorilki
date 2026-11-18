// «Моё любимое» and one goal of the day (the owner, 18.11): favourites open every day after the path (30 simulated
// days) plus one surprise door; the parent's path first; the day complete only with the book; the life steps first
// («Застелила кровать»), counted in «Сегодня: N из M»; 🔥 of complete days with a «заморозка»; the sandwich order for
// a child whose journal says maths is hard; the grown-ups' «любит / трудно / зависает»; the favourites picker.
// Invented children only (Тина 6 likes drawing and stories, Тоша 9, Тим 7).
// node tests/day_goal.js [base=http://localhost:8781/govorilki/] [phone|laptop] [langs=ru,en,pt,de]
const { chromium, devices } = require('playwright');
const path = require('path');
const BASE = process.argv[2] || 'http://localhost:8781/govorilki/', DEV = process.argv[3] || 'phone';
const LANGS = (process.argv[4] || 'ru,en,pt,de').split(',');
const SHOTS = path.join(__dirname, 'shots');
const HOOK = 'const fam = () => ROOT.families[ROOT.curFam] || null;';
const SUB = { ru: 'ru/', en: '', pt: 'pt/', de: 'de/' };
const kid = (name, g, age, fr, lang, track, likes) => ({ stars: 12, plays: {}, learn: {}, days: {}, book: { title: 'Т', log: {} }, settings: { focus: { sp: 'yes', subj: [] }, name, gender: g, track, age, friend: fr, onboarded: true, lang, likes } });
let bad = 0;
(async () => {
  const b = await chromium.launch();
  for (const lang of LANGS) {
    const seed = { engine: 'device', micOff: true, srOff: true, parentPhone: true, cur: 'k1', curFam: 'f1',
      families: { f1: { id: 'f1', name: 'Т', cc: 'PT', kids: ['k1', 'k2', 'k3'], grands: [] } },
      profiles: { k1: kid('Тина', 'f', 6, 'kitty', lang, 'r', ['draw', 'books']), k2: kid('Тоша', 'm', 9, 'tiger', lang, 'l', ['chess']), k3: kid('Тим', 'm', 7, 'panda', lang, 'r', ['space']) } };
    const c = await b.newContext(DEV === 'laptop' ? { viewport: { width: 1280, height: 800 } } : { ...devices['iPhone 13'], deviceScaleFactor: 1 });
    await c.route(/ntfy|wikipedia|huggingface|jsdelivr|youtube|wikimedia|workers\.dev/, r => r.abort());
    await c.route(u => /\/(ru|de|pt|en)?\/?(index\.html)?$|\/app\.[0-9a-f]+\.js$/.test(u.pathname), async r => { const x = await r.fetch(); let t = await x.text(); t = t.replace(HOOK, HOOK + ' window.__T = { run: s => eval(s) };'); r.fulfill({ response: x, body: t }); });
    await c.addInitScript(s => { try { speechSynthesis.speak = u => setTimeout(() => u.onend && u.onend(), 5); } catch (e) {} if (localStorage.getItem('seeded')) return; localStorage.setItem('seeded', 1); localStorage.setItem('govorilki-v2', JSON.stringify(s)); }, seed);
    const p = await c.newPage(), errs = [], miss = [];
    p.on('pageerror', e => errs.push(e.message));
    const ok = (cond, m) => { if (!cond) miss.push(m); };
    const run = s => p.evaluate(x => window.__T.run(x), s);
    const home = async () => { await run('goHome()'); await p.waitForTimeout(700); };
    await p.goto(BASE + SUB[lang]); await p.waitForTimeout(1500);
    const who = await p.$$('.who-kid'); if (who.length) { await who[0].click(); await p.waitForTimeout(900); }
    await run(`switchKid('k1')`); await p.waitForTimeout(700); await home();
    // the picker card for a child who has not chosen yet; choose drawing and stories
    ok(!!(await p.$('#sdAsk')), 'no «Что ты любишь?» card');
    await p.click('#sdAskGo'); await p.waitForTimeout(700);
    await p.screenshot({ path: `${SHOTS}/goal-${lang}-${DEV}-pick.png` });
    const pre = await run('SIMPLE.favs()');
    for (const id of pre) if (!['art', 'books'].includes(id)) await p.click(`[data-fp="${id}"]`);
    for (const id of ['art', 'books']) if (!pre.includes(id)) await p.click(`[data-fp="${id}"]`);
    await p.click('#fpDone'); await p.waitForTimeout(1300);
    ok(JSON.stringify((await run('SIMPLE.favs()')).sort()) === '["art","books"]', `favourites ${await run('SIMPLE.favs()')}`);
    // 30 simulated days: drawing and stories every day, one surprise that never repeats on the next day
    const sim = await run(`(() => { const n = dayNo(), fv = SIMPLE.favs(), pl = SIMPLE.plan(n + 30, { pool: SIMPLE.pool(), likes: SIMPLE.likes(), kid: 'k1', favs: fv }); let bad = 0, rep = 0;
      for (let d = n; d < n + 30; d++) { const doors = [...fv, ...pl[d]]; if (!doors.includes('art') || !doors.includes('books') || pl[d].length !== 1 || fv.includes(pl[d][0])) bad++; if ((pl[d - 1] || []).includes(pl[d][0])) rep++; } return { bad, rep }; })()`);
    ok(sim.bad === 0 && sim.rep === 0, `30 days: ${JSON.stringify(sim)}`);
    // the life steps first: «Застелила кровать» before the path, counted
    const g0 = await run('DAYG.goal()');
    ok((await p.$$('.dg-l')).length >= 1 && (await run('DAYG.lifeIds()[0]')) === 'bed', 'no bed step first');
    await p.click('.dg-l[data-life="bed"]'); await p.waitForTimeout(1600);
    const second = await run('DAYG.lifeIds()[1]'); if (second) { await p.click(`.dg-l[data-life="${second}"]`); await p.waitForTimeout(1600); }
    const g1 = await run('DAYG.goal()');
    ok(g1.done === g0.done + (second ? 2 : 1), `life steps not counted ${JSON.stringify(g0)} → ${JSON.stringify(g1)}`);
    const bar = await p.$eval('.pd-prog small', el => el.textContent).catch(() => '');
    ok(bar.includes(String(g1.done)) && bar.includes(String(g1.total)), `bar «${bar}»`);
    await p.screenshot({ path: `${SHOTS}/goal-${lang}-${DEV}-life.png` });
    // the path done without the book: not complete; with the book: complete, 🔥 counts it
    await run(`P.days[dayKey()] = Object.fromEntries(SIMPLE.must().map(id => [id, 1])); save()`); await home();
    ok(!(await run('dayComplete()')), 'complete without the book');
    ok(!!(await p.$('#dgBook')), 'no book step');
    await run(`P.book.log[dayKey()] = 1; save()`); await home(); await p.waitForTimeout(800);
    ok(await run('dayComplete()'), 'not complete with the book');
    ok((await run('DAYG.inWeek()')) >= 1, 'the day not counted in the week');
    if (await p.$('.overlay [data-a="ok"]')) { await p.click('.overlay [data-a="ok"]'); await p.waitForTimeout(300); }
    // favourites open after the path; the surprise has its tag
    const open = await p.$$eval('.sd-door.open', ds => ds.map(d => d.dataset.door));
    ok(open.includes('art') && open.includes('books') && (await p.$$('.sd-door .sd-tag')).length === open.length, `open doors ${open}`);
    await p.$eval('#sdBox', el => el.scrollIntoView()).catch(() => {});
    await p.screenshot({ path: `${SHOTS}/goal-${lang}-${DEV}-doors.png` });
    // 🔥 is the week: five complete days of seven; a missed day burns nothing (dev/docs/science-dose.md)
    const wk = await run(`(() => { const w = weekId(), today = dayKey(), keys = [];
      for (let i = 0; i < 7 && keys.length < 4; i++) { const d = new Date(w); d.setDate(d.getDate() + i); const k = dayKey(d); if (k !== today) keys.push(k); }
      P.doneDays = Object.fromEntries(keys.map(k => [k, 1])); save(); const before = DAYG.streak(), n4 = DAYG.inWeek();
      P.days[dayKey()] = Object.fromEntries(SIMPLE.must().map(id => [id, 1])); P.book.log[dayKey()] = 1; save();
      const r = DAYG.markDone(); return { before, n4, r, after: DAYG.streak() }; })()`);
    ok(wk.n4 === 4 && wk.r && wk.r.made && wk.after >= 1, `week ${JSON.stringify(wk)}`);
    const gap = await run(`(() => { const w = weekId(), keys = []; for (const i of [0, 1, 3, 4, 6]) { const d = new Date(w); d.setDate(d.getDate() + i - 7); keys.push(dayKey(d)); }
      P.doneDays = { ...P.doneDays, ...Object.fromEntries(keys.map(k => [k, 1])) }; save(); return DAYG.streak(); })()`);
    ok(gap >= 2, `a week with two missed days still made: ${gap}`);
    // «Узнаём» is always there, one tap, before the path is done: news, science, stories, journeys, professions, comics,
    // music, the museum, the holidays (the owner: «нельзя терять»); a holiday card stays on the home when there is one
    await run(`P.days[dayKey()] = {}; save()`); await home();
    const kn = await p.$$eval('[data-know]', bs => bs.map(b => b.dataset.know));
    const want = await run(`SIMPLE.KNOW.filter(id => SIMPLE.vis().has(id))`);
    ok(want.length >= 6 && want.every(id => kn.includes(id)) && kn.includes('cal'), `«Узнаём» ${kn} / ${want}`);
    const hol = await run(`typeof holidayCard === 'function' ? (holidayCard() ? !!document.querySelector('.hol, .holiday, [class*="hol"]') : true) : true`);
    ok(hol, 'holiday card lost');
    for (const id of ['learn-news', 'comics', 'cal']) {
      if (!kn.includes(id)) continue;
      await p.click(`[data-know="${id}"]`); await p.waitForTimeout(900);
      ok(!(await p.$('.home-t')), `«Узнаём» ${id} does not open`);
      await home();
    }
    // three looks
    for (const lk of ['bright', 'calm', 'dark']) { await run(`P.settings.look = '${lk}'; save()`); await home(); await p.screenshot({ path: `${SHOTS}/goal-${lang}-${DEV}-${lk}.png` }); }
    await run(`P.settings.look = ''; save()`);
    // the sandwich: Тим (7) leaves maths halfway, finishes the rest → maths between two easier steps, kept short
    await run(`switchKid('k3')`); await p.waitForTimeout(600);
    const order0 = await run('SIMPLE.must()');
    await run(`(() => { for (let i = 0; i < 4; i++) { EVT.log('leave', 'math'); EVT.log('step', 'speech'); EVT.log('step', 'read'); } EVT.log('ge', 'draw', 3, 300); EVT.log('ge', 'draw', 3, 200); })()`);
    const order1 = await run('SIMPLE.must()');
    ok(order1.length === order0.length && order1[1] === 'math' && order1[0] !== 'math', `sandwich ${order0} → ${order1}`);
    ok((await run(`lessonPlan('math').length`)) <= 3, 'hard step not short');
    await run(`screenParents('day')`); await p.waitForTimeout(700);
    const ins = await run('DAYG.insight()');
    ok(ins.hd.length >= 1 && ins.love.length >= 1, `insight ${JSON.stringify(ins)}`);
    await p.screenshot({ path: `${SHOTS}/goal-${lang}-${DEV}-parent.png`, fullPage: true });
    // Тоша (9): his path as it was, favourites open after it
    await run(`switchKid('k2')`); await p.waitForTimeout(600); await home();
    ok((await run('SIMPLE.must().length')) === 5, 'older child path changed');
    ok((await run('SIMPLE.favs()')).includes('chess'), 'older child favourites');
    console.log(`${lang} ${DEV}: missing ${JSON.stringify(miss)} | errors ${JSON.stringify(errs)}`);
    if (errs.length || miss.length) bad++;
    await c.close();
  }
  await b.close(); console.log(bad ? `FAIL in ${bad} language(s)` : 'OK: day goal'); process.exit(bad ? 1 : 0);
})();
