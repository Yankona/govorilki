// The speech-sound games in English, Portuguese and German (task sounds-langs): «Водичка или комарик?» (sz-sort),
// «Свистящие слоги» (sz-syll), «Где живёт звук С» (sz-house), «Похожие слова» (hear-pairs), «Чистоговорки»
// (chist-all), the R games (r-motor, r-throat: en R/W, pt R/RR, de R/-er), «Скороговорки с карандашом» (twist-pen, from 6)
// and «Проверка речи» (speech-check) are played to the end in each language, on a phone and a laptop, by invented children (Тина 5, Тоша 9).
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
  const w = await p.$$('.who-kid'); if (w.length) { await w[0].click({ timeout: 1500 }); await p.waitForTimeout(800); }
  p.run = s => p.evaluate(s => window.__T.run(s), s);
  return { c, p };
}
const plays = (p, key) => p.run(`P.plays['${key}'] || 0`);
// taps through the DOM: the balls and buttons float (animated), the game reacts to the click itself
const tap = (p, sel) => p.evaluate(s => { const e = document.querySelector(s); if (e) e.click(); return !!e; }, sel);
const tapSaid = p => tap(p, '.said:not(.wait)');
// one step of a game: answer what is on screen right, from the language data
const STEP = {
  'sz-sort': async p => sortStep(p, 'SZ_ITEMS'),
  'r-throat': async p => sortStep(p, 'R_SORT'),
  'sz-syll': async p => {
    if (await tapSaid(p)) return;
    await tap(p, '.ball.next');
  },
  'sz-house': async p => {
    // the word is in what the voice said last (the picture may be drawn, not an emoji)
    const i = await p.run(`(() => { const s = window.__said.slice(-10).join(' | ').toLowerCase(); const at = x => { const m = [...s.matchAll(new RegExp('(^|[^\\\\p{L}])' + x[0].toLowerCase() + '(?=[^\\\\p{L}]|$)', 'gu'))]; return m.length ? m[m.length - 1].index : -1; }; const h = LANGDATA.HOUSE_S.filter(x => at(x) >= 0).sort((a, b) => at(b) - at(a) || b[0].length - a[0].length)[0]; return h ? h[2] : -1; })()`);
    if (process.env.DEBUG) console.log("   house", i, await p.evaluate(() => document.querySelectorAll("#wnds .wnd").length + " " + (document.querySelector(".house") ? "house" : "no")), await p.evaluate(() => window.__said.slice(-2).join(' | ').slice(0, 120)));
    if (i >= 0) await p.locator(`#wnds .wnd[data-i="${i}"]`).click({ timeout: 1500, force: true }).catch(e => process.env.DEBUG && console.log('   ', e.message.slice(0, 200)));
  },
  'hear-pairs': async p => {
    const said = await p.evaluate(() => window.__said.slice(-1)[0] || '');
    const ws = await p.evaluate(() => [...document.querySelectorAll('#lgP [data-w]')].map(x => x.dataset.w));
    const w = ws.find(x => said.toLowerCase().replace(/[.!]/g, '').trim() === x.toLowerCase());
    if (w) await tap(p, `#lgP [data-w="${w}"]`);
  },
  'chist-all': async p => { await tapSaid(p); },
  'r-motor': async p => { await tapSaid(p); },
  'twist-pen': async p => { await tapSaid(p); },
  'speech-check': async p => {
    if (await tap(p, '#lgGo') || await tap(p, '.lg-mark [data-m="1"]') || await tap(p, '#lgFin')) return;
    await STEP['hear-pairs'](p);
  }
};
// the sorting games: the card's picture names the word of the language's data
async function sortStep(p, set) {
  const e = await p.evaluate(() => { const c = document.querySelector('.pcard .pic'); return c ? c.textContent : ''; });
  const L = await p.run(`(() => { const bins = [...document.querySelectorAll('.bin')].map(b => b.dataset.l), items = ${set === 'R_SORT' ? 'LANGDATA.R_SORT.items' : 'LANGDATA.SZ_ITEMS'};
    const s = window.__said.slice(-10).join(' | ').toLowerCase(), has = w => new RegExp('(^|[^\\\\p{L}])' + w.toLowerCase() + '([^\\\\p{L}]|$)', 'u').test(s);
    const it = items.filter(x => bins.includes(x[0]) && (x[2] === ${JSON.stringify(e)} || has(x[1]))).sort((a, b) => (b[2] === ${JSON.stringify(e)}) - (a[2] === ${JSON.stringify(e)}) || b[1].length - a[1].length)[0]; return it ? it[0] : ''; })()`);
  if (L) await tap(p, `.bin[data-l="${L}"]`);
}
(async () => {
  const b = await chromium.launch(), words = {};
  for (const dev of DEVS) for (const [lang, sub] of LANGS) for (const kid of KIDS) {
    const { c, p } = await open(b, dev, lang, sub, kid);
    words[lang] = words[lang] || new Set();
    for (const id of Object.keys(STEP).filter(id => !process.env.ONLY || process.env.ONLY.split(',').includes(id))) {
      const key = id, e0 = p.errs.length;
      const g = await p.run(`(() => { const g = GAMES.find(g => g.id === '${id}'); return g ? { hide: !!(g.hide && g.hide()), name: g.name } : null; })()`);
      if (id === 'twist-pen' && kid[2] < 6) { if (!g || !g.hide) fail(`${lang}: twist-pen shown to a ${kid[2]}-year-old`); continue; }
      if (!g || g.hide) { fail(`${dev} ${lang} ${kid[0]}: ${id} is hidden or missing`); continue; }
      if (CYR.test(g.name)) fail(`${dev} ${lang}: ${id} name is Russian: ${g.name}`);
      await p.run('window.__said.length = 0; goHome()'); await p.waitForTimeout(200);
      const n0 = await plays(p, key);
      await p.run(`GAMES.find(g => g.id === '${id}').go()`); await p.waitForTimeout(600);
      let shot = false, done = false, seen = '';
      for (let i = 0; i < 260 && !done; i++) {
        const st = await p.evaluate(() => ({ txt: (document.querySelector('#app') || document.body).innerText || '', w: document.scrollingElement.scrollWidth, iw: innerWidth }));
        seen += '\n' + st.txt;
        if (dev === 'phone' && st.w > st.iw + 2) { fail(`${lang} ${id}: horizontal scroll ${st.w}>${st.iw}`); }
        if (!shot && i === 2) { await p.screenshot({ path: `${D}sounds_langs-${lang}-${id}-${dev}.png` }); shot = true; }
        // «Послушай условие»: answers open after the instruction; a tap before it is «Ты не услышал»
        if (!(await p.evaluate(() => !!document.querySelector('#stage.ls-wait')))) await STEP[id](p).catch(() => {});
        await p.waitForTimeout(['sz-syll', 'chist-all', 'r-motor', 'twist-pen'].includes(id) ? 350 : 250);
        done = (await plays(p, key)) > n0;
        if (process.env.DEBUG && i % 10 === 0) console.log('   ', i, (await p.evaluate(() => (document.querySelector('#app') || document.body).innerText.replace(/\s+/g, ' ').slice(0, 140))));
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
