// MacroFit Pro — Service Worker Auditado para GitHub Pages (v2.6)
const CACHE_NAME = 'macrofit-pro-cache-v26';
const LOCAL_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg'
];
const EXTERNAL_ASSETS = [
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/lucide@latest'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Cachear archivos locales propios del repositorio
      await Promise.allSettled(
        LOCAL_ASSETS.map((url) => cache.add(url))
      );
      // Cachear CDNs externos con no-cors para no abortar la instalación si hay redirecciones
      await Promise.allSettled(
        EXTERNAL_ASSETS.map(async (url) => {
          const req = new Request(url, { mode: 'no-cors' });
          const res = await fetch(req);
          return cache.put(req, res);
        })
      );
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      }).catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});
