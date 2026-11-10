// PumpScope service worker: keeps the app shell available offline.
// Market data is never cached here; only this site's own files are.
const CACHE = 'pumpscope-v2';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // Exchange, CoinGecko, DexScreener and news requests are cross-origin: leave them alone.
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return;
  // Network first so a new version of the app arrives as soon as you are online; cache is the offline fallback.
  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
        return res;
      })
      .catch(() => caches.match(e.request).then(m => m || caches.match('index.html')))
  );
});
