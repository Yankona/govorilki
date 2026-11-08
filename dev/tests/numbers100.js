// numbers-100: «Десятки», «Собери число», «Сотня», «После и больше» — tiles in the maths area, three rounds each so
// the level grows 1 → 2 → 3, one wrong answer brings a hint, the Russian voice gets numbers in the right case;
// 4 languages, phone (iPhone 13) and laptop. Usage: node tests/numbers100.js [base url] [phone|laptop]
const { chromium, devices } = require('playwright');
const D = require('path').join(__dirname, 'shots') + '/';
const BASE = process.argv[2] || 'http://localhost:8781/govorilki/', DEV = process.argv[3] || 'phone';
const HOOK = 'const fam = () => ROOT.families[ROOT.curFam] || null;';
const kid = (name, g, age, fr, lang) => ({ stars: 5, plays: {}, book: { title: 'Т', log: {} }, settings: { name, gender: g, track: 'r', age, friend: fr, onboarded: true, lang } });
const GAMES = ['n100-tens', 'n100-build', 'n100-grid', 'n100-order'];
let bad = 0; const ok = (c, m) => { console.log((c ? '  ok  ' : '  FAIL ') + m); if (!c) bad++; };
(async () => {
  const b = await chromium.launch();
  for (const [lang, path] of [['ru', 'ru/'], ['en', ''], ['pt', 'pt/'], ['de', 'de/']].filter(x => !process.env.LANGS || process.env.LANGS.includes(x[0]))) {
    console.log(lang, DEV);
    const fam = { engine: 'device', micOff: true, srOff: true, parentPhone: true, cur: 'k1', curFam: 'f1', families: { f1: { id: 'f1', name: 'Т', cc: 'PT', kids: ['k1', 'k2'], grands: [] } }, profiles: { k1: kid('Тина', 'f', 6, 'kitty', lang), k2: kid('Тоша', 'm', 8, 'tiger', lang) } };
    const c = await b.newContext(DEV === 'phone' ? { ...devices['iPhone 13'], deviceScaleFactor: 1 } : { viewport: { width: 1280, height: 800 } });
    await c.route(/ntfy|wikipedia|huggingface|jsdelivr|youtube|wikimedia|workers\.dev/, r => r.abort());
    await c.route(u => /\/(ru|de|pt|en)?\/?(index\.html)?$/.test(u.pathname), async r => { const x = await r.fetch(); let t = await x.text(); t = t.replace(HOOK, HOOK + ' window.__T = { run: s => eval(s) };'); r.fulfill({ response: x, body: t }); });
    await c.addInitScript(s => { window.__said = []; try { speechSynthesis.speak = u => { window.__said.push(u.text); setTimeout(() => u.onend && u.onend(), 5); }; } catch (e) {} if (localStorage.getItem('seeded')) return; localStorage.setItem('seeded', 1); localStorage.setItem('govorilki-v2', JSON.stringify(s)); }, fam);
    const p = await c.newPage(); const errs = []; p.on('pageerror', e => { errs.push(e.message); console.log('PAGEERR', e.stack.slice(0, 400)); });
    await p.goto(BASE + path); await p.waitForTimeout(1500);
    const who = await p.$$('.who-kid'); if (who.length) { await who[0].click(); await p.waitForTimeout(900); }
    // find the tab that holds the maths tiles
    const tabs = await p.$$eval('.tb[data-tab]', a => a.map(x => x.dataset.tab));
    let tile = null;
    for (const tb of tabs) { await p.click(`.tb[data-tab="${tb}"]`).catch(() => {}); await p.waitForTimeout(500); tile = await p.$('.tile[data-id="n100-tens"]'); if (tile) break; }
    ok(!!tile, 'tiles in the maths area: ' + (await p.$$eval('.tile[data-id^="n100-"]', a => a.map(x => x.innerText.replace(/\s+/g, ' ')).join(' | ')).catch(() => '-')));
    if (tile) { await tile.scrollIntoViewIfNeeded(); await p.waitForTimeout(300); await p.screenshot({ path: D + `n100-${lang}-${DEV}-tiles.png` }); }
    const said = () => p.evaluate(() => window.__said.slice(-1)[0] || '');
    const allSaid = () => p.evaluate(() => window.__said.join(' ¦ '));
    const win = async () => { await p.waitForSelector('.winbox', { timeout: 15000 }).catch(() => {}); return p.$eval('.win-line', e => e.textContent).catch(() => null); };
    const lvl = id => p.evaluate(id => window.__T.run(`nLv('${id.slice(5)}')`), id);
    for (const id of GAMES) {
      for (let round = 0; round < 3; round++) {
        let opened = false;
        if (round === 0 && tile) { const t = await p.$(`.tile[data-id="${id}"]`); if (t) { await t.scrollIntoViewIfNeeded(); await t.click(); await p.waitForTimeout(400); if (!(await p.$('.n-lv'))) await t.click().catch(() => {}); opened = true; } }
        if (!opened) await p.evaluate(id => window.__T.run(`GAMES.find(g => g.id === '${id}').go()`), id);
        await p.waitForTimeout(700);
        if (!(await p.$('.n-lv'))) { await p.screenshot({ path: D + `n100-${lang}-${DEV}-${id}-notopen.png` }); console.log('  (not open: ' + (await p.$eval('.bar h1', e => e.textContent).catch(() => '-')) + ')'); await p.evaluate(id => window.__T.run(`GAMES.find(g => g.id === '${id}').go()`), id); await p.waitForTimeout(700); }
        const lv = await lvl(id);
        ok(lv === round, `${id}: round ${round + 1} at level ${lv + 1}` + (lv === round ? '' : ' ' + await p.evaluate(() => window.__T.run('JSON.stringify([P.n100, GPLAY && 1, P.settings.name])'))));
        let steps = 0, missed = false;
        for (let s = 0; s < 8 && !(await p.$('.winbox')); s++) {
          await p.waitForFunction(() => !document.querySelector('.right') || document.querySelector('.winbox'), null, { timeout: 15000 }).catch(() => {}); await p.waitForTimeout(250);
          if (await p.$('.winbox')) break;
          if (process.env.DEBUG) console.log('   step', id, s, await p.$eval('#bubble', e => e.textContent).catch(() => '-'));
          if (id === 'n100-tens') {
            const rods = await p.$$('.n-tap');
            for (const r of rods) { await r.click(); await p.waitForTimeout(60); }
            const n = rods.length * 10;
            if (s === 0 && round === 0) {
              const w = await p.$(`.num-b:not([data-n="${n}"])`); await w.click(); await p.waitForTimeout(200);
              ok(/\d/.test(await said()) || lang === 'ru', `tens: wrong → «${await said()}»`);
              for (const r of await p.$$('.n-tap')) { await r.click(); await p.waitForTimeout(40); }
            }
            if (s === 1 && round === 2) await p.screenshot({ path: D + `n100-${lang}-${DEV}-tens.png` });
            await p.click(`.num-b[data-n="${n}"]`);
          } else if (id === 'n100-build') {
            const n = +(await p.$eval('#goal', e => e.dataset.n));
            if (s === 0 && round === 0) {
              for (let i = 0; i <= Math.floor(n / 10); i++) { await p.click('#addT'); await p.waitForTimeout(60); }
              await p.waitForTimeout(100); ok((await said()).length > 10, `build: too many tens → «${await said()}»`);
              await p.click('#tray [data-r="t"]'); await p.waitForTimeout(60);
            } else for (let i = 0; i < Math.floor(n / 10); i++) { await p.click('#addT'); await p.waitForTimeout(50); }
            for (let i = 0; i < n % 10; i++) { if (s === 1 && i === n % 10 - 1) await p.screenshot({ path: D + `n100-${lang}-${DEV}-build-l${round + 1}.png` }); await p.click('#addU'); await p.waitForTimeout(50); }
          } else if (id === 'n100-grid') {
            const n = +(await p.$eval('#ask', e => e.dataset.n));
            if (s === 0 && round === 0) {
              await p.click(`.n-grid button[data-n="${n > 50 ? n - 30 : n + 30}"]`); await p.waitForTimeout(200);
              ok(!!(await p.$('.n-grid button.hint')), `grid: wrong → hint row + «${await said()}»`);
            }
            if (s === 1) await p.screenshot({ path: D + `n100-${lang}-${DEV}-grid-l${round + 1}.png` });
            await p.click(`.n-grid button[data-n="${n}"]`);
          } else {
            const ans = await p.$eval('#box', e => e.dataset.ans);
            const pair = await p.$('.n-pair');
            if (s === 1 && !missed) {
              missed = true; const w = await p.$(`.num-b:not([data-n="${ans}"])`);
              if (w) { await w.click(); await p.waitForTimeout(200); ok((await said()).length > 5, `order: wrong → «${await said()}»`); }
            }
            if (s <= 1) await p.screenshot({ path: D + `n100-${lang}-${DEV}-order-${s}-l${round + 1}.png` });
            await p.click(pair ? `.n-pair button[data-n="${ans}"]` : `.num-b[data-n="${ans}"]`);
          }
          steps++; await p.waitForTimeout(900);
        }
        const wl = await win();
        ok(!!wl, `${id}: finished after ${steps} → «${wl}»`);
        if (round === 0 && id === 'n100-build') await p.screenshot({ path: D + `n100-${lang}-${DEV}-win.png` });
      }
      ok(await lvl(id) === 2, `${id}: level grew to 3`);
    }
    const all = (await allSaid()).replace(/\u0301/g, '').replace(/Тина/g, 'Tina');
    if (lang === 'ru') {
      ok(!/\d/.test(all), 'ru voice: no digits reach the voice');
      const m = all.match(/[Пп]осле [а-яё ]+? идёт/g) || [];
      ok(m.length > 0 && m.every(x => !/после (один|два|три|четыре|пять|шесть|семь|восемь|девять|десять|двадцать|тридцать|сорок|пятьдесят|шестьдесят|семьдесят|восемьдесят|девяносто) /.test(x)), 'ru: «после N» in the genitive: ' + m.slice(0, 3).join(' / '));
      const tu = all.match(/(один|два|три|четыре|пять|шесть|семь|восемь|девять) (десяток|десятка|десятков) и [а-яё]+ (единица|единицы|единиц)/g) || [];
      ok(tu.length > 0 && tu.every(x => !/(один|два) единиц|одна десят|две десят/.test(x)), 'ru: tens and ones agree: ' + tu.slice(0, 3).join(' / '));
    } else ok(!/[А-яЁё]/.test(all), `${lang}: no Russian in what was said ` + all.split(' ¦ ').filter(x => /[А-яЁё]/.test(x)).slice(0, 5).join(' / '));
    console.log('  said: ' + all.slice(0, 700));
    ok(!errs.length, 'page errors: ' + JSON.stringify(errs));
    await c.close();
  }
  await b.close();
  console.log(bad ? `FAILED ${bad}` : 'ALL OK'); process.exit(bad ? 1 : 0);
})();
