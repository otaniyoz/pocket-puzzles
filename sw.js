const CACHE_NAME = 'pocket-puzzles-sw-v4.2';
const cacheFiles = ['/pocket-puzzles/', '/pocket-puzzles/style.css', '/pocket-puzzles/favicon.png', '/pocket-puzzles/script.js', '/pocket-puzzles/fonts/Oswald-Medium.woff2', '/pocket-puzzles/patterns/0.svg', '/pocket-puzzles/patterns/1.svg', '/pocket-puzzles/patterns/2.svg', '/pocket-puzzles/patterns/3.svg', '/pocket-puzzles/patterns/4.svg', '/pocket-puzzles/patterns/5.svg', '/pocket-puzzles/patterns/6.svg', '/pocket-puzzles/patterns/7.svg', '/pocket-puzzles/patterns/8.svg', '/pocket-puzzles/patterns/9.svg', '/pocket-puzzles/patterns/10.svg', '/pocket-puzzles/patterns/11.svg', '/pocket-puzzles/patterns/12.svg', '/pocket-puzzles/patterns/13.svg', '/pocket-puzzles/patterns/14.svg', '/pocket-puzzles/patterns/15.svg', '/pocket-puzzles/patterns/16.svg', '/pocket-puzzles/patterns/17.svg', '/pocket-puzzles/patterns/18.svg', '/pocket-puzzles/patterns/19.svg', '/pocket-puzzles/patterns/20.svg', '/pocket-puzzles/patterns/21.svg', '/pocket-puzzles/patterns/22.svg', '/pocket-puzzles/patterns/23.svg', '/pocket-puzzles/patterns/24.svg', '/pocket-puzzles/patterns/25.svg', '/pocket-puzzles/patterns/26.svg', '/pocket-puzzles/patterns/27.svg', '/pocket-puzzles/patterns/28.svg', '/pocket-puzzles/patterns/29.svg', '/pocket-puzzles/patterns/30.svg', '/pocket-puzzles/patterns/31.svg', '/pocket-puzzles/patterns/32.svg', '/pocket-puzzles/patterns/33.svg', '/pocket-puzzles/patterns/34.svg', '/pocket-puzzles/patterns/35.svg', '/pocket-puzzles/patterns/36.svg', '/pocket-puzzles/patterns/37.svg', '/pocket-puzzles/patterns/38.svg', '/pocket-puzzles/patterns/39.svg', '/pocket-puzzles/patterns/40.svg', '/pocket-puzzles/patterns/41.svg', '/pocket-puzzles/patterns/42.svg', '/pocket-puzzles/sounds/0.mp3', '/pocket-puzzles/sounds/1.mp3', '/pocket-puzzles/sounds/2.mp3'];

self.addEventListener('install', (event) => {
  if (self.skipWaiting) { self.skipWaiting(); }

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(cacheFiles);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((cacheName) => {
          return cacheName !== CACHE_NAME;
        }).map((cacheName) => {
          return caches.delete(cacheName);
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});