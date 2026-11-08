// fun-learn: the short letter and number games of «Учимся» have a story strip (a hedgehog's basket, a train, a rocket…):
// every right answer fills the next place, two misses light the right answer, the goal jumps at the end; the level of a
// game grows with its plays; on the younger track letters come before chess in «Учимся».
// Invented children only. Usage: node tests/fun_learn.js [base url] [phone|laptop]   (LANGS=ru,en to narrow)
const { chromium, devices } = require('playwright');
const D = require('path').join(__dirname, 'shots') + '/';
require('fs').mkdirSync(D, { recursive: true });
const BASE = process.argv[2] || 'http://localhost:8781/govorilki/', DEV = process.argv[3] || 'phone';
const HOOK = 'const fam = () => ROOT.families[ROOT.curFam] || null;';
const kid = (name, g, age, lang, plays = {}) => ({ stars: 5, plays, book: { title: 'Т', log: {} }, settings: { name, gender: g, track: 'r', age, friend: 'kitty', onboarded: true, lang } });
// game → [the buttons to answer with, how a step is played]
const ALLG = { 'abc-find': '.lt-b', 'abc-first': '.lt-b', 'read-pick': '.opt', 'math-count': '.num-b', 'math-digits': '.num-b', 'math-add': '.num-b', 'math-compare': '.cmp-g', 'read-merge': 'merge', 'read-words': 'said' };
const GAMES = process.env.ONLY ? Object.fromEntries(Object.entries(ALLG).filter(x => process.env.ONLY.includes(x[0]))) : ALLG;
let bad = 0; const ok = (c, m) => { console.log((c ? '  ok  ' : '  FAIL ') + m); if (!c) bad++; };
(async () => {
  const b = await chromium.launch();
  for (const [lang, path] of [['ru', 'ru/'], ['en', ''], ['pt', 'pt/'], ['de', 'de/']].filter(x => !process.env.LANGS || process.env.LANGS.includes(x[0]))) {
    console.log(lang, DEV);
    const fam = { engine: 'device', micOff: true, srOff: true, parentPhone: true, cur: 'k1', curFam: 'f1', families: { f1: { id: 'f1', name: 'Т', cc: 'PT', kids: ['k1'], grands: [] } }, profiles: { k1: kid('Тина', 'f', 5, lang) } };
    const c = await b.newContext(DEV === 'phone' ? { ...devices['iPhone 13'], deviceScaleFactor: 1 } : { viewport: { width: 1280, height: 800 } });
    await c.route(/ntfy|wikipedia|huggingface|jsdelivr|youtube|wikimedia|workers\.dev/, r => r.abort());
    await c.route(u => /\/(ru|de|pt|en)?\/?(index\.html)?$/.test(u.pathname), async r => { const x = await r.fetch(); let t = await x.text(); t = t.replace(HOOK, HOOK + ' window.__T = { run: s => eval(s) };'); r.fulfill({ response: x, body: t }); });
    await c.addInitScript(s => { window.__said = []; try { speechSynthesis.speak = u => { window.__said.push(u.text); setTimeout(() => u.onend && u.onend(), 5); }; } catch (e) {} if (localStorage.getItem('seeded')) return; localStorage.setItem('seeded', 1); localStorage.setItem('govorilki-v2', JSON.stringify(s)); }, fam);
    const p = await c.newPage(); const errs = []; p.on('pageerror', e => { errs.push(e.message); console.log('PAGEERR', e.stack.slice(0, 400)); });
    await p.goto(BASE + path); await p.waitForTimeout(1500);
    const who = await p.$$('.who-kid'); if (who.length) { await who[0].click(); await p.waitForTimeout(900); }
    // «Учимся» on the younger track: letters first, chess after maths
    await p.click('.tb[data-tab="learn"]'); await p.waitForTimeout(600);
    const order = await p.$$eval('.group[id^="sec"]', a => a.map(x => x.id));
    ok(order.filter(s => s !== 'sec30').indexOf('sec2') === 0 && order.indexOf('sec8') > order.indexOf('sec3'), 'learn tab order: ' + order.join(' '));
    if (lang === 'ru') await p.screenshot({ path: D + `fun-learn-tab-${DEV}.png` });
    const run = s => p.evaluate(s => window.__T.run(s), s);
    await run('GUARD.free = 1');   // no pause after a miss: the test taps fast on purpose
    for (const [id, sel] of Object.entries(GAMES)) {
      await run(`GAMES.find(g => g.id === '${id}').go()`); await p.waitForTimeout(900);
      ok(!!(await p.$('#lq')) && (await p.$$('.lq-s')).length === 6, `${id}: story strip with 6 places`);
      const intro = await p.evaluate(() => window.__said.join(' '));
      let hinted = null, misses = 0;
      for (let step = 0; step < 6; step++) {
        await p.waitForFunction(() => !document.querySelector('.flyer'), null, { timeout: 4000 }).catch(() => {});
        if (sel === 'merge') { await p.waitForSelector('#mc', { timeout: 8000 }); await p.click('#mc'); await p.waitForSelector('.said:not([disabled])', { timeout: 15000 }); await p.click('.said'); }
        else if (sel === 'said') { await p.waitForSelector('.said:not([disabled])', { timeout: 15000 }); await p.click('.said'); }
        else {
          await p.waitForSelector(sel, { timeout: 8000 });
          await p.waitForFunction(s => !document.querySelector(s + '.right'), sel, { timeout: 8000 }).catch(() => {});
          const n = (await p.$$(sel)).length;
          for (let i = 0; i < n; i++) {
            const bs = await p.$$(sel); if (!bs[i]) break;
            await bs[i].click(); await p.waitForTimeout(150);
            if (await p.$(sel + '.right')) break;
            // a miss locks the stage for a moment (the game's guard against mashing)
            await p.waitForFunction(() => !document.querySelector('#stage.locked'), null, { timeout: 5000 }).catch(() => {});
            if (step === 0 && ++misses === 2) hinted = !!(await p.$('.lq-hint'));
          }
        }
        await p.waitForFunction(k => document.querySelectorAll('.lq-s.on').length > k || document.querySelector('.winbox'), step, { timeout: 15000 }).catch(() => {});
        if (step === 2 && lang === 'ru') await p.screenshot({ path: D + `fun-learn-${id}-${DEV}.png` });
      }
      await p.waitForSelector('.winbox', { timeout: 20000 }).catch(() => {}); await p.waitForTimeout(300);
      const filled = (await p.$$('.lq-s.on')).length, won = !!(await p.$('.lq.won')), line = await p.$eval('.win-line', e => e.textContent).catch(() => p.$eval('.winbox h2', e => e.textContent).catch(() => ''));
      if (!line) await p.screenshot({ path: D + `fun-learn-${id}-${lang}-${DEV}-noline.png` });
      ok(filled === 6 && won && line.length > 5, `${id}: filled ${filled}, goal ${won}, «${line}»` + (intro ? '' : ' (no intro)'));
      if (hinted !== null) ok(hinted, `${id}: the right answer glows after two misses`);
      if (id === 'math-count' && lang === 'ru') await p.screenshot({ path: D + `fun-learn-win-${DEV}.png` });
    }
    // the numbers-to-100 games wear the same story strip
    for (const id of ['n100-tens', 'n100-build', 'n100-grid', 'n100-order']) {
      await run(`GAMES.find(g => g.id === '${id}').go()`); await p.waitForTimeout(700);
      ok(!!(await p.$('#lq .lq-s')), `${id}: story strip`);
      if (id === 'n100-grid' && lang === 'ru') await p.screenshot({ path: D + `fun-learn-${id}-${DEV}.png` });
    }
    const aboveFriend = sel => p.$eval(sel, e => { const r = e.getBoundingClientRect(), g = document.querySelector('.guide'); return [r.bottom, g ? g.getBoundingClientRect().top : innerHeight]; }).catch(() => [9999, 0]);
    // «Ступеньки»: no ticking clock, a row of marks, the keypad's OK on screen
    await run(`screenSteps()`); await p.waitForTimeout(500); await p.click('#stGo'); await p.waitForTimeout(400);
    const okBox = await aboveFriend('#stKp [data-k="ok"]');
    ok(!(await p.$('#stT')) && (await p.$$('#stRow i')).length === 10 && okBox[0] <= okBox[1] + 2, `steps: calm, marks, OK above the friend ${okBox.map(Math.round)}`);
    if (lang === 'ru') await p.screenshot({ path: D + `fun-learn-steps-${DEV}.png` });
    // «Счёты»: the button under the abacus is on screen
    await run(`screenSoroban()`); await p.waitForTimeout(600);
    const sb = await aboveFriend('#sbCheck');
    ok(sb[0] <= sb[1] + 2, `soroban: «Готово» above the friend ${sb.map(Math.round)}`);
    if (lang === 'ru') await p.screenshot({ path: D + `fun-learn-soroban-${DEV}.png` });
    // smooth difficulty: after many plays the counting goes up to 10, the first plays stay within 5
    const lv0 = await run(`LQ.lv('math-count')`); await run(`P.plays['math-count'] = 6`); const lv2 = await run(`LQ.lv('math-count')`);
    ok(lv0 === 0 && lv2 === 2, `levels grow with plays: ${lv0} → ${lv2}`);
    ok(!errs.length, 'no page errors ' + errs.join(' | '));
    await c.close();
  }
  await b.close();
  console.log(bad ? `FAILED ${bad}` : 'ALL OK'); process.exit(bad ? 1 : 0);
})();
