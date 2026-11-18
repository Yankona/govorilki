// «🎧 Свои сказки» (task/own-tales): a grown-up adds audio files from the phone; they stay only on this device.
// Тина (6) and Тоша (9), invented. Two short tone files are made here in the test (WAV, one over 2 MB, so it is kept in
// parts) — never a real recording. The grown-up adds both at once, names them, gives a picture, reorders; the child
// plays, pauses, skips +15 s; the place is remembered after a reload, also offline; another child starts from the
// beginning; the end gives «слушал(а)»; minutes reach «Отчёт»; the evening look (dark, sleep timer, dim); deleting frees
// space; nothing is sent over the network and the family sync payload holds no audio and no tale names.
// node tests/own_tales.js [base=http://localhost:8781/govorilki/] [phone|laptop] [langs=ru,en,pt,de]
const { chromium, devices } = require('playwright');
const path = require('path');
const BASE = process.argv[2] || 'http://localhost:8781/govorilki/', DEV = process.argv[3] || 'phone';
const LANGS = (process.argv[4] || 'ru,en,pt,de').split(',');
const SHOTS = path.join(__dirname, 'shots');
const HOOK = 'const fam = () => ROOT.families[ROOT.curFam] || null;';
const SUB = { ru: 'ru/', en: '', pt: 'pt/', de: 'de/' };
const N1 = 'Лунная сказка Тест', N2 = 'Морская сказка Тест';
// a mono 8 kHz 16-bit WAV with a soft tone
function wav(sec, hz) {
  const sr = 8000, n = sr * sec, b = Buffer.alloc(44 + n * 2);
  b.write('RIFF', 0); b.writeUInt32LE(36 + n * 2, 4); b.write('WAVE', 8); b.write('fmt ', 12); b.writeUInt32LE(16, 16);
  b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22); b.writeUInt32LE(sr, 24); b.writeUInt32LE(sr * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34);
  b.write('data', 36); b.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) b.writeInt16LE(Math.round(Math.sin(2 * Math.PI * hz * i / sr) * 3000), 44 + i * 2);
  return b;
}
const FILES = [{ name: 'skazka_odin.wav', mimeType: 'audio/wav', buffer: wav(150, 440) }, { name: 'skazka_dva.wav', mimeType: 'audio/wav', buffer: wav(30, 330) }];
const kid = (name, g, age, fr, lang) => ({ stars: 20, plays: { draw: 6 }, learn: {}, days: {}, settings: { name, gender: g, track: 'r', age, friend: fr, onboarded: true, lang } });
const bad = [];
const ok = (c, msg) => { if (!c) bad.push(msg); };
(async () => {
  const b = await chromium.launch();
  for (const lang of LANGS) {
    const tag = `${lang}/${DEV}`;
    const seed = { engine: 'device', micOff: true, srOff: true, parentPhone: true, cur: 'k2', curFam: 'f1',
      families: { f1: { id: 'f1', name: 'Т', cc: 'PT', kids: ['k1', 'k2'], grands: [] } },
      profiles: { k1: kid('Тина', 'f', 6, 'kitty', lang), k2: kid('Тоша', 'm', 9, 'tiger', lang) } };
    const c = await b.newContext(DEV === 'laptop' ? { viewport: { width: 1280, height: 800 } } : { ...devices['iPhone 13'], deviceScaleFactor: 1 });
    // every request is written down: only our own site may be asked, and never with a body
    const reqs = [];
    c.on('request', r => reqs.push({ u: r.url(), m: r.method(), body: r.postData() || '' }));
    await c.route(/ntfy|wikipedia|huggingface|jsdelivr|youtube|wikimedia|workers\.dev/, r => r.abort());
    await c.route(u => /\/(ru|de|pt|en)?\/?(index\.html)?$|\/app\.[0-9a-f]+\.js$/.test(u.pathname), async r => { const x = await r.fetch(); let t = await x.text(); t = t.replace(HOOK, HOOK + ' window.__T = { run: s => eval(s) };'); r.fulfill({ response: x, body: t }); });
    await c.addInitScript(s => { try { speechSynthesis.speak = u => { setTimeout(() => u.onend && u.onend(), 5); }; } catch (e) {} if (localStorage.getItem('seeded')) return; localStorage.setItem('seeded', 1); localStorage.setItem('govorilki-v2', JSON.stringify(s)); }, seed);
    const p = await c.newPage(); await p.clock.install({ time: new Date('2026-11-18T10:00:00') });
    const errs = []; p.on('pageerror', e => errs.push(e.message));
    const run = s => p.evaluate(x => window.__T.run(x), s);
    const start = async () => { await p.waitForFunction(() => window.__T, null, { timeout: 20000 }); await p.waitForTimeout(1200); const who = await p.$$('.who-kid'); if (who.length) { await who[0].click(); await p.waitForTimeout(800); } };
    await p.goto(BASE + SUB[lang]); await start();
    await run(`switchKid('k2')`); await p.waitForTimeout(600);
    await run('goHome()'); await p.waitForTimeout(500);
    ok(!(await p.$('#otCard')), `${tag}: home card before any tale`);
    ok(await run(`GAMES.find(g => g.id === 'own-tales').hide()`), `${tag}: shelf visible before any tale`);
    // the grown-ups: «Для взрослых» → «Свои сказки» (the parent check passed once)
    await run(`GROWN_OK = true; GROWN_AT = Date.now(); screenParents()`); await p.waitForTimeout(800);
    await p.click('.set-row[data-page="own"]'); await p.waitForTimeout(300);
    const note = await p.$eval('#otSec .ot-note', e => e.textContent).catch(() => '');
    ok(lang !== 'ru' || /только на этом телефоне.*купили или имеете право/.test(note), `${tag}: note «${note}»`);
    await p.click('#otOpen'); await p.waitForSelector('#otAdd');
    await p.setInputFiles('#otFile', FILES);
    await p.waitForFunction(() => document.querySelectorAll('.ot-row').length === 2, null, { timeout: 30000 }).catch(() => {});
    ok((await p.$$('.ot-row')).length === 2, `${tag}: rows ${(await p.$$('.ot-row')).length} msg ${await p.$eval('#otMsg', e => e.textContent).catch(() => '')}`);
    ok(await run(`OWNT.has()`), `${tag}: has() after adding`);
    // names (rows keep the order of the picker: skazka_odin first)
    const nm = p.locator('.ot-nm');
    await nm.nth(0).fill(N1); await nm.nth(0).press('Enter'); await p.waitForTimeout(300);
    await nm.nth(1).fill(N2); await nm.nth(1).press('Enter'); await p.waitForTimeout(300);
    // a picture for the first one, then it goes down
    await p.locator('.ot-cvb').nth(0).click(); await p.waitForSelector('.ot-pick');
    await p.screenshot({ path: `${SHOTS}/owntales-${lang}-${DEV}-pick.png` });
    await p.click('.ot-e[data-e="🐻"]'); await p.waitForTimeout(400);
    await p.locator('.ot-row').nth(0).locator('[data-act="dn"]').click(); await p.waitForTimeout(500);
    const L = await run(`OWNT.list().then(xs => xs.map(x => [x.name, x.e, x.dur, x.n, x.size]))`);
    ok(L.length === 2 && L[0][0] === N2 && L[1][0] === N1 && L[1][1] === '🐻', `${tag}: list ${JSON.stringify(L)}`);
    ok(L.find(x => x[0] === N1)[3] === 2 && L.find(x => x[0] === N1)[2] === 150, `${tag}: parts / length ${JSON.stringify(L)}`);
    const sp1 = await p.$eval('#otSpace', e => e.textContent);
    ok(/2[,.]7 (МБ|MB)/.test(sp1), `${tag}: space «${sp1}»`);
    await p.screenshot({ path: `${SHOTS}/owntales-${lang}-${DEV}-manage.png` });
    if (lang !== 'ru') {
      const tx = (await p.$eval('.screen', e => e.innerText)).split(N1).join('').split(N2).join('');
      ok(!/[А-Яа-яЁё]/.test(tx), `${tag}: Russian left on the grown-ups' page: ${(tx.match(/[^\n]*[А-Яа-яЁё][^\n]*/) || [''])[0]}`);
    }
    // the child's shelf and the player
    await p.click('#otKid'); await p.waitForSelector('.ot-i');
    ok((await p.$$('.ot-i')).length === 2, `${tag}: shelf items`);
    await p.screenshot({ path: `${SHOTS}/owntales-${lang}-${DEV}-shelf.png` });
    await p.locator('.ot-i').nth(1).click(); await p.waitForSelector('#otPP:not([disabled])');
    ok(!(await p.$('.screen.ot-dark')), `${tag}: dark in the daytime`);
    await p.click('#otPP'); await p.waitForTimeout(2500);
    ok(await run(`!!TALE_AUDIO && !TALE_AUDIO.paused && TALE_AUDIO.currentTime > 0.5`), `${tag}: not playing ${await run('TALE_AUDIO && [TALE_AUDIO.paused, TALE_AUDIO.currentTime, TALE_AUDIO.error && TALE_AUDIO.error.code]')}`);
    await p.click('#otFw'); await p.waitForTimeout(300);
    const t1 = await run('TALE_AUDIO.currentTime');
    ok(t1 >= 15, `${tag}: +15 s → ${t1}`);
    await p.click('#otBk'); await p.waitForTimeout(200);
    ok(await run('TALE_AUDIO.currentTime') < t1 - 10, `${tag}: −15 s`);
    await p.click('#otFw'); await p.click('#otFw'); await p.waitForTimeout(1200);
    await p.click('#otPP'); await p.waitForTimeout(300);
    ok(await run('TALE_AUDIO.paused'), `${tag}: pause`);
    const at = Math.floor(await run('TALE_AUDIO.currentTime'));
    await p.screenshot({ path: `${SHOTS}/owntales-${lang}-${DEV}-player.png` });
    await run('goHome()'); await p.waitForTimeout(600);
    ok(!!(await p.$('#otCard')), `${tag}: no home card with tales`);
    ok(!(await run(`GAMES.find(g => g.id === 'own-tales').hide()`)), `${tag}: shelf hidden in «Узнаём»`);
    ok(await run(`(P.ownMin || {})[dayKey()] >= 2`), `${tag}: minutes not counted ${await run('JSON.stringify(P.ownMin)')}`);
    // offline after a reload: the service worker keeps the game, the tales are on the phone
    await p.waitForFunction(() => navigator.serviceWorker && navigator.serviceWorker.controller, null, { timeout: 20000 }).catch(() => ok(false, `${tag}: no service worker`));
    await p.waitForTimeout(2500);
    await c.setOffline(true);
    await p.reload(); await start();
    await run(`switchKid('k2')`); await p.waitForTimeout(500);
    await run(`goHome()`); await p.waitForTimeout(500);
    ok(!!(await p.$('#otCard')), `${tag}: offline: no home card`);
    await p.click('#otCard'); await p.waitForSelector('.ot-i');
    await p.locator('.ot-i').nth(1).click(); await p.waitForSelector('#otPP:not([disabled])'); await p.waitForTimeout(600);
    const back = await run('TALE_AUDIO.currentTime');
    ok(Math.abs(back - at) <= 1, `${tag}: offline: place ${back} ≠ ${at}`);
    await p.click('#otPP'); await p.waitForTimeout(1500);
    ok(await run(`!TALE_AUDIO.paused && TALE_AUDIO.currentTime > ${at}`), `${tag}: offline: not playing`);
    await p.click('#otPP');
    // another child starts from the beginning
    await run(`switchKid('k1')`); await p.waitForTimeout(500);
    await run(`OWNT.list().then(xs => OWNT.play(xs[1].k, goHome))`); await p.waitForSelector('#otPP:not([disabled])'); await p.waitForTimeout(500);
    ok(await run('TALE_AUDIO.currentTime') < 1, `${tag}: Тина starts at ${await run('TALE_AUDIO.currentTime')}`);
    // the short one to the end → «слушала»
    await run(`OWNT.list().then(xs => OWNT.play(xs[0].k, goHome))`); await p.waitForSelector('#otPP:not([disabled])'); await p.waitForTimeout(400);
    await run(`TALE_AUDIO.currentTime = 28`); await p.click('#otPP'); await p.waitForTimeout(3500);
    ok(await p.$eval('#otDone', e => !e.hidden).catch(() => false), `${tag}: no «дослушала»`);
    await run(`OWNT.shelf(goHome)`); await p.waitForSelector('.ot-i');
    ok((await p.$$('.ot-i.seen')).length === 1, `${tag}: «слушала» mark on the shelf`);
    // the evening: dark, sleep timer, the screen goes dark
    await p.clock.setSystemTime(new Date('2026-11-18T20:30:00'));
    await run(`goHome()`); await p.waitForTimeout(500);
    ok(!!(await p.$('#otCard.mb-night')), `${tag}: evening card`);
    await run(`OWNT.list().then(xs => OWNT.play(xs[1].k, goHome))`); await p.waitForSelector('#otPP:not([disabled])');
    ok(!!(await p.$('.screen.ot-dark')) && await p.$eval('#otSleep', e => !e.hidden), `${tag}: no bedtime look`);
    await p.click('#otTm [data-min="10"]'); await p.waitForTimeout(800);
    ok(await run('!TALE_AUDIO.paused') && /10/.test(await p.$eval('#otLeft', e => e.textContent)), `${tag}: sleep timer`);
    await p.screenshot({ path: `${SHOTS}/owntales-${lang}-${DEV}-night.png` });
    await p.click('#otDim'); await p.waitForTimeout(200);
    ok(!!(await p.$('#otDimOv')), `${tag}: no dim`);
    await p.click('#otDimOv'); ok(!(await p.$('#otDimOv')), `${tag}: dim does not go`);
    await p.click('#otPP');
    if (lang !== 'ru') {
      const tx = (await p.$eval('.screen', e => e.innerText)).split(N1).join('').split(N2).join('');
      ok(!/[А-Яа-яЁё]/.test(tx), `${tag}: Russian left in the player: ${(tx.match(/[^\n]*[А-Яа-яЁё][^\n]*/) || [''])[0]}`);
    }
    // «Отчёт»: the minutes, a calm line
    await run(`P.ownMin[dayKey()] = 1260; save()`);
    const d = await run('GUIDE.digest(P)');
    ok(d.tm === 21, `${tag}: digest tm ${d.tm}`);
    await run(`screenParents('guide')`); await p.waitForTimeout(900);
    const line = await p.$eval('.gd-tales', e => e.textContent).catch(() => '');
    ok(/21/.test(line), `${tag}: report line «${line}»`);
    // nothing about the tales in the family data or the sync payload
    const sync = await run(`JSON.stringify([ROOT, Object.keys(ROOT.profiles).map(id => clProf(ROOT.profiles[id]))])`);
    ok(!sync.includes(N1) && !sync.includes(N2) && !sync.includes('skazka') && !/RIFF|UklGR/.test(sync), `${tag}: tales in the synced data`);
    // deleting frees the space
    await run(`GROWN_OK = true; GROWN_AT = Date.now(); OWNT.manage(goHome)`); await p.waitForSelector('.ot-row');
    const del = p.locator('.ot-row').filter({ has: p.locator(`.ot-nm[value="${N1}"]`) }).locator('[data-act="del"]');
    await del.click(); await p.waitForTimeout(200); await del.click(); await p.waitForTimeout(800);
    ok((await p.$$('.ot-row')).length === 1, `${tag}: delete`);
    const sp = await run('OWNT.space()');
    ok(sp.used === FILES[1].buffer.length && sp.n === 1, `${tag}: space after delete ${JSON.stringify(sp)}`);
    const parts = await run(`new Promise(r => { const q = indexedDB.open('govorilki-owntales'); q.onsuccess = () => { const g = q.result.transaction('parts').objectStore('parts').count(); g.onsuccess = () => r(g.result); }; })`);
    ok(parts === 1, `${tag}: parts left ${parts}`);
    // the network: only our site, no request carried a body
    const out = reqs.filter(r => !/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//.test(r.u) && !/^(data|blob):/.test(r.u));
    const posted = reqs.filter(r => r.body);
    ok(!posted.length, `${tag}: requests with a body: ${posted.map(r => r.m + ' ' + r.u).join(', ')}`);
    ok(!out.some(r => /workers\.dev|govorilki-cloud/.test(r.u)), `${tag}: cloud asked: ${out.map(r => r.u).slice(0, 3)}`);
    ok(!errs.length, `${tag}: page errors ${errs.slice(0, 3)}`);
    console.log(`${tag}: done (requests outside: ${out.length}${out.length ? ' ' + [...new Set(out.map(r => new URL(r.u).host))].join(',') : ''})`);
    await c.close();
  }
  await b.close();
  if (bad.length) { console.log('FAIL\n' + bad.join('\n')); process.exit(1); }
  console.log('PASS own_tales');
})();
