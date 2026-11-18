// The audit's reward and small UX fixes (task audit-rewards). Fictional children only (Тина, Тоша, Тим).
// 1) a whole day of the path gives one album sticker, confetti only for milestones, no 👍/👎 inside the path;
// 2) the cotton-bud game is not on the solo path; 3) the friend button does not cover the «Узнаём» tab (phone, laptop);
// 4) the small photos of the stories are in the offline cache and load without a connection;
// 5) «Миссия Л» has the maths of the day; a new little child starts with С/З and the hissing sounds, not Р.
// node tests/audit_rewards.js [base=http://localhost:8781/govorilki/] [lang=ru]
const { chromium, devices } = require('playwright');
const path = require('path');
const BASE = process.argv[2] || 'http://localhost:8781/govorilki/', LANG = process.argv[3] || 'ru';
const SUB = LANG === 'en' ? '' : LANG + '/';
const SHOTS = path.join(__dirname, 'shots');
const HOOK = 'const fam = () => ROOT.families[ROOT.curFam] || null;';
const kid = (name, g, age, track, extra = {}) => ({ stars: 0, plays: {}, learn: {}, days: {}, book: { title: 'Т', log: {} }, settings: { name, gender: g, track, age, friend: 'kitty', onboarded: true, lang: LANG, ...extra } });
let bad = 0;
const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) bad++; };

async function open(b, profiles, dev = 'phone', { route = true } = {}) {
  const c = await b.newContext(dev === 'laptop' ? { viewport: { width: 1280, height: 800 } } : { ...devices['iPhone 13'], deviceScaleFactor: 1 });
  await c.route(/ntfy|wikipedia|huggingface|jsdelivr|youtube|wikimedia|workers\.dev/, r => r.abort());
  if (route) await c.route(u => /\/(ru|de|pt|en)?\/?(index\.html)?$|\/app\.[0-9a-f]+\.js$/.test(u.pathname), async r => { const x = await r.fetch(); let t = await x.text(); t = t.replace(HOOK, HOOK + ' window.__T = { run: s => eval(s) };'); r.fulfill({ response: x, body: t }); });
  const seed = { engine: 'device', micOff: true, srOff: true, parentPhone: true, cur: Object.keys(profiles)[0], curFam: 'f1',
    families: { f1: { id: 'f1', name: 'Т', cc: 'PT', kids: Object.keys(profiles), grands: [] } }, profiles };
  await c.addInitScript(s => { try { speechSynthesis.speak = u => setTimeout(() => u.onend && u.onend(), 5); } catch (e) {} if (localStorage.getItem('seeded')) return; localStorage.setItem('seeded', 1); localStorage.setItem('govorilki-v2', JSON.stringify(s)); }, seed);
  const p = await c.newPage(), errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto(BASE + SUB); await p.waitForTimeout(1500);
  const who = await p.$$('.who-kid'); if (who.length) { await who[0].click(); await p.waitForTimeout(800); }
  return { c, p, errs, run: s => p.evaluate(x => window.__T.run(x), s) };
}

(async () => {
  const b = await chromium.launch();

  // 1) + 2) a whole day of a 7-year-old on the path
  {
    const { c, p, errs, run } = await open(b, { k1: kid('Тоша', 'm', 7, 'r') });
    const r = await run(`(async () => {
      let cf = 0; const cf0 = confetti; confetti = (...a) => { cf++; return cf0(...a); };
      const s0 = stickerCount(), st0 = P.stars; let games = 0, likes = 0, swab = 0;
      for (const id of LIDS()) {
        ACTIVE = id;
        for (let k = 0; k < 30; k++) {
          const s = nextStepOf(id); if (!s) break;
          if (/^swab:/.test(s.key)) swab++;
          finish({ key: s.key, stars: 3 }); games++;
          if (document.querySelector('.overlay .res-like')) likes++;
          document.querySelectorAll('.overlay').forEach(o => o.remove());
          if (!ACTIVE) break;
        }
      }
      const s1 = stickerCount();
      // the next days: one more sticker each, the album of ${30} lasts a month
      const d = new Date(); for (let i = 1; i <= 40; i++) { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate() + i); P.days[dayKey(x)] = { speech: 1 }; }
      return { games, stars: P.stars - st0, stickers: s1 - s0, cf, likes, swab, after40: stickerCount(), all: STK().length,
        plan: lessonPlan0('speech').map(x => x.key) };
    })()`);
    console.log(`day of a 7-year-old: ${r.games} games, +${r.stars} stars, +${r.stickers} stickers, confetti ${r.cf}, 👍/👎 in the path ${r.likes}`);
    ok(r.stickers === 1, 'one album sticker for the whole day');
    ok(r.cf <= 3, `confetti only for milestones (${r.cf} for ${r.games} games)`);
    ok(r.likes === 0, 'no 👍/👎 inside the path');
    ok(r.swab === 0 && !r.plan.some(k => /^swab:/.test(k)), 'the cotton-bud game is not on the solo path');
    ok(r.after40 === r.all, `the album fills only after a month of days (${r.all} stickers)`);
    // outside the path: one game asks 👍/👎 once, aloud
    const r2 = await run(`(() => { goHome(); finish({ key: 'math-add', stars: 3 }); const a = !!document.querySelector('.overlay .res-like'); document.querySelectorAll('.overlay').forEach(o => o.remove());
      P.likeG = { 'math-add': 1 }; finish({ key: 'math-add', stars: 3 }); const b2 = !!document.querySelector('.overlay .res-like'); return { a, b: b2 }; })()`);
    ok(r2.a && !r2.b, '👍/👎 outside the path, only until the game is rated');
    await p.waitForTimeout(400); await p.screenshot({ path: `${SHOTS}/audit-rewards-${LANG}-win.png` });
    ok(!errs.length, 'no page errors ' + JSON.stringify(errs));
    await c.close();
  }

  // 3) the friend button and the «Узнаём» tab, «Простой день» off
  for (const dev of ['phone', 'laptop']) {
    const { c, p, errs, run } = await open(b, { k1: kid('Тоша', 'm', 7, 'r', { day: { on: false } }) }, dev);
    await run(`goHome()`); await p.waitForTimeout(900);
    const r = await p.evaluate(() => {
      const f = document.querySelector('#tkFab'), tabs = [...document.querySelectorAll('.tabbar .tb')];
      if (!f || !tabs.length) return { fab: !!f, tabs: tabs.length };
      const a = f.getBoundingClientRect(), t = tabs[tabs.length - 1].getBoundingClientRect();
      const ix = Math.max(0, Math.min(a.right, t.right) - Math.max(a.left, t.left)), iy = Math.max(0, Math.min(a.bottom, t.bottom) - Math.max(a.top, t.top));
      const all = tabs.reduce((s, x) => { const r2 = x.getBoundingClientRect(); return s + Math.max(0, Math.min(a.right, r2.right) - Math.max(a.left, r2.left)) * Math.max(0, Math.min(a.bottom, r2.bottom) - Math.max(a.top, r2.top)); }, 0);
      return { fab: true, tabs: tabs.length, cover: Math.round(ix * iy / (t.width * t.height) * 100), all: Math.round(all) };
    });
    await p.screenshot({ path: `${SHOTS}/audit-rewards-${LANG}-fab-${dev}.png` });
    ok(r.fab && r.tabs === 5 && r.all === 0, `${dev}: the friend button covers no tab (Узнаём ${r.cover}%)`);
    ok(!errs.length, 'no page errors ' + JSON.stringify(errs));
    await c.close();
  }

  // 4) offline: the small photos of the stories come from the cache (real page, its service worker)
  {
    const { c, p, run } = await open(b, { k1: kid('Тина', 'f', 7, 'r') }, 'phone', { route: false });
    const u = await p.evaluate(() => new URL('../img/learn/spb-birth-s.webp'.replace('../', location.pathname.replace(/[^/]*$/, '').replace(/(en|pt|ru|de)\/$/, '')), location.href).href);
    let hit = false;
    for (let i = 0; i < 40 && !hit; i++) { await p.waitForTimeout(1000); hit = await p.evaluate(x => caches.match(x).then(r => !!r), u); }
    ok(hit, 'a story photo is in the offline cache after one visit');
    await c.setOffline(true);
    const got = await p.evaluate(x => fetch(x).then(r => r.ok && r.headers.get('content-type')).catch(e => 'ERR ' + e.message), u);
    ok(got && /image|webp/.test(got), 'the photo loads without a connection: ' + got);
    await c.close();
  }

  // 5) «Миссия Л»: maths on the path; a new little child's sounds start with С/З
  {
    const { c, p, errs, run } = await open(b, { k1: kid('Тим', 'm', 9, 'l'), k2: kid('Тина', 'f', 4, 'r') });
    await run(`goHome()`); await p.waitForTimeout(900);
    const r = await run(`({ ids: LIDS(), plan: lessonPlan('math').map(x => x.key), nodes: document.querySelectorAll('.pd-n').length,
      def4: defSounds('r', 4), def5: defSounds('r', 5), def6: defSounds('r', 6), legacy: soundsOf({ settings: { track: 'r' } }) })`);
    console.log(`track l: lessons ${r.ids.join(', ')} | maths ${r.plan.join(', ')} | path nodes ${r.nodes}`);
    ok(r.ids.includes('math') && r.plan[0] === 'm-skill' && r.plan.length === 2, '«Миссия Л» has the maths of the day (a round at the level + a game)');
    ok(r.def4[0] === 'sz' && !r.def4.includes('r') && !r.def5.includes('r') && r.def6[r.def6.length - 1] === 'r', `sounds by age: 4 ${r.def4}, 5 ${r.def5}, 6 ${r.def6}`);
    ok(r.legacy.join() === 'r,sh,sz', 'a child who already plays keeps the old programme');
    await p.screenshot({ path: `${SHOTS}/audit-rewards-${LANG}-trackl.png` });
    ok(!errs.length, 'no page errors ' + JSON.stringify(errs));
    await c.close();
  }

  await b.close();
  console.log(bad ? `FAIL ${bad}` : 'OK: audit-rewards');
  process.exit(bad ? 1 : 0);
})();
