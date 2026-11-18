// Journey stories in every language (task audit-seo-i18n): every story of i18n/stories/<section>.json (Кашкайш, Лиссабон,
// Порту, Португалия, Петербург, Россия, Космос) is in LEARN[section] of en/pt/de; the section screen lists them; a new
// story opens with its text (from the data pack) in that language, no Cyrillic on screen; no page errors. Phone.
// node tests/journeys_i18n.js [base]
const { chromium, devices } = require('playwright');
const fs = require('fs'), path = require('path');
const BASE = process.argv[2] || 'http://localhost:8781/govorilki/', SUB = { ru: 'ru/', en: '', pt: 'pt/', de: 'de/' };
const HOOK = 'const fam = () => ROOT.families[ROOT.curFam] || null;';
const SECS = ['cascais', 'lisbon', 'porto', 'pt', 'spb', 'russia', 'space'];
const TR = Object.fromEntries(SECS.map(k => [k, JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'i18n', 'stories', k + '.json'), 'utf8'))]));
const seed = lang => ({ engine: 'device', micOff: true, srOff: true, parentPhone: true, cur: 'k1', curFam: 'f1', families: { f1: { id: 'f1', name: 'Т', cc: 'PT', kids: ['k1'], grands: [] } },
  profiles: { k1: { stars: 5, plays: {}, learn: {}, book: { title: 'Т', log: {} }, settings: { name: 'Тина', gender: 'f', track: 'r', age: 6, friend: 'kitty', onboarded: true, lang } } } });
let bad = 0; const fail = m => { bad++; console.log('  FAIL ' + m); };
(async () => {
  fs.mkdirSync(path.join(__dirname, 'shots'), { recursive: true });
  const b = await chromium.launch();
  for (const lang of ['en', 'pt', 'de', 'ru']) {
    const c = await b.newContext({ ...devices['iPhone 13'], deviceScaleFactor: 1 });
    await c.route(/ntfy|wikipedia|huggingface|jsdelivr|youtube|wikimedia|workers\.dev/, r => r.abort());
    await c.route(u => /\/(ru|de|pt|en)?\/?(index\.html)?$/.test(u.pathname), async r => { const x = await r.fetch(); let t = await x.text(); t = t.replace(HOOK, HOOK + ' window.__T = { run: s => eval(s) };'); r.fulfill({ response: x, body: t }); });
    await c.addInitScript(s => { try { speechSynthesis.speak = u => setTimeout(() => u.onend && u.onend(), 5); } catch (e) {} if (localStorage.getItem('seeded')) return; localStorage.setItem('seeded', 1); localStorage.setItem('govorilki-v2', JSON.stringify(s)); }, seed(lang));
    const p = await c.newPage(), errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto(BASE + SUB[lang]); await p.waitForTimeout(1500);
    const who = await p.$$('.who-kid'); if (who.length) { await who[0].tap(); await p.waitForTimeout(800); }
    const R = s => p.evaluate(x => window.__T.run(x), s);
    const have = await R(`Object.fromEntries(${JSON.stringify(SECS)}.map(k => [k, (LEARN[k] ? LEARN[k].items : []).map(x => x.id)]))`);
    const line = [];
    for (const k of SECS) {
      if (lang !== 'ru') { const miss = TR[k].filter(x => !have[k].includes(x.id)).map(x => x.id); if (miss.length) fail(`${lang} ${k}: missing ${miss.length} (${miss.slice(0, 3)})`); }
      line.push(`${k} ${have[k].length}`);
    }
    // the section screen and the last translated story of Петербург
    await R(`screenLearn('spb')`); await p.waitForTimeout(700);
    const cards = await p.$$eval('.story-c', x => x.length); if (cards < 40) fail(`${lang}: spb screen shows ${cards} stories`);
    const it = TR.spb[TR.spb.length - 1], i = await R(`learnItems('spb').findIndex(x => x.id === '${it.id}')`);
    if (i < 0) fail(`${lang}: ${it.id} not in learnItems`);
    await R(`screenStory('spb', ${i})`); await p.waitForTimeout(1500);
    const txt = await p.evaluate(() => document.body.innerText);
    if (lang !== 'ru') {
      if (!txt.includes(it[lang].s.slice(0, 40))) fail(`${lang}: story ${it.id} text not on screen`);
      const cy = (txt.replace(/Тина|Тим|Тоша|\bТ\b/g, '').match(/[А-Яа-яЁё]{2,}/g) || []); if (cy.length) fail(`${lang}: Cyrillic on the story screen: ${cy.slice(0, 5)}`);
    }
    const sw = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth); if (sw > 0) fail(`${lang}: horizontal scroll ${sw}`);
    await p.screenshot({ path: path.join(__dirname, 'shots', `journeys-${lang}-spb.png`) });
    if (errs.length) fail(`${lang}: errors ${errs}`);
    console.log(lang, line.join(' | '), '| spb cards', cards, '| errors', errs.length);
    await c.close();
  }
  await b.close(); console.log(bad ? 'FAILED ' + bad : 'OK: journeys_i18n'); process.exit(bad ? 1 : 0);
})();
