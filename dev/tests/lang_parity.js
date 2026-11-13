// Language parity: every game a child sees in Russian is there in English, Portuguese and German too, unless it is
// Russian by nature (Russian letters, Russian sounds and grammar, Russian audio tales) — the list RU_ONLY below.
// Then every visible game is opened in every language: no page error, something on screen, no Russian text on screen
// or in the voice outside Russian, no horizontal scroll on a phone, one tap on an answer, and home works after.
// Invented children only (Тина 5 track r, Тим 9 track r, Тоша 9 track l).
// node tests/lang_parity.js [base] [phone|laptop]     env: LANGS=ru,en  ONLY=neuro,emo  QUICK=1 (parity only)
const { chromium, devices } = require('playwright');
const fs = require('fs'), D = require('path').join(__dirname, 'shots') + '/';
fs.mkdirSync(D, { recursive: true });
const BASE = process.argv[2] || 'http://localhost:8781/govorilki/', DEV = process.argv[3] || 'phone';
const HOOK = 'const fam = () => ROOT.families[ROOT.curFam] || null;';
const LANGS = Object.entries({ ru: 'ru/', en: '', pt: 'pt/', de: 'de/' }).filter(x => !process.env.LANGS || process.env.LANGS.includes(x[0]));
const KIDS = { young: ['Тина', 'f', 5, 'r'], older: ['Тим', 'm', 9, 'r'], mission: ['Тоша', 'm', 9, 'l'] };
// Russian by nature: they teach Russian letters, Russian sounds, Russian grammar or play Russian audio
const RU_ONLY = new Set(['primer', 'sz-sort', 'sz-syll', 'sz-house', 'speech-check', 'hear-pairs', 'syl-clap', 'syl-miss',
  'gram-many', 'gram-dim', 'gram-whose', 'gram-odd', 'gram-page', 'chist-all', 'twist-pen', 'r-motor', 'r-throat', 'tales', 'ml-phr', 'world-say', 'world-roles']);
// names of the invented children may be Cyrillic anywhere
const NAMES = /Тина|Тим|Тоша|Т\b/g;
// buttons that answer a round, the first one found is tapped
const ANSWER = '.opt, .lt-b, .num-b, .cmp-g, .lg-opt, .lg-pic, .lg-fb, .card, .chip, .og-btns .big, button.big';
const kid = (name, g, age, track, lang) => ({ stars: 5, plays: {}, learn: {}, book: { title: 'Т', log: {} }, settings: { name, gender: g, track, age, friend: 'kitty', onboarded: true, lang } });
let bad = 0; const fail = m => { console.log('  FAIL ' + m); bad++; };
async function open(b, lang, sub, k) {
  const seed = { engine: 'device', micOff: true, srOff: true, parentPhone: true, cur: 'k1', curFam: 'f1',
    families: { f1: { id: 'f1', name: 'Т', cc: 'PT', kids: ['k1'], grands: [] } }, profiles: { k1: kid(...k, lang) } };
  const c = await b.newContext(DEV === 'laptop' ? { viewport: { width: 1280, height: 800 } } : { ...devices['iPhone 13'], deviceScaleFactor: 1 });
  await c.route(/ntfy|wikipedia|huggingface|jsdelivr|youtube|wikimedia|workers\.dev/, r => r.abort());
  await c.route(u => /\/(ru|de|pt|en)?\/?(index\.html)?$/.test(u.pathname), async r => { const x = await r.fetch(); let t = await x.text(); t = t.replace(HOOK, HOOK + ' window.__T = { run: s => eval(s) };'); r.fulfill({ response: x, body: t }); });
  await c.addInitScript(s => { window.__said = []; try { speechSynthesis.speak = u => { window.__said.push(u.text); setTimeout(() => u.onend && u.onend(), 5); }; } catch (e) {} if (localStorage.getItem('seeded')) return; localStorage.setItem('seeded', 1); localStorage.setItem('govorilki-v2', JSON.stringify(s)); }, seed);
  const p = await c.newPage(); p.errs = [];
  p.on('pageerror', e => p.errs.push(e.message.slice(0, 160)));
  p.on('dialog', d => d.dismiss().catch(() => {}));
  await p.goto(BASE + sub); await p.waitForTimeout(1500);
  const w = await p.$$('.who-kid'); if (w.length) { await w[0].click(); await p.waitForTimeout(800); }
  p.run = s => p.evaluate(s => window.__T.run(s), s);
  return { c, p };
}
const visible = p => p.run(`(() => { const out = []; for (const t of HOME_TABS.filter(t => t.g)) for (const s of SECTIONS.filter(x => t.g.includes(x.g) && (x.g === 13 || modOnG(x.g)) && (!x.only || x.only === P.settings.track)))
  GAMES.filter(g => (g.grp === s.g || (g.also || []).includes(s.g)) && !g.inside && !(g.hide && g.hide()) && !gameOff(g.id) && !(g.place && !placeOn(g.place))).forEach(g => out.includes(g.id) || out.push(g.id));
  return out; })()`);
(async () => {
  const b = await chromium.launch(), seen = {};
  // 1. parity of the game lists
  for (const [who, k] of Object.entries(KIDS)) for (const [lang, sub] of LANGS) {
    const { c, p } = await open(b, lang, sub, k);
    seen[lang + '/' + who] = await visible(p);
    await c.close();
  }
  for (const who of Object.keys(KIDS)) {
    const ru = seen['ru/' + who] || [];
    for (const [lang] of LANGS.filter(x => x[0] !== 'ru')) {
      const x = seen[lang + '/' + who], miss = ru.filter(id => !x.includes(id) && !RU_ONLY.has(id)), leak = x.filter(id => RU_ONLY.has(id));
      console.log(`${who} ${lang}: ${x.length} games (ru ${ru.length})` + (miss.length ? ` missing ${miss}` : '') + (leak.length ? ` Russian-only shown ${leak}` : ''));
      if (miss.length) fail(`${lang}/${who}: games gone from this language: ${miss.join(' ')}`);
      if (leak.length) fail(`${lang}/${who}: Russian-only games shown: ${leak.join(' ')}`);
    }
  }
  if (process.env.QUICK) { await b.close(); console.log(bad ? `FAIL ${bad}` : 'OK: parity'); process.exit(bad ? 1 : 0); }
  // 2. every game opened in every language (younger and «Миссия Л» children: together they see every game)
  const report = {};
  for (const [lang, sub] of LANGS) for (const who of ['young', 'mission']) {
    const ids = seen[lang + '/' + who].filter(id => !process.env.ONLY || process.env.ONLY.split(',').includes(id));
    let ctx = await open(b, lang, sub, KIDS[who]);
    for (const id of ids) {
      if (who === 'mission' && seen[lang + '/young'].includes(id) && !process.env.ONLY) continue;   // already opened
      const { p } = ctx, e0 = p.errs.length;
      try {
        await p.run('window.__said.length = 0; goHome()'); await p.waitForTimeout(150);
        await p.run(`GAMES.find(g => g.id === '${id}').go()`); await p.waitForTimeout(1300);
        const st = await p.evaluate(() => {
          const app = document.querySelector('#app') || document.body, txt = app.innerText || '';
          return { txt, w: document.scrollingElement.scrollWidth, iw: innerWidth, btns: app.querySelectorAll('button').length };
        });
        const prob = [];
        if (st.txt.trim().length < 5 && st.btns < 2) prob.push('empty screen');
        if (DEV === 'phone' && st.w > st.iw + 2) prob.push(`horizontal scroll ${st.w}>${st.iw}`);
        const tap = await p.$(ANSWER);
        if (tap) { await tap.click({ timeout: 1500 }).catch(() => {}); await p.waitForTimeout(700); }
        const st2 = await p.evaluate(() => (document.querySelector('#app') || document.body).innerText || '');
        if (lang !== 'ru' || process.env.CHECKRU) {
          const cyr = [...new Set(((st.txt + '\n' + st2).replace(NAMES, '').match(/[А-Яа-яЁё][А-Яа-яЁё\- ]*/g) || []).map(s => s.trim()))].filter(s => s.length > 1);
          const voice = (await p.evaluate(() => window.__said.join(' | '))).replace(NAMES, '');
          const vcyr = [...new Set(voice.match(/[А-Яа-яЁё]{2,}[А-Яа-яЁё ]*/g) || [])];
          if (cyr.length) prob.push('Russian on screen: ' + cyr.slice(0, 6).join(' / '));
          if (vcyr.length) prob.push('Russian in the voice: ' + vcyr.slice(0, 4).join(' / '));
        }
        await p.run('goHome()'); await p.waitForTimeout(250);
        if (!(await p.$('.tb'))) prob.push('home did not come back');
        if (p.errs.length > e0) prob.push('page error: ' + p.errs.slice(e0).join(' / '));
        report[`${lang} ${id}`] = prob;
        if (prob.length) { fail(`${lang} ${id}: ${prob.join('; ')}`); await p.run(`GAMES.find(g => g.id === '${id}').go()`).catch(() => {}); await p.waitForTimeout(900); await p.screenshot({ path: D + `parity-${lang}-${id}-${DEV}.png` }).catch(() => {}); }
      } catch (e) {
        fail(`${lang} ${id}: ${e.message.slice(0, 160)}`);
        await ctx.c.close(); ctx = await open(b, lang, sub, KIDS[who]);
      }
    }
    await ctx.c.close();
    console.log(lang, who, 'opened', ids.length);
  }
  fs.writeFileSync(D + `lang_parity-${DEV}.json`, JSON.stringify({ seen, report }, null, 1));
  await b.close(); console.log(bad ? `FAIL ${bad}` : 'OK: every game in every language'); process.exit(bad ? 1 : 0);
})();
