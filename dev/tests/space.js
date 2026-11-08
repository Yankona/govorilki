// space: «Космос» — the Sun and every planet tappable with its card and voice, the learn finish, day and night turns,
// the Moon's eight phases, «По порядку» and «Самая большая» to the end, the stories (ru); 4 languages, phone and laptop.
// Usage: node tests/space.js [base url] [phone|laptop]
const { chromium, devices } = require('playwright');
const D = require('path').join(__dirname, 'shots') + '/';
const BASE = process.argv[2] || 'http://localhost:8781/govorilki/', DEV = process.argv[3] || 'phone';
const HOOK = 'const fam = () => ROOT.families[ROOT.curFam] || null;';
const kid = (name, g, age, fr, lang) => ({ stars: 5, plays: {}, book: { title: 'Т', log: {} }, settings: { name, gender: g, track: 'r', age, friend: fr, onboarded: true, lang } });
const PL = ['sun', 'mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune'];
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
    await p.evaluate(() => { const t = document.querySelector('[data-tab="discover"]'); if (t) t.click(); }); await p.waitForTimeout(700);
    const tile = await p.$('.tile[data-id="space"]');
    ok(!!tile, 'tile on the discover tab: ' + (tile ? (await tile.innerText()).replace(/\s+/g, ' ') : '-'));
    ok(!await p.$('.tile[data-id="learn-space"]'), 'no separate stories tile');
    if (tile) { await tile.scrollIntoViewIfNeeded(); await tile.click(); await p.waitForTimeout(400); if (!await p.$('#spSvg')) await tile.click().catch(() => {}); } else await p.evaluate(() => window.__T.run('SPACE.screen()'));
    await p.waitForTimeout(900); await p.screenshot({ path: D + `space-${lang}-${DEV}-open.png` });
    ok(await p.$('#spSvg') !== null, 'game opened: ' + await p.$eval('.bar h1', e => e.textContent).catch(() => '-'));
    const tap = async (x, y) => { if (DEV === 'phone') await p.touchscreen.tap(x, y); else await p.mouse.click(x, y); };
    const cyr = s => lang !== 'ru' && /[А-яЁё]/.test(s);
    // the place of a planet on the picture: the middle of its drawing
    const pt = k => p.evaluate(k => { const s = document.querySelector(`#spSvg .sp-o[data-o="${k}"] .sp-b`), r = s.getBoundingClientRect(), fr = document.querySelector('#spSvg').getBoundingClientRect();
      const x = Math.max(fr.left + 3, Math.min(r.left + r.width / 2, fr.right - 3)), y = Math.max(fr.top + 3, Math.min(r.top + r.height / 2, fr.bottom - 3)), e = document.elementFromPoint(x, y), g = e && e.closest('.sp-o'); return { x, y, hit: g ? g.dataset.o : null }; }, k);
    for (const k of PL) {
      const q = await pt(k);
      ok(q.hit === k, `${k}: tappable on the picture (${q.hit})`);
      await tap(q.x, q.y); await p.waitForTimeout(350);
      const st = await p.evaluate(() => ({ on: document.querySelector('#spSvg').dataset.on, h: document.querySelector('#spCard h2').textContent, t: document.querySelector('#spCard p').textContent, said: window.__said.slice(-1)[0] || '' }));
      ok(st.on === k && st.t.length > 80 && st.said.length > 6 && st.t.startsWith(st.said.replace(/́/g, '').slice(0, 6)) && !cyr(st.t + st.said + st.h), `${k}: «${st.h}» — ${st.said.slice(0, 70)}…`);
      if (k === 'saturn') await p.screenshot({ path: D + `space-${lang}-${DEV}-saturn.png` });
    }
    await p.waitForSelector('.winbox', { timeout: 15000 }).catch(() => {});
    ok(await p.$('.winbox') !== null, 'all nine seen → stars: ' + await p.$eval('.win-line', e => e.textContent).catch(() => '-'));
    // day and night
    await p.evaluate(() => window.__T.run("SPACE.screen('day')")); await p.waitForTimeout(800);
    const d0 = await p.$eval('#spCard h2', e => e.textContent).catch(() => '-'), s0 = await p.$eval('#spMain', e => e.dataset.state);
    const dh = await p.evaluate(() => { const r = document.querySelector('#spDayHit').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
    await tap(dh.x, dh.y); await p.waitForTimeout(1300);
    const d1 = await p.$eval('#spCard h2', e => e.textContent), s1 = await p.$eval('#spMain', e => e.dataset.state), said = await p.evaluate(() => window.__said.slice(-1)[0] || '');
    ok(s0 && s1 && s0 !== s1 && d0 !== d1 && !cyr(d0 + d1 + said), `day/night: «${d0}» → tap the Earth → «${d1}» (${said.slice(0, 50)})`);
    await p.screenshot({ path: D + `space-${lang}-${DEV}-day.png` });
    // the Moon
    await p.evaluate(() => window.__T.run("SPACE.screen('moon')")); await p.waitForTimeout(700);
    const names = [];
    for (let i = 0; i < 8; i++) { await p.click('#spNext'); await p.waitForTimeout(150); names.push(await p.$eval('#spCard h2', e => e.textContent)); if (i === 3) await p.screenshot({ path: D + `space-${lang}-${DEV}-moon.png` }); }
    const lit = await p.$eval('#spBig', e => e.innerHTML.length);
    ok(new Set(names).size === 8 && !cyr(names.join('')) && lit > 0, 'moon: 8 phases — ' + names.join(', '));
    await p.waitForSelector('.winbox', { timeout: 6000 }).catch(() => {});
    ok(await p.$('.winbox') !== null, 'moon: full circle → ' + await p.$eval('.win-line', e => e.textContent).catch(() => '-'));
    // in order: one wrong tap (hint after two), then the right order
    await p.evaluate(() => window.__T.run("SPACE.screen('order')")); await p.waitForTimeout(700);
    await p.click('.sp-pb[data-o="neptune"]'); await p.waitForTimeout(2000); await p.click('.sp-pb[data-o="neptune"]'); await p.waitForTimeout(400);
    ok(await p.$('.sp-pb.hint[data-o="mercury"]') !== null, 'order: two misses → Mercury blinks: ' + (await p.evaluate(() => window.__said.slice(-1)[0] || '')).slice(0, 80));
    await p.screenshot({ path: D + `space-${lang}-${DEV}-order.png` });
    await p.waitForTimeout(2600); for (const k of PL.slice(1)) { await p.click(`.sp-pb[data-o="${k}"]`); await p.waitForTimeout(250); }
    await p.waitForSelector('.winbox', { timeout: 8000 }).catch(() => {});
    ok(await p.$('.winbox') !== null, 'order: all eight → ' + await p.$eval('.win-line', e => e.textContent).catch(() => '-'));
    // the biggest: answer six rounds (the right one by the real sizes)
    await p.evaluate(() => window.__T.run("SPACE.screen('big')")); await p.waitForTimeout(700);
    const KM = await p.evaluate(() => window.__T.run('Object.fromEntries(SPACE.O.map(o => [o.k, o.km]))'));
    let rounds = 0;
    for (let r = 0; r < 6; r++) {
      const q = await p.$eval('#spCard h2', e => e.textContent), ks = await p.$$eval('#spThree .sp-pb', bs => bs.map(b => b.dataset.o));
      const small = r % 2 === 1, best = ks.reduce((m, k) => (small ? KM[k] < KM[m] : KM[k] > KM[m]) ? k : m);
      await p.click(`#spThree .sp-pb[data-o="${best}"]`); await p.waitForTimeout(300);
      if (r === 0) await p.screenshot({ path: D + `space-${lang}-${DEV}-big.png` });
      const line = await p.$eval('#spCard p', e => e.textContent);
      if (r < 2) ok(!cyr(q + line), `big ${r + 1}: «${q}» ${ks.join(',')} → ${best}: ${line}`);
      rounds++; await p.waitForTimeout(1300);
    }
    await p.waitForSelector('.winbox', { timeout: 8000 }).catch(() => {});
    ok(rounds === 6 && await p.$('.winbox') !== null, 'big: 6 rounds → ' + await p.$eval('.win-line', e => e.textContent).catch(() => '-'));
    // the stories: Russian only, opened from the game
    await p.evaluate(() => window.__T.run("SPACE.screen('learn')")); await p.waitForTimeout(500);
    const sb = await p.$('#spStories');
    if (lang === 'ru') {
      ok(!!sb, 'stories button (ru)');
      if (sb) { await sb.click(); await p.waitForTimeout(700); const n = await p.$$eval('.story-c', x => x.length); ok(n === 30, 'stories: ' + n); await p.screenshot({ path: D + `space-${lang}-${DEV}-stories.png` });
        if (n) { await p.click('.story-c'); await p.waitForTimeout(1500); const t = await p.$eval('.story h2', e => e.textContent).catch(() => '-'); ok(t.length > 3, 'a story opens: ' + t); } }
    } else ok(!sb, 'no stories button (Russian-only content)');
    ok(!errs.length, 'page errors: ' + JSON.stringify(errs));
    await c.close();
  }
  await b.close();
  console.log(bad ? `FAILED ${bad}` : 'ALL OK'); process.exit(bad ? 1 : 0);
})();
