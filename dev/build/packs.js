// Makes the page light (called by build.py for every language, after translation):
//  1. other languages: LX('NAME', <Russian default>) whose NAME the language's LANGDATA already has → LX('NAME', null)
//     (the default is never used there, it only weighed on the page);
//  2. story texts: in the story collections (STORY_SETS) every item { id, e, t, s, q, a, … } keeps id, picture, title and
//     the rest; its text, question and answers (s, q, a) go to a data file data/<lang>/<pack>.json { id: {s, q, a} },
//     and the item gets px: '<pack>' — PACK.story(item) brings the words back when the story opens;
//  3. extra packs given on the command line (the Russian voice dictionary) are written as they are.
// PACKS in the page becomes { pack: content hash }; the service worker keeps the files after the first visit.
// node build/packs.js <script in> <script out> <lang> <data dir> [name=file.json …]
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const acorn = require(path.join(__dirname, '..', 'i18n', 'node_modules', 'acorn'));
const walk = require(path.join(__dirname, '..', 'i18n', 'node_modules', 'acorn-walk'));
const [, , IN, OUT, LANG, DIR, ...EXTRA] = process.argv;
// the collections whose items are stories read in screenStory (a variable, or the name given to LX)
const STORY_SETS = ['LEARN', 'PLACE_DATA', 'MORE_STORIES', 'WATER_STORIES', 'PLANT_STORIES', 'BALLET_STORIES'];
const MOVE = ['s', 'q', 'a'];          // the fields that leave the page
const CHUNK = 60000;                   // bytes of moved text per data file (about 15 KB compressed)

const src = fs.readFileSync(IN, 'utf8');
// the script lives inside <script>…</script> blocks of the page: parse the biggest one
const blocks = [...src.matchAll(/<script>([\s\S]*?)<\/script>/g)].sort((a, b) => b[1].length - a[1].length);
const blk = blocks[0], base = blk.index + '<script>'.length, code = blk[1];
const ast = acorn.parse(code, { ecmaVersion: 'latest', sourceType: 'script', allowReturnOutsideFunction: true });

const keyOf = p => p.key && (p.key.type === 'Identifier' ? p.key.name : p.key.value);
const lit = n => {   // the value of a pure literal node, or undefined
  if (!n) return undefined;
  if (n.type === 'Literal' && n.regex === undefined) return n.value;
  if (n.type === 'TemplateLiteral' && !n.expressions.length) return n.quasis[0].value.cooked;
  if (n.type === 'ArrayExpression') { const a = n.elements.map(lit); return a.some(x => x === undefined) ? undefined : a; }
  if (n.type === 'UnaryExpression' && n.operator === '-' && n.argument.type === 'Literal') return -n.argument.value;
  if (n.type === 'ObjectExpression') {
    const o = {};
    for (const p of n.properties) { if (p.type !== 'Property' || p.computed || p.kind !== 'init') return undefined; const v = lit(p.value); if (v === undefined) return undefined; o[keyOf(p)] = v; }
    return o;
  }
  return undefined;
};
const isLX = n => n && n.type === 'CallExpression' && n.callee.type === 'Identifier' && n.callee.name === 'LX' && n.arguments.length === 2 && n.arguments[0].type === 'Literal';

// LANGDATA's names (other languages only)
const LD = new Set();
walk.simple(ast, { VariableDeclarator(d) { if (d.id.name === 'LANGDATA' && d.init && d.init.type === 'ObjectExpression') d.init.properties.forEach(p => LD.add(keyOf(p))); } });

const edits = [];   // [start, end, text] in code
let stripped = 0;
const targets = [], whole = {};
walk.simple(ast, {
  CallExpression(c) {
    if (!isLX(c)) return;
    const name = c.arguments[0].value, def = c.arguments[1];
    if (LANG !== 'ru' && LD.has(name) && !(def.type === 'Literal' && def.value === null)) { edits.push([def.start, def.end, 'null']); stripped += def.end - def.start; return; }
    if (STORY_SETS.includes(name)) targets.push(def);
  },
  VariableDeclarator(d) {
    // a whole variable marked /*__PACK__*/ in the source (let NAME = /*__PACK__*/{…}): its data becomes the pack NAME
    if (d.init && code.slice(d.init.start - 12, d.init.start) === '/*__PACK__*/') {
      const v = lit(d.init); if (v === undefined) throw new Error(d.id.name + ': /*__PACK__*/ needs plain data');
      whole[d.id.name] = v; edits.push([d.init.start, d.init.end, 'null']); return;
    }
    if (!STORY_SETS.includes(d.id.name) || !d.init || isLX(d.init)) return;
    targets.push(d.init);
  },
  // LEARN.phys = { …, items: [ … ] }: a section added to LEARN later in the script
  AssignmentExpression(a) {
    const l = a.left;
    if (a.operator === '=' && l.type === 'MemberExpression' && l.object.type === 'Identifier' && l.object.name === 'LEARN' && a.right.type === 'ObjectExpression') targets.push(a.right);
  }
});

// story items inside the targets
const items = [];
for (const t of targets) walk.simple(t, {
  ObjectExpression(o) {
    const ps = o.properties.filter(p => p.type === 'Property' && !p.computed && p.kind === 'init');
    if (ps.length !== o.properties.length) return;
    const by = Object.fromEntries(ps.map(p => [keyOf(p), p]));
    if (!by.id || typeof lit(by.id.value) !== 'string' || typeof lit(by.s && by.s.value) !== 'string' || by.px) return;
    const mv = MOVE.filter(k => by[k] && lit(by[k].value) !== undefined);
    items.push({ o, ps, id: lit(by.id.value), mv, data: Object.fromEntries(mv.map(k => [k, lit(by[k].value)])) });
  }
});
// split into packs of about CHUNK bytes, in page order (one section usually sits in one file)
// once each (a section can be reached twice: LEARN.plants = { items: LX('PLANT_STORIES', …) }), never inside a dropped default
const gone = edits.map(([s, e]) => [s, e]);
const seen = new Set();
for (let i = items.length - 1; i >= 0; i--) { const st = items[i].o.start; if (seen.has(st) || gone.some(([s, e]) => st >= s && st < e)) items.splice(i, 1); else seen.add(st); }
items.sort((a, b) => a.o.start - b.o.start);
const packs = {};
let n = 0, size = Infinity, cur = null;
for (const it of items) {
  const j = JSON.stringify(it.data);
  if (size + j.length > CHUNK) { cur = 'st' + (++n); packs[cur] = {}; size = 0; }
  if (packs[cur][it.id]) continue;   // the same id twice: keep the first text, the second item keeps its own words
  packs[cur][it.id] = it.data; size += j.length;
  const kept = it.ps.filter(p => !it.mv.includes(keyOf(p))).map(p => code.slice(p.start, p.end));
  edits.push([it.o.start, it.o.end, `{ ${kept.join(', ')}, px: ${JSON.stringify(cur)} }`]);
}
// the holidays: story, question, answers, words and drawing task leave HOL_PTRU and HOL_WORLD (holTexts() puts them back)
{
  const HF = ['kid', 'q', 'a', 'words', 'draw'], take = o => { const w = {}; HF.forEach(f => { if (f in o) { w[f] = o[f]; delete o[f]; } }); return w; };
  const dec = {}; walk.simple(ast, { VariableDeclarator(d) { if (['HOL_PTRU', 'HOL_WORLD'].includes(d.id.name) && d.init) dec[d.id.name] = d.init; } });
  if (dec.HOL_PTRU && dec.HOL_WORLD) {
    const P = lit(dec.HOL_PTRU), W = lit(dec.HOL_WORLD);
    if (P === undefined || W === undefined) throw new Error('HOL_PTRU / HOL_WORLD need plain data');
    const T = { p: {}, k: {}, c: {} };
    P.forEach(h => { T.p[h.id] = take(h); });
    Object.entries(W.kinds).forEach(([k, o]) => { T.k[k] = take(o); });
    Object.entries(W.countries).forEach(([cc, c]) => c.list.forEach((x, i) => { const w = take(x); if (Object.keys(w).length) (T.c[cc] = T.c[cc] || {})[i] = w; }));
    edits.push([dec.HOL_PTRU.start, dec.HOL_PTRU.end, JSON.stringify(P)], [dec.HOL_WORLD.start, dec.HOL_WORLD.end, JSON.stringify(W)]);
    packs.HOLT = T;
  }
}
// apply, last first (edits never overlap: LX defaults that are stripped are not searched for stories)
edits.sort((a, b) => b[0] - a[0]);
for (let i = 1; i < edits.length; i++) if (edits[i][1] > edits[i - 1][0]) throw new Error('overlapping edits at ' + edits[i][0]);
let out = code;
for (const [s, e, t] of edits) out = out.slice(0, s) + t + out.slice(e);
// the source's comments (about 110 KB) stay in the source: a block comment becomes a space (a newline if it spanned lines)
{
  const cs = []; acorn.parse(out, { ecmaVersion: 'latest', sourceType: 'script', allowReturnOutsideFunction: true, onComment: (block, text, s, e) => cs.push([block, s, e, text]) });
  let o = '', p = 0;
  for (const [block, s, e, text] of cs) {
    if (text === '__PACKS__') continue;   // the placeholder filled below
    o += out.slice(p, s) + (block ? (text.includes('\n') ? '\n' : ' ') : ''); p = e;
  }
  out = o + out.slice(p);
}

Object.assign(packs, whole);
for (const x of EXTRA) { const [k, f] = x.split('='); packs[k] = JSON.parse(fs.readFileSync(f, 'utf8')); }
fs.mkdirSync(DIR, { recursive: true });
for (const f of fs.readdirSync(DIR)) if (f.endsWith('.json')) fs.unlinkSync(path.join(DIR, f));
const index = {};
let bytes = 0;
for (const [k, d] of Object.entries(packs)) {
  const j = JSON.stringify(d); bytes += Buffer.byteLength(j);
  fs.writeFileSync(path.join(DIR, k + '.json'), j);
  index[k] = crypto.createHash('sha1').update(j).digest('hex').slice(0, 10);
}
if (!out.includes('/*__PACKS__*/{}')) throw new Error('no /*__PACKS__*/{} in the page');
out = out.replace('/*__PACKS__*/{}', JSON.stringify(index));
fs.writeFileSync(OUT, src.slice(0, base) + out + src.slice(base + code.length));
console.log(`${LANG} packs: ${items.length} stories → ${n} files, ${Object.keys(packs).length} files ${(bytes / 1e6).toFixed(2)} MB; unused Russian defaults dropped ${(stripped / 1e6).toFixed(2)} MB`);
