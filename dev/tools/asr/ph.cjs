// phoneme ids of the test words (tools/asr/words.json) with the phonemizer the app uses; see tools/asr/README.md
const [, , PP, WJ, OUT, DIR, JS] = process.argv;
process.argv[2] = DIR; process.argv[3] = JS;
const { ph } = require(PP);
(async () => { const W = require(WJ), out = {};
  for (const pair of W) for (const w of pair) { const r = await ph(w + '.'); out[w] = r.phoneme_ids; }
  require('fs').writeFileSync(OUT, JSON.stringify(out)); console.log(Object.keys(out).length); })();
