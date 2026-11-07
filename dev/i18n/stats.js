const fs = require('fs'), acorn = require('acorn'), walk = require('acorn-walk');
const src = fs.readFileSync(process.argv[2], 'utf8');
const i = src.indexOf('<script>', src.indexOf('<div id="app"></div>')), j = src.lastIndexOf('</script>');
const js = src.slice(i + 8, j);
const ast = acorn.parse(js, { ecmaVersion: 'latest', sourceType: 'script', locations: true });
const CY = /[А-Яа-яЁё]/;
// the IIFE body
let body = ast.body;
for (const st of ast.body) { const e = st.expression; const f = e && (e.callee || (e.expression && e.expression.callee)); if (f && f.body && f.body.body) { body = f.body.body; break; } }
const groups = {};
for (const st of body) {
  let name = st.type === 'FunctionDeclaration' ? st.id.name : st.type === 'VariableDeclaration' ? st.declarations.map(d => d.id.name || '?').join(',') : st.type;
  let n = 0, chars = 0;
  walk.full(st, node => {
    if (node.type === 'Literal' && typeof node.value === 'string' && CY.test(node.value)) { n++; chars += node.value.length; }
    if (node.type === 'TemplateLiteral' && node.quasis.some(q => CY.test(q.value.cooked))) { n++; chars += node.quasis.reduce((a, q) => a + q.value.cooked.length, 0); }
  });
  if (n) { groups[name] = groups[name] || { n: 0, chars: 0, line: st.loc.start.line }; groups[name].n += n; groups[name].chars += chars; }
}
const arr = Object.entries(groups).sort((a, b) => b[1].chars - a[1].chars);
let tn = 0, tc = 0; arr.forEach(([k, v]) => { tn += v.n; tc += v.chars; });
console.log('total literals', tn, 'chars', tc, 'groups', arr.length);
arr.slice(0, +process.argv[3] || 80).forEach(([k, v]) => console.log(String(v.chars).padStart(7), String(v.n).padStart(5), v.line, k.slice(0, 60)));
