// «Тёмная» (task/look-dark): the dark look for any child. Opens the home tabs, «Сегодня», every game of GAMES,
// the story sections, the parent panel pages, and checks the contrast of every visible piece of text against the
// background it really sits on (WCAG: 4.5:1, large text 3:1). Text over pictures or gradients is skipped.
// Also: «Миссия Л» (track l) keeps its night-castle look; no page errors.
// node tests/look_dark.js [base] [look=dark] [lang=ru] [phone|laptop] [crawl=all|quick]
// Prints the failing texts (screen · text · ratio); shots in tests/shots/dark-<lang>-<device>-<screen>.png.
const { chromium, devices } = require('playwright');
const path = require('path');
const BASE = process.argv[2] || 'http://localhost:8781/govorilki/', LOOK = process.argv[3] || 'dark', LANG = process.argv[4] || 'ru';
const DEV = process.argv[5] || 'phone', CRAWL = process.argv[6] || 'all';
const SUB = { ru: 'ru/', en: '', pt: 'pt/', de: 'de/' };
const SHOTS = path.join(__dirname, 'shots');
const HOOK = 'const fam = () => ROOT.families[ROOT.curFam] || null;';
const kid = (name, g, age, track, fr) => ({ stars: 37, plays: {}, learn: {}, book: { title: 'Т', log: {} }, recent: [], settings: { name, gender: g, track, age, friend: fr, onboarded: true, lang: LANG, look: LOOK, allGames: true } });
const wait = ms => new Promise(r => setTimeout(r, ms));
// in the page: every text element whose contrast is too low
const AUDIT = () => {
  const parse = c => { const m = /rgba?\(([^)]+)\)/.exec(c || ''); if (!m) return null; const a = m[1].split(/[,\s/]+/).filter(Boolean).map(parseFloat); return { r: a[0], g: a[1], b: a[2], a: a.length > 3 ? a[3] : 1 }; };
  const lum = ({ r, g, b }) => { const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }; return .2126 * f(r) + .7152 * f(g) + .0722 * f(b); };
  const mix = (top, bot) => ({ r: top.r * top.a + bot.r * (1 - top.a), g: top.g * top.a + bot.g * (1 - top.a), b: top.b * top.a + bot.b * (1 - top.a), a: 1 });
  const bgOf = el => {
    const layers = [];
    for (let e = el; e; e = e.parentElement) {
      const cs = getComputedStyle(e);
      if (cs.backgroundImage !== 'none' && !/^radial-gradient\(.*1\.\dpx/.test(cs.backgroundImage) && e !== document.body) return null;
      if (e.tagName === 'IMG' || e.tagName === 'CANVAS' || e.tagName === 'VIDEO') return null;
      const c = parse(cs.backgroundColor); if (c && c.a > 0) { layers.push(c); if (c.a >= 1) break; }
    }
    let base = { r: 255, g: 255, b: 255, a: 1 };
    for (let i = layers.length - 1; i >= 0; i--) base = mix(layers[i], base);
    return base;
  };
  const out = [], seen = new Set();
  for (const el of document.querySelectorAll('body *')) {
    if (el.closest('svg,canvas,.said,[aria-hidden="true"]')) continue;
    const own = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join('').trim();
    if (!own || !/[\p{L}\p{N}]/u.test(own)) continue;
    const r = el.getBoundingClientRect(); if (r.width < 2 || r.height < 2 || r.bottom < 0 || r.top > innerHeight) continue;
    const cs = getComputedStyle(el); if (cs.visibility === 'hidden') continue;
    let op = 1; for (let e = el; e; e = e.parentElement) op *= +getComputedStyle(e).opacity; if (op < .9) continue;
    if (cs.webkitTextFillColor && /rgba?\(0, 0, 0, 0\)/.test(cs.webkitTextFillColor)) continue;
    const fg = parse(cs.color), bg = bgOf(el); if (!fg || !bg) continue;
    const f = fg.a < 1 ? mix(fg, bg) : fg, L1 = lum(f), L2 = lum(bg), ratio = (Math.max(L1, L2) + .05) / (Math.min(L1, L2) + .05);
    const size = parseFloat(cs.fontSize), large = size >= 24 || (size >= 18.6 && +cs.fontWeight >= 700);
    // play pieces whose colours are the content and the same in every look: xylophone bars, paint swatches,
    // book covers, the faint letter to trace
    if (el.closest('.xbar, .swl, .book, .guide-l')) continue;
    if (ratio < (large ? 3 : 4.5)) { const k = own.slice(0, 40); if (seen.has(k)) continue; seen.add(k); out.push(`«${k}» ${ratio.toFixed(2)} (${el.tagName.toLowerCase()}.${String(el.className).split(" ")[0]} in ${el.parentElement ? el.parentElement.className : ""})`); }
  }
  return out;
};
(async () => {
  const b = await chromium.launch();
  const seed = { engine: 'device', micOff: true, srOff: true, parentPhone: true, cur: 'k2', curFam: 'f1',
    families: { f1: { id: 'f1', name: 'Т', cc: 'PT', kids: ['k1', 'k2', 'k3'], grands: [] } },
    profiles: { k1: kid('Тина', 'f', 5, 'r', 'kitty'), k2: kid('Тоша', 'm', 9, 'r', 'tiger'), k3: kid('Тим', 'm', 10, 'l', 'tiger') } };
  const c = await b.newContext(DEV === 'laptop' ? { viewport: { width: 1280, height: 800 } } : { ...devices['iPhone 13'], deviceScaleFactor: 1 });
  await c.route(/ntfy|wikipedia|huggingface|jsdelivr|youtube|wikimedia|workers\.dev/, r => r.abort());
  await c.route(u => /\/(ru|de|pt|en)?\/?(index\.html)?$/.test(u.pathname), async r => { const x = await r.fetch(); let t = await x.text(); t = t.replace(HOOK, HOOK + ' window.__T = { run: s => eval(s) };'); r.fulfill({ response: x, body: t }); });
  await c.addInitScript(s => { try { speechSynthesis.speak = u => setTimeout(() => u.onend && u.onend(), 5); } catch (e) {} if (localStorage.getItem('seeded')) return; localStorage.setItem('seeded', 1); localStorage.setItem('govorilki-v2', JSON.stringify(s)); }, seed);
  const p = await c.newPage(), errs = [], bad = [], miss = [];
  p.on('pageerror', e => errs.push(e.message));
  const run = s => p.evaluate(x => window.__T.run(x), s);
  const check = async (name, shot) => { await wait(800); if (shot) await p.screenshot({ path: `${SHOTS}/look-${LOOK}-${LANG}-${DEV}-${name}.png` }); const f = await p.evaluate(AUDIT); f.forEach(x => bad.push(`${name}: ${x}`)); };
  await p.goto(BASE + SUB[LANG]); await wait(1500);
  const who = await p.$$('.who-kid'); if (who.length) { await who[1].click(); await wait(900); }
  await run("(ROOT.cur='k2', P=ROOT.profiles['k2'], P.homeTab='today', goHome())");
  const cls = await p.evaluate(() => document.body.className);
  if (LOOK === 'dark' && !/look-dark/.test(cls)) miss.push('no look-dark class: ' + cls);
  await check('today', true);
  for (const t of ['speak', 'learn', 'create', 'discover']) {
    await run(`(P.homeTab='${t}', goHome())`); await check('tab-' + t, true);
    await p.evaluate(() => { const st = document.querySelector('#stage'); if (st) st.scrollTop = 900; }); await check('tab-' + t + '-2');
  }
  await run("(SETUI.reset(), screenParents())"); await check("parents", true);
  for (const pg of ['fam', 'kid', 'voice', 'lang', 'prog', 'how']) {
    await run("(SETUI.reset(), screenParents(), 0)"); await wait(500);
    const bt = await p.$(`[data-page="${pg}"]`); if (bt && await bt.isVisible()) { await bt.click(); await check('parents-' + pg, pg === 'kid'); }
  }
  await run('screenFriends()'); await check('friends', true);
  await run('screenAlbum()').catch(() => {}); await check('album');
  await run('TRAVEL.screen()').catch(() => {}); await check('travel', true);
  // every game the 9-year-old can open
  if (CRAWL === 'all') {
    const ids = await p.evaluate(() => window.__T.run("GAMES.filter(g => !(g.hide && g.hide()) && !g.inside).map(g => g.id)"));
    for (const id of ids) {
      await run("(ROOT.cur='k2', P=ROOT.profiles['k2'], goHome())").catch(() => {}); await wait(250);
      try { await run(`GAMES.find(g => g.id === '${id}').go()`); } catch (e) { miss.push(id + ': ' + e.message.slice(0, 60)); continue; }
      await check('g-' + id, ['count', 'color', 'chess', 'museum', 'draw', 'math-count', 'piano', 'abc'].includes(id));
      await run('hush(); document.querySelectorAll(".overlay").forEach(x => x.remove())').catch(() => {});
    }
    const secs = await p.evaluate(() => window.__T.run('Object.keys(LEARN).slice(0, 40)'));
    for (const k of secs) { await run(`screenLearn('${k}')`).catch(() => {}); await check('learn-' + k, k === 'spb'); }
  }
  // the finish card
  await run("GAMES.find(g=>g.id==='count').go()"); await wait(600);
  await run("finish({ key: 'count', stars: 3, line: 'Все нашли!', again: () => {}, menu: () => goHome() })"); await wait(1500); await check('finish', true);
  // «Миссия Л» keeps its own look
  await run("(ROOT.cur='k3', P=ROOT.profiles['k3'], P.homeTab='today', goHome())"); await wait(600);
  const q = await p.evaluate(() => ({ cls: document.body.className, f: getComputedStyle(document.body).getPropertyValue('--f-display') }));
  if (!/quest/.test(q.cls) || !/Russo/.test(q.f)) miss.push('Миссия Л look changed: ' + JSON.stringify(q));
  await p.screenshot({ path: `${SHOTS}/look-${LOOK}-${LANG}-${DEV}-quest.png` });
  console.log(bad.length ? 'LOW CONTRAST:\n  ' + bad.join('\n  ') : 'contrast ok');
  console.log(`look_dark ${LOOK} ${LANG} ${DEV}: low contrast ${bad.length} | missing ${JSON.stringify(miss)} | errors ${JSON.stringify(errs)}`);
  await b.close(); process.exit(bad.length || errs.length || miss.length ? 1 : 0);
})();
