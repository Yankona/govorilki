// Ballet colouring pages and the footballer friends («Выбери друга» → «Футболисты»), in 4 languages, phone and laptop.
// Fictional children only (Тина likes football and ballet). Needs tests/serve.sh running.
// node tests/colorfoot.js [base=http://localhost:8781/govorilki/] [phone|laptop]
const { chromium, devices } = require('playwright');
const path = require('path');
const BASE = process.argv[2] || 'http://localhost:8781/govorilki/', DEV = process.argv[3] || 'phone';
const SHOTS = path.join(__dirname, 'shots');
const HOOK = 'const fam = () => ROOT.families[ROOT.curFam] || null;';
const LANGS = { ru: 'ru/', en: '', pt: 'pt/', de: 'de/' };
const kid = (name, g, age, fr, lang, likes) => ({ stars: 5, plays: {}, learn: {}, book: { title: 'Т', log: {} }, settings: { name, gender: g, track: 'r', age, friend: fr, onboarded: true, lang, likes } });
(async () => {
  const b = await chromium.launch(); let bad = 0;
  for (const [lang, sub] of Object.entries(LANGS)) {
    const seed = { engine: 'device', micOff: true, srOff: true, parentPhone: true, cur: 'k1', curFam: 'f1',
      families: { f1: { id: 'f1', name: 'Т', cc: 'PT', kids: ['k1', 'k2'], grands: [] } },
      profiles: { k1: kid('Тина', 'f', 6, 'kitty', lang, ['football', 'ballet']), k2: kid('Тоша', 'm', 8, 'tiger', lang, []) } };
    const c = await b.newContext(DEV === 'laptop' ? { viewport: { width: 1280, height: 800 } } : { ...devices['iPhone 13'] });
    await c.route(/ntfy|wikipedia|huggingface|jsdelivr|youtube|wikimedia|workers\.dev/, r => r.abort());
    await c.route(u => /\/(ru|de|pt|en)?\/?(index\.html)?$/.test(u.pathname), async r => { const x = await r.fetch(); let t = await x.text(); t = t.replace(HOOK, HOOK + ' window.__T = { run: s => eval(s) };'); r.fulfill({ response: x, body: t }); });
    await c.addInitScript(s => { window.__said = []; try { speechSynthesis.speak = u => { window.__said.push(u.text); setTimeout(() => u.onend && u.onend(), 1500); }; } catch (e) {} if (localStorage.getItem('seeded')) return; localStorage.setItem('seeded', 1); localStorage.setItem('govorilki-v2', JSON.stringify(s)); }, seed);
    const p = await c.newPage(), errs = [], fail = [], R = s => p.evaluate(s => window.__T.run(s), s);
    p.on('pageerror', e => errs.push(e.message));
    await p.goto(BASE + sub); await p.waitForTimeout(1500);
    const who = await p.$$('.who-kid'); if (who.length) { await who[0].click(); await p.waitForTimeout(900); }
    // friends: footballers first for a child who likes football
    await R('screenFriends()'); await p.waitForTimeout(600);
    const fr = await p.evaluate(() => { const g = [...document.querySelectorAll('.friends')].filter(x => x.querySelector('.friend'))[0], f = [...g.querySelectorAll('.friend')];
      return { h: [...document.querySelectorAll('.fr-h')].map(x => x.textContent), ids: f.map(x => x.dataset.id), names: f.map(x => x.querySelector('b').textContent + ' / ' + x.querySelector('small').textContent) }; });
    if (fr.ids.length !== 10 || fr.ids[0] !== 'messi') fail.push('footballers not first: ' + fr.ids.join(','));
    if (lang !== 'ru' && fr.names.some(n => /[а-яё]/i.test(n))) fail.push('untranslated ' + fr.names.join(', '));
    await p.screenshot({ path: `${SHOTS}/cf-${lang}-${DEV}-friends.png`, fullPage: DEV === 'laptop' });
    await p.click('.friend[data-id="messi"]'); await p.waitForTimeout(300);
    // the mouth moves while the friend talks
    let maxRy = 0;
    for (let i = 0; i < 12; i++) { const ry = await p.evaluate(() => { const o = document.querySelector('#ryzBtn svg .lv-o'); return o ? +o.getAttribute('ry') : 0; }); maxRy = Math.max(maxRy, ry); await p.waitForTimeout(90); }
    if (maxRy < 2) fail.push('mouth still ' + maxRy);
    await p.waitForTimeout(1600); const said = await p.evaluate(() => window.__said.slice(-3).join(' '));
    if (!/Месси|Мэсси|Messi/.test(said.replace(/\u0301/g, ''))) fail.push('said: ' + said);
    if ((await R('P.settings.friend')) !== 'messi') fail.push('not chosen');
    await p.click('#friendOk'); await p.waitForTimeout(900);
    if (!(await p.evaluate(() => document.querySelector('.screen').innerHTML.includes('#74ACDF')))) fail.push('no Messi on home');
    await p.screenshot({ path: `${SHOTS}/cf-${lang}-${DEV}-home.png` });
    // a child who does not like football: footballers come last
    const order2 = await R(`(() => { P.settings.likes = []; screenFriends(); return [...document.querySelectorAll('.friends')].map(x => x.querySelector('.friend')).filter(Boolean).map(x => x.dataset.id).join(','); })()`);
    if (order2.split(',').pop() !== 'messi') fail.push('order without football: ' + order2);
    // the two pets near the start of the animals, chosen and talking
    const animals = await p.evaluate(() => [...[...document.querySelectorAll('.friends')].filter(x => x.querySelector('.friend'))[0].querySelectorAll('.friend')].map(x => x.dataset.id));
    if (animals[1] !== 'lilu' || animals[2] !== 'omik') fail.push('pets: ' + animals.join(','));
    for (const id of ['lilu', 'omik']) {
      await p.click(`.friend[data-id="${id}"]`); let ry = 0;
      for (let i = 0; i < 10; i++) { ry = Math.max(ry, await p.evaluate(() => { const o = document.querySelector('#ryzBtn svg .lv-o'); return o ? +o.getAttribute('ry') : 0; })); await p.waitForTimeout(90); }
      if (ry < 2 || (await R('P.settings.friend')) !== id) fail.push(id + ' mouth ' + ry);
    }
    await p.evaluate(() => document.querySelector('.friend[data-id="lilu"]').scrollIntoView({ block: 'center' }));
    await p.screenshot({ path: `${SHOTS}/cf-${lang}-${DEV}-pets.png` });
    await p.waitForTimeout(1600);
    // colouring: the ballet group first for a ballet lover, every page fills
    await R(`(() => { P.settings.likes = ['ballet']; screenColorMenu(); })()`); await p.waitForTimeout(600);
    const cm = await p.evaluate(() => ({ h: [...document.querySelectorAll('.sec-h')].map(x => x.textContent), n: document.querySelector('.cards').querySelectorAll('.page').length }));
    if (cm.n !== 7) fail.push('ballet group first has ' + cm.n);
    await p.screenshot({ path: `${SHOTS}/cf-${lang}-${DEV}-colormenu.png` });
    const pages = await R('BALLET_PAGES');
    for (const pg of pages) {
      await R(`screenPaint({ mode: 'color', page: '${pg}' })`); await p.waitForTimeout(500);
      await p.click('.tool[data-t="fill"]').catch(() => fail.push('no fill tool'));
      const pts = await p.evaluate(() => [...document.querySelectorAll('#svgPage svg path, #svgPage svg circle, #svgPage svg ellipse, #svgPage svg rect')].filter(el => el.getAttribute('fill') === '#FFFFFF').map(el => {
        const r = el.getBoundingClientRect();
        for (let i = 1; i < 10; i++) for (let j = 1; j < 10; j++) { const x = r.left + r.width * i / 10, y = r.top + r.height * j / 10; if (document.elementFromPoint(x, y) === el) return [x, y]; }
        return null; }).filter(Boolean));
      const cols = ['#FF4D4D', '#FFD93D', '#4DB8FF', '#FF77B7'];
      for (let i = 0; i < pts.length; i++) { await p.click(`.swc[data-c="${cols[i % 4]}"]`); await p.mouse.click(pts[i][0], pts[i][1]); }
      const filled = await p.evaluate(() => document.querySelectorAll('#svgPage [style*="fill"]').length);
      if (pts.length < 6 || filled < pts.length * .9) fail.push(`${pg}: ${filled}/${pts.length} filled`);
      if (pg === 'svg:bl-arabesque' || pg === 'svg:bl-nutcracker') await p.screenshot({ path: `${SHOTS}/cf-${lang}-${DEV}-${pg.slice(7)}.png` });
      // colouring by letters finds enough parts on this page (no fallback to another picture)
      await R(`screenCodeColor('abc', '${pg}')`); await p.waitForTimeout(700);
      const cc = await R(`[(CC_FEW.abc || []).includes('${pg}'), document.querySelectorAll('.cc-t').length]`);
      if (cc[0] || cc[1] < 4) fail.push(`${pg}: code-colour labels ${cc[1]}`);
    }
    console.log(`${lang} ${DEV}: friends ${fr.h.join(' | ')} [${fr.names.slice(0, 3).join('; ')}…] mouth ${maxRy.toFixed(1)} | said «${said}» | colour ${cm.h.join(' | ')} | fails ${JSON.stringify(fail)} | errors ${JSON.stringify(errs)}`);
    if (errs.length || fail.length) bad++;
    await c.close();
  }
  await b.close(); console.log(bad ? `FAIL in ${bad} language(s)` : 'OK: all languages'); process.exit(bad ? 1 : 0);
})();
