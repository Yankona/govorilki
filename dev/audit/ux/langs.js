// 7. /, /pt/, /de/ home as a 7-year-old: Cyrillic left on the page, layout overflow, screenshots (phone + laptop).
const L = require('./lib');
(async () => {
  const b = await L.chromium.launch();
  const out = {};
  for (const lang of ['en', 'pt', 'de']) for (const dev of ['phone', 'laptop']) {
    const seed = L.seedOf(lang, { k1: L.kid('Тоша', 'm', 7, 'tiger', lang, 'r', { set: { likes: ['space', 'draw'] } }) });
    const { p, shot, text, run, c } = await L.open(b, { lang, seed, dev, tag: 'langs-' + lang });
    L.mark(`langs/${lang}/${dev}`);
    const who = await p.$$('.who-kid'); if (who.length) { await who[0].click(); await p.waitForTimeout(900); }
    const cyr = await p.evaluate(() => { const out = []; for (const el of document.querySelectorAll('body *')) { if (el.closest('svg,script,style')) continue; const own = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join('').trim(); if (!own || !/[а-яё]/i.test(own)) continue; const r = el.getBoundingClientRect(); if (r.width < 1 || r.height < 1) continue; out.push({ text: own.slice(0, 70), sel: el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : ''), onScreen: r.top < innerHeight && r.bottom > 0 }); } return out; });
    const m = await p.evaluate(L.METRICS, 14);
    const over = await p.evaluate(() => { const out = []; for (const el of document.querySelectorAll('#stage *, .screen *')) { const r = el.getBoundingClientRect(); if (r.width < 2) continue; if (r.right > innerWidth + 2 && getComputedStyle(el).position !== 'fixed') out.push({ sel: el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : ''), right: Math.round(r.right), text: (el.innerText || '').trim().slice(0, 40) }); if (el.scrollWidth > el.clientWidth + 2 && /auto|scroll/.test(getComputedStyle(el).overflowX) === false && el.clientWidth > 0 && el.children.length === 0 && (el.innerText || '').trim()) out.push({ sel: 'clipped ' + el.tagName.toLowerCase() + '.' + String(el.className).split(' ')[0], text: (el.innerText || '').trim().slice(0, 40) }); } return out.slice(0, 10); });
    const f1 = await shot(`7-lang-${lang}-${dev}-home`);
    await p.evaluate(() => { const s = document.querySelector('#stage') || document.scrollingElement; s.scrollTop = 900; }); const f2 = await shot(`7-lang-${lang}-${dev}-home-scrolled`);
    // the first step and its intro / first game
    await p.evaluate(() => { const s = document.querySelector('#stage') || document.scrollingElement; s.scrollTop = 0; });
    await run('GUARD.free = 1');
    const nd = p.locator('.pd-n.now').first(); if (await nd.count()) { await nd.click(); await p.waitForTimeout(1000); const big = p.locator('.overlay button.big').first(); if (await big.count()) { await shot(`7-lang-${lang}-${dev}-intro`); await big.click(); await p.waitForTimeout(1200); } }
    const cyr2 = await p.evaluate(() => { const out = []; for (const el of document.querySelectorAll('.screen *')) { if (el.closest('svg,script,style')) continue; const own = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join('').trim(); if (own && /[а-яё]/i.test(own)) out.push(own.slice(0, 60)); } return out; });
    const f3 = await shot(`7-lang-${lang}-${dev}-first-game`);
    const said = await p.evaluate(() => window.__said.slice());
    out[`${lang}-${dev}`] = { cyrillicHome: cyr, cyrillicFirstGame: cyr2, overflowX: m.overflowX, scrollW: m.scrollW, innerW: m.innerW, overflowEls: over, small: m.small.length, smallEx: m.small.slice(0, 3), smallTaps: m.taps.length, smallTapsEx: m.taps.slice(0, 3), said: said.slice(0, 8) };
    console.log(`${lang}/${dev}: cyrillic on home ${cyr.length} ${JSON.stringify(cyr.slice(0, 6))}; first game cyrillic ${cyr2.length} ${JSON.stringify(cyr2.slice(0, 4))}; overflowX ${m.overflowX} (${m.scrollW}/${m.innerW}) ${JSON.stringify(over.slice(0, 4))}; small<14 ${m.small.length}; taps<44 ${m.taps.length}; said ${JSON.stringify(said.slice(0, 4))}`);
    await c.close();
  }
  L.fs.writeFileSync('langs.json', JSON.stringify(out, null, 1));
  L.saveLog('log-langs.json');
  await b.close();
})().catch(e => { console.error('FATAL', e); process.exit(1); });
