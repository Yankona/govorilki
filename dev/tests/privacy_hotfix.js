// v164 privacy hotfix: nothing leaves the phone for third parties, and the family channel is sealed.
// For ru/en/pt/de on a phone or a laptop:
//  1) the child's phone (a family with бабушка Тома) and бабушка Тома's phone (her link #vhod=…) run on a mock of our
//     server's channel (/v1/ch): the child's progress reaches the grandmother, and the server keeps only ciphertext
//     (no «Тина», no stars in what it stores);
//  2) no request goes to ntfy, Google Fonts or jsDelivr; the fonts come from the site's fonts/;
//  3) no summary for the author is sent (the old 3-hourly one);
//  4) with the Piper voice the engine is fetched from engine/piper/ (the voice model itself still comes from Hugging Face).
// Invented family only: бабушка Тома, Тина, Тим. node tests/privacy_hotfix.js [base] [phone|laptop] [langs=ru,en,pt,de]
const { chromium, devices } = require('playwright');
const fs = require('fs'), path = require('path');
const BASE = process.argv[2] || 'http://localhost:8781/govorilki/', DEV = process.argv[3] || 'phone';
const ONLY = (process.argv[4] || 'ru,en,pt,de').split(',');
const HOOK = 'const fam = () => ROOT.families[ROOT.curFam] || null;';
const LANGS = { ru: 'ru/', en: '', pt: 'pt/', de: 'de/' };
const ADD = path.join(__dirname, '..', 'site-add');      // fonts/ and engine/piper/ before the release copies them; after it, the repository root
const FAMCODE = 'tinafam0123456';
const BAD = /ntfy|fonts\.googleapis|fonts\.gstatic|cdn\.jsdelivr/;
const kid = (name, g, age, fr, lang) => ({ stars: 37, plays: {}, learn: {}, book: { title: 'Т', log: {} }, settings: { name, gender: g, track: 'r', age, friend: fr, onboarded: true, lang } });
const seedOf = (lang, engine) => ({ engine, micOff: true, srOff: true, parentPhone: true, cur: 'k1', curFam: 'f1',
  families: { f1: { id: 'f1', name: 'Т', cc: 'PT', code: FAMCODE, kids: ['k1', 'k2'], grands: [{ id: 'toma', name: 'бабушка Тома', she: true, role: 'gm' }] } },
  profiles: { k1: kid('Тина', 'f', 5, 'kitty', lang), k2: kid('Тим', 'm', 9, 'tiger', lang) } });
const MIME = { '.css': 'text/css', '.woff2': 'font/woff2', '.js': 'text/javascript', '.mjs': 'text/javascript', '.wasm': 'application/wasm', '.data': 'application/octet-stream' };

(async () => {
  const b = await chromium.launch(); let fails = 0;
  for (const [lang, sub] of Object.entries(LANGS)) {
    if (!ONLY.includes(lang)) continue;
    const relay = {}, posts = [], bad = [], seen = [], local = new Set();
    let nid = 0;
    const ctx = async (seed, hash) => {
      const c = await b.newContext(DEV === 'laptop' ? { viewport: { width: 1280, height: 800 } } : { ...devices['iPhone 13'], deviceScaleFactor: 1 });
      c.on('request', r => { const u = r.url(); seen.push(u); if (BAD.test(u)) bad.push(u.slice(0, 100)); });
      await c.route(/wikipedia|huggingface|youtube|wikimedia|lichess/, r => r.abort());
      await c.route(BAD, r => r.abort());
      // our server: only the channel is mocked (in memory, shared by both phones); everything else is refused
      await c.route(/workers\.dev/, async r => {
        const u = new URL(r.request().url()), m = u.pathname.match(/^\/v1\/ch\/([0-9a-f]{32})$/);
        if (!m) return r.abort();
        const list = relay[m[1]] || (relay[m[1]] = []), H = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };
        if (r.request().method() === 'POST') {
          const raw = r.request().postData() || '', j = JSON.parse(raw); posts.push(raw);
          list.push({ id: ++nid, at: Date.now(), iv: j.iv, ct: j.ct });
          return r.fulfill({ status: 200, headers: H, body: JSON.stringify({ ok: true, id: nid }) });
        }
        const after = +u.searchParams.get('after') || 0;
        return r.fulfill({ status: 200, headers: H, body: JSON.stringify({ ok: true, time: Math.floor(Date.now() / 1000), msgs: list.filter(x => x.id > after) }) });
      });
      await c.route(u => /\/govorilki\/(fonts|engine\/piper)\//.test(u.pathname), r => {
        const rel = new URL(r.request().url()).pathname.replace(/^\/govorilki\//, ''), f0 = path.join(ADD, rel), f = fs.existsSync(f0) ? f0 : path.join(__dirname, '..', '..', rel);
        if (!fs.existsSync(f)) return r.fulfill({ status: 404, body: '' });
        local.add(rel); return r.fulfill({ status: 200, headers: { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }, body: fs.readFileSync(f) });
      });
      await c.route(u => /\/(ru|de|pt|en)?\/?(index\.html)?$/.test(u.pathname), async r => { const x = await r.fetch(); let t = await x.text(); t = t.replace(HOOK, HOOK + ' window.__T = { run: s => eval(s) };'); r.fulfill({ response: x, body: t }); });
      await c.addInitScript(s => { try { speechSynthesis.speak = u => setTimeout(() => u.onend && u.onend(), 5); } catch (e) {}
        if (localStorage.getItem('seeded')) return; localStorage.setItem('seeded', 1); if (s) localStorage.setItem('govorilki-v2', JSON.stringify(s)); }, seed);
      const p = await c.newPage(), errs = [];
      p.on('pageerror', e => errs.push(e.message.slice(0, 160)));
      await p.goto(BASE + sub + (hash || '')); await p.waitForTimeout(1500);
      return { c, p, errs };
    };
    const ev = (p, s) => p.evaluate(s => window.__T.run(s), s);
    const out = [];
    // 1) the child's phone sends the progress for the relatives
    const K = await ctx(seedOf(lang, 'device'));
    const who = await K.p.$$('.who-kid'); if (who.length) { await who[0].click(); await K.p.waitForTimeout(800); }
    await ev(K.p, 'postProg(true)'); await K.p.waitForTimeout(1500);
    if (!posts.length) out.push('no note reached the channel');
    if (posts.some(x => /Тина|Тим|Тома|"st"|prog/.test(x))) out.push('the server sees plain text');
    const font = await K.p.evaluate(async () => { await document.fonts.ready; return document.fonts.check('16px "Nunito"') || document.fonts.check('16px "Balsamiq Sans"'); });
    if (!local.has('fonts/fonts.css')) out.push('fonts.css not loaded from the site');
    if (!font) out.push('fonts not ready');
    // 2) бабушка Тома's phone reads it
    const G = await ctx(null, `#vhod=toma.${FAMCODE}&n=${encodeURIComponent('бабушка Тома')}&s=1&r=gm&k=${encodeURIComponent('k1~Тина~f')}`);
    await G.p.waitForTimeout(3500);
    const box = await G.p.$eval('#gKidsBox', e => e.innerText).catch(() => '');
    if (!/Тина/.test(box) || !/37/.test(box)) out.push('the grandmother does not see Тина\'s stars: ' + JSON.stringify(box.slice(0, 80)));
    await G.p.screenshot({ path: path.join(__dirname, 'shots', `privacy-${lang}-${DEV}-grand.png`) });
    // 3) the old summary for the author is gone
    const st = await ev(K.p, "typeof statPing === 'undefined' && typeof statSnap === 'undefined'").catch(() => false);
    if (!st) out.push('the author summary code is still there');
    // 4) Piper's engine from our site (ru only: the same code for all languages)
    if (lang === 'ru') {
      const V = await ctx(seedOf(lang, 'piper'));
      await ev(V.p, 'piperWarm()').catch(() => {});
      await ev(V.p, "say('Привет')").catch(() => {});
      await V.p.waitForTimeout(6000);
      const eng = [...local].filter(x => x.startsWith('engine/piper/'));
      if (!eng.some(x => /piper-tts-web\.js|ort\.wasm\.min\.mjs/.test(x))) out.push('Piper engine not fetched from engine/piper/: ' + JSON.stringify(eng));
      else out.push('(engine files: ' + eng.map(x => x.replace('engine/piper/', '')).join(', ') + ')');
      if (V.errs.length) out.push('page errors (piper): ' + V.errs.join(' | '));
      await V.c.close();
    }
    const errs = [...K.errs, ...G.errs];
    if (errs.length) out.push('page errors: ' + errs.join(' | '));
    if (bad.length) out.push('third-party requests: ' + [...new Set(bad)].slice(0, 5).join(' , '));
    const real = out.filter(x => !x.startsWith('('));
    console.log(`${lang} ${DEV}: notes ${posts.length}, requests ${seen.length} | ${real.length ? 'FAIL ' : 'ok '}${out.join(' ; ')}`);
    if (real.length) fails++;
    await K.c.close(); await G.c.close();
  }
  await b.close(); console.log(fails ? `FAIL in ${fails} language(s)` : 'OK'); process.exit(fails ? 1 : 0);
})();
