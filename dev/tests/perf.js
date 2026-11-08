// Start-up speed of the built game on a mid phone: CPU slowed 4x, «slow 4G» network (150 ms, 1.6 Mbit/s down),
// the page served compressed (gzip) the way Cloudflare serves it. For each language: bytes over the network before the
// first screen, the page's own size, time to the first screen (the who-plays cards), time to interactive (the last
// long task of the start is over), JS memory. Fictional children only (Тина, Тоша).
// node tests/perf.js [site folder=the repository root] [runs=3] [langs=ru,en,pt,de]
const { chromium, devices } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), zlib = require('zlib');
const ROOT = path.resolve(process.argv[2] || path.join(__dirname, '..', '..'));
const RUNS = +(process.argv[3] || 3), LANGS = (process.argv[4] || 'ru,en,pt,de').split(',');
const SUB = { ru: 'ru/', en: '', pt: 'pt/', de: 'de/' };
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.webmanifest': 'application/manifest+json',
  '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.wasm': 'application/wasm', '.mp3': 'audio/mpeg' };
const gz = {}; let SENT = 0;
const srv = http.createServer((q, s) => {
  let f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]));
  try { if (fs.statSync(f).isDirectory()) f = path.join(f, 'index.html'); } catch (e) { s.writeHead(404); return s.end(); }
  if (!fs.existsSync(f)) { s.writeHead(404); return s.end(); }
  const ext = path.extname(f), t = TYPES[ext] || 'application/octet-stream', text = /html|javascript|json|manifest|svg/.test(t);
  if (text && /gzip/.test(q.headers['accept-encoding'] || '')) {
    const k = f + fs.statSync(f).mtimeMs; gz[k] = gz[k] || zlib.gzipSync(fs.readFileSync(f), { level: 6 });
    s.writeHead(200, { 'content-type': t, 'content-encoding': 'gzip', 'cache-control': 'no-cache' }); SENT += gz[k].length; return s.end(gz[k]);
  }
  s.writeHead(200, { 'content-type': t, 'cache-control': 'no-cache' }); SENT += fs.statSync(f).size; fs.createReadStream(f).pipe(s);
});
const kid = (name, g, age, fr, lang) => ({ stars: 5, plays: {}, learn: {}, book: { title: 'Т', log: {} }, settings: { name, gender: g, track: 'r', age, friend: fr, onboarded: true, lang } });
const med = a => a.slice().sort((x, y) => x - y)[a.length >> 1];
(async () => {
  await new Promise(r => srv.listen(0, '127.0.0.1', r));
  const BASE = `http://127.0.0.1:${srv.address().port}/`;
  const b = await chromium.launch(); const out = {};
  for (const lang of LANGS) {
    const rows = [];
    for (let run = 0; run < RUNS; run++) {
      const c = await b.newContext({ ...devices['Pixel 5'], serviceWorkers: 'block' });
      await c.route(u => !u.href.startsWith(BASE), r => r.abort());
      const seed = { engine: 'device', micOff: true, srOff: true, parentPhone: true, cur: 'k1', curFam: 'f1',
        families: { f1: { id: 'f1', name: 'Т', cc: 'PT', kids: ['k1', 'k2'], grands: [] } },
        profiles: { k1: kid('Тина', 'f', 5, 'kitty', lang), k2: kid('Тоша', 'm', 8, 'tiger', lang) } };
      await c.addInitScript(s => {
        try { speechSynthesis.speak = u => setTimeout(() => u.onend && u.onend(), 5); } catch (e) {}
        localStorage.setItem('govorilki-v2', JSON.stringify(s));
        window.__perf = { lt: [] };
        try { new PerformanceObserver(l => l.getEntries().forEach(e => window.__perf.lt.push([e.startTime, e.duration]))).observe({ type: 'longtask', buffered: true }); } catch (e) {}
        const mo = new MutationObserver(() => { if (!window.__perf.first && document.querySelector('.who-kid, .pd-n')) { window.__perf.first = performance.now(); mo.disconnect(); } });
        document.addEventListener('DOMContentLoaded', () => { window.__perf.dcl = performance.now(); });
        mo.observe(document, { childList: true, subtree: true });
      }, seed);
      const p = await c.newPage(), errs = []; p.on('pageerror', e => errs.push(e.message));
      const cdp = await c.newCDPSession(p);
      await cdp.send('Network.enable');
      await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
      await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 1.6 * 1024 * 1024 / 8, uploadThroughput: 750 * 1024 / 8 });
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
      let firstWire = null; SENT = 0;
      await p.goto(BASE + SUB[lang], { waitUntil: 'commit', timeout: 120000 });
      await p.waitForFunction(() => window.__perf && window.__perf.first, null, { timeout: 120000, polling: 100 });
      firstWire = SENT;
      await p.waitForTimeout(4000);
      const perf = await p.evaluate(() => window.__perf);
      const heap = (await cdp.send('Runtime.getHeapUsage')).usedSize;
      const lastLong = perf.lt.filter(([s]) => s < perf.first + 3000).reduce((a, [s, d]) => Math.max(a, s + d), 0);
      const busy = perf.lt.filter(([s]) => s < perf.first + 3000).reduce((a, [, d]) => a + d, 0);
      rows.push({ first: perf.first, tti: Math.max(perf.first, lastLong), dcl: perf.dcl, wire: firstWire, heap, script: busy, errs: errs.length });
      await c.close();
    }
    const page = fs.statSync(path.join(ROOT, SUB[lang], 'index.html')).size;
    const r = { page, wire: med(rows.map(x => x.wire)), first: med(rows.map(x => x.first)), tti: med(rows.map(x => x.tti)),
      heap: med(rows.map(x => x.heap)), script: med(rows.map(x => x.script)), errors: rows.reduce((a, x) => a + x.errs, 0) };
    out[lang] = r;
    console.log(`${lang}: page ${(r.page / 1e6).toFixed(2)} MB | over network before first screen ${(r.wire / 1e6).toFixed(2)} MB | first screen ${(r.first / 1000).toFixed(1)} s | interactive ${(r.tti / 1000).toFixed(1)} s | long tasks ${(r.script / 1000).toFixed(1)} s | JS memory ${(r.heap / 1e6).toFixed(0)} MB | errors ${r.errors}`);
  }
  await b.close(); srv.close();
  if (process.env.PERF_JSON) fs.writeFileSync(process.env.PERF_JSON, JSON.stringify(out, null, 1));
  process.exit(Object.values(out).some(r => r.errors) ? 1 : 0);
})();
