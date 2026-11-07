// node check_de.js d03 → checks batches/d03.out*.json against batches/d03.json (German: one string per id)
const fs = require('fs'), b = process.argv[2], dir = __dirname + '/batches/';
const items = JSON.parse(fs.readFileSync(dir + b + '.json', 'utf8')).items;
const out = {};
for (const f of fs.readdirSync(dir).filter(f => f.startsWith(b + '.out') && f.endsWith('.json'))) Object.assign(out, JSON.parse(fs.readFileSync(dir + f, 'utf8')));
const ph = s => (s.match(/\{\d+\}/g) || []).sort().join(',');
const tags = s => (s.match(/<\/?[a-zA-Z][^>]*>/g) || []).map(t => t.replace(/\s(aria-label|title|alt|placeholder)="[^"]*"/g, '')).sort().join('');
const probs = [];
for (const it of items) {
  const t = out[it.id];
  if (typeof t !== 'string') { probs.push(`${it.id}: missing or not a string`); continue; }
  if (ph(t) !== ph(it.ru)) probs.push(`${it.id}: placeholders ${ph(it.ru)} vs ${ph(t)}`);
  if (tags(t) !== tags(it.ru)) probs.push(`${it.id}: HTML tags differ`);
  if (/[А-Яа-яЁё]/.test(t)) probs.push(`${it.id}: Cyrillic left: ${t.slice(0, 60)}`);
  if (t && /^\s/.test(it.ru) !== /^\s/.test(t)) probs.push(`${it.id}: leading space differs`);
  if (t && /\s$/.test(it.ru) !== /\s$/.test(t)) probs.push(`${it.id}: trailing space differs`);
  if (!t && it.en) probs.push(`${it.id}: empty, but EN is not ("${it.en.slice(0, 40)}")`);
}
const extra = Object.keys(out).filter(k => !items.some(i => i.id === k));
if (extra.length) probs.push('unknown ids: ' + extra.slice(0, 5).join(', '));
console.log(probs.length ? probs.slice(0, 80).join('\n') + `\n${probs.length} problems` : `OK ${items.length} items`);
