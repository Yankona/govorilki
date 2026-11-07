// node say_phsent.js <port> <in.json> <out.json>: phonemes of whole sentences, four pages at once
const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const items = JSON.parse(fs.readFileSync(process.argv[3], 'utf8')), out = new Array(items.length);
  const b = await chromium.launch(); let next = 0;
  await Promise.all([0, 1, 2, 3].map(async () => {
    const p = await b.newPage();
    await p.goto(`http://127.0.0.1:${process.argv[2]}/index.html`); await p.waitForFunction(() => window.ready, null, { timeout: 60000 });
    while (next < items.length) {
      const lo = next; next += 40; const part = items.slice(lo, lo + 40);
      const r = await p.evaluate(async xs => { const o = []; for (const x of xs) o.push((await ipa(x)).s); return o; }, part);
      r.forEach((x, j) => out[lo + j] = x);
    }
  }));
  fs.writeFileSync(process.argv[4], JSON.stringify(out)); console.log('done', out.length); await b.close();
})();
