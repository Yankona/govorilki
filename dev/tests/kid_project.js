// The child's own «Проект недели»: ≥20 projects by age, a card on «Сегодня» and a tile in «Творим» and «Узнаём»,
// steps said by the friend, one swap a week, a diary project (a mark a day, «Готово!» after 4 days), a tally project,
// a photo that stays on the phone (never in the family data), «Готово!» → stars and the badge «Мастер дела», and one
// line in the grown-ups' «Отчёт». Invented children only (Тина 5, Тим 9).
// node tests/kid_project.js [base] [phone|laptop] [langs=ru,en,pt,de]     screenshots: tests/shots/kproj-<lang>-<dev>-*.png
const { chromium, devices } = require('playwright');
const fs = require('fs');
const BASE = process.argv[2] || 'http://localhost:8781/govorilki/', DEV = process.argv[3] || 'phone';
const ONLY = (process.argv[4] || 'ru,en,pt,de').split(',');
const HOOK = 'const fam = () => ROOT.families[ROOT.curFam] || null;';
const LANGS = { ru: 'ru/', en: '', pt: 'pt/', de: 'de/' };
const OUT = __dirname + '/shots'; fs.mkdirSync(OUT, { recursive: true });
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
const kid = (name, g, age, fr, lang, track) => ({ stars: 10, plays: {}, best: {}, days: {}, learn: {}, reads: [], medals: [], art: [], book: { title: 'Т', log: {} }, settings: { name, gender: g, track, age, friend: fr, onboarded: true, lang } });
const seedOf = lang => ({ engine: 'device', micOff: true, srOff: true, parentPhone: true, cur: 'k1', curFam: 'f1',
  families: { f1: { id: 'f1', name: 'Т', cc: 'PT', kids: ['k1', 'k2'], grands: [] } },
  profiles: { k1: kid('Тина', 'f', 5, 'kitty', lang, 'r'), k2: kid('Тим', 'm', 9, 'tiger', lang, 'l') } });
const ev = (p, s) => p.evaluate(s => window.__T.run(s), s);
(async () => {
  const b = await chromium.launch(); let fails = 0;
  for (const [lang, sub] of Object.entries(LANGS)) {
    if (!ONLY.includes(lang)) continue;
    const bad = [], shot = n => OUT + `/kproj-${lang}-${DEV}-${n}.png`;
    const c = await b.newContext(DEV === 'laptop' ? { viewport: { width: 1280, height: 800 } } : { ...devices['iPhone 13'] });
    await c.route(/ntfy|wikipedia|huggingface|jsdelivr|youtube|wikimedia|workers\.dev/, r => r.abort());
    await c.route(u => /\/(ru|de|pt|en)?\/?(index\.html)?$/.test(u.pathname), async r => { const x = await r.fetch(); let t = await x.text(); t = t.replace(HOOK, HOOK + ' window.__T = { run: s => eval(s) };'); r.fulfill({ response: x, body: t }); });
    await c.addInitScript(s => { window.__said = []; try { speechSynthesis.speak = u => { window.__said.push(u.text); setTimeout(() => u.onend && u.onend(), 5); }; } catch (e) {} window.alert = () => {}; window.confirm = () => true; window.prompt = () => null;
      if (localStorage.getItem('seeded')) return; localStorage.setItem('seeded', 1); localStorage.setItem('govorilki-v2', JSON.stringify(s)); }, seedOf(lang));
    const p = await c.newPage(), errs = [];
    p.on('pageerror', e => errs.push(e.message.slice(0, 160)));
    await p.goto(BASE + sub); await p.waitForTimeout(1300);
    // the bank: ≥20 projects, every age group has at least 5, every project 3–5 steps
    const bank = await ev(p, `(() => { const g = [[4, 5], [6, 8], [9, 12]].map(([a, z]) => KPROJ.filter(x => x[2] <= z && x[3] >= a).length);
      return { n: KPROJ.length, g, steps: KPROJ.every(x => x[5].length >= 3 && x[5].length <= 5) }; })()`);
    if (bank.n < 20 || bank.g.some(x => x < 5) || !bank.steps) bad.push('bank: ' + JSON.stringify(bank));
    // «Сегодня»: the card; the tiles in «Творим» and «Узнаём»
    await ev(p, `switchKid('k1'); P.homeTab = 'today'; HOME_POS = null; goHome()`); await p.waitForTimeout(500);
    if (!(await p.$('.kp-card'))) bad.push('no card on «Сегодня»');
    for (const t of ['create', 'discover']) { await ev(p, `P.homeTab = '${t}'; HOME_POS = null; goHome()`); await p.waitForTimeout(300); if (!(await p.$('#stage [data-id="kproj"]'))) bad.push('no tile in ' + t); }
    // Тина (5): her project fits her age; swap once
    const t0 = await ev(p, `(() => { const s = KPR.of(), x = KPR.byId(s.id); return { id: s.id, ok: 5 >= x[2] && 5 <= x[3] }; })()`);
    if (!t0.ok) bad.push('Тина: project not for her age: ' + t0.id);
    await ev(p, `P.homeTab = 'today'; HOME_POS = null; goHome()`); await p.waitForTimeout(300);
    await p.click('.kp-card'); await p.waitForTimeout(400);
    if (!(await p.$('.kp-step'))) bad.push('the project did not open');
    if (!(await p.evaluate(() => window.__said.length))) bad.push('the friend said nothing');
    await p.screenshot({ path: shot('5-step') });
    await p.click('#kpSwap'); await p.waitForTimeout(300);
    const t1 = await ev(p, `({ id: KPR.of().id, sw: KPR.of().sw })`);
    if (t1.id === t0.id || !t1.sw) bad.push('swap did not change the project');
    if (await p.$('#kpSwap')) bad.push('a second swap is offered');
    // a plain project to the end: «Готово!» → stars, the badge, the report line
    await ev(p, `P.kproj.id = 'tower'; save(); KPR.screen(0)`); await p.waitForTimeout(200);
    for (let i = 0; i < 4; i++) { await p.click('#kpNext'); await p.waitForTimeout(150); }
    if (!(await p.$('#kpDone:not([disabled])'))) bad.push('no «Готово!»');
    // a photo stays on the phone, not in the family data
    const cam = await p.$('#kpCam');
    if (!cam) bad.push('no photo button'); else { await cam.setInputFiles({ name: 'p.png', mimeType: 'image/png', buffer: PNG }); await p.waitForTimeout(800);
      const ph = await p.evaluate(() => { const o = JSON.parse(localStorage.getItem('govorilki-kproj-ph') || '{}'); return { n: Object.keys(o).length, inRoot: (localStorage.getItem('govorilki-v2') || '').includes('data:image') }; });
      if (ph.n !== 1 || ph.inRoot) bad.push('photo: ' + JSON.stringify(ph)); }
    const s0 = await ev(p, 'P.stars');
    await p.click('#kpDone'); await p.waitForTimeout(800);
    const fin = await ev(p, `({ st: P.stars, ach: (P.ach || []).includes('proj1'), pj: (P.guide.pj || {})[weekId()], win: GUIDE.wins(GUIDE.digest(P)).join(' | '), t: KPR.titleOf('tower') })`);
    if (fin.st <= s0) bad.push('no stars');
    if (!fin.ach) bad.push('no badge «Мастер дела»');
    if (fin.pj !== 'tower') bad.push('not marked done');
    if (!fin.win.includes(fin.t)) bad.push('the report does not mention the project: ' + fin.win);
    await p.screenshot({ path: shot('5-done') });
    await ev(p, `P.homeTab = 'today'; HOME_POS = null; goHome()`); await p.waitForTimeout(300);
    if (!(await p.$('.kp-card.done'))) bad.push('the card does not say done');
    // Тим (9): a diary project — «Готово!» after 4 marked days; a tally project counts
    await ev(p, `switchKid('k2'); KPR.of(); P.kproj.id = 'weather'; P.kproj.log = {}; save(); KPR.screen(4)`); await p.waitForTimeout(300);
    if (!(await p.$('#kpDone[disabled]'))) bad.push('diary: «Готово!» before 4 days');
    await p.click('[data-kday="0"]'); await p.waitForTimeout(200);
    if ((await ev(p, `P.kproj.log[dayKey()]`)) !== 0) bad.push('diary: today not marked');
    await ev(p, `(() => { const w = new Date(weekId()); for (let i = 1; i <= 6 && Object.keys(P.kproj.log).length < 4; i++) { const d = new Date(w); d.setDate(d.getDate() + i); const k = dayKey(d); if (k !== dayKey()) P.kproj.log[k] = 1; } save(); KPR.screen(4); })()`);
    await p.waitForTimeout(200);
    if (!(await p.$('#kpDone:not([disabled])'))) bad.push('diary: «Готово!» not open after 4 days');
    await p.screenshot({ path: shot('9-diary') });
    await ev(p, `P.kproj.id = 'birds'; P.kproj.tl = []; save(); KPR.screen(3)`); await p.waitForTimeout(200);
    for (let i = 0; i < 3; i++) { await p.click('[data-ktl="1"]'); await p.waitForTimeout(80); }
    if ((await ev(p, `P.kproj.tl[1]`)) !== 3) bad.push('tally: did not count');
    await p.screenshot({ path: shot('9-tally') });
    if (errs.length) bad.push('page errors: ' + [...new Set(errs)].join(' | '));
    await c.close();
    console.log(`${lang} ${DEV}: ${bank.n} projects (${bank.g.join('/')}), Тина ${t0.id}→${t1.id}${bad.length ? '\n  ' + bad.join('\n  ') : ' — ok'}`);
    if (bad.length) fails++;
  }
  await b.close(); console.log(fails ? `FAIL in ${fails} language(s)` : 'OK: the project of the week'); process.exit(fails ? 1 : 0);
})();
