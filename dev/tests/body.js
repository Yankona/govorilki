// body-game: «Как устроено тело» — every organ tappable with its card and voice, the learn finish, the find mode;
// 4 languages, phone (iPhone 13) and laptop. Usage: node tests/body.js [base url] [phone|laptop]
const { chromium, devices } = require('playwright');
const D = require('path').join(__dirname, 'shots') + '/';
const BASE = process.argv[2] || 'http://localhost:8781/govorilki/', DEV = process.argv[3] || 'phone';
const HOOK = 'const fam = () => ROOT.families[ROOT.curFam] || null;';
const kid = (name, g, age, fr, lang) => ({ stars: 5, plays: {}, book: { title: 'Т', log: {} }, settings: { name, gender: g, track: 'r', age, friend: fr, onboarded: true, lang } });
const ORG = ['brain', 'heart', 'lungs', 'stomach', 'liver', 'kidneys', 'intest', 'bones', 'muscles'];
let bad = 0; const ok = (c, m) => { console.log((c ? '  ok  ' : '  FAIL ') + m); if (!c) bad++; };
(async () => {
  const b = await chromium.launch();
  for (const [lang, path] of [['ru', 'ru/'], ['en', ''], ['pt', 'pt/'], ['de', 'de/']]) {
    console.log(lang, DEV);
    const fam = { engine: 'device', micOff: true, srOff: true, parentPhone: true, cur: 'k1', curFam: 'f1', families: { f1: { id: 'f1', name: 'Т', cc: 'PT', kids: ['k1', 'k2'], grands: [] } }, profiles: { k1: kid('Тина', 'f', 5, 'kitty', lang), k2: kid('Тоша', 'm', 8, 'tiger', lang) } };
    const c = await b.newContext(DEV === 'phone' ? { ...devices['iPhone 13'], deviceScaleFactor: 1 } : { viewport: { width: 1280, height: 800 } });
    await c.route(/ntfy|wikipedia|huggingface|jsdelivr|youtube|wikimedia|workers\.dev/, r => r.abort());
    await c.route(u => /\/(ru|de|pt|en)?\/?(index\.html)?$/.test(u.pathname), async r => { const x = await r.fetch(); let t = await x.text(); t = t.replace(HOOK, HOOK + ' window.__T = { run: s => eval(s) };'); r.fulfill({ response: x, body: t }); });
    await c.addInitScript(s => { window.__said = []; try { speechSynthesis.speak = u => { window.__said.push(u.text); setTimeout(() => u.onend && u.onend(), 5); }; } catch (e) {} if (localStorage.getItem('seeded')) return; localStorage.setItem('seeded', 1); localStorage.setItem('govorilki-v2', JSON.stringify(s)); }, fam);
    const p = await c.newPage(); const errs = []; p.on("pageerror", e => { errs.push(e.message); console.log("PAGEERR", e.stack.slice(0, 400)); });
    await p.goto(BASE + path); await p.waitForTimeout(1500);
    const who = await p.$$('.who-kid'); if (who.length) { await who[0].click(); await p.waitForTimeout(900); }
    // the tile on the «Узнаём» tab
    await p.evaluate(() => { const t = document.querySelector('[data-tab="discover"]'); if (t) t.click(); }); await p.waitForTimeout(700);
    const tile = await p.$('.tile[data-id="body"]');
    ok(!!tile, 'tile on the discover tab: ' + (tile ? (await tile.innerText()).replace(/\s+/g, ' ') : '-'));
    if (tile) { await tile.scrollIntoViewIfNeeded(); await tile.click(); await p.waitForTimeout(400); if (!await p.$('#bdSvg')) await tile.click().catch(() => {}); } else await p.evaluate(() => window.__T.run('BODY.screen()'));
    await p.waitForTimeout(900); await p.screenshot({ path: D + `body-${lang}-${DEV}-open.png` });
    ok(await p.$('#bdSvg') !== null, 'game opened: ' + await p.$eval('.bar h1', e => e.textContent).catch(() => '-'));
    const pt = k => p.evaluate(k => { const s = document.querySelector(`#bdSvg .bd-o[data-o="${k}"] .bd-s`), r = s.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2, e = document.elementFromPoint(x, y), g = e && e.closest('.bd-o'); return { x, y, hit: g ? g.dataset.o : null }; }, k);
    const tap = async (x, y) => { if (DEV === 'phone') await p.touchscreen.tap(x, y); else await p.mouse.click(x, y); };
    if (await p.$('#bdSvg')) {
      for (const k of ORG) {
        const q = await pt(k);
        ok(q.hit === k, `${k}: the place on the picture is tappable (${q.hit})`);
        await tap(q.x, q.y); await p.waitForTimeout(350);
        const st = await p.evaluate(() => ({ on: document.querySelector('#bdSvg').dataset.on, h: document.querySelector('#bdCard h2').textContent, t: document.querySelector('#bdCard p').textContent, said: window.__said.slice(-1)[0] || '' }));
        ok(st.on === k && st.t.length > 60 && st.said.length > 6 && st.t.startsWith(st.said.replace(/\u0301/g, '').slice(0, 6)) && !(lang !== 'ru' && /[А-яЁё]/.test(st.t + st.said)), `${k}: «${st.h}» — ${st.said.slice(0, 70)}…`);
        if (k === 'heart' || k === 'muscles') await p.screenshot({ path: D + `body-${lang}-${DEV}-${k}.png` });
      }
      await p.waitForSelector('.winbox', { timeout: 15000 }).catch(() => {});
      ok(await p.$('.winbox') !== null, 'all nine seen → stars: ' + await p.$eval('.win-line', e => e.textContent).catch(() => '-'));
      // find mode
      await p.evaluate(() => window.__T.run("BODY.screen('find')")); await p.waitForTimeout(700);
      let rounds = 0;
      for (let r = 0; r < 6; r++) {
        const ask = await p.$eval('#bdCard h2', e => e.textContent);
        // the shorts: no organ there
        const sh = await p.evaluate(() => { const m = document.querySelector('#bdSvg').getScreenCTM(); return { x: m.a * 150 + m.e, y: m.d * 425 + m.f }; });
        await tap(sh.x, sh.y); await p.waitForTimeout(250); await tap(sh.x, sh.y); await p.waitForTimeout(300);
        const hint = await p.$eval('#bdSvg .bd-o.hint', e => e.dataset.o).catch(() => null), line = await p.$eval('#bdCard p', e => e.textContent);
        if (r === 0) { ok(!!hint, `find: «${ask}» → two misses → «${line}» and ${hint} blinks`); await p.screenshot({ path: D + `body-${lang}-${DEV}-find.png` }); }
        if (!hint) break;
        const q = await pt(hint); await tap(q.x, q.y); await p.waitForTimeout(700); rounds++;
      }
      await p.waitForTimeout(600);
      ok(rounds === 6 && await p.$('.winbox') !== null, 'find: 6 organs found → ' + await p.$eval('.win-line', e => e.textContent).catch(() => '-'));
    }
    ok(!errs.length, 'page errors: ' + JSON.stringify(errs));
    await c.close();
  }
  await b.close();
  console.log(bad ? `FAILED ${bad}` : 'ALL OK'); process.exit(bad ? 1 : 0);
})();
