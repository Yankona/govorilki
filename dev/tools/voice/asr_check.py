# what a speech recogniser hears in each synthesized wav (Russian, no prompt); audio read with wave, resampled to 16 kHz
import glob, sys, wave, numpy as np
from faster_whisper import WhisperModel
M = sys.argv[1]; D = sys.argv[2]
m = WhisperModel(M, device='cpu', compute_type='int8')
def load(f):
    w = wave.open(f); sr = w.getframerate(); a = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768; w.close()
    n = int(len(a) * 16000 / sr); a = np.interp(np.linspace(0, len(a) - 1, n), np.arange(len(a)), a).astype(np.float32)
    return np.concatenate([np.zeros(4000, np.float32), a, np.zeros(8000, np.float32)])
for f in sorted(glob.glob(D + '/*.wav')):
    segs, _ = m.transcribe(load(f), language='ru', beam_size=5, temperature=0, condition_on_previous_text=False, vad_filter=False)
    print(f.split('/')[-1], '→', ' '.join(s.text.strip() for s in segs))
