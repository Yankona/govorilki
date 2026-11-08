// Chess by skill, not by age (task chess-skill). Needs tests/serve.sh. Invented children only: Тим (10), Тина (5).
// 1) every task of «Шахматная школа» is solvable (a search over the board engine);
// 2) Тим, 10, opens chess for the first time, picks «Совсем новичок» → the school, first lesson «Доска»; plays the rook lesson by taps;
// 3) Тина, 5 (younger track), sees the chess section, picks «Играю хорошо» → the mate puzzles;
// 4) the choice survives a reload and changes from the school. Phone and laptop, ru/en/pt/de; page errors fail.
// node tests/chess_skill.js [base] [phone|laptop]
const { chromium, devices } = require('playwright');
const path = require('path');
const BASE = process.argv[2] || 'http://localhost:8781/govorilki/', DEV = process.argv[3] || 'phone';
const SHOTS = path.join(__dirname, 'shots');
const HOOK = 'const fam = () => ROOT.families[ROOT.curFam] || null;';
const LANGS = process.env.LANG1 ? { ru: 'ru/' } : { ru: 'ru/', en: '', pt: 'pt/', de: 'de/' };
const kid = (name, g, age, tr, fr, lang) => ({ stars: 5, plays: {}, learn: {}, book: { title: 'Т', log: {} }, settings: { name, gender: g, track: tr, age, friend: fr, onboarded: true, lang } });
const SOLVE = `(() => {
  const bad = [];
  CHS.LESSONS.forEach(L => L.tasks.forEach((z, k) => {
    const pos = fenBoard(z.fen), st = b => ({ b, w: true, c: '', ep: -1 }), id = L.id + '#' + (k + 1);
    if (z.k === 'tap') { if (!(z.st || []).length) bad.push(id); return; }
    const legal = ['escape', 'mate'].includes(z.k), mv = b => (legal ? chLegal(st(b)) : chPseudo(st(b))).filter(m => !m.pr || m.pr === 'q');
    if (z.k === 'check' || z.k === 'escape' || z.k === 'mate') {
      if (z.k === 'escape' && !chInCheck(st(pos))) bad.push(id + ' not in check');
      const ok = mv(pos).some(m => { const a = { b: chApply(st(pos), m).b, w: false, c: '', ep: -1 }; return z.k === 'check' ? chInCheck(a) : z.k === 'escape' ? true : chStatus(a).mate; });
      if (!ok) bad.push(id); return;
    }
    const stars = (z.st || []).map(sqIdx), goal = b => !b.some(q => q && !isW(q));
    const seen = new Set(), q = [[pos, 0]], full = (1 << stars.length) - 1; let found = false;
    while (q.length && !found) { const [b, m0] = q.shift(); const key = b.join(',') + '|' + m0; if (seen.has(key)) continue; seen.add(key); if (seen.size > 40000) break;
      for (const m of mv(b)) { const nb = chApply(st(b), m).b; let msk = m0; stars.forEach((s, j) => { if (m.t === s) msk |= 1 << j; });
        if ((z.k === 'go' && msk === full) || (z.k === 'eat' && goal(nb))) { found = true; break; } q.push([nb, msk]); } }
    if (!found) bad.push(id);
  }));
  return bad;
})()`;
(async () => {
  const b = await chromium.launch(); let fail = 0;
  for (const [lang, sub] of Object.entries(LANGS)) {
    const seed = { engine: 'device', micOff: true, srOff: true, parentPhone: true, cur: 'k1', curFam: 'f1',
      families: { f1: { id: 'f1', name: 'Т', cc: 'PT', kids: ['k1', 'k2'], grands: [] } },
      profiles: { k1: kid('Тим', 'm', 10, 'l', 'tiger', lang), k2: kid('Тина', 'f', 5, 'r', 'kitty', lang) } };
    const c = await b.newContext(DEV === 'laptop' ? { viewport: { width: 1280, height: 800 } } : { ...devices['iPhone 13'], deviceScaleFactor: 1 });
    await c.route(/ntfy|wikipedia|huggingface|jsdelivr|youtube|wikimedia|workers\.dev/, r => r.abort());
    await c.route(u => /\/(ru|de|pt|en)?\/?(index\.html)?$/.test(u.pathname), async r => { const x = await r.fetch(); let t = await x.text(); t = t.replace(HOOK, HOOK + ' window.__T = { run: s => eval(s) };'); r.fulfill({ response: x, body: t }); });
    await c.addInitScript(s => { try { speechSynthesis.speak = u => setTimeout(() => u.onend && u.onend(), 5); } catch (e) {} if (localStorage.getItem('seeded')) return; localStorage.setItem('seeded', 1); localStorage.setItem('govorilki-v2', JSON.stringify(s)); }, seed);
    const p = await c.newPage(), errs = [], miss = [];
    p.on('pageerror', e => errs.push(e.message));
    const run = s => p.evaluate(x => window.__T.run(x), s);
    const shot = n => p.screenshot({ path: `${SHOTS}/chess-${lang}-${DEV}-${n}.png` });
    const tap = async sq => { await p.click(`.sq[aria-label="${sq}"]`); await p.waitForTimeout(250); };
    await p.goto(BASE + sub); await p.waitForTimeout(1500);
    if (lang === 'ru') { const bad = await run(SOLVE); if (bad.length) miss.push('unsolvable ' + bad.join(' ')); }
    // Тим, 10: «Учимся» has the school tile; the first chess entry asks → «новичок» → the school
    await run("ROOT.cur = 'k1'; P = ROOT.profiles.k1; goHome()"); await p.waitForTimeout(800); await p.click('[data-tab="learn"]'); await p.waitForTimeout(800);
    if (!(await p.$('.tile[data-id="chess-school"]'))) miss.push('school tile (10)');
    await run("GAMES.find(x => x.id === 'chess-ai').go()"); await p.waitForTimeout(600);
    if ((await p.$$('.cs-lv')).length !== 3) miss.push('question');
    await shot('1-ask');
    await p.click('.cs-lv[data-lv="new"]'); await p.waitForTimeout(600);
    if (!(await p.$('.cs-ls.now[data-i="0"]'))) miss.push('beginner starts at lesson 1');
    await shot('2-school-new');
    // the rook lesson by taps: three tasks
    await p.click('.cs-ls[data-i="2"]'); await p.waitForTimeout(500);
    await shot('3-rook');
    const at = sq => p.waitForSelector(`.sq[aria-label="${sq}"] .pc`, { timeout: 8000 });
    await tap('d4'); await shot('3b-rook-dots'); await tap('d8');
    await at('a1'); for (const s of ['a1', 'a8', 'a8', 'h8', 'h8', 'h1']) await tap(s);
    await at('c2'); await tap('c2'); await tap('e5');
    if (!(await p.textContent('#chN'))) miss.push('wrong-move note');
    await shot('3c-wrong');
    for (const s of ['c7', 'c7', 'f7', 'f7', 'f2']) await tap(s);
    await p.waitForSelector('.screen:not(:has(#chB))', { timeout: 8000 }).catch(() => {}); await p.waitForTimeout(800);
    if (!(await run('!!(P.chessSchool && P.chessSchool.done.rook)'))) miss.push('rook lesson done');
    await shot('4-rook-done');
    // a mate lesson: a wrong try (a check that is not mate), then the mate
    await run('CHS.lesson(11)'); await p.waitForTimeout(400); await tap('a1'); await tap('a7'); await p.waitForTimeout(300);
    await shot('5-mate-try'); await p.waitForTimeout(1200); await tap('a1'); await tap('a8'); await p.waitForTimeout(300);
    await shot('5b-mate');
    // Тина, 5, younger track: chess section visible, picks «играю хорошо» → puzzles
    await p.waitForTimeout(1500);
    await run("ROOT.cur = 'k2'; P = ROOT.profiles.k2; goHome()"); await p.waitForTimeout(800); await p.click('[data-tab="learn"]'); await p.waitForTimeout(800);
    if (!(await p.$('.tile[data-id="chess"]'))) miss.push('chess tile (5)');
    else { await p.$eval('#sec8', e => e.scrollIntoView()); await shot('6-home-5'); }
    await run("GAMES.find(x => x.id === 'chess').go()"); await p.waitForTimeout(600);
    await p.click('.cs-lv[data-lv="pro"]'); await p.waitForTimeout(800);
    if (!(await p.$('.ch-modes'))) miss.push('pro goes to puzzles');
    await shot('7-pro-puzzles');
    // persists after reload; a strong player's tiles: puzzles first, no second question
    await p.reload(); await p.waitForTimeout(1500);
    const lvs = await run('[ROOT.profiles.k1.chessLv, ROOT.profiles.k2.chessLv].join()'); if (lvs !== 'new,pro') miss.push('persist ' + lvs);
    await run("ROOT.cur = 'k2'; P = ROOT.profiles.k2; goHome()"); await p.waitForTimeout(800); await p.click('[data-tab="learn"]'); await p.waitForTimeout(800);
    const order = await p.$$eval('#sec8 .tile', t => t.map(x => x.dataset.id)); if (!order.length || order[0] === 'chess-school') miss.push('pro order ' + order);
    await run("GAMES.find(x => x.id === 'chess').go()"); await p.waitForTimeout(500);
    if (!(await p.$('.ch-modes'))) miss.push('no second question');
    // change the level from the school
    await run('CHS.school()'); await p.waitForTimeout(500); await shot('8-school-pro');
    await p.click('#csMe'); await p.waitForTimeout(400); await p.click('.cs-lv[data-lv="mid"]'); await p.waitForTimeout(500);
    if (!(await p.$(`.cs-ls.now[data-i="${await run('CHS.MID')}"]`))) miss.push('mid starts at capture');
    await shot('9-school-mid');
    // the parents' panel row
    await run('screenParents()'); await p.waitForTimeout(800);
    if (!(await p.$('#csLvIn'))) miss.push('parents row');
    else { await p.$eval('#csLvIn', e => e.scrollIntoView({ block: 'center' })); await shot('10-parents'); }
    console.log(`${lang} ${DEV}: missing ${JSON.stringify(miss)} | errors ${JSON.stringify(errs)}`);
    if (errs.length || miss.length) fail++;
    await c.close();
  }
  await b.close(); console.log(fail ? `FAIL in ${fail}` : 'OK'); process.exit(fail ? 1 : 0);
})();
