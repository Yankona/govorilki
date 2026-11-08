// The microphone is let go and the sound is on the loud speaker: after leaving every screen that listens or records no
// MediaStream track stays live and no speech recogniser keeps running; navigator.audioSession (stubbed — Chromium has no iOS
// routing) ends in «playback»; a tale / the game voice sets «playback» (through «auto») before it plays.

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
  const c = await b.newContext(DEV === 'laptop' ? { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 } : { ...devices['iPhone 13'], deviceScaleFactor: 1 });
  await c.route(/ntfy|wikipedia|wikimedia|huggingface|jsdelivr|youtube|workers\.dev/, r => r.abort());
  await c.route(u => /\/(ru|de|pt|en)?\/?(index\.html)?$/.test(u.pathname), async r => { const x = await r.fetch(); let t = await x.text(); t = t.replace(HOOK, HOOK + ' window.__T = { get P() { return P; }, run: s => eval(s) };'); r.fulfill({ response: x, body: t }); });
  await c.addInitScript(s => { window.__said = []; try { speechSynthesis.speak = u => { window.__said.push(u.text); setTimeout(() => u.onend && u.onend(), 30); }; } catch (e) {} if (localStorage.getItem('seeded')) return; localStorage.setItem('seeded', 1); localStorage.setItem('govorilki-v2', JSON.stringify(s)); }, fam);
  await c.addInitScript(() => {
    window.__tracks = []; window.__srs = []; window.__as = { type: 'auto', log: [] };
    Object.defineProperty(navigator, 'audioSession', { configurable: true, value: { get type() { return window.__as.type; }, set type(v) { window.__as.type = v; window.__as.log.push(v); } } });
    navigator.mediaDevices.getUserMedia = async () => {
      const a = new AudioContext(), d = a.createMediaStreamDestination(), o = a.createOscillator(); o.connect(d); o.start();
      window.__tracks.push(...d.stream.getTracks()); return d.stream;
    };
    window.SpeechRecognition = window.webkitSpeechRecognition = class { constructor() { this.running = false; window.__srs.push(this); } start() { this.running = true; if (this.onstart) this.onstart(); } abort() { if (this.running) { this.running = false; if (this.onend) this.onend(); } } stop() { this.abort(); } };
  });
  const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  const T = s => p.evaluate(x => window.__T.run(x), s);
  const said = () => p.evaluate(() => window.__said.splice(0));
  const enter = async () => { await p.waitForTimeout(1500); const who = await p.$$('.who-kid'); if (who.length) { await who[0].click(); await p.waitForTimeout(900); } };
  await p.goto(PAGE); await enter();
  // the tile is on the home screen, in «Учимся» (books and reading live there since the tabs were sorted)
  check('tile in GAMES', await T("GAMES.some(g => g.id === 'bookshelf')"));
  await p.goto(PAGE); await enter();
  const live = () => p.evaluate(() => window.__tracks.filter(t => t.readyState === 'live').length);
  const srLive = () => p.evaluate(() => window.__srs.filter(r => r.running).length);
  const as = () => p.evaluate(() => window.__as.type);
  const reset = () => p.evaluate(() => { window.__tracks.length = 0; window.__srs.length = 0; window.__as.log.length = 0; });
  const home = async () => { await T("goHome()"); await p.waitForTimeout(1800); };
  await T("MIC.denied = false; ROOT.micOff = false; ROOT.srOff = false; HEAR.off = false");

  // 1. the recording screen: leave in the middle of a recording
  await T("screenRec()"); await p.waitForTimeout(600);
  await p.click('#recBtn'); await p.waitForTimeout(1200);
  check('recording: microphone is on', (await live()) >= 1 && (await as()) === 'play-and-record', `${await live()} ${await as()}`);
  await home();
  check('left the recording screen: no live track', (await live()) === 0, `${await live()}`);
  check('...and the speaker is back', (await as()) === 'playback', await as());
  // ...and a finished recording
  await reset(); await T("screenRec()"); await p.waitForTimeout(600);
  await p.click('#recBtn'); await p.waitForTimeout(800); await p.click('#recBtn'); await p.waitForTimeout(1500);
  check('recording stopped: track ended, speaker', (await live()) === 0 && (await as()) === 'playback', `${await live()} ${await as()}`);
  await home();

  // 2. the loudness meter microphone of the games
  await reset(); await T("micOn()"); await p.waitForTimeout(600);
  check('micOn: a live track', (await live()) >= 1);
  await home();
  check('left: the track is ended, the speaker is back', (await live()) === 0 && (await as()) === 'playback', `${await live()} ${await as()}`);

  // 3. speech recognition of a whole game and of one word
  await reset(); await T("window.__lv = hearLive(() => {})"); await p.waitForTimeout(600);
  check('hearLive: a recogniser runs, microphone category', (await srLive()) >= 1 && (await as()) === 'play-and-record', `${await srLive()} ${await as()}`);
  await home();
  check('left: no recogniser runs, the speaker is back', (await srLive()) === 0 && (await as()) === 'playback', `${await srLive()} ${await as()}`);
  await reset(); await T("void (window.__h = hear('мама', { maxMs: 60000 }))"); await p.waitForTimeout(500);
  check('hear: a recogniser runs', (await srLive()) >= 1);
  await home();
  check('left: it was aborted, the speaker is back', (await srLive()) === 0 && (await as()) === 'playback', `${await srLive()} ${await as()}`);

  // 4. a tale: the speaker is asked for again before it plays, whatever the session said before
  await reset(); await p.evaluate(() => { window.__as.type = 'play-and-record'; });
  await T("TALES.play('kochet-kurica', () => {})"); await p.waitForTimeout(800);
  await p.click('#tlPlay'); await p.waitForTimeout(800);
  const lg = await p.evaluate(() => window.__as.log.join(','));
  check('tale: «playback» is set (through «auto»)', (await as()) === 'playback' && /auto,playback/.test(lg), `${await as()} [${lg}]`);
  await p.click('#tlPlay'); await home();
  // the game voice while a recogniser listens: it holds, so the category goes back and returns
  await reset(); await T("window.__lv = hearLive(() => {}); say('Привет')"); await p.waitForTimeout(1500);
  const lg2 = await p.evaluate(() => window.__as.log.join(','));
  check('voice while listening: speaker first, microphone after', /playback/.test(lg2), lg2);
  await home();
  check('no page errors', !errs.length, JSON.stringify(errs));
  await b.close();
  log(bad ? `mic ${TAG} ${DEV}: ${bad} failed` : `mic ${TAG} ${DEV}: all ok`);
  process.exit(bad ? 1 : 0);
})();
