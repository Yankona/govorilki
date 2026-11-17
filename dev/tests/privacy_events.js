// v164 phase 2: the journal, the parents' consent, the anonymous day counters, «Ваши данные», «Удалить всё».
// For ru/en/pt/de on a phone or a laptop, an invented family (Тина 5, Тим 9):
//  1) playing writes the journal on the phone (open, a section, a game, a step of «Сегодня»);
//  2) without the parents' tick nothing goes to /v1/stats, even when sending is asked for;
//  3) the tick in «Для взрослых» → «Ваши данные» turns it on; the finished days go out as counters only:
//     no profile ids, no names, no times; today is never sent;
//  4) inside an iframe (the claude.ai copy: EMBEDDED) nothing is sent even with the tick;
//  5) «Удалить всё» → «Стереть этот телефон» (twice) leaves no govorilki data in the browser.
// node tests/privacy_events.js [base] [phone|laptop] [langs=ru,en,pt,de]
const { chromium, devices } = require('playwright');
const path = require('path');
const BASE = process.argv[2] || 'http://localhost:8781/govorilki/', DEV = process.argv[3] || 'phone';
const ONLY = (process.argv[4] || 'ru,en,pt,de').split(',');
const HOOK = 'const fam = () => ROOT.families[ROOT.curFam] || null;';
const LANGS = { ru: 'ru/', en: '', pt: 'pt/', de: 'de/' };
const kid = (name, g, age, fr, lang) => ({ stars: 5, plays: {}, learn: {}, book: { title: 'Т', log: {} }, settings: { name, gender: g, track: 'r', age, friend: fr, onboarded: true, lang } });
const seedOf = (lang, extra) => ({ engine: 'device', micOff: true, srOff: true, parentPhone: true, cur: 'k1', curFam: 'f1',
  families: { f1: { id: 'f1', name: 'Т', cc: 'PT', kids: ['k1', 'k2'], grands: [] } },
  profiles: { k1: kid('Тина', 'f', 5, 'kitty', lang), k2: kid('Тим', 'm', 9, 'tiger', lang) }, ...(extra || {}) });

(async () => {
  const b = await chromium.launch(); let fails = 0;
  for (const [lang, sub] of Object.entries(LANGS)) {
    if (!ONLY.includes(lang)) continue;
    const out = [], stats = [], cloud = [];
    const ctx = async (seed, frame, journal) => {
      const c = await b.newContext(DEV === 'laptop' ? { viewport: { width: 1280, height: 800 } } : { ...devices['iPhone 13'], deviceScaleFactor: 1 });
      c.on('request', r => { if (/workers\.dev/.test(r.url())) cloud.push(r.url()); });
      await c.route(/ntfy|wikipedia|huggingface|jsdelivr|youtube|wikimedia|lichess|fonts\.g/, r => r.abort());
      await c.route(/workers\.dev/, async r => {
        const u = new URL(r.request().url());
        if (u.pathname === '/v1/stats' && r.request().method() === 'POST') { stats.push(r.request().postData() || ''); return r.fulfill({ status: 200, headers: { 'Access-Control-Allow-Origin': '*' }, body: '{"ok":true}' }); }
        return r.fulfill({ status: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }, body: '{"ok":true,"msgs":[]}' });
      });
      await c.route(u => /\/(ru|de|pt|en)?\/?(index\.html)?$/.test(u.pathname), async r => { const x = await r.fetch(); let t = await x.text(); t = t.replace(HOOK, HOOK + ' window.__T = { run: s => eval(s) };'); r.fulfill({ response: x, body: t }); });
      await c.route(/\/frame-test\.html$/, r => r.fulfill({ status: 200, contentType: 'text/html', body: `<iframe src="${BASE + sub}" style="width:400px;height:700px"></iframe>` }));
      await c.addInitScript(s => { try { speechSynthesis.speak = u => setTimeout(() => u.onend && u.onend(), 5); } catch (e) {}
        if (localStorage.getItem('seeded')) return; localStorage.setItem('seeded', 1); if (s[0]) localStorage.setItem('govorilki-v2', JSON.stringify(s[0])); if (s[1]) localStorage.setItem('govorilki-ev', JSON.stringify(s[1])); }, [seed, journal || null]);
      const p = await c.newPage(), errs = [];
      p.on('pageerror', e => errs.push(e.message.slice(0, 160)));
      await p.goto(frame ? new URL('/frame-test.html', BASE).href : BASE + sub); await p.waitForTimeout(1800);
      const f = frame ? p.frames().find(x => x !== p.mainFrame()) : p;
      return { c, p, f, errs, ev: s => f.evaluate(s => window.__T.run(s), s) };
    };
    // 1) the journal
    const A = await ctx(seedOf(lang));
    const who = await A.p.$$('.who-kid'); if (who.length) { await who[0].click(); await A.p.waitForTimeout(800); }
    const steps = await A.p.$$('.pd-n'); if (steps.length) { await steps[0].click(); await A.p.waitForTimeout(1500); }
    await A.ev("finish({ key: 'breath', stars: 3 })").catch(e => out.push('finish: ' + e.message)); await A.p.waitForTimeout(500);
    await A.ev('goHome()'); await A.p.waitForTimeout(600);
    const kinds = await A.ev("[...new Set(EVT.all().map(e => e[1]))].join(',')");
    for (const k of ['open', 'scr', 'ge']) if (!kinds.split(',').includes(k)) out.push(`journal has no ${k} (${kinds})`);
    const saved = await A.p.evaluate(() => (localStorage.getItem('govorilki-ev') || '').length);
    // 2) no tick: nothing goes out (yesterday's entries are there)
    if (A.errs.length) out.push('page errors: ' + A.errs.join(' | '));
    await A.c.close();
    // a phone with yesterday in its journal
    const y = Math.floor((Date.now() - 864e5) / 6e4);
    const B = await ctx(seedOf(lang), false, [[y, 'open', 'k1'], [y, 'scr', 'k1', 'travel', 0, 600], [y, 'ge', 'k1', 'breath', 3, 120], [y, 'close', 'k1', '', 0, 900]]);
    Object.assign(A, B);   // the rest runs on this phone
    await A.ev('EVT.send()'); await A.p.waitForTimeout(600);
    if (stats.length) out.push('sent without the tick');
    // 3) the tick in «Ваши данные»
    await A.ev('screenParents()'); await A.p.waitForTimeout(800);
    await A.p.click('[data-page="data"]'); await A.p.waitForTimeout(400);
    const box = await A.p.$('label[for="stIn"]'); if (!box) out.push('no consent tick in «Ваши данные»'); else { await box.scrollIntoViewIfNeeded(); await box.click(); }
    await A.p.waitForTimeout(300);
    await A.p.screenshot({ path: path.join(__dirname, 'shots', `privacy-data-${lang}-${DEV}.png`), fullPage: false, clip: undefined }).catch(() => {});
    const sec = await A.p.$('#dataSec'); if (sec) await sec.screenshot({ path: path.join(__dirname, 'shots', `privacy-data-${lang}-${DEV}.png`) });
    const cs = await A.ev('JSON.stringify(ROOT.consent || null)');
    if (!/"stats":1/.test(cs)) out.push('the tick did not set consent: ' + cs);
    // the consent counts from the moment it was given: make it two days old to see yesterday go out
    await A.ev("ROOT.consent.at = Date.now() - 2 * 864e5; ROOT.evNext = dayKey(new Date(Date.now() - 864e5)); save(); EVT.send()"); await A.p.waitForTimeout(800);
    if (stats.length !== 1) out.push('expected one sending, got ' + stats.length);
    else {
      const body = stats[0], j = JSON.parse(body), y = await A.ev('dayKey(new Date(Date.now() - 864e5))'), td = await A.ev('dayKey()');
      if (/k1|k2|Тина|Тим/.test(body)) out.push('the counters carry a child: ' + body.slice(0, 120));
      if (!j.days.some(d => d.d === y && d.c.open >= 1 && d.c.kids === 1 && d.c['g:breath:e'] === 1)) out.push('yesterday missing or wrong: ' + body.slice(0, 200));
      if (j.days.some(d => d.d === td)) out.push('today was sent');
      if (Object.keys(j).sort().join() !== 'days,dev,lang,v,ver') out.push('extra fields: ' + Object.keys(j));
    }
    await A.ev('EVT.send()'); await A.p.waitForTimeout(500);
    if (stats.length > 1) out.push('sent twice the same day');
    // 5) «Удалить всё»
    await A.ev('screenParents()'); await A.p.waitForTimeout(600);
    if (await A.p.isVisible('[data-page="data"]')) { await A.p.click('[data-page="data"]'); await A.p.waitForTimeout(400); }
    await A.p.click('#dataDel'); await A.p.waitForTimeout(500);
    await A.p.click('#wipeGo'); await A.p.waitForTimeout(200); await A.p.click('#wipeGo');
    await A.p.waitForTimeout(2000);
    const left = await A.p.evaluate(() => Object.keys(localStorage).filter(k => k.startsWith('govorilki') && k !== 'govorilki-v2' || k === 'govorilki-v2' && /Тина/.test(localStorage.getItem(k))));
    if (left.length) out.push('left after «Удалить всё»: ' + left.join(','));
    if (A.errs.length) out.push('page errors: ' + A.errs.join(' | '));
    await A.c.close();
    // 4) EMBEDDED: in an iframe, with the tick and old days, nothing at all goes to our server
    const n0 = stats.length, c0 = cloud.length;
    const E = await ctx(seedOf(lang, { consent: { stats: 1, at: Date.now() - 3 * 864e5, v: 1 }, evNext: '2000-01-01' }), true);
    const emb = await E.ev('EMBEDDED').catch(() => 'no frame');
    if (emb !== true) out.push('the iframe is not EMBEDDED: ' + emb);
    await E.ev('EVT.log("open"); EVT.send()').catch(() => {}); await E.p.waitForTimeout(800);
    if (stats.length > n0 || cloud.length > c0) out.push('EMBEDDED sent: ' + cloud.slice(c0).join(' , '));
    if (E.errs.length) out.push('page errors (iframe): ' + E.errs.join(' | '));
    await E.c.close();
    console.log(`${lang} ${DEV}: journal ${saved} chars, kinds ${kinds} | ${out.length ? 'FAIL ' + out.join(' ; ') : 'ok'}`);
    if (out.length) fails++;
  }
  await b.close(); console.log(fails ? `FAIL in ${fails} language(s)` : 'OK'); process.exit(fails ? 1 : 0);
})();
