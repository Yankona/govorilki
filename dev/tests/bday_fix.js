// Date of birth (bug on iPhone: «пропадает календарь»): iPhone fires «change» while its calendar is open; the field
// must stay the same element (no redraw), the age must follow, and the date must be kept after saving and a reload.
// Places: the family form of an existing family, the first-start form (new child), and the child's interests screen.
// Fictional child only (Тина). node tests/bday_fix.js [base] → one line per language × device; exit 1 on failure.
const { chromium, devices } = require('playwright');
const BASE = process.argv[2] || 'http://localhost:8781/govorilki/';
const HOOK = 'const fam = () => ROOT.families[ROOT.curFam] || null;';
const LANGS = { ru: 'ru/', en: '', pt: 'pt/', de: 'de/' };
const DEVS = { iphone: { ...devices['iPhone 13'], deviceScaleFactor: 1 }, android: { ...devices['Pixel 7'], deviceScaleFactor: 1 }, laptop: { viewport: { width: 1280, height: 800 } } };
const kid = (name, g, age, lang) => ({ stars: 5, plays: {}, learn: {}, book: { title: 'Т', log: {} }, settings: { name, gender: g, track: 'r', age, friend: 'kitty', onboarded: true, lang } });
const D1 = '2020-03-15', D2 = '2019-07-02';
(async () => {
  const b = await chromium.launch(); let bad = 0;
  for (const [dev, opt] of Object.entries(DEVS)) for (const [lang, sub] of Object.entries(LANGS)) {
    const seed = { engine: 'device', micOff: true, srOff: true, parentPhone: true, cur: 'k1', curFam: 'f1',
      families: { f1: { id: 'f1', name: 'Т', cc: 'PT', kids: ['k1'], grands: [] } }, profiles: { k1: kid('Тина', 'f', 5, lang) } };
    const c = await b.newContext(opt);
    await c.route(/ntfy|wikipedia|huggingface|jsdelivr|youtube|wikimedia|workers\.dev/, r => r.abort());
    await c.route(u => /\/(ru|de|pt|en)?\/?(index\.html)?$/.test(u.pathname), async r => { const x = await r.fetch(); let t = await x.text(); t = t.replace(HOOK, HOOK + ' window.__T = { run: s => eval(s) };'); r.fulfill({ response: x, body: t }); });
    await c.addInitScript(s => { try { speechSynthesis.speak = u => setTimeout(() => u.onend && u.onend(), 5); } catch (e) {} if (localStorage.getItem('seeded')) return; localStorage.setItem('seeded', 1); localStorage.setItem('govorilki-v2', JSON.stringify(s)); }, seed);
    const p = await c.newPage(), errs = [], fail = [];
    p.on('pageerror', e => errs.push(e.message));
    const run = s => p.evaluate(s => window.__T.run(s), s);
    // the iPhone way: focus, pick a day (input + change fire while the calendar is open), the field must survive
    const pick = async (sel, v) => {
      await p.click(sel);
      await p.evaluate(([sel, v]) => { const el = document.querySelector(sel); el.__mark = 1; el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); }, [sel, v]);
      await p.waitForTimeout(300);
      return p.evaluate(sel => { const el = document.querySelector(sel); return { same: !!(el && el.__mark), focus: document.activeElement === el, val: el && el.value }; }, sel);
    };
    await p.goto(BASE + sub); await p.waitForTimeout(1500);
    // 1) the family form of an existing family
    await run('screenFamilyEdit(ROOT.curFam)'); await p.waitForTimeout(600);
    let r = await pick('#feKids .fe-bday', D1);
    if (!r.same) fail.push('family: field replaced'); if (!r.focus) fail.push('family: focus lost');
    const agen = await p.textContent('#feKids .fe-agen'); if (!/\d/.test(agen)) fail.push('family: no age shown');
    await p.screenshot({ path: `${__dirname}/shots/bday-${dev}-${lang}-family.png` });
    await p.click('#feSave'); await p.waitForTimeout(600);
    await p.reload(); await p.waitForTimeout(1500);
    let bd = await run("ROOT.profiles.k1.settings.bday"); if (bd !== D1) fail.push('family: not kept ' + bd);
    await run('screenFamilyEdit(ROOT.curFam)'); await p.waitForTimeout(600);
    if (await p.inputValue('#feKids .fe-bday') !== D1) fail.push('family: not shown after reload');
    // a plain age clears the date (so the date does not override it at the next start)
    await p.click('#feKids details.fe-agealt summary'); await p.click('#feKids [data-age="7"]'); await p.click('#feSave'); await p.waitForTimeout(600);
    if (await run("ROOT.profiles.k1.settings.bday || ''") !== '' || await run('ROOT.profiles.k1.settings.age') !== 7) fail.push('age alt');
    // 2) the first-start form (a new family, a new child)
    await run('screenFamilyEdit(null, { first: true })'); await p.waitForTimeout(600);
    await p.fill('#feKids .fe-name', 'Тина'); await p.click('#feKids [data-g="f"]');
    r = await pick('#feKids .fe-bday', D2); if (!r.same) fail.push('first: field replaced');
    await p.click('#feSave'); await p.waitForTimeout(800);
    const nk = await run("ROOT.families[ROOT.curFam].kids.map(id => ROOT.profiles[id].settings.bday).join()"); if (!nk.includes(D2)) fail.push('first: not saved ' + nk);
    // 3) the child's interests screen (the kid setup that follows a new child)
    if (!(await p.$('#ksBday'))) { await run('screenKidSetup(ROOT.cur)'); await p.waitForTimeout(600); }
    r = await pick('#ksBday', D1); if (!r.same) fail.push('setup: field replaced');
    await p.click('#ksNext'); await p.waitForTimeout(800);
    await p.reload(); await p.waitForTimeout(1500);
    const ks = await run("Object.values(ROOT.profiles).map(x => x.settings.bday).join()"); if (!ks.includes(D1)) fail.push('setup: not kept ' + ks);
    console.log(`${dev} ${lang}: ${fail.length ? 'FAIL ' + JSON.stringify(fail) : 'ok'} | errors ${JSON.stringify(errs)}`);
    if (fail.length || errs.length) bad++;
    await c.close();
  }
  await b.close(); console.log(bad ? `FAIL ${bad}` : 'OK'); process.exit(bad ? 1 : 0);
})();
