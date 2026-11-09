// soroban: «Счёты» — the abacus, the story of how the beads count, twelve levels, flash anzan, a ghost abacus, counting in
// the head, and a daily step of «Сегодня» for every age. Invented children 4, 7 and 11. Checks: the path has the step
// «Счёты» for each, the story is played by moving beads, a daily round done right raises the level, every level goes up
// after a clean round and stays after a bad one, tap and swipe move beads, the page has no errors.
// Usage: node tests/soroban.js [base url] [phone|laptop]   (LANGS=ru,en to limit)
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
    for (const [name, g, age, track] of (process.env.KIDS ? [['Тим', 'm', 11, 'r']] : null) || [['Тина', 'f', 4, 'r'], ['Тоша', 'm', 7, 'l'], ['Тим', 'm', 11, 'r']]) {
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
      const shot = n => (lang === 'ru' || n === 'path') && p.screenshot({ path: D + `soroban-${n}-${age}-${lang}-${DEV}.png` });
      // set the abacus to a number by tapping beads, the way a child does
      const setTo = async n => {
        const rods = await p.$$eval('.sb2-rod', r => r.length), want = String(n).padStart(rods, '0').slice(-rods);
        for (let r = 0; r < rods; r++) {
          const d = +want[r], u = d >= 5 ? 1 : 0, lo = d % 5;
          const cur = await p.$eval(`.sb2-rod[data-r="${r}"]`, e => [e.querySelector('.up').classList.contains('on') ? 1 : 0, e.querySelectorAll('.lo.on').length]);
          if (cur[0] !== u) await p.click(`.sb2-b[data-r="${r}"][data-k="5"]`);
          if (lo > cur[1]) await p.click(`.sb2-b[data-r="${r}"][data-k="${lo - 1}"]`);
          else if (lo < cur[1]) await p.click(`.sb2-b[data-r="${r}"][data-k="${lo}"]`);
        }
      };
      // one task of a round, right or wrong (wrong twice, so the answer is shown)
      const task = async right => {
        await p.waitForFunction(() => document.querySelector('.winbox') || document.querySelector('#sbOk, .pick-b, #sbKp'), null, { timeout: 30000 });
        if (await p.$('.winbox')) return 'end';
        const a = await p.$eval('#sbBox', e => e.dataset.a), k = await p.$$eval('#sbDots i', d => d.findIndex(x => x.classList.contains('cur')));
        if (await p.$('#sbKp')) {
          for (let i = 0; i < (right ? 1 : 2); i++) { const v = right ? a : String(+a + 1); for (const ch of v) await p.click(`#sbKp [data-k="${ch}"]`); await p.click('#sbKp [data-k="ok"]'); await p.waitForTimeout(150); }
        } else if (await p.$('.pick-b')) {
          if (right) await p.click(`.pick-b[data-a="${a}"]`); else { await p.click(`.pick-b:not([data-a="${a}"])`); await p.waitForTimeout(150); await p.click(`.pick-b:not([data-a="${a}"]):not([disabled])`); }
        } else {
          if (right) { const was = await p.$eval('#sbBox .sb2', e => +e.dataset.v); if (was === +a) await p.click('#sbOk'); else await setTo(+a); } else { await setTo(+a === 0 ? 1 : 0); for (let i = 0; i < 2; i++) { await p.click('#sbOk'); await p.waitForTimeout(150); } }
        }
        await p.waitForFunction(k => { const d = document.querySelectorAll('#sbDots i')[k]; return !d || /ok|no/.test(d.className) || document.querySelector('.winbox'); }, k, { timeout: 10000 }).catch(() => {});
        await p.waitForFunction(k => document.querySelector('.winbox') || (document.querySelectorAll('#sbDots i')[k + 1] || {}).className === 'cur', k, { timeout: 30000 }).catch(() => {});
        return 'next';
      };
      const round = async right => { for (let i = 0; i < 6; i++) if ((await task(right)) === 'end') break; await p.waitForSelector('.winbox', { timeout: 20000 }).catch(() => {}); return !!(await p.$('.winbox')); };
      const top = () => run('SB.top()');
      // «Сегодня»: the step «Счёты» is on the path for every age
      const ids = await run('lessonPlan("soro").map(x => x.key).join() + "|" + LIDS().join()');
      // little ones (≤5): «Счёты» and «Задачка дня» take turns by day
      const alt = age <= 5 && !/soro/.test(ids.split('|')[1]);
      ok(/^soroban\|/.test(ids) && (alt ? /puzzle/.test(ids) : /soro/.test(ids)), `${name} ${age}: the lesson plan ${ids}`);
      if (alt) { await run('(() => { const o = Date.prototype.getDate; Date.prototype.getDate = function () { return o.call(this) + 1; }; goHome(); })()'); await p.waitForTimeout(600); }
      const node = await p.$('.pd-n[data-l="soro"]');
      ok(!!node, `${name} ${age}: «Сегодня» has the step ${node ? (await node.innerText()).replace(/\s+/g, ' ') : '-'}`);
      await shot('path');
      // the step opens the story first: a little game of moving beads
      await node.click(); await p.waitForTimeout(600);
      ok(!!(await p.$('#sbiSay')), `${name}: the story of the beads`);
      const beadClick = async sel => { await p.click(sel); await p.waitForTimeout(700); };
      await p.click('#sbNext'); await p.waitForTimeout(300);
      await beadClick('.sb2-b[data-k="0"]');
      if (lang === 'ru' && age === 4) await shot('story');
      await beadClick('.sb2-b[data-k="2"]');
      await p.click('#sbNext'); await p.waitForTimeout(300);
      // a swipe down brings the five to the bar
      const up = await p.$('.sb2-b[data-k="5"]'), bb = await up.boundingBox();
      await p.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2); await p.mouse.down(); await p.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2 + 30, { steps: 4 }); await p.mouse.up(); await p.waitForTimeout(700);
      await beadClick('.sb2-b[data-k="0"]');
      const end = await p.$('#sbNext'); ok(!!end && /!/.test(await end.innerText()), `${name}: the story ends with «${end ? await end.innerText() : '-'}»`);
      const vals = await run('window.__said.join(" | ")'); ok(/(^|\| )(1|3|5|6|один|три|пять|шесть|one|three|five|six|um|três|cinco|seis|eins|drei|fünf|sechs)( \||$)/.test(vals), 'the values are said'); if (!/(^|\| )(1|3|5|6|один|три|пять|шесть|one|three|five|six|um|três|cinco|seis|eins|drei|fünf|sechs)( \||$)/.test(vals)) console.log(vals.slice(-600));
      await end.click(); await p.waitForTimeout(800);
      // the daily round at the child's level: right answers → the level goes up and the step is done
      const t0 = await top();
      ok(!(await p.$('#sbLv')) && !!(await p.$('.sb2, #sbF')), `${name}: the daily round at level ${t0}`);
      if (lang === 'ru') await shot('daily');
      ok(await round(true), `${name}: the daily round ends`);
      const t1 = await top(), done = await run('dayCounts(dayKey()).soro || 0');
      ok(t1 === t0 + 1 && done === 1, `${name}: level ${t0} → ${t1}, the step «Счёты» done today: ${done}`);
      // every level: a bad round keeps it, a clean round opens the next
      if (age === 11) {
        const L = await run('SB.L.length');
        for (let lv = 1; lv <= L; lv++) {
          await run(`(SB.S().top = ${lv}, SB.S().lv = ${lv}, SB.play(${lv}))`); await p.waitForTimeout(500);
          if (lv === 1) { await round(false); ok((await top()) === 1, 'level 1: a round of mistakes keeps the level'); await run('SB.play(1)'); await p.waitForTimeout(400); }
          const kind = await run(`SB.L[${lv - 1}].k`);
          if (lang === 'ru' && [2, 6, 8].includes(lv)) await shot('l' + lv);
          if (lang === 'ru' && (kind === 'flash' || kind === 'ghost')) { await p.waitForFunction(() => document.querySelector('#sbF:not([hidden])') && document.querySelector('#sbF').textContent, null, { timeout: 15000 }).catch(() => {}); await shot('l' + lv + '-' + kind); }
          await round(true);
          if ((await top()) !== Math.min(L, lv + 1)) console.log('   win line:', await p.$eval('.winbox', e => e.innerText.replace(/\s+/g, ' ')).catch(() => 'no winbox'));
          ok((await top()) === Math.min(L, lv + 1), `level ${lv} ${kind}: a clean round → ${await top()}`);
        }
        // the generators: whole answers, the friends need a friend
        const sane = await run(`['direct','small','big','two','three'].every(k => Array.from({ length: 200 }, () => SB.GEN[k]()).every(t => Number.isInteger(t.r) && t.r >= 0 && t.r === (t.plus ? t.a + t.b : t.a - t.b) && (k !== 'small' || (t.r >= 5) !== (t.a >= 5)) && (k !== 'big' || Math.floor(t.r / 10) !== Math.floor(t.a / 10))))`);
        ok(sane, 'generators: right sums, small friends cross 5, big friends cross 10');
        await run('screenParents()'); await p.waitForTimeout(600);
        ok(!!(await p.$('#sbLvIn')), 'the grown-ups panel has the abacus level');
      }
      // the maths path shows the abacus for everyone
      await run('screenMathPath()'); await p.waitForTimeout(400);
      ok(!!(await p.$('.mp-card.rec[data-go="soroban"]')), `${name}: «Путь по математике» recommends the abacus`);
      ok(!errs.length, 'no page errors ' + errs.join(' | '));
      await c.close();
    }
  }
  await b.close();
  console.log(bad ? `FAILED ${bad}` : 'ALL OK'); process.exit(bad ? 1 : 0);
})();
