// shared helpers for the UX audit (invented children only: Тина, Тоша, Тим)
const { chromium, devices } = require('playwright');
const fs = require('fs'), path = require('path');
const BASE = 'http://localhost:8781/govorilki/';
const SUB = { ru: 'ru/', en: '', pt: 'pt/', de: 'de/' };
const SHOTS = path.join(__dirname, 'shots'); fs.mkdirSync(SHOTS, { recursive: true });
const HOOK = 'const fam = () => ROOT.families[ROOT.curFam] || null;';
const kid = (name, g, age, fr, lang, track = 'r', extra = {}) => ({ stars: 5, plays: {}, learn: {}, days: {}, book: { title: 'Т', log: {} }, ...extra,
  settings: { name, gender: g, track, age, friend: fr, onboarded: true, lang, ...(extra.set || {}) } });
const seedOf = (lang, profiles, famExtra = {}) => ({ engine: 'device', micOff: true, srOff: true, parentPhone: true, cur: Object.keys(profiles)[0], curFam: 'f1',
  families: { f1: { id: 'f1', name: 'Т', cc: 'PT', kids: Object.keys(profiles), grands: [], ...famExtra } }, profiles });
// the log of console errors / page errors / failed requests / external requests, tagged with the current screen label
const LOG = { errors: [], failed: [], external: [] };
let CUR = 'start';
const mark = s => { CUR = s; };
async function open(b, { lang = 'ru', seed = null, dev = 'phone', offlineCtx = false, hash = '', record = true, block = true, tag = '' } = {}) {
  const c = await b.newContext(dev === 'laptop' ? { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 } : { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: devices['iPhone 13'].userAgent });
  if (block) await c.route(/ntfy|wikipedia|huggingface|jsdelivr|youtube|wikimedia|workers\.dev/, r => { LOG.external.push({ screen: CUR, tag, url: r.request().url().slice(0, 120), note: 'blocked by test' }); r.abort(); });
  await c.route(u => /\/(ru|de|pt|en)?\/?(index\.html)?$/.test(u.pathname), async r => { const x = await r.fetch(); let t = await x.text(); t = t.replace(HOOK, HOOK + ' window.__T = { run: s => eval(s) };'); r.fulfill({ response: x, body: t }); });
  await c.addInitScript(s => { window.__said = []; try { speechSynthesis.speak = u => { window.__said.push(u.text); setTimeout(() => u.onend && u.onend(), 5); }; } catch (e) {} window.__ws = 0;
    if (s && !localStorage.getItem('seeded')) { localStorage.setItem('seeded', 1); localStorage.setItem('govorilki-v2', JSON.stringify(s)); } }, seed);
  const p = await c.newPage(); const errs = [];
  p.on('pageerror', e => { errs.push(e.message); LOG.errors.push({ kind: 'pageerror', screen: CUR, tag, msg: e.message.slice(0, 300) }); });
  p.on('console', m => { if (m.type() === 'error') LOG.errors.push({ kind: 'console', screen: CUR, tag, msg: m.text().slice(0, 300) }); });
  p.on('requestfailed', r => { const u = r.url(); if (!/localhost/.test(u)) return; LOG.failed.push({ screen: CUR, tag, url: u.slice(0, 160), err: (r.failure() || {}).errorText }); });
  p.on('response', r => { if (r.status() >= 400 && /localhost/.test(r.url())) LOG.failed.push({ screen: CUR, tag, url: r.url().slice(0, 160), err: 'HTTP ' + r.status() }); });
  p.on('request', r => { const u = new URL(r.url()); if (u.hostname !== 'localhost' && u.protocol !== 'data:' && u.protocol !== 'blob:') { if (!LOG.external.some(x => x.url === r.url().slice(0, 120))) LOG.external.push({ screen: CUR, tag, url: r.url().slice(0, 120) }); } });
  await p.goto(BASE + SUB[lang] + hash); await p.waitForTimeout(1500);
  const run = s => p.evaluate(x => window.__T.run(x), s);
  const shot = async (name, o = {}) => { await p.waitForTimeout(o.wait || 600); const f = path.join(SHOTS, name + '.png'); await p.screenshot({ path: f, fullPage: !!o.full }); return f; };
  const text = async () => (await p.evaluate(() => (document.getElementById('app') || document.body).innerText)).replace(/\n{2,}/g, '\n').trim();
  const said = async () => p.evaluate(() => { const s = window.__said.slice(); window.__said.length = 0; return s; });
  return { c, p, errs, run, shot, text, said };
}
// visible text elements with font size < min and visible buttons with tap target < 44
const METRICS = (min = 14) => {
  const vis = el => { const r = el.getBoundingClientRect(); if (r.width < 1 || r.height < 1 || r.bottom < 0 || r.top > innerHeight || r.right < 0 || r.left > innerWidth) return false; const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || cs.display === 'none') return false; let op = 1; for (let e = el; e; e = e.parentElement) op *= +getComputedStyle(e).opacity; return op > .1; };
  const small = [], all = new Set();
  for (const el of document.querySelectorAll('body *')) {
    if (el.closest('svg,script,style,[aria-hidden="true"]')) continue;
    const own = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join('').trim();
    if (!own || !/[\p{L}\p{N}]/u.test(own)) continue;
    if (!vis(el)) continue;
    const fs = parseFloat(getComputedStyle(el).fontSize); all.add(el);
    if (fs < min) small.push({ px: +fs.toFixed(1), text: own.slice(0, 60), sel: el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).join('.') : '') });
  }
  const taps = [], tapsAll = [];
  for (const el of document.querySelectorAll('button, a[href], [role=button], input, select, summary, .tile, .chip')) {
    if (!vis(el)) continue; const r = el.getBoundingClientRect(); tapsAll.push(1);
    if (Math.min(r.width, r.height) < 44) taps.push({ w: Math.round(r.width), h: Math.round(r.height), text: (el.innerText || el.getAttribute('aria-label') || el.title || '').trim().slice(0, 40), sel: el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).slice(0, 3).join('.') : '') });
  }
  small.sort((a, b) => a.px - b.px); taps.sort((a, b) => Math.min(a.w, a.h) - Math.min(b.w, b.h));
  return { textN: all.size, small, tapN: tapsAll.length, taps, overflowX: document.documentElement.scrollWidth > innerWidth + 1, scrollW: document.documentElement.scrollWidth, innerW: innerWidth };
};
const saveLog = name => fs.writeFileSync(path.join(__dirname, name), JSON.stringify(LOG, null, 1));
module.exports = { chromium, devices, BASE, SUB, SHOTS, kid, seedOf, open, LOG, mark, saveLog, METRICS, fs, path };
