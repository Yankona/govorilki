// The app is written in Russian. This finds every Russian string in the script (literals and template literals, with ${…}
// turned into {0}, {1}…), groups them by the top-level declaration they live in, and builds a copy of the page in
// another language from translation tables { group: { russian: translation } } plus a content table for LX(...).
//   node i18n.js extract <src.html> <out.json>
//   node i18n.js build <src.html> <lang> <table.json> <langdata.json> <out.html>
const fs = require('fs'), acorn = require('acorn'), walk = require('acorn-walk');
const CY = /[А-Яа-яЁё]/;
const SKIP_GROUPS = new Set((process.env.I18N_SKIP || 'GX,GX_RE,normW,KB,NAME_MEMO,kidNames,decl,lemmaGuesses,roleGuess,lcFirst,dictParse,wClean,KID_DEFAULT,NAME_SRC,OLD_GRANDS,RUNUM,RU_MON_GEN,RU_MON_PREP,CF_WORKS,PRIMER,PR_SOUND,PR_WORDS,PR_SENT,prKnown,prFits,prSing,PR_BAD,prBig,prState,screenPrimer,screenPrimerLesson,LOGO,GRAM,PHR,SWAB,IDEAS,WORLD,prDraw,prStretch,PR_HOLD,PR_BASE,PR_MOUTH,prFace,PR_NAMES,PR_REDUCED,PR_PAIRS,PR_SWAP,PR_ONSET,PR_TIPS,PR_WHOLE,prSingB,prCaps,prc,prClean,prWhere,prSyl,prTri,prBuildSet,prTipKeys,PREP_CASE,MASC_A,FEM_SOFT,numNoun,UNITS,YEAR_CASE,prevWord,prepCase,ruNums,sayKey,sayHash,sayForm,sayMark,sayParts,sayPatches,sayOwnAdd,sayOwnHTML,bindSayOwn,PIPER_SRC').split(','));
function load(file) {
  const src = fs.readFileSync(file, 'utf8');
  const i = src.indexOf('<script>', src.indexOf('<div id="app"></div>')) + 8, j = src.lastIndexOf('</script>');
  const js = src.slice(i, j), off = src.slice(0, i).split('\n').length - 1;
  const ast = acorn.parse(js, { ecmaVersion: 'latest', locations: true });
  let body = ast.body;
  for (const st of ast.body) { const e = st.expression; const f = e && (e.callee || (e.expression && e.expression.callee)); if (f && f.body && f.body.body) { body = f.body.body; break; } }
  return { src, i, j, js, off, body };
}
function groupOf(st, js) {
  if (st.type === 'FunctionDeclaration') return st.id.name;
  if (st.type === 'VariableDeclaration') return st.declarations.map(d => d.id.name || js.slice(d.id.start, d.id.end)).join(',');
  if (st.type === 'ExpressionStatement') {
    const e = st.expression;
    if (e.type === 'CallExpression') { const c = js.slice(e.callee.start, e.callee.end); return c === 'Object.assign' && e.arguments[0] ? c + '(' + js.slice(e.arguments[0].start, e.arguments[0].end) : c; }
    if (e.type === 'AssignmentExpression') return js.slice(e.left.start, e.left.end);
    return 'expr';
  }
  return st.type;
}
// every translatable node with its key; nodes inside LX(name, default) defaults, property keys and skipped groups are left alone
function collect(L) {
  const out = [];
  for (const st of L.body) {
    const g = groupOf(st, L.js);
    if (SKIP_GROUPS.has(g)) continue;
    const skip = new Set();
    walk.full(st, n => {
      if (n.type === 'CallExpression' && n.callee.type === 'Identifier' && n.callee.name === 'LX' && n.arguments[1]) skip.add(n.arguments[1]);
      if (n.type === 'Property' && !n.computed && n.key.type === 'Literal') skip.add(n.key);
      if (n.type === 'CallExpression' && n.callee.type === 'Identifier' && n.callee.name === 'RU') n.arguments.forEach(a => skip.add(a));
    });
    const inSkip = n => { for (const s of skip) if (n.start >= s.start && n.end <= s.end) return true; return false; };
    walk.full(st, n => {
      if (inSkip(n)) return;
      if (n.type === 'Literal' && typeof n.value === 'string' && CY.test(n.value)) out.push({ g, node: n, key: n.value });
      else if (n.type === 'TemplateLiteral' && n.quasis.some(q => CY.test(q.value.cooked))) out.push({ g, node: n, key: n.quasis.map((q, k) => q.value.cooked + (k < n.expressions.length ? `{${k}}` : '')).join('') });
    });
  }
  return out;
}
const cmd = process.argv[2];
if (cmd === 'extract') {
  const L = load(process.argv[3]), items = collect(L), groups = {};
  for (const it of items) {
    const G = groups[it.g] = groups[it.g] || {};
    if (!G[it.key]) G[it.key] = { line: it.node.loc.start.line + L.off };
  }
  fs.writeFileSync(process.argv[4], JSON.stringify(groups, null, 1));
  console.log('groups', Object.keys(groups).length, 'strings', Object.values(groups).reduce((a, g) => a + Object.keys(g).length, 0));
} else if (cmd === 'build') {
  const [, , , file, lang, tableF, dataF, outF] = process.argv;
  const L = load(file), table = JSON.parse(fs.readFileSync(tableF, 'utf8')), data = dataF && fs.existsSync(dataF) ? fs.readFileSync(dataF, 'utf8') : '{}';
  const items = collect(L), byStart = new Map(items.map(it => [it.node.start, it]));
  const missing = {};
  const tr = it => { const t = (table[it.g] || {})[it.key] ?? (table['*'] || {})[it.key]; if (t == null) { (missing[it.g] = missing[it.g] || []).push(it.key); } return t; };
  const escT = s => s.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
  // the source between a and b, with every translatable node inside replaced (outermost first, templates recursively)
  function emit(a, b) {
    let s = '', p = a;
    const nodes = items.filter(it => it.node.start >= a && it.node.end <= b).sort((x, y) => x.node.start - y.node.start || y.node.end - x.node.end);
    for (const it of nodes) {
      const n = it.node; if (n.start < p) continue; // inside one already emitted
      s += L.js.slice(p, n.start);
      const t = tr(it);
      if (n.type === 'Literal') s += t == null ? L.js.slice(n.start, n.end) : JSON.stringify(t);
      else if (t == null) {
        // untranslated template: keep its text, still translate inside its expressions
        s += '`' + n.quasis.map((q, k) => L.js.slice(q.start, q.end) + (k < n.expressions.length ? '${' + emit(n.expressions[k].start, n.expressions[k].end) + '}' : '')).join('') + '`';
      } else {
        s += '`' + escT(t).replace(/\{(\d+)\}/g, (m, k) => n.expressions[+k] ? '${' + emit(n.expressions[+k].start, n.expressions[+k].end) + '}' : m) + '`';
      }
      p = n.end;
    }
    return s + L.js.slice(p, b);
  }
  let js = emit(0, L.js.length);
  if (!js.includes("const LANG = 'ru';") || !js.includes('/*__LANGDATA__*/{}')) console.warn('warning: LANG / LANGDATA markers not found');
  js = js.replace("const LANG = 'ru';", `const LANG = '${lang}';`).replace('/*__LANGDATA__*/{}', '/*__LANGDATA__*/' + data.trim());
  let head = L.src.slice(0, L.i), tail = L.src.slice(L.j);
  const title = ((table['*'] || {})['Говорилки с Рыжиком']) || 'Govorilki';
  head = head.replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`);
  fs.writeFileSync(outF, head + js + tail);
  const mc = Object.values(missing).reduce((a, x) => a + x.length, 0);
  fs.writeFileSync(outF + '.missing.json', JSON.stringify(missing, null, 1));
  console.log(lang, 'built;', 'missing', mc, 'in', Object.keys(missing).length, 'groups');
}
