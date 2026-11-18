// «📚 Моя книга» (task/my-book): the book is its own card on the home screen, never a step of the day's path.
// Тоша (9, track l): the path has no book step and completes without it; at 21:30 (fake clock) the card is in its calm
// «перед сном» look, «Я почитал» logs 10 pages → +3 ⭐, the day counts, the streak, the parents' report line;
// «Я дочитал книгу!» → «Мой книжный шкаф» and the next book. Тина (5): no card unless a grown-up turns it on.
// Also the daytime card in 3 looks. No page errors. Invented children only.
// node tests/my_book.js [base=http://localhost:8781/govorilki/] [phone|laptop] [langs=ru,en,pt,de]
const { chromium, devices } = require('playwright');
const path = require('path');
const BASE = process.argv[2] || 'http://localhost:8781/govorilki/', DEV = process.argv[3] || 'phone';
const LANGS = (process.argv[4] || 'ru,en,pt,de').split(',');
const SHOTS = path.join(__dirname, 'shots');
const HOOK = 'const fam = () => ROOT.families[ROOT.curFam] || null;';
const SUB = { ru: 'ru/', en: '', pt: 'pt/', de: 'de/' };
const kid = (name, g, age, fr, lang, track, look, book) => ({ stars: 20, plays: { draw: 6 }, learn: {}, days: {}, book, settings: { name, gender: g, track, age, friend: fr, onboarded: true, lang, look } });
const bad = [];
const looksChosen = (p, sel, other) => p.evaluate(([a, b]) => { const s = x => { const c = getComputedStyle(document.querySelector(x)); return c.backgroundColor + c.boxShadow; }; return s(a) !== s(b); }, [sel, other]);
const ok = (c, msg) => { if (!c) bad.push(msg); };
async function ctx(b, lang, when, look) {
  const y = new Date(when); y.setDate(y.getDate() - 1);
  const yk = `${y.getFullYear()}-${String(y.getMonth() + 1).padStart(2, '0')}-${String(y.getDate()).padStart(2, '0')}`;
  const seed = { engine: 'device', micOff: true, srOff: true, parentPhone: true, cur: 'k2', curFam: 'f1',
    families: { f1: { id: 'f1', name: 'Т', cc: 'PT', kids: ['k1', 'k2'], grands: [] } },
    profiles: { k1: kid('Тина', 'f', 5, 'kitty', lang, 'r', look, { title: '', log: {} }),
      // the old diary: a title and yesterday's log, as saves before my-book hold it
      k2: kid('Тоша', 'm', 9, 'tiger', lang, 'l', look, { title: 'Кентервильское привидение', log: { [yk]: { pages: 7, like: 2 } } }) } };
  const c = await b.newContext(DEV === 'laptop' ? { viewport: { width: 1280, height: 800 } } : { ...devices['iPhone 13'], deviceScaleFactor: 1 });
  await c.route(/ntfy|wikipedia|huggingface|jsdelivr|youtube|wikimedia|workers\.dev/, r => r.abort());
  await c.route(u => /\/(ru|de|pt|en)?\/?(index\.html)?$/.test(u.pathname), async r => { const x = await r.fetch(); let t = await x.text(); t = t.replace(HOOK, HOOK + ' window.__T = { run: s => eval(s) };'); r.fulfill({ response: x, body: t }); });
  await c.addInitScript(s => { try { speechSynthesis.speak = u => { (window.__said = window.__said || []).push(u.text); setTimeout(() => u.onend && u.onend(), 5); }; } catch (e) {} if (localStorage.getItem('seeded')) return; localStorage.setItem('seeded', 1); localStorage.setItem('govorilki-v2', JSON.stringify(s)); }, seed);
  const p = await c.newPage(); await p.clock.install({ time: new Date(when) });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  const run = s => p.evaluate(x => window.__T.run(x), s);
  await p.goto(BASE + SUB[lang]); await p.waitForTimeout(1500);
  const who = await p.$$('.who-kid'); if (who.length) { await who[0].click(); await p.waitForTimeout(900); }
  return { c, p, run, errs };
}
(async () => {
  const b = await chromium.launch();
  for (const lang of LANGS) {
    const tag = `${lang}/${DEV}`;
    // the evening: 21:30
    const { c, p, run, errs } = await ctx(b, lang, '2026-11-18T21:30:00', 'bright');
    const home = async () => { await run('goHome()'); await p.waitForTimeout(600); };
    await run(`switchKid('k2')`); await p.waitForTimeout(700); await home();
    const steps = await p.$$eval('.pd-n[data-l]', ns => ns.map(n => n.dataset.l));
    ok(steps.length && !steps.includes('book'), `${tag}: Тоша's path ${steps}`);
    ok(await run(`!LIDS().includes('book') && !SIMPLE.must().includes('book')`), `${tag}: book still a lesson`);
    ok(!!(await p.$('#mbCard.mb-night')), `${tag}: no evening card`);
    ok(await run(`P.book.v === 2 && P.book.read === 7`), `${tag}: old diary not migrated ${await run('JSON.stringify(P.book)')}`);
    await p.$eval('#mbCard', el => el.scrollIntoView({ block: 'center' })).catch(() => {});
    await p.screenshot({ path: `${SHOTS}/mybook-${lang}-${DEV}-night.png` });
    // the path completes without the book: the chest is ready
    await run(`P.days[dayKey()] = Object.fromEntries(SIMPLE.must().map(id => [id, 1])); save()`); await home();
    ok(!!(await p.$('.pd-chest.ready')), `${tag}: chest not ready without the book`);
    // log 10 pages at 21:30
    const s0 = await run('P.stars');
    await p.click('#mbLog'); await p.waitForTimeout(400);
    ok(!!(await p.$('.mb-ov.mb-night')), `${tag}: dialog not calm`);
    await p.evaluate(() => { window.__ev = []; document.addEventListener('book:logged', e => window.__ev.push(e.detail)); });
    await p.click('#mbQ [data-q="10"]'); await p.click('#mbLike [data-l="2"]'); await p.fill('#mbNote', 'Призрак и пятно');
    ok(await looksChosen(p, '#mbLike [data-l="2"]', '#mbLike [data-l="0"]'), `${tag}: «понравилось» not visibly chosen (card)`);
    await p.screenshot({ path: `${SHOTS}/mybook-${lang}-${DEV}-log.png` });
    await p.click('#mbSave'); await p.waitForTimeout(600);
    ok(await run('P.stars') === s0 + 3, `${tag}: stars ${s0} → ${await run('P.stars')}`);
    ok(await run(`P.book.log[dayKey()].pages === 10 && dayCounts(dayKey()).book === 1 && readOn(dayKey())`), `${tag}: day not counted`);
    const ev = await p.evaluate(() => window.__ev);
    ok(ev.length === 1 && ev[0].first && ev[0].pages === 10, `${tag}: book:logged ${JSON.stringify(ev)}`);
    ok(await run(`MYBOOK.bookLoggedToday(P) && MYBOOK.bookToday(P).pages === 10 && P.book.like === 2`), `${tag}: bookToday / like`);
    ok(await run('MYBOOK.streakOf()') === 2, `${tag}: streak ${await run('MYBOOK.streakOf()')}`);
    ok(await run(`!JSON.stringify(ROOT).includes('Призрак')`) && await run(`MYBOOK.noteOf(dayKey()) === 'Призрак и пятно'`), `${tag}: note not phone-only`);
    await p.waitForTimeout(2000);
    const said = await p.evaluate(() => (window.__said || []).join(' | '));
    ok(/ночи|night|noite|Nacht/i.test(said), `${tag}: no good-night: ${said.slice(-160)}`);
    await p.screenshot({ path: `${SHOTS}/mybook-${lang}-${DEV}-done.png` });
    await p.click('#mbOk'); await p.waitForTimeout(300);
    // the parents' report
    const d = await run('GUIDE.digest(P)');
    ok(d.bp === 17 && d.bs === 2 && d.bt && d.bl === 3, `${tag}: digest ${JSON.stringify([d.bt, d.bp, d.bs])}`);
    await run(`screenParents('guide')`); await p.waitForTimeout(900);
    const line = await p.$eval('.gd-book', e => e.textContent).catch(() => '');
    ok(/17/.test(line) && /2/.test(line) && /😍/.test(line), `${tag}: report line «${line}»`);
    if (line) { await p.$eval('.gd-book', e => e.scrollIntoView({ block: 'center' })); await p.screenshot({ path: `${SHOTS}/mybook-${lang}-${DEV}-report.png` }); }
    await run('screenBook()'); await p.waitForTimeout(600);
    await p.click('#likes .lk[data-l="1"]'); await p.waitForTimeout(200);
    ok(await looksChosen(p, '#likes .lk[data-l="1"]', '#likes .lk[data-l="0"]'), `${tag}: «понравилось» not visibly chosen (book page)`);
    await p.screenshot({ path: `${SHOTS}/mybook-${lang}-${DEV}-like.png` });
    await p.reload(); await p.waitForTimeout(1500);
    ok(await run(`P.book.log[dayKey()].like === 1 && P.book.like === 1`), `${tag}: like lost after reload ${await run('JSON.stringify(P.book.log[dayKey()])')}`);
    await run('screenBook()'); await p.waitForTimeout(600);
    ok(!!(await p.$('#likes .lk.sel[data-l="1"]')), `${tag}: like not shown after reload`);
    // finish the book → the shelf → the next book
    await home(); await p.click('#mbLog'); await p.waitForTimeout(300); await p.click('#mbFin'); await p.waitForTimeout(300); await p.click('#mbYes'); await p.waitForTimeout(500);
    ok(await run('P.book.shelf.length === 1 && !P.book.title && P.book.shelf[0].like === 1'), `${tag}: not on the shelf`);
    await p.click('#mbNext'); await p.waitForTimeout(400);
    await p.screenshot({ path: `${SHOTS}/mybook-${lang}-${DEV}-pick.png` });
    await p.click('.mb-list .mb-bk'); await p.waitForTimeout(400);
    ok(await run('!!P.book.title && P.book.read === 0'), `${tag}: next book not set`);
    await run('screenBook()'); await p.waitForTimeout(600);
    ok(!!(await p.$('.mb-page .mb-done .mb-bk')), `${tag}: no shelf on the book page`);
    await p.screenshot({ path: `${SHOTS}/mybook-${lang}-${DEV}-page.png` });
    // Тина (5): no card, unless turned on in «День»
    await run(`switchKid('k1')`); await p.waitForTimeout(700); await home();
    ok(!(await p.$('#mbCard')), `${tag}: Тина has a card`);
    await run(`screenParents('day')`); await p.waitForTimeout(900);
    const sw = await p.$('#sdBook'); ok(!!sw, `${tag}: no switch in «День»`);
    if (sw) { await p.$eval('#sdBook', e => e.scrollIntoView({ block: 'center' })); await p.click('label[for=sdBook]'); await p.screenshot({ path: `${SHOTS}/mybook-${lang}-${DEV}-parent.png` }); await p.waitForTimeout(200); }
    await home(); ok(!!(await p.$('#mbCard')), `${tag}: Тина's card not on after the switch`);
    ok(!errs.length, `${tag}: page errors ${errs.slice(0, 3)}`);
    await c.close();
    // the daytime card in 3 looks (Тоша)
    for (const look of ['bright', 'calm', 'dark']) {
      const x = await ctx(b, lang, '2026-11-18T12:00:00', look);
      await x.run(`switchKid('k2')`); await x.p.waitForTimeout(600); await x.run('goHome()'); await x.p.waitForTimeout(600);
      ok(!!(await x.p.$('#mbCard:not(.mb-night)')), `${tag}/${look}: no daytime card`);
      if (lang === 'ru' || look === 'bright') { await x.p.$eval('#mbCard', e => e.scrollIntoView({ block: 'center' })).catch(() => {}); await x.p.screenshot({ path: `${SHOTS}/mybook-${lang}-${DEV}-day-${look}.png` }); }
      await x.run('screenBook()'); await x.p.waitForTimeout(600); await x.p.click('#likes .lk[data-l="2"]'); await x.p.waitForTimeout(200);
      ok(await looksChosen(x.p, '#likes .lk[data-l="2"]', '#likes .lk[data-l="0"]'), `${tag}/${look}: «понравилось» not visibly chosen`);
      if (lang === 'ru') await x.p.screenshot({ path: `${SHOTS}/mybook-${lang}-${DEV}-like-${look}.png` });
      ok(!x.errs.length, `${tag}/${look}: page errors ${x.errs.slice(0, 3)}`);
      await x.c.close();
    }
  }
  await b.close();
  console.log(bad.length ? 'FAIL\n' + bad.join('\n') : `ok my_book ${LANGS} ${DEV}`);
  process.exit(bad.length ? 1 : 0);
})();
