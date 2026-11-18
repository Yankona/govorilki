// Read-only audit: page weight to the home screen, data packs on home vs later, JS heap after home and after 5 screens,
// localStorage key sizes. Invented family only (Тина, Тоша), as in dev/tests/smoke.js.
const { chromium, devices } = require('playwright');
const fs = require('fs');
const BASE = process.argv[2] || 'http://localhost:8781/govorilki/ru/';
const OUT = process.argv[3] || '/tmp/claude-0/-home-user-govorilki/c1b0d3e7-ea18-5cf4-9cf9-63cd21a8f7a6/scratchpad/perf/measure.json';
const HOOK = 'const fam = () => ROOT.families[ROOT.curFam] || null;';
const kid = (name, g, age, fr, lang) => ({ stars: 5, plays: {}, learn: {}, book: { title: 'Т', log: {} }, settings: { name, gender: g, track: 'r', age, friend: fr, onboarded: true, lang } });
const seed = { engine: 'device', micOff: true, srOff: true, parentPhone: true, cur: 'k1', curFam: 'f1',
  families: { f1: { id: 'f1', name: 'Т', cc: 'PT', kids: ['k1', 'k2'], grands: [] } },
  profiles: { k1: kid('Тина', 'f', 5, 'kitty', 'ru'), k2: kid('Тоша', 'm', 8, 'tiger', 'ru') } };
(async () => {
  const b = await chromium.launch();
  const c = await b.newContext({ ...devices['Pixel 5'], deviceScaleFactor: 1 });
  const blocked = [];
  await c.route(/ntfy|wikipedia|huggingface|jsdelivr|youtube|wikimedia|workers\.dev/, r => { blocked.push(r.request().url()); r.abort(); });
  await c.route(u => /\/(ru|de|pt|en)?\/?(index\.html)?$/.test(u.pathname), async r => { const x = await r.fetch(); let t = await x.text(); t = t.replace(HOOK, HOOK + ' window.__T = { run: s => eval(s) };'); r.fulfill({ response: x, body: t }); });
  await c.addInitScript(s => {
    try { speechSynthesis.speak = u => setTimeout(() => u.onend && u.onend(), 5); } catch (e) {}
    if (!localStorage.getItem('seeded')) { localStorage.setItem('seeded', 1); localStorage.setItem('govorilki-v2', JSON.stringify(s)); }
    window.__perf = { lt: [], t0: performance.timeOrigin };
    try { new PerformanceObserver(l => l.getEntries().forEach(e => window.__perf.lt.push([Math.round(e.startTime), Math.round(e.duration)]))).observe({ type: 'longtask', buffered: true }); } catch (e) {}
    const mo = new MutationObserver(() => { if (!window.__perf.first && document.querySelector('.who-kid, .pd-n')) { window.__perf.first = performance.now(); mo.disconnect(); } });
    mo.observe(document, { childList: true, subtree: true });
  }, seed);
  const p = await c.newPage(), errs = [];
  p.on('pageerror', e => errs.push(e.message));
  p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 200)); });
  const cdp = await c.newCDPSession(p);
  await cdp.send('Network.enable'); await cdp.send('Performance.enable'); await cdp.send('HeapProfiler.enable');
  const reqs = {}; const T0 = Date.now();
  cdp.on('Network.requestWillBeSent', e => { reqs[e.requestId] = { url: e.request.url, type: e.type, t: Date.now() - T0, enc: 0, dec: 0, sw: false }; });
  cdp.on('Network.responseReceived', e => { const r = reqs[e.requestId]; if (r) { r.mime = e.response.mimeType; r.status = e.response.status; r.sw = !!e.response.fromServiceWorker; r.hdrLen = e.response.encodedDataLength; } });
  cdp.on('Network.loadingFinished', e => { const r = reqs[e.requestId]; if (r) { r.enc = e.encodedDataLength; r.done = Date.now() - T0; } });
  cdp.on('Network.dataReceived', e => { const r = reqs[e.requestId]; if (r) r.dec += e.dataLength; });
  const heap = async label => {
    try { await cdp.send('HeapProfiler.collectGarbage'); } catch (e) {}
    const m = (await cdp.send('Performance.getMetrics')).metrics, g = n => (m.find(x => x.name === n) || {}).value;
    const pm = await p.evaluate(() => performance.memory ? { used: performance.memory.usedJSHeapSize, total: performance.memory.totalJSHeapSize } : null);
    const dom = await p.evaluate(() => document.getElementsByTagName('*').length);
    return { label, JSHeapUsedSize: g('JSHeapUsedSize'), JSHeapTotalSize: g('JSHeapTotalSize'), Nodes: g('Nodes'), JSEventListeners: g('JSEventListeners'), Documents: g('Documents'), domCount: dom, perfMemory: pm, LayoutCount: g('LayoutCount'), ScriptDuration: g('ScriptDuration'), TaskDuration: g('TaskDuration') };
  };
  await p.goto(BASE, { waitUntil: 'commit' });
  await p.waitForFunction(() => window.__perf && window.__perf.first, null, { timeout: 60000, polling: 100 });
  await p.waitForTimeout(1500);
  const tHome = Date.now() - T0;
  const who = await p.$$('.who-kid'); if (who.length) { await who[0].click(); await p.waitForTimeout(1200); }
  const nav = await p.evaluate(() => { const n = performance.getEntriesByType('navigation')[0]; const pt = performance.getEntriesByType('paint'); return { dcl: n.domContentLoadedEventEnd, load: n.loadEventEnd, responseEnd: n.responseEnd, transferSize: n.transferSize, decodedBodySize: n.decodedBodySize, fcp: (pt.find(x => x.name === 'first-contentful-paint') || {}).startTime, first: window.__perf.first, longTasks: window.__perf.lt }; });
  const homeScreenHtml = await p.evaluate(() => (document.querySelector('.pd-n') ? 'path' : document.querySelector('.who-kid') ? 'who' : 'other'));
  const snapHome = Object.values(reqs).map(r => ({ ...r }));
  const heaps = [await heap('home')];
  // wait for PACK.warm (load + 300 ms + 4 s + per-pack) to see the lazy packs
  await p.waitForTimeout(9000);
  const snapWarm = Object.values(reqs).map(r => ({ ...r }));
  // 5 screens
  const screens = [['stories', "screenLearn('space')"], ['journey', 'TRAVEL.screen()'], ['maths', 'screenMathCount()'], ['chess', 'screenChess(1)'], ['museum', "screenMuseum('day')"]];
  const shots = [];
  for (const [name, code] of screens) {
    const r = await p.evaluate(s => { try { window.__T.run(s); return 'ok'; } catch (e) { return 'ERR ' + e.message; } }, code);
    await p.waitForTimeout(2500);
    // tap around a little so the screen does something (first buttons)
    for (let i = 0; i < 3; i++) { const bs = await p.$$('main button, .scr button, button'); const vis = []; for (const x of bs) { if (await x.isVisible()) vis.push(x); if (vis.length > 4) break; } if (vis[i]) { await vis[i].click().catch(() => {}); await p.waitForTimeout(900); } }
    shots.push({ name, run: r, scr: await p.evaluate(() => document.body.className + ' | h1: ' + (document.querySelector('h1,h2,.ttl') || {}).textContent) });
    await p.evaluate(() => window.__T.run('goHome()')).catch(() => {}); await p.waitForTimeout(600);
    heaps.push(await heap('after ' + name));
  }
  await p.waitForTimeout(3500); // let EVT.write flush (3 s timer)
  const ls = await p.evaluate(() => { const o = {}; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); o[k] = localStorage.getItem(k).length; } return o; });
  const ev = await p.evaluate(() => { try { const a = JSON.parse(localStorage.getItem('govorilki-ev') || '[]'); return { n: a.length, bytes: JSON.stringify(a).length, sample: a.slice(0, 12), kinds: a.reduce((m, e) => (m[e[1]] = (m[e[1]] || 0) + 1, m), {}) }; } catch (e) { return String(e); } });
  const root = await p.evaluate(() => { try { const r = JSON.parse(localStorage.getItem('govorilki-v2')); const o = {}; for (const [k, v] of Object.entries(r)) o[k] = JSON.stringify(v).length; const pr = {}; for (const [k, v] of Object.entries(r.profiles || {})) { pr[k] = {}; for (const [a, b] of Object.entries(v)) pr[k][a] = JSON.stringify(b).length; } return { top: o, profiles: pr }; } catch (e) { return String(e); } });
  const swc = await p.evaluate(async () => { try { const ks = await caches.keys(); const o = {}; for (const k of ks) { const c = await caches.open(k); const rs = await c.keys(); o[k] = rs.map(r => r.url.replace(location.origin, '')); } return o; } catch (e) { return String(e); } });
  const sw = await p.evaluate(async () => { try { const r = await navigator.serviceWorker.getRegistration(); return r ? { scope: r.scope, active: !!r.active, waiting: !!r.waiting } : null; } catch (e) { return String(e); } });
  const all = Object.values(reqs);
  fs.writeFileSync(OUT, JSON.stringify({ BASE, tHome, homeScreenHtml, nav, snapHome, snapWarm, all, blocked, errs, heaps, shots, ls, ev, root, swc, sw }, null, 1));
  const sum = a => a.reduce((s, r) => s + (r.enc || r.dec || 0), 0);
  console.log('home screen:', homeScreenHtml, 'at', tHome, 'ms; requests to home', snapHome.length, 'bytes', sum(snapHome), '| after warm', snapWarm.length, sum(snapWarm), '| total', all.length, sum(all));
  console.log('nav', JSON.stringify(nav).slice(0, 400));
  console.log('heaps', heaps.map(h => h.label + ' ' + (h.JSHeapUsedSize / 1048576).toFixed(1) + ' MB nodes ' + h.Nodes + ' listeners ' + h.JSEventListeners).join('\n'));
  console.log('ls', ls); console.log('ev', JSON.stringify(ev).slice(0, 600)); console.log('shots', shots); console.log('errs', errs.slice(0, 10)); console.log('blocked', blocked.slice(0, 10)); console.log('sw', sw, Object.fromEntries(Object.entries(swc).map(([k, v]) => [k, v.length])));
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
