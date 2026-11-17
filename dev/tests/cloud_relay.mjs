// The server's family channel (cloud/worker.js, /v1/ch) against a local SQLite standing in for D1:
// a note goes in and comes back, «after» skips what a phone has, a bad hash or a plain-text body is refused,
// notes older than 12 hours are not given out. node tests/cloud_relay.mjs
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
const ROOT = new URL('../../cloud/', import.meta.url);
const db = new DatabaseSync(':memory:');
for (const f of fs.readdirSync(new URL('migrations/', ROOT)).sort()) db.exec(fs.readFileSync(new URL('migrations/' + f, ROOT), 'utf8'));
const stmt = (q, a = []) => ({ bind: (...x) => stmt(q, x), first: async () => db.prepare(q).get(...a) || null, all: async () => ({ results: db.prepare(q).all(...a) }),
  run: async () => { const r = db.prepare(q).run(...a); return { meta: { last_row_id: Number(r.lastInsertRowid) } }; } });
const env = { DB: { prepare: q => stmt(q), batch: async l => { const out = []; for (const s of l) out.push(await s.run()); return out; } } };
const { default: W } = await import(new URL('worker.js', ROOT));
const call = async (path, o = {}) => { const r = await W.fetch(new Request('https://x.dev' + path, { headers: { Origin: 'https://govorilki.com', 'CF-Connecting-IP': '1.2.3.4' }, ...o }), env); return [r.status, await r.json()]; };
const T = 'a'.repeat(32), bad = [];
const ok = (c, m) => { if (!c) bad.push(m); };
let [s, j] = await call(`/v1/ch/${T}`, { method: 'POST', body: JSON.stringify({ iv: 'AAAAAAAAAAAAAAAA', ct: 'c2VjcmV0' }) });
ok(s === 200 && j.ok && j.id === 1, 'post ' + s + JSON.stringify(j));
await call(`/v1/ch/${T}`, { method: 'POST', body: JSON.stringify({ iv: 'BBBBBBBBBBBBBBBB', ct: 'c2VjcmV0Mg' }) });
[s, j] = await call(`/v1/ch/${T}?since=12h`); ok(s === 200 && j.msgs.length === 2 && j.msgs[0].ct === 'c2VjcmV0', 'read ' + JSON.stringify(j));
[s, j] = await call(`/v1/ch/${T}?since=12h&after=1`); ok(j.msgs.length === 1 && j.msgs[0].id === 2, 'after');
[s, j] = await call(`/v1/ch/${'b'.repeat(32)}`); ok(j.msgs.length === 0, 'other channel empty');
[s] = await call(`/v1/ch/xyz`, { method: 'POST', body: '{}' }); ok(s >= 400, 'bad hash ' + s);
[s] = await call(`/v1/ch/${T}`, { method: 'POST', body: JSON.stringify({ k: 'prog', kids: [{ n: 'Тина' }] }) }); ok(s === 400, 'plain text refused ' + s);
db.prepare('UPDATE relay SET at = ? WHERE id = 1').run(Date.now() - 13 * 3600e3);
[s, j] = await call(`/v1/ch/${T}?since=0`); ok(j.msgs.length === 1, 'old note hidden ' + j.msgs.length);
const cols = db.prepare('PRAGMA table_info(relay)').all().map(c => c.name).join(',');
ok(cols === 'id,t,at,iv,ct', 'no address or name kept: ' + cols);
console.log(bad.length ? 'FAIL: ' + bad.join(' | ') : 'OK: the channel keeps only sealed notes, 12 hours'); process.exit(bad.length ? 1 : 0);
