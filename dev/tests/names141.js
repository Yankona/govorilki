// the new stories as the voice gets them: every capitalised word with its stress mark (or none), to check by eye
const { chromium } = require('playwright');
const PAGE = process.argv[2] || 'http://localhost:8781/govorilki/ru/';
const HOOK = 'const fam = () => ROOT.families[ROOT.curFam] || null;';
(async () => {
  const b = await chromium.launch(); const c = await b.newContext({ viewport: { width: 800, height: 800 } });
  await c.route(/ntfy|wikipedia|huggingface|jsdelivr|youtube|wikimedia|workers\.dev/, r => r.abort());
  await c.route(u => /\/(ru|de|pt|en)?\/?(index\.html)?$/.test(u.pathname), async r => { const x = await r.fetch(); let t = await x.text(); t = t.replace(HOOK, HOOK + ' window.__T = { run: s => eval(s) };'); r.fulfill({ response: x, body: t }); });
  const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); await p.goto(PAGE); await p.waitForTimeout(1500);
  // story words live in data packs on the built page: bring them all back first (and the voice dictionary)
  await p.evaluate(() => window.__T.run(`Promise.all([...Object.values(MORE_STORIES).flat().map(x => PACK.story(x)), SAYRU_P])`));
  const out = await p.evaluate(() => window.__T.run(`(() => {
    const seen = {}, secs = {};
    Object.entries(MORE_STORIES).forEach(([k, list]) => { secs[k] = LEARN[k] ? LEARN[k].items.length : -1; list.forEach(x => [x.t, x.s, x.q, ...x.a].forEach(s => sayParts(s).forEach(m => (m.match(/[А-ЯЁ][а-яё́-]+/g) || []).forEach(w => { seen[w] = (seen[w] || 0) + 1; })))); });
    return { secs, places: PLACES(), own: ownPlaces(), words: Object.keys(seen).sort() };
  })()`));
  console.log('sections:', JSON.stringify(out.secs)); console.log('places:', out.places.join(' ')); console.log('own (main family? no):', out.own.join(' '));
  const marked = out.words.filter(w => w.includes('́')), plain = out.words.filter(w => !w.includes('́'));
  console.log('MARKED', marked.length + ':', marked.join(' '));
  console.log('PLAIN', plain.length + ':', plain.join(' '));
  console.log('errs', JSON.stringify(errs)); await b.close();
})();
