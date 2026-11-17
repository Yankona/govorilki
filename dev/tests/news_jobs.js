// news_jobs: «Что нового в мире» (news by months, the news badge, «Новое!» in the topic's section) and «Профессии»
// (stories with stickers, the passport, «Угадай профессию», «Кем я буду?»); 4 languages, phone (iPhone 13) or laptop.
// Usage: node tests/news_jobs.js [base url] [phone|laptop]
const { chromium, devices } = require('playwright');
const D = require('path').join(__dirname, 'shots') + '/';
const BASE = process.argv[2] || 'http://localhost:8781/govorilki/', DEV = process.argv[3] || 'phone';
const HOOK = 'const fam = () => ROOT.families[ROOT.curFam] || null;';
const kid = (name, g, age, fr, lang, track = 'r') => ({ stars: 5, plays: {}, book: { title: 'Т', log: {} }, settings: { name, gender: g, track, age, friend: fr, onboarded: true, lang } });
let bad = 0; const ok = (c, m) => { console.log((c ? '  ok  ' : '  FAIL ') + m); if (!c) bad++; };
(async () => {
  const b = await chromium.launch();
  for (const [lang, path] of [['ru', 'ru/'], ['en', ''], ['pt', 'pt/'], ['de', 'de/']].filter(([l]) => !process.env.LANGS || process.env.LANGS.includes(l))) {
    console.log(lang, DEV);
    const fam = { engine: 'device', micOff: true, srOff: true, parentPhone: true, cur: 'k1', curFam: 'f1', families: { f1: { id: 'f1', name: 'Т', cc: 'PT', kids: ['k1', 'k2'], grands: [] } }, profiles: { k1: kid('Тоша', 'm', 8, 'tiger', lang), k2: kid('Тина', 'f', 5, 'kitty', lang) } };
    const c = await b.newContext(DEV === 'phone' ? { ...devices['iPhone 13'], deviceScaleFactor: 1 } : { viewport: { width: 1280, height: 800 } });
    await c.route(/ntfy|wikipedia|huggingface|jsdelivr|youtube|wikimedia|workers\.dev/, r => r.abort());
    await c.route(u => /\/(ru|de|pt|en)?\/?(index\.html)?$/.test(u.pathname), async r => { const x = await r.fetch(); let t = await x.text(); t = t.replace(HOOK, HOOK + ' window.__T = { run: s => eval(s) };'); r.fulfill({ response: x, body: t }); });
    await c.addInitScript(s => { window.__said = []; try { speechSynthesis.speak = u => { window.__said.push(u.text); setTimeout(() => u.onend && u.onend(), 5); }; } catch (e) {} if (localStorage.getItem('seeded')) return; localStorage.setItem('seeded', 1); localStorage.setItem('govorilki-v2', JSON.stringify(s)); }, fam);
    const p = await c.newPage(); const errs = []; p.on('pageerror', e => { errs.push(e.message); console.log('PAGEERR', e.stack.slice(0, 400)); });
    const cyr = s => lang !== 'ru' && /[А-яЁё]/.test(s.replace(/Тина|Тоша/g, ''));
    const run = s => p.evaluate(s => window.__T.run(s), s);
    const saidAll = () => p.evaluate(() => window.__said.join(' '));
    await p.goto(BASE + path); await p.waitForTimeout(1500);
    const who = await p.$$('.who-kid'); if (who.length) { await who[0].click(); await p.waitForTimeout(900); }
    // the two tiles on the «Узнаём» tab
    await p.evaluate(() => { const x = document.querySelector('[data-tab="discover"]'); if (x) x.click(); }); await p.waitForTimeout(700);
    for (const id of ['learn-news', 'learn-jobs']) {
      const t = await p.$(`.tile[data-id="${id}"]`), tx = t ? (await t.innerText()).replace(/\s+/g, ' ') : '-';
      ok(!!t && !cyr(tx), `tile ${id}: ${tx}`);
    }
    // «Новое!»: fresh news not heard yet → a mark on the news tile and on the tile of its topic (Космос)
    const dots = await p.$$eval('.tile .tile-new', x => x.map(e => e.closest('.tile').dataset.id));
    ok(dots.includes('learn-news') && (!(await p.$('.tile[data-id="space"]')) || dots.includes('space')), '«Новое!» on the tiles: ' + dots.join(', '));
    await p.screenshot({ path: D + `nj-${lang}-${DEV}-tiles.png` });
    await p.click('.tile[data-id="learn-news"]'); await p.waitForTimeout(700);
    const arch = await p.evaluate(() => { const h = [...document.querySelectorAll('.sec-h')]; return { last: h.length ? h[h.length - 1].textContent : '', dates: [...document.querySelectorAll('.story-c .nw-d')].length }; });
    ok(/🗄️/.test(arch.last) && arch.dates >= 30 && !cyr(arch.last), `old news in the archive: «${arch.last}», ${arch.dates} cards with a date`);
    // the news: months, cards, the badge
    const nw = await p.evaluate(() => ({ n: document.querySelectorAll('.story-c').length, h: [...document.querySelectorAll('.sec-h')].map(e => e.textContent), badge: (document.querySelector('.nw-badge') || {}).textContent || '' }));
    ok(nw.n >= 30 && nw.h.length >= 10 && nw.badge && !cyr(nw.h.join(' ') + nw.badge), `news: ${nw.n} stories, months ${nw.h.slice(0, 3).join(' | ')}…; badge «${nw.badge.trim()}»`);
    await p.screenshot({ path: D + `nj-${lang}-${DEV}-news.png` });
    // the newest story: read aloud, answered
    await p.click('.story-c'); await p.waitForSelector('#stQ:not([hidden])', { timeout: 30000 }).catch(() => {});
    const st = await p.evaluate(() => ({ h: document.querySelector('.story h2').textContent, t: document.querySelector('#stT').textContent }));
    const s1 = await saidAll(), probe = t => (t.match(/[^.!?…]+[.!?…]/g) || [t]).map(x => x.trim()).find(x => !/\d/.test(x)) || t;
    ok(st.t.length > 300 && s1.includes(probe(st.t).slice(0, 20)) && !cyr(st.h + st.t), `news story «${st.h}» read aloud: ${st.t.slice(0, 70)}…`);
    await p.screenshot({ path: D + `nj-${lang}-${DEV}-newsstory.png` });
    await p.click('.ans[data-ok="1"]'); await p.waitForSelector('.winbox', { timeout: 8000 }).catch(() => {});
    ok(await p.$('.winbox') !== null, 'news story answered → ' + await p.$eval('.win-line', e => e.textContent).catch(() => '-'));
    // the badge: all but one story of the newest month heard, then that one
    const last = await run("(() => { const xs = newsFresh(); xs.slice(0, -1).forEach(x => { P.learn[x.id] = 1; }); delete P.learn[xs[xs.length - 1].id]; save(); return xs.length - 1; })()");
    await run(`screenStory('news', ${last})`); await p.waitForSelector('#stQ:not([hidden])', { timeout: 30000 }).catch(() => {});
    await p.click('.ans[data-ok="1"]'); await p.waitForSelector('.winbox', { timeout: 8000 }).catch(() => {});
    const wl = await p.$eval('.win-line', e => e.textContent).catch(() => '-');
    ok(await run('Object.keys(P.newsB || {}).length') === 1 && !cyr(wl), 'news badge earned: ' + wl);
    await run("screenLearn('news')"); await p.waitForTimeout(400);
    ok(await p.$('.nw-badge.got') !== null, 'news badge shown in the section');
    await run('goHome()'); await p.waitForTimeout(500);
    await p.evaluate(() => { const x = document.querySelector('[data-tab="discover"]'); if (x) x.click(); }); await p.waitForTimeout(600);
    ok(!(await p.$('.tile[data-id="learn-news"] .tile-new')), '«Новое!» is gone once the fresh news are heard');
    // «Новое!» in the topic's own section (space is Russian-only)
    if (lang === 'ru') {
      await run("screenLearn('space')"); await p.waitForTimeout(400);
      const k = await p.$$eval('.nw-c', x => x.map(e => e.textContent));
      ok(k.length >= 1, '«Новое!» in space: ' + k.join(' | ').slice(0, 120));
      await p.screenshot({ path: D + `nj-${lang}-${DEV}-space-new.png` });
      await p.click('.nw-c'); await p.waitForTimeout(600);
      ok((await p.$eval('#stT', e => e.textContent).catch(() => '')).length > 300, '«Новое!» opens the news story');
    }
    // the jobs: sections, buttons, a story → a sticker
    await run("screenLearn('jobs')"); await p.waitForTimeout(500);
    const jb = await p.evaluate(() => ({ n: document.querySelectorAll('.story-c').length, h: [...document.querySelectorAll('.sec-h')].map(e => e.textContent), top: document.querySelector('.jb-top').innerText }));
    ok(jb.n >= 60 && jb.h.length === 8 && !cyr(jb.h.join(' ') + jb.top), `jobs: ${jb.n} stories, ${jb.h.join(' | ')}; ${jb.top.replace(/\s+/g, ' ')}`);
    await p.screenshot({ path: D + `nj-${lang}-${DEV}-jobs.png` });
    await p.click('.story-c'); await p.waitForSelector('#stQ:not([hidden])', { timeout: 30000 }).catch(() => {});
    const js = await p.evaluate(() => ({ h: document.querySelector('.story h2').textContent, t: document.querySelector('#stT').textContent }));
    ok(js.t.length > 350 && (await saidAll()).includes(probe(js.t).slice(0, 20)) && !cyr(js.h + js.t), `job story «${js.h}» read aloud: ${js.t.slice(0, 70)}…`);
    await p.screenshot({ path: D + `nj-${lang}-${DEV}-jobstory.png` });
    await p.click('.ans[data-ok="1"]'); await p.waitForSelector('.winbox', { timeout: 8000 }).catch(() => {});
    const jl = await p.$eval('.win-line', e => e.textContent).catch(() => '-');
    ok(!cyr(jl) && jl.length > 40, 'job story answered → ' + jl);
    // the passport: one sticker
    await run('screenJobPass()'); await p.waitForTimeout(500);
    const ps = await p.evaluate(() => ({ got: document.querySelectorAll('.jp-s.got').length, all: document.querySelectorAll('.jp-s').length, nb: document.querySelectorAll('.jp-nb').length, head: document.querySelector('.jp-head').innerText }));
    ok(ps.got === 1 && ps.all >= 60 && ps.nb === 1 && !cyr(ps.head), `passport: ${ps.got} of ${ps.all} stickers, news badges ${ps.nb}; ${ps.head.replace(/\s+/g, ' ')}`);
    await p.screenshot({ path: D + `nj-${lang}-${DEV}-passport.png` });
    // «Угадай профессию»: 8 rounds
    await run('screenJobGuess()'); await p.waitForTimeout(400); let gr = 0;
    for (let r = 0; r < 8; r++) {
      const q = await p.$eval('#jgQ', e => e.innerText).catch(() => ''); if (!q) break;
      if (r === 0) { ok(!cyr(q) && (await p.$$('.jg-tools .tv-big')).length >= 2, 'guess: ' + q.replace(/\s+/g, ' ').slice(0, 120)); await p.screenshot({ path: D + `nj-${lang}-${DEV}-guess.png` }); }
      await p.click('.tv-o'); await p.waitForTimeout(150); await p.click('#jgNext'); gr++; await p.waitForTimeout(250);
    }
    await p.waitForSelector('.winbox', { timeout: 5000 }).catch(() => {});
    ok(gr === 8 && await p.$('.winbox') !== null, 'guess: 8 rounds → ' + await p.$eval('.win-line', e => e.textContent).catch(() => '-'));
    // «Кем я буду?»: 6 questions → 3 ideas
    await run('screenJobDream()'); await p.waitForTimeout(400);
    for (let r = 0; r < 10 && !(await p.$('.jd-res')); r++) {
      const q = await p.$eval('#jdQ .tv-t', e => e.textContent).catch(() => '');
      if (r === 0) ok(!cyr(q + await p.$eval('.tv-opts', e => e.innerText)), 'dream: ' + q);
      await p.click(`.tv-o[data-j="${r % 4}"]`); await p.waitForTimeout(600);
    }
    const res = await p.$$eval('.jd-res .tv-c b', x => x.map(e => e.textContent));
    ok(res.length === 3 && !cyr(res.join(' ') + await p.$eval('#jdQ', e => e.innerText)), 'dream ideas: ' + res.join(', '));
    await p.screenshot({ path: D + `nj-${lang}-${DEV}-dream.png` });
    await p.click('.jd-res .tv-c'); await p.waitForTimeout(800);
    ok((await p.$eval('#stT', e => e.textContent).catch(() => '')).length > 300, 'an idea opens its story');
    ok(!errs.length, 'page errors: ' + JSON.stringify(errs));
    await c.close();
  }
  await b.close();
  console.log(bad ? `FAILED ${bad}` : 'ALL OK'); process.exit(bad ? 1 : 0);
})();
