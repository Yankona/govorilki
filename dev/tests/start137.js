// v137: the game opens on «Сегодня» even when another tab was open last time; a 1000 px window has the tabs on the left
const { chromium } = require('playwright');
const D = require('path').join(__dirname, 'shots') + '/';
const PAGE = process.argv[2] || 'http://localhost:8781/govorilki/ru/';
const kid = (name, g, tr, age, fr, stars, tab) => ({ stars, plays: {}, likeG: {}, homeTab: tab, book: { title: 'Т', log: {} }, settings: { name, gender: g, track: tr, age, friend: fr, onboarded: true, lang: 'ru' } });
(async () => {
  const b = await chromium.launch(), log = (...a) => console.log(...a);
  const fam = { engine: 'device', micOff: true, srOff: true, parentPhone: true, cur: 'k1', curFam: 'ft', families: { ft: { id: 'ft', name: 'Т', cc: 'PT', kids: ['k1', 'k2'], grands: [] } }, profiles: { k1: kid('Тина', 'f', 'r', 5, 'kitty', 2, 'discover'), k2: kid('Тоша', 'm', 'l', 8, 'tiger', 140, 'learn') } };
  for (const w of [1000, 1440, 860]) {
    const c = await b.newContext({ viewport: { width: w, height: 700 } });
    await c.route(/ntfy|wikipedia|huggingface|jsdelivr|youtube|wikimedia|workers\.dev/, r => r.abort());
    await c.addInitScript(s => { try { speechSynthesis.speak = u => setTimeout(() => u.onend && u.onend(), 5); } catch (e) {} if (localStorage.getItem('seeded')) return; localStorage.setItem('seeded', 1); localStorage.setItem('govorilki-v2', JSON.stringify(s)); }, fam);
    const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto(PAGE); await p.waitForTimeout(1500);
    const who = await p.$$('.who-kid'); if (who.length) { await who[0].click(); await p.waitForTimeout(1000); }
    const st = () => p.evaluate(() => ({ tab: (document.querySelector('.tb.sel') || {}).dataset.tab, path: !!document.querySelector('#pdBox'), rail: getComputedStyle(document.querySelector('#tabBar')).width, side: getComputedStyle(document.querySelector('.pd-side') || document.body).display, over: document.documentElement.scrollWidth > innerWidth }));
    log(w, 'Тина opens:', JSON.stringify(await st()));
    if (w === 1000) await p.screenshot({ path: D + 's137-1000.png' });
    // a tab chosen now stays when coming back from a game
    await p.click('.tb[data-tab="create"]'); await p.waitForTimeout(700); await p.click('.home-t .tile'); await p.waitForTimeout(1200);
    await p.evaluate(() => goHome()).catch(() => {}); await p.waitForTimeout(300);
    const back = await p.$('.bar .ibtn, #back'); if (!(await p.$('#tabBar')) && back) { await back.click(); await p.waitForTimeout(900); }
    log(w, '  back from a game:', JSON.stringify(await st()));
    // the other child, first time this session: «Сегодня»
    await p.click('.kids-in .kid:not(.sel)'); await p.waitForTimeout(1200);
    log(w, '  Тоша opens:', JSON.stringify(await st()));
    log(w, '  errs', JSON.stringify(errs));
    await c.close();
  }
  await b.close();
})();
