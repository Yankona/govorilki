// v139: the guest page still starts a family and opens the sign-in
const { chromium, devices } = require('playwright');
const PAGE = process.argv[2] || 'http://localhost:8781/govorilki/ru/';
(async () => {
  const b = await chromium.launch(), log = (...a) => console.log(...a);
  for (const lang of ['ru', 'pt', 'de']) {
    const c = await b.newContext({ ...devices['iPhone 13'], deviceScaleFactor: 1 });
    await c.route(/ntfy|wikipedia|huggingface|jsdelivr|youtube|wikimedia|workers\.dev/, r => r.abort());
    const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto(PAGE.replace('/ru/', `/${lang}/`)); await p.waitForTimeout(1800);
    const info = await p.evaluate(() => ({ sections: [...document.querySelectorAll('.lp-sec > h2')].map(h => h.textContent), games: (document.querySelector('.ld-sub') || {}).textContent, path: !!document.querySelector('.ld-path .pd-svg path'), over: document.documentElement.scrollWidth > innerWidth }));
    log(lang, JSON.stringify(info));
    await p.click('#obHave'); await p.waitForTimeout(900);
    log('  sign-in in view:', await p.evaluate(() => { const b = document.querySelector('#lpLogin'); if (!b) return 'no login box (' + (document.querySelector('.bar h1') || {}).textContent + ')'; const r = b.getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0; }));
    await p.click('#obStart'); await p.waitForTimeout(900);
    log('  start → family form:', !!(await p.$('#feKids, .fe')), '| errs', JSON.stringify(errs));
    await c.close();
  }
  await b.close();
})();
