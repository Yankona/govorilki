// 3. «Для взрослых»: the hub and every page (controls / words / height), taps to the sound, the report, a grandparent.
// node parents.js [phone|laptop]
const L = require('./lib');
const DEV = process.argv[2] || 'phone';
(async () => {
  const b = await L.chromium.launch();
  const seed = L.seedOf('ru', { k1: L.kid('Тина', 'f', 5, 'kitty', 'ru', 'r', { set: { sounds: ['r', 'sh'] } }), k2: L.kid('Тоша', 'm', 9, 'tiger', 'ru', 'l') });
  const { p, shot, text, said, run } = await L.open(b, { lang: 'ru', seed, dev: DEV, tag: 'parents' });
  const out = { notes: [], pages: {} }; const note = (...a) => { out.notes.push(a.join(' ')); console.log(...a); };
  const who = await p.$$('.who-kid'); if (who.length) { await who[0].click(); await p.waitForTimeout(900); }
  L.mark('parents/home');
  const vis = () => p.evaluate(() => { const v = e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && !e.closest('.set-off'); };
    const q = s => [...document.querySelectorAll(s)].filter(v); const root = document.querySelector('#stage') || document.body;
    return { sections: q('.parents section.psec').length, h2: q('.parents h2, .parents h3').map(h => h.innerText.trim().slice(0, 40)), checkboxes: q('.parents input[type=checkbox]').length, selects: q('.parents select').length, inputs: q('.parents input:not([type=checkbox])').length, buttons: q('.parents button').length, details: q('.parents details').length, rows: q('.parents .set-row').map(r => r.innerText.replace(/\s+/g, ' ').trim().slice(0, 60)), words: root.innerText.split(/\s+/).filter(Boolean).length, height: root.scrollHeight, screens: +(root.scrollHeight / innerHeight).toFixed(1) }; });
  let taps = 0;
  const tap = async (sel, what) => { const l = p.locator(sel).first(); if (!(await l.count())) { note('MISSING', what, sel); return false; } await l.scrollIntoViewIfNeeded().catch(() => {}); await l.click(); taps++; await p.waitForTimeout(700); return true; };
  await tap('.kids-top button:has-text("⚙️"), button[aria-label*="зрослых"]', 'gear');
  L.mark('parents/hub');
  const hub = await vis(); out.hub = hub; note('HUB (1 tap from home):', JSON.stringify(hub));
  const hm = await p.evaluate(L.METRICS, 14); note(`hub metrics: small<14px=${hm.small.length} ${JSON.stringify(hm.small.slice(0, 3))} taps<44=${hm.taps.length}`);
  await shot(`3-parents-${DEV}-01-hub`);
  // every page
  const keys = await p.$$eval('.set-menu [data-page]', es => es.map(e => e.dataset.page));
  let tot = { checkboxes: 0, selects: 0, inputs: 0, buttons: 0, details: 0, words: 0 };
  for (const k of keys) {
    await p.click(`.set-menu [data-page="${k}"]`); await p.waitForTimeout(700); L.mark('parents/' + k);
    const v = await vis(); const m = await p.evaluate(L.METRICS, 14);
    out.pages[k] = { ...v, small: m.small.length, smallEx: m.small.slice(0, 3), smallTaps: m.taps.length, smallTapsEx: m.taps.slice(0, 3) };
    for (const f of Object.keys(tot)) tot[f] += v[f];
    note(`PAGE ${k}: sections ${v.sections}, checkboxes ${v.checkboxes}, selects ${v.selects}, inputs ${v.inputs}, buttons ${v.buttons}, details ${v.details}, words ${v.words}, screens tall ${v.screens}; h2: ${JSON.stringify(v.h2.slice(0, 8))}; rows: ${JSON.stringify(v.rows.slice(0, 10))}; small<14: ${m.small.length}, taps<44: ${m.taps.length} ${JSON.stringify(m.taps.slice(0, 2))}`);
    await shot(`3-parents-${DEV}-10-${k}`, { full: true });
    await p.click('#backBtn'); await p.waitForTimeout(500);
  }
  out.total = tot; note('TOTAL over all pages:', JSON.stringify(tot), 'pages:', keys.length);
  // the report: 2 taps from home (gear, «Отчёт»)
  await p.click('.set-menu [data-page="guide"]'); await p.waitForTimeout(600);
  const rep = await p.$eval('#guideBox', e => e.innerText.replace(/\s+/g, ' ').trim().slice(0, 240)).catch(() => null);
  note('REPORT (2 taps: ⚙️ → Отчёт):', JSON.stringify(rep)); await shot(`3-parents-${DEV}-20-report`);
  await p.click('#backBtn'); await p.waitForTimeout(400);
  // the sound: ⚙️ → «Тина» → «Интересы и игры» → chip
  taps = 1;
  await tap('.set-menu [data-page="kid"]', 'kid page'); L.mark('parents/kid');
  const kidRows = await p.$$eval('.parents .set-row', es => es.filter(e => !e.closest('.set-off') && e.offsetParent).map(e => e.innerText.replace(/\s+/g, ' ').trim().slice(0, 50)));
  note('kid page rows:', JSON.stringify(kidRows));
  const sndOnKidPage = await p.$$eval('.parents button', es => es.filter(e => e.offsetParent && /^.{0,3}\s?(Р|Л|С и З|Ш Ж Ч Щ)$/.test(e.innerText.trim())).length);
  note('sound chips directly on the kid page:', sndOnKidPage);
  await tap('#kidSetup', 'interests'); L.mark('parents/kidsetup');
  const ks = await p.evaluate(() => ({ words: document.body.innerText.split(/\s+/).length, buttons: [...document.querySelectorAll('button')].filter(e => e.offsetParent).length, h2: [...document.querySelectorAll('h2, h3, summary')].filter(e => e.offsetParent).map(e => e.innerText.trim().slice(0, 40)), screens: +((document.querySelector('#stage') || document.body).scrollHeight / innerHeight).toFixed(1) }));
  note('kid-setup screen:', JSON.stringify(ks));
  const chip = p.locator('.psec:has(h2:has-text("звуки")) button:has-text("Л")').first();
  const sndBox = await chip.boundingBox().catch(() => null);
  note('sound chips visible without scrolling?', sndBox ? (sndBox.y < 844 ? 'yes' : 'no (y=' + Math.round(sndBox.y) + ')') : 'not found');
  if (await chip.count()) { await chip.scrollIntoViewIfNeeded(); await chip.click(); taps++; await p.waitForTimeout(400); }
  const sounds = await run('JSON.stringify(P.settings.sounds)');
  note(`SOUND: ${taps} taps from home (⚙️ → ${PAGE_NAME('kid')} → Интересы и игры → chip${sndBox && sndBox.y >= 844 ? ' + scroll' : ''}); saved at once: ${sounds}`);
  await shot(`3-parents-${DEV}-30-sounds`);
  out.sound = { taps, sounds, scroll: sndBox && sndBox.y >= 844, ks };
  // a grandparent: ⚙️ → «Семья» → ?
  const toHub = async () => { await run('screenParents()'); await p.waitForTimeout(600); if (!(await p.$('.set-menu:not(.set-off)'))) { await p.click('#backBtn'); await p.waitForTimeout(400); } taps = 1; };
  await toHub();
  await tap('.set-menu [data-page="fam"]', 'family page'); L.mark('parents/fam');
  const famRows = await p.$$eval('.parents button, .parents .set-row', es => [...new Set(es.filter(e => !e.closest('.set-off') && e.offsetParent).map(e => e.innerText.replace(/\s+/g, ' ').trim().slice(0, 50)))]);
  note('family page buttons:', JSON.stringify(famRows)); await shot(`3-parents-${DEV}-40-family`);
  // «Кто в семье» → the editor?
  await tap('button:has-text("Кто в семье")', 'who is in the family'); L.mark('parents/whofam');
  const wf = await text(); const wfB = await p.$$eval('button, a[href]', es => es.filter(e => e.offsetParent).map(e => e.innerText.replace(/\s+/g, ' ').trim().slice(0, 50)).filter(Boolean));
  note(`WHO IN FAMILY (${taps} taps): «${wf.slice(0, 300).replace(/\n/g, ' / ')}» buttons: ${JSON.stringify(wfB.slice(0, 16))} hasAddGrand=${!!(await p.$('#feAddGrand'))}`); await shot(`3-parents-${DEV}-44-whofam`, { full: true });
  if (await p.$('#feAddGrand')) { const bb = await p.locator('#feAddGrand').boundingBox(); note('  ＋ Родной visible without scrolling? ' + (bb && bb.y < 844 ? 'yes' : 'no, y=' + (bb && Math.round(bb.y)))); await tap('#feAddGrand', '＋ Родной');
    const gf0 = await p.$$eval('#feGrands input, #feGrands select, #feGrands button, #feGrands label', es => es.filter(e => e.offsetParent).map(e => e.tagName + ':' + (e.placeholder || e.innerText || e.type).replace(/\s+/g, ' ').trim().slice(0, 30)));
    note(`ADD GRAND via «Кто в семье» (${taps} taps + name + save): form ${JSON.stringify(gf0)}`); await shot(`3-parents-${DEV}-45-addgrand-whofam`); }
  await toHub(); await tap('.set-menu [data-page="fam"]', 'family page');
  // «Пригласить родных»
  const r1 = await tap('button:has-text("Позвать родных"), #famInvP', 'invite'); L.mark('parents/invite');
  const invT = await text(); const invB = await p.$$eval('button, a[href]', es => es.filter(e => e.offsetParent).map(e => e.innerText.trim().slice(0, 50)).filter(Boolean));
  note(`INVITE (${taps} taps): «${invT.slice(0, 420).replace(/\n/g, ' / ')}» buttons: ${JSON.stringify(invB.slice(0, 12))}`); await shot(`3-parents-${DEV}-41-invite`);
  const im = await p.evaluate(L.METRICS, 14); note(`invite metrics: words ${invT.split(/\s+/).length}, small<14 ${im.small.length}, taps<44 ${im.taps.length}`);
  await toHub(); await tap('.set-menu [data-page="fam"]', 'family page');
  if (!(await tap('#pultBtn, button:has-text("Пульт")', 'pult'))) { await run('screenPult()'); await p.waitForTimeout(600); note('  (pult opened by code: no pult button on the family page)'); } L.mark('parents/pult');
  const pultB = await p.$$eval('button', es => es.filter(e => e.offsetParent).map(e => e.innerText.replace(/\s+/g, ' ').trim().slice(0, 50)).filter(Boolean));
  note(`PULT (${taps} taps): buttons ${JSON.stringify(pultB.slice(0, 24))}`); await shot(`3-parents-${DEV}-42-pult`, { full: true });
  let got = false;
  for (const s of ['button:has-text("Изменить семью")', 'button:has-text("Редактировать")', 'button:has-text("✏️")', 'button:has-text("Семья")', '.pv-fam button']) { if (await p.locator(s).first().count()) { await tap(s, s); if (await p.$('#feAddGrand')) { got = true; break; } } }
  if (!got) { note('  no visible way to the family editor from the pult found by the script; opening it by code'); await run("screenFamilyEdit(ROOT.curFam, { back: screenParents })"); await p.waitForTimeout(600); }
  await tap('#feAddGrand', '＋ Родной'); L.mark('parents/addgrand');
  const gf = await p.$$eval('#feGrands input, #feGrands select, #feGrands button, #feGrands label', es => es.filter(e => e.offsetParent).map(e => e.tagName + ':' + (e.placeholder || e.innerText || e.type).replace(/\s+/g, ' ').trim().slice(0, 30)));
  note(`ADD GRAND (${taps} taps${got ? '' : ', editor opened by code'}): form ${JSON.stringify(gf)}`); await shot(`3-parents-${DEV}-43-addgrand`);
  out.grand = { taps, got, gf, famRows, pultB };
  L.fs.writeFileSync(`parents-${DEV}.json`, JSON.stringify(out, null, 1));
  L.saveLog(`log-parents-${DEV}.json`);
  await b.close();
  function PAGE_NAME(k) { return k === 'kid' ? 'Тина' : k; }
})().catch(e => { console.error('FATAL', e); process.exit(1); });
