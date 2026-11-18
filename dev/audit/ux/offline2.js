// 6b. Offline through the UI only (no hook): the old tabs (simple day off) → «Узнавай» → Космос → a story; the journey → a place → a story.
const { chromium, devices } = require('playwright');
const path = require('path'); const SHOTS = path.join(__dirname, 'shots');
const BASE = 'http://localhost:8781/govorilki/ru/';
const seed = { engine: 'device', micOff: true, srOff: true, parentPhone: true, cur: 'k1', curFam: 'f1',
  families: { f1: { id: 'f1', name: 'Т', cc: 'PT', kids: ['k1'], grands: [] } },
  profiles: { k1: { stars: 5, plays: {}, learn: {}, days: {}, book: { title: 'Т', log: {} }, settings: { name: 'Тоша', gender: 'm', track: 'r', age: 9, friend: 'tiger', onboarded: true, lang: 'ru', allGames: true, day: { on: false } } } } };
(async () => {
  const b = await chromium.launch();
  const c = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: devices['iPhone 13'].userAgent, serviceWorkers: 'allow' });
  await c.addInitScript(s => { try { speechSynthesis.speak = u => setTimeout(() => u.onend && u.onend(), 5); } catch (e) {} if (!localStorage.getItem('seeded')) { localStorage.setItem('seeded', 1); localStorage.setItem('govorilki-v2', JSON.stringify(s)); } }, seed);
  const p = await c.newPage(); const errs = [], failed = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message.slice(0, 200)));
  p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 200)); });
  p.on('requestfailed', r => failed.push(r.url().replace(/^.*\/govorilki\//, '').slice(0, 100)));
  const txt = () => p.evaluate(() => (document.body.innerText || '').replace(/\s+/g, ' ').slice(0, 240));
  const log = (...a) => console.log(...a);
  await p.goto(BASE); await p.waitForTimeout(2500);
  const who = await p.$$('.who-kid'); if (who.length) { await who[0].click(); await p.waitForTimeout(900); }
  await p.evaluate(() => navigator.serviceWorker.ready); await p.waitForTimeout(8000);
  const n = await p.evaluate(async () => { let n = 0; for (const k of await caches.keys()) n += (await (await caches.open(k)).keys()).length; return n; }); log('cache entries before going offline:', n);
  await c.setOffline(true);
  await p.reload({ waitUntil: 'domcontentloaded' }).catch(e => log('reload err', e.message)); await p.waitForTimeout(2500);
  const who2 = await p.$$('.who-kid'); if (who2.length) { await who2[0].click(); await p.waitForTimeout(900); }
  log('OFFLINE home (tabs):', await txt(), '| tabs:', JSON.stringify(await p.$$eval('#tabBar button', bs => bs.map(b => b.innerText.replace(/\s+/g, ' ').trim()))));
  const ov = await p.evaluate(() => { const f = document.querySelector('#tkFab'), t = [...document.querySelectorAll('#tabBar button')].pop(); if (!f || !t) return null; const a = f.getBoundingClientRect(), b = t.getBoundingClientRect(); const x = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)), y = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top)); return { fab: [Math.round(a.left), Math.round(a.top), Math.round(a.width), Math.round(a.height)], tab: t.innerText.trim(), tabBox: [Math.round(b.left), Math.round(b.top), Math.round(b.width), Math.round(b.height)], overlapPx: Math.round(x * y), tabArea: Math.round(b.width * b.height) }; });
  log('FAB over the last tab (phone, old tabs):', JSON.stringify(ov));
  await p.screenshot({ path: path.join(SHOTS, '6-offline-09-tabs-fab.png') });
  const tab = p.locator('#tabBar button', { hasText: /Узна|Истор|Мир/ }).first(); if (await tab.count()) { await tab.click({ position: { x: 8, y: 8 }, force: true }); await p.waitForTimeout(800); log('tab:', (await txt()).slice(0, 200)); }
  await p.screenshot({ path: path.join(SHOTS, '6-offline-10-tab.png') });
  const cosm = p.locator('#stage .tile, #stage .mini', { hasText: /Космос/ }).first();
  if (await cosm.count()) { await cosm.click(); await p.waitForTimeout(1200); log('Космос list:', (await txt()).slice(0, 200)); await p.screenshot({ path: path.join(SHOTS, '6-offline-11-space-list.png') });
    const it = p.locator('.ld-g, .learn-it, [data-i]').first(); if (await it.count()) { await it.click(); await p.waitForTimeout(3500); const t = await txt(); log('OFFLINE LEARN story opened:', t); await p.screenshot({ path: path.join(SHOTS, '6-offline-12-space-story.png') }); log(' story has text sentences?', /[а-я]{3,}\s[а-я]{3,}\s[а-я]{3,}/i.test(t), '| broken imgs:', JSON.stringify(await p.evaluate(() => [...document.images].filter(i => !(i.complete && i.naturalWidth > 0)).map(i => i.src.replace(/^.*\/govorilki\//, '')).slice(0, 5)))); } }
  else log('no Космос tile on this tab; tiles:', JSON.stringify(await p.$$eval('#stage .tile, #stage .mini', ts => ts.map(t => t.innerText.replace(/\s+/g, ' ').trim().slice(0, 25)).slice(0, 30))));
  // the journey
  const home = p.locator('button[aria-label="На главную"], .top .home').first(); if (await home.count()) await home.click(); else await p.locator('#backBtn').click().catch(() => {}); await p.waitForTimeout(800);
  for (const t of ['Путеш', 'Мир', 'Узна']) { const tb = p.locator('#tabBar button', { hasText: new RegExp(t) }).first(); if (await tb.count()) { await tb.click(); await p.waitForTimeout(800); break; } }
  const trv = p.locator('#stage .tile, #stage .mini', { hasText: /Путешествие по миру|Путешеств/ }).first();
  if (await trv.count()) { await trv.click(); await p.waitForTimeout(1500); log('journey screen:', (await txt()).slice(0, 200)); await p.screenshot({ path: path.join(SHOTS, '6-offline-13-travel.png') });
    const card = p.locator('.tv-c').first(); if (await card.count()) { await card.click(); await p.waitForTimeout(2000); log('place:', (await txt()).slice(0, 200)); await p.screenshot({ path: path.join(SHOTS, '6-offline-14-place.png') });
      const st = p.locator('.tv-st, .tv-it, .ld-g, .tile, button:has-text("▶")').first(); if (await st.count()) { await st.click(); await p.waitForTimeout(3500); const t = await txt(); log('OFFLINE journey story:', t); await p.screenshot({ path: path.join(SHOTS, '6-offline-15-travel-story.png') }); log(' broken imgs:', JSON.stringify(await p.evaluate(() => [...document.images].filter(i => !(i.complete && i.naturalWidth > 0)).map(i => i.src.replace(/^.*\/govorilki\//, '')).slice(0, 5)))); } } }
  else log('no journey tile; tiles:', JSON.stringify(await p.$$eval('#stage .tile, #stage .mini', ts => ts.map(t => t.innerText.replace(/\s+/g, ' ').trim().slice(0, 25)).slice(0, 30))));
  log('errors:', JSON.stringify(errs.slice(0, 10))); log('failed requests offline:', JSON.stringify(failed.slice(0, 15)));
  await b.close();
})().catch(e => { console.error('FATAL', e); process.exit(1); });
