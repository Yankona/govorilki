// read-skill: reading by skill, not by age. A first check of 8 tasks sets the reading step (1…9); rounds of «Чтение по
// силам» move it (four clean answers up, two tasks with mistakes back); «Сегодня» takes its reading node from the step.
// Invented children: Тим 5 reads well (climbs high), Тина 8 reads Russian like a little one (stays at an early step,
// with grown-up looks and words), Тоша 10 reads well. Usage: node tests/read_skill.js [base url] [phone|laptop]
const { chromium, devices } = require('playwright');
const D = require('path').join(__dirname, 'shots') + '/';
require('fs').mkdirSync(D, { recursive: true });
const BASE = process.argv[2] || 'http://localhost:8781/govorilki/', DEV = process.argv[3] || 'phone';
const HOOK = 'const fam = () => ROOT.families[ROOT.curFam] || null;';
const kid = (name, g, age, track, lang) => ({ stars: 5, plays: {}, book: { title: 'Т', log: {} }, settings: { name, gender: g, track, age, friend: 'kitty', onboarded: true, lang } });
let bad = 0; const ok = (c, m) => { console.log((c ? '  ok  ' : '  FAIL ') + m); if (!c) bad++; };
(async () => {
  const b = await chromium.launch();
  for (const [lang, path] of [['ru', 'ru/'], ['en', ''], ['pt', 'pt/'], ['de', 'de/']].filter(x => !process.env.LANGS || process.env.LANGS.includes(x[0]))) {
    console.log(lang, DEV);
    for (const [name, g, age, track, how] of [['Тим', 'm', 5, 'r', 'right'], ['Тина', 'f', 8, 'r', 'wrong'], ['Тоша', 'm', 10, 'l', 'right']]) {
      const fam = { engine: 'device', micOff: true, srOff: true, parentPhone: true, cur: 'k1', curFam: 'f1', families: { f1: { id: 'f1', name: 'Т', cc: 'PT', kids: ['k1'], grands: [] } }, profiles: { k1: kid(name, g, age, track, lang) } };
      const c = await b.newContext(DEV === 'phone' ? { ...devices['iPhone 13'], deviceScaleFactor: 1 } : { viewport: { width: 1280, height: 800 } });
      await c.route(/ntfy|wikipedia|huggingface|jsdelivr|youtube|wikimedia|workers\.dev/, r => r.abort());
      await c.route(u => /\/(ru|de|pt|en)?\/?(index\.html)?$/.test(u.pathname), async r => { const x = await r.fetch(); let t = await x.text(); t = t.replace(HOOK, HOOK + ' window.__T = { run: s => eval(s) };'); r.fulfill({ response: x, body: t }); });
      await c.addInitScript(s => { window.__said = []; try { speechSynthesis.speak = u => { window.__said.push(u.text); setTimeout(() => u.onend && u.onend(), 5); }; } catch (e) {} if (localStorage.getItem('seeded')) return; localStorage.setItem('seeded', 1); localStorage.setItem('govorilki-v2', JSON.stringify(s)); }, fam);
      const p = await c.newPage(); const errs = []; p.on('pageerror', e => { errs.push(e.message); console.log('PAGEERR', e.stack.slice(0, 400)); });
      await p.goto(BASE + path); await p.waitForTimeout(1500);
      const who = await p.$$('.who-kid'); if (who.length) { await who[0].click(); await p.waitForTimeout(900); }
      const run = s => p.evaluate(s => window.__T.run(s), s);
      await run('GUARD.free = 1');
      const tag = `${lang} ${name} ${age}`;
      // «Сегодня» before the check: the reading node asks for the check first
      await run('goHome()'); await p.waitForTimeout(700);
      const plan0 = await run(`lessonPlan('read').map(s => s.key)`);
      // a 5–6-year-old who does not read yet: the syllables first (SYLSTEP), then «Чтение по силам»
      ok(plan0[age <= 6 ? 1 : 0] === 'r-skill' && (age > 6 || plan0[0] === 'syl-step'), `${tag}: «Сегодня» reading starts with «Чтение по силам» (${plan0.join(', ')})`);
      // the tile is in «Учимся»
      await p.click('.tb[data-tab="learn"]').catch(() => {}); await p.waitForTimeout(500);
      ok(!!(await p.$('.tile[data-id="r-skill"]')), `${tag}: the tile «Чтение по силам» in «Учимся»`);
      let lastK = null;
      const answer = async (right, retry) => {
        await p.waitForSelector('#rkBox[data-a]', { timeout: 10000 });
        if (!retry) await p.waitForFunction(k => document.querySelector('#rkBox').dataset.k !== k || document.querySelector('.winbox'), lastK, { timeout: 12000 }).catch(() => {});
        if (await p.$('.winbox')) return;
        if (!retry) lastK = await p.$eval('#rkBox', e => e.dataset.k);
        await p.evaluate(right => { const bx = document.querySelector('#rkBox'), a = bx.dataset.a; const o = [...bx.querySelectorAll('.rk-o')].find(x => right ? x.dataset.v === a : x.dataset.v !== a && !x.disabled); if (o) o.click(); }, right);
        await p.waitForTimeout(120);
      };
      // the placement
      await run(`GAMES.find(g => g.id === 'r-skill').go()`); await p.waitForTimeout(800);
      ok(!!(await p.$('#rkStep')), `${tag}: the first time a check`);
      if (lang === 'ru' && age === 8) await p.screenshot({ path: D + `read-skill-check-${DEV}.png` });
      const lvl = () => run('RSK.lv()'), start = await run('RSK.startLv()');
      for (let i = 0; i < 8; i++) await answer(how === 'right');
      await p.waitForSelector('.winbox', { timeout: 15000 }).catch(() => {});
      const l1 = await lvl();
      if (how === 'right') ok(l1 >= 8 && l1 > start, `${tag}: reads well → step ${l1} (age start ${start})`);
      else ok(l1 <= 2 && l1 < start, `${tag}: reads Russian like a little one → step ${l1} (age start ${start})`);
      // a round: clean answers lift the step, misses never do
      await run(how === 'right' ? 'RSK.setLv(3)' : 'RSK.setLv(4)');
      await run(`RSK.play()`); await p.waitForTimeout(700);
      ok(!!(await p.$('.rk-head')), `${tag}: a round with the step on top`);
      ok(age >= 8 ? !(await p.$('#lq')) && !!(await p.$('.rk-bar')) : !!(await p.$('#lq')), `${tag}: ${age >= 8 ? 'a quiet bar, no baby strip' : 'the story strip'}`);
      for (let i = 0; i < 8; i++) { await answer(how === 'right'); if (how !== 'right') await answer(false, true); }
      await p.waitForSelector('.winbox', { timeout: 20000 }).catch(() => {});
      const l2 = await lvl();
      if (how === 'right') ok(l2 > 3, `${tag}: a round of clean answers 3 → ${l2}`);
      else ok(l2 < 4, `${tag}: a round of misses 4 → ${l2} (no step up)`);
      // easier / harder
      await run('RSK.setLv(5); RSK.play()'); await p.waitForTimeout(600);
      await p.click('#rkDown'); await p.waitForTimeout(400);
      ok((await lvl()) === 4, `${tag}: «Полегче» 5 → ${await lvl()}`);
      // every step makes tasks whose answer is among the choices
      const sane = await run(`RSK.L.every((x, i) => Array.from({ length: 30 }, () => RSK.make(i + 1)).every(t => t.a && t.opts.length === 3 && new Set(t.opts.map(o => o.v)).size === 3 && t.opts.some(o => o.v === t.a)))`);
      ok(sane, `${tag}: all 9 steps — three different choices, the right one among them`);
      // screenshots of three steps for the 8-year-old, and the texts fit the phone
      if (age === 8) for (const l of [1, 5, 8]) {
        await run(`RSK.setLv(${l}); RSK.play()`); await p.waitForTimeout(700);
        const r = await p.$eval('.rk-opts', e => { const g = document.querySelector('.guide'); return [Math.round(e.getBoundingClientRect().bottom), g ? Math.round(g.getBoundingClientRect().top) : innerHeight, document.documentElement.scrollWidth <= innerWidth + 1]; });
        ok(r[2], `${tag}: step ${l} no sideways scroll`);
        if (lang === 'ru' || l === 8) await p.screenshot({ path: D + `read-skill-${lang}-l${l}-${DEV}.png`, fullPage: l === 8 });
      }
      // «Сегодня» by the step
      if (age === 8) await run('RSK.setLv(1)');
      await run('goHome()'); await p.waitForTimeout(600); await p.click('.tb[data-tab="today"]').catch(() => {}); await p.waitForTimeout(600);
      const plan = await run(`lessonPlan('read').map(s => s.key)`), lb = await p.$eval('.pd-n[data-l="read"]', e => e.innerText.replace(/\s+/g, ' ')).catch(() => '-');
      if (age === 5) ok(plan[0] === 'syl-step' && plan[1] === 'r-skill', `${tag}: «Сегодня» at step ${await lvl()}: ${plan.join(', ')} · «${lb}»`);
      if (age === 8) {
        ok(plan.join() === 'r-skill,abc-find', `${tag}: «Сегодня» at step 1: ${plan.join(', ')} · «${lb}»`);
        ok(!/малыш|baby|bebé|Baby/i.test(lb), `${tag}: no baby words in the node`);
        if (lang === 'ru') { ok(/русское чтение/i.test(lb), `${tag}: «Тренируем русское чтение»`); await p.screenshot({ path: D + `read-skill-today-${DEV}.png` }); }
      }
      if (age === 10) { await run('RSK.setLv(9); goHome()'); await p.waitForTimeout(600); const pl = await run(`lessonPlan('read').map(s => s.key)`); ok(pl.join() === 'r-skill,l-syll,speed', `${tag}: «Сегодня» at step 9: ${pl.join(', ')}`); }
      // start one lesson from «Сегодня»: the round opens
      await run(`P.today = null; startLesson('read')`); await p.waitForTimeout(700);
      ok(!!(await p.$('#rkBox')), `${tag}: «Сегодня» → reading opens «Чтение по силам»`);
      // the grown-ups' panel
      if (age === 8) { await run('screenParents()'); await p.waitForTimeout(600); ok(!!(await p.$('#rkLvIn')), `${tag}: the panel has the reading step`); }
      ok(!errs.length, `${tag}: no page errors ` + errs.join(' | '));
      await c.close();
    }
  }
  await b.close();
  console.log(bad ? `FAILED ${bad}` : 'ALL OK'); process.exit(bad ? 1 : 0);
})();
