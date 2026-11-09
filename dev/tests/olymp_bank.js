// The olympiad bank: every problem is solved here on its own (brute force, simulation or plain arithmetic, written apart
// from the bank) and the result must be the option the bank marks as right. Also the shape: level 1…8, 2–5 distinct
// options, hint 1, hint 2, explanation steps, pictures that parse, enough problems on every level.
// node tests/olymp_bank.js [page.html …]   (default: the Russian source and the four built pages)
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..', '..');
const files = process.argv.slice(2).length ? process.argv.slice(2) : [path.join(__dirname, '../game/govorilki.html'), ...['ru/index.html', 'index.html', 'pt/index.html', 'de/index.html'].map(f => path.join(ROOT, f)).filter(f => fs.existsSync(f))];

function load(file) {
  const s = fs.readFileSync(file, 'utf8'), a = s.indexOf('const OLYMP = ['), e = s.indexOf('OLYMP.push(...OLYMP_NEW);', a), b = e < 0 ? -1 : e + 'OLYMP.push(...OLYMP_NEW);'.length;
  if (a < 0 || b < 0) throw new Error('no bank in ' + file);
  const ctx = {}; vm.createContext(ctx);
  vm.runInContext(s.slice(a, b).replace(/^const (\w+) =/gm, 'var $1 =') + '\nthis.B = OLYMP;', ctx);
  return ctx.B;
}

// ---- helpers for the solvers ----
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const perms = a => a.length <= 1 ? [a] : a.flatMap((x, i) => perms([...a.slice(0, i), ...a.slice(i + 1)]).map(p => [x, ...p]));
const C2 = n => n * (n - 1) / 2;
const sum = a => a.reduce((x, y) => x + y, 0);
const DAYS = ['понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота', 'воскресенье'];
const hm = m => `${Math.floor(m / 60) % 24}:${String(m % 60).padStart(2, '0')}`;
function robotRun(spec, cmds) { const rows = spec.split('|'); let x, y; rows.forEach((r, j) => { const i = r.indexOf('R'); if (i >= 0) { x = i; y = j; } }); for (const c of cmds) { if (c === 'R') x++; if (c === 'L') x--; if (c === 'U') y--; if (c === 'D') y++; if (!rows[y] || !rows[y][x] || rows[y][x] === '#') return null; } return rows[y][x]; }
function bfs(spec) { const rows = spec.split('|'); let s; rows.forEach((r, j) => { const i = r.indexOf('R'); if (i >= 0) s = [i, j]; }); const q = [[...s, 0]], seen = new Set([s + '']); while (q.length) { const [x, y, d] = q.shift(); if (rows[y][x] === '*') return d; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (rows[ny] && rows[ny][nx] && rows[ny][nx] !== '#' && !seen.has(nx + ',' + ny)) { seen.add(nx + ',' + ny); q.push([nx, ny, d + 1]); } } } return -1; }
function lattice(spec) { const rows = spec.split('|'), H = rows.length; let R, T; rows.forEach((r, j) => { if (r.includes('R')) R = [r.indexOf('R'), j]; if (r.includes('*')) T = [r.indexOf('*'), j]; }); const f = (x, y) => (x === T[0] && y === T[1]) ? 1 : (x > T[0] || y < T[1]) ? 0 : f(x + 1, y) + f(x, y - 1); return f(R[0], R[1]); }
const cubeCount = spec => sum(spec.split('/').flatMap(r => r.split(',').map(Number)));
const sticksCount = spec => { const [R, C] = spec.split('x').map(Number); return (R + 1) * C + (C + 1) * R; };
// matchsticks: seven segments, + is two sticks, - is one; one move = take one stick and put it somewhere else
const D7 = { 0: 'abcdef', 1: 'bc', 2: 'abged', 3: 'abgcd', 4: 'fgbc', 5: 'afgcd', 6: 'afgedc', 7: 'abc', 8: 'abcdefg', 9: 'abcdfg', '+': 'hv', '-': 'h' };
const R7 = Object.fromEntries(Object.entries(D7).map(([k, v]) => [[...v].sort().join(''), k]));
const truth = e => { const [l, r] = e.split('='); return /^\d[+-]\d$/.test(l) && /^\d+$/.test(r) && Function('return ' + l)() === +r; };
function oneMove(e) {
  const pos = [...e].map((c, i) => c === '=' ? -1 : i).filter(i => i >= 0), out = new Set();
  for (const i of pos) for (const sg of D7[e[i]]) {
    const a = [...e].map(c => c === '=' ? null : new Set(D7[c])); a[i].delete(sg);
    for (const j of pos) for (const t of (('+-'.includes(e[j])) ? 'hv' : 'abcdefg')) {
      if (a[j].has(t)) continue; const b = a.map(x => x && new Set(x)); b[j].add(t);
      const r = b.map(x => x === null ? '=' : R7[[...x].sort().join('')]); if (r.includes(undefined)) continue;
      const str = r.join(''); if (str !== e) out.add(str);
    }
  }
  return out;
}
const knightMoves = (x, y) => [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]].filter(([a, b]) => x + a >= 0 && x + a < 8 && y + b >= 0 && y + b < 8).length;
function knightDist(s, t) { const q = [[...s, 0]], seen = new Set([s + '']); while (q.length) { const [x, y, d] = q.shift(); if (x === t[0] && y === t[1]) return d; for (const [a, b] of [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]]) { const nx = x + a, ny = y + b; if (nx >= 0 && nx < 8 && ny >= 0 && ny < 8 && !seen.has(nx + ',' + ny)) { seen.add(nx + ',' + ny); q.push([nx, ny, d + 1]); } } } }
function knights(stmts) { // stmts: f(truthArray) → array of booleans said; returns all consistent assignments
  const n = stmts.length, ok = []; for (let m = 0; m < 1 << n; m++) { const T = range(0, n - 1).map(i => !!(m >> i & 1)); if (stmts.every((f, i) => f(T) === T[i])) ok.push(T); } return ok;
}
function riverMin() { // farmer, cat, mouse, cheese; bad pairs alone: cat+mouse, mouse+cheese
  const bad = s => { const f = s[0]; return (s[1] === s[2] && s[1] !== f) || (s[2] === s[3] && s[2] !== f); };
  const q = [['0000', 0]], seen = new Set(['0000']);
  while (q.length) { const [s, d] = q.shift(); if (s === '1111') return d; for (const k of [0, 1, 2, 3]) { if (k && s[k] !== s[0]) continue; const t = [...s]; t[0] = s[0] === '0' ? '1' : '0'; if (k) t[k] = t[0]; const n = t.join(''); if (!bad(n) && !seen.has(n)) { seen.add(n); q.push([n, d + 1]); } } }
}
const minWeigh = (n) => { let k = 0, c = 1; while (c < n) { c *= 3; k++; } return k; };
const dice2 = s => range(1, 6).flatMap(a => range(1, 6).map(b => a + b)).filter(x => x === s).length;
const hanoi = n => n ? 2 * hanoi(n - 1) + 1 : 0;
const collatz = n => { let k = 0; while (n > 1) { n = n % 2 ? 3 * n + 1 : n / 2; k++; } return k; };
const tiles = n => n <= 1 ? 1 : tiles(n - 1) + tiles(n - 2);
const squares = n => sum(range(1, n).map(k => (n - k + 1) ** 2));
const zeros = n => { let z = 0; for (let p = 5; p <= n; p *= 5) z += Math.floor(n / p); return z; };
const inv = a => sum(a.map((x, i) => a.slice(i + 1).filter(y => y < x).length));

// ---- one solver per problem: the value the right option must equal ----
const V = {
  // level 1
  k1: '🐘', k2: (() => { const s = ['🍎', '🍐']; return s[5 % 2]; })(), k3: 2, k4: 4, k5: 1, k6: (() => { const s = ['🔴', '🔵', '🔵']; return s[7 % 3]; })(),
  k7: ['🐱', '🐶', '🐰'][1], k8: 2 * 1, k9: '🔴', k10: 'k10robot', k11: 2 + 1, k12: 'cubes', k13: 2 * 2, k14: '🐘', k15: 5, k16: '🍒', k17: 2 * 2, k18: 'sticks', k19: 3,
  k20: '🍳', k21: 2, k22: 'robot:U', k23: 2,
  // level 2
  m1: ['🔺', '🟦', '🟦'][6 % 3], m2: 4 + 2, m3: '🐕', m4: 'Одинаково', m5: 2 * 2, m6: '🔵', m7: 'robot:RRUU', m8: 5 - 3, m9: 'cubes', m10: 'sticks', m11: 10, m12: '🐭', m13: 3 * 2,
  m14: 'Петухи не несут яиц', m15: 2 * 2, m16: 'Точно зелёный', m17: perms([1, 2]).length, m18: 'Ставит на полку', m19: '🍉', m20: 8, m21: 4 + 2, m22: 'Воскресенье',
  // level 3
  n1: 9, n2: ['🔴', '🔵', '🔵', '🟢'][9 % 4], n3: 3 * 2 + 2 * 4, n4: (() => { const ok = perms(['Ёжик', 'Белка', 'Зайка']).filter(p => p.indexOf('Белка') < p.indexOf('Ёжик') && p.indexOf('Зайка') < p.indexOf('Белка')); return ok.length === 1 && ok[0][0]; })(),
  n5: 2 * 3, n6: 'Число меньше 6', n7: 'robot:RRU', n8: 4 * 2, n9: 'sticks', n10: 'cubes', n11: 7 + 1, n12: 3 * 2, n13: C2(3), n14: 25, n15: 'Красный', n16: '1 час', n17: perms([1, 2]).length, n18: 5 * 2,
  n19: 'cubes', n20: '➡️ ➡️', n21: 'Одинаково', n22: 3,
  // level 4
  p1: 11 + 5, p2: range(0, 5).filter(r => 4 * r + 2 * (5 - r) === 14)[0], p3: 3 * 2, p4: 3 * 2, p5: 'Нет, меньше 2 не бывает', p6: 'robot:RURURU', p7: 10 + 3 - 5, p8: 'sticks', p9: 2, p10: 'cubes',
  p11: (() => { const ok = perms(['Ёжик', 'Белка', 'Зайка']).filter(([r, b, g]) => r !== 'Ёжик' && b !== 'Ёжик' && r !== 'Белка'); return ok.length === 1 && ok[0][0]; })(),
  p12: 4 * 2, p13: '18:00', p14: minWeigh(3), p15: '🟦', p16: perms([1, 2, 3]).length, p17: 'Одинаково', p18: 6 * 4, p19: 5 - 3 + 1, p20: (3 * 2 + 1) * 2, p21: 4 * 2 * 2, p22: 2 * 2,
  // level 5
  q1: 3 + 1 + 1, q2: (() => { const a = [3, 1, 2]; for (let i = 0; i < 2; i++) if (a[i] > a[i + 1]) [a[i], a[i + 1]] = [a[i + 1], a[i]]; return a.join(', '); })(), q3: 'match', q4: 12, q5: 3 * 4,
  q6: (() => { const ok = knights([T => !T[1], T => T[0] && T[1]]).filter(T => T.filter(Boolean).length === 1); return ok.length === 1 && (ok[0][1] ? 'Кот' : 'Пёс'); })(),
  q7: 'cubes', q8: minWeigh(4), q9: range(0, 5).filter(t => 3 * t + 4 * (5 - t) === 18)[0], q10: 5 + 8, q11: 'bfs', q12: dice2(7) > dice2(2) ? '7' : '2',
  // level 6
  r1: 'lattice', r2: 3, r3: 'match', r4: collatz(6), r5: range(1, 21).filter(x => x + 2 * x + 4 * x === 21)[0], r6: '«Яблоки и груши»', r7: 3,
  r8: range(0, 3).filter(s => 2 * s + 4 * (9 - 3 * s) === 16)[0], r9: (1 + 3 + 9) + ' г',
  r10: (() => { const o = ['ОО', 'ОР', 'РО', 'РР']; return o.filter(x => x === 'ОО').length < o.filter(x => x[0] !== x[1]).length ? 'Один орёл и одна решка' : '?'; })(), r11: 2 ** 3,
  // level 7
  s1: C2(6), s2: dice2(7), s3: Math.ceil(Math.log2(100)), s4: 'match',
  s5: range(1, 60).find(n => { if (n % 2) return false; let r = n - (n / 2 + 1); if (r % 2) return false; r = r - (r / 2 + 1); return r === 3; }),
  s6: (() => { const ok = perms(['Ёж', 'Кот', 'Сова', 'Заяц']).filter(p => p.indexOf('Ёж') < p.indexOf('Кот') && p.indexOf('Кот') < p.indexOf('Сова') && p.indexOf('Заяц') > p.indexOf('Сова')); return ok.length === 1 && ok[0][2]; })(),
  s7: (() => { const who = ['Ёж', 'Кот', 'Сова'].filter(c => [c === 'Кот', c !== 'Кот', c !== 'Сова'].filter(Boolean).length === 1); return who.length === 1 && who[0]; })(),
  s8: 12 * (4 - 2), s9: minWeigh(27), s10: 6 * 7, s11: C2(5),
  // level 8
  t1: String(range(2, 12).reduce((b, s) => dice2(s) > dice2(b) ? s : b, 2)), t2: 'lattice', t3: hanoi(3), t4: 24 - 2, t5: 3, t6: minWeigh(8), t7: 6 * 3 / 2, t8: 4 + 2, t9: 33 * 2 - 1, t10: inv([5, 4, 3, 2, 1]),
  t11: zeros(20), t12: 6 * (3 - 2) ** 2, t13: tiles(6), t14: Math.round(96 / 0.8 / 1.2), t15: 32 - 1, t16: 'match', t17: range(0, 7).filter(m => [0, 1, 2].filter(i => m >> i & 1).length === 2).length,
  // the old problems
  o1: 5 - 1, o2: 16 * 2, o3: 6 * 6, o4: 4 * 2 + ' кг', o5: DAYS[(2 + 10) % 7], o6: hm(17 * 60 + 45 + 90), o7: 2 * 2 + 2 * 3 + ' евро', o8: 2, o9: knightMoves(1, 0), o10: 30 / 2 - 7,
  o11: C2(4), o12: 2 + 1, o13: 36 / 2 * 5, o14: range(0, 4).filter(f => 5 * f + 2 * (4 - f) === 14)[0], o15: 24 / 3 + 1, o16: range(1, 20).join('').split('').filter(c => c === '1').length,
  o17: range(10, 99).find(n => Math.floor(n / 10) + n % 10 === 10), o18: (48 - 3 * 8) / 6, o19: squares(2), o20: 4 - 1 + 4,
  o21: (() => { const ok = perms(['скейтер', 'пианист', 'шахматист']).filter(([a, b]) => b !== 'пианист' && b !== 'скейтер' && a !== 'скейтер'); return ok.length === 1 && ['Аня', 'Боря', 'Вова'][ok[0].indexOf('скейтер')]; })(),
  o22: perms([1, 2, 3]).length, o23: 3 * 2, o24: C2(5), o25: (() => { let h = 0; for (let d = 1; ; d++) { h += 3; if (h >= 10) return d + '-й'; h -= 2; } })(), o26: 45 / 3, o27: (3 - 2) ** 3, o28: (() => { const ok = []; for (const a of [true, false]) for (const b of [true, false]) if ((!a && !b) === a) ok.push([a, b]); return ok.length === 1 && `первый — ${ok[0][0] ? 'рыцарь' : 'лжец'}, второй — ${ok[0][1] ? 'рыцарь' : 'лжец'}`; })(),
  o29: (100 + 200) / 10, o30: Math.max(7, 7), o31: 15 + 6, o32: 27, o33: 4, o34: 3 + 6, o35: hm(9 * 60 + 3 * 15), o36: 3 * 3 + 2 * 4, o37: 64 / 2, o38: 'синий', o39: 15 - 6 + 10, o40: hm(10 * 60 + 50 + 25),
  o41: 'Дуся', o42: 3 * 4 + 2 * 2, o43: 4 * 3, o44: 8 + 8, o45: 2 * 4, o46: 'мама', o47: 60 + 30, o48: 99 + 3, o49: '1 ч 25 мин', o50: range(0, 6).filter(w => 3 * w + (6 - w) === 14)[0], o51: 17 + 12 - 25, o52: 4 * 4, o53: 7 + 7,
  o54: perms([0, 5, 7]).filter(p => p[0] !== 0).length, o55: '9 ч 45 мин', o56: (60 - 24) / 6, o57: 5 + 3 - 1, o58: (8 / 2) * (6 / 2), o59: range(1, 99).find(d => d % 4 === 0 && d % 6 === 0), o60: 1 + (8 - 4), o61: 5 * 4,
  o62: 9 / 3 * 7, o63: DAYS[(5 - 2 - 2 + 7) % 7], o64: (20 + 6) / 2, o65: sum(range(1, 4)), o66: 5 * 5,
  o67: (() => { const ok = knights([T => !T[1], T => !T[2], T => !T[0] && !T[1]]); return ok.length === 1 && ok[0].filter(Boolean).length; })(),
  o68: range(0, 23 * 60 + 59).filter(m => { const s = String(Math.floor(m / 60)).padStart(2, '0') + String(m % 60).padStart(2, '0'); return new Set(s).size === 1; }).length,
  o69: minWeigh(9), o70: (() => { const ok = []; for (let b = 1; b < 10; b++) for (let g = 1; g < 10; g++) if (b === g - 1 && g === 2 * (b - 1)) ok.push(b + g); return ok.length === 1 && ok[0]; })(),
  o71: squares(3), o72: 14 + 13, o73: tiles(5), o74: hm(18 * 60 - 6 * 2), o75: range(1, 15).join('').length, o76: riverMin(), o77: (() => { const a = (10 - 4) / 2; return a * (a + 4); })(), o78: knightDist([0, 0], [7, 7]),
  o79: range(100, 999).filter(n => sum(String(n).split('').map(Number)) === 3).length, o80: range(10, 99).filter(n => Math.floor(n / 10) + n % 10 === 7 && (n % 10) * 10 + Math.floor(n / 10) - n === 27)[0]
};

let bad = 0, checked = 0;
const fail = (id, m) => { bad++; console.log('✗', id, m); };
const ru = load(files[0]), byId = Object.fromEntries(ru.map(p => [p.id, p]));
for (const p of ru) {
  let want = V[p.id], right = p.o[p.a];
  if (want === undefined) { fail(p.id, 'no solver'); continue; }
  const m = /^#(\w+):(.*)$/.exec(p.p || '');
  if (typeof want === 'string' && /^robot:/.test(want)) { const r = robotRun(m[2], want.slice(6).split('')); want = r === '*' ? '⭐' : p.it['abcd'.indexOf(r)]; }
  else if (want === 'k10robot') { const r = robotRun(m[2], ['R', 'R']); want = p.it['abcd'.indexOf(r)]; }
  else if (want === 'cubes') want = cubeCount(m[2]);
  else if (want === 'sticks') want = p.id === 'p9' ? 2 : sticksCount(m[2]);
  else if (want === 'bfs') want = bfs(m[2]);
  else if (want === 'lattice') want = lattice(m[2]);
  else if (want === 'match') {
    const e = m[2], moves = oneMove(e), norm = x => x.replace(/\s/g, '').replace('−', '-');
    if (truth(e)) fail(p.id, 'the matchstick start is already true');
    const sols = [...moves].filter(truth);
    if (sols.length !== 1) fail(p.id, 'matchsticks: ' + sols.length + ' true results in one move: ' + sols.join(' '));
    p.o.forEach((o, i) => { const reach = moves.has(norm(o)) && truth(norm(o)); if (i === p.a ? !reach : reach) fail(p.id, `option «${o}» ${i === p.a ? 'is not' : 'is also'} a one-move solution`); });
    want = sols[0] && p.o.find(o => norm(o) === sols[0]);
  }
  if (String(want) !== String(right)) fail(p.id, `solver says «${want}», bank says «${right}»`); else checked++;
}
console.log(`answers: ${checked} of ${ru.length} solved independently and match`);
// the shape, in every language
for (const f of files) {
  const B = f === files[0] ? ru : load(f), lang = path.relative(ROOT, f), per = {};
  for (const p of B) {
    per[p.lv] = (per[p.lv] || 0) + 1;
    const where = `${lang} ${p.id}`;
    if (!(p.lv >= 1 && p.lv <= 8)) fail(where, 'level ' + p.lv);
    if (!Array.isArray(p.o) || p.o.length < 2 || p.o.length > 5) fail(where, 'options');
    else if (new Set(p.o.map(x => String(x).trim().toLowerCase())).size !== p.o.length) fail(where, 'two options are the same: ' + p.o.join(' | '));
    if (!(p.a >= 0 && p.a < p.o.length)) fail(where, 'answer index');
    if (!p.h1 || !p.h2 || !Array.isArray(p.w) || !p.w.length || p.w.some(x => !x)) fail(where, 'hint 1, hint 2 or explanation missing');
    if (!p.q || !p.cat) fail(where, 'text');
    if (p.kp && !/^\d+$/.test(String(p.o[p.a]))) fail(where, 'keypad answer is not a number');
    if (p.lv <= 1 && p.o.length !== 2) fail(where, 'level 1 has two answers');
    if (/^#robot:/.test(p.p || '') && /[a-d]/.test(p.p.slice(7)) && !(p.it && p.it.length)) fail(where, 'robot items');
    if (!/(^|\/)ru\/|govorilki\.html$/.test(f) && /[А-Яа-яЁё]/.test(p.q + p.h1 + p.h2 + p.w.join('') + p.o.join('') + p.cat)) fail(where, 'Russian text left: ' + p.q.slice(0, 60));
    const r = byId[p.id]; if (r && (r.a !== p.a || r.o.length !== p.o.length)) fail(where, 'answers differ from Russian');
  }
  const thin = Object.entries(per).filter(([, n]) => n < 20);
  if (B.length < 200) fail(lang, 'only ' + B.length + ' problems');
  if (Object.keys(per).length !== 8 || thin.length) fail(lang, 'levels: ' + JSON.stringify(per));
  console.log(`${lang}: ${B.length} problems, by level ${JSON.stringify(per)}`);
}
console.log(bad ? `FAIL ${bad}` : 'ok');
process.exit(bad ? 1 : 0);
