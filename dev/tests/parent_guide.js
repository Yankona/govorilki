// «Гайд» for grown-ups: a card per child in «Для взрослых» (and from the family panel), the grandparents' phone shows
// the same card. Checks: a child with data (Тим, 9: maths level held 12 days, stories) and a 5-year-old (Тина: sounds
// Р and Ш) and a new child (Тоша: the empty state); the tip matches the child's focus; «Другой совет» changes it;
// «Сделали!» gives the badge; the answer of the latest story loads; no page errors. Invented family only.
// node tests/parent_guide.js [base] [phone|laptop] [langs=ru,en,pt,de]     screenshots: tests/shots/guide-<lang>-<dev>-*.png
const { chromium, devices } = require('playwright');
const fs = require('fs');
const BASE = process.argv[2] || 'http://localhost:8781/govorilki/', DEV = process.argv[3] || 'phone';
const ONLY = (process.argv[4] || 'ru,en,pt,de').split(',');
const HOOK = 'const fam = () => ROOT.families[ROOT.curFam] || null;';
const LANGS = { ru: 'ru/', en: '', pt: 'pt/', de: 'de/' };
const FAMCODE = 'tinafam0123456';
const OUT = __dirname + '/shots'; fs.mkdirSync(OUT, { recursive: true });
const day = n => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); };
const kid = (name, g, age, fr, lang, track, extra) => ({ stars: 40, plays: {}, best: {}, days: {}, learn: {}, reads: [], medals: [], art: [], book: { title: 'Т', log: {} }, ...extra,
  settings: { name, gender: g, track, age, friend: fr, onboarded: true, lang, ...(extra.set || {}) } });
const seedOf = lang => ({ engine: 'device', micOff: true, srOff: true, parentPhone: true, cur: 'k1', curFam: 'f1',
  families: { f1: { id: 'f1', name: 'Т', cc: 'PT', code: FAMCODE, kids: ['k1', 'k2', 'k3'], grands: [{ id: 'toma', name: 'бабушка Тома', she: true, role: 'gm' }] } },
  profiles: {
    k1: kid('Тина', 'f', 5, 'kitty', lang, 'r', { set: { sounds: ['r', 'sh'] }, days: { [day(0)]: { speech: 2 }, [day(1)]: { speech: 1, read: 1 }, [day(3)]: { speech: 1 } } }),
    k2: kid('Тим', 'm', 9, 'tiger', lang, 'l', { mskill: { lv: 5 }, olymp: { solved: ['a', 'b', 'c'], lv: 4 }, reads: [{ at: day(2), id: 'x', wpm: 55, sec: 60 }],
      days: { [day(0)]: { math: 1, read: 1 }, [day(2)]: { math: 1 }, [day(4)]: { soro: 1 } } }),
    k3: kid('Тоша', 'm', 6, 'tiger', lang, 'r', { stars: 0 }) } });
const ev = (p, s) => p.evaluate(s => window.__T.run(s), s);
(async () => {
  const b = await chromium.launch(); let fails = 0;
  const ctx = async (seed, sub, hash) => {
    const c = await b.newContext(DEV === 'laptop' ? { viewport: { width: 1280, height: 800 } } : { ...devices['iPhone 13'] });
    await c.route(/ntfy|wikipedia|huggingface|jsdelivr|youtube|wikimedia|workers\.dev/, r => r.abort());
    await c.route(u => /\/(ru|de|pt|en)?\/?(index\.html)?$/.test(u.pathname), async r => { const x = await r.fetch(); let t = await x.text(); t = t.replace(HOOK, HOOK + ' window.__T = { run: s => eval(s) };'); r.fulfill({ response: x, body: t }); });
    await c.addInitScript(s => { try { speechSynthesis.speak = u => setTimeout(() => u.onend && u.onend(), 5); } catch (e) {} window.alert = () => {}; window.confirm = () => true; window.prompt = () => null;
      if (localStorage.getItem('seeded')) return; localStorage.setItem('seeded', 1); if (s) localStorage.setItem('govorilki-v2', JSON.stringify(s)); }, seed);
    const p = await c.newPage(), errs = [];
    p.on('pageerror', e => errs.push(e.message.slice(0, 160)));
    await p.goto(BASE + sub + (hash || '')); await p.waitForTimeout(1300);
    return { c, p, errs };
  };
  for (const [lang, sub] of Object.entries(LANGS)) {
    if (!ONLY.includes(lang)) continue;
    const bad = [], shot = n => OUT + `/guide-${lang}-${DEV}-${n}.png`;
    let S = await ctx(seedOf(lang), sub);
    // the week of each child: Тим's maths level held for 12 days, two stories (the last one has a question); Тина: speech
    const story = await ev(S.p, `(() => { for (const k of Object.keys(LEARN)) { const it = (LEARN[k].items || []).find(x => x.q && x.px); if (it) return it.id; } return ''; })()`);
    if (!story) bad.push('no story with a question');
    await ev(S.p, `(() => { const w = weekId(), t = ROOT.profiles.k2, a = ROOT.profiles.k1;
      t.gw = { w, n: 9, ls: ['zz', ${JSON.stringify(story)}], a: { math: 6, world: 2, read: 1 }, s0: { m: 5, so: 2, ol: 1, oll: 4, w: 40, rl: 0 } };
      t.gs = { m: [5, '${day(12)}'] }; t.recent = [['История', 3, Date.now(), 'learn:${story}']];
      a.gw = { w, n: 6, ls: [], a: { speech: 5, read: 1 }, s0: { m: 0, so: 0, ol: 0, oll: 0, w: 0, rl: 0 } };
      save(); screenParents('guide'); })()`);
    await S.p.waitForTimeout(1500);
    const cards = await S.p.$$eval('#guideSec .gd-card', cs => cs.map(c => ({ id: c.dataset.gk, vis: c.offsetParent !== null, txt: c.innerText })));
    if (cards.length !== 3) bad.push(`cards: ${cards.length} (want 3)`);
    if (!cards.every(c => c.vis)) bad.push('a card is hidden');
    if (!(await S.p.$eval('.set-menu', m => m.classList.contains('set-off')).catch(() => false))) bad.push('the guide page did not open by itself');
    // the tip fits the focus: Тим (stuck in maths) → maths of his level; Тина → her sounds
    const fit = await ev(S.p, `(() => { const out = {};
      for (const id of ['k1', 'k2', 'k3']) { const d = GUIDE.digest(ROOT.profiles[id]), t = GUIDE.tip(d, id), shown = document.querySelector('.gd-card[data-gk="' + id + '"] .gd-tip p').textContent;
        out[id] = { area: t.area, ok: t.text === shown, inPool: GUIDE.pool(d, t.area).some(x => x[3] === t.text), areas: GUIDE.areas(d), weekTxt: GUIDE.weekLines(d, 'X').join(' | ') }; }
      return out; })()`);
    if (!fit.k2.ok || !fit.k2.inPool) bad.push('Тим: the tip shown is not the computed one');
    if (fit.k2.areas[0] !== 'math') bad.push(`Тим: focus ${fit.k2.areas.join(',')} (want math first: stuck)`);
    const tinaMath = await ev(S.p, `GUIDE.areas(GUIDE.digest(ROOT.profiles.k1))[0]`);
    if (tinaMath !== 'speech') bad.push(`Тина: focus ${tinaMath} (want speech)`);
    const tinaPool = await ev(S.p, `(() => { const d = GUIDE.digest(ROOT.profiles.k1); return GUIDE.pool(d, 'speech').every(x => ['r', 'sh'].includes(x[0])); })()`);
    if (!tinaPool) bad.push('Тина: speech tips are not for Р or Ш');
    const timMath = await ev(S.p, `GUIDE.pool(GUIDE.digest(ROOT.profiles.k2), 'math').every(x => 5 >= x[1] && 5 <= x[2])`);
    if (!timMath) bad.push('Тим: maths tips not of level 5');
    if (!/12/.test(fit.k2.weekTxt)) bad.push('Тим: the week does not say how long the level holds: ' + fit.k2.weekTxt);
    if (fit.k3.weekTxt.split(' | ').length !== 1) bad.push('Тоша: not the empty state: ' + fit.k3.weekTxt);
    // the story question and its answer from the pack
    const talk = await S.p.$eval('.gd-card[data-gk="k2"] .gd-talk', x => x.innerText).catch(() => '');
    const q = await ev(S.p, `(() => { for (const k of Object.keys(LEARN)) { const it = (LEARN[k].items || []).find(x => x.id === ${JSON.stringify(story)}); if (it) return it.q; } })()`);
    if (!talk.includes(q)) bad.push('Тим: no question of the latest story');
    await S.p.click('.gd-card[data-gk="k2"] .gd-ans summary').catch(() => bad.push('no answer fold'));
    await S.p.waitForTimeout(600);
    const ans = await S.p.$eval('.gd-card[data-gk="k2"] .gd-ans p', x => x.textContent).catch(() => '');
    if (!ans) bad.push('the answer of the story did not load');
    // another tip
    const t0 = await S.p.$eval('.gd-card[data-gk="k1"] .gd-tip p', x => x.textContent);
    await S.p.click('.gd-card[data-gk="k1"] [data-gnext]'); await S.p.waitForTimeout(200);
    const t1 = await S.p.$eval('.gd-card[data-gk="k1"] .gd-tip p', x => x.textContent);
    if (t0 === t1) bad.push('«Другой совет» did not change the tip');
    await S.p.screenshot({ path: shot('kids'), fullPage: false });
    const vp = S.p.viewportSize(); await S.p.setViewportSize({ width: vp.width, height: 3000 }); await S.p.waitForTimeout(200);
    await S.p.locator('.gd-card[data-gk="k2"]').screenshot({ path: shot('9') });
    await S.p.locator('.gd-card[data-gk="k1"]').screenshot({ path: shot('5') });
    await S.p.locator('.gd-card[data-gk="k3"]').screenshot({ path: shot('new') });
    await S.p.setViewportSize(vp);
    // «Сделали!» → the badge
    await S.p.click('.gd-card[data-gk="k1"] [data-gdid]');
    await S.p.waitForTimeout(300);
    if (!(await ev(S.p, `(ROOT.profiles.k1.ach || []).includes('proj1')`))) bad.push('«Сделали!» gave no badge');
    if (!(await S.p.$('.gd-card[data-gk="k1"] .gd-done'))) bad.push('the card does not say «Сделали»');
    if (await ev(S.p, `(ROOT.profiles.k2.ach || []).includes('proj1')`)) bad.push('the badge went to the wrong child');
    // the family panel → «🧭 Гайд» of a child
    await ev(S.p, 'screenPult()'); await S.p.waitForTimeout(300);
    const kg = await S.p.$('[data-kguide="k2"]');
    if (!kg) bad.push('no «Гайд» in the panel'); else { await kg.click(); await S.p.waitForTimeout(400);
      const first = await S.p.$eval('#guideSec .gd-card', x => x.dataset.gk).catch(() => ''); if (first !== 'k2') bad.push('panel → guide: not Тим first');
      const vis = await S.p.$eval('#guideSec', x => x.offsetParent !== null).catch(() => false); if (!vis) bad.push('panel → guide: hidden'); }
    // the grandmother's phone: the same card from the progress note
    const snap = await ev(S.p, `(() => { useFamily('f1'); return { at: Date.now(), kin: [], kids: progSnap().map(k => ({ ...k, gd: GUIDE.clean(k.gd) })) }; })()`);
    if (S.errs.length) bad.push('page errors: ' + [...new Set(S.errs)].join(' | '));
    await S.c.close();
    S = await ctx(null, sub, `#vhod=toma.${FAMCODE}&n=${encodeURIComponent('бабушка Тома')}&s=1&r=gm&k=${encodeURIComponent('k1~Тина~f')}`);
    await ev(S.p, `gStore(GPROG_KEY, ${JSON.stringify(snap)}); GUEST_OFF = false; screenGuest()`); await S.p.waitForTimeout(800);
    const g = await S.p.$$eval('#gGuide .gd-card', cs => cs.map(c => c.dataset.gk));
    if (g.length !== 3) bad.push(`grandmother: ${g.length} cards (want 3)`);
    if (await S.p.$('#gGuide [data-gdid]')) bad.push('grandmother: «Сделали!» should be on the child\'s phone only');
    const gdone = await S.p.$('#gGuide .gd-card[data-gk="k1"] .gd-done'); if (!gdone) bad.push('grandmother: the project is not shown as done');
    await S.p.click('[data-gt="gGuideH"]'); await S.p.waitForTimeout(700);
    const vg = S.p.viewportSize(); await S.p.setViewportSize({ width: vg.width, height: 3000 }); await S.p.waitForTimeout(200);
    await S.p.locator('#gGuide .gd-card').first().screenshot({ path: shot('grand') });
    if (S.errs.length) bad.push('grandmother page errors: ' + [...new Set(S.errs)].join(' | '));
    await S.c.close();
    console.log(`${lang} ${DEV}: Тим ${fit.k2.area}, Тина ${fit.k1.area}, Тоша ${fit.k3.area}${bad.length ? '\n  ' + bad.join('\n  ') : ' — ok'}`);
    if (bad.length) fails++;
  }
  await b.close(); console.log(fails ? `FAIL in ${fails} language(s)` : 'OK: the guide'); process.exit(fails ? 1 : 0);
})();
