The app's own voices of Govorilki, served from this site so that no third party sees the players' addresses.
Each is a Piper model (rhasspy/piper-voices, copied from https://huggingface.co/diffusionstudio/piper-voices) of
63 201 294 bytes. Cloudflare Pages takes files up to 25 MB, so each model is cut into three equal parts (split -n 3);
the game joins them in the browser and checks each part against voices.json (sha-256). The engine still asks for the
Hugging Face address; the game's own fetch answers it from here (a voice not listed in voices.json still comes from there).
All models: training piper (MIT), finetuned from the U.S. English lessac voice.

- ru_RU-ruslan-medium («Руслан», the default in Russian): md5 731eb188e63b4c57320e38047ba2d850.
  Dataset RUSLAN corpus, https://ruslan-corpus.github.io/, licence CC BY-NC-SA 4.0
  (https://creativecommons.org/licenses/by-nc-sa/4.0/).
- pt_PT-tugão-medium (Tugão, the default in Portuguese; files named pt_PT-tugao-medium.*): md5 0642048511ffe36c3b519520614b53f4.
  Dataset https://github.com/NabuCasa/voice-datasets, licence CC0 (public domain).
- de_DE-thorsten-medium (Thorsten, the default in German): md5 a129b00fb3078df43c96bab6c94535c0.
  Dataset Thorsten-Voice, https://github.com/thorstenMueller/Thorsten-Voice, licence CC0 (public domain).
- en_GB-jenny_dioco-medium (Jenny, the default in English): md5 d08f2f7edf0c858275a7eca74ff2a9e4.
  Dataset https://github.com/dioco-group/jenny-tts-dataset: commercial use permitted, attribution required — the voice
  is called «Jenny (Dioco)» in the game's voice list.

The other voices in the list (Ирина, Денис, Дмитрий, Cori, Alba, Alan, Kerstin, Ramona, Eva) still come from Hugging Face
when a family picks one.
