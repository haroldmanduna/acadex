// ACADEX Service Worker v13 — Complete Offline Pre-caching for 88 ZIMSEC Papers & Solver
const CACHE = 'acadex-v13-all-papers';

const ASSETS = [
  './',
  './index.html',
  './zimsec-super-tutor.html',
  './acadex-app.js',
  './acadex-data.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './data/acadex-maths.json'
];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(cache => {
      console.log('[ACADEX SW] Pre-caching all 88 ZIMSEC papers and offline solver...');
      return cache.addAll(ASSETS).catch(err => {
        console.warn('[ACADEX SW] Pre-cache partial:', err);
      });
    })
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(k => k !== CACHE).map(k => {
          console.log('[ACADEX SW] Removing old cache:', k);
          return caches.delete(k);
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('periodicsync', e => {
  if (e.tag === 'acadex-awake') {
    e.waitUntil(fetch('https://acadex-r6z0.onrender.com/awake', { cache: 'no-store' }).catch(() => {}));
  }
});

self.addEventListener('fetch', e => {
  const url = e.request.url;
  const isCode = url.includes('.html') || url.includes('.js') || url.includes('acadex-data') || url.includes('.json');

  if (isCode) {
    // Network first, fall back to cache when offline
    e.respondWith(
      fetch(e.request)
        .then(resp => {
          if (resp && resp.status === 200) {
            const clone = resp.clone();
            caches.open(CACHE).then(c => c.put(e.request, clone));
          }
          return resp;
        })
        .catch(() => caches.match(e.request).then(cached => cached || caches.match('./index.html')))
    );
    return;
  }

  // Cache first for media, PDFs and static icons
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(resp => {
        if (resp && resp.status === 200 && (url.includes('audio/') || url.includes('/pdfs/') || url.includes('.pdf') || url.includes('.png'))) {
          const clone = resp.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return resp;
      }).catch(() => cached);
    })
  );
});
