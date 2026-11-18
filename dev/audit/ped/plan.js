// Measures the day for four invented children: steps per lesson, doors, stars per full day.
const { chromium, devices } = require('playwright');
const BASE = 'http://localhost:8781/govorilki/ru/';
const HOOK = 'const fam = () => ROOT.families[ROOT.curFam] || null;';
const kid = (name, g, age, fr, extra = {}) => ({ stars: 5, plays: {}, learn: {}, book: { title: 'Т', log: {} }, settings: { name, gender: g, track: 'r', age, friend: fr, onboarded: true, lang: 'ru', ...extra } });
(async () => {
  const b = await chromium.launch();
  const seed = { engine: 'device', micOff: true, srOff: true, parentPhone: true, cur: 'k1', curFam: 'f1',
    families: { f1: { id: 'f1', name: 'Т', cc: 'PT', kids: ['k1', 'k2', 'k3', 'k4'], grands: [] } },
    profiles: { k1: kid('Тина', 'f', 5, 'kitty'), k2: kid('Тоша', 'm', 7, 'tiger'), k3: kid('Тим', 'm', 9, 'tiger', { track: 'l' }),
      k4: kid('Тая', 'f', 8, 'panda', { langs: ['ru', 'pt', 'en'], school: 'pt', learn: ['en'] }) } };
  const c = await b.newContext({ ...devices['iPhone 13'], deviceScaleFactor: 1 });
  await c.route(/wikipedia|huggingface|jsdelivr|youtube|wikimedia|workers\.dev|nager/, r => r.abort());
  await c.route(u => /\/ru\/?(index\.html)?$/.test(u.pathname), async r => { const x = await r.fetch(); let t = await x.text(); t = t.replace(HOOK, HOOK + ' window.__T = { run: s => eval(s) };'); r.fulfill({ response: x, body: t, headers: { ...x.headers(), 'content-type': 'text/html; charset=utf-8' } }); });
  await c.addInitScript(s => { try { speechSynthesis.speak = u => setTimeout(() => u.onend && u.onend(), 5); } catch (e) {} if (localStorage.getItem('seeded')) return; localStorage.setItem('seeded', '1'); localStorage.setItem('govorilki-v2', JSON.stringify(s)); }, seed);
  const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(BASE); await p.waitForTimeout(1500);
  for (const k of ['k1', 'k2', 'k3', 'k4']) {
    const r = await p.evaluate(k => window.__T.run(`(() => { ROOT.cur = '${k}'; P = ROOT.profiles['${k}']; save(); 
      const must = SIMPLE.must(), opt = SIMPLE.opt();
      const plans = {}; must.forEach(id => { plans[id] = lessonPlan(id).map(s => s.key); });
      let doors = []; try { doors = SIMPLE.plan(dayNo()).map ? SIMPLE.plan(dayNo()) : SIMPLE.plan(dayNo()); } catch (e) { doors = 'err ' + e.message; }
      let today = null; try { today = SIMPLE.today ? SIMPLE.today() : null; } catch (e) { today = 'err ' + e.message; }
      const nGames = Object.values(plans).reduce((a, b) => a + b.length, 0);
      const stars = nGames * 3 + must.length * 3 + 5;
      return { name: P.settings.name, age: P.settings.age, track: P.settings.track, little: (()=>{try{return LITTLE.on()}catch(e){return 'na'}})(), listen: (()=>{try{return LITTLE.listen()}catch(e){return 'na'}})(), rskill: P.rskill, mskill: P.mskill, must, opt, plans, nGames, starsPerDay: stars, doors: typeof doors === 'string' ? doors : JSON.stringify(doors).slice(0, 300), today: typeof today === 'string' ? today : JSON.stringify(today).slice(0, 300), readLangs: (()=>{try{return readLangs()}catch(e){return 'na'}})() };
    })()`), k);
    console.log(JSON.stringify(r, null, 1));
  }
  console.log('errors', errs);
  await b.close();
})();
