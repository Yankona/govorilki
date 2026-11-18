// The friend who listens (simple-day, phase 3): the friend in the corner, a tap, a phrase → the answer and the action.
// Speech recognition is stubbed (the phrase is set by the test), nothing real is heard. Four languages; the text field
// when the microphone is off. Invented children only (Тина 5).
// node tests/talk.js [base=http://localhost:8781/govorilki/] [phone|laptop] [langs=ru,en,pt,de]
const { chromium, devices } = require('playwright');
const path = require('path');
const BASE = process.argv[2] || 'http://localhost:8781/govorilki/', DEV = process.argv[3] || 'phone';
const LANGS = (process.argv[4] || 'ru,en,pt,de').split(',');
const SHOTS = path.join(__dirname, 'shots');
const HOOK = 'const fam = () => ROOT.families[ROOT.curFam] || null;';
const SUB = { ru: 'ru/', en: '', pt: 'pt/', de: 'de/' };
const SAY = {
  ru: { stars: 'сколько у меня звёзд', today: 'что сегодня', comic: 'хочу комикс', chess: 'открой шахматы', help: 'помоги' },
  en: { stars: 'how many stars do I have', today: 'what is today', comic: 'I want a comic', chess: 'open chess', help: 'help me' },
  pt: { stars: 'quantas estrelas tenho', today: 'o que há hoje', comic: 'quero banda desenhada', chess: 'abre o xadrez', help: 'ajuda' },
  de: { stars: 'wie viele Sterne habe ich', today: 'was ist heute', comic: 'ich will einen Comic', chess: 'öffne Schach', help: 'Hilfe' }
};
let bad = 0;
(async () => {
  const b = await chromium.launch();
  for (const lang of LANGS) {
    for (const mic of [true, false]) {
      const seed = { engine: 'device', micOff: !mic, srOff: !mic, parentPhone: true, cur: 'k1', curFam: 'f1',
        families: { f1: { id: 'f1', name: 'Т', cc: 'PT', kids: ['k1'], grands: [] } },
        profiles: { k1: { stars: 37, plays: {}, learn: {}, days: {}, book: { title: 'Т', log: {} }, settings: { focus: { sp: 'yes', subj: [] }, name: 'Тина', gender: 'f', track: 'r', age: 5, friend: 'kitty', onboarded: true, lang, likes: ['draw'] } } } };
      const c = await b.newContext(DEV === 'laptop' ? { viewport: { width: 1280, height: 800 } } : { ...devices['iPhone 13'], deviceScaleFactor: 1 });
      await c.route(/ntfy|wikipedia|huggingface|jsdelivr|youtube|wikimedia|workers\.dev/, r => r.abort());
      await c.route(u => /\/(ru|de|pt|en)?\/?(index\.html)?$/.test(u.pathname), async r => { const x = await r.fetch(); let t = await x.text(); t = t.replace(HOOK, HOOK + ' window.__T = { run: s => eval(s) };'); r.fulfill({ response: x, body: t }); });
      await c.addInitScript(s => {
        try { speechSynthesis.speak = u => setTimeout(() => u.onend && u.onend(), 5); } catch (e) {}
        // the stubbed recogniser: hears window.__SAY
        window.SpeechRecognition = class { start() { setTimeout(() => { this.onresult && this.onresult({ results: [[{ transcript: window.__SAY || '' }]] }); this.onend && this.onend(); }, 120); } abort() {} stop() {} };
        if (localStorage.getItem('seeded')) return; localStorage.setItem('seeded', 1); localStorage.setItem('govorilki-v2', JSON.stringify(s));
      }, seed);
      const p = await c.newPage(), errs = [], miss = [], tag = `${lang}/${mic ? 'mic' : 'text'}`;
      p.on('pageerror', e => errs.push(e.message));
      const run = s => p.evaluate(x => window.__T.run(x), s);
      const home = async () => { await run('goHome()'); await p.waitForTimeout(500); };
      await p.goto(BASE + SUB[lang]); await p.waitForTimeout(1500);
      const who = await p.$$('.who-kid'); if (who.length) { await who[0].click(); await p.waitForTimeout(900); }
      await home();
      // one wish: through the microphone (stub) or the text field
      const ask = async (phrase) => {
        if (!(await p.$('#tkFab'))) { miss.push(`${tag}: no friend in the corner`); return ''; }
        await p.evaluate(x => { window.__SAY = x; }, phrase);
        await p.click('#tkFab'); await p.waitForTimeout(400);
        if (mic) { await p.waitForTimeout(1200); }
        else { await p.fill('#tkIn', phrase); await p.press('#tkIn', 'Enter'); await p.waitForTimeout(600); }
        const t = await p.$eval('#tkSay', el => el.textContent).catch(() => '');
        return t;
      };
      const close = async () => { if (await p.$('#tkX')) { await p.click('#tkX'); await p.waitForTimeout(200); } };
      const S = SAY[lang];
      let r = await ask(S.stars); if (!r.includes('37')) miss.push(`${tag}: stars → «${r}»`); await close();
      const sp = await run('LS().speech.name');
      r = await ask(S.today); if (!r.includes(sp)) miss.push(`${tag}: today → «${r}» (no «${sp}»)`);
      await p.screenshot({ path: `${SHOTS}/talk-${lang}-${mic ? 'mic' : 'text'}-${DEV}.png` }); await close();
      r = await ask(S.help); if (!r) miss.push(`${tag}: help → nothing`); await close();
      // comics is today's door, the path is not done: it stays shut
      await run(`P.doorsToday = { d: dayKey(), ids: ['comics', 'art'], extra: [] }; P.days[dayKey()] = {}; save()`); await home();
      r = await ask(S.comic); await p.waitForTimeout(500);
      if (!(await p.$('#pdBox'))) miss.push(`${tag}: comic opened before the path`); await close();
      // the path done: the door opens
      await run(`P.days[dayKey()] = Object.fromEntries(SIMPLE.must().map(id => [id, 1])); save()`); await home();
      r = await ask(S.comic); await p.waitForTimeout(900);
      if (await p.$('#pdBox')) miss.push(`${tag}: comic did not open → «${r}»`);
      await home(); await close();
      // chess is not today: home stays, the friend says when
      const cn = await run(`SIMPLE.AREAS.find(a => a.id === 'chess').n`);
      r = await ask(S.chess); await p.waitForTimeout(500);
      if (!(await p.$('#pdBox')) || !r.includes(cn)) miss.push(`${tag}: chess → «${r}»`); await close();
      console.log(`${tag} ${DEV}: missing ${JSON.stringify(miss)} | errors ${JSON.stringify(errs)}`);
      if (errs.length || miss.length) bad++;
      await c.close();
    }
  }
  await b.close(); console.log(bad ? `FAIL in ${bad} run(s)` : 'OK: talk'); process.exit(bad ? 1 : 0);
})();
