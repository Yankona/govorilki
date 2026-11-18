// The little ones (4–6, not reading yet): nothing to read on the path, three short steps, a dancing friend and a sticker
// after each step, a gentle «Давай только одну!» after a step left halfway, the creative door after two, a creative
// door every day for 30 days, drawing as the favourite game, a sticker to colour after the path. The older child (9)
// is unchanged. Invented children only (Тина 5, likes drawing, no reading step; Тоша 9, track l).
// node tests/little_ones.js [base=http://localhost:8781/govorilki/] [phone|laptop] [langs=ru,en,pt,de]
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
      families: { f1: { id: 'f1', name: 'Т', cc: 'PT', kids: ['k1', 'k2'], grands: [] } },
      profiles: { k1: kid('Тина', 'f', 5, 'kitty', lang, 'r', ['draw', 'unicorn']), k2: kid('Тоша', 'm', 9, 'tiger', lang, 'l', ['chess', 'space']) } };
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
    await run(`switchKid('k1')`); await p.waitForTimeout(700); await home();
    // three steps, nothing to read
    const steps = await p.$$eval('.pd-n[data-l]:not(.pd-opt)', ns => ns.map(n => n.dataset.l));
    ok(steps.length <= 3 && steps[0] === 'speech' && steps[1] === 'read', `path ${steps}`);
    const keys = await run(`SIMPLE.must().flatMap(id => lessonPlan(id).map(x => x.key))`);
    ok(!keys.some(k => ['primer', 'read-merge', 'read-words', 'read-pick', 'code-colw', 'code-col', 'speed', 'l-syll', 'comics'].includes(k) || /^comix/.test(k)), `reading text on the path: ${keys}`);
    ok(await run(`SIMPLE.must().every(id => lessonPlan(id).length <= 3)`), 'a step has more than 3 games');
    ok(!(await run(`LS().read.name`)).match(/Комикс|Comic|Banda|Comic/i), 'the comic is the reading step');
    // the reading round: placement right every time, never a text to read
    await run(`GAMES.find(g => g.id === 'r-skill').go()`); await p.waitForTimeout(900);
    let shown = 0;
    for (let i = 0; i < 8; i++) {
      if (await p.$('.rk-q')) shown++;
      const a = await p.$eval('#rkBox', el => el.dataset.a).catch(() => null); if (a === null) break;
      const o = await p.$(`#rkBox .rk-o[data-v="${a.replace(/"/g, '\\"')}"]`); if (!o) break;
      await o.click(); await p.waitForTimeout(700);
    }
    ok(shown === 0, `reading text shown ${shown} times in the placement`);
    ok((await run(`RSK.lv()`)) <= 3, 'placement climbed above the steps heard');
    await home(); await run(`P.today = null; P.lilStk = null; save()`); await home();
    await p.screenshot({ path: `${SHOTS}/little-${lang}-${DEV}-home.png` });
    // a step left halfway → «Давай только одну!» → one game → the step done, the friend dances, a sticker
    await run(`startLesson('speech')`); await p.waitForTimeout(800);
    await home(); await p.waitForTimeout(1200);
    ok(!!(await p.$('.lt-offer')), 'no gentle offer after a step left halfway');
    await p.screenshot({ path: `${SHOTS}/little-${lang}-${DEV}-offer.png` });
    if (await p.$('.lt-offer [data-a="one"]')) { await p.click('.lt-offer [data-a="one"]'); await p.waitForTimeout(800); }
    ok((await run(`lessonPlan('speech').length`)) === 1, '«только одну» is not one game');
    await run(`ACTIVE = 'speech'; finish({ key: lessonPlan('speech')[0].key })`); await p.waitForTimeout(700);
    ok(!!(await p.$('.lt-win')), 'no dancing friend after the step');
    await p.screenshot({ path: `${SHOTS}/little-${lang}-${DEV}-step.png` });
    ok((await run(`LITTLE.dayStickers().length`)) === 1, 'no sticker of the day');
    await home();
    ok(!(await p.$('.lt-offer')), 'an offer again for a done step');
    // two steps left halfway → the creative door opens, the path not done
    await run(`startLesson('read')`); await p.waitForTimeout(800); await home(); await p.waitForTimeout(1200);
    if (await p.$('.lt-offer [data-a="later"]')) { await p.click('.lt-offer [data-a="later"]'); await p.waitForTimeout(300); }
    const op = await p.$$eval('.sd-door.open', ds => ds.map(d => d.dataset.door));
    const cr = await run(`SIMPLE.AREAS.filter(a => a.g === 'c').map(a => a.id)`);
    ok(op.length === 1 && cr.includes(op[0]), `after two skips open doors ${op}`);
    ok(!(await run('SIMPLE.pathDone()')), 'path counted done after skips');
    // the path done: the sticker to colour, drawing as the favourite
    await run(`P.days[dayKey()] = Object.fromEntries(SIMPLE.must().map(id => [id, 1])); P.chest = dayKey(); save()`); await home();
    ok(!!(await p.$('#ltCol')), 'no sticker to colour after the path');
    ok((await run(`SIMPLE.favGame().id`)) === 'draw', 'favourite is not drawing');
    await p.$eval('#sdBox', el => el.scrollIntoView()).catch(() => {});
    await p.screenshot({ path: `${SHOTS}/little-${lang}-${DEV}-after.png` });
    if (await p.$('#ltCol')) {
      await p.click('#ltCol'); await p.waitForTimeout(700);
      await p.click('.lt-c:nth-child(3)'); await p.click('#ltSvg path:last-child'); await p.waitForTimeout(200);
      ok((await run(`Object.keys(P.lilCol.f).length`)) === 1, 'colouring did not colour');
      await p.screenshot({ path: `${SHOTS}/little-${lang}-${DEV}-colour.png` });
      await home();
    }
    // a creative door every day for 30 days, no door two days running
    const cd = await run(`(() => { const n = dayNo(), pl = SIMPLE.plan(n + 30, { pool: SIMPLE.pool(), likes: SIMPLE.likes(), kid: 'k1', little: true, k: 2 }); let no = 0, rep = 0;
      for (let d = n; d < n + 30; d++) { if (!pl[d].some(id => SIMPLE.AREAS.find(a => a.id === id).g === 'c')) no++; if (pl[d].includes('comics')) no++; if ((pl[d - 1] || []).some(x => pl[d].includes(x))) rep++; } return { no, rep }; })()`);
    ok(cd.no === 0 && cd.rep === 0, `30 days: no creative door ${cd.no}, repeats ${cd.rep}`);
    // the three looks
    for (const lk of ['bright', 'calm', 'dark']) { await run(`P.settings.look = '${lk}'; save()`); await home(); await p.screenshot({ path: `${SHOTS}/little-${lang}-${DEV}-${lk}.png` }); }
    await run(`P.settings.look = ''; save()`);
    // the older child: unchanged
    await run(`switchKid('k2')`); await p.waitForTimeout(700); await home();
    const st2 = await p.$$eval('.pd-n[data-l]:not(.pd-opt)', ns => ns.length);
    ok(st2 === 4, `older child path ${st2}`);   // track l: the book is its own card, not a step (my-book)
    ok(!(await run('LITTLE.on()')), 'older child counted as little');
    const same = await run(`(() => { const n = dayNo(), o = { pool: SIMPLE.pool(), likes: SIMPLE.likes(), kid: 'k2' }; const a = SIMPLE.plan(n + 10, { ...o, little: false }), b2 = SIMPLE.plan(n + 10, o); return JSON.stringify(a[n + 5]) === JSON.stringify(b2[n + 5]); })()`);
    ok(same, 'older child rotation changed');
    console.log(`${lang} ${DEV}: missing ${JSON.stringify(miss)} | errors ${JSON.stringify(errs)}`);
    if (errs.length || miss.length) bad++;
    await c.close();
  }
  await b.close(); console.log(bad ? `FAIL in ${bad} language(s)` : 'OK: little ones'); process.exit(bad ? 1 : 0);
})();
