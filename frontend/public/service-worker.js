importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js');

// VERSION - change this to force cache update
const CACHE_VERSION = '2025-01-08-v2';

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Install-time precache for important app shell resources
self.addEventListener('install', (event) => {
  const precacheUrls = [
    '/',
    '/index.html',
    '/manifest.json',
    '/favicon.ico',
    '/favicon.svg',
    '/static/js/bundle.js',
    '/static/js/main.js',
    '/static/css/main.css'
  ];
  
  const cacheName = `balance-tracker-precache-${CACHE_VERSION}`;
  
  event.waitUntil((async () => {
    try {
      const cache = await caches.open(cacheName);
      await Promise.all(precacheUrls.map(async (url) => {
        try {
          const resp = await fetch(url, { cache: 'no-store' });
          if (resp && resp.ok) await cache.put(url, resp.clone());
        } catch (err) {
          // ignore individual failures
          console.warn('Precache failed for', url, err);
        }
      }));
      // ensure new SW activates immediately for testing
      self.skipWaiting();
    } catch (err) {
      console.warn('Precache install failed', err);
    }
  })());
});

if (workbox) {
  workbox.core.setCacheNameDetails({ prefix: 'balance-tracker' });

  workbox.precaching.precacheAndRoute(self.__WB_MANIFEST || []);

  // Runtime caching for API GET requests
  workbox.routing.registerRoute(
    ({ url }) => url.pathname.startsWith('/api/') && url.search === '',
    new workbox.strategies.NetworkFirst({
      cacheName: 'api-runtime-cache',
      plugins: [
        new workbox.expiration.ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 24 * 60 * 60 }),
      ],
    }),
  );

  // Cache images and fonts
  workbox.routing.registerRoute(
    ({ request }) => request.destination === 'image' || request.destination === 'font',
    new workbox.strategies.CacheFirst({
      cacheName: 'assets-cache',
      plugins: [new workbox.expiration.ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 7 * 24 * 60 * 60 })],
    }),
  );

  // Cache navigation requests (HTML) - NetworkFirst with cache fallback to index.html
  const navigationHandler = async (args) => {
    const networkFirst = new workbox.strategies.NetworkFirst({
      cacheName: 'pages-cache',
      plugins: [new workbox.expiration.ExpirationPlugin({ maxEntries: 50 })],
    });

    try {
      // Try network first
      const response = await networkFirst.handle(args);
      if (response) return response;
    } catch (err) {
      // fall through to cache fallback
      console.warn('NetworkFirst failed for navigation, falling back to cache', err);
    }

    // Fallback: return precached index.html or cached '/' if available
    const cache = await caches.open(workbox.core.cacheNames.precache);
    const precachedIndex = await cache.match('/index.html') || await cache.match('/');
    if (precachedIndex) return precachedIndex;

    // As ultimate fallback, try any cached page from pages-cache
    const pagesCache = await caches.open('balance-tracker-pages-cache');
    const keys = await pagesCache.keys();
    if (keys.length > 0) {
      return pagesCache.match(keys[0]);
    }

    return Response.error();
  };

  workbox.routing.registerRoute(({ request }) => request.mode === 'navigate', navigationHandler);

  // Cache JS/CSS/static resources - StaleWhileRevalidate
  workbox.routing.registerRoute(
    ({ request }) => ['script', 'style'].includes(request.destination),
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: 'static-resources',
      plugins: [new workbox.expiration.ExpirationPlugin({ maxEntries: 100 })],
    })
  );

  // Fallback to network for other requests
  self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;
    // Let Workbox handle GET requests
  });
  // Background sync: when the SW receives a sync event, notify clients to flush pending messages
  self.addEventListener('sync', (event) => {
    if (event.tag === 'bt-flush-pending') {
      event.waitUntil((async () => {
        try {
          const allClients = await self.clients.matchAll({ includeUncontrolled: true });
          for (const client of allClients) {
            client.postMessage({ type: 'bt:sys-sync' });
          }
        } catch (err) {
          console.warn('ServiceWorker sync handler failed to notify clients', err);
        }
      })());
    }
  });
} else {
  // Fallback minimal SW
  self.addEventListener('fetch', function(event) {
    event.respondWith(fetch(event.request));
  });
}
