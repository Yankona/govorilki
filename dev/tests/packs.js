// Data packs (data/<lang>/*.json, see PACK in the game and build/packs.js): every story section opens with its words,
// the Russian voice dictionary arrives, and after one online visit everything still works offline (service worker).
// Serves the built site itself (a hook for the test is put into the page). Fictional children only (Тина, Тоша).
// node tests/packs.js [site folder=the repository root] [phone|laptop] [langs=ru,en,pt,de]
const { chromium, devices } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.resolve(process.argv[2] || path.join(__dirname, '..', '..')), DEV = process.argv[3] || 'phone';
const LANGS = (process.argv[4] || 'ru,en,pt,de').split(',');
const SUB = { ru: 'ru/', en: '', pt: 'pt/', de: 'de/' };
const HOOK = 'const fam = () => ROOT.families[ROOT.curFam] || null;';
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml' };
const srv = http.createServer((q, s) => {
  let f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]));
  try { if (fs.statSync(f).isDirectory()) f = path.join(f, 'index.html'); } catch (e) { s.writeHead(404); return s.end(); }
  if (!fs.existsSync(f)) { s.writeHead(404); return s.end(); }
  let body = fs.readFileSync(f);
  if (f.endsWith('index.html')) body = body.toString().replace(HOOK, HOOK + ' window.__T = { run: s => eval(s) };');
  s.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream', 'cache-control': 'no-cache' }); s.end(body);
});
const kid = (name, g, age, fr, lang) => ({ stars: 5, plays: {}, learn: {}, book: { title: 'Т', log: {} }, settings: { name, gender: g, track: 'r', age, friend: fr, onboarded: true, lang } });
(async () => {
  await new Promise(r => srv.listen(0, '127.0.0.1', r));
  const BASE = `http://127.0.0.1:${srv.address().port}/`;
  const b = await chromium.launch(); let bad = 0;
  for (const lang of LANGS) {
    const seed = { engine: 'device', micOff: true, srOff: true, parentPhone: true, cur: 'k1', curFam: 'f1',
      families: { f1: { id: 'f1', name: 'Т', cc: 'PT', kids: ['k1', 'k2'], grands: [] } },
      profiles: { k1: kid('Тина', 'f', 5, 'kitty', lang), k2: kid('Тоша', 'm', 8, 'tiger', lang) } };
    const c = await b.newContext(DEV === 'laptop' ? { viewport: { width: 1280, height: 800 } } : { ...devices['iPhone 13'], deviceScaleFactor: 1 });
    await c.route(u => !u.href.startsWith(BASE), r => r.abort());
    await c.addInitScript(s => { try { speechSynthesis.speak = u => setTimeout(() => u.onend && u.onend(), 5); } catch (e) {} if (localStorage.getItem('seeded')) return; localStorage.setItem('seeded', 1); localStorage.setItem('govorilki-v2', JSON.stringify(s)); }, seed);
    const p = await c.newPage(), errs = [], miss = [];
    p.on('pageerror', e => errs.push(e.message));
    const run = s => p.evaluate(x => window.__T.run(x), s);
    const start = async () => {
      await p.waitForSelector('.who-kid, .pd-n', { timeout: 30000 });
      const who = await p.$$('.who-kid'); if (who.length) { await who[0].click(); await p.waitForTimeout(600); }
    };
    // every section with packed stories: the first, the middle and the last story open with their words
    const stories = async tag => {
      const secs = await run(`Object.keys(LEARN).filter(k => LEARN[k].items.some(x => x.px))`);
      let opened = 0;
      for (const k of secs) {
        const n = await run(`learnItems(${JSON.stringify(k)}).length`);
        for (const i of [...new Set([0, n >> 1, n - 1])]) {
          if (i < 0) continue;
          await run(`screenStory(${JSON.stringify(k)}, ${i})`);
          const ok = await p.waitForFunction(() => { const t = document.querySelector('#stT'); return t && t.textContent.trim().length > 20; }, null, { timeout: 8000 }).then(() => true, () => false);
          if (ok) opened++; else miss.push(`${tag} ${k}#${i}`);
        }
      }
      return { secs: secs.length, opened };
    };
    await p.goto(BASE + SUB[lang]); await start();
    const packs = await run('Object.keys(PACKS).length');
    if (!packs) miss.push('no packs');
    const on = await stories('online');
    // the holidays' words: a holiday of the family's country and one of another country open with their story
    const holiday = async tag => {
      for (const cc of ['PT', 'DE', 'RU']) {
        const id = await run(`(holList(${JSON.stringify(cc)})[0] || {}).id`); if (!id) { miss.push(`${tag} no holiday ${cc}`); continue; }
        await run(`screenHoliday(${JSON.stringify(id)})`);
        await p.waitForSelector('.hol-step[data-s="story"]', { timeout: 8000 }).then(b => b.click()).catch(() => miss.push(`${tag} holiday ${cc} screen`));
        const ok = await p.waitForFunction(() => { const t = document.querySelector('#stT'); return t && t.textContent.trim().length > 20; }, null, { timeout: 8000 }).then(() => true, () => false);
        if (!ok) miss.push(`${tag} holiday ${cc} story`);
        const w = await run(`(HOL_BY_ID[${JSON.stringify(id)}].words || []).length`); if (!w) miss.push(`${tag} holiday ${cc} words`);
      }
    };
    await holiday('online');
    // the journey quiz «Угадай, где это» shows the first line of each story
    const tquiz = async tag => {
      await run('TRAVEL.screen()'); await p.waitForTimeout(600);
      const b = await p.$('#tvQuiz'); if (!b) { miss.push(`${tag} no journey quiz button`); return; }
      await b.click(); const o = await p.waitForSelector('#tvQ .tv-o', { timeout: 8000 }).catch(() => null);
      if (!o) { miss.push(`${tag} journey quiz did not open`); return; }
      await o.click(); await p.waitForTimeout(400);
      const t = await p.$eval('#tvAns', e => e.textContent.trim()).catch(() => '');
      if (t.length < 15) miss.push(`${tag} journey quiz answer «${t}»`);
    };
    await tquiz('online');
    if (lang === 'ru') { await p.waitForTimeout(1500); if (!(await run('!!(SAYRU && SAYRU.w && Object.keys(SAYRU.w).length > 1000)'))) miss.push('voice dictionary online'); }
    // one online visit: the service worker takes over and the background fetch keeps every pack
    await p.waitForFunction(() => navigator.serviceWorker && navigator.serviceWorker.controller, null, { timeout: 20000 }).catch(() => miss.push('no service worker'));
    // nobody calls PACK.warm here: it starts by itself a few seconds after the page has loaded
    let kept = false;
    for (let t = 0; t < 60 && !kept; t++) { kept = await run(`Promise.all(Object.keys(PACKS).map(n => caches.match(PACK.url(n)))).then(xs => xs.every(Boolean))`); if (!kept) await p.waitForTimeout(1000); }
    if (!kept) miss.push('packs not kept by the service worker');
    await c.setOffline(true);
    await p.reload(); await start();
    const off = await stories('offline');
    await holiday('offline');
    await tquiz('offline');
    if (lang === 'ru' && !(await run('!!(SAYRU && SAYRU.w)'))) miss.push('voice dictionary offline');
    await run('goHome()'); await p.waitForTimeout(500);
    await p.screenshot({ path: path.join(__dirname, 'shots', `packs-${lang}-${DEV}-offline-home.png`) });
    console.log(`${lang} ${DEV}: ${packs} packs | online ${on.opened} stories in ${on.secs} sections | offline ${off.opened} | missing ${JSON.stringify(miss.slice(0, 8))}${miss.length > 8 ? ' +' + (miss.length - 8) : ''} | errors ${JSON.stringify(errs.slice(0, 5))}`);
    if (errs.length || miss.length) bad++;
    await c.close();
  }
  await b.close(); srv.close();
  console.log(bad ? `FAIL in ${bad} language(s)` : 'OK: all languages'); process.exit(bad ? 1 : 0);
})();
