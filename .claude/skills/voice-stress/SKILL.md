---
name: voice-stress
description: Russian pronunciation of Говорилки's voices — word stress, ё, soft Л, names, numbers — through build/say_manual.json and build/say_ru.py, plus listening checks with the Piper voice and speech recognition. Use when the owner says a word is said wrong, when new Russian texts or stories with names are added, or before a release with Russian text changes.
---
# Voice and stress

Piper reads Russian through espeak's phonemizer, which ignores stress marks and knows no context. So the game carries a
dictionary (`SAYRU`, built into the ru page from `site-data/say-ru.json`) that rewrites phonemes before the voice:
`w` words, `c` names (capitalised only), `b`, `s` sentences, `p` phrases, `l` words with soft Л before a consonant.

## Fix a word
Edit `build/say_manual.json` (stress = `+` before the vowel):
- `w`: always, any case — `"кашкайш": "кашк+айш"` (add every form: кашкайше, кашкайша…). Use for names that are not
  common words, and for names that start a sentence (хохлом+а, +устюг).
- `cap`: only when capitalised mid-sentence — a name that is also a common word.
- `phr`: a whole phrase when context decides.
Homographs: pin the right one in `w` (кому́ → `"кому": "ком+у"`). Writers' stress for common words is often wrong
(Со́ломенным, Исаа́киевского were): accept names only, check doubtful ones in the dictionary
(`.cache/raccw/dictionary/accents.json.gz`) or by ear. Children only edit say_manual.json; the release regenerates.

## Regenerate (release only, ~2 min)
One-time setup in a container:
```
python3 -m venv .venv-racc && .venv-racc/bin/pip install -q ruaccent   # models download into .cache/raccw on first run
```
Then `python3 build/say_ru.py` (or `build/release_check.sh N --voice`). Env: `RACC_PY`, `RACCW`, `SITE` override paths.
It needs Chromium (Playwright) for Piper's phonemizer in `tools/phsrv`. Output is deterministic; report in
`tools/tts/say_report.json`.

## Check by eye and by ear
- `node tests/names141.js` — every capitalised word of the new stories with the stress the voice gets (no mark = none).
- Listening (only when pronunciation is in question; heavy): the Ruslan voice
  (`rhasspy/piper-voices`, `ru/ru_RU/ruslan/medium`, onnx + json) synthesises with `tools/voice/synth_f2.py`, and
  `tools/voice/asr_check.py <whisper model> <wav dir>` (faster-whisper `medium`, ~1.5 GB) says what it hears.
- A word alone can sound muddy (жёлтый): say it inside a phrase in the game («Жёлтый цвет — буква Ж»).
