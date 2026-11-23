// news batch 2026-11-23: the three new stories open in news in all 4 languages, in their language, with a question
const { chromium, devices } = require('playwright');
const BASE = process.argv[2] || 'http://localhost:8781/govorilki/';
const HOOK = 'const fam = () => ROOT.families[ROOT.curFam] || null;';
const kid = (n, g, a, fr, lang) => ({ stars: 5, plays: {}, book: { title: 'Т', log: {} }, settings: { name: n, gender: g, track: 'r', age: a, friend: fr, onboarded: true, lang } });
let bad = 0; const ok = (c, m) => { console.log((c ? '  ok  ' : '  FAIL ') + m); if (!c) bad++; };
const IDS = ['news-saudi-green-lake', 'news-menorca-milk-wine', 'news-tree-rings-clock'];
(async () => {
  const b = await chromium.launch();
  for (const [lang, path] of [['ru', 'ru/'], ['en', ''], ['pt', 'pt/'], ['de', 'de/']]) {
    const fam = { engine: 'device', micOff: true, srOff: true, cur: 'k1', curFam: 'f1', families: { f1: { id: 'f1', name: 'Т', cc: 'PT', kids: ['k1'], grands: [] } }, profiles: { k1: kid('Тоша', 'm', 8, 'tiger', lang) } };
    const c = await b.newContext({ ...devices['iPhone 13'], deviceScaleFactor: 1 });
    await c.route(/ntfy|wikipedia|huggingface|jsdelivr|youtube|wikimedia|workers\.dev/, r => r.abort());
    await c.route(u => /\/(ru|de|pt|en)?\/?(index\.html)?$|\/app\.[0-9a-f]+\.js$/.test(u.pathname), async r => { const x = await r.fetch(); let t = await x.text(); t = t.replace(HOOK, HOOK + ' window.__T = { run: s => eval(s) };'); r.fulfill({ response: x, body: t }); });
    await c.addInitScript(s => { try { speechSynthesis.speak = u => setTimeout(() => u.onend && u.onend(), 5); } catch (e) {} if (localStorage.getItem('seeded')) return; localStorage.setItem('seeded', 1); localStorage.setItem('govorilki-v2', JSON.stringify(s)); }, fam);
    const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto(BASE + path); await p.waitForFunction(() => window.__T, null, { timeout: 30000 });
    const r = await p.evaluate(async ids => {
      const out = [];
      for (const id of ids) {
        const items = window.__T.run("learnItems('news')"), i = items.findIndex(x => x.id === id);
        if (i < 0) { out.push({ id, miss: 1 }); continue; }
        await window.__T.run(`PACK.story(learnItems('news')[${i}])`);
        const it = window.__T.run(`learnItems('news')[${i}]`);
        out.push({ id, t: it.t, s: it.s, q: it.q, a: it.a, date: it.date });
      }
      return out;
    }, IDS);
    for (const x of r) {
      ok(!x.miss && x.s && x.s.length > 250 && x.q && x.a && x.a.length === 3, `${lang} ${x.id}: ${x.t}`);
      if (lang !== 'ru' && x.s) ok(!/[А-яЁё]/.test(x.t + x.s + x.q + x.a.join('')), `${lang} ${x.id} has no Russian`);
    }
    // the news screen opens and lists them
    await p.evaluate(() => window.__T.run("screenLearn('news')")); await p.waitForTimeout(800);
    ok((await p.locator('.story-c').count()) >= 3, `${lang} news screen cards`);
    ok(errs.length === 0, `${lang} no page errors ${errs.join('|').slice(0, 200)}`);
    await c.close();
  }
  await b.close(); console.log(bad ? 'FAILED ' + bad : 'ALL OK'); process.exit(bad ? 1 : 0);
})();
