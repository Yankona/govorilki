// «🎤 Прочитать своим голосом»: a grown-up of an invented family records a tale sentence by sentence (getUserMedia gives a
// generated tone, the browser's MediaRecorder records it), re-records one sentence, the child hears «🎧 Читает бабушка …» with
// the text lit, the tale comes first in the list with the family's face; the recording lives only in IndexedDB — never in
// localStorage (the cloud sync and exports read that), no request carries audio; the microphone is let go after recording;
// hidden in the preview of a relative's screen; deleting removes it.
// Usage: node tests/family_reads.js [page url] [ru] [phone|laptop]

const { chromium, devices } = require('playwright');
const D = require('path').join(__dirname, 'shots') + '/';
const PAGE = process.argv[2] || 'http://localhost:8781/govorilki/ru/', TAG = process.argv[3] || 'ru', DEV = process.argv[4] || 'phone';
const HOOK = 'const fam = () => ROOT.families[ROOT.curFam] || null;';
const kid = (name, g, tr, age, fr) => ({ stars: 12, plays: {}, likeG: {}, book: { title: '', log: {} }, settings: { name, gender: g, track: tr, age, friend: fr, onboarded: true, lang: TAG } });
let bad = 0; const log = (...a) => console.log(...a), check = (name, ok, more = '') => { if (!ok) bad++; log(`${ok ? 'ok  ' : 'FAIL'} ${name}${more ? ' — ' + more : ''}`); };
(async () => {
  const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  const fam = { engine: 'device', micOff: true, srOff: true, parentPhone: true, cur: 'k1', curFam: 'ft',
    families: { ft: { id: 'ft', name: 'Т', cc: 'PT', kids: ['k1', 'k2'], grands: [{ id: 'g1', name: 'Бабушка Лида', she: true, av: 'f5cba7.bdbdbd.c101r11.5a3b26' }] } },
    profiles: { k1: kid('Тина', 'f', 'r', 5, 'kitty'), k2: kid('Тоша', 'm', 'l', 8, 'tiger') } };
  const c = await b.newContext(DEV === 'laptop' ? { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 } : { ...devices['iPhone 13'], deviceScaleFactor: 1 });
  await c.route(/ntfy|wikipedia|wikimedia|huggingface|jsdelivr|youtube|workers\.dev/, r => r.abort());
  await c.route(u => /\/(ru|de|pt|en)?\/?(index\.html)?$/.test(u.pathname), async r => { const x = await r.fetch(); let t = await x.text(); t = t.replace(HOOK, HOOK + ' window.__T = { get P() { return P; }, run: s => eval(s) };'); r.fulfill({ response: x, body: t }); });
  await c.addInitScript(s => { window.__said = []; try { speechSynthesis.speak = u => { window.__said.push(u.text); setTimeout(() => u.onend && u.onend(), 30); }; } catch (e) {} if (localStorage.getItem('seeded')) return; localStorage.setItem('seeded', 1); localStorage.setItem('govorilki-v2', JSON.stringify(s)); }, fam);
  await c.addInitScript(() => {
    window.__tracks = []; window.__as = { type: 'auto', log: [] };
    Object.defineProperty(navigator, 'audioSession', { configurable: true, value: { get type() { return window.__as.type; }, set type(v) { window.__as.type = v; window.__as.log.push(v); } } });
    // the «microphone»: a generated tone (a voice-like 220 Hz with a wobble)
    navigator.mediaDevices.getUserMedia = async () => {
      const a = new AudioContext(), d = a.createMediaStreamDestination(), o = a.createOscillator(), l = a.createOscillator(), g = a.createGain();
      o.frequency.value = 220; l.frequency.value = 5; g.gain.value = 30; l.connect(g); g.connect(o.frequency); o.connect(d); o.start(); l.start();
      window.__tracks.push(...d.stream.getTracks()); return d.stream;
    };
  });
  const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  const sent = []; p.on('request', r => { if (r.method() !== 'GET' || /^blob:/.test(r.url())) { const b = r.postDataBuffer() || Buffer.alloc(0); sent.push({ u: `${r.method()} ${r.url().slice(0, 60)}`, n: b.length, audio: /OpusHead|webm|ftyp|audio\//.test(b.toString('latin1')) }); } });
  const T = s => p.evaluate(x => window.__T.run(x), s);
  const said = () => p.evaluate(() => window.__said.splice(0));
  const live = () => p.evaluate(() => window.__tracks.filter(t => t.readyState === 'live').length);
  const as = () => p.evaluate(() => window.__as.type);
  const idb = () => p.evaluate(() => new Promise(res => { const r = indexedDB.open('govorilki-voices'); r.onsuccess = () => { const d = r.result; if (!d.objectStoreNames.contains('tales')) { res([]); return; } const q = d.transaction('tales').objectStore('tales').getAll(); q.onsuccess = () => res(q.result.map(x => ({ k: x.k, who: x.who, mime: x.mime, n: x.n, parts: x.parts.map(b => b ? b.byteLength : 0), dur: x.dur }))); }; }));
  const lit = () => p.$eval('#tlText .ss.on', e => +e.dataset.j).catch(() => -1);
  const enter = async () => { await p.waitForTimeout(1500); const who = await p.$$('.who-kid'); if (who.length) { await who[0].click(); await p.waitForTimeout(900); } };
  await p.goto(PAGE); await enter();
  if (TAG !== 'ru') {
    check('tales (and recording) hidden in this language', await T("GAMES.find(g => g.id === 'tales').hide()"));
    check('no page errors', !errs.length, JSON.stringify(errs)); await b.close(); log(bad ? `${bad} FAILED` : 'all ok'); process.exit(bad ? 1 : 0);
  }
  await T("GROWN_OK = true");

  // 1. a tale without an actor: the big invitation
  await T("TALES.play('petushok', () => {})"); await p.waitForTimeout(1000);
  check('big «Прочитать своим голосом» on a tale without an actor', !!(await p.$('.fr-cta #tlRec')));
  await p.screenshot({ path: D + `fr-${DEV}-cta.png` });
  await T("TALES.play('kochet-kurica', () => {})"); await p.waitForTimeout(1000);
  check('small button beside the actor', !!(await p.$('.fr-small #tlRec')) && !(await p.$('.fr-cta')));
  await T("TALES.play('petushok', () => {})"); await p.waitForTimeout(1000);
  await p.click('#tlRec'); await p.waitForTimeout(800);
  const who = await p.$$eval('.fr-r', xs => xs.map(x => x.textContent.trim()));
  check('who reads: the family grown-up with portrait, mum, dad', who.length === 3 && /Лида/.test(who[0]) && !!(await p.$('.fr-r[data-w="g1"] svg.ava')), who.join(' | '));
  check('privacy line under the choice', /только на этом телефоне/.test(await p.$eval('.fr-priv', e => e.textContent)));
  await p.screenshot({ path: D + `fr-${DEV}-who.png` });
  await p.click('.fr-r[data-w="g1"]'); await p.waitForTimeout(800);
  check('recording screen: big text, first sentence lit', (await p.$$('#frText .ss')).length > 5 && (await p.$eval('#frText .ss.on', e => +e.dataset.j)) === 0);
  check('privacy line under the record button', /только на этом телефоне/.test(await p.$eval('.fr-ctl .fr-priv', e => e.textContent)));

  // 2. three sentences
  await p.click('#frGo'); await p.waitForTimeout(1300);
  check('recording: microphone on, play-and-record', (await live()) >= 1 && (await as()) === 'play-and-record', `${await live()} ${await as()}`);
  await p.screenshot({ path: D + `fr-${DEV}-rec.png` });
  await p.click('#frNext'); await p.waitForTimeout(1300);
  check('«Дальше»: the second sentence lit', (await p.$eval('#frText .ss.on', e => +e.dataset.j)) === 1);
  await p.click('#frNext'); await p.waitForTimeout(1300);
  await p.click('#frPause'); await p.waitForTimeout(800);
  check('pause: the microphone is let go, speaker back', (await live()) === 0 && (await as()) === 'playback', `${await live()} ${await as()}`);
  let db = await idb();
  check('3 sentences saved in IndexedDB', db.length === 1 && db[0].parts.filter(Boolean).length === 3, JSON.stringify(db.map(x => x.parts.slice(0, 4))));
  const kbps = db[0] ? db[0].parts.slice(0, 3).reduce((a, x) => a + x, 0) * 8 / 1000 / db[0].dur.slice(0, 3).reduce((a, x) => a + x, 0) : 0;
  check('voice-sized: ≤ 64 kbit/s', kbps > 0 && kbps <= 64, `${kbps.toFixed(1)} kbit/s, ${db[0] && db[0].mime}`);
  check('size shown', /Записано 3 из \d+ фраз · \d+ КБ/.test(await p.$eval('#frInfo', e => e.textContent)), await p.$eval('#frInfo', e => e.textContent));
  check('recorded sentences marked', (await p.$$('#frText .ss.done')).length === 3);
  // 3. re-record the second sentence, longer
  const before = db[0].dur[1];
  await p.click('#frText .ss[data-j="1"]'); await p.waitForTimeout(300);
  check('tap a sentence: it is the current one', (await p.$eval('#frText .ss.on', e => +e.dataset.j)) === 1);
  await p.click('#frGo'); await p.waitForTimeout(2300); await p.click('#frPause'); await p.waitForTimeout(800);
  db = await idb();
  check('sentence 2 re-recorded', db[0].dur[1] > before + 0.5 && db[0].parts.filter(Boolean).length === 3, `${before} → ${db[0].dur[1]}`);
  check('mic let go again', (await live()) === 0 && (await as()) === 'playback');
  await p.screenshot({ path: D + `fr-${DEV}-paused.png` });
  // 4. «Готово» → the child's player, the family's voice chosen
  await p.click('#frDone'); await p.waitForTimeout(1200);
  const chip = await p.$eval('#tlMode .chip.sel', e => e.textContent).catch(() => '');
  check('player: «Читает бабушка Лида» chosen', /Читает бабушка Лида/.test(chip), chip);
  check('credit says it stays on the phone', /только на этом телефоне/.test(await p.$eval('#tlCr', e => e.textContent)));
  await said();
  await p.click('#tlPlay'); await p.waitForTimeout(400);
  const src = await T("TALE_AUDIO ? TALE_AUDIO.src.slice(0, 5) : ''");
  check('plays the family recording', src === 'blob:', src);
  const seen = new Set(); for (let i = 0; i < 40 && !seen.has(3); i++) { seen.add(await lit()); await p.waitForTimeout(150); }
  check('text lit in sync: 0, 1, 2, then 3', [0, 1, 2, 3].every(j => seen.has(j)), [...seen].join(','));
  await p.waitForTimeout(400);
  const sd = await said();
  check('the unread 4th sentence: the game voice', sd.length >= 1, sd[0]);
  await p.screenshot({ path: D + `fr-${DEV}-play.png` });
  await p.click('#tlPlay'); await p.waitForTimeout(300);
  check('pause stops the recording', await T("!TALE_AUDIO || TALE_AUDIO.paused"));
  // 5. the list: our tale first, with the face
  await T("TALES.list(() => {})"); await p.waitForTimeout(1200);
  const first = await p.$eval('.tl-i', e => ({ id: e.dataset.id, fam: e.classList.contains('fam'), t: e.textContent }));
  check('list: the family tale first, with a badge', first.id === 'petushok' && first.fam && /Читает бабушка Лида/.test(first.t) && /Читает наша семья/.test(await p.$eval('.tl-h', e => e.textContent)), JSON.stringify(first));
  await p.screenshot({ path: D + `fr-${DEV}-list.png` });
  // 6. privacy: nothing of the audio in localStorage (the cloud sync and exports read ROOT), no request carried it
  const ls = await p.evaluate(() => { const s = localStorage.getItem('govorilki-v2') || ''; return { len: s.length, parts: /"parts"|OpusHead|webm/.test(s) }; });
  check('nothing of the recording in ROOT/localStorage', !ls.parts, JSON.stringify(ls));
  check('no request carried audio (no audio data, no body over 2 KB)', !sent.some(x => x.audio || x.n > 2000), JSON.stringify(sent.filter(x => x.audio || x.n > 2000)));
  // 7. the preview of a relative's screen: hidden
  await T("PREVIEW = { keep: {} }"); await T("TALES.play('petushok', () => {})"); await p.waitForTimeout(1000);
  check('preview: no recording button, no family voice', !(await p.$('#tlRec')) && !(await p.$('.fr-chip')));
  await T("PREVIEW = null");
  // 8. delete
  await T("TALES.play('petushok', () => {})"); await p.waitForTimeout(1000);
  await p.click('#tlRec'); await p.waitForTimeout(700);
  check('who: shows what is recorded', /записано 3 из/.test(await p.$eval('.fr-r[data-w="g1"]', e => e.textContent)));
  await p.click('.fr-r[data-w="g1"]'); await p.waitForTimeout(700);
  await p.click('#frDel'); await p.waitForTimeout(200);
  check('delete asks once more', (await idb()).length === 1 && /Точно/.test(await p.$eval('#frDel', e => e.textContent)));
  await p.click('#frDel'); await p.waitForTimeout(500);
  check('deleted from the phone', (await idb()).length === 0);
  await T("TALES.list(() => {})"); await p.waitForTimeout(1000);
  check('list: no family badge after delete', !(await p.$('.tl-i.fam')));
  // 9. leave in the middle of a sentence: the microphone goes
  await T("TALES.play('repka', () => {})"); await p.waitForTimeout(900);
  await p.click('#tlRec'); await p.waitForTimeout(600); await p.click('.fr-r[data-w="_mom"]'); await p.waitForTimeout(600);
  await p.click('#frGo'); await p.waitForTimeout(900);
  await T("goHome()"); await p.waitForTimeout(1500);
  check('left while recording: no live track, speaker', (await live()) === 0 && (await as()) === 'playback', `${await live()} ${await as()}`);

  check('no page errors', !errs.length, JSON.stringify(errs));
  await b.close();
  log(bad ? `${bad} FAILED` : 'all ok');
  process.exit(bad ? 1 : 0);
})();
