// «Что важно для вашего ребёнка?» (parent-focus): the day «Сегодня» is built from the parents' choice and the dose by age
// (dev/docs/science-dose.md). Invented children only:
//   Тина, 8 — логопедия «не нужна», главное — математика: no speech step at all, more maths than reading, the drawing
//            and chess doors still there;
//   Тоша, 5 — логопедия «нужна»: a short speech block first, ≥ 50 tries of the sound, within 3–6 minutes;
//   Тим, 6 — «не знаю» (a new child): no speech step; the 1-minute check says normal → still none; a lag → the block.
// The day's minutes (the path only) stay inside the table; nothing outside the path is cut or limited; «Отчёт» shows the focus.
// node tests/parent_focus.js [base=http://localhost:8781/govorilki/] [phone|laptop] [langs=ru,en,pt,de]
const { chromium, devices } = require('playwright');
const path = require('path');
const BASE = process.argv[2] || 'http://localhost:8781/govorilki/', DEV = process.argv[3] || 'phone';
const LANGS = (process.argv[4] || 'ru,en,pt,de').split(',');
const SHOTS = path.join(__dirname, 'shots');
const HOOK = 'const fam = () => ROOT.families[ROOT.curFam] || null;';
const SUB = { ru: 'ru/', en: '', pt: 'pt/', de: 'de/' };
const kid = (name, g, age, fr, lang, focus) => ({ stars: 12, plays: {}, learn: {}, days: {}, book: { title: 'Т', log: {} }, settings: { name, gender: g, track: 'r', age, friend: fr, onboarded: true, lang, likes: ['draw'], ...(focus ? { focus } : {}) } });
const TABLE = { 5: [8, 12], 6: [12, 15], 8: [15, 20] };
let bad = 0;
(async () => {
  const b = await chromium.launch();
  for (const lang of LANGS) {
    // five of the last seven days with a lesson for Тина (one gap in the middle, one yesterday-but-one)
    const days = {}; const d = new Date();
    [1, 2, 4, 5, 6].forEach(i => { const x = new Date(d); x.setDate(d.getDate() - i); days[`${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`] = { math: 1 }; });
    const tina = kid('Тина', 'f', 8, 'kitty', lang, { sp: 'no', subj: ['math'] }); tina.days = days;
    const seed = { engine: 'device', micOff: true, srOff: true, parentPhone: true, cur: 'k1', curFam: 'f1',
      families: { f1: { id: 'f1', name: 'Т', cc: 'PT', kids: ['k1', 'k2', 'k3'], grands: [] } },
      profiles: { k1: tina, k2: kid('Тоша', 'm', 5, 'tiger', lang, { sp: 'yes', subj: [] }), k3: kid('Тим', 'm', 6, 'tiger', lang, null) } };
    const c = await b.newContext(DEV === 'laptop' ? { viewport: { width: 1280, height: 800 } } : { ...devices['iPhone 13'], deviceScaleFactor: 1 });
    await c.route(/ntfy|wikipedia|huggingface|jsdelivr|youtube|wikimedia|workers\.dev/, r => r.abort());
    await c.route(u => /\/(ru|de|pt|en)?\/?(index\.html)?$/.test(u.pathname), async r => { const x = await r.fetch(); let t = await x.text(); t = t.replace(HOOK, HOOK + ' window.__T = { run: s => eval(s) };'); r.fulfill({ response: x, body: t }); });
    await c.addInitScript(s => { try { speechSynthesis.speak = u => setTimeout(() => u.onend && u.onend(), 5); } catch (e) {} if (localStorage.getItem('seeded')) return; localStorage.setItem('seeded', 1); localStorage.setItem('govorilki-v2', JSON.stringify(s)); }, seed);
    const p = await c.newPage(), errs = [], miss = [];
    p.on('pageerror', e => errs.push(e.message));
    const ok = (cond, m) => { if (!cond) miss.push(m); };
    const run = s => p.evaluate(x => window.__T.run(x), s);
    const home = async () => { await run('goHome()'); await p.waitForTimeout(600); };
    await p.goto(BASE + SUB[lang]); await p.waitForTimeout(1500);
    const who = await p.$$('.who-kid'); if (who.length) { await who[0].click(); await p.waitForTimeout(900); }
    const day = () => run(`({ must: SIMPLE.must(), opt: SIMPLE.opt(), min: FOCUS.minutes(), steps: Object.fromEntries(SIMPLE.must().map(id => [id, lessonPlan(id).length])), mins: FOCUS.alloc(SIMPLE.must()).mins, doors: SIMPLE.today().map(a => a.id) })`);

    // Тина: no speech, more maths, art and chess
    await run(`switchKid('k1')`); await p.waitForTimeout(700); await home();
    let t = await day();
    ok(!t.must.includes('speech') && !t.opt.includes('speech'), `Тина: speech in the day ${t.must} / ${t.opt}`);
    ok(!(await p.$('.pd-n[data-l="speech"]')), 'Тина: a speech node on the path');
    ok(t.must.includes('math') && (t.mins.math || 0) > (t.mins.read || 0), `Тина: maths ${t.mins.math} not more than reading ${t.mins.read}`);
    ok(t.doors.includes('art') && t.doors.includes('chess'), `Тина: doors ${t.doors}`);
    ok(t.min >= TABLE[8][0] && t.min <= TABLE[8][1], `Тина: day ${t.min} min`);
    ok(await run(`GAMES.some(g => g.id === 'syll')`), 'Тина: the speech games are gone from the game');
    ok((await run(`FOCUS.week()`)) === 5, 'Тина: «Отчёт» does not count 5 of 7 days');
    // nothing is lost: holidays, news, science, stories, journeys, jobs, comics, music, the museum stay one tap away
    const lost = await run(`(() => { const V = SIMPLE.vis(); return ['learn-news', 'learn-jobs', 'learn-space', 'learn-phys', 'travel', 'comics', 'composers', 'museum', 'tales', 'space'].filter(id => GAMES.some(g => g.id === id && !(g.hide && g.hide())) && !V.has(id)); })()`);
    ok(!lost.length, 'Тина: lost from the game: ' + lost);
    ok(await run(`SIMPLE.pool().length >= 12`), 'Тина: door areas were cut');
    ok(await run(`typeof screenHoliday === 'function'`), 'Тина: holidays gone');
    // the minutes count only the path; a game opened for interest is free and changes nothing
    ok(await run(`Math.round(FOCUS.alloc(SIMPLE.must()).total) === FOCUS.minutes()`), 'Тина: minutes count more than the path');
    const before = JSON.stringify(t.must);
    await run(`GAMES.find(g => g.id === 'museum').go()`); await p.waitForTimeout(700);
    ok(!(await p.$('.lt-offer')) && JSON.stringify(await run('SIMPLE.must()')) === before, 'Тина: a free game changed the day');
    await home();
    await p.screenshot({ path: `${SHOTS}/focus-${lang}-${DEV}-tina.png` });

    // Тоша: the speech block, ≥ 50 tries, 3–6 minutes, first on the path
    await run(`switchKid('k2')`); await p.waitForTimeout(700); await home();
    t = await day();
    ok(t.must[0] === 'speech', `Тоша: path ${t.must}`);
    const sp = await run(`(() => { const p = lessonPlan('speech'); return { n: p.length, games: p.filter(s => s.kind === 'game').length }; })()`);
    ok(sp.games * 20 >= 50, `Тоша: ${sp.games} sound games < 50 tries`);
    ok(t.mins.speech >= 3 && t.mins.speech <= 6, `Тоша: speech ${t.mins.speech} min`);
    ok(t.min >= TABLE[5][0] && t.min <= TABLE[5][1], `Тоша: day ${t.min} min`);
    ok((await run(`FOCUS.dose().tries`)) >= 50, 'Тоша: the target is under 50');
    // syllables for 5–6 stay in the reading step (syllables), whatever the dose
    ok(await run(`(() => { let want = false; try { want = SYLS.forAge() && LITTLE.listen() && GAMES.some(g => g.id === 'syl-step' && !(g.hide && g.hide())); } catch (e) {} return !want || lessonPlan('read').some(s => s.key === 'syl-step'); })()`), 'Тоша: no syllables in «Чтение»');
    await p.screenshot({ path: `${SHOTS}/focus-${lang}-${DEV}-tosha.png` });

    // Тим: a new child, «не знаю» → no speech; the check normal → none; a lag → the block
    await run(`switchKid('k3')`); await p.waitForTimeout(700); await home();
    ok((await run(`FOCUS.get().sp`)) === 'unk', 'Тим: the default is not «не знаю»');
    t = await day();
    ok(!t.must.includes('speech'), `Тим: speech before the check ${t.must}`);
    ok(t.min >= TABLE[6][0] && t.min <= TABLE[6][1], `Тим: day ${t.min} min`);
    // the check in the parents' area, through the screen: everything clean except Р
    await run(`screenParents('focus')`); await p.waitForTimeout(900);
    ok(!!(await p.$('#focusPar #foChk')), 'Тим: no check button');
    await p.screenshot({ path: `${SHOTS}/focus-${lang}-${DEV}-parent.png` });
    await p.click('#foChk'); await p.waitForTimeout(500);
    ok((await p.$$('#focusPar [data-g]')).length >= 4, 'Тим: the check has no sound groups');
    await p.screenshot({ path: `${SHOTS}/focus-${lang}-${DEV}-check.png`, fullPage: true });
    await p.click('#foDone'); await p.waitForTimeout(500);
    ok((await run(`FOCUS.get().chk.res`)) === 'ok', 'Тим: all clean is not normal');
    ok(!(await run(`SIMPLE.must()`)).includes('speech'), 'Тим: speech after a normal check');
    // Р/Л at 4–5 are normal; at 6 a lag in the hissing sounds turns the block on
    ok((await run(`FOCUS.judge({ ru: { r: 0, l: 0, sh: 0 } }, 1, { settings: { age: 5 } }).res`)) === 'ok', 'Р/Л/Ш at 5 judged a lag');
    ok((await run(`FOCUS.judge({ ru: { sz: 0 } }, 1, { settings: { age: 4 } }).res`)) === 'ok', 'С at 4 judged a lag');
    await run(`FOCUS.finishCheck({ ru: { sh: 0 } }, 1)`);
    ok((await run(`SIMPLE.must()`))[0] === 'speech', 'Тим: no speech after a lag at 6');
    t = await day();
    ok(t.min >= TABLE[6][0] && t.min <= TABLE[6][1], `Тим with speech: day ${t.min} min`);
    // «Отчёт»: the focus card
    await run(`switchKid('k1')`); await p.waitForTimeout(500);
    await run(`screenParents('guide')`); await p.waitForTimeout(900);
    ok(((await p.$$('.gd-fo')).length) >= 3, 'Отчёт: no focus lines');
    const fo = await p.$eval('.gd-card[data-gk="k1"] .gd-fo', e => e.textContent).catch(() => '');
    ok(/5/.test(fo) && /7/.test(fo), `Отчёт: Тина ${fo}`);
    await p.screenshot({ path: `${SHOTS}/focus-${lang}-${DEV}-report.png`, fullPage: true });
    ok(!errs.length, 'page errors: ' + errs.join(' | '));
    console.log(`${lang} ${DEV}: ${miss.length ? 'FAIL\n  ' + miss.join('\n  ') : 'ok'}`);
    bad += miss.length; await c.close();
  }
  await b.close(); process.exit(bad ? 1 : 0);
})();
