// node phall.js <port> <in.json: [strings]> <out.json>  — phonemizes every string with Piper's own phonemizer in Chromium.
// Words go in batches joined by ", " and are split back; a batch that does not split cleanly is redone one by one.
const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const items = JSON.parse(fs.readFileSync(process.argv[3], 'utf8'));
  const b = await chromium.launch(); const p = await b.newPage();
  await p.goto(`http://127.0.0.1:${process.argv[2]}/index.html`); await p.waitForFunction(() => window.ready, null, { timeout: 60000 });
  const out = await p.evaluate(async items => {
    const res = [], B = 250;
    for (let i = 0; i < items.length; i += B) {
      const part = items.slice(i, i + B);
      let s = (await ipa(part.join(', '))).s.replace(/^\^|\$$/g, '');
      let bits = s.split(', ');
      if (bits.length !== part.length) bits = await Promise.all(part.map(async w => (await ipa(w)).s.replace(/^\^|\$$/g, '')));
      res.push(...bits);
    }
    return res;
  }, items);
  fs.writeFileSync(process.argv[4], JSON.stringify(out));
  console.log('done', out.length);
  await b.close();
})();
