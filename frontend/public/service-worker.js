self.addEventListener('install', (e) => {
  console.log('[Service Worker] Install');
});

self.addEventListener('fetch', function(event) {
  event.respondWith(fetch(event.request));
});
