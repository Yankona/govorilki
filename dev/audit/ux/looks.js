// 4. The three looks on a phone: home + one game + a story in each; font sizes < 14px, tap targets < 44px, and the
// contrast audit borrowed from dev/tests/look_dark.js. node looks.js [phone|laptop]
const L = require('./lib');
const DEV = process.argv[2] || 'phone';
const src = L.fs.readFileSync('/home/user/govorilki/dev/tests/look_dark.js', 'utf8');
const AUDIT_SRC = src.slice(src.indexOf('const AUDIT = ') + 'const AUDIT = '.length, src.indexOf('(async () => {')).trim().replace(/;$/, '');
(async () => {
  const b = await L.chromium.launch();
  const seed = L.seedOf('ru', { k1: L.kid('Тоша', 'm', 7, 'tiger', 'ru', 'r', { stars: 37 }) });
  const { p, shot, text, run } = await L.open(b, { lang: 'ru', seed, dev: DEV, tag: 'looks' });
  const out = {}; const who = await p.$$('.who-kid'); if (who.length) { await who[0].click(); await p.waitForTimeout(900); }
  await run('GUARD.free = 1');
  const audit = () => p.evaluate(`(${AUDIT_SRC})()`);
  const measure = async (look, screen) => { const m = await p.evaluate(L.METRICS, 14); const c = await audit(); const f = await shot(`4-look-${look}-${DEV}-${screen}`);
    out[look] = out[look] || {}; out[look][screen] = { textN: m.textN, small: m.small, tapN: m.tapN, taps: m.taps, overflowX: m.overflowX, contrast: c, shot: f };
    console.log(`${look}/${screen}: texts ${m.textN}, <14px: ${m.small.length} (min ${m.small[0] ? m.small[0].px + 'px «' + m.small[0].text + '»' : '-'}), taps ${m.tapN}, <44px: ${m.taps.length} (worst ${m.taps[0] ? m.taps[0].w + 'x' + m.taps[0].h + ' «' + m.taps[0].text + '»' : '-'}), contrast fails ${c.length}${c.length ? ': ' + c.slice(0, 3).join(' | ') : ''}`); };
  for (const look of ['bright', 'calm', 'dark']) {
    L.mark('looks/' + look);
    await run(`P.settings.look = '${look}'; fam().look = '${look}'; save(); applyLook && applyLook()`).catch(() => run(`P.settings.look = '${look}'; save()`));
    await run('goHome()'); await p.waitForTimeout(800);
    const cls = await p.evaluate(() => document.body.className); console.log(look, 'body:', cls);
    await measure(look, '1-home');
    await p.evaluate(() => { const s = document.querySelector('#stage') || document.scrollingElement; s.scrollTop = 900; }); await measure(look, '1b-home-scrolled');
    await run(`GAMES.find(g => g.id === 'math-count').go()`); await p.waitForTimeout(1200); await measure(look, '2-game-math-count');
    await run(`GAMES.find(g => g.id === 'hear-pairs').go()`); await p.waitForTimeout(1200); await measure(look, '2b-game-hear-pairs');
    await run(`screenLearn('space')`); await p.waitForTimeout(1000); await measure(look, '3-learn-list');
    await run(`screenStory('space', 0)`); await p.waitForTimeout(2500); await measure(look, '4-story');
    await run(`TRAVEL.screen()`); await p.waitForTimeout(1200); await measure(look, '5-travel');
    const tv = await p.$('.tv-c'); if (tv) { await tv.click(); await p.waitForTimeout(1500); await measure(look, '5b-travel-place'); const st = await p.$('.tv-st, .ld-g, .tile'); }
    await run(`screenParents()`); await p.waitForTimeout(1000); await measure(look, '6-parents');
    await run(`screenAlbum()`); await p.waitForTimeout(1000); await measure(look, '7-album');
  }
  L.fs.writeFileSync(`looks-${DEV}.json`, JSON.stringify(out, null, 1));
  L.saveLog(`log-looks-${DEV}.json`);
  await b.close();
})().catch(e => { console.error('FATAL', e); process.exit(1); });
