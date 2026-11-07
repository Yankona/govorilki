# synthesize phoneme-id sequences with a Piper voice and measure F1/F2 of the loudest vowel stretch (LPC formants)
import json, sys, wave, numpy as np, onnxruntime as ort
VO = sys.argv[1]; IDS = json.load(open(sys.argv[2])); OUTDIR = sys.argv[3]
cfg = json.load(open(VO + '.json')); sr = cfg['audio']['sample_rate']; pm = cfg['phoneme_id_map']
sess = ort.InferenceSession(VO)
def synth(ids):
    x = np.array([ids], dtype=np.int64)
    a = sess.run(None, {'input': x, 'input_lengths': np.array([len(ids)], dtype=np.int64), 'scales': np.array([0.333, 1.0, 0.333], dtype=np.float32)})[0].squeeze()
    return a.astype(np.float32)
def lpc(x, order):
    r = np.correlate(x, x, 'full')[len(x) - 1:len(x) + order]
    a = np.zeros(order + 1); a[0] = 1; e = r[0]
    for i in range(1, order + 1):
        k = -(r[i] + np.dot(a[1:i], r[i - 1:0:-1])) / e
        a[1:i + 1] = a[1:i + 1] + k * np.concatenate([a[i - 1:0:-1], [1]])
        e *= (1 - k * k)
    return a
def formants(seg):
    seg = seg * np.hamming(len(seg)); seg = np.append(seg[0], seg[1:] - 0.63 * seg[:-1])
    a = lpc(seg, 2 + sr // 1000)
    rts = [r for r in np.roots(a) if np.imag(r) > 0]
    fr = sorted([(np.angle(r) * sr / (2 * np.pi), -0.5 * sr / np.pi * np.log(abs(r))) for r in rts])
    return [round(f) for f, bw in fr if f > 200 and bw < 400][:3]
def write(path, a):
    w = wave.open(path, 'wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes((np.clip(a, -1, 1) * 32767).astype(np.int16).tobytes()); w.close()
for k, (name, v) in enumerate(IDS.items()):
    a = synth(v['ids']); write(f'{OUTDIR}/{k:02d}.wav', a)
    # the stressed vowel: the most energetic 40 ms window in the first 60% of the word
    win = int(sr * .04); hop = win // 2; n = int(len(a) * .6)
    en = [np.sum(a[i:i + win] ** 2) for i in range(0, max(1, n - win), hop)]
    i = int(np.argmax(en)) * hop
    print(f'{name:28s} {v["s"]:24s} F1/F2/F3 ~ {formants(a[i:i + win])}  ({len(a) / sr:.2f}s) -> {k:02d}.wav')
