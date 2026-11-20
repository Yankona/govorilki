// A new family on the pt and de pages (pt-de-polish), as a Portuguese family that also learns German would start:
// the one-tap start (no name yet) for Тина 6 and Тоша 8, on a phone and a laptop. Checks:
//  1) «Узнаём» (stories, journeys, news, science, holidays) is one tap from the top of the home before the path, and
//     its games open while the doors are still shut;
//  2) the child's languages: the page's language first, every name in the page's language, the native name small;
//  3) no gap where the name would go («Que línguas fala ?») in the home and the whole grown-ups' panel;
//  4) «Языки ребёнка» is open when no language was chosen yet;
//  5) the long button of «Свои сказки» wraps instead of being cut;
//  6) «Чей это телефон?» says why it asks.
// Invented children only. Usage: node tests/pt_de_polish.js [base] [phone|laptop|both] [langs=pt,de]
const { chromium, devices } = require('playwright');
const path = require('path');
const BASE = process.argv[2] || 'http://localhost:8781/govorilki/', DEVS = (process.argv[3] || 'both') === 'both' ? ['phone', 'laptop'] : [process.argv[3]];
const LANGS = (process.argv[4] || 'pt,de').split(',');
const HOOK = 'const fam = () => ROOT.families[ROOT.curFam] || null;';
const SHOTS = path.join(__dirname, 'shots');
const RUSSIAN = { pt: 'Russo', de: 'Russisch', en: 'Russian', ru: 'Русский' };
// words that end a phrase only when a name is missing
const GAP = /(\s[?!:,.](\s|$))|\b(de|von|of|for|für|para|для)\s*$|(Neto|Enkel|Grandson|Внук)\b/m;
(async () => {
  const b = await chromium.launch(), fails = [];
  for (const DEV of DEVS) for (const lang of LANGS) for (const [kid, age] of [['Тина', 6], ['Тоша', 8]]) {
    const tag = `${lang}-${DEV}-${age}`;
    const c = await b.newContext(DEV === 'laptop' ? { viewport: { width: 1280, height: 800 } } : { ...devices['iPhone 13'], deviceScaleFactor: 1 });
    await c.route(/huggingface|hf\.co|ntfy|wikipedia|jsdelivr|youtube|wikimedia|workers\.dev/, r => r.abort());
    await c.route(u => /\/app\.[0-9a-f]+\.js$/.test(u.pathname), async r => { const x = await r.fetch(); let t = await x.text(); t = t.replace(HOOK, HOOK + ' window.__T = { run: s => eval(s) };'); r.fulfill({ response: x, body: t }); });
    await c.addInitScript(() => { try { speechSynthesis.speak = u => setTimeout(() => u.onend && u.onend(), 5); } catch (e) {} });
    const p = await c.newPage(), errs = [], miss = [];
    p.on('pageerror', e => errs.push(e.message));
    const ok = (cond, m) => { if (!cond) miss.push(m); };
    const run = s => p.evaluate(x => window.__T.run(x), s);
    const inView = sel => p.$eval(sel, e => { const r = e.getBoundingClientRect(); return r.top > -24 && r.top < innerHeight - 40 && r.width > 0; }).catch(() => false);
    const text = () => p.evaluate(() => { const w = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT), out = []; let n; while ((n = w.nextNode())) if (/^(P|H1|H2|H3|SMALL|B|LABEL|BUTTON|SUMMARY|LI)$/.test(n.tagName) && !n.querySelector('p,h2,h3,button,label,li')) out.push(n.textContent.replace(/\s+/g, ' ').trim()); return out; });
    const gaps = async where => { const g = (await text()).filter(l => GAP.test(l) && !/^\d|…$/.test(l)); ok(!g.length, `${where}: a gap where the name goes: ${JSON.stringify(g.slice(0, 4))}`); };

    await p.goto(BASE + (lang === 'en' ? '' : lang + '/')); await p.waitForTimeout(1500);
    await p.click(`[data-qa="${age}"]`); await p.waitForTimeout(1500);
    // 1) «Узнаём» one tap from the top, before the path
    ok(!!(await p.$('.sd-door.shut')), 'the doors are not shut on a fresh start (nothing to prove)');
    ok(await inView('#sdKnowGo'), '«Узнаём» shortcut not on the first screen');
    await p.screenshot({ path: `${SHOTS}/ptde-${tag}-home.png` });
    await p.click('#sdKnowGo'); await p.waitForTimeout(900);
    ok(await inView('#sdKnow'), '«Узнаём» not in view after one tap');
    await p.screenshot({ path: `${SHOTS}/ptde-${tag}-know.png` });
    const know = await p.$$eval('#sdKnow [data-know]', xs => xs.map(x => x.dataset.know));
    for (const [what, ids] of [['stories', ['tales', 'bookshelf']], ['journeys', ['travel']], ['news', ['learn-news']], ['science', ['phys-lab', 'how', 'space']], ['holidays', ['cal']]])
      ok(ids.some(id => know.includes(id)), `«Узнаём» has no ${what}: ${know}`);
    for (const id of ['travel', 'learn-news', know.includes('tales') ? 'tales' : 'bookshelf', 'cal']) {
      await run('goHome()'); await p.waitForTimeout(700);
      const t = p.locator(`#sdKnow [data-know="${id}"]`); if (!(await t.count())) continue;
      await t.click(); await p.waitForTimeout(900);
      ok(!(await p.$('.home-t')) && !(await p.$('#sdKnow')), `«${id}» did not open before the path`);
    }
    await run('goHome()'); await p.waitForTimeout(700);
    await gaps('home');

    // 6) «Чей это телефон?» with its reason
    await run('screenParents()'); await p.waitForTimeout(900);
    const why = await p.$$eval('.pult-gate .muted', xs => xs.map(x => x.textContent));
    ok(why.length >= 2 && why[0].length > 40, `«whose phone» has no reason: ${JSON.stringify(why)}`);
    await p.screenshot({ path: `${SHOTS}/ptde-${tag}-whose.png` });
    await p.click('#pwMine'); await p.waitForTimeout(1200);
    // 2) + 4) the child's languages
    const ml = await p.evaluate(() => { const d = [...document.querySelectorAll('details.set-more')].find(x => x.querySelector('.ml-langs')), rows = [...document.querySelectorAll('.ml-lrows > .ml-lr')];
      return { open: !!(d && d.open), first: rows.length ? rows[0].querySelector('[data-ml]').dataset.ml : '', ru: (rows.find(r => r.querySelector('[data-ml="ru"]')) || { textContent: '' }).textContent, nat: (rows.find(r => r.querySelector('[data-ml="ru"]')) || document).querySelector('.ml-nat') ? 1 : 0 }; });
    ok(ml.open, '«Языки ребёнка» is closed with no language chosen');
    ok(ml.first === lang, `the first language is ${ml.first}, not ${lang}`);
    ok(ml.ru.includes(RUSSIAN[lang]) && (lang === 'ru' || ml.nat), `Russian is not named in the page's language: «${ml.ru}»`);
    await p.click('.set-row[data-page="kid"]').catch(() => miss.push('no «kid» page')); await p.waitForTimeout(500);
    const sl = await p.evaluate(() => { const d = [...document.querySelectorAll('details.set-more')].find(x => x.querySelector('.ml-langs')); if (d) d.scrollIntoView(); });
    await p.waitForTimeout(300); await p.screenshot({ path: `${SHOTS}/ptde-${tag}-langs.png` });
    // 3) the whole panel without a name: every part opened once
    await p.click('#backBtn'); await p.waitForTimeout(500);
    const pages = await p.$$eval('.set-row[data-page]', xs => xs.map(x => x.dataset.page));
    const toList = async () => { if (await p.$('.set-menu.set-off')) { await p.click('#backBtn'); await p.waitForTimeout(500); } };
    for (const pg of pages) {
      await toList();
      const r = p.locator(`.set-row[data-page="${pg}"]`); if (!(await r.count())) continue;
      await r.click({ timeout: 3000 }).catch(() => {}); await p.waitForTimeout(500);
      await gaps('panel ' + pg);
    }
    // 5) «Свои сказки»: the long button wraps
    await toList();
    if (await p.locator('.set-row[data-page="own"]').count()) {
      await p.click('.set-row[data-page="own"]'); await p.waitForTimeout(300);
      await run('GROWN_OK = true; GROWN_AT = Date.now()'); await p.click('#otOpen'); await p.waitForSelector('#otKid');
      const cut = await p.$eval('#otKid', e => { const r = e.getBoundingClientRect(); return { over: e.scrollWidth > e.clientWidth + 1, out: r.right > innerWidth || r.left < 0 }; });
      ok(!cut.over && !cut.out, `«${await p.$eval('#otKid', e => e.textContent)}» is cut ${JSON.stringify(cut)}`);
      await p.$eval('#otKid', e => e.scrollIntoView({ block: 'center' })); await p.screenshot({ path: `${SHOTS}/ptde-${tag}-owntales.png` });
    } else miss.push('no «Свои сказки» in the panel');
    // and with the name given on the home, the same texts read with it
    await run('goHome()'); await p.waitForTimeout(700);
    if (await p.locator('#naName').count()) { await p.fill('#naName', kid); await p.click('#naOk'); await p.waitForTimeout(900); }
    ok(await run(`P.settings.name === ${JSON.stringify(kid)}`), 'the name was not taken');
    await run('screenParents()'); await p.waitForTimeout(900);
    ok((await p.$eval('.ml-langs .prow', e => e.textContent).catch(() => '')).includes(kid), 'the languages question has no name after naming');
    const line = `${tag}: missing ${JSON.stringify(miss)} | errors ${JSON.stringify(errs)}`;
    console.log(line); if (miss.length || errs.length) fails.push(line);
    await c.close();
  }
  await b.close();
  console.log(fails.length ? `FAIL ${fails.length}` : 'OK: pt/de fresh start');
  process.exit(fails.length ? 1 : 0);
})();
