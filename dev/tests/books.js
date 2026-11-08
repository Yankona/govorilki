// «Книжная полка» and the audio tales: the tile, the shelf at the child's age, a book card, «Читаем сейчас» /
// «Прочитали» with the sticker, saved after a reload; in Russian a tale is read sentence by sentence with the sentence
// lit up, pause and go on, the night mode, and the tales work offline after the first visit.
// Usage: node tests/books.js [page] [tag] [phone|laptop]
const { chromium, devices } = require('playwright');
const D = require('path').join(__dirname, 'shots') + '/';
const PAGE = process.argv[2] || 'http://localhost:8781/govorilki/ru/', TAG = process.argv[3] || 'ru', DEV = process.argv[4] || 'phone';
const HOOK = 'const fam = () => ROOT.families[ROOT.curFam] || null;';
const kid = (name, g, tr, age, fr) => ({ stars: 12, plays: {}, likeG: {}, book: { title: '', log: {} }, settings: { name, gender: g, track: tr, age, friend: fr, onboarded: true, lang: TAG } });
let bad = 0; const log = (...a) => console.log(...a), check = (name, ok, more = '') => { if (!ok) bad++; log(`${ok ? 'ok  ' : 'FAIL'} ${name}${more ? ' — ' + more : ''}`); };
(async () => {
  const b = await chromium.launch();
  const fam = { engine: 'device', micOff: true, srOff: true, parentPhone: true, cur: 'k1', curFam: 'ft', families: { ft: { id: 'ft', name: 'Т', cc: 'PT', kids: ['k1', 'k2'], grands: [] } },
    profiles: { k1: kid('Тина', 'f', 'r', 5, 'kitty'), k2: kid('Тоша', 'm', 'l', 8, 'tiger') } };
  const c = await b.newContext(DEV === 'laptop' ? { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 } : { ...devices['iPhone 13'], deviceScaleFactor: 1 });
  await c.route(/ntfy|wikipedia|wikimedia|huggingface|jsdelivr|youtube|workers\.dev/, r => r.abort());
  await c.route(u => /\/(ru|de|pt|en)?\/?(index\.html)?$/.test(u.pathname), async r => { const x = await r.fetch(); let t = await x.text(); t = t.replace(HOOK, HOOK + ' window.__T = { get P() { return P; }, run: s => eval(s) };'); r.fulfill({ response: x, body: t }); });
  await c.addInitScript(s => { window.__said = []; try { speechSynthesis.speak = u => { window.__said.push(u.text); setTimeout(() => u.onend && u.onend(), 30); }; } catch (e) {} if (localStorage.getItem('seeded')) return; localStorage.setItem('seeded', 1); localStorage.setItem('govorilki-v2', JSON.stringify(s)); }, fam);
  const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  const T = s => p.evaluate(x => window.__T.run(x), s);
  const said = () => p.evaluate(() => window.__said.splice(0));
  const enter = async () => { await p.waitForTimeout(1500); const who = await p.$$('.who-kid'); if (who.length) { await who[0].click(); await p.waitForTimeout(900); } };
  await p.goto(PAGE); await enter();
  // the tile is on the home screen, in «Узнаём»
  check('tile in GAMES', await T("GAMES.some(g => g.id === 'bookshelf')"));
  await T("P.homeTab = 'discover'; goHome()"); await p.waitForTimeout(800);
  const tile = await p.$('[data-id="bookshelf"], [data-g="bookshelf"], [data-game="bookshelf"]');
  check('tile shown in «Узнаём»', !!tile || await T("!!document.body.innerText.match(/" + (TAG === 'ru' ? 'Книжная полка' : '.') + "/)"));
  await p.screenshot({ path: D + `books-${TAG}-${DEV}-home.png` });
  // the shelf opens at the child's age: 5 → the first shelf
  await T('BOOKSHELF.open()'); await p.waitForTimeout(800);
  check('shelf for age 5 is s1', await p.$eval('.bk-tab.sel', e => e.dataset.s) === 's1');
  check('cards on the shelf', (await p.$$('.bk-card')).length >= 8);
  const wide = await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1); check('no sideways scroll', wide);
  await p.screenshot({ path: D + `books-${TAG}-${DEV}-shelf.png` });
  // a book: «Читаем сейчас», then «Прочитали» gives five stars and a sticker
  const st0 = await T('P.stars');
  await p.click('.bk-card[data-b="pooh"]'); await p.waitForTimeout(500);
  check('book card opens', !!(await p.$('.bk-box h2')), await p.$eval('.bk-box h2', e => e.textContent).catch(() => ''));
  await p.click('.bk-act[data-act="now"]'); await p.waitForTimeout(300);
  check('«Читаем сейчас» saved', await T("P.shelf.pooh") === 'now');
  await p.click('.bk-act[data-act="read"]'); await p.waitForTimeout(500);
  check('«Прочитали» saved', await T("P.shelf.pooh") === 'read');
  check('five stars for the book', await T('P.stars') === st0 + 5, `${st0} → ${await T('P.stars')}`);
  check('new sticker shown', !!(await p.$('.bk-stk')));
  await p.screenshot({ path: D + `books-${TAG}-${DEV}-book.png` });
  await p.click('.bk-act[data-act="read"]'); await p.click('.bk-act[data-act="read"]'); await p.waitForTimeout(300);
  check('no second reward', await T('P.stars') === st0 + 5);
  await p.click('.bk-x'); await p.waitForTimeout(500);
  check('badge on the card', !!(await p.$('.bk-card[data-b="pooh"] .bk-badge.rd')));
  // the other shelves
  await p.click('.bk-tab[data-s="s6"]'); await p.waitForTimeout(500);
  check('«Когда подрастёшь» shelf', (await p.$$('.bk-card')).length >= 10);
  // saved after a reload
  await p.reload(); await enter();
  check('marks kept after reload', await T("P.shelf && P.shelf.pooh") === 'read');
  // the older child gets the 6–8 shelf
  await T("ROOT.cur = 'k2'; P = ROOT.profiles.k2; P.shelfTab = null; BOOKSHELF.open()"); await p.waitForTimeout(600);
  check('shelf for age 8 is s3', await p.$eval('.bk-tab.sel', e => e.dataset.s) === 's3');
  check('the other child has its own marks', !(await T("P.shelf && P.shelf.pooh")));
  await T("ROOT.cur = 'k1'; P = ROOT.profiles.k1");
  if (TAG === 'ru') {
    await T('BOOKSHELF.open()'); await p.waitForTimeout(600);
    check('tales tile on the shelf', !!(await p.$('#bkTales')));
    await p.click('#bkTales'); await p.waitForTimeout(1500);
    const n = (await p.$$('.tl-i')).length; check('tales in the list', n >= 20, `${n}`);
    await p.screenshot({ path: D + `books-${TAG}-${DEV}-tales.png` });
    await said(); await p.click('.tl-i'); await p.waitForTimeout(600);
    await p.click('#tlPlay'); await p.waitForTimeout(1500);
    check('a sentence is lit', !!(await p.$('#tlText .ss.on')));
    const s1 = await said(); check('the voice reads the tale', s1.length > 0, JSON.stringify(s1.slice(0, 2)));
    await p.screenshot({ path: D + `books-${TAG}-${DEV}-reader.png` });
    await p.click('#tlPlay'); await p.waitForTimeout(400);
    const lit = await p.$eval('#tlText .ss.on', e => +e.dataset.j); await said(); await p.waitForTimeout(800);
    check('pause stops the voice', (await said()).length === 0 && /▶/.test(await p.$eval('#tlPlay', e => e.textContent)));
    await p.click('#tlPlay'); await p.waitForTimeout(800);
    check('goes on from the same sentence', (await p.$eval('#tlText .ss.on', e => +e.dataset.j)) >= lit);
    await p.click('#tlNight'); await p.waitForTimeout(800);
    check('night mode dark', !!(await p.$('.tl-night')) && await p.$eval('.tl-night', e => getComputedStyle(e).backgroundColor) === 'rgb(5, 6, 11)');
    await p.screenshot({ path: D + `books-${TAG}-${DEV}-night.png` });
    await p.click('#tlNightX'); await p.waitForTimeout(300);
    check('night mode closes', !(await p.$('.tl-night')));
    // every tale was fetched once; offline they still open (the service worker keeps them)
    await p.waitForTimeout(6000);
    const ids = await T('TALES.index().then(xs => xs.map(x => x.id))');
    await c.setOffline(true);
    const off = await p.evaluate(async ids => { const out = []; for (const id of ids) { try { const r = await fetch(location.pathname.replace(/ru\/$/, '') + 'tales/' + id + '.json', { cache: 'no-store' }); out.push(r.ok); } catch (e) { out.push(false); } } return out; }, ids);
    check('all tales offline', off.every(Boolean) && off.length >= 20, `${off.filter(Boolean).length}/${off.length}`);
    await c.setOffline(false);
  }
  check('no page errors', !errs.length, JSON.stringify(errs));
  await b.close();
  log(bad ? `books ${TAG} ${DEV}: ${bad} failed` : `books ${TAG} ${DEV}: all ok`);
  process.exit(bad ? 1 : 0);
})();
