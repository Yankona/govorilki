// «Тяни звук» in ru/en/pt/de: every sound of the language opens, its picture-words are said in that language, the voice
// says no Russian outside ru, the button held long enough finishes the game; Russian keeps its six sounds and no word row.
// Invented child only (Тина 5). node tests/stretch_intl.js [base] [phone|laptop]
const { chromium, devices } = require('playwright');
const fs = require('fs'), D = require('path').join(__dirname, 'shots') + '/';
fs.mkdirSync(D, { recursive: true });
const BASE = process.argv[2] || 'http://localhost:8781/govorilki/', DEV = process.argv[3] || 'phone';
const HOOK = 'const fam = () => ROOT.families[ROOT.curFam] || null;';
const WANT = { ru: ['С', 'З', 'Ш', 'Ж', 'Р', 'Л'], en: ['S', 'Z', 'SH', 'F', 'M', 'L', 'R', 'A'], pt: ['S', 'Z', 'CH', 'J', 'M', 'L', 'R', 'A'], de: ['S', 'SCH', 'F', 'W', 'M', 'L', 'R', 'A'] };
const CYR = /[А-Яа-яЁё]{2,}/g, NAMES = /Тина|Т\b/g;
let bad = 0; const fail = m => { console.log('  FAIL ' + m); bad++; };
(async () => {
  const b = await chromium.launch();
  for (const [lang, sub] of [['ru', 'ru/'], ['en', ''], ['pt', 'pt/'], ['de', 'de/']]) {
    const seed = { engine: 'device', micOff: true, srOff: true, parentPhone: true, cur: 'k1', curFam: 'f1', families: { f1: { id: 'f1', name: 'Т', cc: 'PT', kids: ['k1'], grands: [] } },
      profiles: { k1: { stars: 5, plays: {}, learn: {}, book: { title: 'Т', log: {} }, settings: { name: 'Тина', gender: 'f', track: 'r', age: 5, friend: 'kitty', onboarded: true, lang } } } };
    const c = await b.newContext(DEV === 'laptop' ? { viewport: { width: 1280, height: 800 } } : { ...devices['iPhone 13'], deviceScaleFactor: 1 });
    await c.route(/ntfy|wikipedia|huggingface|jsdelivr|youtube|wikimedia|workers\.dev/, r => r.abort());
    await c.route(u => /\/(ru|de|pt|en)?\/?(index\.html)?$/.test(u.pathname), async r => { const x = await r.fetch(); let t = await x.text(); t = t.replace(HOOK, HOOK + ' window.__T = { run: s => eval(s) };'); r.fulfill({ response: x, body: t }); });
    await c.addInitScript(s => { window.__said = []; try { speechSynthesis.speak = u => { window.__said.push(u.text); setTimeout(() => u.onend && u.onend(), 5); }; } catch (e) {} if (localStorage.getItem('seeded')) return; localStorage.setItem('seeded', 1); localStorage.setItem('govorilki-v2', JSON.stringify(s)); }, seed);
    const p = await c.newPage(), errs = [];
    p.on('pageerror', e => errs.push(e.message.slice(0, 160)));
    await p.goto(BASE + sub); await p.waitForTimeout(1500);
    const w = await p.$$('.who-kid'); if (w.length) { await w[0].click(); await p.waitForTimeout(800); }
    const run = s => p.evaluate(s => window.__T.run(s), s);
    const shown = await run(`(() => { const g = GAMES.find(g => g.id === 'snd-hold'); return !!g && !(g.hide && g.hide()); })()`);
    if (!shown) fail(`${lang}: the game is hidden`);
    await run(`GAMES.find(g => g.id === 'snd-hold').go()`); await p.waitForTimeout(1200);
    const chips = await p.$$eval('#lgS [data-s]', a => a.map(x => x.dataset.s));
    if (JSON.stringify(chips) !== JSON.stringify(WANT[lang])) fail(`${lang}: sounds ${chips} (want ${WANT[lang]})`);
    for (const L of chips) {
      await run(`window.__said.length = 0`);
      await p.click(`#lgS [data-s="${L}"]`).catch(() => {}); await p.waitForTimeout(700);
      const words = await p.$$eval('#lgW [data-w]', a => a.map(x => x.dataset.w));
      if (lang === 'ru' ? words.length : words.length !== 3) fail(`${lang} ${L}: words ${words}`);
      if (words.length) { await p.click('#lgW [data-w]'); await p.waitForTimeout(300); }
      const st = await p.evaluate(() => ({ txt: document.querySelector('#app').innerText, w: document.scrollingElement.scrollWidth, iw: innerWidth }));
      const said = await p.evaluate(() => window.__said.join(' | '));
      if (lang !== 'ru') {
        const sc = (st.txt.replace(NAMES, '').match(CYR) || []), vc = (said.replace(NAMES, '').match(CYR) || []);
        if (sc.length) fail(`${lang} ${L}: Russian on screen ${sc.slice(0, 4)}`);
        if (vc.length) fail(`${lang} ${L}: Russian in the voice ${vc.slice(0, 4)}`);
        if (/\b([a-z])\1\1/i.test(said)) fail(`${lang} ${L}: a spelled-out «sss» in the voice: ${said}`);
        if (words.length && !said.includes(words[0])) fail(`${lang} ${L}: the word ${words[0]} was not said`);
      }
      if (st.w > st.iw + 2) fail(`${lang} ${L}: horizontal scroll ${st.w}>${st.iw}`);
      if (L === chips[0]) { console.log(`${lang} ${L}: ${said.slice(0, 240)}`); await p.screenshot({ path: D + `stretch-${lang}-${DEV}.png` }); }
    }
    // hold the button until the goal: 5 s for a younger child
    await p.click(`#lgS [data-s="${chips[1]}"]`); await p.waitForTimeout(800);
    const bx = await (await p.$('#lgH')).boundingBox();
    await p.mouse.move(bx.x + bx.width / 2, bx.y + bx.height / 2); await p.mouse.down(); await p.waitForTimeout(7500); await p.mouse.up();
    await p.waitForTimeout(1500);
    const done = await p.evaluate(() => !!document.querySelector('.lg-scene.done') || /★|⭐/.test(document.querySelector('#app').innerText));
    if (!done) fail(`${lang}: holding the button did not finish`);
    await p.screenshot({ path: D + `stretch-${lang}-done-${DEV}.png` });
    if (errs.length) fail(`${lang}: page errors ${errs.join(' / ')}`);
    console.log(`${lang}: ${chips.length} sounds checked`);
    await c.close();
  }
  await b.close(); console.log(bad ? `FAIL ${bad}` : 'OK: stretch the sound in 4 languages'); process.exit(bad ? 1 : 0);
})();
