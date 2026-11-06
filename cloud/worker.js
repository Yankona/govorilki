// Говорилки: family sign-in and sync. A family has a login (a word, usually the children's names) and a 4-digit code
// (the app shows it as 4 pictures). The server keeps each child's profile, the newest copy wins, so a child plays as
// themself on any phone. 4 digits are weak on their own: the server locks a login for 15 minutes after 5 wrong codes and
// slows down an address that keeps guessing; each new lock lasts twice as long (up to a day) until the right code. Codes are stored as HMAC with a key that lives only in this database.
const ORIGINS = ['https://govorilki.com', 'https://www.govorilki.com', 'https://yankona.github.io', 'http://localhost:8765'];
const LOCK_AFTER = 5, LOCK_MS = 15 * 60e3, LOCK_MAX = 24 * 3600e3, IP_MAX = 40, IP_WINDOW = 60 * 60e3, TOKEN_DAYS = 400;
const MAX_IDEA = 12e3, IDEA_IP_MAX = 20, IDEA_KEEP = 3000;
const MAX_PROFILE = 600e3, MAX_META = 40e3, MAX_KIDS = 12, MAX_MOVE = 1.9e6, MOVE_TTL = 24 * 3600e3, MOVE_IP_MAX = 30;

const now = () => Date.now();
const enc = new TextEncoder();
const hex = buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
const b64u = buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const rand = n => crypto.getRandomValues(new Uint8Array(n));
const sha = async s => hex(await crypto.subtle.digest('SHA-256', enc.encode(s)));
// «Вера-Сава», «вера сава», «ВЕРАСАВА» are one login
export const normLogin = s => String(s || '').toLowerCase().replace(/ё/g, 'е').replace(/[\s\-_.·,]+/g, '').normalize('NFC');
const LOGIN_RE = /^[a-zа-я0-9]{3,24}$/;
const KID_RE = /^[a-z0-9_]{2,16}$/;

function json(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...extra } });
}
async function hkey(env) {
  let r = await env.DB.prepare("SELECT v FROM config WHERE k = 'hkey'").first();
  if (!r) { await env.DB.prepare("INSERT OR IGNORE INTO config (k, v) VALUES ('hkey', ?)").bind(b64u(rand(32))).run(); r = await env.DB.prepare("SELECT v FROM config WHERE k = 'hkey'").first(); }
  return crypto.subtle.importKey('raw', enc.encode(r.v), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
}
const pinHash = async (env, salt, pin) => hex(await crypto.subtle.sign('HMAC', await hkey(env), enc.encode(salt + ':' + pin)));
async function body(req, max = 2e6) {
  const t = await req.text();
  if (t.length > max) throw Object.assign(new Error('too big'), { status: 413 });
  try { return t ? JSON.parse(t) : {}; } catch (e) { throw Object.assign(new Error('bad json'), { status: 400 }); }
}
async function newToken(env, login) {
  const t = b64u(rand(32)), at = now();
  await env.DB.prepare('INSERT INTO tokens (hash, login, created, seen) VALUES (?, ?, ?, ?)').bind(await sha(t), login, at, at).run();
  return t;
}
async function auth(req, env) {
  const m = (req.headers.get('Authorization') || '').match(/^Bearer ([A-Za-z0-9_-]{20,80})$/);
  if (!m) return null;
  const h = await sha(m[1]), r = await env.DB.prepare('SELECT login, seen FROM tokens WHERE hash = ?').bind(h).first();
  if (!r || now() - r.seen > TOKEN_DAYS * 864e5) return null;
  if (now() - r.seen > 36e5) await env.DB.prepare('UPDATE tokens SET seen = ? WHERE hash = ?').bind(now(), h).run();
  return r.login;
}
// an address that keeps guessing codes waits an hour
async function ipBlocked(env, ip) {
  const r = await env.DB.prepare('SELECT n, since FROM ipfails WHERE ip = ?').bind(ip).first();
  return !!r && now() - r.since < IP_WINDOW && r.n >= IP_MAX;
}
async function ipFail(env, ip) {
  const r = await env.DB.prepare('SELECT n, since FROM ipfails WHERE ip = ?').bind(ip).first();
  if (!r || now() - r.since >= IP_WINDOW) await env.DB.prepare('INSERT OR REPLACE INTO ipfails (ip, n, since) VALUES (?, 1, ?)').bind(ip, now()).run();
  else await env.DB.prepare('UPDATE ipfails SET n = n + 1 WHERE ip = ?').bind(ip).run();
}
async function kidsOf(env, login, since = 0) {
  const r = await env.DB.prepare('SELECT id, upd, profile FROM kids WHERE login = ? ORDER BY rowid').bind(login).all();
  return (r.results || []).map(k => ({ id: k.id, upd: k.upd, ...(k.upd > since ? { profile: JSON.parse(k.profile) } : {}) }));
}
async function familyOut(env, login, since = 0) {
  const f = await env.DB.prepare('SELECT meta, updated FROM families WHERE login = ?').bind(login).first();
  if (!f) return null;
  return { login, meta: JSON.parse(f.meta || '{}'), metaUpd: f.updated, kids: await kidsOf(env, login, since), at: now() };
}
async function suggest(env, login) {
  const out = [];
  for (let i = 2; i < 40 && out.length < 3; i++) {
    const c = (login.slice(0, 22) + i);
    if (!(await env.DB.prepare('SELECT 1 FROM families WHERE login = ?').bind(c).first())) out.push(c);
  }
  return out;
}
const validKid = (id, p) => KID_RE.test(id) && p && typeof p === 'object' && !Array.isArray(p) && p.settings && typeof p.settings === 'object';

async function route(req, env) {
  const url = new URL(req.url), path = url.pathname.replace(/\/+$/, ''), M = req.method;
  const ip = req.headers.get('CF-Connecting-IP') || 'local';
  if (path === '/v1/ping') return json({ ok: true, at: now() });

  // the move from yankona.github.io to govorilki.com: the old page leaves the family's progress here, encrypted with a
  // key that stays in the link (the server never sees it); the new page takes it once, then it is gone
  if (path === '/v1/move' && M === 'POST') {
    const r = await env.DB.prepare('SELECT n, since FROM ipfails WHERE ip = ?').bind('move:' + ip).first();
    if (r && now() - r.since < IP_WINDOW && r.n >= MOVE_IP_MAX) return json({ ok: false, error: 'slow' }, 429);
    const b = await body(req, MAX_MOVE + 1000), data = String(b.data || '');
    if (!/^[A-Za-z0-9_-]{16,}$/.test(data) || data.length > MAX_MOVE) return json({ ok: false, error: 'data' }, 400);
    const id = b64u(rand(12));
    await env.DB.batch([
      env.DB.prepare('DELETE FROM moves WHERE created < ?').bind(now() - MOVE_TTL),
      env.DB.prepare('INSERT INTO moves (id, data, created) VALUES (?, ?, ?)').bind(id, data, now()),
      !r || now() - r.since >= IP_WINDOW ? env.DB.prepare('INSERT OR REPLACE INTO ipfails (ip, n, since) VALUES (?, 1, ?)').bind('move:' + ip, now()) : env.DB.prepare('UPDATE ipfails SET n = n + 1 WHERE ip = ?').bind('move:' + ip)]);
    return json({ ok: true, id });
  }
  const mv = path.match(/^\/v1\/move\/([A-Za-z0-9_-]{16})$/);
  if (mv && M === 'GET') {
    const r = await env.DB.prepare('SELECT data, created FROM moves WHERE id = ?').bind(mv[1]).first();
    if (!r || now() - r.created > MOVE_TTL) return json({ ok: false, error: 'gone' }, 404);
    await env.DB.prepare('DELETE FROM moves WHERE id = ?').bind(mv[1]).run();
    return json({ ok: true, data: r.data });
  }

  // ideas and feedback for the author: a sealed letter (only the author's phone can open it); anyone may read the
  // sealed letters, since they are useless without her key. An address sends at most IDEA_IP_MAX letters an hour.
  if (path === '/v1/idea' && M === 'POST') {
    const r = await env.DB.prepare('SELECT n, since FROM ipfails WHERE ip = ?').bind('idea:' + ip).first();
    if (r && now() - r.since < IP_WINDOW && r.n >= IDEA_IP_MAX) return json({ ok: false, error: 'slow' }, 429);
    const b = await body(req, MAX_IDEA + 500), B64 = /^[A-Za-z0-9_-]+$/;
    if (b.k !== 'fb' || ![b.ex, b.ey, b.iv, b.ct].every(x => typeof x === 'string' && B64.test(x)) || b.ct.length > MAX_IDEA) return json({ ok: false, error: 'letter' }, 400);
    await env.DB.batch([
      env.DB.prepare('INSERT INTO ideas (at, blob) VALUES (?, ?)').bind(now(), JSON.stringify({ k: 'fb', ex: b.ex, ey: b.ey, iv: b.iv, ct: b.ct })),
      env.DB.prepare('DELETE FROM ideas WHERE id <= (SELECT MAX(id) FROM ideas) - ?').bind(IDEA_KEEP),
      !r || now() - r.since >= IP_WINDOW ? env.DB.prepare('INSERT OR REPLACE INTO ipfails (ip, n, since) VALUES (?, 1, ?)').bind('idea:' + ip, now()) : env.DB.prepare('UPDATE ipfails SET n = n + 1 WHERE ip = ?').bind('idea:' + ip)
    ]);
    return json({ ok: true });
  }
  if (path === '/v1/ideas' && M === 'GET') {
    const after = Math.max(0, parseInt(url.searchParams.get('after') || '0', 10) || 0);
    const r = await env.DB.prepare('SELECT id, at, blob FROM ideas WHERE id > ? ORDER BY id LIMIT 300').bind(after).all();
    return json({ ok: true, ideas: (r.results || []).map(x => ({ id: x.id, at: x.at, ...JSON.parse(x.blob) })) });
  }

  if (path === '/v1/check' && M === 'GET') {
    const login = normLogin(url.searchParams.get('login'));
    if (!LOGIN_RE.test(login)) return json({ ok: false, error: 'login' }, 400);
    const taken = !!(await env.DB.prepare('SELECT 1 FROM families WHERE login = ?').bind(login).first());
    return json({ ok: true, login, free: !taken, ...(taken ? { suggest: await suggest(env, login) } : {}) });
  }

  if (path === '/v1/family' && M === 'POST') {
    const b = await body(req), login = normLogin(b.login), pin = String(b.pin || '');
    if (!LOGIN_RE.test(login)) return json({ ok: false, error: 'login' }, 400);
    if (!/^\d{4}$/.test(pin)) return json({ ok: false, error: 'pin' }, 400);
    const meta = JSON.stringify(b.meta || {}); if (meta.length > MAX_META) return json({ ok: false, error: 'meta' }, 413);
    const kids = Object.entries(b.kids || {}).filter(([id, p]) => validKid(id, p)).slice(0, MAX_KIDS);
    if (await env.DB.prepare('SELECT 1 FROM families WHERE login = ?').bind(login).first()) return json({ ok: false, error: 'taken', suggest: await suggest(env, login) }, 409);
    const salt = b64u(rand(16)), at = now();
    const st = [env.DB.prepare('INSERT INTO families (login, salt, pin_hash, meta, created, updated) VALUES (?, ?, ?, ?, ?, ?)').bind(login, salt, await pinHash(env, salt, pin), meta, at, at)];
    for (const [id, p] of kids) { const s = JSON.stringify(p); if (s.length > MAX_PROFILE) continue; st.push(env.DB.prepare('INSERT OR REPLACE INTO kids (login, id, upd, profile) VALUES (?, ?, ?, ?)').bind(login, id, +p.upd || at, s)); }
    await env.DB.batch(st);
    return json({ ok: true, login, token: await newToken(env, login) });
  }

  if (path === '/v1/login' && M === 'POST') {
    if (await ipBlocked(env, ip)) return json({ ok: false, error: 'slow', wait: 60 }, 429);
    const b = await body(req, 4000), login = normLogin(b.login), pin = String(b.pin || '');
    const f = LOGIN_RE.test(login) && await env.DB.prepare('SELECT salt, pin_hash, fails, locks, locked_until FROM families WHERE login = ?').bind(login).first();
    if (!f) { await ipFail(env, ip); return json({ ok: false, error: 'nologin' }, 404); }
    if (f.locked_until > now()) return json({ ok: false, error: 'locked', wait: Math.ceil((f.locked_until - now()) / 60e3) }, 429);
    if (!/^\d{4}$/.test(pin) || await pinHash(env, f.salt, pin) !== f.pin_hash) {
      await ipFail(env, ip);
      const fails = f.fails + 1, lock = fails >= LOCK_AFTER, ms = Math.min(LOCK_MAX, LOCK_MS * 2 ** (f.locks || 0));
      await env.DB.prepare('UPDATE families SET fails = ?, locks = ?, locked_until = ? WHERE login = ?').bind(lock ? 0 : fails, (f.locks || 0) + (lock ? 1 : 0), lock ? now() + ms : 0, login).run();
      return lock ? json({ ok: false, error: 'locked', wait: Math.ceil(ms / 60e3) }, 429) : json({ ok: false, error: 'pin', left: LOCK_AFTER - fails }, 401);
    }
    await env.DB.prepare('UPDATE families SET fails = 0, locks = 0, locked_until = 0 WHERE login = ?').bind(login).run();
    return json({ ok: true, token: await newToken(env, login), ...(await familyOut(env, login)) });
  }

  // everything below needs the family's token
  const login = await auth(req, env);
  if (!login) return json({ ok: false, error: 'auth' }, 401);

  if (path === '/v1/family' && M === 'GET') {
    const out = await familyOut(env, login, +url.searchParams.get('since') || 0);
    return out ? json({ ok: true, ...out }) : json({ ok: false, error: 'auth' }, 401);
  }
  if (path === '/v1/meta' && M === 'PUT') {
    const b = await body(req, MAX_META + 1000), meta = JSON.stringify(b.meta || {});
    if (meta.length > MAX_META) return json({ ok: false, error: 'meta' }, 413);
    await env.DB.prepare('UPDATE families SET meta = ?, updated = ? WHERE login = ?').bind(meta, now(), login).run();
    return json({ ok: true });
  }
  let m = path.match(/^\/v1\/kid\/([a-z0-9_]{2,16})$/);
  if (m && M === 'PUT') {
    const b = await body(req, MAX_PROFILE + 1000), id = m[1], upd = +b.upd || now();
    if (!validKid(id, b.profile)) return json({ ok: false, error: 'profile' }, 400);
    const s = JSON.stringify(b.profile); if (s.length > MAX_PROFILE) return json({ ok: false, error: 'big' }, 413);
    const cur = await env.DB.prepare('SELECT upd FROM kids WHERE login = ? AND id = ?').bind(login, id).first();
    if (cur && cur.upd > upd && !b.force) return json({ ok: false, error: 'newer', upd: cur.upd }, 409);
    if (!cur) { const n = await env.DB.prepare('SELECT COUNT(*) AS n FROM kids WHERE login = ?').bind(login).first(); if (n.n >= MAX_KIDS) return json({ ok: false, error: 'many' }, 400); }
    await env.DB.prepare('INSERT OR REPLACE INTO kids (login, id, upd, profile) VALUES (?, ?, ?, ?)').bind(login, id, upd, s).run();
    return json({ ok: true, upd });
  }
  if (m && M === 'DELETE') {
    await env.DB.prepare('DELETE FROM kids WHERE login = ? AND id = ?').bind(login, m[1]).run();
    return json({ ok: true });
  }
  if (path === '/v1/pin' && M === 'POST') {
    const b = await body(req, 2000), pin = String(b.pin || ''), np = String(b.newPin || '');
    const f = await env.DB.prepare('SELECT salt, pin_hash, locked_until FROM families WHERE login = ?').bind(login).first();
    if (f.locked_until > now()) return json({ ok: false, error: 'locked', wait: Math.ceil((f.locked_until - now()) / 60e3) }, 429);
    if (await pinHash(env, f.salt, pin) !== f.pin_hash) { await ipFail(env, ip); return json({ ok: false, error: 'pin' }, 401); }
    if (!/^\d{4}$/.test(np)) return json({ ok: false, error: 'pin' }, 400);
    const salt = b64u(rand(16));
    await env.DB.prepare('UPDATE families SET salt = ?, pin_hash = ?, fails = 0, locks = 0, locked_until = 0 WHERE login = ?').bind(salt, await pinHash(env, salt, np), login).run();
    return json({ ok: true });
  }
  if (path === '/v1/logout' && M === 'POST') {
    const t = (req.headers.get('Authorization') || '').slice(7);
    await env.DB.prepare('DELETE FROM tokens WHERE hash = ?').bind(await sha(t)).run();
    return json({ ok: true });
  }
  if (path === '/v1/family' && M === 'DELETE') {
    const b = await body(req, 2000), f = await env.DB.prepare('SELECT salt, pin_hash FROM families WHERE login = ?').bind(login).first();
    if (await pinHash(env, f.salt, String(b.pin || '')) !== f.pin_hash) { await ipFail(env, ip); return json({ ok: false, error: 'pin' }, 401); }
    await env.DB.batch(['DELETE FROM kids WHERE login = ?', 'DELETE FROM tokens WHERE login = ?', 'DELETE FROM families WHERE login = ?'].map(q => env.DB.prepare(q).bind(login)));
    return json({ ok: true });
  }
  return json({ ok: false, error: 'not found' }, 404);
}

export default {
  async fetch(req, env) {
    const origin = req.headers.get('Origin') || '';
    const cors = { 'Access-Control-Allow-Origin': ORIGINS.includes(origin) ? origin : ORIGINS[0], 'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Max-Age': '86400', 'Vary': 'Origin' };
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    let res;
    try { res = await route(req, env); }
    catch (e) { res = json({ ok: false, error: e.status ? e.message : 'server' }, e.status || 500); }
    const h = new Headers(res.headers); Object.entries(cors).forEach(([k, v]) => h.set(k, v));
    return new Response(res.body, { status: res.status, headers: h });
  }
};
