// (service workers are blocked here: the fault injection below must see the requests; the worker's own bypass of /tales/audio/ is checked in the source of the worker, first check below)
// The actors' recordings of the audio tales (LibriVox): the choice «🎙 Слушать актёра / 🔊 Голос игры», the credit, playing the file
// with the sentence lit by its time, pause, a jump, switching to the game voice, a missing file, leaving the screen stops the file.
// Usage: node tests/tales_rec.js [page url] [ru] [phone|laptop]

const { chromium, devices } = require('playwright');
const D = require('path').join(__dirname, 'shots') + '/';
const PAGE = process.argv[2] || 'http://localhost:8781/govorilki/ru/', TAG = process.argv[3] || 'ru', DEV = process.argv[4] || 'phone';
const HOOK = 'const fam = () => ROOT.families[ROOT.curFam] || null;';
const kid = (name, g, tr, age, fr) => ({ stars: 12, plays: {}, likeG: {}, book: { title: '', log: {} }, settings: { name, gender: g, track: tr, age, friend: fr, onboarded: true, lang: TAG } });
let bad = 0; const log = (...a) => console.log(...a), check = (name, ok, more = '') => { if (!ok) bad++; log(`${ok ? 'ok  ' : 'FAIL'} ${name}${more ? ' — ' + more : ''}`); };
(async () => {
  const b = await chromium.launch();
  const fam = { engine: 'device', micOff: true, srOff: true, parentPhone: true, cur: 'k1', curFam: 'ft', families: { ft: { id: 'ft', name: 'Т', cc: 'PT', kids: ['k1', 'k2'], grands: [] } },
    profiles: { k1: kid('Тина', 'f', 'r', 5, 'kitty'), k2: kid('Тоша', 'm', 'l', 8, 'tiger') } };
  const c = await b.newContext(DEV === 'laptop' ? { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1, serviceWorkers: 'block' } : { ...devices['iPhone 13'], deviceScaleFactor: 1, serviceWorkers: 'block' });
  await c.route(/ntfy|wikipedia|wikimedia|huggingface|jsdelivr|youtube|workers\.dev/, r => r.abort());
  await c.route(u => /\/(ru|de|pt|en)?\/?(index\.html)?$/.test(u.pathname), async r => { const x = await r.fetch(); let t = await x.text(); t = t.replace(HOOK, HOOK + ' window.__T = { get P() { return P; }, run: s => eval(s) };'); r.fulfill({ response: x, body: t }); });
  await c.addInitScript(s => { window.__said = []; try { speechSynthesis.speak = u => { window.__said.push(u.text); setTimeout(() => u.onend && u.onend(), 30); }; } catch (e) {} if (localStorage.getItem('seeded')) return; localStorage.setItem('seeded', 1); localStorage.setItem('govorilki-v2', JSON.stringify(s)); }, fam);
  // the test server (python http.server) knows no Range requests, a real host does: serve the recordings with them
  await c.route(/\/tales\/audio\/[^/]+\.mp3$/, async r => {
    const f = require('path').join(__dirname, '..', '..', 'tales', 'audio', new URL(r.request().url()).pathname.split('/').pop());
    let buf; try { buf = require('fs').readFileSync(f); } catch (e) { return r.fulfill({ status: 404, body: '' }); }
    const m = /bytes=(\d*)-(\d*)/.exec(r.request().headers().range || '');
    if (!m) return r.fulfill({ status: 200, contentType: 'audio/mpeg', headers: { 'Accept-Ranges': 'bytes' }, body: buf });
    const a = +m[1] || 0, z = m[2] ? Math.min(+m[2], buf.length - 1) : buf.length - 1;
    r.fulfill({ status: 206, contentType: 'audio/mpeg', headers: { 'Accept-Ranges': 'bytes', 'Content-Range': `bytes ${a}-${z}/${buf.length}` }, body: buf.subarray(a, z + 1) });
  });
  const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  const T = s => p.evaluate(x => window.__T.run(x), s);
  const said = () => p.evaluate(() => window.__said.splice(0));
  const enter = async () => { await p.waitForTimeout(1500); const who = await p.$$('.who-kid'); if (who.length) { await who[0].click(); await p.waitForTimeout(900); } };
  { const swSrc = require('fs').readFileSync(require('path').join(__dirname, '..', 'site-add', 'sw.js'), 'utf8'); check('sw.js lets /tales/audio/ pass (no Range through the cache)', /\/tales\/audio\//.test(swSrc) && /\.json/.test(swSrc.split('/tales/audio/')[1].slice(0, 120))); }
  await p.goto(PAGE); await enter();
  // the tile is on the home screen, in «Учимся» (books and reading live there since the tabs were sorted)
  check('tile in GAMES', await T("GAMES.some(g => g.id === 'bookshelf')"));
  await p.goto(PAGE); await enter();
  const au = () => T("TALE_AUDIO ? { t: TALE_AUDIO.currentTime, paused: TALE_AUDIO.paused, src: TALE_AUDIO.src.split('/').pop() } : null");
  const lit = () => p.$eval('#tlText .ss.on', e => +e.dataset.j).catch(() => -1);
  // every recording in the index: its file is served, its sentence times only go forward and match the tale's sentences
  const dat = await p.evaluate(async () => {
    const base = location.pathname.replace(/ru\/$/, '') + 'tales/', R = await (await fetch(base + 'audio/index.json')).json(), bad = [];
    for (const [id, r] of Object.entries(R)) {
      const h = await fetch(base + 'audio/' + r.f, { method: 'HEAD' }), d = await (await fetch(base + id + '.json')).json();
      const n = d.p.reduce((k, x) => k + (x.match(/[^.!?…]+[.!?…]+[»"]?\s*|[^.!?…]+$/g) || [x]).length, 0);
      if (!h.ok || r.ts.length !== n || r.ts.some((x, i) => i && x < r.ts[i - 1]) || !r.who || !r.src || !/Public Domain/.test(r.lic)) bad.push(id + ':' + h.status + ':' + r.ts.length + '/' + n);
    }
    return { n: Object.keys(R).length, bad };
  });
  check('every recording: file, sentence times, narrator, source, licence', dat.n >= 30 && !dat.bad.length, `${dat.n} recordings; bad: ${dat.bad.join(' ')}`);
  await T("TALES.list(() => {})"); await p.waitForTimeout(1500);
  const rows = await p.$$eval('.tl-i', xs => xs.filter(x => /читает актёр/.test(x.textContent)).map(x => x.dataset.id));
  check('list marks the recorded tales', rows.length >= 4 && rows.includes('kochet-kurica') && rows.includes('tsarevna-lyagushka'), rows.join(','));
  const nopic = await p.$$eval('.tl-i', xs => xs.filter(x => !/читает актёр/.test(x.textContent)).length);
  check('other tales unchanged', nopic >= 25, `${nopic}`);
  await T("TALES.play('petushok', () => {})"); await p.waitForTimeout(800);
  check('no actor choice on a tale without recording', !(await p.$('#tlMode')));
  await T("TALES.play('kochet-kurica', () => {})"); await p.waitForTimeout(1000);
  check('the choice is shown', !!(await p.$('#tlMode')) && (await p.$$('#tlMode .chip')).length === 2);
  const cr = await p.$eval('#tlCr', e => e.textContent);
  check('credit: narrator, LibriVox, public domain', /Лена Сухая/.test(cr) && /LibriVox/.test(cr) && /Public Domain/.test(cr), cr);
  check('actor is the default', /sel/.test(await p.$eval('#tlMode [data-m="actor"]', e => e.className)));
  await p.screenshot({ path: D + `rec-${DEV}-reader.png` });
  await said(); await p.click('#tlPlay'); await p.waitForTimeout(6000);
  const a1 = await au(); check('the file plays', a1 && !a1.paused && a1.t > 3 && /kochet-kurica\.mp3/.test(a1.src), JSON.stringify(a1));
  check('the game voice is silent', (await said()).length === 0);
  const j1 = await lit(); check('the sentence follows the file', j1 >= 1, `${j1}`);
  await p.click('#tlPlay'); await p.waitForTimeout(500);
  const a2 = await au(); check('pause stops the file', a2.paused && /▶/.test(await p.$eval('#tlPlay', e => e.textContent)));
  await p.click('#tlNext'); await p.waitForTimeout(500);
  const j2 = await lit(); check('next sentence', j2 === j1 + 1, `${j1} → ${j2}`);
  await p.click('#tlPlay'); await p.waitForTimeout(1500);
  const a3 = await au(); const ts = await p.evaluate(() => fetch(location.pathname.replace(/ru\/$/, '') + 'tales/audio/index.json').then(r => r.json()));
  check('goes on from that sentence', !a3.paused && Math.abs(a3.t - ts['kochet-kurica'].ts[j2]) < 3, `${a3.t.toFixed(1)} vs ${ts['kochet-kurica'].ts[j2]}`);
  await said(); await p.click('#tlMode [data-m="voice"]'); await p.waitForTimeout(1200);
  const a4 = await au(); check('the game voice takes over, the file stops', a4.paused && (await said()).length > 0 && /игры/.test(await p.$eval('#tlCr', e => e.textContent)));
  await p.click('#tlMode [data-m="actor"]'); await p.waitForTimeout(600);     // was playing → goes on with the file
  if (/▶/.test(await p.$eval('#tlPlay', e => e.textContent))) await p.click('#tlPlay');
  await p.waitForTimeout(1500);
  { const a5 = await au(); check('back to the actor', !a5.paused, JSON.stringify(a5) + ' ' + await p.$eval('#tlPlay', e => e.textContent)); }
  await T("goHome()"); await p.waitForTimeout(1500);
  check('leaving the screen stops the file', (await au()).paused);
  await T("TALES.play('kochet-kurica', () => {})"); await p.waitForTimeout(800);
  check('the choice is remembered', /sel/.test(await p.$eval('#tlMode [data-m="actor"]', e => e.className)));
  // the whole file to its end
  await p.click('#tlPlay'); await p.waitForTimeout(800);
  await T("TALE_AUDIO.currentTime = TALE_AUDIO.duration - 1.2"); await p.waitForTimeout(3500);
  check('the end of the tale is reached', !(await p.$eval('#tlEnd', e => e.hidden)) && (await T("P.tales['kochet-kurica'].done")) == 1);
  // a missing file falls back to the game voice with a message
  await c.route(/tales\/audio\/volk-koza\.mp3/, r => r.abort());
  await T("TALES.play('volk-koza', () => {})"); await p.waitForTimeout(600); await said();
  await p.click('#tlPlay'); await p.waitForTimeout(6000);
  { const m = await p.$eval('#tlCr', e => e.textContent), sd = await said(); check('missing file → game voice and a message', /не загрузилась/.test(m) && sd.length > 0, m + ' | said ' + sd.length); }
  // jumping while the file plays: the late «pause» event of hush() must not stop the button
  await T("TALES.play('kochet-kurica', () => {})"); await p.waitForTimeout(600);
  await p.click('#tlPlay'); await p.waitForTimeout(1200);
  await p.click('#tlNext'); await p.waitForTimeout(1200);
  { const a6 = await au(); check('jump while playing keeps playing', !a6.paused && /Пауза/.test(await p.$eval('#tlPlay', e => e.textContent)), JSON.stringify(a6) + ' ' + await p.$eval('#tlPlay', e => e.textContent) + ' | ' + await p.$eval('#tlCr', e => e.textContent)); }
  await T("goHome()"); await p.waitForTimeout(300);
  // the stream hangs (an old service worker, a bad line): after ~5 s the whole file is fetched and plays
  const hangRange = async r => { if (r.request().headers().range) return; r.fallback(); };
  await c.route(/tales\/audio\/kot-petuh-lisa-2\.mp3/, hangRange);
  await T("TALES.play('kot-petuh-lisa-2', () => {})"); await p.waitForTimeout(600);
  await p.click('#tlPlay'); await p.waitForTimeout(3000);
  check('hung stream: nothing yet', (await au()).paused || (await au()).t < 0.3);
  await p.waitForTimeout(7500);
  { const a7 = await au(); check('hung stream → plays as a whole file', a7 && !a7.paused && a7.t > 1 && /^blob:/.test(await T("TALE_AUDIO.src")), JSON.stringify(a7)); }
  await T("goHome()"); await c.unroute(/tales\/audio\/kot-petuh-lisa-2\.mp3/, hangRange);
  // it hangs completely: a message and the choice of the game voice, no silence
  await c.route(/tales\/audio\/kot-petuh-lisa-2\.mp3/, () => {});      // every request stays pending

  await T("TALES.play('kot-petuh-lisa-2', () => {})"); await p.waitForTimeout(600);
  await p.click('#tlPlay'); await p.waitForTimeout(33000);
  { const m = await p.$eval('#tlCr', e => e.textContent); check('hang → message, button back to «Слушать»', /Запись не играет/.test(m) && /▶/.test(await p.$eval('#tlPlay', e => e.textContent)), m); }
  await p.click('#tlMode [data-m="voice"]'); await p.waitForTimeout(800);
  check('and the game voice is one tap away', (await said()).length > 0 || /игры/.test(await p.$eval('#tlCr', e => e.textContent)));
  check('no page errors', !errs.length, JSON.stringify(errs));
  await b.close();
  log(bad ? `rec ${TAG} ${DEV}: ${bad} failed` : `rec ${TAG} ${DEV}: all ok`);
  process.exit(bad ? 1 : 0);
})();
