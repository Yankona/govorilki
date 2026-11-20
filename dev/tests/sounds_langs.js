// The speech-sound games in English, Portuguese and German (task sounds-langs): «Водичка или комарик?» (sz-sort),
// «Свистящие слоги» (sz-syll), «Где живёт звук С» (sz-house), «Похожие слова» (hear-pairs) and «Чистоговорки»
// (chist-all) are played to the end in each language, on a phone and a laptop, by invented children (Тина 5, Тоша 9).
// Each round is answered right from the language's own data (LANGDATA); the test checks: the game finishes, the words
// are that language's own (not Russian), nothing Russian on screen or in the voice, no page error, no horizontal
// scroll on a phone. It prints the words the voice said per language (for the voice check) and keeps screenshots.
// node tests/sounds_langs.js [base] [phone|laptop|both]     env: LANGS=en,pt
const { chromium, devices } = require('playwright');
const fs = require('fs'), D = require('path').join(__dirname, 'shots') + '/';
fs.mkdirSync(D, { recursive: true });
const BASE = process.argv[2] || 'http://localhost:8781/govorilki/', DEVS = (process.argv[3] || 'both') === 'both' ? ['phone', 'laptop'] : [process.argv[3]];
const HOOK = 'const fam = () => ROOT.families[ROOT.curFam] || null;';
const LANGS = Object.entries({ en: '', pt: 'pt/', de: 'de/' }).filter(x => !process.env.LANGS || process.env.LANGS.includes(x[0]));
const KIDS = [['Тина', 'f', 5, 'r'], ['Тоша', 'm', 9, 'l']];
const CYR = /[А-Яа-яЁё]/, NAMES = /Тина|Тоша|Т\b/g;
let bad = 0; const fail = m => { console.log('  FAIL ' + m); bad++; };
async function open(b, dev, lang, sub, [name, g, age, track]) {
  const seed = { engine: 'device', micOff: true, srOff: true, parentPhone: true, cur: 'k1', curFam: 'f1',
    families: { f1: { id: 'f1', name: 'Т', cc: 'PT', kids: ['k1'], grands: [] } },
    profiles: { k1: { stars: 5, plays: {}, learn: {}, book: { title: 'Т', log: {} }, settings: { name, gender: g, track, age, friend: 'kitty', onboarded: true, lang, sounds: ['sz', 'sh', 'l', 'r'], day: { on: false } } } } };
  const c = await b.newContext(dev === 'laptop' ? { viewport: { width: 1280, height: 800 } } : { ...devices['iPhone 13'], deviceScaleFactor: 1 });
  await c.route(/ntfy|wikipedia|huggingface|jsdelivr|youtube|wikimedia|workers\.dev/, r => r.abort());
  await c.route(u => /\/(ru|de|pt|en)?\/?(index\.html)?$|\/app\.[0-9a-f]+\.js$/.test(u.pathname), async r => { const x = await r.fetch(); let t = await x.text(); t = t.replace(HOOK, HOOK + ' window.__T = { run: s => eval(s) };'); r.fulfill({ response: x, body: t }); });
  await c.addInitScript(s => { window.__said = []; try { speechSynthesis.speak = u => { window.__said.push(u.text); setTimeout(() => u.onend && u.onend(), 5); }; } catch (e) {} if (localStorage.getItem('seeded')) return; localStorage.setItem('seeded', 1); localStorage.setItem('govorilki-v2', JSON.stringify(s)); }, seed);
  const p = await c.newPage(); p.errs = [];
  p.on('pageerror', e => p.errs.push(e.message.slice(0, 160)));
  p.on('dialog', d => d.dismiss().catch(() => {}));
  await p.goto(BASE + sub); await p.waitForTimeout(1500);
  const w = await p.$$('.who-kid'); if (w.length) { await w[0].click(); await p.waitForTimeout(800); }
  p.run = s => p.evaluate(s => window.__T.run(s), s);
  return { c, p };
}
const plays = (p, key) => p.run(`P.plays['${key}'] || 0`);
const tapSaid = async p => { const s = p.locator('.said:not(.wait)'); if (await s.count()) { await s.first().click(); return true; } return false; };
// one step of a game: answer what is on screen right, from the language data
const STEP = {
  'sz-sort': async p => {
    const e = await p.evaluate(() => { const c = document.querySelector('.pcard .pic'); return c ? c.textContent : ''; });
    const L = await p.run(`(() => { const bins = [...document.querySelectorAll('.bin')].map(b => b.dataset.l); const it = LANGDATA.SZ_ITEMS.find(x => x[2] === ${JSON.stringify(e)} && bins.includes(x[0])); return it ? it[0] : ''; })()`);
    if (L) await p.locator(`.bin[data-l="${L}"]`).click();
  },
  'sz-syll': async p => {
    if (await tapSaid(p)) return;
    const n = await p.locator('.ball.next').count();
    if (n) await p.locator('.ball.next').first().click();
  },
  'sz-house': async p => {
    const e = await p.evaluate(() => { const c = document.querySelector('#attic .pic'); return c ? c.textContent : ''; });
    const i = await p.run(`(() => { const h = LANGDATA.HOUSE_S.find(x => x[1] === ${JSON.stringify(e)}); return h ? h[2] : -1; })()`);
    if (i >= 0) await p.locator(`.wnd[data-i="${i}"]`).click();
  },
  'hear-pairs': async p => {
    const said = await p.evaluate(() => window.__said.slice(-1)[0] || '');
    const ws = await p.evaluate(() => [...document.querySelectorAll('#lgP [data-w]')].map(x => x.dataset.w));
    const w = ws.find(x => said.toLowerCase().replace(/[.!]/g, '').trim() === x.toLowerCase());
    if (w) await p.locator(`#lgP [data-w="${w}"]`).click();
  },
  'chist-all': async p => { await tapSaid(p); }
};
(async () => {
  const b = await chromium.launch(), words = {};
  for (const dev of DEVS) for (const [lang, sub] of LANGS) for (const kid of KIDS) {
    const { c, p } = await open(b, dev, lang, sub, kid);
    words[lang] = words[lang] || new Set();
    for (const id of Object.keys(STEP)) {
      const key = id, e0 = p.errs.length;
      const g = await p.run(`(() => { const g = GAMES.find(g => g.id === '${id}'); return g ? { hide: !!(g.hide && g.hide()), name: g.name } : null; })()`);
      if (!g || g.hide) { fail(`${dev} ${lang} ${kid[0]}: ${id} is hidden or missing`); continue; }
      if (CYR.test(g.name)) fail(`${dev} ${lang}: ${id} name is Russian: ${g.name}`);
      await p.run('window.__said.length = 0; goHome()'); await p.waitForTimeout(200);
      const n0 = await plays(p, key);
      await p.run(`GAMES.find(g => g.id === '${id}').go()`); await p.waitForTimeout(600);
      let shot = false, done = false, seen = '';
      for (let i = 0; i < 160 && !done; i++) {
        const st = await p.evaluate(() => ({ txt: (document.querySelector('#app') || document.body).innerText || '', w: document.scrollingElement.scrollWidth, iw: innerWidth }));
        seen += '\n' + st.txt;
        if (dev === 'phone' && st.w > st.iw + 2) { fail(`${lang} ${id}: horizontal scroll ${st.w}>${st.iw}`); }
        if (!shot && i === 2) { await p.screenshot({ path: `${D}sounds_langs-${lang}-${id}-${dev}.png` }); shot = true; }
        await STEP[id](p).catch(() => {});
        await p.waitForTimeout(id === 'sz-syll' || id === 'chist-all' ? 350 : 250);
        done = (await plays(p, key)) > n0;
      }
      const said = await p.evaluate(() => window.__said.slice());
      said.forEach(s => words[lang].add(s));
      const ruSaid = said.filter(s => CYR.test(s.replace(NAMES, '')));
      const ruSeen = seen.split('\n').filter(l => CYR.test(l.replace(NAMES, '')));
      console.log(`${dev} ${lang} ${kid[0]} ${id}: ${done ? 'finished' : 'NOT finished'}, said ${said.length}`);
      if (!done) fail(`${dev} ${lang} ${kid[0]}: ${id} did not finish`);
      if (ruSaid.length) fail(`${dev} ${lang} ${id}: Russian in the voice: ${ruSaid.slice(0, 3).join(' | ')}`);
      if (ruSeen.length) fail(`${dev} ${lang} ${id}: Russian on screen: ${[...new Set(ruSeen)].slice(0, 3).join(' | ')}`);
      if (p.errs.length > e0) fail(`${dev} ${lang} ${id}: page errors ${p.errs.slice(e0).join(' | ')}`);
    }
    await c.close();
  }
  fs.writeFileSync(D + 'sounds_langs-said.json', JSON.stringify(Object.fromEntries(Object.entries(words).map(([l, s]) => [l, [...s]])), null, 1));
  await b.close();
  console.log(bad ? `FAIL ${bad}` : 'OK: the sound games play to the end in en, pt, de on a phone and a laptop');
  process.exit(bad ? 1 : 0);
})();
