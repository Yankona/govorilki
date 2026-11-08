// Matching of what the recogniser heard against the word to say (ASR block of the game), without a browser:
// the recogniser's slips (ё, endings, digits, split words, voicing, vowels) pass; a slip in a sound the child is learning
// (рыба → лыба) is «почти: нужный звук» with that sound; other words fail. Prints the numbers before (the
// matcher of the last release, from git) and after. Usage: node tests/asr_match.js   (exit code 1 on a failure)
const fs = require('fs'), path = require('path'), { execSync } = require('child_process');
const SRC = path.join(__dirname, '..', 'game', 'govorilki.html');
const now = fs.readFileSync(SRC, 'utf8');
const newBlock = now.slice(now.indexOf('/* ASR-BEGIN */'), now.indexOf('/* ASR-END */'));
// the matchers of earlier releases: v150 (strict), v151 (took learned-sound slips as right)
const OLD = [['v150', 'd11803e'], ['v151', '968f181']].map(([tag, ref]) => {
  try {
    const old = execSync(`git show ${ref}:dev/game/govorilki.html`, { cwd: __dirname, maxBuffer: 1 << 28 }).toString();
    let a = old.indexOf('/* ASR-BEGIN */'), b = old.indexOf('/* ASR-END */');
    if (a < 0) { a = old.indexOf('const normW = s => (IS_RU'); b = old.indexOf('function hear(expect'); }
    return a > 0 ? [tag, old.slice(a, b)] : null;
  } catch (e) { return null; }
}).filter(Boolean);
// a small ruNums for the test (the game has the full one)
const RUN = ['ноль', 'один', 'два', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять', 'десять'];
function make(block, LANG) {
  const f = new Function('LANG', 'IS_RU', 'ruNums', block + '\n;return { m: (h, e, t, loose) => { if (typeof ASR === "undefined") return { lvl: matchSay(h, e, t) ? 2 : 0, slip: \"\" }; const r = ASR.match(h, e, t, loose); return typeof r === \"number\" ? { lvl: r, slip: \"\" } : r; } };');
  return f(LANG, LANG === 'ru', s => s.replace(/\d+/g, d => RUN[+d] || d)).m;
}
// [lang, heard alternatives (| between them), word to say, times, 1 pass / 0 fail / the learned sound slipped, what it is]
const C = [
  ['ru', 'лодка', 'лодка', 1, 1, 'точно'], ['ru', 'Лодка!', 'лодка', 1, 1, 'знаки, заглавная'], ['ru', 'ёлка', 'Ёлка', 1, 1, 'ё'],
  ['ru', '3 кота', 'три кота', 1, 1, 'цифра'], ['ru', 'лодку', 'лодка', 1, 1, 'окончание'], ['ru', 'рыбу', 'рыба', 1, 1, 'окончание, короткое'],
  ['ru', 'водка', 'лодка', 1, 'л', 'Л→В (ламбдацизм)'], ['ru', 'ямпа|вампа', 'лампа', 1, 'л', 'Л→Й/В'], ['ru', 'лыба', 'рыба', 1, 'р', 'Р→Л'],
  ['ru', 'йыба', 'рыба', 1, 'р', 'Р→Й'], ['ru', 'колова', 'корова', 1, 'р', 'Р→Л в слове'], ['ru', 'шал', 'шар', 1, 'р', 'Р→Л короткое'],
  ['ru', 'моковка', 'морковка', 1, 'р', 'пропущен Р'], ['ru', 'сапка', 'шапка', 1, 'ш', 'Ш→С'], ['ru', 'зук', 'жук', 1, 'ж', 'Ж→З'],
  ['ru', 'малако', 'молоко', 1, 1, 'безударные О→А'], ['ru', 'мор ковка', 'морковка', 1, 1, 'слово разорвано'],
  ['ru', 'бабан|барабан', 'барабан', 1, 1, 'верное во 2-й альтернативе'], ['ru', 'лошадка лошадка лошадка', 'лошадка', 3, 1, 'три раза'],
  ['ru', 'вошадка вошадка', 'лошадка', 3, 'л', 'три раза с заменой'], ['ru', 'лук', 'люк', 1, 1, 'мягкость'],
  ['ru', 'кукуруза', 'кукуруза', 1, 1, 'длинное точно'], ['ru', 'кукуюза', 'кукуруза', 1, 'р', 'длинное Р→Й'],
  ['ru', 'я нарисовала домик', 'я нарисовала домик', 1, 1, 'фраза'], ['ru', 'я налисовала домик', 'я нарисовала домик', 1, 'р', 'фраза с заменой'],
  ['ru', 'нарисовала домик', 'я нарисовала домик', 1, 1, 'фраза без «я»'], ['ru', 'это фрукты', 'это фрукты', 1, 1, 'фраза 2 слова'],
  ['ru', 'это фуукты', 'это фрукты', 1, 'р', 'фраза, Р пропущен'], ['ru', 'сыл', 'сыр', 1, 'р', 'сыр→сыл'], ['ru', 'гола', 'гора', 1, 'р', 'гора→гола'],
  ['ru', 'пиламида', 'пирамида', 1, 'р', 'пирамида'], ['ru', 'ведло', 'ведро', 1, 'р', 'ведро'], ['ru', 'сапоги', 'сапоги', 1, 1, 'точно 2'],
  ['ru', 'кот', 'кит', 1, 0, 'другое слово'], ['ru', 'коза', 'лиса', 1, 0, 'другое слово'], ['ru', 'сок', 'шар', 1, 0, 'другое короткое'],
  ['ru', 'мама', 'рыба', 1, 0, 'другое'], ['ru', 'молоко', 'собака', 1, 0, 'другое длинное'], ['ru', '', 'лодка', 1, 0, 'тишина'],
  ['ru', 'привет как дела', 'я нарисовала домик', 1, 0, 'другая фраза'], ['ru', 'лапа', 'папа', 1, 0, 'лапа≠папа'], ['ru', 'дом', 'сом', 1, 0, 'дом≠сом'],
  ['ru', 'стол', 'слон', 1, 0, 'стол≠слон'], ['ru', 'лодка', 'лодка лошадь ложка', 1, 0, 'одно из трёх слов'],
  ['ru', 'малина', 'машина', 1, 0, 'малина≠машина'], ['ru', 'баран', 'банан', 1, 0, 'баран≠банан'], ['ru', 'кошка', 'ложка', 1, 0, 'кошка≠ложка'],
  ['ru', 'лук', 'жук', 1, 0, 'лук≠жук'], ['ru', 'роза', 'коза', 1, 0, 'роза≠коза'], ['ru', 'кол', 'пол', 1, 0, 'кол≠пол'], ['ru', 'булка', 'белка', 1, 0, 'булка≠белка'],
  ['ru', 'пальчик', 'зайчик', 1, 0, 'пальчик≠зайчик'], ['ru', 'книжка', 'книга', 1, 0, 'книжка≠книга'],
  ['ru', 'шук', 'жук', 1, 1, 'Ж оглушена: слышит распознаватель'], ['ru', 'суп', 'зуб', 1, 1, 'звонкие/глухие'], ['ru', 'санки', 'санки', 1, 1, 'С точно'],
  ['ru', 'шанки', 'санки', 1, 'с', 'С→Ш'], ['ru', 'барадабан', 'барабан', 1, 0, 'лишний слог'], ['ru', 'бадабан', 'барабан', 1, 'р', 'Р→Д'],
  ['ru', 'ау', 'ар', 1, 1, 'слог (loose)', 1], ['ru', 'ла', 'ла', 1, 1, 'слог точно (loose)', 1],
  ['en', 'wabbit', 'rabbit', 1, 'r', 'r→w'], ['en', 'free', 'three', 1, 't', 'th→f'], ['en', 'yellow', 'Yellow!', 1, 1, 'exact'], ['en', 'wed', 'red', 1, 'r', 'r→w short'],
  ['en', 'thun', 'sun', 1, 's', 's→th'], ['en', '3', 'three', 1, 1, 'digit'], ['en', 'cat', 'dog', 1, 0, 'other'], ['en', 'lion', 'orange', 1, 0, 'other'],
  ['de', 'Lakete', 'Rakete', 1, 'r', 'R→L'], ['de', 'Fisch', 'fisch', 1, 1, 'exact'], ['de', 'Hund', 'Katze', 1, 0, 'other'], ['de', 'Sonne', 'Schonne', 1, 1, 's/sch'],
  ['pt', 'lato', 'rato', 1, 'r', 'r→l'], ['pt', 'gato', 'cão', 1, 0, 'other'], ['pt', 'pao', 'pão', 1, 1, 'til']
];
function run(m) {
  let pass = 0; const n = { ok: [0, 0], no: [0, 0], near: [0, 0] }, bad = [];
  for (const [L, h, e, t, want, what, loose] of C) {
    let best = { lvl: 0, slip: '' };
    for (const x of h.split('|')) { const r = m[L](x, e, t, !!loose); const v = r.lvl ? (r.slip ? 1 : 2) : 0, bv = best.lvl ? (best.slip ? 1 : 2) : 0; if (v > bv) best = r; }
    const got = !best.lvl ? 0 : best.slip ? best.slip : 1, kind = typeof want === 'string' ? 'near' : want ? 'ok' : 'no';
    n[kind][1]++; if (got === want) { pass++; n[kind][0]++; }
    else bad.push(`${L} «${h}» → «${e}»${t > 1 ? ' ×' + t : ''}: ${got === 0 ? 'отклонено' : got === 1 ? 'принято' : 'почти: ' + got} (${what}; нужно ${kind === 'near' ? 'почти: ' + want : kind === 'ok' ? 'принято' : 'отклонено'})`);
  }
  return { pass, n, bad };
}
const mk = b => ({ ru: make(b, 'ru'), en: make(b, 'en'), de: make(b, 'de'), pt: make(b, 'pt') });
const out = (tag, r) => console.log(`${tag}: ${r.pass}/${C.length} верно; правильно сказанных принято ${r.n.ok.join('/')}, замен нужного звука замечено ${r.n.near.join('/')}, чужих слов отклонено ${r.n.no.join('/')}`);
OLD.forEach(([tag, blk]) => out(tag, run(mk(blk))));
const r = run(mk(newBlock)); out('после', r);
r.bad.forEach(x => console.log('FAIL ' + x));
process.exit(r.bad.length ? 1 : 0);
