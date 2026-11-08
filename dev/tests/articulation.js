// articulation («Как сказать?»): the animated teacher for every trained sound and the tongue exercises. Checks, for
// invented children (Тина 5, Тим 9): every sound has a moving mouth and side cut, «ещё раз» / «медленно» say the line,
// the parents' tip is there; «Как сказать?» opens from a sound game's bar and from a «Говорим» section; the exercises'
// side cut morphs; no page errors, no sideways scroll.
// node tests/articulation.js [base] [phone|laptop]   (needs tests/serve.sh; LANGS=ru,en to pick languages)
const { chromium, devices } = require('playwright');
const path = require('path');
const BASE = process.argv[2] || 'http://localhost:8781/govorilki/', DEV = process.argv[3] || 'phone';
const SHOTS = path.join(__dirname, 'shots', 'articulation'); require('fs').mkdirSync(SHOTS, { recursive: true });
const HOOK = 'const fam = () => ROOT.families[ROOT.curFam] || null;';
const LANGS = (process.env.LANGS || 'ru,en,pt,de').split(',');
const DIR = { ru: 'ru/', en: '', pt: 'pt/', de: 'de/' };
const kid = (name, g, age, fr, track, lang) => ({ stars: 12, plays: {}, learn: {}, book: { title: 'Т', log: {} }, settings: { name, gender: g, track, age, friend: fr, onboarded: true, lang } });
let bad = 0; const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) bad++; };
async function open(b, lang, who) {
  const seed = { engine: 'device', micOff: true, srOff: true, parentPhone: true, cur: who, curFam: 'f1',
    families: { f1: { id: 'f1', name: 'Т', cc: 'PT', kids: ['k1', 'k3'], grands: [] } },
    profiles: { k1: kid('Тина', 'f', 5, 'kitty', 'r', lang), k3: kid('Тим', 'm', 9, 'tiger', 'l', lang) } };
  const c = await b.newContext(DEV === 'laptop' ? { viewport: { width: 1280, height: 800 } } : { ...devices['iPhone 13'], deviceScaleFactor: 2 });
  await c.route(/ntfy|wikipedia|huggingface|jsdelivr|youtube|wikimedia|workers\.dev/, r => r.abort());
  await c.route(u => /\/(ru|de|pt|en)?\/?(index\.html)?$/.test(u.pathname), async r => { const x = await r.fetch(); let t = await x.text(); t = t.replace(HOOK, HOOK + ' window.__T = { run: s => eval(s) };'); r.fulfill({ response: x, body: t }); });
  await c.addInitScript(s => { window.__said = []; try { speechSynthesis.speak = u => { window.__said.push(u.text); setTimeout(() => u.onend && u.onend(), 5); }; } catch (e) {} if (localStorage.getItem('seeded')) return; localStorage.setItem('seeded', 1); localStorage.setItem('govorilki-v2', JSON.stringify(s)); }, seed);
  const p = await c.newPage(); p.errs = [];
  p.on('pageerror', e => p.errs.push(e.message));
  await p.goto(BASE + DIR[lang]); await p.waitForTimeout(1500);
  const w = await p.$$(`.who-kid`); if (w.length) { await w[who === 'k1' ? 0 : 1].click(); await p.waitForTimeout(900); }
  return p;
}
const run = (p, s) => p.evaluate(x => window.__T.run(x), s);
const said = p => p.evaluate(() => { const a = window.__said.join(' / '); window.__said.length = 0; return a; });
const wide = p => p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
(async () => {
  const b = await chromium.launch();
  for (const lang of LANGS) {
    const T = `[${lang} ${DEV}]`;
    const p = await open(b, lang, 'k1');
    // «Как ставить язык»: every sound
    await run(p, 'screenSounds()'); await p.waitForTimeout(800);
    const tabs = await p.$$eval('.how-tabs .snd-tab', a => a.map(x => x.textContent));
    ok(lang === 'ru' ? tabs.join(' ') === 'С З Ц Ш Ж Ч Щ Л Ль Р Рь' : tabs.length >= 5, `${T} «Как ставить язык»: ${tabs.length} sounds: ${tabs.join(' ')}`);
    for (let i = 0; i < tabs.length; i++) {
      await p.click(`.how-tabs .snd-tab >> nth=${i}`); await p.waitForTimeout(350);
      const r = await p.evaluate(() => ({ prof: document.querySelectorAll('.how-prof svg animate[attributeName="d"]').length, face: document.querySelectorAll('.how-face svg animate[attributeName="opacity"]').length, par: !!document.querySelector('.how-par li'), line: document.querySelector('.how-line').textContent }));
      const s = await said(p);
      ok(r.prof >= 2 && r.face >= 2 && r.par && s.length > 8, `${T} ${tabs[i]}: side cut moves (${r.prof} paths), mouth changes (${r.face}), parents' steps, says: ${s.slice(0, 70)}`);
      if (lang === 'ru' || i === 0) { await p.waitForTimeout(1100); await p.screenshot({ path: `${SHOTS}/${lang}-${DEV}-snd-${i}.png` }); }
    }
    ok(!(await wide(p)), `${T} no sideways scroll`);
    await p.click('#howSlow'); await p.waitForTimeout(200);
    ok(await p.evaluate(() => (document.querySelector('.how-prof animate[attributeName="d"]') || {}).getAttribute('dur') === '6400ms') && (await said(p)).length > 10, `${T} «Медленно»: twice as slow, says the line again`);
    await p.click('#howAgain'); await p.waitForTimeout(200);
    ok(await p.evaluate(() => document.querySelector('.how-prof animate[attributeName="d"]').getAttribute('dur') === '3200ms') && (await said(p)).length > 10, `${T} «Ещё раз»: the normal loop and the line again`);
    ok(await p.$('#camBtn'), `${T} the camera-mirror button is there`);
    // «Говорим»: the sections of sounds have «Как сказать?»
    await run(p, 'goHome()'); await p.waitForTimeout(600);
    await p.click('.tb[data-tab="speak"]'); await p.waitForTimeout(700);
    const secs = await p.$$eval('.how-sec', a => a.map(x => x.dataset.how));
    ok(secs.length >= 2, `${T} «Говорим»: «Как сказать?» on ${secs.length} sound sections (${secs.join(',')})`);
    await p.evaluate(() => document.querySelector('.how-sec').closest('section').scrollIntoView({ block: 'start' })); await p.waitForTimeout(300);
    if (lang === 'ru' || DEV === 'phone') await p.screenshot({ path: `${SHOTS}/${lang}-${DEV}-speak.png` });
    await p.click('.how-sec >> nth=0'); await p.waitForTimeout(900);
    ok(await p.$('.how-ov .how-prof svg animate'), `${T} the section's button opens the teacher`);
    await p.screenshot({ path: `${SHOTS}/${lang}-${DEV}-overlay.png` });
    await p.click('.how-x'); await p.waitForTimeout(300);
    ok(!(await p.$('.how-ov')), `${T} ✕ closes it`);
    // a sound game: the bar has «Как сказать?», home forgets it
    await run(p, "GAMES.find(g => g.id === 'house').go()"); await p.waitForTimeout(900);
    ok(await p.$('.bar #howBtn'), `${T} «Где живёт звук Р»: «Как сказать?» in the bar`);
    if (DEV === 'phone') await p.screenshot({ path: `${SHOTS}/${lang}-${DEV}-game.png` });
    await p.click('#howBtn'); await p.waitForTimeout(700);
    const L0 = await p.$$eval('.how-ov .snd-tab', a => a.map(x => x.textContent).join(' '));
    ok(await p.$('.how-ov .how-prof svg') && (lang !== 'ru' || L0 === 'Р Рь'), `${T} it opens the sound of the game: ${L0 || '(one sound)'}`);
    await p.click('.how-x'); await p.waitForTimeout(200);
    await run(p, "GAMES.find(g => g.id === 'math-count').go()"); await p.waitForTimeout(700);
    ok(!(await p.$('#howBtn')), `${T} a maths game has no «Как сказать?»`);
    // the exercises: the side cut morphs with the face
    await run(p, 'screenArtic(0)'); await p.waitForTimeout(2600);
    ok(await p.$('#scheme svg animate[attributeName="d"]'), `${T} exercise: the side cut slides into the next pose`);
    if (lang === 'ru') {
      await run(p, "screenArtic(AL().findIndex(a => a.id === 'sh-cup'))"); await p.waitForTimeout(1200);
      await p.screenshot({ path: `${SHOTS}/${lang}-${DEV}-cup.png` });
    }
    ok(!p.errs.length, `${T} no page errors ${p.errs.join(' | ')}`);
    await p.context().close();
  }
  await b.close();
  console.log(bad ? `${bad} FAILED` : 'all ok'); process.exit(bad ? 1 : 0);
})();
