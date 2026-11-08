// voice-fix: every line the friend says (and the text on screen) has no backslash, slash or markup that a voice would
// read aloud («бэкслэш», «слэш»); a new family speaks with Piper «Руслан». Crawls every game of GAMES, every LEARN
// section, the journey, ballet, space, ocean, how, body, art, chess school, and taps buttons in each.
// 4 languages. Usage: node tests/voice_fix.js [base url] [phone|laptop] [ru|en|pt|de|all] [quick: no crawl]
const { chromium, devices } = require('playwright');
const BASE = process.argv[2] || 'http://localhost:8781/govorilki/', DEV = process.argv[3] || 'phone';
const HOOK = 'const fam = () => ROOT.families[ROOT.curFam] || null;';
const kid = (name, g, age, fr, lang, track = 'r') => ({ stars: 5, plays: {}, learn: {}, book: { title: 'Т', log: {} }, settings: { name, gender: g, track, age, friend: fr, onboarded: true, lang } });
// what a voice would read as a symbol: backslash, slash, markup, braces, underscores, stray escapes
const BAD = /[\\/<>{}\[\]_|~^=*#@$]|&[a-z]+;|\bundefined\b|\bnull\b|\bNaN\b|\[object/;
let bad = 0; const ok = (c, m) => { console.log((c ? '  ok  ' : '  FAIL ') + m); if (!c) bad++; };
(async () => {
  const b = await chromium.launch();
  for (const [lang, sub] of [['ru', 'ru/'], ['en', ''], ['pt', 'pt/'], ['de', 'de/']].filter(x => !process.argv[4] || process.argv[4] === 'all' || process.argv[4] === x[0])) {
    console.log(lang, DEV);
    // a new family (no voice chosen) and a family whose saved choice is empty, on a phone with mobile data: the app's
    // voice (Руслан for Russian) speaks; the phone's voice only if the family chose it
    for (const [what, extra] of [['new family', {}], ['empty choice, mobile data', { piperVoice: '', engine: '' }], ['chose the phone', { engine: 'device' }]]) {
      const c0 = await b.newContext({ ...devices['iPhone 13'], deviceScaleFactor: 1 });
      await c0.route(/ntfy|wikipedia|huggingface|jsdelivr|youtube|wikimedia|workers\.dev/, r => r.abort());
      await c0.route(u => /\/(ru|de|pt|en)?\/?(index\.html)?$/.test(u.pathname), async r => { const x = await r.fetch(); let t = await x.text(); t = t.replace(HOOK, HOOK + ' window.__T = { run: s => eval(s) };'); r.fulfill({ response: x, body: t }); });
      const seed = { micOff: true, srOff: true, parentPhone: true, cur: 'k1', curFam: 'f1', families: { f1: { id: 'f1', name: 'Т', cc: 'PT', kids: ['k1'], grands: [] } }, profiles: { k1: kid('Тина', 'f', 6, 'kitty', lang) }, ...extra };
      await c0.addInitScript(s => { window.__said = []; try { Object.defineProperty(navigator, 'connection', { value: { type: 'cellular', saveData: false } }); } catch (e) {} try { speechSynthesis.speak = u => { window.__said.push(u.text); setTimeout(() => u.onend && u.onend(), 5); }; } catch (e) {} localStorage.setItem('govorilki-v2', JSON.stringify(s)); }, seed);
      const q = await c0.newPage(); await q.goto(BASE + sub); await q.waitForTimeout(1200);
      const r = await q.evaluate(() => window.__T.run(`(async () => { window.__piper = []; PIPER.isReady = true; piperAudio = async t => { window.__piper.push(piperVoice() + ': ' + t); throw new Error('test'); };
        await say('Привет! Как дела?'); return { eng: engineNow(), voice: piperVoice(), on: piperOn(), piper: window.__piper.length, phone: window.__said.length }; })()`));
      const want = { ru: 'ru_RU-ruslan-medium', en: 'en_GB-jenny_dioco-medium', pt: 'pt_PT-tugão-medium', de: 'de_DE-thorsten-medium' }[lang];
      if (extra.engine === 'device') ok(r.eng === 'device' && r.piper === 0 && r.phone > 0, `${what}: the phone's voice, as chosen ${JSON.stringify(r)}`);
      else ok(r.eng === 'piper' && r.on && r.voice === want && r.piper > 0, `${what}: speaks with ${r.voice} ${JSON.stringify(r)}`);
      await c0.close();
    }
    const fam = { engine: 'device', micOff: true, srOff: true, parentPhone: true, cur: 'k1', curFam: 'f1', families: { f1: { id: 'f1', name: 'Т', cc: 'PT', kids: ['k1', 'k2'], grands: [] } }, profiles: { k1: kid('Тина', 'f', 6, 'kitty', lang), k2: kid('Тоша', 'm', 8, 'tiger', lang, 'l') } };
    const c = await b.newContext(DEV === 'phone' ? { ...devices['iPhone 13'], deviceScaleFactor: 1 } : { viewport: { width: 1280, height: 800 } });
    await c.route(/ntfy|wikipedia|huggingface|jsdelivr|youtube|wikimedia|workers\.dev/, r => r.abort());
    await c.route(u => /\/(ru|de|pt|en)?\/?(index\.html)?$/.test(u.pathname), async r => { const x = await r.fetch(); let t = await x.text();
      // every text that goes to a voice passes sayParts (ElevenLabs, Piper, the phone's voice)
      t = t.replace(HOOK, HOOK + ' window.__T = { run: s => eval(s) }; { const sp0 = sayParts; sayParts = t => { const r = sp0(t); window.__parts.push(...r); return r; }; }');
      r.fulfill({ response: x, body: t }); });
    await c.addInitScript(s => { window.__said = []; window.__parts = []; window.__blFast = 1; try { speechSynthesis.speak = u => { window.__said.push(u.text); setTimeout(() => u.onend && u.onend(), 5); }; } catch (e) {} if (localStorage.getItem('seeded')) return; localStorage.setItem('seeded', 1); localStorage.setItem('govorilki-v2', JSON.stringify(s)); }, fam);
    const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
    p.on('dialog', d => d.dismiss().catch(() => {}));
    const run = s => p.evaluate(s => window.__T.run(s), s);
    await p.goto(BASE + sub); await p.waitForTimeout(1500);
    const who = await p.$$('.who-kid'); if (who.length) { await who[0].click(); await p.waitForTimeout(800); }
    // texts from outside (Wikipedia summaries with formulas, tags, footnotes) reach the voice clean
    const wk = await run(`sayParts('Вода {\\\\displaystyle {\\\\ce {H2O}}} — вещество.[1] Кошка и/или <b>кот</b>&nbsp;дома. A\\\\B_c.').join(' ¦ ')`);
    ok(!BAD.test(wk) && wk.replace(/\u0301/g, '').includes('вещество'), 'Wikipedia-like text said clean: ' + wk);
    if (process.argv[5] === 'quick') { await c.close(); continue; }
    const badSeen = new Map(), screenBad = new Map(), heard = new Set();
    const note = where => p.evaluate(() => { const x = [...window.__parts, ...window.__said]; window.__parts = []; window.__said = []; return { x, body: document.body.innerText }; }).then(({ x, body }) => {
      x.forEach(t => heard.add(t)); x.forEach(t => { if (BAD.test(t) && !badSeen.has(t)) { badSeen.set(t, where); console.log(`    said [${where}] ${t.slice(0, 160)}`); } });
      body.split('\n').forEach(l => { if (/\\|\bundefined\b|\[object|&[a-z]+;/.test(l) && !screenBad.has(l)) screenBad.set(l, where); });
    }).catch(() => {});
    // taps buttons inside the page (fast): the n-th visible one in a fixed order
    const tap = async (where, n) => {
      for (let i = 0; i < n; i++) {
        const hit = await p.evaluate(i => { const vis = [...document.querySelectorAll('#app button:not(.g-back):not(.back):not(.ibtn), #app .chip, #app [data-k]')].filter(x => x.offsetParent && !x.disabled);
          if (!vis.length) return false; vis[(i * 7 + 3) % vis.length].click(); return true; }, i).catch(() => false);
        if (!hit) break;
        await p.waitForTimeout(250); await note(where);
      }
    };
    const visit = async (where, js, n = 6) => {
      await run('hush(); goHome()').catch(() => {}); await p.waitForTimeout(200);
      try { await run(js); } catch (e) { return; }
      await p.waitForTimeout(500); await note(where);
      // «Прочитать кнопки» (children up to 6): the friend reads the words on the buttons
      const rb = () => p.evaluate(() => { const b = document.querySelector('#readBtns'); if (b) b.click(); return !!b; }).catch(() => false);
      if (await rb()) { await p.waitForTimeout(400); await note(where + ' (кнопки)'); }
      await tap(where, n);
      if (await rb()) { await p.waitForTimeout(400); await note(where + ' (кнопки)'); }
    };
    const games = await run('GAMES.map(g => g.id)');
    for (const id of games) await visit('game ' + id, `GAMES.find(g => g.id === '${id}').go()`, 5);
    const learn = await run('Object.keys(LEARN)');
    for (const k of learn) await visit('learn ' + k, `screenLearn('${k}')`, 8);
    for (const js of ['TRAVEL.screen()', 'TRAVEL.quiz()', 'BALLET.hub()', 'BALLET.tales()', 'BALLET.quiz()', 'BALLET.repeat()', "BALLET.screen('feet')", 'SPACE.screen()', 'OCEAN.deep()', 'OCEAN.cycle()', 'HOW.menu()', 'BODY.screen()', 'CHS.school()', 'screenMuseum()', 'screenArticMenu()', 'screenArtic(0)', 'GLOBE_SCREEN.screen()'])
      await visit(js, js, 10);
    ok(heard.size > 300, `${heard.size} different spoken lines heard`);
    ok(badSeen.size === 0, 'spoken lines without \\ / or markup' + [...badSeen].slice(0, 25).map(([t, w]) => `\n        [${w}] ${t.slice(0, 160)}`).join(''));
    ok(screenBad.size === 0, 'screen text without \\ or undefined' + [...screenBad].slice(0, 10).map(([t, w]) => `\n        [${w}] ${t.slice(0, 160)}`).join(''));
    ok(!errs.length, 'no page errors ' + JSON.stringify(errs.slice(0, 3)));
    await c.close();
  }
  await b.close(); console.log(bad ? `FAIL: ${bad}` : 'OK'); process.exit(bad ? 1 : 0);
})();
