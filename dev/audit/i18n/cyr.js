// Cyrillic-in-UI pass: home, "For grown-ups" panel, journey, a few games — en/pt/de. Invented children only.
const { chromium, devices } = require('playwright');
const BASE = 'http://localhost:8781/govorilki/';
const HOOK = 'const fam = () => ROOT.families[ROOT.curFam] || null;';
const LANGS = { en: '', pt: 'pt/', de: 'de/' };
const kid = (name, g, age, fr, lang) => ({ stars: 5, plays: {}, learn: {}, book: { title: 'T', log: {} }, settings: { name, gender: g, track: 'r', age, friend: fr, onboarded: true, lang } });
const CYR = /[А-Яа-яЁё]/;
(async () => {
  const b = await chromium.launch(); const report = {};
  for (const [lang, sub] of Object.entries(LANGS)) {
    const seed = { engine: 'device', micOff: true, srOff: true, parentPhone: true, cur: 'k1', curFam: 'f1',
      families: { f1: { id: 'f1', name: 'T', cc: 'PT', kids: ['k1', 'k2'], grands: [] } },
      profiles: { k1: kid('Tina', 'f', 6, 'kitty', lang), k2: kid('Tim', 'm', 8, 'tiger', lang) } };
    const c = await b.newContext({ ...devices['iPhone 13'], deviceScaleFactor: 1 });
    await c.route(/ntfy|wikipedia|huggingface|jsdelivr|youtube|wikimedia|workers\.dev/, r => r.abort());
    await c.route(u => /\/(ru|de|pt|en)?\/?(index\.html)?$/.test(u.pathname), async r => { const x = await r.fetch(); let t = await x.text(); t = t.replace(HOOK, HOOK + ' window.__T = { run: s => eval(s) };'); r.fulfill({ response: x, body: t }); });
    await c.addInitScript(s => { try { speechSynthesis.speak = u => setTimeout(() => u.onend && u.onend(), 5); } catch (e) {} if (localStorage.getItem('seeded')) return; localStorage.setItem('seeded', 1); localStorage.setItem('govorilki-v2', JSON.stringify(s)); }, seed);
    const p = await c.newPage(), errs = []; p.on('pageerror', e => errs.push(e.message));
    const found = {};
    const grab = async (label) => {
      const txt = await p.evaluate(() => document.body.innerText).catch(() => '');
      const lines = [...new Set(txt.split('\n').map(s => s.trim()).filter(s => CYR.test(s)))];
      const attrs = await p.evaluate(() => [...document.querySelectorAll('[placeholder],[title],[aria-label],[alt]')].flatMap(e => ['placeholder', 'title', 'aria-label', 'alt'].map(a => e.getAttribute(a)).filter(Boolean))).catch(() => []);
      const al = [...new Set(attrs.filter(s => CYR.test(s)))];
      found[label] = { text: lines, attrs: al };
    };
    await p.goto(BASE + sub); await p.waitForTimeout(1800);
    const who = await p.$$('.who-kid'); if (who.length) { await who[0].click(); await p.waitForTimeout(900); }
    await grab('home');
    const tabs = await p.$$('.kids-in [role=tab], .kids-in button');
    for (let i = 0; i < Math.min(tabs.length, 8); i++) { try { await tabs[i].click(); await p.waitForTimeout(500); await grab('home-tab-' + i); } catch (e) {} }
    await p.evaluate(() => window.__T.run('goHome()')).catch(() => {}); await p.waitForTimeout(600);
    await p.evaluate(() => { const st = document.querySelector('#stage') || document.scrollingElement; st.scrollTop = 1e6; }); await p.waitForTimeout(500); await grab('home-scrolled');
    await p.evaluate(() => window.__T.run('screenParents()')).catch(e => errs.push('parents ' + e.message)); await p.waitForTimeout(1200); await grab('parents');
    await p.evaluate(() => document.querySelectorAll('details').forEach(d => d.open = true)); await p.waitForTimeout(300); await grab('parents-details');
    await p.evaluate(() => window.__T.run('TRAVEL.screen()')).catch(e => errs.push('travel ' + e.message)); await p.waitForTimeout(900); await grab('travel');
    for (const fn of ['screenBreathMenu()', 'screenCatch()', 'screenSpeedMenu()', 'screenCalendar()', 'screenBook()']) {
      await p.evaluate(() => window.__T.run('goHome()')).catch(() => {}); await p.waitForTimeout(300);
      await p.evaluate(f => window.__T.run(f), fn).catch(e => errs.push(fn + ' ' + e.message)); await p.waitForTimeout(1200); await grab(fn);
    }
    report[lang] = { errs, found };
    await c.close();
  }
  await b.close();
  for (const [lang, r] of Object.entries(report)) {
    console.log(`\n===== ${lang} | page errors: ${JSON.stringify(r.errs)}`);
    const all = new Map();
    for (const [scr, f] of Object.entries(r.found)) { for (const s of f.text) { if (!all.has(s)) all.set(s, []); all.get(s).push(scr); } for (const s of f.attrs) { const k = '[attr] ' + s; if (!all.has(k)) all.set(k, []); all.get(k).push(scr); } }
    console.log(`distinct Cyrillic lines: ${all.size}`);
    for (const [s, scrs] of all) console.log(`  - ${JSON.stringify(s.slice(0, 160))}  @ ${[...new Set(scrs)].join(',')}`);
  }
  require('fs').writeFileSync(process.argv[2], JSON.stringify(report, null, 1));
})();
