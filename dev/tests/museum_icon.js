// museum_icon: the «Музей мира» tile shows the drawn museum (columns, a painting in a gold frame), in the light look and
// the dark one (body.quest), 4 languages, phone. Usage: node tests/museum_icon.js [base url]
const { chromium, devices } = require('playwright');
const D = require('path').join(__dirname, 'shots') + '/';
const BASE = process.argv[2] || 'http://localhost:8781/govorilki/';
const kid = (lang) => ({ stars: 5, plays: {}, book: { title: 'Т', log: {} }, settings: { name: 'Тина', gender: 'f', track: 'r', age: 6, friend: 'kitty', onboarded: true, lang } });
let bad = 0; const ok = (c, m) => { console.log((c ? '  ok  ' : '  FAIL ') + m); if (!c) bad++; };
(async () => {
  require('fs').mkdirSync(D, { recursive: true });
  const b = await chromium.launch();
  for (const [lang, path] of [['ru', 'ru/'], ['en', ''], ['pt', 'pt/'], ['de', 'de/']]) {
    const fam = { engine: 'device', micOff: true, srOff: true, parentPhone: true, cur: 'k1', curFam: 'f1', families: { f1: { id: 'f1', name: 'Т', cc: 'PT', kids: ['k1'], grands: [] } }, profiles: { k1: kid(lang) } };
    const c = await b.newContext({ ...devices['iPhone 13'], deviceScaleFactor: 2 });
    await c.route(/ntfy|wikipedia|huggingface|jsdelivr|youtube|wikimedia|workers\.dev/, r => r.abort());
    await c.addInitScript(s => { try { speechSynthesis.speak = u => setTimeout(() => u.onend && u.onend(), 5); } catch (e) {} if (localStorage.getItem('seeded')) return; localStorage.setItem('seeded', 1); localStorage.setItem('govorilki-v2', JSON.stringify(s)); }, fam);
    const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto(BASE + path); await p.waitForTimeout(1500);
    const who = await p.$$('.who-kid'); if (who.length) { await who[0].click(); await p.waitForTimeout(900); }
    await p.evaluate(() => document.querySelector('[data-tab="create"]').click()); await p.waitForTimeout(800);
    const tile = await p.$('.tile[data-id="museum"]');
    ok(!!tile && await tile.$('.pic.drawn svg rect[fill="#FFC83A"]') !== null, `${lang}: museum tile drawn — ` + (tile ? (await tile.innerText()).replace(/\s+/g, ' ') : '-'));
    if (tile) {
      await tile.scrollIntoViewIfNeeded(); await p.waitForTimeout(300);
      for (const dark of [false, true]) {
        await p.evaluate(d => document.body.classList.toggle('quest', d), dark); await p.waitForTimeout(200);
        const r = await tile.boundingBox(), y = Math.max(0, r.y - 30);
        await p.screenshot({ path: D + `museum-icon-${lang}-${dark ? 'dark' : 'light'}.png`, clip: { x: 0, y, width: 390, height: Math.min(r.height + 60, 664 - y) } });
      }
    }
    ok(!errs.length, `${lang}: no page errors ${errs.join(' ')}`);
    await c.close();
  }
  await b.close();
  console.log(bad ? `FAILED ${bad}` : 'ALL OK'); process.exit(bad ? 1 : 0);
})();
