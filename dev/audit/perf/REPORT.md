# Говорилки — performance and technical-health audit (read-only), 2026-11-18, v167

Measured on the built site served at http://localhost:8781/govorilki/ (python http.server, no compression) and on
https://govorilki.com/play/ru/ (Cloudflare Pages, brotli). Tools: Lighthouse 12.8.2 (mobile, simulated throttling),
Playwright + CDP (Pixel 5 emulation, invented family Тина/Тоша from dev/tests/smoke.js). Scripts and raw data:
/tmp/claude-0/-home-user-govorilki/c1b0d3e7-ea18-5cf4-9cf9-63cd21a8f7a6/scratchpad/perf/ (measure.js, measure.json,
lh-local.json, lh-public.json, build.log). No project file was changed (git status clean after the build into a scratch SITE).

## Findings, ranked by severity

### 1. HIGH — The page is one 3.3 MB HTML file; first paint on a phone is ~6.7 s
- ru/index.html: 3,317,576 B raw, 972,593 B gzip, 995,681 B brotli as served. index.html (en) 2,759,916 B / 841,517 B gzip.
  Source dev/game/govorilki.html: 29,011 lines, 5.19 MB, 3.64 MB JS in 2 <script> blocks + 357 KB CSS, inline, unminified.
- Lighthouse mobile, public page: performance 61, FCP 6.7 s, LCP 6.7 s (main#stage > div.lp > header.lp-hero > p.lp-tag),
  Speed Index 6.7 s, TTI 6.7 s, TBT 0 ms, CLS 0, bootup 0.8 s, main-thread 3.7 s (Other 1.37 s, Style & Layout 0.77 s,
  Rendering 0.50 s, Script eval 0.40 s, parse/compile 0.39 s), DOM 908 nodes, unused JS est. 419 KiB, unused CSS 100 KiB,
  unminified JS 89 KiB; longest task 451 ms at 6.2 s. Accessibility 100, best-practices 100 (no failing audits), SEO 66
  (only is-crawlable: /play/* gets X-Robots-Tag: noindex from www/build.py:214-216 on purpose).
- Lighthouse mobile, local page (no compression — an artifact of python http.server): performance 54, FCP 18.2 s, LCP 20.2 s,
  SI 18.2 s, TBT 100 ms, CLS 0.014, text-compression savings 2,577 KiB. Only the public numbers matter.
- Nothing paints before ~1 MB has arrived and 3.6 MB JS is parsed: no splash/skeleton, no preload. Cheap wins: minify in
  dev/build/build.py (~100 KiB brotli), put the first screen's markup + critical CSS before the big script, move the giant
  data lines (638,782 chars at govorilki.html:9897, 116,271 at :17039, 91,353 at :9979) into packs like the stories.

### 2. HIGH — The voice costs ~77 MB on first play (~61 s at 10 Mbit/s) and the model is hot-linked from Hugging Face
- Runtime self-hosted in engine/piper/ (32,596,921 B; engine/piper/README.txt): onnxruntime-web 1.27.0
  (ort-wasm-simd-threaded.wasm 13,479,978 B → 3.44 MB gzip), piper-tts-web 1.0.5, piper-wasm phonemizer
  (piper_phonemize.data 18,077,249 B → 8.99 MB gzip, .wasm 635,212 B). ≈ 13.3 MB over the wire. Loaded from
  SITE_ROOT + 'engine/piper/' (govorilki.html:11600-11601, 11718, 11776); served max-age=0, must-revalidate, cf-cache-status
  DYNAMIC (not edge-cached).
- Model ru_RU-ruslan-medium.onnx: 63,201,294 B (HEAD → 302 → us.aws.cdn.hf.co, x-linked-size 63201294, uncompressed) +
  .onnx.json 4,882 B from https://huggingface.co/diffusionstudio/piper-voices/resolve/main/… (HF_BASE in
  engine/piper/piper-tts-web.js; config fetch govorilki.html:11626). Model kept in OPFS (:11625, :11822-11823), runtime in the
  govorilki-voice Cache (sw.js:35-39).
- First-play wait at 10 Mbit/s: 13.3 + 63.2 ≈ 76.5 MB ≈ 61 s plus WASM/ONNX init (in-app note «60 МБ, один раз», :11773).
  Download starts at the first pointerdown (:11818).
- Fallback is correct: say() uses Piper only when PIPER.isReady (:4121); otherwise the phone's speechSynthesis (:4131-4135,
  :4089-4090); failed load retried at a touch after 30 s (piperOn, :11743); a phrase not ready in 40 s goes to the phone's voice
  (:11808). Voices (:11593): Ирина, Денис, Дмитрий, Руслан (default :11737).
- Risks: third-party availability and privacy (HF sees every family's first download, contrary to the README's "no third
  party" intent), signed CDN redirects, no md5 check against voices_static-D_OtJDHM.js. Self-hosting the 63 MB model (or a
  smaller «low» model) removes the dependency.

### 3. MEDIUM — The service worker downloads all five language pages for every visitor and re-downloads everything on each release
- sw.js:5-8 SHELL = ./, ./index.html, ./ru/, ./pt/, ./de/, ./en/ + icons; install addAll(SHELL): a Russian family downloads
  14,559,488 B raw (≈ 4.37 MB brotli) of pages instead of ~1 MB.
- activate (sw.js:12-15) deletes every cache except govorilki-v167 and govorilki-voice: each release (167 so far) refetches
  all packs, fonts, images, music.
- Strategy: navigations network-first, 4 s race to headers, cached page as fallback (sw.js:46-55); all other same-origin GETs
  cache-first with background refresh incl. opaque (sw.js:57-62); /tales/audio/ bypassed (:32, :44); packs pre-kept on
  postMessage({keep}) (sw.js:19-25, from PACK.warm govorilki.html:3812-3823).
- Cache after one full ru visit: shell 14.56 MB + 17 ru packs 2.13 MB + fonts ~0.17 MB (0.30 MB all) + museum JSON 1.72 MB
  (art/tours-ru.json alone 1,354,937 B, fetched on opening the museum, :15779) ≈ 18.6 MB. Ceiling of the runtime cache
  (same-origin minus tales/engine/piper): 74.7 MB (img 15.7, music 28.1, art 4.1, stockfish wasm 7.3 — engine/stockfish-* is
  not excluded like engine/piper/). Plus govorilki-voice: 32.6 MB engine + one WAV per phrase ever spoken (:11805-11809,
  never trimmed; PIPER.mem caps 80 in memory only, :11811), plus 63 MB model in OPFS. Observed: 32 entries after 6 screens.
- Stale pages: low risk (HTML max-age=0 must-revalidate; SW network-first; cached page only offline or >4 s to headers).
  skipWaiting + clients.claim (sw.js:9, 15) switch workers mid-session; packs are hash-named so old pages still get one.
  www/build.py:214 writes "/play/sw.js Cache-Control: no-cache" but the live header is max-age=14400 — the _headers rule
  is not effective (browsers bypass HTTP cache for the SW script anyway).
- iOS: Safari evicts Cache Storage/OPFS of a site unused for 7 days unless installed; the ~110 MB voice+engine+packs come back
  as a fresh download after a pause. No navigator.storage.persist() anywhere (0 hits).

### 4. MEDIUM — Detached DOM grows across screens (likely leak)
- CDP Performance.getMetrics after forced GC: JS heap 6.1 MB home → 6.2 stories (screenLearn('space')) → 6.4 journey →
  6.7 maths → 6.8 chess → 9.0 MB museum. Nodes 892 → 2,138 → 3,197 → 4,805 → 6,578 → 8,136 while attached DOM stayed
  487-504 elements; JSEventListeners 93 → 360; Documents 2 → 3 (an iframe left by the museum). Each screen leaves
  ~1,200-1,700 nodes and ~60 listeners reachable after goHome().
- Likely holders: 775 .onclick = and 127 addEventListener vs 9 removeEventListener; 7 setInterval / 10 clearInterval,
  91 setTimeout / 25 clearTimeout, 26 requestAnimationFrame / 2 cancel; module state ART, PIPER.wait, timers (:7249),
  FT (:27473), top-level interval :25271. A heap snapshot would name the retainers; a 40-screen session ≈ 50k detached nodes.

### 5. MEDIUM — art/tours-ru.json (1.35 MB) and sayru.json (0.4 MB) are oversized for what they gate; museum hot-links Wikimedia
- Home: 10 requests / 3,884,034 B raw locally; public 15 requests, 1,297,405 B transferred, 3,955,642 B decoded. Top on home
  (raw): ru/ 3,317,791; data/ru/sayru.json 399,559 (108,190 brotli, at 482 ms, before the first screen); fonts nunito-latin
  39,318, balsamiq-sans-latin 32,126 + 28,964, nunito-cyrillic 20,966, balsamiq-sans-cyrillic 19,124 + 18,650; fonts.css 6,878;
  inline SVG 658; icons/icon-192.png 20,161; public also cloudflareinsights.com/beacon.min.js 10,478 + /cdn-cgi/rum 377
  (a third-party analytics beacon on a children's app).
- Packs: only sayru.json loads on home (nothing is spoken yet). The other 16 ru packs (st1-12, HOLT, COMIC_EPS, COMIC_ME,
  GLOBE_GEO; 2,134,485 B total) are lazy via PACK.get (govorilki.html:3797-3803) and pre-kept by the SW 4 s after load
  (:3812-3823); the page made no further pack requests in 9 s idle, the SW kept all 17.
- Museum fetches art/notes-ru.json 77,437 + art/tours-ru.json 1,354,937 + art/art-ru.json 237,079 B (:15776-15784) before
  showing anything, and thumbnails come from https://commons.wikimedia.org/wiki/Special:FilePath/… (artImg :15790, 10 uses) —
  the CLAUDE.md rule «never hot-link Wikimedia» and the 429 problem apply; the first painting request was blocked in my run.

### 6. LOW — A few names reach innerHTML unescaped
- esc() (:3835) used 863 times; ${esc(P.settings.name)} ×5. Raw: opp.name at govorilki.html:9206, 9247, 9311, 9312 (family
  chess; opp = who(g.opp) :9204, who :8728 returns KID/GRAND/KNOWN_KIDS, names typed by the family and synced) and KID.name
  :9129. Inbound relay names are cleaned (cleanS(m.n, 16), :13072). Impact: self-XSS within one family; fix: esc() at five places.
- No eval / new Function, no inline onclick= in templates (4 onerror= on images), 481 innerHTML =, 87 insertAdjacentHTML,
  10 outerHTML =.

### 7. LOW — Release checks are thin and there is no CI on branches
- dev/tests/: 83 test files (78 Playwright, 7,037 lines), fixtures tests/fixtures/wikt/. At release only tests/smoke.js
  runs, phone + laptop (dev/build/release_check.sh:23-25). tests/perf.js exists but is not run. publish.sh runs no test,
  git add -A commits whatever is in the tree (publish.sh:13), waits ≤5 min for live sw.js.
- .github/workflows/site.yml: push to main only, builds www/ and deploys; no tests, nothing on branches/PRs. cloud.yml: deploy
  only. Child branches are checked only locally.
- Build: cd dev && time SITE=<scratch> ./build/build_all.sh → 30.3 s real (24.0 user, 12.9 sys); «ru packs: 1615 stories →
  12 files, 17 files 2.13 MB … en/pt/de missing 8 in 3 groups». Fragile: (a) npm ci on a fresh clone (network); (b) build.py
  needs $SITE/sw.js for the version; (c) the translation gate is a string match on «missing 8 in 3 groups»
  (release_check.sh:19-20); (d) --voice needs .venv-racc, up to 25 min; (e) fixed port 8781 + pkill; (f) built pages are
  committed, 14.6 MB generated HTML per release, every merge touches the same files.

### 8. INFO — localStorage is small and bounded, except the drawings
- After seeding + six screens: govorilki-v2 1,871 chars, govorilki-ev 1,729 (48 entries ≈ 36 B each), govorilki-lang 2.
  profiles 1,615 B for two children (settings 135, today 100, doorsToday 54-61, moto 58, kproj 55, book 22, museum 22 …).
- Per day: journal govorilki-ev (EVT, govorilki.html:5155-5193) — one entry per open/close, page open/close, game, step,
  story, error; write() drops entries older than KEEP = 90 days and beyond MAX = 20000 (:5166, 5178-5181). ~90 entries ≈
  3.3 KB/day → ≈ 300 KB after 90 days; hard cap ≈ 720 KB; never synced. P.days[date] (:3988-3989, 4961) ~35 B/day per
  child, never trimmed → ~13 KB/child/year. P.reads slice(-60) (:7315), P.frozen slice(-30) (:11297), comic hist slice(-60)
  (:17676), cheers slice(-30) (:9074, 9121, 19080), ownSave slice(-30) (:17421).
- Drawings P.art (saveArt :6780-6784): ≤12 JPEG data URLs per child (toDataURL('image/jpeg', .75), :6973), inside
  govorilki-v2, rewritten on every save(); pops drawings on quota error. 3 children × 12 can be 1-2 MB of the 5 MB quota.
  Cloud copy strips art and any data: string > 1,500 chars (clProf :28098).
- One year of daily play, 3 children: govorilki-v2 ≈ 60 KB without drawings, up to ~2 MB with; govorilki-ev ≤ 720 KB;
  total under the 5 MB quota. Piper WAVs live in Cache Storage, not localStorage.

### 9. INFO — Code structure
- 602 top-level function declarations, 794 top-level const/let/var (740/45/9; 462 UPPER_CASE tables), 212 IIFE modules,
  68 /* NAME-BEGIN */ markers, 220 empty catch (e) {}, 0 console.*, 0 TODO; 16 lines > 2,000 chars, 129 > 500.
- typeof CONST guards (TDZ trap): 7 (DRAWN ×2, LEARN ×2, SAY_MISS, KNOWN_KIDS, GPLAY); typeof X === 'undefined' ×3
  (KNOWN_KIDS, P, GPLAY).
- Timers: setInterval at :7249, 8406, 8411, 8493, 12188, 25271, 27473 (:8406 and :12188 clear themselves, :7249 goes to a
  timers list, :25271 is a top-level interval by design, :27473 keeps FT); 91 setTimeout vs 25 clearTimeout, 26 rAF vs 2 cancel.

## What is healthy
- Interaction quality once loaded: TBT 0 ms, CLS 0, max potential FID 60 ms, server response 200 ms, RTT 60 ms;
  accessibility and best-practices 100 with no failing audits.
- Compression and caching headers right where they matter: HTML and packs max-age=0, must-revalidate with brotli; packs
  content-hashed (?h=); fonts self-hosted, subsetted, woff2.
- Data packs work as designed: 1,615 Russian stories in 17 files (2.13 MB) load only when needed, the SW keeps them after
  one visit, a failed pack is retried once (PACK.story :3807-3811).
- The voice path degrades gracefully: phone voice while Piper loads or fails, 30 s retry, 40 s per-phrase timeout, download
  only after a touch, per-phrase cache; the runtime is self-hosted with licences listed.
- Journal and progress data are bounded (90 days / 20,000 entries), anonymous, never leave the phone without the parents'
  tick; drawings are stripped from the cloud copy.
- No eval/new Function, no inline handler attributes, esc() used consistently (863 uses) except the five chess lines.
- Build is fast (30 s, four languages), deterministic, leaves the tree clean; the translation gate catches new strings;
  the smoke test covers four languages on phone and laptop.
- JS heap is small (6-9 MB) for a 3.6 MB script; only the detached-node trend needs attention.
