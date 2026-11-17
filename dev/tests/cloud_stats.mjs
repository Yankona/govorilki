// The server's anonymous statistics (cloud/worker.js, /v1/stats and the daily job) against a local SQLite for D1:
// counters add up across phones, bad names and values are dropped, nothing about the sender is stored, the dashboard's
// answer is sealed (no plain numbers), days older than 13 months become months, and a deleted family leaves no rows.
// node tests/cloud_stats.mjs
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
const ROOT = new URL('../../cloud/', import.meta.url);
const db = new DatabaseSync(':memory:');
for (const f of fs.readdirSync(new URL('migrations/', ROOT)).sort()) db.exec(fs.readFileSync(new URL('migrations/' + f, ROOT), 'utf8'));
const stmt = (q, a = []) => ({ bind: (...x) => stmt(q, x), first: async () => db.prepare(q).get(...a) || null, all: async () => ({ results: db.prepare(q).all(...a) }),
  run: async () => { const r = db.prepare(q).run(...a); return { meta: { last_row_id: Number(r.lastInsertRowid) } }; } });
const env = { DB: { prepare: q => stmt(q), batch: async l => { const out = []; for (const s of l) out.push(await s.run()); return out; } } };
const { default: W } = await import(new URL('worker.js', ROOT));
const call = async (path, o = {}, ip = '1.2.3.4') => { const r = await W.fetch(new Request('https://x.dev' + path, { headers: { Origin: 'https://govorilki.com', 'CF-Connecting-IP': ip }, ...o }), env); return [r.status, await r.json()]; };
const bad = [], ok = (c, m) => { if (!c) bad.push(m); };
const day = n => new Date(Date.now() - n * 864e5).toISOString().slice(0, 10);
const send = (days, ip) => call('/v1/stats', { method: 'POST', body: JSON.stringify({ v: 1, lang: 'pt', ver: '164', dev: 'phone', days }) }, ip);
let [s, j] = await send([{ d: day(1), c: { open: 2, min: 15, kids: 1, 'g:chess:s': 1, 'g:chess:e': 1, 'g:chess:st': 3, 'bad key!': 5, huge: 1e9, neg: -1, name: 'Тина' } }], '1.1.1.1');
ok(s === 200 && j.days === 1, 'post ' + s + JSON.stringify(j));
await send([{ d: day(1), c: { open: 1, min: 5, kids: 2 } }, { d: day(2), c: { open: 4 } }, { d: '2020-01-01', c: { open: 9 } }, { d: day(-3), c: { open: 9 } }], '2.2.2.2');
const row = (d, k) => (db.prepare('SELECT n FROM stats_day WHERE day = ? AND k = ?').get(d, k) || {}).n;
ok(row(day(1), 'open') === 3 && row(day(1), 'kids') === 3 && row(day(1), 'phones') === 2 && row(day(1), 'lang:pt') === 2, 'sums ' + JSON.stringify(db.prepare('SELECT * FROM stats_day').all()));
ok(row(day(2), 'open') === 4, 'second day');
ok(!row('2020-01-01', 'open') && !row(day(-3), 'open'), 'old or future days dropped');
ok(!row(day(1), 'bad key!') && !row(day(1), 'huge') && !row(day(1), 'neg') && !row(day(1), 'name'), 'bad counters dropped');
const cols = db.prepare('PRAGMA table_info(stats_day)').all().map(c => c.name).join(',');
ok(cols === 'day,k,n', 'no sender stored: ' + cols);
[s, j] = await call('/v1/stats?days=10');
ok(s === 200 && j.ct && j.ex && !JSON.stringify(j).includes('"open"'), 'dashboard sealed ' + JSON.stringify(j).slice(0, 80));
[s] = await call('/v1/stats', { method: 'POST', body: JSON.stringify({ v: 2, days: [] }) }); ok(s === 400, 'bad version ' + s);
// the daily job: a day 14 months ago goes into its month
const old = day(430); db.prepare('INSERT INTO stats_day (day, k, n) VALUES (?, ?, ?)').run(old, 'open', 7);
let waited = []; await W.scheduled({}, env, { waitUntil: p => waited.push(p) }); await Promise.all(waited);
ok(!row(old, 'open') && (db.prepare('SELECT n FROM stats_month WHERE month = ? AND k = ?').get(old.slice(0, 7), 'open') || {}).n === 7, 'rollup');
ok(row(day(1), 'open') === 3, 'recent days stay');
// many sends from one address are slowed down
let last = 0; for (let i = 0; i < 45; i++) [last] = await send([{ d: day(1), c: { open: 1 } }], '9.9.9.9');
ok(last === 429, 'rate limit ' + last);
// «Удалить всё» on the server: a family made, then deleted with its password, leaves no row with its login
const kidP = { upd: Date.now(), stars: 3, settings: { name: 'Тина' } };
let [s2, f] = await call('/v1/family', { method: 'POST', body: JSON.stringify({ login: 'tinatim', pin: '1234', kids: { k1: kidP } }) }, '5.5.5.5');
ok(s2 === 200 && f.token, 'family made ' + s2 + JSON.stringify(f));
const cnt = () => ['families', 'kids', 'tokens'].map(t => db.prepare(`SELECT COUNT(*) AS n FROM ${t} WHERE login = ?`).get('tinatim').n).join(',');
ok(cnt() === '1,1,1', 'rows made ' + cnt());
const del = pin => W.fetch(new Request('https://x.dev/v1/family', { method: 'DELETE', headers: { Origin: 'https://govorilki.com', 'CF-Connecting-IP': '5.5.5.5', Authorization: 'Bearer ' + f.token }, body: JSON.stringify({ pin }) }), env).then(r => r.status);
ok(await del('9999') === 401 && cnt() === '1,1,1', 'wrong password keeps the family');
ok(await del('1234') === 200 && cnt() === '0,0,0', 'deleted: ' + cnt());
console.log(bad.length ? 'FAIL: ' + bad.join(' | ') : 'OK: statistics add up, carry no sender, 13 months then months; a deleted family leaves nothing'); process.exit(bad.length ? 1 : 0);
