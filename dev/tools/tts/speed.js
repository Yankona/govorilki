const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  await p.goto('http://127.0.0.1:8766/index.html'); await p.waitForFunction(() => window.ready, null, { timeout: 60000 });
  console.log(await p.evaluate(async () => { await ph('прогрев'); const t = performance.now(); for (let i = 0; i < 20; i++) await ph('здорово'); const t1 = performance.now(); const r = await ph(Array.from({length: 300}, (_, i) => 'слово' + ' дом').join(', ')); return [(t1 - t) / 20, performance.now() - t1, r.phoneme_ids.length]; }));
  await b.close();
})();
