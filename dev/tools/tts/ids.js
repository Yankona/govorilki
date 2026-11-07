const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  await p.goto('http://127.0.0.1:8766/index.html'); await p.waitForFunction(() => window.ready, null, { timeout: 60000 });
  console.log(JSON.stringify(await p.evaluate(async () => { const r = await ph('Здорово, лев!'); return [r.phoneme_ids, r.phonemes, r.processed_text]; })));
  await b.close();
})();
