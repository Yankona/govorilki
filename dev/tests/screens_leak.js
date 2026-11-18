// Memory between screens: walk 10 screens (each one and back home), twice, and check that the page does not keep the
// old screens. Nodes and listeners are counted by Chrome after a garbage collection (CDP Performance.getMetrics).
// Invented family only (Тина, Тоша). Usage: node tests/screens_leak.js [base] [lang]
const { chromium, devices } = require('playwright');
const BASE = process.argv[2] || 'http://localhost:8781/govorilki/', LANG = process.argv[3] || 'ru';
const HOOK = 'const fam = () => ROOT.families[ROOT.curFam] || null;';
const kid = (name, g, age, fr) => ({ stars: 5, plays: {}, learn: {}, book: { title: 'Т', log: {} }, settings: { name, gender: g, track: 'r', age, friend: fr, onboarded: true, lang: LANG } });
const seed = { engine: 'device', micOff: true, srOff: true, parentPhone: true, cur: 'k1', curFam: 'f1',
  families: { f1: { id: 'f1', name: 'Т', cc: 'PT', kids: ['k1', 'k2'], grands: [] } },
  profiles: { k1: kid('Тина', 'f', 5, 'kitty'), k2: kid('Тоша', 'm', 8, 'tiger') } };
const SCREENS = [['stories', "screenLearn('space')"], ['journey', 'TRAVEL.screen()'], ['maths', 'screenMathCount()'], ['chess', 'screenChess(1)'],
  ['museum', "screenMuseum('day')"], ['olymp', 'screenOlymp()'], ['jobs', "screenLearn('jobs')"], ['plants', "screenLearn('plants')"],
  ['chess2', 'screenChess(2)'], ['journey2', 'TRAVEL.screen()']];
(async () => {
  const b = await chromium.launch();
  const c = await b.newContext({ ...devices['Pixel 5'], deviceScaleFactor: 1 });
  await c.route(/ntfy|wikipedia|huggingface|jsdelivr|youtube|wikimedia|workers\.dev/, r => r.abort());
  await c.route(u => /\/(ru|de|pt|en)?\/?(index\.html)?$|\/app\.[0-9a-f]+\.js$/.test(u.pathname), async r => { const x = await r.fetch(); let t = await x.text(); t = t.replace(HOOK, HOOK + ' window.__T = { run: s => eval(s) };'); r.fulfill({ response: x, body: t }); });
  await c.addInitScript(s => { try { speechSynthesis.speak = u => setTimeout(() => u.onend && u.onend(), 5); } catch (e) {} if (localStorage.getItem('seeded')) return; localStorage.setItem('seeded', 1); localStorage.setItem('govorilki-v2', JSON.stringify(s)); }, seed);
  const p = await c.newPage(), errs = [];
  p.on('pageerror', e => errs.push(e.message));
  const cdp = await c.newCDPSession(p); await cdp.send('Performance.enable');
  const m = async () => {
    await cdp.send('HeapProfiler.collectGarbage'); await p.waitForTimeout(200); await cdp.send('HeapProfiler.collectGarbage');
    const x = (await cdp.send('Performance.getMetrics')).metrics, g = n => x.find(y => y.name === n).value;
    return { nodes: g('Nodes'), ls: g('JSEventListeners'), docs: g('Documents'), dom: await p.evaluate(() => document.getElementsByTagName('*').length) };
  };
  await p.goto(BASE + (LANG === 'en' ? '' : LANG + '/')); await p.waitForTimeout(2500);
  const who = p.locator('.who-kid').first(); if (await who.count()) { await who.click(); await p.waitForTimeout(900); }
  const run = s => p.evaluate(s => window.__T.run(s), s).catch(e => errs.push(s + ': ' + e.message));
  const rows = [['home', await m()]];
  for (let round = 0; round < 2; round++) for (const [name, code] of SCREENS) {
    await run(code); await p.waitForTimeout(1500);
    // tap a little so the screen does something
    // (locators, not element handles: a handle kept by the test would itself keep the old screen alive)
    for (let i = 0; i < 2; i++) {
      const v = p.locator('main button:visible').nth(i);
      if (await v.count()) { await v.click({ timeout: 2000 }).catch(() => {}); await p.waitForTimeout(600); }
    }
    await run('goHome()'); await p.waitForTimeout(700);
    rows.push([round + 1 + ':' + name, await m()]); if (process.env.V) console.log(name, rows[rows.length - 1][1].nodes);
  }
  rows.forEach(([n, x]) => console.log(n.padEnd(12), 'nodes', String(x.nodes).padStart(6), 'in page', String(x.dom).padStart(5), 'listeners', String(x.ls).padStart(5), 'docs', x.docs));
  // the first round warms what is built once (tables, pictures); the second round must not grow
  const r1 = rows[SCREENS.length][1], r2 = rows[rows.length - 1][1], home = rows[0][1];
  const ok = r2.nodes <= r1.nodes * 1.1 + 300 && r2.nodes < home.nodes * 2 + 1000 && r2.docs <= home.docs + 1;
  console.log(`home ${home.nodes} → after 10 screens ${r1.nodes} → after 20 screens ${r2.nodes}; errors ${JSON.stringify(errs.slice(0, 5))}`);
  console.log(ok && !errs.length ? 'OK: memory stays flat' : 'FAIL: memory grows');
  await b.close(); process.exit(ok && !errs.length ? 0 : 1);
})();
