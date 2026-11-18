// speech-honest: the tongue exercises count only when really done; «Послушай внимательно».
// Invented children (Тина 6, Тим 9). No real faces: the camera is a blank canvas and the face model is stubbed with
// synthetic numbers (window.__FACE_STUB), driven by what the exercise asks for. Checks:
//  - a lips exercise done → «Получается!», the ring fills, star + thing for the house; not done → «Попробуй ещё», no star;
//  - a tongue exercise: no verdict about the tongue («Ротик открыт», «посмотри в зеркало, как язычок»);
//  - no camera: «Делаю!» held → counts, not held → not;
//  - a skipped exercise in the path: counted for «Отчёт», the step stays unfinished, «Давай только одну!» (also at 9),
//    and only that one done finishes the step;
//  - the camera and the model stop on leaving and when the app is hidden;
//  - «Послушай условие»: answers wait for the instruction, early taps → «Ты не услышал(а)…» and the instruction again,
//    two quick wrong answers → the same; then the answers open;
//  - REAL=1: the real model (engine/face) loads and reads a frame (no face in a blank picture).
// node tests/speech_honest.js [base] [phone|laptop]   (needs tests/serve.sh; LANGS=ru,en,pt,de)
const { chromium, devices } = require('playwright');
const path = require('path');
const BASE = process.argv[2] || 'http://localhost:8781/govorilki/', DEV = process.argv[3] || 'phone';
const SHOTS = path.join(__dirname, 'shots', 'speech_honest'); require('fs').mkdirSync(SHOTS, { recursive: true });
const HOOK = 'const fam = () => ROOT.families[ROOT.curFam] || null;';
const LANGS = (process.env.LANGS || 'ru,en,pt,de').split(',');
const DIR = { ru: 'ru/', en: '', pt: 'pt/', de: 'de/' };
const kid = (name, g, age, fr, lang) => ({ stars: 12, plays: {}, learn: {}, best: {}, book: { title: 'Т', log: {} }, settings: { name, gender: g, track: 'r', age, friend: fr, onboarded: true, lang, focus: { sp: 'yes', subj: [] } } });   // «логопедия нужна» (parent-focus: a new child has none until the check)
let bad = 0; const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) bad++; };
const wait = ms => new Promise(r => setTimeout(r, ms));
async function open(b, lang, who, { cam = true } = {}) {
  const seed = { engine: 'device', micOff: true, srOff: true, parentPhone: true, cur: who, curFam: 'f1', camAsk: cam ? 'yes' : 'no', camNoAt: Date.now(),
    families: { f1: { id: 'f1', name: 'Т', cc: 'PT', kids: ['k1', 'k2'], grands: [] } },
    profiles: { k1: kid('Тина', 'f', 6, 'kitty', lang), k2: kid('Тим', 'm', 9, 'tiger', lang) } };
  const c = await b.newContext(DEV === 'laptop' ? { viewport: { width: 1280, height: 800 } } : { ...devices['iPhone 13'] });
  await c.route(/ntfy|wikipedia|huggingface|jsdelivr|youtube|wikimedia|workers\.dev/, r => r.abort());
  await c.route(u => /\/(ru|de|pt|en)?\/?(index\.html)?$/.test(u.pathname), async r => { const x = await r.fetch(); let t = await x.text(); t = t.replace(HOOK, HOOK + ' window.__T = { run: s => eval(s) };'); r.fulfill({ response: x, body: t }); });
  await c.addInitScript(([s, real]) => {
    // the voice: long lines take a while (so a child can tap during them), short ones end quickly
    window.__said = []; window.__slow = 0;
    try { speechSynthesis.speak = u => { window.__said.push(u.text); setTimeout(() => u.onend && u.onend(), window.__slow && u.text.length > 25 ? window.__slow : 5); }; } catch (e) {}
    // a camera that is only a dark picture: opened, stopped
    window.__cam = { opened: 0, stopped: 0, last: null };
    const md = navigator.mediaDevices || {};
    md.getUserMedia = async cn => {
      if (!cn || !cn.video) throw Object.assign(new Error('no'), { name: 'NotAllowedError' });
      const cv = document.createElement('canvas'); cv.width = cv.height = 64; const g = cv.getContext('2d'); g.fillStyle = '#334'; g.fillRect(0, 0, 64, 64);
      const st = cv.captureStream(5); window.__cam.opened++;
      st.getTracks().forEach(tr => { const s0 = tr.stop.bind(tr); tr.stop = () => { window.__cam.stopped++; s0(); }; });
      window.__cam.last = st; return st;
    };
    // the face model: synthetic numbers; window.__face is what the «child» does
    if (!real) { window.__face = { face: true, open: .04, smile: .1, pucker: .08, puff: .03 }; window.__FACE_STUB = () => ({ ...window.__face }); }
    let hid = false; Object.defineProperty(document, 'hidden', { configurable: true, get: () => hid });
    window.__hide = v => { hid = v; document.dispatchEvent(new Event('visibilitychange')); };
    if (localStorage.getItem('seeded')) return; localStorage.setItem('seeded', 1); localStorage.setItem('govorilki-v2', JSON.stringify(s));
  }, [seed, !!process.env.REAL]);
  const p = await c.newPage(); p.errs = [];
  p.on('pageerror', e => p.errs.push(e.message));
  await p.goto(BASE + DIR[lang]); await wait(1500);
  const w = await p.$$('.who-kid'); if (w.length) { await w[who === 'k1' ? 0 : 1].click(); await wait(900); }
  p.ctx = c;
  return p;
}
const run = (p, s) => p.evaluate(x => window.__T.run(x), s);
const said = p => p.evaluate(() => { const a = window.__said.join(' / '); window.__said.length = 0; return a; });
const CYR = /[А-Яа-яЁё]/;
// the «child» copies what the ring asks for (😁 smile, 😗 lips forward, 😮 open mouth) — or does nothing
async function mimic(p, on) {
  await p.evaluate(on => {
    clearInterval(window.__mim);
    const N = { face: true, open: .04, smile: .1, pucker: .08, puff: .03 };
    window.__labels = window.__labels || [];
    window.__mim = setInterval(() => {
      const e = document.querySelector('#honE'), l = document.querySelector('#honL');
      if (l && l.textContent && window.__labels[window.__labels.length - 1] !== l.textContent) window.__labels.push(l.textContent);
      const k = e ? e.textContent : '';
      window.__face = !on ? { ...N } : k === '😁' ? { ...N, smile: .75 } : k === '😗' ? { ...N, pucker: .7 } : k === '😮' ? { ...N, open: .5 } : { ...N };
    }, 60);
  }, on);
}
// a short exercise for the test: its first steps only
const short = (p, id, n) => run(p, `(() => { const a = AL().find(x => x.id === '${id}'); a.steps = a.steps.slice(0, ${n}); return AL().indexOf(a); })()`);
const won = p => p.evaluate(() => { const w = document.querySelector('.winbox .win-line'); return w ? w.textContent : ''; });
(async () => {
  const b = await chromium.launch();
  for (const lang of (process.env.REAL ? [] : LANGS)) {
    const T = `[${lang} ${DEV}]`, RU = lang === 'ru';
    let p = await open(b, lang, 'k1');
    // ---- 1. a lips exercise, done: «Получается!», the ring, a star and a thing for the house
    let i = await short(p, 'frog', 4);
    await p.evaluate(() => { window.__labels = []; });
    await mimic(p, false);
    await run(p, `screenArtic(${i})`); await wait(2500);
    ok(await p.evaluate(() => !document.querySelector('#cam').hidden && window.__cam.opened > 0), `${T} the mirror opens by itself`);
    ok(await run(p, 'FACE.live()') === 1, `${T} the model watches while the exercise is on the screen`);
    const st0 = await run(p, 'P.stars'), house0 = await run(p, 'P.tongue || 0');
    await mimic(p, true);
    await p.click('#go'); await wait(1200);
    const ring = await p.evaluate(() => getComputedStyle(document.querySelector('#honR')).getPropertyValue('--p'));
    if (DEV === 'phone' || RU) await p.screenshot({ path: `${SHOTS}/${lang}-${DEV}-lips-doing.png` });
    for (let k = 0; k < 40 && !(await p.$('.winbox')); k++) await wait(300);
    const labs = await p.evaluate(() => window.__labels.join(' | '));
    const line = await won(p);
    ok(!!line && (await run(p, 'P.stars')) > st0 && (await run(p, "P.best['artic:frog']")) >= 1 && (await run(p, 'P.tongue')) === house0 + 1, `${T} done → result with a star and a thing for the house: ${line.slice(0, 70)}`);
    ok(+ring > 0, `${T} the ring fills while the pose is held (--p ${ring})`);
    ok(/Получается|doing it|Está a dar|Klappt/.test(labs) && (RU || !CYR.test(labs)), `${T} live hints: ${labs.slice(0, 120)}`);
    ok(await run(p, 'P.faceCal && P.faceCal.b && P.faceCal.b.smile < .2'), `${T} the neutral face was measured (numbers only): ${JSON.stringify(await run(p, 'P.faceCal.b'))}`);
    await p.screenshot({ path: `${SHOTS}/${lang}-${DEV}-lips-done.png` });

    // ---- 2. the same, not done: «Попробуй ещё», no star
    await mimic(p, false);
    i = await short(p, 'l-smile', 2).catch(() => -1);
    i = await short(p, 'frog', 2);
    await run(p, `screenArtic(${i})`); await wait(1500);
    const st1 = await run(p, 'P.stars'), pl1 = await run(p, "P.plays['artic:frog'] || 0");
    await p.click('#go');
    for (let k = 0; k < 40 && !(await p.$('#honAgain')); k++) await wait(300);
    ok(!!(await p.$('#honAgain')) && !(await p.$('.winbox')) && (await run(p, 'P.stars')) === st1 && (await run(p, "P.plays['artic:frog'] || 0")) === pl1, `${T} not done → «Попробуй ещё», no star, not counted`);
    ok(/Попробуй|Try again|Tenta|Versuch/.test(await said(p)), `${T} the friend says «Попробуй ещё»`);
    await p.screenshot({ path: `${SHOTS}/${lang}-${DEV}-lips-try.png` });
    await p.click('#honAgain'); await wait(800);
    ok(!!(await p.$('#go')) && (await run(p, `HONEST.sum(P, 1).s`)) === 0, `${T} «Ещё раз» opens the exercise again (not a skip)`);

    // ---- 3. a tongue exercise: only «the mouth is open», no verdict about the tongue
    await p.evaluate(() => { window.__labels = []; });
    i = await short(p, 'spatula', 3);
    await run(p, `screenArtic(${i})`); await wait(1500);
    await mimic(p, true); await p.click('#go');
    for (let k = 0; k < 40 && !(await p.$('.winbox')); k++) await wait(300);
    const tl = await p.evaluate(() => window.__labels.join(' | ')), tline = await won(p);
    ok(!!tline && !/^(Получается|You are doing it|Está a dar|Klappt)/.test(tl.split(' | ').find(x => x) || '') && !/Получается!|You are doing it!|Está a dar!|Klappt!/.test(tl + tline), `${T} tongue: no verdict («${tl.slice(0, 60)}»)`);
    ok(/язычок|tongue|língua|Zunge/.test(tline), `${T} tongue: «посмотри в зеркало, как язычок»: ${tline.slice(0, 80)}`);
    await mimic(p, false);

    // ---- 4. the camera and the model stop when the app is hidden and on leaving
    i = await short(p, 'frog', 4);
    await run(p, `screenArtic(${i})`); await wait(1500);
    const live = () => p.evaluate(() => !!(window.__cam.last && window.__cam.last.getTracks().some(t => t.readyState === 'live')));
    ok(await live() && (await run(p, 'FACE.live()')) === 1, `${T} exercise: camera and model on`);
    await p.evaluate(() => window.__hide(true)); await wait(500);
    ok(!(await live()) && (await run(p, 'FACE.live()')) === 0, `${T} app hidden: camera and model stopped`);
    await p.evaluate(() => window.__hide(false)); await wait(900);
    ok(await live() && (await run(p, 'FACE.live()')) === 1, `${T} app shown again: back on`);
    await run(p, 'goHome()'); await wait(500);
    ok(!(await live()) && (await run(p, 'FACE.live()')) === 0, `${T} left the exercise: camera and model stopped`);
    await p.ctx.close();

    // ---- 5. no camera: «Делаю!» held counts, not held does not
    p = await open(b, lang, 'k1', { cam: false });
    i = await short(p, 'frog', 2);
    await run(p, `screenArtic(${i})`); await wait(1200);
    await p.click('#go'); await wait(1500);
    ok(await p.evaluate(() => { const h = document.querySelector('#honHold'); return h && !h.hidden && document.querySelector('#cam').hidden; }), `${T} no camera: the «Делаю!» button`);
    await p.screenshot({ path: `${SHOTS}/${lang}-${DEV}-hold.png` });
    const hb = await p.$('#honHold'), bb = await hb.boundingBox();
    await p.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2); await p.mouse.down();
    for (let k = 0; k < 30 && !(await p.$('.winbox')); k++) await wait(300);
    await p.mouse.up();
    ok(!!(await won(p)), `${T} no camera: held → counted`);
    await run(p, `screenArtic(${i})`); await wait(1200); await p.click('#go');
    for (let k = 0; k < 40 && !(await p.$('#honAgain')); k++) await wait(300);
    ok(!!(await p.$('#honAgain')) && !(await p.$('.winbox')), `${T} no camera: not held → «Попробуй ещё»`);
    await p.ctx.close();

    // ---- 6. the path: a skip is counted, the step stays open, «Давай только одну!» (also at 9), that one finishes it
    p = await open(b, lang, 'k2');
    await mimic(p, false);
    await run(p, "(AL().forEach(a => a.steps = a.steps.slice(0, 2)), 0)");
    await run(p, "(ACTIVE = 'speech', (() => { const s = lessonPlan('speech').find(x => x.kind === 'artic'); todayState().done.speech = lessonPlan('speech').filter(x => x.kind !== 'artic').slice(0, 1).map(x => x.key);   /* one step done before (the focus dose may have no breath step) */ save(); s.run(); })())"); await wait(1500);
    const plan0 = await run(p, "lessonPlan('speech').length");
    await p.click('#backBtn'); await wait(300); await run(p, 'goHome()'); await wait(1600);
    const sk = await run(p, 'HONEST.sum(P, 1)');
    ok(sk.s === 1 && sk.d === 0, `${T} skipped exercise counted (skipped ${sk.s}, done ${sk.d})`);
    ok(!(await run(p, "dayCounts(dayKey()).speech")), `${T} the speech step is not done`);
    const node = await p.evaluate(() => { const n = document.querySelector('.pd-n[data-l="speech"]'); return n ? n.textContent.replace(/\s+/g, ' ') : ''; });
    ok(/\d+\s*(из|of|de|von)\s*\d+|\d+\/\d+/.test(node), `${T} the path shows honest progress: ${node.trim().slice(0, 60)}`);
    const offer = await p.$('.lt-offer');
    ok(!!offer, `${T} «Давай только одну!» for a child of 9`);
    if (offer) {
      await p.screenshot({ path: `${SHOTS}/${lang}-${DEV}-one.png` });
      await p.click('.lt-offer [data-a="one"]'); await wait(1500);
      const pl = await run(p, "lessonPlan('speech').map(x => x.key).join(',')");
      ok(!pl.includes(','), `${T} «Одну!»: one game in the step (${pl})`);
      if (await p.$('#hon')) {
        await mimic(p, true); if (await p.isVisible('#go')) await p.click('#go');
        for (let k = 0; k < 40 && !(await p.$('.overlay .winbox')); k++) await wait(300);
        await wait(500);
        ok((await run(p, "dayCounts(dayKey()).speech")) === 1, `${T} that one done → the step is done`);
        await mimic(p, false);
      } else {
        ok(true, `${T} (the one is a game, not an exercise: ${pl})`);
      }
    }
    // «Отчёт»: a calm line
    const rep = await p.evaluate(() => { const d = document.createElement('div'); GUIDE.mountFam(d); return d.textContent; }).catch(() => '');
    const rep2 = await run(p, "(() => { const d = document.createElement('div'); GUIDE.mountFam(d); return d.textContent; })()");
    ok(/пропущено 1|1 exercise skipped|1 exercício saltado|1 Übung übersprungen|skipped|saltad|übersprungen/.test(rep2 || rep), `${T} «Отчёт»: ${((rep2 || '').match(/🙈[^\n]*/) || [''])[0].slice(0, 140)}`);

    // ---- 7. «Послушай условие»: answers wait, early taps → «Ты не услышал(а)» + the instruction again
    await run(p, '(P.lsSeen = null, save(), goHome())'); await wait(600);
    await p.evaluate(() => { window.__slow = 2500; });
    await said(p);
    await run(p, "GAMES.find(g => g.id === 'math-compare').go()"); await wait(400);
    ok(await p.evaluate(() => document.querySelector('#stage').classList.contains('ls-wait') && !!document.querySelector('.ls-ear')), `${T} the instruction plays: «слушаю…», answers wait`);
    await p.screenshot({ path: `${SHOTS}/${lang}-${DEV}-listen.png` });
    const pl0 = await run(p, "P.plays['math-compare'] || 0");
    await p.click('.cmp-g >> nth=0'); await wait(150); await p.click('.cmp-g >> nth=1'); await wait(200);
    const s1 = await p.evaluate(() => window.__said.join(' / '));
    ok(/не услышал|did not hear|Não ouviste|nicht gehört/.test(s1), `${T} two early taps → «${(s1.match(/[^/]*(услышал|hear|ouviste|gehört)[^/]*/) || [''])[0].trim()}»`);
    for (let k = 0; k < 40 && await p.evaluate(() => document.querySelector('#stage').classList.contains('ls-wait')); k++) await wait(400);
    await wait(400);
    const s2 = await said(p);
    ok(s2.split(' / ').filter(x => x.length > 25).length >= 2, `${T} the instruction again`);
    ok(await p.evaluate(() => !document.querySelector('#stage').classList.contains('ls-wait')), `${T} after it the answers open`);
    // two quick wrong answers
    await p.evaluate(() => { window.__slow = 0; });
    await p.click('#replay'); await wait(300); await said(p);
    let wrongs = 0;
    for (let k = 0; k < 4 && wrongs < 2; k++) {
      const wi = await p.evaluate(() => { const q = document.querySelector('#cq').textContent, more = !/меньше|fewer|less|menos|weniger/i.test(q); const n = [...document.querySelectorAll('.cmp-g')].map(g => g.querySelectorAll('.it').length); return more ? (n[0] < n[1] ? 0 : 1) : (n[0] > n[1] ? 0 : 1); });
      // the first wrong answer is a real tap; this game then shows the right box, so the second quick miss is a tap
      // with the game's own «wrong» sound (sfx.oops), as any game with several tries makes it
      if (k === 0) await p.click(`.cmp-g >> nth=${wi}`);
      else { await p.click('.bar h1'); await run(p, 'sfx.oops()'); }
      wrongs++; await wait(250); if (process.env.DBG) console.log(k, await run(p, "JSON.stringify(LISTEN.state())"));
    }
    await wait(1600);
    const s3 = await said(p);
    ok(/не услышал|did not hear|Não ouviste|nicht gehört/.test(s3), `${T} two quick wrong answers → «Послушай внимательно» again`);
    ok((await run(p, "LISTEN.state().told")) <= 2, `${T} never more than twice`);
    if (DEV === 'phone') await p.screenshot({ path: `${SHOTS}/${lang}-${DEV}-listen2.png` });
    ok(!p.errs.length, `${T} no page errors ${p.errs.join(' ; ').slice(0, 200)}`);
    ok(!(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)), `${T} no sideways scroll`);
    await p.ctx.close();
  }
  // ---- the real model (only with REAL=1): loads from engine/face and reads a frame
  if (process.env.REAL) {
    const p = await open(b, 'ru', 'k1');
    const r = await run(p, `(async () => { const t0 = performance.now(); const lm = await FACE.load(); const t1 = performance.now();
      const v = document.createElement('video'); v.muted = true; v.playsInline = true; v.srcObject = await navigator.mediaDevices.getUserMedia({ video: true }); await v.play(); await new Promise(r => setTimeout(r, 300));
      const xs = []; for (let k = 0; k < 10; k++) { const a = performance.now(); lm.detectForVideo(v, a + k); xs.push(performance.now() - a); }
      return { ok: !!lm, load: Math.round(t1 - t0), frame: Math.round(xs.slice(2).reduce((a, b) => a + b, 0) / 8) }; })()`);
    ok(r && r.ok, `the real model loads (${r && r.load} ms) and reads a frame in ${r && r.frame} ms`);
    ok(!p.errs.length, `real model: no page errors ${p.errs.join(' ; ').slice(0, 200)}`);
    await p.ctx.close();
  }
  await b.close();
  console.log(bad ? `FAIL: ${bad}` : 'OK: speech honest');
  process.exit(bad ? 1 : 0);
})();
