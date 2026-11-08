// how-game: «Как это устроено» — the tile, the four machines: every part tappable with its card and voice, the power button
// animates, the questions (a miss gives a hint) finish with stars; 4 languages, phone (iPhone 13) and laptop.
// Usage: node tests/how.js [base url] [phone|laptop] [only lang]
const { chromium, devices } = require('playwright');
const D = require('path').join(__dirname, 'shots') + '/';
const BASE = process.argv[2] || 'http://localhost:8781/govorilki/', DEV = process.argv[3] || 'phone', ONLY = process.argv[4] || '';
const HOOK = 'const fam = () => ROOT.families[ROOT.curFam] || null;';
const kid = (name, g, age, fr, lang) => ({ stars: 5, plays: {}, book: { title: 'Т', log: {} }, settings: { name, gender: g, track: 'r', age, friend: fr, onboarded: true, lang } });
let bad = 0; const ok = (c, m) => { console.log((c ? '  ok  ' : '  FAIL ') + m); if (!c) bad++; };
require('fs').mkdirSync(D, { recursive: true });
(async () => {
  const b = await chromium.launch();
  for (const [lang, path] of [['ru', 'ru/'], ['en', ''], ['pt', 'pt/'], ['de', 'de/']]) {
    if (ONLY && ONLY !== lang) continue;
    console.log(lang, DEV);
    const fam = { engine: 'device', micOff: true, srOff: true, parentPhone: true, cur: 'k1', curFam: 'f1', families: { f1: { id: 'f1', name: 'Т', cc: 'PT', kids: ['k1', 'k2'], grands: [] } }, profiles: { k1: kid('Тина', 'f', 6, 'kitty', lang), k2: kid('Тоша', 'm', 8, 'tiger', lang) } };
    const c = await b.newContext(DEV === 'phone' ? { ...devices['iPhone 13'], deviceScaleFactor: 1 } : { viewport: { width: 1280, height: 800 } });
    await c.route(/ntfy|wikipedia|huggingface|jsdelivr|youtube|wikimedia|workers\.dev/, r => r.abort());
    await c.route(u => /\/(ru|de|pt|en)?\/?(index\.html)?$/.test(u.pathname), async r => { const x = await r.fetch(); let t = await x.text(); t = t.replace(HOOK, HOOK + ' window.__T = { run: s => eval(s) };'); r.fulfill({ response: x, body: t }); });
    await c.addInitScript(s => { window.__said = []; try { speechSynthesis.speak = u => { window.__said.push(u.text); setTimeout(() => u.onend && u.onend(), 5); }; } catch (e) {} if (localStorage.getItem('seeded')) return; localStorage.setItem('seeded', 1); localStorage.setItem('govorilki-v2', JSON.stringify(s)); }, fam);
    const p = await c.newPage(); const errs = []; p.on('pageerror', e => { errs.push(e.message); console.log('PAGEERR', e.stack.slice(0, 400)); });
    await p.goto(BASE + path); await p.waitForTimeout(1500);
    const who = await p.$$('.who-kid'); if (who.length) { await who[0].click(); await p.waitForTimeout(900); }
    await p.evaluate(() => { const t = document.querySelector('[data-tab="discover"]'); if (t) t.click(); }); await p.waitForTimeout(700);
    const tile = await p.$('.tile[data-id="how"]');
    ok(!!tile, 'tile on the discover tab: ' + (tile ? (await tile.innerText()).replace(/\s+/g, ' ') : '-'));
    if (tile) { await tile.scrollIntoViewIfNeeded(); await tile.click(); await p.waitForTimeout(400); if (!await p.$('.hw-menu')) await tile.click().catch(() => {}); } else await p.evaluate(() => window.__T.run('HOW.menu()'));
    await p.waitForTimeout(700);
    const cards = await p.$$eval('.hw-card', a => a.map(x => x.dataset.k));
    ok(cards.length === 4, 'menu: ' + cards.join(' '));
    await p.screenshot({ path: D + `how-${lang}-${DEV}-menu.png` });
    const cyr = s => lang !== 'ru' && /[А-яЁё]/.test(s);
    const tap = async (x, y) => { if (DEV === 'phone') await p.touchscreen.tap(x, y); else await p.mouse.click(x, y); };
    // a point on the picture where this part (and not another) gets the tap
    const spot = k => p.evaluate(k => {
      const g = document.querySelector(`#hwSvg .hw-p[data-p="${k}"]`), r = g.getBoundingClientRect();
      for (let i = 1; i < 12; i++) for (let j = 1; j < 12; j++) {
        const x = r.left + r.width * ((i * 5) % 12) / 12, y = r.top + r.height * ((j * 7) % 12) / 12, e = document.elementFromPoint(x, y);
        if (e && e.closest('.hw-p') === g) return { x, y };
      }
      return null;
    }, k);
    for (const mk of cards) {
      await p.evaluate(k => document.querySelector(`.hw-card[data-k="${k}"]`).click(), mk); await p.waitForTimeout(700);
      const title = await p.$eval('.bar h1', e => e.textContent).catch(() => '-');
      ok(await p.$('#hwSvg') !== null && !cyr(title), `${mk}: opened «${title}»`);
      const parts = await p.$$eval('#hwChips .chip', a => a.map(x => x.dataset.p));
      const sw = await p.evaluate(k => window.__T.run(`HOW.M.find(m => m.k === '${k}').sw || ''`), mk);
      for (const k of parts) {
        if (k === sw) continue;
        const q = await spot(k);
        ok(!!q, `${mk}/${k}: tappable on the picture`);
        if (!q) { await p.click(`#hwChips .chip[data-p="${k}"]`); } else await tap(q.x, q.y);
        await p.waitForTimeout(300);
        const st = await p.evaluate(() => ({ on: document.querySelector('#hwSvg').dataset.on, h: document.querySelector('#hwCard h2').textContent, t: document.querySelector('#hwCard p').textContent, said: window.__said.slice(-1)[0] || '' }));
        ok(st.on === k && st.t.length > 50 && st.said.length > 6 && st.t.startsWith(st.said.replace(/́/g, '').slice(0, 6)) && !cyr(st.t + st.said + st.h), `${mk}/${k}: «${st.h}» — ${st.said.slice(0, 60)}…`);
      }
      // the power: the lamp by its switch on the picture, the rest by the big button
      if (sw) { const q = await spot(sw); ok(!!q, `${mk}/${sw}: the switch is tappable`); if (q) await tap(q.x, q.y); }
      else await p.click('#hwPow');
      await p.waitForTimeout(sw ? 400 : 3300);
      const run = await p.evaluate(() => ({ run: document.querySelector('#hwSvg').classList.contains('run'), t: document.querySelector('#hwCard p').textContent, anim: document.getAnimations().length }));
      ok(run.run && run.anim > 0 && !cyr(run.t), `${mk}: switched on, ${run.anim} animations — ${run.t.slice(0, 60)}`);
      await p.screenshot({ path: D + `how-${lang}-${DEV}-${mk}-run.png` });
      await p.waitForSelector('.lab-tabs .hw-call', { timeout: 8000 }).catch(() => {});
      ok(await p.$('.lab-tabs .hw-call') !== null, `${mk}: all parts seen → «questions» calls`);
      if (mk === 'lamp' || mk === 'train') { await p.click(`#hwChips .chip[data-p="${parts[1]}"]`); await p.waitForTimeout(300); await p.screenshot({ path: D + `how-${lang}-${DEV}-${mk}-part.png` }); }
      // the questions
      await p.click('.lab-tabs [data-m="quiz"]', { force: true }); await p.waitForTimeout(600);
      for (let i = 0; i < 3; i++) {
        const q = await p.$eval('#hwCard h2', e => e.textContent);
        await p.click('.hw-a:not([data-j="0"])'); await p.waitForTimeout(300);
        const hint = await p.$eval('#hwCard p', e => e.textContent);
        ok(hint.length > 10 && !cyr(q + hint) && await p.$('.hw-a.no') !== null, `${mk} q${i + 1}: «${q}» miss → «${hint}»`);
        if (mk === 'plane' && i === 0) await p.screenshot({ path: D + `how-${lang}-${DEV}-${mk}-quiz.png` });
        const n0 = await p.$$eval('.bd-prog i.ok', a => a.length);
        await p.click('.hw-a[data-j="0"]');
        await p.waitForFunction(n => document.querySelector('.winbox') || document.querySelectorAll('.bd-prog i.ok').length > n, n0, { timeout: 10000 }).catch(() => {});
      }
      await p.waitForSelector('.winbox', { timeout: 15000 }).catch(() => {});
      ok(await p.$('.winbox') !== null, `${mk}: questions done → ` + await p.$eval('.win-line', e => e.textContent).catch(() => '-'));
      await p.evaluate(() => { document.querySelectorAll('.overlay').forEach(o => o.remove()); window.__T.run('HOW.menu()'); }); await p.waitForTimeout(500);
    }
    ok(await p.$$eval('.hw-card .hw-ok', a => a.length) === 4, 'menu: four stars after all four machines');
    ok(!errs.length, 'page errors: ' + JSON.stringify(errs));
    await c.close();
  }
  await b.close();
  console.log(bad ? `FAILED ${bad}` : 'ALL OK'); process.exit(bad ? 1 : 0);
})();
