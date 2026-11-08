# test sounds for speech recognition: each word with two Piper voices, normal and slower, plus a child-like (higher) copy; see tools/asr/README.md
import json, sys, wave, numpy as np, onnxruntime as ort, subprocess, os
VD, IDS, OUT = sys.argv[1], json.load(open(sys.argv[2])), sys.argv[3]
for v in ['ruslan', 'irina']:
    m = VD + f'/ru_RU-{v}-medium.onnx'; cfg = json.load(open(m + '.json')); sr = cfg['audio']['sample_rate']
    s = ort.InferenceSession(m)
    for w, ids in IDS.items():
        for slow in (1.0, 1.25):
            a = s.run(None, {'input': np.array([ids], dtype=np.int64), 'input_lengths': np.array([len(ids)], dtype=np.int64), 'scales': np.array([0.667, slow, 0.8], dtype=np.float32)})[0].squeeze()
            pad = np.zeros(int(sr * .4), np.float32); a = np.concatenate([pad, a, pad])
            f = f'{OUT}/{v}_{"n" if slow == 1 else "s"}_{w}.wav'
            ww = wave.open(f, 'wb'); ww.setnchannels(1); ww.setsampwidth(2); ww.setframerate(sr); ww.writeframes((np.clip(a, -1, 1) * 32767).astype(np.int16).tobytes()); ww.close()
            # a child-like copy: the voice ~40% higher (shorter vocal tract), resampled to 16 kHz
            c = f.replace('.wav', '_kid.wav')
            subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', f, '-af', f'asetrate={int(sr * 1.4)},aresample=16000,atempo={1/1.4:.4f}', '-ar', '16000', c], check=True)
            subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', f, '-ar', '16000', f + '.16k.wav'], check=True); os.replace(f + '.16k.wav', f)
print(len(os.listdir(OUT)))
