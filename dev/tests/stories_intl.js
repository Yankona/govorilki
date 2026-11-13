// Journey stories in en/pt/de: every place has at least MIN stories (or all its Russian ones), no Cyrillic in any story,
// question or answer (all packs loaded), every place's screen and two stories per place opened on screen with the
// quiz answered right (counts: all stories of a place, «big» ones included — a reader sees them all), the journey screen and its quiz without Russian. Invented child only (Тина).
// node tests/stories_intl.js [base] [phone|laptop]     env: LANGS=en,pt  MIN=20
const { chromium, devices } = require('playwright');
const fs = require('fs'), D = require('path').join(__dirname, 'shots') + '/';
fs.mkdirSync(D, { recursive: true });
const BASE = process.argv[2] || 'http://localhost:8781/govorilki/', DEV = process.argv[3] || 'phone', MIN = +(process.env.MIN || 20);
const HOOK = 'const fam = () => ROOT.families[ROOT.curFam] || null;';
const LANGS = Object.entries({ ru: 'ru/', en: '', pt: 'pt/', de: 'de/' }).filter(x => !process.env.LANGS || process.env.LANGS.includes(x[0]));
const CYR = /[Ѐ-ӿ]/, NAMES = /Тина|Т\b/g;
let bad = 0; const fail = m => { console.log('  FAIL ' + m); bad++; };
async function open(b, lang, sub) {
  const seed = { engine: 'device', micOff: true, srOff: true, parentPhone: true, cur: 'k1', curFam: 'f1',
    families: { f1: { id: 'f1', name: 'Т', cc: 'PT', kids: ['k1'], grands: [] } },
    profiles: { k1: { stars: 5, plays: {}, learn: {}, book: { title: 'Т', log: {} }, settings: { name: 'Тина', gender: 'f', track: 'r', age: 6, friend: 'kitty', onboarded: true, lang } } } };
  const c = await b.newContext(DEV === 'laptop' ? { viewport: { width: 1280, height: 800 } } : { ...devices['iPhone 13'], deviceScaleFactor: 1 });
  await c.route(/ntfy|wikipedia|huggingface|jsdelivr|youtube|wikimedia|workers\.dev/, r => r.abort());
  await c.route(u => /\/(ru|de|pt|en)?\/?(index\.html)?$/.test(u.pathname), async r => { const x = await r.fetch(); let t = await x.text(); t = t.replace(HOOK, HOOK + ' window.__T = { run: s => eval(s) };'); r.fulfill({ response: x, body: t }); });
  await c.addInitScript(s => { window.__said = []; try { speechSynthesis.speak = u => { window.__said.push(u.text); setTimeout(() => u.onend && u.onend(), 2); }; } catch (e) {} if (localStorage.getItem('seeded')) return; localStorage.setItem('seeded', 1); localStorage.setItem('govorilki-v2', JSON.stringify(s)); }, seed);
  const p = await c.newPage(); p.errs = [];
  p.on('pageerror', e => p.errs.push(e.message.slice(0, 160)));
  p.on('dialog', d => d.dismiss().catch(() => {}));
  await p.goto(BASE + sub); await p.waitForTimeout(1500);
  const w = await p.$$('.who-kid'); if (w.length) { await w[0].click(); await p.waitForTimeout(800); }
  p.run = s => p.evaluate(s => window.__T.run(s), s);
  return { c, p };
}
const ruText = async p => ((await p.evaluate(() => document.body.innerText)) || '').replace(NAMES, '').match(/[^\s]*[Ѐ-ӿ][^\s]*/g);
(async () => {
  const b = await chromium.launch(), counts = {};
  for (const [lang, sub] of LANGS) {
    const { c, p } = await open(b, lang, sub);
    // journey places: sections with a country, plus the old times and space
    const secs = await p.run(`Object.entries(LEARN).filter(([k, v]) => v.place || k === 'old' || k === 'space').map(([k, v]) => [k, v.name, v.items.length])`);
    counts[lang] = Object.fromEntries(secs.map(([k, , n]) => [k, n]));
    if (lang === 'ru') { await c.close(); continue; }
    // every story's words, from the packs
    const leaks = await p.run(`(async () => { const out = []; for (const k of ${JSON.stringify(secs.map(x => x[0]))}) for (const it of learnItems(k)) { if (it.px && it.s == null) await PACK.story(it);
      const txt = [it.t, it.s, it.q, ...(it.a || [])].join(' | '); if (/[\\u0400-\\u04FF]/.test(txt) || !it.s || !it.q || !(it.a && it.a.length >= 2)) out.push(k + ' ' + it.id + ': ' + txt.slice(0, 80)); } return out; })()`);
    leaks.forEach(x => fail(`${lang}: story with Russian or missing parts: ${x}`));
    if (CYR.test(secs.map(x => x[1]).join(' '))) fail(`${lang}: place names in Russian: ${secs.map(x => x[1]).filter(x => CYR.test(x))}`);
    // on screen: each place, two stories each (first and last), the quiz answered right
    for (const [k] of secs) {
      if (!counts[lang][k]) continue;
      await p.run(`screenLearn('${k}')`); await p.waitForTimeout(250);
      let r = await ruText(p); if (r) fail(`${lang}/${k} list: ${r.slice(0, 5)}`);
      const n = await p.$$eval('.story-c', x => x.length);
      for (const i of [...new Set([0, n - 1])]) {
        await p.run(`screenStory('${k}', ${i})`);
        await p.waitForSelector('.story-q:not([hidden]) .ans', { timeout: 20000 }).catch(() => fail(`${lang}/${k}#${i}: no quiz`));
        r = await ruText(p); if (r) fail(`${lang}/${k}#${i} story: ${r.slice(0, 5)}`);
        const said = (await p.evaluate(() => window.__said.splice(0))).join(' ');
        if (CYR.test(said.replace(NAMES, ''))) fail(`${lang}/${k}#${i} voice in Russian: ${said.slice(0, 100)}`);
        const ok = await p.$('.ans[data-ok="1"]'); if (ok) { await ok.click(); await p.waitForTimeout(300); }
        if (!(await p.$('.ans.right'))) fail(`${lang}/${k}#${i}: right answer not accepted`);
        await p.waitForTimeout(900);
      }
    }
    await p.run('TRAVEL.screen()'); await p.waitForTimeout(600);
    let r = await ruText(p); if (r) fail(`${lang} journey screen: ${r.slice(0, 5)}`);
    await p.screenshot({ path: D + `stories-intl-${lang}-${DEV}-travel.png` });
    await p.run(`screenStory('russia', 0)`); await p.waitForSelector('.story-q:not([hidden])', { timeout: 20000 }).catch(() => {});
    await p.screenshot({ path: D + `stories-intl-${lang}-${DEV}-russia.png` });
    await p.run('TRAVEL.quiz()'); await p.waitForTimeout(800);
    r = await ruText(p); if (r) fail(`${lang} journey quiz: ${r.slice(0, 5)}`);
    if (p.errs.length) fail(`${lang}: page errors ${p.errs}`);
    await c.close();
  }
  await b.close();
  // counts: every place in en/pt/de has MIN stories, or as many as in Russian
  const ks = Object.keys(counts.ru || counts[Object.keys(counts)[0]]);
  console.log('place'.padEnd(10) + LANGS.map(x => x[0].padStart(5)).join(''));
  for (const k of ks) {
    console.log(k.padEnd(10) + LANGS.map(([l]) => String(counts[l][k] ?? '-').padStart(5)).join(''));
    for (const [l] of LANGS) if (l !== 'ru' && (counts[l][k] || 0) < Math.min(MIN, counts.ru ? counts.ru[k] : MIN)) fail(`${l}/${k}: ${counts[l][k] || 0} stories`);
  }
  console.log(bad ? `FAIL ${bad}` : `OK: stories in every language (${DEV})`);
  process.exit(bad ? 1 : 0);
})();
