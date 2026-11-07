const fs = require('fs'), acorn = require('acorn'), walk = require('acorn-walk');
const src = fs.readFileSync(process.argv[2], 'utf8');
const i = src.indexOf('<script>', src.indexOf('<div id="app"></div>')), j = src.lastIndexOf('</script>');
const off = src.slice(0, i + 8).split('\n').length - 1;
const js = src.slice(i + 8, j);
const ast = acorn.parse(js, { ecmaVersion: 'latest', locations: true });
walk.full(ast, n => { if (n.type === 'Literal' && n.regex && /[А-Яа-яЁё]/.test(n.regex.pattern)) console.log(n.loc.start.line + off, js.slice(n.start, n.end).slice(0, 120), '   ::', js.slice(Math.max(0, n.start - 60), n.start).replace(/\s+/g, ' ').slice(-60)); });
