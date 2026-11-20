// Audio tales in English, Portuguese and German (tales/<lang>/, recordings in tales/audio/<lang>/): the tile is there, the list
// has the tales, every recording's file, sentence times, reader and licence are right, a recorded tale plays its file with the
// sentence lit, the credit names the reader and LibriVox, the text source is shown, the game voice reads a tale without a
// recording in the page's language (no Russian on screen or in the voice), no page errors.
// Usage: node tests/tales_langs.js [base url] [phone|laptop]      env LANGS=en,pt,de
const { chromium, devices } = require('playwright');
const fs = require('fs'), path = require('path'), D = path.join(__dirname, 'shots') + '/';
fs.mkdirSync(D, { recursive: true });
const BASE = process.argv[2] || 'http://localhost:8781/govorilki/', DEV = process.argv[3] || 'phone';
const HOOK = 'const fam = () => ROOT.families[ROOT.curFam] || null;';
const LANGS = Object.entries({ en: '', pt: 'pt/', de: 'de/' }).filter(x => !process.env.LANGS || process.env.LANGS.includes(x[0]));
const VOICE_ONLY = { en: null, pt: 'pinto-borrachudo', de: null };
const SITE = path.join(__dirname, '..', '..');
const CYR = /[А-Яа-яЁё]/;
let bad = 0; const check = (n, ok, more = '') => { if (!ok) bad++; console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}${more ? ' — ' + more : ''}`); };
(async () => {
  const b = await chromium.launch();
  for (const [lang, sub] of LANGS) {
    console.log(`== ${lang} ${DEV}`);
    const seed = { engine: 'device', micOff: true, srOff: true, parentPhone: true, cur: 'k1', curFam: 'f1', families: { f1: { id: 'f1', name: 'Т', cc: 'PT', kids: ['k1'], grands: [] } },
      profiles: { k1: { stars: 5, plays: {}, learn: {}, book: { title: 'Т', log: {} }, settings: { name: 'Тина', gender: 'f', track: 'r', age: 6, friend: 'kitty', onboarded: true, lang } } } };
    const c = await b.newContext(DEV === 'laptop' ? { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1, serviceWorkers: 'block' } : { ...devices['iPhone 13'], deviceScaleFactor: 1, serviceWorkers: 'block' });
    await c.route(/ntfy|wikipedia|wikimedia|huggingface|jsdelivr|youtube|workers\.dev/, r => r.abort());
    await c.route(u => /\/(ru|de|pt|en)?\/?(index\.html)?$|\/app\.[0-9a-f]+\.js$/.test(u.pathname), async r => { const x = await r.fetch(); let t = await x.text(); t = t.replace(HOOK, HOOK + ' window.__T = { run: s => eval(s) };'); r.fulfill({ response: x, body: t }); });
    // the test server knows no Range requests, a real host does
    await c.route(/\/tales\/audio\/(en|pt|de)\/[^/]+\.mp3$/, async r => {
      const parts = new URL(r.request().url()).pathname.split('/'), f = path.join(SITE, 'tales', 'audio', parts[parts.length - 2], parts[parts.length - 1]);
      let buf; try { buf = fs.readFileSync(f); } catch (e) { return r.fulfill({ status: 404, body: '' }); }
      const m = /bytes=(\d*)-(\d*)/.exec(r.request().headers().range || '');
      if (!m) return r.fulfill({ status: 200, contentType: 'audio/mpeg', headers: { 'Accept-Ranges': 'bytes' }, body: buf });
      const a = +m[1] || 0, z = m[2] ? Math.min(+m[2], buf.length - 1) : buf.length - 1;
      r.fulfill({ status: 206, contentType: 'audio/mpeg', headers: { 'Accept-Ranges': 'bytes', 'Content-Range': `bytes ${a}-${z}/${buf.length}` }, body: buf.subarray(a, z + 1) });
    });
    await c.addInitScript(s => { window.__said = []; try { speechSynthesis.speak = u => { window.__said.push(u.text); setTimeout(() => u.onend && u.onend(), 30); }; } catch (e) {} if (localStorage.getItem('seeded')) return; localStorage.setItem('seeded', 1); localStorage.setItem('govorilki-v2', JSON.stringify(s)); }, seed);
    const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
    const T = s => p.evaluate(x => window.__T.run(x), s);
    await p.goto(BASE + sub); await p.waitForTimeout(1500);
    { const who = p.locator('.who-kid'); if (await who.count()) { await who.first().click(); await p.waitForTimeout(800); } }
    check('tile visible', await T("GAMES.some(g => g.id === 'tales' && !(g.hide && g.hide()))"));
    const dat = await p.evaluate(async lang => {
      const root = location.pathname.replace(/(pt|de|en)\/$/, ''), tb = root + 'tales/' + lang + '/', ab = root + 'tales/audio/' + lang + '/';
      const I = await (await fetch(tb + 'index.json')).json(), R = await (await fetch(ab + 'index.json')).json(), out = [];
      for (const x of I) {
        const d = await (await fetch(tb + x.id + '.json')).json();
        const n = d.p.reduce((k, s) => k + (s.match(/[^.!?…]+[.!?…]+[»"]?\s*|[^.!?…]+$/g) || [s]).length, 0);
        if (!d.p.length || !d.src || !d.by) out.push(x.id + ':text');
        const r = R[x.id]; if (!r) continue;
        const h = await fetch(ab + r.f);
        if (!h.ok || r.ts.length !== n || r.ts.some((t, i) => i && t < r.ts[i - 1]) || !r.who || !/librivox\.org/.test(r.src) || !/Public Domain/.test(r.lic)) out.push(x.id + ':' + h.status + ':' + r.ts.length + '/' + n);
      }
      return { n: I.length, rec: Object.keys(R).length, bad: out, first: Object.keys(R)[0] };
    }, lang);
    check('5–8 tales, recordings right', dat.n >= 5 && dat.n <= 8 && dat.rec >= 5 && !dat.bad.length, `${dat.n} tales, ${dat.rec} recorded; bad: ${dat.bad.join(' ')}`);
    await T("GAMES.find(g => g.id === 'tales').go()"); await p.waitForTimeout(1500);
    const rows = await p.locator('.tl-i').count();
    check('list shows the tales', rows === dat.n, `${rows}`);
    const vis = await p.evaluate(() => document.querySelector('#stage').innerText);
    check('no Russian on the list', !CYR_T(vis), (vis.match(/.{0,30}[А-Яа-яЁё].{0,30}/) || [''])[0]);
    await p.screenshot({ path: D + `tales-${lang}-${DEV}-list.png` });
    // a recorded tale
    await T(`TALES.play('${dat.first}', () => {})`); await p.waitForTimeout(1200);
    const cr = await p.locator('#tlCr').textContent();
    check('credit: reader, LibriVox', /LibriVox/.test(cr) && !CYR.test(cr), cr);
    check('text source shown', /Wikisource/.test(await p.locator('.tl-src').textContent()));
    await p.evaluate(() => window.__said.splice(0));
    await p.click('#tlPlay'); await p.waitForTimeout(5000);
    const au = await T("TALE_AUDIO ? { t: TALE_AUDIO.currentTime, paused: TALE_AUDIO.paused, src: TALE_AUDIO.src } : null");
    check('the file plays', au && !au.paused && au.t > 2 && new RegExp(`/tales/audio/${lang}/`).test(au.src), JSON.stringify(au));
    check('a sentence is lit', await p.locator('#tlText .ss.on').count() === 1);
    await p.screenshot({ path: D + `tales-${lang}-${DEV}-play.png` });
    await p.click('#tlMode [data-m="voice"]'); await p.waitForTimeout(1500);
    const s1 = await p.evaluate(() => window.__said.splice(0));
    check('the game voice reads in the page language', s1.length > 0 && !s1.some(x => CYR_T(x)), JSON.stringify(s1.slice(0, 2)));
    const vis2 = await p.evaluate(() => document.querySelector('#stage').innerText);
    check('no Russian on the player', !CYR_T(vis2), (vis2.match(/.{0,30}[А-Яа-яЁё].{0,30}/) || [''])[0]);
    await T('goHome()'); await p.waitForTimeout(500);
    check('leaving stops the file', await T('!TALE_AUDIO || TALE_AUDIO.paused'));
    if (VOICE_ONLY[lang]) {
      await T(`TALES.play('${VOICE_ONLY[lang]}', () => {})`); await p.waitForTimeout(1000);
      check('a tale without recording: no choice, game voice', !(await p.locator('#tlMode').count()));
      await p.evaluate(() => window.__said.splice(0)); await p.click('#tlPlay'); await p.waitForTimeout(1500);
      const s2 = await p.evaluate(() => window.__said.splice(0));
      check('it reads the tale', s2.length > 0 && !s2.some(x => CYR_T(x)), JSON.stringify(s2.slice(0, 1)));
      await p.screenshot({ path: D + `tales-${lang}-${DEV}-voice.png` });
      await T('goHome()');
    }
    check('no page errors', !errs.length, errs.join(' | '));
    await c.close();
  }
  await b.close();
  console.log(bad ? `FAILED ${bad}` : 'ALL OK'); process.exit(bad ? 1 : 0);
})();
function CYR_T(s) { return CYR.test(String(s).replace(/Тина|Т\b/g, '')); }
