// v141: the journey — the family's own places first (Кашкайш…), the new sections and stories, a story read aloud, the quiz
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
  await p.evaluate(() => window.__T.run('TRAVEL.screen()')); await p.waitForTimeout(900);
  log(TAG, FID, 'places:', JSON.stringify(await p.evaluate(() => [...document.querySelectorAll('.tv-h')].map(h => h.textContent + ': ' + [...h.nextElementSibling.querySelectorAll('.tv-c b')].map(b => b.textContent + '(' + b.nextElementSibling.textContent + ')').join(', ')))));
  await p.screenshot({ path: D + `t141-${TAG}-travel.png` });
  const first = await p.$('.tv-c'); await first.click(); await p.waitForTimeout(900);
  log('  first place:', await p.$eval('.bar h1', e => e.textContent).catch(() => '?'), '| stories:', await p.$$eval('.story-c', x => x.length), '| read mark kept for pt-boca:', await p.evaluate(() => window.__T.run("learnDone('pt-boca')")));
  await p.screenshot({ path: D + `t141-${TAG}-cascais.png` });
  const cards = await p.$$('.story-c'); await cards[cards.length - 1].click(); await p.waitForTimeout(1200);
  log('  last story:', await p.$eval('.bar h1, .story h2', e => e.textContent).catch(() => '?'), '| said:', JSON.stringify((await p.evaluate(() => window.__said.slice(-3)))).slice(0, 300));
  await p.screenshot({ path: D + `t141-${TAG}-story.png` });
  if (TAG === 'ru') {
    await p.evaluate(() => window.__T.run("screenLearn('russia')")); await p.waitForTimeout(800);
    log('  Россия:', await p.$$eval('.story-c', x => x.length), 'stories');
  }
  await p.evaluate(() => window.__T.run('TRAVEL.quiz()')); await p.waitForTimeout(900);
  log('  quiz:', await p.$eval('.tv-t', e => e.textContent).catch(() => '?'), '|', await p.$$eval('.tv-o', x => x.map(e => e.textContent).join(' / ')));
  log('errs', JSON.stringify(errs));
  await b.close();
})();
