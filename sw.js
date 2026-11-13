// Offline cache. The page comes from the network first, so an update shows up as soon as the app is opened;
// without a connection the saved copy opens. One worker serves the languages: / (English), /ru/, /pt/ and /en/, each
// page kept under its own address. Icons and fonts come from the cache and refresh in the background.
const CACHE = 'govorilki-v157';
const SHELL = ['./', './index.html', './manifest.webmanifest', './ru/', './pt/', './de/', './en/', './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE && k !== 'govorilki-voice').map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// the page names its data packs (data/<lang>/*.json, fetched when a screen opens): keep them all now, so every screen
// works offline after one visit
self.addEventListener('message', e => {
  const keep = e.data && Array.isArray(e.data.keep) ? e.data.keep.filter(u => typeof u === 'string' && new URL(u).origin === location.origin) : [];
  if (!keep.length) return;
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(keep.map(u => c.match(u).then(hit => hit || c.add(u).catch(() => {}))))));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // recordings of the tales: straight to the network (Range requests; iOS media breaks when a SW answers them)
  if (url.pathname.includes('/tales/audio/') && !url.pathname.endsWith('.json')) return;
  // the voice's program (Piper, ONNX runtime) from the CDN: kept once, never fetched again for each phrase
  if (/^https:\/\/cdn\.jsdelivr\.net\/npm\/(@mintplex-labs\/piper-tts-web|onnxruntime-web)@/.test(req.url)) {
    e.respondWith(caches.open('govorilki-voice').then(async c => (await c.match(req)) || fetch(req).then(res => { if (res && res.ok) c.put(req, res.clone()); return res; })));
    return;
  }
  const font = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (url.origin !== location.origin && !font) return;
  // the actors' recordings of the audio tales (some MB each, played with Range requests): straight from the network / the browser's own cache
  if (url.pathname.includes('/tales/audio/') && !url.pathname.endsWith('.json')) return;
  if (req.mode === 'navigate' || url.pathname.endsWith('/index.html')) {
    e.respondWith((async () => {
      const c = await caches.open(CACHE), page = url.pathname.replace(/index\.html$/, '');
      try {
        const res = await Promise.race([fetch(req, { cache: 'no-cache' }), new Promise((_, no) => setTimeout(() => no(new Error('slow')), 4000))]);
        if (res && res.ok) c.put(page, res.clone());
        return res;
      } catch (err) {
        return (await c.match(page)) || (await c.match(page + 'index.html')) || (await c.match('./')) || Response.error();
      }
    })());
    return;
  }
  const fresh = caches.open(CACHE).then(c => fetch(req).then(res => {
    if (res && (res.ok || res.type === 'opaque')) c.put(req, res.clone());
    return res;
  }));
  e.waitUntil(fresh.catch(() => {}));
  e.respondWith(caches.match(req).then(hit => hit || fresh));
});
