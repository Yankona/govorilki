# phrases with a word's phonemes swapped for variants, each synthesized 3 times and transcribed: how often is the word heard right
import json, sys, wave, re, numpy as np, onnxruntime as ort
from faster_whisper import WhisperModel
VO, WM, SPEC = sys.argv[1], sys.argv[2], json.load(open(sys.argv[3]))
cfg = json.load(open(VO + '.json')); sr = cfg['audio']['sample_rate']; pm = cfg['phoneme_id_map']
sess = ort.InferenceSession(VO); asr = WhisperModel(WM, device='cpu', compute_type='int8')
def ids(s):
    out = pm['^'] + pm['_']
    for ch in s: out += pm[ch] + pm['_']
    return out + pm['$']
def synth(s, seed):
    np.random.seed(seed)
    a = sess.run(None, {'input': np.array([ids(s)], dtype=np.int64), 'input_lengths': np.array([len(ids(s))], dtype=np.int64), 'scales': np.array([0.667, 1.0, 0.8], dtype=np.float32)})[0].squeeze()
    n = int(len(a) * 16000 / sr); a = np.interp(np.linspace(0, len(a) - 1, n), np.arange(len(a)), a).astype(np.float32)
    return np.concatenate([np.zeros(4000, np.float32), a, np.zeros(8000, np.float32)])
for row in SPEC:
    phrase, word, want, variants = row['ipa'], row['word'], re.compile(row['want'], re.I), row['variants']
    for v in variants:
        s = phrase.replace(word, v); hits = []
        for seed in range(int(__import__("os").environ.get("SEEDS", "3"))):
            segs, _ = asr.transcribe(synth(s, seed), language='ru', beam_size=5, temperature=0, condition_on_previous_text=False)
            t = ' '.join(x.text.strip() for x in segs); hits.append(t)
        ok = sum(bool(want.search(h)) for h in hits)
        print(f'{row["name"]:10s} {v:14s} {ok}/{len(hits)}  ' + ' | '.join(hits))
