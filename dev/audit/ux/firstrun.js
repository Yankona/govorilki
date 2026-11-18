// 1. First run of a brand-new family on /ru/ (phone), a 5-year-old girl Тина. Every tap is counted and screenshotted.
const L = require('./lib');
const AGE = +(process.argv[2] || 5), DEV = process.argv[3] || 'phone';
(async () => {
  const b = await L.chromium.launch();
  const { p, shot, text, said, run } = await L.open(b, { lang: 'ru', seed: null, dev: DEV, tag: 'firstrun' + AGE });
  let n = 0, taps = 0; const steps = [];
  const desc = async (name, tapped) => {
    n++; const f = await shot(`1-firstrun${AGE}-${DEV}-${String(n).padStart(2, '0')}-${name}`);
    const t = await text(); const btns = await p.$$eval('button, a[href], summary, input', es => es.filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.top < innerHeight; }).map(e => (e.tagName === 'INPUT' ? '[input ' + (e.placeholder || e.type) + ']' : (e.innerText || e.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 40))).filter(Boolean));
    const words = t.split(/\s+/).length; const sp = await said();
    steps.push({ n, name, tapped, taps, words, said: sp, btns: btns.slice(0, 30), text: t.slice(0, 1200), shot: f });
    console.log(`\n=== ${n}. ${name} (after: ${tapped || '-'}; taps so far ${taps}; words on screen ${words}; voice: ${JSON.stringify(sp).slice(0, 200)})\n` + t.slice(0, 900) + '\nBUTTONS: ' + btns.join(' | '));
  };
  const tap = async (sel, what) => { const l = p.locator(sel).first(); if (!(await l.count())) { console.log('MISSING', what, sel); return false; } await l.click(); taps++; await p.waitForTimeout(700); return true; };
  await desc('landing');
  await tap('#obStart', 'start'); await desc('family-form', 'Начать: создать семью');
  await p.locator('.fe-name').first().fill('Тина'); taps++;  // typing counts as one action
  await tap('.pick-b >> nth=0', 'girl');
  // age: is there a visible age button? else the fold
  const ageBtn = p.locator(`[data-age="${AGE}"]`).first();
  if (!(await ageBtn.isVisible().catch(() => false))) await tap('.fe-agealt>summary', 'age fold');
  await tap(`[data-age="${AGE}"]`, 'age'); await desc('family-filled', 'name, girl, age');
  await tap('#feSave', 'save'); await desc('kid-settings', 'Сохранить');
  // dump what decisions are on this screen
  const sections = await p.$$eval('h2, h3, legend, .ks-h, summary', es => es.filter(e => e.offsetParent).map(e => e.innerText.trim().slice(0, 60)));
  console.log('SECTIONS on kid-settings:', sections);
  await p.evaluate(() => { const s = document.querySelector('#stage') || document.scrollingElement; s.scrollTop = 99999; }); await desc('kid-settings-bottom', 'scrolled');
  await tap('#ksNext', 'next'); await desc('after-settings', 'Дальше');
  let guard = 0;
  while (guard++ < 8) {
    if (await p.$('#lookPick')) { await tap('#lkNext', 'look next'); await desc('after-look', 'look: пропустить/дальше'); continue; }
    if (await p.$('#obGo')) { await tap('#obGo', 'go'); await desc('home', 'Поехали'); break; }
    const big = p.locator('.screen button.big:visible').first();
    if (await big.count()) { const t = await big.innerText(); await big.click(); taps++; await p.waitForTimeout(800); await desc('next-' + guard, t.trim()); continue; }
    break;
  }
  // home: what does the child see / hear; the first step
  const home = await p.$('.pd-n.now');
  console.log('home: path step present:', !!home, 'overlays:', (await p.$$('.overlay')).length);
  await p.evaluate(() => { const s = document.querySelector('#stage') || document.scrollingElement; s.scrollTop = 800; }); await desc('home-scrolled', 'scroll');
  await p.evaluate(() => { const s = document.querySelector('#stage') || document.scrollingElement; s.scrollTop = 0; });
  await tap('.pd-n.now', 'first step'); await desc('first-step', 'первый шаг дорожки');
  // maybe an intro overlay with a big button
  for (let i = 0; i < 3; i++) { const go = p.locator('.overlay button.big:visible').first(); if (await go.count()) { const t = await go.innerText(); await go.click(); taps++; await p.waitForTimeout(1200); await desc('first-step-' + (i + 2), t.trim()); } else break; }
  const inGame = await p.evaluate(() => !document.querySelector('.screen.home-t') && !!document.querySelector('.screen'));
  console.log(`\nTOTAL taps to first game: ${taps}; screens: ${n}; in game: ${inGame}`);
  // back button mid-game
  await p.goBack().catch(() => {}); await p.waitForTimeout(800); await desc('after-browser-back', 'browser back');
  L.fs.writeFileSync(`firstrun${AGE}-${DEV}.json`, JSON.stringify(steps, null, 1));
  L.saveLog(`log-firstrun${AGE}-${DEV}.json`);
  await b.close();
})();
