// art_quiz: the museum quiz by age — invented children 5, 8 and 11. Level 1 (5): only «find the painting» and the
// painting's mood (what you can see), no true-or-false, no years; level 2 (8): famous painters, cities, true-or-false;
// level 3 (11): the harder ones. A miss shows a hint, the second miss makes the right answer blink; 8 rounds end in a
// win; the separate paintings true-or-false tile is gone. 4 languages. Usage: node tests/art_quiz.js [base url] [phone|laptop]
const { chromium, devices } = require('playwright');
const D = require('path').join(__dirname, 'shots') + '/';
const BASE = process.argv[2] || 'http://localhost:8781/govorilki/', DEV = process.argv[3] || 'phone';
const HOOK = 'const fam = () => ROOT.families[ROOT.curFam] || null;';
const kid = (name, age, lang) => ({ stars: 5, plays: {}, book: { title: 'Т', log: {} }, settings: { name, gender: 'f', track: age >= 8 ? 'l' : 'r', age, friend: 'kitty', onboarded: true, lang } });
let bad = 0; const ok = (c, m) => { console.log((c ? '  ok  ' : '  FAIL ') + m); if (!c) bad++; };
(async () => {
  require('fs').mkdirSync(D, { recursive: true });
  const b = await chromium.launch();
  for (const [lang, path] of [['ru', 'ru/'], ['en', ''], ['pt', 'pt/'], ['de', 'de/']]) {
    for (const age of [5, 8, 11]) {
      const fam = { engine: 'device', micOff: true, srOff: true, parentPhone: true, cur: 'k1', curFam: 'f1', families: { f1: { id: 'f1', name: 'Т', cc: 'PT', kids: ['k1'], grands: [] } }, profiles: { k1: kid(age === 5 ? 'Тина' : age === 8 ? 'Тоша' : 'Тим', age, lang) } };
      const c = await b.newContext(DEV === 'phone' ? { ...devices['iPhone 13'], deviceScaleFactor: 1 } : { viewport: { width: 1280, height: 800 } });
      await c.route(process.env.IMG ? /ntfy|wikipedia|huggingface|jsdelivr|youtube|workers\.dev/ : /ntfy|wikipedia|huggingface|jsdelivr|youtube|wikimedia|workers\.dev/, r => r.abort());
      await c.route(u => /\/(ru|de|pt|en)?\/?(index\.html)?$/.test(u.pathname), async r => { const x = await r.fetch(); let t = await x.text(); t = t.replace(HOOK, HOOK + ' window.__T = { run: s => eval(s) };'); r.fulfill({ response: x, body: t }); });
      await c.addInitScript(s => { window.__said = []; try { speechSynthesis.speak = u => { window.__said.push(u.text); setTimeout(() => u.onend && u.onend(), 5); }; } catch (e) {} if (localStorage.getItem('seeded')) return; localStorage.setItem('seeded', 1); localStorage.setItem('govorilki-v2', JSON.stringify(s)); }, fam);
      const p = await c.newPage(); const errs = []; p.on('pageerror', e => { errs.push(e.message); console.log('PAGEERR', e.stack.slice(0, 300)); });
      const cyr = s => lang !== 'ru' && /[А-яЁё]/.test(s.replace(/Тина|Тоша|Тим/g, ''));
      const run = s => p.evaluate(s => window.__T.run(s), s);
      await p.goto(BASE + path); await p.waitForTimeout(1300);
      const who = await p.$$('.who-kid'); if (who.length) { await who[0].click(); await p.waitForTimeout(700); }
      if (age === 5) {
        await p.evaluate(() => document.querySelector('[data-tab="create"]').click()); await p.waitForTimeout(600);
        ok(!await p.$('.tile[data-id="art-tf"]') && await p.$('.tile[data-id="art-quiz"]') !== null, `${lang}: one quiz tile, no separate paintings true-or-false`);
      }
      await run('screenArtQuiz()'); await p.waitForSelector('#aqBox[data-kind]', { timeout: 8000 }).catch(() => {});
      const kinds = [], texts = []; let hinted = false, blink = false, lv0 = await p.$eval('#aqBox', e => +e.dataset.lv).catch(() => 0);
      for (let r = 0; r < 8; r++) {
        await p.waitForFunction(n => document.querySelector('#aqN') && +document.querySelector('#aqN').textContent === n && document.querySelector('#aqBox[data-kind] [data-a]:not([disabled])'), r + 1, { timeout: 8000 }).catch(() => {});
        const kind = await p.$eval('#aqBox', e => e.dataset.kind).catch(() => '?'); kinds.push(kind);
        texts.push(await p.$eval('#aqBox', e => e.innerText).catch(() => ''));
        if (r === 1 || (age === 8 && r === 6)) await p.screenshot({ path: D + `artquiz-${lang}-${DEV}-${age}${r === 6 ? '-tf' : ''}.png` });
        for (let k = 0; k < 4; k++) {
          const smart = age === 8 && r >= 2, okv = smart ? await p.$eval('#aqBox', e => e._ok) : null;
          const btn = smart ? await p.$(`#aqBox [data-a="${okv}"]`) : await p.$('#aqBox [data-a]:not([disabled])'); if (!btn) break;
          const before = await p.$eval('#aqN', e => e.textContent);
          await btn.click(); await p.waitForTimeout(250);
          if (!hinted && await p.$eval('#aqHint', e => !e.hidden).catch(() => false)) { hinted = true; if (!kind.startsWith('tf')) await p.screenshot({ path: D + `artquiz-${lang}-${DEV}-${age}-hint.png` }); }
          if (await p.$('#aqBox .hint')) blink = true;
          if (await p.$('.winbox') || await p.$eval('#aqN', e => e.textContent) !== before || await p.$('#aqBox .ok')) break;
        }
        await p.waitForTimeout(400);
      }
      await p.waitForSelector('.winbox', { timeout: 8000 }).catch(() => {});
      const all = texts.join(' ');
      ok(await p.$('.winbox') !== null, `${lang} ${age}: 8 rounds → ${await p.$eval('.win-line', e => e.textContent).catch(() => '-')}`);
      ok(!cyr(all), `${lang} ${age}: no Russian left`);
      if (age === 5) ok(lv0 === 1 && kinds.every(k => k === 'find' || k === 'mood'), `${lang} 5: level 1, only what you can see: ${kinds.join(',')}`);
      if (age === 8) ok(lv0 === 1 && kinds.slice(5).some(k => !['find', 'mood'].includes(k)), `${lang} 8: starts at level ${lv0}, three right in a row → level 2: ${kinds.join(',')}`);
      if (age === 11) ok(lv0 === 2, `${lang} 11: starts at level ${lv0}: ${kinds.join(',')}`);
      if (age !== 8) ok(hinted, `${lang} ${age}: a miss gives a hint${blink ? ', the second makes the answer blink' : ''}`);
      ok(!errs.length, `${lang} ${age}: no page errors`);
      await c.close();
    }
  }
  await b.close();
  console.log(bad ? `FAILED ${bad}` : 'ALL OK'); process.exit(bad ? 1 : 0);
})();
