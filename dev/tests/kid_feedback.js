// kid-feedback-1: what a 9-year-old tester and his mother asked for.
// 1. the line the voice is reading is dark letters on yellow in every look (bright, calm, dark): ≥ 4.5:1
// 2. «Читаю сам»: a 9-year-old at reading step 6 gets the story without the voice, two questions, «Послушать» only after
//    the answers; the journal says «read» (2) and the report counts it; a 5-year-old still listens; the parents' switch
// 3. the mirror opens by itself in the articulation exercises (getUserMedia stubbed): asked once, then on by itself,
//    stopped when the app is hidden and on leaving; the parents' switch off → the button only
// Invented children only (Тина 5, Тоша 9). node tests/kid_feedback.js [base] [phone|laptop] [langs=ru,en,pt,de]
const { chromium, devices } = require('playwright');
const path = require('path');
const BASE = process.argv[2] || 'http://localhost:8781/govorilki/', DEV = process.argv[3] || 'phone';
const LANGS = (process.argv[4] || 'ru,en,pt,de').split(',');
const SHOTS = path.join(__dirname, 'shots');
const HOOK = 'const fam = () => ROOT.families[ROOT.curFam] || null;';
const SUB = { ru: 'ru/', en: '', pt: 'pt/', de: 'de/' };
const kid = (name, g, age, fr, lang, look, rl) => ({ stars: 20, plays: {}, learn: {}, days: {}, book: { title: 'Т', log: {} }, recent: [],
  ...(rl ? { rskill: { [lang]: { lv: rl } } } : {}), settings: { name, gender: g, track: 'r', age, friend: fr, onboarded: true, lang, look, allGames: true } });
const wait = ms => new Promise(r => setTimeout(r, ms));
const ratioOf = sel => {
  const el = document.querySelector(sel); if (!el) return -1;
  const parse = c => { const m = /rgba?\(([^)]+)\)/.exec(c || ''); const a = m[1].split(/[,\s/]+/).filter(Boolean).map(parseFloat); return { r: a[0], g: a[1], b: a[2], a: a.length > 3 ? a[3] : 1 }; };
  const lum = ({ r, g, b }) => { const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }; return .2126 * f(r) + .7152 * f(g) + .0722 * f(b); };
  let bg = null; for (let e = el; e; e = e.parentElement) { const c = parse(getComputedStyle(e).backgroundColor); if (c.a > .5) { bg = c; break; } }
  const fg = parse(getComputedStyle(el).color), L1 = lum(fg), L2 = lum(bg || { r: 255, g: 255, b: 255 });
  return +((Math.max(L1, L2) + .05) / (Math.min(L1, L2) + .05)).toFixed(2);
};
(async () => {
  const b = await chromium.launch(); let fails = 0;
  for (const lang of LANGS) {
    const out = [], errs = [];
    const seed = { engine: 'device', micOff: true, srOff: true, parentPhone: true, cur: 'k2', curFam: 'f1',
      families: { f1: { id: 'f1', name: 'Т', cc: 'PT', kids: ['k1', 'k2'], grands: [] } },
      profiles: { k1: kid('Тина', 'f', 5, 'kitty', lang, 'bright', 0), k2: kid('Тоша', 'm', 9, 'tiger', lang, 'dark', 6) } };
    const c = await b.newContext(DEV === 'laptop' ? { viewport: { width: 1280, height: 800 } } : { ...devices['iPhone 13'], deviceScaleFactor: 1 });
    await c.route(/ntfy|wikipedia|huggingface|jsdelivr|youtube|wikimedia|workers\.dev/, r => r.abort());
    await c.route(u => /\/(ru|de|pt|en)?\/?(index\.html)?$|\/app\.[0-9a-f]+\.js$/.test(u.pathname), async r => { const x = await r.fetch(); let t = await x.text(); t = t.replace(HOOK, HOOK + ' window.__T = { run: s => eval(s) };'); r.fulfill({ response: x, body: t }); });
    await c.addInitScript(s => {
      window.__said = [];
      try { speechSynthesis.speak = u => { window.__said.push(u.text); setTimeout(() => u.onend && u.onend(), 5); }; } catch (e) {}
      // a camera that only counts: opened, stopped
      window.__cam = { opened: 0, stopped: 0, last: null };
      const md = navigator.mediaDevices || {};
      md.getUserMedia = async cn => {
        if (!cn || !cn.video) throw Object.assign(new Error('no'), { name: 'NotAllowedError' });
        const cv = document.createElement('canvas'); cv.width = cv.height = 32; cv.getContext('2d').fillRect(0, 0, 32, 32);
        const st = cv.captureStream(5); window.__cam.opened++;
        st.getTracks().forEach(tr => { const s0 = tr.stop.bind(tr); tr.stop = () => { window.__cam.stopped++; s0(); }; });
        window.__cam.last = st; return st;
      };
      let hid = false; Object.defineProperty(document, 'hidden', { configurable: true, get: () => hid });
      window.__hide = v => { hid = v; document.dispatchEvent(new Event('visibilitychange')); };
      if (localStorage.getItem('seeded')) return; localStorage.setItem('seeded', 1); localStorage.setItem('govorilki-v2', JSON.stringify(s));
    }, seed);
    const p = await c.newPage();
    p.on('pageerror', e => errs.push(e.message));
    const run = s => p.evaluate(x => window.__T.run(x), s);
    const live = () => p.evaluate(() => !!(window.__cam.last && window.__cam.last.getTracks().some(t => t.readyState === 'live')));
    await p.goto(BASE + SUB[lang]); await wait(1500);
    const who = await p.$$('.who-kid'); if (who.length) { await who[1].click(); await wait(900); }
    const sec = await run("Object.keys(LEARN).find(k => !LEARN[k].hide && learnItems(k).length > 3 && learnItems(k).slice(0, 3).every(x => x.q && x.t))");
    if (!sec) { out.push('no story section with questions'); }

    // ---- 2. Тоша, 9, step 6: «Читаю сам»
    await run("(ROOT.cur='k2', P=ROOT.profiles['k2'], goHome())"); await wait(500);
    if (!(await run('selfReader()'))) out.push('9-year-old at step 6 is not a self reader');
    await run(`(window.__said.length = 0, screenStory('${sec}', 1))`); await wait(2500);
    const st = await p.evaluate(() => ({ on: !!document.querySelector('.story.sr-on'), listen: document.querySelector('#stListen') && !document.querySelector('#stListen').hidden,
      done: !!document.querySelector('#srDone'), tag: (document.querySelector('.sr-tag') || {}).textContent || '', first: (document.querySelector('.ss') || {}).textContent || '', said: window.__said.join(' | ') }));
    if (!st.on || !st.done) out.push('no «Читаю сам» on the story: ' + JSON.stringify(st));
    if (st.listen) out.push('«Послушать» shown before the answers');
    const strip = x => x.replace(/[́+]/g, '').toLowerCase().slice(0, 25);
    if (st.first && strip(st.said).includes(strip(st.first))) out.push('the voice read the story by itself: ' + st.said.slice(0, 120));
    await p.screenshot({ path: `${SHOTS}/kidfb-${lang}-${DEV}-selfread.png` });
    await p.click('#srDone'); await wait(900);
    let qs = 0;
    for (let n = 0; n < 3; n++) {
      const a = await p.$('#stQ .ans[data-ok="1"]'); if (!a) break;
      if (n === 0) await p.screenshot({ path: `${SHOTS}/kidfb-${lang}-${DEV}-question.png` });
      await a.click(); qs++; await wait(1100);
    }
    if (qs < 2) out.push('questions after reading: ' + qs);
    const after = await p.evaluate(() => ({ listen: !!document.querySelector('#stListen') && !document.querySelector('#stListen').hidden, next: !!document.querySelector('#srNext') }));
    if (!after.listen || !after.next) out.push('after the answers no «Послушать»/«Дальше»: ' + JSON.stringify(after));
    await p.screenshot({ path: `${SHOTS}/kidfb-${lang}-${DEV}-after.png` });
    if (after.next) { await p.click('#srNext'); await wait(2200); }
    const ev = await run("JSON.stringify({ e: EVT.all().filter(e => e[1] === 'story').map(e => e[4]), lr: (P.gw || {}).lr || 0, rep: GUIDE.wins ? GUIDE.wins(GUIDE.digest(P)) : [] })");
    const E = JSON.parse(ev);
    if (!E.e.includes(2)) out.push('journal has no «read» story: ' + ev);
    if (E.lr !== 1) out.push('report bucket lr ' + E.lr);
    if (lang === 'ru' && !E.rep.some(x => /прочитал сам: 1 историю/.test(x))) out.push('report has no «прочитал сам»: ' + JSON.stringify(E.rep));
    const fin = await p.evaluate(() => !!document.querySelector('.winbox, .overlay, .finish'));
    if (!fin) out.push('no finish card after «Дальше»');

    // ---- Тина, 5: listens as before
    await run("(hush(), document.querySelectorAll('.overlay').forEach(x => x.remove()), ROOT.cur='k1', P=ROOT.profiles['k1'], lookApply(), goHome())"); await wait(500);
    await run(`(window.__said.length = 0, screenStory('${sec}', 2))`); await wait(2500);
    const y = await p.evaluate(() => ({ on: !!document.querySelector('.story.sr-on'), first: (document.querySelector('.ss') || {}).textContent || '', said: window.__said.join(' | '), hl: !!document.querySelector('.ss.on') }));
    if (y.on) out.push('5-year-old got «Читаю сам»');
    if (!strip(y.said).includes(strip(y.first).slice(0, 12)) && !y.hl) out.push('5-year-old: the voice does not read: ' + y.said.slice(0, 100));

    // ---- 1. highlight contrast in three looks (the real story line + every reading highlight)
    for (const look of ['bright', 'calm', 'dark']) {
      await run(`(P.settings.look='${look}', lookApply(), screenStory('${sec}', 2))`); await wait(1800);
      await p.evaluate(() => {
        document.querySelectorAll('.ss').forEach(e => { e.style.transition = 'none'; }); const s = document.querySelector('.ss'); if (s && !document.querySelector('.ss.on')) s.classList.add('on');
        document.querySelector('.story').insertAdjacentHTML('beforeend', `<div id="hlT"><p class="fr-text"><span class="ss on" id="h1">Кот спит.</span></p><p><span class="sy on" id="h2">ко</span></p><div class="bl-tale"><span class="ss bl-on" id="h3">Жила-была</span></div><p><span class="rw on" id="h4">мама</span></p></div>`);
      });
      for (const sel of ['.story-t .ss.on', '#h1', '#h2', '#h3', '#h4']) { const r = await p.evaluate(ratioOf, sel); if (r < 4.5) out.push(`${look}: ${sel} contrast ${r}`); }
      if (look === 'dark') await p.screenshot({ path: `${SHOTS}/kidfb-${lang}-${DEV}-hl-dark.png` });
    }
    await run("(P.settings.look='bright', lookApply())");

    // ---- parents: the switches in «День и все игры»
    await run("(ROOT.cur='k2', P=ROOT.profiles['k2'], SETUI.reset(), screenParents())"); await wait(600);
    const dp = await p.$('[data-page="day"]'); if (dp) { await dp.click(); await wait(600); }
    const sw = await p.$('#sdSR [data-sr="listen"]');
    if (!sw) out.push('no «Истории: читать самому / слушать» switch'); else { await sw.click(); await wait(300); if (await run('selfReader()')) out.push('«слушать» did not switch reading off'); }
    if (!(await p.$('#sdMir'))) out.push('no «Зеркало включается само» switch');
    await p.evaluate(() => { const e = document.querySelector('#sdSR'); if (e) e.scrollIntoView({ block: 'center' }); });
    await p.screenshot({ path: `${SHOTS}/kidfb-${lang}-${DEV}-parents.png` });
    await run("(P.settings.stRead='', save())");
    const dataP = await run("(SETUI.reset(), screenParents(), 0)").then(async () => { const d = await p.$('[data-page="data"]'); if (d) { await d.click(); await wait(500); } return p.evaluate(() => /(camera|câmara|Kamera|Камера)/i.test((document.querySelector('#dataSec') || document.body).innerText)); });
    if (!dataP) out.push('«Ваши данные» say nothing about the camera');

    // ---- 3. the mirror
    await run("(goHome(), screenArtic(0))"); await wait(900);
    if (!(await p.$('#camAsk'))) out.push('no camera question on the first articulation exercise');
    await p.screenshot({ path: `${SHOTS}/kidfb-${lang}-${DEV}-camask.png` });
    if (await p.$('#camYes')) { await p.click('#camYes'); await wait(700); }
    if (!(await live()) || await p.evaluate(() => document.querySelector('#cam').hidden)) out.push('mirror did not open after «Да»');
    await p.evaluate(() => window.__hide(true)); await wait(300);
    if (await live()) out.push('camera still on with the app hidden');
    await p.evaluate(() => window.__hide(false)); await wait(700);
    if (!(await live())) out.push('camera did not come back when the app was shown');
    await run('goHome()'); await wait(400);
    if (await live()) out.push('camera still on after leaving the exercise');
    await run("screenArtic(1)"); await wait(900);
    if (await p.$('#camAsk')) out.push('asked twice');
    if (!(await live())) out.push('mirror did not open by itself on the next exercise');
    await p.screenshot({ path: `${SHOTS}/kidfb-${lang}-${DEV}-mirror.png` });
    await run("(goHome(), P.settings.mirrorAuto = false, save(), screenArtic(0))"); await wait(900);
    if (await live()) out.push('switch off: camera opened anyway');
    if (!(await p.$('#camBtn'))) out.push('switch off: no camera button');
    await run("(P.settings.mirrorAuto = true, save(), goHome())");

    if (errs.length) out.push('page errors: ' + errs.join(' ; ').slice(0, 300));
    console.log(`${lang} ${DEV}: ${out.length ? 'FAIL ' + out.join(' ; ') : 'ok'}`);
    if (out.length) fails++;
    await c.close();
  }
  await b.close(); process.exit(fails ? 1 : 0);
})();
