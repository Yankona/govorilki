// ballet: «Балет» — the tile, the hub, the class (feet, arms, moves animate with voice; each tab finishes), the games
// «Какая это позиция?» and «Повтори за балериной», a tale read to the end with its question, the stories (ru only);
// 4 languages, phone (iPhone 13) and laptop. Usage: node tests/ballet.js [base url] [phone|laptop]
const { chromium, devices } = require('playwright');
const D = require('path').join(__dirname, 'shots') + '/';
const BASE = process.argv[2] || 'http://localhost:8781/govorilki/', DEV = process.argv[3] || 'phone';
const HOOK = 'const fam = () => ROOT.families[ROOT.curFam] || null;';
const kid = (name, g, age, fr, lang, track = 'r') => ({ stars: 5, plays: {}, book: { title: 'Т', log: {} }, settings: { name, gender: g, track, age, friend: fr, onboarded: true, lang } });
let bad = 0; const ok = (c, m) => { console.log((c ? '  ok  ' : '  FAIL ') + m); if (!c) bad++; };
(async () => {
  const b = await chromium.launch();
  for (const [lang, path] of [['ru', 'ru/'], ['en', ''], ['pt', 'pt/'], ['de', 'de/']]) {
    console.log(lang, DEV);
    const fam = { engine: 'device', micOff: true, srOff: true, parentPhone: true, cur: 'k1', curFam: 'f1', families: { f1: { id: 'f1', name: 'Т', cc: 'PT', kids: ['k1', 'k2'], grands: [] } }, profiles: { k1: kid('Тина', 'f', 5, 'kitty', lang), k2: kid('Тоша', 'm', 8, 'tiger', lang, 'l') } };
    const c = await b.newContext(DEV === 'phone' ? { ...devices['iPhone 13'], deviceScaleFactor: 1 } : { viewport: { width: 1280, height: 800 } });
    await c.route(/ntfy|wikipedia|huggingface|jsdelivr|youtube|wikimedia|workers\.dev/, r => r.abort());
    await c.route(u => /\/(ru|de|pt|en)?\/?(index\.html)?$/.test(u.pathname), async r => { const x = await r.fetch(); let t = await x.text(); t = t.replace(HOOK, HOOK + ' window.__T = { run: s => eval(s) };'); r.fulfill({ response: x, body: t }); });
    await c.addInitScript(s => { window.__said = []; window.__blFast = 1; try { speechSynthesis.speak = u => { window.__said.push(u.text); setTimeout(() => u.onend && u.onend(), 5); }; } catch (e) {} if (localStorage.getItem('seeded')) return; localStorage.setItem('seeded', 1); localStorage.setItem('govorilki-v2', JSON.stringify(s)); }, fam);
    const p = await c.newPage(); const errs = []; p.on('pageerror', e => { errs.push(e.message); console.log('PAGEERR', e.stack.slice(0, 400)); });
    const cyr = s => lang !== 'ru' && /[А-яЁё]/.test(s);
    const said = () => p.evaluate(() => window.__said.slice(-1)[0] || '');
    const run = s => p.evaluate(s => window.__T.run(s), s);
    await p.goto(BASE + path); await p.waitForTimeout(1500);
    const who = await p.$$('.who-kid'); if (who.length) { await who[0].click(); await p.waitForTimeout(900); }
    // the tile: «Творим» (music) and «Узнаём»
    for (const tab of ['create', 'discover']) {
      await p.evaluate(t => { const x = document.querySelector(`[data-tab="${t}"]`); if (x) x.click(); }, tab); await p.waitForTimeout(700);
      const tile = await p.$('.tile[data-id="ballet"]');
      ok(!!tile, `tile on the ${tab} tab: ` + (tile ? (await tile.innerText()).replace(/\s+/g, ' ') : '-'));
      if (tab === 'discover' && tile) { await tile.scrollIntoViewIfNeeded(); await tile.click(); await p.waitForTimeout(500); if (!await p.$('.bl-hub')) await tile.click().catch(() => {}); }
    }
    if (!await p.$('.bl-hub')) await run('BALLET.hub()');
    await p.waitForTimeout(700); await p.screenshot({ path: D + `ballet-${lang}-${DEV}-hub.png` });
    const hub = await p.$$eval('.bl-go b', x => x.map(e => e.textContent));
    ok(hub.length === (lang === 'ru' ? 3 : 2) && !cyr(hub.join(' ')) && await p.$('#blFig path') !== null, 'hub: ' + hub.join(' | '));
    // the class: every tab, every item; the figure moves and the friend speaks
    for (const tab of ['feet', 'arms', 'moves']) {
      await run(`BALLET.screen('${tab}')`); await p.waitForTimeout(500);
      const ks = await p.$$eval('#blChips .chip', x => x.map(e => e.dataset.k));
      for (const k of ks) {
        const before = await p.$eval('#blFig', e => e.innerHTML);
        await p.click(`#blChips .chip[data-k="${k}"]`);
        await p.waitForTimeout(k === 'arabesque' ? 260 : k === 'pirouette' ? 230 : 150);
        const st = await p.evaluate(() => ({ h: document.querySelector('#blCard h2').textContent, t: document.querySelector('#blCard p').textContent, fig: document.querySelector('#blFig').innerHTML, fp: !document.querySelector('#blFp').hidden }));
        const s = await p.evaluate(() => window.__said.slice(-3).join(' '));
        ok((st.fig !== before || k === "prep") && st.t.length > 40 && s.length > 20 && !cyr(st.h + st.t + s) && (tab !== 'feet' || st.fp), `${tab}/${k}: «${st.h}» moves${st.fp ? ' + footprints' : ''} — ${s.slice(0, 60)}…`);
        if (['p3', 'a3', 'arabesque', 'pirouette', 'pasdechat'].includes(k)) await p.screenshot({ path: D + `ballet-${lang}-${DEV}-${k}.png` });
        await p.waitForTimeout(700);
      }
      await p.waitForSelector('.winbox', { timeout: 8000 }).catch(() => {});
      ok(await p.$('.winbox') !== null, `${tab}: all seen → ` + await p.$eval('.win-line', e => e.textContent).catch(() => '-'));
    }
    // «Попробуй сам» on a move
    await run("BALLET.screen('moves')"); await p.waitForTimeout(400);
    await p.click('#blChips .chip[data-k="plie"]'); await p.waitForTimeout(400); await p.click('#blTry'); await p.waitForTimeout(1500);
    ok((await p.evaluate(() => window.__said.slice(-4).join(' / '))).length > 30, 'try it: ' + await p.evaluate(() => window.__said.slice(-3).join(' / ')));
    // the boy dancer
    await run("BALLET.screen('games')"); await p.waitForTimeout(300);
    await p.click('.bl-who .chip[data-who="b"]'); await p.waitForTimeout(400);
    ok(await p.$eval('#blFig', e => !e.innerHTML.includes('FFB8CF')), 'boy dancer: no tutu'); await p.screenshot({ path: D + `ballet-${lang}-${DEV}-boy.png` });
    await p.click('.bl-who .chip[data-who="g"]');
    // «Какая это позиция?»: two misses make the right one blink, then tap it
    await run('BALLET.quiz()'); await p.waitForTimeout(400);
    let rounds = 0;
    for (let r = 0; r < 8; r++) {
      const q = await p.$eval('#blCard h2', e => e.textContent), right = await p.$eval('#blAns', e => e.dataset.r);
      if (r === 0) {
        for (const w of await p.$$(`#blAns .chip:not([data-k="${right}"])`)) { await w.click(); await p.waitForTimeout(80); }
        const h = await p.$('#blAns .chip.hint');
        ok(!!h && await h.getAttribute('data-k') === right && !cyr(q), `quiz: «${q}» → two misses → ${h ? await h.innerText() : '-'} blinks`);
        await p.screenshot({ path: D + `ballet-${lang}-${DEV}-quiz.png` });
      }
      await p.click(`#blAns .chip[data-k="${right}"]`); rounds++;
      await p.waitForFunction(n => document.querySelector('.winbox') || document.querySelectorAll('#blCard .bd-prog i.ok').length >= n, r + 1, { timeout: 10000 }).catch(() => {});
      await p.waitForTimeout(200);
    }
    await p.waitForSelector('.winbox', { timeout: 5000 }).catch(() => {});
    ok(rounds === 8 && await p.$('.winbox') !== null, 'quiz: 8 rounds → ' + await p.$eval('.win-line', e => e.textContent).catch(() => '-'));
    // «Повтори за балериной»: four rounds
    await run('BALLET.repeat()'); let rr = 0;
    for (let r = 0; r < 4; r++) {
      const did = await p.waitForSelector('#blDid', { timeout: 20000 }).catch(() => null); if (!did) break;
      if (r === 2) await p.screenshot({ path: D + `ballet-${lang}-${DEV}-repeat.png` });
      await did.click(); await p.waitForTimeout(200);
      const ch = await p.$$('#blAns .chip'); if (!ch.length) break; await ch[0].click(); rr++; await p.waitForTimeout(400);
    }
    await p.waitForSelector('.winbox', { timeout: 5000 }).catch(() => {});
    ok(rr === 4 && await p.$('.winbox') !== null, 'repeat: 4 rounds → ' + await p.$eval('.win-line', e => e.textContent).catch(() => '-'));
    // a tale: the swan lake, three chapters, the music, the question
    await run('BALLET.tales()'); await p.waitForTimeout(400);
    const tl = await p.$$eval('.bl-go b', x => x.map(e => e.textContent));
    ok(tl.length === 8 && !cyr(tl.join(' ')), 'tales: ' + tl.join(' | '));
    await p.click('.bl-go[data-i="1"]'); await p.waitForTimeout(600);
    let chs = 0;
    for (let i = 0; i < 4; i++) {
      const t = await p.$eval('#blT', e => e.textContent); const h = await p.$eval('.bl-tale h2', e => e.textContent);
      ok(t.length > 300 && !cyr(t + h), `chapter «${h}»: ${t.slice(0, 50)}…`); chs++;
      if (i === 0) { ok(await p.$('.mu-full, #blTune') !== null, 'swan lake: the music button'); await p.screenshot({ path: D + `ballet-${lang}-${DEV}-tale.png` }); }
      const nx = await p.$eval('#blNext', e => e.textContent); await p.click('#blNext'); await p.waitForTimeout(500);
      if (await p.$('#blQ:not([hidden])')) break; if (!/▶/.test(nx)) break;
    }
    const qa = await p.$$('#blQ [data-a]');
    ok(chs === 3 && qa.length === 3, 'tale: 3 chapters then the question ' + await p.$eval('#blQ b', e => e.textContent).catch(() => '-'));
    await p.click('#blQ [data-a="0"]'); await p.waitForTimeout(500);
    ok(await p.$('.winbox') !== null, 'tale: the right answer → ' + await p.$eval('.win-line', e => e.textContent).catch(() => '-'));
    if (lang === 'ru') {
      await run("screenLearn('ballet')"); await p.waitForTimeout(500);
      const n = await p.$$eval('.story-c', x => x.length); ok(n >= 25, 'stories: ' + n);
      await p.click('.story-c'); await p.waitForTimeout(500); await p.screenshot({ path: D + `ballet-${lang}-${DEV}-story.png` });
      ok((await p.$eval('#stT', e => e.textContent)).length > 200, 'a story opens');
    }
    ok(!errs.length, 'page errors: ' + JSON.stringify(errs));
    await c.close();
  }
  await b.close();
  console.log(bad ? `FAILED ${bad}` : 'ALL OK'); process.exit(bad ? 1 : 0);
})();
