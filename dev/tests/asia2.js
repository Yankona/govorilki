// Китай и Индия: оба раздела (по 50 историй) есть в путешествии, штамп в паспорте после 3 историй,
// на глобусе «📖» у Китая и Индии (страна и столица) ведёт в новые разделы; 4 языка, телефон.
const { chromium, devices } = require('playwright');
const BASE = process.argv[2] || 'http://localhost:8781/govorilki/', SUB = { ru: 'ru/', en: '', pt: 'pt/', de: 'de/' };
const HOOK = 'const fam = () => ROOT.families[ROOT.curFam] || null;';
const seed = lang => ({ engine: 'device', micOff: true, srOff: true, parentPhone: true, cur: 'k1', curFam: 'f1', families: { f1: { id: 'f1', name: 'Т', cc: 'PT', kids: ['k1'], grands: [] } },
  profiles: { k1: { stars: 5, plays: {}, learn: {}, book: { title: 'Т', log: {} }, settings: { name: 'Тина', gender: 'f', track: 'r', age: 6, friend: 'kitty', onboarded: true, lang } } } });
let bad = 0; const fail = m => { bad++; console.log('  FAIL ' + m); };
(async () => {
  const b = await chromium.launch();
  for (const lang of ['ru', 'en', 'pt', 'de']) {
    const c = await b.newContext({ ...devices['iPhone 13'], deviceScaleFactor: 1 });
    await c.route(/ntfy|wikipedia|huggingface|jsdelivr|youtube|wikimedia|workers\.dev/, r => r.abort());
    await c.route(u => /\/(ru|de|pt|en)?\/?(index\.html)?$/.test(u.pathname), async r => { const x = await r.fetch(); let t = await x.text(); t = t.replace(HOOK, HOOK + ' window.__T = { run: s => eval(s) };'); r.fulfill({ response: x, body: t }); });
    await c.addInitScript(s => { try { speechSynthesis.speak = u => setTimeout(() => u.onend && u.onend(), 5); } catch (e) {} if (localStorage.getItem('seeded')) return; localStorage.setItem('seeded', 1); localStorage.setItem('govorilki-v2', JSON.stringify(s)); }, seed(lang));
    const p = await c.newPage(), errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto(BASE + SUB[lang]); await p.waitForTimeout(1500);
    let who = await p.$$('.who-kid'); if (who.length) { await who[0].tap(); await p.waitForTimeout(800); }
    const R = s => p.evaluate(x => window.__T.run(x), s);
    const info = await R(`['chn','ind'].map(k => [k, LEARN[k].name, LEARN[k].items.length, LEARN[k].place])`);
    // new stories are Russian-only (like Германия, Испания): the other pages keep the sections empty and hidden
    if (lang !== 'ru') { info.forEach(([k, n, cnt]) => { if (cnt) fail(`${lang} ${k}: ${cnt} stories, expected none`); }); console.log(lang, info.map(i => i[1]).join(' | '), '(sections empty, as designed) | errors', JSON.stringify(errs)); if (errs.length) fail(lang + ' page errors'); await c.close(); continue; }
    info.forEach(([k, n, cnt, pl]) => { if (cnt < 45 || cnt > 60) fail(`${lang} ${k}: ${cnt} stories`); if (pl !== (k === 'chn' ? 'CN' : 'IN')) fail(`${lang} ${k}: place ${pl}`); });
    // 3 stories read in each → a stamp
    const ids = await R(`['chn','ind'].map(k => LEARN[k].items.slice(0, 3).map(x => x.id))`);
    await p.evaluate(ids => { const S = JSON.parse(localStorage.getItem('govorilki-v2')); const l = S.profiles.k1.learn; ids.flat().forEach(i => l[i] = 1); localStorage.setItem('govorilki-v2', JSON.stringify(S)); }, ids);
    await p.reload(); await p.waitForTimeout(1500);
    who = await p.$$('.who-kid'); if (who.length) { await who[0].tap(); await p.waitForTimeout(800); }
    await R('TRAVEL.screen()'); await p.waitForTimeout(700);
    const cards = await p.$$eval('.tv-c', x => x.map(e => ({ k: e.dataset.k, got: e.classList.contains('got') })));
    ['chn', 'ind'].forEach(k => { const c = cards.find(x => x.k === k); if (!c) fail(`${lang}: no card ${k}`); else if (!c.got) fail(`${lang}: no stamp for ${k}`); });
    const stamps = await p.$$eval('.tv-s.on', x => x.map(e => e.textContent)); if (!stamps.includes('🇨🇳') || !stamps.includes('🇮🇳')) fail(`${lang}: stamps ${stamps}`);
    // the globe: China, Beijing, India, Delhi → links into the new sections
    await p.$eval('#tvGlobe', e => e.click()); await p.waitForTimeout(800);
    const box = await p.$eval('#glC', e => { const r = e.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width }; });
    const cx = box.x + box.w / 2, cy = box.y + box.w / 2, out = [];
    for (const [lo, la, cc, k, z] of [[103, 33, 'CN', 'chn', ''], [116.40, 39.90, 'CN', 'chn', ', 6'], [78, 22, 'IN', 'ind', ''], [77.21, 28.61, 'IN', 'ind', ', 6']]) {
      await R(`GLOBE_SCREEN.look(${lo}, ${la}${z})`); await p.waitForTimeout(150);
      await p.touchscreen.tap(cx, cy); await p.waitForTimeout(400);
      const s = await R('GLOBE_SCREEN.state()'); const links = await p.$$eval('#glInfo [data-k]', x => x.map(e => e.dataset.k));
      if (!s.sel || s.sel.cc !== cc) fail(`${lang}: tap ${lo},${la} → ${JSON.stringify(s.sel)}`);
      if (!links.includes(k)) fail(`${lang}: ${cc} links ${links} lack ${k}`);
      out.push(cc + ':' + links.join('/'));
    }
    const lk = await p.$('#glInfo [data-k="ind"]');
    if (lk) { await lk.tap(); await p.waitForTimeout(900); const n = await p.$$eval('.story-c', x => x.length); out.push('open ind: ' + n); if (n < 45) fail(`${lang}: the globe link opened ${n} stories`); }
    console.log(lang, info.map(i => i[1] + ' ' + i[2]).join(' | '), '| globe', out.join(' '), '| errors', JSON.stringify(errs));
    if (errs.length) fail(lang + ' page errors');
    if (lang === 'ru') await p.screenshot({ path: require('path').join(__dirname, 'shots', 'asia2-ru-ind.png') });
    await c.close();
  }
  await b.close(); console.log(bad ? 'FAILED ' + bad : 'OK: asia2'); process.exit(bad ? 1 : 0);
})();
