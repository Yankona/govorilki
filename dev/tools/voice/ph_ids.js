// phoneme ids for phrases (the same phonemizer as the app's voice), to synthesize them outside the browser
const { chromium } = require('playwright');
const fs = require('fs');
const OUT = process.argv[2], PH = process.argv.slice(3);
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  await p.goto('http://127.0.0.1:8790/index.html'); await p.waitForFunction(() => window.ready, null, { timeout: 90000 });
  const res = {};
  for (const t of PH) res[t] = await p.evaluate(async t => { const r = await ipa(t); return { s: r.s, ids: r.r.phoneme_ids }; }, t);
  fs.writeFileSync(OUT, JSON.stringify(res));
  console.log(Object.entries(res).map(([k, v]) => k + ' ' + v.s).join('\n'));
  await b.close();
})();
