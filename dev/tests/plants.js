// plants: «Вырасти дерево», «Части растения» and the stories tile — growing start to finish, parts tappable with voice,
// find mode, stories (Russian only); 4 languages, phone (iPhone 13) and laptop. Usage: node tests/plants.js [base url] [phone|laptop]
const { chromium, devices } = require('playwright');
const D = require('path').join(__dirname, 'shots') + '/';
const BASE = process.argv[2] || 'http://localhost:8781/govorilki/', DEV = process.argv[3] || 'phone';
const HOOK = 'const fam = () => ROOT.families[ROOT.curFam] || null;';
const kid = (name, g, age, fr, lang) => ({ stars: 5, plays: {}, book: { title: 'Т', log: {} }, settings: { name, gender: g, track: 'r', age, friend: fr, onboarded: true, lang } });
const ORG = ['root', 'stem', 'leaf', 'flower', 'fruit'], NEED = ['plant', 'water', 'sun', 'water', 'sun', 'water', 'sun'];
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
    const p = await c.newPage(); const errs = []; p.on('pageerror', e => { errs.push(e.message); console.log('PAGEERR', e.stack.slice(0, 400)); });
    await p.goto(BASE + path); await p.waitForTimeout(1500);
    const who = await p.$$('.who-kid'); if (who.length) { await who[0].click(); await p.waitForTimeout(900); }
    const cyr = s => lang !== 'ru' && /[А-яЁё]/.test(s);
    const discover = async () => { await p.evaluate(() => { const t = document.querySelector('[data-tab="discover"]'); if (t) t.click(); }); await p.waitForTimeout(600); };
    const openTile = async id => { const tile = await p.$(`.tile[data-id="${id}"]`); if (tile) { await tile.scrollIntoViewIfNeeded(); await tile.click(); await p.waitForTimeout(500); } return !!tile; };
    const tap = async (x, y) => { if (DEV === 'phone') await p.touchscreen.tap(x, y); else await p.mouse.click(x, y); };
    await discover();
    // ---- grow
    ok(await openTile('plant-grow'), 'tile «grow» on the discover tab');
    await p.waitForTimeout(600); await p.screenshot({ path: D + `plants-${lang}-${DEV}-grow0.png` });
    ok(await p.$('#plSvg') !== null, 'grow opened: ' + await p.$eval('.bar h1', e => e.textContent).catch(() => '-'));
    if (await p.$('#plSvg')) {
      await p.click('#plBtns [data-a="sun"]'); await p.waitForTimeout(300);
      ok(await p.$('#plBtns .hint') !== null && await p.evaluate(() => document.querySelector('#plSvg').dataset.s) === '0', 'wrong button: hint, nothing grows');
      for (let i = 0; i < 7; i++) {
        await p.click(`#plBtns [data-a="${NEED[i]}"]`); await p.waitForTimeout(NEED[i] === 'plant' ? 1100 : 1900);
        const st = await p.evaluate(() => ({ s: document.querySelector('#plSvg').dataset.s, h: document.querySelector('#plCard h2').textContent, t: document.querySelector('#plCard p').textContent, said: window.__said.slice(-1)[0] || '', on: document.querySelectorAll('#plSvg [data-from].on').length }));
        ok(st.s === String(i + 1) && st.t.length > 40 && st.said.length > 20 && !cyr(st.t + st.said + st.h), `step ${i + 1} (${NEED[i]}): «${st.h}» drawn ${st.on}: ${st.said.slice(0, 60)}…`);
        if ([1, 3, 5].includes(i)) await p.screenshot({ path: D + `plants-${lang}-${DEV}-grow${i + 1}.png` });
      }
      await p.waitForSelector('.winbox', { timeout: 15000 }).catch(() => {});
      await p.screenshot({ path: D + `plants-${lang}-${DEV}-grow7.png` });
      ok(await p.$('.winbox') !== null, 'grown → ' + await p.$eval('.win-line', e => e.textContent).catch(() => '-'));
    }
    // ---- parts
    await p.evaluate(() => window.__T.run('goHome()')); await p.waitForTimeout(500); await discover();
    ok(await openTile('plant-parts'), 'tile «parts»');
    await p.waitForTimeout(600);
    ok(await p.$('#plPSvg') !== null, 'parts opened: ' + await p.$eval('.bar h1', e => e.textContent).catch(() => '-'));
    const pt = k => p.evaluate(k => { const s = document.querySelector(`#plPSvg .bd-o[data-o="${k}"] .bd-s`), r = s.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2, e = document.elementFromPoint(x, y), g = e && e.closest('.bd-o'); return { x, y, hit: g ? g.dataset.o : null }; }, k);
    if (await p.$('#plPSvg')) {
      for (const k of ORG) {
        const q = await pt(k);
        ok(q.hit === k, `${k}: tappable (${q.hit})`);
        await tap(q.x, q.y); await p.waitForTimeout(350);
        const st = await p.evaluate(() => ({ on: document.querySelector('#plPSvg').dataset.on, h: document.querySelector('#plCard h2').textContent, t: document.querySelector('#plCard p').textContent, said: window.__said.slice(-1)[0] || '' }));
        ok(st.on === k && st.t.length > 50 && st.said.length > 6 && !cyr(st.t + st.said), `${k}: «${st.h}» — ${st.said.slice(0, 60)}…`);
        if (k === 'leaf' || k === 'root') await p.screenshot({ path: D + `plants-${lang}-${DEV}-${k}.png` });
      }
      await p.waitForSelector('.winbox', { timeout: 15000 }).catch(() => {});
      ok(await p.$('.winbox') !== null, 'all five seen → ' + await p.$eval('.win-line', e => e.textContent).catch(() => '-'));
      await p.evaluate(() => window.__T.run("PLANTS.parts('find')")); await p.waitForTimeout(700);
      let rounds = 0;
      for (let r = 0; r < 5; r++) {
        const ask = await p.$eval('#plCard h2', e => e.textContent);
        if (r === 0) ok(await p.evaluate(() => window.__said.slice(-1)[0] || '') === (await p.$eval('#plCard h2', e => e.textContent)).replace(/^🎯\s*/, ''), 'find speaks its question: ' + ask);
        // two misses on a wrong part: fruit, or root when the fruit is asked
        const asked = await p.evaluate(() => window.__said.slice(-1)[0] || '');
        const probe = /fruit|плод|fruto|frucht|Obst/i.test(asked) ? 'root' : 'fruit';
        const q0 = await pt(probe); await tap(q0.x, q0.y); await p.waitForTimeout(250); await tap(q0.x, q0.y); await p.waitForTimeout(300);
        const hint = await p.$eval('#plPSvg .bd-o.hint', e => e.dataset.o).catch(() => null), line = await p.$eval('#plCard p', e => e.textContent);
        if (r === 0) { ok(!!hint && hint === 'leaf', `find: «${ask}» → two misses → «${line}» and ${hint} blinks (leaf first)`); await p.screenshot({ path: D + `plants-${lang}-${DEV}-find.png` }); }
        if (!hint) break;
        const q = await pt(hint); await tap(q.x, q.y); await p.waitForTimeout(800); rounds++;
      }
      await p.waitForTimeout(600);
      ok(rounds === 5 && await p.$('.winbox') !== null, 'find: 5 parts found → ' + await p.$eval('.win-line', e => e.textContent).catch(() => '-'));
    }
    // ---- stories
    await p.evaluate(() => window.__T.run('goHome()')); await p.waitForTimeout(500); await discover();
    const has = await p.$('.tile[data-id="learn-plants"]');
    if (lang === 'ru') {
      ok(!!has, 'stories tile (ru)');
      if (has) {
        await has.scrollIntoViewIfNeeded(); await has.click(); await p.waitForTimeout(600);
        const n = (await p.$$('.story-c')).length; ok(n === 20, 'stories: ' + n); await p.screenshot({ path: D + `plants-${lang}-${DEV}-stories.png` });
        await (await p.$('.story-c')).click(); await p.waitForTimeout(800); ok(await p.$('#stT') !== null, 'a story opens');
      }
    } else ok(!has, 'stories tile hidden (Russian-only)');
    ok(!errs.length, 'page errors: ' + JSON.stringify(errs));
    await c.close();
  }
  await b.close();
  console.log(bad ? `FAILED ${bad}` : 'ALL OK'); process.exit(bad ? 1 : 0);
})();
