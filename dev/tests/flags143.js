// memory with flags: opens from the «Узнавай» section, pairs match, the voice names the country
const { chromium, devices } = require('playwright');
const D = require('path').join(__dirname, 'shots') + '/';
const PAGE = process.argv[2] || 'http://localhost:8781/govorilki/ru/', TAG = process.argv[3] || 'ru';
const HOOK = 'const fam = () => ROOT.families[ROOT.curFam] || null;';
const kid = (name, g, tr, age, fr) => ({ stars: 5, plays: {}, learn: {}, book: { title: 'Т', log: {} }, settings: { name, gender: g, track: tr, age, friend: fr, onboarded: true, lang: TAG } });
(async () => {
  const b = await chromium.launch(), log = (...a) => console.log(...a);
  const fam = { engine: 'device', micOff: true, srOff: true, parentPhone: true, cur: 'k1', curFam: 'main', families: { main: { id: 'main', name: 'Т', cc: 'PT', kids: ['k1'], grands: [] } }, profiles: { k1: kid('Тина', 'f', 'r', 5, 'kitty') } };
  const c = await b.newContext({ ...devices['iPhone 13'], deviceScaleFactor: 1 });
  await c.route(/ntfy|wikipedia|huggingface|jsdelivr|youtube|wikimedia|workers\.dev/, r => r.abort());
  await c.route(u => /\/(ru|de|pt|en)?\/?(index\.html)?$/.test(u.pathname), async r => { const x = await r.fetch(); let t = await x.text(); t = t.replace(HOOK, HOOK + ' window.__T = { get P() { return P; }, run: s => eval(s) };'); r.fulfill({ response: x, body: t }); });
  await c.addInitScript(s => { window.__said = []; try { speechSynthesis.speak = u => { window.__said.push(u.text); setTimeout(() => u.onend && u.onend(), 5); }; } catch (e) {} if (localStorage.getItem('seeded')) return; localStorage.setItem('seeded', 1); localStorage.setItem('govorilki-v2', JSON.stringify(s)); }, fam);
  const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(PAGE); await p.waitForTimeout(1500);
  const who = await p.$$('.who-kid'); if (who.length) { await who[0].tap(); await p.waitForTimeout(900); }
  const info = await p.evaluate(() => { const g = window.__T.run("GAMES.find(x => x.id === 'flag-memory')"), o = window.__T.run("GAMES.find(x => x.id === 'art-memory')"); return { name: g.name, grp: g.grp, inside: g.inside, old: !!o }; });
  // the game lives in «Путешествие по миру» now: a row under the globe, not a tile in «Узнаём»
  await p.evaluate(() => { window.__T.run("P.homeTab = 'discover'; goHome()"); }); await p.waitForTimeout(700);
  log('tile in Узнаём (want 0):', await p.$$eval('.tile[data-id="flag-memory"]', x => x.length));
  await p.evaluate(() => window.__T.run('TRAVEL.screen()')); await p.waitForTimeout(700);
  log('journey row:', await p.$eval('#tvMem', e => e.innerText.replace(/\s+/g, ' ')).catch(() => 'MISSING'));
  await p.screenshot({ path: D + `f143-${TAG}-journey.png` });
  log(TAG, JSON.stringify(info));
  await p.evaluate(() => window.__T.run("GAMES.find(x => x.id === 'flag-memory').go()")); await p.waitForTimeout(800);
  log('cards at start:', await p.$$eval('.mc', x => x.length), 'svg flags:', await p.$$eval('.fm-svg', x => x.length));
  const map = await p.$$eval('.mc', x => x.map(e => e.querySelector('.fm-svg').innerHTML));
  await p.screenshot({ path: D + `f143-${TAG}-start.png` });
  const idx = [0, map.findIndex((m, i) => i > 0 && m === map[0])];
  const cards = await p.$$('.mc'); await cards[idx[0]].click(); await cards[idx[1]].click(); await p.waitForTimeout(700);
  log('matched:', await p.$$eval('.mc.done', x => x.length), 'toast:', await p.$eval('#amOut', e => e.textContent), 'said:', JSON.stringify(await p.evaluate(() => window.__said.slice(-2))));
  await p.screenshot({ path: D + `f143-${TAG}-match.png` });
  const seen = new Set(idx);
  for (let i = 0; i < map.length; i++) { if (seen.has(i)) continue; const j = map.findIndex((m, k) => k > i && m === map[i]); seen.add(i); seen.add(j); await cards[i].click(); await cards[j].click(); await p.waitForTimeout(450); }
  await p.waitForTimeout(2400);
  await p.click('.winbox [data-a="menu"]').catch(() => {}); await p.waitForTimeout(700);
  log('back to the journey:', !!await p.$('#tvMem'));
  log('after win:', (await p.evaluate(() => document.body.innerText)).slice(0, 80).replace(/\n/g, ' | '), 'wins:', await p.evaluate(() => window.__T.P.flagMem && window.__T.P.flagMem.w));
  await p.evaluate(() => window.__T.run('screenMuseum()')); await p.waitForTimeout(900);
  log('museum tabs:', await p.$$eval('#artTabs [data-tab]', x => x.map(e => e.dataset.tab).join(',')));
  log('errs', JSON.stringify(errs));
  await b.close();
})();
