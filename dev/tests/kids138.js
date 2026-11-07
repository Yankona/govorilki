// v138: the children's buttons are whole on a phone; 🔥 ⭐ in the top row; the default voice
const { chromium, devices } = require('playwright');
const D = require('path').join(__dirname, 'shots') + '/';
const PAGE = process.argv[2] || 'http://localhost:8781/govorilki/ru/';
const HOOK = 'const fam = () => ROOT.families[ROOT.curFam] || null;';
const kid = (name, g, tr, age, fr, stars) => ({ stars, plays: {}, likeG: {}, book: { title: 'Т', log: {} }, settings: { name, gender: g, track: tr, age, friend: fr, onboarded: true, lang: 'ru' } });
(async () => {
  const b = await chromium.launch(), log = (...a) => console.log(...a);
  for (const [dev, opt] of [['iPhone SE', { ...devices['iPhone SE'], deviceScaleFactor: 1 }], ['iPhone 13', { ...devices['iPhone 13'], deviceScaleFactor: 1 }], ['1000px', { viewport: { width: 1000, height: 700 } }], ['1440px', { viewport: { width: 1440, height: 900 } }]]) {
    const fam = { micOff: true, srOff: true, parentPhone: true, cur: 'k1', curFam: 'ft', families: { ft: { id: 'ft', name: 'Т', cc: 'PT', kids: ['k1', 'k2'], grands: [] } }, profiles: { k1: kid('Вера', 'f', 'r', 5, 'ghost', 35), k2: kid('Сава', 'm', 'l', 8, 'tiger', 140) } };
    const c = await b.newContext(opt);
    await c.route(/ntfy|wikipedia|huggingface|jsdelivr|youtube|wikimedia|workers\.dev/, r => r.abort());
    await c.route(u => /\/(ru|de|pt|en)?\/?(index\.html)?$/.test(u.pathname), async r => { const x = await r.fetch(); let t = await x.text(); t = t.replace(HOOK, HOOK + ' window.__T = { run: s => eval(s) };'); r.fulfill({ response: x, body: t }); });
    await c.addInitScript(s => { try { speechSynthesis.speak = u => setTimeout(() => u.onend && u.onend(), 5); } catch (e) {} if (localStorage.getItem('seeded')) return; localStorage.setItem('seeded', 1); localStorage.setItem('govorilki-v2', JSON.stringify(s)); }, fam);
    const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto(PAGE); await p.waitForTimeout(1500);
    const who = await p.$$('.who-kid'); if (who.length) { await who[0].click(); await p.waitForTimeout(1000); }
    for (const tab of ['today', 'learn']) {
      if (tab !== 'today') { await p.click(`.tb[data-tab="${tab}"]`); await p.waitForTimeout(700); }
      log(dev, tab, JSON.stringify(await p.evaluate(() => {
        const W = innerWidth, chips = [...document.querySelectorAll('.kids-in .kid')].map(k => { const r = k.getBoundingClientRect(), box = k.closest('.kids-in').getBoundingClientRect(); return `${k.textContent.trim()}:${r.left >= box.left - 1 && r.right <= box.right + 1 && r.right <= W ? 'whole' : 'CUT'}`; });
        const pills = [...document.querySelectorAll('.kids-top .pd-pill')].filter(x => x.offsetParent).map(x => x.textContent.trim());
        const top = document.querySelector('.kids-top').getBoundingClientRect();
        return { chips, pills, topH: Math.round(top.height), over: document.documentElement.scrollWidth > W };
      })));
      if (tab === 'today') await p.screenshot({ path: D + `k138-${dev.replace(/ /g, '')}.png`, clip: { x: 0, y: 0, width: Math.min(opt.viewport ? opt.viewport.width : 390, 1440), height: 260 } });
    }
    if (dev === 'iPhone 13') log('  default voice:', await p.evaluate(() => window.__T.run('piperVoice() + " / " + piperName()')));
    log('  errs', JSON.stringify(errs));
    await c.close();
  }
  await b.close();
})();
