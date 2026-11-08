// Drawn portraits of grandparents and the grandparent's home. An invented family (Тина, Тоша; Бабушка Вера, Дедушка Лев)
// makes a portrait from a synthetic face drawn in code (no real photo), checks the portrait shows in the family places and
// that nothing of the photo is stored (localStorage) or sent (network). Then the grandparent's entry: big tiles, a hello.
// Usage: node tests/grand_avatars.js [base=http://localhost:8781/govorilki/] [langs=ru,en,pt,de] [devices=phone,laptop]
const { chromium, devices } = require('playwright');
const fs = require('fs'), D = require('path').join(__dirname, 'shots') + '/';
fs.mkdirSync(D, { recursive: true });
const BASE = process.argv[2] || 'http://localhost:8781/govorilki/';
const LANGS = (process.argv[3] || 'ru,en,pt,de').split(','), DEVS = (process.argv[4] || 'phone,laptop').split(',');
const AVA_RE = /^[0-9a-f]{6}\.[0-9a-f]{6}\.[bscolutw][0-2][0-3][01][row][01][0-5]\.[0-9a-f]{6}$/;
const kid = (name, g, tr, age, fr) => ({ stars: 30, plays: {}, likeG: {}, book: { title: 'Т', log: {} }, settings: { name, gender: g, track: tr, age, friend: fr, onboarded: true, lang: 'ru' } });
const fam = { engine: 'device', micOff: true, srOff: true, parentPhone: true, cur: 'k1', curFam: 'ft',
  families: { ft: { id: 'ft', name: 'Семья Т', cc: 'PT', code: 'testfamilycode01', kids: ['k1', 'k2'], grands: [
    { id: 'gvera', name: 'Бабушка Вера', she: true, role: 'gm', e: '👵', cc: 'RU' }, { id: 'glev', name: 'Дедушка Лев', she: false, role: 'gf', e: '👴', cc: 'PT' }] } },
  profiles: { k1: kid('Тина', 'f', 'r', 5, 'kitty'), k2: kid('Тоша', 'm', 'l', 8, 'tiger') } };
// a synthetic face, drawn on a canvas: grey hair, glasses, a beard (grandpa) or long brown hair (grandma); eyes and mouth
// at known places of the 600 px square, so the test can tap them
const FACE = (beard) => `(() => { const c = document.createElement('canvas'); c.width = c.height = 600; const x = c.getContext('2d');
  x.fillStyle = '#9ec5e8'; x.fillRect(0, 0, 600, 600);
  x.fillStyle = '${beard ? '#c8c8c8' : '#6b3e1f'}'; x.beginPath(); x.ellipse(300, 250, 175, 190, 0, 0, Math.PI * 2); x.fill();
  ${beard ? '' : "x.fillRect(125, 250, 350, 260);"}
  x.fillStyle = '#e9b48f'; x.beginPath(); x.ellipse(300, 310, 135, 165, 0, 0, Math.PI * 2); x.fill();
  ${beard ? "x.fillStyle = '#bdbdbd'; x.beginPath(); x.ellipse(300, 420, 120, 75, 0, 0, Math.PI); x.fill(); x.beginPath(); x.ellipse(300, 410, 125, 80, 0, 0, Math.PI); x.fill();" : ''}
  x.fillStyle = '#fff'; [240, 360].forEach(ex => { x.beginPath(); x.ellipse(ex, 270, 22, 15, 0, 0, Math.PI * 2); x.fill(); });
  x.fillStyle = '#3a6fb0'; [240, 360].forEach(ex => { x.beginPath(); x.arc(ex, 270, 9, 0, Math.PI * 2); x.fill(); });
  ${beard ? "x.strokeStyle = '#222'; x.lineWidth = 7; [240, 360].forEach(ex => { x.beginPath(); x.arc(ex, 270, 40, 0, Math.PI * 2); x.stroke(); }); x.fillStyle = '#222'; x.fillRect(280, 262, 40, 12);" : ''}
  x.fillStyle = '#b5485e'; x.beginPath(); x.ellipse(300, 380, 40, 13, 0, 0, Math.PI * 2); x.fill();
  return c.toDataURL('image/png'); })()`;
const HOOK = 'const fam = () => ROOT.families[ROOT.curFam] || null;';
const EYES = [[240, 270], [360, 270]], MOUTH = [300, 380];

(async () => {
  const b = await chromium.launch(), fails = [], log = (...a) => console.log(...a);
  const pre = await b.newPage(), faces = { glev: Buffer.from((await pre.evaluate(FACE(true))).split(',')[1], 'base64'), gvera: Buffer.from((await pre.evaluate(FACE(false))).split(',')[1], 'base64') };
  fs.writeFileSync(D + 'ga-face-synthetic.png', faces.glev); await pre.close();
  for (const lang of LANGS) for (const dev of DEVS) {
    const tag = `${lang}-${dev}`, page = BASE + (lang === 'en' ? '' : lang + '/');
    const c = await b.newContext(dev === 'phone' ? { ...devices['iPhone 13'], deviceScaleFactor: 1 } : { viewport: { width: 1280, height: 860 } });
    const reqs = [];
    c.on('request', r => reqs.push({ url: r.url(), method: r.method(), body: r.postData() || '' }));
    await c.route(/ntfy|wikipedia|huggingface|jsdelivr|youtube|wikimedia|workers\.dev/, r => r.abort());
    // the test reaches the game's functions (window.__T), as the other tests do
    await c.route(u => /\/(ru|de|pt|en)?\/?(index\.html)?$/.test(u.pathname), async r => { const x = await r.fetch(); let t = await x.text(); t = t.replace(HOOK, HOOK + ' window.__T = { run: s => eval(s) };'); r.fulfill({ response: x, body: t }); });
    await c.addInitScript(s => { try { speechSynthesis.speak = u => setTimeout(() => u.onend && u.onend(), 5); } catch (e) {} if (localStorage.getItem('seeded')) return; localStorage.setItem('seeded', 1); localStorage.setItem('govorilki-v2', JSON.stringify(s)); }, fam);
    const p = await c.newPage(), errs = []; p.on('pageerror', e => errs.push(e.message));
    const T = x => p.evaluate(s => window.__T.run(s), x);
    const ok = (cond, what) => { if (!cond) fails.push(`${tag}: ${what}`); log(`  ${cond ? '✓' : '✗'} ${what}`); };
    log(`== ${tag}`);
    await p.goto(page + '#pult'); await p.waitForSelector('[data-por="glev"]', { timeout: 15000 });
    for (const gid of ['glev', 'gvera']) {
      await p.click(`[data-por="${gid}"]`); await p.waitForSelector('#ptStage');
      const n0 = reqs.length;
      // the photo, from a synthetic face; framed as it is, the eyes and the mouth tapped
      await p.setInputFiles('#ptPick', { name: 'face.png', mimeType: 'image/png', buffer: faces[gid] });
      await p.waitForSelector('#ptNext'); await p.waitForTimeout(200);
      if (gid === 'glev') await p.screenshot({ path: D + `ga-${tag}-1-frame.png` });
      await p.click('#ptNext');
      // measured before every tap: a click on «Дальше» may scroll the page
      const tap = async ([x, y]) => { const box = await p.$eval('#ptStage', e => { e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width }; }); await p.mouse.click(box.x + x / 600 * box.w, box.y + y / 600 * box.w); };
      for (const e of EYES) await tap(e);
      await p.click('#ptNext'); await tap(MOUTH);
      if (gid === 'glev') await p.screenshot({ path: D + `ga-${tag}-2-marks.png` });
      await p.click('#ptNext'); await p.waitForSelector('#ptDraw .ava');
      const read = await p.evaluate(() => ({ photoGone: [...document.querySelectorAll('canvas')].every(c => c.width <= 1), files: [...document.querySelectorAll('input[type=file]')].every(i => !i.value), imgs: [...document.querySelectorAll('img')].filter(i => /^blob:|^data:/.test(i.src)).length }));
      ok(read.photoGone && read.files && !read.imgs, `${gid}: photo forgotten once drawn (canvases emptied, file field cleared)`);
      await p.screenshot({ path: D + `ga-${tag}-3-${gid}-parts.png`, fullPage: dev === 'laptop' });
      await p.click('#ptSave'); await p.waitForSelector('[data-por="glev"]');
      const sent = reqs.slice(n0).filter(r => !r.url.startsWith(BASE.replace(/govorilki\/$/, '')) || r.method !== 'GET');
      ok(sent.every(r => !/data:|blob:|base64/.test(r.body) && r.body.length < 4000), `${gid}: nothing of the photo sent (${sent.length} outside requests, all small, no image data)`);
    }
    const st = await p.evaluate(() => { const all = Object.keys(localStorage).map(k => [k, localStorage.getItem(k)]); const R = JSON.parse(localStorage.getItem('govorilki-v2')); return { img: all.filter(([k, v]) => /data:image|blob:/.test(v)).map(x => x[0]), size: all.reduce((s, [k, v]) => s + v.length, 0), av: R.families.ft.grands.map(g => g.av) }; });
    ok(!st.img.length, `localStorage holds no image (${(st.size / 1024).toFixed(1)} KB in all)`);
    ok(st.av.every(a => AVA_RE.test(a || '')), `portraits saved as drawings: ${st.av.join(' | ')}`);
    const lev = st.av[1] ? st.av[1] : '';
    ok(/\.[sctw]1[23]/.test(lev.split('.')[2] ? '.' + lev.split('.')[2] : ''), `grandpa read from the photo: glasses and beard (${lev})`);
    ok(/^(f2f0eb|bdbdbd|8a8a8a)$/.test(lev.split('.')[1] || ''), 'grandpa: grey hair');
    ok(/^[lo]/.test((st.av[0] || '').split('.')[2] || ''), `grandma: long hair (${st.av[0]})`);
    ok(await p.$$eval('.pv-face .ava', x => x.length) >= 2, 'parent panel shows both portraits');
    await p.screenshot({ path: D + `ga-${tag}-4-pult.png` });
    // the link carries the portrait
    const link = await T("entryLink('glev')");
    ok(/&a=[0-9a-f]{6}\./.test(link), 'the grandparent\'s link carries the drawing');
    // invitations and «Партия с родными»
    await T('screenInvite()'); await p.waitForSelector('.iv-row');
    ok(await p.$$eval('.iv-e .ava', x => x.length) === 2, 'invitations show portraits');
    await T('screenFamChess()');
    await p.waitForTimeout(300);
    ok(await p.$$eval('.fam-who .ava, .fam-h .ava', x => x.length) >= 2, 'family chess shows portraits');
    await p.screenshot({ path: D + `ga-${tag}-5-chess.png` });
    // the grandparent's own home on this phone
    await T("whoAdult('ft', 'glev')"); await p.waitForSelector('#ghTiles');
    ok(await p.$$eval('#gHeroFace .ava', x => x.length) === 1, 'grandparent home: portrait in the hero');
    ok(await p.$$eval('.gh-t', x => x.length) === 5, 'grandparent home: five big tiles');
    await p.screenshot({ path: D + `ga-${tag}-6-grand-home.png` });
    const n1 = reqs.length;
    await p.click('[data-gt="gHelloH"]'); await p.waitForTimeout(500);
    await p.click('#ghSt [data-st="2"]'); await p.click('#ghPh [data-hp="1"]'); await p.waitForTimeout(300);
    const hello = reqs.slice(n1).find(r => /ntfy/.test(r.url) && /"k":"cheer"/.test(r.body));
    ok(!!hello && /"p":11/.test(hello.body), 'hello sent to the family relay with its phrase code');
    ok(/🦋/.test(await p.textContent('#ghOut')), 'hello: «sent» note');
    await p.screenshot({ path: D + `ga-${tag}-7-hello.png` });
    ok(await T('cheerText({ p: 11 })') !== '', 'the child\'s phone reads the hello phrase');
    errs.length && log('  errors:', errs);
    ok(!errs.length, 'no page errors');
    await c.close();
  }
  // inside the artifact (an iframe): no photo, the portrait is made from parts only
  {
    const c = await b.newContext({ ...devices['iPhone 13'], deviceScaleFactor: 1 });
    await c.route(/ntfy|wikipedia|huggingface|jsdelivr|youtube|wikimedia|workers\.dev/, r => r.abort());
    await c.route('http://localhost:8781/frame.html', r => r.fulfill({ contentType: 'text/html', body: `<iframe src="${BASE}ru/#pult" style="width:390px;height:800px;border:0"></iframe>` }));
    await c.addInitScript(s => { try { speechSynthesis.speak = u => setTimeout(() => u.onend && u.onend(), 5); } catch (e) {} if (location.pathname.endsWith('frame.html') || localStorage.getItem('seeded')) return; localStorage.setItem('seeded', 1); localStorage.setItem('govorilki-v2', JSON.stringify(s)); }, fam);
    const p = await c.newPage(), errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto('http://localhost:8781/frame.html');
    const fr = await (await p.waitForSelector('iframe')).contentFrame();
    let okE = false;
    try { await fr.waitForSelector('[data-por="glev"]', { timeout: 15000 }); await fr.click('[data-por="glev"]'); await fr.waitForSelector('#ptSave'); okE = !(await fr.$('#ptPick')) && !(await fr.$('#ptPhoto')); } catch (e) { log('  embedded:', e.message.split('\n')[0]); }
    log(`== embedded\n  ${okE ? '✓' : '✗'} no photo buttons inside the artifact, parts only`); if (!okE) fails.push('embedded: photo button shown');
    if (errs.length) { fails.push('embedded: page errors ' + errs.join('; ')); log('  errors:', errs); }
    await c.close();
  }
  await b.close();
  log(fails.length ? `\nFAILED ${fails.length}:\n` + fails.join('\n') : '\nALL OK');
  process.exit(fails.length ? 1 : 0);
})();
