// v142: self-hosted story, painting and composer pictures load from img/learn (no Wikimedia), cards and the story figure
const { chromium } = require('playwright');
const PAGE = process.argv[2] || 'http://localhost:8781/govorilki/ru/';
const HOOK = 'const fam = () => ROOT.families[ROOT.curFam] || null;';
(async () => {
  const b = await chromium.launch(); const c = await b.newContext({ viewport: { width: 800, height: 900 } });
  const ext = []; c.on('request', r => { if (/wikimedia/.test(r.url())) ext.push(r.url()); });
  await c.route(/ntfy|wikipedia|huggingface|jsdelivr|youtube|wikimedia|workers\.dev/, r => r.abort());
  await c.route(u => /\/(ru|de|pt|en)?\/?(index\.html)?$/.test(u.pathname), async r => { const x = await r.fetch(); let t = await x.text(); t = t.replace(HOOK, HOOK + ' window.__T = { run: s => eval(s) };'); r.fulfill({ response: x, body: t }); });
  const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); await p.goto(PAGE); await p.waitForTimeout(1500);
  const ids = ['pt-tram', 'pt-farol', 'pt-roca', 'mu-mozart', 'ar-vangogh', 'pt-boca'];
  console.log('urls:', JSON.stringify(await p.evaluate(ids => window.__T.run(`(${JSON.stringify(ids)}).map(id => [id, (learnImg(id) || []).length])`), ids)));
  for (const k of ['lisbon', 'cascais']) {
    await p.evaluate(k => window.__T.run(`screenLearn('${k}')`), k); await p.waitForTimeout(1500);
    const imgs = await p.$$eval('.story-th', x => x.map(i => [i.getAttribute('src').replace(/^.*\/img\//, 'img/'), i.complete && i.naturalWidth > 0]));
    const bad = imgs.filter(x => !x[1]);
    console.log(k, 'thumbs', imgs.length, 'not loaded', JSON.stringify(bad), '| sample', JSON.stringify(imgs.filter(x => /tram|farol/.test(x[0]))));
  }
  await p.evaluate(() => window.__T.run("screenLearn('lisbon')")); await p.waitForTimeout(800);
  const i = await p.evaluate(() => window.__T.run("LEARN.lisbon.items.findIndex(x => x.id === 'pt-tram')"));
  await (await p.$$('.story-c'))[i].click(); await p.waitForTimeout(1500);
  console.log('story figure:', JSON.stringify(await p.$eval('.story-img img', e => [e.getAttribute('src').replace(/^.*\/img\//, 'img/'), e.naturalWidth]).catch(() => 'none')));
  await p.screenshot({ path: require('path').join(__dirname, 'shots', 'img142.png') });
  console.log('wikimedia requests (only pt-boca / mu-glinka expected):', ext.map(u => u.split('/').pop()).join(' ') || 'none');
  console.log('errs', JSON.stringify(errs)); await b.close();
})();
