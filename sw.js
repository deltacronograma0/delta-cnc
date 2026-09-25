const CACHE_NAME = 'delta-cnc-v6';
const APP_SHELL = [
  './',
  './index.html',
  './styles.css?v=20260925-menu6',
  './app.js?v=20260925-menu6',
  './logo.png',
  './manifest.webmanifest'
];

const NETWORK_FIRST_PATHS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './sw.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const requestPath = new URL(event.request.url).pathname;
  const isNetworkFirst = NETWORK_FIRST_PATHS.some(path => {
    const fileName = path.replace('./', '');
    return fileName ? requestPath.endsWith(fileName) : requestPath.endsWith('/');
  });

  event.respondWith(
    (isNetworkFirst
      ? fetch(event.request).then((networkResponse) => {
        const responseClone = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
        return networkResponse;
      }).catch(() => caches.match(event.request).then(response => response || caches.match('./index.html')))
      : caches.match(event.request).then((cachedResponse) => cachedResponse || fetch(event.request).then((networkResponse) => {
        const responseClone = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
        return networkResponse;
      }).catch(() => caches.match('./index.html'))))
  );
});
