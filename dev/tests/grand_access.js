// v146: a grandparent can open everything the child has. Every grandparent mode, every tab, every tile:
// A) «👵 Бабушка или дедушка хочет поиграть» on the child's phone (GPLAY, «не в зачёт»);
// B) the grandparent's own phone from the family link #vhod=… → «Открыть игру внуков» (the grandchild; «Все игры сразу»);
// C) the who-plays screen of the child's phone → the grandmother's own screen → her grandchild's games;
// D) the parent's preview of the grandmother's screen → «Открыть игру внуков».
// Fails on a tile that does not open, a tile the child has and the grandparent does not, or any page error.
// Invented family only: бабушка Тома, Тина. node tests/grand_access.js [base] [phone|laptop] [langs=ru,en,pt,de]
const { chromium, devices } = require('playwright');
const BASE = process.argv[2] || 'http://localhost:8781/govorilki/', DEV = process.argv[3] || 'phone';
const ONLY = (process.argv[4] || 'ru,en,pt,de').split(',');
const HOOK = 'const fam = () => ROOT.families[ROOT.curFam] || null;';
const LANGS = { ru: 'ru/', en: '', pt: 'pt/', de: 'de/' };
const FAMCODE = 'tinafam0123456';
const kid = (name, g, age, fr, lang) => ({ stars: 5, plays: {}, learn: {}, book: { title: 'Т', log: {} }, settings: { name, gender: g, track: 'r', age, friend: fr, onboarded: true, lang } });
const seedOf = lang => ({ engine: 'device', micOff: true, srOff: true, parentPhone: true, cur: 'k1', curFam: 'f1',
  families: { f1: { id: 'f1', name: 'Т', cc: 'PT', code: FAMCODE, kids: ['k1'], grands: [{ id: 'toma', name: 'бабушка Тома', she: true, role: 'gm' }] } },
  profiles: { k1: kid('Тина', 'f', 6, 'kitty', lang) } });
const ev = (p, s) => p.evaluate(s => window.__T.run(s), s);
// all tiles of every home tab as the current profile sees them
const tilesNow = p => ev(p, `(() => { const out = {}, keep = P.homeTab; for (const t of HOME_TABS) { P.homeTab = t.id; HOME_POS = null; goHome();
  out[t.id] = [...new Set([...document.querySelectorAll('#stage .tile, #stage .mini')].map(b => b.dataset.id))]; } P.homeTab = keep; HOME_POS = null; goHome(); return out; })()`);
// open each tile from its tab, inside the page (fast): it must leave the home screen, show something and throw nothing
async function walk(p, mode, errs, bad) {
  const tabs = await tilesNow(p), e0 = errs.length;
  // a game that loops forever freezes the page: report the tile instead of hanging (the last tile logged in window.__AT)
  let tm; const froze = new Promise(r => { tm = setTimeout(() => r('froze'), 90000); });
  const res = await Promise.race([froze, p.evaluate(async ([tabs, dbg]) => { window.__DBG = dbg; const out = [], E = window.__E;
    for (const [tab, ids] of Object.entries(tabs)) for (const id of ids) {
      const n0 = E.length; let why = ''; window.__AT = tab + '/' + id; if (window.__DBG) console.log('GA ' + tab + '/' + id);
      try { window.__T.run(`P.homeTab = ${JSON.stringify(tab)}; HOME_POS = null; goHome()`); const b = document.querySelector(`#stage [data-id="${id}"]`);
        if (!b) why = 'no tile'; else b.click(); } catch (e) { why = 'throws ' + e.message; }
      await new Promise(r => setTimeout(r, 60));
      const home = !!document.querySelector('.screen.home-t'), txt = (document.getElementById('app').innerText || '').trim().length;
      why = why || (E.length > n0 ? 'error ' + E.slice(n0).join(' | ') : home ? 'did not open' : txt < 3 ? 'blank' : '');
      if (why) out.push(`${tab}/${id}: ${why}`);
    }
    try { window.__T.run('HOME_POS = null; goHome()'); } catch (e) {}
    return out; }, [tabs, !!process.env.DBG])]);
  clearTimeout(tm);
  if (res === 'froze') { console.log(`${mode}: the page froze (a game loops forever) — FAIL`); process.exit(1); }
  await p.waitForTimeout(300);
  res.forEach(x => bad.push(`${mode} ${x}`)); if (errs.length > e0) bad.push(`${mode} page errors: ${errs.slice(e0).join(' | ')}`);
  return { tabs, n: Object.values(tabs).flat().length };
}
// chess-mm pairs children who are online right now, anonymously: a grown-up never joins it (CLAUDE.md)
const NOT_FOR_GROWNUPS = ['chess-mm'];
(async () => {
  const b = await chromium.launch(); let fails = 0;
  for (const [lang, sub] of Object.entries(LANGS)) {
    if (!ONLY.includes(lang)) continue;
    const bad = [], info = [];
    const ctx = async (seed, hash) => {
      const c = await b.newContext(DEV === 'laptop' ? { viewport: { width: 1280, height: 800 } } : { ...devices['iPhone 13'], deviceScaleFactor: 1 });
      await c.route(/ntfy|wikipedia|huggingface|jsdelivr|youtube|wikimedia|workers\.dev/, r => r.abort());
      await c.route(u => /\/(ru|de|pt|en)?\/?(index\.html)?$/.test(u.pathname), async r => { const x = await r.fetch(); let t = await x.text(); t = t.replace(HOOK, HOOK + ' window.__T = { run: s => eval(s) };'); r.fulfill({ response: x, body: t }); });
      await c.addInitScript(s => { try { speechSynthesis.speak = u => setTimeout(() => u.onend && u.onend(), 5); } catch (e) {} window.__E = []; addEventListener('error', e => window.__E.push(String(e.message).slice(0, 160))); addEventListener('unhandledrejection', e => window.__E.push('rejection ' + String(e.reason && e.reason.message || e.reason).slice(0, 160))); window.alert = () => {}; window.confirm = () => true; window.prompt = () => null;
        if (localStorage.getItem('seeded')) return; localStorage.setItem('seeded', 1); if (s) localStorage.setItem('govorilki-v2', JSON.stringify(s)); }, seed);
      const p = await c.newPage(), errs = [];
      p.on('pageerror', e => errs.push(e.message.slice(0, 160)));
      if (process.env.DBG) { p.on('console', m => /^GA /.test(m.text()) && console.log(m.text())); }
      await p.goto(BASE + sub + (hash || '')); await p.waitForTimeout(1300);
      return { c, p, errs };
    };
    // the child's own tiles: a grandparent must have every one of them
    let S = await ctx(seedOf(lang));
    const who = await S.p.$$('.who-kid'); if (who.length) { await who[0].click(); await S.p.waitForTimeout(700); }
    const childAll = new Set(Object.values(await tilesNow(S.p)).flat());
    const missing = (mode, t) => { const have = new Set(Object.values(t).flat()), m = [...childAll].filter(x => !have.has(x) && !NOT_FOR_GROWNUPS.includes(x)); if (m.length) bad.push(`${mode}: hidden tiles ${m.join(',')}`); };
    // A) GPLAY on the child's phone
    await S.p.click('#gpBtn'); await S.p.waitForTimeout(400);
    await S.p.click('#gpwL [data-gp="0"]'); await S.p.waitForTimeout(500);
    if (!(await ev(S.p, '!!GPLAY'))) bad.push('A: GPLAY did not start');
    let w = await walk(S.p, 'A', S.errs, bad); missing('A', w.tabs); info.push(`A ${w.n}`);
    if (await ev(S.p, 'ROOT.profiles.k1.stars !== 5')) bad.push('A: the child\'s stars changed');
    // C) who-plays → the grandmother's own screen → her grandchild's games
    await ev(S.p, 'gplayStop(); whoAdult("f1", "toma")'); await S.p.waitForTimeout(400);
    if (!(await S.p.$('#gKids'))) bad.push('C: no grandmother screen');
    else { await S.p.click('#gKids'); await S.p.waitForTimeout(500); w = await walk(S.p, 'C', S.errs, bad); missing('C', w.tabs); info.push(`C ${w.n}`); }
    // D) the parent's preview of the grandmother's screen: a game button offers «Поиграть в тесте» — the grandmother's
    //    phone in the test mode, with the child's settings; her grandchild's games there
    await ev(S.p, 'GUEST = null; GUEST_OFF = false; guestLeave(); useFamily("f1"); ROOT.cur = "k1"; pultView("f1", "toma")'); await S.p.waitForTimeout(400);
    const pg = await S.p.$('[data-gplay]');
    if (!pg) bad.push('D: no games in the preview');
    else {
      await pg.click(); await S.p.waitForTimeout(300);
      await Promise.all([S.p.waitForNavigation({ timeout: 10000 }).catch(() => {}), S.p.click('#pvToDemo').catch(() => bad.push('D: no «Поиграть в тесте»'))]);
      await S.p.waitForTimeout(1300);
      const k = await S.p.$('[data-gplay="k1"]');
      if (!k) bad.push('D: no grandchild games in the test');
      else { await k.click(); await S.p.waitForTimeout(500); w = await walk(S.p, 'D', S.errs, bad); missing('D', w.tabs); info.push(`D ${w.n}`); }
    }
    if (S.errs.length) bad.push('page errors: ' + [...new Set(S.errs)].join(' | '));
    await S.c.close();
    // B) the grandmother's own phone, from the family link
    S = await ctx(null, `#vhod=toma.${FAMCODE}&n=${encodeURIComponent('бабушка Тома')}&s=1&r=gm&k=${encodeURIComponent('k1~Тина~f')}`);
    if (!(await S.p.$('#gKids'))) bad.push('B: no guest screen');
    else {
      await S.p.click('#gKids'); await S.p.waitForTimeout(500);
      w = await walk(S.p, 'B1', S.errs, bad); missing('B1', w.tabs); info.push(`B1 ${w.n}`);
      await ev(S.p, 'GUEST_OFF = false; screenGuest()'); await S.p.waitForTimeout(400);
      const all = await S.p.$('[data-gplay="*"]');
      if (all) { await all.click(); await S.p.waitForTimeout(500); w = await walk(S.p, 'B*', S.errs, bad); missing('B*', w.tabs); info.push(`B* ${w.n}`); }
      else bad.push('B: no «all games» button');
    }
    if (S.errs.length) bad.push('B page errors: ' + [...new Set(S.errs)].join(' | '));
    await S.c.close();
    console.log(`${lang} ${DEV}: child ${childAll.size} tiles; opened ${info.join(' · ')}${bad.length ? '\n  ' + bad.join('\n  ') : ' — ok'}`);
    if (bad.length) fails++;
  }
  await b.close(); console.log(fails ? `FAIL in ${fails} language(s)` : 'OK: grandparents open everything'); process.exit(fails ? 1 : 0);
})();
