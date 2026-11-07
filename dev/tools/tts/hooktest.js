const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  p.on('console', m => console.log('console:', m.text()));
  await p.goto('http://127.0.0.1:8767/index.html');
  // ids: z38 d17 ʌ102 r30 ˈ120 o27 v34 ʌ102  →  z d ˈ o r ʌ v ʌ
  const a = await p.evaluate(() => say('Здорово!'));
  console.log('plain', a.ok, a.n, a.err || '', a.log);
  const c = await p.evaluate(() => say('Здорово!', '38,17,102,30,120,27,34,102', '38,17,120,27,30,102,34,102'));
  console.log('patched', c.ok, c.n, c.err || '', c.log);
  if (a.buf) fs.writeFileSync(require('path').join(__dirname, 'plain.wav'), Buffer.from(a.buf));
  await b.close();
})();
