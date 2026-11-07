// v140: soft Л patches, the colour line, the painting viewer, the tongue exercises as a fairy tale
const { chromium, devices } = require('playwright');
const D = require('path').join(__dirname, 'shots') + '/';
const PAGE = process.argv[2] || 'http://localhost:8781/govorilki/ru/', TAG = process.argv[3] || 'ru';
const HOOK = 'const fam = () => ROOT.families[ROOT.curFam] || null;';
const kid = (name, g, tr, age, fr) => ({ stars: 12, plays: {}, likeG: {}, book: { title: 'Т', log: {} }, settings: { name, gender: g, track: tr, age, friend: fr, onboarded: true, lang: TAG } });
(async () => {
  const b = await chromium.launch(), log = (...a) => console.log(...a);
  const fam = { engine: 'device', micOff: true, srOff: true, parentPhone: true, cur: 'k1', curFam: 'ft', families: { ft: { id: 'ft', name: 'Т', cc: 'PT', kids: ['k1'], grands: [] } }, profiles: { k1: kid('Тина', 'f', 'r', 5, 'kitty') } };
  const c = await b.newContext({ ...devices['iPhone 13'], deviceScaleFactor: 1 });
  await c.route(/ntfy|wikipedia|huggingface|jsdelivr|youtube|workers\.dev/, r => r.abort());
  await c.route(u => /\/(ru|de|pt|en)?\/?(index\.html)?$/.test(u.pathname), async r => { const x = await r.fetch(); let t = await x.text(); t = t.replace(HOOK, HOOK + ' window.__T = { get P() { return P; }, run: s => eval(s) };'); r.fulfill({ response: x, body: t }); });
  await c.addInitScript(s => { window.__said = []; try { speechSynthesis.speak = u => { window.__said.push(u.text); setTimeout(() => u.onend && u.onend(), 5); }; } catch (e) {} if (localStorage.getItem('seeded')) return; localStorage.setItem('seeded', 1); localStorage.setItem('govorilki-v2', JSON.stringify(s)); }, fam);
  const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(PAGE); await p.waitForTimeout(1500);
  const who = await p.$$('.who-kid'); if (who.length) { await who[0].tap(); await p.waitForTimeout(900); }
  const said = () => p.evaluate(() => window.__said.splice(0));
  if (TAG === 'ru') {
    log('soft Л:', JSON.stringify(await p.evaluate(() => window.__T.run(`['Мой альбом с наклейками.', 'Золотая медаль.', 'Новое пальто и соль.', 'Только больше.', 'Это жёлтый мяч.'].map(s => sayParts(s).map(x => sayPatches(x).pairs.map(q => q.join('→')).join(', ')).join(' / '))`))));
    log('stress Кашкайш:', JSON.stringify(await p.evaluate(() => window.__T.run(`sayParts('В Кашкайше есть маяк. Кашкайш у моря.')`))));
    log('speech plan, artic steps:', await p.evaluate(() => window.__T.run(`lessonPlan('speech').filter(x => x.kind === 'artic').map(x => x.name).join(', ')`)));
  }
  // the tongue exercise
  await said(); await p.evaluate(() => window.__T.run('screenArtic(0)')); await p.waitForTimeout(900);
  log('artic hook on screen:', await p.$eval('.af-hook', e => e.textContent).catch(() => 'none'), '| said:', JSON.stringify(await said()));
  await p.click("#go"); for (let w = 0; w < 40 && !(await p.$(".winbox")); w++) await p.waitForTimeout(1000);
  log('artic result:', await p.$eval('.winbox .win-line', e => e.textContent).catch(() => 'no result'), '| stars on:', await p.$$eval('#steps i.on', x => x.length));
  await p.screenshot({ path: D + `v140-${TAG}-artic.png` });
  await p.evaluate(() => window.__T.run('screenArticMenu()')); await p.waitForTimeout(700);
  log('house:', await p.$eval('.af-house h2', e => e.textContent).catch(() => 'none'), '| things:', await p.$$eval('.af-t:not(.off)', x => x.map(e => e.textContent).join('')));
  await p.screenshot({ path: D + `v140-${TAG}-house.png` });
  // the painting viewer, from a tour step
  await p.evaluate(() => window.__T.run("artLoad ? 1 : 0")).catch(() => {});
  const ok = await p.evaluate(() => window.__T.run(`(async () => { await artLoad(); const x = ART.data.p.find(q => ART.tours[q.q]) || ART.data.p[0]; screenArtLook(x, () => goHome()); return x.t; })()`)).catch(e => 'no museum: ' + e.message);
  await p.waitForTimeout(1500); log('tour of:', ok, '| step:', await p.$eval('.al-q', e => e.textContent).catch(() => '?'));
  await said(); await p.click('#alPic'); await p.waitForTimeout(800);
  log('viewer open:', !!(await p.$('.art-fs')), '| back button:', await p.$eval('#fsBack', e => e.textContent).catch(() => 'none'), '| tip said:', JSON.stringify(await said()));
  await p.screenshot({ path: D + `v140-${TAG}-viewer.png` });
  await p.click('#fsIn'); await p.waitForTimeout(400); log('  zoomed, hint:', await p.$eval('#fsHint', e => e.textContent));
  await p.click('#fsBack'); await p.waitForTimeout(800);
  log('  closed:', !(await p.$('.art-fs')), '| story goes on:', JSON.stringify(await said()));
  await p.click('#alPic'); await p.waitForTimeout(600); await p.goBack(); await p.waitForTimeout(800);
  log('  phone back closes it:', !(await p.$('.art-fs')), '| still on the tour:', !!(await p.$('.al-q')));
  log('errs', JSON.stringify(errs));
  await b.close();
})();
