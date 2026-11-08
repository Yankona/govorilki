// v144: topic Old times - tile, sections, a story, the timeline quiz (ru/en/pt/de)
const { chromium, devices } = require('playwright');
const D = require('path').join(__dirname, 'shots') + '/';
const PAGE = process.argv[2] || 'http://localhost:8781/govorilki/ru/', TAG = process.argv[3] || 'ru', FID = process.argv[4] || 'main';
const HOOK = 'const fam = () => ROOT.families[ROOT.curFam] || null;';
const kid = (name, g, tr, age, fr) => ({ stars: 5, plays: {}, learn: { 'pt-boca': 1 }, book: { title: 'Т', log: {} }, settings: { name, gender: g, track: tr, age, friend: fr, onboarded: true, lang: TAG } });
(async () => {
  const b = await chromium.launch(), log = (...a) => console.log(...a);
  const fam = { engine: 'device', micOff: true, srOff: true, parentPhone: true, cur: 'k1', curFam: FID, families: { [FID]: { id: FID, name: 'Т', cc: 'PT', kids: ['k1'], grands: [{ id: 'g1', name: 'Бабушка', she: true, cc: 'RU' }] } }, profiles: { k1: kid('Тина', 'f', 'r', 5, 'kitty') } };
  const c = await b.newContext({ ...devices['iPhone 13'], deviceScaleFactor: 1 });
  await c.route(/ntfy|wikipedia|huggingface|jsdelivr|youtube|wikimedia|workers\.dev/, r => r.abort());
  await c.route(u => /\/(ru|de|pt|en)?\/?(index\.html)?$/.test(u.pathname), async r => { const x = await r.fetch(); let t = await x.text(); t = t.replace(HOOK, HOOK + ' window.__T = { get P() { return P; }, run: s => eval(s) };'); r.fulfill({ response: x, body: t }); });
  await c.addInitScript(s => { window.__said = []; try { speechSynthesis.speak = u => { window.__said.push(u.text); setTimeout(() => u.onend && u.onend(), 5); }; } catch (e) {} if (localStorage.getItem('seeded')) return; localStorage.setItem('seeded', 1); localStorage.setItem('govorilki-v2', JSON.stringify(s)); }, fam);
  const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(PAGE); await p.waitForTimeout(1500);
  const who = await p.$$('.who-kid'); if (who.length) { await who[0].tap(); await p.waitForTimeout(900); }
  const tile = await p.evaluate(() => { window.__T.run('goHome()'); return window.__T.run('LEARN.old.name'); }).then(async n => { await p.waitForTimeout(600); return (await p.evaluate(() => document.body.innerText)).includes(n); });
  log(TAG, 'tile on home:', tile, '| in grp10:', await p.evaluate(() => window.__T.run("(() => { const g = GAMES.find(x => x.id === 'learn-old'); return !!g && !(g.hide && g.hide()) && g.grp === 10 && g.name + ' / ' + g.prog(); })()")));
  await p.evaluate(() => window.__T.run("screenLearn('old')")); await p.waitForTimeout(800);
  log('  title:', await p.$eval('.bar h1', e => e.textContent).catch(() => '?'), '| sections:', await p.$$eval('.sec-h', x => x.map(e => e.textContent).join(' | ')), '| stories:', await p.$$eval('.story-c', x => x.length), '| quiz btn:', !!(await p.$('#oldQuiz')));
  await p.screenshot({ path: D + `o144-${TAG}-topic.png` });
  if (TAG === 'ru') {
    await (await p.$$('.story-c'))[8].click(); await p.waitForTimeout(1500);
    log('  story:', await p.$eval('.story h2', e => e.textContent), '| answers:', await p.$$eval('.ans', x => x.length));
    await p.screenshot({ path: D + 'o144-ru-story.png' });
    await p.evaluate(() => window.__T.run("screenLearn('old')")); await p.waitForTimeout(500);
  }
  await p.click('#oldQuiz'); await p.waitForTimeout(800);
  let okc = 0;
  for (let i = 0; i < 8; i++) {
    const opts = await p.$$('.tv-o'); if (opts.length !== 2) { log('  bad opts', opts.length, 'round', i); break; }
    await opts[i % 2].click(); await p.waitForTimeout(300);
    if (i === 0) { log('  answer text:', await p.$eval('#tvAns', e => e.textContent).catch(() => '?')); await p.screenshot({ path: D + `o144-${TAG}-quiz.png` }); }
    await p.click('#tvNext'); await p.waitForTimeout(400); okc++;
  }
  log('  rounds done:', okc, '| end screen:', (await p.evaluate(() => document.body.innerText)).replace(/\s+/g, ' ').slice(0, 120));
  log('errs', JSON.stringify(errs));
  await b.close();
})();
