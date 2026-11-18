// The child's wishes (wishes): free wishes to the friend in four languages map to the game's content; a wished door is
// promised for tomorrow and comes (without breaking «обязательно» or the no-repeat rule); «больше» makes a door come
// more often; «трудно» moves tomorrow one step easier; «скучно» finds something new; a wish the game cannot meet goes
// to the grown-ups' «Хочу в игру» (names taken out, nothing sent) and leaves only on their tap; after the chest the
// friend asks about tomorrow; the jar shows wishes come true. Invented children only (Тина 5, Тоша 9).
// node tests/wishes.js [base=http://localhost:8781/govorilki/] [phone|laptop] [langs=ru,en,pt,de]
const { chromium, devices } = require('playwright');
const path = require('path');
const BASE = process.argv[2] || 'http://localhost:8781/govorilki/', DEV = process.argv[3] || 'phone';
const LANGS = (process.argv[4] || 'ru,en,pt,de').split(',');
const SHOTS = path.join(__dirname, 'shots');
const HOOK = 'const fam = () => ROOT.families[ROOT.curFam] || null;';
const SUB = { ru: 'ru/', en: '', pt: 'pt/', de: 'de/' };
const SAY = {
  ru: { shark: 'хочу про акул', more: 'давай больше шахмат', hard: 'слишком трудно', bored: 'мне скучно', odd: 'хочу играть в прятки с Тоша' },
  en: { shark: 'I want sharks', more: 'more chess please', hard: 'this is too hard', bored: "I'm bored", odd: 'I want to play hide and seek with Тоша' },
  pt: { shark: 'quero tubarões', more: 'mais xadrez', hard: 'é muito difícil', bored: 'estou aborrecido', odd: 'quero jogar às escondidas com Тоша' },
  de: { shark: 'ich will Haie', more: 'mehr Schach bitte', hard: 'das ist zu schwer', bored: 'mir ist langweilig', odd: 'ich will Verstecken spielen mit Тоша' }
};
const kid = (name, g, age, fr, lang, track, likes) => ({ stars: 12, plays: {}, learn: {}, days: {}, book: { title: 'Т', log: {} }, settings: { name, gender: g, track, age, friend: fr, onboarded: true, lang, likes } });
let bad = 0;
(async () => {
  const b = await chromium.launch();
  for (const lang of LANGS) {
    const seed = { engine: 'device', micOff: true, srOff: true, parentPhone: true, cur: 'k2', curFam: 'f1',
      families: { f1: { id: 'f1', name: 'Т', cc: 'PT', kids: ['k1', 'k2'], grands: [] } },
      profiles: { k1: kid('Тина', 'f', 5, 'kitty', lang, 'r', ['draw']), k2: kid('Тоша', 'm', 9, 'tiger', lang, 'l', ['space']) } };
    const c = await b.newContext(DEV === 'laptop' ? { viewport: { width: 1280, height: 800 } } : { ...devices['iPhone 13'], deviceScaleFactor: 1 });
    await c.route(/ntfy|wikipedia|huggingface|jsdelivr|youtube|wikimedia|workers\.dev/, r => r.abort());
    await c.route(u => /\/(ru|de|pt|en)?\/?(index\.html)?$|\/app\.[0-9a-f]+\.js$/.test(u.pathname), async r => { const x = await r.fetch(); let t = await x.text(); t = t.replace(HOOK, HOOK + ' window.__T = { run: s => eval(s) };'); r.fulfill({ response: x, body: t }); });
    await c.addInitScript(s => { try { speechSynthesis.speak = u => setTimeout(() => u.onend && u.onend(), 5); } catch (e) {} if (localStorage.getItem('seeded')) return; localStorage.setItem('seeded', 1); localStorage.setItem('govorilki-v2', JSON.stringify(s)); }, seed);
    const p = await c.newPage(), errs = [], miss = [];
    p.on('pageerror', e => errs.push(e.message));
    const ok = (cond, m) => { if (!cond) miss.push(m); };
    const run = s => p.evaluate(x => window.__T.run(x), s);
    const home = async () => { await run('goHome()'); await p.waitForTimeout(600); };
    const S = SAY[lang];
    await p.goto(BASE + SUB[lang]); await p.waitForTimeout(1500);
    const who = await p.$$('.who-kid'); if (who.length) { await who[0].click(); await p.waitForTimeout(900); }
    await run(`switchKid('k2')`); await p.waitForTimeout(700); await home();
    const ans = t => run(`TALK.answer(${JSON.stringify(t)}).say`);
    // sharks: a story or the nature door, promised or open
    let r = await ans(S.shark), w = await run('P.wishes[0] || {}');
    ok(w.area && ['story', 'topic'].includes(w.kind), `shark → ${JSON.stringify(w)} «${r}»`);
    const sharkArea = w.area;
    ok(await run(`SIMPLE.today().some(a => a.id === '${sharkArea}') || (P.wantDoor && P.wantDoor.area === '${sharkArea}')`), `shark: no door today and none promised`);
    // more chess: the chess door comes more often
    r = await ans(S.more); ok(await run(`SIMPLE.likes().includes('chess')`), `more chess → «${r}»`);
    // too hard: tomorrow one step easier
    r = await ans(S.hard); ok(await run(`P.nudge && P.nudge.v === -1 && P.nudge.d > dayKey()`), `too hard → «${r}»`);
    // bored: something new (after the path) or what opens after the path
    r = await ans(S.bored); ok(r && (await run('P.wishes[0].kind')) === 'bored', `bored → «${r}»`);
    // a wish the game cannot meet: the grown-ups' list, the name taken out, nothing sent
    r = await ans(S.odd);
    const o = await run('P.wishOut || []');
    ok(o.length === 1 && !o[0].t.includes('Тоша'), `unmatched → ${JSON.stringify(o)} «${r}»`);
    ok((await run('(ROOT.lettersOut || []).length + (ROOT.lettersSent || []).length')) === 0, 'something was sent by itself');
    // the text field of the friend works for wishes too
    await p.click('#tkFab'); await p.waitForTimeout(300); await p.fill('#tkIn', S.more); await p.press('#tkIn', 'Enter'); await p.waitForTimeout(500);
    ok((await p.$eval('#tkSay', el => el.textContent)).length > 3, 'typed wish: no answer');
    await p.screenshot({ path: `${SHOTS}/wish-${lang}-${DEV}-talk.png` });
    await p.click('#tkX'); await p.waitForTimeout(200);
    // after the chest: tomorrow's door and difficulty
    await run(`P.days[dayKey()] = Object.fromEntries(SIMPLE.must().map(id => [id, 1])); P.chest = dayKey(); delete P.planDay; save()`); await home();
    ok(!!(await p.$('#wiPlan [data-wa]')), 'no «what tomorrow» after the chest');
    await p.$eval('#wiPlan', el => el.scrollIntoView()).catch(() => {});
    await p.screenshot({ path: `${SHOTS}/wish-${lang}-${DEV}-plan.png` });
    const pick = await p.$eval('#wiPlan [data-wa]', el => el.dataset.wa).catch(() => '');
    ok(!(await run(`SIMPLE.today().some(a => a.id === '${pick}')`)), 'tomorrow choice is a door of today');
    if (pick) { await p.click('#wiPlan [data-wa]'); await p.waitForTimeout(400); await p.click('#wiPlan [data-wd="1"]'); await p.waitForTimeout(300); }
    ok(await run(`P.wantDoor && P.wantDoor.area === '${pick}' && P.nudge.v === 1`), 'tomorrow plan not kept');
    // tomorrow (simulated): the chosen door is there, the path and its order untouched, no door of yesterday
    const must0 = await run('JSON.stringify(SIMPLE.must())'), y = await run('P.doorsToday.ids');
    await run(`P.wantDoor.d = '2000-01-01'; save()`);
    const td = await run('WISH.applyDoors(SIMPLE.plan(dayNo() + 16)[dayNo() + 1], P.doorsToday.ids)');
    await run(`P.wantDoor = { area: '${pick}', d: '2000-01-01' }; P.doorsToday.d = '2000-01-01'; P.days = {}; P.chest = ''; save()`);
    ok((await run('SIMPLE.today().map(a => a.id)')).includes(pick), 'the new day does not take the promised door');
    ok(td.includes(pick), `tomorrow doors ${td} without ${pick}`);
    ok(!td.some(id => y.includes(id) && id !== pick), `a door of yesterday came again: ${td} / ${y}`);
    ok((await run('JSON.stringify(SIMPLE.must())')) === must0, 'the path changed');
    // the wish comes true in the room; the jar shows it
    await run(`P.days[dayKey()] = Object.fromEntries(SIMPLE.must().map(id => [id, 1])); save(); SIMPLE.room(SIMPLE.AREAS.find(a => a.id === '${pick}'))`); await p.waitForTimeout(700);
    ok(await run(`P.wishes.some(x => x.area === '${pick}' && x.done)`), 'the wish did not come true');
    await run('WISH.screenJar()'); await p.waitForTimeout(500);
    ok((await p.$$('.wi-l li.on')).length >= 1, 'the jar shows nothing come true');
    await p.screenshot({ path: `${SHOTS}/wish-${lang}-${DEV}-jar.png` });
    // the grown-ups: the list, one tap sends it through «Написать автору»
    await run(`screenParents('day')`); await p.waitForTimeout(700);
    ok((await p.$$('#wiOut li')).length === 1, 'grown-ups do not see «Хочу в игру»');
    await p.screenshot({ path: `${SHOTS}/wish-${lang}-${DEV}-parent.png`, fullPage: true });
    if (await p.$('#wiSend')) { await p.click('#wiSend'); await p.waitForTimeout(800); }
    ok((await run('(ROOT.lettersSent || []).length')) === 1 && (await run('(P.wishOut || []).length')) === 0, 'one tap did not send the list');
    console.log(`${lang} ${DEV}: missing ${JSON.stringify(miss)} | errors ${JSON.stringify(errs)}`);
    if (errs.length || miss.length) bad++;
    await c.close();
  }
  await b.close(); console.log(bad ? `FAIL in ${bad} language(s)` : 'OK: wishes'); process.exit(bad ? 1 : 0);
})();
