// fun-speak: «Сегодня» and «Говорим» feel like a walk with the friend. Checks, for invented children (Тина 4, Тим 9):
// the speech lesson starts with a trip card and its trail; a game in the lesson shows the trail with the friend on the
// current stone; the result card moves the friend on; a lesson begun today gets a golden arc on the path; a round shows
// pips; a right answer sends stars out of the friend; «Говорим» has a surprise game; «одно яблоко», not «один яблоко».
// node tests/fun_speak.js [base] [phone|laptop]   (needs tests/serve.sh)
const { chromium, devices } = require('playwright');
const path = require('path');
const BASE = process.argv[2] || 'http://localhost:8781/govorilki/', DEV = process.argv[3] || 'phone';
const SHOTS = path.join(__dirname, 'shots', 'fun-after'); require('fs').mkdirSync(SHOTS, { recursive: true });
const HOOK = 'const fam = () => ROOT.families[ROOT.curFam] || null;';
const LANGS = { ru: 'ru/', en: '', pt: 'pt/', de: 'de/' };
const kid = (name, g, age, fr, track, lang) => ({ stars: 12, plays: {}, learn: {}, book: { title: 'Т', log: {} }, settings: { name, gender: g, track, age, friend: fr, onboarded: true, lang } });
let bad = 0; const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) bad++; };
async function open(b, lang, who) {
  const seed = { engine: 'device', micOff: true, srOff: true, parentPhone: true, cur: who, curFam: 'f1',
    families: { f1: { id: 'f1', name: 'Т', cc: 'PT', kids: ['k1', 'k3'], grands: [] } },
    profiles: { k1: kid('Тина', 'f', 4, 'kitty', 'r', lang), k3: kid('Тим', 'm', 9, 'tiger', 'l', lang) } };
  const c = await b.newContext(DEV === 'laptop' ? { viewport: { width: 1280, height: 800 } } : { ...devices['iPhone 13'], deviceScaleFactor: 1 });
  await c.route(/ntfy|wikipedia|huggingface|jsdelivr|youtube|wikimedia|workers\.dev/, r => r.abort());
  await c.route(u => /\/(ru|de|pt|en)?\/?(index\.html)?$/.test(u.pathname), async r => { const x = await r.fetch(); let t = await x.text(); t = t.replace(HOOK, HOOK + ' window.__T = { run: s => eval(s) };'); r.fulfill({ response: x, body: t }); });
  await c.addInitScript(s => { window.__said = []; try { speechSynthesis.speak = u => { window.__said.push(u.text); setTimeout(() => u.onend && u.onend(), 5); }; } catch (e) {} if (localStorage.getItem('seeded')) return; localStorage.setItem('seeded', 1); localStorage.setItem('govorilki-v2', JSON.stringify(s)); }, seed);
  const p = await c.newPage(); p.errs = [];
  p.on('pageerror', e => p.errs.push(e.message));
  await p.goto(BASE + LANGS[lang]); await p.waitForTimeout(1500);
  const w = await p.$$(`.who-kid`); if (w.length) { await w[who === 'k1' ? 0 : 1].click(); await p.waitForTimeout(900); }
  p.ctx = c; return p;
}
const run = (p, s) => p.evaluate(x => window.__T.run(x), s);
const said = p => p.evaluate(() => { const a = window.__said.join(' / '); window.__said.length = 0; return a; });
(async () => {
  const b = await chromium.launch();
  for (const lang of Object.keys(LANGS)) {
    const T = `[${lang} ${DEV}]`;
    let p = await open(b, lang, 'k1');
    await said(p);
    await p.click('.pd-n[data-l="speech"]'); await p.waitForTimeout(900);
    ok(await p.$('.overlay .ls-intro .ls-trail .ls-st.now .ls-fr svg'), `${T} the speech lesson opens with the trip card and its trail`);
    const line = await said(p); ok(line.length > 20 && !/[А-Яа-яЁё]/.test(lang === 'ru' ? '' : line.replace(/Тина/g, '')), `${T} the friend says where we go: ${line.slice(0, 90)}`);
    if (lang === 'ru' || DEV === 'phone') await p.screenshot({ path: `${SHOTS}/${lang}-${DEV}-intro.png` });
    await p.click('.ls-intro [data-a="go"]'); await p.waitForTimeout(1200);
    const g = await p.evaluate(() => ({ trail: !!document.querySelector('#gstrip .ls-trail'), now: document.querySelectorAll('#gstrip .ls-st.now .ls-fr').length, st: document.querySelectorAll('#gstrip .ls-st').length, plan: window.__T.run("lessonPlan('speech').length"), h1: (document.querySelector('.bar h1') || {}).textContent, over: document.documentElement.scrollWidth > innerWidth }));
    ok(g.trail && g.now === 1 && g.st === g.plan + 1 && !g.over, `${T} first step «${g.h1}»: trail of ${g.st} stones (plan ${g.plan} + flag), the friend on one, no sideways scroll`);
    await p.screenshot({ path: `${SHOTS}/${lang}-${DEV}-step1.png` });
    // finish this step: the result card shows the trail, the friend lands on the next stone
    await run(p, "finish({ key: nextStepOf('speech').key, again: () => {} })"); await p.waitForTimeout(1400);
    const w = await p.evaluate(() => ({ win: !!document.querySelector('.overlay .ls-trail.ls-win'), just: !!document.querySelector('.ls-win .ls-st.just'), done: document.querySelectorAll('.ls-win .ls-st.done').length, old: !!document.querySelector('.winbox .day-prog') }));
    ok(w.win && w.just && w.done === 1 && !w.old, `${T} the result card: trail with 1 done stone that pops, no text counter`);
    await p.screenshot({ path: `${SHOTS}/${lang}-${DEV}-win.png` });
    await p.click('.overlay [data-a="next"]'); await p.waitForTimeout(1000);
    ok(await p.evaluate(() => document.querySelectorAll('#gstrip .ls-st.done').length === 1 && !document.querySelector('.ls-intro')), `${T} «Дальше»: the next game, its trail has 1 done stone, no trip card again`);
    await run(p, 'goHome()'); await p.waitForTimeout(700);
    ok(await p.$('.pd-n[data-l="speech"] .pd-c.pd-part'), `${T} home: the begun lesson has a golden arc`);
    await p.screenshot({ path: `${SHOTS}/${lang}-${DEV}-home-arc.png` });
    // «Говорим»: the surprise opens a game
    await p.click('.tb[data-tab="speak"]'); await p.waitForTimeout(700);
    ok(await p.$('#surpBtn'), `${T} «Говорим» has the surprise button`);
    if (DEV === 'phone') await p.screenshot({ path: `${SHOTS}/${lang}-${DEV}-speak.png` });
    await p.click('#surpBtn'); await p.waitForTimeout(1200);
    const sh = await p.evaluate(() => ({ h1: (document.querySelector('.bar h1') || {}).textContent, home: !!document.querySelector('#tabBar'), trail: !!document.querySelector('.ls-trail') }));
    ok(sh.h1 && !sh.home && !sh.trail, `${T} the surprise opened «${sh.h1}» (no lesson trail outside a lesson)`);
    // a right answer in a «Говорим» game: stars out of the friend
    await run(p, "sfx.good()"); await p.waitForTimeout(150);
    ok(await p.$('.fsp span'), `${T} a right answer sends stars out of the friend`);
    // the round's pips (house is in every language)
    await run(p, "screenHouse()"); await p.waitForTimeout(900);
    const rd = await p.evaluate(() => ({ n: document.querySelectorAll('#gstrip .rd i').length, cur: document.querySelectorAll('#gstrip .rd i.cur').length }));
    ok(rd.n >= 5 && rd.cur === 1, `${T} «Где живёт звук»: ${rd.n} round pips, one current`);
    if (DEV === 'phone') await p.screenshot({ path: `${SHOTS}/${lang}-${DEV}-house.png` });
    if (lang === 'ru') {
      // the friend's grammar model is right: «одно яблоко», «одна ложка»
      const one = await p.evaluate(() => ['яблоко', 'ложка', 'кот', 'мышь', 'платье', 'дерево'].map(w => window.__T.run(`LOGO.ONE('${w}')`) + ' ' + w).join(', '));
      ok(one === 'одно яблоко, одна ложка, один кот, одна мышь, одно платье, одно дерево', `${T} ${one}`);
      console.log('     ' + await p.evaluate(() => window.__T.run("LOGO.MANY.map(([w]) => LOGO.ONE(w) + ' ' + w).join(', ')")));
      const sz = await p.evaluate(async () => { const r = []; for (let i = 0; i < 12; i++) { window.__T.run("GAMES.find(g => g.id === 'sz-sort').go()"); await new Promise(f => setTimeout(f, 60)); r.push(document.querySelector('.bar h1').textContent + '=' + [...document.querySelectorAll('.bin small')].map(x => x.textContent.split(':')[0]).join('+')); } return [...new Set(r)]; });
      ok(sz.every(x => { const [h, b] = x.split('='); const [a, c] = b.split('+'); return h.toLowerCase().includes(a) && h.toLowerCase().includes(c); }), `ru «Водичка или комарик?» names its two sounds: ${sz.join(' | ')}`);
    }
    ok(!p.errs.length, `${T} no page errors ${JSON.stringify(p.errs)}`);
    await p.ctx.close();
    // the older child: a mission card
    p = await open(b, lang, 'k3'); await said(p);
    await p.click('.pd-n[data-l="speech"]'); await p.waitForTimeout(900);
    ok(await p.$('.overlay .ls-intro .ls-trail'), `${T} older child: the mission card with the trail`);
    if (lang === 'ru') await p.screenshot({ path: `${SHOTS}/${lang}-${DEV}-intro-9.png` });
    await p.click('.ls-intro [data-a="go"]'); await p.waitForTimeout(1200);
    ok(await p.$('#gstrip .ls-trail'), `${T} older child: the trail in the game`);
    if (lang === 'ru') await p.screenshot({ path: `${SHOTS}/${lang}-${DEV}-step1-9.png` });
    ok(!p.errs.length, `${T} older child: no page errors ${JSON.stringify(p.errs)}`);
    await p.ctx.close();
  }
  await b.close(); console.log(bad ? `FAIL: ${bad}` : 'OK'); process.exit(bad ? 1 : 0);
})();
