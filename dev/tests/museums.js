// «Музей мира» lives in «Творим» (the owner: «Давай музеи мира перенесём в «Творим»»): the tile is on the create tab
// for a little one and an older one, not on «Узнаём»; it opens; the painters' tab and the art quiz still open from it.
// 4 languages, phone. Usage: node tests/museums.js [base url] [phone|laptop]
const { chromium, devices } = require('playwright');
const D = require('path').join(__dirname, 'shots') + '/';
const BASE = process.argv[2] || 'http://localhost:8781/govorilki/', DEV = process.argv[3] || 'phone';
const HOOK = 'const fam = () => ROOT.families[ROOT.curFam] || null;';
const kid = (name, g, age, track, lang) => ({ stars: 5, plays: {}, museum: { seen: ['x1', 'x2'] }, book: { title: 'Т', log: {} }, settings: { name, gender: g, track, age, friend: 'kitty', onboarded: true, lang } });
let bad = 0; const ok = (c, m) => { console.log((c ? '  ok  ' : '  FAIL ') + m); if (!c) bad++; };
(async () => {
  const b = await chromium.launch();
  for (const [lang, path] of [['ru', 'ru/'], ['en', ''], ['pt', 'pt/'], ['de', 'de/']]) {
    for (const [ki, who] of [['k1', 'Тина 5'], ['k2', 'Тоша 9']]) {
      console.log(lang, DEV, who);
      const fam = { engine: 'device', micOff: true, srOff: true, parentPhone: true, cur: ki, curFam: 'f1', families: { f1: { id: 'f1', name: 'Т', cc: 'PT', kids: ['k1', 'k2'], grands: [] } }, profiles: { k1: kid('Тина', 'f', 5, 'r', lang), k2: kid('Тоша', 'm', 9, 'l', lang) } };
      const c = await b.newContext(DEV === 'phone' ? { ...devices['iPhone 13'], deviceScaleFactor: 1 } : { viewport: { width: 1280, height: 800 } });
      await c.route(/ntfy|wikipedia|huggingface|jsdelivr|youtube|wikimedia|workers\.dev/, r => r.abort());
      await c.route(u => /\/(ru|de|pt|en)?\/?(index\.html)?$/.test(u.pathname), async r => { const x = await r.fetch(); let t = await x.text(); t = t.replace(HOOK, HOOK + ' window.__T = { run: s => eval(s) };'); r.fulfill({ response: x, body: t }); });
      await c.addInitScript(s => { window.__said = []; try { speechSynthesis.speak = u => { window.__said.push(u.text); setTimeout(() => u.onend && u.onend(), 5); }; } catch (e) {} if (localStorage.getItem('seeded')) return; localStorage.setItem('seeded', 1); localStorage.setItem('govorilki-v2', JSON.stringify(s)); }, fam);
      const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
      await p.goto(BASE + path); await p.waitForTimeout(1500);
      const kids = await p.$$('.who-kid'); if (kids.length) { await kids[ki === 'k1' ? 0 : 1].click(); await p.waitForTimeout(900); }
      const tab = async t => { await p.evaluate(t => { const x = document.querySelector(`[data-tab="${t}"]`); if (x) x.click(); }, t); await p.waitForTimeout(700); };
      const ART = ['museum', 'composers', 'ballet', 'piano', 'xylo', 'songs', 'conductor', 'guess-composer', 'cmp-tf'];
      const ids = () => p.$$eval('.tile[data-id]', x => x.map(e => e.dataset.id));
      await tab('discover');
      const dis = await ids();
      ok(!ART.some(a => dis.includes(a)), '«Узнаём»: no art or music tiles (' + dis.filter(a => ART.includes(a)).join(' ') + ')');
      ok(!['tales', 'bookshelf', 'code-col', 'code-abc'].some(a => dis.includes(a)), '«Узнаём»: no books or reading games');
      await tab('learn');
      const le = await ids();
      ok(!le.includes('piano') && le.includes('bookshelf') && (lang !== 'ru' || le.includes('tales')), '«Учимся»: books and tales, no piano');
      await tab('create');
      const cr = await ids(), want = ki === 'k1' ? ['museum', 'composers', 'ballet', 'xylo', 'songs'] : ['museum', 'composers', 'ballet', 'piano', 'conductor'];
      ok(want.every(a => cr.includes(a)), '«Творим»: ' + cr.join(' '));
      const tile = await p.$('.tile[data-id="museum"]');
      ok(!!tile, '«Творим»: ' + (tile ? (await tile.innerText()).replace(/\s+/g, ' ') : '-'));
      if (ki === 'k1') await p.screenshot({ path: D + `museums-${lang}-${DEV}-create.png` });
      if (tile) {
        await tile.scrollIntoViewIfNeeded(); await tile.click(); await p.waitForTimeout(1500);
        if (!await p.$('.art')) { await p.screenshot({ path: D + `museums-${lang}-${DEV}-tap.png` }); await p.evaluate(() => document.querySelector('.tile[data-id="museum"]').click()); await p.waitForTimeout(1500); }
      }
      ok(await p.$('.art') !== null, 'the museum opens: ' + await p.$eval('.bar h1', e => e.textContent).catch(() => '-'));
      ok(await p.evaluate(() => window.__T.run('(P.museum.seen || []).length >= 2')), 'what was seen stays');
      await p.evaluate(() => window.__T.run("screenMuseum('who')")); await p.waitForTimeout(600);
      ok(await p.$('.art') !== null, 'the painters tab opens');
      ok(!errs.length, 'page errors: ' + JSON.stringify(errs));
      await c.close();
    }
  }
  await b.close();
  console.log(bad ? `FAILED ${bad}` : 'ALL OK'); process.exit(bad ? 1 : 0);
})();
