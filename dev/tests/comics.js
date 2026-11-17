// comics: «Комиксы» — reading and speech as a comic series. Invented children: Тоша 8 (reading step 5, sound Р, the
// phone hears: every bubble read aloud through a stub recogniser, the power phrase first said with Р as Л — «almost»
// with «Как сказать?» — then right), Тина 6 (step 2, no recognition: taps «Прочитала»). Checks: the level of the
// bubbles, the question, the branching choice, the card, one new episode a day (the next one opens the next day),
// «Сегодня» every other day, the own comic kept on this phone only (not in the synced data), three looks, no page errors.
// Usage: node tests/comics.js [base url] [phone|laptop]   (LANGS=ru,en to limit languages)
const { chromium, devices } = require('playwright');
const D = require('path').join(__dirname, 'shots') + '/';
require('fs').mkdirSync(D, { recursive: true });
const BASE = process.argv[2] || 'http://localhost:8781/govorilki/', DEV = process.argv[3] || 'phone';
const HOOK = 'const fam = () => ROOT.families[ROOT.curFam] || null;';
let bad = 0; const ok = (c, m) => { console.log((c ? '  ok  ' : '  FAIL ') + m); if (!c) bad++; };
const kid = (name, g, age, lang, lv, look) => ({ stars: 5, plays: {}, book: { title: 'Т', log: {} }, rskill: { [lang]: { lv } }, settings: { name, gender: g, track: 'r', age, friend: 'tiger', onboarded: true, lang, sounds: ['r'], look } });
const SLIP = { ru: s => s.replace(/р/g, 'л').replace(/Р/g, 'Л'), en: s => s.replace(/r/g, 'w').replace(/R/g, 'W'), pt: s => s.replace(/r/g, 'l').replace(/R/g, 'L'), de: s => s.replace(/r/g, 'l').replace(/R/g, 'L') };
(async () => {
  const b = await chromium.launch();
  const langs = [['ru', 'ru/'], ['en', ''], ['pt', 'pt/'], ['de', 'de/']].filter(x => !process.env.LANGS || process.env.LANGS.includes(x[0]));
  for (const [lang, path] of langs) {
    const kids = lang === 'ru' ? [['Тоша', 'm', 8, 5, true, 'bright'], ['Тина', 'f', 6, 2, false, 'calm'], ['Тим', 'm', 9, 8, false, 'dark']] : [['Тоша', 'm', 8, 5, true, 'bright']];
    for (const [name, g, age, lv, hears, look] of kids) {
      const tag = `${lang} ${name} ${age} (step ${lv}, ${look})`;
      console.log(tag, DEV);
      const fam = { engine: 'device', parentPhone: true, cur: 'k1', curFam: 'f1', families: { f1: { id: 'f1', name: 'Т', cc: 'PT', kids: ['k1'], grands: [] } }, profiles: { k1: kid(name, g, age, lang, lv, look) } };
      if (!hears) { fam.micOff = true; fam.srOff = true; } else { fam.srDef = 1; fam.srOff = false; }   // recognition on: the parents allowed it (in the EU it starts off)
      const c = await b.newContext(DEV === 'phone' ? { ...devices['iPhone 13'], deviceScaleFactor: 1 } : { viewport: { width: 1280, height: 800 } });
      await c.route(/ntfy|wikipedia|huggingface|jsdelivr|youtube|wikimedia|workers\.dev/, r => r.abort());
      await c.route(u => /\/(ru|de|pt|en)?\/?(index\.html)?$/.test(u.pathname), async r => { const x = await r.fetch(); let t = await x.text(); t = t.replace(HOOK, HOOK + ' window.__T = { run: s => eval(s) };'); r.fulfill({ response: x, body: t }); });
      await c.addInitScript(s => { window.__said = []; try { speechSynthesis.speak = u => { window.__said.push(u.text); setTimeout(() => u.onend && u.onend(), 5); }; } catch (e) {} if (localStorage.getItem('seeded')) return; localStorage.setItem('seeded', 1); localStorage.setItem('govorilki-v2', JSON.stringify(s)); }, fam);
      if (hears) await c.addInitScript(() => {
        window.__srs = [];
        navigator.mediaDevices.getUserMedia = async () => { const a = new AudioContext(), d = a.createMediaStreamDestination(), o = a.createOscillator(); o.connect(d); o.start(); return d.stream; };
        window.SpeechRecognition = window.webkitSpeechRecognition = class {
          constructor() { this.running = false; this.res = []; window.__srs.push(this); }
          start() { this.running = true; setTimeout(() => this.onstart && this.onstart(), 10); }
          abort() { if (this.running) { this.running = false; setTimeout(() => this.onend && this.onend(), 5); } }
          stop() { this.abort(); }
        };
        window.__say = t => { const r = [...window.__srs].reverse().find(x => x.running); if (!r) return false; const res = [{ transcript: t, confidence: .8 }]; res.isFinal = true; r.res.push(res); if (r.onresult) r.onresult({ resultIndex: r.res.length - 1, results: r.res }); r.stop(); return true; };
      });
      const p = await c.newPage(); const errs = []; p.on('pageerror', e => { errs.push(e.message); console.log('PAGEERR', e.stack.slice(0, 400)); });
      await p.goto(BASE + path); await p.waitForTimeout(1500);
      const who = await p.$$('.who-kid'); if (who.length) { await who[0].click(); await p.waitForTimeout(900); }
      const run = s => p.evaluate(s => window.__T.run(s), s);
      await run('GUARD.free = 1');
      // «Сегодня»: an even day is a comic day, an odd one is not
      const even = await run(`(() => { const n = dayNo(), e = n - n % 2; return [RSK.plan(e, 0).map(s => s.key).join(), RSK.plan(e + 1, 0).map(s => s.key).join()]; })()`);
      // little ones who don't read yet (≤6, reading step < 4: task little-ones) get no comic as their reading step
      const little = age <= 6 && lv < 4;
      ok(little ? even[0] !== 'comic' && even[1] !== 'comic' : even[0] === 'comic' && even[1] !== 'comic', `${tag}: «Сегодня» reading: even day «${even[0]}», odd day «${even[1]}»`);
      // the tile and the shelf
      await run('goHome()'); await p.waitForTimeout(500);
      ok(await run(`GAMES.some(g => g.id === 'comics' && !(g.hide && g.hide()))`), `${tag}: the game «Комиксы» is there`);
      await run(`GAMES.find(g => g.id === 'comics').go()`); await p.waitForSelector('.cx-ser', { timeout: 10000 }).catch(() => {});
      ok((await p.$$('.cx-ser:not(.cx-mine)')).length === 4, `${tag}: 4 series on the shelf`);
      ok((await p.$$('.cx-e.new')).length === 4 && (await p.$$('.cx-e.lock')).length === 20, `${tag}: episode 1 of each open, the rest locked`);
      const L = await run('COMIX.lvIdx()');
      ok(L === (lv <= 3 ? 0 : lv <= 6 ? 1 : 2), `${tag}: bubble level ${L} for step ${lv}`);
      // an episode
      await p.click('.cx-e.new[data-s="foot"]', { force: true }); await p.waitForSelector('.cx-pan', { timeout: 8000 });
      const q = await run(`COMIC_EPS.foot.eps[0].q[${L}]`);
      let slipDone = false, slipSeen = false, howSeen = false, aloud = 0, shot = false, chose = false;
      for (let i = 0; i < 200; i++) {
        await p.waitForTimeout(150);
        if (await p.$('.winbox:not(.cx-win)')) break;
        const card = await p.$('.cx-win [data-a="ok"]'); if (card) { if (lang === 'ru' && name === 'Тоша') await p.screenshot({ path: D + `comics-card-${DEV}.png` }); await card.click(); continue; }
        const choice = await p.$('.cx-choice .cx-o'); if (choice) { await choice.click(); chose = true; continue; }
        const opt = await p.$$('.cx-q:not(.cx-choice) .cx-o:not([disabled])');
        if (opt.length) { await p.evaluate(a => { const o = [...document.querySelectorAll('.cx-q .cx-o')].find(x => x.dataset.v === a); o.click(); }, q[1]); continue; }
        const cur = await p.$('.cx-pan.cur');
        if (cur && !shot && (await p.$$('.cx-pan')).length >= 3 && lang === 'ru') { shot = true; await p.screenshot({ path: D + `comics-page-L${L}-${name}-${DEV}.png`, fullPage: false }); }
        const mic = await p.$('#cxMic:not([disabled]):not([hidden])');
        if (mic && hears) {
          const pw = await p.$('.cx-pan.cur.pw'), text = await p.$eval('.cx-pan.cur', e => (e.querySelector('.cx-bub span') || e.querySelector('.cx-cap')).textContent);
          await mic.click();
          for (let k = 0; k < 30 && !(await p.evaluate(() => window.__srs.some(r => r.running))); k++) await p.waitForTimeout(100);
          if (pw && !slipDone) { slipDone = true; await p.evaluate(t => window.__say(t), SLIP[lang](text)); await p.waitForTimeout(700); slipSeen = /Почти|Almost|Quase|Fast/i.test(await p.$eval('#cxHeard', e => e.textContent).catch(() => '')); howSeen = !!(await p.$('#cxHow')); await p.waitForTimeout(600); continue; }
          await p.evaluate(t => window.__say(t), text); aloud++; await p.waitForTimeout(300); continue;
        }
        const done = await p.$('#cxDone:not([hidden])'); if (done && !hears) { await done.click(); continue; }
      }
      ok(!!(await p.$('.winbox')), `${tag}: the episode ends with the result`);
      ok(chose, `${tag}: a choice of two`);
      if (hears) { ok(aloud >= 4, `${tag}: bubbles read aloud (${aloud})`); ok(slipSeen && howSeen, `${tag}: Р said as Л in the power phrase is «almost», with «Как сказать?»`); }
      const st = await run(`[COMIX.ser('foot').n, COMIX.ST().day === dayKey(), COMIX.state('foot', 1), COMIX.ST().cards.join(), COMIX.ser('foot').ch[0], COMIX.state('space', 0)]`);
      ok(st[0] === 1 && st[1] && st[2] === 'soon' && st[3] === 'foot:0' && st[4] === 0 && st[5] === 'soon', `${tag}: episode read, the card, the choice kept, the next ones wait for tomorrow ${JSON.stringify(st)}`);
      // the next day
      await run(`COMIX.ST().day = 'x'; save(); COMIX.shelf()`); await p.waitForTimeout(600);
      ok(await run(`COMIX.state('foot', 1)`) === 'new', `${tag}: the next day episode 2 opens`);
      ok(!!(await p.$('.cx-e.done[data-s="foot"][data-k="0"]')), `${tag}: episode 1 on the shelf to reread`);
      if (lang === 'ru') await p.screenshot({ path: D + `comics-shelf-${name}-${DEV}.png`, fullPage: true });
      const wide = await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1); ok(wide, `${tag}: no sideways scroll`);
      // the own comic
      if (lang === 'ru' || DEV === 'phone') {
        await run('COMIX.create()'); await p.waitForSelector('#cxX');
        await p.click('[data-bg="mars"]'); await p.click('.cx-hb:not(.on)');
        await p.fill('#cxX', 'Привет с Марса!'); await p.fill('#cxT', 'Мой Марс');
        await p.click('#cxSave'); await p.waitForTimeout(1300);
        const own = await run(`[COMIX.ownList().length, COMIX.ownList()[0].p[0].x, JSON.stringify(ROOT).includes('Привет с Марса')]`);
        ok(own[0] === 1 && own[1] === 'Привет с Марса!' && !own[2], `${tag}: own comic saved on the phone, not in the synced data ${JSON.stringify(own)}`);
        if (lang === 'ru' && name === 'Тоша') await p.screenshot({ path: D + `comics-own-${DEV}.png` });
      }
      ok(!errs.length, `${tag}: no page errors ` + errs.join(' | '));
      await c.close();
    }
  }
  await b.close();
  console.log(bad ? `FAILED ${bad}` : 'ALL OK'); process.exit(bad ? 1 : 0);
})();
