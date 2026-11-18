// The voice «Руслан» comes from our own site: the model in parts from engine/piper/voices/ (joined and checked in the
// browser), no request to huggingface.co; it is kept in the phone's storage (OPFS) and the next visit loads nothing.
// Before the release copies site-add/ into the site, engine/piper/voices/ is served here from dev/site-add/.
// Invented family only (Тина). Usage: node tests/voice_own.js [base]
const { chromium, devices } = require('playwright');
const fs = require('fs'), path = require('path');
const BASE = process.argv[2] || 'http://localhost:8781/govorilki/';
const HOOK = 'const fam = () => ROOT.families[ROOT.curFam] || null;';
const ADD = path.join(__dirname, '..', 'site-add');
const seed = { engine: 'piper', micOff: true, srOff: true, parentPhone: true, cur: 'k1', curFam: 'f1',
  families: { f1: { id: 'f1', name: 'Т', cc: 'PT', kids: ['k1'], grands: [] } },
  profiles: { k1: { stars: 5, plays: {}, learn: {}, book: { title: 'Т', log: {} }, settings: { name: 'Тина', gender: 'f', track: 'r', age: 5, friend: 'kitty', onboarded: true, lang: 'ru' } } } };
(async () => {
  const b = await chromium.launch();
  const c = await b.newContext({ ...devices['Pixel 5'], deviceScaleFactor: 1 });
  const hf = [], parts = [], out = [];
  c.on('request', r => { const u = r.url(); if (/huggingface|hf\.co/.test(u)) hf.push(u); if (/engine\/piper\/voices\//.test(u)) parts.push(u.replace(/.*voices\//, '')); });
  await c.route(/huggingface|hf\.co|ntfy|wikipedia|jsdelivr|youtube|wikimedia|workers\.dev/, r => r.abort());
  await c.route(/\/engine\/piper\/voices\//, async r => {
    const f = path.join(ADD, 'engine/piper/voices', new URL(r.request().url()).pathname.split('/').pop());
    if (!fs.existsSync(f)) return r.continue();
    r.fulfill({ status: 200, body: fs.readFileSync(f), headers: { 'Content-Type': f.endsWith('.json') ? 'application/json' : 'application/octet-stream' } });
  });
  await c.route(u => /\/(ru|de|pt|en)?\/?(index\.html)?$|\/app\.[0-9a-f]+\.js$/.test(u.pathname), async r => { const x = await r.fetch(); let t = await x.text(); t = t.replace(HOOK, HOOK + ' window.__T = { run: s => eval(s) };'); r.fulfill({ response: x, body: t }); });
  await c.addInitScript(s => { if (localStorage.getItem('seeded')) return; localStorage.setItem('seeded', 1); localStorage.setItem('govorilki-v2', JSON.stringify(s)); }, seed);
  const p = await c.newPage(), errs = [];
  p.on('pageerror', e => errs.push(e.message));
  const ev = s => p.evaluate(s => window.__T.run(s), s);
  await p.goto(BASE + 'ru/'); await p.waitForTimeout(2500);
  const t0 = Date.now();
  const ok = await ev('piperWarm()').catch(e => 'ERR ' + e.message);
  const secs = ((Date.now() - t0) / 1000).toFixed(1);
  if (ok !== true) out.push('the voice did not load: ' + ok);
  // a phrase made by Руслан
  const dur = await ev("piperAudio('Привет, Тина!').then(a => a.duration)").catch(e => 'ERR ' + e.message);
  if (!(dur > 0.3)) out.push('no sound from the voice: ' + dur);
  const opfs = await p.evaluate(async () => { const d = await (await navigator.storage.getDirectory()).getDirectoryHandle('piper'); const o = {}; for await (const [k, h] of d.entries()) o[k] = (await h.getFile()).size; return o; }).catch(e => 'ERR ' + e.message);
  if (!opfs || opfs['ru_RU-ruslan-medium.onnx'] !== 63201294) out.push('the model is not kept on the phone: ' + JSON.stringify(opfs));
  const first = parts.slice(); parts.length = 0;
  if (!first.some(x => /part2/.test(x))) out.push('the parts were not fetched from our site: ' + JSON.stringify(first));
  // the next visit: the voice starts from the phone's storage, nothing is downloaded again
  await p.reload(); await p.waitForTimeout(2500);
  const ok2 = await ev('piperWarm()').catch(e => 'ERR ' + e.message);
  const dur2 = await ev("piperAudio('Как дела?').then(a => a.duration)").catch(e => 'ERR ' + e.message);
  if (ok2 !== true || !(dur2 > 0.3)) out.push('the voice did not start from the phone the second time: ' + ok2 + ' ' + dur2);
  if (parts.some(x => /\.part/.test(x))) out.push('the model was downloaded again: ' + JSON.stringify(parts));
  if (hf.length) out.push('requests to Hugging Face: ' + hf.slice(0, 3).join(' , '));
  if (errs.length) out.push('page errors: ' + errs.join(' | '));
  console.log(`voice loaded in ${secs} s; fetched from our site: ${first.join(', ')}; kept: ${JSON.stringify(opfs)}; second visit fetched: ${JSON.stringify(parts)}; Hugging Face requests: ${hf.length}`);
  console.log(out.length ? 'FAIL: ' + out.join(' ; ') : 'OK: the voice comes from our site');
  await b.close(); process.exit(out.length ? 1 : 0);
})();
