// What the voice gets when a line names a letter: never a bare capital consonant («буква Р.» was heard as «буква Я»),
// the letter by its name instead (буква эр); the screen keeps the letter. Colouring swatches, the alphabet games, and
// the say module on its own (prepositions «В лесу», «К маме» stay). Russian checks; en/pt/de: the swatches still talk.
// Fictional children only (Тина). Needs tests/serve.sh running.  node tests/letter_say.js [base] [phone|laptop]
const { chromium, devices } = require('playwright');
const BASE = process.argv[2] || 'http://localhost:8781/govorilki/', DEV = process.argv[3] || 'phone';
const HOOK = 'const fam = () => ROOT.families[ROOT.curFam] || null;';
const LANGS = { ru: 'ru/', en: '', pt: 'pt/', de: 'de/' };
const kid = (name, g, age, fr, lang) => ({ stars: 5, plays: {}, learn: {}, book: { title: 'Т', log: {} }, settings: { name, gender: g, track: 'r', age, friend: fr, onboarded: true, lang } });
// a lone Cyrillic capital consonant (not a preposition before a word)
const BARE = /(^|[^А-Яа-яЁё])[БВГДЖЗКЛМНПРСТФХЦЧШЩЪЬЙ](?![А-Яа-яЁё])(?!\s+[а-яё])/;
(async () => {
  const b = await chromium.launch(); let bad = 0;
  for (const [lang, sub] of Object.entries(LANGS)) {
    const seed = { engine: 'device', micOff: true, srOff: true, parentPhone: true, cur: 'k1', curFam: 'f1',
      families: { f1: { id: 'f1', name: 'Т', cc: 'PT', kids: ['k1'], grands: [] } }, profiles: { k1: kid('Тина', 'f', 8, 'kitty', lang) } };
    const c = await b.newContext(DEV === 'laptop' ? { viewport: { width: 1280, height: 800 } } : { ...devices['iPhone 13'], deviceScaleFactor: 1 });
    await c.route(/ntfy|wikipedia|huggingface|jsdelivr|youtube|wikimedia|workers\.dev/, r => r.abort());
    await c.route(u => /\/(ru|de|pt|en)?\/?(index\.html)?$/.test(u.pathname), async r => { const x = await r.fetch(); let t = await x.text(); t = t.replace(HOOK, HOOK + ' window.__T = { run: s => eval(s) };'); r.fulfill({ response: x, body: t }); });
    await c.addInitScript(s => { window.__said = []; try { speechSynthesis.speak = u => { window.__said.push(u.text); setTimeout(() => u.onend && u.onend(), 5); }; } catch (e) {} if (localStorage.getItem('seeded')) return; localStorage.setItem('seeded', 1); localStorage.setItem('govorilki-v2', JSON.stringify(s)); }, seed);
    const p = await c.newPage(), errs = [], fail = [], R = s => p.evaluate(s => window.__T.run(s), s);
    p.on('pageerror', e => errs.push(e.message));
    await p.goto(BASE + sub); await p.waitForTimeout(1500);
    const who = await p.$$('.who-kid'); if (who.length) { await who[0].click(); await p.waitForTimeout(900); }
    if (lang === 'ru') await p.waitForFunction(() => window.__T.run('!!SAYRU'), null, { timeout: 15000 }).catch(() => fail.push('no SAYRU'));
    // colouring: every swatch says its colour and its letter
    // Раскраски → Звери → the first page (the owner's report: the horse page), as a child gets there
    await R('screenColorMenu()'); await p.waitForTimeout(700);
    const pg = await R(`(imgOf('animals')[0] || PAGES[0])`);
    await R(`screenPaint({ mode: 'color', page: ${JSON.stringify(pg)} })`); await p.waitForTimeout(900);
    const sw = await p.$$('#sw .swc'), lines = [];
    for (let i = 1; i < sw.length; i++) {
      await p.evaluate(() => { window.__said = []; }); await sw[i].click(); await p.waitForTimeout(250);
      lines.push((await p.evaluate(() => window.__said.join(' | '))).replace(/́/g, ''));
    }
    await sw[0].click(); await p.waitForTimeout(250);
    if (lines.filter(Boolean).length < 10) fail.push('swatches quiet: ' + lines.join(' / '));
    const shown = await p.$$eval('#sw .swl', x => x.map(e => e.textContent).join(''));
    if (lang === 'ru') {
      if (shown !== 'КОЖЗБГСФРКЧБ') fail.push('letters on swatches: ' + shown);
      lines.forEach(l => { if (BARE.test(l)) fail.push('bare letter: ' + l); });
      if (!lines.includes('Розовый цвет — буква эр.')) fail.push('pink: ' + lines.find(l => /Розов/.test(l)));
      // the alphabet games' lines, through the same path to the voice
      const said = await R(`(() => {
        const o = [], add = s => o.push(...sayParts(s));
        ABC.forEach(([L, w], i) => { add('Найди букву ' + lsay(L) + '.'); add(abcLine(i)); add('Да! ' + cap(lsay(L)) + '. ' + cap(w) + '.'); add(cap(w) + ' начинается с буквы ' + lsay(L) + '!'); add('Это буква ' + lsay(L) + '. Обведи её пальчиком.'); });
        // lines that write the bare letter themselves: the say module names it
        ['Р', 'Л', 'Ш', 'Щ', 'Ж'].forEach(L => { add('Продолжаем букварь. Сегодня буква ' + L + '.'); add('Буква ' + L + ' бежит к букве А.'); add('Первое занятие с буквой ' + L + ' — готово!'); add('Найди букву «' + L + '».'); add(L + '. Как в слове рыба.'); });
        return o.map(x => x.replace(/\\u0301/g, ''));
      })()`);
      said.forEach(l => { if (BARE.test(l)) fail.push('bare letter: ' + l); });
      const want = { 'Найди букву Р.': 'Найди букву эр.', 'Это буква Л. Обведи.': 'Это буква эль.', 'Буква Щ бежит к букве А.': 'Буква ща бежит к букве А.', 'Р.': 'Эр.' };
      for (const [k, v] of Object.entries(want)) { const got = await R(`sayParts(${JSON.stringify(k)})[0]`); if (got.replace(/́/g, '') !== v) fail.push(`${k} → ${got}`); }
      // a long vowel: three clear vowels for the voice; a closing quote stays with its sentence
      for (const [k, v] of [['Девочка плачет: а-а-а!', 'Девочка плачет: а, а, а!'], ['А-а-а!', 'А, а, а!'], ['Удивляемся: «о-о-о!»', 'Удивляемся: «о, о, о!»'], ['Р-р-р! Гуси: га-га-га!', 'Р-р-р!|Гуси: га-га-га!'], ['Ау-у!', 'Ау-у!']]) {
        const got = (await R(`sayParts(${JSON.stringify(k)}).join('|')`)).replace(/\u0301/g, '');
        if (got !== v) fail.push(`${k} → ${got}`);
      }
      // the primer's sounds («Звук и буква»): every line reaches the voice with something to say
      const prs = await R(`Object.entries(PR_SOUND).flatMap(([L, v]) => [v[1], v[2]].map(x => [x, sayParts(x)]))`);
      prs.forEach(([x, ps]) => { if (!ps.length || ps.some(q => !/[а-яё]{1}/i.test(q))) fail.push('primer line: ' + x + ' → ' + JSON.stringify(ps)); if (BARE.test(ps.join(' '))) fail.push('primer bare letter: ' + ps.join(' ')); });
      await p.evaluate(() => { window.__said = []; }); await R('screenPrimerLesson(0)'); await p.waitForTimeout(1500);
      const ps0 = (await p.evaluate(() => window.__said.join(' | '))).replace(/\u0301/g, '');
      if (!/а, а, а/.test(ps0)) fail.push('primer А said: ' + ps0);
      // prepositions and words stay as they are
      for (const k of ['В лесу живёт ёж.', 'К маме пришёл кот.', 'С папой. В саду.', 'Буква А.', 'Ура! Я нашла букву.']) {
        const got = (await R(`sayParts(${JSON.stringify(k)}).join(' ')`)).replace(/́/g, '');
        if (got !== k) fail.push(`${k} → ${got}`);
      }
      // the games themselves: find the letter, first letter
      for (const g of ['screenFindLetter()', 'screenFirstLetter()', 'screenABC()']) {
        await p.evaluate(() => { window.__said = []; }); await R(g); await p.waitForTimeout(900);
        const opt = await p.$('.abc-k, [data-c]'); if (opt) { await opt.click().catch(() => {}); await p.waitForTimeout(900); }
        const s = (await p.evaluate(() => window.__said.join(' | '))).replace(/́/g, '');
        if (!s) fail.push(g + ' quiet'); if (BARE.test(s)) fail.push(g + ' bare letter: ' + s);
      }
    }
    if (errs.length) fail.push('page errors: ' + errs.join(' | '));
    console.log(`${lang} ${DEV}: ${fail.length ? 'FAIL ' + fail.join(' ; ') : 'ok'} — ${lines.slice(0, 3).join(' / ')} …`);
    if (fail.length) bad++;
    await c.close();
  }
  await b.close(); process.exit(bad ? 1 : 0);
})();
