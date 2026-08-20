// ACADEX Service Worker v3 — Maths PWA
const CACHE = 'acadex-v4';
const ASSETS = [
  './zimsec-super-tutor.html',
  './acadex-app.js',
  './acadex-data.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './audio/shona-solve.mp3',
  './audio/ndebele-solve.mp3',
  './audio/english-solve.mp3',
  './pdfs/2024_November_4004_Paper1.pdf'
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => {
      return cached || fetch(e.request).then(resp => {
        if (e.request.url.includes('audio/') || e.request.url.includes('.js') || e.request.url.includes('.html') || e.request.url.includes('/pdfs/') || e.request.url.includes('.pdf')) {
          const clone = resp.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return resp;
      }).catch(() => cached);
    })
  );
});
