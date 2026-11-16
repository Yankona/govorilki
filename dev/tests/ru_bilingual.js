// ru-bilingual: «Русский для меня» for children of 8–14 with Russian at home. Invented children: Тоша 9 (ru at home, pt at
// school, likes space and football), Тим 12 (only de). The check (quest) → four levels; the daily step on «Сегодня» on a
// topic of the child, grammar gaps of the weakest kind; «Придумай существо» records on this phone only (IndexedDB);
// the parents' report has «Русский язык»; Тим never sees it. Fake microphone, no speech recognition.
// Usage: node tests/ru_bilingual.js [base url] [phone|laptop]      screenshots: tests/shots/rume-*.png
const { chromium, devices } = require('playwright');
const D = require('path').join(__dirname, 'shots') + '/';
require('fs').mkdirSync(D, { recursive: true });
const BASE = process.argv[2] || 'http://localhost:8781/govorilki/', DEV = process.argv[3] || 'phone';
const HOOK = 'const fam = () => ROOT.families[ROOT.curFam] || null;';
const KIDS = {
  tosha: { name: 'Тоша', gender: 'm', age: 9, track: 'l', langs: ['ru', 'pt'], school: ['pt'], learn: [], likes: ['space', 'football'], lang: 'ru' },
  tim: { name: 'Тим', gender: 'm', age: 12, track: 'l', langs: ['de'], school: [], learn: [], likes: ['space'], lang: 'de' }
};
let bad = 0; const ok = (c, m) => { console.log((c ? '  ok  ' : '  FAIL ') + m); if (!c) bad++; };
// a Monday: Russian is Тоша's reading language (the weakest home one) on even days
const DAY1 = new Date('2026-11-16T12:00:00');
async function open(b, path, who, extra = {}) {
  const fam = { engine: 'device', micOff: false, srOff: true, parentPhone: true, startAt: 'kid', cur: who, curFam: 'f1', families: { f1: { id: 'f1', name: 'Т', cc: 'PT', kids: [who], grands: [] } },
    profiles: { [who]: { stars: 5, plays: {}, book: { title: 'Т', log: {} }, settings: { ...KIDS[who], friend: 'kitty', onboarded: true }, ...extra } } };
  const c = await b.newContext(DEV === 'phone' ? { ...devices['iPhone 13'], deviceScaleFactor: 1 } : { viewport: { width: 1280, height: 800 } });
  await c.grantPermissions(['microphone']).catch(() => {});
  await c.route(/ntfy|wikipedia|huggingface|jsdelivr|youtube|wikimedia|workers\.dev/, r => r.abort());
  await c.route(u => /\/(ru|de|pt|en)?\/?(index\.html)?$/.test(u.pathname), async r => { const x = await r.fetch(); let t = await x.text(); t = t.replace(HOOK, HOOK + ' window.__T = { run: s => eval(s) };'); r.fulfill({ response: x, body: t }); });
  await c.addInitScript(s => { window.__said = []; try { speechSynthesis.speak = u => { window.__said.push(u.text); setTimeout(() => u.onend && u.onend(), 5); }; } catch (e) {} if (localStorage.getItem('seeded')) return; localStorage.setItem('seeded', 1); localStorage.setItem('govorilki-v2', JSON.stringify(s.fam)); localStorage.setItem('govorilki-voice', 'device'); }, { fam });
  const p = await c.newPage(); const errs = [];
  await p.clock.setFixedTime(DAY1);
  p.on('pageerror', e => { errs.push(e.message); console.log('PAGEERR', e.stack.slice(0, 400)); });
  await p.goto(BASE + path); await p.waitForTimeout(1500);
  const whoB = await p.$$('.who-kid'); if (whoB.length) { await whoB[0].click(); await p.waitForTimeout(900); }
  const run = s => p.evaluate(s => window.__T.run(s), s);
  await run('GUARD.free = 1');
  return { c, p, errs, run };
}
// tap whatever the screen asks next: an option, «Дальше», «Пропустить», a stop of a recording, writing on the paper
async function stepOnce(p, { speak = true, right = null } = {}) {
  if (await p.$('.overlay .winbox')) return '';
  const vis = async sel => { const e = await p.$(sel); return e && await e.isVisible() && await e.isEnabled() ? e : null; };
  let e;
  if ((e = await vis('.rm-same'))) { await e.click(); return 'same'; }
  if ((e = await vis('.rm-paper'))) {
    if (await vis('.rm-wok')) {
      const bx = await e.boundingBox();
      await p.mouse.move(bx.x + 30, bx.y + 40); await p.mouse.down();
      for (let i = 1; i <= 12; i++) await p.mouse.move(bx.x + 30 + i * 18, bx.y + 40 + (i % 2) * 50);
      await p.mouse.up(); await (await p.$('.rm-wok')).click(); return 'write';
    }
  }
  if ((e = await vis('.rm-stop'))) { await p.waitForTimeout(1600); await e.click(); return 'stop'; }
  if ((e = await vis('.rm-go'))) { if (!speak) { const s = await vis('#rmSkip'); if (s) { await s.click(); return 'skip'; } } await e.click(); return 'go'; }
  if ((e = await vis('.rm-nx button'))) { await e.click(); return 'next'; }
  const opts = await p.$$('.rk-o:not([disabled])');
  if (opts.length) { let pick = opts[0]; if (right) for (const o of opts) if (await right(o)) pick = o; await pick.click(); return 'opt'; }
  if ((e = await vis('#rmOk'))) { await e.click(); return 'name'; }
  return '';
}
(async () => {
  const b = await chromium.launch({ args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] });
  console.log('ru', DEV);
  // 1. Тоша: the game and the «Сегодня» node, the check
  {
    const { c, p, errs, run } = await open(b, 'ru/', 'tosha');
    const tag = 'Тоша';
    ok(await run(`RUME.forKid() && !GAMES.find(g => g.id === 'rume').hide()`), `${tag}: «Русский для меня» is for him`);
    ok(await run(`RUME_DATA.texts.length >= 40 && RUME_DATA.texts.reduce((a, x) => a + x.g.length, 0) >= 150`), `${tag}: ≥40 texts, ≥150 grammar items`);
    ok(await run(`RUME.isDay() && lessonPlan('read').map(s => s.key).join() === 'rume-day'`), `${tag}: Monday's reading step is «Русский для меня» — ${await run(`lessonPlan('read').map(s => s.key).join()`)}`);
    ok(/Русский для меня/.test(await run(`LS().read.name`)), `${tag}: the reading node is called «Русский для меня»`);
    await run(`goHome()`); await p.waitForTimeout(600);
    await p.screenshot({ path: D + `rume-today-${DEV}.png` });
    // the check: four stations, the speaking one with the fake microphone
    await run(`RUME.quest()`); await p.waitForTimeout(800);
    let n = 0, shot = false;
    while (n++ < 80 && !(await run(`!!(P.rume && P.rume.at)`))) {
      const st = await p.$eval('#rmSt', e => e.textContent).catch(() => '');
      if (!shot && /Грамматика/.test(st)) { shot = true; await p.screenshot({ path: D + `rume-quest-gram-${DEV}.png` }); }
      await stepOnce(p); await p.waitForTimeout(450);
    }
    const lv = await run(`JSON.stringify(P.rume.lv)`);
    ok(/"read":[123].*"gram":[123].*"vocab":[123].*"speak":[123]/.test(lv), `${tag}: the check gives four levels — ${lv}`);
    ok(await run(`RSK.has()`), `${tag}: the reading station set the Russian reading step (${await run('RSK.lv()')})`);
    await p.waitForTimeout(800);
    await p.screenshot({ path: D + `rume-quest-result-${DEV}.png` });
    ok(!errs.length, `${tag}: no page errors ` + errs.join(' | '));
    await c.close();
  }
  // 2. Тоша: the daily step — a text on space or football, grammar of the weakest kind (gender), speaking, a word written
  {
    const extra = { rume: { at: '2026-11-10', lv: { read: 2, gram: 1, vocab: 2, speak: 2 }, g: { case: [6, 6], gend: [0, 5], asp: [6, 6], num: [5, 6], calq: [5, 6] }, w: {}, seen: [], st: [], mon: {} } };
    const { c, p, errs, run } = await open(b, 'ru/', 'tosha', extra);
    const tag = 'Тоша day';
    ok((await run(`RUME.weakKinds()[0]`)) === 'gend', `${tag}: the weakest kind is gender agreement`);
    await run(`P.today = null; startLesson('read')`); await p.waitForTimeout(900);
    const title = await p.$eval('.rm-tt', e => e.innerText).catch(() => '');
    const topic = await run(`RUME.textToday().t`);
    ok(['space', 'football'].includes(topic), `${tag}: today's text is on his interest — ${topic}: ${title}`);
    await p.screenshot({ path: D + `rume-day-text-${DEV}.png` });
    let kinds = [], n = 0, sh = false;
    while (n++ < 60) {
      const gk = await p.$eval('.rm-gk', e => e.textContent).catch(() => '');
      if (gk && !kinds.includes(gk)) { kinds.push(gk); if (!sh) { sh = true; await p.screenshot({ path: D + `rume-day-gram-${DEV}.png` }); } }
      if (await p.$('.rm-paper') && !(await p.$('.rm-cmp:not([hidden])'))) await p.screenshot({ path: D + `rume-day-write-${DEV}.png` });
      const r = await stepOnce(p); await p.waitForTimeout(500);
      if (!r && await p.$('.overlay .winbox')) break;
    }
    ok(/род/.test(kinds[0] || ''), `${tag}: the first grammar gaps are of the weakest kind — ${kinds.join(' / ')}`);
    const done = await run(`JSON.stringify([RUME.mon().n, RUME.mon().wr, (P.days[dayKey()] || {}).read || 0])`);
    ok(done === '[1,1,1]', `${tag}: the lesson counts (lessons, words written, «Сегодня» read) — ${done}`);
    ok(await run(`!!P.rume.g.gend && P.rume.g.gend[1] > 5`), `${tag}: the grammar answers were noted`);
    // the report: «Русский язык» with the four skills and the monthly note
    await run(`P.rume.lv.gram = 2; save(); screenParents('guide')`); await p.waitForTimeout(900);
    const rows = await run(`GUIDE.rows(GUIDE.digest(P)).map(r => r.a.k + (r.up ? '↑' : '=') + ':' + r.l)`);
    ok(rows.some(r => /^rume↑:.*грамматика ↑/.test(r)), `${tag}: report area «Русский язык» with ↑ — ${rows.join(' | ')}`);
    const card = await p.$eval('.gd-card', e => e.innerText).catch(() => '');
    ok(/Русский язык\..*За месяц/.test(card.replace(/\s+/g, ' ')), `${tag}: the monthly note is on the card`);
    ok(!/[Сс]делайте|позанимайтесь/.test(card), `${tag}: no tasks for adults`);
    await p.$$eval('.gd-wkr', ds => ds.forEach(d => { d.open = true; }));
    const el = await p.$('.gd-card'); if (el) await el.screenshot({ path: D + `rume-report-${DEV}.png` });
    ok(!errs.length, `${tag}: no page errors ` + errs.join(' | '));
    await c.close();
  }
  // 3. Тоша: «Придумай существо» — six parts, a name, 30 seconds recorded on this phone only
  {
    const extra = { rume: { at: '2026-11-10', lv: { read: 2, gram: 2, vocab: 2, speak: 2 }, g: {}, w: {}, seen: [], st: [], mon: {} } };
    const { c, p, errs, run } = await open(b, 'ru/', 'tosha', extra);
    const tag = 'Тоша creature';
    await run(`RUME.beast()`); await p.waitForTimeout(700);
    for (let i = 0; i < 6; i++) { const o = await p.$$('.rm-parts .rk-o'); await o[(i * 2) % o.length].click(); await p.waitForTimeout(800); }
    ok((await p.$$('.rm-beast > span')).length === 6, `${tag}: the creature has six parts`);
    await p.screenshot({ path: D + `rume-beast-name-${DEV}.png` });
    await p.click('#rmOk'); await p.waitForTimeout(600);
    await p.click('.rm-go'); await p.waitForTimeout(2500);
    await p.screenshot({ path: D + `rume-beast-rec-${DEV}.png` });
    await p.click('.rm-stop'); await p.waitForTimeout(2500);
    const recs = await p.evaluate(() => new Promise(res => { const r = indexedDB.open('govorilki-rume', 1); r.onsuccess = () => { const q = r.result.transaction('rec').objectStore('rec').getAll(); q.onsuccess = () => res(q.result.map(x => [x.kind, x.title, x.buf ? x.buf.byteLength : 0])); }; r.onerror = () => res([]); }));
    ok(recs.length === 1 && recs[0][0] === 'beast' && recs[0][2] > 0, `${tag}: recorded on this phone — ${JSON.stringify(recs)}`);
    ok(!(await run(`JSON.stringify(ROOT)`)).includes(recs[0] ? recs[0][1] : '@@'), `${tag}: the recording is not in the synced data`);
    await p.screenshot({ path: D + `rume-beast-${DEV}.png` });
    // «Продолжи историю» and «Расскажи как эксперт» record the same way; «Мои записи» lists them
    await run(`setTimeout(() => RUME.expert(), 0); 1`); await p.waitForTimeout(800);
    await p.click('.rm-go'); await p.waitForTimeout(1800); await p.click('.rm-stop'); await p.waitForTimeout(2000);
    await run(`setTimeout(() => RUME.recs(), 0); 1`); await p.waitForTimeout(1200);
    const ri = await p.$$eval('.rm-ri', es => es.map(e => e.innerText.split('\n')[0]));
    ok(ri.length === 2, `${tag}: «Мои записи» has the creature and the expert talk — ${ri.join(' / ') || (await p.$eval('#stage', e => e.innerText.slice(0, 200)).catch(() => '?'))}`);
    // the gentle hints on what the recogniser hears
    const h = await run(`JSON.stringify(RUME.hints('Вчера я иду в школе и мой мама сказала что я имею девять лет'))`);
    ok(/в школу/.test(h) && /моя мама/.test(h), `${tag}: hints — ${h}`);
    await run(`RUME.menu()`); await p.waitForTimeout(700);
    await p.screenshot({ path: D + `rume-menu-${DEV}.png` });
    ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${tag}: no sideways scroll`);
    ok(!errs.length, `${tag}: no page errors ` + errs.join(' | '));
    await c.close();
  }
  // 4. on the Portuguese page: the node is there and visits the Russian page
  {
    const extra = { rume: { at: '2026-11-10', lv: { read: 2, gram: 2, vocab: 2, speak: 2 }, g: {}, w: {}, seen: [], st: [], mon: {} } };
    const { c, p, errs, run } = await open(b, 'pt/', 'tosha', extra);
    const tag = 'Тоша pt';
    ok((await run(`lessonPlan('read').map(s => s.key).join()`)) === 'rume-day', `${tag}: the same step on the pt page`);
    ok(/Russo para mim/.test(await run(`LS().read.name`)), `${tag}: the node is translated — ${await run('LS().read.name')}`);
    await run(`P.today = null; startLesson('read')`);
    await p.waitForURL(u => u.pathname.includes('/ru/'), { timeout: 10000 }).catch(() => {});
    await p.waitForTimeout(1800);
    ok(p.url().includes('/ru/') && !!(await p.$('.rm-tt')), `${tag}: the step opens the lesson on the Russian page`);
    ok(!errs.length, `${tag}: no page errors ` + errs.join(' | '));
    await c.close();
  }
  // 5. Тим: only German — he never sees it, on any page
  for (const path of ['de/', 'ru/']) {
    const { c, p, errs, run } = await open(b, path, 'tim');
    const tag = `Тим ${path}`;
    ok(!(await run(`RUME.forKid()`)) && (await run(`GAMES.find(g => g.id === 'rume').hide()`)), `${tag}: not for him`);
    ok(!(await run(`lessonPlan('read').map(s => s.key).join()`)).includes('rume'), `${tag}: not on his «Сегодня»`);
    ok(!errs.length, `${tag}: no page errors ` + errs.join(' | '));
    await c.close();
  }
  await b.close();
  console.log(bad ? `FAILED ${bad}` : 'ALL OK');
  process.exit(bad ? 1 : 0);
})();
