// Extra checks: (a) a brand-new family's first game «Ветерок» when the microphone is not available — what happens, is there a
// way on without blowing; (b) reload after onboarding — the who-plays screen for a one-child family; (c) the win overlay's
// 👍/👎 and the «Домой» mid-step; (d) how long the breath / artic exercises really take (timers in the code).
const L = require('./lib');
(async () => {
  const b = await L.chromium.launch();
  const { p, shot, text, said, run, c } = await L.open(b, { lang: 'ru', seed: null, dev: 'phone', tag: 'misc-newfam' });
  const tap = async (sel) => { const l = p.locator(sel).first(); if (!(await l.count())) { console.log('MISSING', sel); return false; } await l.click(); await p.waitForTimeout(600); return true; };
  await tap('#obStart'); await p.locator('.fe-name').first().fill('Тоша'); await tap('.pick-b >> nth=1');
  if (!(await p.locator('[data-age="5"]').first().isVisible().catch(() => false))) await tap('.fe-agealt>summary');
  await tap('[data-age="5"]'); await tap('#feSave'); await tap('#ksNext'); if (await p.$('#lkNext')) await tap('#lkNext'); await tap('#obGo'); await p.waitForTimeout(800);
  console.log('new family: micOff =', await run('ROOT.micOff'), 'engine =', await run('ROOT.engine'), 'voice =', await run('P.settings.voice'), 'parentPhone =', await run('ROOT.parentPhone'));
  await said();
  L.mark('misc/wind-no-mic');
  await tap('.pd-n.now'); await tap('.overlay button.big'); await p.waitForTimeout(6000);
  const t1 = await text(); const s1 = await said();
  console.log('WIND after 6 s without a microphone: said =', JSON.stringify(s1), '\n text =', JSON.stringify(t1.slice(0, 300)));
  await shot('8-misc-wind-nomic-6s');
  const btns = await p.$$eval('button', es => es.filter(e => e.offsetParent).map(e => (e.innerText || e.getAttribute('aria-label') || '').trim().slice(0, 30)));
  console.log(' buttons:', JSON.stringify(btns));
  // tap the big green mic button, then the 👆 one
  const mic = p.locator('button:has-text("🎤"), .mic, #micBtn').first(); if (await mic.count()) { await mic.click(); await p.waitForTimeout(2500); console.log(' after tapping the mic button: said =', JSON.stringify(await said()), 'text =', JSON.stringify((await text()).slice(0, 200))); await shot('8-misc-wind-after-mic-tap'); }
  const hand = p.locator('button:has-text("👆")').first(); if (await hand.count()) { await hand.click(); await p.waitForTimeout(2500); console.log(' after tapping 👆: said =', JSON.stringify(await said()), 'text =', JSON.stringify((await text()).slice(0, 200)), 'overlay =', !!(await p.$('.overlay'))); await shot('8-misc-wind-after-hand'); }
  // wait more: does the game move on by itself?
  await p.waitForTimeout(12000); console.log(' after 12 s more: said =', JSON.stringify(await said()), 'overlay =', !!(await p.$('.overlay')), 'text =', JSON.stringify((await text()).slice(0, 160)));
  await shot('8-misc-wind-after-20s');
  // (b) reload: the who-plays screen?
  L.mark('misc/reload');
  await p.reload(); await p.waitForTimeout(2000);
  const who = await p.$$('.who-kid'); const wt = await text();
  console.log('RELOAD after onboarding (one child): who-plays screen =', who.length, 'text =', JSON.stringify(wt.slice(0, 200)), 'said =', JSON.stringify(await said()));
  await shot('8-misc-reload-who');
  if (who.length) { await who[0].click(); await p.waitForTimeout(900); console.log(' after tapping the child: home =', !!(await p.$('#pdBox')), 'node =', await p.$eval('.pd-n.now', e => e.innerText.replace(/\s+/g, ' ')).catch(() => null)); }
  // (c) timers in the breath / artic code
  const timers = await run(`(() => { try { return { breathSec: typeof BREATH_SEC !== 'undefined' ? BREATH_SEC : null, articReps: typeof ARTIC_REPS !== 'undefined' ? ARTIC_REPS : null }; } catch (e) { return String(e); } })()`);
  console.log('timers:', JSON.stringify(timers));
  await c.close();
  // (d) a 5-year-old who taps «Домой» in the middle of game 2 of 3 and then says «later»: what does the path show; and the 👎 on a win
  const seed = L.seedOf('ru', { k1: L.kid('Тина', 'f', 5, 'kitty', 'ru', 'r', { set: { likes: ['draw'] } }) });
  const o2 = await L.open(b, { lang: 'ru', seed, dev: 'phone', tag: 'misc-p5' });
  const q = o2.p; const who2 = await q.$$('.who-kid'); if (who2.length) { await who2[0].click(); await q.waitForTimeout(900); }
  await o2.run('GUARD.free = 1');
  L.mark('misc/thumbs');
  await q.click('.pd-n.now'); await q.waitForTimeout(800); const bg = q.locator('.overlay button.big').first(); if (await bg.count()) await bg.click(); await q.waitForTimeout(800);
  const k = await o2.run('nextStepOf(ACTIVE).key'); await o2.run(`finish({ key: ${JSON.stringify(k)} })`); await q.waitForTimeout(800); await o2.said();
  const down = q.locator('.overlay button:has-text("👎")').first(); if (await down.count()) { await down.click(); await q.waitForTimeout(1200); console.log('👎 on a win: said =', JSON.stringify(await o2.said()), 'overlay text =', JSON.stringify(await q.$eval('.overlay', e => e.innerText.replace(/\s+/g, ' ').slice(0, 200)).catch(() => null))); await o2.shot('8-misc-thumbs-down'); }
  const m = await q.evaluate(L.METRICS, 14); console.log('win overlay small taps:', JSON.stringify(m.taps.slice(0, 4)));
  await o2.c.close();
  L.saveLog('log-misc.json');
  await b.close();
})().catch(e => { console.error('FATAL', e); process.exit(1); });
