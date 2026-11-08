// Speech recognition in the games, with a stub recogniser that answers what the test says (alternatives, interim
// results, errors): «Скажи слово» (askSaid) takes the word, a close word (the sound being learned) with praise and the
// friend saying it right, opens the button after two misses, falls back to the loudness when the network or the
// permission fails, takes any voice for a syllable; the motorbike ride hears a sign's word; no recogniser stays running
// after leaving. Usage: node tests/asr.js [page] [lang] [phone|laptop]
const { chromium, devices } = require('playwright');
const D = require('path').join(__dirname, 'shots') + '/';
const PAGE = process.argv[2] || 'http://localhost:8781/govorilki/ru/', TAG = process.argv[3] || 'ru', DEV = process.argv[4] || 'phone';
const HOOK = 'const fam = () => ROOT.families[ROOT.curFam] || null;';
const W = { ru: ['лодка', 'водка', 'кошка', 'ла'], en: ['rabbit', 'wabbit', 'yellow', 'la'], pt: ['rato', 'lato', 'gato', 'la'], de: ['Rakete', 'Lakete', 'Hund', 'la'] }[TAG];
const kid = (name, g, tr, age, fr) => ({ stars: 12, plays: {}, likeG: {}, book: { title: '', log: {} }, settings: { name, gender: g, track: tr, age, friend: fr, onboarded: true, lang: TAG } });
let bad = 0; const log = (...a) => console.log(...a), check = (name, ok, more = '') => { if (!ok) bad++; log(`${ok ? 'ok  ' : 'FAIL'} ${name}${more ? ' — ' + more : ''}`); };
(async () => {
  require('fs').mkdirSync(D, { recursive: true });
  const b = await chromium.launch();
  const fam = { engine: 'device', parentPhone: true, cur: 'k1', curFam: 'ft', families: { ft: { id: 'ft', name: 'Т', cc: 'PT', kids: ['k1'], grands: [] } }, profiles: { k1: kid('Тина', 'f', 'r', 6, 'kitty') } };
  const c = await b.newContext(DEV === 'laptop' ? { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 } : { ...devices['iPhone 13'], deviceScaleFactor: 1 });
  await c.route(/ntfy|wikipedia|wikimedia|huggingface|jsdelivr|youtube|workers\.dev/, r => r.abort());
  await c.route(u => /\/(ru|de|pt|en)?\/?(index\.html)?$/.test(u.pathname), async r => { const x = await r.fetch(); let t = await x.text(); t = t.replace(HOOK, HOOK + ' window.__T = { get P() { return P; }, run: s => eval(s) };'); r.fulfill({ response: x, body: t }); });
  await c.addInitScript(s => { window.__said = []; try { speechSynthesis.speak = u => { window.__said.push(u.text); setTimeout(() => u.onend && u.onend(), 30); }; } catch (e) {} if (localStorage.getItem('seeded')) return; localStorage.setItem('seeded', 1); localStorage.setItem('govorilki-v2', JSON.stringify(s)); }, fam);
  await c.addInitScript(() => {
    window.__srs = [];
    navigator.mediaDevices.getUserMedia = async () => { const a = new AudioContext(), d = a.createMediaStreamDestination(), o = a.createOscillator(); o.connect(d); o.start(); return d.stream; };
    window.SpeechRecognition = window.webkitSpeechRecognition = class {
      constructor() { this.running = false; this.res = []; window.__srs.push(this); }
      start() { this.running = true; setTimeout(() => this.onstart && this.onstart(), 10); }
      abort() { if (this.running) { this.running = false; setTimeout(() => this.onend && this.onend(), 5); } }
      stop() { this.abort(); }
    };
    // the test speaks: a phrase with its alternatives, interim or final; or an error
    window.__say = (alts, final = true) => {
      const r = [...window.__srs].reverse().find(x => x.running); if (!r) return false;
      const res = alts.map(t => ({ transcript: t, confidence: .8 })); res.isFinal = final;
      if (r.res.length && !r.res[r.res.length - 1].isFinal) r.res.pop();
      r.res.push(res); const idx = r.res.length - 1;
      if (r.onresult) r.onresult({ resultIndex: idx, results: r.res });
      if (final && !r.continuous) r.stop();
      return true;
    };
    window.__err = e => { const r = [...window.__srs].reverse().find(x => x.running); if (!r) return false; if (r.onerror) r.onerror({ error: e }); r.stop(); return true; };
  });
  const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  const T = s => p.evaluate(x => window.__T.run(x), s);
  const wait = ms => p.waitForTimeout(ms);
  const say = (a, f) => p.evaluate(([a, f]) => window.__say(a, f), [a, f]);
  const running = () => p.evaluate(() => window.__srs.filter(r => r.running).length);
  const waitRun = async () => { for (let i = 0; i < 40; i++) { if (await running()) return true; await wait(100); } return false; };
  await p.goto(PAGE); await wait(1500); const who = await p.$$('.who-kid'); if (who.length) { await who[0].click(); await wait(900); }
  const start = async opts => { await T('goHome()'); await wait(400); await T(`newScreen(); shell('t', '<p>x</p>'); window.__ok = 0; askSaid('Я сказала!', ${opts}).then(() => { window.__ok = 1; }); 0`); await wait(300); };
  const state = () => p.evaluate(() => { const b = document.querySelector('.said'), h = document.querySelector('.said-heard'); return { open: !!b && !b.classList.contains('wait'), ear: !!b && b.classList.contains('ear'), text: b ? b.textContent : '', heard: h ? h.textContent : '' }; });
  const saidNow = () => p.evaluate(() => window.__said.splice(0).join(' | '));
  check('recognition on', await T('srOk()'));

  // 1. the word itself, after an interim noise, in the second alternative
  await start(`{ expect: '${W[0]}' }`);
  check('listening shows «Я слушаю…» and pulses', await waitRun() && (await state()).ear, JSON.stringify(await state()));
  await p.screenshot({ path: `${D}asr-${TAG}-${DEV}-listen.png` });
  await say(['mmm'], false); await wait(150);
  check('interim noise: not yet', !(await state()).open);
  await say(['bla bla', W[0].toUpperCase() + '!'], true); await wait(400);
  let s = await state(); check('word in 2nd alternative → button opens', s.open && s.heard.includes('✓'), JSON.stringify(s));
  await p.click('.said'); await wait(300); check('tap → next', await T('window.__ok') === 1);

  // 2. a close word (the trained sound): praise, the friend says the word, then the button
  await start(`{ expect: '${W[0]}' }`); await waitRun(); await saidNow();
  await say([W[1]], true); await wait(1500);
  s = await state(); const spoken = await saidNow();
  check('close word → praised, the friend says the word', s.open && spoken.toLowerCase().includes(W[0].toLowerCase()), `${JSON.stringify(s)} said: ${spoken}`);

  // 3. another word twice: a hint, then the button opens anyway with «try again — or press»
  await start(`{ expect: '${W[0]}' }`); await waitRun();
  await say([W[2]], true); await wait(500);
  s = await state(); check('other word → not taken, a hint', !s.open && s.heard.length > 3, JSON.stringify(s));
  await waitRun(); await say([W[2]], true); await wait(500);
  s = await state(); check('second miss → the button opens', s.open, JSON.stringify(s));
  await p.screenshot({ path: `${D}asr-${TAG}-${DEV}-miss.png` });
  check('still listening behind the open button', await waitRun());
  await say([W[0]], true); await wait(400); s = await state(); check('said right later → ✓', s.heard.includes('✓'), JSON.stringify(s));

  // 4. silence (no-speech) twice → button
  await start(`{ expect: '${W[0]}' }`); await waitRun(); await p.evaluate(() => window.__err('no-speech')); await wait(300);
  await waitRun(); await p.evaluate(() => window.__err('no-speech')); await wait(400);
  s = await state(); check('silence twice → button opens', s.open, JSON.stringify(s));

  // 5. a syllable: any voice counts
  await start(`{ expect: '${W[3]}', loose: true }`); await waitRun(); await say(['a'], true); await wait(400);
  s = await state(); check('syllable: any voice → button', s.open, JSON.stringify(s));

  // 6. no internet: back to the loudness, word checks off for a minute
  await start(`{ expect: '${W[0]}' }`); await waitRun(); await p.evaluate(() => window.__err('network')); await wait(600);
  check('network error → loudness, recognition paused', !(await T('srOk()')) && (await running()) === 0);
  await T('HEAR.netAt = 0');

  // 7. permission refused: recognition off
  await start(`{ expect: '${W[0]}' }`); await waitRun(); await p.evaluate(() => window.__err('not-allowed')); await wait(600);
  check('not-allowed → recognition off', await T('HEAR.off') === true);
  await T('HEAR.off = false');

  // 8. the motorbike ride
  await T('goHome()'); await wait(300); await T('screenMoto()'); await wait(1500);
  await p.click('#mGo'); await wait(2500);
  const word0 = await T('window.__T.moto && window.__T.moto.st().sign && window.__T.moto.st().sign.word');
  if (word0) {
    // the friend may still be speaking (what is heard then is the friend's own voice): say it until the ride hears it
    let got = 0, dbg = '';
    for (let i = 0; i < 20 && !got; i++) { await say([word0], true); await wait(500); got = await T('window.__T.moto.st().words'); dbg = await T('JSON.stringify({ SAYING, sign: window.__T.moto.st().sign, hid: $("#mSign").hidden, h: $("#mHeard").textContent })'); }
    check('ride: the sign word heard', got >= 1, 'word ' + word0 + ' ' + dbg);
  } else check('ride: a sign shows', false, 'no sign');
  await T('goHome()'); await wait(800);
  check('no recogniser left running', (await running()) === 0, String(await running()));

  check('no page errors', !errs.length, errs.join(' | '));
  await b.close();
  log(bad ? `${bad} FAILED` : 'all ok'); process.exit(bad ? 1 : 0);
})();
