// 6. Offline: one online visit of /ru/ (home, wait for the service worker), then offline → reload: home? a story? a journey story?
// No hook, no blocking of hosts: as a real phone would do it. node offline.js
const { chromium, devices } = require('playwright');
const fs = require('fs'), path = require('path');
const BASE = 'http://localhost:8781/govorilki/ru/', SHOTS = path.join(__dirname, 'shots');
const seed = { engine: 'device', micOff: true, srOff: true, parentPhone: true, cur: 'k1', curFam: 'f1',
  families: { f1: { id: 'f1', name: 'Т', cc: 'PT', kids: ['k1'], grands: [] } },
  profiles: { k1: { stars: 5, plays: {}, learn: {}, days: {}, book: { title: 'Т', log: {} }, settings: { name: 'Тоша', gender: 'm', track: 'r', age: 7, friend: 'tiger', onboarded: true, lang: 'ru', allGames: true } } } };
(async () => {
  const b = await chromium.launch();
  const c = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: devices['iPhone 13'].userAgent, serviceWorkers: 'allow' });
  await c.addInitScript(s => { try { speechSynthesis.speak = u => setTimeout(() => u.onend && u.onend(), 5); } catch (e) {} if (!localStorage.getItem('seeded')) { localStorage.setItem('seeded', 1); localStorage.setItem('govorilki-v2', JSON.stringify(s)); } }, seed);
  const p = await c.newPage(); const errs = [], ext = new Set(), failed = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message.slice(0, 200)));
  p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 200)); });
  p.on('request', r => { const u = new URL(r.url()); if (!/localhost/.test(u.hostname) && !/^(data|blob):/.test(u.protocol)) ext.add(u.hostname); });
  p.on('requestfailed', r => failed.push(r.url().slice(0, 120)));
  const log = (...a) => console.log(...a);
  await p.goto(BASE); await p.waitForTimeout(2500);
  const who = await p.$$('.who-kid'); if (who.length) { await who[0].click(); await p.waitForTimeout(900); }
  // wait for the service worker to be active and its caches filled
  const sw = await p.evaluate(async () => { try { const r = await navigator.serviceWorker.ready; return { scope: r.scope, state: r.active && r.active.state }; } catch (e) { return { err: String(e) }; } });
  log('SW:', JSON.stringify(sw));
  for (let i = 0; i < 20; i++) { await p.waitForTimeout(1500); const n = await p.evaluate(async () => { const ks = await caches.keys(); let n = 0; for (const k of ks) n += (await (await caches.open(k)).keys()).length; return { ks, n }; }); if (i % 4 === 0) log('caches:', JSON.stringify(n)); if (n.n > 60 && i > 4) break; }
  const cached = await p.evaluate(async () => { const ks = await caches.keys(); const out = {}; for (const k of ks) out[k] = (await (await caches.open(k)).keys()).map(r => r.url.replace(/^.*\/govorilki\//, '')); return out; });
  const all = Object.values(cached).flat(); log('cached entries:', all.length, 'data packs:', all.filter(u => /^data\//.test(u)).length, 'sample:', all.filter(u => /^data\//.test(u)).slice(0, 6).join(', '));
  fs.writeFileSync(path.join(__dirname, 'offline-cache.json'), JSON.stringify(cached, null, 1));
  log('external hosts contacted while online:', [...ext].join(', ') || 'none');
  // offline
  await c.setOffline(true);
  await p.reload({ waitUntil: 'domcontentloaded' }).catch(e => log('reload error:', e.message.slice(0, 100))); await p.waitForTimeout(2500);
  const who2 = await p.$$('.who-kid'); if (who2.length) { await who2[0].click(); await p.waitForTimeout(900); }
  const home = await p.evaluate(() => ({ pdBox: !!document.querySelector('#pdBox'), text: (document.body.innerText || '').slice(0, 200).replace(/\n/g, ' / ') }));
  log('OFFLINE home:', JSON.stringify(home)); await p.screenshot({ path: path.join(SHOTS, '6-offline-01-home.png') });
  // a story: open the stories door / the «Узнавай» section through the UI — the home has «Все игры» hidden, so use the search-less way: a door or the album? Use the journey card and a LEARN story via the stories tab of «Все игры» is not there; instead navigate by hash if supported
  const tryOpen = async (label, fn, shotName) => { const r = await fn().catch(e => 'ERR ' + e.message.slice(0, 80)); await p.waitForTimeout(2500); const t = await p.evaluate(() => (document.body.innerText || '').replace(/\s+/g, ' ').slice(0, 260)); log(`OFFLINE ${label}: ${r || ''} → «${t}»`); await p.screenshot({ path: path.join(SHOTS, shotName) }); return t; };
  // the doors are shut before the path; mark the path done offline (localStorage) and reload to reach a door
  await p.evaluate(() => { const r = JSON.parse(localStorage.getItem('govorilki-v2')); const k = new Date(); const dk = `${k.getFullYear()}-${String(k.getMonth() + 1).padStart(2, '0')}-${String(k.getDate()).padStart(2, '0')}`; r.profiles.k1.days = { [dk]: { speech: 1, read: 1, math: 1, soro: 1, puzzle: 1 } }; r.profiles.k1.chest = dk; localStorage.setItem('govorilki-v2', JSON.stringify(r)); });
  await p.reload({ waitUntil: 'domcontentloaded' }).catch(() => {}); await p.waitForTimeout(2500);
  const who3 = await p.$$('.who-kid'); if (who3.length) { await who3[0].click(); await p.waitForTimeout(900); }
  const doors = await p.$$eval('.sd-door', ds => ds.map(d => (d.classList.contains('open') ? 'OPEN ' : 'shut ') + d.innerText.replace(/\s+/g, ' ').trim()));
  log('OFFLINE doors:', JSON.stringify(doors));
  // find a door that is a story area (Космос / Путешествия / Тело / Природа / Лаборатория / Сказки) and open its room; then a tile
  const d = await p.$('.sd-door.open');
  if (d) { await d.click(); await p.waitForTimeout(1000); const tiles = await p.$$eval('.sd-room .tile', ts => ts.map(t => t.innerText.replace(/\s+/g, ' ').trim().slice(0, 40))); log('room tiles:', JSON.stringify(tiles)); await p.screenshot({ path: path.join(SHOTS, '6-offline-02-room.png') });
    const t0 = await p.$('.sd-room .tile'); if (t0) { await t0.click(); await p.waitForTimeout(2500); const tx = await p.evaluate(() => (document.body.innerText || '').replace(/\s+/g, ' ').slice(0, 260)); log('room tile opened offline →', tx); await p.screenshot({ path: path.join(SHOTS, '6-offline-03-room-game.png') }); } }
  // a LEARN story and a journey story straight by the game's own functions (the page is the real one: no hook, so use a tiny eval of globals through the console? not available) → use the keyboard-free path: evaluate the function names directly; they are globals of the page script
  const st = await tryOpen('story (space)', () => p.evaluate(() => { screenLearn('space'); return 'list'; }), '6-offline-04-learn-list.png');
  const it = await p.$('.ld-g, .learn-it, .tile'); if (it) { await it.click(); await p.waitForTimeout(3000); const tx = await p.evaluate(() => (document.body.innerText || '').replace(/\s+/g, ' ').slice(0, 300)); log('OFFLINE story opened →', tx); await p.screenshot({ path: path.join(SHOTS, '6-offline-05-story.png') }); }
  const st2 = await p.evaluate(async () => { try { const it = learnItems('space')[0]; await PACK.story(it); return { ok: true, hasText: !!(it.s && it.s.length), len: (it.s || '').length }; } catch (e) { return { err: String(e).slice(0, 120) }; } });
  log('OFFLINE PACK.story(space[0]):', JSON.stringify(st2));
  await tryOpen('journey', () => p.evaluate(() => { TRAVEL.screen(); return 'travel'; }), '6-offline-06-travel.png');
  const tv = await p.$('.tv-c'); if (tv) { await tv.click(); await p.waitForTimeout(2500); const tx = await p.evaluate(() => (document.body.innerText || '').replace(/\s+/g, ' ').slice(0, 300)); log('OFFLINE journey place →', tx); await p.screenshot({ path: path.join(SHOTS, '6-offline-07-travel-place.png') });
    const stx = await p.$('.tv-st, .ld-g, .tile, .tv-it'); if (stx) { await stx.click(); await p.waitForTimeout(3000); const tx2 = await p.evaluate(() => (document.body.innerText || '').replace(/\s+/g, ' ').slice(0, 300)); log('OFFLINE journey story →', tx2); await p.screenshot({ path: path.join(SHOTS, '6-offline-08-travel-story.png') }); } }
  const imgs = await p.evaluate(() => [...document.images].map(i => ({ src: i.src.replace(/^.*\/govorilki\//, ''), ok: i.complete && i.naturalWidth > 0 })).filter(i => !i.ok).slice(0, 8));
  log('broken images on the last screen offline:', JSON.stringify(imgs));
  log('errors:', JSON.stringify(errs.slice(0, 12)));
  log('failed requests offline (sample):', JSON.stringify(failed.slice(0, 12)));
  await b.close();
})().catch(e => { console.error('FATAL', e); process.exit(1); });
