The voice engine of Govorilki (Piper text-to-speech in the browser), served from this site instead of a CDN so that no
third party sees the players' addresses. Unchanged copies of these npm packages (MIT licence each):
  onnxruntime-web 1.27.0 (Microsoft)     ort.wasm.min.mjs, ort-wasm-simd-threaded.mjs, ort-wasm-simd-threaded.wasm
                                         https://github.com/microsoft/onnxruntime
  @mintplex-labs/piper-tts-web 1.0.5     piper-tts-web.js (its import of "onnxruntime-web/wasm" points to ./ort.wasm.min.mjs),
                                         piper-o91UDS6e.js, voices_static-D_OtJDHM.js   https://github.com/Mintplex-Labs/piper-tts-web
  @diffusionstudio/piper-wasm 1.0.0      piper_phonemize.wasm, piper_phonemize.data (piper-phonemize with espeak-ng data;
                                         espeak-ng is GPL-3.0: https://github.com/espeak-ng/espeak-ng,
                                         https://github.com/rhasspy/piper-phonemize, https://github.com/diffusion-studio/piper-wasm)
