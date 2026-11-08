// math-skill: maths by skill, not by age. A first check of 8 climbing tasks sets the level; rounds of «Математика по
// силам» move it (three clean answers up, two tasks with mistakes down); «Полегче/Посложнее»; the steps and numbers to
// 100 follow. Invented children: a strong 8-year-old reaches multiplication and division, a strong 6-year-old gets
// tasks above the age, a struggling 9-year-old gets easier ones. Usage: node tests/math_skill.js [base url] [phone|laptop]
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
    for (const [name, g, age, track, how] of [['Тим', 'm', 8, 'r', 'right'], ['Тина', 'f', 6, 'r', 'right'], ['Тоша', 'm', 9, 'l', 'wrong']]) {
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
      // the tile is in «Учимся», maths first
      await p.click('.tb[data-tab="learn"]'); await p.waitForTimeout(500);
      const tile = await p.$('.tile[data-id="m-skill"]');
      ok(!!tile, `${name} ${age}: the tile «${tile ? (await tile.innerText()).replace(/\s+/g, ' ') : '-'}»`);
      // one task: right or wrong
      let lastK = null;
      const answer = async (right, retry) => {
        await p.waitForSelector('#mkBox[data-a]', { timeout: 10000 });
        if (!retry) await p.waitForFunction(k => document.querySelector('#mkBox').dataset.k !== k || document.querySelector('.winbox'), lastK, { timeout: 10000 }).catch(() => {});
        if (await p.$('.winbox')) return;
        if (!retry) lastK = await p.$eval('#mkBox', e => e.dataset.k);
        const a = await p.$eval('#mkBox', e => e.dataset.a), opt = await p.$('.mk-o');
        if (opt) {
          const sel = right ? `.mk-o[data-v="${a}"]` : `.mk-o:not([data-v="${a}"])`;
          await p.click(sel, { force: true });
        } else {
          const v = right ? a : String(+a + 1);
          for (const ch of v) await p.click(`#mkKp [data-k="${ch}"]`);
          await p.click('#mkKp [data-k="ok"]');
        }
        await p.waitForTimeout(120);
      };
      await run(`GAMES.find(g => g.id === 'm-skill').go()`); await p.waitForTimeout(800);
      ok(!!(await p.$('#mkStep')), `${name}: the first time a check`);
      if (lang === 'ru' && age === 8) await p.screenshot({ path: D + `math-skill-check-${DEV}.png` });
      const lvl = () => run('MSK.lv()');
      const start = await run('MSK.startLv()');
      for (let i = 0; i < 8; i++) await answer(how === 'right');
      await p.waitForSelector('.winbox', { timeout: 15000 }).catch(() => {});
      const l1 = await lvl();
      if (age === 8) ok(l1 >= 10, `${name} 8: after the check level ${l1} (start ${start}) — multiplication and above`);
      if (age === 6) ok(l1 > start + 3, `${name} 6: after the check level ${l1}, above the age start ${start}`);
      if (age === 9) ok(l1 < start, `${name} 9 struggling: after the check level ${l1}`);
      // a round: the strong ones climb, the struggling one goes lower or stays at the bottom
      await run(`MSK.play()`); await p.waitForTimeout(700);
      ok(!!(await p.$('.mk-head')) && !!(await p.$('#lq')), `${name}: a round with the rank and the story strip`);
      if (lang === 'ru' && DEV === 'phone') await p.screenshot({ path: D + `math-skill-${age}-${DEV}.png` });
      for (let i = 0; i < 8; i++) { await answer(how === 'right'); if (how !== 'right') await answer(false, true); }
      await p.waitForSelector('.winbox', { timeout: 15000 }).catch(() => {});
      const l2 = await lvl();
      if (how === 'right') ok(l2 > l1 || l2 === 16, `${name}: a round of clean answers ${l1} → ${l2}`);
      else ok(l2 <= l1, `${name}: a round of mistakes ${l1} → ${l2}`);
      if (lang === 'ru' && age === 8) await p.screenshot({ path: D + `math-skill-win-${DEV}.png` });
      // easier / harder
      await run(`MSK.play()`); await p.waitForTimeout(600);
      const before = await lvl(); await p.click(before > 1 ? '#mkDown' : '#mkUp'); await p.waitForTimeout(500);
      ok(Math.abs((await lvl()) - before) === 1, `${name}: «Полегче/Посложнее» ${before} → ${await lvl()}`);
      // the other maths games follow
      if (age === 8) {
        const st = await run('stepsTop()'), n1 = await run('nLv("tens")'), cnt = await run(`LQ.lv('math-count')`);
        ok(st >= 13 && n1 === 2 && cnt === 2, `${name}: steps open to ${st}, numbers to 100 level ${n1 + 1}, «Сколько?» level ${cnt + 1}`);
        // the sprint takes tasks of the level, a hard task fits the screen
        await run('screenSprint()'); await p.waitForTimeout(400);
        ok(/\d/.test(await p.$eval('#spQ', e => e.textContent)), 'sprint: ' + await p.$eval('#spQ', e => e.textContent));
        await run(`MSK.setLv(11); MSK.play()`); await p.waitForTimeout(600);
        // a word problem or a division fits the phone
        const r = await p.$eval('.mk', e => { const k = document.querySelector('#mkKp, .mk-opts'), g = document.querySelector('.guide'); return [k ? Math.round(k.getBoundingClientRect().bottom) : 0, g ? Math.round(g.getBoundingClientRect().top) : innerHeight]; });
        ok(r[0] > 0 && r[0] <= r[1] + 2, `level 11 answer area ${r.join(' / ')}`);
        if (lang === 'ru') { await p.screenshot({ path: D + `math-skill-l11-${DEV}.png` }); await run(`MSK.setLv(13); MSK.play()`); await p.waitForTimeout(600); await p.screenshot({ path: D + `math-skill-l13-${DEV}.png` }); }
        // every level makes tasks with an answer
        const sane = await run(`MSK.L.every((x, i) => Array.from({ length: 40 }, () => MSK.pick(i + 1)).every(t => t.a !== undefined && t.a !== '' && !Number.isNaN(t.a) && (!t.opts || t.opts.map(String).includes(String(t.a))) && (typeof t.a !== 'number' || (t.a >= 0 && Number.isInteger(t.a)))))`);
        ok(sane, 'all 16 levels: whole non-negative answers, the right one among the choices');
        // the grown-ups' panel
        await run('screenParents()'); await p.waitForTimeout(600);
        ok(!!(await p.$('#mkLvIn')), 'the panel has the maths level');
      }
      ok(!errs.length, 'no page errors ' + errs.join(' | '));
      await c.close();
    }
  }
  await b.close();
  console.log(bad ? `FAILED ${bad}` : 'ALL OK'); process.exit(bad ? 1 : 0);
})();
