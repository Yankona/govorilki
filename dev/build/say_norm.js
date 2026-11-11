// node say_norm.js <corpus.json> <out.json>: every text of the app → its sentences after the number rules, as the voice gets them
const fs = require('fs');
const g = fs.readFileSync(__dirname + '/../game/govorilki.html', 'utf8');
// the game's own number rules: the say module, from its heading to the next section of the game
const a = g.indexOf('/* ---------- Russian pronunciation before every voice'), src = g.slice(a, g.indexOf('\n/* ---------- ', a + 10));
const { ruNums, RUNUM } = new Function('const PACKS = {}, IS_RU = true, RU = s => s; ' + src + '; return { ruNums, RUNUM };')();
const C = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const out = new Set();
for (const t of C) for (const p of String(ruNums(t)).match(/[^.!?…]+[.!?…]*/g) || []) { const x = p.replace(/\s+/g, ' ').trim(); if (/[а-яё]/i.test(x)) out.add(x); }
fs.writeFileSync(process.argv[3], JSON.stringify([...out]));
// every number word the rules can make, checked like the words of the texts
const nums = new Set(), ns = [...Array(101).keys(), 200, 300, 400, 500, 600, 700, 800, 900, 1000, 2000, 3000, 5000, 1000000];
for (const n of ns) for (const cs of ['nom', 'gen', 'dat', 'acc', 'ins', 'prep']) {
  for (const g of ['m', 'f', 'n']) RUNUM.card(n, cs, g).split(' ').forEach(w => nums.add(w));
  for (const g of ['m', 'f', 'n', 'pl']) RUNUM.ord(n, cs, g).split(' ').forEach(w => nums.add(w));
}
fs.writeFileSync(process.argv[3].replace(/\.json$/, '-num.json'), JSON.stringify([...nums]));
console.log('sentences', out.size);
