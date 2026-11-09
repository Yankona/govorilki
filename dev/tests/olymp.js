// olymp: the olympiad by skill. Invented children: Тина 4 (pictures, two answers), Тим 7, Тоша 11 (olympiad).
// A round of five: a miss brings praise and a hint, a right answer the explanation in steps (said by the voice); a clean
// round lifts the level; «Полегче/Посложнее»; the last problem is a «трудная задача». «Задачка дня» on «Сегодня».
// Usage: node tests/olymp.js [base url] [phone|laptop]   (LANGS=ru,en to limit)
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
    for (const [name, g, age, track, lv] of [['Тина', 'f', 4, 'r', 1], ['Тим', 'm', 7, 'r', 4], ['Тоша', 'm', 11, 'l', 8]]) {
      const fam = { engine: 'device', micOff: true, srOff: true, parentPhone: true, cur: 'k1', curFam: 'f1', families: { f1: { id: 'f1', name: 'Т', cc: 'PT', kids: ['k1'], grands: [] } }, profiles: { k1: kid(name, g, age, track, lang) } };
      const shotScale = lang === 'ru' && DEV === 'phone' ? 2 : 1;
      const c = await b.newContext(DEV === 'phone' ? { ...devices['iPhone 13'], deviceScaleFactor: shotScale } : { viewport: { width: 1280, height: 800 } });
      await c.route(/ntfy|wikipedia|huggingface|jsdelivr|youtube|wikimedia|workers\.dev/, r => r.abort());
      await c.route(u => /\/(ru|de|pt|en)?\/?(index\.html)?$/.test(u.pathname), async r => { const x = await r.fetch(); let t = await x.text(); t = t.replace(HOOK, HOOK + ' window.__T = { run: s => eval(s) };'); r.fulfill({ response: x, body: t }); });
      await c.addInitScript(s => { window.__said = []; try { speechSynthesis.speak = u => { window.__said.push(u.text); setTimeout(() => u.onend && u.onend(), 5); }; } catch (e) {} if (localStorage.getItem('seeded')) return; localStorage.setItem('seeded', 1); localStorage.setItem('govorilki-v2', JSON.stringify(s)); }, fam);
      const p = await c.newPage(); const errs = []; p.on('pageerror', e => { errs.push(e.message); console.log('PAGEERR', e.stack.slice(0, 400)); });
      await p.goto(BASE + path); await p.waitForTimeout(1500);
      const who = await p.$$('.who-kid'); if (who.length) { await who[0].click(); await p.waitForTimeout(900); }
      const run = s => p.evaluate(s => window.__T.run(s), s);
      await run('GUARD.free = 1');
      // the tile is in «Учимся»
      await p.click('.tb[data-tab="learn"]'); await p.waitForTimeout(500);
      const tile = await p.$('.tile[data-id="olymp"]');
      ok(!!tile, `${name} ${age}: the tile «${tile ? (await tile.innerText()).replace(/\s+/g, ' ') : '-'}»`);
      ok(await run('OLY.lv()') === lv, `${name}: starts at level ${await run('OLY.lv()')} (want ${lv})`);
      // one problem: optionally a miss first, then the right answer; returns the problem
      const solve = async (miss, shot) => {
        await p.waitForSelector('#olBox[data-id]', { timeout: 10000 });
        const id = await p.$eval('#olBox', e => e.dataset.id), pr = await run(`(({ a, o, kp, lv, h1, w }) => ({ a, o, kp, lv, h1, w }))(OLYMP.find(x => x.id === '${id}'))`);
        if (shot) await p.screenshot({ path: D + shot });
        const press = async right => {
          if (pr.kp) { const v = right ? String(parseInt(pr.o[pr.a], 10)) : String(parseInt(pr.o[pr.a], 10) + 1); for (const ch of v) await p.click(`#olKp [data-k="${ch}"]`); await p.click('#olKp [data-k="ok"]'); }
          else await p.click(right ? `.ol-o[data-i="${pr.a}"]` : `.ol-o:not([data-i="${pr.a}"]):not(:disabled)`);
          await p.waitForTimeout(150);
        };
        if (miss) {
          await press(false);
          const h = await p.$eval('#olH', e => e.hidden ? '' : e.textContent);
          ok(h.length > 5, `${name}: a miss — the hint «${h.slice(0, 60)}»`);
        }
        await press(true);
        await p.waitForSelector('#olW:not([hidden]) li', { timeout: 5000 }).catch(() => {});
        const steps = await p.$$eval('#olW li', l => l.map(x => x.textContent));
        return { id, pr, steps };
      };
      await run(`GAMES.find(g => g.id === 'olymp').go()`); await p.waitForTimeout(700);
      ok(!!(await p.$('.ol-top #olUp')), `${name}: a round with the level and «Полегче/Посложнее»`);
      const res = [];
      for (let k = 0; k < 5; k++) {
        const r = await solve(k === 1, k === 0 ? `olymp-lv${lv}-${lang}-${DEV}.png` : '');
        res.push(r);
        if (k === 1) {
          ok(r.steps.length >= 1, `${name}: the explanation in ${r.steps.length} steps`);
          // the voice turns numbers into words and adds stress marks: look for a word of each step
          const words = r.pr.w.map(x => (x.match(/[A-Za-zÀ-ÿА-Яа-яЁё]{4,}/g) || [''])[0]);
          await p.waitForFunction(ws => { const t = window.__said.join(' ').replace(/\u0301/g, ''); return ws.every(w => t.includes(w)); }, words, { timeout: 8000 }).catch(() => {});
          const said = (await p.evaluate(() => window.__said.join(' | '))).slice(-600);
          ok(said.length > 0 && words.every(w => said.replace(/\u0301/g, '').includes(w)), `${name}: the voice says the explanation: ${said.slice(-200)}`);
          if (lang === 'ru') await p.screenshot({ path: D + `olymp-explain-lv${lv}-${DEV}.png` });
        }
        if (k === 4) {
          ok(!!(await p.$('.ol-hard')), `${name}: the fifth is a «трудная задача»`);
          if (lang === 'ru' && lv === 4) await p.screenshot({ path: D + `olymp-hard-${DEV}.png` });
        }
        ok(res[k].pr.lv >= lv && res[k].pr.lv <= Math.min(8, lv + 1), `${name}: problem ${r.id} of level ${r.pr.lv}`);
        if (!(await p.$('#olNext'))) await p.screenshot({ path: D + 'olymp-debug.png' }); await p.click('#olNext'); await p.waitForTimeout(250);
      }
      await p.waitForSelector('.winbox', { timeout: 8000 }).catch(() => {});
      ok(!!(await p.$('.winbox')), `${name}: the round ends with a win box`);
      const l2 = await run('OLY.lv()');
      ok(l2 === Math.min(8, lv + 1), `${name}: four clean answers lift the level ${lv} → ${l2}`);
      ok(await run('P.olymp.hard') === 1, `${name}: the hard one counted`);
      // easier / harder
      await run('OLY.play()'); await p.waitForTimeout(500);
      await p.click('#olDown'); await p.waitForTimeout(400);
      ok(await run('OLY.lv()') === l2 - 1, `${name}: «Полегче» ${l2} → ${await run('OLY.lv()')}`);
      // «Задачка дня» on the path
      await run(`P.homeTab = 'today'; save(); goHome()`); await p.waitForTimeout(700);
      const node = await p.$('.pd-n[data-l="puzzle"]');
      ok(!!node, `${name}: «Задачка дня» on «Сегодня»`);
      if (lang === 'ru' && lv === 1) await p.screenshot({ path: D + `olymp-today-${DEV}.png` });
      if (node) {
        await node.click(); await p.waitForTimeout(800);
        ok(!!(await p.$('.ol-dayb')), `${name}: the puzzle of the day opens`);
        const r = await solve(false);
        ok(r.pr.lv === l2 - 1, `${name}: at the child's level (${r.pr.lv})`);
        await p.click('#olNext'); await p.waitForTimeout(800);
        ok(await run(`dayCounts(dayKey()).puzzle`) === 1, `${name}: the step is done`);
      }
      ok(!errs.length, `${name}: no page errors`);
      await c.close();
    }
  }
  await b.close();
  console.log(bad ? `FAIL ${bad}` : 'all ok');
  process.exit(bad ? 1 : 0);
})();
