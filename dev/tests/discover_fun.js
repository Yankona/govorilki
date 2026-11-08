// fun-discover: «А знаешь ли ты?» on the tab, the lists and the hubs; the story list's progress and next story; a new passport
// stamp after the 3rd story of a place; the reward shows the next story and «Слушать дальше» opens it; the passport stamp opens
// its place; the line of time in «Что было раньше?»; «Океан и вода» as tiles like «Растения».
// node tests/discover_fun.js [lang|all] [phone|laptop]
const { chromium, devices } = require('playwright');
const D = require('path').join(__dirname, 'shots') + '/';
const LANGS = !process.argv[2] || process.argv[2] === 'all' ? ['ru', 'en', 'pt', 'de'] : [process.argv[2]], DEV = process.argv[3] || 'phone';
const HOOK = 'const fam = () => ROOT.families[ROOT.curFam] || null;';
const kid = (name, tag) => ({ stars: 5, plays: {}, learn: {}, book: { title: 'Т', log: {} }, settings: { name, gender: 'f', track: 'r', age: 6, friend: 'kitty', onboarded: true, lang: tag } });
let bad = 0; const ok = (c, m) => { console.log((c ? '  ok ' : '  FAIL ') + m); if (!c) bad++; };
(async () => {
  const b = await chromium.launch();
  for (const TAG of LANGS) {
    console.log(TAG, DEV);
    const fam = { engine: 'device', micOff: true, srOff: true, parentPhone: true, cur: 'k1', curFam: 'main', families: { main: { id: 'main', name: 'Т', cc: 'PT', kids: ['k1'], grands: [] } }, profiles: { k1: kid('Тина', TAG) } };
    const c = await b.newContext(DEV === 'laptop' ? { viewport: { width: 1280, height: 800 } } : { ...devices['iPhone 13'], deviceScaleFactor: 1 });
    await c.route(/ntfy|wikipedia|huggingface|jsdelivr|youtube|wikimedia|workers\.dev/, r => r.abort());
    await c.route(u => /\/(ru|de|pt|en)?\/?(index\.html)?$/.test(u.pathname), async r => { const x = await r.fetch(); let t = await x.text(); t = t.replace(HOOK, HOOK + ' window.__T = { get P() { return P; }, run: s => eval(s) };'); r.fulfill({ response: x, body: t }); });
    await c.addInitScript(s => { window.__said = []; try { speechSynthesis.speak = u => { window.__said.push(u.text); setTimeout(() => u.onend && u.onend(), 5); }; } catch (e) {} if (localStorage.getItem('seeded')) return; localStorage.setItem('seeded', 1); localStorage.setItem('govorilki-v2', JSON.stringify(s)); }, fam);
    const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
    const run = s => p.evaluate(x => window.__T.run(x), s), shot = n => p.screenshot({ path: D + `disc-${TAG}-${DEV}-${n}.png` });
    const cyr = s => /[А-Яа-яЁё]/.test(s);
    await p.goto(`http://localhost:8781/govorilki/${TAG}/`); await p.waitForTimeout(1500);
    const who = await p.$$('.who-kid'); if (who.length) { await who[0].click(); await p.waitForTimeout(900); }
    // the tab: a hook card that opens its story
    await run("P.homeTab = 'discover'; goHome()"); await p.waitForTimeout(700);
    const hk = await p.$('.home-t .lr-hook');
    ok(!!hk, 'tab has «А знаешь ли ты?»'); await shot('tab');
    if (hk) { const tx = await hk.innerText(); ok(TAG === 'ru' || !cyr(tx.split('\n')[0]), 'hook label translated: ' + tx.replace(/\s+/g, ' ').slice(0, 80));
      await hk.click(); await p.waitForTimeout(700); ok(!!await p.$('.story'), 'hook opens a story'); }
    // a place with 2 stories read: list progress and the next-story badge
    const k = await run("(() => { const k = PLACES().filter(placeOn)[0]; const it = learnItems(k); P.learn = { [it[0].id]: 1, [it[1].id]: 1 }; save(); screenLearn(k); return k; })()");
    await p.waitForTimeout(600);
    ok(/2\D+\d+/.test(await p.$eval('.lr-prog b', e => e.textContent)), 'list progress: ' + await p.$eval('.lr-prog b', e => e.textContent));
    ok(await p.$eval('.story-c.nx', e => e.dataset.i) === '2', 'the 3rd story is marked as next');
    ok(!!await p.$('.lr-hook'), 'list has a hook'); await shot('list');
    // the 3rd story → right answer → the stamp → the reward with the next story
    await p.click('.story-c.nx'); await p.waitForTimeout(500);
    await run('hush()'); await p.waitForSelector('#stQ:not([hidden]) .ans', { timeout: 30000 }).catch(() => {});
    await p.click('.ans[data-ok="1"]'); await p.waitForTimeout(1300);
    ok(!!await p.$('.tv-stamp'), 'new stamp shown'); await shot('stamp');
    ok(await run(`TRAVEL.stamped('${k}')`) && await run('P.tvNew') === k, 'place stamped and marked new');
    await p.click('#tvStOk'); await p.waitForTimeout(900);
    const nx = await p.$('.winbox .st-next');
    ok(!!nx, 'reward shows the next story'); await shot('reward');
    const nb = await p.$eval('.winbox .win-main [data-a="next"]', e => e.textContent).catch(() => '');
    ok(nb && (TAG === 'ru' || !cyr(nb)), 'next button: ' + nb);
    const want = await p.$eval('.st-nx b', e => e.textContent);
    await p.click('.winbox .win-main [data-a="next"]'); await p.waitForTimeout(700);
    ok(await p.$eval('.story h2', e => e.textContent).catch(() => '') === want, 'next story opened: ' + want);
    // the passport: the new stamp glows once, a stamp opens its place
    await run('TRAVEL.screen()'); await p.waitForTimeout(600);
    ok(!!await p.$(`.tv-s.on.new[data-k="${k}"]`), 'passport: the new stamp'); await shot('passport');
    ok(await run('P.tvNew') === undefined, 'new mark cleared');
    await p.click(`.tv-s[data-k="${k}"]`); await p.waitForTimeout(600);
    ok(!!await p.$('.lr-prog'), 'stamp opens its place');
    // a line of time in «Что было раньше?» (Russian only: the old times are Russian)
    if (await run("!!LEARN.old && !!LEARN.old.items.length")) {
      await run('screenTimeline()'); await p.waitForTimeout(500); await p.click('.tv-o'); await p.waitForTimeout(600);
      ok(await p.$$eval('.tl-line span', x => x.length) === 2, 'line of time with 2 events'); await shot('timeline');
    }
    // water: tiles like the plants, the hook only with stories
    await run('OCEAN.hub()'); await p.waitForTimeout(500);
    const tiles = await p.$$eval('.pl-hub .oc-t', x => x.map(e => e.dataset.k));
    ok(tiles.length === (TAG === 'ru' ? 3 : 2), 'water tiles: ' + tiles); await shot('water');
    ok(!cyr(await p.$eval('.stage', e => e.textContent)) || TAG === 'ru', 'water hub translated');
    await run('PLANTS.hub()'); await p.waitForTimeout(500); ok(!!await p.$('.pl-hub'), 'plants hub');
    ok(!errs.length, 'no page errors ' + JSON.stringify(errs));
    await c.close();
  }
  await b.close();
  console.log(bad ? `FAILED: ${bad}` : 'OK: all');
  process.exit(bad ? 1 : 0);
})();
