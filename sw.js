// Offline cache: the game opens from the cache at once and refreshes itself in the background.
const CACHE = 'govorilki-v6';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const font = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (url.origin !== location.origin && !font) return;
  const key = req.mode === 'navigate' ? './' : req;
  const fresh = caches.open(CACHE).then(c => fetch(req).then(res => {
    if (res && (res.ok || res.type === 'opaque')) c.put(key, res.clone());
    return res;
  }));
  e.waitUntil(fresh.catch(() => {}));
  e.respondWith(caches.match(key).then(hit => hit || fresh));
});
