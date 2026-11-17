// comics-me: «Мой комикс» — the child is the hero of comics built from what the child loves. Invented children:
// Тоша 8 (likes football and space, long time in chess in the journal, a hard puzzle yesterday; reads aloud through a
// stub recogniser) → stories in football/space with a chess beat and the puzzle cameo; Тина 6 (likes ballet and
// animals, no recognition, reading step 2) → ballet/animals. Checks: the interest profile from the journal (on the
// phone only, not in the synced data), the hero editor (power, costume), an episode with the name and no placeholders
// left, reading first («Послушать» only for the little readers or after a try), the choice remembered by the next
// episode, one new episode a day, «Ваши данные» shows and forgets the interests, no page errors.
// Usage: node tests/comics_me.js [base url] [phone|laptop]   (LANGS=ru,en …)
const { chromium, devices } = require('playwright');
const D = require('path').join(__dirname, 'shots') + '/';
require('fs').mkdirSync(D, { recursive: true });
const BASE = process.argv[2] || 'http://localhost:8781/govorilki/', DEV = process.argv[3] || 'phone';
const HOOK = 'const fam = () => ROOT.families[ROOT.curFam] || null;';
let bad = 0; const ok = (c, m) => { console.log((c ? '  ok  ' : '  FAIL ') + m); if (!c) bad++; };
const kid = (name, g, age, lang, lv, look, likes) => ({ stars: 5, plays: {}, book: { title: 'Т', log: {} }, rskill: { [lang]: { lv } }, settings: { name, gender: g, track: 'r', age, friend: 'tiger', onboarded: true, lang, sounds: ['r'], look, likes } });
(async () => {
  const b = await chromium.launch();
  const langs = [['ru', 'ru/'], ['en', ''], ['pt', 'pt/'], ['de', 'de/']].filter(x => !process.env.LANGS || process.env.LANGS.includes(x[0]));
  for (const [lang, path] of langs) {
    const kids = lang === 'ru' ? [['Тоша', 'm', 8, 5, true, 'bright', ['football', 'space']], ['Тина', 'f', 6, 2, false, 'calm', ['ballet', 'animals']], ['Тим', 'm', 9, 8, false, 'dark', ['dino']]]
      : [['Тоша', 'm', 8, 5, true, 'bright', ['football', 'space']], ['Тина', 'f', 6, 2, false, 'calm', ['ballet', 'animals']]];
    for (const [name, g, age, lv, hears, look, likes] of kids) {
      const tag = `${lang} ${name} ${age} (step ${lv}, ${look})`;
      console.log(tag, DEV);
      const fam = { engine: 'device', parentPhone: true, cur: 'k1', curFam: 'f1', families: { f1: { id: 'f1', name: 'Т', cc: 'RU', kids: ['k1'], grands: [] } }, profiles: { k1: kid(name, g, age, lang, lv, look, likes) } };
      if (!hears) { fam.micOff = true; fam.srOff = true; } else { fam.srDef = 1; fam.srOff = false; }
      // the journal: Тоша spent long in chess in the last days and solved a hard puzzle yesterday
      const m = Math.floor(Date.now() / 6e4), ev = [];
      if (name === 'Тоша') { for (let i = 1; i <= 6; i++) ev.push([m - i * 600, 'pc', 'k1', 'game:chess', 0, 1100]); ev.push([m - 900, 'ge', 'k1', 'olymp-day', 3, 300]); }
      if (name === 'Тина') { ev.push([m - 500, 'pc', 'k1', 'game:ballet', 0, 900]); ev.push([m - 400, 'ge', 'k1', 'draw', 3, 300]); }
      const c = await b.newContext(DEV === 'phone' ? { ...devices['iPhone 13'], deviceScaleFactor: 1 } : { viewport: { width: 1280, height: 800 } });
      await c.route(/ntfy|wikipedia|huggingface|jsdelivr|youtube|wikimedia|workers\.dev/, r => r.abort());
      await c.route(u => /\/(ru|de|pt|en)?\/?(index\.html)?$/.test(u.pathname), async r => { const x = await r.fetch(); let t = await x.text(); t = t.replace(HOOK, HOOK + ' window.__T = { run: s => eval(s) };'); r.fulfill({ response: x, body: t }); });
      await c.addInitScript(([s, ev]) => { window.__said = []; try { speechSynthesis.speak = u => { window.__said.push(u.text); setTimeout(() => u.onend && u.onend(), 5); }; } catch (e) {} if (localStorage.getItem('seeded')) return; localStorage.setItem('seeded', 1); localStorage.setItem('govorilki-v2', JSON.stringify(s)); localStorage.setItem('govorilki-ev', JSON.stringify(ev)); }, [fam, ev]);
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
      // the shelf loads the data; the interest profile
      await run('COMIX.shelf()'); await p.waitForSelector('.cx-mine', { timeout: 10000 }).catch(() => {});
      ok(!!(await p.$('.cx-mine')), `${tag}: «Мой комикс» on the shelf`);
      const top = await run('COMIX.profile(true).top');
      if (name === 'Тоша') ok(top.includes('football') && top.includes('space') && top.includes('chess'), `${tag}: interests football, space and chess (time in the journal): ${top}`);
      if (name === 'Тина') ok(top[0] === 'ballet' || top[0] === 'animals', `${tag}: interests ballet / animals: ${top}`);
      const priv = await run(`[JSON.stringify(ROOT).includes('"top"'), !!localStorage.getItem('govorilki-me:k1')]`);
      ok(!priv[0] && priv[1], `${tag}: the interests only in this phone's storage, not in the synced data`);
      // the hero: the first time the editor
      await p.click('#cxMeNew'); await p.waitForSelector('.cx-pw', { timeout: 6000 }).catch(() => {});
      ok(!!(await p.$('.cx-pw')), `${tag}: the hero editor first`);
      await p.click('.cx-pw[data-pw="draw"]'); await p.click('[data-k="su"] .cx-sw[data-v="1"]'); await p.click('[data-k="hs"] .cx-sw[data-v="curly"]');
      if (lang === 'ru' && name === 'Тоша') await p.screenshot({ path: D + `comics-me-hero-${DEV}.png` });
      await p.click('#cxHeroOk'); await p.waitForSelector('.cx-pan', { timeout: 8000 }).catch(() => {});
      const hero = await run(`JSON.stringify(P.comics.me)`); ok(/"pw":"draw"/.test(hero) && /"hs":"curly"/.test(hero), `${tag}: the hero kept: ${hero}`);
      // the first episode
      const L = await run('COMIX.lvIdx()');
      await p.waitForSelector('#cxDone', { timeout: 6000 }).catch(() => {});
      const hearShown = await p.$eval('#cxHear', e => !e.hidden).catch(() => null);
      ok(L === 0 ? hearShown === true : hearShown === false, `${tag}: reading first — «Послушать» ${L === 0 ? 'shown for a little reader' : 'hidden before a try'} (L${L})`);
      const arc0 = await run('JSON.stringify(COMIX.meLoad().arc)');
      const drive = async (shotName) => {
        let shot = false;
        for (let i = 0; i < 260; i++) {
          await p.waitForTimeout(140);
          if (await p.$('.winbox')) break;
          const choice = await p.$('.cx-choice .cx-o'); if (choice) { await choice.click(); continue; }
          const opt = await p.$$('.cx-q:not(.cx-choice) .cx-o:not([disabled])');
          if (opt.length) { for (const o of opt) { await o.click(); await p.waitForTimeout(250); if (!(await p.$('.cx-q:not(.cx-choice) .cx-o:not([disabled])'))) break; if (await p.$('.cx-o.right')) break; } continue; }
          if (shotName && !shot && (await p.$$('.cx-pan')).length >= 5) { shot = true; await p.screenshot({ path: D + shotName, fullPage: false }); }
          const mic = await p.$('#cxMic:not([disabled]):not([hidden])');
          if (mic && hears) {
            const text = await p.$eval('.cx-pan.cur', e => (e.querySelector('.cx-bub span') || e.querySelector('.cx-cap')).textContent).catch(() => '');
            await mic.click();
            for (let k = 0; k < 30 && !(await p.evaluate(() => window.__srs.some(r => r.running))); k++) await p.waitForTimeout(100);
            await p.evaluate(t => window.__say(t), text); await p.waitForTimeout(250); continue;
          }
          const done = await p.$('#cxDone:not([hidden])'); if (done) { await done.click(); continue; }
        }
      };
      await drive(lang === 'ru' ? `comics-me-page-${name}-${DEV}.png` : '');
      ok(!!(await p.$('.winbox')), `${tag}: episode 1 ends with the result`);
      const txt = await p.$eval('#cxPage', e => e.innerText).catch(() => '');
      ok(!/[{}]/.test(txt), `${tag}: no placeholders left`);
      ok(txt.includes(name) || L === 0, `${tag}: the child's name in the story`);
      const a = JSON.parse(arc0), heroes = await p.$$eval('#cxPage .cx-ch', es => es.map(e => e.dataset.w));
      ok(heroes.includes('kid') && heroes.includes('me'), `${tag}: the child hero and the friend in the panels`);
      if (name === 'Тоша') ok(['football', 'space'].includes(a.w) && a.g === 'chess', `${tag}: a story in ${a.w}, the chess beat comes in episode 2 (${a.g})`);
      if (name === 'Тоша') ok(/задач|puzzle|problema|Aufgabe|Rätsel/i.test(txt), `${tag}: yesterday's hard puzzle helps today`);
      if (name === 'Тина') ok(['ballet', 'animals'].includes(a.w), `${tag}: a story in ${a.w}`);
      const st = await run(`(() => { const o = COMIX.meLoad(); return [o.arc.k, o.arc.ch[0], o.day === dayKey(), (o.hist || []).length, COMIX.meFresh()]; })()`);
      ok(st[0] === 1 && st[1] === 0 && st[2] && st[3] === 1 && !st[4], `${tag}: episode 1 read, the choice kept, the next one tomorrow ${JSON.stringify(st)}`);
      // the next day: episode 2 remembers the choice
      await run(`(() => { const o = COMIX.meLoad(); o.day = 'x'; COMIX.meSave(o); COMIX.meEpisode(); })()`); await p.waitForSelector('.cx-pan', { timeout: 6000 });
      const first = await p.$eval('.cx-pan', e => e.querySelector('.cx-cap') ? e.querySelector('.cx-cap').textContent : '');
      const rec = await run(`(() => { const o = COMIX.meLoad(), pl = COMIC_ME.plots.find(x => x.id === o.arc.p); return pl.eps[1].rec[0][COMIX.lvIdx()]; })()`);
      const recHead = rec.replace(/\{[^}]*\}/g, '').trim().split(/\s+/).slice(0, 2).join(' ');
      ok(first && first.includes(recHead), `${tag}: episode 2 remembers the choice: «${first.slice(0, 60)}»`);
      await drive('');
      ok(await run('COMIX.meLoad().arc.k') === 2, `${tag}: episode 2 read`);
      if (name === 'Тоша') ok((await p.$$eval('#cxPage .cx-ch', es => es.map(e => e.dataset.w))).includes('sova'), `${tag}: episode 2 — the chess owl visits the football story`);
      // «Ваши данные»: the interests and «Забыть»
      if (lang === 'ru' || name === 'Тоша') {
        await run('screenParents()'); await p.waitForTimeout(700);
        await run(`(document.querySelector('#dataSec') || document.body).scrollIntoView()`);
        const row = await p.$('[data-meclr="k1"]');
        ok(!!row, `${tag}: «Ваши данные» shows the comic's interests`);
        if (lang === 'ru' && name === 'Тоша') await p.screenshot({ path: D + `comics-me-data-${DEV}.png` });
        if (row) { await row.evaluate(e => e.click()); await p.waitForTimeout(300); }
        const cl = await run(`(() => { const o = COMIX.meLoad(); return [!o.prof, !!o.since]; })()`);
        ok(cl[0] && cl[1], `${tag}: «Забыть» clears the interests`);
      }
      const wide = await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1); ok(wide, `${tag}: no sideways scroll`);
      ok(!errs.length, `${tag}: no page errors ` + errs.join(' | '));
      await c.close();
    }
  }
  await b.close();
  console.log(bad ? `FAILED ${bad}` : 'ALL OK'); process.exit(bad ? 1 : 0);
})();
