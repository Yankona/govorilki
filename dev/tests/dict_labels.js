// dict-labels: «Что значит слово?» shows and says Wiktionary's labels in full words («в старину, у военных моряков»), never
// an abbreviation with a dot (истор., перен., т. п.); a quote is shown only as a whole sentence; a child up to 8 hears the
// first meaning, the rest come with «Ещё значения». Wiktionary is stubbed with tests/fixtures/wikt.
// The other languages: the screen opens without errors. Usage: node tests/dict_labels.js [base url] [phone|laptop]
const { chromium, devices } = require('playwright');
const fs = require('fs'), path = require('path');
const BASE = process.argv[2] || 'http://localhost:8781/govorilki/', DEV = process.argv[3] || 'phone';
const SHOTS = path.join(__dirname, 'shots'), FIX = path.join(__dirname, 'fixtures', 'wikt');
const HOOK = 'const fam = () => ROOT.families[ROOT.curFam] || null;';
const WORDS = fs.readdirSync(FIX).filter(f => f.endsWith('.json')).map(f => f.slice(0, -5));
const kid = (name, g, age, fr, lang) => ({ stars: 5, plays: {}, learn: {}, book: { title: 'Т', log: {} }, settings: { name, gender: g, track: 'r', age, friend: fr, onboarded: true, lang } });
// an abbreviation a voice would read letter by letter: a short lowercase Russian word with a dot before more text
const ABBR = /(?<![а-яёА-ЯЁ])[а-яё]{1,7}\.(?=\s*[а-яё,;:)(«])/;
let bad = 0; const ok = (c, m) => { console.log((c ? '  ok  ' : '  FAIL ') + m); if (!c) bad++; };
(async () => {
  const b = await chromium.launch();
  for (const [lang, sub] of [['ru', 'ru/'], ['en', ''], ['pt', 'pt/'], ['de', 'de/']]) {
    for (const age of lang === 'ru' ? [6, 10] : [6]) {
      console.log(lang, DEV, 'age', age);
      const fam = { engine: 'device', micOff: true, srOff: true, parentPhone: true, cur: 'k1', curFam: 'f1', families: { f1: { id: 'f1', name: 'Т', cc: 'PT', kids: ['k1'], grands: [] } }, profiles: { k1: kid('Тина', 'f', age, 'kitty', lang) } };
      const c = await b.newContext(DEV === 'phone' ? { ...devices['iPhone 13'], deviceScaleFactor: 1 } : { viewport: { width: 1280, height: 800 } });
      await c.route(/ntfy|wikipedia|huggingface|jsdelivr|youtube|wikimedia|workers\.dev|wiktionary/, r => {
        const u = new URL(r.request().url());
        if (!/wiktionary/.test(u.host)) return r.abort();
        const q = u.searchParams, a = q.get('action');
        const json = o => r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(o) });
        if (a === 'query') { const pages = {}; (q.get('titles') || '').split('|').forEach((t, i) => { pages[WORDS.includes(t) ? i + 1 : -1 - i] = WORDS.includes(t) ? { title: t } : { title: t, missing: '' }; }); return json({ query: { pages } }); }
        if (a === 'parse') { const t = q.get('page'); if (!WORDS.includes(t)) return json({ error: {} }); const f = JSON.parse(fs.readFileSync(path.join(FIX, t + '.json'), 'utf8')); return json({ parse: { title: t, wikitext: { '*': f.wikitext } } }); }
        if (a === 'opensearch') return json([q.get('search'), [], [], []]);
        return json({});
      });
      await c.route(u => /\/(ru|de|pt|en)?\/?(index\.html)?$/.test(u.pathname), async r => { const x = await r.fetch(); let t = await x.text(); t = t.replace(HOOK, HOOK + ' window.__T = { run: s => eval(s) }; { const sp0 = sayParts; sayParts = t => { const r = sp0(t); window.__parts.push(...r); return r; }; }'); r.fulfill({ response: x, body: t }); });
      await c.addInitScript(s => { window.__said = []; window.__parts = []; try { speechSynthesis.speak = u => { window.__said.push(u.text); setTimeout(() => u.onend && u.onend(), 5); }; } catch (e) {} if (localStorage.getItem('seeded')) return; localStorage.setItem('seeded', 1); localStorage.setItem('govorilki-v2', JSON.stringify(s)); }, fam);
      const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
      const run = s => p.evaluate(s => window.__T.run(s), s);
      await p.goto(BASE + sub); await p.waitForTimeout(1500);
      const who = await p.$$('.who-kid'); if (who.length) { await who[0].click(); await p.waitForTimeout(700); }
      await run('screenDict()'); await p.waitForTimeout(600);
      ok(!!await p.$('#dW'), 'the dictionary screen opens');
      if (lang !== 'ru') { ok(!errs.length, 'no page errors ' + JSON.stringify(errs.slice(0, 2))); await c.close(); continue; }
      for (const w of WORDS) {
        await p.evaluate(() => { window.__parts = []; window.__said = []; });
        await p.fill('#dW', w); await p.click('#dGo'); await p.waitForSelector('.d-card', { timeout: 8000 }).catch(() => {}); await p.waitForTimeout(500);
        if (await p.$('#dMore')) { await p.click('#dMore'); await p.waitForTimeout(400); }
        if (await p.$('#dSay')) { await p.click('#dSay'); await p.waitForTimeout(400); }
        const shown = await p.$$eval('.d-m li', x => x.map(e => (e.hidden ? '[hidden] ' : '') + e.innerText.replace(/\s+/g, ' ')));
        const said = await p.evaluate(() => window.__parts.join(' ¦ '));
        const quotes = await p.$$eval('.d-m em', x => x.map(e => e.innerText));
        const abbrShown = shown.filter(t => ABBR.test(t.replace(/«[^»]*»$/, ''))), abbrSaid = said.split(' ¦ ').filter(t => ABBR.test(t.replace(/́/g, '')));
        ok(shown.length > 0 && !abbrShown.length && !abbrSaid.length && !/\((?:[а-яё]{1,8}\.[\s-]?)+\)/.test(shown.join(' ')), `${w}: ${shown.length} meanings, no abbreviations shown or said` + (abbrShown.length || abbrSaid.length ? `\n        shown: ${abbrShown.join(' / ')}\n        said: ${abbrSaid.join(' / ')}` : ''));
        ok(quotes.every(q => /^«[«„"—–(]?\s*\p{Lu}/u.test(q) && /[.!?…]["»”)]*»$/.test(q)), `${w}: quotes are whole sentences (${quotes.length})` + quotes.filter(q => !/[.!?…]["»”)]*»$/.test(q)).map(q => '\n        ' + q).join(''));
        if (w === 'фрегат') {
          await p.evaluate(() => document.querySelector('.d-card h2').scrollIntoView());
          await p.screenshot({ path: `${SHOTS}/dict-${lang}-${DEV}-${age}-frigate.png`, fullPage: true });
          ok(/в старину, у военных моряков/.test(shown[0]) && /в старину, у военных моряков/.test(said), 'фрегат: «в старину, у военных моряков» shown and said');
        }
      }
      // a young child: one meaning, the rest behind «Ещё значения»
      await p.fill('#dW', 'кукла'); await p.click('#dGo'); await p.waitForSelector('.d-card', { timeout: 8000 }).catch(() => {}); await p.waitForTimeout(400);
      const vis = await p.$$eval('.d-m li', x => x.filter(e => !e.hidden).length), more = !!await p.$('#dMore');
      ok(age <= 8 ? vis === 1 && more : vis > 1 && !more, `age ${age}: ${vis} meaning(s) shown, «Ещё значения» ${more ? 'there' : 'not there'}`);
      await p.screenshot({ path: `${SHOTS}/dict-${lang}-${DEV}-${age}-doll.png`, fullPage: true });
      ok(!errs.length, 'no page errors ' + JSON.stringify(errs.slice(0, 2)));
      await c.close();
    }
  }
  await b.close(); console.log(bad ? `FAIL: ${bad}` : 'ALL OK'); process.exit(bad ? 1 : 0);
})();
