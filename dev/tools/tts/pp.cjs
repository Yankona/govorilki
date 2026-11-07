// runs the exact phonemizer Piper uses in the app (piper_phonemize wasm) and prints the phoneme string per input line
const path = require('path');
const DIR = process.argv[2];
const js = require('fs').readFileSync(process.argv[3], 'utf8');
const m = js.match(/var createPiperPhonemize = [\s\S]*?\n\}\)\(\);/);
const createPiperPhonemize = eval('(' + m[0].replace(/^var createPiperPhonemize = /, '').replace(/;$/, '') + ')');
const cfg = JSON.parse(require('fs').readFileSync(path.join(DIR, 'ru.json'), 'utf8'));
const inv = {}; for (const [k, v] of Object.entries(cfg.phoneme_id_map)) inv[v[0]] = k;
async function ph(text) {
  return new Promise(async res => {
    const mod = await createPiperPhonemize({ print: d => res(JSON.parse(d)), printErr: () => {},
      locateFile: u => path.join(DIR, u.endsWith('.wasm') ? 'piper_phonemize.wasm' : 'piper_phonemize.data') });
    mod.callMain(['-l', 'ru', '--input', JSON.stringify([{ text }]), '--espeak_data', '/espeak-ng-data']);
  });
}
module.exports = { ph, inv };
if (require.main === module) (async () => {
  for (const t of process.argv.slice(4)) { const r = await ph(t); console.log(t.padEnd(26), '→', r.phoneme_ids.map(i => inv[i]).filter(c => c !== '_').join('').replace(/^\^|\$$/g, ''), Object.keys(r).join(',')); }
})();
