// Nothing gets lost with the faster first screen: the holiday of the day, news, science, stories, journeys, jobs and
// comics open with their words — online, and offline after one visit (the page, its script data/<lang>/app.*.js and the
// data packs are kept by the service worker). Invented family only (Тина 5, Тоша 8).
// Usage: node tests/content_offline.js [base] [langs=ru,en,pt,de]
const { chromium, devices } = require('playwright');
const BASE = process.argv[2] || 'http://localhost:8781/govorilki/';
const ONLY = (process.argv[3] || 'ru,en,pt,de').split(',');
const SUB = { ru: 'ru/', en: '', pt: 'pt/', de: 'de/' };
const HOOK = 'const fam = () => ROOT.families[ROOT.curFam] || null;';
const kid = (name, g, age, fr, lang) => ({ stars: 5, plays: {}, learn: {}, book: { title: 'Т', log: {} }, settings: { name, gender: g, track: 'r', age, friend: fr, onboarded: true, lang } });
const seedOf = lang => ({ engine: 'device', micOff: true, srOff: true, parentPhone: true, cur: 'k2', curFam: 'f1',
  families: { f1: { id: 'f1', name: 'Т', cc: 'PT', kids: ['k1', 'k2'], grands: [] } },
  profiles: { k1: kid('Тина', 'f', 5, 'kitty', lang), k2: kid('Тоша', 'm', 8, 'tiger', lang) } });
// [what, code that opens it (returns a selector to read), the least number of letters expected there]
const STORY = k => `(() => { const its = learnItems('${k}'); if (!its.length) return 'none'; screenStory('${k}', 0); return '#stT'; })()`;
const CHECKS = [
  ['holiday', "(() => { famCountries().forEach(holList); const id = Object.keys(HOL_BY_ID).find(i => HOL_BY_ID[i].cc === 'PT') || Object.keys(HOL_BY_ID)[0]; screenHoliday(id); return '.hol'; })()", 20],
  ['news', STORY('news'), 40],
  ['science', STORY('space'), 40],
  ['physics', STORY('phys'), 40],
  ['stories', "(() => { const k = Object.keys(LEARN).find(k => !LEARN[k].place && !['news', 'jobs', 'space', 'phys'].includes(k) && learnItems(k).length); screenStory(k, 0); return '#stT'; })()", 40],
  ['journey', "(() => { const k = Object.keys(LEARN).find(k => LEARN[k].place && learnItems(k).length); screenStory(k, 0); return '#stT'; })()", 40],
  ['journey map', "(() => { TRAVEL.screen(); return '.tv-c'; })()", 3],
  ['jobs', STORY('jobs'), 40],
  ['comics', "(() => { COMIX.shelf(); return '.cx-e'; })()", 1],
];
(async () => {
  const b = await chromium.launch(); let fails = 0;
  for (const lang of ONLY) {
    const c = await b.newContext({ ...devices['Pixel 5'], deviceScaleFactor: 1 });
    await c.route(/ntfy|wikipedia|huggingface|jsdelivr|youtube|wikimedia|workers\.dev|nager/, r => r.abort());
    await c.route(u => /\/(ru|de|pt|en)?\/?(index\.html)?$|\/app\.[0-9a-f]+\.js$/.test(u.pathname), async r => {
      try { const x = await r.fetch(); let t = await x.text(); t = t.replace(HOOK, HOOK + ' window.__T = { run: s => eval(s) };'); r.fulfill({ response: x, body: t }); } catch (e) { r.continue(); }
    });
    await c.addInitScript(s => { try { speechSynthesis.speak = u => setTimeout(() => u.onend && u.onend(), 5); } catch (e) {} if (localStorage.getItem('seeded')) return; localStorage.setItem('seeded', 1); localStorage.setItem('govorilki-v2', JSON.stringify(s)); }, seedOf(lang));
    const p = await c.newPage(), errs = [];
    p.on('pageerror', e => errs.push(e.message));
    const out = [];
    const pass = async mode => {
      await p.waitForFunction(() => window.__T || document.querySelector('.who-kid'), null, { timeout: 30000 }).catch(() => {});
      await p.waitForTimeout(1500);
      const who = p.locator('.who-kid').first(); if (await who.count()) { await who.click(); await p.waitForTimeout(900); }
      for (const [name, code, min] of CHECKS) {
        let sel = null; try { sel = await p.evaluate(s => window.__T.run(s), code); } catch (e) { out.push(`${mode} ${name}: ${e.message.slice(0, 80)}`); continue; }
        if (sel === 'none') { out.push(`${mode} ${name}: no items`); continue; }
        let txt = '';
        for (let i = 0; i < 20 && txt.length < min; i++) { await p.waitForTimeout(400); txt = await p.evaluate(s => [...document.querySelectorAll(s)].map(e => e.innerText).join(' ').trim(), sel); }
        if (txt.length < min) out.push(`${mode} ${name}: empty (${JSON.stringify(txt.slice(0, 40))})`);
        await p.evaluate(() => window.__T.run('goHome()')).catch(() => {}); await p.waitForTimeout(300);
      }
    };
    await p.goto(BASE + SUB[lang]);
    await pass('online');
    // the service worker keeps the page, its script and the packs a few seconds after the start
    await p.waitForTimeout(8000);
    await c.setOffline(true);
    await p.reload().catch(e => out.push('offline reload: ' + e.message.slice(0, 60)));
    await pass('offline');
    if (errs.length) out.push('page errors: ' + errs.slice(0, 3).join(' | '));
    console.log(`${lang}: ${out.length ? 'FAIL ' + out.join(' ; ') : 'ok — ' + CHECKS.map(x => x[0]).join(', ') + ' open online and offline'}`);
    if (out.length) fails++;
    await c.close();
  }
  await b.close(); console.log(fails ? `FAIL in ${fails} language(s)` : 'OK: all languages'); process.exit(fails ? 1 : 0);
})();
