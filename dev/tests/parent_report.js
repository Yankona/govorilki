// «Отчёт» for grown-ups: a card per child in «Для взрослых» (and from the family panel); the grandparents' phone shows
// the same card. Checks: a 9-year-old with data (Тим: maths level held 12 days → «Пока трудно», olympiad and reading up →
// «Получается», last week kept), a 5-year-old (Тина: a three-star game, a one-star game twice) and a new child (Тоша: the
// empty state); no buttons that ask the adult to do things; the idea is folded; the weekly report has ↑ and = per area and
// can be shared; «Мастер дела» shows only for a child who has it; no page errors. Invented family only.
// node tests/parent_report.js [base] [phone|laptop] [langs=ru,en,pt,de]     screenshots: tests/shots/report-<lang>-<dev>-*.png
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
    k1: kid('Тина', 'f', 5, 'kitty', lang, 'r', { ach: ['proj1'], guide: { pj: { '2026-01-05': 'bean' } }, set: { sounds: ['r', 'sh'] }, days: { [day(0)]: { speech: 2 }, [day(1)]: { speech: 1, read: 1 }, [day(3)]: { speech: 1 } } }),
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
    await c.addInitScript(s => { try { speechSynthesis.speak = u => setTimeout(() => u.onend && u.onend(), 5); } catch (e) {} window.__shared = ''; try { Object.defineProperty(navigator, 'share', { value: async o => { window.__shared = o.text; }, configurable: true }); } catch (e) {} window.alert = () => {}; window.confirm = () => true; window.prompt = () => null;
      if (localStorage.getItem('seeded')) return; localStorage.setItem('seeded', 1); if (s) localStorage.setItem('govorilki-v2', JSON.stringify(s)); }, seed);
    const p = await c.newPage(), errs = [];
    p.on('pageerror', e => errs.push(e.message.slice(0, 160)));
    await p.goto(BASE + sub + (hash || '')); await p.waitForTimeout(1300);
    return { c, p, errs };
  };
  for (const [lang, sub] of Object.entries(LANGS)) {
    if (!ONLY.includes(lang)) continue;
    const bad = [], shot = n => OUT + `/report-${lang}-${DEV}-${n}.png`;
    let S = await ctx(seedOf(lang), sub);
    // the week: Тим's maths level held for 12 days, olympiad +2, reading 40 → 55, a three-star abacus; last week kept.
    // Тина: a three-star sound game, «Азбука» on one star twice
    const story = await ev(S.p, `(() => { for (const k of Object.keys(LEARN)) { const it = (LEARN[k].items || []).find(x => x.q); if (it) return it.id; } return ''; })()`);
    await ev(S.p, `(() => { const w = weekId(), pw = (() => { const d = new Date(w); d.setDate(d.getDate() - 7); return dayKey(d); })(), t = ROOT.profiles.k2, a = ROOT.profiles.k1;
      t.gw = { w, n: 9, min: 35, ls: ['zz', ${JSON.stringify(story)}], a: { math: 6, world: 2, read: 1, logic: 2 }, b: { soroban: [3, 0] }, s0: { m: 5, so: 2, ol: 1, oll: 4, w: 40, rl: 0, cs: 0, ai: 0 } };
      t.gwLast = { w: pw, n: 12, min: 50, ls: ['a1'], a: { math: 8, chess: 3 }, b: {}, s0: { m: 4, so: 1, ol: 0, oll: 4, w: 30, rl: 0, cs: 0, ai: 0 }, end: { m: 5, so: 2, ol: 1, oll: 4, w: 40, rl: 0, cs: 2, ai: 0 } };
      t.gs = { m: [5, '${day(12)}'] };
      a.gw = { w, n: 6, min: 20, ls: [], a: { speech: 5, read: 2 }, b: { 'snd-hold': [3, 0], abc: [1, 2] }, s0: { m: 0, so: 0, ol: 0, oll: 0, w: 0, rl: 0, cs: 0, ai: 0 } };
      save(); screenParents('guide'); })()`);
    await S.p.waitForTimeout(800);
    const cards = await S.p.$$eval('#guideSec .gd-card', cs => cs.map(c => ({ id: c.dataset.gk, vis: c.offsetParent !== null, txt: c.innerText,
      btns: [...c.querySelectorAll('button')].filter(b => !b.matches('[data-gshare]')).length, idea: c.querySelector('.gd-idea') && c.querySelector('.gd-idea').open,
      ok: c.querySelectorAll('.gd-ok p').length, hard: c.querySelectorAll('.gd-hard p').length, sum: (c.querySelector('.gd-wkr summary') || {}).textContent || '',
      rows: [...c.querySelectorAll('.gd-rows p')].map(p => p.textContent.replace(/\s+/g, ' ')) })));
    const C = id => cards.find(c => c.id === id) || {};
    if (cards.length !== 3) bad.push(`cards: ${cards.length} (want 3)`);
    if (!cards.every(c => c.vis)) bad.push('a card is hidden');
    if (cards.some(c => c.btns)) bad.push('a card has buttons that ask the adult to do things');
    if (cards.some(c => c.idea)) bad.push('the idea is not folded');
    if (!(await S.p.$eval('.set-menu', m => m.classList.contains('set-off')).catch(() => false))) bad.push('the report page did not open by itself');
    const tim = C('k2'), tina = C('k1'), tosha = C('k3');
    if (tim.ok < 2 || tim.ok > 4) bad.push(`Тим: ${tim.ok} wins (want 2–4)`);
    if (tim.hard < 1 || !/12/.test(tim.txt)) bad.push('Тим: no «Пока трудно» with the 12 days');
    if (!/35/.test(tim.txt)) bad.push('Тим: no minutes in the activity line');
    if (tina.ok < 1 || tina.hard !== 1) bad.push(`Тина: wins ${tina.ok}, hard ${tina.hard} (want ≥1 and 1)`);
    if (tosha.ok || tosha.hard || !/🌱/.test(tosha.txt)) bad.push('Тоша: not the empty state');
    // the weekly report: this week on Sunday, else the last full week (Тим has one)
    const sunday = new Date().getDay() === 0;
    const timRows = sunday ? tim.rows : await ev(S.p, `GUIDE.rows(GUIDE.digest(ROOT.profiles.k2).last).map(r => r.a.k + (r.up ? '↑' : '='))`);
    if (sunday ? !tim.rows.some(r => r.includes('↑')) : !(timRows.includes('math↑') && timRows.includes('chess↑'))) bad.push('Тим: weekly rows wrong: ' + JSON.stringify(timRows));
    if (!tim.rows.length || !tim.rows.every(r => /[↑=]/.test(r))) bad.push('Тим: rows without arrows: ' + JSON.stringify(tim.rows));
    const nowRows = await ev(S.p, `GUIDE.rows(GUIDE.digest(ROOT.profiles.k2)).map(r => r.a.k + (r.up ? '↑' : '='))`);
    if (!(nowRows.includes('math=') && nowRows.includes('logic↑') && nowRows.includes('read↑'))) bad.push('Тим: this week rows wrong: ' + JSON.stringify(nowRows));
    // share: the text of the report
    await S.p.click('.gd-card[data-gk="k2"] .gd-wkr summary').catch(() => {});
    if (!(await S.p.$eval('.gd-card[data-gk="k2"] .gd-wkr', x => x.open))) await S.p.click('.gd-card[data-gk="k2"] .gd-wkr summary');
    await S.p.click('.gd-card[data-gk="k2"] [data-gshare]'); await S.p.waitForTimeout(300);
    const shared = await S.p.evaluate(() => window.__shared);
    if (!/Тим/.test(shared) || !/[↑=]/.test(shared)) bad.push('share: no report text: ' + shared.slice(0, 80));
    // screenshots: the week report open, the idea folded
    const vp = S.p.viewportSize(); await S.p.setViewportSize({ width: vp.width, height: 3000 }); await S.p.waitForTimeout(200);
    await S.p.$$eval('.gd-wkr', ds => ds.forEach(d => { d.open = true; }));
    await S.p.locator('.gd-card[data-gk="k2"]').screenshot({ path: shot('9') });
    await S.p.locator('.gd-card[data-gk="k1"]').screenshot({ path: shot('5') });
    await S.p.locator('.gd-card[data-gk="k3"]').screenshot({ path: shot('new') });
    await S.p.setViewportSize(vp);
    // «Мастер дела»: Тина has it and sees it; Тоша sees no locked one
    const achOf = async id => { await ev(S.p, `switchKid(${JSON.stringify(id)}); screenProfile()`); await S.p.waitForTimeout(300); return S.p.$$eval('.ach .ac span', s => s.map(x => x.textContent)); };
    if (!(await achOf('k1')).includes('🛠️')) bad.push('Тина: «Мастер дела» is gone');
    const t3 = await achOf('k3'); if (t3.includes('🛠️') || t3.includes('🏗️')) bad.push('Тоша: a project badge is shown');
    // the family panel → «📊 Отчёт» of a child
    await ev(S.p, 'screenPult()'); await S.p.waitForTimeout(300);
    const kg = await S.p.$('[data-kguide="k2"]');
    if (!kg) bad.push('no «Отчёт» in the panel'); else { await kg.click(); await S.p.waitForTimeout(400);
      const first = await S.p.$eval('#guideSec .gd-card', x => x.dataset.gk).catch(() => ''); if (first !== 'k2') bad.push('panel → report: not Тим first');
      const vis = await S.p.$eval('#guideSec', x => x.offsetParent !== null).catch(() => false); if (!vis) bad.push('panel → report: hidden'); }
    // the grandmother's phone: the same card from the progress note
    const snap = await ev(S.p, `(() => { useFamily('f1'); return { at: Date.now(), kin: [], kids: progSnap().map(k => ({ ...k, gd: GUIDE.clean(k.gd) })) }; })()`);
    if (S.errs.length) bad.push('page errors: ' + [...new Set(S.errs)].join(' | '));
    await S.c.close();
    S = await ctx(null, sub, `#vhod=toma.${FAMCODE}&n=${encodeURIComponent('бабушка Тома')}&s=1&r=gm&k=${encodeURIComponent('k1~Тина~f')}`);
    await ev(S.p, `gStore(GPROG_KEY, ${JSON.stringify(snap)}); GUEST_OFF = false; screenGuest()`); await S.p.waitForTimeout(800);
    const g = await S.p.$$eval('#gGuide .gd-card', cs => cs.map(c => ({ id: c.dataset.gk, ok: c.querySelectorAll('.gd-ok p').length, hard: c.querySelectorAll('.gd-hard p').length })));
    if (g.length !== 3) bad.push(`grandmother: ${g.length} cards (want 3)`);
    const gt = g.find(x => x.id === 'k2') || {}; if (gt.ok !== tim.ok || gt.hard !== tim.hard) bad.push('grandmother: Тим\'s card differs');
    await S.p.click('[data-gt="gGuideH"]'); await S.p.waitForTimeout(700);
    const vg = S.p.viewportSize(); await S.p.setViewportSize({ width: vg.width, height: 3000 }); await S.p.waitForTimeout(200);
    await S.p.locator('#gGuide .gd-card').first().screenshot({ path: shot('grand') });
    if (S.errs.length) bad.push('grandmother page errors: ' + [...new Set(S.errs)].join(' | '));
    await S.c.close();
    console.log(`${lang} ${DEV}: Тим ${tim.ok}/${tim.hard}, Тина ${tina.ok}/${tina.hard}, Тоша empty${bad.length ? '\n  ' + bad.join('\n  ') : ' — ok'}`);
    if (bad.length) fails++;
  }
  await b.close(); console.log(fails ? `FAIL in ${fails} language(s)` : 'OK: the report'); process.exit(fails ? 1 : 0);
})();
