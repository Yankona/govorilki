const fs = require('fs'), acorn = require('acorn'), walk = require('acorn-walk');
const src = fs.readFileSync(process.argv[2], 'utf8');
const i = src.indexOf('<script>', src.indexOf('<div id="app"></div>')), j = src.lastIndexOf('</script>');
const off = src.slice(0, i + 8).split('\n').length - 1;
const js = src.slice(i + 8, j);
const ast = acorn.parse(js, { ecmaVersion: 'latest', sourceType: 'script', locations: true });
const CY = /[А-Яа-яЁё]/;
let body = ast.body;
for (const st of ast.body) { const e = st.expression; const f = e && (e.callee || (e.expression && e.expression.callee)); if (f && f.body && f.body.body) { body = f.body.body; break; } }
for (const st of body) {
  if (st.type === 'FunctionDeclaration') continue;
  let name = st.type === 'VariableDeclaration' ? st.declarations.map(d => d.id.name || '?').join(',') : st.type + ':' + js.slice(st.start, st.start + 40).replace(/\s+/g, ' ');
  let n = 0, chars = 0, sample = [];
  walk.full(st, node => {
    let v = null;
    if (node.type === 'Literal' && typeof node.value === 'string' && CY.test(node.value)) v = node.value;
    if (node.type === 'TemplateLiteral' && node.quasis.some(q => CY.test(q.value.cooked))) v = node.quasis.map(q => q.value.cooked).join('{}');
    if (v) { n++; chars += v.length; if (sample.length < 4) sample.push(v.slice(0, 30)); }
  });
  if (n) console.log(String(st.loc.start.line + off).padStart(5), String(chars).padStart(6), name.slice(0, 40).padEnd(40), sample.join(' | ').replace(/\n/g, ' ').slice(0, 110));
}
