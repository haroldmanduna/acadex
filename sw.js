// ACADEX Service Worker - Makes Acadex work offline after 1 WiFi load
const CACHE = 'acadex-v2';
const ASSETS = [
  './zimsec-super-tutor.html',
  './manifest.json',
  './audio/shona-solve.mp3',
  './audio/ndebele-solve.mp3',
  './audio/english-solve.mp3',
  './audio/venda-solve.mp3',
  './audio/tonga-solve.mp3',
  './audio/xhosa-solve.mp3',
  './pdfs/2024_Mathematics_Paper_1_4004_1.pdf',
  './pdfs/2023_Combined_Science_Paper_1_5006_1.pdf',
  './pdfs/2023_Biology_Paper_2_6030_2.pdf'
];
self.addEventListener('install', e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate', e=>e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e=>{
  e.respondWith(
    caches.match(e.request).then(cached=>{
      return cached || fetch(e.request).then(resp=>{
        // cache past papers + pdfs dynamically (Foondamate offline)
        if(e.request.url.includes('audio/') || e.request.url.includes('.html') || e.request.url.includes('/pdfs/') || e.request.url.includes('.pdf')){
          const clone=resp.clone();
          caches.open(CACHE).then(c=>c.put(e.request, clone));
        }
        return resp;
      }).catch(()=>cached)
    })
  );
});
