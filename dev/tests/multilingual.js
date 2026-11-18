// multilingual: children of several languages. Each language is «дома», «в школе» or «учит», one is the main one; reading
// has its own step in each language; «Сегодня» reads in the weakest home language every other day and in the others
// between (a visit to that language's page that comes home); «Мои языки» — hear a word in one language, find it in
// another. Invented children: Тина 8 (ru at home, pt and en at school), Тим 6 (only de), Тоша 10 (ru at home, pt and en
// at school, learns de). Usage: node tests/multilingual.js [base url] [phone|laptop]   (LANGS=ru,pt to narrow)
const { chromium, devices } = require('playwright');
const D = require('path').join(__dirname, 'shots') + '/';
require('fs').mkdirSync(D, { recursive: true });
const BASE = process.argv[2] || 'http://localhost:8781/govorilki/', DEV = process.argv[3] || 'phone';
const HOOK = 'const fam = () => ROOT.families[ROOT.curFam] || null;';
const KIDS = {
  tina: { name: 'Тина', gender: 'f', age: 8, track: 'r', langs: ['ru', 'pt', 'en'], school: ['pt', 'en'], learn: [] },
  tim: { name: 'Тим', gender: 'm', age: 6, track: 'r', langs: ['de'], school: [], learn: [] },
  tosha: { name: 'Тоша', gender: 'm', age: 10, track: 'l', langs: ['ru', 'pt', 'en', 'de'], school: ['pt', 'en'], learn: ['de'] }
};
const kid = (k, lang) => ({ stars: 5, plays: {}, book: { title: 'Т', log: {} }, settings: { ...KIDS[k], friend: 'kitty', onboarded: true, lang } });
let bad = 0; const ok = (c, m) => { console.log((c ? '  ok  ' : '  FAIL ') + m); if (!c) bad++; };
// a Monday and the Tuesday after it, at noon (dayNo of a Monday: n % 7 = 4 → even, Tuesday odd)
const DAY1 = new Date('2026-11-16T12:00:00'), DAY2 = new Date('2026-11-17T12:00:00');
async function open(b, lang, path, who, { day = DAY1, extra = {} } = {}) {
  const fam = { engine: 'device', micOff: true, srOff: true, parentPhone: true, startAt: 'kid', cur: who, curFam: 'f1', families: { f1: { id: 'f1', name: 'Т', cc: 'PT', kids: [who], grands: [] } }, profiles: { [who]: { ...kid(who, KIDS[who].langs.includes(lang) ? lang : KIDS[who].langs[0]), ...extra } } };
  const c = await b.newContext(DEV === 'phone' ? { ...devices['iPhone 13'], deviceScaleFactor: 1 } : { viewport: { width: 1280, height: 800 } });
  await c.route(/ntfy|wikipedia|huggingface|jsdelivr|youtube|wikimedia|workers\.dev/, r => r.abort());
  await c.route(u => /\/(ru|de|pt|en)?\/?(index\.html)?$|\/app\.[0-9a-f]+\.js$/.test(u.pathname), async r => { const x = await r.fetch(); let t = await x.text(); t = t.replace(HOOK, HOOK + ' window.__T = { run: s => eval(s) };'); r.fulfill({ response: x, body: t }); });
  await c.addInitScript(s => { window.__said = []; try { speechSynthesis.speak = u => { window.__said.push(u.text); setTimeout(() => u.onend && u.onend(), 5); }; } catch (e) {} if (localStorage.getItem('seeded')) return; localStorage.setItem('seeded', 1); localStorage.setItem('govorilki-v2', JSON.stringify(s.fam)); localStorage.setItem('govorilki-lang', s.lang); }, { fam, lang });
  const p = await c.newPage(); const errs = [];
  await p.clock.setFixedTime(day);
  p.on('pageerror', e => { errs.push(e.message); console.log('PAGEERR', e.stack.slice(0, 400)); });
  await p.goto(BASE + path); await p.waitForTimeout(1500);
  const whoB = await p.$$('.who-kid'); if (whoB.length) { await whoB[0].click(); await p.waitForTimeout(900); }
  const run = s => p.evaluate(s => window.__T.run(s), s);
  await run('GUARD.free = 1');
  return { c, p, errs, run };
}
(async () => {
  const b = await chromium.launch();
  for (const [lang, path] of [['ru', 'ru/'], ['en', ''], ['pt', 'pt/'], ['de', 'de/']].filter(x => !process.env.LANGS || process.env.LANGS.includes(x[0]))) {
    console.log(lang, DEV);
    // 1. the profile: three roles and the main language, in the setup of a child and in «Для взрослых»
    {
      const { c, p, errs, run } = await open(b, lang, path, 'tina');
      const tag = `${lang} Тина`;
      await run(`screenKidSetup(ROOT.cur)`); await p.waitForTimeout(600);
      ok(!!(await p.$('.ks-langs #ksLangs')), `${tag}: the setup of a child has «Языки» on top`);
      const roles = await p.$$eval('#ksLangs .ml-lr.on', rs => rs.map(r => r.querySelector('.chip.sel').dataset.ml + ':' + r.querySelector('.chip.sel').dataset.st).join());
      ok(roles === 'ru:home,pt:school,en:school' || roles.split(',').sort().join() === 'en:school,pt:school,ru:home', `${tag}: roles shown — ${roles}`);
      await p.click('#ksLangs [data-ml="de"][data-st="learn"]'); await p.waitForTimeout(200);
      let st = await run('JSON.stringify([P.settings.langs, P.settings.learn, P.settings.school])');
      ok(st === JSON.stringify([['ru', 'pt', 'en', 'de'], ['de'], ['pt', 'en']]), `${tag}: «учит» German → ${st}`);
      await p.click('#ksLangs [data-ml="pt"][data-st="home"]'); await p.waitForTimeout(200);
      st = await run('JSON.stringify([P.settings.school, mlRole("pt")])');
      ok(st === JSON.stringify([['en'], 'home']), `${tag}: Portuguese moved to «дома» → ${st}`);
      await p.click('#ksLangs [data-mlmain="pt"]'); await p.waitForTimeout(200);
      ok((await run('P.settings.lang')) === 'pt', `${tag}: the main language is Portuguese`);
      const wide = await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1);
      ok(wide, `${tag}: no sideways scroll`);
      if (lang === 'ru' || DEV === 'laptop') await p.$eval('.ks-langs', e => e.scrollIntoView()).then(() => p.waitForTimeout(300)).then(() => p.screenshot({ path: D + `ml-profile-${lang}-${DEV}.png` }));
      await p.click('#ksLangs [data-ml="de"][data-st="learn"]'); await p.waitForTimeout(200);
      ok(!(await run('P.settings.langs')).includes('de'), `${tag}: a second tap takes German away`);
      await run('screenParents()'); await p.waitForTimeout(600);
      ok(!!(await p.$('#mlLangsIn .ml-lr')), `${tag}: «Для взрослых» has the languages`);
      ok(!errs.length, `${tag}: no page errors ` + errs.join(' | '));
      await c.close();
    }
    // 2. reading by language: the steps are independent; the report reads them
    {
      const { c, p, errs, run } = await open(b, lang, path, 'tosha');
      const tag = `${lang} Тоша`;
      await run(`rskOf(P, 'ru').lv = 3; rskOf(P, 'pt').lv = 7; rskOf(P, 'en').lv = 6; save()`);
      const want = { ru: 3, pt: 7, en: 6, de: 0 }[lang];
      ok((await run('RSK.has() ? RSK.lv() : 0')) === want, `${tag}: the step on the ${lang} page is ${want}`);
      await run('RSK.setLv(5)');
      const lv = await run('JSON.stringify(readLevels())');
      const exp = { ru: 3, pt: 7, en: 6 }; exp[lang] = 5;
      ok(JSON.stringify(JSON.parse(lv), Object.keys(exp).sort()) === JSON.stringify(exp, Object.keys(exp).sort()), `${tag}: a step set here changes only ${lang}: ${lv}`);
      // the old one-step data becomes the main language's
      const mig = await run(`(() => { const pr = { settings: { lang: 'pt', langs: ['ru', 'pt'] }, rskill: { lv: 4, checked: '2026-11-01' } }; return JSON.stringify(readLevels(pr)) + JSON.stringify(pr.rskill.pt); })()`);
      ok(mig === '{"pt":4}{"lv":4,"checked":"2026-11-01"}', `${tag}: an old step moves to the main language: ${mig}`);
      // «Сегодня»: the weakest home language (Russian, step 3) every other day, the others between
      await run(`rskOf(P, LANG).lv = ${lang === 'ru' ? 3 : { pt: 7, en: 6, de: 2 }[lang]}; save()`);
      const week = await run(`Array.from({ length: 7 }, (_, i) => [(dayNo() + i) % 7, readLangToday(dayNo() + i)])`);
      ok(week.every(([d, l]) => d % 2 || l === 'ru') && new Set(week.map(x => x[1])).size === 4, `${tag}: a week of reading — ${week.map(x => x[1]).join()}`);
      const d1 = await run(`readLangToday()`);
      const plan = await run(`lessonPlan('read').map(s => s.key).join()`);
      // a child of 8–14 with Russian at home: on the Russian days «Русский для меня» takes the reading's place (ru-bilingual)
      ok((d1 === 'ru' ? plan === 'rume-day' : plan.split(',')[0] === 'r-skill@' + d1) && plan.split(',').length <= 3, `${tag}: today's reading in ${d1}: ${plan}`);
      // Тоша reads Russian at step 3 and German not yet checked: German has no step → it is not «weakest», he only learns it
      ok(d1 === 'ru', `${tag}: Monday — Russian, the weakest home language`);
      await run(`goHome()`); await p.waitForTimeout(500); await p.click('.tb[data-tab="today"]').catch(() => {}); await p.waitForTimeout(700);
      if (lang === 'ru' || lang === 'pt') await p.screenshot({ path: D + `ml-today-${lang}-day1-${DEV}.png` });
      ok(!errs.length, `${tag}: no page errors ` + errs.join(' | '));
      await c.close();
    }
    // 3. the next day: another language; on the ru page the step visits that page and comes back home
    {
      const extra = { rskill: { ru: { lv: 3 }, pt: { lv: 7 }, en: { lv: 6 } } };
      const { c, p, errs, run } = await open(b, lang, path, 'tosha', { day: DAY2, extra });
      const tag = `${lang} Тоша day 2`;
      const d2 = await run(`readLangToday()`);
      ok(d2 !== 'ru', `${tag}: Tuesday — ${d2}, not Russian`);
      await run(`goHome()`); await p.waitForTimeout(500); await p.click('.tb[data-tab="today"]').catch(() => {}); await p.waitForTimeout(700);
      const node = await p.$eval('.pd-n[data-l="read"]', e => e.innerText.replace(/\s+/g, ' ')).catch(() => '-');
      ok(d2 === lang || node !== '-', `${tag}: the reading node — «${node}»`);
      if (lang === 'ru' || lang === 'pt') await p.screenshot({ path: D + `ml-today-${lang}-day2-${DEV}.png` });
      if (lang === 'ru' && d2 !== 'ru') {
        // the visit: the step opens the reading round on the other page
        await run(`P.today = null; startLesson('read')`);
        await p.waitForURL(u => u.pathname.includes('/' + d2 + '/') || (d2 === 'en' && !/\/(ru|pt|de)\//.test(u.pathname)), { timeout: 10000 }).catch(() => {});
        await p.waitForTimeout(1500);
        const where = await p.evaluate(() => location.pathname);
        ok(!!(await p.$('#rkBox')), `${tag}: the visit opens reading on ${where}`);
        const pl = await p.evaluate(() => window.__T.run('LANG'));
        ok(pl === d2, `${tag}: the page language there is ${pl}`);
        await p.evaluate(() => window.__T.run(`finish({ key: 'r-skill', stars: 3 })`)); await p.waitForTimeout(600);
        const done = await p.evaluate(() => window.__T.run('todayState().done.read.join()'));
        ok(done.includes('r-skill@' + d2), `${tag}: the round counts for «Сегодня» (${done})`);
        await p.evaluate(() => window.__T.run('goHome()'));
        await p.waitForURL(u => u.pathname.includes('/ru/'), { timeout: 10000 }).catch(() => {});
        await p.waitForTimeout(1800);
        ok((await p.evaluate(() => location.pathname)).includes('/ru/') && (await p.evaluate(() => window.__T.run('LANG'))) === 'ru', `${tag}: «Домой» comes back to the Russian page`);
        const plan2 = await p.evaluate(() => window.__T.run(`nextStepOf('read') && nextStepOf('read').key`));
        ok(plan2 !== 'r-skill@' + d2, `${tag}: back home the reading step is done (next: ${plan2})`);
        if (DEV === 'phone') await p.screenshot({ path: D + `ml-today-back-${DEV}.png` });
      }
      ok(!errs.length, `${tag}: no page errors ` + errs.join(' | '));
      await c.close();
    }
    // 4. Тим: one language, nothing changes
    {
      const { c, p, errs, run } = await open(b, lang, path, 'tim');
      const tag = `${lang} Тим`;
      ok((await run(`lessonPlan('read')[0].key`)) === 'r-skill', `${tag}: one language — the usual reading round`);
      ok(!(await run(`mlOn()`)), `${tag}: no «Мои языки» games`);
      ok(!errs.length, `${tag}: no page errors ` + errs.join(' | '));
      await c.close();
    }
    // 5. «Мои языки»: hear in one language, find in another
    {
      const { c, p, errs, run } = await open(b, lang, path, 'tosha');
      const tag = `${lang} Тоша «Мои языки»`;
      await run(`goHome()`); await p.waitForTimeout(500);
      ok(await run(`!!GAMES.find(g => g.id === 'ml-match') && !GAMES.find(g => g.id === 'ml-match').hide()`), `${tag}: the game is there`);
      await run(`screenMlMatch()`); await p.waitForTimeout(800);
      let right = 0;
      for (let k = 0; k < 8; k++) {
        await p.waitForSelector('.mm-o', { timeout: 8000 });
        await run("GUARD.free = 1; GUARD.until = 0");
        const n = await p.$$eval('.mm-o', x => x.length);
        if (k === 0) ok(n === 3, `${tag}: three choices`);
        // try the choices in turn: a wrong one is greyed out, the right one shows «Дальше»
        const ans = await p.evaluate(() => { const o = [...document.querySelectorAll('.mm-o')]; return o.map(x => x.dataset.e); });
        let done = false;
        for (const a of ans) {
          await p.$eval(`.mm-o[data-e="${a}"]`, x => x.click()).catch(() => {}); await p.waitForTimeout(250);
          if (await p.$('#mmNext')) { done = true; break; }
        }
        if (done) right++;
        if (k === 0) { ok(!!(await p.$('.mm-pair .ml-strip')), `${tag}: the word in all the languages after the answer`); if (lang === 'ru' || DEV === 'laptop') await p.screenshot({ path: D + `ml-match-${lang}-${DEV}.png` }); }
        await p.waitForSelector('#mmNext', { timeout: 8000 }).catch(() => {});
        await p.waitForTimeout(150);
        await p.$eval("#mmNext", x => x.click()).catch(() => {}); await p.waitForTimeout(300);
      }
      ok(right === 8, `${tag}: 8 words found`);
      ok(!!(await p.waitForSelector('.winbox', { timeout: 8000 }).catch(() => null)), `${tag}: the end of the game`);
      const wide = await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1);
      ok(wide, `${tag}: no sideways scroll`);
      // the same word in a story with a picture word
      const sid = await run(`(() => { for (const k of Object.keys(LEARN)) { const i = learnItems(k).findIndex(x => mlWord(x.e)); if (i >= 0) return k + '|' + i; } return ''; })()`);
      if (sid) { const [k, i] = sid.split('|'); await run(`screenStory('${k}', ${i})`); await p.waitForTimeout(1500); ok(!!(await p.$('.story .ml-strip')), `${tag}: a story shows its word in the child's languages (${sid})`); }
      ok(!errs.length, `${tag}: no page errors ` + errs.join(' | '));
      await c.close();
    }
  }
  await b.close();
  console.log(bad ? `FAILED ${bad}` : 'ALL OK'); process.exit(bad ? 1 : 0);
})();
