// news_batch: checks the news batches (stories/news/YYYY-MM.json, or a weekly YYYY-MM-DD.json) without a browser —
// fields, dates (real, not in the future, in the file's month or week), topic, two https sources, lengths, answers,
// typography, unique ids; then that every text of each story has a non-empty English, Portuguese and German translation
// (i18n/fixed.json, i18n/de/fixed_de.json, group LEARN.news). Usage: node tests/news_batch.js [batch file …] (all by default)
const fs = require('fs'), path = require('path');
const R = path.join(__dirname, '..'), N = path.join(R, 'stories', 'news');
const files = process.argv.slice(2).length ? process.argv.slice(2) : fs.readdirSync(N).filter(f => /^\d{4}-\d{2}(-\d{2})?\.json$/.test(f)).map(f => path.join(N, f));
const TOPICS = ['space', 'animals', 'water', 'plants', 'tech', 'sport', 'places', 'old', 'art', 'music', 'ballet'];
const fixed = JSON.parse(fs.readFileSync(path.join(R, 'i18n', 'fixed.json'), 'utf8'))['LEARN.news'] || {};
const fde = JSON.parse(fs.readFileSync(path.join(R, 'i18n', 'de', 'fixed_de.json'), 'utf8'))['LEARN.news'] || {};
const today = new Date(); let bad = 0, n = 0; const ids = new Set();
const ok = (c, m) => { if (!c) { console.log('  FAIL ' + m); bad++; } };
for (const f of files) {
  const base = path.basename(f), fm = base.slice(0, 7), week = base.length > 12;
  let d; try { d = JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { ok(false, base + ': not JSON — ' + e.message); continue; }
  ok(Array.isArray(d.news) && d.news.length, base + ': no "news" list');
  for (const x of d.news || []) {
    n++; const id = x.id || '?', where = `${base} ${id}`;
    ok(/^news-[a-z0-9-]+$/.test(id) && !ids.has(id), where + ': id (news-<latin>, unique)'); ids.add(id);
    for (const k of ['e', 't', 's', 'q']) ok(typeof x[k] === 'string' && x[k].trim(), `${where}: empty ${k}`);
    const dt = /^(\d{4})-(\d{2})(?:-(\d{2}))?$/.exec(x.date || ''), when = dt && new Date(`${dt[1]}-${dt[2]}-${dt[3] || '01'}T12:00:00`);
    ok(dt && when && when.getMonth() + 1 === +dt[2] && (!dt[3] || when.getDate() === +dt[3]), `${where}: date «${x.date}» (YYYY-MM-DD or YYYY-MM)`);
    ok(when && when <= today, `${where}: the date is in the future`);
    ok(when && (today - when) / 864e5 < 800, `${where}: older than two years`);
    ok(!dt || (week ? Math.abs(new Date(base.slice(0, 10) + 'T12:00:00') - when) / 864e5 <= 45 : x.date.slice(0, 7) === fm), `${where}: the date does not belong to ${base}`);
    ok(TOPICS.includes(x.topic), `${where}: topic «${x.topic}»`);
    ok(!x.place || /^[A-Z]{2}$/.test(x.place), `${where}: place «${x.place}» (ISO code)`);
    ok(Array.isArray(x.src) && x.src.length >= 2 && x.src.every(u => /^https:\/\/[^\s]+$/.test(u)) && new Set(x.src.map(u => new URL(u).hostname)).size >= 2, `${where}: two https sources from two sites`);
    ok(x.s && x.s.length >= 300 && x.s.length <= 800, `${where}: story length ${x.s && x.s.length} (300–800)`);
    ok(Array.isArray(x.a) && x.a.length === 3 && new Set(x.a).size === 3 && x.a.every(a => a.trim()), `${where}: three different answers`);
    ok(!/['"]/.test([x.t, x.s, x.q, ...(x.a || [])].join(' ')), `${where}: straight quotes or apostrophes (use «» and ’)`);
    ok(/20\d\d/.test(x.s.slice(0, 60)), `${where}: the story starts with its date`);
    for (const k of [x.t, x.s, x.q, ...(x.a || [])].filter(k => /[А-яЁё]/.test(k))) {
      const tr = fixed[k], de = fde[k];
      ok(Array.isArray(tr) && tr.length === 2 && tr.every(v => v && v.trim() && !/[А-яЁё]/.test(v)) && de && de.trim() && !/[А-яЁё]/.test(de), `${where}: no translation for «${String(k).slice(0, 50)}»`);
    }
  }
}
console.log(`${files.length} batches, ${n} stories: ` + (bad ? `FAILED ${bad}` : 'ALL OK')); process.exit(bad ? 1 : 0);
