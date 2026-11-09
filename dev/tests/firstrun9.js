// A new 9-year-old's first minutes (an older first-time player): landing → family → her settings → the look step
// («Какой вид больше нравится?»: pick = calm | bright | skip, skipped = calm) → ready → «Сегодня» → the first step.
// Checks that the chosen look is applied at once and stored for the family and the child. Screenshots for the
// calm-design report. Invented child only (Тина).
// node tests/firstrun9.js [tag=after] [base=http://localhost:8781/govorilki/] [lang=ru] [pick=skip]
// Shots: tests/shots/calm-<tag>-first9[-pick]-<n>-<name>.png ('before' = a build without the look step)
const { chromium, devices } = require('playwright');
const path = require('path');
const TAG = process.argv[2] || 'after', BASE = process.argv[3] || 'http://localhost:8781/govorilki/', LANG = process.argv[4] || 'ru';
const PICK = process.argv[5] || 'skip';
const SUB = { ru: 'ru/', en: '', pt: 'pt/', de: 'de/' };
const SHOTS = path.join(__dirname, 'shots');
(async () => {
  const b = await chromium.launch();
  const c = await b.newContext({ ...devices['iPhone 13'], deviceScaleFactor: 1 });
  await c.route(/ntfy|wikipedia|huggingface|jsdelivr|youtube|wikimedia|workers\.dev/, r => r.abort());
  await c.addInitScript(() => { try { speechSynthesis.speak = u => setTimeout(() => u.onend && u.onend(), 5); } catch (e) {} });
  const p = await c.newPage(), errs = [], miss = [];
  p.on('pageerror', e => errs.push(e.message));
  let n = 0;
  const tagP = PICK === 'skip' ? '' : '-' + PICK;
  const shot = async name => { await p.waitForTimeout(800); await p.screenshot({ path: `${SHOTS}/calm-${TAG}-first9${tagP}-${n++}-${name}.png` }); };
  const tap = async (sel, what) => { const l = p.locator(sel).first(); if (!(await l.count())) { miss.push(what); return false; } await l.click(); return true; };
  await p.goto(BASE + SUB[LANG]); await p.waitForTimeout(1500);
  await shot('landing');
  await tap('#obStart', 'start');
  await p.waitForTimeout(700);
  await p.locator('.fe-name').first().fill('Тина');
  await tap('.pick-b >> nth=0', 'girl');
  await tap('.fe-agealt>summary', 'age fold'); await tap('[data-age="9"]', 'age 9');
  await shot('family');
  await tap('#feSave', 'save'); await p.waitForTimeout(800);
  await shot('settings');
  await tap('#ksNext', 'next'); await p.waitForTimeout(800);
  if (TAG !== 'before') {
    if (!(await p.$$('#lookPick [data-look]')).length) miss.push('look cards');
    if (PICK !== 'skip') { await tap(`#lookPick [data-look="${PICK}"]`, 'pick ' + PICK); await p.waitForTimeout(400); }
    await shot('look');
    const calm = await p.evaluate(() => document.body.classList.contains('look-calm'));
    if (calm !== (PICK !== 'bright')) miss.push('look applied at once: calm=' + calm);
    await tap('#lkNext', 'look next'); await p.waitForTimeout(800);
  }
  await shot('ready');
  await tap('#obGo', 'go'); await p.waitForTimeout(1200);
  await shot('home');
  if (TAG !== 'before') {
    const st = await p.evaluate(() => { const r = JSON.parse(localStorage.getItem('govorilki-v2')), f = r.families[r.curFam]; return { f: f.look, k: r.profiles[r.cur].settings.look, calm: document.body.classList.contains('look-calm') }; });
    const want = PICK === 'bright' ? 'bright' : 'calm';
    if (st.f !== want || st.k !== want || st.calm !== (want === 'calm')) miss.push('stored look ' + JSON.stringify(st));
  }
  await p.evaluate(() => { const st = document.querySelector('#stage'); if (st) st.scrollTop = 700; }); await shot('home2');
  await p.evaluate(() => { const st = document.querySelector('#stage'); if (st) st.scrollTop = 1500; }); await shot('home3');
  await p.evaluate(() => { const st = document.querySelector('#stage'); if (st) st.scrollTop = 0; });
  await tap('.pd-n.now', 'first step'); await p.waitForTimeout(1200);
  await shot('step');
  const go = p.locator('.overlay .big').first(); if (await go.count()) { await go.click(); await p.waitForTimeout(1200); await shot('game'); }
  console.log(`first9 ${LANG} pick=${PICK}: missing ${JSON.stringify(miss)} | errors ${JSON.stringify(errs)}`);
  await b.close(); process.exit(errs.length || miss.length ? 1 : 0);
})();
