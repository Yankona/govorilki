// fun_create: «Творим» made more fun — «Моя выставка» (a drawing hangs framed, opens big), the framed drawing on the win
// screen, paint splashes in colouring, the xylophone «Мой концерт» and the song played back, composer portraits from our
// own site, stars bursting from right answers, the museum passport stamps. 4 languages, phone (iPhone 13) and laptop.
// Usage: node tests/fun_create.js [base url] [phone|laptop]
const { chromium, devices } = require('playwright');
const D = require('path').join(__dirname, 'shots') + '/';
const BASE = process.argv[2] || 'http://localhost:8781/govorilki/', DEV = process.argv[3] || 'phone';
const HOOK = 'const fam = () => ROOT.families[ROOT.curFam] || null;';
const kid = (name, g, age, fr, lang, track = 'r') => ({ stars: 5, plays: {}, book: { title: 'Т', log: {} }, settings: { name, gender: g, track, age, friend: fr, onboarded: true, lang, warmDraw: false } });
let bad = 0; const ok = (c, m) => { console.log((c ? '  ok  ' : '  FAIL ') + m); if (!c) bad++; };
(async () => {
  require('fs').mkdirSync(D, { recursive: true });
  const b = await chromium.launch();
  for (const [lang, path] of [['ru', 'ru/'], ['en', ''], ['pt', 'pt/'], ['de', 'de/']]) {
    console.log(lang, DEV);
    const fam = { engine: 'device', micOff: true, srOff: true, parentPhone: true, cur: 'k1', curFam: 'f1', families: { f1: { id: 'f1', name: 'Т', cc: 'PT', kids: ['k1'], grands: [] } }, profiles: { k1: kid('Тина', 'f', 6, 'kitty', lang) } };
    const c = await b.newContext(DEV === 'phone' ? { ...devices['iPhone 13'], deviceScaleFactor: 1 } : { viewport: { width: 1280, height: 800 } });
    const wm = []; c.on('request', r => { if (/wikimedia/.test(r.url()) && /cmp|portrait|Mozart|Beethoven|Bach|Brahms/i.test(r.url())) wm.push(r.url()); });
    await c.route(/ntfy|wikipedia|huggingface|jsdelivr|youtube|wikimedia|workers\.dev/, r => r.abort());
    await c.route(u => /\/(ru|de|pt|en)?\/?(index\.html)?$/.test(u.pathname), async r => { const x = await r.fetch(); let t = await x.text(); t = t.replace(HOOK, HOOK + ' window.__T = { run: s => eval(s) };'); r.fulfill({ response: x, body: t }); });
    await c.addInitScript(s => { window.__said = []; try { speechSynthesis.speak = u => { window.__said.push(u.text); setTimeout(() => u.onend && u.onend(), 5); }; } catch (e) {} if (localStorage.getItem('seeded')) return; localStorage.setItem('seeded', 1); localStorage.setItem('govorilki-v2', JSON.stringify(s)); }, fam);
    const p = await c.newPage(); const errs = []; p.on('pageerror', e => { errs.push(e.message); console.log('PAGEERR', e.stack.slice(0, 400)); });
    const cyr = s => lang !== 'ru' && /[А-яЁё]/.test(s.replace(/Тина|Тоша/g, ''));
    const run = s => p.evaluate(s => window.__T.run(s), s);
    const said = () => p.evaluate(() => window.__said.slice(-2).join(' / '));
    await p.goto(BASE + path); await p.waitForTimeout(1500);
    const who = await p.$$('.who-kid'); if (who.length) { await who[0].click(); await p.waitForTimeout(900); }

    // the drawing menu: drawing first, the letters after, an empty frame waiting
    await run('screenDrawMenu()'); await p.waitForTimeout(500);
    const heads = await p.$$eval('.sec-h', x => x.map(e => e.textContent)), first = await p.$$eval('.draw-menu [data-m]', x => x.slice(0, 3).map(e => e.dataset.m));
    ok(heads.length === 3 && first.join() === 'free,magic,task' && await p.$('.fun-empty') !== null && !cyr(heads.join(' ')), 'draw menu: ' + heads.join(' | ') + ' · first ' + first.join());
    // a free drawing: draw, «Готово» → the drawing framed on the win screen
    await p.click('.fun-empty'); await p.waitForTimeout(500);
    const cv = await (await p.$('#cvB')).boundingBox();
    await p.mouse.move(cv.x + 40, cv.y + 60); await p.mouse.down();
    for (let i = 0; i < 20; i++) await p.mouse.move(cv.x + 40 + i * 9, cv.y + 60 + Math.sin(i / 3) * 40);
    await p.mouse.up(); await p.click('#done'); await p.waitForSelector('.winbox', { timeout: 5000 }).catch(() => {});
    const wsrc = await p.$eval('.winbox .win-art img', e => e.src.slice(0, 22)).catch(() => '');
    ok(wsrc.startsWith('data:image/jpeg'), 'win screen shows the framed drawing: ' + (await p.$eval('.win-line', e => e.textContent).catch(() => '-')));
    await p.waitForTimeout(700); await p.screenshot({ path: D + `fun-${lang}-${DEV}-win.png` });
    await p.click('.winbox [data-a="menu"]'); await p.waitForTimeout(600);
    // «Моя выставка»: the drawing hangs there; tap → big with the plaque
    const th = await p.$$('.fun-th[data-art]');
    ok(th.length === 1, 'exhibition: ' + th.length + ' drawing');
    await p.screenshot({ path: D + `fun-${lang}-${DEV}-show.png` });
    if (th.length) { await th[0].click(); await p.waitForTimeout(600); }
    const pl = await p.$eval('.fun-view .fun-plaque', e => e.textContent).catch(() => '');
    ok(pl.includes('Тина') && !cyr(pl + await said()), 'opens big: ' + pl.replace(/\s+/g, ' ') + ' — ' + await said());
    await p.screenshot({ path: D + `fun-${lang}-${DEV}-view.png` });
    await p.click('.fun-view [data-v="x"]').catch(() => {}); await p.waitForTimeout(300);
    ok(!await p.$('.fun-view'), 'closes');

    // colouring: a splash of paint where the colour pours
    await run("screenPaint({ mode: 'color', page: 'koala' })"); await p.waitForTimeout(600);
    await p.evaluate(() => { window.__sp = 0; new MutationObserver(m => m.forEach(r => r.addedNodes.forEach(n => { if (n.classList && n.classList.contains('fun-splash')) window.__sp++; }))).observe(document.body, { childList: true }); });
    const shape = await p.$('#svgPage path[fill="#FFFFFF"], #svgPage ellipse[fill="#FFFFFF"], #svgPage circle[fill="#FFFFFF"]');
    if (shape) await shape.click({ force: true }); await p.waitForTimeout(150);
    ok(await p.evaluate(() => window.__sp) > 0, 'colouring: paint splash');

    // the xylophone: six free notes → «Мой концерт» plays them back, applause and a star the first time
    await run('screenXylo()'); await p.waitForTimeout(500);
    ok(await p.$eval('#xyCon', e => e.hidden), 'concert button waits');
    const bars = await p.$$('.xbar');
    for (const i of [0, 2, 4, 2, 0, 7, 4]) { await bars[i].click(); await p.waitForTimeout(120); }
    ok(!await p.$eval('#xyCon', e => e.hidden) && !cyr(await p.$eval('#xyShow', e => e.textContent)), 'after 6 notes: ' + await p.$eval('#xyShow', e => e.textContent));
    const st0 = await run('P.stars');
    await p.click('#xyShow', { force: true }); await p.waitForTimeout(400);
    ok(await p.$('.xbar.glow') !== null, 'concert lights the bars'); await p.screenshot({ path: D + `fun-${lang}-${DEV}-concert.png` });
    await p.waitForFunction(() => /👏/.test(document.querySelector('#xl').textContent), null, { timeout: 9000 }).catch(() => {});
    ok(/👏/.test(await p.$eval('#xl', e => e.textContent)) && await run('P.stars') === st0 + 1, 'bravo: ' + await said());
    // a song: follow the glowing bar, then the song plays back, then the win screen
    await p.click('#xs .chip[data-i="2"]'); await p.waitForTimeout(300);
    let played = false;
    for (let i = 0; i < 400; i++) { if (await p.$('.winbox')) break; const g = await p.$('#xy .xbar.glow'); if (g) { await g.click({ force: true }).catch(() => {}); if (!played && await run('!!document.querySelector("#xl .sy") === false') && /!/.test(await p.$eval('#xl', e => e.textContent))) played = true; } await p.waitForTimeout(80); }
    ok(played, 'song played back after the last note');
    await p.waitForSelector('.winbox', { timeout: 20000 }).catch(() => {});
    ok(await p.$('.winbox') !== null, 'song → win: ' + await p.$eval('.win-line', e => e.textContent).catch(() => '-'));

    // composer portraits from our own site; stars fly out of a right answer
    await run('screenGuessComposer()'); await p.waitForTimeout(1200);
    const imgs = await p.$$eval('#gcOpts img', x => x.map(e => [e.getAttribute('src'), e.naturalWidth]));
    ok(imgs.length === 3 && imgs.every(([s, w]) => /img\/learn\/cmp-\w+\.webp$/.test(s) && w > 100), 'portraits: ' + imgs.map(x => x[0].split('/').pop() + ' ' + x[1]).join(', '));
    await p.evaluate(() => { window.__bu = 0; new MutationObserver(m => m.forEach(r => r.addedNodes.forEach(n => { if (n.classList && n.classList.contains('burst')) window.__bu++; }))).observe(document.body, { childList: true }); });
    await p.screenshot({ path: D + `fun-${lang}-${DEV}-guess.png` });
    // the TF game: answer by the truth → burst
    await run('screenCmpTF()'); await p.waitForTimeout(1200);
    if (!await p.$('#tfH')) console.log('  (no composer facts in this language: the game opens the music box instead)');
    else {
    const tfImg = await p.$eval('#tfH img', e => [e.getAttribute('src'), e.naturalWidth]).catch(() => ['', 0]);
    ok(/cmp-/.test(tfImg[0]) && tfImg[1] > 50, 'true-or-false portrait: ' + tfImg.join(' '));
    const truth = await run('(() => { const s = document.querySelector("#tfS").textContent; for (const c of COMPOSERS) for (const x of ((CF.data[c.id] || {}).tf || [])) if (x.s === s) return x.t; return null; })()');
    await p.click(`#tfB [data-v="${truth ? 1 : 0}"]`); await p.waitForTimeout(200);
    ok(await p.evaluate(() => window.__bu) > 0, 'right answer: stars burst');
    }

    // the museum passport: a painting opened → a stamp; «Мой музей» shows the passport
    await run('screenMuseum()'); await p.waitForTimeout(1500);
    await run('artLoad().then(D => { const x = D.p.find(y => y.m && artMus(y)); screenArtView(x, [x], () => screenMuseum()); })'); await p.waitForTimeout(1500);
    const fly = await p.$('.fun-stamp-fly');
    ok(!!fly && !cyr(await fly.innerText()), 'stamp lands: ' + (fly ? (await fly.innerText()).replace(/\s+/g, ' ') : '-'));
    await p.screenshot({ path: D + `fun-${lang}-${DEV}-stamp.png` });
    await p.waitForTimeout(2000);
    await run("screenMuseum('my')"); await p.waitForTimeout(1200);
    const pass = await p.$$('.fun-pass .fun-stamp'); const ph = await p.$eval('#artBox .art-h', e => e.textContent).catch(() => '-');
    ok(pass.length === 1 && !cyr(ph), 'passport: ' + ph);
    await p.screenshot({ path: D + `fun-${lang}-${DEV}-passport.png` });

    ok(!wm.length, 'no Wikimedia portrait requests');
    ok(!errs.length, 'no page errors');
    await c.close();
  }
  await b.close();
  console.log(bad ? `FAILED ${bad}` : 'ALL OK'); process.exit(bad ? 1 : 0);
})();
