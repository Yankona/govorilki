// jobs_business: «Своё дело» in «Профессии» — the group of stories (a story read aloud, its sticker in the passport),
// «Моё маленькое дело» (a profitable day and a day at a loss, the sums at the child's maths level, the «how much is left?»
// question for the older ones) and «Придумай своё дело» (problem → idea → name → a pitch recorded with a fake microphone,
// kept only in this browser's IndexedDB); «Кем я буду?» can suggest a business. 4 languages, phone or laptop.
// Usage: node tests/jobs_business.js [base url] [phone|laptop]   (LANGS=ru,en to narrow)
const { chromium, devices } = require('playwright');
const D = require('path').join(__dirname, 'shots') + '/';
const BASE = process.argv[2] || 'http://localhost:8781/govorilki/', DEV = process.argv[3] || 'phone';
const HOOK = 'const fam = () => ROOT.families[ROOT.curFam] || null;';
const kid = (name, g, age, fr, lang, track = 'r') => ({ stars: 5, plays: {}, book: { title: 'Т', log: {} }, settings: { name, gender: g, track, age, friend: fr, onboarded: true, lang } });
let bad = 0; const ok = (c, m) => { console.log((c ? '  ok  ' : '  FAIL ') + m); if (!c) bad++; };
(async () => {
  const b = await chromium.launch({ args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] });
  for (const [lang, path] of [['ru', 'ru/'], ['en', ''], ['pt', 'pt/'], ['de', 'de/']].filter(([l]) => !process.env.LANGS || process.env.LANGS.includes(l))) {
    console.log(lang, DEV);
    const fam = { engine: 'device', micOff: true, srOff: true, parentPhone: true, cur: 'k1', curFam: 'f1', families: { f1: { id: 'f1', name: 'Т', cc: 'PT', kids: ['k1', 'k2', 'k3'], grands: [] } }, profiles: { k1: kid('Тоша', 'm', 8, 'tiger', lang), k2: kid('Тина', 'f', 5, 'kitty', lang), k3: kid('Тим', 'm', 10, 'tiger', lang) } };
    const c = await b.newContext(DEV === 'phone' ? { ...devices['iPhone 13'], deviceScaleFactor: 1, permissions: ['microphone'] } : { viewport: { width: 1280, height: 800 }, permissions: ['microphone'] });
    await c.route(/ntfy|wikipedia|huggingface|jsdelivr|youtube|wikimedia|workers\.dev/, r => r.abort());
    await c.route(u => /\/(ru|de|pt|en)?\/?(index\.html)?$/.test(u.pathname), async r => { const x = await r.fetch(); let t = await x.text(); t = t.replace(HOOK, HOOK + ' window.__T = { run: s => eval(s) };'); r.fulfill({ response: x, body: t }); });
    await c.addInitScript(s => { window.__said = []; try { speechSynthesis.speak = u => { window.__said.push(u.text); setTimeout(() => u.onend && u.onend(), 5); }; } catch (e) {} if (localStorage.getItem('seeded')) return; localStorage.setItem('seeded', 1); localStorage.setItem('govorilki-v2', JSON.stringify(s)); }, fam);
    const p = await c.newPage(); const errs = []; p.on('pageerror', e => { errs.push(e.message); console.log('PAGEERR', e.stack.slice(0, 400)); });
    const cyr = s => lang !== 'ru' && /[А-яЁё]/.test(s.replace(/Тина|Тоша|Тим/g, ''));
    const run = s => p.evaluate(s => window.__T.run(s), s);
    await p.goto(BASE + path); await p.waitForTimeout(1500);
    const who = await p.$$('.who-kid'); if (who.length) { await who[0].click(); await p.waitForTimeout(900); }
    // the group of stories and the two new buttons
    await run("screenLearn('jobs')"); await p.waitForTimeout(500);
    const g = await p.evaluate(() => { const h = [...document.querySelectorAll('.sec-h')]; const own = h.find(e => /💡/.test(e.textContent)); let n = 0, el = own && own.nextElementSibling; if (el) n = el.querySelectorAll('.story-c').length; return { h: own ? own.textContent : '', n, top: document.querySelector('.jb-top').innerText }; });
    ok(g.n >= 15 && !cyr(g.h + g.top) && /🍪/.test(g.top) && /💡/.test(g.top), `group «${g.h}»: ${g.n} stories; buttons ${g.top.replace(/\s+/g, ' ')}`);
    await p.screenshot({ path: D + `jb-${lang}-${DEV}-top.png` });
    // the scientists (each with «Опыт дома») and the jobs with AI
    for (const [sec, e, min] of [['sci', '🔬', 12], ['ai', '🤖', 10]]) {
      const h = await p.evaluate(e => { const s = [...document.querySelectorAll('.sec-h')].find(x => x.textContent.includes(e)); return s ? [s.textContent, s.nextElementSibling.querySelectorAll('.story-c').length] : ['', 0]; }, e);
      ok(h[1] >= min && !cyr(h[0]), `group «${h[0]}»: ${h[1]} stories`);
      const k = await run(`LEARN.jobs.items.findIndex(x => x.sec === '${sec}' && /^job-(sci|ai)-/.test(x.id))`);
      await run(`screenStory('jobs', ${k})`); await p.waitForTimeout(1200);
      const t = await p.evaluate(() => ({ h: document.querySelector('.story h2').textContent, t: document.querySelector('#stT').textContent, tr: (document.querySelector('.story-try') || {}).textContent || '' }));
      ok(t.t.length > 500 && !cyr(t.h + t.t + t.tr) && (sec !== 'sci' || t.tr.length > 30), `${sec}: «${t.h}» ${sec === 'sci' ? '| ' + t.tr.slice(0, 90) : t.t.slice(0, 90)}`);
      if (sec === 'sci') await p.screenshot({ path: D + `jb-${lang}-${DEV}-sci.png` });
    }
    ok(await run("LEARN.jobs.items.filter(x => x.sec === 'sci').every(x => x.try)"), 'every scientist has «Опыт дома»');
    await run("screenLearn('jobs')"); await p.waitForTimeout(300);
    const i = await run("LEARN.jobs.items.findIndex(x => x.sec === 'own')");
    await run(`screenStory('jobs', ${i})`); await p.waitForSelector('#stQ:not([hidden])', { timeout: 40000 }).catch(() => {});
    const st = await p.evaluate(() => ({ h: document.querySelector('.story h2').textContent, t: document.querySelector('#stT').textContent }));
    ok(st.t.length > 500 && !cyr(st.h + st.t) && (await p.evaluate(() => window.__said.length)) > 5, `story «${st.h}»: ${st.t.slice(0, 80)}…`);
    await p.screenshot({ path: D + `jb-${lang}-${DEV}-story.png` });
    await p.click('.ans[data-ok="1"]'); await p.waitForSelector('.winbox', { timeout: 8000 }).catch(() => {});
    await run('screenJobPass()'); await p.waitForTimeout(400);
    ok(await p.evaluate(() => [...document.querySelectorAll('.jp-s.got')].length) === 1 && await p.evaluate(() => [...document.querySelectorAll('.tv-h')].some(e => /💡/.test(e.textContent))), 'passport: the business sticker');
    // «Моё маленькое дело»: tier 1 (8 years): a hot day with berry drinks at a fair price → profit; a rainy day with dear bracelets → loss
    // the weather is drawn when the day starts: pin it before the screen or before «next day»
    const wxNext = wx => run(`BIZ.wx = '${wx}'; BIZ.rnd = () => .5`);
    const day = async (wx, good, price, many, shot) => {
      await p.click(`[data-g="${good}"]`); await p.waitForTimeout(250);
      for (let k = 0; k < (many ? 25 : 0); k++) await p.click('#bzPlus');
      const cost = await p.$eval('#bzCost', e => e.textContent);
      await p.click('#bzOk'); await p.waitForTimeout(250);
      await p.click(`.bz-prices [data-p="${price}"]`);
      await p.waitForSelector('.bz-res, .bz-ans .bz-prices', { timeout: 15000 }).catch(() => {});
      if (await p.$('.bz-ans .bz-prices')) { const right = await run("(() => { const t = document.querySelector('.bz-ans .tv-ask').textContent.match(/(\\d+)\\s*−\\s*(\\d+)/); return +t[1] - +t[2]; })()"); await p.click(`.bz-ans [data-v="${right}"]`); await p.waitForSelector('.bz-res', { timeout: 3000 }).catch(() => {}); }
      const r = await p.evaluate(() => ({ t: document.querySelector('.bz-ans').innerText, up: !!document.querySelector('.bz-res.up') }));
      if (shot) await p.screenshot({ path: D + `jb-${lang}-${DEV}-${shot}.png` });
      return { ...r, cost };
    };
    await wxNext('hot'); await run('screenBizStand()'); await p.waitForTimeout(500);
    const head = await p.$eval('.bz', e => e.innerText);
    ok(!cyr(head), 'stand: ' + head.replace(/\s+/g, ' ').slice(0, 140));
    await p.screenshot({ path: D + `jb-${lang}-${DEV}-stand.png` });
    const d1 = await day('hot', 'mors', 3, false, 'profit');
    ok(d1.up && /×/.test(d1.t) && !cyr(d1.t), 'day 1, profit: ' + d1.t.replace(/\s+/g, ' ').slice(0, 200));
    await wxNext('rain'); await p.click('#bzNext'); await p.waitForTimeout(300);
    const d2 = await day('rain', 'beads', 9, true, 'loss');
    ok(!d2.up && !cyr(d2.t), 'day 2, loss: ' + d2.t.replace(/\s+/g, ' ').slice(0, 200));
    await wxNext('cloud'); await p.click('#bzNext'); await p.waitForTimeout(300);
    await day('cloud', 'cookie', 4, false);
    await p.click('#bzNext'); await p.waitForSelector('.winbox', { timeout: 8000 }).catch(() => {});
    const wl = await p.$eval('.win-line', e => e.textContent).catch(() => '-');
    ok(!cyr(wl) && wl.length > 20, 'stand, three days → ' + wl);
    // the little ones: sums instead of ×; the older ones: «how much is left?»
    for (const [k, nm] of [['k2', 'Тина 5'], ['k3', 'Тим 10']]) {
      await wxNext('hot'); await run(`ROOT.cur = '${k}'; P = ROOT.profiles['${k}']; screenBizStand()`); await p.waitForTimeout(400);
      const d = await day('hot', 'mors', 3, false, k === 'k3' ? 'older' : 'young');
      ok(d.up && (k === 'k2' ? /\+/.test(d.cost) && !/×/.test(d.cost) : /×/.test(d.t)) && !cyr(d.t), `${nm}: ${d.cost} | ${d.t.replace(/\s+/g, ' ').slice(0, 120)}`);
    }
    await run("ROOT.cur = 'k1'; P = ROOT.profiles['k1']");
    // «Придумай своё дело»: problem → idea → name → a pitch of two seconds, kept on this phone
    await run('screenBizIdea()'); await p.waitForTimeout(400);
    const q1 = await p.$eval('#biQ', e => e.innerText); ok(!cyr(q1), 'idea, problems: ' + q1.replace(/\s+/g, ' ').slice(0, 120));
    await p.click('#biQ .tv-o[data-j="1"]'); await p.waitForTimeout(300);
    await p.click('#biQ .tv-o[data-j="0"]'); await p.waitForTimeout(300);
    await p.click('#biQ .bz-prices .chip'); await p.click('#biOk'); await p.waitForTimeout(500);
    const card = await p.$eval('.bz-card', e => e.innerText); ok(!cyr(card + await p.$eval('#biQ', e => e.innerText)), 'idea card: ' + card.replace(/\s+/g, ' '));
    await p.screenshot({ path: D + `jb-${lang}-${DEV}-pitch.png` });
    if (await p.$('#biRec')) { await p.click('#biRec'); await p.waitForTimeout(2200); await p.click('#biRec'); await p.waitForTimeout(1500); }
    else ok(false, 'no record button');
    await p.click('#biSave'); await p.waitForTimeout(800);
    const saved = await p.evaluate(() => new Promise(res => { const r = indexedDB.open('govorilki-pitch', 1); r.onsuccess = () => { const q = r.result.transaction('pitch').objectStore('pitch').getAll(); q.onsuccess = () => res(q.result.map(x => ({ name: x.name, n: x.buf ? x.buf.byteLength : 0 }))); }; r.onerror = () => res([]); }));
    ok(saved.length === 2 && saved.some(x => x.n > 1000), 'pitch kept on this phone: ' + JSON.stringify(saved));
    ok(!JSON.stringify(await run('ROOT')).includes(saved[0] && saved[0].name || '@@'), 'the idea is not in ROOT (no cloud)');
    ok(await p.$$eval('#biList .bz-card', x => x.length) === 2 && !!(await p.$('#biList [data-play]')), 'my ideas: 2, one with ▶');
    await p.screenshot({ path: D + `jb-${lang}-${DEV}-ideas.png` });
    // «Кем я буду?» can suggest a business
    let biz = false;
    for (let t = 0; t < 4 && !biz; t++) {
      await run('screenJobDream()'); await p.waitForTimeout(300);
      for (let r = 0; r < 10 && !(await p.$('.jd-res')); r++) { const o = await p.$$('#jdQ .tv-o'); const pick = await p.evaluate(() => [...document.querySelectorAll('#jdQ .tv-o')].findIndex(e => /💡|🧱|🔧|🎲/.test(e.textContent))); await o[Math.max(0, pick)].click(); await p.waitForTimeout(450); }
      biz = await p.evaluate(() => [...document.querySelectorAll('.jd-res [data-id]')].some(e => /^job-own-/.test(e.dataset.id)));
    }
    ok(biz, '«Кем я буду?» suggests a business: ' + (await p.$$eval('.jd-res b', x => x.map(e => e.textContent).join(', ')).catch(() => '-')));
    ok(!errs.length, 'page errors: ' + JSON.stringify(errs));
    await c.close();
  }
  await b.close();
  console.log(bad ? `FAILED ${bad}` : 'ALL OK'); process.exit(bad ? 1 : 0);
})();
