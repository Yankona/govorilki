# Speech recogniser word times for a downloaded recording (faster-whisper "small", pip install faster-whisper numpy; model Systran/faster-whisper-small):
#   python3 asr.py FILE.mp3 ...   -> FILE.mp3.asr.json  (read by recordings.py). Edit the model path below.
import sys, subprocess, json, numpy as np
from faster_whisper import WhisperModel
m = WhisperModel('wsmall', device='cpu', compute_type='int8')
for f in sys.argv[1:]:
    raw = subprocess.run(['ffmpeg','-v','error','-i',f,'-f','f32le','-ac','1','-ar','16000','-'],capture_output=True).stdout
    a = np.frombuffer(raw, np.float32)
    segs,_ = m.transcribe(a, language='ru', beam_size=3, temperature=0, condition_on_previous_text=False, word_timestamps=True)
    out=[{'s':s.start,'e':s.end,'t':s.text.strip(),'w':[(w.word,w.start,w.end) for w in s.words]} for s in segs]
    json.dump(out, open(f+'.asr.json','w'), ensure_ascii=False)
    print(f, len(out), flush=True)
