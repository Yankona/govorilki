// «Спокойный дизайн» (calm-design): screenshots of the key screens for three invented children (4, 6 and 9 — the
// 9-year-old plays the older track with the dark theme), phone and laptop, plus checks that the shared design tokens
// are in place and no page errors happen. node tests/calm_design.js [tag=after] [base] [langs=ru,en,pt,de]
// Shots: tests/shots/calm-<tag>-<lang>-<device>-<screen>.png
const { chromium, devices } = require('playwright');
const path = require('path');
const TAG = process.argv[2] || 'after', BASE = process.argv[3] || 'http://localhost:8781/govorilki/';
const LANGS = (process.argv[4] || 'ru,en,pt,de').split(',');
const SUB = { ru: 'ru/', en: '', pt: 'pt/', de: 'de/' };
const SHOTS = path.join(__dirname, 'shots');
const HOOK = 'const fam = () => ROOT.families[ROOT.curFam] || null;';
const kid = (name, g, age, track, fr, lang) => ({ stars: 37, plays: {}, learn: {}, book: { title: 'Т', log: {} }, recent: [], settings: { name, gender: g, track, age, friend: fr, onboarded: true, lang } });
const wait = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const b = await chromium.launch(); let bad = 0;
  for (const lang of LANGS) {
    const seed = { engine: 'device', micOff: true, srOff: true, parentPhone: true, cur: 'k1', curFam: 'f1',
      families: { f1: { id: 'f1', name: 'Т', cc: 'PT', kids: ['k1', 'k2', 'k3'], grands: [] } },
      profiles: { k1: kid('Тина', 'f', 4, 'r', 'kitty', lang), k2: kid('Тоша', 'm', 6, 'r', 'tiger', lang), k3: kid('Тим', 'm', 9, 'l', 'tiger', lang) } };
    for (const dev of ['phone', 'laptop']) {
      const c = await b.newContext(dev === 'laptop' ? { viewport: { width: 1280, height: 800 } } : { ...devices['iPhone 13'], deviceScaleFactor: 1 });
      await c.route(/ntfy|wikipedia|huggingface|jsdelivr|youtube|wikimedia|workers\.dev/, r => r.abort());
      await c.route(u => /\/(ru|de|pt|en)?\/?(index\.html)?$/.test(u.pathname), async r => { const x = await r.fetch(); let t = await x.text(); t = t.replace(HOOK, HOOK + ' window.__T = { run: s => eval(s) };'); r.fulfill({ response: x, body: t }); });
      await c.addInitScript(s => { try { speechSynthesis.speak = u => setTimeout(() => u.onend && u.onend(), 5); } catch (e) {} if (localStorage.getItem('seeded')) return; localStorage.setItem('seeded', 1); localStorage.setItem('govorilki-v2', JSON.stringify(s)); }, seed);
      const p = await c.newPage(), errs = [], miss = [];
      p.on('pageerror', e => errs.push(e.message));
      const run = s => p.evaluate(x => window.__T.run(x), s);
      const shot = async n => { await wait(700); await p.screenshot({ path: `${SHOTS}/calm-${TAG}-${lang}-${dev}-${n}.png` }); };
      await p.goto(BASE + SUB[lang]); await wait(1500);
      const who = await p.$$('.who-kid'); if (who.length) { await who[0].click(); await wait(900); }
      const kids = dev === 'phone' ? ['k1', 'k2', 'k3'] : ['k2', 'k3'];
      for (const k of kids) {
        await run(`(ROOT.cur='${k}', P=ROOT.profiles['${k}'], P.homeTab='today', goHome())`).catch(e => miss.push(k + ' home ' + e.message));
        await shot(`${k}-today`);
        if (k === 'k2') { await p.evaluate(() => { const st = document.querySelector('#stage'); st.scrollTop = 650; }); await shot(`${k}-today2`); await p.evaluate(() => { const st = document.querySelector('#stage'); st.scrollTop = 1400; }); await shot(`${k}-today3`); }
        if (!(await p.$$('.pd-n')).length) miss.push(k + ' path');
        for (const t of (k === 'k3' || dev === 'laptop' ? ['speak'] : ['speak', 'learn', 'create', 'discover'])) {
          const tb = await p.$(`.tb[data-tab="${t}"]`); if (!tb) { miss.push(k + ' tab ' + t); continue; }
          await tb.click(); await wait(500); await shot(`${k}-${t}`);
          if (k === 'k2' && t === 'speak') { await p.evaluate(() => { document.querySelector('#stage').scrollTop = 700; }); await shot(`${k}-${t}2`); }
          if (!(await p.$$('.tile')).length) miss.push(k + ' tiles ' + t);
        }
      }
      // games and screens with the 6-year-old
      await run(`(ROOT.cur='k2', P=ROOT.profiles['k2'], P.homeTab='today', goHome())`);
      const games = dev === 'phone'
        ? [['count', "GAMES.find(g=>g.id==='count').go()"], ['math', "GAMES.find(g=>g.id==='math-count').go()"], ['syll', "GAMES.find(g=>g.id==='syll').go()"], ['story', "screenLearn('spb')"], ['parents', 'screenParents()']]
        : [['count', "GAMES.find(g=>g.id==='count').go()"], ['parents', 'screenParents()']];
      for (const [n, js] of games) { await run(js).catch(e => miss.push(n + ' ' + e.message)); await wait(900); await shot(n); await run('hush()').catch(() => {}); }
      // the finish card
      await run("GAMES.find(g=>g.id==='count').go()"); await wait(700);
      await run("finish({ key: 'count', stars: 3, line: 'Все нашли!', again: () => {}, menu: () => goHome() })").catch(e => miss.push('finish ' + e.message));
      await wait(1600); await shot('finish');
      if (!(await p.$$('.winbox')).length) miss.push('finish card');
      // the older child's game in the dark theme
      if (dev === 'phone') {
        await run(`(ROOT.cur='k3', P=ROOT.profiles['k3'], P.homeTab='today', goHome())`); await wait(500);
        await run("GAMES.find(g=>g.id==='l-chist').go()").catch(e => miss.push('l-chist ' + e.message)); await wait(900); await shot('k3-game');
      }
      // the design tokens
      const tok = await p.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--accent').trim());
      if (TAG !== 'before' && !tok) miss.push('no --accent token');
      console.log(`${lang} ${dev}: missing ${JSON.stringify(miss)} | errors ${JSON.stringify(errs)}`);
      if (errs.length || miss.length) bad++;
      await c.close();
    }
  }
  await b.close(); console.log(bad ? `FAIL in ${bad} run(s)` : 'OK: calm design'); process.exit(bad ? 1 : 0);
})();
