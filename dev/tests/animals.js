// Animals on the globe: the «Животные» mode (markers where they live, a tap names the animal and tells about it, a tap on
// a country lists its animals) and the game «Где живёт…?» (a right tap, two wrong taps → the globe turns to the answer).
// Phone and laptop, 4 languages. Fictional children only (Тина). node tests/animals.js [base] [langs=ru,en,pt,de]
const { chromium, devices } = require('playwright');
const D = require('path').join(__dirname, 'shots') + '/';
const BASE = process.argv[2] || 'http://localhost:8781/govorilki/', LANGS = (process.argv[3] || 'ru,en,pt,de').split(',');
const SUB = { ru: 'ru/', en: '', pt: 'pt/', de: 'de/' };
const HOOK = 'const fam = () => ROOT.families[ROOT.curFam] || null;';
const kid = (name, lang) => ({ stars: 5, plays: {}, learn: {}, book: { title: 'Т', log: {} }, settings: { name, gender: 'f', track: 'r', age: 6, friend: 'kitty', onboarded: true, lang } });
const seedOf = lang => ({ engine: 'device', micOff: true, srOff: true, parentPhone: true, cur: 'k1', curFam: 'f1', families: { f1: { id: 'f1', name: 'Т', cc: 'PT', kids: ['k1'], grands: [] } }, profiles: { k1: kid('Тина', lang) } });
const CYR = /[А-Яа-яЁё]/;
let bad = 0; const fail = m => { bad++; console.log('  FAIL ' + m); };

async function ctxFor(b, dev, lang) {
  const c = await b.newContext(dev === 'laptop' ? { viewport: { width: 1280, height: 800 } } : { ...devices['iPhone 13'], deviceScaleFactor: 2 });
  await c.route(/ntfy|wikipedia|huggingface|jsdelivr|youtube|wikimedia|workers\.dev/, r => r.abort());
  await c.route(u => /\/(ru|de|pt|en)?\/?(index\.html)?$/.test(u.pathname), async r => { const x = await r.fetch(); let t = await x.text(); t = t.replace(HOOK, HOOK + ' window.__T = { run: s => eval(s) };'); r.fulfill({ response: x, body: t }); });
  await c.addInitScript(s => { window.__said = []; try { speechSynthesis.speak = u => { window.__said.push(u.text); setTimeout(() => u.onend && u.onend(), 5); }; } catch (e) {} if (localStorage.getItem('seeded')) return; localStorage.setItem('seeded', 1); localStorage.setItem('govorilki-v2', JSON.stringify(s)); }, seedOf(lang));
  return c;
}
// the tap in the middle of the globe, measured again each time (a click on a chip below can scroll the page)
async function tapC(p, dev) { await p.evaluate(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }); await p.waitForTimeout(50); const r = await p.$eval('#glC', e => { const b = e.getBoundingClientRect(); return [b.left + b.width / 2, b.top + b.height / 2]; }); if (process.env.DBG) console.log('tap', r, await p.evaluate(([x, y]) => { const e = document.elementFromPoint(x, y); return e && (e.id || e.className) + ' sy=' + scrollY; }, r)); await tapAt(p, dev, r[0], r[1]); }
async function tapAt(p, dev, x, y) { if (dev === 'laptop') await p.mouse.click(x, y); else await p.touchscreen.tap(x, y); await p.waitForTimeout(400); }
const run = (p, s) => p.evaluate(s => window.__T.run(s), s);
const st = p => run(p, 'GLOBE_SCREEN.state()');
const said = async p => (await p.evaluate(() => window.__said.slice(-1)))[0] || '';
const infoT = p => p.$eval('#glInfo', e => e.textContent.trim());

(async () => {
  const b = await chromium.launch();
  for (const dev of ['phone', 'laptop']) for (const lang of LANGS) {
    const c = await ctxFor(b, dev, lang), p = await c.newPage(), errs = [];
    p.on('pageerror', e => errs.push(e.message)); if (process.env.DBG) p.on('console', m => /CLICK/.test(m.text()) && console.log(m.text()));
    await p.goto(BASE + SUB[lang]); await p.waitForTimeout(1500);
    const who = await p.$$('.who-kid'); if (who.length) { await who[0].click(); await p.waitForTimeout(800); }
    await run(p, 'TRAVEL.screen()'); await p.waitForTimeout(500);
    await p.click('#tvGlobe'); await p.waitForTimeout(700);
    const line = [`${dev} ${lang}`];
    // the mode buttons
    const modes = await p.$$eval('#glModes [data-m]', x => x.map(e => e.textContent.trim()));
    if (modes.length !== 3) fail(`${dev} ${lang}: mode buttons ${modes}`);
    if (lang !== 'ru' && modes.some(m => CYR.test(m))) fail(`${dev} ${lang}: untranslated modes ${modes}`);
    await p.click('#glModes [data-m="a"]'); await p.waitForTimeout(300);
    if ((await st(p)).mode !== 'a') fail(`${dev} ${lang}: the animals mode did not switch on`);
    // a tap on the kangaroo's picture
    await run(p, 'GLOBE_SCREEN.look(133, -25)'); await p.waitForTimeout(150);
    await tapC(p, dev);
    let s = await st(p);
    if (!s.sel || s.sel.a !== 'kangaroo') fail(`${dev} ${lang}: kangaroo tap gave ${JSON.stringify(s.sel)}`);
    const kt = await infoT(p), ks = await said(p);
    line.push('kangaroo: ' + kt.slice(0, 50));
    if (!ks || (lang !== 'ru' && CYR.test(ks))) fail(`${dev} ${lang}: kangaroo voice «${ks}»`);
    if (lang !== 'ru' && CYR.test(kt)) fail(`${dev} ${lang}: untranslated «${kt}»`);
    await p.screenshot({ path: D + `animals-${dev}-${lang}.png` });
    // the stork, drawn by hand
    await run(p, 'GLOBE_SCREEN.look(11, 52, 3)'); await p.waitForTimeout(150);
    await tapC(p, dev);
    if (lang === 'ru') await p.screenshot({ path: D + `animals-stork-${dev}.png` });
    if ((await st(p)).sel?.a !== 'stork') fail(`${dev} ${lang}: stork tap gave ${JSON.stringify((await st(p)).sel)}`);
    // a country away from the pictures: who lives there; a chip turns the globe to the animal
    await run(p, 'GLOBE_SCREEN.look(-45, -12)'); await p.waitForTimeout(150);
    await tapC(p, dev);
    s = await st(p);
    const chips = await p.$$eval('#glInfo [data-a]', x => x.map(e => e.dataset.a));
    line.push(`Brazil (${JSON.stringify(s.sel)}): ${chips.join(',')}`);
    if (!chips.includes('sloth') || !chips.includes('jaguar')) fail(`${dev} ${lang}: Brazil lists ${chips}`);
    await p.click('#glInfo [data-a="sloth"]'); await p.waitForTimeout(1500);
    s = await st(p);
    if (s.sel?.a !== 'sloth' || Math.abs(s.lon + 62) > 2) fail(`${dev} ${lang}: the sloth chip: ${JSON.stringify(s)}`);
    // Antarctica: the penguin lives there
    await run(p, 'GLOBE_SCREEN.look(-100, -78)'); await p.waitForTimeout(150);
    await tapC(p, dev);
    const aq = await p.$$eval('#glInfo [data-a]', x => x.map(e => e.dataset.a));
    if (!aq.includes('penguin')) fail(`${dev} ${lang}: Antarctica lists ${aq}`);
    // the game: a right answer
    await p.click('#glModes [data-m="g"]'); await p.waitForTimeout(300);
    if (process.env.DBG) await p.evaluate(() => document.addEventListener('click', e => console.log('CLICK', e.target.id || e.target.className, e.clientX, e.clientY, e.isTrusted), true));
    s = await st(p); const q = await said(p);
    line.push(`game: ${s.game?.id} «${q}»`);
    if (!s.game) { fail(`${dev} ${lang}: no game`); await c.close(); continue; }
    if (lang !== 'ru' && CYR.test(q)) fail(`${dev} ${lang}: untranslated question ${q}`);
    const A = await run(p, `GLOBE_ANIMALS.find(a => a.id === '${s.game.id}').ll`);
    await run(p, `GLOBE_SCREEN.look(${A[0]}, ${Math.max(-80, Math.min(80, A[1]))})`); await p.waitForTimeout(150);
    await tapC(p, dev);
    s = await st(p);
    if (!s.game || !s.game.done || s.game.score !== 1) fail(`${dev} ${lang}: the right tap: ${JSON.stringify(s.game)}`);
    await p.waitForTimeout(500); await p.screenshot({ path: D + `animals-game-${dev}-${lang}.png` });
    // next: two wrong taps → a hint, the globe turns, a tap on the picture counts
    await p.click('#glNext'); await p.waitForTimeout(300);
    s = await st(p);
    // a land far from where it lives (not its countries, more than 50° away)
    const far = await run(p, `(() => { const a = GLOBE_ANIMALS.find(a => a.id === '${s.game.id}'), R = Math.PI / 180;
      const d = (p, q) => Math.acos(Math.sin(p[1] * R) * Math.sin(q[1] * R) + Math.cos(p[1] * R) * Math.cos(q[1] * R) * Math.cos((p[0] - q[0]) * R)) / R;
      return [[100, 58], [-100, 40], [24, -22], [134, -25], [-55, -8], [10, 50], [78, 22], [30, 30]].find(q => { const cc = GLOBE_SCREEN.countryAt(q[0], q[1]); return cc && !a.cc.includes(cc) && d(q, a.ll) > 50; }); })()`);
    for (let i = 0; i < 2; i++) { await run(p, `GLOBE_SCREEN.look(${far[0]}, ${far[1]})`); await p.waitForTimeout(150); await tapC(p, dev); }
    s = await st(p); line.push(`wrong ×2 on ${s.game.id}: miss ${s.game.miss} «${(await said(p)).slice(0, 70)}»`);
    if (s.game.miss !== 2 || s.sel?.a !== s.game.id) fail(`${dev} ${lang}: the hint: ${JSON.stringify(s)}`);
    await p.waitForTimeout(1800); await p.screenshot({ path: D + `animals-hint-${dev}-${lang}.png` });
    await tapC(p, dev);
    s = await st(p);
    if (!s.game || !s.game.done || s.game.score !== 1) fail(`${dev} ${lang}: the tap after the hint: ${JSON.stringify(s)}`);
    // back to the countries: the city dots and the old texts
    await p.click('#glModes [data-m="c"]'); await p.waitForTimeout(300);
    await run(p, 'GLOBE_SCREEN.look(134, -25)'); await p.waitForTimeout(150); await tapC(p, dev);
    if ((await st(p)).sel?.cc !== 'AU') fail(`${dev} ${lang}: countries mode after animals`);
    if (errs.length) fail(`${dev} ${lang}: page errors ${JSON.stringify(errs)}`);
    console.log(line.join(' | '));
    await c.close();
  }
  await b.close(); console.log(bad ? `FAIL: ${bad}` : 'OK: animals'); process.exit(bad ? 1 : 0);
})();
