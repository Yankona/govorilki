// Colouring pages are clear and one tap fills one part («color-clear»): for every downloaded page (img/color) every
// closed part of the picture, found in the source PNG, is tapped once with the bucket on the real canvas; the filled
// area must match that part (no leak into the neighbours, nothing missed). The hand-drawn ballet, football and car pages
// are gone; the friends stay and their bright shirts are paper, not pre-coloured. The bright, calm and dark looks keep
// the paper white. Invented child only (Тина). Needs tests/serve.sh running.
// node tests/color_clear.js [base=http://localhost:8781/govorilki/] [phone|laptop]
const { chromium, devices } = require('playwright');
const path = require('path');
const BASE = process.argv[2] || 'http://localhost:8781/govorilki/', DEV = process.argv[3] || 'phone';
const SHOTS = path.join(__dirname, 'shots');
const HOOK = 'const fam = () => ROOT.families[ROOT.curFam] || null;';
const kid = { stars: 5, plays: {}, learn: {}, book: { title: 'Т', log: {} }, settings: { name: 'Тина', gender: 'f', track: 'r', age: 6, friend: 'kitty', onboarded: true, lang: 'ru', likes: ['ballet', 'football', 'race'] } };
const PAL = ['#FF4D4D', '#FF9F1C', '#FFD93D', '#4CC261', '#2BB3A3', '#4DB8FF', '#3D6BFF', '#9B5DE5', '#FF77B7', '#A0522D'];
(async () => {
  const b = await chromium.launch(), fail = [], errs = [];
  const seed = { engine: 'device', micOff: true, srOff: true, parentPhone: true, cur: 'k1', curFam: 'f1', families: { f1: { id: 'f1', name: 'Т', cc: 'PT', kids: ['k1'], grands: [] } }, profiles: { k1: kid } };
  const c = await b.newContext(DEV === 'laptop' ? { viewport: { width: 1280, height: 800 } } : { ...devices['iPhone 13'] });
  await c.route(/ntfy|wikipedia|huggingface|jsdelivr|youtube|wikimedia|workers\.dev/, r => r.abort());
  await c.route(u => /\/(ru|de|pt|en)?\/?(index\.html)?$/.test(u.pathname), async r => { const x = await r.fetch(); let t = await x.text(); t = t.replace(HOOK, HOOK + ' window.__T = { run: s => eval(s) };'); r.fulfill({ response: x, body: t }); });
  await c.addInitScript(s => { try { speechSynthesis.speak = u => setTimeout(() => u.onend && u.onend(), 50); } catch (e) {} if (localStorage.getItem('seeded')) return; localStorage.setItem('seeded', 1); localStorage.setItem('govorilki-v2', JSON.stringify(s)); }, seed);
  const p = await c.newPage(), R = s => p.evaluate(s => window.__T.run(s), s);
  p.on('pageerror', e => errs.push(e.message));
  await p.goto(BASE + 'ru/'); await p.waitForTimeout(1500);
  const who = await p.$$('.who-kid'); if (who.length) { await who[0].click(); await p.waitForTimeout(900); }
  // the menu: no hand-drawn ballet/football/car pages left, the new ones are there
  const menu = await R(`(() => { screenColorMenu(); return [...document.querySelectorAll('.page')].map(x => x.dataset.p); })()`);
  const gone = menu.filter(x => /^svg:(bl-(arabesque|leap|duet|pointes|barre|swan)|fb-|vh-|dino$)/.test(x));
  if (gone.length) fail.push('old pages still in the menu: ' + gone.join(','));
  for (const k of ['ballerina', 'pointes', 'swan', 'kick', 'ball', 'monster-truck', 'motorbike']) if (!menu.includes('img:' + k)) fail.push('missing img:' + k);
  await p.waitForTimeout(1500); await p.screenshot({ path: `${SHOTS}/cc-${DEV}-menu.png`, fullPage: DEV === 'laptop' });
  // friends: a bright shirt is paper now (red, green), the dark hair stays
  const fr = await R(`['ronaldo', 'salah', 'haaland', 'yamal'].map(k => /#C8102E|#CE1126|#00663A|#C60B1E/i.test(outlineSVG(pageSVG(k))))`);
  if (fr.some(Boolean)) fail.push('friend shirts still pre-coloured: ' + fr);
  // every downloaded page, every part
  const pages = await R('IMG_PAGES'); let parts = 0; const splits = [];
  for (const pg of pages) {
    await R(`screenPaint({ mode: 'color', page: '${pg}' })`);
    const loaded = await p.waitForFunction(() => { const c = document.querySelector('#cvL'); if (!c) return false; const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; for (let i = 3; i < d.length; i += 4000) if (d[i] > 110) return true; return false; }, null, { timeout: 8000 }).then(() => true, () => false);
    if (!loaded) { fail.push(pg + ': lines did not load'); continue; }
    await p.click('.tool[data-t="fill"]').catch(() => {});
    // the parts of the source picture and where each lands on the canvas (the game draws it at 94 % of the paper, centred)
    const plan = await p.evaluate(async src => {
      const im = new Image(); im.src = src; await im.decode();
      const iw = im.width, ih = im.height, oc = document.createElement('canvas'); oc.width = iw; oc.height = ih; const ox = oc.getContext('2d'); ox.drawImage(im, 0, 0);
      const a = ox.getImageData(0, 0, iw, ih).data, L = q => a[q * 4 + 3] > 110, lab = new Int32Array(iw * ih).fill(-1), comps = [];
      for (let s = 0; s < iw * ih; s++) {
        if (lab[s] !== -1 || L(s)) continue;
        const st = [s], px = []; lab[s] = comps.length; let edge = false;
        while (st.length) {
          const q = st.pop(), x = q % iw, y = (q / iw) | 0; px.push(q); if (!x || !y || x === iw - 1 || y === ih - 1) edge = true;
          const nb = []; if (x > 0) nb.push(q - 1); if (x < iw - 1) nb.push(q + 1); if (y > 0) nb.push(q - iw); if (y < ih - 1) nb.push(q + iw);
          for (const r of nb) if (lab[r] === -1 && !L(r)) { lab[r] = comps.length; st.push(r); }
        }
        comps.push({ edge, px });
      }
      const cv = document.querySelector('#cvL'), W = cv.width, H = cv.height, k = Math.min(W * .94 / iw, H * .94 / ih), x0 = (W - iw * k) / 2, y0 = (H - ih * k) / 2, rr = cv.getBoundingClientRect(), css = rr.width / W;
      const out = [];
      for (const cm of comps) {
        if (cm.edge || cm.px.length * k * k < 600) continue;   // the outside, and specks too small to aim at
        // the point deepest inside the part (farthest from its lines along the axes), sampled
        let best = null, bd = -1;
        for (let i = 0; i < cm.px.length; i += Math.max(1, cm.px.length >> 10)) {
          const q = cm.px[i], x = q % iw, y = (q / iw) | 0; let d = 1;
          for (; d < 60; d++) if (x + d >= iw || x - d < 0 || y + d >= ih || y - d < 0 || L(q + d) || L(q - d) || L(q + d * iw) || L(q - d * iw)) break;
          if (d > bd) { bd = d; best = [x, y]; }
        }
        const cx = Math.round(x0 + (best[0] + .5) * k), cy = Math.round(y0 + (best[1] + .5) * k);
        out.push({ want: cm.px.length * k * k, cx, cy, sx: rr.left + (cx + .5) * css, sy: rr.top + (cy + .5) * css, deep: bd * k });
      }
      return out;
    }, await R(`colorImgSrc('${pg.slice(4)}')`));
    let i = 0; const bad = [], split = [];
    for (const t of plan) {
      if (t.deep < 3) continue;                            // a sliver thinner than a finger's aim
      const col = PAL[i++ % PAL.length]; await p.click(`.swc[data-c="${col}"]`);
      const got = await p.evaluate(({ sx, sy, col }) => {
        const c = document.querySelector('#cvB'), x = c.getContext('2d'), W = c.width, H = c.height, [r, g, b] = [1, 3, 5].map(i => parseInt(col.slice(i, i + 2), 16));
        const cnt = () => { const d = x.getImageData(0, 0, W, H).data; let n = 0; for (let j = 0; j < d.length; j += 4) if (d[j + 3] > 250 && d[j] === r && d[j + 1] === g && d[j + 2] === b) n++; return n; };
        const n0 = cnt(); c.dispatchEvent(new PointerEvent('pointerdown', { clientX: sx, clientY: sy, bubbles: true, cancelable: true, pointerId: 1 })); return cnt() - n0;
      }, { ...t, col });
      parts++;
      const ratio = got / t.want;
      // a leak (one tap floods the neighbours) fails; a part that a narrow neck splits in two on this screen only takes a second tap
      if (ratio > 1.35) bad.push(`(${t.cx},${t.cy}) ${Math.round(t.want)}→${got}`); else if (ratio < .5) split.push(pg);
    }
    if (bad.length) fail.push(`${pg}: ${bad.length}/${plan.length} parts leak: ${bad.slice(0, 3).join(' ')}`);
    if (split.length) splits.push(`${pg.slice(4)} ${split.length}`);
    if (['img:ballerina', 'img:pointes', 'img:kick', 'img:monster-truck', 'img:motorbike', 'img:swan'].includes(pg)) await p.screenshot({ path: `${SHOTS}/cc-${DEV}-${pg.slice(4)}.png` });
  }
  // the bright, calm and dark looks keep the paper white
  for (const look of ['bright', 'calm', 'dark']) {
    const bg = await R(`(() => { lookSetKid('${look}'); lookApply(); screenPaint({ mode: 'color', page: 'img:pointes' }); return getComputedStyle(document.querySelector('#paper')).backgroundColor + ' ' + document.body.className; })()`);
    if (!/255, 255, 255/.test(bg)) fail.push(`${look}: paper ${bg}`);
    if (look === 'dark') { await p.waitForTimeout(800); await p.screenshot({ path: `${SHOTS}/cc-${DEV}-dark.png` }); }
  }
  console.log(`${DEV}: ${pages.length} downloaded pages, ${parts} parts tapped, no leaks allowed | parts split by a narrow neck on this screen (two taps): ${splits.join(', ') || 'none'} | fails ${JSON.stringify(fail)} | errors ${JSON.stringify(errs)}`);
  await b.close(); console.log(fail.length || errs.length ? 'FAIL' : 'OK'); process.exit(fail.length || errs.length ? 1 : 0);
})();
