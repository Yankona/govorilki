// v136 «Дорожка дня»: steps, states, the chest, the friend's line, the wide layout and a resize
const { chromium, devices } = require('playwright');
const D = require('path').join(__dirname, 'shots') + '/';
const PAGE = process.argv[2] || 'http://localhost:8781/govorilki/ru/', TAG = process.argv[3] || 'ru';
const kid = (name, g, tr, age, fr, stars) => ({ stars, plays: {}, likeG: {}, book: { title: 'Т', log: {} }, settings: { name, gender: g, track: tr, age, friend: fr, onboarded: true, lang: TAG } });
const HOOK = 'const fam = () => ROOT.families[ROOT.curFam] || null;';
async function open(b, cur, opt) {
  const fam = { engine: 'device', micOff: true, srOff: true, parentPhone: true, cur, curFam: 'ft', families: { ft: { id: 'ft', name: 'Т', cc: 'PT', kids: ['k1', 'k2'], grands: [] } }, profiles: { k1: kid('Тина', 'f', 'r', 5, 'kitty', 35), k2: kid('Тоша', 'm', 'l', 8, 'tiger', 140) } };
  const c = await b.newContext(opt);
  await c.route(/ntfy|wikipedia|huggingface|jsdelivr|youtube|wikimedia|workers\.dev/, r => r.abort());
  await c.route(u => /\/(ru|de|pt|en)?\/?(index\.html)?$/.test(u.pathname), async r => { const x = await r.fetch(); let t = await x.text(); t = t.replace(HOOK, HOOK + ' window.__T = { get P() { return P; }, get ROOT() { return ROOT; }, run: s => eval(s) };'); r.fulfill({ response: x, body: t }); });
  await c.addInitScript(s => { window.__said = []; try { speechSynthesis.speak = u => { window.__said.push(u.text); setTimeout(() => u.onend && u.onend(), 5); }; } catch (e) {} if (localStorage.getItem('seeded')) return; localStorage.setItem('seeded', 1); localStorage.setItem('govorilki-v2', JSON.stringify(s)); }, fam);
  const p = await c.newPage(); p.errs = []; p.on('pageerror', e => p.errs.push(e.message));
  await p.goto(PAGE); await p.waitForTimeout(1500);
  const who = await p.$$('.who-kid'); if (who.length) { await who[cur === 'k1' ? 0 : 1].click(); await p.waitForTimeout(1000); }
  return p;
}
const nodes = p => p.evaluate(() => [...document.querySelectorAll('.pd-n')].map(n => `${n.querySelector('.pd-lb b').textContent}:${n.className.replace(/pd-n|l-go|pd-chest/g, '').trim()}${n.querySelector('.pd-cta') ? '[' + n.querySelector('.pd-cta').textContent + ']' : ''}`));
const said = p => p.evaluate(() => { const s = window.__said.slice(); window.__said = []; return s; });
(async () => {
  const b = await chromium.launch(), log = (...a) => console.log(...a);
  let p = await open(b, 'k1', { ...devices['iPhone 13'], deviceScaleFactor: 1 });
  log('start:', JSON.stringify(await nodes(p)), '|', await p.$eval('.pd-say', e => e.textContent));
  await said(p); await p.click('#pdFriend'); await p.waitForTimeout(400); log('friend says:', JSON.stringify(await said(p)));
  await p.click('#pdChest'); await p.waitForTimeout(400); log('closed chest:', JSON.stringify(await said(p)));
  // labels never cut by the screen
  log('inside the screen:', await p.evaluate(() => [...document.querySelectorAll('.pd-n')].every(n => { const r = n.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth; })));
  // halfway: speech done, reading started
  await p.evaluate(() => window.__T.run("(() => { const k = dayKey(); P.days[k] = { speech: 1 }; const t = todayState(); t.done.read = [lessonPlan('read')[0].key]; save(); goHome(); })()")); await p.waitForTimeout(800);
  log('halfway:', JSON.stringify(await nodes(p)), '|', await p.$eval('.pd-say', e => e.textContent), '| bar', await p.$eval('.pd-bar i', e => e.style.width));
  await p.screenshot({ path: D + `p136-${TAG}-half.png` });
  // the orange step opens the lesson
  await p.click('.pd-n.now'); await p.waitForTimeout(1200);
  log('now step opens:', !(await p.$('#tabBar')) ? await p.$eval('.bar h1', e => e.textContent).catch(() => 'a screen') : 'still home');
  // all done: the chest
  await p.evaluate(() => window.__T.run("(() => { P.days[dayKey()] = { speech: 1, read: 1, math: 1, soro: 1 }; save(); goHome(); })()")); await p.waitForTimeout(800);
  log('all done:', JSON.stringify(await nodes(p)), '|', await p.$eval('.pd-say', e => e.textContent));
  await p.screenshot({ path: D + `p136-${TAG}-ready.png` });
  const s0 = await p.evaluate(() => window.__T.P.stars);
  await said(p); await p.click('#pdChest'); await p.waitForTimeout(900);
  log('chest opened: +', (await p.evaluate(() => window.__T.P.stars)) - s0, 'stars |', await p.$eval('.pd-win h2', e => e.textContent).catch(() => 'no overlay'), '|', JSON.stringify(await said(p)));
  await p.screenshot({ path: D + `p136-${TAG}-chest.png` });
  await p.click('.pd-win [data-a]'); await p.waitForTimeout(800);
  log('after:', JSON.stringify(await nodes(p)), '|', await p.$eval('.pd-say', e => e.textContent));
  const s1 = await p.evaluate(() => window.__T.P.stars); await p.click('#pdChest'); await p.waitForTimeout(400);
  log('second tap: stars same', (await p.evaluate(() => window.__T.P.stars)) === s1, JSON.stringify(await said(p)));
  log('errs', JSON.stringify(p.errs));
  // the older child, a laptop, then a narrow window
  p = await open(b, 'k2', { viewport: { width: 1440, height: 900 } });
  log('laptop:', JSON.stringify(await p.evaluate(() => ({ side: !!document.querySelector('.pd-side'), sideShown: getComputedStyle(document.querySelector('.pd-side')).display, rail: getComputedStyle(document.querySelector('#tabBar')).width, logo: getComputedStyle(document.querySelector('.rail-logo')).display, cols: getComputedStyle(document.querySelector('#stage')).gridTemplateColumns, over: document.documentElement.scrollWidth > innerWidth }))));
  await p.screenshot({ path: D + `p136-${TAG}-desk.png` });
  await p.click('#pdWeek'); await p.waitForTimeout(700); log('week card opens:', await p.$eval('.bar h1', e => e.textContent).catch(() => '?'));
  await p.evaluate(() => window.__T.run('goHome()')); await p.waitForTimeout(600);
  await p.setViewportSize({ width: 800, height: 1000 }); await p.waitForTimeout(700);
  log('narrow window:', JSON.stringify(await p.evaluate(() => ({ sideShown: getComputedStyle(document.querySelector('.pd-side')).display, bar: getComputedStyle(document.querySelector('#tabBar')).bottom, path: document.querySelector('.pd-svg').getAttribute('width'), over: document.documentElement.scrollWidth > innerWidth }))));
  await p.screenshot({ path: D + `p136-${TAG}-narrow.png` });
  // other tabs on a laptop: the tiles in the middle
  await p.setViewportSize({ width: 1440, height: 900 }); await p.waitForTimeout(300);
  await p.click('.tb[data-tab="create"]'); await p.waitForTimeout(900);
  log('create tab on a laptop:', JSON.stringify(await p.evaluate(() => ({ tiles: document.querySelectorAll('.home-t .tile').length, w: Math.round(document.querySelector('#stage .group').getBoundingClientRect().width), over: document.documentElement.scrollWidth > innerWidth }))));
  await p.screenshot({ path: D + `p136-${TAG}-create.png` });
  log('errs', JSON.stringify(p.errs));
  await b.close();
})();
