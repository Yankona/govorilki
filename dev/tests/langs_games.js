// langs-games: the games that were Russian-only now play in English, Portuguese and German with each language's own words:
// «Хлопни слоги», «Слоги потерялись», «Один — много», «Назови ласково», «Чей хвост?», «Что лишнее?» (played to the end, every
// answer right), and the three
// games for children with several languages: «Где на каком языке» (the map), «Кому как сказать?» (played to the end) and
// «Нужные фразы» (a phrase of the family's own, then the practice to the end). Checked: no page error, no Russian on screen
// or in the voice (except a Russian phrase for a child who speaks Russian), the phrase asked in the page's language and
// answered in the child's other one, no horizontal scroll on a phone. Invented children: Тина (en page, English + Russian),
// Тоша (pt page, Portuguese + German he is learning — the first real user's case), Тим (de page, German + Portuguese).
// node tests/langs_games.js [base] [phone|laptop|both]     env: LANGS=en,pt
const { chromium, devices } = require('playwright');
const fs = require('fs'), D = require('path').join(__dirname, 'shots') + '/';
fs.mkdirSync(D, { recursive: true });
const BASE = process.argv[2] || 'http://localhost:8781/govorilki/', DEVS = (process.argv[3] || 'both') === 'both' ? ['phone', 'laptop'] : [process.argv[3]];
const HOOK = 'const fam = () => ROOT.families[ROOT.curFam] || null;';
const KIDS = { en: ['', 'Тина', 'f', 5, ['en', 'ru'], []], pt: ['pt/', 'Тоша', 'm', 7, ['pt', 'de'], ['de']], de: ['de/', 'Тим', 'm', 9, ['de', 'pt'], []] };
const LANGS = Object.keys(KIDS).filter(l => !process.env.LANGS || process.env.LANGS.includes(l));
const NAMES = /Тина|Тоша|Тим/g, CY = /[А-Яа-яЁё]/;
let bad = 0; const fail = m => { console.log('  FAIL ' + m); bad++; };
async function open(b, dev, lang) {
  const [sub, name, g, age, langs, learn] = KIDS[lang];
  const seed = { engine: 'device', micOff: true, srOff: true, parentPhone: true, cur: 'k1', curFam: 'f1',
    families: { f1: { id: 'f1', name: 'Т', cc: 'PT', kids: ['k1'], grands: [] } },
    profiles: { k1: { stars: 5, plays: {}, learn: {}, book: { title: 'Т', log: {} }, settings: { name, gender: g, track: 'r', age, friend: 'kitty', onboarded: true, lang, langs, learn, day: { on: false } } } } };
  const c = await b.newContext(dev === 'laptop' ? { viewport: { width: 1280, height: 800 } } : { ...devices['iPhone 13'], deviceScaleFactor: 1 });
  await c.route(/ntfy|wikipedia|huggingface|jsdelivr|youtube|wikimedia|workers\.dev|translate\.google/, r => r.abort());
  await c.route(u => /\/(ru|de|pt|en)?\/?(index\.html)?$|\/app\.[0-9a-f]+\.js$/.test(u.pathname), async r => { const x = await r.fetch(); let t = await x.text(); t = t.replace(HOOK, HOOK + ' window.__T = { run: s => eval(s) };'); r.fulfill({ response: x, body: t }); });
  await c.addInitScript(s => {
    window.__said = [];
    try { speechSynthesis.speak = u => { window.__said.push(u.text); setTimeout(() => u.onend && u.onend(), 5); }; } catch (e) {}
    if (localStorage.getItem('seeded')) return; localStorage.setItem('seeded', 1); localStorage.setItem('govorilki-v2', JSON.stringify(s));
  }, seed);
  const p = await c.newPage(); p.errs = [];
  p.on('pageerror', e => p.errs.push(e.message.slice(0, 160)));
  p.on('dialog', d => d.dismiss().catch(() => {}));
  await p.goto(BASE + sub); await p.waitForTimeout(1500);
  const w = await p.$$('.who-kid'); if (w.length) { await w[0].click(); await p.waitForTimeout(800); }
  p.run = s => p.evaluate(s => window.__T.run(s), s);
  // finish() is wrapped: the games that reach the end are noted
  await p.run(`window.__fin = []; { const f0 = finish; finish = o => { window.__fin.push(o.key); return f0(o); }; }`);
  return { c, p };
}
// the screen's text without the children's names and without the phrase in the child's other language
const screenText = p => p.evaluate(() => { const a = (document.querySelector('#app') || document.body).cloneNode(true); a.querySelectorAll('.wr-ans, .phr-t span, .phr-ans, .ow-t small, .wr-hw').forEach(x => x.remove()); return (a.innerText || '').replace(/Русский|Українська/g, ''); });   // a language's own name stays in that language
async function check(p, lang, dev, game) {
  const txt = (await screenText(p)).replace(NAMES, ''), said = (await p.evaluate(() => window.__said.join(' | '))).replace(NAMES, '');
  const st = await p.evaluate(() => ({ w: document.scrollingElement.scrollWidth, iw: innerWidth }));
  if (CY.test(txt)) fail(`${lang}/${dev} ${game}: Russian on screen: «${(txt.match(/.{0,30}[А-Яа-яЁё].{0,30}/) || [''])[0].replace(/\n/g, ' ')}»`);
  if (!KIDS[lang][4].includes('ru') && CY.test(said)) fail(`${lang}/${dev} ${game}: Russian in the voice: «${(said.match(/.{0,30}[А-Яа-яЁё].{0,30}/) || [''])[0]}»`);
  if (dev === 'phone' && st.w > st.iw + 2) fail(`${lang}/${dev} ${game}: horizontal scroll ${st.w}>${st.iw}`);
}
const waitFor = async (p, fn, ms = 12000, arg) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await p.evaluate(fn, arg).catch(() => false)) return true; await p.waitForTimeout(150); } return false; };
const sameHTML = `const same = (el, e) => { const d = document.createElement('div'); d.innerHTML = pic(e); return el && el.innerHTML === d.innerHTML; };`;
const clickSaid = async p => { if (await waitFor(p, () => { const b = document.querySelector('button.said'); return b && !b.disabled; }, 15000)) await p.click('button.said'); else fail('the «I said it» button did not open'); };
async function start(p, id) { await p.run(`window.__said.length = 0; goHome()`); await p.waitForTimeout(200); await p.run(`GAMES.find(g => g.id === '${id}').go()`); await p.waitForTimeout(500); }
const ended = (p, id) => p.evaluate(id => window.__fin.includes(id), id);

async function sylClap(p, lang, dev) {
  await start(p, 'syl-clap');
  const vis = await p.run(`!(GAMES.find(g => g.id === 'syl-clap').hide || (() => false))()`); if (!vis) fail(`${lang} syl-clap hidden`);
  for (let r = 0; r < 8 && !(await ended(p, 'syl-clap')); r++) {
    if (!(await waitFor(p, () => { const w = document.querySelector('#lgW'); return w && w.innerHTML && !document.querySelector('#lgAns').textContent; }))) break;
    const n = await p.run(`(() => { ${sameHTML} const it = LX('XSYL').find(([w, e]) => same($('#lgW'), e)); return it ? it[0].split('-').length : 0; })()`);
    if (!n) { fail(`${lang} syl-clap: the picture is not one of XSYL`); break; }
    if (r === 0) await check(p, lang, dev, 'syl-clap');
    for (let i = 0; i < n; i++) { await p.click('#lgD'); await p.waitForTimeout(60); }
    await p.click('#lgOk');
    await waitFor(p, () => !!document.querySelector('#lgAns') && !!document.querySelector('#lgAns').textContent || !document.querySelector('#lgD'));
    if (r === 0) await check(p, lang, dev, 'syl-clap');
  }
  if (!(await waitFor(p, () => window.__fin.includes('syl-clap')))) fail(`${lang}/${dev} syl-clap: did not reach the end`);
}
async function sylMiss(p, lang, dev) {
  await start(p, 'syl-miss');
  for (let r = 0; r < 8 && !(await ended(p, 'syl-miss')); r++) {
    if (!(await waitFor(p, () => document.querySelectorAll('#lgO .lg-syl:not(.used)').length > 1))) break;
    if (r === 0) await check(p, lang, dev, 'syl-miss');
    const ss = await p.run(`(() => { ${sameHTML} const it = LX('XSYL').find(([w, e]) => same($('#lgW'), e)); return it ? it[0].toUpperCase().split('-') : null; })()`);
    if (!ss) { fail(`${lang} syl-miss: the picture is not one of XSYL`); break; }
    const build = await p.evaluate(() => /\S/.test(document.querySelector('#lgQ').textContent) && document.querySelectorAll('#lgSl .lg-slot.full').length === 0);
    const want = build ? ss : [ss[await p.evaluate(() => [...document.querySelectorAll('#lgSl .lg-slot')].findIndex(x => !x.classList.contains('full')))]];
    for (const s of want) { await p.evaluate(s => [...document.querySelectorAll('#lgO .lg-syl:not(.used)')].find(b => b.dataset.s === s).click(), s); await p.waitForTimeout(120); }
    await waitFor(p, () => document.querySelectorAll('#lgSl .lg-slot:not(.full)').length === 0);
    await p.waitForTimeout(700);
  }
  if (!(await waitFor(p, () => window.__fin.includes('syl-miss')))) fail(`${lang}/${dev} syl-miss: did not reach the end`);
}
// «Один — много», «Назови ласково», «Чей хвост?»: the card names the item; the right answer is found in the language's data
async function quiz(p, lang, dev, id, data, ri) {
  await start(p, id);
  for (let r = 0; r < 8 && !(await ended(p, id)); r++) {
    if (!(await waitFor(p, () => document.querySelectorAll('#lgO .lg-opt').length === 3, 15000))) break;
    if (r === 0) await check(p, lang, dev, id);
    const right = await p.run(`(() => { const one = $('.lg-one b').textContent; const it = LX('${data}').find(x => cap(x[0]) === one); return it && it[${ri}]; })()`);
    if (!right) { fail(`${lang} ${id}: the card is not one of ${data}`); break; }
    await p.evaluate(r => [...document.querySelectorAll('#lgO .lg-opt')].find(b => b.dataset.o === r).click(), right);
    await clickSaid(p);
    // the next card clears the answers first
    await waitFor(p, id => !document.querySelector('button.said') && !document.querySelector('#lgO .lg-opt') || window.__fin.includes(id), 12000, id);
  }
  if (!(await waitFor(p, id => window.__fin.includes(id), 12000, id))) fail(`${lang}/${dev} ${id}: did not reach the end`);
}
async function gramOdd(p, lang, dev) {
  await start(p, 'gram-odd');
  for (let r = 0; r < 7 && !(await ended(p, 'gram-odd')); r++) {
    if (!(await waitFor(p, () => document.querySelectorAll('#lgP .lg-pic').length === 4 && !document.querySelector('#lgP .right')))) break;
    if (r === 0) await check(p, lang, dev, 'gram-odd');
    // the odd one: the only card whose group differs from the other three
    const odd = await p.run(`(() => { const ns = $$('#lgP [data-n]').map(b => b.dataset.n), g = n => LX('XODD').find(c => c.it.some(x => x[1] === n)).k;
      return ns.find(n => ns.filter(m => g(m) === g(n)).length === 1); })()`);
    await p.evaluate(n => [...document.querySelectorAll('#lgP [data-n]')].find(b => b.dataset.n === n).click(), odd);
    if (r === 0) { await p.waitForTimeout(300); await check(p, lang, dev, 'gram-odd'); }
    await clickSaid(p);
    await waitFor(p, () => !document.querySelector('button.said'));
  }
  if (!(await waitFor(p, () => window.__fin.includes('gram-odd')))) fail(`${lang}/${dev} gram-odd: did not reach the end`);
}
async function worldRoles(p, lang, dev) {
  const other = KIDS[lang][4][1];
  if (await p.run(`!!(GAMES.find(g => g.id === 'world-roles').hide())`)) { fail(`${lang} world-roles hidden for a child with two languages`); return; }
  await start(p, 'world-roles');
  await check(p, lang, dev, 'world-roles');
  // school and friends speak the other language
  for (const role of ['school', 'friends']) await p.click(`[data-role="${role}"] .wr-langs [data-l="${other}"]`);
  const map = await p.evaluate(() => document.querySelector('#wrMap').innerText);
  const r = await p.run(`P.settings.roles`);
  if (!r.school.includes(other) || !r.home.includes(lang)) fail(`${lang} world-roles: map not saved ${JSON.stringify(r)}`);
  await check(p, lang, dev, 'world-roles');
  await p.screenshot({ path: `${D}langs_games-roles-${lang}-${dev}.png` });
  return map;
}
async function worldSay(p, lang, dev) {
  await start(p, 'world-say');
  if (!(await p.$('.wr-say'))) { fail(`${lang} world-say: the game did not open (map not ready?)`); return; }
  const other = KIDS[lang][4][1]; let otherSeen = false;
  for (let r = 0; r < 10 && !(await ended(p, 'world-say')); r++) {
    if (!(await waitFor(p, () => !!document.querySelector('#wrOpts .wr-opt:not([disabled])')))) break;
    // the phrase is asked in the page's language
    const ask = await p.evaluate(() => document.querySelector('.wr-card p').textContent);
    if (CY.test(ask.replace(NAMES, ''))) fail(`${lang} world-say: the phrase is asked in Russian: ${ask}`);
    if (r === 0) await check(p, lang, dev, 'world-say');
    // the languages in turn until the right one (a wrong one is greyed out and the friend says which is spoken there)
    for (const c of await p.$$eval('#wrOpts .wr-opt', bs => bs.map(b => b.dataset.c))) {
      await p.evaluate(c => document.querySelector(`#wrOpts [data-c="${c}"]`).click(), c); await p.waitForTimeout(300);
      if (await p.$('#wrSaid')) break;
      if (r < 3) await check(p, lang, dev, 'world-say wrong language');
    }
    if (!(await waitFor(p, () => !!document.querySelector('#wrSaid')))) { fail(`${lang} world-say: no answer`); break; }
    const ans = await p.evaluate(() => [...document.querySelectorAll('.wr-ans')].map(a => a.querySelector('span').textContent + ' ' + a.querySelector('b').textContent));
    if (ans.some(a => a.includes(KIDS[lang][4].map(c => ({ ru: '🇷🇺', pt: '🇵🇹', de: '🇩🇪', en: '🇬🇧' })[c])[1]))) otherSeen = true;
    if (r === 0) { await check(p, lang, dev, 'world-say'); await p.screenshot({ path: `${D}langs_games-say-${lang}-${dev}.png` }); console.log(`  ${lang}/${dev} world-say: «${ask}» → ${ans.join(' / ')}`); }
    await p.click('#wrSaid'); await p.waitForTimeout(250);
  }
  if (!otherSeen) fail(`${lang} world-say: no phrase in ${other}`);
  if (!(await waitFor(p, () => window.__fin.includes('world-say')))) fail(`${lang}/${dev} world-say: did not reach the end`);
}
async function mlPhr(p, lang, dev) {
  const other = KIDS[lang][4][1];
  if (await p.run(`!!(GAMES.find(g => g.id === 'ml-phr').hide())`)) { fail(`${lang} ml-phr hidden for a child with two languages`); return; }
  await start(p, 'ml-phr');
  const tabs = await p.$$eval('.lang-row [data-c]', bs => bs.map(b => b.dataset.c));
  if (tabs.join() !== other) fail(`${lang} ml-phr: languages to learn ${tabs} (want ${other})`);
  const first = await p.evaluate(() => { const r = document.querySelector('.phr-row .phr-t'); return [r.querySelector('b').textContent, r.querySelector('span').textContent]; });
  console.log(`  ${lang}/${dev} ml-phr: «${first[0]}» → «${first[1]}»`);
  if (CY.test(first[0])) fail(`${lang} ml-phr: the phrase is shown in Russian: ${first[0]}`);
  if (other !== 'ru' && CY.test(first[1])) fail(`${lang} ml-phr: the translation is Russian: ${first[1]}`);
  if (other === 'ru' && !CY.test(first[1])) fail(`${lang} ml-phr: the Russian translation is missing: ${first[1]}`);
  await check(p, lang, dev, 'ml-phr');
  // a phrase of the family's own, written in the page's language
  await p.click('#phA'); await p.waitForTimeout(300);
  await check(p, lang, dev, 'ml-phr edit');
  await p.fill('#phRu', { en: 'Where are my wellies?', pt: 'Onde estão as minhas galochas?', de: 'Wo sind meine Gummistiefel?' }[lang]);
  await p.fill(`#phT_${other}`, { ru: 'Где мои резиновые сапоги?', de: 'Wo sind meine Gummistiefel?', pt: 'Onde estão as minhas galochas?' }[other]);
  const gl = await p.evaluate(() => { const a = document.querySelector('.phr-gt'); a.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })); return a.getAttribute('href'); });
  if (!gl.includes(`sl=${lang}&tl=${other}`)) fail(`${lang} ml-phr: Google link ${gl}`);
  await p.click('#phS'); await p.waitForTimeout(400);
  const mine = await p.run(`P.phr.mine[0]`);
  if (!mine || mine.l !== lang) fail(`${lang} ml-phr: own phrase not marked with the page's language ${JSON.stringify(mine)}`);
  if (!(await p.evaluate(() => [...document.querySelectorAll('.phr-row b')].some(b => /wellies|galochas|Gummistiefel/.test(b.textContent))))) fail(`${lang} ml-phr: own phrase not shown`);
  // the practice to the end
  await p.click('#phT'); await p.waitForTimeout(400);
  for (let r = 0; r < 10 && !(await ended(p, 'ml-phr')); r++) {
    if (!(await waitFor(p, () => !!document.querySelector('#phShow')))) break;
    const q = await p.evaluate(() => document.querySelector('.phr-card b').textContent);
    if (CY.test(q)) fail(`${lang} ml-phr practice: asked in Russian ${q}`);
    if (r === 0) await check(p, lang, dev, 'ml-phr practice');
    await p.click('#phShow');
    if (!(await waitFor(p, () => !!document.querySelector('#phBtns [data-r="1"]')))) break;
    if (r === 0) { console.log(`  ${lang}/${dev} ml-phr practice: «${q}» → «${await p.evaluate(() => document.querySelector('#phAns').textContent)}»`); await check(p, lang, dev, 'ml-phr practice'); await p.screenshot({ path: `${D}langs_games-phr-${lang}-${dev}.png` }); }
    await p.click('#phBtns [data-r="1"]'); await p.waitForTimeout(200);
  }
  if (!(await waitFor(p, () => window.__fin.includes('ml-phr')))) fail(`${lang}/${dev} ml-phr: did not reach the end`);
}

(async () => {
  const b = await chromium.launch();
  for (const dev of DEVS) for (const lang of LANGS) {
    const { c, p } = await open(b, dev, lang);
    const e0 = p.errs.length;
    for (const [id, fn] of [['syl-clap', sylClap], ['syl-miss', sylMiss], ['gram-many', (p, l, d) => quiz(p, l, d, 'gram-many', 'XMANY', 1)],
      ['gram-dim', (p, l, d) => quiz(p, l, d, 'gram-dim', 'XDIM', 1)], ['gram-whose', (p, l, d) => quiz(p, l, d, 'gram-whose', 'XWHOSE', 2)], ['gram-odd', gramOdd], ['world-roles', worldRoles], ['world-say', worldSay], ['ml-phr', mlPhr]]) {
      try { await fn(p, lang, dev); } catch (e) { fail(`${lang}/${dev} ${id}: ${e.message.split('\n')[0]}`); }
      if (id === 'gram-odd') await p.screenshot({ path: `${D}langs_games-odd-${lang}-${dev}.png` });
    }
    if (p.errs.length > e0) fail(`${lang}/${dev}: page errors ${p.errs.slice(e0).join(' | ')}`);
    console.log(`${lang}/${dev}: played ${(await p.evaluate(() => window.__fin)).join(', ')}`);
    await c.close();
  }
  await b.close();
  console.log(bad ? `FAIL ${bad}` : 'OK: nine games in English, Portuguese and German');
  process.exit(bad ? 1 : 0);
})();
