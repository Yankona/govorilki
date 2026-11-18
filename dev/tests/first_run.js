// The audit's first run and safety (18.11), from a fresh browser on a phone, in 4 languages:
//  1. taps from the first page to the first game: age → the first step of «Сегодня» → «Поехали!» (≤ 3);
//  2. the family's country is not the USA on ru/pt/de (an en-US phone), no «Лига семей», no «Кто играет?» after a reload
//     with one child, the friend greets by voice on the home screen, «Как тебя зовут?» asks for the name later;
//  3. «Для взрослых» needs the parent code (made up once, asked after a reload);
//  4. a link out of the game asks the grown-up's check first and opens nothing by itself;
//  5. the microphone: the friend explains before the phone asks;
//  6. no request to Cloudflare Insights, and the site's headers forbid injecting it (no-transform on /play/*).
// Invented children only (Тина). node tests/first_run.js [base=http://localhost:8781/govorilki/] [langs=ru,en,pt,de]
const { chromium, devices } = require('playwright');
const fs = require('fs'), path = require('path');
const BASE = process.argv[2] || 'http://localhost:8781/govorilki/', LANGS = (process.argv[3] || 'ru,en,pt,de').split(',');
const SUB = { ru: 'ru/', en: '', pt: 'pt/', de: 'de/' };
const SHOTS = path.join(__dirname, 'shots');
const HOOK = 'const fam = () => ROOT.families[ROOT.curFam] || null;';
(async () => {
  const b = await chromium.launch(); let bad = 0;
  for (const lang of LANGS) {
    const c = await b.newContext({ ...devices['iPhone 13'], deviceScaleFactor: 1, locale: 'en-US', timezoneId: 'UTC' });
    const beacon = [], popups = [];
    c.on('request', r => { if (/cloudflareinsights|beacon\.min\.js/.test(r.url())) beacon.push(r.url()); });
    await c.route(/ntfy|wikipedia|huggingface|jsdelivr|youtube|wikimedia|workers\.dev|example\.org/, r => r.abort());
    await c.route(u => /\/(ru|de|pt|en)?\/?(index\.html)?$|\/app\.[0-9a-f]+\.js$/.test(u.pathname), async r => { const x = await r.fetch(); let t = await x.text(); t = t.replace(HOOK, HOOK + ' window.__T = { run: s => eval(s) };'); r.fulfill({ response: x, body: t }); });
    await c.addInitScript(() => { window.__said = []; try { speechSynthesis.speak = u => { window.__said.push(u.text); setTimeout(() => u.onend && u.onend(), 5); }; } catch (e) {} });
    const p = await c.newPage(), errs = [], miss = [];
    p.on('pageerror', e => errs.push(e.message)); c.on('page', x => popups.push(x.url()));
    const run = s => p.evaluate(s => window.__T.run(s), s);
    let taps = 0;
    const tap = async (sel, what) => { const l = p.locator(sel).first(); if (!(await l.count()) || !(await l.isVisible())) { miss.push(what); return false; } await l.click(); taps++; await p.waitForTimeout(900); return true; };
    await p.goto(BASE + SUB[lang]); await p.waitForTimeout(1800);
    await p.screenshot({ path: `${SHOTS}/first_run-${lang}-0-landing.png` });
    // 1. one tap: the age
    await tap('#lpQuick [data-qa="7"]', 'age 7');
    await p.waitForTimeout(1200);
    await p.screenshot({ path: `${SHOTS}/first_run-${lang}-1-home.png` });
    const home = await run(`({ home: !!document.querySelector('.home-t'), cc: fam().cc, league: !!document.querySelector('#leagueBtn'), ask: !!document.querySelector('#nameAsk'), age: P.settings.age, kids: KIDS.length })`);
    if (!home.home) miss.push('home after the age');
    if (lang !== 'en' && home.cc === 'US') miss.push('country USA');
    if (home.league) miss.push('league for a new family');
    if (!home.ask) miss.push('name card');
    if (home.age !== 7 || home.kids !== 1) miss.push('child ' + JSON.stringify(home));
    const said = await p.evaluate(() => window.__said.join(' | '));
    const hello = await run('greet()');
    if (!said.includes(hello.split(/[!.?]/)[0])) miss.push('greeting by voice: ' + said.slice(0, 80));
    // the first game: the first step of the path, and its intro if there is one
    await tap('.pd-n.now', 'first step');
    await p.waitForTimeout(800);
    if (await p.locator('.overlay .big').count()) { await tap('.overlay .big', 'go'); await p.waitForTimeout(1200); }
    const inGame = await run(`!document.querySelector('.home-t') && !!document.querySelector('.screen')`);
    if (!inGame) miss.push('game');
    await p.screenshot({ path: `${SHOTS}/first_run-${lang}-2-game.png` });
    if (taps > 3) miss.push('taps ' + taps);
    // 5. the microphone is explained first (the phone has not been asked yet)
    const micAsk = await p.locator('.mic-ask').count();
    if (!micAsk) { await run(`(ROOT.micOff = false, ROOT.micOk = 0, MIC.denied = false, micOn(), 0)`); await p.waitForTimeout(700); }
    if (!(await p.locator('.mic-ask').count())) miss.push('microphone explained');
    else { await p.screenshot({ path: `${SHOTS}/first_run-${lang}-3-mic.png` }); await p.locator('.mic-ask [data-m="0"]').click(); await p.waitForTimeout(300); }
    // 2. a reload: straight to the child (one child, no «Кто играет?»)
    await p.goto(BASE + SUB[lang]); await p.waitForTimeout(1800);
    if (await p.locator('.who-kid').count()) miss.push('who plays with one child');
    if (!(await p.locator('.home-t').count())) miss.push('home after reload');
    // the name later
    if (await p.locator('#naName').count()) { await p.fill('#naName', 'Тина'); await p.click('[data-ng="f"]'); await p.click('#naOk'); await p.waitForTimeout(900);
      if ((await run('P.settings.name')) !== 'Тина') miss.push('name saved'); }
    // 3. «Для взрослых» needs the code
    await run('screenParents()'); await p.waitForTimeout(700);
    if (await p.locator('#guideSec').count()) miss.push('parents open without the code');
    if (await p.locator('#pwKids').count()) { await p.click('#pwKids'); await p.waitForTimeout(500); }
    const code = async () => { for (const k of '2580') { await p.click(`#pgPad [data-k="${k}"]`); await p.waitForTimeout(80); } await p.waitForTimeout(500); };
    if (!(await p.locator('#pgPad').count())) miss.push('code pad');
    else { await code(); await code(); }
    if (!(await p.locator('#guideSec').count())) miss.push('parents after the code');
    await p.evaluate(() => sessionStorage.clear()); // a new visit
    await p.goto(BASE + SUB[lang]); await p.waitForTimeout(1600);
    await run('screenParents()'); await p.waitForTimeout(700);
    if (await p.locator('#guideSec').count()) miss.push('parents open without the code on a new visit');
    if (!(await p.locator('#pgPad').count())) miss.push('code asked after a reload');
    else { await code(); if (!(await p.locator('#guideSec').count())) miss.push('parents after the code (2)'); }
    // 4. a link out: the grown-up's check, nothing opens by itself
    await run('goHome()'); await p.waitForTimeout(900);
    await run(`(GROWN_OK = false, document.querySelector('#stage').insertAdjacentHTML('afterbegin', '<a id="tOut" href="https://example.org/" target="_blank" rel="noopener">out</a>'), 0)`);
    await p.click('#tOut'); await p.waitForTimeout(600);
    if (!(await p.locator('.gu-box').count())) miss.push('gate before a link');
    if (popups.length) miss.push('popup without the gate');
    await p.screenshot({ path: `${SHOTS}/first_run-${lang}-4-gate.png` });
    if (await p.locator('#guNo').count()) await p.click('#guNo');
    // 6. no beacon
    if (beacon.length) miss.push('beacon ' + beacon[0]);
    console.log(`${lang}: taps ${taps} | country ${home.cc} | missing ${JSON.stringify(miss)} | errors ${JSON.stringify(errs)}`);
    if (errs.length || miss.length) bad++;
    await c.close();
  }
  // the site's headers: Cloudflare may not add its beacon to the game
  const wb = fs.readFileSync(path.join(__dirname, '../../www/build.py'), 'utf8');
  if (!/\/play\/\*\\n[^']*no-transform/.test(wb)) { console.log('www/build.py: /play/* without no-transform'); bad++; }
  await b.close(); console.log(bad ? `FAIL (${bad})` : 'OK: first run, gate, code, beacon'); process.exit(bad ? 1 : 0);
})();
