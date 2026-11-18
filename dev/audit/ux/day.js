// 2. «Простой день» walk-through per persona: the path, every game screen (text / voice / buttons), the win overlays,
// stars and stickers per step, the chest, the doors, the favourite, and then the break flows (back, reload, home mid-game).
// node day.js <persona: p5|p7|p9l|p8tri> [phone|laptop]
const L = require('./lib');
const WHO = process.argv[2] || 'p5', DEV = process.argv[3] || 'phone';
const PERSONAS = {
  p5: { name: 'Тина', g: 'f', age: 5, fr: 'kitty', track: 'r', likes: ['draw', 'unicorn'] },
  p7: { name: 'Тоша', g: 'm', age: 7, fr: 'tiger', track: 'r', likes: ['space', 'chess'] },
  p9l: { name: 'Тим', g: 'm', age: 9, fr: 'tiger', track: 'l', likes: ['chess', 'space', 'math'] },
  p8tri: { name: 'Тина', g: 'f', age: 8, fr: 'panda', track: 'r', likes: ['draw', 'music'], langs: ['ru', 'pt', 'en'], school: ['pt'], learn: ['en'] }
};
const PP = PERSONAS[WHO];
(async () => {
  const b = await L.chromium.launch();
  const prof = L.kid(PP.name, PP.g, PP.age, PP.fr, 'ru', PP.track, { set: { likes: PP.likes, ...(PP.langs ? { langs: PP.langs, school: PP.school, learn: PP.learn } : {}) } });
  const seed = L.seedOf('ru', { k1: prof });
  const { p, shot, text, said, run } = await L.open(b, { lang: 'ru', seed, dev: DEV, tag: 'day-' + WHO });
  const out = { who: WHO, persona: PP, steps: [], notes: [] };
  const S = (name) => shot(`2-day-${WHO}-${DEV}-${name}`);
  const note = (...a) => { const s = a.join(' '); out.notes.push(s); console.log(s); };
  const stars = () => run('P.stars'), stk = () => run('stickerCount()');
  const btns = () => p.$$eval('button, a[href], summary', es => es.filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.top < innerHeight && !e.closest('.overlay ~ *'); }).map(e => (e.innerText || e.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 40)).filter(Boolean));
  const overlayText = () => p.$eval('.overlay:last-of-type', e => e.innerText.replace(/\s+/g, ' ').trim().slice(0, 400)).catch(() => null);
  const who = await p.$$('.who-kid'); if (who.length) { await who[0].click(); await p.waitForTimeout(900); }
  const dismissOffer = async () => { const o = await p.$eval('.lt-offer', e => e.innerText.replace(/\s+/g, ' ').trim()).catch(() => null); if (o) { note('  [offer on home] ' + o); const l = p.locator('.lt-offer [data-a="later"]').first(); if (await l.count()) await l.click(); else await run("document.querySelectorAll('.lt-offer').forEach(x => x.remove())"); await p.waitForTimeout(400); } return o; };
  L.mark(`day-${WHO}/home`);
  await run('GUARD.free = 1');
  // --- home before the path
  const home0 = await text(); const said0 = await said();
  const must = await run('SIMPLE.must()'), opt = await run('SIMPLE.opt()');
  const plans = {}; for (const id of must) plans[id] = await run(`lessonPlan('${id}').map(x => ({ key: x.key, kind: x.kind, name: (GAMES.find(g => g.id === (String(x.key).split('@')[0])) || {}).name || x.key }))`);
  const little = await run('LITTLE.on()');
  const doors = await p.$$eval('.sd-door', ds => ds.map(d => d.innerText.replace(/\s+/g, ' ').trim()));
  const fav = await p.$eval('#sdFav', e => e.innerText.replace(/\s+/g, ' ').trim()).catch(() => null);
  const m0 = await p.evaluate(L.METRICS, 14);
  note(`HOME: little=${little} must=${must} opt=${opt} doors=${JSON.stringify(doors)} fav=${JSON.stringify(fav)} stars=${await stars()} stickers=${await stk()} voiceOnArrival=${JSON.stringify(said0)}`);
  note(`PLANS: ${JSON.stringify(plans)}`);
  note(`HOME metrics: texts=${m0.textN} small(<14px)=${m0.small.length} taps<44=${m0.taps.length} ${JSON.stringify(m0.taps.slice(0, 5))}`);
  out.home = { text: home0, said: said0, must, opt, plans, doors, fav, little, metrics: m0 };
  await S('00-home');
  // --- walk every step
  let gamesN = 0, overlaysN = 0;
  for (const id of must) {
    const st = { id, games: [], stars0: await stars(), stk0: await stk(), overlays: [] };
    L.mark(`day-${WHO}/step-${id}`);
    await run('goHome()'); await p.waitForTimeout(500); await dismissOffer();
    const nd = p.locator(`.pd-n[data-l="${id}"]`).first();
    if (!(await nd.count())) { note('no node for', id); continue; }
    await nd.scrollIntoViewIfNeeded(); await nd.click(); await p.waitForTimeout(1000);
    // intro overlay?
    let ov = await overlayText();
    if (ov) { const v = await said(); st.intro = { text: ov, said: v }; overlaysN++; await S(`10-${id}-intro`); const bg = p.locator('.overlay button.big').first(); if (await bg.count()) await bg.click(); await p.waitForTimeout(1200); }
    for (let i = 0; i < 13; i++) {
      // in a game: what is on the screen, what was said
      const key = await run('(() => { const s = nextStepOf(ACTIVE); return s ? s.key : null; })()');
      if (!key) break;
      const t = await text(); const v = await said(); const bb = await btns(); const m = await p.evaluate(L.METRICS, 14);
      const title = await p.$eval('.screen h1, .screen .ttl, .screen header b, .screen .top b', e => e.innerText.trim()).catch(() => '');
      const bubble = await p.$eval('.said, .said-card, .fr-bub, .bub', e => e.innerText.trim().slice(0, 200)).catch(() => '');
      const inst = (t.match(/[А-ЯЁ][^\n]{12,}/g) || []).slice(0, 4);
      const g = { key, title, bubble, said: v, buttons: bb.slice(0, 16), textWords: t.split(/\s+/).length, instructions: inst, small: m.small.length, smallTaps: m.taps.length, overflowX: m.overflowX, shot: await S(`11-${id}-g${i + 1}-${String(key).replace(/[^a-z0-9@-]/gi, '')}`) };
      // is the text on screen also spoken? (a rough check: any spoken sentence shares 3 words with the screen)
      const spoken = v.join(' ').toLowerCase(); const words = inst.join(' ').toLowerCase().split(/[^а-яёa-z]+/).filter(w => w.length > 3);
      g.textSpokenShare = words.length ? +(words.filter(w => spoken.includes(w)).length / words.length).toFixed(2) : null;
      st.games.push(g); gamesN++;
      console.log(`  game ${i + 1} ${key} «${title}» said=${JSON.stringify(v).slice(0, 160)} words=${g.textWords} small=${m.small.length} taps<44=${m.taps.length} spokenShare=${g.textSpokenShare}`);
      // finish it as a child would who played it through
      const s0 = await stars(), k0 = await stk();
      await run(`finish({ key: ${JSON.stringify(key)} })`); await p.waitForTimeout(900);
      ov = await overlayText(); const v2 = await said();
      const s1 = await stars(), k1 = await stk();
      st.overlays.push({ after: key, text: ov, said: v2, starsGained: s1 - s0, stickersGained: k1 - k0 }); overlaysN++;
      console.log(`   → win: +${s1 - s0}★ +${k1 - k0} stickers «${(ov || '').slice(0, 120)}»`);
      await S(`12-${id}-win${i + 1}`);
      const done = await run(`!todayState().done['${id}'].length && !!dayCounts(dayKey())['${id}']`);
      if (done) { st.doneOverlay = ov; break; }
      const nx = p.locator('.overlay [data-a="next"]').first();
      if (await nx.count()) { await nx.click(); await p.waitForTimeout(1200); } else { note('no next button after', key, JSON.stringify((await btns()).slice(0, 8))); break; }
    }
    st.stars1 = await stars(); st.stk1 = await stk();
    note(`STEP ${id}: ${st.games.length} games, stars ${st.stars0}→${st.stars1} (+${st.stars1 - st.stars0}), stickers ${st.stk0}→${st.stk1}; done overlay: «${(st.doneOverlay || '').slice(0, 160)}»`);
    out.steps.push(st);
    // leave the done overlay the way the buttons offer
    const hb = p.locator('.overlay [data-a="home"]').first(); if (await hb.count()) { await hb.click(); await p.waitForTimeout(900); }
  }
  // --- after the path: the chest
  L.mark(`day-${WHO}/chest`);
  await run('goHome()'); await p.waitForTimeout(600);
  const homeT = await text(); const line = (homeT.match(/[^\n]*(сундук|Сундук|Тропа|Миссия)[^\n]*/g) || []).slice(0, 3);
  note('HOME after path:', JSON.stringify(line));
  await S('20-home-path-done');
  const s0 = await stars(), k0 = await stk();
  await p.click('#pdChest'); await p.waitForTimeout(1200);
  const chestOv = await overlayText(); const chestSaid = await said();
  out.chest = { text: chestOv, said: chestSaid, starsGained: (await stars()) - s0, stickersGained: (await stk()) - k0 };
  note(`CHEST: +${out.chest.starsGained}★ +${out.chest.stickersGained} stickers «${(chestOv || '').slice(0, 200)}» said=${JSON.stringify(chestSaid)}`);
  await S('21-chest');
  const ura = p.locator('.overlay button.big').first(); if (await ura.count()) await ura.click(); await p.waitForTimeout(1000);
  // --- after the chest: home, doors, favourite
  L.mark(`day-${WHO}/after-chest`);
  const homeA = await text(); const saidA = await said();
  const doorsA = await p.$$eval('.sd-door', ds => ds.map(d => (d.classList.contains('open') ? 'OPEN ' : 'shut ') + d.innerText.replace(/\s+/g, ' ').trim()));
  const favA = await p.$eval('#sdFav', e => (e.classList.contains('open') ? 'OPEN ' : 'shut ') + e.innerText.replace(/\s+/g, ' ').trim()).catch(() => null);
  const ltCol = !!(await p.$('#ltCol'));
  note(`AFTER CHEST: doors=${JSON.stringify(doorsA)} fav=${JSON.stringify(favA)} colouring=${ltCol} said=${JSON.stringify(saidA)} stars=${await stars()} stickers=${await stk()}`);
  await S('22-home-after-chest');
  await p.$eval('#sdBox', e => e.scrollIntoView()).catch(() => {}); await S('23-home-after-chest-doors');
  out.after = { text: homeA, doors: doorsA, fav: favA, ltCol };
  const d0 = await p.$('.sd-door.open');
  if (d0) { await d0.click(); await p.waitForTimeout(900); const rt = await text(); const rs = await said(); out.room = { text: rt.slice(0, 600), said: rs, tiles: await p.$$eval('.sd-room .tile', ts => ts.map(t => t.innerText.replace(/\s+/g, ' ').trim().slice(0, 40))) }; note(`ROOM: tiles=${JSON.stringify(out.room.tiles)} said=${JSON.stringify(rs)}`); await S('24-room');
    // open the first tile of the room and come back with the game's back button
    const tl = await p.$('.sd-room .tile'); if (tl) { await tl.click(); await p.waitForTimeout(1200); await S('25-room-game'); note('ROOM GAME said=', JSON.stringify(await said()), 'buttons=', JSON.stringify((await btns()).slice(0, 8))); }
    await run('goHome()'); await p.waitForTimeout(700); }
  if (await p.$('#sdFav.open')) { await p.click('#sdFav'); await p.waitForTimeout(1200); note('FAV opened: said=', JSON.stringify(await said()), 'buttons=', JSON.stringify((await btns()).slice(0, 8))); await S('26-fav-game'); await run('goHome()'); await p.waitForTimeout(700); }
  // the chest again, the path again
  await p.click('#pdChest').catch(() => {}); await p.waitForTimeout(700); note('CHEST again said=', JSON.stringify(await said()));
  const s2 = await stars(); await run(`startLesson('${must[0]}')`); await p.waitForTimeout(800); const k2 = await run('(() => { const s = nextStepOf(ACTIVE); return s ? s.key : null; })()');
  if (k2) { await run(`finish({ key: ${JSON.stringify(k2)} })`); await p.waitForTimeout(600); note(`REPLAY first game of a done step: +${(await stars()) - s2}★ (fairStars)`, JSON.stringify(await overlayText()).slice(0, 160)); }
  await run('goHome()'); await p.waitForTimeout(600);
  const final = await text(); out.final = final;
  note(`FINAL stars=${await stars()} stickers=${await stk()} (day started with 5★)`);
  await S('27-home-final');
  // --- break flows on a fresh day: back button, reload mid-step, home mid-game
  L.mark(`day-${WHO}/break`);
  await run(`P.days = {}; P.chest = ''; P.today = null; P.lilStk = null; save()`); await run('goHome()'); await p.waitForTimeout(600); await dismissOffer();
  await p.click(`.pd-n[data-l="${must[0]}"]`); await p.waitForTimeout(900);
  const bg = p.locator('.overlay button.big').first(); if (await bg.count()) { await bg.click(); await p.waitForTimeout(1000); }
  const g1 = await run('(() => { const s = nextStepOf(ACTIVE); return s ? s.key : null; })()');
  await run(`finish({ key: ${JSON.stringify(g1)} })`); await p.waitForTimeout(600);
  const nx = p.locator('.overlay [data-a="next"]').first(); if (await nx.count()) { await nx.click(); await p.waitForTimeout(1000); }
  const g2 = await run('(() => { const s = nextStepOf(ACTIVE); return s ? s.key : null; })()');
  note(`BREAK: in game 2 (${g2}) of step ${must[0]}; browser back →`);
  await p.goBack().catch(() => {}); await p.waitForTimeout(900);
  const afterBack = await p.evaluate(() => ({ url: location.href.slice(-30), home: !!document.querySelector('.screen.home-t, #pdBox'), title: (document.querySelector('.screen h1, .screen header b') || {}).innerText || '' }));
  note('  after back:', JSON.stringify(afterBack), 'said=', JSON.stringify(await said())); await S('30-after-back');
  // reload mid-step
  if (!afterBack.home) { await run('goHome()'); await p.waitForTimeout(800); } await dismissOffer();
  await p.click(`.pd-n[data-l="${must[0]}"]`); await p.waitForTimeout(900);
  const bg2 = p.locator('.overlay button.big').first(); if (await bg2.count()) { await bg2.click(); await p.waitForTimeout(800); }
  const before = await run(`JSON.stringify({ done: todayState().done['${must[0]}'], key: (nextStepOf(ACTIVE) || {}).key })`);
  await p.reload(); await p.waitForTimeout(2000);
  const w2 = await p.$$('.who-kid'); if (w2.length) { note('  reload → who-plays screen first'); await w2[0].click(); await p.waitForTimeout(900); }
  const afterReload = await p.evaluate(() => ({ home: !!document.querySelector('#pdBox'), who: !!document.querySelector('.who-kid'), title: (document.querySelector('.screen h1, .screen header b') || {}).innerText || '', node: (document.querySelector(`.pd-n.now .pd-lb`) || {}).innerText || '' }));
  const after = await run(`JSON.stringify({ done: todayState().done['${must[0]}'], plan: lessonPlan('${must[0]}').length })`);
  note(`  reload mid-step: before=${before} after=${after} screen=${JSON.stringify(afterReload)}`); await S('31-after-reload');
  // home button mid-game (closing a game early)
  await dismissOffer();
  await p.click(`.pd-n[data-l="${must[0]}"]`); await p.waitForTimeout(900);
  const bg3 = p.locator('.overlay button.big').first(); if (await bg3.count()) { await bg3.click(); await p.waitForTimeout(800); }
  const hm = p.locator('button[aria-label="На главную"], .top .home, #homeBtn').first();
  if (await hm.count()) { await hm.click(); } else { await run('goHome()'); }
  await p.waitForTimeout(1500);
  const offer = await p.$eval('.lt-offer', e => e.innerText.replace(/\s+/g, ' ').trim()).catch(() => null);
  const node = await p.$eval(`.pd-n[data-l="${must[0]}"]`, e => e.innerText.replace(/\s+/g, ' ').trim()).catch(() => null);
  note(`  home mid-game: offer=${JSON.stringify(offer)} node=${JSON.stringify(node)} said=${JSON.stringify(await said())}`); await S('32-home-mid-game');
  out.gamesN = gamesN; out.overlaysN = overlaysN;
  L.fs.writeFileSync(`day-${WHO}-${DEV}.json`, JSON.stringify(out, null, 1));
  L.saveLog(`log-day-${WHO}-${DEV}.json`);
  await b.close();
})().catch(e => { console.error('FATAL', e); process.exit(1); });
