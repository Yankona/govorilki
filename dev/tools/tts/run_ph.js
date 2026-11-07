// usage: node run_ph.js <port> <file with one phrase per line>  → prints phrase → phonemes, using the app's phonemizer in Chromium
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  await p.goto(`http://127.0.0.1:${process.argv[2]}/index.html`); await p.waitForFunction(() => window.ready, null, { timeout: 60000 });
  const lines = require('fs').readFileSync(process.argv[3], 'utf8').split('\n').filter(Boolean);
  const out = await p.evaluate(async ls => { const o = []; for (const l of ls) { const r = await ipa(l); o.push([l, r.s, r.keys.join(',')]); } return o; }, lines);
  for (const [l, s, k] of out) console.log(l.padEnd(30), '→', s, process.env.KEYS ? k : '');
  await b.close();
})();
