const CACHE_NAME = 'scrubbys-invoice-v24';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './lib/jspdf.umd.min.js',
  './lib/qrcode.min.js',
  './assets/logo.png',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  // Network-first for the app page itself, so the newest version always loads when online.
  if (req.mode === 'navigate' || req.destination === 'document') {
    event.respondWith(
      fetch(req).then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((c) => c.put(req, copy));
        return response;
      }).catch(() => caches.match(req).then((c) => c || caches.match('./index.html')))
    );
    return;
  }
  // Cache-first for static assets (libraries, icons) for speed.
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req).then((response) => {
      const copy = response.clone();
      caches.open(CACHE_NAME).then((c) => c.put(req, copy));
      return response;
    }).catch(() => cached))
  );
});
