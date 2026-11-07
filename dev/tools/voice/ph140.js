// what the voice's phonemizer makes of words: ё after ж/ш/ц, soft л before a consonant
const { chromium } = require('playwright');
const W = process.argv.slice(2).length ? process.argv.slice(2) : ['жёлтый', 'жёлтая', 'жёлтое', 'жёлтые', 'жёлтого', 'жёлтой', 'жёлтым', 'жёлтых', 'жёлудь', 'шёл', 'шёлк', 'шёпот', 'жёсткий', 'чёрный', 'щётка', 'ещё', 'всё', 'ёжик',
  'альбом', 'альбоме', 'альбома', 'пальто', 'больше', 'только', 'мальчик', 'сильно', 'пальцы', 'сколько', 'бельчонок', 'медаль', 'соль', 'мель'];
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  await p.goto('http://127.0.0.1:8790/index.html'); await p.waitForFunction(() => window.ready, null, { timeout: 90000 });
  for (const w of W) console.log(w.padEnd(12), (await p.evaluate(async t => (await ipa(t)).s, w)));
  await b.close();
})();
