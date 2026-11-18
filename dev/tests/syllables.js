// Reading by syllables (SYLSTEP): a 5-year-old who does not read yet (Тоша) gets «Читаем по слогам» on the reading step of
// «Сегодня» every day, plays a round to the end (letters run together, find the syllable, a word with a picture) and climbs
// the three stairs; a 7-year-old reader (Тина) never gets it, and her reading check starts at words. Invented children only.
// node tests/syllables.js [base=http://localhost:8781/govorilki/] [phone|laptop] [langs=ru,en,pt,de]
const { chromium, devices } = require('playwright');
const path = require('path');
const BASE = process.argv[2] || 'http://localhost:8781/govorilki/', DEV = process.argv[3] || 'phone';
const LANGS = (process.argv[4] || 'ru,en,pt,de').split(',');
const SHOTS = path.join(__dirname, 'shots');
const HOOK = 'const fam = () => ROOT.families[ROOT.curFam] || null;';
const SUB = { ru: 'ru/', en: '', pt: 'pt/', de: 'de/' };
const kid = (name, g, age, fr, lang, track, likes, extra = {}) => ({ stars: 12, plays: {}, learn: {}, days: {}, book: { title: 'Т', log: {} }, settings: { name, gender: g, track, age, friend: fr, onboarded: true, lang, likes }, ...extra });
// the plans of a few days in a row (dayNo is a function declaration's const: wrap it through Date)
const WEEK = ids => `(() => { const D = Date, out = []; for (let i = 0; i < 7; i++) { const t = D.now() + i * 864e5;
  window.Date = class extends D { constructor(...a) { a.length ? super(...a) : super(t); } static now() { return t; } };
  out.push(${ids}); } window.Date = D; return out; })()`;
let bad = 0;
(async () => {
  const b = await chromium.launch();
  for (const lang of LANGS) {
    const seed = { engine: 'device', micOff: true, srOff: true, parentPhone: true, cur: 'k1', curFam: 'f1',
      families: { f1: { id: 'f1', name: 'Т', cc: 'PT', kids: ['k1', 'k2'], grands: [] } },
      profiles: { k1: kid('Тоша', 'm', 5, 'tiger', lang, 'r', ['draw', 'space']),
        k2: kid('Тина', 'f', 7, 'kitty', lang, 'r', ['books', 'unicorn'], { rskill: { [lang]: { lv: 6, byParent: true } } }) } };
    const c = await b.newContext(DEV === 'laptop' ? { viewport: { width: 1280, height: 800 } } : { ...devices['iPhone 13'], deviceScaleFactor: 1 });
    await c.route(/ntfy|wikipedia|huggingface|jsdelivr|youtube|wikimedia|workers\.dev/, r => r.abort());
    await c.route(u => /\/(ru|de|pt|en)?\/?(index\.html)?$|\/app\.[0-9a-f]+\.js$/.test(u.pathname), async r => { const x = await r.fetch(); let t = await x.text(); t = t.replace(HOOK, HOOK + ' window.__T = { run: s => eval(s) };'); r.fulfill({ response: x, body: t }); });
    await c.addInitScript(s => { try { speechSynthesis.speak = u => setTimeout(() => u.onend && u.onend(), 5); } catch (e) {} if (localStorage.getItem('seeded')) return; localStorage.setItem('seeded', 1); localStorage.setItem('govorilki-v2', JSON.stringify(s)); }, seed);
    const p = await c.newPage(), errs = [], miss = [];
    p.on('pageerror', e => errs.push(e.message));
    const ok = (cond, m) => { if (!cond) miss.push(m); };
    const run = s => p.evaluate(x => window.__T.run(x), s);
    const home = async () => { await run('goHome()'); await p.waitForTimeout(600); };
    await p.goto(BASE + SUB[lang]); await p.waitForTimeout(1500);
    const who = await p.$$('.who-kid'); if (who.length) { await who[0].click(); await p.waitForTimeout(900); }
    await run(`switchKid('k1')`); await p.waitForTimeout(700); await home();
    // Тоша, 5: the syllables first on the reading step, every day of a week
    const days = await run(WEEK(`lessonPlan('read').map(x => x.key)`));
    days.forEach((k, i) => ok(k[0] === 'syl-step' && k.length <= 3, `Тоша day ${i} read step ${k}`));
    ok(await run(`SIMPLE.must().includes('read')`), 'Тоша has no reading step on the path');
    // three rounds: every task answered (one wrong tap only brings a hint), the stair climbs
    for (let round = 0; round < 3; round++) {
      await home(); await run(`document.querySelectorAll('.overlay').forEach(o => o.remove()); SYLS.play()`); await p.waitForTimeout(800);
      for (let i = 0; i < 8; i++) {
        const st = await p.$eval('#syBox', el => ({ kind: el.dataset.kind, a: el.dataset.a, k: el.dataset.k })).catch(() => null);
        if (!st || !st.kind || await p.$('.overlay')) break;
        if (st.kind === 'join') await p.click('#syM');
        else {
          const wrong = await p.$(`#syBox .rk-o:not([data-v="${st.a}"])`);
          if (wrong && i >= 3) { await wrong.click(); await p.waitForTimeout(300); ok(!!(await p.$('#syBox')), 'a wrong tap ended the round'); }
          if (round === 0 && i === 3) await p.screenshot({ path: `${SHOTS}/syl-${lang}-${DEV}-find.png` });
          await p.click(`#syBox .rk-o[data-v="${st.a}"]`);
        }
        if (round === 0 && i === 0) { await p.waitForTimeout(900); await p.screenshot({ path: `${SHOTS}/syl-${lang}-${DEV}-join.png` }); }
        await p.waitForFunction(k => { const el = document.querySelector('#syBox'); return !el || el.dataset.k !== k || !!document.querySelector('.overlay'); }, st.k, { timeout: 15000 }).catch(() => {});
        await p.waitForTimeout(300);
      }
      await p.waitForTimeout(800); ok(!(await p.$('#syBox')) || !!(await p.$('.overlay')), `round ${round} did not end`);
      if (round === 0) await p.screenshot({ path: `${SHOTS}/syl-${lang}-${DEV}-win.png` });
    }
    ok((await run(`SYLS.st()`)) === 2, `stair after 3 rounds: ${await run('SYLS.st()')}`);
    await home(); await run(`document.querySelectorAll('.overlay').forEach(o => o.remove()); P.sylSt[LANG] = { st: 3, r: 0 }; save(); SYLS.play()`); await p.waitForTimeout(900);
    ok((await p.$eval('#syBox', el => el.dataset.kind).catch(() => '')) === 'word', 'stair 3 is not words');
    ok((await p.$$('#syBox .syl-chip')).length >= 2, 'the word is not shown by syllables');
    await p.screenshot({ path: `${SHOTS}/syl-${lang}-${DEV}-word.png` });
    // Тина, 7, reads: never the syllables; a check of a 7-year-old starts at words
    await run(`switchKid('k2')`); await p.waitForTimeout(700); await home();
    const all = (await run(WEEK(`Object.keys(LS()).flatMap(id => lessonPlan(id).map(x => x.key))`))).flat();
    ok(all.length > 0 && !all.includes('syl-step'), `Тина gets the syllables: ${[...new Set(all)]}`);
    ok((await run(`(P.rskill[LANG] = {}, RSK.startLv())`)) >= 4, 'the check of a 7-year-old starts below words');
    ok(errs.length === 0, 'page errors: ' + errs.join(' | '));
    console.log(`${lang} ${DEV}: ${miss.length ? 'FAIL\n  ' + miss.join('\n  ') : 'ok'}`); if (miss.length) bad++;
    await c.close();
  }
  await b.close(); process.exit(bad ? 1 : 0);
})();
